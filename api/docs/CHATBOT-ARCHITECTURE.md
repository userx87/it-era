# 🤖 Architettura Chatbot IT-ERA

## 📋 Design Overview

**Objective**: Chatbot intelligente che pre-qualifica i lead e li indirizza al sistema email esistente

### 🏗️ Architettura High-Level

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Sito Web      │    │  Chatbot API    │    │  Email System   │
│  it-era.it      │    │   (Worker)      │    │   (Resend)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. User opens chat    │                       │
         │ ──────────────────────▶                       │
         │                       │                       │
         │ 2. Chat conversation  │                       │
         │ ◄─────────────────────▶                       │
         │                       │                       │
         │                       │ 3. Qualified lead     │
         │                       │ ──────────────────────▶
         │                       │                       │
         │ 4. Email confirmation │ ◄─────────────────────┤
         │ ◄─────────────────────┤                       │
```

## 🔧 Componenti Tecnici

### 1. **Frontend - Chat Widget**
- **File**: `src/chatbot/widget/chat-widget.js`
- **Tecnologie**: Vanilla JS (compatibilità universale)
- **Features**:
  - Widget overlay responsive
  - Interfaccia conversazionale
  - Integration con form esistenti
  - Mobile-first design
  - Accessibility (ARIA)

### 2. **Backend - Chatbot API Worker**
- **File**: `src/chatbot/api/chatbot-worker.js`
- **Endpoint**: `https://it-era-chatbot.bulltech.workers.dev`
- **Features**:
  - Intent recognition
  - Session management (KV storage)
  - Email system integration
  - Rate limiting
  - Analytics tracking

### 3. **AI/NLP Engine**
- **File**: `src/chatbot/engine/nlp-engine.js`
- **Provider**: OpenAI/Anthropic (da decidere)
- **Features**:
  - Intent classification
  - Entity extraction
  - Context awareness
  - Multi-language (IT/EN)

### 4. **Integration Layer**
- **File**: `src/chatbot/integrations/email-bridge.js`
- **Function**: Bridge tra chatbot e sistema email
- **Features**:
  - Riutilizzo API email esistente
  - Data mapping e validation
  - Handoff seamless

## 🗣️ Conversation Flow Design

### Flow Principale: Lead Qualification

```
Bot: Ciao! Sono l'assistente IT-ERA 👋
     Come posso aiutarti oggi?
     
     [Preventivo] [Assistenza] [Info Servizi] [Altro]

User: Preventivo

Bot: Perfetto! Per quale tipo di progetto?
     
     [Sito Web] [E-commerce] [App Mobile] [Assistenza IT] 
     [Server/Cloud] [Cybersecurity] [Altro]

User: Sito Web

Bot: Ottimo! Alcune domande per personalizzare il preventivo:
     
     🏢 Hai già un'azienda o sei un privato?

User: Ho un'azienda, Rossi SRL

Bot: Perfetto Rossi SRL! 
     📍 In che città siete basati?

User: Milano

Bot: 👥 Quanti dipendenti ha l'azienda circa?
     [1-10] [10-50] [50-100] [100+]

User: 10-50

Bot: 🎯 Che tipo di sito web avete in mente?
     - Sito vetrina aziendale
     - E-commerce
     - Portale clienti
     - Altro (descrivi)

User: E-commerce per vendere online

Bot: Perfetto! Ho raccolto queste informazioni:
     
     ✅ Azienda: Rossi SRL
     ✅ Città: Milano  
     ✅ Dipendenti: 10-50
     ✅ Progetto: E-commerce
     
     Per inviarti un preventivo personalizzato, 
     ho bisogno di alcuni dati di contatto.
     
     [Compila Form] [Continua Chat]
```

### Handoff al Sistema Email

