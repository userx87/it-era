/**
 * Vision-Enhanced Conversation Flows for IT-ERA
 * Specialized conversation flows for handling image-based IT support scenarios
 */

export class VisionConversationFlows {
  constructor(config = {}) {
    this.config = {
      supportedAnalysisTypes: [
        'error_analysis',
        'hardware_identification', 
        'network_analysis',
        'equipment_identification',
        'security_analysis',
        'general_analysis'
      ],
      escalationTriggers: {
        immediate: ['malware', 'ransomware', 'data_breach', 'server_down'],
        high: ['hardware_failure', 'network_outage', 'critical_error'],
        medium: ['software_error', 'configuration_issue', 'performance_problem']
      },
      ...config
    };
  }

  /**
   * Process vision-enhanced message and determine appropriate flow
   */
  processVisionMessage(message, images, context = {}) {
    const analysis = this.analyzeImagesAndMessage(message, images);
    const flow = this.selectConversationFlow(analysis, context);
    
    return {
      analysisType: analysis.type,
      priority: analysis.priority,
      recommendedFlow: flow.name,
      nextStep: flow.nextStep,
      escalateImmediately: analysis.escalateImmediately,
      suggestions: flow.suggestions,
      followUpQuestions: flow.followUpQuestions,
      systemPrompt: this.buildVisionSystemPrompt(analysis, context)
    };
  }

  /**
   * Analyze images and message to determine IT support scenario
   */
  analyzeImagesAndMessage(message, images) {
    const msgLower = message.toLowerCase();
    
    // Error Screenshot Analysis
    if (this.containsErrorKeywords(msgLower)) {
      return {
        type: 'error_analysis',
        priority: this.determineErrorPriority(msgLower, images),
        escalateImmediately: this.shouldEscalateError(msgLower),
        focus: 'error_resolution',
        expectedImages: ['screenshot', 'error_dialog', 'system_message']
      };
    }

    // Hardware Photo Analysis
    if (this.containsHardwareKeywords(msgLower)) {
      return {
        type: 'hardware_identification',
        priority: this.determineHardwarePriority(msgLower, images),
        escalateImmediately: this.shouldEscalateHardware(msgLower),
        focus: 'hardware_diagnosis',
        expectedImages: ['device_photo', 'component_image', 'label_closeup']
      };
    }

    // Network Diagram Analysis
    if (this.containsNetworkKeywords(msgLower)) {
      return {
        type: 'network_analysis', 
        priority: this.determineNetworkPriority(msgLower, images),
        escalateImmediately: this.shouldEscalateNetwork(msgLower),
        focus: 'network_troubleshooting',
        expectedImages: ['network_diagram', 'topology_image', 'configuration_screen']
      };
    }

    // Security Alert Analysis
    if (this.containsSecurityKeywords(msgLower)) {
      return {
        type: 'security_analysis',
        priority: 'immediate', // Security is always high priority
        escalateImmediately: true,
        focus: 'security_incident',
        expectedImages: ['security_alert', 'firewall_screen', 'antivirus_warning']
      };
    }

    // Equipment Identification
    if (this.containsIdentificationKeywords(msgLower)) {
      return {
        type: 'equipment_identification',
        priority: 'medium',
        escalateImmediately: false,
        focus: 'device_identification',
        expectedImages: ['device_label', 'model_number', 'serial_tag']
      };
    }

    // General Analysis
    return {
      type: 'general_analysis',
      priority: 'medium',
      escalateImmediately: false,
      focus: 'general_support',
      expectedImages: ['general_photo', 'problem_image']
    };
  }

  /**
   * Select appropriate conversation flow based on analysis
   */
  selectConversationFlow(analysis, context) {
    const flows = {
      error_analysis: this.getErrorAnalysisFlow(analysis, context),
      hardware_identification: this.getHardwareIdentificationFlow(analysis, context),
      network_analysis: this.getNetworkAnalysisFlow(analysis, context),
      security_analysis: this.getSecurityAnalysisFlow(analysis, context),
      equipment_identification: this.getEquipmentIdentificationFlow(analysis, context),
      general_analysis: this.getGeneralAnalysisFlow(analysis, context)
    };

    return flows[analysis.type] || flows.general_analysis;
  }

