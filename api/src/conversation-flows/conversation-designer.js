/**
 * Conversation Designer for IT-ERA AI Chatbot
 * Manages conversation flows, intent recognition, and escalation logic
 */

import { ITERAKnowledgeBase, KnowledgeUtils } from '../knowledge-base/it-era-knowledge.js';

export class ConversationDesigner {
  constructor(config = {}) {
    this.config = {
      maxConversationLength: config.maxConversationLength || 20,
      escalationThreshold: config.escalationThreshold || 0.7,
      leadQualificationScore: config.leadQualificationScore || 0.8,
      language: config.language || 'italian',
      ...config
    };
    
    this.conversationFlows = this.initializeFlows();
    this.intentPatterns = this.initializeIntentPatterns();
    this.escalationTriggers = this.initializeEscalationTriggers();
  }

  /**
   * Initialize conversation flows
   */
  initializeFlows() {
    return {
      greeting: {
        id: 'greeting',
        triggers: ['start', 'ciao', 'salve', 'buongiorno', 'buonasera', 'hey'],
        response: {
          message: "[IT-ERA] Ciao, come posso aiutarti?",
          options: ["Preventivo", "Assistenza Tecnica", "Info Servizi", "Parlare con Umano"],
          nextSteps: ['service_inquiry', 'support_request', 'general_info', 'escalation'],
          collectData: false
        }
      },

      emergency_detection: {
        id: 'emergency_detection',
        triggers: ['server crash', 'emergenza', 'urgente', 'tutto fermo', 'bloccato', 'down', 'non funziona niente', 'sistema fermo'],
        response: {
          message: "[IT-ERA] EMERGENZA RILEVATA! Ti trasferisco IMMEDIATAMENTE al nostro team di supporto.\n\n📞 CHIAMA SUBITO: 039 888 2041\n\nUn tecnico ti risponderà entro 2 minuti per risolvere il problema!",
          escalate: true,
          priority: 'emergency',
          skipQualification: true,
          immediateEscalation: true
        }
      },

      service_inquiry: {
        id: 'service_inquiry', 
        triggers: ['preventivo', 'servizi', 'cosa fate', 'soluzioni', 'offerta'],
        response: {
          message: "[IT-ERA] Perfetto! IT-ERA offre servizi IT completi:\n\n🌐 **Siti Web** (€2.500-€15.000)\n🛒 **E-commerce** (€5.000-€25.000)\n📱 **App Mobile** (€10.000-€50.000)\n☁️ **Server & Cloud** (€150-€2.000/mese)\n🔒 **Cybersecurity** (€100-€800/mese)\n🔧 **Assistenza IT** (€80-€200/ora)\n\n💡 Per casi urgenti chiama: 039 888 2041\n\nDi quale servizio hai bisogno?",
          options: ["Sito Web", "E-commerce", "App Mobile", "Server/Cloud", "Cybersecurity", "Assistenza IT"],
          nextSteps: ['service_detail', 'service_detail', 'service_detail', 'service_detail', 'service_detail', 'service_detail'],
          collectData: false
        }
      },

      roi_inquiry: {
        id: 'roi_inquiry',
        triggers: ['roi', 'ritorno investimento', 'commercialista', 'budget', 'costi', 'risparmio', 'convenienza'],
        response: {
          message: "[IT-ERA] Ecco i numeri concreti del ROI:\n\n💰 **RISPARMIO IMMEDIATO:**\n• Sito web professionale: €15.000/anno risparmio marketing\n• E-commerce: +280% vendite online (media clienti)\n• Server cloud: -€8.400/anno vs server fisico\n• Cybersecurity: -€45.000 costo medio breach\n\n📈 **TEMPI DI RIENTRO:**\n• Sito web: 3-4 mesi\n• E-commerce: 2-3 mesi\n• Digitalizzazione completa: 4-6 mesi\n\n🎯 **ROI 3 ANNI: +340% medio**\n\n📞 Per analisi dettagliata: 039 888 2041",
          options: ["Calcolo Personalizzato", "Case Study", "Preventivo", "Consulenza"],
          nextSteps: ['business_qualification', 'case_studies', 'service_inquiry', 'human_escalation']
        }
      },

      service_detail: {
        id: 'service_detail',
        response: {
          dynamic: true, // Response generated dynamically based on selected service
          collectData: true,
          dataFields: ['service_type', 'initial_interest']
        }
      },

      business_qualification: {
        id: 'business_qualification',
        response: {
          message: "[IT-ERA] Ottimo! Per prepararti un preventivo personalizzato, dimmi:",
          questions: [
            {
              field: 'company_name',
              question: "🏢 Qual è il nome della tua azienda?",
              validation: 'text',
              required: true
            },
            {
              field: 'sector', 
              question: "🎯 In che settore operate?",
              options: ["Servizi", "Manifatturiero", "Retail/Commercio", "Consulenza", "Sanità", "Altro"],
              validation: 'choice'
            },
            {
              field: 'location',
              question: "📍 In che città/provincia siete?", 
              validation: 'text',
              required: true
            },
            {
              field: 'company_size',
              question: "👥 Quanti dipendenti ha l'azienda?",
              options: ["1-5", "6-15", "16-50", "51-100", "100+"],
              validation: 'choice'
            },
            {
              field: 'budget_range',
              question: "💰 Che budget avete previsto per questo progetto?",
              options: ["< €5.000", "€5.000-€15.000", "€15.000-€30.000", "€30.000+", "Da valutare"],
              validation: 'choice'
            },
            {
              field: 'timeline',
              question: "⏰ Entro quando vorreste realizzare il progetto?",
              options: ["Urgente (1 mese)", "2-3 mesi", "4-6 mesi", "Oltre 6 mesi", "Flessibile"],
              validation: 'choice'
            }
          ],
          collectData: true,
          nextSteps: ['lead_qualification']
        }
      },

      lead_qualification: {
        id: 'lead_qualification',
        response: {
          dynamic: true, // Evaluate lead quality and determine next action
          collectData: true,
          evaluateQualification: true
        }
      },

      contact_collection: {
        id: 'contact_collection',
        response: {
          message: "[IT-ERA] Perfetto! Ho tutte le informazioni per il tuo progetto. Per inviarti il preventivo personalizzato:",
          questions: [
            {
              field: 'contact_name',
              question: "👤 Nome e cognome del referente?",
              validation: 'text',
              required: true
            },
            {
              field: 'email',
              question: "📧 Email aziendale per ricevere il preventivo?",
              validation: 'email',
              required: true
            },
            {
              field: 'phone',
              question: "📱 Numero di telefono per eventuale chiamata?",
              validation: 'phone',
              required: true
            }
          ],
          collectData: true,
          nextSteps: ['escalation_preparation']
        }
      },

      escalation_preparation: {
        id: 'escalation_preparation',
        response: {
          message: "[IT-ERA] Grazie! I tuoi dati sono stati registrati.\n\n✅ **Progetto**: {service_type}\n✅ **Azienda**: {company_name}\n✅ **Settore**: {sector}\n✅ **Budget**: {budget_range}\n✅ **Timeline**: {timeline}\n\n🎯 **Prossimi passi:**\n• Analisi dettagliata del progetto\n• Preventivo personalizzato\n• Chiamata per approfondire\n\n📞 Ti contatteremo entro 2 ore lavorative!\n📞 Per urgenze immediate: 039 888 2041",
          escalate: true,
          collectData: true
        }
      },

      support_request: {
        id: 'support_request',
        triggers: ['assistenza', 'supporto', 'problema', 'aiuto', 'non funziona'],
        response: {
          message: "[IT-ERA] Ti aiuto con l'assistenza tecnica! 🔧\n\n📞 Per EMERGENZE: 039 888 2041 (risposta immediata)\n\nDi che tipo di supporto hai bisogno?",
          options: ["Problema Urgente", "Manutenzione Sito", "Email/Server", "Consulenza", "Altro"],
          nextSteps: ['support_detail', 'support_detail', 'support_detail', 'support_detail', 'support_detail'],
          collectData: true,
          dataFields: ['support_type']
        }
      },

      support_detail: {
        id: 'support_detail',
        response: {
          dynamic: true,
          questions: [
            {
              field: 'problem_description',
              question: "📝 Puoi descrivermi il problema?",
              validation: 'text',
              required: true
            },
            {
              field: 'urgency',
              question: "⚡ Quanto è urgente?",
              options: ["Critico - Sistema down", "Urgente - Impatta business", "Normale - Può attendere", "Bassa - Info generale"],
              validation: 'choice'
            }
          ],
          collectData: true,
          nextSteps: ['support_qualification']
        }
      },

      general_info: {
        id: 'general_info',
        triggers: ['informazioni', 'chi siete', 'cosa fate', 'dove siete'],
        response: {
          message: "[IT-ERA] **IT-ERA** è un'azienda specializzata in soluzioni IT per aziende in Lombardia.\n\n🎯 **La nostra missione**: Digitalizzare le PMI italiane con soluzioni su misura.\n\n💼 **Servizi principali**:\n• Siti web e e-commerce professionali\n• App mobile native\n• Infrastrutture cloud e server\n• Cybersecurity aziendale\n• Assistenza IT completa\n\n📍 **Sede**: Viale Risorgimento 32, Vimercate MB\n📞 **Tel**: 039 888 2041\n📧 **Email**: info@it-era.it\n\n🌐 **Operiamo in**: Lombardia (on-site) e tutta Italia (remoto)\n\nVuoi sapere di più su qualche servizio specifico?",
          options: ["Preventivo Personalizzato", "Portfolio Progetti", "Assistenza", "Contatti"],
          nextSteps: ['service_inquiry', 'portfolio_request', 'support_request', 'contact_info']
        }
      },

      faq_response: {
        id: 'faq_response',
        response: {
          dynamic: true, // Generated based on FAQ match
          nextSteps: ['follow_up_question']
        }
      },

      human_escalation: {
        id: 'human_escalation',
        triggers: ['umano', 'persona', 'operatore', 'parlare con qualcuno', 'chiamate'],
        response: {
          message: "[IT-ERA] Certamente! Ti metto subito in contatto con un nostro consulente.\n\n📞 **Chiama direttamente: 039 888 2041**\n\n**Preferisci che ti chiamiamo o vuoi inviarci una email?**",
          options: ["Chiamatemi Subito", "Invio Email", "Entrambi"],
          escalate: true,
          priority: 'high',
          nextSteps: ['contact_collection']
        }
      }
    };
  }

