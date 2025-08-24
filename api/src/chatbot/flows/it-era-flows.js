/**
 * IT-ERA Conversation Flows - Updated with Real Data
 * Flussi conversazionali ottimizzati con servizi e prezzi reali
 */

import { ITERAKnowledgeBase, KnowledgeUtils } from '../../../knowledge-base/it-era-knowledge-real.js';

export const ITERAConversationFlows = {
  
  // Greeting ottimizzato con brand IT-ERA/Bulltech
  greeting: {
    message: `👋 Ciao! Sono l'assistente virtuale di **IT-ERA**, il brand di Bulltech specializzato in servizi IT per aziende.

🏢 **Siamo a Vimercate (MB)** e da oltre 10 anni assistiamo PMI in tutta la Brianza.

Come posso aiutarti oggi?`,
    options: [
      "🔒 Sicurezza informatica e firewall",
      "🛠️ Assistenza IT e supporto tecnico", 
      "💾 Backup e protezione dati",
      "🖥️ Riparazione PC, Mac e server",
      "💰 Preventivo personalizzato",
      "📞 Contatto diretto"
    ],
    nextStep: "service_selection"
  },

  // Sicurezza informatica - Specializzazione WatchGuard
  servizi_sicurezza: {
    message: `🔒 **Sicurezza Informatica - Partner WatchGuard Certificato**

⚡ **ATTENZIONE**: Gli attacchi ransomware in Brianza sono aumentati del 340% nel 2024!

**🛡️ FIREWALL WATCHGUARD - La tua protezione**
• ✅ **UNICO Partner WatchGuard in zona Vimercate**
• ✅ Installazione e configurazione in 24h
• ✅ **GARANZIA anti-intrusione o rimborso**
• ✅ Monitoraggio 24/7 dal nostro SOC
• **Da €2.500** (tutto incluso, attivo in giornata)

**🦠 ANTIVIRUS ENTERPRISE**
• **Da €8/postazione/mese** - fatturato trimestralmente
• Setup gratuito entro 48h
• **30 giorni prova GRATUITA**

**🔍 SECURITY AUDIT URGENTE**
• **SCONTO 50%** per aziende Brianza (€600 invece di €1.200)
• Report vulnerabilità in 24h
• **BONUS**: Consulenza remediation GRATUITA

🎯 **PROMO FEBBRAIO**: Sopralluogo + Audit + Piano sicurezza = **TUTTO GRATUITO**
*Offerta valida solo per le prime 10 aziende*`,
    options: [
      "🛡️ Info su firewall WatchGuard",
      "🦠 Protezione antivirus aziendale", 
      "🔍 Audit sicurezza completo",
      "💰 Richiedi preventivo gratuito",
      "🆘 Ho un'emergenza sicurezza"
    ],
    nextStep: "sicurezza_detail"
  },

  // Assistenza IT - Core business
  servizi_assistenza: {
    message: `🛠️ **Assistenza IT Professionale - 10+ anni esperienza**

**💻 Assistenza Remota**
• Supporto da remoto sicuro
• Risoluzione problemi software
• Lun-Ven 8:30-18:00
• **€80-100/ora**

**🏢 Interventi On-Site**
• Assistenza presso la tua sede
• Installazione hardware e software
• **Zona Brianza: stesso giorno**
• **€120-150/ora + trasferta**

**📋 Contratti Manutenzione**
• Manutenzione preventiva
• Priorità negli interventi
• Report mensili attività
• **Da €200/mese per 5 PC**

La **prima consulenza è sempre GRATUITA** per valutare le tue esigenze!`,
    options: [
      "💻 Assistenza remota",
      "🏢 Intervento in sede",
      "📋 Contratto manutenzione",
      "💰 Preventivo personalizzato",
      "🆘 Supporto urgente"
    ],
    nextStep: "assistenza_detail"
  },

  // Backup e Recovery
  servizi_backup: {
    message: `💾 **Backup e Disaster Recovery - Proteggi i tuoi dati**

**☁️ Backup Cloud Automatizzato**
• Backup incrementale e sicuro
• Crittografia end-to-end
• Test recovery mensili garantiti
• **Da €50/mese per 100GB**

**🔄 Disaster Recovery Plan**
• Piano continuità operativa
• RTO/RPO definiti per la tua azienda
• Procedure recovery documentate
• Test annuali e validation
• **Preventivo su progetto**

**📊 Assessment Dati**
• Analisi gratuita dei tuoi dati critici
• Identificazione vulnerabilità
• Piano backup personalizzato

Non rischiare di perdere anni di lavoro! Ti facciamo un **assessment GRATUITO**.`,
    options: [
      "☁️ Backup cloud aziendale",
      "🔄 Piano disaster recovery",
      "📊 Assessment dati gratuito",
      "💰 Preventivo su misura",
      "🆘 Ho perso dei dati"
    ],
    nextStep: "backup_detail"
  },

  // Riparazione Hardware
  servizi_riparazione: {
    message: `🔧 **Riparazione Hardware Certificata**

**💻 PC Desktop e Laptop**
• Tutte le marche (HP, Dell, Lenovo...)
• Diagnosi gratuita on-site
• Ricambi originali certificati
• Garanzia totale sugli interventi
• **Da €50 + ricambi**

**🍎 Assistenza Mac Professionale**
• iMac, Mac Pro, MacBook
• Riparazioni certificate Apple
• Recupero dati specializzato
• **Servizio on-site disponibile**

**🖥️ Server Hardware**
• Server rack e tower
• Storage NAS/SAN
• UPS e gruppi di continuità
• **Contratti manutenzione disponibili**

**Interveniamo rapidamente:**
• Zona Vimercate/Monza: **2-4 ore**
• Brianza: **stesso giorno**`,
    options: [
      "💻 Riparazione PC/Laptop",
      "🍎 Assistenza Mac",
      "🖥️ Riparazione server",
      "🔍 Diagnosi gratuita",
      "🆘 Riparazione urgente"
    ],
    nextStep: "riparazione_detail"
  },

  // Preventivo personalizzato con Teams integration
  richiesta_preventivo: {
    message: `💰 **Preventivo Personalizzato GRATUITO**

Per fornirti il preventivo più preciso, raccogliamo alcune informazioni:

**📋 Informazioni necessarie:**
• Che servizio ti serve?
• Quante postazioni/PC hai?
• In che zona sei?
• Hai urgenze particolari?

✅ **I nostri PLUS:**
• **Sopralluogo sempre GRATUITO**
• **Partner WatchGuard certificato** 
• **10+ anni esperienza Brianza**
• **Oltre 200 aziende clienti**

Iniziamo?`,
    options: [
      "📝 Compila richiesta dettagliata",
      "📞 Preferisco essere ricontattato",
      "🏃 Ho urgenza, chiamatemi subito",
      "🏢 Sopralluogo gratuito in sede"
    ],
    nextStep: "preventivo_form"
  },

  // Form preventivo con escalation intelligente
  preventivo_form: {
    message: `📝 **Richiesta Preventivo Dettagliato**

Ti farò alcune domande per prepararti il miglior preventivo:

**1. Nome e Azienda**
Come ti chiami e qual è il nome della tua azienda?`,
    collectData: true,
    nextStep: "collect_contact"
  },

  // Raccolta dati contatto
  collect_contact: {
    message: `📞 **Dati di Contatto**

Perfetto! Ora ho bisogno dei tuoi contatti:

**2. Telefono ed Email**
Qual è il tuo numero di telefono e email?`,
    collectData: true, 
    nextStep: "collect_location"
  },

  // Raccolta località per priorità
  collect_location: {
    message: `📍 **Zona di Intervento**

**3. Dove ti trovi?**
Indica la tua città/zona (questo ci aiuta a programmare sopralluoghi e interventi)`,
    collectData: true,
    nextStep: "collect_service"
  },

  // Raccolta servizio specifico
  collect_service: {
    message: `🛠️ **Servizio Richiesto**

**4. Di che servizio hai bisogno?**
Descrivi brevemente il servizio che ti serve o il problema che devi risolvere.`,
    collectData: true,
    nextStep: "collect_company_size"
  },

  // Dimensioni azienda per lead qualification
  collect_company_size: {
    message: `🏢 **Dimensioni Azienda**

**5. Quanti dipendenti/PC?**
Questo ci aiuta a dimensionare correttamente la soluzione:
• Quanti dipendenti avete?
• Quanti PC/postazioni di lavoro?`,
    collectData: true,
    nextStep: "collect_timeline"
  },

  // Timeline progetto
  collect_timeline: {
    message: `⏰ **Timeline Progetto**

**6. Quando ti serve?**
Indica i tempi che hai in mente:`,
    options: [
      "🔴 URGENTE - Entro 1 settimana",
      "🟡 NORMALE - Entro 1 mese", 
      "🟢 PIANIFICATO - Entro 3 mesi",
      "🔵 VALUTAZIONE - Nessuna fretta"
    ],
    collectData: true,
    nextStep: "preventivo_summary"
  },

  // Summary e escalation con Teams - ENHANCED
  preventivo_summary: {
    message: `✅ **Richiesta Ricevuta - Priorità Confermata!**

🎯 **La tua richiesta è stata classificata come {{priority_level}}**

**📧 PROSSIMI PASSI GARANTITI:**
{{#if_immediate}}
🚨 **PRIORITÀ IMMEDIATA**: Ti chiamiamo entro 2 ore lavorative
📱 **SMS automatico** con codice pratica entro 10 minuti
{{/if_immediate}}

{{#if_high}}  
🟠 **ALTA PRIORITÀ**: Contatto telefonico entro 4 ore
📋 **Sopralluogo programmato** entro 48 ore se richiesto
{{/if_high}}

{{#if_medium}}
🟡 **Analisi tecnica** delle tue esigenze entro 8 ore
📧 **Preventivo dettagliato** entro 24-48 ore  
📞 **Chiamata di follow-up** per chiarimenti
{{/if_medium}}

**⚡ ZONA {{geographic_zone}}**: {{zone_message}}

**🎁 BONUS per te:**
• Sopralluogo sempre GRATUITO 
• Sconto 10% sul primo intervento
• Consulenza telefonica GRATUITA

**📞 URGENZE: 039 888 2041**
**📧 Email: info@it-era.it**

*Codice pratica: {{session_id_short}}*`,
    escalate: true,
    escalationType: "preventivo_request",
    priority: "dynamic", // Calcolato da LeadQualificationUtils
    nextStep: "completion"
  },

  // Emergenze IT
  emergenza_it: {
    message: `🚨 **EMERGENZA IT - Intervento Immediato**

**Siamo QUI per te!**

**📞 CHIAMA SUBITO: 039 888 2041**
*Reperibilità attiva per clienti con contratto*

**⚡ Interveniamo rapidamente per:**
• Server down o sistemi bloccati
• Attacchi malware/ransomware
• Perdita dati o corruzioni gravi
• Problemi rete aziendale critici

**⏱️ Tempi di intervento:**
• **Zona Vimercate/Monza:** 2-4 ore
• **Clienti con contratto:** Priorità assoluta
• **Weekend/sera:** Maggiorazione 30-50%

Mentre ti prepari a chiamare, descrivi brevemente l'emergenza:`,
    options: [
      "💥 Server down/sistemi bloccati",
      "🦠 Attacco malware/virus",
      "💾 Perdita dati critica",
      "🌐 Rete aziendale non funziona",
      "📞 Chiama ora: 039 888 2041"
    ],
    escalate: true,
    escalationType: "emergency",
    priority: "high",
    nextStep: "emergency_escalation"
  },

  // Contatto diretto
  contatto_diretto: {
    message: `📞 **Contatti Diretti IT-ERA**

**🏢 Sede Principale:**
Viale Risorgimento, 32
20871 Vimercate (MB)

**📞 Telefono:** 039 888 2041
**📧 Email:** info@it-era.it  
**🌐 Web:** www.it-era.it

**⏰ Orari:**
• **Ufficio:** Lun-Ven 8:30-18:00
• **Assistenza:** Lun-Ven 8:30-18:00  
• **Emergenze:** Reperibilità per clienti

**🚗 Zona di servizio:**
• **Primaria:** Vimercate, Monza, Agrate, Concorezzo
• **Secondaria:** Milano Est, Bergamo Ovest
• **Remota:** Tutta Italia per assistenza`,
    options: [
      "📞 Chiama ora: 039 888 2041",
      "📧 Scrivi a info@it-era.it",
      "🗺️ Come raggiungerci",
      "💰 Richiedi preventivo",
      "🔙 Torna al menu principale"
    ],
    nextStep: "contact_selection"
  }
};