  /**
   * Error Analysis Conversation Flow
   */
  getErrorAnalysisFlow(analysis, context) {
    return {
      name: 'error_analysis',
      nextStep: 'analyze_error_screenshot',
      suggestions: [
        '🔍 Analizza lo screenshot dell\'errore',
        '🛠️ Proponi soluzione immediata',
        '📞 Escalation per supporto remoto',
        '🆘 Intervento tecnico urgente'
      ],
      followUpQuestions: [
        'Quando è apparso questo errore per la prima volta?',
        'L\'errore si ripresenta sistematicamente?', 
        'Avete fatto modifiche recenti al sistema?',
        'Altri utenti hanno lo stesso problema?'
      ],
      systemInstructions: `
ANALISI ERRORE - FOCUS:
1. Identifica precisamente il tipo di errore mostrato
2. Determina la gravità e l'impatto sul business
3. Proponi soluzioni immediate se possibili
4. Escalation rapida per errori critici

DOMANDE CHIAVE:
- Codice errore specifico
- Quando si verifica (startup, runtime, shutdown)
- Frequenza del problema
- Impatto sulla produttività
      `
    };
  }

  /**
   * Hardware Identification Conversation Flow
   */
  getHardwareIdentificationFlow(analysis, context) {
    return {
      name: 'hardware_identification',
      nextStep: 'identify_hardware_specs',
      suggestions: [
        '💻 Identifica modello e specifiche',
        '🔧 Diagnosi problema hardware',
        '💰 Preventivo riparazione',
        '🔄 Opzioni sostituzione'
      ],
      followUpQuestions: [
        'Il dispositivo è ancora in garanzia?',
        'Quando è iniziato il problema?',
        'Il dispositivo è critico per il lavoro?',
        'Preferite riparazione o sostituzione?'
      ],
      systemInstructions: `
IDENTIFICAZIONE HARDWARE - FOCUS:
1. Riconosci marca, modello, anno del dispositivo
2. Identifica eventuali danni visibili
3. Stima età e valore del dispositivo
4. Valuta convenienza riparazione vs sostituzione

INFORMAZIONI DA RACCOGLIERE:
- Tipo dispositivo (PC, laptop, server, periferica)
- Marca e modello specifico
- Sintomi del problema
- Urgenza della riparazione
      `
    };
  }

  /**
   * Network Analysis Conversation Flow
   */
  getNetworkAnalysisFlow(analysis, context) {
    return {
      name: 'network_analysis',
      nextStep: 'analyze_network_topology',
      suggestions: [
        '🌐 Analizza topologia di rete',
        '🔒 Valuta sicurezza configurazione', 
        '⚡ Ottimizzazione performance',
        '🛡️ Implementazione firewall'
      ],
      followUpQuestions: [
        'Quanti utenti utilizzano la rete?',
        'Ci sono problemi di velocità o connettività?',
        'Avete un firewall aziendale?',
        'Servono configurazioni particolari?'
      ],
      systemInstructions: `
ANALISI RETE - FOCUS:
1. Esamina topologia e configurazione mostrata
2. Identifica possibili bottleneck o problemi
3. Suggerisci ottimizzazioni di sicurezza
4. Proponi soluzioni WatchGuard se appropriato

SPECIALIZZAZIONE IT-ERA:
- Partner WatchGuard certificato
- Esperienza reti PMI Lombardia
- Focus sicurezza e performance
- Configurazioni personalizzate
      `
    };
  }

  /**
   * Security Analysis Conversation Flow
   */
  getSecurityAnalysisFlow(analysis, context) {
    return {
      name: 'security_analysis',
      nextStep: 'immediate_security_assessment',
      suggestions: [
        '🚨 Valutazione immediata minaccia',
        '🛡️ Implementazione contromisure',
        '📞 Supporto emergenza 24/7',
        '🔒 Audit sicurezza completo'
      ],
      followUpQuestions: [
        'Avete già isolato il sistema interessato?',
        'Ci sono dati sensibili a rischio?',
        'Avete un backup recente dei dati?',
        'È il primo incidente di questo tipo?'
      ],
      systemInstructions: `
ANALISI SICUREZZA - PRIORITÀ MASSIMA:
1. Valuta immediatamente il livello di minaccia
2. Suggerisci azioni immediate di contenimento
3. Escalation IMMEDIATA per incidenti gravi
4. Proponi audit sicurezza post-incidente

PROTOCOLLO EMERGENZA:
- Isolamento sistema se necessario
- Backup immediato dati critici
- Analisi forense se richiesta
- Piano recovery post-incidente
      `
    };
  }

