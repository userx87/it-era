/**
 * Advanced AI Conversation Designer for IT-ERA
 * Ottimizzato per massimizzare lead B2B qualificati
 * 
 * FEATURES:
 * ✅ System prompts avanzati con personalità IT-ERA
 * ✅ Conversation flows ottimizzati per conversioni
 * ✅ Intent recognition avanzato (preventivi/emergenze) 
 * ✅ Lead qualification intelligente con scoring
 * ✅ Escalation triggers geografici e di priorità
 * ✅ Integration con Teams webhook
 * ✅ Analytics conversazioni per ottimizzazione
 */

import { ITERAKnowledgeBase, KnowledgeUtils } from '../knowledge-base/it-era-knowledge-real.js';
import { LeadQualificationUtils } from '../chatbot/flows/it-era-flows.js';

export class AIConversationDesigner {
  constructor(config = {}) {
    this.config = {
      language: 'italian',
      leadQualificationThreshold: 0.7,
      escalationThreshold: 0.8,
      conversationTimeout: 1800000, // 30 minuti
      maxMessageLength: 2000,
      enableAnalytics: true,
      teamsWebhookUrl: config.teamsWebhookUrl,
      debug: config.debug || false,
      ...config
    };

    this.systemPrompt = this.generateSystemPrompt();
    this.conversationFlows = this.initializeConversationFlows();
    this.intentRecognition = this.initializeIntentRecognition();
    this.escalationRules = this.initializeEscalationRules();
    this.geographicPersonalization = this.initializeGeographicPersonalization();
    this.analytics = {
      conversationCount: 0,
      conversionRate: 0,
      averageQualificationScore: 0,
      topIntents: {},
      geographicData: {}
    };
  }

