/**
 * Backup Response System
 * Provides intelligent fallback responses when all services fail
 */

export class BackupResponseSystem {
  constructor(options = {}) {
    this.fallbackLevels = options.fallbackLevels || 4;
    this.responseCache = new Map();
    this.usageStats = {
      level1: 0, // AI fallback
      level2: 0, // Template responses
      level3: 0, // Static responses
      level4: 0  // Emergency responses
    };
  }

  /**
   * Get appropriate fallback response based on context and failure level
   */
  async getFallbackResponse(message, context = {}, failureLevel = 1) {
    const startTime = Date.now();
    
    try {
      let response;
      
      switch (failureLevel) {
        case 1:
          response = await this.getLevel1Fallback(message, context);
          this.usageStats.level1++;
          break;
          
        case 2:
          response = await this.getLevel2Fallback(message, context);
          this.usageStats.level2++;
          break;
          
        case 3:
          response = await this.getLevel3Fallback(message, context);
          this.usageStats.level3++;
          break;
          
        case 4:
        default:
          response = await this.getLevel4Fallback(message, context);
          this.usageStats.level4++;
          break;
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        ...response,
        fallbackLevel: failureLevel,
        responseTime,
        backup: true,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`Fallback level ${failureLevel} failed:`, error);
      
      // If current level fails, try next level
      if (failureLevel < this.fallbackLevels) {
        return this.getFallbackResponse(message, context, failureLevel + 1);
      }
      
      // Ultimate fallback
      return this.getUltimateFallback();
    }
  }

  /**
   * Level 1: AI Fallback (Secondary AI model or cached responses)
   */
  async getLevel1Fallback(message, context) {
    console.log('🔄 Using Level 1 fallback (AI alternative)');
    
    // Try to use a simpler AI model or cached intelligent responses
    const intent = this.classifyIntentBasic(message);
    const cacheKey = `ai_fallback_${intent}`;
    
    if (this.responseCache.has(cacheKey)) {
      const cached = this.responseCache.get(cacheKey);
      return {
        ...cached,
        cached: true
      };
    }
    
    // Generate response based on intent
    const response = this.generateIntelligentFallback(intent, context);
    
    // Cache for future use
    this.responseCache.set(cacheKey, response);
    setTimeout(() => this.responseCache.delete(cacheKey), 300000); // 5 min cache
    
    return response;
  }

  /**
   * Level 2: Template Responses (Rule-based intelligent responses)
   */
  async getLevel2Fallback(message, context) {
    console.log('🔄 Using Level 2 fallback (Template responses)');
    
    const intent = this.classifyIntentBasic(message);
    const templates = this.getResponseTemplates();
    
    const template = templates[intent] || templates.general;
    
    return {
      message: this.personalizeTemplate(template.message, context),
      options: template.options,
      nextStep: template.nextStep,
      intent: intent,
      confidence: template.confidence,
      escalate: template.escalate || false,
      priority: template.priority || 'medium'
    };
  }

  /**
   * Level 3: Static Responses (Pre-defined safe responses)
   */
  async getLevel3Fallback(message, context) {
    console.log('🔄 Using Level 3 fallback (Static responses)');
    
    const staticResponses = {
      greeting: {
        message: "Ciao! Sono l'assistente virtuale di IT-ERA. Come posso aiutarti con i nostri servizi IT?",
        options: ["Richiedi Preventivo", "Assistenza Tecnica", "Informazioni Servizi", "Contatta Specialista"],
        nextStep: "service_selection"
      },
      
      assistance: {
        message: "Per l'assistenza tecnica, il nostro team è disponibile per supportarti. Quale problema stai riscontrando?",
        options: ["Problema Computer", "Problema Rete", "Problema Email", "Altro Problema"],
        nextStep: "technical_issue_selection"
      },
      
      quote: {
        message: "Saremo felici di prepararti un preventivo personalizzato. Potresti fornirmi maggiori dettagli sulla tua esigenza?",
        options: ["Assistenza IT", "Sicurezza Informatica", "Cloud Storage", "Contatta Commerciale"],
        nextStep: "service_details"
      },
      
      general: {
        message: "Grazie per averci contattato. Al momento stiamo riscontrando un problema tecnico, ma posso comunque aiutarti.",
        options: ["Richiedi Preventivo", "Assistenza Urgente", "Informazioni Contatto", "Riprova più tardi"],
        nextStep: "fallback_selection"
      }
    };
    
    const intent = this.classifyIntentBasic(message);
    const response = staticResponses[intent] || staticResponses.general;
    
    return {
      ...response,
      intent: intent,
      confidence: 0.7,
      escalate: intent === 'assistance',
      priority: intent === 'assistance' ? 'high' : 'medium'
    };
  }

