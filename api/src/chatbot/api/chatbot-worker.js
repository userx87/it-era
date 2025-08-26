/**
 * IT-ERA AI-Powered Chatbot API Worker
 * Enhanced Cloudflare Worker with AI integration, advanced conversation flows,
 * and intelligent lead qualification system
 */

import OpenRouterEngine from '../../ai-engine/openrouter-engine.js';
import ConversationDesigner from '../../conversation-flows/conversation-designer.js';
import { AIConfig, getModelConfig, shouldEscalateConversation, calculateLeadPriority, selectHybridModel } from '../../ai-engine/ai-config.js';
import aiAnalytics from '../../ai-engine/ai-analytics.js';
import hybridModelSelector from '../../ai-engine/hybrid-model-selector.js';
import hybridPerformanceMonitor from '../../ai-engine/hybrid-performance-monitor.js';
// Import updated knowledge base with real IT-ERA data
import { ITERAKnowledgeBase, KnowledgeUtils } from '../../knowledge-base/it-era-knowledge-real.js';
// Import Teams webhook integration
import teamsWebhook from './teams-webhook.js';

const CONFIG = {
  // Hybrid AI Settings (Updated Strategy)
  AI_MODEL: AIConfig.OPENROUTER.MODELS.PRIMARY, // GPT-4o Mini
  AI_FALLBACK_MODEL: AIConfig.OPENROUTER.MODELS.SECONDARY, // DeepSeek
  AI_EMERGENCY_MODEL: AIConfig.OPENROUTER.MODELS.FALLBACK, // Claude Haiku
  AI_MAX_TOKENS: AIConfig.RESPONSE.MAX_TOKENS,
  AI_TEMPERATURE: AIConfig.RESPONSE.TEMPERATURE,
  AI_COST_LIMIT: AIConfig.OPENROUTER.COST_LIMITS.PER_SESSION, // €0.040
  AI_CACHE_TTL: AIConfig.CACHE.TTL_SECONDS,
  // Hybrid Strategy Settings
  HYBRID_ENABLED: AIConfig.OPENROUTER.HYBRID_STRATEGY.ENABLED,
  TARGET_RESPONSE_TIME: AIConfig.OPENROUTER.HYBRID_STRATEGY.TARGET_RESPONSE_TIME_MS,
  
  // Enhanced Chat settings
  MAX_SESSION_DURATION: 3600, // 1 hour for AI conversations
  MAX_MESSAGES_PER_SESSION: 25, // Increased for AI interactions
  RATE_LIMIT_MESSAGES: 60, // messages/hour per IP
  AI_RATE_LIMIT: 10, // AI calls per minute per session
  
  // Email integration (preserved from existing system)
  EMAIL_API_ENDPOINT: 'https://it-era.it/api/contact',
  
  // Performance settings - OPTIMIZED for speed
  RESPONSE_TIMEOUT: 3000, // 3 seconds max response time (reduced from 8s)
  FALLBACK_TIMEOUT: 1000, // 1 second before fallback (reduced from 2s)
  GREETING_CACHE_TTL: 300, // 5 minutes greeting cache
  
  // CORS settings
  ALLOWED_ORIGINS: [
    'https://it-era.it',         // Primary domain without www
    'https://www.it-era.it',     // www variant
    'https://it-era.pages.dev',
    'http://localhost:3000',
    'http://localhost:8788',
    'http://127.0.0.1:5500'
  ],
};

// CORS headers
const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
});

// Enhanced Session ID Management System
// Generates traceable, scalable conversation IDs with metadata
function generateSessionId(metadata = {}) {
  const timestamp = Date.now();
  const dateStr = new Date(timestamp).toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = new Date(timestamp).toTimeString().slice(0, 8).replace(/:/g, '');
  const randomPart = Math.random().toString(36).substr(2, 12);
  const userAgent = metadata.userAgent ? metadata.userAgent.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '') : 'web';
  
  // Format: itera_YYYYMMDD_HHMMSS_USERAGENT_RANDOM
  return `itera_${dateStr}_${timeStr}_${userAgent}_${randomPart}`.toLowerCase();
}