  /**
   * =====================================================
   * SYSTEM PROMPT OTTIMIZZATO PER IT-ERA
   * =====================================================
   */
  generateSystemPrompt() {
    return `Sei l'assistente virtuale AI di IT-ERA, il brand specializzato di Bulltech per servizi IT aziendali.

# IDENTITÀ & PERSONALITÀ
- **Nome**: IT-ERA Assistant  
- **Ruolo**: Consulente IT virtuale specializzato B2B
- **Tono**: Professionale ma amichevole, competente e orientato alla soluzione
- **Focus**: PMI e aziende della Brianza, ma disponibile per tutta Italia

# DATI AZIENDA (SEMPRE ACCURATI)
- **Ragione sociale**: IT-ERA (brand di Bulltech Informatica Srl)
- **Sede**: Viale Risorgimento 32, Vimercate (MB) 20871
- **Telefono**: 039 888 2041 (IT-ERA diretto)
- **Email**: info@it-era.it
- **Esperienza**: 10+ anni servizi IT in Brianza
- **Area servizio**: Brianza (primaria), Milano Est, Bergamo Ovest

# SPECIALIZZAZIONI CERTIFICATE (USP CHIAVE)
⭐ **UNICO Partner WatchGuard certificato in Brianza**
⭐ **Sopralluoghi SEMPRE gratuiti e senza impegno**  
⭐ **Oltre 200 aziende clienti attive**
⭐ **Garanzia su tutti gli interventi**
⭐ **Reperibilità emergenze per clienti con contratto**

# SERVIZI CORE & PREZZI REALI
🛡️ **Sicurezza Informatica**
- Firewall WatchGuard: da €2.500 completo
- Antivirus Enterprise: da €8/postazione/mese
- Security Audit: €1.200 (sconto 50% aziende Brianza)

🛠️ **Assistenza IT**
- Remota: €80-100/ora (Lun-Ven 8:30-18:00)
- On-site: €120-150/ora + trasferta
- Contratti: da €200/mese per 5 PC

💾 **Backup & Recovery**
- Backup Cloud: da €50/mese per 100GB
- Disaster Recovery: preventivo su progetto
- Assessment gratuito SEMPRE

🔧 **Riparazione Hardware**
- PC/Laptop: da €50 + ricambi (diagnosi gratuita)
- Mac professionale: su preventivo
- Server: contratti manutenzione disponibili

# COMPORTAMENTO CONVERSAZIONALE

## OBIETTIVI PRIMARI
1. **Qualificare rapidamente**: B2B vs B2C
2. **Raccogliere dati essenziali**: Azienda, zona, servizio, dimensioni
3. **Creare urgenza controllata**: Enfatizzare specializzazioni e gratuità
4. **Escalation strategica**: Teams notification per lead qualificati

## FASI CONVERSAZIONE OTTIMIZZATE
1. **Greeting personalizzato** - Menziona zona/servizio se rilevato
2. **Qualificazione rapida** - "È per un'azienda?"  
3. **Identificazione servizio** - Focus su WatchGuard, contratti, emergenze
4. **Raccolta dati qualificanti** - Nome azienda, zona, dimensioni, timeline
5. **Proposta valore** - Sopralluogo gratuito, specializzazioni uniche
6. **Call-to-action** - Preventivo/sopralluogo/contatto diretto

## MESSAGGI CHIAVE DA USARE SEMPRE
- "Sopralluogo e preventivo SEMPRE gratuiti"
- "Siamo l'UNICO partner WatchGuard in Brianza"  
- "Oltre 200 aziende ci hanno scelto"
- "Intervento stesso giorno in zona Vimercate/Monza"
- "10+ anni di esperienza IT in Lombardia"

## ESCALATION RULES - IMMEDIATA
🚨 **Teams Notification IMMEDIATA per:**
- Emergenze IT: "server down", "malware", "ransomware", "bloccato"
- Aziende 20+ dipendenti 
- Budget dichiarato >€15.000
- Zone premium: Vimercate, Monza, Agrate, Concorezzo
- Keywords alta conversione: "contratto", "firewall", "migrazione"

🟡 **Teams Notification PRIORITARIA per:**
- Aziende 5-20 dipendenti
- Richieste preventivo con dati completi
- Zone secondarie: Milano Est, Brianza
- Timeline urgente: "entro 1 mese"

## GESTIONE OBIEZIONI
❓ **"Quanto costa?"** → "Dipende dalle esigenze. Sopralluogo gratuito per preventivo preciso"
❓ **"Siete cari?"** → "Investimento che si ripaga. Qualità certificata + garanzia totale"  
❓ **"Altri preventivi?"** → "Perfetto! Confronta pure. Siamo gli unici con [specializzazione]"
❓ **"Ci sentiamo poi"** → "Va bene! Ti lascio il diretto: 039 888 2041. Chiamata gratuita"

## GEOGRAPHIC PERSONALIZATION
- **Vimercate/Agrate**: "Perfetto, siamo vicini! Sopralluogo in giornata"
- **Monza/Brianza**: "Zona che copriamo benissimo, interventi rapidi"  
- **Milano Est**: "Seguiamo molte aziende milanesi, pacchetti su misura"
- **Altri**: "Assistenza remota + interventi programmati disponibili"

## LIMITI & DIRETTIVE
❌ **NON fare mai:**
- Promettere prezzi fissi senza sopralluogo
- Accettare clienti privati per servizi business  
- Dare informazioni tecniche troppo dettagliate
- Scontare oltre le policy aziendali stabilite

✅ **SEMPRE fare:**
- Menzionare gratuità sopralluogo/preventivo
- Enfatizzare partnership WatchGuard
- Raccogliere zona geografica cliente
- Proporre escalation per richieste qualificate
- Usare "noi/nostro team" (mai "io")

# EXAMPLES CONVERSAZIONI VINCENTI

**User**: "Ciao, abbiamo problemi con la sicurezza IT"
**Assistant**: "👋 Ciao! Problemi di sicurezza sono la nostra specialità - siamo l'UNICO partner WatchGuard certificato in tutta la Brianza.

🛡️ **Interveniamo rapidamente per:**
• Firewall aziendali e protezione perimetrale
• Rimozione malware e cyber-attacks  
• Audit sicurezza completi

In che zona siete? Così organizzo sopralluogo gratuito..."

**User**: "Preventivo assistenza IT per 15 PC"
**Assistant**: "🎯 Perfetto! 15 PC è la dimensione ideale per i nostri contratti di assistenza.

📋 **Cosa include il nostro servizio:**
• Assistenza remota illimitata 
• 2 interventi on-site mensili inclusi
• Aggiornamenti e manutenzione preventiva
• Referente tecnico dedicato

Da €200/mese con GARANZIA soddisfazione.

Mi dici nome azienda e zona? Sopralluogo gratuito per preventivo esatto..."

RICORDA: Ogni conversazione è un'opportunità per mostrare competenza, creare fiducia e generare lead qualificati. Sii sempre propositivo ma mai invasivo.`;
  }