  /**
   * Level 4: Emergency Responses (Absolute minimum functionality)
   */
  async getLevel4Fallback(message, context) {
    console.log('🆘 Using Level 4 fallback (Emergency responses)');
    
    // Check for emergency patterns even in fallback
    const isEmergency = this.detectEmergencyBasic(message);
    
    if (isEmergency) {
      return {
        message: `🚨 EMERGENZA RILEVATA!
Numero Emergenza 24/7: 039 888 2041
Team tecnico in allerta per intervento immediato.

CHIAMA SUBITO: 039 888 2041`,
        options: ["CHIAMA ORA: 039 888 2041", "Invia Posizione", "Descrizione Emergenza"],
        nextStep: "emergency_contact",
        intent: "emergency",
        confidence: 1.0,
        escalate: true,
        priority: 'immediate',
        emergency: true
      };
    }
    
    // Standard emergency fallback
    return {
      message: "IT-ERA - Servizi IT Professionali\n\nStiamo riscontrando difficoltà tecniche, ma siamo qui per aiutarti!\n\nContattaci direttamente:\n📞 039 888 2041\n✉️ info@it-era.it",
      options: ["Chiama 039 888 2041", "Invia Email", "Riprova Chat", "Sito Web"],
      nextStep: "direct_contact",
      intent: "contact",
      confidence: 1.0,
      escalate: true,
      priority: 'high'
    };
  }

