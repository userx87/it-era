/**
 * IT-ERA ROI-Focused Conversation Flows
 * Specialized flows for commercialisti and cost-conscious clients
 */

import { roiCalculator } from '../utils/roi-calculator.js';

export const ROIConversationFlows = {

  // ROI Analysis entry point
  roi_analysis_intro: {
    message: `💰 **Analisi ROI - Ritorno sull'Investimento IT**

📊 **Specializzato per Commercialisti e CFO**

🏢 Calcoliamo insieme il **vero impatto economico** dei nostri servizi IT sulla vostra azienda:

**🔍 ANALISI DISPONIBILI:**
• **Cloud vs Server Fisici** - Risparmio infrastruttura
• **IT Gestito vs Interno** - Ottimizzazione costi personale  
• **Investimenti Sicurezza** - ROI protezione cyber
• **Trasformazione Completa** - Analisi complessiva

✅ **I nostri calcoli includono:**
• Costi nascosti attuali
• TCO (Total Cost of Ownership) reale
• Payback period preciso
• Analisi rischio/beneficio
• Proiezioni a 3 anni

Su quale area volete concentrarvi?`,
    options: [
      "☁️ Cloud vs Server Fisici",
      "🛠️ IT Gestito vs Personale Interno",
      "🔒 ROI Investimenti Sicurezza", 
      "📊 Analisi Completa Aziendale",
      "⚡ Calcolo Rapido (5 min)"
    ],
    nextStep: "roi_service_selection"
  },

  // Quick ROI calculation flow
  roi_quick_calculation: {
    message: `⚡ **Calcolo ROI Rapido**

Per una stima immediata, mi servono solo 3 informazioni:

**1. Quanti dipendenti avete?**
(Include tutti coloro che usano PC/sistemi IT)`,
    collectData: true,
    dataKey: "employees",
    nextStep: "roi_quick_budget"
  },

  roi_quick_budget: {
    message: `💶 **Budget IT Attuale**

**2. Quanto spendete circa all'anno per IT?**
Include: stipendi IT, hardware, software, assistenza esterna, etc.

💡 *Se non lo sapete, indicate il fatturato annuo approssimativo*`,
    collectData: true,
    dataKey: "current_budget",
    nextStep: "roi_quick_service"
  },

  roi_quick_service: {
    message: `🎯 **Area di Interesse**

**3. Su quale servizio volete il calcolo ROI?**`,
    options: [
      "☁️ Migrazione Cloud",
      "🛠️ Assistenza IT Gestita",
      "🔒 Sicurezza Informatica",
      "📊 Tutto - Analisi Completa"
    ],
    collectData: true,
    dataKey: "service_interest",
    nextStep: "roi_quick_results"
  },

  roi_quick_results: {
    message: `📊 **Analisi ROI Immediata**

{{roi_calculation}}

**🎯 RACCOMANDAZIONI SPECIFICHE:**
{{roi_recommendations}}

**📞 PROSSIMI PASSI:**
• Analisi dettagliata GRATUITA in sede
• Audit tecnico personalizzato  
• Preventivo preciso con timeline

Volete approfondire con un'analisi completa?`,
    options: [
      "📋 Analisi dettagliata gratuita",
      "📞 Chiamatemi per approfondire",
      "📧 Inviate report via email",
      "🔄 Nuovo calcolo diverso scenario"
    ],
    processROI: true,
    nextStep: "roi_follow_up"
  },

  // Cloud vs Physical Infrastructure detailed flow
  roi_cloud_analysis: {
    message: `☁️ **ROI Cloud vs Server Fisici**

📈 **Analisi completa costi infrastruttura**

Per un calcolo preciso, analizziamo la vostra situazione attuale:

**🖥️ INFRASTRUTTURA ATTUALE:**
• Quanti server fisici avete?
• Che tipo di backup utilizzate?
• Spese annue di manutenzione hardware?
• Costi elettricità/raffreddamento?

Iniziamo con i server attuali:`,
    collectData: true,
    dataKey: "current_servers",
    nextStep: "roi_cloud_data_collection"
  },

  roi_cloud_data_collection: {
    message: `💾 **Dati e Backup Attuali**

**Volume dati da gestire:**
• Quanto spazio di storage utilizzate? (GB/TB)
• Fate backup? Dove e come?
• Avete mai avuto perdite di dati?

💰 **Costi attuali stimati:**
• Manutenzione hardware annua?
• Costi elettricità per server?
• Ore IT dedicate alla manutenzione?`,
    collectData: true,
    dataKey: "infrastructure_details",
    nextStep: "roi_cloud_calculation"
  },

  roi_cloud_calculation: {
    message: `📊 **Analisi ROI Cloud Completa**

{{cloud_roi_calculation}}

**☁️ VANTAGGI CLOUD IT-ERA:**
✅ **Migrazione assistita** - Zero downtime garantito
✅ **Backup automatico 3-2-1** - Dati sempre sicuri  
✅ **Scalabilità immediata** - Crescete senza limiti
✅ **Supporto 24/7** - Team dedicato sempre attivo
✅ **SLA 99.9%** - Uptime garantito contrattualmente

**📋 IMPLEMENTAZIONE:**
• **Fase 1**: Audit infrastruttura (GRATUITO)
• **Fase 2**: Migrazione controllata (2-4 settimane)
• **Fase 3**: Ottimizzazione e training

Volete procedere con l'audit gratuito?`,
    options: [
      "✅ Prenota audit gratuito",
      "📞 Chiamata tecnica approfondita",  
      "📧 Report dettagliato via email",
      "💰 Preventivo ufficiale"
    ],
    processROI: true,
    roiType: "cloud",
    nextStep: "roi_implementation_planning"
  },

  // Managed IT vs In-house detailed flow
  roi_managed_analysis: {
    message: `🛠️ **ROI IT Gestito vs Personale Interno**

👥 **Analisi costi personale IT**

**SITUAZIONE ATTUALE:**
• Avete personale IT interno?
• Quante ore/settimana dedicate all'IT?
• Costi di formazione e aggiornamento?
• Quanto vi costano le emergenze IT?

Analizziamo la vostra organizzazione IT:`,
    collectData: true,
    dataKey: "current_it_setup",
    nextStep: "roi_managed_cost_analysis"
  },

  roi_managed_cost_analysis: {
    message: `💰 **Analisi Costi IT Dettagliata**

**COSTI NASCOSTI DA VALUTARE:**
• Stipendio + contributi personale IT
• Formazione continua (certificazioni, corsi)
• Strumenti e licenze software
• Tempo perso in emergenze
• Costo downtime per dipendenti

**DOMANDE SPECIFICHE:**
• Quanto tempo perdete ogni mese per problemi IT?
• Avete mai dovuto chiamare assistenza esterna?
• Il vostro IT riesce a stare al passo con le tecnologie?

Descrivetemi la situazione:`,
    collectData: true,
    dataKey: "it_costs_details",
    nextStep: "roi_managed_calculation"
  },

  roi_managed_calculation: {
    message: `📊 **ROI IT Gestito Completo**

{{managed_roi_calculation}}

**🛠️ SERVIZI IT-ERA MANAGED:**
✅ **Team specializzato** - 5+ tecnici certificati
✅ **Monitoraggio proattivo** - Preveniamo i problemi
✅ **Supporto illimitato** - Chiamate e interventi inclusi
✅ **Aggiornamenti automatici** - Sempre sicuri e performanti
✅ **Costi fissi** - Budget prevedibile e controllato

**📈 BENEFICI AGGIUNTIVI:**
• **Produttività +25%** - Zero tempo perso
• **Sicurezza potenziata** - Protezione enterprise
• **Scalabilità garantita** - Crescete senza pensieri
• **Compliance normativa** - GDPR, 231, ISO

**⏱️ TIMELINE ATTIVAZIONE:**
• **Settimana 1**: Audit e mapping sistemi
• **Settimana 2**: Implementazione monitoraggio  
• **Settimana 3**: Training team e go-live
• **Settimana 4**: Ottimizzazione e fine-tuning

Partiamo con l'audit della vostra situazione IT?`,
    options: [
      "🚀 Inizia subito l'audit",
      "📋 Contratto managed dettagliato",
      "💰 Preventivo ufficiale", 
      "📞 Chiamata con CTO"
    ],
    processROI: true,
    roiType: "managed",
    nextStep: "roi_implementation_planning"
  },

  // Security investment ROI detailed flow
  roi_security_analysis: {
    message: `🔒 **ROI Investimenti Sicurezza**

⚠️ **ATTENZIONE: Analisi Rischio Cyber**

📈 **I dati parlano chiaro:**
• **+340% attacchi ransomware** in Brianza nel 2024
• **€150.000** costo medio violazione per PMI
• **28%** probabilità annua di subire un attacco
• **21 giorni** tempo medio downtime post-attacco

**🔍 ANALIZZIAMO IL VOSTRO RISCHIO:**

**PROTEZIONE ATTUALE:**
• Che antivirus utilizzate?
• Avete un firewall dedicato?  
• Fate backup regolari e sicuri?
• Training dipendenti su phishing?

Descrivetemi la vostra sicurezza attuale:`,
    collectData: true,
    dataKey: "current_security",
    nextStep: "roi_security_risk_assessment"
  },

  roi_security_risk_assessment: {
    message: `🎯 **Assessment Rischio Personalizzato**

**PROFILO RISCHIO AZIENDALE:**
• Settore di attività?
• Dati sensibili che gestite?
• Quanti dispositivi connessi?
• Avete mai subito attacchi?

**💰 IMPATTO ECONOMICO POTENZIALE:**
• Quanto fatturate al giorno?
• Costo per ora di downtime?
• Dati critici che perdere vi costerebbe caro?

Queste informazioni mi servono per calcolare il rischio reale:`,
    collectData: true,
    dataKey: "risk_profile",
    nextStep: "roi_security_calculation"
  },

  roi_security_calculation: {
    message: `🛡️ **ROI Sicurezza Completo**

{{security_roi_calculation}}

**🔒 SOLUZIONE IT-ERA WATCHGUARD:**
✅ **Firewall Next-Gen** - Unico partner certificato zona
✅ **Protezione AI** - Machine learning anti-malware
✅ **SOC 24/7** - Security Operations Center dedicato
✅ **Backup 3-2-1** - Ripristino garantito in 4 ore
✅ **Compliance GDPR** - Conformità normativa totale

**🚨 PROTEZIONE RANSOMWARE:**
• **Detection avanzato** - AI identifica minacce 0-day
• **Isolation automatica** - Quarantena sistemi infetti
• **Recovery rapido** - Backup immutabile pronto
• **Incident response** - Team specializzato attivo

**⏱️ ATTIVAZIONE URGENTE:**
• **24-48h**: Installazione firewall WatchGuard
• **Settimana 1**: Configurazione politiche sicurezza
• **Settimana 2**: Training dipendenti + test
• **Mese 1**: Monitoraggio e ottimizzazione

**🎁 PROMO SICUREZZA 2024:**
• Audit vulnerabilità GRATUITO
• Setup firewall a costo zero
• 30 giorni trial antivirus enterprise
• Consulenza GDPR inclusa

La sicurezza non può aspettare. Attiviamo la protezione?`,
    options: [
      "🚨 Attivazione sicurezza immediata",
      "🔍 Audit vulnerabilità gratuito",
      "💰 Preventivo sicurezza completa",
      "📞 Emergenza sicurezza - chiamatemi"
    ],
    processROI: true,
    roiType: "security", 
    nextStep: "roi_security_implementation"
  },

  // Complete transformation analysis
  roi_complete_analysis: {
    message: `📊 **Trasformazione Digitale Completa - ROI Totale**

🏢 **Analisi 360° della vostra azienda**

**AREE DI TRASFORMAZIONE:**
• ☁️ **Infrastruttura Cloud**
• 🛠️ **IT Management**  
• 🔒 **Cybersecurity**
• 📱 **Digital Workplace**
• 📊 **Business Intelligence**

**📈 OBIETTIVI AZIENDALI:**
• Riduzione costi operativi?
• Aumento produttività?
• Miglioramento sicurezza?
• Crescita business?
• Compliance normativa?

**🎯 ASSESSMENT COMPLETO:**
Per calcolare il ROI totale, facciamo un'analisi strutturata della vostra azienda.

Iniziamo?`,
    options: [
      "🚀 Assessment completo (30 min)",
      "⚡ Analisi rapida (10 min)", 
      "📞 Consulenza con nostro CTO",
      "📧 Questionario dettagliato via email"
    ],
    nextStep: "roi_complete_assessment"
  },

  roi_complete_assessment: {
    message: `🔍 **Assessment Aziendale Completo**

**📋 INFORMAZIONI GENERALI:**
• Settore e dimensioni azienda
• Dipendenti totali e IT
• Fatturato annuo e crescita
• Budget IT attuale
• Principali sfide tecnologiche

**🎯 PRIORITÀ STRATEGICHE:**
• Obiettivi business 2024-2026
• Aree di miglioramento IT
• Budget investimenti disponibile
• Timeline implementazione
• Vincoli normativi/compliance

Iniziamo con le informazioni base:`,
    collectData: true,
    dataKey: "complete_assessment",
    nextStep: "roi_complete_calculation"
  },

  roi_complete_calculation: {
    message: `📊 **ROI Trasformazione Digitale Completa**

{{complete_roi_calculation}}

**🎯 ROADMAP TRASFORMAZIONE IT-ERA:**

**FASE 1 (Mesi 1-3): FONDAMENTA**
• Migrazione cloud infrastruttura
• Implementazione sicurezza avanzata
• Attivazione managed services
• *Investimento: {{phase1_investment}}*

**FASE 2 (Mesi 4-6): OTTIMIZZAZIONE** 
• Digital workplace completo
• Automazione processi IT
• Business intelligence base
• *Investimento: {{phase2_investment}}*

**FASE 3 (Mesi 7-12): INNOVAZIONE**
• AI e machine learning
• IoT e Industry 4.0
• Advanced analytics
• *Investimento: {{phase3_investment}}*

**💰 RISULTATI ATTESI:**
• **ROI 3 anni: {{total_roi}}%**
• **Payback: {{payback_months}} mesi**
• **Risparmio annuo: €{{annual_savings}}**
• **Produttività: +{{productivity_gain}}%**

**🏆 PARTNERSHIP STRATEGICA:**
Diventiamo il vostro CTO esterno per la trasformazione digitale.

Pianifichiamo insieme la roadmap?`,
    options: [
      "🚀 Pianifica trasformazione completa",
      "📋 Partnership strategica IT-ERA",  
      "💰 Investimento graduale per fasi",
      "📞 Board meeting con CEO/CFO"
    ],
    processROI: true,
    roiType: "complete",
    nextStep: "roi_strategic_planning"
  }
};