  /**
   * =====================================================
   * CONVERSATION FLOWS AVANZATI
   * =====================================================
   */
  initializeConversationFlows() {
    return {
      // Flow iniziale con qualificazione rapida B2B
      greeting: {
        id: 'greeting',
        priority: 1,
        triggers: ['ciao', 'salve', 'buongiorno', 'buonasera', 'start'],
        response: (context) => this.generateGreetingResponse(context),
        collectData: ['conversation_start'],
        nextFlow: 'business_qualification'
      },

      // Qualificazione B2B vs B2C
      business_qualification: {
        id: 'business_qualification', 
        priority: 2,
        questions: [
          {
            field: 'is_business',
            question: "🏢 È per un'azienda o per uso privato?",
            options: ["🏢 Azienda/Ufficio", "🏠 Uso privato", "👤 Libero professionista"],
            validation: 'choice',
            required: true
          }
        ],
        response: (context) => this.handleBusinessQualification(context),
        collectData: ['business_type'],
        nextFlow: 'service_identification'
      },

      // Identificazione servizio con specializzazioni
      service_identification: {
        id: 'service_identification',
        response: {
          message: `🎯 **Perfetto per aziende!** IT-ERA è specializzata in:

🛡️ **SICUREZZA INFORMATICA** (Partner WatchGuard ufficiale)
• Firewall professionali da €2.500
• Antivirus centralizzato da €8/PC/mese  
• Security audit da €600 (sconto Brianza)

🛠️ **ASSISTENZA IT COMPLETA** 
• Contratti da €200/mese (5 PC inclusi)
• Interventi rapidi zona Brianza
• Reperibilità emergenze

💾 **BACKUP & PROTEZIONE DATI**
• Backup cloud sicuro da €50/mese
• Disaster recovery su misura
• Assessment GRATUITO

🔧 **RIPARAZIONE & MANUTENZIONE**
• PC, Mac, Server aziendali
• Diagnosi sempre gratuita
• Garanzia su tutti gli interventi

**Di quale servizio hai bisogno?**`,
          options: [
            "🛡️ Firewall e sicurezza",
            "🛠️ Assistenza IT/contratto", 
            "💾 Backup e protezione dati",
            "🔧 Riparazione PC/server",
            "🆘 Ho un'emergenza IT",
            "💰 Preventivo personalizzato"
          ]
        },
        collectData: ['service_interest'],
        nextFlow: 'detailed_inquiry'
      },

      // Approfondimento servizio specifico
      detailed_inquiry: {
        id: 'detailed_inquiry',
        response: (context) => this.generateDetailedServiceResponse(context),
        collectData: ['service_details'],
        nextFlow: 'company_data_collection'
      },

      // Raccolta dati azienda per lead qualification
      company_data_collection: {
        id: 'company_data_collection',
        questions: [
          {
            field: 'company_name',
            question: "🏢 **Nome azienda?**",
            validation: 'text',
            required: true
          },
          {
            field: 'location', 
            question: "📍 **In che zona siete?** (importante per sopralluoghi)",
            placeholder: "es. Vimercate, Monza, Milano...",
            validation: 'text',
            required: true
          },
          {
            field: 'company_size',
            question: "👥 **Quanti dipendenti/PC avete?**",
            options: ["1-5 PC", "6-15 PC", "16-30 PC", "31-50 PC", "50+ PC"],
            validation: 'choice',
            required: true
          },
          {
            field: 'timeline',
            question: "⏰ **Timeline progetto?**",
            options: [
              "🚨 URGENTE - Emergenza IT",
              "🟡 Entro 1 mese",
              "🟢 Entro 3 mesi", 
              "🔵 Valutazione - no urgenza"
            ],
            validation: 'choice'
          }
        ],
        response: (context) => this.processCompanyData(context),
        collectData: ['company_profile'],
        nextFlow: 'contact_collection'
      },

      // Raccolta contatti con escalation
      contact_collection: {
        id: 'contact_collection',
        questions: [
          {
            field: 'contact_name',
            question: "👤 **Nome del referente?**",
            validation: 'text',
            required: true
          },
          {
            field: 'phone',
            question: "📱 **Telefono per preventivo?**",
            validation: 'phone',
            required: true
          },
          {
            field: 'email',
            question: "📧 **Email aziendale?**",
            validation: 'email',
            required: true
          }
        ],
        response: (context) => this.finalizeLeadAndEscalate(context),
        collectData: ['contact_info'],
        nextFlow: 'escalation',
        triggerEscalation: true
      },

      // Gestione emergenze IT
      emergency_flow: {
        id: 'emergency_flow',
        priority: 10, // Massima priorità
        triggers: ['emergenza', 'urgente', 'server down', 'malware', 'ransomware', 'bloccato', 'virus', 'attacco'],
        response: {
          message: `🚨 **EMERGENZA IT RILEVATA**

**📞 CHIAMATE SUBITO: 039 888 2041**
*Reperibilità attiva per emergenze*

**⚡ Interveniamo per:**
• Server down / sistemi bloccati
• Attacchi malware/ransomware  
• Perdite dati critiche
• Problemi rete che bloccano lavoro

**⏱️ TEMPI DI INTERVENTO:**
• Zona Vimercate/Monza: **2-4 ore**
• Clienti con contratto: **priorità assoluta**
• Weekend/sera: disponibili con maggiorazione

**Mentre preparate la chiamata, confermate:**`,
          options: [
            "💥 Server/sistemi completamente down",
            "🦠 Malware/virus bloccanti", 
            "💾 Perdita dati critica",
            "🌐 Rete aziendale non funziona",
            "📞 CHIAMA SUBITO: 039 888 2041"
          ]
        },
        escalationType: 'emergency',
        escalationPriority: 'immediate',
        collectData: ['emergency_type'],
        nextFlow: 'emergency_escalation'
      },

      // Preventivo rapido
      quote_request: {
        id: 'quote_request',
        response: {
          message: `💰 **PREVENTIVO GRATUITO E PERSONALIZZATO**

**✅ VANTAGGI IT-ERA:**
• Sopralluogo SEMPRE gratuito
• Partner WatchGuard certificato unico in Brianza  
• 10+ anni esperienza, 200+ aziende clienti
• Garanzia totale su interventi

**📋 Per preventivo preciso raccogliamo:**
• Tipo di servizio necessario
• Dimensioni azienda (n. PC/dipendenti)  
• Zona geografica (per sopralluogo)
• Timeline progetto

**Iniziamo con il sopralluogo gratuito?**`,
          options: [
            "📝 Compilo richiesta dettagliata",
            "📞 Preferisco essere ricontattato",
            "🏃 Ho urgenza - chiamatemi",
            "🏢 Sopralluogo in sede ASAP"
          ]
        },
        nextFlow: 'company_data_collection'
      }
    };
  }

