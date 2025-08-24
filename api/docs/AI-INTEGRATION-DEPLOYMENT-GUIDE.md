# IT-ERA AI Chatbot - OpenRouter Integration Deployment Guide

## 🎯 Overview

Questa guida descrive l'implementazione completa dell'integrazione OpenRouter AI nel chatbot IT-ERA, mantenendo tutti i dati reali e la funzionalità Teams webhook esistente.

## 📋 Features Implemented

### ✅ OpenRouter AI Engine
- **Modello Primario**: `anthropic/claude-3.5-sonnet` per qualità massima
- **Modello Fallback**: `openai/gpt-4o-mini` per costi ridotti  
- **System Prompt Personalizzato**: Ottimizzato con dati reali IT-ERA
- **Gestione Costi**: Limite per sessione €0.15, giornaliero €20
- **Cache Intelligente**: TTL 1 ora per risposte comuni

### ✅ Lead Generation Ottimizzata
- **Priorità Geografica**: Vimercate/Monza/Brianza = massima priorità
- **Qualificazione Automatica**: Base su dimensioni azienda + budget
- **Escalation Intelligente**: Keywords emergenza + richieste umane
- **Tracking Conversioni**: Email handoff + Teams notifications

### ✅ Sistema di Analytics
- **Metriche Performance**: Response time, success rate, cache hit rate
- **Metriche Business**: Lead quality, conversion rate, cost per lead  
- **Monitoraggio Costi**: Tracking dettagliato per sessione e giornaliero
- **Trend Analysis**: Analisi tendenze su 30 giorni

### ✅ Fallback Robusto
- **Fallback Multi-livello**: AI → Conversation flows → Emergency response
- **Rate Limiting**: 15 richieste/minuto per sessione
- **Error Handling**: Retry automatico con modello fallback
- **Continuity**: Zero interruzioni del servizio

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clona/aggiorna il repository
cd /Users/andreapanzeri/progetti/IT-ERA/api

# Configura variabili d'ambiente
cp src/ai-engine/env-example.toml wrangler.toml

# Modifica wrangler.toml con i tuoi valori:
# - OPENROUTER_API_KEY (già fornita)
# - EMAIL_API_ENDPOINT (esistente)
# - TEAMS_WEBHOOK_URL (esistente)
```

### 2. Testing

```bash
# Test locale
wrangler dev

# Test integrazione AI
node tests/ai/openrouter-integration-test.js

# Verifica health check
curl http://localhost:8788/health
```

### 3. Deployment

```bash
# Deploy in produzione
wrangler deploy

# Verifica deployment
curl https://your-domain.com/health
curl https://your-domain.com/analytics
```

## 📊 API Key Configuration

### OpenRouter API Key
```
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
```

**Modelli Configurati**:
- Primary: `anthropic/claude-3.5-sonnet` ($3/1M input, $15/1M output)
- Fallback: `openai/gpt-4o-mini` ($0.15/1M input, $0.60/1M output)
- Emergency: `anthropic/claude-3-haiku` ($0.25/1M input, $1.25/1M output)

## 🎛️ Configuration Details

### AI Engine Settings
```javascript
// In src/ai-engine/ai-config.js
COST_LIMITS: {
  PER_SESSION: 0.15,    // €0.15 per conversazione
  PER_HOUR: 2.0,        // €2.00 per ora
  DAILY_MAX: 20.0       // €20.00 al giorno
},

RATE_LIMITS: {
  REQUESTS_PER_MINUTE: 15,
  TOKENS_PER_MINUTE: 4000,
  CONCURRENT_SESSIONS: 10
}
```

### Lead Qualification Rules
```javascript
HIGH_PRIORITY_KEYWORDS: [
  'emergenza', 'urgente', 'server down', 'malware', 
  'firewall', 'watchguard', 'sicurezza'
],

HIGH_VALUE_LOCATIONS: [
  'vimercate', 'monza', 'agrate', 'concorezzo', 'brianza'
],

