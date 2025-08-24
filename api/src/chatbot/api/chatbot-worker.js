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
  EMAIL_API_ENDPOINT: 'https://it-era-email.bulltech.workers.dev/api/contact',
  
  // Performance settings
  RESPONSE_TIMEOUT: 8000, // 8 seconds max response time
  FALLBACK_TIMEOUT: 2000, // 2 seconds before fallback
  
  // CORS settings
  ALLOWED_ORIGINS: [
    'https://www.it-era.it',
    'https://it-era.it', 
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

// Initialize AI systems with Hybrid Strategy
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
      hybridEnabled: CONFIG.HYBRID_ENABLED
    });
    
    await openRouterEngine.initialize(env);
    console.log('✅ Hybrid OpenRouter Engine initialized');
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

// Emergency fallback response
function getEmergencyFallbackResponse() {
  return {
    message: "Scusa, sto avendo alcuni problemi tecnici. Ti metto subito in contatto con un nostro consulente che ti assisterà al meglio.",
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
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    
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
        
        const response = await generateResponse('start', session.context, env);
        
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
        
        return new Response(JSON.stringify({
          success: true,
          sessionId: session.id,
          response: response.message,
          options: response.options,
          step: response.nextStep,
          aiPowered: response.aiPowered
        }), {
          headers: corsHeaders(origin),
        });
      }
      
      if (action === 'message' && message) {
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
        
        // Add bot response to session
        session.messages.push({
          type: 'bot',
          content: response.message,
          options: response.options,
          timestamp: Date.now(),
          aiPowered: response.aiPowered,
          responseTime,
          cost: response.cost || 0,
          // Hybrid information
          hybridEnabled: CONFIG.HYBRID_ENABLED,
          model: response.model || CONFIG.AI_MODEL,
          modelReason: response.modelReason || 'default',
          hybridOptimal: response.cost <= CONFIG.AI_COST_LIMIT && responseTime <= CONFIG.TARGET_RESPONSE_TIME
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
        
        // Prepare response with enhanced data
        const responseData = {
          success: true,
          sessionId: session.id,
          response: response.message,
          options: response.options,
          step: response.nextStep,
          intent: response.intent,
          confidence: response.confidence,
          aiPowered: response.aiPowered,
          responseTime,
          escalate: response.escalate || false,
          escalationType: response.escalationType,
          cached: response.cached || false,
          cost: response.cost || 0
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