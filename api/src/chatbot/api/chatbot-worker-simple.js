/**
 * IT-ERA AI-Enhanced Chatbot API Worker  
 * Integrazione AI con fallback a knowledge base e Teams webhook
 */

// Import knowledge base reale IT-ERA
import { ITERAKnowledgeBase, KnowledgeUtils } from '../../knowledge-base/it-era-knowledge-real.js';
// Import AI Integration Engine
import AIIntegrationEngine from '../../ai-engine/ai-integration.js';
// Import Swarm Integration Layer
import { ChatbotSwarmIntegration } from '../swarm/chatbot-swarm-integration.js';

const CONFIG = {
  // Chat settings
  MAX_SESSION_DURATION: 3600, // 1 hour
  MAX_MESSAGES_PER_SESSION: 25,
  RATE_LIMIT_MESSAGES: 60, // messages/hour per IP
  
  // AI settings
  AI_TIMEOUT: 8000, // 8 seconds max
  AI_MAX_RETRIES: 2,
  AI_COST_LIMIT: 0.10, // €0.10 per conversation
  AI_ENABLED: true, // Can be disabled via env var
  
  // Email integration
  EMAIL_API_ENDPOINT: 'https://it-era-email.bulltech.workers.dev/api/contact',
  
  // CORS settings
  ALLOWED_ORIGINS: [
    'https://it-era.pages.dev',
    'https://www.it-era.it',
    'https://it-era.it', 
    'https://bulltech.it',
    'https://www.bulltech.it',
    'http://localhost:3000',
    'http://localhost:8788',
    'http://127.0.0.1:5500'
  ],
};

// Global AI engine instance
let aiEngine = null;
// Global Swarm Integration instance
let swarmIntegration = null;

// CORS headers
const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
});

// Generate session ID
function generateSessionId() {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Simple intent classification
function classifyIntent(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('preventivo') || msg.includes('prezzo') || msg.includes('costo') || msg.includes('quanto costa')) {
    return { intent: 'preventivo', confidence: 0.9, escalate: true };
  }
  if (msg.includes('emergenza') || msg.includes('urgente') || msg.includes('server down') || msg.includes('malware')) {
    return { intent: 'emergenza', confidence: 0.9, escalate: true };
  }
  if (msg.includes('sicurezza') || msg.includes('firewall') || msg.includes('watchguard')) {
    return { intent: 'sicurezza', confidence: 0.8, escalate: false };
  }
  if (msg.includes('assistenza') || msg.includes('supporto') || msg.includes('aiuto') || msg.includes('problema')) {
    return { intent: 'supporto', confidence: 0.8, escalate: false };
  }
  if (msg.includes('backup') || msg.includes('recovery') || msg.includes('dati')) {
    return { intent: 'backup', confidence: 0.8, escalate: false };
  }
  if (msg.includes('riparazione') || msg.includes('pc') || msg.includes('mac') || msg.includes('laptop')) {
    return { intent: 'riparazione', confidence: 0.8, escalate: false };
  }
  if (msg.includes('contatti') || msg.includes('telefono') || msg.includes('email') || msg.includes('dove siete')) {
    return { intent: 'contatti', confidence: 0.8, escalate: false };
  }
  
  return { intent: 'generale', confidence: 0.5, escalate: false };
}

// Get default options based on intent
function getDefaultOptions(intent) {
  const defaultOptions = {
    'firewall': ["🛡️ Modelli WatchGuard", "💰 Richiedi preventivo", "📞 Consulenza gratuita"],
    'backup': ["☁️ Backup cloud", "🔄 Disaster recovery", "💰 Preventivo"],
    'preventivo': ["📋 Compila richiesta", "📞 Chiama ora", "📧 Invia email"],
    'supporto': ["💻 Assistenza remota", "🏢 Intervento on-site", "📋 Contratto manutenzione"],
    'urgente': ["📞 Chiama ora: 039 888 2041", "💥 Descrivi il problema", "🚨 Richiedi intervento"],
    'sicurezza': ["🛡️ Firewall", "🦠 Antivirus", "🔍 Security audit"],
    'generale': ["💼 Servizi IT-ERA", "🔒 Sicurezza", "💻 Assistenza", "💰 Preventivo"]
  };
  
  return defaultOptions[intent] || defaultOptions['generale'];
}