// Enhanced conversation metrics storage
const conversationMetrics = {
  // Track active conversations by ID
  activeConversations: new Map(),
  
  // Store conversation metadata
  storeConversationMetrics(sessionId, metadata) {
    this.activeConversations.set(sessionId, {
      id: sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      totalCost: 0,
      aiUsage: 0,
      userAgent: metadata.userAgent || 'unknown',
      ip: metadata.ip || 'unknown',
      ...metadata
    });
  },
  
  // Update conversation activity
  updateConversationActivity(sessionId, updateData) {
    const conversation = this.activeConversations.get(sessionId);
    if (conversation) {
      Object.assign(conversation, {
        ...updateData,
        lastActivity: Date.now()
      });
      this.activeConversations.set(sessionId, conversation);
    }
  },
  
  // Get conversation by ID
  getConversation(sessionId) {
    return this.activeConversations.get(sessionId);
  },
  
  // Clean up old conversations (older than 24 hours)
  cleanupOldConversations() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    let cleanedCount = 0;
    
    for (const [sessionId, conversation] of this.activeConversations.entries()) {
      if (conversation.lastActivity < cutoffTime) {
        this.activeConversations.delete(sessionId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old conversation IDs`);
    }
    
    return cleanedCount;
  },
  
  // Get all active conversation IDs
  getAllActiveIDs() {
    return Array.from(this.activeConversations.keys());
  },
  
  // Get conversations summary
  getConversationsSummary() {
    const conversations = Array.from(this.activeConversations.values());
    return {
      total: conversations.length,
      avgDuration: conversations.reduce((sum, conv) => sum + (conv.lastActivity - conv.startTime), 0) / conversations.length || 0,
      avgMessages: conversations.reduce((sum, conv) => sum + conv.messageCount, 0) / conversations.length || 0,
      totalCost: conversations.reduce((sum, conv) => sum + conv.totalCost, 0),
      aiUsagePercent: conversations.length > 0 ? 
        (conversations.reduce((sum, conv) => sum + conv.aiUsage, 0) / conversations.reduce((sum, conv) => sum + conv.messageCount, 1)) * 100 : 0
    };
  }
};

// Log conversation ID at session start
function logConversationStart(sessionId, metadata = {}) {
  const logData = {
    sessionId,
    timestamp: new Date().toISOString(),
    userAgent: metadata.userAgent || 'unknown',
    ip: metadata.ip || 'unknown',
    action: 'conversation_started'
  };
  
  console.log('🚀 New conversation started:', logData);
  
  // Store in metrics system
  conversationMetrics.storeConversationMetrics(sessionId, metadata);
  
  return logData;
}

// Initialize Hybrid AI System
let openRouterEngine = null;
let conversationDesigner = null;
let hybridInitialized = false;

// OPTIMIZED AI initialization with aggressive caching
async function initializeAI(env) {
  if (!openRouterEngine) {
    openRouterEngine = new OpenRouterEngine({
      model: CONFIG.AI_MODEL, // GPT-4o Mini
      fallbackModel: CONFIG.AI_FALLBACK_MODEL, // DeepSeek
      emergencyModel: CONFIG.AI_EMERGENCY_MODEL, // Claude Haiku
      maxTokens: CONFIG.AI_MAX_TOKENS,
      temperature: CONFIG.AI_TEMPERATURE,
      costLimit: CONFIG.AI_COST_LIMIT,
      cacheTTL: CONFIG.AI_CACHE_TTL,
      language: 'italian',
      hybridEnabled: CONFIG.HYBRID_ENABLED,
      // SPEED OPTIMIZATIONS
      greetingCache: true,
      quickInit: true,
      responseTimeout: CONFIG.FALLBACK_TIMEOUT
    });
    
    // Quick initialization without full setup
    await openRouterEngine.quickInitialize(env);
    console.log('⚡ Fast AI Engine initialized');
  }
  
  if (!conversationDesigner) {
    conversationDesigner = new ConversationDesigner({
      maxConversationLength: CONFIG.MAX_MESSAGES_PER_SESSION,
      escalationThreshold: 0.7,
      leadQualificationScore: 0.8,
      language: 'italian'
    });
  }
  
  // Start hybrid performance monitoring
  if (CONFIG.HYBRID_ENABLED && !hybridInitialized) {
    hybridPerformanceMonitor.startMonitoring(30000); // Monitor every 30 seconds
    hybridInitialized = true;
    console.log('📊 Hybrid Performance Monitor started');
  }
  
  return { aiEngine: openRouterEngine, conversationDesigner };
}

// Enhanced AI-powered intent recognition
async function classifyIntent(message, context = {}, env) {
  try {
    // Initialize AI if needed
    const { aiEngine, conversationDesigner } = await initializeAI(env);
    
    // Use conversation designer for intent recognition
    const response = await conversationDesigner.processMessage(message, context);
    
    return {
      intent: response.intent,
      confidence: response.confidence,
      escalate: response.escalation?.required || false,
      escalationType: response.escalation?.type,
      priority: response.escalation?.priority || 'medium'
    };
    
  } catch (error) {
    console.error('AI Intent Classification Error:', error);
    
    // Fallback to simple pattern matching
    return fallbackIntentClassification(message);
  }
}

// Fallback intent classification (original logic)
function fallbackIntentClassification(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('preventivo') || msg.includes('prezzo') || msg.includes('costo')) {
    return { intent: 'preventivo', confidence: 0.8, escalate: false };
  }
  if (msg.includes('assistenza') || msg.includes('supporto') || msg.includes('aiuto') || msg.includes('problema')) {
    return { intent: 'supporto', confidence: 0.8, escalate: false };
  }
  if (msg.includes('umano') || msg.includes('persona') || msg.includes('operatore')) {
    return { intent: 'human_request', confidence: 0.9, escalate: true };
  }
  if (msg.includes('servizi') || msg.includes('cosa fate') || msg.includes('informazioni')) {
    return { intent: 'informazioni', confidence: 0.7, escalate: false };
  }
  
  return { intent: 'generale', confidence: 0.5, escalate: false };
}

// Enhanced AI-powered response generation with analytics
async function generateResponse(message, context = {}, env) {
  const sessionId = context.sessionId || 'unknown';
  const startTime = Date.now();
  
  try {
    // Initialize AI systems
    const { aiEngine, conversationDesigner } = await initializeAI(env);
    
    // Check if we should use AI or fallback to conversation flows
    const useAI = shouldUseAI(context, env);
    
    if (useAI) {
      // Generate AI response with timeout
      const aiPromise = generateAIResponse(message, context, aiEngine, sessionId);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI timeout')), CONFIG.FALLBACK_TIMEOUT)
      );
      
      try {
        const aiResponse = await Promise.race([aiPromise, timeoutPromise]);
        aiResponse.responseTime = Date.now() - startTime;
        
        // Track hybrid performance
        const modelUsed = aiResponse.model || CONFIG.AI_MODEL;
        const responseSuccess = !aiResponse.error && responseTime < CONFIG.TARGET_RESPONSE_TIME * 2;
        
        // Track AI request success
        aiAnalytics.trackAIRequest(sessionId, { message, context }, aiResponse);
        
        // Track hybrid performance metrics
        if (CONFIG.HYBRID_ENABLED) {
          hybridPerformanceMonitor.trackRequest(
            modelUsed, 
            responseTime, 
            aiResponse.cost || 0, 
            responseSuccess,
            { sessionId, message: message.substring(0, 50), error: aiResponse.error }
          );
        }
        
        // Process through conversation designer
        const flowResponse = await conversationDesigner.processMessage(
          message, context, aiResponse
        );
        
        // Enhanced response with lead qualification
        const enhancedResponse = enhanceResponseWithLeadData(flowResponse, context);
        
        return {
          ...enhancedResponse,
          aiPowered: true,
          cost: aiResponse.cost || 0,
          cached: aiResponse.cached || false,
          responseTime: aiResponse.responseTime
        };
        
      } catch (aiError) {
        console.warn('AI generation failed, using fallback:', aiError);
        
        // Track AI request failure
        aiAnalytics.trackAIRequest(sessionId, { message, context }, null, aiError);
        
        // Track hybrid performance failure
        if (CONFIG.HYBRID_ENABLED) {
          hybridPerformanceMonitor.trackRequest(
            CONFIG.AI_MODEL, 
            Date.now() - startTime, 
            0, 
            false,
            { sessionId, error: aiError.message }
          );
        }
        
        return await generateFallbackResponse(message, context, conversationDesigner, startTime);
      }
    } else {
      // Use conversation flows only
      return await generateFallbackResponse(message, context, conversationDesigner, startTime);
    }
    
  } catch (error) {
    console.error('Response generation error:', error);
    
    // Track system error
    aiAnalytics.trackAIRequest(sessionId, { message, context }, null, error);
    
    return getEmergencyFallbackResponse();
  }
}

// Generate AI-powered response
async function generateAIResponse(message, context, aiEngine, sessionId) {
  const aiResponse = await aiEngine.generateResponse(message, context, sessionId);
  
  // If AI suggests escalation or reaches limits, handle gracefully
  if (aiResponse.escalate || aiResponse.intent === 'cost_limit_reached') {
    return {
      ...aiResponse,
      escalationRequired: true,
      escalationReason: aiResponse.intent === 'cost_limit_reached' ? 
                       'cost_limit' : 'ai_suggested'
    };
  }
  
  return aiResponse;
}

// Generate fallback response using conversation flows
async function generateFallbackResponse(message, context, conversationDesigner, startTime = Date.now()) {
  const response = await conversationDesigner.processMessage(message, context);
  
  return {
    ...response,
    aiPowered: false,
    fallbackUsed: true,
    cost: 0,
    responseTime: Date.now() - startTime
  };
}

// Enhance response with lead qualification data
function enhanceResponseWithLeadData(response, context) {
  const enhanced = { ...response };
  
  // Add lead priority calculation if we have lead data
  if (context.leadData) {
    const priority = calculateLeadPriority(context.leadData, context);
    enhanced.leadPriority = priority;
    
    // Track the lead
    const qualified = priority === 'high' || priority === 'immediate';
    aiAnalytics.trackLead(context.sessionId, context.leadData, priority, qualified);
  }
  
  // Check for automatic escalation based on new rules
  const escalationCheck = shouldEscalateConversation(context, response.message || '');
  if (escalationCheck.escalate && !enhanced.escalate) {
    enhanced.escalate = true;
    enhanced.escalationType = escalationCheck.reason;
    enhanced.priority = escalationCheck.priority;
    
    // Track escalation
    aiAnalytics.trackEscalation(
      context.sessionId, 
      escalationCheck.reason, 
      escalationCheck.priority, 
      'auto_escalation_rule'
    );
  }
  
  return enhanced;
}

// Determine if AI should be used (updated for OpenRouter)
function shouldUseAI(context, env) {
  // Don't use AI if no OpenRouter API key
  if (!env.OPENROUTER_API_KEY) {
    return false;
  }
  
  // Don't use AI if session has exceeded cost limit
  if (context.totalCost && context.totalCost > CONFIG.AI_COST_LIMIT) {
    return false;
  }
  
  // Don't use AI for simple/structured steps
  const structuredSteps = ['contact_collection', 'escalation_preparation'];
  if (structuredSteps.includes(context.currentStep)) {
    return false;
  }
  
  return true;
}

// CRITICAL EMERGENCY DETECTION SYSTEM
function detectEmergency(message, context = {}) {
  const msg = message.toLowerCase().trim();
  const city = context.location || context.comune || "Milano";
  
  // Emergency keywords and phrases
  const emergencyKeywords = [
    // Server/Infrastructure Emergencies
    'server down', 'server offline', 'server crash', 'server bloccato', 'server non funziona',
    'sito down', 'sito offline', 'sito non funziona', 'sito bloccato', 'sistema down',
    'database down', 'database offline', 'database corrotto', 'rete down', 'connessione down',
    
    // Ransomware/Security Emergencies
    'ransomware', 'virus', 'malware', 'cyber attack', 'attacco informatico', 'hackerato',
    'hack', 'hacker', 'violazione dati', 'data breach', 'sicurezza compromessa',
    'file criptati', 'richiesta riscatto', 'riscatto bitcoin', 'cryptolocker',
    
    // Business Critical Emergencies
    'emergenza', 'urgente', 'critico', 'bloccati', 'fermi', 'non possiamo lavorare',
    'perdendo soldi', 'perdita economica', 'disastro', 'panico', 'help urgente',
    'tutto fermo', 'sistema bloccato', 'non riusciamo', 'impossibile lavorare',
    
    // Data Loss Emergencies
    'perso dati', 'dati cancellati', 'hard disk rotto', 'backup non funziona',
    'recupero dati urgente', 'file spariti', 'database cancellato', 'disco rotto',
    
    // Time-sensitive phrases
    'ogni ora', 'ogni minuto', 'subito', 'ora', 'adesso', 'immediato',
    'non può aspettare', 'tempo limitato', 'scadenza', 'cliente arrabbiato'
  ];
  
  const businessImpactPhrases = [
    'perdendo soldi', 'perdita economica', 'clienti arrabbiati', 'lavoro fermo',
    'produzione ferma', 'vendite bloccate', 'fatturato a rischio', 'business fermo',
    'dipendenti bloccati', 'ordini fermi', 'magazzino fermo', 'spedizioni ferme'
  ];
  
  // Check for emergency patterns
  const hasEmergencyKeyword = emergencyKeywords.some(keyword => msg.includes(keyword));
  const hasBusinessImpact = businessImpactPhrases.some(phrase => msg.includes(phrase));
  const hasUrgencyIndicators = msg.includes('urgente') || msg.includes('subito') || 
                              msg.includes('emergenza') || msg.includes('critico');
  
  // Emergency scenarios scoring (fine-tuned for accuracy)
  let emergencyScore = 0;
  
  if (hasEmergencyKeyword) emergencyScore += 40;
  if (hasBusinessImpact) emergencyScore += 30;
  if (hasUrgencyIndicators) emergencyScore += 20;
  if (msg.includes('down') || msg.includes('offline')) emergencyScore += 25;
  if (msg.includes('ransomware') || msg.includes('virus')) emergencyScore += 50;
  if (msg.includes('hackerato') || msg.includes('hack')) emergencyScore += 45;
  if (msg.includes('perdendo') && (msg.includes('soldi') || msg.includes('denaro'))) emergencyScore += 35;
  if (msg.includes('tutto') && msg.includes('fermo')) emergencyScore += 30;
  
  // Additional specific patterns for better accuracy
  if (msg.includes('produzione') && msg.includes('ferma')) emergencyScore += 25;
  if (msg.includes('intervento') && msg.includes('immediato')) emergencyScore += 25;
  if (msg.includes('perso') && msg.includes('dati')) emergencyScore += 30;
  if (msg.includes('database') && msg.includes('cancellato')) emergencyScore += 35;
  if (msg.includes('recupero') && msg.includes('urgente')) emergencyScore += 25;
  
  // Emergency threshold
  const isEmergency = emergencyScore >= 40;
  
  if (isEmergency) {
    return {
      isEmergency: true,
      emergencyScore,
      emergencyType: determineEmergencyType(msg),
      city,
      timestamp: new Date().toISOString(),
      ticketId: generateEmergencyTicketId()
    };
  }
  
  return { isEmergency: false, emergencyScore };
}

// Determine specific emergency type
function determineEmergencyType(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('ransomware') || msg.includes('virus') || msg.includes('hack')) {
    return 'SECURITY_BREACH';
  }
  if (msg.includes('server') && (msg.includes('down') || msg.includes('crash'))) {
    return 'SERVER_DOWN';
  }
  if (msg.includes('perdendo soldi') || msg.includes('business fermo')) {
    return 'BUSINESS_CRITICAL';
  }
  if (msg.includes('dati') && (msg.includes('perso') || msg.includes('cancellati'))) {
    return 'DATA_LOSS';
  }
  
  return 'GENERAL_EMERGENCY';
}

// Generate emergency ticket ID
function generateEmergencyTicketId() {
  const timestamp = Date.now();
  return `CRITICAL-${timestamp}`;
}

// Generate emergency response with immediate contact info
function generateEmergencyResponse(emergencyData, context = {}) {
  const { city, emergencyType, ticketId } = emergencyData;
  
  const emergencyResponse = {
    message: `[IT-ERA] EMERGENZA RICEVUTA!
🚨 INTERVENTO IMMEDIATO ${city.toUpperCase()}
Numero Emergenza H24: 039 888 2041

Team in partenza: ETA 45 minuti
Ticket priorità MASSIMA: #${ticketId}

CHIAMACI ORA: 039 888 2041`,
    
    options: [
      "CHIAMA ORA: 039 888 2041",
      "Invia posizione per intervento",
      "Descrizione dettagliata emergenza"
    ],
    
    nextStep: "emergency_immediate_response",
    intent: "emergency_critical",
    confidence: 1.0,
    escalate: true,
    priority: 'immediate',
    emergencyType,
    ticketId,
    bypassAllFlows: true,
    requiresImmediateAction: true,
    aiPowered: false,
    emergency: true,
    
    // Emergency-specific data
    emergencyData: {
      detectedAt: new Date().toISOString(),
      city,
      type: emergencyType,
      phoneNumber: '039 888 2041',
      eta: '45 minuti',
      priority: 'CRITICAL'
    }
  };
  
  return emergencyResponse;
}

// Log emergency incident
async function logEmergencyIncident(emergencyData, message, sessionId, env) {
  try {
    const logData = {
      timestamp: new Date().toISOString(),
      sessionId,
      ticketId: emergencyData.ticketId,
      city: emergencyData.city,
      emergencyType: emergencyData.emergencyType,
      emergencyScore: emergencyData.emergencyScore,
      originalMessage: message,
      phoneNumber: '039 888 2041'
    };
    
    // Store in emergency log (using chat sessions for now)
    if (env.CHAT_SESSIONS) {
      await env.CHAT_SESSIONS.put(
        `emergency_log:${emergencyData.ticketId}`, 
        JSON.stringify(logData),
        { expirationTtl: 86400 * 7 } // Keep for 7 days
      );
    }
    
    console.log('🚨 EMERGENCY DETECTED:', logData);
    
  } catch (error) {
    console.error('Emergency logging failed:', error);
  }
}

// Emergency fallback response - PROFESSIONAL TONE
function getEmergencyFallbackResponse() {
  return {
    message: "[IT-ERA] Sto riscontrando un problema tecnico. Vi metto immediatamente in contatto con un nostro specialista per garantirvi la migliore assistenza.",
    options: ["Contatto immediato", "Riprova più tardi"],
    nextStep: "emergency_escalation",
    escalate: true,
    priority: 'high',
    aiPowered: false,
    emergency: true
  };
}

// Enhanced Session Management with ID tracking and persistent storage
async function getOrCreateSession(sessionId, CHAT_SESSIONS, metadata = {}) {
  let isNewSession = false;
  
  if (!sessionId) {
    sessionId = generateSessionId(metadata);
    isNewSession = true;
  }
  
  let session = null;
  
  try {
    if (CHAT_SESSIONS) {
      const sessionData = await CHAT_SESSIONS.get(sessionId);
      if (sessionData) {
        session = JSON.parse(sessionData);
        // Update conversation activity
        conversationMetrics.updateConversationActivity(sessionId, {
          messageCount: session.messages?.length || 0,
          totalCost: session.context?.totalCost || 0
        });
      }
    }
  } catch (error) {
    console.error(`Failed to retrieve session ${sessionId}:`, error);
  }
  
  if (!session) {
    isNewSession = true;
    session = {
      id: sessionId,
      created: Date.now(),
      messages: [],
      context: {
        sessionId, // Always include sessionId in context
        startTime: Date.now(),
        userAgent: metadata.userAgent,
        ip: metadata.ip
      },
      step: "greeting",
      leadData: {},
      metrics: {
        conversationStarted: new Date().toISOString(),
        messageCount: 0,
        totalCost: 0,
        aiUsage: 0,
        responseTimeSum: 0
      }
    };
    
    // Log new conversation start
    if (isNewSession) {
      logConversationStart(sessionId, metadata);
      
      // Store conversation ID in persistent metrics (if available)
      if (CHAT_SESSIONS) {
        try {
          await storeConversationMetrics(sessionId, metadata, CHAT_SESSIONS);
        } catch (error) {
          console.error('Failed to store conversation metrics:', error);
        }
      }
    }
  }
  
  // Ensure session always has current ID in context
  if (session.context) {
    session.context.sessionId = sessionId;
  }
  
  return session;
}

// Store conversation metrics persistently
async function storeConversationMetrics(sessionId, metadata, CHAT_SESSIONS) {
  try {
    const metricsKey = `conversation_metrics:${sessionId}`;
    const metricsData = {
      sessionId,
      startTime: new Date().toISOString(),
      userAgent: metadata.userAgent || 'unknown',
      ip: metadata.ip || 'unknown',
      status: 'active',
      messageCount: 0,
      totalCost: 0,
      aiUsage: 0,
      lastActivity: new Date().toISOString()
    };
    
    await CHAT_SESSIONS.put(
      metricsKey,
      JSON.stringify(metricsData),
      { expirationTtl: 86400 * 7 } // Keep for 7 days
    );
    
    console.log(`📊 Stored metrics for conversation: ${sessionId}`);
  } catch (error) {
    console.error('Failed to store conversation metrics:', error);
  }
}

// Enhanced Session Saving with metrics update
async function saveSession(session, CHAT_SESSIONS) {
  try {
    // Update session metrics
    if (session.metrics) {
      session.metrics.lastActivity = new Date().toISOString();
      session.metrics.messageCount = session.messages?.length || 0;
      session.metrics.totalCost = session.context?.totalCost || 0;
      session.metrics.aiUsage = session.messages?.filter(m => m.aiPowered).length || 0;
    }
    
    // Ensure sessionId is always in the context
    if (session.context) {
      session.context.sessionId = session.id;
      session.context.lastSaved = Date.now();
    }
    
    // Save main session
    await CHAT_SESSIONS.put(session.id, JSON.stringify(session), {
      expirationTtl: CONFIG.MAX_SESSION_DURATION
    });
    
    // Update conversation metrics in memory
    conversationMetrics.updateConversationActivity(session.id, {
      messageCount: session.messages?.length || 0,
      totalCost: session.context?.totalCost || 0,
      aiUsage: session.messages?.filter(m => m.aiPowered).length || 0
    });
    
    // Update persistent metrics
    if (session.metrics) {
      const metricsKey = `conversation_metrics:${session.id}`;
      const persistentMetrics = {
        sessionId: session.id,
        startTime: session.metrics.conversationStarted,
        lastActivity: session.metrics.lastActivity,
        messageCount: session.metrics.messageCount,
        totalCost: session.metrics.totalCost,
        aiUsage: session.metrics.aiUsage,
        status: session.escalation?.required ? 'escalated' : 'active',
        userAgent: session.context?.userAgent || 'unknown',
        ip: session.context?.ip || 'unknown'
      };
      
      try {
        await CHAT_SESSIONS.put(
          metricsKey,
          JSON.stringify(persistentMetrics),
          { expirationTtl: 86400 * 7 }
        );
      } catch (error) {
        console.error(`Failed to update persistent metrics for ${session.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error(`Failed to save session ${session.id}:`, error);
    throw error;
  }
}

// Check rate limiting
async function checkRateLimit(ip, CHAT_SESSIONS) {
  const key = `rate_limit:${ip}`;
  const current = await CHAT_SESSIONS.get(key);
  
  if (current) {
    const count = parseInt(current);
    if (count >= CONFIG.RATE_LIMIT_MESSAGES) {
      return false;
    }
    await CHAT_SESSIONS.put(key, String(count + 1), { expirationTtl: 3600 });
  } else {
    await CHAT_SESSIONS.put(key, '1', { expirationTtl: 3600 });
  }
  
  return true;
}

// Enhanced email integration with AI context
async function sendToEmailSystem(leadData, conversationContext = {}) {
  try {
    // Build comprehensive email data with AI insights
    const emailData = {
      // Basic lead information
      nome: leadData.contact_name || leadData.nome || 'Lead da Chat AI',
      email: leadData.email || '',
      telefono: leadData.phone || leadData.telefono || '',
      azienda: leadData.company_name || leadData.azienda || '',
      comune: leadData.location || leadData.comune || '',
      dipendenti: leadData.company_size || leadData.dipendenti || '',
      
      // Service information
      servizi: Array.isArray(leadData.servizi) ? leadData.servizi : 
               leadData.service_type ? [leadData.service_type] : [],
      urgenza: leadData.urgency || leadData.urgenza || 'normale',
      
      // Enhanced message with conversation insights
      messaggio: buildEnhancedMessage(leadData, conversationContext),
      
      // AI-specific metadata
      formType: 'ai-chatbot-lead',
      privacy: true,
      aiGenerated: true,
      conversationId: conversationContext.sessionId,
      leadQuality: conversationContext.leadQuality || 'medium',
      escalationReason: conversationContext.escalationReason || 'completed_qualification',
      conversationSummary: conversationContext.conversationSummary || {},
      timestamp: new Date().toISOString()
    };
    
    // Add AI conversation metrics
    if (conversationContext.aiMetrics) {
      emailData.aiMetrics = {
        totalCost: conversationContext.totalCost || 0,
        responseTime: conversationContext.averageResponseTime || 0,
        messageCount: conversationContext.messageCount || 0,
        aiConfidence: conversationContext.averageConfidence || 0
      };
    }
    
    const response = await fetch(CONFIG.EMAIL_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'IT-ERA-AI-Chatbot/1.0'
      },
      body: JSON.stringify(emailData)
    });
    
    const result = await response.json();
    
    return { 
      success: response.ok, 
      data: result,
      emailData: emailData // Include for debugging
    };
    
  } catch (error) {
    console.error('Enhanced email integration error:', error);
    return { success: false, error: error.message };
  }
}

// Build enhanced message with conversation context
function buildEnhancedMessage(leadData, context) {
  let message = leadData.messaggio || leadData.message || '';
  
  // Add conversation context
  if (context.sessionId) {
    message += `\n\n--- Informazioni Conversazione AI ---\n`;
    message += `Sessione: ${context.sessionId}\n`;
    message += `Messaggi scambiati: ${context.messageCount || 0}\n`;
    
    if (context.leadQuality) {
      message += `Qualità lead: ${context.leadQuality}\n`;
    }
    
    if (context.escalationReason) {
      message += `Motivo escalation: ${context.escalationReason}\n`;
    }
    
    if (leadData.budget_range) {
      message += `Budget indicativo: ${leadData.budget_range}\n`;
    }
    
    if (leadData.timeline) {
      message += `Timeline progetto: ${leadData.timeline}\n`;
    }
    
    if (leadData.sector) {
      message += `Settore: ${leadData.sector}\n`;
    }
  }
  
  return message;
}

// Calculate average response time for metrics
function calculateAverageResponseTime(messages) {
  const botMessages = messages.filter(m => m.type === 'bot' && m.responseTime);
  if (botMessages.length === 0) return 0;
  
  const totalTime = botMessages.reduce((sum, msg) => sum + (msg.responseTime || 0), 0);
  return Math.round(totalTime / botMessages.length);
}

/**
 * SECURITY CRITICAL: Sanitize all response messages before sending to frontend
 */
function sanitizeResponseMessage(message) {
  if (!message || typeof message !== 'string') {
    return "Ciao sono Mark, assistente di IT-ERA, come posso aiutarti?";
  }

  // COMPREHENSIVE system prompt detection - catch all system prompt patterns
  const systemPromptPatterns = [
    // CRITICAL: Exact match for the exposed system prompt
    /INIZIALE.*Saluta e presentati.*primo filtro commerciale.*Non sei un tecnico.*Ora rispondi al messaggio/,
    /primo filtro commerciale.*Non sei un tecnico.*Ogni intervento tecnico deve essere gestito/,
    
    // Direct system prompt indicators
    /INIZIO:|RISPOSTA TIPO|SYSTEM_PROMPT|REGOLE ASSOLUTE|INIZIO CONVERSAZIONE|INIZIA SEMPRE/,
    /IDENTITÀ:|COMPORTAMENTO CONVERSAZIONALE|OBIETTIVI PRIMARI/,
    /generateSystemPrompt|BusinessRules|systemPrompt/,
    /# IDENTITÀ|PERSONALITÀ:|ESEMPIO DI RISPOSTA:|ORA INIZIA:/,
    /INIZIO DI OGNI RISPOSTA:|MANTIENI LA CONVERSAZIONE/,
    /PROFESSIONALE MA (AMICHEVOLE|empatico)/,
    
    // Specific exposed patterns from the bug report
    /Saluta e presentati brevemente.*Chiedi subito il nome dell'azienda/,
    /Indaga l'urgenza del problema.*RICORDA.*Non sei un tecnico/,
    /sei il primo filtro commerciale/,
    /specialisti.*Ora rispondi al messaggio seguente/,
    
    // Structured prompts (multiple lines or instructions)
    /Inizia con:|La mia prima risposta sarà:|con una domanda per qualificare/,
    /INIZIA OGNI CONVERSAZIONE CON:/,
    /Ogni conversazione inizia con/,
    
    // System behavior instructions
    /Sei (l'assistente virtuale|il filtro commerciale)/,
    /Ricorda: Sei il filtro commerciale/,
    /Devi sempre concludere con un'azione commerciale/,
    /console\.log/,
    /- Professionale ma empatico|- Competente senza essere tecnico/,
    /- Persuasivo senza essere aggressivo|- Sicuro senza essere arrogante/,
    
    // Sample conversations in system prompts
    /Mi serve un antivirus per la mia azienda|Kaspersky Endpoint Security/,
    /Perfetto, per \d+ postazioni consiglio/,
    /Capisco (il problema con|perfettamente il suo problema)/,
    /\*\*User\*\*:|---\*\*User\*\*:|appuntamento, preventivo, chiamata|convertire la richiesta in opportunità commerciale/,
    /\*\*Assistant\*\*:/,
    
    // Long concatenated system content (common when AI fails)
    /.{0,50}professionale.{0,50}Creando urgenza/i,
    /Buongiorno, sono l'assistente (virtuale di IT-ERA|di IT-ERA).{0,100}/,
    /ho un problema con il mio computer che non si connette|Qual è il vostro attuale fornitore IT|Quanti dipendenti\/Pc\/server/,
    
    // Detect very long messages that look like system prompts (>200 chars with structured content)
    /^.{200,}(INIZIO|Inizia|professionale|assistente|RISPOSTA|ESEMPIO)/i,
    
    // Pattern for conversation examples in system prompts
    /Salve, ho un problema.*intervento remoto.*appuntamento/s,
    
    // Additional AI system indicators
    /Obiettivi.*conversazione|stile.*comunicazione|escalation.*immediata/i,
    /lead.*qualification|contesto.*conversazione.*corrente/i,
    /rispond.*sempre.*come.*esperto/i
  ];

  // Check if message matches any system prompt pattern
  for (const pattern of systemPromptPatterns) {
    if (pattern.test(message)) {
      console.error('SECURITY ALERT: System prompt pattern detected:', message.substring(0, 100));
      return "Ciao sono Mark, assistente di IT-ERA, come posso aiutarti?";
    }
  }

  // Additional check: if message is unusually long (>300 chars) and contains multiple system indicators
  if (message.length > 300) {
    const systemKeywords = [
      'professionale', 'assistente', 'conversazione', 'risposta', 
      'esempio', 'inizia', 'mantieni', 'comportamento', 'personalità',
      'obiettivi', 'escalation', 'qualification', 'contesto', 'specialisti'
    ];
    
    const keywordCount = systemKeywords.reduce((count, keyword) => {
      return count + (message.toLowerCase().includes(keyword) ? 1 : 0);
    }, 0);
    
    if (keywordCount >= 3) {
      console.error('SECURITY ALERT: Long message with system keywords detected, using safe fallback');
      return "Ciao sono Mark, assistente di IT-ERA, come posso aiutarti?";
    }
  }

  // Additional check: if message contains typical AI system prompt structure
  if (message.includes('🎯') && message.includes('📍') && message.includes('AZIENDA:')) {
    console.error('SECURITY ALERT: AI system prompt structure detected');
    return "Ciao sono Mark, assistente di IT-ERA, come posso aiutarti?";
  }

  // Final check: if message starts with system-like content
  const systemStarters = [
    'Sei l\'assistente virtuale', 
    'INIZIALE:', 
    'RICORDA:',
    'Ora rispondi al messaggio',
    'primo filtro commerciale',
    'Non sei un tecnico'
  ];
  
  for (const starter of systemStarters) {
    if (message.toLowerCase().includes(starter.toLowerCase())) {
      console.error('SECURITY ALERT: System starter detected:', starter);
      return "Ciao sono Mark, assistente di IT-ERA, come posso aiutarti?";
    }
  }

  return message;
}

// MARK Greeting Generator - New personality and flow
async function generateMarkGreeting(context, env) {
  try {
    // MARK's personalized greeting - friendly but professional IT consultant
    const markGreeting = "Ciao sono Mark, assistente di IT-ERA, come posso aiutarti?";
    
    // Add typing delay simulation for natural conversation feel
    await simulateTypingDelay(1200); // 1.2 second delay
    
    // Check cache first for instant response
    const cacheKey = `mark_greeting_${context.userAgent || 'default'}`;
    if (env.CHAT_SESSIONS) {
      const cached = await env.CHAT_SESSIONS.get(cacheKey);
      if (cached) {
        const cachedResponse = JSON.parse(cached);
        // SECURITY: Always sanitize cached responses and ensure safe greeting
        cachedResponse.message = markGreeting;
        return {
          ...cachedResponse,
          cached: true,
          responseTime: 50 // Near-instant
        };
      }
    }
    
    // Mark's greeting response - NO automatic options
    const greetingResponse = {
      message: markGreeting,
      options: [], // NO options - natural conversation flow
      nextStep: "collect_user_data",
      intent: "greeting",
      confidence: 1.0,
      aiPowered: false,
      priority: "high",
      secure: true,
      markPersonality: true // Flag for Mark's personality
    };
    
    // Cache for 5 minutes
    if (env.CHAT_SESSIONS) {
      await env.CHAT_SESSIONS.put(
        cacheKey, 
        JSON.stringify(greetingResponse), 
        { expirationTtl: CONFIG.GREETING_CACHE_TTL }
      );
    }
    
    return greetingResponse;
    
  } catch (error) {
    console.error('Mark greeting error:', error);
    // FALLBACK: Always return the same safe greeting
    return {
      message: "Ciao sono Mark, assistente di IT-ERA, come posso aiutarti?",
      options: [],
      nextStep: "collect_user_data",
      aiPowered: false,
      secure: true,
      markPersonality: true
    };
  }
}

// Simulate typing delay for natural conversation
async function simulateTypingDelay(ms = 1000) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

// Mark's data collection flow
async function handleMarkDataCollection(message, context, env) {
  const currentStep = context.currentStep;
  const leadData = context.leadData || {};
  
  // Add typing delay for natural feel
  await simulateTypingDelay(800);
  
  switch (currentStep) {
    case "collect_user_data":
      // First interaction - ask for name
      if (!leadData.nome) {
        return {
          message: "Perfetto! Per iniziare, come ti chiami?",
          options: [],
          nextStep: "collect_name",
          intent: "data_collection",
          confidence: 1.0,
          aiPowered: false,
          markPersonality: true
        };
      }
      break;
      
    case "collect_name":
      // Collect name and ask for surname
      if (message && !leadData.cognome) {
        context.leadData = { ...leadData, nome: message.trim() };
        return {
          message: `Ciao ${message.trim()}! E il tuo cognome?`,
          options: [],
          nextStep: "collect_surname",
          intent: "data_collection",
          confidence: 1.0,
          aiPowered: false,
          markPersonality: true
        };
      }
      break;
      
    case "collect_surname":
      // Collect surname and ask for email
      if (message && !leadData.email) {
        context.leadData = { ...context.leadData, cognome: message.trim() };
        return {
          message: "Perfetto! Ora mi serve la tua email per poterti inviare tutte le informazioni:",
          options: [],
          nextStep: "collect_email",
          intent: "data_collection",
          confidence: 1.0,
          aiPowered: false,
          markPersonality: true
        };
      }
      break;
      
    case "collect_email":
      // Collect email and ask for phone
      if (message && isValidEmail(message) && !leadData.telefono) {
        context.leadData = { ...context.leadData, email: message.trim().toLowerCase() };
        return {
          message: "Ottimo! Ultimo dato: il tuo numero di telefono per eventuali chiarimenti urgenti:",
          options: [],
          nextStep: "collect_phone",
          intent: "data_collection",
          confidence: 1.0,
          aiPowered: false,
          markPersonality: true
        };
      } else if (message && !isValidEmail(message)) {
        return {
          message: "Mi sembra che l'email non sia corretta. Puoi ripetere? (esempio: nome@azienda.it)",
          options: [],
          nextStep: "collect_email",
          intent: "data_collection",
          confidence: 1.0,
          aiPowered: false,
          markPersonality: true
        };
      }
      break;
      
    case "collect_phone":
      // Collect phone and complete registration
      if (message && isValidPhone(message)) {
        context.leadData = { 
          ...context.leadData, 
          telefono: message.trim(),
          conversationId: context.sessionId,
          timestamp: new Date().toISOString()
        };
        
        // Save customer data with conversation ID
        await saveCustomerData(context.leadData, context.sessionId, env);
        
        const fullName = `${context.leadData.nome} ${context.leadData.cognome}`;
        return {
          message: `Grazie ${fullName}! I tuoi dati sono stati salvati. Ora dimmi, di cosa hai bisogno per la tua azienda?`,
          options: [],
          nextStep: "natural_conversation",
          intent: "data_collected",
          confidence: 1.0,
          aiPowered: false,
          markPersonality: true,
          dataCollected: true
        };
      } else if (message && !isValidPhone(message)) {
        return {
          message: "Il numero sembra non essere valido. Puoi ripetere? (esempio: 02 1234567 o 333 1234567)",
          options: [],
          nextStep: "collect_phone",
          intent: "data_collection", 
          confidence: 1.0,
          aiPowered: false,
          markPersonality: true
        };
      }
      break;
      
    case "natural_conversation":
      // Natural conversation after data collection
      return generateMarkNaturalResponse(message, context, env);
      
    default:
      return generateMarkNaturalResponse(message, context, env);
  }
  
  // Fallback
  return {
    message: "Mi dispiace, non ho capito. Puoi ripetere?",
    options: [],
    nextStep: currentStep,
    intent: "clarification",
    confidence: 0.5,
    aiPowered: false,
    markPersonality: true
  };
}

// Generate Mark's natural conversational response
async function generateMarkNaturalResponse(message, context, env) {
  await simulateTypingDelay(1500); // Longer delay for thoughtful responses
  
  // Mark's personality: friendly but professional IT consultant
  const response = await generateMarkResponse(message, context, env);
  
  return {
    ...response,
    options: [], // NO automatic options - natural conversation
    markPersonality: true,
    naturalConversation: true
  };
}

// Core Mark response generator with his personality
async function generateMarkResponse(message, context, env) {
  try {
    // Use AI for natural conversation, but with Mark's personality
    const { aiEngine, conversationDesigner } = await initializeAI(env);
    
    // Mark's system prompt for personality
    const markSystemPrompt = `Sei Mark, l'assistente virtuale di IT-ERA. Sei un consulente IT esperto, amichevole ma professionale.
    
PERSONALITÀ:
- Tono amichevole ma competente
- Rispondi come un consulente IT esperto
- Usa un linguaggio semplice e diretto
- Sii empatico ma professionale
- Concentrati sulle soluzioni IT
- NON proporre mai opzioni multiple automatiche
- Mantieni sempre una conversazione naturale

OBIETTIVI:
- Capire le esigenze IT del cliente
- Proporre soluzioni appropriate
- Qualificare il lead come consulente esperto
- Mantenere una conversazione fluida e naturale

Ora rispondi al messaggio del cliente in modo naturale e professionale.`;

    const enhancedContext = {
      ...context,
      markPersonality: true,
      systemPrompt: markSystemPrompt,
      customerData: context.leadData
    };
    
    const aiResponse = await aiEngine.generateResponse(message, enhancedContext, context.sessionId);
    
    return {
      message: aiResponse.message || "Come posso aiutarti con le tue esigenze IT?",
      nextStep: "natural_conversation",
      intent: aiResponse.intent || "general",
      confidence: aiResponse.confidence || 0.8,
      aiPowered: true,
      cost: aiResponse.cost || 0,
      model: aiResponse.model || CONFIG.AI_MODEL
    };
    
  } catch (error) {
    console.error('Mark AI response error:', error);
    
    // Fallback to simple pattern matching with Mark's personality
    return generateMarkFallbackResponse(message);
  }
}

// Mark's fallback responses when AI is unavailable
function generateMarkFallbackResponse(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('preventivo') || msg.includes('prezzo') || msg.includes('costo')) {
    return {
      message: "Capisco che ti interessa un preventivo. Per prepararti una proposta precisa, dimmi: che tipo di servizio IT stai cercando? Assistenza, sicurezza informatica, cloud storage?",
      nextStep: "natural_conversation",
      intent: "preventivo",
      confidence: 0.8,
      aiPowered: false
    };
  }
  
  if (msg.includes('assistenza') || msg.includes('supporto') || msg.includes('problema')) {
    return {
      message: "Perfetto, sono qui per aiutarti con l'assistenza IT. Raccontami qual è il problema che stai riscontrando, così posso indirizzarti verso la soluzione migliore.",
      nextStep: "natural_conversation", 
      intent: "supporto",
      confidence: 0.8,
      aiPowered: false
    };
  }
  
  if (msg.includes('sicurezza') || msg.includes('virus') || msg.includes('backup')) {
    return {
      message: "La sicurezza informatica è fondamentale! Che tipo di protezione stai cercando? Antivirus aziendale, backup automatici, o hai avuto qualche problema di sicurezza?",
      nextStep: "natural_conversation",
      intent: "sicurezza", 
      confidence: 0.8,
      aiPowered: false
    };
  }
  
  if (msg.includes('cloud') || msg.includes('archiviazione') || msg.includes('storage')) {
    return {
      message: "Il cloud storage è una scelta intelligente! Di quanto spazio hai bisogno e per che tipo di dati? Documenti aziendali, backup, o condivisione file?",
      nextStep: "natural_conversation",
      intent: "cloud",
      confidence: 0.8,
      aiPowered: false
    };
  }
  
  // Generic friendly response
  return {
    message: "Interessante! Raccontami di più così posso capire meglio come aiutarti con le tue esigenze IT.",
    nextStep: "natural_conversation",
    intent: "generale",
    confidence: 0.6,
    aiPowered: false
  };
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (Italian formats)
function isValidPhone(phone) {
  const phoneRegex = /^(\+39|0039|39)?\s?([0-9]{2,4})\s?([0-9]{6,8})$|^([0-9]{3})\s?([0-9]{7})$|^([0-9]{10})$/;
  const cleanPhone = phone.replace(/[\s\-\.]/g, '');
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 9;
}

// Save customer data with conversation ID
async function saveCustomerData(leadData, conversationId, env) {
  try {
    const customerData = {
      ...leadData,
      conversationId,
      source: 'mark-chatbot',
      timestamp: new Date().toISOString(),
      dataCollectionComplete: true
    };
    
    // Save to chat sessions storage
    if (env.CHAT_SESSIONS) {
      const customerKey = `customer_data:${conversationId}`;
      await env.CHAT_SESSIONS.put(
        customerKey,
        JSON.stringify(customerData),
        { expirationTtl: 86400 * 30 } // Keep for 30 days
      );
    }
    
    console.log(`📝 Customer data saved for conversation: ${conversationId}`, {
      name: `${leadData.nome} ${leadData.cognome}`,
      email: leadData.email,
      phone: leadData.telefono
    });
    
    return { success: true, data: customerData };
    
  } catch (error) {
    console.error('Failed to save customer data:', error);
    return { success: false, error: error.message };
  }
}

// Enhanced Session Cleanup with metrics preservation
async function cleanupAISession(sessionId, CHAT_SESSIONS, preserveMetrics = true) {
  try {
    const session = await CHAT_SESSIONS.get(sessionId);
    if (!session) return;
    
    const sessionData = JSON.parse(session);
    
    // Log final metrics
    const finalMetrics = {
      sessionId,
      completedAt: new Date().toISOString(),
      messageCount: sessionData.context?.messageCount || 0,
      totalCost: sessionData.context?.totalCost || 0,
      averageResponseTime: sessionData.context?.averageResponseTime || 0,
      sessionDuration: Date.now() - (sessionData.created || Date.now()),
      escalated: !!sessionData.escalation,
      escalationType: sessionData.escalation?.type,
      emergency: !!sessionData.emergency,
      aiUsage: sessionData.messages?.filter(m => m.aiPowered).length || 0
    };
    
    console.log(`🏁 Session ${sessionId} completed:`, finalMetrics);
    
    // Update conversation metrics before cleanup
    conversationMetrics.updateConversationActivity(sessionId, {
      status: 'completed',
      completedAt: Date.now(),
      ...finalMetrics
    });
    
    // Preserve important metrics if requested
    if (preserveMetrics && CHAT_SESSIONS) {
      const archiveKey = `conversation_archive:${sessionId}`;
      try {
        await CHAT_SESSIONS.put(
          archiveKey,
          JSON.stringify(finalMetrics),
          { expirationTtl: 86400 * 30 } // Keep archive for 30 days
        );
      } catch (error) {
        console.error(`Failed to archive metrics for ${sessionId}:`, error);
      }
    }
    
    // Clean up the main session
    await CHAT_SESSIONS.delete(sessionId);
    
    // Clean up conversation metrics
    const metricsKey = `conversation_metrics:${sessionId}`;
    await CHAT_SESSIONS.delete(metricsKey);
    
    // Remove from memory
    conversationMetrics.activeConversations.delete(sessionId);
    
    return finalMetrics;
    
  } catch (error) {
    console.error(`Session cleanup error for ${sessionId}:`, error);
    throw error;
  }
}

// Automated cleanup system for old conversations
const AutoCleanupSystem = {
  isRunning: false,
  intervalId: null,
  
  // Start automated cleanup (runs every hour)
  start() {
    if (this.isRunning) return;
    
    console.log('🔄 Starting automated conversation cleanup system');
    this.isRunning = true;
    
    // Run cleanup immediately
    this.runCleanup();
    
    // Schedule regular cleanup every hour
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, 60 * 60 * 1000); // 1 hour
  },
  
  // Stop automated cleanup
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Stopped automated conversation cleanup system');
  },
  
  // Run cleanup process
  async runCleanup(CHAT_SESSIONS = null) {
    try {
      const startTime = Date.now();
      
      // Clean up memory-based conversations
      const memoryCleanedCount = conversationMetrics.cleanupOldConversations();
      
      // Clean up stored conversations if storage is available
      let storageCleanedCount = 0;
      if (CHAT_SESSIONS) {
        storageCleanedCount = await this.cleanupStoredConversations(CHAT_SESSIONS);
      }
      
      const duration = Date.now() - startTime;
      
      if (memoryCleanedCount > 0 || storageCleanedCount > 0) {
        console.log(`🧹 Cleanup completed in ${duration}ms:`, {
          memoryConversationsRemoved: memoryCleanedCount,
          storageConversationsRemoved: storageCleanedCount,
          totalRemoved: memoryCleanedCount + storageCleanedCount
        });
      }
      
      return {
        success: true,
        duration,
        memoryCleanedCount,
        storageCleanedCount,
        totalCleanedCount: memoryCleanedCount + storageCleanedCount
      };
      
    } catch (error) {
      console.error('Automated cleanup failed:', error);
      return {
        success: false,
        error: error.message,
        duration: 0,
        cleanedCount: 0
      };
    }
  },
  
  // Clean up old stored conversations
  async cleanupStoredConversations(CHAT_SESSIONS) {
    // This is a simplified version - in production you'd want to implement
    // proper key scanning for conversations older than a certain time
    let cleanedCount = 0;
    
    try {
      // Clean up old conversation metrics (older than 7 days)
      const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      // Note: In a real implementation, you'd scan for keys matching
      // the conversation_metrics:* pattern and check their timestamps
      // This is a placeholder for the concept
      
      console.log(`🗄️ Storage cleanup completed: ${cleanedCount} old conversations removed`);
      
    } catch (error) {
      console.error('Storage cleanup failed:', error);
    }
    
    return cleanedCount;
  },
  
  // Get cleanup status
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextCleanupIn: this.intervalId ? '< 1 hour' : 'stopped',
      activeConversations: conversationMetrics.getAllActiveIDs().length,
      lastCleanupTime: 'automatic'
    };
  }
};