  /**
   * Initialize intent recognition patterns
   */
  initializeIntentPatterns() {
    return {
      greeting: {
        patterns: ['ciao', 'salve', 'buongiorno', 'buonasera', 'hello', 'hey', 'iniziamo'],
        confidence: 0.9
      },
      service_inquiry: {
        patterns: ['preventivo', 'prezzo', 'costo', 'servizi', 'soluzioni', 'sviluppo', 'realizzare'],
        confidence: 0.8
      },
      web_development: {
        patterns: ['sito', 'website', 'web', 'homepage', 'portale', 'landing'],
        confidence: 0.85
      },
      ecommerce: {
        patterns: ['ecommerce', 'e-commerce', 'negozio online', 'shop', 'vendere online'],
        confidence: 0.9
      },
      mobile_app: {
        patterns: ['app', 'mobile', 'applicazione', 'ios', 'android'],
        confidence: 0.9
      },
      server_cloud: {
        patterns: ['server', 'hosting', 'cloud', 'aws', 'infrastruttura'],
        confidence: 0.85
      },
      cybersecurity: {
        patterns: ['sicurezza', 'cybersecurity', 'backup', 'antivirus', 'firewall'],
        confidence: 0.9
      },
      support: {
        patterns: ['assistenza', 'supporto', 'problema', 'aiuto', 'non funziona', 'errore'],
        confidence: 0.85
      },
      urgent: {
        patterns: ['urgente', 'subito', 'immediato', 'critico', 'emergency'],
        confidence: 0.95
      },
      emergency: {
        patterns: ['server crash', 'emergenza', 'tutto fermo', 'bloccato', 'down', 'non funziona niente', 'sistema fermo'],
        confidence: 1.0
      },
      roi_inquiry: {
        patterns: ['roi', 'ritorno investimento', 'commercialista', 'risparmio', 'convenienza', 'rientro', 'budget'],
        confidence: 0.9
      },
      human_request: {
        patterns: ['umano', 'persona', 'operatore', 'parlare', 'chiamare', 'telefono'],
        confidence: 0.9
      },
      pricing: {
        patterns: ['prezzo', 'costo', 'budget', 'spesa', 'investimento', 'quotazione'],
        confidence: 0.8
      },
      timeline: {
        patterns: ['tempo', 'quando', 'durata', 'tempi', 'consegna', 'deadline'],
        confidence: 0.8
      }
    };
  }

