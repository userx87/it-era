/**
 * IT-ERA Knowledge Base
 * Comprehensive knowledge about services, pricing, and company information
 */

export const ITERAKnowledgeBase = {
  
  // Company Information
  company: {
    name: "IT-ERA",
    fullName: "IT-ERA - Servizi IT Professionali",
    location: "Lombardia, Italia",
    email: "info@it-era.it",
    phone: "+39 XXX XXX XXXX", // To be filled
    website: "https://www.it-era.it",
    established: "2020",
    specialization: "Soluzioni IT complete per aziende e professionisti"
  },

  // Services Portfolio
  services: {
    web_development: {
      name: "Sviluppo Siti Web",
      description: "Siti web professionali, responsive e SEO ottimizzati",
      types: [
        {
          name: "Sito Vetrina Aziendale",
          description: "Sito web istituzionale per presentare la tua azienda",
          features: ["Design responsive", "SEO incluso", "CMS WordPress", "Form contatti", "Hosting incluso"],
          price_range: "€2.500 - €6.000",
          timeline: "2-4 settimane",
          ideal_for: "PMI, professionisti, aziende di servizi"
        },
        {
          name: "Sito Web Avanzato",
          description: "Sito complesso con funzionalità avanzate",
          features: ["Multi-lingua", "Area riservata", "Integrazione CRM", "Analytics avanzato", "Chat integrata"],
          price_range: "€6.000 - €15.000",
          timeline: "4-8 settimane",
          ideal_for: "Aziende strutturate, enti, organizzazioni"
        },
        {
          name: "Landing Page",
          description: "Pagina singola ottimizzata per conversioni",
          features: ["Design conversion-focused", "A/B testing", "Analytics", "Form lead", "Mobile-first"],
          price_range: "€800 - €2.500",
          timeline: "1-2 settimane",
          ideal_for: "Campagne marketing, lancio prodotti"
        }
      ],
      technologies: ["WordPress", "React", "Next.js", "PHP", "JavaScript", "MySQL"],
      includes: ["Design personalizzato", "Hosting 1 anno", "SSL certificato", "Email professionale", "Supporto 3 mesi"]
    },

    ecommerce: {
      name: "E-commerce",
      description: "Negozi online completi e performanti",
      types: [
        {
          name: "E-commerce Standard",
          description: "Negozio online completo per PMI",
          features: ["Catalogo prodotti", "Carrello", "Pagamenti sicuri", "Gestione ordini", "SEO shop"],
          price_range: "€5.000 - €12.000",
          timeline: "4-6 settimane",
          ideal_for: "Piccole e medie aziende",
          max_products: "500 prodotti"
        },
        {
          name: "E-commerce Avanzato",
          description: "Piattaforma e-commerce enterprise",
          features: ["Multi-vendor", "B2B/B2C", "ERP integration", "Multi-lingua", "Advanced analytics"],
          price_range: "€12.000 - €25.000",
          timeline: "6-12 settimane",
          ideal_for: "Aziende strutturate, distributori",
          max_products: "Illimitati"
        },
        {
          name: "Marketplace",
          description: "Piattaforma marketplace multi-vendor",
          features: ["Vendor management", "Commission system", "Advanced search", "Review system", "Dashboard vendor"],
          price_range: "€20.000 - €50.000",
          timeline: "8-16 settimane",
          ideal_for: "Grandi progetti, startup innovative"
        }
      ],
      platforms: ["WooCommerce", "Shopify", "Magento", "Custom PHP/Laravel"],
      payment_methods: ["PayPal", "Stripe", "Bonifico", "Klarna", "Apple Pay", "Google Pay"],
      integrations: ["Corrieri", "Fatturazione elettronica", "Gestionale", "CRM", "Email marketing"]
    },

    mobile_apps: {
      name: "App Mobile",
      description: "Applicazioni iOS e Android native e ibride",
      types: [
        {
          name: "App Aziendale",
          description: "App mobile per servizi aziendali",
          features: ["Design nativo", "Push notifications", "Offline sync", "User authentication", "Analytics"],
          price_range: "€10.000 - €20.000",
          timeline: "8-12 settimane",
          platforms: ["iOS", "Android"],
          ideal_for: "Aziende di servizi, professionisti"
        },
        {
          name: "E-commerce App",
          description: "App mobile per negozio online",
          features: ["Catalogo mobile", "Carrello native", "Pagamenti app", "Wishlist", "Geo-localizzazione"],
          price_range: "€15.000 - €30.000",
          timeline: "10-16 settimane",
          ideal_for: "E-commerce, retail"
        },
        {
          name: "App Enterprise",
          description: "Applicazione aziendale complessa",
          features: ["Backend custom", "API integration", "Multi-user", "Advanced security", "Reporting"],
          price_range: "€25.000 - €50.000",
          timeline: "12-20 settimane",
          ideal_for: "Grandi aziende, progetti complessi"
        }
      ],
      technologies: ["React Native", "Flutter", "Swift", "Kotlin", "Xamarin"],
      includes: ["Pubblicazione store", "Testing completo", "Documentazione", "Supporto post-lancio"]
    },

    server_cloud: {
      name: "Server e Cloud",
      description: "Infrastrutture server e servizi cloud",
      services: [
        {
          name: "Server Dedicato",
          description: "Server fisico dedicato",
          features: ["CPU dedicata", "RAM garantita", "Storage SSD", "Backup giornaliero", "Monitoraggio 24/7"],
          price_range: "€150 - €500/mese",
          ideal_for: "Siti ad alto traffico, e-commerce"
        },
        {
          name: "Cloud VPS",
          description: "Server virtuale privato",
          features: ["Risorse scalabili", "SSD storage", "Snapshot", "Control panel", "Support incluso"],
          price_range: "€50 - €200/mese",
          ideal_for: "Siti web, applicazioni web"
        },
        {
          name: "Cloud AWS/Azure",
          description: "Infrastruttura cloud enterprise",
          features: ["Auto-scaling", "Load balancing", "CDN", "Database managed", "Disaster recovery"],
          price_range: "€300 - €2.000/mese",
          ideal_for: "Enterprise, startup scalabili"
        }
      ],
      includes: ["Setup completo", "Migrazione dati", "SSL certificato", "Monitoring", "Support tecnico"],
      locations: ["Italia", "Europa", "Global CDN"]
    },

    cybersecurity: {
      name: "Cybersecurity",
      description: "Protezione e sicurezza informatica",
      services: [
        {
          name: "Security Audit",
          description: "Analisi vulnerabilità sistema",
          features: ["Scan vulnerabilità", "Report dettagliato", "Piano remediation", "Test penetration", "Compliance check"],
          price_range: "€1.500 - €5.000",
          timeline: "1-2 settimane",
          ideal_for: "Tutte le aziende"
        },
        {
          name: "Backup & Recovery",
          description: "Backup automatizzato e disaster recovery",
          features: ["Backup automatico", "Cloud storage", "Recovery testing", "RTO/RPO garantiti", "Monitoraggio"],
          price_range: "€100 - €500/mese",
          ideal_for: "Aziende con dati critici"
        },
        {
          name: "Firewall Gestito",
          description: "Protezione perimetrale avanzata",
          features: ["Firewall next-gen", "IDS/IPS", "Web filtering", "VPN aziendale", "Monitoraggio 24/7"],
          price_range: "€200 - €800/mese",
          ideal_for: "PMI, reti aziendali"
        },
        {
          name: "Antivirus Enterprise",
          description: "Protezione endpoint aziendale",
          features: ["Protezione multi-layer", "Gestione centralizzata", "Report compliance", "Auto-update", "Support dedicato"],
          price_range: "€5 - €15/device/mese",
          ideal_for: "Uffici, workstation"
        }
      ],
      compliance: ["GDPR", "ISO 27001", "PCI DSS"],
      certifications: ["Certified Ethical Hacker", "CISSP", "CompTIA Security+"]
    },

    it_support: {
      name: "Assistenza IT",
      description: "Supporto tecnico e manutenzione sistemi",
      services: [
        {
          name: "Supporto Remoto",
          description: "Assistenza tecnica da remoto",
          features: ["Accesso remoto", "Risoluzione problemi", "Installazione software", "Configurazioni", "Formazione utenti"],
          price_range: "€80 - €120/ora",
          response_time: "2-4 ore",
          availability: "Lun-Ven 9-18"
        },
        {
          name: "Supporto On-Site",
          description: "Intervento tecnico in sede",
          features: ["Intervento fisico", "Installazione hardware", "Configurazione rete", "Formazione staff", "Documentazione"],
          price_range: "€150 - €200/ora",
          response_time: "4-8 ore",
          coverage: "Lombardia e zone limitrofe"
        },
        {
          name: "Contratto Manutenzione",
          description: "Manutenzione proattiva sistemi",
          features: ["Monitoraggio continuo", "Manutenzione preventiva", "Aggiornamenti", "Priority support", "Report mensili"],
          price_range: "€200 - €1.000/mese",
          ideal_for: "Aziende 10+ dipendenti"
        }
      ],
      specializations: ["Windows Server", "Office 365", "Reti aziendali", "Database", "Virtualizzazione"]
    }
  },

  // Pricing Models
  pricing: {
    payment_terms: {
      web_development: "50% inizio, 50% fine progetto",
      ecommerce: "40% inizio, 40% test, 20% go-live",
      mobile_apps: "30% inizio, 50% beta, 20% store",
      monthly_services: "Pagamento mensile anticipato"
    },
    discounts: [
      {
        name: "Bundle Sconto",
        description: "Sconto 10% per più servizi",
        condition: "Minimo 2 servizi diversi"
      },
      {
        name: "Startup Discount",
        description: "Sconto 15% per startup",
        condition: "Aziende under 2 anni"
      },
      {
        name: "Non-Profit",
        description: "Sconto 20% per no-profit",
        condition: "Organizzazioni certificate"
      }
    ]
  },

  // Common Questions & Answers
  faq: [
    {
      question: "Quanto costa un sito web?",
      answer: "I costi variano da €2.500 per un sito vetrina a €15.000 per portali complessi. Il prezzo finale dipende dalle funzionalità richieste, design personalizzato e integrazioni necessarie."
    },
    {
      question: "Quanto tempo per sviluppare un sito?",
      answer: "Un sito vetrina richiede 2-4 settimane, un sito complesso 4-8 settimane. I tempi dipendono dalla complessità e dalla velocità di feedback del cliente."
    },
    {
      question: "Il sito sarà responsive?",
      answer: "Tutti i nostri siti sono responsive e ottimizzati per mobile. Testiamo su tutti i dispositivi principali per garantire la migliore esperienza utente."
    },
    {
      question: "È incluso l'hosting?",
      answer: "Sì, includiamo 1 anno di hosting professionale, certificato SSL, email aziendali e supporto tecnico nei nostri pacchetti web."
    },
    {
      question: "Posso gestire il sito da solo?",
      answer: "Assolutamente! Utilizziamo CMS user-friendly come WordPress. Forniamo training completo e documentazione per la gestione autonoma."
    },
    {
      question: "Fate e-commerce?",
      answer: "Sì, sviluppiamo e-commerce completi da €5.000. Includiamo catalogo prodotti, carrello, pagamenti sicuri, gestione ordini e integrazione corrieri."
    },
    {
      question: "Sviluppate app mobile?",
      answer: "Sviluppiamo app native iOS/Android e cross-platform. Progetti da €10.000, inclusa pubblicazione negli store e supporto post-lancio."
    },
    {
      question: "Offrite assistenza dopo la consegna?",
      answer: "Sì, includiamo 3 mesi di supporto gratuito. Dopo offriamo contratti di manutenzione con supporto prioritario e aggiornamenti."
    },
    {
      question: "Fate preventivi gratuiti?",
      answer: "Sì, tutti i preventivi sono gratuiti e senza impegno. Analizziamo le esigenze e proponiamo la soluzione più adatta al budget."
    },
    {
      question: "Lavorate con aziende fuori Lombardia?",
      answer: "Sì, seguiamo clienti in tutta Italia. Per progetti web e app lavoriamo completamente in remoto. L'assistenza on-site è principalmente in Lombardia."
    }
  ],

  // Lead Qualification Criteria
  lead_qualification: {
    high_priority: {
      criteria: [
        "Budget > €5.000",
        "Azienda 10+ dipendenti",
        "Timeline < 2 mesi",
        "Settore target (manifatturiero, servizi, retail)",
        "Keywords: urgente, subito, preventivo dettagliato"
      ],
      actions: ["Escalation immediata", "Chiamata entro 2 ore", "Preventivo prioritario"]
    },
    medium_priority: {
      criteria: [
        "Budget €2.000-€5.000",
        "Azienda 5-10 dipendenti", 
        "Timeline 2-6 mesi",
        "Interest in multiple services"
      ],
      actions: ["Email dettagliata entro 4 ore", "Follow-up in 24h"]
    },
    low_priority: {
      criteria: [
        "Budget < €2.000",
        "Privato/freelance",
        "Timeline > 6 mesi",
        "Richiesta generica"
      ],
      actions: ["Email template", "Follow-up settimanale", "Nurturing campaign"]
    }
  },

  // Regional Information
  regions: {
    primary_markets: ["Milano", "Bergamo", "Brescia", "Como", "Varese", "Monza"],
    secondary_markets: ["Lombardia", "Piemonte", "Veneto"],
    service_areas: {
      remote: "Tutta Italia per servizi web/app",
      onsite: "Lombardia e zone limitrofe",
      emergency: "Milano e provincia"
    }
  },

  // Competition Analysis
  positioning: {
    strengths: [
      "Soluzioni complete end-to-end",
      "Prezzi competitivi per PMI",
      "Supporto locale in italiano",
      "Tecnologie moderne e aggiornate",
      "Team specializzato per settore"
    ],
    differentiators: [
      "Focus su ROI del cliente",
      "Metodologie agili",
      "Supporto post-vendita incluso",
      "Progetti chiavi in mano",
      "Partnership tecnologiche certificate"
    ]
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
    if (!service || !service.types) return null;
    
    return service.types.find(type => 
      type.name.toLowerCase().includes(serviceLevel.toLowerCase())
    );
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
    const { budget, company_size, timeline, urgency } = leadData;
    
    // High priority criteria
    if (budget > 5000 || company_size >= 10 || urgency === 'urgente') {
      return 'high_priority';
    }
    
    // Medium priority criteria  
    if (budget >= 2000 || company_size >= 5) {
      return 'medium_priority';
    }
    
    return 'low_priority';
  },

  /**
   * Get recommended services based on business info
   */
  getRecommendedServices(businessInfo) {
    const { sector, size, budget, goals } = businessInfo;
    const recommendations = [];
    
    if (goals?.includes('online presence') || goals?.includes('website')) {
      recommendations.push('web_development');
    }
    
    if (goals?.includes('sell online') || goals?.includes('ecommerce')) {
      recommendations.push('ecommerce');
    }
    
    if (size >= 10 || budget >= 10000) {
      recommendations.push('server_cloud', 'cybersecurity', 'it_support');
    }
    
    return recommendations.map(service => this.getServiceInfo(service));
  },

  /**
   * Format pricing for display
   */
  formatPrice(priceRange) {
    if (!priceRange) return 'Preventivo su misura';
    return priceRange.replace('€', '€ ').replace(' - ', ' - € ');
  }
};

export default ITERAKnowledgeBase;