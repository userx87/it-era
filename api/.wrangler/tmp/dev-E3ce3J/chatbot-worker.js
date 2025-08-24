var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// .wrangler/tmp/bundle-kBoNSG/checked-fetch.js
var require_checked_fetch = __commonJS({
  ".wrangler/tmp/bundle-kBoNSG/checked-fetch.js"() {
    var urls = /* @__PURE__ */ new Set();
    function checkURL(request, init) {
      const url = request instanceof URL ? request : new URL(
        (typeof request === "string" ? new Request(request, init) : request).url
      );
      if (url.port && url.port !== "443" && url.protocol === "https:") {
        if (!urls.has(url.toString())) {
          urls.add(url.toString());
          console.warn(
            `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
          );
        }
      }
    }
    __name(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});

// .wrangler/tmp/bundle-kBoNSG/middleware-loader.entry.ts
var import_checked_fetch12 = __toESM(require_checked_fetch());

// wrangler-modules-watch:wrangler:modules-watch
var import_checked_fetch = __toESM(require_checked_fetch());

// .wrangler/tmp/bundle-kBoNSG/middleware-insertion-facade.js
var import_checked_fetch10 = __toESM(require_checked_fetch());

// src/chatbot/api/chatbot-worker.js
var import_checked_fetch7 = __toESM(require_checked_fetch());

// src/ai-engine/ai-integration.js
var import_checked_fetch2 = __toESM(require_checked_fetch());
var AIIntegrationEngine = class {
  static {
    __name(this, "AIIntegrationEngine");
  }
  constructor(config = {}) {
    this.config = {
      provider: config.provider || "openai",
      // 'openai' or 'anthropic'
      model: config.model || "gpt-4o-mini",
      // Cost-effective model
      maxTokens: config.maxTokens || 150,
      // Keep responses concise
      temperature: config.temperature || 0.7,
      language: config.language || "italian",
      costLimit: config.costLimit || 0.1,
      // $0.10 per conversation
      ...config
    };
    this.conversationCosts = /* @__PURE__ */ new Map();
    this.responseCache = /* @__PURE__ */ new Map();
    this.rateLimiter = /* @__PURE__ */ new Map();
  }
  /**
   * Initialize AI provider based on configuration
   */
  async initializeProvider(env) {
    if (this.config.provider === "openai") {
      this.apiKey = env.OPENAI_API_KEY;
      this.apiUrl = "https://api.openai.com/v1/chat/completions";
      this.costPerToken = 15e-5;
    } else if (this.config.provider === "anthropic") {
      this.apiKey = env.ANTHROPIC_API_KEY;
      this.apiUrl = "https://api.anthropic.com/v1/messages";
      this.costPerToken = 25e-5;
    }
    if (!this.apiKey) {
      throw new Error(`Missing API key for ${this.config.provider}`);
    }
  }
  /**
   * Generate AI response with cost control and caching
   */
  async generateResponse(message, context = {}, sessionId) {
    try {
      if (!this.checkRateLimit(sessionId)) {
        return {
          message: "Scusa, stai inviando messaggi troppo velocemente. Attendi qualche secondo.",
          intent: "rate_limit",
          cost: 0
        };
      }
      if (!this.checkCostLimit(sessionId)) {
        return {
          message: "Per continuare la conversazione, ti metter\xF2 in contatto con un nostro esperto umano.",
          intent: "cost_limit_reached",
          escalate: true,
          cost: 0
        };
      }
      const cacheKey = this.generateCacheKey(message, context);
      const cached = this.responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 36e5) {
        return { ...cached.response, cost: 0, cached: true };
      }
      const prompt = this.buildPrompt(message, context);
      const response = await this.callAI(prompt);
      const parsedResponse = this.parseAIResponse(response, context);
      const cost = this.calculateCost(response);
      this.trackCost(sessionId, cost);
      if (this.shouldCache(parsedResponse)) {
        this.responseCache.set(cacheKey, {
          response: parsedResponse,
          timestamp: Date.now()
        });
      }
      return { ...parsedResponse, cost };
    } catch (error) {
      console.error("AI Generation Error:", error);
      return {
        message: "Scusa, c'\xE8 stato un problema tecnico. Un momento, passo la conversazione a un nostro esperto.",
        intent: "ai_error",
        escalate: true,
        cost: 0
      };
    }
  }
  /**
   * Build context-aware prompt for IT-ERA
   */
  buildPrompt(message, context) {
    const systemPrompt = `Sei l'assistente virtuale di IT-ERA, un'azienda IT professionale in Lombardia.

AZIENDA: IT-ERA offre servizi IT completi: sviluppo siti web, e-commerce, app mobile, server cloud, cybersecurity, assistenza IT.

PERSONALIT\xC0: Professionale, competente, amichevole. Parli sempre in italiano. Risposte concise (max 2-3 frasi).

OBIETTIVO: Pre-qualificare i lead e raccogliere informazioni per preventivo. Se il cliente \xE8 interessato, raccogli: nome azienda, settore, citt\xE0, numero dipendenti, tipo servizio.

ESCALATION: Se non riesci a rispondere o il cliente vuole parlare con un umano, attiva l'escalation.

SERVIZI PRINCIPALI:
- Siti web aziendali (\u20AC2.500-\u20AC15.000)
- E-commerce completi (\u20AC5.000-\u20AC25.000)  
- App mobile iOS/Android (\u20AC10.000-\u20AC50.000)
- Server e cloud (\u20AC500-\u20AC2.000/mese)
- Cybersecurity e backup (\u20AC300-\u20AC1.500/mese)
- Assistenza IT (\u20AC100-\u20AC200/ora)

PROCESSO:
1. Saluta e chiedi come puoi aiutare
2. Identifica il servizio d'interesse
3. Raccogli info aziendali base
4. Proponi escalation per preventivo dettagliato

Conversation context: ${JSON.stringify(context)}`;
    if (this.config.provider === "openai") {
      return [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ];
    } else {
      return {
        system: systemPrompt,
        messages: [{ role: "user", content: message }]
      };
    }
  }
  /**
   * Call AI API with provider-specific format
   */
  async callAI(prompt) {
    const headers = {
      "Content-Type": "application/json"
    };
    let body;
    if (this.config.provider === "openai") {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
      body = {
        model: this.config.model,
        messages: prompt,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      };
    } else {
      headers["x-api-key"] = this.apiKey;
      headers["anthropic-version"] = "2023-06-01";
      body = {
        model: this.config.model || "claude-3-haiku-20240307",
        system: prompt.system,
        messages: prompt.messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      };
    }
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API Error: ${response.status} - ${error}`);
    }
    return await response.json();
  }
  /**
   * Parse AI response and extract intent/actions
   */
  parseAIResponse(response, context) {
    let message;
    let usage;
    if (this.config.provider === "openai") {
      message = response.choices?.[0]?.message?.content || "Scusa, non ho capito.";
      usage = response.usage;
    } else {
      message = response.content?.[0]?.text || "Scusa, non ho capito.";
      usage = response.usage;
    }
    const intent = this.extractIntent(message, context);
    const escalate = this.shouldEscalate(message, intent, context);
    const options = this.generateOptions(intent, context);
    return {
      message: message.trim(),
      intent,
      escalate,
      options,
      usage,
      nextStep: this.determineNextStep(intent, context)
    };
  }
  /**
   * Extract intent from AI response
   */
  extractIntent(message, context) {
    const msg = message.toLowerCase();
    if (msg.includes("preventivo") || msg.includes("quotazione")) return "preventivo";
    if (msg.includes("assistenza") || msg.includes("supporto")) return "supporto";
    if (msg.includes("sito") && msg.includes("web")) return "sito_web";
    if (msg.includes("ecommerce") || msg.includes("e-commerce")) return "ecommerce";
    if (msg.includes("app") && msg.includes("mobile")) return "app_mobile";
    if (msg.includes("server") || msg.includes("cloud")) return "server";
    if (msg.includes("sicurezza") || msg.includes("cybersecurity")) return "cybersecurity";
    if (context.step === "greeting") return "saluto";
    if (context.step === "service_inquiry") return "servizio_info";
    if (context.leadData && Object.keys(context.leadData).length > 2) return "lead_qualified";
    return "generale";
  }
  /**
   * Determine if human escalation is needed
   */
  shouldEscalate(message, intent, context) {
    const escalationTriggers = [
      "umano",
      "persona",
      "operatore",
      "telefono",
      "chiamare",
      "complesso",
      "urgente",
      "subito",
      "problema grave"
    ];
    const msg = message.toLowerCase();
    return escalationTriggers.some((trigger) => msg.includes(trigger)) || intent === "lead_qualified" || context.escalationRequested;
  }
  /**
   * Generate contextual options for user
   */
  generateOptions(intent, context) {
    const optionMap = {
      saluto: ["Preventivo", "Assistenza Tecnica", "Info Servizi", "Altro"],
      preventivo: ["Sito Web", "E-commerce", "App Mobile", "Server/Cloud", "Cybersecurity", "Assistenza IT"],
      sito_web: ["Sito Vetrina", "Sito E-commerce", "Portale Aziendale", "Landing Page"],
      ecommerce: ["B2C Consumer", "B2B Aziendale", "Marketplace", "Dropshipping"],
      generale: ["Preventivo", "Assistenza", "Info Servizi"],
      lead_qualified: ["Invia Preventivo", "Chiama Subito", "Email Dettagli"]
    };
    return optionMap[intent] || optionMap.generale;
  }
  /**
   * Determine next conversation step
   */
  determineNextStep(intent, context) {
    const stepMap = {
      saluto: "service_selection",
      preventivo: "service_details",
      sito_web: "business_info",
      ecommerce: "business_info",
      app_mobile: "business_info",
      lead_qualified: "escalation",
      generale: "clarification"
    };
    return stepMap[intent] || "continue";
  }
  /**
   * Rate limiting check
   */
  checkRateLimit(sessionId) {
    const now = Date.now();
    const sessionLimits = this.rateLimiter.get(sessionId) || { count: 0, window: now };
    if (now - sessionLimits.window > 6e4) {
      sessionLimits.count = 0;
      sessionLimits.window = now;
    }
    if (sessionLimits.count >= 10) {
      return false;
    }
    sessionLimits.count++;
    this.rateLimiter.set(sessionId, sessionLimits);
    return true;
  }
  /**
   * Cost limit check
   */
  checkCostLimit(sessionId) {
    const sessionCost = this.conversationCosts.get(sessionId) || 0;
    return sessionCost < this.config.costLimit;
  }
  /**
   * Calculate API call cost
   */
  calculateCost(response) {
    let totalTokens = 0;
    if (this.config.provider === "openai") {
      totalTokens = response.usage?.total_tokens || 0;
    } else {
      totalTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
    }
    return totalTokens * this.costPerToken;
  }
  /**
   * Track conversation costs
   */
  trackCost(sessionId, cost) {
    const currentCost = this.conversationCosts.get(sessionId) || 0;
    this.conversationCosts.set(sessionId, currentCost + cost);
  }
  /**
   * Generate cache key for response caching
   */
  generateCacheKey(message, context) {
    const normalizedMessage = message.toLowerCase().replace(/[^\w\s]/g, "").trim();
    return `${normalizedMessage}_${context.step || "default"}`;
  }
  /**
   * Determine if response should be cached
   */
  shouldCache(response) {
    const cacheableIntents = ["saluto", "informazioni", "servizi", "generale"];
    return cacheableIntents.includes(response.intent) && response.message.length > 20;
  }
  /**
   * Get usage statistics
   */
  getUsageStats() {
    const totalCosts = Array.from(this.conversationCosts.values()).reduce((sum, cost) => sum + cost, 0);
    return {
      totalConversations: this.conversationCosts.size,
      totalCosts: totalCosts.toFixed(4),
      avgCostPerConversation: (totalCosts / this.conversationCosts.size || 0).toFixed(4),
      cacheHitRate: this.responseCache.size > 0 ? (this.responseCache.size / (this.conversationCosts.size + this.responseCache.size) * 100).toFixed(2) + "%" : "0%"
    };
  }
  /**
   * Reset usage data (call daily)
   */
  resetUsageData() {
    this.conversationCosts.clear();
    this.rateLimiter.clear();
    const now = Date.now();
    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > 36e5) {
        this.responseCache.delete(key);
      }
    }
  }
};
var ai_integration_default = AIIntegrationEngine;

// src/conversation-flows/conversation-designer.js
var import_checked_fetch4 = __toESM(require_checked_fetch());

// src/knowledge-base/it-era-knowledge.js
var import_checked_fetch3 = __toESM(require_checked_fetch());
var ITERAKnowledgeBase = {
  // Company Information
  company: {
    name: "IT-ERA",
    fullName: "IT-ERA - Servizi IT Professionali",
    location: "Lombardia, Italia",
    email: "info@it-era.it",
    phone: "+39 XXX XXX XXXX",
    // To be filled
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
          price_range: "\u20AC2.500 - \u20AC6.000",
          timeline: "2-4 settimane",
          ideal_for: "PMI, professionisti, aziende di servizi"
        },
        {
          name: "Sito Web Avanzato",
          description: "Sito complesso con funzionalit\xE0 avanzate",
          features: ["Multi-lingua", "Area riservata", "Integrazione CRM", "Analytics avanzato", "Chat integrata"],
          price_range: "\u20AC6.000 - \u20AC15.000",
          timeline: "4-8 settimane",
          ideal_for: "Aziende strutturate, enti, organizzazioni"
        },
        {
          name: "Landing Page",
          description: "Pagina singola ottimizzata per conversioni",
          features: ["Design conversion-focused", "A/B testing", "Analytics", "Form lead", "Mobile-first"],
          price_range: "\u20AC800 - \u20AC2.500",
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
          price_range: "\u20AC5.000 - \u20AC12.000",
          timeline: "4-6 settimane",
          ideal_for: "Piccole e medie aziende",
          max_products: "500 prodotti"
        },
        {
          name: "E-commerce Avanzato",
          description: "Piattaforma e-commerce enterprise",
          features: ["Multi-vendor", "B2B/B2C", "ERP integration", "Multi-lingua", "Advanced analytics"],
          price_range: "\u20AC12.000 - \u20AC25.000",
          timeline: "6-12 settimane",
          ideal_for: "Aziende strutturate, distributori",
          max_products: "Illimitati"
        },
        {
          name: "Marketplace",
          description: "Piattaforma marketplace multi-vendor",
          features: ["Vendor management", "Commission system", "Advanced search", "Review system", "Dashboard vendor"],
          price_range: "\u20AC20.000 - \u20AC50.000",
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
          price_range: "\u20AC10.000 - \u20AC20.000",
          timeline: "8-12 settimane",
          platforms: ["iOS", "Android"],
          ideal_for: "Aziende di servizi, professionisti"
        },
        {
          name: "E-commerce App",
          description: "App mobile per negozio online",
          features: ["Catalogo mobile", "Carrello native", "Pagamenti app", "Wishlist", "Geo-localizzazione"],
          price_range: "\u20AC15.000 - \u20AC30.000",
          timeline: "10-16 settimane",
          ideal_for: "E-commerce, retail"
        },
        {
          name: "App Enterprise",
          description: "Applicazione aziendale complessa",
          features: ["Backend custom", "API integration", "Multi-user", "Advanced security", "Reporting"],
          price_range: "\u20AC25.000 - \u20AC50.000",
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
          price_range: "\u20AC150 - \u20AC500/mese",
          ideal_for: "Siti ad alto traffico, e-commerce"
        },
        {
          name: "Cloud VPS",
          description: "Server virtuale privato",
          features: ["Risorse scalabili", "SSD storage", "Snapshot", "Control panel", "Support incluso"],
          price_range: "\u20AC50 - \u20AC200/mese",
          ideal_for: "Siti web, applicazioni web"
        },
        {
          name: "Cloud AWS/Azure",
          description: "Infrastruttura cloud enterprise",
          features: ["Auto-scaling", "Load balancing", "CDN", "Database managed", "Disaster recovery"],
          price_range: "\u20AC300 - \u20AC2.000/mese",
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
          description: "Analisi vulnerabilit\xE0 sistema",
          features: ["Scan vulnerabilit\xE0", "Report dettagliato", "Piano remediation", "Test penetration", "Compliance check"],
          price_range: "\u20AC1.500 - \u20AC5.000",
          timeline: "1-2 settimane",
          ideal_for: "Tutte le aziende"
        },
        {
          name: "Backup & Recovery",
          description: "Backup automatizzato e disaster recovery",
          features: ["Backup automatico", "Cloud storage", "Recovery testing", "RTO/RPO garantiti", "Monitoraggio"],
          price_range: "\u20AC100 - \u20AC500/mese",
          ideal_for: "Aziende con dati critici"
        },
        {
          name: "Firewall Gestito",
          description: "Protezione perimetrale avanzata",
          features: ["Firewall next-gen", "IDS/IPS", "Web filtering", "VPN aziendale", "Monitoraggio 24/7"],
          price_range: "\u20AC200 - \u20AC800/mese",
          ideal_for: "PMI, reti aziendali"
        },
        {
          name: "Antivirus Enterprise",
          description: "Protezione endpoint aziendale",
          features: ["Protezione multi-layer", "Gestione centralizzata", "Report compliance", "Auto-update", "Support dedicato"],
          price_range: "\u20AC5 - \u20AC15/device/mese",
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
          price_range: "\u20AC80 - \u20AC120/ora",
          response_time: "2-4 ore",
          availability: "Lun-Ven 9-18"
        },
        {
          name: "Supporto On-Site",
          description: "Intervento tecnico in sede",
          features: ["Intervento fisico", "Installazione hardware", "Configurazione rete", "Formazione staff", "Documentazione"],
          price_range: "\u20AC150 - \u20AC200/ora",
          response_time: "4-8 ore",
          coverage: "Lombardia e zone limitrofe"
        },
        {
          name: "Contratto Manutenzione",
          description: "Manutenzione proattiva sistemi",
          features: ["Monitoraggio continuo", "Manutenzione preventiva", "Aggiornamenti", "Priority support", "Report mensili"],
          price_range: "\u20AC200 - \u20AC1.000/mese",
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
        description: "Sconto 10% per pi\xF9 servizi",
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
      answer: "I costi variano da \u20AC2.500 per un sito vetrina a \u20AC15.000 per portali complessi. Il prezzo finale dipende dalle funzionalit\xE0 richieste, design personalizzato e integrazioni necessarie."
    },
    {
      question: "Quanto tempo per sviluppare un sito?",
      answer: "Un sito vetrina richiede 2-4 settimane, un sito complesso 4-8 settimane. I tempi dipendono dalla complessit\xE0 e dalla velocit\xE0 di feedback del cliente."
    },
    {
      question: "Il sito sar\xE0 responsive?",
      answer: "Tutti i nostri siti sono responsive e ottimizzati per mobile. Testiamo su tutti i dispositivi principali per garantire la migliore esperienza utente."
    },
    {
      question: "\xC8 incluso l'hosting?",
      answer: "S\xEC, includiamo 1 anno di hosting professionale, certificato SSL, email aziendali e supporto tecnico nei nostri pacchetti web."
    },
    {
      question: "Posso gestire il sito da solo?",
      answer: "Assolutamente! Utilizziamo CMS user-friendly come WordPress. Forniamo training completo e documentazione per la gestione autonoma."
    },
    {
      question: "Fate e-commerce?",
      answer: "S\xEC, sviluppiamo e-commerce completi da \u20AC5.000. Includiamo catalogo prodotti, carrello, pagamenti sicuri, gestione ordini e integrazione corrieri."
    },
    {
      question: "Sviluppate app mobile?",
      answer: "Sviluppiamo app native iOS/Android e cross-platform. Progetti da \u20AC10.000, inclusa pubblicazione negli store e supporto post-lancio."
    },
    {
      question: "Offrite assistenza dopo la consegna?",
      answer: "S\xEC, includiamo 3 mesi di supporto gratuito. Dopo offriamo contratti di manutenzione con supporto prioritario e aggiornamenti."
    },
    {
      question: "Fate preventivi gratuiti?",
      answer: "S\xEC, tutti i preventivi sono gratuiti e senza impegno. Analizziamo le esigenze e proponiamo la soluzione pi\xF9 adatta al budget."
    },
    {
      question: "Lavorate con aziende fuori Lombardia?",
      answer: "S\xEC, seguiamo clienti in tutta Italia. Per progetti web e app lavoriamo completamente in remoto. L'assistenza on-site \xE8 principalmente in Lombardia."
    }
  ],
  // Lead Qualification Criteria
  lead_qualification: {
    high_priority: {
      criteria: [
        "Budget > \u20AC5.000",
        "Azienda 10+ dipendenti",
        "Timeline < 2 mesi",
        "Settore target (manifatturiero, servizi, retail)",
        "Keywords: urgente, subito, preventivo dettagliato"
      ],
      actions: ["Escalation immediata", "Chiamata entro 2 ore", "Preventivo prioritario"]
    },
    medium_priority: {
      criteria: [
        "Budget \u20AC2.000-\u20AC5.000",
        "Azienda 5-10 dipendenti",
        "Timeline 2-6 mesi",
        "Interest in multiple services"
      ],
      actions: ["Email dettagliata entro 4 ore", "Follow-up in 24h"]
    },
    low_priority: {
      criteria: [
        "Budget < \u20AC2.000",
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
var KnowledgeUtils = {
  /**
   * Get service information by type
   */
  getServiceInfo(serviceType) {
    return ITERAKnowledgeBase.services[serviceType] || null;
  },
  /**
   * Get pricing for service
   */
  getPricing(serviceType, serviceLevel = "standard") {
    const service = this.getServiceInfo(serviceType);
    if (!service || !service.types) return null;
    return service.types.find(
      (type) => type.name.toLowerCase().includes(serviceLevel.toLowerCase())
    );
  },
  /**
   * Search FAQ by keywords
   */
  searchFAQ(keywords) {
    const searchTerms = keywords.toLowerCase().split(" ");
    return ITERAKnowledgeBase.faq.filter((item) => {
      const combined = `${item.question} ${item.answer}`.toLowerCase();
      return searchTerms.some((term) => combined.includes(term));
    });
  },
  /**
   * Get lead qualification level
   */
  qualifyLead(leadData) {
    const { budget, company_size, timeline, urgency } = leadData;
    if (budget > 5e3 || company_size >= 10 || urgency === "urgente") {
      return "high_priority";
    }
    if (budget >= 2e3 || company_size >= 5) {
      return "medium_priority";
    }
    return "low_priority";
  },
  /**
   * Get recommended services based on business info
   */
  getRecommendedServices(businessInfo) {
    const { sector, size, budget, goals } = businessInfo;
    const recommendations = [];
    if (goals?.includes("online presence") || goals?.includes("website")) {
      recommendations.push("web_development");
    }
    if (goals?.includes("sell online") || goals?.includes("ecommerce")) {
      recommendations.push("ecommerce");
    }
    if (size >= 10 || budget >= 1e4) {
      recommendations.push("server_cloud", "cybersecurity", "it_support");
    }
    return recommendations.map((service) => this.getServiceInfo(service));
  },
  /**
   * Format pricing for display
   */
  formatPrice(priceRange) {
    if (!priceRange) return "Preventivo su misura";
    return priceRange.replace("\u20AC", "\u20AC ").replace(" - ", " - \u20AC ");
  }
};

// src/conversation-flows/conversation-designer.js
var ConversationDesigner = class {
  static {
    __name(this, "ConversationDesigner");
  }
  constructor(config = {}) {
    this.config = {
      maxConversationLength: config.maxConversationLength || 20,
      escalationThreshold: config.escalationThreshold || 0.7,
      leadQualificationScore: config.leadQualificationScore || 0.8,
      language: config.language || "italian",
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
        id: "greeting",
        triggers: ["start", "ciao", "salve", "buongiorno", "buonasera", "hey"],
        response: {
          message: "Ciao! Sono l'assistente virtuale di IT-ERA \u{1F44B}\n\nSiamo specializzati in soluzioni IT complete per aziende. Come posso aiutarti oggi?",
          options: ["Preventivo", "Assistenza Tecnica", "Info Servizi", "Parlare con Umano"],
          nextSteps: ["service_inquiry", "support_request", "general_info", "escalation"],
          collectData: false
        }
      },
      service_inquiry: {
        id: "service_inquiry",
        triggers: ["preventivo", "servizi", "cosa fate", "soluzioni", "offerta"],
        response: {
          message: "Perfetto! IT-ERA offre servizi IT completi:\n\n\u{1F310} **Siti Web** (\u20AC2.500-\u20AC15.000)\n\u{1F6D2} **E-commerce** (\u20AC5.000-\u20AC25.000)\n\u{1F4F1} **App Mobile** (\u20AC10.000-\u20AC50.000)\n\u2601\uFE0F **Server & Cloud** (\u20AC150-\u20AC2.000/mese)\n\u{1F512} **Cybersecurity** (\u20AC100-\u20AC800/mese)\n\u{1F527} **Assistenza IT** (\u20AC80-\u20AC200/ora)\n\nDi quale servizio hai bisogno?",
          options: ["Sito Web", "E-commerce", "App Mobile", "Server/Cloud", "Cybersecurity", "Assistenza IT"],
          nextSteps: ["service_detail", "service_detail", "service_detail", "service_detail", "service_detail", "service_detail"],
          collectData: false
        }
      },
      service_detail: {
        id: "service_detail",
        response: {
          dynamic: true,
          // Response generated dynamically based on selected service
          collectData: true,
          dataFields: ["service_type", "initial_interest"]
        }
      },
      business_qualification: {
        id: "business_qualification",
        response: {
          message: "Ottimo! Per prepararti un preventivo personalizzato, dimmi:",
          questions: [
            {
              field: "company_name",
              question: "\u{1F3E2} Qual \xE8 il nome della tua azienda?",
              validation: "text",
              required: true
            },
            {
              field: "sector",
              question: "\u{1F3AF} In che settore operate?",
              options: ["Servizi", "Manifatturiero", "Retail/Commercio", "Consulenza", "Sanit\xE0", "Altro"],
              validation: "choice"
            },
            {
              field: "location",
              question: "\u{1F4CD} In che citt\xE0/provincia siete?",
              validation: "text",
              required: true
            },
            {
              field: "company_size",
              question: "\u{1F465} Quanti dipendenti ha l'azienda?",
              options: ["1-5", "6-15", "16-50", "51-100", "100+"],
              validation: "choice"
            },
            {
              field: "budget_range",
              question: "\u{1F4B0} Che budget avete previsto per questo progetto?",
              options: ["< \u20AC5.000", "\u20AC5.000-\u20AC15.000", "\u20AC15.000-\u20AC30.000", "\u20AC30.000+", "Da valutare"],
              validation: "choice"
            },
            {
              field: "timeline",
              question: "\u23F0 Entro quando vorreste realizzare il progetto?",
              options: ["Urgente (1 mese)", "2-3 mesi", "4-6 mesi", "Oltre 6 mesi", "Flessibile"],
              validation: "choice"
            }
          ],
          collectData: true,
          nextSteps: ["lead_qualification"]
        }
      },
      lead_qualification: {
        id: "lead_qualification",
        response: {
          dynamic: true,
          // Evaluate lead quality and determine next action
          collectData: true,
          evaluateQualification: true
        }
      },
      contact_collection: {
        id: "contact_collection",
        response: {
          message: "Perfetto! Ho tutte le informazioni per il tuo progetto. Per inviarti il preventivo personalizzato:",
          questions: [
            {
              field: "contact_name",
              question: "\u{1F464} Nome e cognome del referente?",
              validation: "text",
              required: true
            },
            {
              field: "email",
              question: "\u{1F4E7} Email aziendale per ricevere il preventivo?",
              validation: "email",
              required: true
            },
            {
              field: "phone",
              question: "\u{1F4F1} Numero di telefono per eventuale chiamata?",
              validation: "phone",
              required: true
            }
          ],
          collectData: true,
          nextSteps: ["escalation_preparation"]
        }
      },
      escalation_preparation: {
        id: "escalation_preparation",
        response: {
          message: "Grazie! I tuoi dati sono stati registrati.\n\n\u2705 **Progetto**: {service_type}\n\u2705 **Azienda**: {company_name}\n\u2705 **Settore**: {sector}\n\u2705 **Budget**: {budget_range}\n\u2705 **Timeline**: {timeline}\n\n\u{1F3AF} **Prossimi passi:**\n\u2022 Analisi dettagliata del progetto\n\u2022 Preventivo personalizzato\n\u2022 Chiamata per approfondire\n\nTi contatteremo entro 2 ore lavorative!",
          escalate: true,
          collectData: true
        }
      },
      support_request: {
        id: "support_request",
        triggers: ["assistenza", "supporto", "problema", "aiuto", "non funziona"],
        response: {
          message: "Ti aiuto con l'assistenza tecnica! \u{1F527}\n\nDi che tipo di supporto hai bisogno?",
          options: ["Problema Urgente", "Manutenzione Sito", "Email/Server", "Consulenza", "Altro"],
          nextSteps: ["support_detail", "support_detail", "support_detail", "support_detail", "support_detail"],
          collectData: true,
          dataFields: ["support_type"]
        }
      },
      support_detail: {
        id: "support_detail",
        response: {
          dynamic: true,
          questions: [
            {
              field: "problem_description",
              question: "\u{1F4DD} Puoi descrivermi il problema?",
              validation: "text",
              required: true
            },
            {
              field: "urgency",
              question: "\u26A1 Quanto \xE8 urgente?",
              options: ["Critico - Sistema down", "Urgente - Impatta business", "Normale - Pu\xF2 attendere", "Bassa - Info generale"],
              validation: "choice"
            }
          ],
          collectData: true,
          nextSteps: ["support_qualification"]
        }
      },
      general_info: {
        id: "general_info",
        triggers: ["informazioni", "chi siete", "cosa fate", "dove siete"],
        response: {
          message: "**IT-ERA** \xE8 un'azienda specializzata in soluzioni IT per aziende in Lombardia.\n\n\u{1F3AF} **La nostra missione**: Digitalizzare le PMI italiane con soluzioni su misura.\n\n\u{1F4BC} **Servizi principali**:\n\u2022 Siti web e e-commerce professionali\n\u2022 App mobile native\n\u2022 Infrastrutture cloud e server\n\u2022 Cybersecurity aziendale\n\u2022 Assistenza IT completa\n\n\u{1F4CD} **Operiamo in**: Lombardia (on-site) e tutta Italia (remoto)\n\nVuoi sapere di pi\xF9 su qualche servizio specifico?",
          options: ["Preventivo Personalizzato", "Portfolio Progetti", "Assistenza", "Contatti"],
          nextSteps: ["service_inquiry", "portfolio_request", "support_request", "contact_info"]
        }
      },
      faq_response: {
        id: "faq_response",
        response: {
          dynamic: true,
          // Generated based on FAQ match
          nextSteps: ["follow_up_question"]
        }
      },
      human_escalation: {
        id: "human_escalation",
        triggers: ["umano", "persona", "operatore", "parlare con qualcuno", "chiamate"],
        response: {
          message: "Certamente! Ti metto subito in contatto con un nostro consulente.\n\n\u{1F4DE} **Preferisci che ti chiamiamo o vuoi inviarci una email?**",
          options: ["Chiamatemi Subito", "Invio Email", "Entrambi"],
          escalate: true,
          priority: "high",
          nextSteps: ["contact_collection"]
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
        patterns: ["ciao", "salve", "buongiorno", "buonasera", "hello", "hey", "iniziamo"],
        confidence: 0.9
      },
      service_inquiry: {
        patterns: ["preventivo", "prezzo", "costo", "servizi", "soluzioni", "sviluppo", "realizzare"],
        confidence: 0.8
      },
      web_development: {
        patterns: ["sito", "website", "web", "homepage", "portale", "landing"],
        confidence: 0.85
      },
      ecommerce: {
        patterns: ["ecommerce", "e-commerce", "negozio online", "shop", "vendere online"],
        confidence: 0.9
      },
      mobile_app: {
        patterns: ["app", "mobile", "applicazione", "ios", "android"],
        confidence: 0.9
      },
      server_cloud: {
        patterns: ["server", "hosting", "cloud", "aws", "infrastruttura"],
        confidence: 0.85
      },
      cybersecurity: {
        patterns: ["sicurezza", "cybersecurity", "backup", "antivirus", "firewall"],
        confidence: 0.9
      },
      support: {
        patterns: ["assistenza", "supporto", "problema", "aiuto", "non funziona", "errore"],
        confidence: 0.85
      },
      urgent: {
        patterns: ["urgente", "subito", "immediato", "critico", "emergency"],
        confidence: 0.95
      },
      human_request: {
        patterns: ["umano", "persona", "operatore", "parlare", "chiamare", "telefono"],
        confidence: 0.9
      },
      pricing: {
        patterns: ["prezzo", "costo", "budget", "spesa", "investimento", "quotazione"],
        confidence: 0.8
      },
      timeline: {
        patterns: ["tempo", "quando", "durata", "tempi", "consegna", "deadline"],
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
        patterns: ["umano", "persona", "operatore", "manager", "responsabile"],
        priority: "immediate",
        action: "human_handoff"
      },
      high_value_lead: {
        conditions: ["budget > 15000", "company_size > 25", "urgency = urgent"],
        priority: "high",
        action: "sales_team"
      },
      technical_complexity: {
        patterns: ["complesso", "integrazione", "custom", "specifico", "particolare"],
        priority: "medium",
        action: "technical_team"
      },
      dissatisfaction: {
        patterns: ["frustrato", "arrabbiato", "delusione", "insoddisfatto", "male"],
        priority: "high",
        action: "customer_care"
      },
      repeated_misunderstanding: {
        conditions: ["conversation_length > 10", "intent_confidence < 0.5"],
        priority: "medium",
        action: "human_assist"
      }
    };
  }
  /**
   * Process incoming message and determine response
   */
  async processMessage(message, conversationContext, aiResponse = null) {
    try {
      const context = { ...conversationContext };
      const intents = this.recognizeIntents(message);
      const primaryIntent = intents[0];
      const escalation = this.checkEscalationTriggers(message, context, intents);
      if (escalation.required) {
        return await this.handleEscalation(escalation, context);
      }
      const currentStep = context.currentStep || "greeting";
      const flowResponse = await this.generateFlowResponse(primaryIntent, currentStep, context, aiResponse);
      const updatedContext = this.updateConversationContext(context, primaryIntent, flowResponse);
      return {
        ...flowResponse,
        intent: primaryIntent.intent,
        confidence: primaryIntent.confidence,
        context: updatedContext,
        escalation: escalation.required ? escalation : null
      };
    } catch (error) {
      console.error("Conversation processing error:", error);
      return this.getFallbackResponse();
    }
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
      config.patterns.forEach((pattern) => {
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
    return intents.sort((a, b) => b.confidence - a.confidence);
  }
  /**
   * Check for escalation triggers
   */
  checkEscalationTriggers(message, context, intents) {
    const msg = message.toLowerCase();
    if (this.escalationTriggers.explicit_human_request.patterns.some((p) => msg.includes(p))) {
      return {
        required: true,
        type: "explicit_human_request",
        priority: "immediate",
        reason: "User explicitly requested human contact"
      };
    }
    if (context.leadData) {
      const { budget_range, company_size, urgency } = context.leadData;
      if (budget_range?.includes("30.000+") || company_size?.includes("100+") || urgency === "Urgente (1 mese)") {
        return {
          required: true,
          type: "high_value_lead",
          priority: "high",
          reason: "High-value lead qualification met"
        };
      }
    }
    if (context.messageCount > 15) {
      return {
        required: true,
        type: "long_conversation",
        priority: "medium",
        reason: "Conversation exceeds optimal length"
      };
    }
    if (intents.length === 0 || intents[0].confidence < 0.3) {
      context.lowConfidenceCount = (context.lowConfidenceCount || 0) + 1;
      if (context.lowConfidenceCount >= 3) {
        return {
          required: true,
          type: "repeated_misunderstanding",
          priority: "medium",
          reason: "Multiple low-confidence responses"
        };
      }
    }
    return { required: false };
  }
  /**
   * Generate flow-based response
   */
  async generateFlowResponse(primaryIntent, currentStep, context, aiResponse) {
    const intent = primaryIntent?.intent || "general";
    const flow = this.conversationFlows[intent] || this.conversationFlows[currentStep];
    if (!flow) {
      return this.generateDynamicResponse(intent, context, aiResponse);
    }
    if (flow.response.dynamic) {
      return await this.generateDynamicFlowResponse(flow, intent, context, aiResponse);
    }
    return {
      message: this.interpolateMessage(flow.response.message, context),
      options: flow.response.options,
      nextStep: Array.isArray(flow.response.nextSteps) ? flow.response.nextSteps[0] : flow.response.nextSteps,
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
      case "service_detail":
        return this.generateServiceDetailResponse(context, aiResponse);
      case "lead_qualification":
        return this.generateQualificationResponse(context);
      case "faq_response":
        return this.generateFAQResponse(context.lastMessage);
      case "support_detail":
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
        message: aiResponse?.message || "Di quale servizio vorresti saperne di pi\xF9?",
        options: ["Sito Web", "E-commerce", "App Mobile", "Server/Cloud"],
        nextStep: "service_inquiry"
      };
    }
    const types = serviceInfo.types?.map(
      (t) => `**${t.name}**: ${t.description} (${t.price_range})`
    ).join("\n\n") || "";
    return {
      message: `Ecco i dettagli per **${serviceInfo.name}**:

${serviceInfo.description}

${types}

Ti interessa un preventivo personalizzato?`,
      options: ["S\xEC, preventivo", "Pi\xF9 dettagli", "Altri servizi", "Assistenza umana"],
      nextStep: "business_qualification",
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
        message: "Perfetto! Il tuo progetto ha caratteristiche molto interessanti e crediamo di poterti offrire un'ottima soluzione.\n\n\u{1F680} **Prossimo step**: Un nostro consulente senior ti contatter\xE0 per approfondire i dettagli e fornirti un preventivo su misura.\n\nPer completare, ho bisogno dei tuoi dati di contatto:",
        escalate: true,
        priority: "high",
        nextStep: "contact_collection"
      },
      medium_priority: {
        message: "Ottimo progetto! Abbiamo sicuramente l'esperienza per realizzarlo al meglio.\n\n\u{1F4CB} Per prepararti un preventivo dettagliato, raccogli i tuoi dati di contatto e ti invieremo tutto via email:",
        escalate: false,
        priority: "medium",
        nextStep: "contact_collection"
      },
      low_priority: {
        message: "Interessante! \xC8 un progetto che possiamo sicuramente seguire.\n\n\u{1F4E7} Ti invieremo informazioni dettagliate via email con alcuni esempi simili e un preventivo indicativo:",
        escalate: false,
        priority: "low",
        nextStep: "contact_collection"
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
        message: "Non ho trovato informazioni specifiche per la tua domanda. Vuoi che ti metta in contatto con un nostro esperto?",
        options: ["S\xEC, contatto umano", "Altre domande", "Preventivo"],
        nextStep: "human_escalation"
      };
    }
    const bestFaq = faqs[0];
    return {
      message: `${bestFaq.answer}

Hai altre domande o vuoi procedere con un preventivo?`,
      options: ["Preventivo", "Altre domande", "Parlare con esperto"],
      nextStep: "follow_up"
    };
  }
  /**
   * Handle escalation
   */
  async handleEscalation(escalation, context) {
    const escalationResponses = {
      explicit_human_request: "Perfetto! Ti metto subito in contatto con uno dei nostri consulenti.\n\n\u{1F4DE} Preferisci essere contattato via telefono o email?",
      high_value_lead: "Il tuo progetto ha caratteristiche molto interessanti! Un nostro senior consultant ti contatter\xE0 personalmente.\n\n\u26A1 Raccogliendo i tuoi dati ti contatteremo entro 2 ore.",
      long_conversation: "Vedo che abbiamo parlato di diversi aspetti. Per fornirti il supporto migliore, ti metto in contatto con un nostro specialista.",
      repeated_misunderstanding: "Scusa se non riesco a essere di aiuto come vorrei. Ti collego con un nostro esperto umano che sapr\xE0 assisterti meglio."
    };
    return {
      message: escalationResponses[escalation.type] || escalationResponses.explicit_human_request,
      options: ["Chiamata", "Email", "Entrambi"],
      nextStep: "contact_collection",
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
      escalationAttempts: response.escalate ? (context.escalationAttempts || 0) + 1 : context.escalationAttempts || 0,
      dataCollected: response.collectData ? [...context.dataCollected || [], response.questions] : context.dataCollected || [],
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
    return parseInt(matches[matches.length - 1]) * 1e3;
  }
  /**
   * Extract company size for qualification
   */
  extractCompanySize(sizeRange) {
    if (!sizeRange) return 1;
    if (sizeRange.includes("100+")) return 100;
    if (sizeRange.includes("51-100")) return 75;
    if (sizeRange.includes("16-50")) return 30;
    if (sizeRange.includes("6-15")) return 10;
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
        nextStep: aiResponse.nextStep || "continue",
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
      message: "Scusa, c'\xE8 stato un piccolo problema. Puoi ripetere la domanda o preferisci parlare direttamente con un nostro consulente?",
      options: ["Riprova", "Consulente Umano", "Menu Principale"],
      nextStep: "retry",
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
      lead_qualification: leadData ? KnowledgeUtils.qualifyLead(leadData) : "not_qualified",
      collected_data: leadData || {},
      escalation_reason: escalationType,
      conversation_flow: context.steps_taken || [],
      ai_confidence: context.averageConfidence || 0.5
    };
  }
};
var conversation_designer_default = ConversationDesigner;

// src/knowledge-base/it-era-knowledge-real.js
var import_checked_fetch5 = __toESM(require_checked_fetch());

// src/chatbot/api/teams-webhook.js
var import_checked_fetch6 = __toESM(require_checked_fetch());
var TeamsWebhook = class {
  static {
    __name(this, "TeamsWebhook");
  }
  constructor() {
    this.defaultWebhookUrl = "https://bulltechit.webhook.office.com/webhookb2/621e560e-86d9-478c-acfc-496624a88b79@f6ba30ad-37c0-41bf-a994-e434c59b4b2a/IncomingWebhook/fb2b1700f71c4806bdcbf0fc873952d0/c0aa99b7-8edb-41b4-b139-0ec4dd7864d5/V2l2_rh4MbAzeQQ4SpDifcMFLsktri3ocfMcQGZ6OHUmI1";
  }
  /**
   * Collect lead data from conversation context
   */
  collectLeadData(context, userMessage) {
    const leadData = context.leadData || {};
    return {
      // Basic lead information
      nome: leadData.contact_name || "Lead da Chat AI",
      email: leadData.email || "Non fornito",
      telefono: leadData.phone || "Non fornito",
      azienda: leadData.company_name || "Non specificata",
      comune: leadData.location || "Non specificato",
      settore: leadData.sector || "Non specificato",
      dipendenti: leadData.company_size || "Non specificato",
      // Service information
      servizio: leadData.service_type || "Non specificato",
      budget: leadData.budget_range || "Non specificato",
      timeline: leadData.timeline || "Non specificata",
      urgenza: leadData.urgency || "normale",
      // Conversation context
      messaggio: userMessage?.message || "Richiesta di contatto",
      sessionId: context.sessionId || "unknown",
      messaggiScambiati: context.messageCount || 0,
      tipoEscalation: context.escalationType || "user_request",
      priorita: context.priority || "medium",
      // Timestamps
      dataRichiesta: (/* @__PURE__ */ new Date()).toLocaleString("it-IT"),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Calculate lead score for Teams display
   */
  calculateLeadScore(leadData) {
    let score = 0;
    const location = (leadData.comune || "").toLowerCase();
    if (location.includes("vimercate") || location.includes("agrate") || location.includes("concorezzo")) {
      score += 35;
    } else if (location.includes("monza") || location.includes("brianza") || location.includes("arcore")) {
      score += 25;
    } else if (location.includes("milano est") || location.includes("bergamo")) {
      score += 15;
    } else if (location.includes("milano")) {
      score += 8;
    }
    const employees = (leadData.dipendenti || "").toLowerCase();
    if (employees.includes("50+") || employees.includes("100")) score += 30;
    else if (employees.includes("20-50") || employees.includes("25-50")) score += 25;
    else if (employees.includes("10-25") || employees.includes("15-")) score += 20;
    else if (employees.includes("5-15") || employees.includes("5-10")) score += 15;
    else if (employees.includes("1-5")) score += 5;
    const budget = (leadData.budget || "").toLowerCase();
    if (budget.includes("30.000") || budget.includes("30000")) score += 25;
    else if (budget.includes("15.000") || budget.includes("15000")) score += 20;
    else if (budget.includes("5.000") || budget.includes("5000")) score += 15;
    else if (budget.includes("valutare")) score += 10;
    const service = (leadData.servizio || "").toLowerCase();
    if (service.includes("sicurezza") || service.includes("firewall") || service.includes("cybersecurity")) {
      score += 20;
    } else if (service.includes("server") || service.includes("cloud") || service.includes("backup")) {
      score += 18;
    } else if (service.includes("assistenza") || service.includes("contratto")) {
      score += 15;
    }
    const urgency = (leadData.urgenza || "").toLowerCase();
    if (urgency.includes("urgent") || urgency.includes("immediat") || urgency.includes("subito")) {
      score += 30;
    } else if (urgency.includes("settimana")) {
      score += 20;
    } else if (urgency.includes("mese")) {
      score += 10;
    }
    return Math.min(score, 100);
  }
  /**
   * Get lead quality indicator
   */
  getLeadQualityIndicator(score) {
    if (score >= 80) return { emoji: "\u{1F525}", label: "PREMIUM", color: "#FF0000" };
    if (score >= 60) return { emoji: "\u2B50", label: "ALTA", color: "#FF6600" };
    if (score >= 35) return { emoji: "\u2705", label: "MEDIA", color: "#0078D4" };
    return { emoji: "\u{1F4DD}", label: "BASSA", color: "#00BCF2" };
  }
  /**
   * Create Teams card message - ENHANCED
   */
  createTeamsCard(leadData) {
    const urgencyColor = this.getUrgencyColor(leadData.priorita);
    const serviceIcon = this.getServiceIcon(leadData.servizio);
    const leadScore = this.calculateLeadScore(leadData);
    const qualityIndicator = this.getLeadQualityIndicator(leadScore);
    return {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "summary": `Nuovo Lead da AI Chatbot: ${leadData.azienda}`,
      "themeColor": urgencyColor,
      "sections": [
        {
          "activityTitle": `${qualityIndicator.emoji} LEAD QUALIT\xC0 ${qualityIndicator.label} (${leadScore}/100) - ${leadData.servizio}`,
          "activitySubtitle": `${leadData.azienda} \u2022 ${leadData.settore} \u2022 ${leadData.comune} \u2022 Score: ${leadScore}`,
          "activityImage": "https://it-era.it/favicon-32x32.png",
          "facts": [
            {
              "name": "\u{1F464} Contatto:",
              "value": leadData.nome
            },
            {
              "name": "\u{1F3E2} Azienda:",
              "value": `${leadData.azienda} (${leadData.dipendenti} dipendenti)`
            },
            {
              "name": "\u{1F4CD} Localit\xE0:",
              "value": `${leadData.comune} \u2022 ${leadData.settore}`
            },
            {
              "name": "\u{1F4E7} Email:",
              "value": leadData.email
            },
            {
              "name": "\u{1F4F1} Telefono:",
              "value": leadData.telefono
            },
            {
              "name": "\u{1F3AF} Servizio:",
              "value": leadData.servizio
            },
            {
              "name": "\u{1F4B0} Budget:",
              "value": leadData.budget
            },
            {
              "name": "\u23F0 Timeline:",
              "value": leadData.timeline
            },
            {
              "name": "\u{1F6A8} Urgenza:",
              "value": leadData.urgenza
            },
            {
              "name": "\u{1F4AC} Messaggi:",
              "value": `${leadData.messaggiScambiati} nel chatbot`
            },
            {
              "name": "\u{1F4C5} Data Richiesta:",
              "value": leadData.dataRichiesta
            },
            {
              "name": `${qualityIndicator.emoji} Lead Score:`,
              "value": `**${leadScore}/100** - Qualit\xE0 ${qualityIndicator.label}`
            }
          ],
          "text": `**Messaggio/Note:**
${leadData.messaggio}`
        }
      ],
      "potentialAction": [
        {
          "@type": "OpenUri",
          "name": "\u{1F4DE} Chiama Subito",
          "targets": [
            {
              "os": "default",
              "uri": `tel:${leadData.telefono}`
            }
          ]
        },
        {
          "@type": "OpenUri",
          "name": "\u{1F4E7} Invia Email",
          "targets": [
            {
              "os": "default",
              "uri": `mailto:${leadData.email}?subject=IT-ERA: Risposta alla tua richiesta ${leadData.servizio}&body=Gentile ${leadData.nome},%0A%0AGrazie per averci contattato tramite il nostro chatbot.%0A%0A[Personalizza il messaggio]%0A%0ACordiali saluti,%0ATeam IT-ERA`
            }
          ]
        },
        {
          "@type": "OpenUri",
          "name": "\u{1F310} Vai al Chatbot",
          "targets": [
            {
              "os": "default",
              "uri": "https://it-era.it"
            }
          ]
        }
      ]
    };
  }
  /**
   * Get urgency color for Teams card
   */
  getUrgencyColor(priority) {
    const colors = {
      "immediate": "#FF0000",
      // Red
      "high": "#FF6600",
      // Orange
      "medium": "#0078D4",
      // Blue
      "low": "#00BCF2"
      // Light Blue
    };
    return colors[priority] || colors.medium;
  }
  /**
   * Get service icon
   */
  getServiceIcon(service) {
    const icons = {
      "Sito Web": "\u{1F310}",
      "E-commerce": "\u{1F6D2}",
      "App Mobile": "\u{1F4F1}",
      "Server/Cloud": "\u2601\uFE0F",
      "Cybersecurity": "\u{1F512}",
      "Assistenza IT": "\u{1F527}"
    };
    return icons[service] || "\u{1F4BC}";
  }
  /**
   * Send notification to Teams
   */
  async sendTeamsNotification(leadData, webhookUrl = null) {
    const url = webhookUrl || this.defaultWebhookUrl;
    if (!url) {
      console.warn("Teams webhook URL not configured");
      return { success: false, error: "Webhook URL not configured" };
    }
    try {
      const card = this.createTeamsCard(leadData);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(card)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Teams API Error: ${response.status} - ${errorText}`);
      }
      console.log(`Teams notification sent successfully for: ${leadData.azienda}`);
      return {
        success: true,
        data: {
          company: leadData.azienda,
          service: leadData.servizio,
          priority: leadData.priorita,
          timestamp: leadData.timestamp
        }
      };
    } catch (error) {
      console.error("Teams notification failed:", error);
      return {
        success: false,
        error: error.message,
        leadData: leadData.azienda
      };
    }
  }
  /**
   * Send simple test notification
   */
  async sendTestNotification(webhookUrl = null) {
    const testData = {
      nome: "Test Lead",
      azienda: "Test Company",
      settore: "Testing",
      comune: "Milano",
      email: "test@example.com",
      telefono: "+39 123 456 789",
      servizio: "Sito Web",
      budget: "\u20AC5.000-\u20AC15.000",
      timeline: "2-3 mesi",
      urgenza: "medium",
      messaggio: "Questo \xE8 un test del sistema di notifiche Teams",
      sessionId: "test_session",
      messaggiScambiati: 5,
      tipoEscalation: "test",
      priorita: "medium",
      dipendenti: "10-25",
      dataRichiesta: (/* @__PURE__ */ new Date()).toLocaleString("it-IT"),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    return await this.sendTeamsNotification(testData, webhookUrl);
  }
};
var teamsWebhook = new TeamsWebhook();
globalThis.TeamsWebhook = teamsWebhook;

// src/chatbot/api/chatbot-worker.js
var CONFIG = {
  // AI Settings
  AI_PROVIDER: "openai",
  // 'openai' or 'anthropic'
  AI_MODEL: "gpt-4o-mini",
  // Cost-effective model
  AI_MAX_TOKENS: 150,
  AI_TEMPERATURE: 0.7,
  AI_COST_LIMIT: 0.1,
  // $0.10 per conversation
  AI_CACHE_TTL: 3600,
  // 1 hour response cache
  // Enhanced Chat settings
  MAX_SESSION_DURATION: 3600,
  // 1 hour for AI conversations
  MAX_MESSAGES_PER_SESSION: 25,
  // Increased for AI interactions
  RATE_LIMIT_MESSAGES: 60,
  // messages/hour per IP
  AI_RATE_LIMIT: 10,
  // AI calls per minute per session
  // Email integration (preserved from existing system)
  EMAIL_API_ENDPOINT: "https://it-era-email.bulltech.workers.dev/api/contact",
  // Performance settings
  RESPONSE_TIMEOUT: 8e3,
  // 8 seconds max response time
  FALLBACK_TIMEOUT: 2e3,
  // 2 seconds before fallback
  // CORS settings
  ALLOWED_ORIGINS: [
    "https://www.it-era.it",
    "https://it-era.it",
    "https://it-era.pages.dev",
    "http://localhost:3000",
    "http://localhost:8788",
    "http://127.0.0.1:5500"
  ]
};
var corsHeaders = /* @__PURE__ */ __name((origin) => ({
  "Access-Control-Allow-Origin": CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
}), "corsHeaders");
function generateSessionId() {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
__name(generateSessionId, "generateSessionId");
var aiEngine = null;
var conversationDesigner = null;
async function initializeAI(env) {
  if (!aiEngine) {
    aiEngine = new ai_integration_default({
      provider: CONFIG.AI_PROVIDER,
      model: CONFIG.AI_MODEL,
      maxTokens: CONFIG.AI_MAX_TOKENS,
      temperature: CONFIG.AI_TEMPERATURE,
      costLimit: CONFIG.AI_COST_LIMIT,
      language: "italian"
    });
    await aiEngine.initializeProvider(env);
  }
  if (!conversationDesigner) {
    conversationDesigner = new conversation_designer_default({
      maxConversationLength: CONFIG.MAX_MESSAGES_PER_SESSION,
      escalationThreshold: 0.7,
      leadQualificationScore: 0.8,
      language: "italian"
    });
  }
  return { aiEngine, conversationDesigner };
}
__name(initializeAI, "initializeAI");
async function generateResponse(message, context = {}, env) {
  try {
    const sessionId = context.sessionId || "unknown";
    const { aiEngine: aiEngine2, conversationDesigner: conversationDesigner2 } = await initializeAI(env);
    const useAI = shouldUseAI(context, env);
    if (useAI) {
      const aiPromise = generateAIResponse(message, context, aiEngine2, sessionId);
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("AI timeout")), CONFIG.FALLBACK_TIMEOUT)
      );
      try {
        const aiResponse = await Promise.race([aiPromise, timeoutPromise]);
        const flowResponse = await conversationDesigner2.processMessage(
          message,
          context,
          aiResponse
        );
        return {
          ...flowResponse,
          aiPowered: true,
          cost: aiResponse.cost || 0,
          cached: aiResponse.cached || false
        };
      } catch (aiError) {
        console.warn("AI generation failed, using fallback:", aiError);
        return await generateFallbackResponse(message, context, conversationDesigner2);
      }
    } else {
      return await generateFallbackResponse(message, context, conversationDesigner2);
    }
  } catch (error) {
    console.error("Response generation error:", error);
    return getEmergencyFallbackResponse();
  }
}
__name(generateResponse, "generateResponse");
async function generateAIResponse(message, context, aiEngine2, sessionId) {
  const aiResponse = await aiEngine2.generateResponse(message, context, sessionId);
  if (aiResponse.escalate || aiResponse.intent === "cost_limit_reached") {
    return {
      ...aiResponse,
      escalationRequired: true,
      escalationReason: aiResponse.intent === "cost_limit_reached" ? "cost_limit" : "ai_suggested"
    };
  }
  return aiResponse;
}
__name(generateAIResponse, "generateAIResponse");
async function generateFallbackResponse(message, context, conversationDesigner2) {
  const response = await conversationDesigner2.processMessage(message, context);
  return {
    ...response,
    aiPowered: false,
    fallbackUsed: true,
    cost: 0
  };
}
__name(generateFallbackResponse, "generateFallbackResponse");
function shouldUseAI(context, env) {
  if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
    return false;
  }
  if (context.totalCost && context.totalCost > CONFIG.AI_COST_LIMIT) {
    return false;
  }
  const structuredSteps = ["contact_collection", "escalation_preparation"];
  if (structuredSteps.includes(context.currentStep)) {
    return false;
  }
  return true;
}
__name(shouldUseAI, "shouldUseAI");
function getEmergencyFallbackResponse() {
  return {
    message: "Scusa, sto avendo alcuni problemi tecnici. Ti metto subito in contatto con un nostro consulente che ti assister\xE0 al meglio.",
    options: ["Contatto immediato", "Riprova pi\xF9 tardi"],
    nextStep: "emergency_escalation",
    escalate: true,
    priority: "high",
    aiPowered: false,
    emergency: true
  };
}
__name(getEmergencyFallbackResponse, "getEmergencyFallbackResponse");
async function getOrCreateSession(sessionId, CHAT_SESSIONS) {
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  let session = await CHAT_SESSIONS.get(sessionId);
  if (!session) {
    session = {
      id: sessionId,
      created: Date.now(),
      messages: [],
      context: {},
      step: "greeting",
      leadData: {}
    };
  } else {
    session = JSON.parse(session);
  }
  return session;
}
__name(getOrCreateSession, "getOrCreateSession");
async function saveSession(session, CHAT_SESSIONS) {
  await CHAT_SESSIONS.put(session.id, JSON.stringify(session), {
    expirationTtl: CONFIG.MAX_SESSION_DURATION
  });
}
__name(saveSession, "saveSession");
async function checkRateLimit(ip, CHAT_SESSIONS) {
  const key = `rate_limit:${ip}`;
  const current = await CHAT_SESSIONS.get(key);
  if (current) {
    const count = parseInt(current);
    if (count >= CONFIG.RATE_LIMIT_MESSAGES) {
      return false;
    }
    await CHAT_SESSIONS.put(key, String(count + 1), { expirationTtl: 3600 });
  } else {
    await CHAT_SESSIONS.put(key, "1", { expirationTtl: 3600 });
  }
  return true;
}
__name(checkRateLimit, "checkRateLimit");
async function sendToEmailSystem(leadData, conversationContext = {}) {
  try {
    const emailData = {
      // Basic lead information
      nome: leadData.contact_name || leadData.nome || "Lead da Chat AI",
      email: leadData.email || "",
      telefono: leadData.phone || leadData.telefono || "",
      azienda: leadData.company_name || leadData.azienda || "",
      comune: leadData.location || leadData.comune || "",
      dipendenti: leadData.company_size || leadData.dipendenti || "",
      // Service information
      servizi: Array.isArray(leadData.servizi) ? leadData.servizi : leadData.service_type ? [leadData.service_type] : [],
      urgenza: leadData.urgency || leadData.urgenza || "normale",
      // Enhanced message with conversation insights
      messaggio: buildEnhancedMessage(leadData, conversationContext),
      // AI-specific metadata
      formType: "ai-chatbot-lead",
      privacy: true,
      aiGenerated: true,
      conversationId: conversationContext.sessionId,
      leadQuality: conversationContext.leadQuality || "medium",
      escalationReason: conversationContext.escalationReason || "completed_qualification",
      conversationSummary: conversationContext.conversationSummary || {},
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (conversationContext.aiMetrics) {
      emailData.aiMetrics = {
        totalCost: conversationContext.totalCost || 0,
        responseTime: conversationContext.averageResponseTime || 0,
        messageCount: conversationContext.messageCount || 0,
        aiConfidence: conversationContext.averageConfidence || 0
      };
    }
    const response = await fetch(CONFIG.EMAIL_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "IT-ERA-AI-Chatbot/1.0"
      },
      body: JSON.stringify(emailData)
    });
    const result = await response.json();
    return {
      success: response.ok,
      data: result,
      emailData
      // Include for debugging
    };
  } catch (error) {
    console.error("Enhanced email integration error:", error);
    return { success: false, error: error.message };
  }
}
__name(sendToEmailSystem, "sendToEmailSystem");
function buildEnhancedMessage(leadData, context) {
  let message = leadData.messaggio || leadData.message || "";
  if (context.sessionId) {
    message += `

--- Informazioni Conversazione AI ---
`;
    message += `Sessione: ${context.sessionId}
`;
    message += `Messaggi scambiati: ${context.messageCount || 0}
`;
    if (context.leadQuality) {
      message += `Qualit\xE0 lead: ${context.leadQuality}
`;
    }
    if (context.escalationReason) {
      message += `Motivo escalation: ${context.escalationReason}
`;
    }
    if (leadData.budget_range) {
      message += `Budget indicativo: ${leadData.budget_range}
`;
    }
    if (leadData.timeline) {
      message += `Timeline progetto: ${leadData.timeline}
`;
    }
    if (leadData.sector) {
      message += `Settore: ${leadData.sector}
`;
    }
  }
  return message;
}
__name(buildEnhancedMessage, "buildEnhancedMessage");
function calculateAverageResponseTime(messages) {
  const botMessages = messages.filter((m) => m.type === "bot" && m.responseTime);
  if (botMessages.length === 0) return 0;
  const totalTime = botMessages.reduce((sum, msg) => sum + (msg.responseTime || 0), 0);
  return Math.round(totalTime / botMessages.length);
}
__name(calculateAverageResponseTime, "calculateAverageResponseTime");
async function cleanupAISession(sessionId, CHAT_SESSIONS) {
  try {
    const session = await CHAT_SESSIONS.get(sessionId);
    if (!session) return;
    const sessionData = JSON.parse(session);
    if (sessionData.context) {
      console.log(`Session ${sessionId} completed:`, {
        messageCount: sessionData.context.messageCount,
        totalCost: sessionData.context.totalCost,
        averageResponseTime: sessionData.context.averageResponseTime,
        escalated: !!sessionData.escalation
      });
    }
    await CHAT_SESSIONS.delete(sessionId);
  } catch (error) {
    console.error("Session cleanup error:", error);
  }
}
__name(cleanupAISession, "cleanupAISession");
var chatbot_worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "ok",
        service: "IT-ERA Chatbot API",
        provider: "Cloudflare Workers",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(origin)
      });
    }
    if (request.method !== "POST" || url.pathname !== "/api/chat") {
      return new Response(JSON.stringify({
        error: "Method not allowed",
        message: "Use POST /api/chat"
      }), {
        status: 405,
        headers: corsHeaders(origin)
      });
    }
    try {
      const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
      if (env.CHAT_SESSIONS) {
        const canProceed = await checkRateLimit(ip, env.CHAT_SESSIONS);
        if (!canProceed) {
          return new Response(JSON.stringify({
            success: false,
            error: "Troppe richieste. Riprova tra un'ora."
          }), {
            status: 429,
            headers: corsHeaders(origin)
          });
        }
      }
      const data = await request.json();
      const { message, sessionId, action } = data;
      let session = await getOrCreateSession(sessionId, env.CHAT_SESSIONS);
      if (action === "start") {
        session.context = {
          sessionId: session.id,
          currentStep: "greeting",
          messageCount: 0,
          totalCost: 0,
          startTime: Date.now()
        };
        const response = await generateResponse("start", session.context, env);
        session.messages.push({
          type: "bot",
          content: response.message,
          options: response.options,
          timestamp: Date.now(),
          aiPowered: response.aiPowered
        });
        session.step = response.nextStep;
        session.context.currentStep = response.nextStep;
        await saveSession(session, env.CHAT_SESSIONS);
        return new Response(JSON.stringify({
          success: true,
          sessionId: session.id,
          response: response.message,
          options: response.options,
          step: response.nextStep,
          aiPowered: response.aiPowered
        }), {
          headers: corsHeaders(origin)
        });
      }
      if (action === "message" && message) {
        session.messages.push({
          type: "user",
          content: message,
          timestamp: Date.now()
        });
        session.context = {
          ...session.context,
          sessionId: session.id,
          currentMessage: message,
          messageCount: session.messages.length,
          lastActivity: Date.now()
        };
        const startTime = Date.now();
        const responsePromise = generateResponse(message, session.context, env);
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve(getEmergencyFallbackResponse()), CONFIG.RESPONSE_TIMEOUT);
        });
        const response = await Promise.race([responsePromise, timeoutPromise]);
        const responseTime = Date.now() - startTime;
        session.messages.push({
          type: "bot",
          content: response.message,
          options: response.options,
          timestamp: Date.now(),
          aiPowered: response.aiPowered,
          responseTime,
          cost: response.cost || 0
        });
        session.step = response.nextStep;
        session.context = {
          ...session.context,
          ...response.context || {},
          currentStep: response.nextStep,
          totalCost: (session.context.totalCost || 0) + (response.cost || 0),
          averageResponseTime: calculateAverageResponseTime(session.messages)
        };
        if (response.escalate || response.escalationRequired) {
          session.escalation = {
            required: true,
            type: response.escalationType || "user_request",
            priority: response.priority || "medium",
            reason: response.escalationReason,
            timestamp: Date.now(),
            conversationSummary: conversationDesigner ? conversationDesigner.getConversationSummary(session.context) : {}
          };
          const teamsWebhookUrl = env.TEAMS_WEBHOOK_URL || "https://bulltechit.webhook.office.com/webhookb2/621e560e-86d9-478c-acfc-496624a88b79@f6ba30ad-37c0-41bf-a994-e434c59b4b2a/IncomingWebhook/fb2b1700f71c4806bdcbf0fc873952d0/c0aa99b7-8edb-41b4-b139-0ec4dd7864d5/V2l2_rh4MbAzeQQ4SpDifcMFLsktri3ocfMcQGZ6OHUmI1";
          if (teamsWebhookUrl && globalThis.TeamsWebhook) {
            try {
              const leadData = globalThis.TeamsWebhook.collectLeadData(session.context, { message });
              await globalThis.TeamsWebhook.sendTeamsNotification(leadData, teamsWebhookUrl);
              console.log("Teams notification sent for escalation");
            } catch (error) {
              console.error("Failed to send Teams notification:", error);
            }
          }
          if (response.priority === "high" || response.priority === "immediate") {
            session.context.needsImmediateHandoff = true;
          }
        }
        if (response.collectData && data.leadData) {
          session.context.leadData = {
            ...session.context.leadData,
            ...data.leadData
          };
        }
        await saveSession(session, env.CHAT_SESSIONS);
        const responseData = {
          success: true,
          sessionId: session.id,
          response: response.message,
          options: response.options,
          step: response.nextStep,
          intent: response.intent,
          confidence: response.confidence,
          aiPowered: response.aiPowered,
          responseTime,
          escalate: response.escalate || false,
          escalationType: response.escalationType,
          cached: response.cached || false,
          cost: response.cost || 0
        };
        if (env.NODE_ENV === "development") {
          responseData.debug = {
            contextStep: session.context.currentStep,
            messageCount: session.context.messageCount,
            totalCost: session.context.totalCost,
            leadData: session.context.leadData
          };
        }
        return new Response(JSON.stringify(responseData), {
          headers: corsHeaders(origin)
        });
      }
      if (action === "email_handoff" || action === "escalate") {
        const leadData = data.leadData || session.context.leadData || {};
        const conversationContext = {
          sessionId: session.id,
          messageCount: session.context.messageCount || 0,
          totalCost: session.context.totalCost || 0,
          averageResponseTime: session.context.averageResponseTime || 0,
          escalationReason: session.escalation?.reason || data.escalationReason || "user_request",
          leadQuality: session.escalation?.priority || "medium",
          conversationSummary: session.escalation?.conversationSummary || {},
          aiMetrics: true
        };
        const emailResult = await sendToEmailSystem(leadData, conversationContext);
        if (emailResult.success) {
          session.leadData = leadData;
          session.emailSent = true;
          session.handoffTimestamp = Date.now();
          session.ticketId = emailResult.data.ticketId;
          session.escalation = {
            ...session.escalation,
            completed: true,
            emailSent: true,
            ticketId: emailResult.data.ticketId
          };
          await saveSession(session, env.CHAT_SESSIONS);
          setTimeout(() => {
            cleanupAISession(session.id, env.CHAT_SESSIONS);
          }, 3e5);
          const successMessage = session.escalation?.priority === "high" || session.escalation?.priority === "immediate" ? "Perfetto! I tuoi dati sono stati inviati al nostro team. Ti contatteremo entro 2 ore lavorative." : "Grazie! Abbiamo ricevuto la tua richiesta. Ti invieremo il preventivo via email e ti contatteremo per eventuali chiarimenti.";
          return new Response(JSON.stringify({
            success: true,
            message: successMessage,
            ticketId: emailResult.data.ticketId,
            emailId: emailResult.data.emailId,
            priority: session.escalation?.priority || "medium",
            expectedResponseTime: session.escalation?.priority === "high" ? "2 ore" : "24 ore"
          }), {
            headers: corsHeaders(origin)
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: "Errore nell'invio. Riprova o contattaci direttamente al numero: +39 XXX XXX XXXX",
            fallbackAction: "phone_contact"
          }), {
            status: 500,
            headers: corsHeaders(origin)
          });
        }
      }
      if (action === "update_data") {
        session.context.leadData = {
          ...session.context.leadData,
          ...data.leadData
        };
        await saveSession(session, env.CHAT_SESSIONS);
        return new Response(JSON.stringify({
          success: true,
          message: "Dati aggiornati con successo",
          leadData: session.context.leadData
        }), {
          headers: corsHeaders(origin)
        });
      }
      if (action === "get_metrics") {
        const metrics = {
          sessionId: session.id,
          messageCount: session.context.messageCount || 0,
          totalCost: session.context.totalCost || 0,
          averageResponseTime: session.context.averageResponseTime || 0,
          aiUsage: session.messages.filter((m) => m.aiPowered).length,
          escalated: !!session.escalation?.required
        };
        return new Response(JSON.stringify({
          success: true,
          metrics
        }), {
          headers: corsHeaders(origin)
        });
      }
      return new Response(JSON.stringify({
        success: false,
        error: "Azione non valida"
      }), {
        status: 400,
        headers: corsHeaders(origin)
      });
    } catch (error) {
      console.error("Chatbot error:", error);
      return new Response(JSON.stringify({
        success: false,
        error: "Errore interno del server"
      }), {
        status: 500,
        headers: corsHeaders(origin)
      });
    }
  }
};

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var import_checked_fetch8 = __toESM(require_checked_fetch());
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
var import_checked_fetch9 = __toESM(require_checked_fetch());
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-kBoNSG/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = chatbot_worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var import_checked_fetch11 = __toESM(require_checked_fetch());
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-kBoNSG/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=chatbot-worker.js.map
