/**
 * IT-ERA Business Protection Rules
 * Protegge il valore aziendale e guida le risposte del chatbot
 */

export const BusinessRules = {
  // Modello AI da usare (DeepSeek per costi ottimizzati)
  AI_MODEL: 'deepseek/deepseek-chat-v3.1',  // Solo $0.14 per 1M token!
  
  // Frasi e pattern da bloccare (NON dare soluzioni tecniche)
  BLOCKED_PATTERNS: [
    // Configurazioni tecniche
    /come\s+(configuro|imposto|installo)/i,
    /puoi\s+(configurare|impostare|installare)/i,
    /dammi\s+(la|una)\s+(procedura|guida)/i,
    /quali\s+comandi/i,
    /passo\s+(per\s+)?passo/i,
    /tutorial/i,
    /istruzioni\s+per/i,
    
    // Richieste di credenziali
    /password/i,
    /credenziali/i,
    /username/i,
    /accesso/i,
    /login/i,
    
    // Soluzioni fai-da-te
    /posso\s+fare\s+da\s+solo/i,
    /fai[\s-]?da[\s-]?te/i,
    /senza\s+(tecnico|assistenza)/i,
    /alternativ[ae]\s+gratuit[ae]/i,
    /software\s+gratis/i
  ],
  
  // Risposte standard per richieste bloccate
  BLOCKED_RESPONSES: {
    configuration: "Per garantire la sicurezza e il corretto funzionamento, la configurazione deve essere eseguita dai nostri tecnici certificati. Possiamo intervenire rapidamente presso la vostra sede o in remoto. Volete fissare un appuntamento?",
    
    credentials: "Per motivi di sicurezza, non posso fornire credenziali o password. Il nostro team di supporto può aiutarvi con l'accesso ai sistemi in modo sicuro. Contattateci al 039 888 2041.",
    
    diy: "Per garantire risultati professionali e sicuri, consigliamo sempre l'intervento dei nostri esperti. Offriamo soluzioni su misura per ogni esigenza e budget. Posso illustrarvi i nostri servizi?",
    
    technical_steps: "Questo tipo di intervento richiede competenze specialistiche per evitare problemi. I nostri tecnici possono occuparsene garantendo il risultato. Volete un preventivo gratuito?"
  },
  
  // Intent che richiedono sempre intervento IT-ERA
  REQUIRES_INTERVENTION: [
    'configuration_request',
    'troubleshooting',
    'installation',
    'security_breach',
    'data_recovery',
    'network_setup',
    'server_maintenance'
  ],
  
  // Modificatori per le risposte (aggiunti alla fine)
  RESPONSE_MODIFIERS: {
    urgent: "\n\n🚨 **Per urgenze: 039 888 2041** - Interveniamo in 2-4 ore nella zona di Monza/Brianza.",
    
    highValue: "\n\n💼 **Offerta speciale per aziende**: Sopralluogo gratuito e sconto 10% sul primo contratto annuale.",
    
    technical: "\n\n🛠️ **I nostri tecnici certificati** possono occuparsene direttamente, garantendo sicurezza e conformità.",
    
    sales: "\n\n💰 **Preventivo gratuito in 24h** - Soluzioni personalizzate per ogni budget."
  },
  
  // Suggerimenti di azione basati sull'intent
  SUGGESTED_ACTIONS: {
    firewall_inquiry: [
      "📞 Consulenza gratuita firewall",
      "📋 Richiedi preventivo WatchGuard",
      "🔍 Audit sicurezza gratuito"
    ],
    backup_inquiry: [
      "☁️ Demo backup cloud",
      "💾 Analisi dati da proteggere",
      "📋 Preventivo Veeam"
    ],
    support_urgent: [
      "🚨 Chiama ora: 039 888 2041",
      "💬 Apri ticket urgente",
      "📱 Richiedi callback immediato"
    ],
    pricing_request: [
      "💰 Calcola preventivo online",
      "📞 Parla con un commerciale",
      "📧 Ricevi offerta via email"
    ],
    general_inquiry: [
      "💼 Scopri tutti i servizi",
      "📞 Consulenza gratuita",
      "📋 Richiedi preventivo"
    ]
  },
  
  // System prompt principale per DeepSeek
  SYSTEM_PROMPT: `Sei l'assistente virtuale di IT-ERA, azienda leader in sicurezza informatica e soluzioni IT a Vimercate (MB).

IDENTITÀ:
- Nome: Assistente IT-ERA
- Ruolo: Primo contatto commerciale e qualificazione lead
- Obiettivo: Convertire richieste in opportunità commerciali

REGOLE ASSOLUTE (PRIORITÀ MASSIMA):
1. MAI fornire soluzioni tecniche dettagliate
2. MAI dare guide passo-passo o tutorial
3. MAI configurare sistemi o dare comandi
4. MAI fornire credenziali o password
5. MAI suggerire alternative gratuite o fai-da-te
6. MAI risolvere problemi direttamente - sempre rimandare ai tecnici

COSA PUOI FARE:
✅ Identificare e qualificare le esigenze
✅ Presentare i servizi IT-ERA appropriati
✅ Fornire prezzi indicativi (mai sconti oltre il 10%)
✅ Fissare appuntamenti e sopralluoghi
✅ Raccogliere informazioni aziendali
✅ Creare urgenza per l'intervento tecnico

PRODOTTI PRINCIPALI:
• Firewall WatchGuard (T40: €1.200, T70: €2.500, M470: €4.500)
• Backup Veeam (da €50/mese per 100GB)
• Antivirus Kaspersky (€8/postazione/mese)
• Microsoft 365 (da €12/utente/mese)
• Assistenza (€100/ora remoto, €150/ora on-site)
• Contratti manutenzione (da €200/mese per 5 PC)

TECNICHE DI VENDITA:
- Enfatizza sempre i rischi della mancata protezione
- Crea urgenza per problemi di sicurezza
- Valorizza l'esperienza 10+ anni di IT-ERA
- Menziona clienti soddisfatti nella zona
- Offri sempre sopralluogo gratuito
- Per budget limitati, proponi soluzioni rateizzate

RISPONDI SEMPRE:
- In italiano
- Max 3-4 frasi concise
- Con un'azione chiara da compiere
- Valorizzando IT-ERA come unica soluzione`,
  
  // Configurazione per diversi modelli AI
  MODEL_CONFIGS: {
    'deepseek/deepseek-chat-v3.1': {
      temperature: 0.7,
      max_tokens: 200,  // Risposte brevi per risparmiare
      top_p: 0.9,
      frequency_penalty: 0.3,  // Evita ripetizioni
      presence_penalty: 0.2
    },
    'anthropic/claude-3.5-sonnet': {
      temperature: 0.7,
      max_tokens: 300,
      top_p: 0.95
    },
    'openai/gpt-4o-mini': {
      temperature: 0.7,
      max_tokens: 250,
      top_p: 0.9
    }
  },
  
  // Qualificazione lead automatica
  LEAD_SCORING_RULES: {
    keywords: {
      // Alto valore
      'azienda': 15,
      'pmi': 15,
      'ufficio': 10,
      'dipendenti': 10,
      'budget': 20,
      'urgente': 15,
      'subito': 15,
      'ransomware': 25,
      'attacco': 20,
      'server': 15,
      
      // Medio valore
      'preventivo': 10,
      'costo': 8,
      'prezzo': 8,
      'informazioni': 5,
      
      // Basso valore
      'privato': -10,
      'casa': -10,
      'personale': -10,
      'gratis': -15
    },
    
    // Moltiplicatori
    multipliers: {
      hasCompanyName: 1.5,
      hasLocation: 1.2,
      multipleServices: 1.3,
      existingCustomer: 1.4,
      urgentRequest: 1.5
    },
    
    // Soglie per azioni
    thresholds: {
      lowValue: 30,      // Solo risposta automatica
      mediumValue: 50,   // Email di follow-up
      highValue: 70,     // Notifica Teams + chiamata
      vipValue: 85       // Allerta immediata commerciale
    }
  },
  
  // Template email automatiche
  EMAIL_TEMPLATES: {
    highValueLead: {
      subject: "🔥 LEAD CALDO - {company} - Score: {score}",
      body: `
NUOVO LEAD AD ALTO VALORE!

Azienda: {company}
Località: {location}
Richiesta: {request}
Lead Score: {score}/100

AZIONI IMMEDIATE:
1. Chiamare entro 1 ora
2. Inviare preventivo personalizzato
3. Proporre sopralluogo gratuito

Conversazione completa nel CRM.
      `
    }
  }
};