ESCALATION_CONDITIONS: {
  MESSAGE_COUNT: 8,           // Dopo 8+ messaggi
  SESSION_DURATION: 10 * 60,  // Dopo 10 minuti
  HIGH_PRIORITY_LEAD: true,
  COST_LIMIT_REACHED: true
}
```

## 🔧 System Prompt (IT-ERA Optimized)

Il system prompt è ottimizzato con tutti i dati reali IT-ERA:

```
🏢 AZIENDA: IT-ERA (Bulltech Informatica)
📞 CONTATTO: 039 888 2041
📧 EMAIL: info@it-era.it
📍 ZONA: Vimercate, Monza, Brianza, Milano Est

🎯 SPECIALIZZAZIONI:
• WatchGuard Firewall Partner (UNICO in Brianza)
• Assistenza IT PMI (10+ anni esperienza)  
• Backup e Disaster Recovery
• Riparazione Hardware Certificata

💰 PREZZI REALI:
• Firewall WatchGuard: da €2.500
• Assistenza remota: €80-100/ora
• Contratti manutenzione: da €200/mese
```

## 📈 Monitoring & Analytics

### Health Check Endpoint
```
GET /health

Response:
{
  "status": "ok",
  "service": "IT-ERA Chatbot API",
  "ai": {
    "engine": "OpenRouter",
    "status": "healthy",
    "model": "anthropic/claude-3.5-sonnet"
  }
}
```

### Analytics Endpoint
```
GET /analytics

Response:
{
  "analytics": {
    "summary": {
      "totalRequests": 150,
      "successRate": "94.7%",
      "avgResponseTime": "1250ms",
      "cacheHitRate": "23.3%",
      "totalCost": "$2.45"
    },
    "leads": {
      "totalLeads": 23,
      "qualifiedLeads": 18,
      "qualificationRate": "78.3%",
      "highPriorityLeads": 8,
      "conversionRate": "61.1%"
    }
  }
}
```

## 🔄 Conversation Flow

### 1. AI-Powered Greeting
```
👋 Ciao! Sono l'assistente virtuale di IT-ERA, 
specializzato in servizi IT per aziende.

🏢 Siamo a Vimercate (MB) e da oltre 10 anni 
assistiamo PMI in tutta la Brianza.

Come posso aiutarti oggi?
```

### 2. Service Recognition & Response
```
User: "Mi serve un firewall per l'azienda"

AI Response:
🔒 Perfetto! Siamo partner WatchGuard certificati - 
gli UNICI in zona Vimercate/Monza.

✅ Firewall WatchGuard da €2.500 (installazione inclusa)
✅ Configurazione in 24h
✅ Monitoraggio 24/7

Quanti dipendenti avete? In che zona siete?
```

### 3. Lead Qualification & Escalation
```
User: "Siamo 25 dipendenti a Monza, serve urgente"

AI Analysis:
- Location: Monza (HIGH PRIORITY) ✅
- Company size: 25 employees (TARGET) ✅  
- Urgency: "urgente" (IMMEDIATE) ✅
- Service: Firewall (HIGH MARGIN) ✅

Result: IMMEDIATE ESCALATION → Teams notification
```

## 🎯 Lead Scoring Algorithm

```javascript
function calculateLeadPriority(leadData, context) {
  let score = 0;
  
  // Geographic Priority (40% weight)
  if (location.includes('vimercate|monza|agrate')) score += 40;
  
  // Company Size (30% weight)  
  if (employees >= 20) score += 30;
  else if (employees >= 10) score += 20;
  
  // Service Type (25% weight)
  if (service.includes('firewall|sicurezza')) score += 25;
  
  // Urgency (25% weight)
  if (urgency.includes('urgente|emergenza')) score += 25;
  
  // Priority Classification:
  // 80+ = IMMEDIATE (call within 2h)
  // 60+ = HIGH (call within 4h) 
  // 35+ = MEDIUM (email within 8h)
  // <35 = LOW (follow-up weekly)
}
```

## 💰 Cost Optimization

### Response Cache Strategy
```javascript
CACHEABLE_INTENTS: [
  'saluto',           // 24h cache
  'informazioni',     // 6h cache  
  'cybersecurity',    // 4h cache
  'assistenza'        // 2h cache
],

