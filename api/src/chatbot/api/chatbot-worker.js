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

// Genera session ID univoco
function generateSessionId() {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

// Gestione sessione conversazione
async function getOrCreateSession(sessionId, CHAT_SESSIONS) {
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  
  let session = await CHAT_SESSIONS.get(sessionId);
  
  if (!session) {
    session = {
      id: sessionId,
      created: Date.now(),
      messages: [],
      context: {},
      step: "greeting",
      leadData: {}
    };
  } else {
    session = JSON.parse(session);
  }
  
  return session;
}

// Salva sessione
async function saveSession(session, CHAT_SESSIONS) {
  await CHAT_SESSIONS.put(session.id, JSON.stringify(session), {
    expirationTtl: CONFIG.MAX_SESSION_DURATION
  });
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
    return "[IT-ERA] Ciao, come posso aiutarti?";
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
      return "[IT-ERA] Ciao, come posso aiutarti?";
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
      return "[IT-ERA] Ciao, come posso aiutarti?";
    }
  }

  // Additional check: if message contains typical AI system prompt structure
  if (message.includes('🎯') && message.includes('📍') && message.includes('AZIENDA:')) {
    console.error('SECURITY ALERT: AI system prompt structure detected');
    return "[IT-ERA] Ciao, come posso aiutarti?";
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
      return "[IT-ERA] Ciao, come posso aiutarti?";
    }
  }

  return message;
}

// OPTIMIZED greeting generator with aggressive caching
async function generateOptimizedGreeting(context, env) {
  try {
    // SECURITY FIRST: Always return sanitized greeting without AI generation
    const safeGreeting = "[IT-ERA] Ciao, come posso aiutarti?";
    
    // Check cache first for instant response
    const cacheKey = `greeting_${context.userAgent || 'default'}`;
    if (env.CHAT_SESSIONS) {
      const cached = await env.CHAT_SESSIONS.get(cacheKey);
      if (cached) {
        const cachedResponse = JSON.parse(cached);
        // SECURITY: Always sanitize cached responses and ensure safe greeting
        cachedResponse.message = safeGreeting;
        return {
          ...cachedResponse,
          cached: true,
          responseTime: 50 // Near-instant
        };
      }
    }
    
    // Generate optimized greeting - NEVER use AI for greeting, always static safe message
    const greetingResponse = {
      message: safeGreeting, // Hard-coded safe greeting, never from AI
      options: ["Richiedi Preventivo", "Assistenza Tecnica", "Informazioni Servizi", "Contatta Specialista"],
      nextStep: "service_selection",
      intent: "greeting",
      confidence: 1.0,
      aiPowered: false,
      priority: "high",
      secure: true // Mark as security-verified
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
    console.error('Optimized greeting error:', error);
    // FALLBACK: Always return the same safe greeting
    return {
      message: "[IT-ERA] Ciao, come posso aiutarti?",
      options: ["Preventivo", "Assistenza", "Informazioni"],
      nextStep: "service_selection",
      aiPowered: false,
      secure: true
    };
  }
}

// Session cleanup for AI data
async function cleanupAISession(sessionId, CHAT_SESSIONS) {
  try {
    const session = await CHAT_SESSIONS.get(sessionId);
    if (!session) return;
    
    const sessionData = JSON.parse(session);
    
    // Log final metrics
    if (sessionData.context) {
      console.log(`Session ${sessionId} completed:`, {
        messageCount: sessionData.context.messageCount,
        totalCost: sessionData.context.totalCost,
        averageResponseTime: sessionData.context.averageResponseTime,
        escalated: !!sessionData.escalation
      });
    }
    
    // Clean up the session
    await CHAT_SESSIONS.delete(sessionId);
    
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
}

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
    
    // Health check with Hybrid AI system status
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
      
      // Get or create session
      let session = await getOrCreateSession(sessionId, env.CHAT_SESSIONS);
      
      // Handle different actions
      if (action === 'start') {
        // Initialize conversation with AI-powered greeting
        session.context = {
          sessionId: session.id,
          currentStep: 'greeting',
          messageCount: 0,
          totalCost: 0,
          startTime: Date.now()
        };
        
        // OPTIMIZED greeting with cache
        const response = await generateOptimizedGreeting(session.context, env);
        
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
          response: startupMessage,
          options: response.options,
          step: response.nextStep,
          aiPowered: response.aiPowered,
          secure: startupMessage === "[IT-ERA] Ciao, come posso aiutarti?" // Confirm safe greeting
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
        
        // Generate enhanced AI response with timeout handling
        const startTime = Date.now();
        const responsePromise = generateResponse(message, session.context, env);
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve(getEmergencyFallbackResponse()), CONFIG.RESPONSE_TIMEOUT);
        });
        
        const response = await Promise.race([responsePromise, timeoutPromise]);
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
          sanitized: finalSanitizedMessage !== response.message // Track sanitization
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
          
          // Schedule session cleanup
          setTimeout(() => {
            cleanupAISession(session.id, env.CHAT_SESSIONS);
          }, 300000); // 5 minutes delay
          
          const successMessage = session.escalation?.priority === 'high' || session.escalation?.priority === 'immediate' ?
            'Perfetto! I tuoi dati sono stati inviati al nostro team. Ti contatteremo entro 2 ore lavorative.' :
            'Grazie! Abbiamo ricevuto la tua richiesta. Ti invieremo il preventivo via email e ti contatteremo per eventuali chiarimenti.';
          
          return new Response(JSON.stringify({
            success: true,
            message: successMessage,
            ticketId: emailResult.data.ticketId,
            emailId: emailResult.data.emailId,
            priority: session.escalation?.priority || 'medium',
            expectedResponseTime: session.escalation?.priority === 'high' ? '2 ore' : '24 ore'
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