// Enhanced response generation with AI integration
async function generateResponse(message, intent, context = {}, env = null, sessionId = null) {
  // Try Swarm first if available
  if (swarmIntegration && env && sessionId) {
    try {
      console.log('🐝 Attempting swarm orchestration...');
      const swarmResponse = await swarmIntegration.processMessage(sessionId, message, {
        messages: context.messages || [],
        context: context,
        intent: intent
      });
      
      if (swarmResponse && swarmResponse.response) {
        console.log('✅ Swarm response generated successfully');
        return {
          message: swarmResponse.response,
          options: swarmResponse.suggestedActions || getDefaultOptions(intent),
          source: 'swarm',
          fallback: false,
          metadata: swarmResponse.metadata,
          leadScore: swarmResponse.leadScore
        };
      }
    } catch (error) {
      console.warn('Swarm orchestration failed, falling back to AI:', error.message);
    }
  }
  
  // Try AI if swarm not available or failed
  if (CONFIG.AI_ENABLED && aiEngine && env) {
    try {
      const aiResponse = await generateAIResponseWithTimeout(message, context, sessionId);
      if (aiResponse && aiResponse.message) {
        console.log('AI response generated successfully');
        return {
          ...aiResponse,
          source: 'ai',
          fallback: false
        };
      }
    } catch (error) {
      console.warn('AI generation failed, falling back to rule-based:', error.message);
    }
  }
  
  // Fallback to existing rule-based logic
  const fallbackResponse = generateFallbackResponse(message, intent, context);
  return {
    ...fallbackResponse,
    source: 'fallback',
    fallback: true
  };
}

