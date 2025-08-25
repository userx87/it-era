/**
 * OpenRouter AI Engine for IT-ERA Chatbot
 * Enhanced AI integration with OpenRouter API for intelligent conversations
 * Optimized for lead generation and B2B communication
 */

import { ITERAKnowledgeBase, KnowledgeUtils } from '../knowledge-base/it-era-knowledge-real.js';
import hybridModelSelector from './hybrid-model-selector.js';
import { selectHybridModel, getModelConfig } from './ai-config.js';

class OpenRouterEngine {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || '', // Will be set from env
      // Updated for Hybrid Strategy
      model: config.model || 'openai/gpt-4o-mini', // Primary: GPT-4o Mini
      fallbackModel: config.fallbackModel || 'deepseek/deepseek-chat', // Secondary: DeepSeek
      emergencyModel: config.emergencyModel || 'anthropic/claude-3-haiku', // Emergency
      maxTokens: config.maxTokens || 300,
      temperature: config.temperature || 0.7,
      language: config.language || 'italian',
      costLimit: config.costLimit || 0.040, // €0.040 per conversation (hybrid target)
      cacheTTL: config.cacheTTL || 3600, // 1 hour cache
      hybridEnabled: config.hybridEnabled !== false, // Enable hybrid by default
      ...config
    };
    
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.conversationCosts = new Map();
    this.responseCache = new Map();
    this.rateLimiter = new Map();
    this.sessionContext = new Map();
    
    // Model costs (per 1K tokens, EUR conversion applied) - Updated for GPT-4.1 Mini
    this.modelCosts = {
      // GPT 4.1 Mini with Vision Support (Updated Pricing)
      'openai/gpt-4o-mini': { 
        input: 0.000125, 
        output: 0.000500, 
        vision: 0.000200  // Vision token cost
      }, // ~€0.025/conversation, €0.040/vision
      'openai/gpt-4o': { 
        input: 0.002500, 
        output: 0.010000, 
        vision: 0.005000  // Higher vision cost
      }, // Premium vision model
      'deepseek/deepseek-chat': { input: 0.000070, output: 0.000280 }, // ~€0.014/conversation
      'anthropic/claude-3-haiku': { input: 0.000250, output: 0.001250 }, // Emergency backup
      'anthropic/claude-3.5-sonnet': { 
        input: 0.003000, 
        output: 0.015000, 
        vision: 0.008000  // Claude vision support
      },
      // Legacy models (kept for compatibility)
      'openai/gpt-4-turbo': { input: 0.010000, output: 0.030000 }
    };
    
    // Vision processing capabilities
    this.visionCapabilities = {
      supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxImageSize: 20 * 1024 * 1024, // 20MB
      maxImagesPerRequest: 5,
      compressionEnabled: true,
      analysisTypes: ['error_analysis', 'hardware_identification', 'network_analysis', 'equipment_identification', 'security_analysis']
    };
    
    // Hybrid strategy performance tracking
    this.hybridMetrics = {
      totalRequests: 0,
      modelUsage: new Map(),
      responseTimesByModel: new Map(),
      costsByModel: new Map(),
      successRatesByModel: new Map()
    };
  }

  /**
   * Initialize OpenRouter with API key
   */
  async initialize(env) {
    this.config.apiKey = env.OPENROUTER_API_KEY;
    
    if (!this.config.apiKey) {
      throw new Error('OPENROUTER_API_KEY not found in environment');
    }
    
    // Test API connectivity
    try {
      await this.testConnection();
      console.log('✅ OpenRouter AI Engine initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ OpenRouter initialization failed:', error);
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection() {
    const response = await this.callOpenRouter([
      { role: 'user', content: 'Test connection. Reply with just: OK' }
    ], { maxTokens: 5 });
    
    if (!response || !response.choices?.[0]?.message?.content) {
      throw new Error('OpenRouter API test failed');
    }
  }

  /**
   * Generate AI-powered response with Vision and Hybrid Strategy
   */
  async generateResponse(message, context = {}, sessionId, images = []) {
    try {
      // Validate session and rate limits
      if (!this.checkRateLimit(sessionId)) {
        return this.createRateLimitResponse();
      }

      if (!this.checkCostLimit(sessionId)) {
        return this.createCostLimitResponse();
      }

      // Check response cache
      const cacheKey = this.generateCacheKey(message, context);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return { ...cached, cost: 0, cached: true, source: 'cache' };
      }

      // Process images if provided
      const processedImages = await this.processImages(images, context);
      const enhancedContext = {
        ...context,
        hasImages: processedImages.length > 0,
        imageCount: processedImages.length,
        visionRequired: processedImages.some(img => img.requiresVision),
        images: processedImages
      };

      // HYBRID MODEL SELECTION with Vision Support
      const modelSelection = this.config.hybridEnabled ? 
        hybridModelSelector.selectOptimalModel(message, enhancedContext, sessionId) : 
        { model: this.config.model, reason: 'hybrid_disabled', priority: 'medium' };
      
      const selectedModel = modelSelection.model;
      console.log(`🤖 Selected model: ${selectedModel} (${modelSelection.reason})`);
      console.log(`📸 Vision mode: ${enhancedContext.hasImages ? 'ENABLED' : 'DISABLED'} (${processedImages.length} images)`);

      // Build conversation context with vision support
      const conversationHistory = this.buildConversationHistory(message, enhancedContext, sessionId, processedImages);
      
      // Generate AI response with vision support
      const startTime = Date.now();
      const aiResponse = await this.callOpenRouter(conversationHistory, { 
        model: selectedModel,
        hasVision: enhancedContext.hasImages,
        imageCount: processedImages.length
      });
      const responseTime = Date.now() - startTime;

      // Process and enhance the response
      const processedResponse = this.processAIResponse(aiResponse, context, message);
      
      // Add IT-ERA specific enhancements
      const enhancedResponse = this.enhanceWithITERAContext(processedResponse, context);
      
      // Calculate costs with vision support
      const cost = this.calculateResponseCost(aiResponse, selectedModel, enhancedContext.hasImages, processedImages.length);
      this.trackCost(sessionId, cost);
      
      // Track hybrid performance metrics
      const success = !processedResponse.error && responseTime < 8000;
      this.trackHybridPerformance(selectedModel, responseTime, cost, success);
      
      // Track performance for adaptive selection
      if (this.config.hybridEnabled) {
        hybridModelSelector.trackModelPerformance(sessionId, selectedModel, responseTime, cost, success);
      }
      
      // Cache response if appropriate
      if (this.shouldCache(enhancedResponse)) {
        this.addToCache(cacheKey, enhancedResponse);
      }

      // Update session context
      this.updateSessionContext(sessionId, message, enhancedResponse);

      return {
        ...enhancedResponse,
        cost,
        responseTime,
        cached: false,
        source: 'openrouter_hybrid',
        model: selectedModel,
        modelReason: modelSelection.reason,
        hybridEnabled: this.config.hybridEnabled
      };

    } catch (error) {
      console.error('OpenRouter hybrid response generation error:', error);
      
      // Try intelligent fallback with hybrid strategy
      return await this.handleHybridFallback(message, context, sessionId, error);
    }
  }

  /**
   * Build conversation history with vision support
   */
  buildConversationHistory(message, context, sessionId, processedImages = []) {
    const systemPrompt = this.buildITERASystemPrompt(context);
    const messages = [{ role: 'system', content: systemPrompt }];
    
    // Add conversation history if available
    const sessionHistory = this.sessionContext.get(sessionId) || [];
    if (sessionHistory.length > 0) {
      messages.push(...sessionHistory.slice(-6)); // Keep last 3 exchanges
    }
    
    // Build user message with vision support
    const userMessage = this.buildVisionMessage(message, processedImages);
    messages.push(userMessage);
    
    return messages;
  }

  /**
   * Build IT-ERA specific system prompt with real data
   */
  buildITERASystemPrompt(context = {}) {
    const company = ITERAKnowledgeBase.company;
    const services = ITERAKnowledgeBase.services;
    
    return `Sei l'assistente virtuale di IT-ERA, specialista in servizi IT per aziende in Lombardia.

🏢 AZIENDA: ${company.name} - ${company.fullName}
📍 SEDE: ${company.address}, ${company.city} (${company.province})
📞 TELEFONO: ${company.phone}
📧 EMAIL: ${company.email}
🌐 WEB: ${company.website}

🎯 SPECIALIZZAZIONI PRINCIPALI:
• FIREWALL WATCHGUARD - Partner certificato unico in Brianza
• Assistenza IT professionale (10+ anni esperienza)  
• Backup e disaster recovery cloud
• Riparazione PC/Mac/server certificata
• Server e infrastrutture aziendali

🎯 PREZZI REALI (sempre da confermare con preventivo):
• Firewall WatchGuard: da €2.500 (installazione inclusa)
• Assistenza remota: €80-100/ora
• Assistenza on-site: €120-150/ora + trasferta  
• Contratti manutenzione: da €200/mese (5 PC)
• Backup cloud: da €50/mese (100GB)
• Riparazione PC: da €50 + ricambi

🌍 ZONA SERVIZIO:
• Primaria: Vimercate, Monza, Agrate, Concorezzo (intervento stesso giorno)
• Secondaria: Milano Est, Brianza (24-48 ore)
• Remoto: Tutta Italia per assistenza

🎯 OBIETTIVI CONVERSAZIONE:
1. Identificare servizio d'interesse
2. Raccogliere dati aziendali (nome, dipendenti, zona, urgenza)
3. Pre-qualificare il lead (budget, timeline, priorità)
4. Escalation per preventivo personalizzato

🗣️ STILE COMUNICAZIONE:
• Professionale ma amichevole
• Sempre in italiano
• Risposte concise (massimo 2-3 frasi principali)
• Focus su benefici concreti
• Enfatizza specializzazione WatchGuard e esperienza locale

⚡ ESCALATION IMMEDIATA per:
• Parole chiave: "emergenza", "server down", "malware", "urgente"
• Richiesta operatore umano
• Lead qualificato pronto per preventivo
• Aziende zona Vimercate/Monza con 10+ dipendenti

💼 LEAD QUALIFICATION:
• Zona geografica (priorità assoluta: Vimercate, Monza, Brianza)
• Dimensioni azienda (5+ dipendenti = target ideale)  
• Budget indicativo
• Timeline progetto
• Urgenza/priorità

Contesto conversazione corrente: ${JSON.stringify(context, null, 2)}

Rispondi sempre come esperto IT-ERA con focus su lead generation B2B.`;
  }

  /**
   * Call OpenRouter API
   */
  async callOpenRouter(messages, options = {}) {
    const requestBody = {
      model: options.model || this.config.model,
      messages,
      max_tokens: options.maxTokens || this.config.maxTokens,
      temperature: options.temperature || this.config.temperature,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
      stop: options.stop || null
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://it-era.it',
        'X-Title': 'IT-ERA Chatbot'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid OpenRouter API response structure');
    }

    return data;
  }

  /**
   * Process AI response and extract actionable information
   */
  processAIResponse(aiResponse, context, originalMessage) {
    const rawMessage = aiResponse.choices[0].message.content.trim();
    
    // SECURITY CRITICAL: Check if AI returned system prompt instead of conversational response
    const systemPromptIndicators = [
      'Sei l\'assistente virtuale di IT-ERA',
      '🏢 AZIENDA:',
      '📍 SEDE:',
      '🎯 OBIETTIVI CONVERSAZIONE:',
      'Rispondi sempre come esperto IT-ERA',
      'primo filtro commerciale',
      'Non sei un tecnico'
    ];
    
    let message = rawMessage;
    
    // Check if response contains system prompt indicators
    const hasSystemContent = systemPromptIndicators.some(indicator => 
      rawMessage.includes(indicator)
    );
    
    if (hasSystemContent) {
      console.error('SECURITY ALERT: AI returned system prompt, using safe fallback');
      message = "[IT-ERA] Ciao, come posso aiutarti?";
    }
    
    // Additional check for unusually long responses that look like system prompts
    if (rawMessage.length > 500 && rawMessage.includes('🎯') && rawMessage.includes('📞')) {
      console.error('SECURITY ALERT: AI returned system-like structured response, using safe fallback');
      message = "[IT-ERA] Ciao, come posso aiutarti?";
    }
    
    // Extract intent and confidence
    const intent = this.extractIntent(message, originalMessage, context);
    const confidence = this.calculateConfidence(message, intent, context);
    
    // Determine escalation needs
    const escalation = this.evaluateEscalation(message, intent, context, originalMessage);
    
    // Generate contextual options
    const options = this.generateContextualOptions(intent, context);
    
    return {
      message,
      intent,
      confidence,
      escalate: escalation.required,
      escalationType: escalation.type,
      priority: escalation.priority,
      options,
      nextStep: this.determineNextStep(intent, context),
      usage: aiResponse.usage || {},
      sanitized: message !== rawMessage // Track if we had to sanitize
    };
  }

  /**
   * Enhance response with IT-ERA specific context and data
   */
  enhanceWithITERAContext(response, context) {
    const enhanced = { ...response };
    
    // Add geographic personalization
    if (context.leadData?.location) {
      const geoMessage = this.getGeographicMessage(context.leadData.location);
      if (geoMessage) {
        enhanced.message += `\n\n${geoMessage}`;
      }
    }
    
    // Add service-specific enhancements
    if (response.intent) {
      const serviceInfo = this.getServiceEnhancement(response.intent);
      if (serviceInfo) {
        enhanced.serviceInfo = serviceInfo;
      }
    }
    
    // Add lead qualification data
    if (context.leadData) {
      enhanced.leadQuality = KnowledgeUtils.qualifyLead(context.leadData);
    }
    
    return enhanced;
  }

  /**
   * Extract intent from AI response and user message
   */
  extractIntent(aiMessage, userMessage, context) {
    const combined = `${aiMessage} ${userMessage}`.toLowerCase();
    
    // Priority intents (high-value services)
    if (combined.includes('firewall') || combined.includes('watchguard') || combined.includes('sicurezza')) {
      return 'cybersecurity';
    }
    if (combined.includes('preventivo') || combined.includes('quotazione')) {
      return 'preventivo';
    }
    if (combined.includes('assistenza') || combined.includes('supporto')) {
      return 'assistenza';
    }
    if (combined.includes('backup') || combined.includes('recupero')) {
      return 'backup';
    }
    if (combined.includes('server') || combined.includes('cloud')) {
      return 'server';
    }
    if (combined.includes('riparazione') || combined.includes('pc') || combined.includes('mac')) {
      return 'riparazione';
    }
    
    // Context-based intents
    if (context.currentStep === 'greeting') return 'saluto';
    if (context.collectData) return 'data_collection';
    
    return 'informazioni';
  }

  /**
   * Calculate confidence score based on AI response quality
   */
  calculateConfidence(message, intent, context) {
    let confidence = 0.7; // Base confidence
    
    // High confidence indicators
    if (message.length > 50) confidence += 0.1;
    if (message.includes('IT-ERA') || message.includes('Vimercate')) confidence += 0.1;
    if (intent !== 'informazioni') confidence += 0.1;
    if (context.messageCount > 3) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  /**
   * Evaluate if escalation is needed
   */
  evaluateEscalation(aiMessage, intent, context, userMessage) {
    const combined = `${aiMessage} ${userMessage}`.toLowerCase();
    
    // Immediate escalation triggers
    const emergencyKeywords = ['emergenza', 'urgente', 'server down', 'malware', 'ransomware'];
    if (emergencyKeywords.some(kw => combined.includes(kw))) {
      return { required: true, type: 'emergency', priority: 'high' };
    }
    
    // Human request keywords
    const humanKeywords = ['umano', 'persona', 'operatore', 'parlare con'];
    if (humanKeywords.some(kw => combined.includes(kw))) {
      return { required: true, type: 'human_request', priority: 'medium' };
    }
    
    // Qualified lead escalation
    if (intent === 'preventivo' && context.leadData) {
      const leadQuality = KnowledgeUtils.qualifyLead(context.leadData);
      if (leadQuality === 'high_priority') {
        return { required: true, type: 'qualified_lead', priority: 'high' };
      }
    }
    
    // Data collection complete
    if (context.messageCount >= 5 && context.leadData?.contact_name) {
      return { required: true, type: 'lead_complete', priority: 'medium' };
    }
    
    return { required: false, type: null, priority: 'low' };
  }

  /**
   * Generate contextual options based on intent
   */
  generateContextualOptions(intent, context) {
    const optionsMap = {
      saluto: [
        "🔒 Sicurezza e firewall WatchGuard",
        "🛠️ Assistenza IT professionale", 
        "💾 Backup e protezione dati",
        "💰 Preventivo gratuito"
      ],
      cybersecurity: [
        "🛡️ Firewall WatchGuard (da €2.500)",
        "🦠 Antivirus enterprise (da €8/mese)", 
        "🔍 Audit sicurezza (50% sconto)",
        "💰 Preventivo personalizzato"
      ],
      assistenza: [
        "💻 Assistenza remota (€80-100/ora)",
        "🏢 Intervento on-site (€120-150/ora)",
        "📋 Contratto manutenzione (da €200/mese)",
        "🆘 Supporto urgente"
      ],
      preventivo: [
        "📝 Compila richiesta dettagliata",
        "📞 Chiamata di consulenza",
        "🏢 Sopralluogo gratuito",
        "🚨 Ho urgenza"
      ],
      informazioni: [
        "💰 Richiedi preventivo",
        "📞 Contatto diretto: 039 888 2041",
        "🏢 Sopralluogo gratuito",
        "🔙 Menu principale"
      ]
    };
    
    return optionsMap[intent] || optionsMap.informazioni;
  }

  /**
   * Get geographic personalized message
   */
  getGeographicMessage(location) {
    const locationLower = location.toLowerCase();
    const geoMessages = ITERAKnowledgeBase.geographic_messaging;
    
    if (locationLower.includes('vimercate') || locationLower.includes('agrate')) {
      return geoMessages.vimercate_area.greeting + ' ' + geoMessages.vimercate_area.advantage;
    }
    if (locationLower.includes('monza') || locationLower.includes('brianza')) {
      return geoMessages.monza_area.greeting + ' ' + geoMessages.monza_area.advantage;
    }
    if (locationLower.includes('milano est')) {
      return geoMessages.milano_est.greeting + ' ' + geoMessages.milano_est.advantage;
    }
    
    return geoMessages.other_areas.greeting + ' ' + geoMessages.other_areas.advantage;
  }

  /**
   * Handle hybrid fallback with intelligent model switching
   */
  async handleHybridFallback(message, context, sessionId, originalError) {
    console.log('🔄 Attempting hybrid fallback...');
    
    // Try fallback model first
    try {
      const fallbackMessages = this.buildConversationHistory(message, context, sessionId);
      const fallbackResponse = await this.callOpenRouter(fallbackMessages, {
        model: this.config.fallbackModel,
        maxTokens: 200
      });
      
      const processed = this.processAIResponse(fallbackResponse, context, message);
      processed.fallbackModel = this.config.fallbackModel;
      processed.fallbackReason = originalError.message;
      
      // Track fallback usage
      const cost = this.calculateResponseCost(fallbackResponse, this.config.fallbackModel);
      this.trackHybridPerformance(this.config.fallbackModel, 0, cost, true);
      
      return processed;
      
    } catch (fallbackError) {
      console.log('🚨 Fallback model also failed, trying emergency model...');
      
      // Try emergency model as last resort
      try {
        const emergencyMessages = this.buildConversationHistory(message, context, sessionId);
        const emergencyResponse = await this.callOpenRouter(emergencyMessages, {
          model: this.config.emergencyModel,
          maxTokens: 150
        });
        
        const processed = this.processAIResponse(emergencyResponse, context, message);
        processed.emergencyFallback = true;
        processed.originalError = originalError.message;
        processed.fallbackError = fallbackError.message;
        
        return processed;
        
      } catch (emergencyError) {
        console.error('💥 All models failed:', { originalError, fallbackError, emergencyError });
        return this.createErrorResponse(originalError);
      }
    }
  }

  /**
   * Create rate limit response
   */
  createRateLimitResponse() {
    return {
      message: "Stai inviando messaggi troppo velocemente. Attendi qualche secondo prima di continuare.",
      intent: 'rate_limit',
      escalate: false,
      cost: 0,
      cached: true
    };
  }

  /**
   * Create cost limit response with escalation
   */
  createCostLimitResponse() {
    return {
      message: "Per continuare al meglio la conversazione, ti metto in contatto con un nostro esperto che potrà assisterti personalmente. Un momento...",
      intent: 'cost_limit_reached',
      escalate: true,
      escalationType: 'cost_limit',
      priority: 'medium',
      cost: 0
    };
  }

  /**
   * Create error response
   */
  createErrorResponse(error) {
    return {
      message: "Mi dispiace, ho avuto un problema tecnico. Ti metto subito in contatto con un nostro tecnico che potrà assisterti al meglio.",
      intent: 'ai_error',
      escalate: true,
      escalationType: 'technical_error',
      priority: 'medium',
      cost: 0,
      error: error.message
    };
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(sessionId) {
    const now = Date.now();
    const sessionLimits = this.rateLimiter.get(sessionId) || { count: 0, window: now };
    
    // Reset window every minute
    if (now - sessionLimits.window > 60000) {
      sessionLimits.count = 0;
      sessionLimits.window = now;
    }
    
    // Allow max 15 AI calls per minute per session
    if (sessionLimits.count >= 15) {
      return false;
    }
    
    sessionLimits.count++;
    this.rateLimiter.set(sessionId, sessionLimits);
    return true;
  }

  /**
   * Enhanced cost limit check with vision awareness
   */
  checkCostLimit(sessionId, hasVision = false) {
    const sessionCost = this.conversationCosts.get(sessionId) || 0;
    
    // Dynamic cost limit based on vision usage
    const costLimit = hasVision ? 
      (this.config.costLimit * 1.8) : // 80% higher limit for vision
      this.config.costLimit;
    
    // Log cost status for monitoring
    if (sessionCost > (costLimit * 0.8)) {
      const limitType = hasVision ? 'VISION' : 'STANDARD';
      console.log(`⚠️ Session ${sessionId} approaching ${limitType} cost limit: €${sessionCost.toFixed(6)}/€${costLimit.toFixed(6)}`);
    }
    
    return sessionCost < costLimit;
  }

  /**
   * Calculate response cost with vision support
   */
  calculateResponseCost(response, model = null, hasVision = false, imageCount = 0) {
    if (!response.usage) return 0;
    
    const selectedModel = model || this.config.model;
    const modelCost = this.modelCosts[selectedModel];
    if (!modelCost) {
      console.warn(`No cost data for model: ${selectedModel}`);
      return 0;
    }
    
    // Base token costs
    const inputCost = (response.usage.prompt_tokens || 0) * modelCost.input;
    const outputCost = (response.usage.completion_tokens || 0) * modelCost.output;
    
    // Vision processing costs
    let visionCost = 0;
    if (hasVision && modelCost.vision && imageCount > 0) {
      // Estimate vision tokens based on image count and detail level
      const estimatedVisionTokens = imageCount * 1000; // ~1K tokens per image
      visionCost = estimatedVisionTokens * modelCost.vision;
      console.log(`👁️ Vision cost: ${imageCount} images, ~${estimatedVisionTokens} tokens, €${visionCost.toFixed(6)}`);
    }
    
    const totalCost = inputCost + outputCost + visionCost;
    console.log(`💰 Enhanced cost breakdown - Model: ${selectedModel}, Input: €${inputCost.toFixed(6)}, Output: €${outputCost.toFixed(6)}, Vision: €${visionCost.toFixed(6)}, Total: €${totalCost.toFixed(6)}`);
    
    return totalCost;
  }

  /**
   * Track conversation costs
   */
  trackCost(sessionId, cost) {
    const currentCost = this.conversationCosts.get(sessionId) || 0;
    this.conversationCosts.set(sessionId, currentCost + cost);
  }

  /**
   * Update session context for conversation continuity
   */
  updateSessionContext(sessionId, userMessage, aiResponse) {
    const history = this.sessionContext.get(sessionId) || [];
    
    history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: aiResponse.message }
    );
    
    // Keep only last 10 messages (5 exchanges)
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
    
    this.sessionContext.set(sessionId, history);
  }

  /**
   * Cache management
   */
  generateCacheKey(message, context) {
    const normalizedMessage = message.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .substring(0, 100);
    return `${normalizedMessage}_${context.currentStep || 'default'}`;
  }

  shouldCache(response) {
    const cacheableIntents = ['saluto', 'informazioni', 'cybersecurity', 'assistenza'];
    return cacheableIntents.includes(response.intent) && 
           response.message.length > 30 &&
           !response.escalate;
  }

  addToCache(key, response) {
    this.responseCache.set(key, {
      ...response,
      timestamp: Date.now()
    });
  }

  getFromCache(key) {
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL * 1000) {
      return cached;
    }
    if (cached) {
      this.responseCache.delete(key);
    }
    return null;
  }

  /**
   * Determine next conversation step
   */
  determineNextStep(intent, context) {
    const stepMap = {
      saluto: 'service_selection',
      cybersecurity: 'service_details',
      assistenza: 'service_details',
      preventivo: 'lead_collection',
      data_collection: 'continue_collection',
      informazioni: 'service_clarification'
    };
    
    // If escalating, go to escalation
    if (context.escalate) return 'escalation';
    
    return stepMap[intent] || 'continue';
  }

  /**
   * Track hybrid performance metrics
   */
  trackHybridPerformance(model, responseTime, cost, success) {
    this.hybridMetrics.totalRequests++;
    
    // Track model usage
    const currentUsage = this.hybridMetrics.modelUsage.get(model) || 0;
    this.hybridMetrics.modelUsage.set(model, currentUsage + 1);
    
    // Track response times
    if (!this.hybridMetrics.responseTimesByModel.has(model)) {
      this.hybridMetrics.responseTimesByModel.set(model, []);
    }
    this.hybridMetrics.responseTimesByModel.get(model).push(responseTime);
    
    // Track costs
    if (!this.hybridMetrics.costsByModel.has(model)) {
      this.hybridMetrics.costsByModel.set(model, []);
    }
    this.hybridMetrics.costsByModel.get(model).push(cost);
    
    // Track success rates
    if (!this.hybridMetrics.successRatesByModel.has(model)) {
      this.hybridMetrics.successRatesByModel.set(model, { total: 0, successful: 0 });
    }
    const successData = this.hybridMetrics.successRatesByModel.get(model);
    successData.total++;
    if (success) successData.successful++;
  }
  
  /**
   * Get comprehensive hybrid usage statistics
   */
  getUsageStats() {
    const totalSessions = this.conversationCosts.size;
    const totalCost = Array.from(this.conversationCosts.values())
      .reduce((sum, cost) => sum + cost, 0);
    
    const cacheHits = this.responseCache.size;
    const totalRequests = this.hybridMetrics.totalRequests;
    
    // Calculate hybrid metrics
    const hybridStats = this.calculateHybridStats();
    
    return {
      // Basic stats
      totalSessions,
      totalCost: Number(totalCost.toFixed(6)),
      averageCostPerSession: totalSessions > 0 ? Number((totalCost / totalSessions).toFixed(6)) : 0,
      cacheHits,
      cacheHitRate: totalRequests > 0 ? Number((cacheHits / totalRequests * 100).toFixed(2)) : 0,
      rateLimitedSessions: Array.from(this.rateLimiter.values()).filter(s => s.count >= 15).length,
      costLimitedSessions: Array.from(this.conversationCosts.values()).filter(c => c >= this.config.costLimit).length,
      
      // Model configuration
      primaryModel: this.config.model,
      fallbackModel: this.config.fallbackModel,
      emergencyModel: this.config.emergencyModel,
      hybridEnabled: this.config.hybridEnabled,
      
      // Hybrid performance
      hybrid: hybridStats,
      
      // Performance targets
      targets: {
        costPerConversation: this.config.costLimit,
        responseTime: '2000ms',
        targetsMet: {
          cost: (totalCost / totalSessions) <= this.config.costLimit,
          performance: hybridStats.avgResponseTime <= 2000
        }
      }
    };
  }
  
  /**
   * Calculate detailed hybrid statistics
   */
  calculateHybridStats() {
    const modelStats = {};
    let totalResponseTime = 0;
    let totalResponseCount = 0;
    
    for (const [model, usage] of this.hybridMetrics.modelUsage.entries()) {
      const responseTimes = this.hybridMetrics.responseTimesByModel.get(model) || [];
      const costs = this.hybridMetrics.costsByModel.get(model) || [];
      const successData = this.hybridMetrics.successRatesByModel.get(model) || { total: 0, successful: 0 };
      
      const avgResponseTime = responseTimes.length > 0 ? 
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
      const avgCost = costs.length > 0 ? 
        costs.reduce((a, b) => a + b, 0) / costs.length : 0;
      const successRate = successData.total > 0 ? 
        (successData.successful / successData.total) * 100 : 0;
      
      modelStats[model] = {
        usage: usage,
        usagePercentage: Number(((usage / this.hybridMetrics.totalRequests) * 100).toFixed(2)),
        avgResponseTime: Math.round(avgResponseTime),
        avgCost: Number(avgCost.toFixed(6)),
        successRate: Number(successRate.toFixed(2))
      };
      
      totalResponseTime += avgResponseTime * usage;
      totalResponseCount += usage;
    }
    
    return {
      totalRequests: this.hybridMetrics.totalRequests,
      modelBreakdown: modelStats,
      avgResponseTime: totalResponseCount > 0 ? Math.round(totalResponseTime / totalResponseCount) : 0,
      strategicInsights: this.generateHybridInsights(modelStats)
    };
  }
  
  /**
   * Generate insights about hybrid strategy performance
   */
  generateHybridInsights(modelStats) {
    const insights = [];
    
    // Find most used model
    const mostUsed = Object.entries(modelStats)
      .sort(([,a], [,b]) => b.usage - a.usage)[0];
    if (mostUsed) {
      insights.push(`Most used model: ${mostUsed[0]} (${mostUsed[1].usagePercentage}%)`);
    }
    
    // Find fastest model
    const fastest = Object.entries(modelStats)
      .sort(([,a], [,b]) => a.avgResponseTime - b.avgResponseTime)[0];
    if (fastest) {
      insights.push(`Fastest model: ${fastest[0]} (${fastest[1].avgResponseTime}ms avg)`);
    }
    
    // Find most cost-effective model
    const cheapest = Object.entries(modelStats)
      .sort(([,a], [,b]) => a.avgCost - b.avgCost)[0];
    if (cheapest) {
      insights.push(`Most cost-effective: ${cheapest[0]} (€${cheapest[1].avgCost} avg)`);
    }
    
    // Performance analysis
    const totalCosts = Object.values(modelStats).map(s => s.avgCost);
    const avgTotalCost = totalCosts.reduce((a, b) => a + b, 0) / totalCosts.length;
    
    if (avgTotalCost <= this.config.costLimit) {
      insights.push('✅ Cost targets are being met');
    } else {
      insights.push('⚠️ Cost targets being exceeded - consider more DeepSeek usage');
    }
    
    return insights;
  }

  /**
   * Clean up old sessions, cache, and hybrid metrics
   */
  cleanup() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    // Clean up old cache entries
    for (const [key, value] of this.responseCache.entries()) {
      if (value.timestamp < oneHourAgo) {
        this.responseCache.delete(key);
      }
    }
    
    // Clean up old session contexts
    for (const [sessionId, history] of this.sessionContext.entries()) {
      if (history.length === 0) {
        this.sessionContext.delete(sessionId);
      }
    }
    
    // Clean up hybrid metrics (keep last 1000 requests)
    for (const [model, responseTimes] of this.hybridMetrics.responseTimesByModel.entries()) {
      if (responseTimes.length > 1000) {
        responseTimes.splice(0, responseTimes.length - 1000);
      }
    }
    
    for (const [model, costs] of this.hybridMetrics.costsByModel.entries()) {
      if (costs.length > 1000) {
        costs.splice(0, costs.length - 1000);
      }
    }
    
    // Clean up hybrid model selector
    if (this.config.hybridEnabled) {
      hybridModelSelector.cleanup();
    }
    
    console.log('🧹 OpenRouter Hybrid AI Engine cleanup completed');
  }

  /**
   * Health check with hybrid strategy status
   */
  async healthCheck() {
    try {
      const stats = this.getUsageStats();
      const hybridStatus = this.config.hybridEnabled ? 
        hybridModelSelector.getStrategyStatus() : 
        { status: 'disabled' };
      
      return {
        status: 'healthy',
        engine: 'OpenRouterEngine_Hybrid',
        strategy: 'GPT-4o Mini + DeepSeek v3.1',
        primaryModel: this.config.model,
        fallbackModel: this.config.fallbackModel,
        hybridEnabled: this.config.hybridEnabled,
        apiConnected: !!this.config.apiKey,
        stats,
        hybridStrategy: hybridStatus,
        lastCleanup: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        engine: 'OpenRouterEngine_Hybrid',
        error: error.message
      };
    }
  }
}

export default OpenRouterEngine;