/**
 * Applica le business rules a una risposta
 */
export function applyBusinessRules(message, intent, response) {
  // Controlla se il messaggio contiene pattern bloccati
  for (const pattern of BusinessRules.BLOCKED_PATTERNS) {
    if (pattern.test(message)) {
      // Determina tipo di risposta bloccata
      if (/configur|impost|install/i.test(message)) {
        return BusinessRules.BLOCKED_RESPONSES.configuration;
      }
      if (/password|credenziali|login/i.test(message)) {
        return BusinessRules.BLOCKED_RESPONSES.credentials;
      }
      if (/fai.?da.?te|da.solo|gratis/i.test(message)) {
        return BusinessRules.BLOCKED_RESPONSES.diy;
      }
      return BusinessRules.BLOCKED_RESPONSES.technical_steps;
    }
  }
  
  // Se l'intent richiede intervento, modifica la risposta
  if (BusinessRules.REQUIRES_INTERVENTION.includes(intent)) {
    response += BusinessRules.RESPONSE_MODIFIERS.technical;
  }
  
  return response;
}

/**
 * Calcola il lead score
 */
export function calculateLeadScore(message, context = {}) {
  let score = 0;
  const lower = message.toLowerCase();
  
  // Punteggio base su keywords
  for (const [keyword, points] of Object.entries(BusinessRules.LEAD_SCORING_RULES.keywords)) {
    if (lower.includes(keyword)) {
      score += points;
    }
  }
  
  // Applica moltiplicatori
  const multipliers = BusinessRules.LEAD_SCORING_RULES.multipliers;
  
  if (/[\w\s]+(srl|spa|snc|sas)/i.test(message)) {
    score *= multipliers.hasCompanyName;
  }
  
  if (/(monza|brianza|vimercate|milano)/i.test(message)) {
    score *= multipliers.hasLocation;
  }
  
  if (context.isUrgent) {
    score *= multipliers.urgentRequest;
  }
  
  // Limita tra 0 e 100
  return Math.min(Math.max(Math.round(score), 0), 100);
}

/**
 * Ottieni azioni suggerite per un intent
 */
export function getSuggestedActions(intent) {
  return BusinessRules.SUGGESTED_ACTIONS[intent] || BusinessRules.SUGGESTED_ACTIONS.general_inquiry;
}

export default BusinessRules;