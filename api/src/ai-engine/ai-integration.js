/**
 * AI Integration Engine for IT-ERA Chatbot
 * Handles OpenAI/Anthropic API integration with cost optimization
 */

class AIIntegrationEngine {
  constructor(config = {}) {
    this.config = {
      provider: config.provider || 'openai', // 'openai' or 'anthropic'
      model: config.model || 'gpt-4o-mini', // Cost-effective model
      maxTokens: config.maxTokens || 150, // Keep responses concise
      temperature: config.temperature || 0.7,
      language: config.language || 'italian',
      costLimit: config.costLimit || 0.10, // $0.10 per conversation
      ...config
    };
    
    this.conversationCosts = new Map(); // Track costs per session
    this.responseCache = new Map(); // Cache common responses
    this.rateLimiter = new Map(); // Rate limiting per session
  }

  /**
   * Initialize AI provider based on configuration
   */
  async initializeProvider(env) {
    if (this.config.provider === 'openai') {
      this.apiKey = env.OPENAI_API_KEY;
      this.apiUrl = 'https://api.openai.com/v1/chat/completions';
      this.costPerToken = 0.00015; // GPT-4o-mini input cost
    } else if (this.config.provider === 'anthropic') {
      this.apiKey = env.ANTHROPIC_API_KEY;
      this.apiUrl = 'https://api.anthropic.com/v1/messages';
      this.costPerToken = 0.00025; // Claude Haiku cost
    }
    
    if (!this.apiKey) {
      throw new Error(`Missing API key for ${this.config.provider}`);
    }
  }