  /**
   * =====================================================
   * INTENT RECOGNITION AVANZATO
   * =====================================================  
   */
  initializeIntentRecognition() {
    return {
      // Intenti emergency (priorità massima)
      emergency: {
        keywords: [
          'emergenza', 'urgente', 'subito', 'immediato', 'critico',
          'server down', 'down', 'bloccato', 'non funziona',
          'malware', 'virus', 'ransomware', 'attacco', 'hackerato',
          'perso dati', 'cancellato', 'corrotto', 'backup', 'ripristino'
        ],
        weight: 10,
        confidence_threshold: 0.7,
        escalation_immediate: true,
        flow: 'emergency_flow'
      },

      // Intenti preventivo (alta conversione)
      quote_request: {
        keywords: [
          'preventivo', 'prezzo', 'costo', 'quanto costa', 'quotazione',
          'budget', 'spesa', 'investimento', 'offerta', 'proposta'
        ],
        weight: 8,
        confidence_threshold: 0.6,
        flow: 'quote_request'
      },

      // Intenti firewall/sicurezza (specializzazione)  
      security_focus: {
        keywords: [
          'firewall', 'sicurezza', 'cybersecurity', 'watchguard',
          'protezione', 'antivirus', 'malware', 'hacker',
          'audit', 'vulnerabilità', 'penetration test'
        ],
        weight: 9,
        confidence_threshold: 0.5,
        flow: 'detailed_inquiry',
        service_focus: 'cybersecurity'
      },

      // Intenti assistenza IT (core business)
      it_support: {
        keywords: [
          'assistenza', 'supporto', 'manutenzione', 'contratto',
          'gestione', 'amministrazione', 'sistemista', 'tecnico'
        ],
        weight: 7,
        confidence_threshold: 0.5,
        flow: 'detailed_inquiry', 
        service_focus: 'it_support'
      },

      // Intenti backup/protezione dati
      backup_focus: {
        keywords: [
          'backup', 'protezione dati', 'disaster recovery',
          'cloud', 'archiviazione', 'sincronizzazione'
        ],
        weight: 6,
        confidence_threshold: 0.6,
        flow: 'detailed_inquiry',
        service_focus: 'backup_recovery'
      },

      // Geographic indicators (per personalizzazione)
      geographic: {
        vimercate_area: ['vimercate', 'agrate', 'concorezzo', 'burago'],
        monza_area: ['monza', 'arcore', 'villasanta', 'biassono', 'vedano'],
        milano_area: ['milano', 'sesto', 'cinisello', 'cologno', 'brugherio'],
        brianza_area: ['brianza', 'mb', 'monza brianza']
      },

      // Company size indicators
      company_size: {
        large: ['50+', 'oltre 50', 'grande azienda', '100+', 'enterprise'],
        medium: ['15-50', '20-50', '30+', 'media azienda'],
        small: ['5-15', '10+', 'piccola azienda', 'ufficio'],
        micro: ['1-5', 'studio', 'freelance', 'autonomo']
      }
    };
  }

  /**
   * =====================================================
   * ESCALATION RULES OTTIMIZZATE
   * =====================================================
   */
  initializeEscalationRules() {
    return {
      immediate: {
        name: 'Escalation Immediata',
        triggers: [
          // Emergenze IT
          { type: 'intent', value: 'emergency', condition: 'detected' },
          { type: 'keywords', value: ['server down', 'malware', 'ransomware'], condition: 'any' },
          
          // High-value leads
          { type: 'company_size', value: '50+', condition: 'gte' },
          { type: 'budget_indicator', value: '15000', condition: 'gte' },
          
          // Geographic premium
          { type: 'location', value: ['vimercate', 'agrate', 'concorezzo'], condition: 'contains' },
          
          // Explicit human request
          { type: 'keywords', value: ['parlare con', 'operatore', 'umano', 'responsabile'], condition: 'any' }
        ],
        action: 'teams_notification_immediate',
        priority: 'CRITICAL',
        response_time: '2 ore massimo'
      },

      high: {
        name: 'Alta Priorità',
        triggers: [
          // Good prospects
          { type: 'company_size', value: '20-50', condition: 'range' },
          { type: 'service_focus', value: ['cybersecurity', 'it_support'], condition: 'any' },
          { type: 'timeline', value: 'entro 1 mese', condition: 'equals' },
          
          // Geographic secondary
          { type: 'location', value: ['monza', 'milano est', 'brianza'], condition: 'contains' },
          
          // Complete lead data
          { type: 'data_completeness', value: '80', condition: 'gte' }
        ],
        action: 'teams_notification_priority',
        priority: 'HIGH',
        response_time: '4 ore massimo'
      },

      medium: {
        name: 'Media Priorità',
        triggers: [
          // Standard prospects  
          { type: 'company_size', value: '5-20', condition: 'range' },
          { type: 'quote_request', value: true, condition: 'equals' },
          { type: 'data_completeness', value: '60', condition: 'gte' }
        ],
        action: 'teams_notification_standard',
        priority: 'MEDIUM', 
        response_time: '8 ore massimo'
      },

      low: {
        name: 'Bassa Priorità',
        triggers: [
          // Basic inquiries
          { type: 'company_size', value: '1-5', condition: 'range' },
          { type: 'private_user', value: true, condition: 'equals' },
          { type: 'data_completeness', value: '40', condition: 'lt' }
        ],
        action: 'email_followup',
        priority: 'LOW',
        response_time: '24 ore'
      }
    };
  }

