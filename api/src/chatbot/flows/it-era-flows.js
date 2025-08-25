/**
 * IT-ERA Conversation Flows - Updated with Real Data
 * Flussi conversazionali ottimizzati con servizi e prezzi reali
 */

import { ITERAKnowledgeBase, KnowledgeUtils } from '../../../knowledge-base/it-era-knowledge-real.js';

export const ITERAConversationFlows = {
  
  // Greeting ottimizzato con brand IT-ERA/Bulltech - PROFESSIONAL WITH [IT-ERA] PREFIX
  greeting: {
    message: `[IT-ERA] Benvenuto! Siamo il vostro partner tecnologico di fiducia, specializzato in soluzioni IT avanzate per aziende.

🏢 **Siamo a Vimercate (MB)** e da oltre 10 anni assistiamo PMI in tutta la Brianza con competenza e professionalità.

Come possiamo supportare la vostra crescita digitale oggi?`,
    options: [
      "🔒 Sicurezza informatica e firewall",
      "🛠️ Assistenza IT e supporto tecnico", 
      "💾 Backup e protezione dati",
      "🖥️ Riparazione PC, Mac e server",
      "📊 Analisi ROI - Ritorno investimenti",
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

  // ROI Analysis Integration
  analisi_roi: {
    message: `📊 **Analisi ROI - Ritorno sull'Investimento IT**

👔 **Specializzato per Commercialisti e CFO**

🏢 Calcoliamo insieme il **vero impatto economico** dei nostri servizi IT sulla vostra azienda:

**🔍 ANALISI DISPONIBILI:**
• **☁️ Cloud vs Server Fisici** - Risparmio infrastruttura
• **🛠️ IT Gestito vs Interno** - Ottimizzazione costi personale  
• **🔒 Investimenti Sicurezza** - ROI protezione cyber
• **📊 Trasformazione Completa** - Analisi complessiva

✅ **I nostri calcoli includono:**
• Costi nascosti attuali (downtime, inefficienze)
• TCO (Total Cost of Ownership) reale
• Payback period preciso con break-even
• Analisi rischio/beneficio quantificata
• Proiezioni ROI a 3 anni

**⚡ CALCOLO RAPIDO (5 minuti):**
Con poche domande vi do una stima immediata del ROI

Su quale area volete concentrarvi?`,
    options: [
      "⚡ Calcolo ROI Rapido (5 min)",
      "☁️ ROI Cloud vs Server Fisici",
      "🛠️ ROI IT Gestito vs Interno",
      "🔒 ROI Investimenti Sicurezza", 
      "📊 Analisi ROI Completa",
      "💰 Prima il preventivo poi l'ROI"
    ],
    nextStep: "roi_service_selection"
  },

  // ROI Quick Calculation
  roi_calcolo_rapido: {
    message: `⚡ **Calcolo ROI Rapido**

Per una stima immediata, mi servono solo 3 informazioni:

**1. Quanti dipendenti avete?**
(Include tutti coloro che usano PC/sistemi IT)`,
    collectData: true,
    dataKey: "employees_roi",
    nextStep: "roi_quick_budget"
  },

  roi_quick_budget: {
    message: `💶 **Budget IT Attuale**

**2. Quanto spendete circa all'anno per IT?**
Include: stipendi IT, hardware, software, assistenza esterna, etc.

💡 *Se non lo sapete, indicate il fatturato annuo approssimativo (€)*
💡 *Esempi: 50.000€ per startup, 200.000€ per PMI, 500.000€+ per aziende*`,
    collectData: true,
    dataKey: "current_budget_roi",
    nextStep: "roi_quick_service"
  },

  roi_quick_service: {
    message: `🎯 **Area di Interesse**

**3. Su quale servizio volete il calcolo ROI?**`,
    options: [
      "☁️ Migrazione Cloud (server → cloud)",
      "🛠️ Assistenza IT Gestita (vs interno)",
      "🔒 Sicurezza Informatica avanzata",
      "📊 Tutto - Trasformazione Completa"
    ],
    collectData: true,
    dataKey: "service_interest_roi",
    nextStep: "roi_quick_results"
  },

  roi_quick_results: {
    message: `📊 **ANALISI ROI IMMEDIATA**

{{roi_calculation_result}}

**🎯 RACCOMANDAZIONI SPECIFICHE:**
{{roi_recommendations}}

**🏆 PERCHÉ SCEGLIERE IT-ERA:**
• ✅ **10+ anni esperienza** in Brianza 
• ✅ **200+ aziende clienti** già migrate
• ✅ **Unico Partner WatchGuard** zona Vimercate
• ✅ **ROI garantito** o rimborso differenza
• ✅ **Payback medio 8-14 mesi** sui progetti

**📞 PROSSIMI PASSI:**
Volete approfondire con un'analisi dettagliata?`,
    options: [
      "📋 Analisi ROI dettagliata gratuita",
      "📞 Chiamata con nostro CFO/CTO", 
      "📧 Report ROI completo via email",
      "💰 Preventivo ufficiale con ROI",
      "🔄 Nuovo calcolo scenario diverso"
    ],
    processROI: true,
    escalate: true,
    escalationType: "roi_analysis",
    nextStep: "roi_follow_up"
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
    const scoreMap = { immediate: 95, high: 85, medium: 65, low: 35 };
    return scoreMap[priority] || 50;
  },

  /**
   * Process ROI calculation from conversation data
   */
  processROICalculation(conversationData) {
    const { leadData } = conversationData;
    
    try {
      // Import ROI calculator (would be imported at top in real implementation)
      const { roiCalculator } = require('../utils/roi-calculator.js');
      
      // Extract data from conversation
      const employees = this.extractEmployees(leadData);
      const budget = this.extractBudget(leadData);
      const service = this.extractServiceType(leadData);
      
      // Build company profile
      const companyData = {
        employees: employees,
        annualRevenue: budget * 10, // Rough estimate
        currentItCosts: budget * 0.1,
        hasItStaff: leadData.current_it_setup?.toLowerCase().includes('interno') || false,
        currentSecurityLevel: this.assessSecurityLevel(leadData),
        dataVolume: employees * 50, // GB per employee
        currentServers: Math.max(Math.floor(employees / 15), 1),
        timeline: 36
      };
      
      // Calculate ROI based on service interest
      let roiResult;
      switch (service) {
        case 'cloud':
          roiResult = roiCalculator.calculateCloudVsPhysical(companyData);
          break;
        case 'managed':
          roiResult = roiCalculator.calculateManagedVsInhouse(companyData);
          break;
        case 'security':
          roiResult = roiCalculator.calculateSecurityROI(companyData);
          break;
        default:
          roiResult = roiCalculator.quickEstimate(employees, budget, service);
      }
      
      return roiResult;
    } catch (error) {
      console.error('ROI calculation error:', error);
      return this.getFallbackROI(leadData);
    }
  },

  /**
   * Extract employee count from lead data
   */
  extractEmployees(leadData) {
    const fields = [leadData.employees_roi, leadData.employees, leadData.company_size];
    
    for (const field of fields) {
      if (field) {
        const match = String(field).match(/(\d+)/);
        if (match) return parseInt(match[1]);
      }
    }
    return 10; // Default
  },

  /**
   * Extract budget from lead data
   */
  extractBudget(leadData) {
    const fields = [leadData.current_budget_roi, leadData.budget_range, leadData.annual_revenue];
    
    for (const field of fields) {
      if (field) {
        const cleanField = String(field).replace(/[€.$,\s]/g, '');
        const match = cleanField.match(/(\d+)/);
        if (match) return parseInt(match[1]);
      }
    }
    return 50000; // Default
  },

  /**
   * Extract service type from conversation
   */
  extractServiceType(leadData) {
    const service = leadData.service_interest_roi?.toLowerCase() || '';
    
    if (service.includes('cloud')) return 'cloud';
    if (service.includes('gestita') || service.includes('managed')) return 'managed';
    if (service.includes('sicurezza') || service.includes('security')) return 'security';
    if (service.includes('tutto') || service.includes('completa')) return 'complete';
    
    return 'complete'; // Default to complete analysis
  },

  /**
   * Assess current security level
   */
  assessSecurityLevel(leadData) {
    const security = leadData.current_security?.toLowerCase() || '';
    if (security.includes('firewall') || security.includes('avanzata')) return 'basic';
    if (security.includes('nessuna') || security.includes('none')) return 'none';
    return 'minimal';
  },

  /**
   * Fallback ROI when calculation fails
   */
  getFallbackROI(leadData) {
    const employees = this.extractEmployees(leadData);
    const investmentRange = employees < 5 ? '€2.000 - €5.000' : employees < 20 ? '€5.000 - €15.000' : '€15.000 - €30.000';
    const savingsRange = employees < 5 ? '€300 - €800' : employees < 20 ? '€800 - €2.000' : '€2.000 - €4.000';
    
    return {
      formatted: `[IT-ERA] Analisi ROI per azienda ${employees} dipendenti:

INVESTIMENTO: ${investmentRange} setup + €${Math.round(employees * 45)}/mese
RISPARMIO: ${savingsRange}/mese 
- Efficienza operativa: +25%
- Riduzione downtime: -80%  
- Costi manutenzione: -60%

ROI: Break-even in 8-16 mesi
Ritorno a 3 anni: 200-300% (€${Math.round(employees * 1200 * 3)} risparmiati)

💡 Per calcoli precisi, organizziamo audit GRATUITO della vostra infrastruttura.`
    };
  }
};

export default ITERAConversationFlows;