  /**
   * Generate AI response with cost control and caching
   */
  async generateResponse(message, context = {}, sessionId) {
    try {
      // Check rate limits
      if (!this.checkRateLimit(sessionId)) {
        return {
          message: "Scusa, stai inviando messaggi troppo velocemente. Attendi qualche secondo.",
          intent: 'rate_limit',
          cost: 0
        };
      }

      // Check cost limits
      if (!this.checkCostLimit(sessionId)) {
        return {
          message: "Per continuare la conversazione, ti metterò in contatto con un nostro esperto umano.",
          intent: 'cost_limit_reached',
          escalate: true,
          cost: 0
        };
      }

      // Check cache for common queries
      const cacheKey = this.generateCacheKey(message, context);
      const cached = this.responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return { ...cached.response, cost: 0, cached: true };
      }

      // Prepare AI prompt with IT-ERA context
      const prompt = this.buildPrompt(message, context);
      
      // Call AI API
      const response = await this.callAI(prompt);
      const parsedResponse = this.parseAIResponse(response, context);
      
      // Calculate and track costs
      const cost = this.calculateCost(response);
      this.trackCost(sessionId, cost);
      
      // Cache the response if it's a common query
      if (this.shouldCache(parsedResponse)) {
        this.responseCache.set(cacheKey, {
          response: parsedResponse,
          timestamp: Date.now()
        });
      }

      return { ...parsedResponse, cost };

    } catch (error) {
      console.error('AI Generation Error:', error);
      return {
        message: "Scusa, c'è stato un problema tecnico. Un momento, passo la conversazione a un nostro esperto.",
        intent: 'ai_error',
        escalate: true,
        cost: 0
      };
    }
  }

  /**
   * Build context-aware prompt for IT-ERA
   */
  buildPrompt(message, context) {
    const systemPrompt = `Sei l'assistente virtuale di IT-ERA, un'azienda IT professionale in Lombardia.

AZIENDA: IT-ERA offre servizi IT completi: sviluppo siti web, e-commerce, app mobile, server cloud, cybersecurity, assistenza IT.

PERSONALITÀ: Professionale, competente, amichevole. Parli sempre in italiano. Risposte concise (max 2-3 frasi).

OBIETTIVO: Pre-qualificare i lead e raccogliere informazioni per preventivo. Se il cliente è interessato, raccogli: nome azienda, settore, città, numero dipendenti, tipo servizio.

ESCALATION: Se non riesci a rispondere o il cliente vuole parlare con un umano, attiva l'escalation.

SERVIZI PRINCIPALI:
- Siti web aziendali (€2.500-€15.000)
- E-commerce completi (€5.000-€25.000)  
- App mobile iOS/Android (€10.000-€50.000)
- Server e cloud (€500-€2.000/mese)
- Cybersecurity e backup (€300-€1.500/mese)
- Assistenza IT (€100-€200/ora)

PROCESSO:
1. Saluta e chiedi come puoi aiutare
2. Identifica il servizio d'interesse
3. Raccogli info aziendali base
4. Proponi escalation per preventivo dettagliato

Conversation context: ${JSON.stringify(context)}`;

    if (this.config.provider === 'openai') {
      return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];
    } else {
      return {
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      };
    }
  }

  /**
   * Call AI API with provider-specific format
   */
  async callAI(prompt) {
    const headers = {
      'Content-Type': 'application/json',
    };

    let body;
    if (this.config.provider === 'openai') {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      body = {
        model: this.config.model,
        messages: prompt,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      };
    } else {
      headers['x-api-key'] = this.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      body = {
        model: this.config.model || 'claude-3-haiku-20240307',
        system: prompt.system,
        messages: prompt.messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      };
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API Error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Parse AI response and extract intent/actions
   */
  parseAIResponse(response, context) {
    let message;
    let usage;

    if (this.config.provider === 'openai') {
      message = response.choices?.[0]?.message?.content || "Scusa, non ho capito.";
      usage = response.usage;
    } else {
      message = response.content?.[0]?.text || "Scusa, non ho capito.";
      usage = response.usage;
    }

    // Extract intent from message content
    const intent = this.extractIntent(message, context);
    
    // Determine if escalation is needed
    const escalate = this.shouldEscalate(message, intent, context);
    
    // Generate suggested options based on intent
    const options = this.generateOptions(intent, context);

    return {
      message: message.trim(),
      intent,
      escalate,
      options,
      usage,
      nextStep: this.determineNextStep(intent, context)
    };
  }

  /**
   * Extract intent from AI response
   */
  extractIntent(message, context) {
    const msg = message.toLowerCase();
    
    // Exact matches first
    if (msg.includes('preventivo') || msg.includes('quotazione')) return 'preventivo';
    if (msg.includes('assistenza') || msg.includes('supporto')) return 'supporto';
    if (msg.includes('sito') && msg.includes('web')) return 'sito_web';
    if (msg.includes('ecommerce') || msg.includes('e-commerce')) return 'ecommerce';
    if (msg.includes('app') && msg.includes('mobile')) return 'app_mobile';
    if (msg.includes('server') || msg.includes('cloud')) return 'server';
    if (msg.includes('sicurezza') || msg.includes('cybersecurity')) return 'cybersecurity';
    
    // Context-based intent
    if (context.step === 'greeting') return 'saluto';
    if (context.step === 'service_inquiry') return 'servizio_info';
    if (context.leadData && Object.keys(context.leadData).length > 2) return 'lead_qualified';
    
    return 'generale';
  }

  /**
   * Determine if human escalation is needed
   */
  shouldEscalate(message, intent, context) {
    const escalationTriggers = [
      'umano', 'persona', 'operatore', 'telefono', 'chiamare',
      'complesso', 'urgente', 'subito', 'problema grave'
    ];
    
    const msg = message.toLowerCase();
    return escalationTriggers.some(trigger => msg.includes(trigger)) ||
           intent === 'lead_qualified' ||
           context.escalationRequested;
  }

  /**
   * Generate contextual options for user
   */
  generateOptions(intent, context) {
    const optionMap = {
      saluto: ["Preventivo", "Assistenza Tecnica", "Info Servizi", "Altro"],
      preventivo: ["Sito Web", "E-commerce", "App Mobile", "Server/Cloud", "Cybersecurity", "Assistenza IT"],
      sito_web: ["Sito Vetrina", "Sito E-commerce", "Portale Aziendale", "Landing Page"],
      ecommerce: ["B2C Consumer", "B2B Aziendale", "Marketplace", "Dropshipping"],
      generale: ["Preventivo", "Assistenza", "Info Servizi"],
      lead_qualified: ["Invia Preventivo", "Chiama Subito", "Email Dettagli"]
    };
    
    return optionMap[intent] || optionMap.generale;
  }

  /**
   * Determine next conversation step
   */
  determineNextStep(intent, context) {
    const stepMap = {
      saluto: 'service_selection',
      preventivo: 'service_details',
      sito_web: 'business_info',
      ecommerce: 'business_info',
      app_mobile: 'business_info',
      lead_qualified: 'escalation',
      generale: 'clarification'
    };
    
    return stepMap[intent] || 'continue';
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(sessionId) {
    const now = Date.now();
    const sessionLimits = this.rateLimiter.get(sessionId) || { count: 0, window: now };
    
    // Reset window if it's been more than 1 minute
    if (now - sessionLimits.window > 60000) {
      sessionLimits.count = 0;
      sessionLimits.window = now;
    }
    
    // Allow max 10 AI calls per minute per session
    if (sessionLimits.count >= 10) {
      return false;
    }
    
    sessionLimits.count++;
    this.rateLimiter.set(sessionId, sessionLimits);
    return true;
  }

  /**
   * Cost limit check
   */
  checkCostLimit(sessionId) {
    const sessionCost = this.conversationCosts.get(sessionId) || 0;
    return sessionCost < this.config.costLimit;
  }

  /**
   * Calculate API call cost
   */
  calculateCost(response) {
    let totalTokens = 0;
    
    if (this.config.provider === 'openai') {
      totalTokens = response.usage?.total_tokens || 0;
    } else {
      totalTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
    }
    
    return totalTokens * this.costPerToken;
  }

  /**
   * Track conversation costs
   */
  trackCost(sessionId, cost) {
    const currentCost = this.conversationCosts.get(sessionId) || 0;
    this.conversationCosts.set(sessionId, currentCost + cost);
  }

  /**
   * Generate cache key for response caching
   */
  generateCacheKey(message, context) {
    const normalizedMessage = message.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim();
    return `${normalizedMessage}_${context.step || 'default'}`;
  }

  /**
   * Determine if response should be cached
   */
  shouldCache(response) {
    const cacheableIntents = ['saluto', 'informazioni', 'servizi', 'generale'];
    return cacheableIntents.includes(response.intent) && 
           response.message.length > 20;
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    const totalCosts = Array.from(this.conversationCosts.values())
      .reduce((sum, cost) => sum + cost, 0);
    
    return {
      totalConversations: this.conversationCosts.size,
      totalCosts: totalCosts.toFixed(4),
      avgCostPerConversation: (totalCosts / this.conversationCosts.size || 0).toFixed(4),
      cacheHitRate: this.responseCache.size > 0 ? 
        (this.responseCache.size / (this.conversationCosts.size + this.responseCache.size) * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Reset usage data (call daily)
   */
  resetUsageData() {
    this.conversationCosts.clear();
    this.rateLimiter.clear();
    
    // Keep cache but remove old entries
    const now = Date.now();
    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > 3600000) { // 1 hour
        this.responseCache.delete(key);
      }
    }
  }
}

export default AIIntegrationEngine;