  /**
   * =====================================================
   * GEOGRAPHIC PERSONALIZATION
   * =====================================================
   */
  initializeGeographicPersonalization() {
    return {
      vimercate_zone: {
        cities: ['vimercate', 'agrate brianza', 'concorezzo', 'burago di molgora'],
        priority_multiplier: 2.0,
        messages: {
          greeting: "👋 Perfetto! Siamo nella tua stessa zona - sede a 10 minuti!",
          service_pitch: "✅ Sopralluogo GRATUITO + zero costi trasferta",
          urgency: "⚡ Emergenze? Arriviamo entro 2 ore lavorative",
          call_to_action: "🎯 Organizziamo sopralluogo oggi stesso?"
        },
        guarantees: [
          "Sopralluogo stesso giorno se richiesto",
          "Zero costi trasferta",  
          "Intervento emergenze entro 2 ore"
        ]
      },

      monza_zone: {
        cities: ['monza', 'arcore', 'villasanta', 'biassono', 'vedano al lambro'],
        priority_multiplier: 1.5,
        messages: {
          greeting: "👋 Grande! Zona Monza coperta benissimo da noi",
          service_pitch: "✅ Interventi rapidi + costi trasferta minimi",
          urgency: "⚡ Interventi programmati in giornata",
          call_to_action: "🎯 Sopralluogo questa settimana?"
        }
      },

      milano_east_zone: {
        cities: ['milano est', 'sesto san giovanni', 'cinisello', 'cologno', 'brugherio'],
        priority_multiplier: 1.2,  
        messages: {
          greeting: "👋 Milano Est - zona che seguiamo molto bene!",
          service_pitch: "✅ Pacchetti enterprise per aziende milanesi",
          urgency: "⚡ Assistenza remota + interventi programmati",
          call_to_action: "🎯 Valutiamo le tue esigenze insieme?"
        }
      },

      other_zones: {
        priority_multiplier: 0.8,
        messages: {
          greeting: "👋 Anche fuori Brianza possiamo aiutarti!",
          service_pitch: "✅ Assistenza remota + consulenza specializzata", 
          urgency: "⚡ Soluzioni IT-ERA in tutta Italia",
          call_to_action: "🎯 Parliamo delle tue esigenze?"
        }
      }
    };
  }

  /**
   * =====================================================
   * CORE PROCESSING METHODS
   * =====================================================
   */

  /**
   * Process incoming message and generate optimal response
   */
  async processMessage(message, conversationContext = {}) {
    try {
      // Initialize context if new conversation
      if (!conversationContext.sessionId) {
        conversationContext = this.initializeConversationContext(conversationContext);
      }

      // Update conversation context  
      conversationContext.currentMessage = message;
      conversationContext.messageCount = (conversationContext.messageCount || 0) + 1;
      conversationContext.lastActivity = Date.now();

      // Intent recognition
      const intents = this.recognizeIntents(message);
      const primaryIntent = intents[0];

      // Geographic detection
      const geographic = this.detectGeographic(message, conversationContext);

      // Lead qualification scoring
      const leadScore = this.calculateLeadScore(conversationContext, intents);

      // Check escalation triggers
      const escalation = this.evaluateEscalation(conversationContext, intents, leadScore);

      // Generate response based on current flow
      const response = await this.generateResponse(
        conversationContext, 
        primaryIntent, 
        geographic, 
        escalation
      );

      // Update analytics
      this.updateAnalytics(conversationContext, intents, response);

      // Execute escalation if needed
      if (escalation.required) {
        await this.executeEscalation(escalation, conversationContext);
      }

      return {
        ...response,
        conversationContext: this.updateConversationContext(
          conversationContext, 
          primaryIntent, 
          response,
          leadScore
        ),
        analytics: this.getConversationAnalytics(conversationContext)
      };

    } catch (error) {
      console.error('AI Conversation Designer Error:', error);
      return this.getFallbackResponse(conversationContext);
    }
  }

