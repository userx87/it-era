/**
 * AI Configuration for IT-ERA Chatbot
 * Centralized configuration for OpenRouter AI integration
 */

export const AIConfig = {
  // OpenRouter Configuration
  OPENROUTER: {
    API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    MODELS: {
      // GPT 4.1 Mini with Vision Support (Updated Priority)
      PRIMARY: 'openai/gpt-4o-mini', // GPT-4o Mini with vision (€0.025/conversation)
      VISION_PRIMARY: 'openai/gpt-4o-mini', // Same model with vision capabilities
      VISION_FALLBACK: 'openai/gpt-4o', // GPT-4o for complex vision tasks
      SECONDARY: 'deepseek/deepseek-chat', // Secondary for technical docs (€0.014/conversation)
      FALLBACK: 'anthropic/claude-3-haiku', // Ultra-fast emergency backup
      // Legacy models kept for compatibility
      LEGACY_PRIMARY: 'anthropic/claude-3.5-sonnet',
      LEGACY_FALLBACK: 'openai/gpt-4o-mini'
    },
    // Vision capabilities configuration
    VISION: {
      ENABLED: true,
      SUPPORTED_MODELS: ['openai/gpt-4o-mini', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet'],
      MAX_IMAGE_SIZE: 20 * 1024 * 1024, // 20MB limit
      SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      MAX_IMAGES_PER_MESSAGE: 5,
      VISION_TOKEN_MULTIPLIER: 1.5, // Vision requests use ~50% more tokens
      DETAIL_LEVELS: {
        HIGH: 'high',    // Detailed analysis (more expensive)
        LOW: 'low',      // Basic analysis (cost-effective)
        AUTO: 'auto'     // Automatic based on image size
      }
    },
    // Hybrid model selection strategy
    HYBRID_STRATEGY: {
      ENABLED: true,
      CUSTOMER_CHAT_MODEL: 'openai/gpt-4o-mini',
      TECHNICAL_DOCS_MODEL: 'deepseek/deepseek-chat',
      SELECTION_CRITERIA: {
        CUSTOMER_KEYWORDS: ['preventivo', 'assistenza', 'supporto', 'prezzo', 'costo', 'urgente', 'aiuto', 'problema', 'servizio'],
        TECHNICAL_KEYWORDS: ['server', 'firewall', 'backup', 'configurazione', 'installazione', 'rete', 'sicurezza', 'vpn', 'cloud']
      },
      // Performance targets
      TARGET_COST_PER_CONVERSATION: 0.035, // €0.035 max per conversation
      TARGET_COST_VISION: 0.060, // €0.060 max per vision conversation
      TARGET_RESPONSE_TIME_MS: 2000, // <2s response time
      TARGET_VISION_RESPONSE_TIME_MS: 4000, // <4s for vision analysis
    },
    COST_LIMITS: {
      PER_SESSION: 0.035, // €0.035 per conversation (optimized for GPT-4o Mini)
      PER_SESSION_VISION: 0.060, // €0.060 per conversation with vision
      PER_HOUR: 2.0, // €2.00 per hour total (increased for vision)
      DAILY_MAX: 20.0, // €20.00 per day maximum (vision support)
      // Emergency limits
      EMERGENCY_COST_LIMIT: 0.100, // €0.10 emergency limit per session
      VISION_EMERGENCY_LIMIT: 0.150, // €0.15 for vision emergencies
    },
    RATE_LIMITS: {
      REQUESTS_PER_MINUTE: 20, // Increased for better performance
      TOKENS_PER_MINUTE: 5000, // Increased capacity
      CONCURRENT_SESSIONS: 15, // More concurrent sessions
    }
  },

  // Response Quality Settings
  RESPONSE: {
    MAX_TOKENS: 300,
    TEMPERATURE: 0.7,
    TOP_P: 0.9,
    PRESENCE_PENALTY: 0.1,
    FREQUENCY_PENALTY: 0.1,
    TIMEOUT_MS: 8000, // 8 second timeout
    RETRY_ATTEMPTS: 2,
  },

  // Caching Configuration
  CACHE: {
    TTL_SECONDS: 3600, // 1 hour
    MAX_SIZE: 1000, // Maximum cached responses
    COMMON_RESPONSES_TTL: 86400, // 24 hours for common FAQ
  },

  // Vision-Specific IT Support Use Cases
  VISION_USE_CASES: {
    ERROR_SCREENSHOTS: {
      KEYWORDS: ['errore', 'screenshot', 'schermata', 'messaggio', 'popup'],
      ANALYSIS_TYPE: 'error_analysis',
      PRIORITY: 'high',
      DETAIL_LEVEL: 'high'
    },
    HARDWARE_PHOTOS: {
      KEYWORDS: ['hardware', 'computer', 'server', 'componente', 'foto'],
      ANALYSIS_TYPE: 'hardware_identification',
      PRIORITY: 'medium',
      DETAIL_LEVEL: 'high'
    },
    NETWORK_DIAGRAMS: {
      KEYWORDS: ['rete', 'diagramma', 'schema', 'topologia', 'configurazione'],
      ANALYSIS_TYPE: 'network_analysis',
      PRIORITY: 'high',
      DETAIL_LEVEL: 'high'
    },
    EQUIPMENT_ID: {
      KEYWORDS: ['modello', 'marca', 'etichetta', 'seriale', 'identificazione'],
      ANALYSIS_TYPE: 'equipment_identification',
      PRIORITY: 'medium',
      DETAIL_LEVEL: 'low'
    },
    SECURITY_ALERTS: {
      KEYWORDS: ['firewall', 'security', 'alert', 'warning', 'sicurezza'],
      ANALYSIS_TYPE: 'security_analysis',
      PRIORITY: 'immediate',
      DETAIL_LEVEL: 'high'
    }
  },

  // IT-ERA Specific Settings
  BUSINESS_CONTEXT: {
    COMPANY_NAME: 'IT-ERA',
    PARENT_COMPANY: 'Bulltech Informatica',
    PRIMARY_PHONE: '039 888 2041',
    PRIMARY_EMAIL: 'info@it-era.it',
    SERVICE_AREA: 'Vimercate, Monza, Brianza, Milano Est',
    BUSINESS_HOURS: 'Lun-Ven 8:30-18:00',
    SPECIALIZATIONS: [
      'WatchGuard Firewall Partner',
      'Assistenza IT PMI',
      'Backup e Disaster Recovery',
      'Riparazione Hardware Certificata'
    ],
  },

  // Lead Qualification Rules
  LEAD_QUALIFICATION: {
    HIGH_PRIORITY_KEYWORDS: [
      'emergenza', 'urgente', 'server down', 'malware', 'ransomware',
      'firewall', 'watchguard', 'sicurezza', 'backup', 'disaster recovery'
    ],
    HIGH_VALUE_LOCATIONS: [
      'vimercate', 'monza', 'agrate', 'concorezzo', 'brianza'
    ],
    MINIMUM_COMPANY_SIZE: 5, // Minimum employees for B2B focus
    BUDGET_THRESHOLDS: {
      HIGH: 5000, // €5,000+
      MEDIUM: 1000, // €1,000-€5,000
      LOW: 200, // Under €1,000
    },
  },

  // Escalation Rules
  ESCALATION: {
    IMMEDIATE_TRIGGERS: [
      'emergenza', 'server down', 'malware', 'critico', 'bloccato'
    ],
    HUMAN_REQUEST_TRIGGERS: [
      'umano', 'persona', 'operatore', 'parlare con', 'tecnico'
    ],
    AUTO_ESCALATION_CONDITIONS: {
      MESSAGE_COUNT: 8, // After 8+ messages
      SESSION_DURATION: 10 * 60 * 1000, // After 10 minutes
      HIGH_PRIORITY_LEAD: true,
      COST_LIMIT_REACHED: true,
    },
  },

  // Performance Monitoring
  MONITORING: {
    TRACK_RESPONSE_TIME: true,
    TRACK_COSTS: true,
    TRACK_SUCCESS_RATE: true,
    LOG_CONVERSATIONS: true,
    ALERT_THRESHOLDS: {
      RESPONSE_TIME_MS: 5000,
      ERROR_RATE_PERCENT: 10,
      COST_PER_HOUR: 3.0,
    },
  },

  // Integration Settings
  INTEGRATIONS: {
    TEAMS_WEBHOOK: {
      ENABLED: true,
      SEND_ON_ESCALATION: true,
      SEND_HIGH_PRIORITY_LEADS: true,
      INCLUDE_CONVERSATION_SUMMARY: true,
    },
    EMAIL_SYSTEM: {
      ENABLED: true,
      AUTO_SEND_QUALIFIED_LEADS: true,
      INCLUDE_AI_INSIGHTS: true,
      RESPONSE_TIME_SLA: 4 * 60 * 60 * 1000, // 4 hours
    },
  },
};

/**
 * Enhanced Hybrid Model Selection with Vision Support
 */
export function selectHybridModel(message, context = {}) {
  const hybrid = AIConfig.OPENROUTER.HYBRID_STRATEGY;
  const vision = AIConfig.OPENROUTER.VISION;
  
  if (!hybrid.ENABLED) {
    return AIConfig.OPENROUTER.MODELS.PRIMARY;
  }
  
  const msgLower = message.toLowerCase();
  
  // PRIORITY: Vision requests get vision-capable models
  if (context.hasImages || context.visionRequired) {
    // Check if emergency or high-priority vision request
    if (context.priority === 'emergency' || context.priority === 'immediate') {
      return vision.SUPPORTED_MODELS.includes(AIConfig.OPENROUTER.MODELS.VISION_FALLBACK) ?
        AIConfig.OPENROUTER.MODELS.VISION_FALLBACK : 
        AIConfig.OPENROUTER.MODELS.VISION_PRIMARY;
    }
    
    // Use primary vision model for most cases
    return AIConfig.OPENROUTER.MODELS.VISION_PRIMARY;
  }
  
  // Check for customer service context
  const isCustomerChat = hybrid.SELECTION_CRITERIA.CUSTOMER_KEYWORDS.some(
    keyword => msgLower.includes(keyword)
  );
  
  // Check for technical documentation context
  const isTechnicalDocs = hybrid.SELECTION_CRITERIA.TECHNICAL_KEYWORDS.some(
    keyword => msgLower.includes(keyword)
  );
  
  // Priority-based selection
  if (context.priority === 'emergency' || context.escalate) {
    return hybrid.CUSTOMER_CHAT_MODEL; // GPT-4o Mini for fast customer response
  }
  
  // Context-based selection
  if (isTechnicalDocs && !isCustomerChat) {
    return hybrid.TECHNICAL_DOCS_MODEL; // DeepSeek for technical content
  }
  
  if (isCustomerChat) {
    return hybrid.CUSTOMER_CHAT_MODEL; // GPT-4o Mini for customer interaction
  }
  
  // Default: use cost analysis to choose best model
  const costLimit = context.hasImages ? 
    hybrid.TARGET_COST_VISION : 
    hybrid.TARGET_COST_PER_CONVERSATION;
    
  const sessionCost = context.totalCost || 0;
  if (sessionCost > (costLimit * 0.8)) {
    return hybrid.TECHNICAL_DOCS_MODEL; // Switch to cheaper DeepSeek
  }
  
  return hybrid.CUSTOMER_CHAT_MODEL; // Default to GPT-4o Mini
}

/**
 * Get model configuration based on priority and context (Updated for Hybrid)
 */
export function getModelConfig(priority = 'standard', context = {}, message = '') {
  const baseConfig = {
    maxTokens: AIConfig.RESPONSE.MAX_TOKENS,
    temperature: AIConfig.RESPONSE.TEMPERATURE,
    topP: AIConfig.RESPONSE.TOP_P,
    presencePenalty: AIConfig.RESPONSE.PRESENCE_PENALTY,
    frequencyPenalty: AIConfig.RESPONSE.FREQUENCY_PENALTY,
  };
  
  // Select model using hybrid strategy
  const selectedModel = selectHybridModel(message, context);

  switch (priority) {
    case 'emergency':
      return {
        ...baseConfig,
        model: AIConfig.OPENROUTER.MODELS.FALLBACK, // Claude Haiku for emergency speed
        maxTokens: 150, // Faster response
        temperature: 0.5, // More focused
      };
    
    case 'high_quality':
      return {
        ...baseConfig,
        model: AIConfig.OPENROUTER.MODELS.PRIMARY, // GPT-4o Mini
        maxTokens: 400, // More detailed
        temperature: 0.8, // More creative
      };
    
    case 'cost_effective':
      return {
        ...baseConfig,
        model: AIConfig.OPENROUTER.MODELS.SECONDARY, // DeepSeek
        maxTokens: 200, // Shorter responses
        temperature: 0.6, // Balanced
      };
    
    case 'hybrid':
    default:
      return {
        ...baseConfig,
        model: selectedModel,
        maxTokens: selectedModel === AIConfig.OPENROUTER.MODELS.SECONDARY ? 250 : 300,
        temperature: selectedModel === AIConfig.OPENROUTER.MODELS.SECONDARY ? 0.6 : 0.7,
      };
  }
}

/**
 * Check if escalation is needed based on business rules
 */
export function shouldEscalateConversation(context, message = '') {
  const msgLower = message.toLowerCase();
  
  // Immediate escalation triggers
  if (AIConfig.ESCALATION.IMMEDIATE_TRIGGERS.some(trigger => msgLower.includes(trigger))) {
    return { escalate: true, priority: 'immediate', reason: 'emergency_keyword' };
  }
  
  // Human request triggers
  if (AIConfig.ESCALATION.HUMAN_REQUEST_TRIGGERS.some(trigger => msgLower.includes(trigger))) {
    return { escalate: true, priority: 'high', reason: 'human_request' };
  }
  
  // Auto escalation conditions
  const conditions = AIConfig.ESCALATION.AUTO_ESCALATION_CONDITIONS;
  
  if (context.messageCount >= conditions.MESSAGE_COUNT) {
    return { escalate: true, priority: 'medium', reason: 'long_conversation' };
  }
  
  if (context.sessionDuration >= conditions.SESSION_DURATION) {
    return { escalate: true, priority: 'medium', reason: 'long_session' };
  }
  
  if (context.totalCost >= AIConfig.OPENROUTER.COST_LIMITS.PER_SESSION) {
    return { escalate: true, priority: 'medium', reason: 'cost_limit' };
  }
  
  return { escalate: false, priority: 'low', reason: 'continue' };
}

/**
 * Calculate lead priority score based on IT-ERA criteria
 */
export function calculateLeadPriority(leadData = {}, context = {}) {
  let score = 0;
  
  // Geographic priority (highest weight for IT-ERA)
  const location = (leadData.location || '').toLowerCase();
  if (AIConfig.LEAD_QUALIFICATION.HIGH_VALUE_LOCATIONS.some(loc => location.includes(loc))) {
    score += 40; // Maximum geographic bonus
  } else if (location.includes('milano')) {
    score += 20;
  } else if (location.includes('lombardia') || location.includes('bergamo')) {
    score += 10;
  }
  
  // Company size (B2B focus)
  const companySize = parseInt(leadData.company_size) || 0;
  if (companySize >= 50) score += 30;
  else if (companySize >= 20) score += 25;
  else if (companySize >= 10) score += 20;
  else if (companySize >= 5) score += 15;
  else if (companySize > 0) score += 5;
  
  // Service type (high-margin services)
  const service = (leadData.service_type || '').toLowerCase();
  if (service.includes('firewall') || service.includes('sicurezza')) score += 25;
  else if (service.includes('server') || service.includes('backup')) score += 20;
  else if (service.includes('assistenza') || service.includes('contratto')) score += 15;
  else if (service.includes('riparazione')) score += 10;
  
  // Urgency indicators
  const urgency = (leadData.urgency || context.currentMessage || '').toLowerCase();
  if (urgency.includes('urgente') || urgency.includes('emergenza')) score += 25;
  else if (urgency.includes('settimana')) score += 15;
  else if (urgency.includes('mese')) score += 10;
  
  // Budget indicators
  const budget = (leadData.budget_range || '').toLowerCase();
  if (budget.includes('10000') || budget.includes('10.000')) score += 25;
  else if (budget.includes('5000') || budget.includes('5.000')) score += 20;
  else if (budget.includes('1000') || budget.includes('1.000')) score += 15;
  
  // Conversation engagement
  if (context.messageCount >= 5) score += 10;
  if (context.sessionDuration >= 5 * 60 * 1000) score += 5; // 5+ minutes
  
  // Determine priority level
  if (score >= 80) return 'immediate';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

/**
 * Get enhanced system prompt with vision capabilities
 */
export function getSystemPrompt(context = {}) {
  const business = AIConfig.BUSINESS_CONTEXT;
  const hasImages = context.hasImages || context.images?.length > 0;
  
  let basePrompt = `Sei l'assistente virtuale di ${business.COMPANY_NAME}, specialista in servizi IT per aziende in Lombardia.

🏢 AZIENDA: ${business.COMPANY_NAME} (${business.PARENT_COMPANY})
📞 CONTATTO: ${business.PRIMARY_PHONE}
📧 EMAIL: ${business.PRIMARY_EMAIL}
📍 ZONA: ${business.SERVICE_AREA}
⏰ ORARI: ${business.BUSINESS_HOURS}

🎯 SPECIALIZZAZIONI:
${business.SPECIALIZATIONS.map(spec => `• ${spec}`).join('\n')}

💡 OBIETTIVI CONVERSAZIONE:
1. Identificare servizio d'interesse del cliente
2. Raccogliere informazioni aziendali (nome, dimensioni, zona, urgenza)
3. Pre-qualificare il lead per valore e priorità
4. Gestire escalation quando appropriato`;

  // Add vision-specific instructions if images are present
  if (hasImages) {
    basePrompt += `

📸 ANALISI IMMAGINI - COMPETENZE SPECIALISTICHE:
• DIAGNOSI ERRORI: Analizza screenshot di errori, popup, messaggi di sistema
• IDENTIFICAZIONE HARDWARE: Riconosci modelli PC, server, componenti, etichette
• ANALISI RETI: Interpreta diagrammi di rete, configurazioni, topologie
• SICUREZZA: Identifica alert di sicurezza, firewall, malware, vulnerabilità
• RIPARAZIONE: Suggerisci soluzioni basate su foto di problemi hardware

🔍 APPROCCIO ANALISI IMMAGINI:
1. Descrivi ciò che vedi in modo tecnico e preciso
2. Identifica il problema specifico mostrato
3. Proponi soluzioni immediate quando possibile
4. Escalation se richiede intervento fisico
5. Sempre in italiano, linguaggio tecnico ma accessibile

⚡ ESCALATION IMMEDIATA PER IMMAGINI:
• Server down o errori critici di sistema
• Malware o alert di sicurezza
• Hardware danneggiato che richiede sostituzione
• Problemi di rete che bloccano la produttività`;
  }

  basePrompt += `

🗣️ STILE COMUNICAZIONE:
• Professionale ma amichevole
• Sempre in italiano
• Risposte concise e mirate (max 2-3 frasi principali)
• Focus su benefici concreti e ROI
• Enfatizzare specializzazione locale e esperienza

⚡ ESCALATION AUTOMATICA per:
• Keywords emergenza: ${AIConfig.ESCALATION.IMMEDIATE_TRIGGERS.join(', ')}
• Richiesta operatore umano
• Lead qualificato pronto (zona Brianza + 5+ dipendenti)
• Conversazioni prolungate (8+ messaggi)

Contesto attuale: ${JSON.stringify(context, null, 2)}

Rispondi sempre come esperto ${business.COMPANY_NAME} con focus su generazione lead B2B di qualità.`;

  return basePrompt;
}

/**
 * Analyze image content and determine use case
 */
export function analyzeImageUseCase(imageData, message = '') {
  const msgLower = message.toLowerCase();
  const visionUseCases = AIConfig.VISION_USE_CASES;
  
  // Analyze message context for clues
  for (const [useCase, config] of Object.entries(visionUseCases)) {
    const hasKeywords = config.KEYWORDS.some(keyword => msgLower.includes(keyword));
    if (hasKeywords) {
      return {
        useCase: config.ANALYSIS_TYPE,
        priority: config.PRIORITY,
        detailLevel: config.DETAIL_LEVEL,
        escalateImmediately: config.PRIORITY === 'immediate'
      };
    }
  }
  
  // Default analysis for unclassified images
  return {
    useCase: 'general_analysis',
    priority: 'medium',
    detailLevel: 'auto',
    escalateImmediately: false
  };
}

/**
 * Calculate vision-enhanced cost limits
 */
export function getVisionCostLimits(hasImages = false, imageCount = 0) {
  const baseLimits = AIConfig.OPENROUTER.COST_LIMITS;
  
  if (!hasImages) {
    return {
      perSession: baseLimits.PER_SESSION,
      perHour: baseLimits.PER_HOUR,
      emergency: baseLimits.EMERGENCY_COST_LIMIT
    };
  }
  
  // Adjust costs based on image analysis needs
  const visionMultiplier = 1 + (imageCount * 0.3); // 30% increase per image
  
  return {
    perSession: baseLimits.PER_SESSION_VISION * visionMultiplier,
    perHour: baseLimits.PER_HOUR,
    emergency: baseLimits.VISION_EMERGENCY_LIMIT
  };
}

export default AIConfig;