// ROI Processing Functions
export const ROIProcessingFunctions = {

  /**
   * Process ROI calculation based on conversation data
   */
  processROICalculation(conversationData, roiType) {
    const { leadData } = conversationData;
    
    try {
      // Extract relevant data
      const employees = this.extractEmployees(leadData);
      const budget = this.extractBudget(leadData);
      const companyData = this.buildCompanyProfile(leadData);
      
      // Calculate ROI based on type
      let roiResult;
      switch (roiType) {
        case 'cloud':
          roiResult = roiCalculator.calculateCloudVsPhysical(companyData);
          break;
        case 'managed':
          roiResult = roiCalculator.calculateManagedVsInhouse(companyData);
          break;
        case 'security':
          roiResult = roiCalculator.calculateSecurityROI(companyData);
          break;
        case 'complete':
          roiResult = roiCalculator.calculateCompleteTransformation(companyData);
          break;
        default:
          roiResult = roiCalculator.quickEstimate(employees, budget, 'complete');
      }
      
      return roiResult;
    } catch (error) {
      console.error('ROI calculation error:', error);
      return this.getGenericROI(leadData);
    }
  },

  /**
   * Extract employee count from various data sources
   */
  extractEmployees(leadData) {
    const fields = [leadData.employees, leadData.company_size, leadData.team_size];
    
    for (const field of fields) {
      if (field) {
        const match = String(field).match(/(\d+)/);
        if (match) return parseInt(match[1]);
      }
    }
    
    return 10; // Default assumption for SME
  },

  /**
   * Extract budget information
   */
  extractBudget(leadData) {
    const fields = [leadData.current_budget, leadData.budget_range, leadData.annual_revenue];
    
    for (const field of fields) {
      if (field) {
        const cleanField = String(field).replace(/[€.$,\s]/g, '');
        const match = cleanField.match(/(\d+)/);
        if (match) return parseInt(match[1]);
      }
    }
    
    return 50000; // Default SME budget assumption
  },

  /**
   * Build comprehensive company profile for ROI calculation
   */
  buildCompanyProfile(leadData) {
    return {
      employees: this.extractEmployees(leadData),
      annualRevenue: this.extractBudget(leadData) * 10, // Rough revenue estimate
      currentItCosts: this.extractBudget(leadData) * 0.1, // 10% of budget typically IT
      hasItStaff: leadData.current_it_setup?.toLowerCase().includes('interno') || false,
      currentSecurityLevel: leadData.current_security?.toLowerCase().includes('firewall') ? 'basic' : 'none',
      dataVolume: this.extractEmployees(leadData) * 50, // GB per employee estimate
      currentServers: Math.max(Math.floor(this.extractEmployees(leadData) / 15), 1),
      timeline: 36 // Standard 3-year analysis
    };
  },

  /**
   * Generate recommendations based on ROI results
   */
  generateRecommendations(roiResult, companyProfile) {
    const recommendations = [];
    
    if (roiResult.roi?.breakEvenMonths <= 12) {
      recommendations.push("⚡ **PRIORITÀ ALTA** - Payback rapido sotto i 12 mesi");
    }
    
    if (roiResult.roi?.roiPercentage > 200) {
      recommendations.push("📈 **ROI ECCELLENTE** - Ritorno superiore al 200%");
    }
    
    if (companyProfile.employees >= 20) {
      recommendations.push("🏢 **SCALA ENTERPRISE** - Benefici maggiori per aziende strutturate");
    }
    
    recommendations.push("💡 **CONSULENZA GRATUITA** - Assessment dettagliato senza impegno");
    recommendations.push("🎯 **IMPLEMENTAZIONE GRADUALE** - Partite dai servizi a ROI più alto");
    
    return recommendations.join('\n');
  },

  /**
   * Fallback generic ROI for when calculation fails
   */
  getGenericROI(leadData) {
    return {
      formatted: `[IT-ERA] Analisi ROI per la vostra azienda:

INVESTIMENTO TIPICO: €3.000 - €8.000 setup + €400 - €800/mese
RISPARMIO STIMATO: €800 - €1.500/mese
- Riduzione costi hardware: -€400/mese
- Zero downtime: -€600/mese  
- Efficienza operativa: -€500/mese

ROI: Break-even in 8-14 mesi
Ritorno a 3 anni: 180-250% (€15.000 - €35.000 risparmiati)

💡 Per un calcolo preciso, organizziamo un audit GRATUITO della vostra infrastruttura.`
    };
  }
};

export default ROIConversationFlows;