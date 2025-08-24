/**
 * Environment Configuration Example for AI-Enhanced Chatbot
 * Copy to .env or set as Cloudflare Worker environment variables
 */

// ========================================
// AI INTEGRATION SETTINGS
// ========================================

// Required: AI Provider API Key (choose one)
export const AI_CONFIG = {
  // OpenAI Configuration (recommended)
  OPENAI_API_KEY: 'sk-your-openai-api-key-here',
  
  // Alternative: Anthropic Configuration  
  // ANTHROPIC_API_KEY: 'your-anthropic-api-key-here',
  
  // AI Settings
  AI_ENABLED: 'true',              // Set to 'false' to disable AI
  AI_PROVIDER: 'openai',           // 'openai' or 'anthropic'
  AI_MODEL: 'gpt-4o-mini',         // Cost-effective model
  AI_COST_LIMIT: '0.10',           // €0.10 per conversation max
  AI_TIMEOUT: '8000',              // 8 seconds timeout
  AI_MAX_RETRIES: '2',             // Retry attempts on failure
};

// ========================================
// EXISTING IT-ERA SETTINGS (PRESERVED)
// ========================================

export const ITERA_CONFIG = {
  // Teams Integration for Escalations
  TEAMS_WEBHOOK_URL: 'https://outlook.office.com/webhook/your-webhook-url',
  
  // Cloudflare KV Namespaces
  CHAT_SESSIONS: 'your-chat-sessions-kv-namespace',
  CONTACT_KV: 'your-contact-kv-namespace', 
  ANALYTICS_KV: 'your-analytics-kv-namespace',
  
  // Environment
  ENVIRONMENT: 'production',        // 'development' or 'production'
  
  // Email Integration (if used)
  SENDGRID_API_KEY: 'your-sendgrid-key-if-needed',
  FROM_EMAIL: 'info@it-era.it',
};

// ========================================
// CLOUDFLARE WORKERS DEPLOYMENT
// ========================================

// Add to wrangler.toml:
/*
[env.production]
name = "it-era-chatbot-ai"

[env.production.vars]
AI_ENABLED = "true"
AI_PROVIDER = "openai"  
AI_MODEL = "gpt-4o-mini"
AI_COST_LIMIT = "0.10"
AI_TIMEOUT = "8000"
ENVIRONMENT = "production"

# Set secrets via CLI:
# wrangler secret put OPENAI_API_KEY
# wrangler secret put TEAMS_WEBHOOK_URL

[env.production.kv_namespaces]
{ binding = "CHAT_SESSIONS", id = "your-kv-namespace-id" }
*/

// ========================================
// DEVELOPMENT SETUP
// ========================================

export const DEV_CONFIG = {
  // Local development settings
  AI_ENABLED: 'true',
  AI_PROVIDER: 'openai',
  AI_MODEL: 'gpt-4o-mini',
  AI_COST_LIMIT: '0.05',      // Lower limit for testing
  AI_TIMEOUT: '5000',         // Faster timeout for dev
  
  // Mock webhooks for testing
  TEAMS_WEBHOOK_URL: 'https://webhook.site/your-test-url',
  ENVIRONMENT: 'development'
};

// ========================================
// COST OPTIMIZATION SETTINGS
// ========================================

export const COST_OPTIMIZATION = {
  // Ultra Low Cost (€0.01-0.02 per conversation)
  ULTRA_LOW: {
    AI_MODEL: 'gpt-4o-mini',
    AI_COST_LIMIT: '0.02',
    MAX_TOKENS: 100,
    TEMPERATURE: '0.5'
  },
  
  // Balanced (€0.05-0.10 per conversation) 
  BALANCED: {
    AI_MODEL: 'gpt-4o-mini',
    AI_COST_LIMIT: '0.10', 
    MAX_TOKENS: 150,
    TEMPERATURE: '0.7'
  },
  
  // High Quality (€0.15-0.25 per conversation)
  HIGH_QUALITY: {
    AI_MODEL: 'gpt-4o',
    AI_COST_LIMIT: '0.25',
    MAX_TOKENS: 200,
    TEMPERATURE: '0.8'
  }
};

// ========================================
// MONITORING THRESHOLDS
// ========================================

export const MONITORING = {
  // Alert thresholds
  DAILY_COST_ALERT: '10.00',      // €10/day
  HOURLY_REQUEST_ALERT: '1000',   // 1000 req/hour
  ERROR_RATE_ALERT: '0.05',       // 5% error rate
  
  // Performance thresholds  
  AI_RESPONSE_TIME_WARN: '5000',  // 5s warning
  AI_RESPONSE_TIME_ERROR: '10000', // 10s error
  
  // Rate limits
  AI_CALLS_PER_MINUTE: '10',      // Per session
  AI_CALLS_PER_HOUR: '100',       // Per IP
};

// ========================================
// FEATURE FLAGS
// ========================================

export const FEATURES = {
  // AI Features
  AI_CONVERSATION_MEMORY: 'true',  // Remember context
  AI_SENTIMENT_ANALYSIS: 'false',  // Analyze user sentiment
  AI_LEAD_SCORING: 'true',         // Score leads automatically
  AI_LANGUAGE_DETECTION: 'false',  // Detect non-Italian
  
  // Enhanced Features
  SMART_ESCALATION: 'true',        // AI decides when to escalate
  PERSONALIZED_RESPONSES: 'true',  // Customize by user type
  PROACTIVE_FOLLOWUP: 'false',     // AI suggests follow-ups
  
  // Analytics
  CONVERSATION_ANALYTICS: 'true',   // Track conversation metrics
  AI_PERFORMANCE_TRACKING: 'true', // Monitor AI effectiveness
  COST_TRACKING: 'true',           // Track per-conversation costs
};

// ========================================
// USAGE EXAMPLE
// ========================================

/*
// In Cloudflare Worker:

export default {
  async fetch(request, env, ctx) {
    // Environment variables are automatically available in 'env'
    const aiEnabled = env.AI_ENABLED === 'true';
    const aiProvider = env.AI_PROVIDER || 'openai';
    
    // Initialize AI engine with environment config
    if (aiEnabled) {
      const aiEngine = new AIIntegrationEngine({
        provider: aiProvider,
        model: env.AI_MODEL,
        costLimit: parseFloat(env.AI_COST_LIMIT),
        timeout: parseInt(env.AI_TIMEOUT)
      });
      
      await aiEngine.initializeProvider(env);
    }
    
    // Continue with request handling...
  }
}
*/

console.log('AI Environment Configuration loaded. Set these variables in your Cloudflare Worker environment.');