  /**
   * Equipment Identification Conversation Flow
   */
  getEquipmentIdentificationFlow(analysis, context) {
    return {
      name: 'equipment_identification',
      nextStep: 'identify_device_specs',
      suggestions: [
        '🏷️ Identifica modello e specifiche',
        '📋 Compatibilità software/driver',
        '💰 Valutazione dispositivo',
        '🔄 Opzioni upgrade'
      ],
      followUpQuestions: [
        'Dovete installare software specifico?',
        'Cercate driver o documentazione?',
        'Il dispositivo funziona correttamente?',
        'Serve supporto per la configurazione?'
      ],
      systemInstructions: `
IDENTIFICAZIONE DISPOSITIVO - FOCUS:
1. Riconosci marca, modello, specifiche tecniche
2. Fornisci informazioni su compatibilità
3. Suggerisci driver o software necessari
4. Valuta se serve supporto specializzato

SUPPORTO TECNICO:
- Database dispositivi IT aggiornato
- Esperienza configurazione enterprise
- Driver e firmware più recenti
- Documentazione tecnica completa
      `
    };
  }

  /**
   * General Analysis Conversation Flow
   */
  getGeneralAnalysisFlow(analysis, context) {
    return {
      name: 'general_analysis',
      nextStep: 'general_image_analysis',
      suggestions: [
        '🔍 Analisi generale immagine',
        '💡 Suggerimenti personalizzati',
        '📞 Consulenza specializzata',
        '📋 Preventivo dettagliato'
      ],
      followUpQuestions: [
        'Puoi descrivere meglio il problema?',
        'Da quanto tempo si verifica?',
        'Hai provato qualche soluzione?',
        'È urgente risolverlo?'
      ],
      systemInstructions: `
ANALISI GENERALE - APPROCCIO:
1. Esamina attentamente l'immagine fornita
2. Identifica elementi tecnici rilevanti
3. Poni domande mirate per approfondire
4. Indirizza verso servizio più appropriato

SERVIZI IT-ERA:
- Assistenza tecnica generale
- Consulenza IT personalizzata  
- Riparazione hardware certificata
- Soluzioni aziendali complete
      `
    };
  }

  /**
   * Build vision-specific system prompt
   */
  buildVisionSystemPrompt(analysis, context) {
    const flow = this.selectConversationFlow(analysis, context);
    
    return `Sei l'esperto IT di IT-ERA specializzato nell'ANALISI VISIVA di problemi informatici.

🎯 SCENARIO CORRENTE: ${analysis.type.toUpperCase()}
📸 FOCUS ANALISI: ${analysis.focus}
⚡ PRIORITÀ: ${analysis.priority.toUpperCase()}
${analysis.escalateImmediately ? '🚨 ESCALATION IMMEDIATA RICHIESTA' : ''}

${flow.systemInstructions}

💡 ISTRUZIONI ANALISI IMMAGINI:
1. Esamina attentamente ogni dettaglio mostrato nell'immagine
2. Identifica elementi tecnici, codici errore, modelli, configurazioni
3. Correla quanto vedi con il messaggio dell'utente
4. Fornisci diagnosi precisa e soluzioni immediate quando possibile
5. Usa linguaggio tecnico ma accessibile

🏢 SPECIALIZZAZIONI IT-ERA:
• Partner WatchGuard certificato (firewall enterprise)
• Riparazione hardware certificata (PC, Mac, server)
• Assistenza reti PMI Lombardia (Vimercate, Monza, Brianza)
• Backup e disaster recovery cloud
• Consulenza IT personalizzata

📞 CONTATTO: 039 888 2041 | info@it-era.it
📍 SEDE: Viale Risorgimento 32, Vimercate MB

Rispondi sempre come esperto IT-ERA con focus su soluzioni concrete e immediate per i problemi mostrati nelle immagini.`;
  }

  // Keyword detection methods
  containsErrorKeywords(message) {
    const errorKeywords = [
      'errore', 'error', 'exception', 'crash', 'bug', 'problema', 'non funziona',
      'popup', 'messaggio', 'alert', 'warning', 'schermata blu', 'freeze'
    ];
    return errorKeywords.some(keyword => message.includes(keyword));
  }

