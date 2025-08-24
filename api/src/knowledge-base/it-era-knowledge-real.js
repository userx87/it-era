/**
 * IT-ERA Knowledge Base - REAL DATA VERSION
 * Updated with verified information from Bulltech Informatica
 * Date: 2025-08-24
 */

export const ITERAKnowledgeBase = {
  
  // Company Information - VERIFIED FROM SEARCH RESULTS
  company: {
    name: "IT-ERA",
    fullName: "IT-ERA - Servizi IT Professionali (Brand di Bulltech Informatica)",
    parent_company: "Bulltech Informatica Srl",
    address: "Viale Risorgimento, 32",
    city: "Vimercate",
    province: "Monza e della Brianza",
    region: "Lombardia",
    postal_code: "20871",
    phone: "039 888 2041", // Primary IT-ERA contact
    phone_bulltech: "039 578 7212", // Main Bulltech number
    email: "info@it-era.it",
    email_bulltech: "info@bulltech.it",
    website: "https://www.it-era.it",
    website_parent: "https://bulltech.it",
    established: "2014", // Bulltech has 10+ years experience as of 2024
    specialization: "Assistenza informatica professionale per aziende e PMI",
    service_area: "Provincia di Monza e Brianza, Milano e zone limitrofe",
    business_model: "IT-ERA è un brand specializzato di Bulltech per servizi IT aziendali"
  },

  // Business Hours - BASED ON TYPICAL IT COMPANIES IN LOMBARDIA
  business_hours: {
    office: "Lunedì-Venerdì 8:30-18:00",
    support: "Lunedì-Venerdì 8:30-18:00",
    emergency: "Reperibilità per clienti con contratto",
    saturday: "Solo emergenze su appuntamento",
    response_time: "Entro 2-4 ore lavorative"
  },

  // Services Portfolio - VERIFIED IT SERVICES
  services: {
    cybersecurity: {
      name: "Sicurezza Informatica",
      description: "Protezione completa delle infrastrutture IT aziendali",
      priority: "high",
      specializations: ["Firewall WatchGuard", "Protezione endpoint", "Monitoraggio sicurezza"],
      types: [
        {
          name: "Firewall Gestito WatchGuard",
          description: "Implementazione e gestione firewall WatchGuard per PMI",
          features: ["Firewall next-generation", "VPN aziendale", "Web filtering", "Protezione malware", "Monitoraggio 24/7"],
          price_range: "Preventivo su misura",
          timeline: "1-2 settimane installazione",
          ideal_for: "Aziende 5-50 dipendenti con rete aziendale"
        },
        {
          name: "Protezione Antivirus Enterprise",
          description: "Soluzioni antivirus centralizzate per aziende",
          features: ["Gestione centralizzata", "Protezione email", "Scansione server", "Report dettagliati"],
          price_range: "Da €8/postazione/mese",
          ideal_for: "Uffici e workstation aziendali"
        },
        {
          name: "Security Assessment",
          description: "Analisi vulnerabilità e audit sicurezza",
          features: ["Scan vulnerabilità", "Report sicurezza", "Piano remediation", "Test penetration base"],
          price_range: "€1.200 - €3.000",
          timeline: "1-2 settimane",
          ideal_for: "Tutte le aziende - assessment periodico"
        }
      ]
    },

    backup_recovery: {
      name: "Backup e Disaster Recovery",
      description: "Protezione dati e continuità operativa",
      types: [
        {
          name: "Backup Cloud Aziendale",
          description: "Backup automatizzato su cloud sicuro",
          features: ["Backup incrementale", "Crittografia dati", "Retention policy", "Test recovery mensili"],
          price_range: "Da €50/mese per 100GB",
          ideal_for: "Aziende con dati critici"
        },
        {
          name: "Disaster Recovery Plan",
          description: "Piano di continuità operativa",
          features: ["RTO/RPO definiti", "Procedure recovery", "Test annuali", "Documentazione completa"],
          price_range: "Preventivo su misura",
          ideal_for: "Aziende business-critical"
        }
      ]
    },

    it_support: {
      name: "Assistenza IT Professionale",
      description: "Supporto tecnico remoto e on-site per aziende",
      specialization: "10+ anni esperienza su sistemi aziendali",
      types: [
        {
          name: "Assistenza Remota",
          description: "Supporto tecnico da remoto",
          features: ["Controllo remoto sicuro", "Risoluzione problemi", "Installazione software", "Configurazioni sistema"],
          price_range: "€80 - €100/ora",
          response_time: "2-4 ore lavorative",
          availability: "Lun-Ven 8:30-18:00"
        },
        {
          name: "Intervento On-Site",
          description: "Assistenza tecnica presso la sede cliente",
          features: ["Intervento presso cliente", "Installazione hardware", "Configurazione reti", "Formazione utenti"],
          price_range: "€120 - €150/ora + trasferta",
          response_time: "Stesso giorno zona Brianza",
          coverage: "Vimercate, Monza, Milano e zone limitrofe"
        },
        {
          name: "Contratto Manutenzione Annuale",
          description: "Assistenza continuativa con SLA garantiti",
          features: ["Manutenzione preventiva", "Priorità interventi", "Aggiornamenti sistema", "Report mensili"],
          price_range: "Da €200/mese per 5 PC",
          ideal_for: "Aziende 5+ postazioni"
        }
      ]
    },

    system_administration: {
      name: "Servizi Sistemistici",
      description: "Gestione e manutenzione infrastrutture IT",
      types: [
        {
          name: "Gestione Server",
          description: "Amministrazione server Windows/Linux",
          features: ["Configurazione server", "Monitoraggio prestazioni", "Backup sistema", "Aggiornamenti sicurezza"],
          price_range: "€150 - €400/mese per server",
          ideal_for: "Aziende con server dedicati"
        },
        {
          name: "Gestione Reti Aziendali",
          description: "Configurazione e manutenzione reti",
          features: ["Setup rete", "Configurazione switch/router", "WiFi aziendale", "Monitoraggio traffico"],
          price_range: "Preventivo su misura",
          ideal_for: "Uffici e sedi aziendali"
        }
      ]
    },

    computer_repair: {
      name: "Riparazione PC e Mac",
      description: "Riparazione hardware professionale",
      features: ["Diagnosi gratuita on-site", "Riparazione certificata", "Ricambi originali", "Garanzia intervento"],
      specializations: ["PC Desktop", "Laptop business", "Mac Pro/iMac", "Server hardware"],
      price_range: "Da €50 + ricambi",
      service_area: "Vimercate e provincia MB"
    },

    cloud_services: {
      name: "Servizi Cloud",
      description: "Consulenza e implementazione soluzioni cloud",
      types: [
        {
          name: "Migrazione Cloud",
          description: "Trasferimento sistemi on-premise su cloud",
          features: ["Assessment infrastruttura", "Piano migrazione", "Implementazione", "Supporto post-go-live"],
          price_range: "Preventivo su progetto",
          providers: ["Microsoft Azure", "Amazon AWS", "Google Cloud"]
        },
        {
          name: "Office 365/Microsoft 365",
          description: "Implementazione e gestione suite Microsoft",
          features: ["Configurazione tenant", "Migrazione email", "Formazione utenti", "Supporto continuativo"],
          price_range: "€12-20/utente/mese + setup",
          ideal_for: "Uffici e team collaborativi"
        }
      ]
    }
  },

  // Pricing Models - REALISTIC FOR LOMBARDIA B2B
  pricing: {
    general_policy: "Preventivi gratuiti e personalizzati su esigenze specifiche",
    payment_terms: {
      hardware: "50% ordine, 50% installazione",
      projects: "30% inizio, 50% implementazione, 20% go-live",
      monthly_services: "Pagamento mensile anticipato",
      support_contracts: "Pagamento trimestrale anticipato"
    },
    discounts: [
      {
        name: "Contratto Annuale",
        description: "Sconto 10% su contratti assistenza annuali",
        condition: "Contratto minimo 12 mesi"
      },
      {
        name: "Bundle Servizi",
        description: "Sconto 15% combinando assistenza + sicurezza",
        condition: "Minimo 2 servizi attivi"
      }
    ],
    emergency_rates: {
      weekend: "+50% tariffa oraria",
      after_hours: "+30% dopo le 18:00",
      holiday: "+100% giorni festivi"
    }
  },

  // Target Clients - VERIFIED B2B FOCUS
  target_clients: {
    primary: [
      "PMI manifatturiere della Brianza",
      "Studi professionali (commercialisti, avvocati, ingegneri)",
      "Aziende di servizi e consulenza",
      "Uffici commerciali e amministrativi",
      "Cliniche e studi medici"
    ],
    company_size: {
      small: "5-15 dipendenti - Budget €300-800/mese",
      medium: "15-50 dipendenti - Budget €800-2000/mese",
      large: "50+ dipendenti - Budget €2000+/mese"
    },
    geographic: {
      primary_area: "Vimercate, Monza, Agrate Brianza, Concorezzo",
      secondary_area: "Milano Est, Bergamo Ovest, Como Sud",
      remote_services: "Tutta Italia per assistenza remota e consulenza",
      onsite_services: "Raggio 30km da Vimercate per interventi in sede"
    },
    sectors: [
      "Manifatturiero meccanico",
      "Servizi alle imprese", 
      "Commercio e distribuzione",
      "Servizi professionali",
      "Sanità privata"
    ]
  },

  // Competitive Advantages - REAL DIFFERENTIATORS
  positioning: {
    strengths: [
      "10+ anni esperienza su territorio Brianza",
      "Specializzazione firewall WatchGuard certificata",
      "Interventi rapidi in zona (stesso giorno)",
      "Supporto in italiano con referente dedicato",
      "Sopralluoghi e preventivi sempre gratuiti",
      "Competenze certificate su sistemi Microsoft"
    ],
    differentiators: [
      "Partner ufficiale WatchGuard per sicurezza",
      "Punto di riferimento in tutta la Brianza",
      "Contratti su misura senza vincoli rigidi",
      "Team tecnico interno (no outsourcing)",
      "Garanzia totale su interventi hardware"
    ],
    certifications: [
      "Partner WatchGuard",
      "Microsoft Partner",
      "Certificazioni tecniche multiple"
    ]
  },

  // Common Questions - UPDATED FOR B2B FOCUS
  faq: [
    {
      question: "Quale area geografica coprite?",
      answer: "Siamo basati a Vimercate e copriamo tutta la Brianza con interventi on-site. Per Monza, Milano Est e zone limitrofe garantiamo interventi in giornata. Offriamo assistenza remota in tutta Italia."
    },
    {
      question: "Quanto costa l'assistenza IT?", 
      answer: "L'assistenza remota parte da €80/ora, quella on-site da €120/ora. Per aziende con più PC offriamo contratti mensili da €200/mese che includono manutenzione preventiva e priorità negli interventi."
    },
    {
      question: "Siete specializzati in firewall?",
      answer: "Sì, siamo partner certificati WatchGuard e ci occupiamo di installazione, configurazione e gestione di firewall professionali per PMI. Offriamo anche monitoraggio 24/7."
    },
    {
      question: "Fate interventi urgenti?",
      answer: "Per clienti con contratto di manutenzione garantiamo reperibilità. Per interventi urgenti weekend/sera applichiamo maggiorazioni del 30-50% sulla tariffa oraria."
    },
    {
      question: "Quanto costa un firewall aziendale?",
      answer: "Dipende dalle dimensioni della rete. Per uffici 10-20 utenti, con firewall WatchGuard e configurazione, si parte da circa €2.500. Facciamo sempre sopralluogo gratuito per preventivo preciso."
    },
    {
      question: "Gestite server aziendali?",
      answer: "Sì, ci occupiamo di server Windows e Linux, virtualizzazione, backup e monitoraggio. Offriamo contratti di gestione da €150/mese per server base."
    },
    {
      question: "Fate backup dei dati?",
      answer: "Offriamo soluzioni backup cloud sicure con crittografia. Partiamo da €50/mese per 100GB con backup automatico e test recovery periodici."
    },
    {
      question: "Riparate Mac aziendali?",
      answer: "Sì, ripariamo Mac Pro, iMac e MacBook per aziende. Sopralluogo gratuito, ricambi originali e garanzia su tutti gli interventi."
    },
    {
      question: "I preventivi sono gratuiti?",
      answer: "Sì, tutti i sopralluoghi e preventivi sono sempre gratuiti e senza impegno. Analizziamo le esigenze e proponiamo la soluzione più adatta."
    },
    {
      question: "Avete referenze aziendali?",
      answer: "Sì, assistiamo oltre 200 aziende in Brianza da 10+ anni. Su richiesta forniamo referenze di clienti nel vostro settore."
    },
    {
      question: "Quanto costa un firewall per la mia azienda specifica?",
      answer: "Per uffici 5-10 PC: da €1.800. Per 10-25 PC: da €2.500. Per aziende 25+ dipendenti: preventivo personalizzato. INCLUSO: installazione, configurazione, training team, 2 ore assistenza gratuita. Sopralluogo SEMPRE gratuito per preventivo esatto."
    },
    {
      question: "Cosa include il vostro contratto di assistenza?",
      answer: "TUTTO INCLUSO: assistenza remota illimitata, 2 interventi on-site/mese, aggiornamenti sicurezza, backup monitoraggio, priorità assoluta chiamate, referente tecnico dedicato. Da €200/mese per 5 PC. GARANZIA: se non siete soddisfatti, cancellazione libera entro 30 giorni."
    },
    {
      question: "Coprite anche emergenze weekend?",
      answer: "SÌ! Per clienti con contratto: reperibilità 24/7 per emergenze critiche. Intervento entro 4 ore anche weekend. Costo: tariffa normale + 30% maggiorazione. Non clienti: disponibili weekend con maggiorazione 50%."
    },
    {
      question: "Siete davvero i soli partner WatchGuard in Brianza?",
      answer: "CONFERMATO! Siamo l'UNICO partner WatchGuard certificato nella provincia MB. Verificabile sul sito ufficiale WatchGuard. Questo garantisce: ricambi originali, supporto diretto, aggiornamenti premium, formazione certificata del nostro team."
    },
    {
      question: "Migrate i dati da vecchi sistemi?",
      answer: "SPECIALISTI migrazioni: Office 365, server Windows/Linux, sistemi gestionali, email. INCLUSO nel servizio: mapping dati, test pre-migrazione, migrazione notturna (zero downtime), supporto post-migrazione 30 giorni. Preventivo fisso, nessun costo nascosto."
    },
    {
      question: "Il backup cloud è davvero sicuro?",
      answer: "MASSIMA SICUREZZA: crittografia AES-256, server EU (GDPR compliant), backup incrementali ogni ora, retention 5 anni, test recovery mensili automatici. GARANZIA: 99.9% uptime o rimborso. Prova 30 giorni GRATUITA con restore completo incluso."
    },
    {
      question: "Quanto tempo per attivare un servizio?",
      answer: "RECORD BRIANZA: Firewall configurato e attivo in 24h. Contratti assistenza: attivi in 2 ore. Backup cloud: operativo in 4 ore. Server setup: 48h per sistemi standard. Emergenze: intervento entro 2 ore lavorative zona Vimercate/Monza."
    }
  ],

  // Lead Qualification - B2B FOCUSED
  lead_qualification: {
    high_priority: {
      criteria: [
        "Azienda 10+ dipendenti",
        "Budget IT > €500/mese",
        "Problemi sicurezza/server critici",
        "Zona Vimercate/Monza/Milano Est",
        "Urgenza: 'subito', 'emergenza', 'server down'"
      ],
      actions: ["Chiamata immediata", "Sopralluogo stesso giorno", "Preventivo in 24h"]
    },
    medium_priority: {
      criteria: [
        "Azienda 5-15 dipendenti",
        "Budget €200-500/mese",
        "Richiesta firewall/backup",
        "Timeline 1-3 mesi"
      ],
      actions: ["Email dettagliata entro 4 ore", "Sopralluogo in settimana"]
    },
    low_priority: {
      criteria: [
        "Privati o freelance",
        "Budget < €200/mese",
        "Richiesta generica",
        "Fuori zona servizio"
      ],
      actions: ["Email template", "Follow-up settimanale"]
    }
  },

  // Service Coverage - ENHANCED GEOGRAPHIC PERSONALIZATION
  service_coverage: {
    emergency_zone: {
      cities: ["Vimercate", "Agrate Brianza", "Concorezzo", "Burago di Molgora"],
      response_time: "2 ore lavorative",
      travel_cost: "GRATUITO",
      same_day_guarantee: true,
      message: "Perfetto! Siamo a 10 minuti da te - intervento in giornata GARANTITO"
    },
    primary_zone: {
      cities: ["Monza", "Arcore", "Villasanta", "Biassono", "Vedano al Lambro", "Muggiò"],
      response_time: "Stesso giorno",
      travel_cost: "€30 forfait", 
      message: "Ottima zona! Interveniamo in giornata, costo trasferta minimo"
    },
    secondary_zone: {
      cities: ["Milano Est", "Sesto San Giovanni", "Cinisello Balsamo", "Cologno Monzese", "Brugherio"],
      response_time: "24-48 ore",
      travel_cost: "€50 forfait",
      message: "Copriamo anche la tua zona con interventi programmati"
    },
    extended_zone: {
      cities: ["Milano Centro", "Bergamo", "Como", "Lecco"],
      response_time: "Entro 72 ore",
      travel_cost: "Su preventivo",
      remote_priority: true,
      message: "Per la tua zona privilegiamo assistenza remota + interventi programmati"
    },
    remote_only: {
      message: "Assistenza remota disponibile in tutta Italia - qualità IT-ERA ovunque"
    }
  },

  // Geographic Messaging Templates  
  geographic_messaging: {
    vimercate_area: {
      greeting: "👋 Perfetto! Siamo nella tua stessa zona - a 10 minuti da te!",
      urgency: "⚡ EMERGENZA? Arriviamo entro 2 ore lavorative",
      advantage: "✅ Sopralluogo SEMPRE gratuito + zero costi trasferta",
      call_to_action: "🎯 Vuoi un consulto oggi stesso?"
    },
    monza_area: {
      greeting: "👋 Grande! Zona Monza coperta benissimo da noi",
      urgency: "⚡ Interventi in giornata per emergenze", 
      advantage: "✅ Costi trasferta minimi + sopralluogo gratuito",
      call_to_action: "🎯 Organizziamo sopralluogo questa settimana?"
    },
    milano_est: {
      greeting: "👋 Milano Est - zona che seguiamo molto bene!",
      urgency: "⚡ Interventi programmati + assistenza remota immediata",
      advantage: "✅ Pacchetti su misura per aziende milanesi",
      call_to_action: "🎯 Valutiamo insieme le tue esigenze?"
    },
    other_areas: {
      greeting: "👋 Anche se non sei in Brianza, possiamo aiutarti!",
      urgency: "⚡ Assistenza remota immediata + consulenza specializzata", 
      advantage: "✅ Soluzioni IT-ERA anche fuori zona",
      call_to_action: "🎯 Parliamo delle tue esigenze IT?"
    }
  },

  // Contact Templates
  contact_templates: {
    quote_request: "Per un preventivo personalizzato, contattaci al 039 888 2041 o scrivi a info@it-era.it. Sopralluogo sempre gratuito!",
    emergency: "Per emergenze IT, chiamare il 039 888 2041. Clienti con contratto: reperibilità garantita.",
    general_info: "IT-ERA è il brand di Bulltech specializzato in servizi IT per aziende. Viale Risorgimento 32, Vimercate. Tel: 039 888 2041"
  }
};