  /**
   * Ultimate fallback - Last resort response
   */
  getUltimateFallback() {
    console.error('🆘 Using ULTIMATE fallback - all systems failed');
    
    return {
      message: "IT-ERA - Assistenza IT Professionale\n\nTelefono: 039 888 2041\nEmail: info@it-era.it\nIndirizzo: Viale Risorgimento 32, Vimercate (MB)",
      options: ["039 888 2041"],
      nextStep: "emergency_contact",
      intent: "system_failure",
      confidence: 1.0,
      escalate: true,
      priority: 'immediate',
      fallbackLevel: 'ULTIMATE',
      backup: true,
      systemFailure: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Basic intent classification without AI
   */
  classifyIntentBasic(message) {
    const msg = message.toLowerCase();
    
    // Emergency patterns
    const emergencyKeywords = ['emergenza', 'urgente', 'down', 'crash', 'virus', 'hackerato', 'critico'];
    if (emergencyKeywords.some(keyword => msg.includes(keyword))) {
      return 'emergency';
    }
    
    // Greeting patterns
    if (msg.includes('ciao') || msg.includes('salve') || msg.includes('buongiorno')) {
      return 'greeting';
    }
    
    // Quote patterns
    if (msg.includes('preventivo') || msg.includes('prezzo') || msg.includes('costo') || msg.includes('quanto')) {
      return 'quote';
    }
    
    // Assistance patterns
    if (msg.includes('assistenza') || msg.includes('supporto') || msg.includes('aiuto') || msg.includes('problema')) {
      return 'assistance';
    }
    
    // Services patterns
    if (msg.includes('servizi') || msg.includes('cosa fate') || msg.includes('informazioni')) {
      return 'services';
    }
    
    return 'general';
  }

  /**
   * Basic emergency detection without AI
   */
  detectEmergencyBasic(message) {
    const emergencyKeywords = [
      'server down', 'sistema down', 'emergenza', 'urgente', 'critico',
      'virus', 'hackerato', 'ransomware', 'tutto fermo', 'non funziona niente'
    ];
    
    const msg = message.toLowerCase();
    return emergencyKeywords.some(keyword => msg.includes(keyword));
  }

  /**
   * Generate intelligent fallback based on intent
   */
  generateIntelligentFallback(intent, context) {
    const responses = {
      greeting: {
        message: `Ciao! Sono l'assistente virtuale di IT-ERA, la tua azienda di fiducia per i servizi IT ${context.location ? 'a ' + context.location : 'in Lombardia'}. Come posso aiutarti oggi?`,
        options: ["Richiedi Preventivo Gratuito", "Assistenza Tecnica", "I Nostri Servizi", "Contatta Specialista"],
        nextStep: "service_selection",
        confidence: 0.9
      },
      
      quote: {
        message: "Perfetto! Prepareremo un preventivo personalizzato per le tue esigenze. Quale servizio ti interessa maggiormente?",
        options: ["Assistenza IT Completa", "Sicurezza Informatica", "Soluzioni Cloud", "Consulenza Personalizzata"],
        nextStep: "service_selection",
        confidence: 0.8
      },
      
      assistance: {
        message: "Il nostro team tecnico è pronto ad assisterti. Descrivimi brevemente il problema che stai riscontrando così potrò indirizzarti al nostro specialista più adatto.",
        options: ["Problema Urgente", "Assistenza Programmata", "Consulenza Tecnica", "Chiamata Diretta"],
        nextStep: "technical_assessment",
        escalate: true,
        confidence: 0.8
      },
      
      emergency: {
        message: "🚨 Ho rilevato una possibile emergenza IT. Il nostro servizio di assistenza prioritaria è attivo 24/7 per supportarti immediatamente.",
        options: ["CHIAMA ORA: 039 888 2041", "Intervento Immediato", "Assistenza Remota", "Descrivi Emergenza"],
        nextStep: "emergency_response",
        escalate: true,
        priority: 'immediate',
        confidence: 0.9
      },
      
      general: {
        message: "Grazie per aver scelto IT-ERA! Siamo specializzati in soluzioni IT complete per aziende. In cosa posso aiutarti?",
        options: ["I Nostri Servizi", "Richiedi Preventivo", "Assistenza Tecnica", "Chi Siamo"],
        nextStep: "main_menu",
        confidence: 0.7
      }
    };
    
    return responses[intent] || responses.general;
  }

  /**
   * Get response templates
   */
  getResponseTemplates() {
    return {
      greeting: {
        message: "Benvenuto in IT-ERA! Sono qui per aiutarti con le nostre soluzioni IT professionali.",
        options: ["Preventivo", "Assistenza", "Servizi", "Contatti"],
        nextStep: "service_selection",
        confidence: 0.9,
        escalate: false,
        priority: 'low'
      },
      
      quote: {
        message: "Sarò felice di prepararti un preventivo. Quale servizio ti interessa?",
        options: ["Assistenza IT", "Sicurezza", "Cloud", "Altro"],
        nextStep: "quote_details",
        confidence: 0.8,
        escalate: false,
        priority: 'medium'
      },
      
      assistance: {
        message: "Per l'assistenza tecnica, descrivimi il problema e ti metterò in contatto con il nostro team.",
        options: ["Problema Urgente", "Assistenza Standard", "Informazioni", "Contatto Diretto"],
        nextStep: "assistance_triage",
        confidence: 0.8,
        escalate: true,
        priority: 'high'
      },
      
      general: {
        message: "Come posso aiutarti con i servizi IT di IT-ERA?",
        options: ["Preventivo", "Assistenza", "Informazioni", "Contatti"],
        nextStep: "main_selection",
        confidence: 0.6,
        escalate: false,
        priority: 'medium'
      }
    };
  }

  /**
   * Personalize template with context
   */
  personalizeTemplate(template, context) {
    let personalized = template;
    
    if (context.location) {
      personalized = personalized.replace(/\{location\}/g, context.location);
    }
    
    if (context.time) {
      const hour = new Date(context.time).getHours();
      if (hour < 12) {
        personalized = personalized.replace(/\{greeting\}/g, 'Buongiorno');
      } else if (hour < 18) {
        personalized = personalized.replace(/\{greeting\}/g, 'Buon pomeriggio');
      } else {
        personalized = personalized.replace(/\{greeting\}/g, 'Buonasera');
      }
    }
    
    return personalized;
  }

  /**
   * Get fallback usage statistics
   */
  getUsageStats() {
    const total = Object.values(this.usageStats).reduce((sum, count) => sum + count, 0);
    
    return {
      ...this.usageStats,
      total,
      distribution: total > 0 ? {
        level1: ((this.usageStats.level1 / total) * 100).toFixed(1) + '%',
        level2: ((this.usageStats.level2 / total) * 100).toFixed(1) + '%',
        level3: ((this.usageStats.level3 / total) * 100).toFixed(1) + '%',
        level4: ((this.usageStats.level4 / total) * 100).toFixed(1) + '%'
      } : null
    };
  }

  /**
   * Clear response cache
   */
  clearCache() {
    this.responseCache.clear();
    console.log('Fallback response cache cleared');
  }

  /**
   * Reset usage statistics
   */
  resetStats() {
    this.usageStats = {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0
    };
    console.log('Fallback usage statistics reset');
  }
}

// Global backup response system
export const backupResponseSystem = new BackupResponseSystem();