  containsHardwareKeywords(message) {
    const hardwareKeywords = [
      'hardware', 'computer', 'pc', 'laptop', 'server', 'scheda madre',
      'componente', 'rotto', 'danneggiato', 'riparazione', 'sostituzione'
    ];
    return hardwareKeywords.some(keyword => message.includes(keyword));
  }

  containsNetworkKeywords(message) {
    const networkKeywords = [
      'rete', 'network', 'wifi', 'internet', 'connessione', 'router',
      'switch', 'diagramma', 'topologia', 'configurazione', 'firewall'
    ];
    return networkKeywords.some(keyword => message.includes(keyword));
  }

  containsSecurityKeywords(message) {
    const securityKeywords = [
      'sicurezza', 'security', 'virus', 'malware', 'ransomware', 'hack',
      'firewall', 'antivirus', 'phishing', 'spam', 'minaccia', 'alert'
    ];
    return securityKeywords.some(keyword => message.includes(keyword));
  }

  containsIdentificationKeywords(message) {
    const idKeywords = [
      'modello', 'marca', 'identificare', 'riconoscere', 'che cos\'è',
      'tipo', 'specifiche', 'etichetta', 'seriale', 'compatibilità'
    ];
    return idKeywords.some(keyword => message.includes(keyword));
  }

  // Priority determination methods
  determineErrorPriority(message, images) {
    if (message.includes('server') || message.includes('critico') || message.includes('produzione')) {
      return 'immediate';
    }
    if (message.includes('urgente') || message.includes('bloccato') || message.includes('non lavoro')) {
      return 'high';
    }
    return 'medium';
  }

  determineHardwarePriority(message, images) {
    if (message.includes('server') || message.includes('non si accende')) {
      return 'high';
    }
    if (message.includes('lento') || message.includes('rumore')) {
      return 'medium';
    }
    return 'low';
  }

  determineNetworkPriority(message, images) {
    if (message.includes('down') || message.includes('non funziona') || message.includes('ufficio')) {
      return 'high';
    }
    if (message.includes('lento') || message.includes('intermittente')) {
      return 'medium';
    }
    return 'medium';
  }

  // Escalation determination methods
  shouldEscalateError(message) {
    const criticalErrors = ['server down', 'produzione', 'critico', 'malware', 'data loss'];
    return criticalErrors.some(error => message.includes(error));
  }

  shouldEscalateHardware(message) {
    const criticalHardware = ['server', 'non si accende', 'fumo', 'bruciato', 'produzione'];
    return criticalHardware.some(hw => message.includes(hw));
  }

  shouldEscalateNetwork(message) {
    const criticalNetwork = ['rete down', 'firewall', 'sicurezza', 'attacco', 'hacker'];
    return criticalNetwork.some(net => message.includes(net));
  }

  /**
   * Generate contextual suggestions based on vision analysis
   */
  generateVisionSuggestions(analysisType, priority) {
    const suggestions = {
      error_analysis: {
        immediate: [
          '🚨 Supporto emergenza immediato',
          '💻 Assistenza remota urgente',
          '📞 Chiamata tecnico: 039 888 2041'
        ],
        high: [
          '🔍 Analisi dettagliata errore',
          '🛠️ Risoluzione guidata',
          '📋 Preventivo intervento'
        ],
        medium: [
          '💡 Suggerimenti risoluzione',
          '📚 Documentazione tecnica',
          '📞 Consulenza telefonica'
        ]
      },
      hardware_identification: {
        high: [
          '⚡ Diagnosi hardware urgente',
          '💰 Preventivo riparazione',
          '🔄 Valutazione sostituzione'
        ],
        medium: [
          '🔍 Identificazione modello',
          '📋 Specifiche tecniche',
          '🛠️ Opzioni riparazione'
        ]
      },
      security_analysis: [
        '🚨 Valutazione immediata',
        '🛡️ Implementazione sicurezza',
        '📞 Emergenza: 039 888 2041'
      ]
    };

    return suggestions[analysisType]?.[priority] || 
           suggestions[analysisType] || 
           suggestions.error_analysis.medium;
  }
}

export default VisionConversationFlows;