  /**
   * Initialize escalation triggers
   */
  initializeEscalationTriggers() {
    return {
      explicit_human_request: {
        patterns: ['umano', 'persona', 'operatore', 'manager', 'responsabile'],
        priority: 'immediate',
        action: 'human_handoff'
      },
      high_value_lead: {
        conditions: ['budget > 15000', 'company_size > 25', 'urgency = urgent'],
        priority: 'high',
        action: 'sales_team'
      },
      technical_complexity: {
        patterns: ['complesso', 'integrazione', 'custom', 'specifico', 'particolare'],
        priority: 'medium',
        action: 'technical_team'
      },
      dissatisfaction: {
        patterns: ['frustrato', 'arrabbiato', 'delusione', 'insoddisfatto', 'male'],
        priority: 'high',
        action: 'customer_care'
      },
      repeated_misunderstanding: {
        conditions: ['conversation_length > 10', 'intent_confidence < 0.5'],
        priority: 'medium',
        action: 'human_assist'
      }
    };
  }

  /**
   * Process incoming message and determine response
   */
  async processMessage(message, conversationContext, aiResponse = null) {
    try {
      const context = { ...conversationContext };
      
      // CRITICAL: Check for emergency keywords first
      if (this.isEmergencyMessage(message)) {
        return this.handleEmergencyResponse();
      }
      
      // Intent recognition
      const intents = this.recognizeIntents(message);
      const primaryIntent = intents[0];
      
      // Check for escalation triggers
      const escalation = this.checkEscalationTriggers(message, context, intents);
      
      if (escalation.required) {
        return await this.handleEscalation(escalation, context);
      }
      
      // Determine conversation flow
      const currentStep = context.currentStep || 'greeting';
      const flowResponse = await this.generateFlowResponse(primaryIntent, currentStep, context, aiResponse);
      
      // Update conversation context
      const updatedContext = this.updateConversationContext(context, primaryIntent, flowResponse);
      
      return {
        ...flowResponse,
        intent: primaryIntent.intent,
        confidence: primaryIntent.confidence,
        context: updatedContext,
        escalation: escalation.required ? escalation : null
      };
      
    } catch (error) {
      console.error('Conversation processing error:', error);
      return this.getFallbackResponse();
    }
  }