// Utility per lead qualification automatica
export const LeadQualificationUtils = {
  
  /**
   * Calcola priorità del lead basata su criteri IT-ERA OTTIMIZZATI
   */
  calculateLeadPriority(conversationData) {
    let score = 0;
    const userData = conversationData.leadData || {};
    const message = conversationData.currentMessage?.toLowerCase() || '';
    
    // === ZONA GEOGRAFICA (peso massimo per conversioni) ===
    const location = userData.location?.toLowerCase() || '';
    if (location.includes('vimercate') || location.includes('agrate') || location.includes('concorezzo')) {
      score += 35; // MASSIMA priorità zona primaria
    } else if (location.includes('monza') || location.includes('brianza') || location.includes('arcore')) {
      score += 25;
    } else if (location.includes('milano est') || location.includes('bergamo')) {
      score += 15;
    } else if (location.includes('milano')) {
      score += 8; // Ridotto per Milano generico
    }
    
    // === DIMENSIONI AZIENDA (qualità lead) ===
    const employees = this.parseEmployeeCount(userData.company_size);
    if (employees >= 50) score += 30; // Enterprise = massima qualità
    else if (employees >= 20) score += 25; 
    else if (employees >= 10) score += 20; // Sweet spot PMI
    else if (employees >= 5) score += 15;
    else if (employees >= 1) score += 5; // Anche micro aziende
    
    // === BUDGET INDICATORS (nuovo) ===
    if (userData.budget_range) {
      const budget = userData.budget_range.toLowerCase();
      if (budget.includes('30000') || budget.includes('30.000')) score += 25;
      else if (budget.includes('15000') || budget.includes('15.000')) score += 20;
      else if (budget.includes('5000') || budget.includes('5.000')) score += 15;
      else if (budget.includes('valutare')) score += 10;
    }
    
    // === URGENZA (moltiplicatore conversione) ===
    const timeline = userData.timeline?.toLowerCase() || '';
    if (timeline.includes('urgente') || timeline.includes('immediato') || timeline.includes('subito')) {
      score += 30;
    } else if (timeline.includes('settimana') || timeline.includes('entro') || message.includes('urgente')) {
      score += 20;
    } else if (timeline.includes('mese')) {
      score += 10;
    }
    
    // === SERVIZIO RICHIESTO (marginalità) ===
    const service = userData.service_type?.toLowerCase() || '';
    if (service.includes('sicurezza') || service.includes('firewall') || service.includes('watchguard')) {
      score += 20; // Servizio ad alto margine
    } else if (service.includes('server') || service.includes('backup') || service.includes('cloud')) {
      score += 18;
    } else if (service.includes('assistenza') || service.includes('contratto') || service.includes('manutenzione')) {
      score += 15; // Ricorrente = buono
    } else if (service.includes('riparazione') || service.includes('pc')) {
      score += 8; // Basso margine
    }
    
    // === KEYWORDS CONVERSIONE ALTA (nuovo) ===
    const highValueKeywords = [
      'contratto', 'partnership', 'gestione', 'outsourcing', 'consulenza',
      'strategia', 'migrazione', 'progetto', 'implementazione'
    ];
    const highValueFound = highValueKeywords.filter(keyword => message.includes(keyword)).length;
    score += highValueFound * 8;
    
    // === KEYWORDS DI EMERGENZA (priorità massima) ===
    const emergencyKeywords = ['emergenza', 'server down', 'malware', 'ransomware', 'bloccato', 'critico', 'virus'];
    if (emergencyKeywords.some(keyword => message.includes(keyword))) {
      score += 35; // Emergenza = priorità assoluta
    }
    
    // === TIMING INDICATORS (nuovo) ===
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 17) {
      score += 5; // Orario lavorativo = più serio
    }
    
    // === COMPORTAMENTO NELLA CHAT (nuovo) ===
    const messageCount = conversationData.messageCount || 0;
    if (messageCount >= 8) score += 10; // Engagement alto
    else if (messageCount >= 5) score += 5;
    
    // Determina priorità con soglie ottimizzate
    if (score >= 80) return 'immediate'; // Nuova categoria top
    if (score >= 60) return 'high';
    if (score >= 35) return 'medium';
    return 'low';
  },

  /**
   * Parse employee count from various formats
   */
  parseEmployeeCount(sizeStr) {
    if (!sizeStr) return 0;
    const str = sizeStr.toLowerCase();
    
    if (str.includes('100+') || str.includes('oltre 100')) return 150;
    if (str.includes('51-100') || str.includes('50-100')) return 75;
    if (str.includes('21-50') || str.includes('20-50')) return 35;
    if (str.includes('16-50')) return 33;
    if (str.includes('11-20') || str.includes('10-20')) return 15;
    if (str.includes('6-15') || str.includes('5-15')) return 10;
    if (str.includes('1-5') || str.includes('1-10')) return 3;
    
    // Extract numbers
    const match = str.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  },

  /**
   * Identifica se il lead necessita escalation immediata
   */
  needsImmediateEscalation(conversationData) {
    const message = conversationData.currentMessage?.toLowerCase() || '';
    const emergencyIndicators = [
      'emergenza', 'urgente', 'subito', 'server down', 
      'malware', 'ransomware', 'critico', 'bloccato'
    ];
    
    return emergencyIndicators.some(indicator => message.includes(indicator));
  },

  /**
   * Prepara dati per Teams notification
   */
  prepareTeamsData(conversationData) {
    const leadData = conversationData.leadData || {};
    const priority = this.calculateLeadPriority(conversationData);
    
    return {
      ...leadData,
      priority,
      lead_score: this.calculateLeadScore(conversationData),
      urgenza: this.needsImmediateEscalation(conversationData) ? 'emergenza' : 'normale',
      zona: leadData.location || 'Non specificata',
      timestamp: new Date().toLocaleString('it-IT'),
      session_id: conversationData.sessionId
    };
  },

  /**
   * Calcola score numerico del lead
   */
  calculateLeadScore(conversationData) {
    const priority = this.calculateLeadPriority(conversationData);
    const scoreMap = { high: 85, medium: 65, low: 35 };
    return scoreMap[priority] || 50;
  }
};

export default ITERAConversationFlows;