```javascript
// Quando il lead è qualificato
const leadData = {
  nome: "Mario Rossi",
  azienda: "Rossi SRL", 
  comune: "Milano",
  dipendenti: "10-50",
  servizi: ["Sito web", "E-commerce"],
  messaggio: "Richiesta preventivo per e-commerce aziendale. Discusso in chat con assistente virtuale.",
  formType: "preventivo-chat",
  chatSessionId: session.id,
  prequalified: true
};

// Chiamata API sistema email esistente
await fetch('https://it-era-email.bulltech.workers.dev/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(leadData)
});
```

## 📊 Integrazioni Esistenti

### Riutilizzo Sistema Email
- **API Endpoint**: `https://it-era-email.bulltech.workers.dev/api/contact`
- **Configurazione**: Riutilizzo completo (Resend, rate limits, validation)
- **Template**: Email con flag "Pre-qualificato da chatbot"
- **Destinatario**: Sempre `andrea@bulltech.it`

### Configurazioni da Memory
```javascript
// Recupero config esistente
const emailConfig = await memory.retrieve('it-era/email-system/config');

// Riutilizzo per chatbot
const chatbotConfig = {
  emailEndpoint: emailConfig.api_endpoint,
  rateLimit: emailConfig.rate_limit,
  recipient: emailConfig.recipient,
  fallbackSender: emailConfig.fallback_sender
};
```

## 🔐 Sicurezza e Privacy

### Session Management
- **KV Storage**: Sessioni temporanee (TTL 1 ora)
- **Encryption**: Conversazioni cifrate
- **GDPR**: Consenso esplicito, data deletion

### Rate Limiting
- **Chat**: 50 messaggi/ora per IP
- **Email Integration**: Rispetta limite 95/giorno
- **Session**: Max 30 min per conversazione

### Data Protection
- **No PII Storage**: Solo metadata sessioni
- **Anonymization**: Log senza dati personali
- **Audit**: Tracking accessi e handoff

## 📈 Analytics e Monitoring

### Metriche Chiave
- **Engagement**: Messaggi per sessione
- **Conversion**: Chat → Lead qualificato
- **Completion**: % conversazioni terminate
- **Handoff**: % passaggio al sistema email
- **Satisfaction**: Feedback utenti

### Dashboard
- **Real-time**: Conversazioni attive
- **Daily**: Leads generati, qualità
- **Weekly**: Performance intents
- **Monthly**: ROI e ottimizzazioni

## 🚀 Deployment Strategy

### Workers Configuration
```toml
# wrangler-chatbot.toml
name = "it-era-chatbot"
main = "src/chatbot/api/chatbot-worker.js"
compatibility_date = "2024-01-23"
account_id = "2842eac6595a0ac8086c76cee3409a24"

# Shared KV for sessions
[[kv_namespaces]]
binding = "CHAT_SESSIONS"
id = "new-kv-namespace-for-chat"

# Reuse existing KV for shared config
[[kv_namespaces]]
binding = "SHARED_CONFIG" 
id = "e8bd03a1105a46208000adfc1cc84487"
```

### Environment Variables
- `OPENAI_API_KEY` - For NLP (da configurare)
- `RESEND_API_KEY` - Eredita da sistema email
- `CHAT_SESSION_TTL` - 3600 (1 ora)

## 🧪 Testing Strategy

### Integration Tests
- Chat → Email handoff
- Session persistence  
- Rate limiting
- Error handling

### E2E Tests
- Complete conversation flows
- Multi-device compatibility
- Performance under load
- Security penetration

## 📋 Development Phases

### Phase 1: Core API (Week 1)
- [ ] Chatbot Worker setup
- [ ] Basic conversation engine
- [ ] Session management
- [ ] Email integration

### Phase 2: Frontend Widget (Week 2)  
- [ ] Chat widget development
- [ ] Responsive design
- [ ] Form integration
- [ ] Mobile optimization

### Phase 3: AI Enhancement (Week 3)
- [ ] NLP engine integration
- [ ] Intent classification
- [ ] Learning from conversations
- [ ] Multi-language support

### Phase 4: Production (Week 4)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Analytics implementation
- [ ] Go-live deployment

---

**System Architect Agent**: Architecture complete ✅  
**Next**: Backend Developer implements API Worker