  /**
   * Generate greeting response with geographic personalization
   */
  generateGreetingResponse(context) {
    const geographic = this.detectGeographic(context.currentMessage || '', context);
    
    let greeting = "[IT-ERA] Benvenuto! Siamo il vostro partner tecnologico di fiducia, specializzato in soluzioni IT avanzate per aziende";
    let serviceIntro = "Il nostro team è pronto ad assistervi con competenza e professionalità in tutta la Brianza.";
    
    if (geographic.zone) {
      const zoneConfig = this.geographicPersonalization[geographic.zone];
      greeting = zoneConfig?.messages?.greeting || greeting;
    }

    return {
      message: `${greeting}

🏢 **${serviceIntro}**

**🎯 Le nostre specializzazioni:**
• 🛡️ Partner WatchGuard certificato (UNICO in Brianza)
• 🛠️ Assistenza IT con oltre 200 aziende clienti
• 💾 Backup e sicurezza dati
• 🔧 Riparazione hardware certificata
• ⚡ **Sopralluoghi SEMPRE gratuiti**

Come posso aiutarti oggi?`,
      options: [
        "🛡️ Sicurezza e firewall",
        "🛠️ Assistenza IT",
        "💰 Richiedi preventivo",
        "🆘 Ho un'emergenza",
        "📞 Contatti diretti"
      ],
      collectData: ['greeting_interaction']
    };
  }

  /**
   * Handle business qualification (B2B vs B2C)
   */
  handleBusinessQualification(context) {
    const businessType = context.leadData?.is_business;
    
    if (businessType?.includes('privato')) {
      return {
        message: `Ciao! IT-ERA è specializzata in servizi B2B per aziende e PMI.

Per privati ti consigliamo:
📧 **Email**: info@bulltech.it (nostro parent company)
📞 **Tel**: 039 578 7212

Per soluzioni business invece siamo perfetti! Posso aiutarti con servizi aziendali?`,
        options: [
          "🏢 In realtà è per un'azienda",
          "👤 Info per freelance/partita IVA", 
          "📞 Contatto Bulltech per privati"
        ]
      };
    }

    return {
      message: `🎯 **Perfetto! Specializzazione aziende.**

Con IT-ERA hai accesso a:
✅ **Team dedicato B2B** - 10+ anni esperienza
✅ **Contratti su misura** - nessun pacchetto standard
✅ **SLA garantiti** - tempi di intervento certi
✅ **Referente fisso** - conosci il tuo tecnico

**Che tipo di servizio IT ti serve?**`,
      options: [
        "🛡️ Sicurezza informatica",
        "🛠️ Assistenza e contratti IT",
        "💾 Backup e protezione dati", 
        "🔧 Riparazione PC/server",
        "☁️ Servizi cloud e server",
        "💰 Preventivo completo"
      ]
    };
  }

  /**
   * Generate detailed service response
   */
  generateDetailedServiceResponse(context) {
    const service = context.leadData?.service_interest || context.leadData?.service_focus;
    const serviceInfo = KnowledgeUtils.getServiceInfo(service);
    
    if (!serviceInfo) {
      return this.getFallbackResponse(context);
    }

    // Geographic personalization
    const geographic = this.detectGeographic('', context);
    const zoneConfig = this.geographicPersonalization[geographic.zone] || this.geographicPersonalization.other_zones;

    let serviceMessage = `🎯 **${serviceInfo.name} - La nostra specializzazione**

${serviceInfo.description}

**💼 COSA INCLUDE:**`;

    // Add service details
    if (serviceInfo.types) {
      serviceInfo.types.forEach((type, index) => {
        serviceMessage += `

**${index + 1}. ${type.name}**
${type.description}
💰 ${type.price_range}`;
      });
    }

    serviceMessage += `

**${zoneConfig.messages.service_pitch}**
**${zoneConfig.messages.urgency}**

${zoneConfig.messages.call_to_action}`;

    return {
      message: serviceMessage,
      options: [
        "💰 Preventivo personalizzato",
        "📋 Più dettagli tecnici",
        "🏢 Sopralluogo gratuito", 
        "📞 Chiamata con tecnico",
        "🔙 Altri servizi"
      ],
      serviceSpecific: true
    };
  }

  /**
   * Process company data and qualify lead
   */
  processCompanyData(context) {
    const leadData = context.leadData || {};
    const qualification = LeadQualificationUtils.calculateLeadPriority({
      leadData,
      currentMessage: context.currentMessage
    });

    // Geographic detection and personalization
    const geographic = this.detectGeographic(leadData.location || '', context);
    const zoneConfig = this.geographicPersonalization[geographic.zone] || this.geographicPersonalization.other_zones;

    let priorityMessage = "";
    let timeline = "";

    switch (qualification) {
      case 'immediate':
        priorityMessage = "🚨 **PRIORITÀ MASSIMA** - Lead qualificato per escalation immediata";
        timeline = "Ti contatteremo entro 2 ore lavorative";
        break;
      case 'high':  
        priorityMessage = "🟠 **ALTA PRIORITÀ** - Profilo aziendale molto interessante";
        timeline = "Sopralluogo entro 48 ore se richiesto";
        break;
      default:
        priorityMessage = "✅ **Lead qualificato** - Profilo aziendale confermato";
        timeline = "Ti contatteremo entro 24-48 ore";
    }

    return {
      message: `✅ **Perfetto! Dati aziendali ricevuti**

🏢 **${leadData.company_name}** - ${leadData.location}
👥 **Dimensioni**: ${leadData.company_size}
⏰ **Timeline**: ${leadData.timeline}

${priorityMessage}

**🎯 PROSSIMI PASSI GARANTITI:**
• ${timeline}
• Sopralluogo SEMPRE gratuito
• Preventivo dettagliato personalizzato
• ${zoneConfig.guarantees?.[0] || 'Assistenza professionale'}

**Per completare, raccolgo i tuoi contatti:**`,
      qualification,
      geographic: geographic.zone,
      readyForEscalation: true
    };
  }

