/**
 * IT-ERA AI-Powered Chatbot API Worker
 * Enhanced Cloudflare Worker with AI integration, advanced conversation flows,
 * and intelligent lead qualification system
 */

import AIIntegrationEngine from '../../ai-engine/ai-integration.js';
import ConversationDesigner from '../../conversation-flows/conversation-designer.js';
import { ITERAKnowledgeBase, KnowledgeUtils } from '../../knowledge-base/it-era-knowledge.js';

const CONFIG = {
  // AI Settings
  AI_PROVIDER: 'openai', // 'openai' or 'anthropic'
  AI_MODEL: 'gpt-4o-mini', // Cost-effective model
  AI_MAX_TOKENS: 150,
  AI_TEMPERATURE: 0.7,
  AI_COST_LIMIT: 0.10, // $0.10 per conversation
  AI_CACHE_TTL: 3600, // 1 hour response cache
  
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

// Initialize AI and Conversation systems
let aiEngine = null;
let conversationDesigner = null;

// Initialize AI systems
async function initializeAI(env) {
  if (!aiEngine) {
    aiEngine = new AIIntegrationEngine({
      provider: CONFIG.AI_PROVIDER,
      model: CONFIG.AI_MODEL,
      maxTokens: CONFIG.AI_MAX_TOKENS,
      temperature: CONFIG.AI_TEMPERATURE,
      costLimit: CONFIG.AI_COST_LIMIT,
      language: 'italian'
    });
    
    await aiEngine.initializeProvider(env);
  }
  
  if (!conversationDesigner) {
    conversationDesigner = new ConversationDesigner({
      maxConversationLength: CONFIG.MAX_MESSAGES_PER_SESSION,
      escalationThreshold: 0.7,
      leadQualificationScore: 0.8,
      language: 'italian'
    });
  }
  
  return { aiEngine, conversationDesigner };
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

// Enhanced AI-powered response generation
async function generateResponse(message, context = {}, env) {
  try {
    const sessionId = context.sessionId || 'unknown';
    
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
        
        // Process through conversation designer
        const flowResponse = await conversationDesigner.processMessage(
          message, context, aiResponse
        );
        
        return {
          ...flowResponse,
          aiPowered: true,
          cost: aiResponse.cost || 0,
          cached: aiResponse.cached || false
        };
        
      } catch (aiError) {
        console.warn('AI generation failed, using fallback:', aiError);
        return await generateFallbackResponse(message, context, conversationDesigner);
      }
    } else {
      // Use conversation flows only
      return await generateFallbackResponse(message, context, conversationDesigner);
    }
    
  } catch (error) {
    console.error('Response generation error:', error);
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
async function generateFallbackResponse(message, context, conversationDesigner) {
  const response = await conversationDesigner.processMessage(message, context);
  
  return {
    ...response,
    aiPowered: false,
    fallbackUsed: true,
    cost: 0
  };
}

// Determine if AI should be used
function shouldUseAI(context, env) {
  // Don't use AI if no API keys
  if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
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

// Integrazione con sistema email
async function sendToEmailSystem(leadData) {
  try {
    const emailData = {
      nome: leadData.nome || 'Lead da Chat',
      email: leadData.email || '',
      telefono: leadData.telefono || '',
      azienda: leadData.azienda || '',
      comune: leadData.comune || '',
      dipendenti: leadData.dipendenti || '',
      servizi: leadData.servizi || [],
      urgenza: leadData.urgenza || 'normale',
      messaggio: leadData.messaggio || '',
      formType: 'chatbot-lead',
      privacy: true // Consenso dato in chat
    };
    
    const response = await fetch(CONFIG.EMAIL_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });
    
    const result = await response.json();
    return { success: response.ok, data: result };
    
  } catch (error) {
    console.error('Email integration error:', error);
    return { success: false, error: error.message };
  }
}

// Main worker handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    
    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'IT-ERA Chatbot API',
        provider: 'Cloudflare Workers',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
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
          aiPowered: response.aiPowered
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
          cost: response.cost || 0
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
        
        // Handle escalation if required
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
        
        // Add debug info in development
        if (env.NODE_ENV === 'development') {
          responseData.debug = {
            contextStep: session.context.currentStep,
            messageCount: session.context.messageCount,
            totalCost: session.context.totalCost,
            leadData: session.context.leadData
          };
        }
        
        return new Response(JSON.stringify(responseData), {
          headers: corsHeaders(origin),
        });
      }
      
      if (action === 'email_handoff') {
        // Handoff al sistema email
        const emailResult = await sendToEmailSystem(data.leadData);
        
        if (emailResult.success) {
          session.leadData = data.leadData;
          session.emailSent = true;
          session.ticketId = emailResult.data.ticketId;
          
          await saveSession(session, env.CHAT_SESSIONS);
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Perfetto! I tuoi dati sono stati inviati al nostro team.',
            ticketId: emailResult.data.ticketId,
            emailId: emailResult.data.emailId
          }), {
            headers: corsHeaders(origin),
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Errore nell\'invio. Riprova o contattaci direttamente.'
          }), {
            status: 500,
            headers: corsHeaders(origin),
          });
        }
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