// AI response generation with timeout and retry
async function generateAIResponseWithTimeout(message, context, sessionId) {
  let lastError;
  
  for (let attempt = 1; attempt <= CONFIG.AI_MAX_RETRIES; attempt++) {
    try {
      console.log(`AI attempt ${attempt}/${CONFIG.AI_MAX_RETRIES}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.AI_TIMEOUT);
      
      const aiPromise = aiEngine.generateResponse(message, {
        ...context,
        sessionId,
        attempt,
        company: 'IT-ERA',
        location: 'Vimercate, Lombardia',
        phone: '039 888 2041',
        email: 'info@it-era.it'
      }, sessionId);
      
      const response = await Promise.race([
        aiPromise,
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error(`AI timeout after ${CONFIG.AI_TIMEOUT}ms`));
          });
        })
      ]);
      
      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      lastError = error;
      console.warn(`AI attempt ${attempt} failed:`, error.message);
      
      if (attempt < CONFIG.AI_MAX_RETRIES) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
}

// Original rule-based response generation (renamed for clarity)
function generateFallbackResponse(message, intent, context = {}) {
  switch (intent) {
    case 'preventivo':
      return {
        message: `💰 **Preventivo Personalizzato GRATUITO**

Per fornirti un preventivo preciso, raccogli queste informazioni:
• Che servizio ti serve?
• Quante postazioni/PC hai?
• In che zona sei?

📞 **Contattaci direttamente:**
• **Telefono:** 039 888 2041
• **Email:** info@it-era.it
• **Sede:** Viale Risorgimento 32, Vimercate (MB)

✅ **Sopralluogo sempre GRATUITO e senza impegno**
✅ **Partner WatchGuard certificato**
✅ **10+ anni esperienza Brianza**

*Ti ricontatteremo entro 24 ore per organizzare il sopralluogo.*`,
        options: [
          "📞 Chiamate subito",
          "📧 Inviate email", 
          "🏢 Sopralluogo gratuito",
          "🔒 Preventivo sicurezza",
          "🛠️ Preventivo assistenza"
        ],
        escalate: true,
        priority: 'medium'
      };
      
    case 'emergenza':
      return {
        message: `🚨 **EMERGENZA IT - Intervento Immediato**

**📞 CHIAMA SUBITO: 039 888 2041**

⚡ **Interveniamo rapidamente per:**
• Server down o sistemi bloccanti
• Attacchi malware/ransomware
• Perdita dati critica
• Problemi rete aziendale

⏱️ **Tempi di intervento:**
• **Zona Vimercate/Monza:** 2-4 ore
• **Clienti con contratto:** Priorità assoluta
• **Weekend/sera:** Maggiorazione 30-50%

*Reperibilità attiva per emergenze!*`,
        options: [
          "📞 Chiama ora: 039 888 2041",
          "💥 Server down", 
          "🦠 Attacco malware",
          "💾 Perdita dati",
          "🌐 Rete non funziona"
        ],
        escalate: true,
        priority: 'high'
      };
      
    case 'sicurezza':
      return {
        message: `🔒 **Sicurezza Informatica - La nostra specializzazione**

**🛡️ Partner WatchGuard Certificato**
• Firewall next-generation per PMI
• VPN aziendali sicure
• Web filtering e controllo accessi
• Monitoraggio sicurezza 24/7
• **Da €2.500** (firewall completo)

**🦠 Protezione Antivirus Enterprise**
• Gestione centralizzata multi-postazione
• Protezione email e server
• **Da €8/postazione/mese**

**🔍 Security Assessment**
• Audit vulnerabilità completo
• Test penetration di base
• **€1.200 - €3.000**

Per un preventivo preciso → **Sopralluogo GRATUITO**`,
        options: [
          "🛡️ Firewall WatchGuard",
          "🦠 Antivirus aziendale",
          "🔍 Audit sicurezza",
          "💰 Preventivo gratuito"
        ]
      };
      
    case 'supporto':
      return {
        message: `🛠️ **Assistenza IT Professionale - 10+ anni esperienza**

**💻 Assistenza Remota**
• Supporto sicuro da remoto
• Risoluzione problemi software
• **€80-100/ora** - Lun-Ven 8:30-18:00

**🏢 Interventi On-Site**
• Assistenza presso la tua sede  
• Installazione hardware/software
• **€120-150/ora** + trasferta
• **Zona Brianza: stesso giorno**

**📋 Contratti Manutenzione**
• Manutenzione preventiva
• Priorità negli interventi
• **Da €200/mese per 5 PC**

La **prima consulenza è sempre GRATUITA!**`,
        options: [
          "💻 Assistenza remota",
          "🏢 Intervento in sede", 
          "📋 Contratto manutenzione",
          "💰 Consulenza gratuita"
        ]
      };
      
    case 'backup':
      return {
        message: `💾 **Backup e Disaster Recovery**

**☁️ Backup Cloud Automatizzato**
• Backup incrementale sicuro
• Crittografia end-to-end
• Test recovery mensili
• **Da €50/mese per 100GB**

**🔄 Disaster Recovery Plan**
• Piano continuità operativa
• RTO/RPO definiti
• Procedure recovery documentate
• **Preventivo su progetto**

**📊 Assessment Dati GRATUITO**
• Analisi dati critici
• Identificazione vulnerabilità
• Piano backup personalizzato

*Non rischiare di perdere anni di lavoro!*`,
        options: [
          "☁️ Backup cloud",
          "🔄 Disaster recovery",
          "📊 Assessment gratuito",
          "💰 Preventivo backup"
        ]
      };
      
    case 'riparazione':
      return {
        message: `🔧 **Riparazione Hardware Certificata**

**💻 PC Desktop e Laptop**
• Tutte le marche (HP, Dell, Lenovo...)
• **Diagnosi GRATUITA** on-site
• Ricambi originali certificati
• **Da €50 + ricambi**

**🍎 Assistenza Mac**
• iMac, Mac Pro, MacBook
• Riparazioni certificate Apple
• Recupero dati specializzato

**🖥️ Server Hardware**
• Server rack e tower
• Storage NAS/SAN
• **Contratti manutenzione**

**Interventi rapidi:**
• **Vimercate/Monza:** 2-4 ore
• **Brianza:** Stesso giorno`,
        options: [
          "💻 Riparazione PC",
          "🍎 Assistenza Mac",
          "🖥️ Server hardware",
          "🔍 Diagnosi gratuita"
        ]
      };
      
    case 'contatti':
      return {
        message: `📞 **Contatti IT-ERA**

**🏢 Sede Principale:**
Viale Risorgimento, 32
20871 Vimercate (MB)

**📞 Telefono:** 039 888 2041
**📧 Email:** info@it-era.it
**🌐 Sito:** www.it-era.it

**⏰ Orari:**
• **Ufficio:** Lun-Ven 8:30-18:00
• **Assistenza:** Lun-Ven 8:30-18:00
• **Emergenze:** Reperibilità per clienti

**🚗 Zona di servizio:**
• **Primaria:** Vimercate, Monza, Agrate, Concorezzo
• **Secondaria:** Milano Est, Bergamo Ovest
• **Remota:** Tutta Italia`,
        options: [
          "📞 Chiama: 039 888 2041",
          "📧 Email: info@it-era.it",
          "🗺️ Come raggiungerci",
          "💰 Preventivo gratuito"
        ]
      };
      
    default:
      return {
        message: `👋 **Ciao! Sono l'assistente virtuale IT-ERA**

**IT-ERA è il brand di Bulltech** specializzato in servizi IT per aziende della Brianza.

🏢 **Siamo a Vimercate (MB)** con oltre 10 anni di esperienza.

**Come posso aiutarti oggi?**`,
        options: [
          "🔒 Sicurezza informatica",
          "🛠️ Assistenza IT",
          "💾 Backup e recovery", 
          "🔧 Riparazione hardware",
          "💰 Preventivo gratuito",
          "📞 Contatti"
        ]
      };
  }
}

// Teams webhook notification
async function sendTeamsNotification(leadData, webhookUrl) {
  if (!webhookUrl) return false;
  
  try {
    const priority = leadData.urgenza === 'emergenza' ? 'EMERGENZA' : 'NORMALE';
    const color = leadData.urgenza === 'emergenza' ? '#ff0000' : '#ff6b35';
    const title = leadData.urgenza === 'emergenza' ? 
      '🚨 EMERGENZA IT - Intervento Urgente' : 
      '🔔 Nuovo Lead - Preventivo Richiesto';
    
    const message = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": color,
      "summary": title,
      "sections": [{
        "activityTitle": title,
        "activitySubtitle": `Richiesta dal chatbot IT-ERA - ${new Date().toLocaleString('it-IT')}`,
        "facts": [
          { "name": "Cliente", "value": `${leadData.nome} (${leadData.email})` },
          { "name": "Telefono", "value": leadData.telefono || 'Non fornito' },
          { "name": "Azienda", "value": leadData.azienda || 'Non specificata' },
          { "name": "Zona", "value": leadData.zona || 'Da determinare' },
          { "name": "Servizio", "value": leadData.servizio || 'Consulenza generica' },
          { "name": "Priorità", "value": priority },
          { "name": "Dettagli", "value": leadData.messaggio || 'Richiesta dal chatbot' }
        ]
      }],
      "potentialAction": [{
        "@type": "ActionCard",
        "name": "Azioni Rapide",
        "actions": [{
          "@type": "OpenUri",
          "name": "📞 Chiama Cliente",
          "targets": [{ "os": "default", "uri": `tel:${leadData.telefono}` }]
        }, {
          "@type": "OpenUri", 
          "name": "📧 Invia Email",
          "targets": [{ "os": "default", "uri": `mailto:${leadData.email}?subject=IT-ERA - ${leadData.servizio}` }]
        }]
      }]
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Teams webhook error:', error);
    return false;
  }
}

// Session management
async function getOrCreateSession(sessionId, CHAT_SESSIONS) {
  if (!sessionId || !CHAT_SESSIONS) {
    sessionId = generateSessionId();
    return {
      id: sessionId,
      created: Date.now(),
      messages: [],
      context: {},
      step: "greeting"
    };
  }
  
  try {
    let session = await CHAT_SESSIONS.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        created: Date.now(),
        messages: [],
        context: {},
        step: "greeting"
      };
    } else {
      session = JSON.parse(session);
    }
    return session;
  } catch (error) {
    console.error('Session error:', error);
    return {
      id: sessionId,
      created: Date.now(),
      messages: [],
      context: {},
      step: "greeting"
    };
  }
}

async function saveSession(session, CHAT_SESSIONS) {
  if (!CHAT_SESSIONS) return;
  
  try {
    await CHAT_SESSIONS.put(session.id, JSON.stringify(session), {
      expirationTtl: CONFIG.MAX_SESSION_DURATION
    });
  } catch (error) {
    console.error('Save session error:', error);
  }
}

// Rate limiting
async function checkRateLimit(ip, CHAT_SESSIONS) {
  if (!CHAT_SESSIONS) return true;
  
  try {
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
  } catch (error) {
    console.error('Rate limit error:', error);
    return true; // Allow on error
  }
}

// Initialize AI engine and Swarm if available
async function initializeAI(env) {
  // Initialize Swarm Integration first (if enabled)
  const swarmEnabled = env.SWARM_ENABLED !== 'false';
  if (swarmEnabled) {
    try {
      if (!swarmIntegration) {
        swarmIntegration = new ChatbotSwarmIntegration(env);
        console.log('🐝 Swarm integration initialized successfully');
        console.log(`📊 A/B Test: ${swarmIntegration.abTestEnabled ? 'Enabled' : 'Disabled'}`);
        console.log(`📈 Swarm Traffic: ${swarmIntegration.swarmPercentage}%`);
      }
    } catch (error) {
      console.error('Failed to initialize swarm integration:', error);
      // Continue without swarm
    }
  }
  
  // Initialize traditional AI engine
  if (!CONFIG.AI_ENABLED) {
    console.log('AI integration disabled by config');
    return;
  }
  
  try {
    if (!aiEngine) {
      aiEngine = new AIIntegrationEngine({
        provider: 'openai', // Default to OpenAI
        model: 'gpt-4o-mini', // Cost-effective model
        maxTokens: 150,
        temperature: 0.7,
        language: 'italian',
        costLimit: CONFIG.AI_COST_LIMIT
      });
    }
    
    await aiEngine.initializeProvider(env);
    console.log(`AI engine initialized successfully - Provider: ${aiEngine.config.provider}, Model: ${aiEngine.config.model}`);
    
  } catch (error) {
    console.warn('AI initialization failed:', error.message);
    console.log('Chatbot will operate in fallback mode only');
    aiEngine = null;
  }
}

// Main worker handler
export default {
  async fetch(request, env, ctx) {
    // Initialize AI engine on first request
    if (CONFIG.AI_ENABLED && !aiEngine) {
      await initializeAI(env);
    }
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    
    // Health check with AI status
    if (url.pathname === '/health') {
      const healthData = {
        status: 'ok',
        service: 'IT-ERA AI-Enhanced Chatbot API',
        provider: 'Cloudflare Workers',
        timestamp: new Date().toISOString(),
        version: '2.0',
        ai: {
          enabled: CONFIG.AI_ENABLED,
          initialized: !!aiEngine,
          provider: aiEngine?.config?.provider || 'none',
          model: aiEngine?.config?.model || 'none',
          costLimit: CONFIG.AI_COST_LIMIT,
          timeout: CONFIG.AI_TIMEOUT
        },
        features: {
          teamsWebhook: !!env.TEAMS_WEBHOOK_URL,
          rateLimit: !!env.CHAT_SESSIONS,
          fallbackMode: !aiEngine
        }
      };
      
      if (aiEngine) {
        try {
          healthData.ai.stats = aiEngine.getUsageStats();
        } catch (error) {
          healthData.ai.statsError = error.message;
        }
      }
      
      return new Response(JSON.stringify(healthData), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // AI diagnostics endpoint
    if (url.pathname === '/api/ai-diagnostics' && request.method === 'GET') {
      if (!aiEngine) {
        return new Response(JSON.stringify({
          error: 'AI engine not initialized',
          fallbackMode: true
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        status: 'operational',
        provider: aiEngine.config.provider,
        model: aiEngine.config.model,
        usage: aiEngine.getUsageStats(),
        config: {
          maxTokens: aiEngine.config.maxTokens,
          temperature: aiEngine.config.temperature,
          costLimit: aiEngine.config.costLimit,
          timeout: CONFIG.AI_TIMEOUT,
          maxRetries: CONFIG.AI_MAX_RETRIES
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(origin),
      });
    }
    
    // Handle allowed endpoints
    const allowedEndpoints = ['/api/chat', '/api/ai-diagnostics'];
    if (request.method === 'POST' && url.pathname === '/api/chat') {
      // Continue to chat logic
    } else if (request.method === 'GET' && url.pathname === '/api/ai-diagnostics') {
      // Already handled above
    } else {
      return new Response(JSON.stringify({
        error: 'Method not allowed',
        message: 'Use POST /api/chat or GET /api/ai-diagnostics',
        availableEndpoints: [
          'GET /health - Service health check',
          'POST /api/chat - Chat interface', 
          'GET /api/ai-diagnostics - AI status'
        ]
      }), {
        status: 405,
        headers: corsHeaders(origin),
      });
    }
    
    // Chat endpoint logic
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
      
      // Handle start action
      if (action === 'start') {
        const welcomeResponse = await generateResponse('', 'generale', {}, env, session.id);
        
        session.messages.push({
          type: 'bot',
          content: welcomeResponse.message,
          options: welcomeResponse.options,
          timestamp: Date.now()
        });
        
        session.context = {
          sessionId: session.id,
          currentStep: 'greeting',
          messageCount: 1,
          startTime: Date.now()
        };
        
        await saveSession(session, env.CHAT_SESSIONS);
        
        return new Response(JSON.stringify({
          success: true,
          sessionId: session.id,
          response: welcomeResponse.message,
          options: welcomeResponse.options,
          step: 'greeting'
        }), {
          headers: corsHeaders(origin),
        });
      }
      
      // Handle message
      if (action === 'message' && message) {
        // Add user message
        session.messages.push({
          type: 'user',
          content: message,
          timestamp: Date.now()
        });
        
        // Classify intent and generate response (with AI if available)
        const classification = classifyIntent(message);
        const response = await generateResponse(message, classification.intent, session.context, env, session.id);
        
        // Add bot response
        session.messages.push({
          type: 'bot',
          content: response.message,
          options: response.options,
          timestamp: Date.now(),
          intent: classification.intent
        });
        
        // Update context
        session.context = {
          ...session.context,
          messageCount: session.messages.length,
          lastActivity: Date.now(),
          currentIntent: classification.intent
        };
        
        // Handle escalation (Teams webhook) - PRESERVATO: funzionalità esistente mantenuta
        if (response.escalate || classification.escalate) {
          const teamsWebhookUrl = env.TEAMS_WEBHOOK_URL;
          if (teamsWebhookUrl) {
            try {
              // Collect lead data from conversation
              const leadData = {
                nome: session.context.nome || 'Lead da Chatbot',
                email: session.context.email || '',
                telefono: session.context.telefono || '',
                azienda: session.context.azienda || '',
                zona: session.context.zona || 'Da determinare',
                servizio: classification.intent,
                urgenza: response.priority === 'high' ? 'emergenza' : 'normale',
                messaggio: message,
                timestamp: new Date().toLocaleString('it-IT'),
                session_id: session.id,
                // AI metadata per tracking
                ai_used: response.source === 'ai',
                ai_cost: response.cost || 0,
                response_source: response.source || 'fallback'
              };
              
              const notificationSent = await sendTeamsNotification(leadData, teamsWebhookUrl);
              console.log(`Teams notification ${notificationSent ? 'sent successfully' : 'failed'} - AI used: ${response.source === 'ai'}`);
            } catch (error) {
              console.error('Teams notification failed:', error);
            }
          }
        }
        
        await saveSession(session, env.CHAT_SESSIONS);
        
        return new Response(JSON.stringify({
          success: true,
          sessionId: session.id,
          response: response.message,
          options: response.options,
          intent: classification.intent,
          confidence: classification.confidence,
          escalate: response.escalate || false,
          priority: response.priority || 'medium',
          source: response.source || 'fallback',
          cost: response.cost || 0,
          usedAI: response.source === 'ai'
        }), {
          headers: corsHeaders(origin),
        });
      }
      
      // Invalid action
      return new Response(JSON.stringify({
        success: false,
        error: 'Azione non valida'
      }), {
        status: 400,
        headers: corsHeaders(origin),
      });
      
    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Provide helpful error message based on error type
      let errorMessage = 'Errore interno del server';
      if (error.message?.includes('AI')) {
        errorMessage = 'Servizio AI temporaneamente non disponibile. La conversazione continua in modalità standard.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Troppe richieste. Attendi qualche secondo prima di continuare.';
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        fallback: true,
        debug: env.ENVIRONMENT === 'development' ? error.message : undefined
      }), {
        status: error.message?.includes('rate limit') ? 429 : 500,
        headers: corsHeaders(origin),
      });
    }
  },
};