CACHE_BYPASS: [
  'preventivo',       // Always personalized
  'emergenza',        // Always fresh
  'data_collection'   // Always unique
]
```

### Model Selection Logic
```javascript
// Emergency (speed priority)
'emergency' → claude-3-haiku (€0.25/1M)

// High Quality (complex leads)
'high_quality' → claude-3.5-sonnet (€3/1M)

// Cost Effective (simple queries) 
'cost_effective' → gpt-4o-mini (€0.15/1M)
```

## 🔧 Troubleshooting

### Common Issues

**1. AI Not Responding**
```bash
# Check API key
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     https://openrouter.ai/api/v1/models

# Check health endpoint
curl https://your-domain.com/health
```

**2. High Costs**
```bash
# Check analytics
curl https://your-domain.com/analytics

# Look for:
# - High avgResponseTime (>3000ms)
# - Low cacheHitRate (<20%)
# - High costPerRequest (>$0.01)
```

**3. Poor Lead Quality**
```bash
# Check qualification rules in ai-config.js
# Verify geographic keywords
# Confirm escalation thresholds
```

### Performance Optimization

**Cache Hit Rate < 30%**
- Review cacheable intents
- Increase TTL for common responses
- Add more generic FAQ patterns

**Response Time > 3s**
- Switch to gpt-4o-mini for simple queries
- Reduce max_tokens from 300 to 200
- Enable request batching

**Conversion Rate < 50%**
- Review system prompt effectiveness
- Analyze failed escalations
- Improve lead qualification rules

## 🚀 Production Checklist

### Pre-Deployment
- [ ] API keys configured in Cloudflare
- [ ] KV namespaces created and bound
- [ ] Teams webhook URL updated
- [ ] Email system integration tested
- [ ] Rate limits configured appropriately

### Post-Deployment  
- [ ] Health check returns "healthy"
- [ ] Analytics endpoint accessible
- [ ] Test conversation end-to-end
- [ ] Verify Teams notifications
- [ ] Monitor costs first 24h

### Weekly Monitoring
- [ ] Review analytics dashboard
- [ ] Check cost trends
- [ ] Analyze lead quality metrics
- [ ] Update cache strategies if needed

## 📞 Support

Per supporto tecnico sull'integrazione AI:

**IT-ERA Team**
- 📞 **Phone**: 039 888 2041  
- 📧 **Email**: info@it-era.it
- 🏢 **Office**: Viale Risorgimento 32, Vimercate (MB)

**AI System Monitoring**
- 📊 **Analytics**: `https://your-domain.com/analytics`
- 🩺 **Health**: `https://your-domain.com/health`
- 📋 **OpenRouter Dashboard**: https://openrouter.ai/activity

---

## 🎉 Success Metrics Target

**Performance Goals**:
- ✅ Response Time: < 2 seconds (95th percentile)
- ✅ Success Rate: > 95%
- ✅ Cache Hit Rate: > 30%
- ✅ Cost Per Lead: < €0.50

**Business Goals**:
- 🎯 Lead Qualification Rate: > 70%
- 🎯 High Priority Leads: > 20% of total
- 🎯 Conversion Rate: > 60%
- 🎯 Customer Satisfaction: > 4.5/5

L'integrazione OpenRouter AI trasforma il chatbot IT-ERA in un sistema intelligente di lead generation, mantenendo tutti i vantaggi esistenti e aggiungendo capacità conversazionali naturali ottimizzate per il business B2B locale.