  /**
   * Check if message contains emergency keywords
   */
  isEmergencyMessage(message) {
    const emergencyKeywords = ['server crash', 'emergenza', 'urgente', 'tutto fermo', 'bloccato', 'down', 'non funziona niente', 'sistema fermo', 'critical', 'critico'];
    const msg = message.toLowerCase();
    return emergencyKeywords.some(keyword => msg.includes(keyword));
  }

  /**
   * Handle emergency response
   */
  handleEmergencyResponse() {
    return {
      message: "[IT-ERA] 🚨 EMERGENZA RILEVATA! Ti trasferisco IMMEDIATAMENTE al nostro team di supporto.\n\n📞 CHIAMA SUBITO: 039 888 2041\n\nUn tecnico ti risponderà entro 2 minuti per risolvere il problema!",
      escalate: true,
      priority: 'emergency',
      intent: 'emergency',
      confidence: 1.0,
      skipQualification: true,
      immediateEscalation: true
    };
  }

  /**
   * Recognize intents from message
   */
  recognizeIntents(message) {
    const msg = message.toLowerCase();
    const intents = [];
    
    Object.entries(this.intentPatterns).forEach(([intent, config]) => {
      let matchScore = 0;
      let matches = 0;
      
      config.patterns.forEach(pattern => {
        if (msg.includes(pattern)) {
          matches++;
          matchScore += pattern.length / msg.length;
        }
      });
      
      if (matches > 0) {
        const confidence = Math.min(config.confidence * (matchScore + matches * 0.1), 1);
        intents.push({ intent, confidence, matches });
      }
    });
    
    // Sort by confidence
    return intents.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Check for escalation triggers
   */
  checkEscalationTriggers(message, context, intents) {
    const msg = message.toLowerCase();
    
    // Explicit human request
    if (this.escalationTriggers.explicit_human_request.patterns.some(p => msg.includes(p))) {
      return {
        required: true,
        type: 'explicit_human_request',
        priority: 'immediate',
        reason: 'User explicitly requested human contact'
      };
    }
    
    // High value lead detection
    if (context.leadData) {
      const { budget_range, company_size, urgency } = context.leadData;
      if (budget_range?.includes('30.000+') || 
          company_size?.includes('100+') || 
          urgency === 'Urgente (1 mese)') {
        return {
          required: true,
          type: 'high_value_lead',
          priority: 'high',
          reason: 'High-value lead qualification met'
        };
      }
    }
    
    // Conversation length check
    if (context.messageCount > 15) {
      return {
        required: true,
        type: 'long_conversation',
        priority: 'medium',
        reason: 'Conversation exceeds optimal length'
      };
    }
    
    // Low confidence pattern
    if (intents.length === 0 || intents[0].confidence < 0.3) {
      context.lowConfidenceCount = (context.lowConfidenceCount || 0) + 1;
      if (context.lowConfidenceCount >= 3) {
        return {
          required: true,
          type: 'repeated_misunderstanding',
          priority: 'medium',
          reason: 'Multiple low-confidence responses'
        };
      }
    }
    
    return { required: false };
  }

  /**
   * Generate flow-based response
   */
  async generateFlowResponse(primaryIntent, currentStep, context, aiResponse) {
    const intent = primaryIntent?.intent || 'general';
    
    // Check if we have a specific flow for this intent
    const flow = this.conversationFlows[intent] || this.conversationFlows[currentStep];
    
    if (!flow) {
      return this.generateDynamicResponse(intent, context, aiResponse);
    }
    
    // Handle dynamic responses
    if (flow.response.dynamic) {
      return await this.generateDynamicFlowResponse(flow, intent, context, aiResponse);
    }
    
    // Static flow response
    return {
      message: this.interpolateMessage(flow.response.message, context),
      options: flow.response.options,
      nextStep: Array.isArray(flow.response.nextSteps) ? 
                flow.response.nextSteps[0] : flow.response.nextSteps,
      collectData: flow.response.collectData || false,
      questions: flow.response.questions,
      escalate: flow.response.escalate || false
    };
  }

  /**
   * Generate dynamic flow response
   */
  async generateDynamicFlowResponse(flow, intent, context, aiResponse) {
    switch (flow.id) {
      case 'service_detail':
        return this.generateServiceDetailResponse(context, aiResponse);
        
      case 'lead_qualification':
        return this.generateQualificationResponse(context);
        
      case 'faq_response':
        return this.generateFAQResponse(context.lastMessage);
        
      case 'support_detail':
        return this.generateSupportDetailResponse(context);
        
      default:
        return this.generateDynamicResponse(intent, context, aiResponse);
    }
  }

  /**
   * Generate service detail response
   */
  generateServiceDetailResponse(context, aiResponse) {
    const service = context.selectedService || context.leadData?.service_type;
    const serviceInfo = KnowledgeUtils.getServiceInfo(service);
    
    if (!serviceInfo) {
      return {
        message: aiResponse?.message || "[IT-ERA] Di quale servizio vorresti saperne di più?\n\n📞 Per urgenze: 039 888 2041",
        options: ["Sito Web", "E-commerce", "App Mobile", "Server/Cloud"],
        nextStep: 'service_inquiry'
      };
    }
    
    const types = serviceInfo.types?.map(t => 
      `**${t.name}**: ${t.description} (${t.price_range})`
    ).join('\n\n') || '';
    
    return {
      message: `[IT-ERA] Ecco i dettagli per **${serviceInfo.name}**:\n\n${serviceInfo.description}\n\n${types}\n\n📞 Per urgenze: 039 888 2041\n\nTi interessa un preventivo personalizzato?`,
      options: ["Sì, preventivo", "Più dettagli", "Altri servizi", "Assistenza umana"],
      nextStep: 'business_qualification',
      collectData: true
    };
  }

  /**
   * Generate lead qualification response
   */
  generateQualificationResponse(context) {
    const leadData = context.leadData || {};
    const qualification = KnowledgeUtils.qualifyLead({
      budget: this.extractBudgetNumber(leadData.budget_range),
      company_size: this.extractCompanySize(leadData.company_size),
      timeline: leadData.timeline,
      urgency: leadData.urgency
    });
    
    const qualificationResponses = {
      high_priority: {
        message: "[IT-ERA] Perfetto! Il tuo progetto ha caratteristiche molto interessanti e crediamo di poterti offrire un'ottima soluzione.\n\n💰 **ROI previsto**: +340% in 3 anni\n💸 **Rientro investimento**: 3-4 mesi\n💼 **Risparmio annuo**: €15.000-45.000\n\n🚀 **Prossimo step**: Un nostro consulente senior ti contatterà per approfondire i dettagli e fornirti un preventivo su misura.\n\n📞 Per urgenze: 039 888 2041\n\nPer completare, ho bisogno dei tuoi dati di contatto:",
        escalate: true,
        priority: 'high',
        nextStep: 'contact_collection'
      },
      medium_priority: {
        message: "[IT-ERA] Ottimo progetto! Abbiamo sicuramente l'esperienza per realizzarlo al meglio.\n\n💰 **ROI previsto**: +280% in 3 anni\n💸 **Rientro investimento**: 4-5 mesi\n💼 **Risparmio annuo**: €8.000-25.000\n\n📋 Per prepararti un preventivo dettagliato, raccogli i tuoi dati di contatto e ti invieremo tutto via email:\n\n📞 Per urgenze: 039 888 2041",
        escalate: false,
        priority: 'medium', 
        nextStep: 'contact_collection'
      },
      low_priority: {
        message: "[IT-ERA] Interessante! È un progetto che possiamo sicuramente seguire.\n\n💰 **ROI previsto**: +180% in 3 anni\n💸 **Rientro investimento**: 5-6 mesi\n💼 **Risparmio annuo**: €5.000-15.000\n\n📧 Ti invieremo informazioni dettagliate via email con alcuni esempi simili e un preventivo indicativo:\n\n📞 Per urgenze: 039 888 2041",
        escalate: false,
        priority: 'low',
        nextStep: 'contact_collection'
      }
    };
    
    return qualificationResponses[qualification] || qualificationResponses.medium_priority;
  }

  /**
   * Generate FAQ response
   */
  generateFAQResponse(message) {
    const faqs = KnowledgeUtils.searchFAQ(message);
    
    if (faqs.length === 0) {
      return {
        message: "[IT-ERA] Non ho trovato informazioni specifiche per la tua domanda. Vuoi che ti metta in contatto con un nostro esperto?\n\n📞 **Chiama direttamente: 039 888 2041**",
        options: ["Sì, contatto umano", "Altre domande", "Preventivo"],
        nextStep: 'human_escalation'
      };
    }
    
    const bestFaq = faqs[0];
    return {
      message: `[IT-ERA] ${bestFaq.answer}\n\n📞 Per urgenze: 039 888 2041\n\nHai altre domande o vuoi procedere con un preventivo?`,
      options: ["Preventivo", "Altre domande", "Parlare con esperto"],
      nextStep: 'follow_up'
    };
  }

  /**
   * Handle escalation
   */
  async handleEscalation(escalation, context) {
    const escalationResponses = {
      explicit_human_request: "[IT-ERA] Perfetto! Ti metto subito in contatto con uno dei nostri consulenti.\n\n📞 **Chiama direttamente: 039 888 2041**\n\nPreferisci essere contattato via telefono o email?",
      high_value_lead: "[IT-ERA] Il tuo progetto ha caratteristiche molto interessanti! Un nostro senior consultant ti contatterà personalmente.\n\n📞 **Per urgenze immediate: 039 888 2041**\n⚡ Raccogliendo i tuoi dati ti contatteremo entro 2 ore.",
      long_conversation: "[IT-ERA] Vedo che abbiamo parlato di diversi aspetti. Per fornirti il supporto migliore, ti metto in contatto con un nostro specialista.\n\n📞 **Chiama direttamente: 039 888 2041**",
      repeated_misunderstanding: "[IT-ERA] Ti collego con un nostro esperto umano che saprà assisterti meglio.\n\n📞 **Chiama direttamente: 039 888 2041**"
    };
    
    return {
      message: escalationResponses[escalation.type] || escalationResponses.explicit_human_request,
      options: ["Chiamata", "Email", "Entrambi"],
      nextStep: 'contact_collection',
      escalate: true,
      escalationType: escalation.type,
      priority: escalation.priority
    };
  }

  /**
   * Update conversation context
   */
  updateConversationContext(context, intent, response) {
    return {
      ...context,
      lastIntent: intent,
      currentStep: response.nextStep,
      messageCount: (context.messageCount || 0) + 1,
      lastMessage: context.currentMessage,
      escalationAttempts: response.escalate ? 
                         (context.escalationAttempts || 0) + 1 : 
                         (context.escalationAttempts || 0),
      dataCollected: response.collectData ? 
                    [...(context.dataCollected || []), response.questions] : 
                    (context.dataCollected || []),
      timestamp: Date.now()
    };
  }

  /**
   * Interpolate message with context data
   */
  interpolateMessage(message, context) {
    if (!message || !context.leadData) return message;
    
    return message.replace(/\{(\w+)\}/g, (match, key) => {
      return context.leadData[key] || match;
    });
  }

  /**
   * Extract budget number for qualification
   */
  extractBudgetNumber(budgetRange) {
    if (!budgetRange) return 0;
    
    const matches = budgetRange.match(/(\d+(?:\.\d+)?)/g);
    if (!matches) return 0;
    
    return parseInt(matches[matches.length - 1]) * 1000; // Assume thousands
  }

  /**
   * Extract company size for qualification
   */
  extractCompanySize(sizeRange) {
    if (!sizeRange) return 1;
    
    if (sizeRange.includes('100+')) return 100;
    if (sizeRange.includes('51-100')) return 75;
    if (sizeRange.includes('16-50')) return 30;
    if (sizeRange.includes('6-15')) return 10;
    return 3;
  }

  /**
   * Generate dynamic response using AI
   */
  generateDynamicResponse(intent, context, aiResponse) {
    if (aiResponse) {
      return {
        message: aiResponse.message,
        options: aiResponse.options || [],
        nextStep: aiResponse.nextStep || 'continue',
        escalate: aiResponse.escalate || false
      };
    }
    
    return this.getFallbackResponse();
  }

  /**
   * Fallback response for errors
   */
  getFallbackResponse() {
    return {
      message: "[IT-ERA] C'è stato un piccolo problema. Puoi ripetere la domanda o preferisci parlare direttamente con un nostro consulente?\n\n📞 **Per assistenza immediata: 039 888 2041**",
      options: ["Riprova", "Consulente Umano", "Menu Principale"],
      nextStep: 'retry',
      escalate: false
    };
  }

  /**
   * Get conversation summary for handoff
   */
  getConversationSummary(context) {
    const { leadData, messageCount, currentStep, escalationType } = context;
    
    return {
      conversation_length: messageCount,
      current_step: currentStep,
      lead_qualification: leadData ? KnowledgeUtils.qualifyLead(leadData) : 'not_qualified',
      collected_data: leadData || {},
      escalation_reason: escalationType,
      conversation_flow: context.steps_taken || [],
      ai_confidence: context.averageConfidence || 0.5
    };
  }
}

export default ConversationDesigner;