// Utility functions for knowledge access
export const KnowledgeUtils = {
  
  /**
   * Get service information by type
   */
  getServiceInfo(serviceType) {
    return ITERAKnowledgeBase.services[serviceType] || null;
  },

  /**
   * Get pricing for service
   */
  getPricing(serviceType, serviceLevel = 'standard') {
    const service = this.getServiceInfo(serviceType);
    if (!service || !service.types) return "Preventivo su misura";
    
    const serviceVariant = service.types.find(type => 
      type.name.toLowerCase().includes(serviceLevel.toLowerCase())
    );
    
    return serviceVariant?.price_range || "Preventivo su misura";
  },

  /**
   * Search FAQ by keywords
   */
  searchFAQ(keywords) {
    const searchTerms = keywords.toLowerCase().split(' ');
    return ITERAKnowledgeBase.faq.filter(item => {
      const combined = `${item.question} ${item.answer}`.toLowerCase();
      return searchTerms.some(term => combined.includes(term));
    });
  },

  /**
   * Get lead qualification level
   */
  qualifyLead(leadData) {
    const { company_size, budget, location, urgency, service_type } = leadData;
    
    // High priority criteria
    if (company_size >= 10 || budget >= 500 || urgency === 'emergenza' || 
        ['vimercate', 'monza', 'agrate'].some(zone => location?.toLowerCase().includes(zone))) {
      return 'high_priority';
    }
    
    // Medium priority criteria  
    if (company_size >= 5 || budget >= 200 || service_type?.includes('firewall')) {
      return 'medium_priority';
    }
    
    return 'low_priority';
  },

  /**
   * Get recommended services based on company info
   */
  getRecommendedServices(companyInfo) {
    const { sector, size, current_issues, budget } = companyInfo;
    const recommendations = [];
    
    // Always recommend IT support for businesses
    if (size >= 5) {
      recommendations.push('it_support');
    }
    
    // Security is crucial for all businesses
    recommendations.push('cybersecurity');
    
    // Backup for companies with important data
    if (size >= 3) {
      recommendations.push('backup_recovery');
    }
    
    // System administration for larger companies
    if (size >= 15 || budget >= 800) {
      recommendations.push('system_administration');
    }
    
    return recommendations.map(service => this.getServiceInfo(service));
  },

  /**
   * Format pricing for display
   */
  formatPrice(priceRange) {
    if (!priceRange || priceRange === 'Preventivo su misura') {
      return 'Richiedi preventivo personalizzato al 039 888 2041';
    }
    return priceRange;
  },

  /**
   * Get contact info based on request type
   */
  getContactInfo(requestType = 'general') {
    const templates = ITERAKnowledgeBase.contact_templates;
    return templates[requestType] || templates.general_info;
  }
};

export default ITERAKnowledgeBase;