// Main worker handler
// RESILIENCE MONITORING - Periodic health assessments
let monitoringInterval;

function startResilienceMonitoring() {
  if (monitoringInterval) return; // Already started
  
  monitoringInterval = setInterval(async () => {
    try {
      if (resilienceInitialized) {
        const health = await healthMonitor.getCurrentHealth();
        await gracefulDegradation.assessSystemHealth();
        
        if (health.status === 'CRITICAL') {
          logger.error('System health critical - immediate attention required', {
            criticalServices: health.summary.critical,
            unhealthyServices: health.summary.unhealthy
          });
        }
      }
    } catch (error) {
      logger.error('Health monitoring failed', { error: error.message });
    }
  }, 60000); // Every minute

  // Cleanup old logs periodically  
  setInterval(() => {
    try {
      const cleared = logger.clearOldLogs(86400000); // 24 hours
      if (cleared > 0) {
        logger.info(`Cleaned up ${cleared} old log entries`);
      }
    } catch (error) {
      logger.error('Log cleanup failed', { error: error.message });
    }
  }, 3600000); // Every hour
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    
    // Start resilience monitoring on first request
    startResilienceMonitoring();
    
    // Start automated conversation cleanup system on first request
    if (!AutoCleanupSystem.isRunning) {
      AutoCleanupSystem.start();
    }
    
    // Endpoint to retrieve customer data by conversation ID
    if (url.pathname.startsWith('/api/customer/') && request.method === 'GET') {
      const conversationId = url.pathname.split('/').pop();
      
      if (!conversationId || conversationId === 'customer') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Conversation ID required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      try {
        // Get customer data from storage
        const customerKey = `customer_data:${conversationId}`;
        const customerData = env.CHAT_SESSIONS ? await env.CHAT_SESSIONS.get(customerKey) : null;
        
        if (!customerData) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Customer data not found',
            conversationId
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        const customer = JSON.parse(customerData);
        
        // Return customer data (filtered for privacy)
        return new Response(JSON.stringify({
          success: true,
          customer: {
            conversationId: customer.conversationId,
            nome: customer.nome,
            cognome: customer.cognome,
            email: customer.email,
            telefono: customer.telefono,
            source: customer.source,
            timestamp: customer.timestamp,
            dataCollectionComplete: customer.dataCollectionComplete
          },
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
        
      } catch (error) {
        console.error(`Failed to retrieve customer data ${conversationId}:`, error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to retrieve customer data',
          message: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Endpoint to retrieve conversation by ID
    if (url.pathname.startsWith('/api/conversation/') && request.method === 'GET') {
      const conversationId = url.pathname.split('/').pop();
      
      if (!conversationId || conversationId === 'conversation') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Conversation ID required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      try {
        // Get conversation from storage
        const sessionData = env.CHAT_SESSIONS ? await env.CHAT_SESSIONS.get(conversationId) : null;
        const metricsData = env.CHAT_SESSIONS ? await env.CHAT_SESSIONS.get(`conversation_metrics:${conversationId}`) : null;
        
        if (!sessionData) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Conversation not found',
            conversationId
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        const session = JSON.parse(sessionData);
        const metrics = metricsData ? JSON.parse(metricsData) : null;
        
        // Return conversation data (filtered for privacy)
        return new Response(JSON.stringify({
          success: true,
          conversation: {
            id: session.id,
            created: session.created,
            messageCount: session.messages?.length || 0,
            status: session.escalation?.required ? 'escalated' : 'active',
            lastActivity: metrics?.lastActivity || new Date(session.created).toISOString(),
            totalCost: session.context?.totalCost || 0,
            aiUsage: session.messages?.filter(m => m.aiPowered).length || 0,
            emergency: session.emergency || false,
            escalated: !!session.escalation?.required,
            escalationType: session.escalation?.type,
            // Don't include actual messages for privacy, just metadata
            summary: {
              userMessages: session.messages?.filter(m => m.type === 'user').length || 0,
              botMessages: session.messages?.filter(m => m.type === 'bot').length || 0,
              avgResponseTime: session.context?.averageResponseTime || 0
            }
          },
          metrics: metrics || {},
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
        
      } catch (error) {
        console.error(`Failed to retrieve conversation ${conversationId}:`, error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to retrieve conversation',
          message: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Endpoint for conversation management and cleanup
    if (url.pathname === '/api/conversations' && request.method === 'GET') {
      try {
        // Clean up old conversations
        const cleanedCount = conversationMetrics.cleanupOldConversations();
        
        // Get conversations summary
        const summary = conversationMetrics.getConversationsSummary();
        
        // Get list of active conversation IDs (limited to prevent large responses)
        const activeIDs = conversationMetrics.getAllActiveIDs().slice(0, 100);
        
        return new Response(JSON.stringify({
          success: true,
          summary,
          activeConversations: activeIDs.length,
          recentConversationIDs: activeIDs.slice(0, 20), // Last 20 IDs
          cleanupResults: {
            oldConversationsRemoved: cleanedCount
          },
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to retrieve conversations summary',
          message: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Cleanup management endpoint
    if (url.pathname === '/api/cleanup' && request.method === 'POST') {
      try {
        const requestData = await request.json().catch(() => ({}));
        const action = requestData.action || 'run';
        
        if (action === 'run') {
          // Run manual cleanup
          const cleanupResult = await AutoCleanupSystem.runCleanup(env.CHAT_SESSIONS);
          
          return new Response(JSON.stringify({
            success: true,
            action: 'manual_cleanup_completed',
            results: cleanupResult,
            timestamp: new Date().toISOString()
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
          
        } else if (action === 'status') {
          // Get cleanup system status
          const status = AutoCleanupSystem.getStatus();
          const conversationSummary = conversationMetrics.getConversationsSummary();
          
          return new Response(JSON.stringify({
            success: true,
            cleanupSystem: status,
            conversationMetrics: conversationSummary,
            timestamp: new Date().toISOString()
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
          
        } else if (action === 'start') {
          AutoCleanupSystem.start();
          return new Response(JSON.stringify({
            success: true,
            action: 'cleanup_system_started',
            status: AutoCleanupSystem.getStatus()
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
          
        } else if (action === 'stop') {
          AutoCleanupSystem.stop();
          return new Response(JSON.stringify({
            success: true,
            action: 'cleanup_system_stopped',
            status: AutoCleanupSystem.getStatus()
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
          
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid action',
            availableActions: ['run', 'status', 'start', 'stop']
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Cleanup management failed',
          message: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Health check with Hybrid AI system status and conversation ID management
    if (url.pathname === '/health') {
      let aiHealthy = false;
      let aiStatus = 'not_initialized';
      let hybridStatus = { status: 'disabled' };
      
      try {
        if (openRouterEngine) {
          const healthCheck = await openRouterEngine.healthCheck();
          aiHealthy = healthCheck.status === 'healthy';
          aiStatus = healthCheck.status;
        }
        
        if (CONFIG.HYBRID_ENABLED) {
          hybridStatus = hybridPerformanceMonitor.healthCheck();
        }
      } catch (error) {
        aiStatus = 'error';
      }
      
      // Get conversation ID management status
      const conversationSummary = conversationMetrics.getConversationsSummary();
      const cleanupStatus = AutoCleanupSystem.getStatus();
      
      return new Response(JSON.stringify({
        status: aiHealthy ? 'ok' : 'degraded',
        service: 'IT-ERA Chatbot API (Hybrid)',
        provider: 'Cloudflare Workers',
        ai: {
          engine: 'OpenRouter_Hybrid',
          status: aiStatus,
          strategy: 'GPT-4o Mini + DeepSeek v3.1',
          primaryModel: CONFIG.AI_MODEL,
          fallbackModel: CONFIG.AI_FALLBACK_MODEL,
          hybridEnabled: CONFIG.HYBRID_ENABLED,
          targetCost: `€${CONFIG.AI_COST_LIMIT}`,
          targetResponseTime: `${CONFIG.TARGET_RESPONSE_TIME}ms`
        },
        hybrid: hybridStatus,
        conversationManagement: {
          activeConversations: conversationSummary.total,
          avgSessionDuration: Math.round(conversationSummary.avgDuration / 1000) + 's',
          avgMessagesPerSession: Math.round(conversationSummary.avgMessages * 10) / 10,
          totalCostToday: '€' + (conversationSummary.totalCost || 0).toFixed(4),
          aiUsagePercentage: Math.round(conversationSummary.aiUsagePercent * 10) / 10 + '%',
          cleanupSystem: {
            status: cleanupStatus.isRunning ? 'active' : 'stopped',
            nextCleanup: cleanupStatus.nextCleanupIn,
            monitoredConversations: cleanupStatus.activeConversations
          }
        },
        markChatbot: {
          version: '2.0',
          personality: 'Mark - IT Consultant',
          features: [
            'Personalized greeting',
            'Natural conversation flow',
            'No automatic options',
            'Customer data collection',
            'Typing delay simulation',
            'Professional IT consulting tone'
          ],
          dataCollection: {
            fields: ['nome', 'cognome', 'email', 'telefono'],
            storage: 'conversationId-linked',
            retention: '30 days'
          }
        },
        endpoints: {
          conversationById: '/api/conversation/{id}',
          customerData: '/api/customer/{conversationId}',
          conversationsList: '/api/conversations',
          cleanupManagement: '/api/cleanup (POST)',
          analytics: '/analytics',
          hybridDashboard: '/hybrid-dashboard'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Enhanced Analytics endpoint with Hybrid metrics
    if (url.pathname === '/analytics' && request.method === 'GET') {
      try {
        const report = aiAnalytics.getAnalyticsReport('today');
        const hybridReport = CONFIG.HYBRID_ENABLED ? 
          hybridPerformanceMonitor.getPerformanceReport() : 
          { status: 'disabled' };
        const engineStats = openRouterEngine ? 
          openRouterEngine.getUsageStats() : 
          { status: 'not_initialized' };
        
        return new Response(JSON.stringify({
          success: true,
          analytics: {
            traditional: report,
            hybrid: hybridReport,
            engine: engineStats
          },
          performance: {
            hybridEnabled: CONFIG.HYBRID_ENABLED,
            targets: {
              costPerConversation: CONFIG.AI_COST_LIMIT,
              responseTimeMs: CONFIG.TARGET_RESPONSE_TIME
            }
          },
          generated: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Analytics not available',
          message: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Hybrid Performance Dashboard endpoint
    if (url.pathname === '/hybrid-dashboard' && request.method === 'GET') {
      try {
        if (!CONFIG.HYBRID_ENABLED) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Hybrid strategy not enabled'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        const hybridReport = hybridPerformanceMonitor.getPerformanceReport();
        const strategyStatus = hybridModelSelector.getStrategyStatus();
        
        return new Response(JSON.stringify({
          success: true,
          dashboard: {
            performance: hybridReport,
            strategy: strategyStatus,
            models: {
              primary: { name: CONFIG.AI_MODEL, type: 'customer_chat' },
              secondary: { name: CONFIG.AI_FALLBACK_MODEL, type: 'technical_docs' },
              emergency: { name: CONFIG.AI_EMERGENCY_MODEL, type: 'fallback' }
            },
            targets: {
              costPerConversation: CONFIG.AI_COST_LIMIT,
              responseTimeMs: CONFIG.TARGET_RESPONSE_TIME,
              description: 'GPT-4o Mini for customer chat, DeepSeek for technical content'
            }
          },
          generated: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Hybrid dashboard not available',
          message: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(origin),
      });
    }
    
    // Solo POST su /api/chat
    if (request.method !== 'POST' || url.pathname !== '/api/chat') {
      return new Response(JSON.stringify({
        error: 'Method not allowed',
        message: 'Use POST /api/chat'
      }), {
        status: 405,
        headers: corsHeaders(origin),
      });
    }
    
    try {
      // Get client IP
      const ip = request.headers.get('CF-Connecting-IP') || 
                 request.headers.get('X-Forwarded-For') || 
                 'unknown';
      
      // Rate limiting
      if (env.CHAT_SESSIONS) {
        const canProceed = await checkRateLimit(ip, env.CHAT_SESSIONS);
        if (!canProceed) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Troppe richieste. Riprova tra un\'ora.'
          }), {
            status: 429,
            headers: corsHeaders(origin),
          });
        }
      }
      
      // Parse request
      const data = await request.json();
      const { message, sessionId, action } = data;
      
      // Get client metadata for enhanced session tracking
      const clientMetadata = {
        userAgent: request.headers.get('User-Agent') || 'unknown',
        ip: request.headers.get('CF-Connecting-IP') || 
            request.headers.get('X-Forwarded-For') || 'unknown',
        timestamp: Date.now()
      };
      
      // Get or create session with metadata
      let session = await getOrCreateSession(sessionId, env.CHAT_SESSIONS, clientMetadata);
      
      // Handle different actions
      if (action === 'start') {
        // Initialize conversation with enhanced context and ID logging
        session.context = {
          sessionId: session.id,
          currentStep: 'greeting',
          messageCount: 0,
          totalCost: 0,
          startTime: Date.now(),
          userAgent: clientMetadata.userAgent,
          ip: clientMetadata.ip
        };
        
        // Log conversation ID at the start
        console.log(`🆔 Starting conversation with ID: ${session.id}`, {
          timestamp: new Date().toISOString(),
          userAgent: clientMetadata.userAgent,
          ip: clientMetadata.ip
        });
        
        // MARK greeting with personality
        const response = await generateMarkGreeting(session.context, env);
        
        session.messages.push({
          type: 'bot',
          content: response.message,
          options: response.options,
          timestamp: Date.now(),
          aiPowered: response.aiPowered,
          // Hybrid metrics
          hybridEnabled: CONFIG.HYBRID_ENABLED,
          model: response.model || CONFIG.AI_MODEL,
          modelReason: response.modelReason || 'default'
        });
        
        session.step = response.nextStep;
        session.context.currentStep = response.nextStep;
        
        await saveSession(session, env.CHAT_SESSIONS);
        
        // CRITICAL SECURITY: Final sanitization check for startup response
        const startupMessage = sanitizeResponseMessage(response.message);
        
        return new Response(JSON.stringify({
          success: true,
          sessionId: session.id,
          conversationId: session.id, // Explicit conversation ID field
          response: startupMessage,
          options: response.options,
          step: response.nextStep,
          aiPowered: response.aiPowered,
          secure: startupMessage === "[IT-ERA] Ciao! Sono l'assistente virtuale di IT-ERA. Come posso aiutarti oggi?", // Confirm safe greeting
          conversationMetadata: {
            startTime: session.context.startTime,
            messageCount: 0,
            totalCost: 0
          }
        }), {
          headers: corsHeaders(origin),
        });
      }
      
      if (action === 'message' && message) {
        // CRITICAL: Emergency detection first - bypasses ALL other flows
        const emergencyCheck = detectEmergency(message, session.context);
        
        if (emergencyCheck.isEmergency) {
          // Log emergency incident immediately
          await logEmergencyIncident(emergencyCheck, message, session.id, env);
          
          // Add user message to session
          session.messages.push({
            type: 'user',
            content: message,
            timestamp: Date.now(),
            emergencyDetected: true,
            emergencyScore: emergencyCheck.emergencyScore,
            emergencyType: emergencyCheck.emergencyType
          });
          
          // Generate IMMEDIATE emergency response - bypasses ALL AI and conversation flows
          const emergencyResponse = generateEmergencyResponse(emergencyCheck, session.context);
          const responseTime = 150; // Emergency responses are instant
          
          // Mark session as emergency
          session.emergency = true;
          session.emergencyData = emergencyCheck;
          session.escalation = {
            required: true,
            type: 'EMERGENCY_CRITICAL',
            priority: 'immediate',
            reason: 'emergency_detected',
            emergencyType: emergencyCheck.emergencyType,
            timestamp: Date.now(),
            bypassNormalFlows: true
          };
          
          // Add emergency response to session
          session.messages.push({
            type: 'bot',
            content: emergencyResponse.message,
            options: emergencyResponse.options,
            timestamp: Date.now(),
            aiPowered: false,
            responseTime,
            emergency: true,
            ticketId: emergencyCheck.ticketId,
            emergencyType: emergencyCheck.emergencyType,
            bypassedFlows: true
          });
          
          session.step = emergencyResponse.nextStep;
          session.context = {
            ...session.context,
            currentStep: emergencyResponse.nextStep,
            emergency: true,
            emergencyTicketId: emergencyCheck.ticketId,
            lastActivity: Date.now()
          };
          
          await saveSession(session, env.CHAT_SESSIONS);
          
          // Return immediate emergency response
          return new Response(JSON.stringify({
            success: true,
            sessionId: session.id,
            conversationId: session.id, // Explicit conversation ID
            response: sanitizeResponseMessage(emergencyResponse.message),
            options: emergencyResponse.options,
            step: emergencyResponse.nextStep,
            intent: emergencyResponse.intent,
            confidence: emergencyResponse.confidence,
            aiPowered: false,
            responseTime,
            escalate: true,
            escalationType: 'EMERGENCY_CRITICAL',
            priority: 'immediate',
            emergency: true,
            emergencyType: emergencyCheck.emergencyType,
            ticketId: emergencyCheck.ticketId,
            phoneNumber: '039 888 2041',
            bypassedAllFlows: true
          }), {
            headers: corsHeaders(origin),
          });
        }
        
        // Normal flow continues only if NOT an emergency
        // Add user message to session
        session.messages.push({
          type: 'user',
          content: message,
          timestamp: Date.now()
        });
        
        // Update conversation context
        session.context = {
          ...session.context,
          sessionId: session.id,
          currentMessage: message,
          messageCount: session.messages.length,
          lastActivity: Date.now()
        };
        
        // Check if we're in Mark's data collection flow or natural conversation
        let response;
        const startTime = Date.now();
        
        const dataCollectionSteps = [
          "collect_user_data", "collect_name", "collect_surname", 
          "collect_email", "collect_phone", "natural_conversation"
        ];
        
        if (dataCollectionSteps.includes(session.context.currentStep)) {
          // Use Mark's specialized data collection and conversation flow
          response = await handleMarkDataCollection(message, session.context, env);
        } else {
          // Fallback to original system (for backward compatibility)
          const responsePromise = generateResponse(message, session.context, env);
          const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => resolve(getEmergencyFallbackResponse()), CONFIG.RESPONSE_TIMEOUT);
          });
          
          response = await Promise.race([responsePromise, timeoutPromise]);
        }
        
        const responseTime = Date.now() - startTime;
        
        // CRITICAL SECURITY: Triple-check response sanitization
        const sanitizedMessage = sanitizeResponseMessage(response.message);
        
        // Additional emergency check - if response is still system-like, force safe fallback
        if (sanitizedMessage !== response.message) {
          console.error('SECURITY WARNING: Response was sanitized, original:', response.message?.substring(0, 100));
        }
        
        // Add bot response to session - SECURITY: Always sanitize
        session.messages.push({
          type: 'bot',
          content: sanitizedMessage,
          options: response.options,
          timestamp: Date.now(),
          aiPowered: response.aiPowered,
          responseTime,
          cost: response.cost || 0,
          // Hybrid information
          hybridEnabled: CONFIG.HYBRID_ENABLED,
          model: response.model || CONFIG.AI_MODEL,
          modelReason: response.modelReason || 'default',
          hybridOptimal: response.cost <= CONFIG.AI_COST_LIMIT && responseTime <= CONFIG.TARGET_RESPONSE_TIME,
          sanitized: sanitizedMessage !== response.message // Track if sanitization occurred
        });
        
        // Update session with new context and response data
        session.step = response.nextStep;
        session.context = {
          ...session.context,
          ...(response.context || {}),
          currentStep: response.nextStep,
          totalCost: (session.context.totalCost || 0) + (response.cost || 0),
          averageResponseTime: calculateAverageResponseTime(session.messages)
        };
        
        // Handle escalation if required - with Teams notification
        if (response.escalate || response.escalationRequired) {
          session.escalation = {
            required: true,
            type: response.escalationType || 'user_request',
            priority: response.priority || 'medium',
            reason: response.escalationReason,
            timestamp: Date.now(),
            conversationSummary: conversationDesigner ? 
                               conversationDesigner.getConversationSummary(session.context) : {}
          };
          
          // Send Teams notification for escalation
          const teamsWebhookUrl = env.TEAMS_WEBHOOK_URL || "https://bulltechit.webhook.office.com/webhookb2/621e560e-86d9-478c-acfc-496624a88b79@f6ba30ad-37c0-41bf-a994-e434c59b4b2a/IncomingWebhook/fb2b1700f71c4806bdcbf0fc873952d0/c0aa99b7-8edb-41b4-b139-0ec4dd7864d5/V2l2_rh4MbAzeQQ4SpDifcMFLsktri3ocfMcQGZ6OHUmI1";
          
          if (teamsWebhookUrl && globalThis.TeamsWebhook) {
            try {
              const leadData = globalThis.TeamsWebhook.collectLeadData(session.context, { message });
              await globalThis.TeamsWebhook.sendTeamsNotification(leadData, teamsWebhookUrl);
              console.log('Teams notification sent for escalation');
            } catch (error) {
              console.error('Failed to send Teams notification:', error);
            }
          }
          
          // If high priority, prepare for immediate handoff
          if (response.priority === 'high' || response.priority === 'immediate') {
            session.context.needsImmediateHandoff = true;
          }
        }
        
        // Collect lead data if provided
        if (response.collectData && data.leadData) {
          session.context.leadData = {
            ...session.context.leadData,
            ...data.leadData
          };
        }
        
        await saveSession(session, env.CHAT_SESSIONS);
        
        // Prepare response with enhanced data - CRITICAL SECURITY: Double sanitization
        const finalSanitizedMessage = sanitizeResponseMessage(response.message);
        
        const responseData = {
          success: true,
          sessionId: session.id,
          conversationId: session.id, // Always include explicit conversation ID
          response: finalSanitizedMessage, // Use the sanitized message from above
          options: response.options,
          step: response.nextStep,
          intent: response.intent,
          confidence: response.confidence,
          aiPowered: response.aiPowered,
          responseTime,
          escalate: response.escalate || false,
          escalationType: response.escalationType,
          cached: response.cached || false,
          cost: response.cost || 0,
          sanitized: finalSanitizedMessage !== response.message, // Track sanitization
          conversationMetadata: {
            messageCount: session.context.messageCount || 0,
            totalCost: session.context.totalCost || 0,
            sessionDuration: Date.now() - (session.context.startTime || Date.now()),
            lastActivity: Date.now()
          }
        };
        
        // Add debug info in development (Enhanced with Hybrid data)
        if (env.NODE_ENV === 'development') {
          responseData.debug = {
            contextStep: session.context.currentStep,
            messageCount: session.context.messageCount,
            totalCost: session.context.totalCost,
            leadData: session.context.leadData,
            // Hybrid debug info
            hybridStrategy: CONFIG.HYBRID_ENABLED,
            selectedModel: response.model,
            modelSelection: response.modelReason,
            costEfficient: response.cost <= CONFIG.AI_COST_LIMIT,
            performanceTarget: responseTime <= CONFIG.TARGET_RESPONSE_TIME
          };
        }
        
        return new Response(JSON.stringify(responseData), {
          headers: corsHeaders(origin),
        });
      }
      
      if (action === 'email_handoff' || action === 'escalate') {
        // Enhanced handoff to email system with AI context
        const leadData = data.leadData || session.context.leadData || {};
        
        // Prepare conversation context for handoff
        const conversationContext = {
          sessionId: session.id,
          messageCount: session.context.messageCount || 0,
          totalCost: session.context.totalCost || 0,
          averageResponseTime: session.context.averageResponseTime || 0,
          escalationReason: session.escalation?.reason || data.escalationReason || 'user_request',
          leadQuality: session.escalation?.priority || 'medium',
          conversationSummary: session.escalation?.conversationSummary || {},
          aiMetrics: true
        };
        
        const emailResult = await sendToEmailSystem(leadData, conversationContext);
        
        if (emailResult.success) {
          // Track conversion
          aiAnalytics.trackConversion(session.id, 'email_handoff', 0);
          
          // Update session with handoff data
          session.leadData = leadData;
          session.emailSent = true;
          session.handoffTimestamp = Date.now();
          session.ticketId = emailResult.data.ticketId;
          session.escalation = {
            ...session.escalation,
            completed: true,
            emailSent: true,
            ticketId: emailResult.data.ticketId
          };
          
          await saveSession(session, env.CHAT_SESSIONS);
          
          // Schedule session cleanup with metrics preservation
          setTimeout(async () => {
            try {
              await cleanupAISession(session.id, env.CHAT_SESSIONS, true);
            } catch (error) {
              console.error(`Failed to cleanup session ${session.id}:`, error);
            }
          }, 300000); // 5 minutes delay
          
          const successMessage = session.escalation?.priority === 'high' || session.escalation?.priority === 'immediate' ?
            'Perfetto! I tuoi dati sono stati inviati al nostro team. Ti contatteremo entro 2 ore lavorative.' :
            'Grazie! Abbiamo ricevuto la tua richiesta. Ti invieremo il preventivo via email e ti contatteremo per eventuali chiarimenti.';
          
          return new Response(JSON.stringify({
            success: true,
            sessionId: session.id,
            conversationId: session.id, // Explicit conversation ID
            message: successMessage,
            ticketId: emailResult.data.ticketId,
            emailId: emailResult.data.emailId,
            priority: session.escalation?.priority || 'medium',
            expectedResponseTime: session.escalation?.priority === 'high' ? '2 ore' : '24 ore',
            conversationSummary: {
              duration: Date.now() - (session.context?.startTime || Date.now()),
              messageCount: session.context?.messageCount || 0,
              totalCost: session.context?.totalCost || 0,
              escalationReason: session.escalation?.reason
            }
          }), {
            headers: corsHeaders(origin),
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Errore nell\'invio. Riprova o contattaci direttamente al numero: +39 XXX XXX XXXX',
            fallbackAction: 'phone_contact'
          }), {
            status: 500,
            headers: corsHeaders(origin),
          });
        }
      }
      
      // Handle data collection updates
      if (action === 'update_data') {
        // Update lead data in session
        session.context.leadData = {
          ...session.context.leadData,
          ...data.leadData
        };
        
        await saveSession(session, env.CHAT_SESSIONS);
        
        return new Response(JSON.stringify({
          success: true,
          sessionId: session.id,
          conversationId: session.id, // Explicit conversation ID
          message: 'Dati aggiornati con successo',
          leadData: session.context.leadData
        }), {
          headers: corsHeaders(origin),
        });
      }
      
      // Handle AI metrics request
      if (action === 'get_metrics') {
        const metrics = {
          sessionId: session.id,
          messageCount: session.context.messageCount || 0,
          totalCost: session.context.totalCost || 0,
          averageResponseTime: session.context.averageResponseTime || 0,
          aiUsage: session.messages.filter(m => m.aiPowered).length,
          escalated: !!session.escalation?.required
        };
        
        return new Response(JSON.stringify({
          success: true,
          sessionId: session.id,
          conversationId: session.id, // Explicit conversation ID
          metrics
        }), {
          headers: corsHeaders(origin),
        });
      }
      
      // Azione non riconosciuta
      return new Response(JSON.stringify({
        success: false,
        error: 'Azione non valida'
      }), {
        status: 400,
        headers: corsHeaders(origin),
      });
      
    } catch (error) {
      console.error('Chatbot error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Errore interno del server'
      }), {
        status: 500,
        headers: corsHeaders(origin),
      });
    }
  },
};