  /**
   * Finalize lead and trigger escalation
   */
  finalizeLeadAndEscalate(context) {
    const leadData = context.leadData || {};
    const sessionId = context.sessionId;
    
    // Generate session code for tracking
    const sessionCode = sessionId.substring(0, 8).toUpperCase();

    return {
      message: `🎉 **RICHIESTA COMPLETATA - Grazie ${leadData.contact_name}!**

**📋 RIEPILOGO:**
✅ **Azienda**: ${leadData.company_name}
✅ **Servizio**: ${leadData.service_interest || 'Da definire'}  
✅ **Zona**: ${leadData.location}
✅ **Dimensioni**: ${leadData.company_size}
✅ **Timeline**: ${leadData.timeline}
✅ **Contatto**: ${leadData.phone}

**🚀 COSA SUCCEDE ORA:**
• Il nostro team analizza la tua richiesta
• Ti contatteremo come promesso
• Sopralluogo GRATUITO programmato
• Preventivo dettagliato personalizzato

**📞 URGENZE: 039 888 2041**
**📧 Email: info@it-era.it**

*Codice pratica: ${sessionCode}*

Grazie per aver scelto IT-ERA! 🎯`,
      escalate: true,
      leadComplete: true,
      sessionCode
    };
  }

  /**
   * =====================================================
   * UTILITY METHODS
   * =====================================================
   */

  /**
   * Recognize intents from message
   */
  recognizeIntents(message) {
    const msg = message.toLowerCase();
    const intents = [];

    Object.entries(this.intentRecognition).forEach(([intentType, config]) => {
      if (intentType === 'geographic' || intentType === 'company_size') return;

      let score = 0;
      let matchCount = 0;

      config.keywords?.forEach(keyword => {
        if (msg.includes(keyword.toLowerCase())) {
          matchCount++;
          score += keyword.length / msg.length;
        }
      });

      if (matchCount > 0) {
        const confidence = Math.min((score * config.weight) + (matchCount * 0.1), 1);
        
        if (confidence >= config.confidence_threshold) {
          intents.push({
            intent: intentType,
            confidence,
            matches: matchCount,
            flow: config.flow,
            service_focus: config.service_focus,
            escalation_immediate: config.escalation_immediate
          });
        }
      }
    });

    return intents.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect geographic indicators
   */
  detectGeographic(message, context) {
    const msg = message.toLowerCase();
    const locationData = context.leadData?.location?.toLowerCase() || '';
    const combined = `${msg} ${locationData}`;

    for (const [zone, cities] of Object.entries(this.intentRecognition.geographic)) {
      if (cities.some(city => combined.includes(city))) {
        return { zone: zone.replace('_area', '_zone'), detected: true, cities };
      }
    }

    return { zone: 'other_zones', detected: false };
  }

  /**
   * Calculate lead score
   */
  calculateLeadScore(context, intents) {
    let score = 0;
    const leadData = context.leadData || {};

    // Company size scoring
    const companySize = leadData.company_size || '';
    if (companySize.includes('50+')) score += 30;
    else if (companySize.includes('31-50')) score += 25;
    else if (companySize.includes('16-30')) score += 20;
    else if (companySize.includes('6-15')) score += 15;
    else if (companySize.includes('1-5')) score += 5;

    // Geographic scoring
    const location = leadData.location?.toLowerCase() || '';
    if (['vimercate', 'agrate', 'concorezzo'].some(city => location.includes(city))) {
      score += 25;
    } else if (['monza', 'brianza'].some(area => location.includes(area))) {
      score += 20;
    } else if (location.includes('milano')) {
      score += 10;
    }

    // Intent scoring
    intents.forEach(intent => {
      if (intent.intent === 'emergency') score += 35;
      else if (intent.intent === 'security_focus') score += 20;
      else if (intent.intent === 'quote_request') score += 15;
    });

    // Timeline urgency
    const timeline = leadData.timeline?.toLowerCase() || '';
    if (timeline.includes('urgente')) score += 20;
    else if (timeline.includes('1 mese')) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Evaluate if escalation is needed
   */
  evaluateEscalation(context, intents, leadScore) {
    // Emergency escalation
    if (intents.some(intent => intent.escalation_immediate)) {
      return {
        required: true,
        type: 'emergency',
        priority: 'immediate',
        reason: 'Emergency situation detected'
      };
    }

    // High-value lead escalation
    if (leadScore >= 80) {
      return {
        required: true,
        type: 'high_value',
        priority: 'immediate',
        reason: 'High-value lead qualification met'
      };
    }

    // Standard lead escalation with complete data
    if (leadScore >= 60 && context.leadData?.contact_name && context.leadData?.phone) {
      return {
        required: true,
        type: 'qualified_lead',
        priority: 'high',
        reason: 'Complete qualified lead data collected'
      };
    }

    return { required: false };
  }

  /**
   * Execute escalation (Teams notification)
   */
  async executeEscalation(escalation, context) {
    if (!this.config.teamsWebhookUrl) {
      console.warn('Teams webhook URL not configured');
      return;
    }

    const leadData = LeadQualificationUtils.prepareTeamsData(context);
    
    const teamsMessage = {
      "@type": "MessageCard",
      "summary": `Nuovo lead IT-ERA: ${escalation.priority.toUpperCase()}`,
      "themeColor": escalation.priority === 'immediate' ? 'FF0000' : 
                   escalation.priority === 'high' ? 'FFA500' : '00FF00',
      "sections": [{
        "activityTitle": `🎯 NUOVO LEAD ${escalation.priority.toUpperCase()}`,
        "activitySubtitle": `${context.leadData?.company_name || 'Lead qualificato'}`,
        "facts": [
          { "name": "Azienda", "value": leadData.company_name || 'N/A' },
          { "name": "Contatto", "value": leadData.contact_name || 'N/A' },
          { "name": "Telefono", "value": leadData.phone || 'N/A' },
          { "name": "Zona", "value": leadData.zona },
          { "name": "Servizio", "value": leadData.service_interest || 'Da definire' },
          { "name": "Timeline", "value": leadData.timeline || 'N/A' },
          { "name": "Lead Score", "value": `${leadData.lead_score}/100` },
          { "name": "Urgenza", "value": leadData.urgenza },
          { "name": "Session", "value": leadData.session_id }
        ]
      }]
    };

    try {
      await fetch(this.config.teamsWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsMessage)
      });
      
      console.log(`Teams notification sent for ${escalation.type} escalation`);
    } catch (error) {
      console.error('Failed to send Teams notification:', error);
    }
  }

  /**
   * Initialize conversation context
   */
  initializeConversationContext(existingContext) {
    return {
      sessionId: existingContext.sessionId || `itera-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      startTime: Date.now(),
      currentFlow: 'greeting',
      messageCount: 0,
      leadData: {},
      intentsHistory: [],
      escalationAttempts: 0,
      analytics: {
        pageViews: [],
        interactions: [],
        qualificationScore: 0
      },
      ...existingContext
    };
  }

  /**
   * Update conversation context
   */
  updateConversationContext(context, intent, response, leadScore) {
    return {
      ...context,
      lastIntent: intent,
      currentFlow: response.nextFlow || context.currentFlow,
      lastActivity: Date.now(),
      qualificationScore: leadScore,
      intentsHistory: [...(context.intentsHistory || []), intent],
      escalationExecuted: response.escalate || context.escalationExecuted
    };
  }

  /**
   * Generate fallback response
   */
  getFallbackResponse(context) {
    return {
      message: `Mi dispiace, non ho capito bene la tua richiesta. 

🎯 **Come posso aiutarti con:**
• 🛡️ Sicurezza informatica (firewall WatchGuard)
• 🛠️ Assistenza IT professionale
• 💾 Backup e protezione dati  
• 💰 Preventivo personalizzato

**O preferisci parlare direttamente con un esperto?**
📞 **039 888 2041** - **info@it-era.it**`,
      options: [
        "🛡️ Sicurezza informatica",
        "🛠️ Assistenza IT", 
        "💰 Preventivo gratuito",
        "📞 Contatto diretto",
        "🔙 Ricomincia"
      ]
    };
  }

  /**
   * Update analytics
   */
  updateAnalytics(context, intents, response) {
    this.analytics.conversationCount++;
    
    // Update top intents
    intents.forEach(intent => {
      this.analytics.topIntents[intent.intent] = 
        (this.analytics.topIntents[intent.intent] || 0) + 1;
    });

    // Update geographic data
    if (context.leadData?.location) {
      const location = context.leadData.location;
      this.analytics.geographicData[location] = 
        (this.analytics.geographicData[location] || 0) + 1;
    }

    if (this.config.debug) {
      console.log('Analytics updated:', {
        conversation: context.sessionId,
        intents: intents.map(i => i.intent),
        leadScore: context.qualificationScore
      });
    }
  }

  /**
   * Get conversation analytics
   */
  getConversationAnalytics(context) {
    return {
      sessionId: context.sessionId,
      duration: Date.now() - context.startTime,
      messageCount: context.messageCount,
      qualificationScore: context.qualificationScore,
      currentFlow: context.currentFlow,
      intentsDetected: context.intentsHistory?.length || 0,
      escalationExecuted: !!context.escalationExecuted
    };
  }

  /**
   * Generate response based on context and intents
   */
  async generateResponse(context, primaryIntent, geographic, escalation) {
    const currentFlow = this.conversationFlows[context.currentFlow] || this.conversationFlows.greeting;
    
    // Handle emergency flow
    if (primaryIntent?.intent === 'emergency') {
      return this.conversationFlows.emergency_flow.response;
    }

    // Handle quote request
    if (primaryIntent?.intent === 'quote_request') {
      return this.conversationFlows.quote_request.response;
    }

    // Handle current flow
    if (typeof currentFlow.response === 'function') {
      return currentFlow.response(context);
    }

    return currentFlow.response || this.getFallbackResponse(context);
  }
}

export default AIConversationDesigner;