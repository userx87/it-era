# IT-ERA Chatbot AI Integration - Deployment Guide

## Panoramica

L'integrazione AI per il chatbot IT-ERA utilizza OpenRouter/OpenAI per fornire risposte intelligenti mantenendo tutte le funzionalità esistenti come fallback.

## Configurazione Environment Variables

```bash
# AI Configuration (Required)
OPENAI_API_KEY="sk-your-openai-api-key"
# Alternative: ANTHROPIC_API_KEY="your-anthropic-key"

# Existing Variables (Preserved)
TEAMS_WEBHOOK_URL="https://your-teams-webhook-url"
CHAT_SESSIONS="your-kv-namespace"
ENVIRONMENT="production"  # or "development"

# Optional AI Settings
AI_ENABLED="true"           # Set to "false" to disable AI
AI_PROVIDER="openai"        # or "anthropic"  
AI_MODEL="gpt-4o-mini"      # Cost-effective model
AI_COST_LIMIT="0.10"        # €0.10 per conversation
AI_TIMEOUT="8000"           # 8 seconds timeout
```

## Deployment su Cloudflare Workers

### 1. Aggiorna wrangler.toml

```toml
[env.production]
# Existing configuration...

[env.production.vars]
AI_ENABLED = "true"
AI_PROVIDER = "openai"
AI_MODEL = "gpt-4o-mini"
AI_COST_LIMIT = "0.10"
AI_TIMEOUT = "8000"

# Secrets (set via CLI)
# wrangler secret put OPENAI_API_KEY
```

### 2. Deploy con AI abilitata

```bash
# Set API key as secret
wrangler secret put OPENAI_API_KEY

# Deploy the worker
wrangler deploy --env production
```

### 3. Verifica deployment

```bash
# Health check with AI status
curl https://your-worker.your-subdomain.workers.dev/health

# AI diagnostics
curl https://your-worker.your-subdomain.workers.dev/api/ai-diagnostics
```

## Funzionalità Integrate

### ✅ AI-Enhanced Features

- **Conversazioni naturali** in italiano
- **Context awareness** multi-turn
- **Intent recognition** migliorato
- **Lead qualification** automatica
- **Follow-up intelligenti**
- **Risposte personalizzate** per tipo cliente

### ✅ Preserved Features

- **Teams webhook** per escalation preventivi
- **Rate limiting** e CORS esistenti
- **Session management** con KV storage
- **Knowledge base** IT-ERA completa
- **Emergency escalation** automatica
- **Fallback logic** se AI non disponibile

## Monitoring e Diagnostics

### Health Check Endpoint: `/health`

```json
{
  "status": "ok",
  "service": "IT-ERA AI-Enhanced Chatbot API",
  "version": "2.0",
  "ai": {
    "enabled": true,
    "initialized": true,
    "provider": "openai",
    "model": "gpt-4o-mini",
    "costLimit": 0.10,
    "timeout": 8000
  },
  "features": {
    "teamsWebhook": true,
    "rateLimit": true,
    "fallbackMode": false
  }
}
```

### AI Diagnostics: `/api/ai-diagnostics`

```json
{
  "status": "operational",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "usage": {
    "totalConversations": 42,
    "totalCosts": "2.34",
    "avgCostPerConversation": "0.056",
    "cacheHitRate": "23%"
  },
  "config": {
    "maxTokens": 150,
    "temperature": 0.7,
    "costLimit": 0.10,
    "timeout": 8000,
    "maxRetries": 2
  }
}
```

## Fallback Behavior

L'integrazione è progettata per essere **resiliente**:

1. **AI First**: Tenta sempre AI se disponibile
2. **Graceful Degradation**: Fallback automatico a logic esistente
3. **Error Recovery**: Retry logic con exponential backoff
4. **Cost Control**: Limiti di costo per conversation
5. **Rate Limiting**: Protezione da abuse

## Cost Management

### Default Settings (Ottimizzati per budget)

- **Model**: GPT-4o-mini (costo minimo)
- **Max Tokens**: 150 (risposte concise)
- **Cost Limit**: €0.10 per conversazione
- **Timeout**: 8 secondi
- **Caching**: Risposte comuni cached per 1 ora

### Stima Costi

```
GPT-4o-mini: €0.00015 per 1K tokens
Conversazione media: ~100 tokens = €0.015
Budget €0.10 = ~6-7 scambi per conversazione
```

## Testing

### Run Test Suite

```bash
npm test -- chatbot-ai-integration.test.js
```

### Manual Testing

```bash
# Start conversation
curl -X POST https://your-worker.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.it-era.it" \
  -d '{"action":"start"}'

# Send message  
curl -X POST https://your-worker.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.it-era.it" \
  -d '{
    "action":"message",
    "message":"Vorrei un preventivo per un sito web",
    "sessionId":"returned-session-id"
  }'
```

## Troubleshooting

### AI Engine Not Initializing

1. Check API key is set: `wrangler secret list`
2. Verify environment variables
3. Check worker logs: `wrangler tail`

### High Costs

1. Monitor via `/api/ai-diagnostics`
2. Adjust `AI_COST_LIMIT` in environment
3. Consider switching to Claude Haiku (lower cost)

### Poor AI Responses

1. Adjust temperature (0.3-0.9)
2. Increase max tokens if responses cut off
3. Check system prompt in ai-integration.js

### Fallback Mode Active

1. Check `/health` endpoint for AI status
2. Verify API key validity
3. Test network connectivity to OpenAI API

## Sicurezza

- **API Keys** stored as Cloudflare secrets
- **CORS** maintained from existing config
- **Rate limiting** prevents abuse
- **Input validation** on all endpoints
- **Error handling** without exposing internals

## Performance

- **Caching**: Risposte comuni cached
- **Timeout**: 8s max per call AI
- **Parallel processing**: Non-blocking fallback
- **Resource optimization**: Minimal token usage

## Rollback Plan

Per disabilitare AI e tornare al comportamento originale:

```bash
wrangler secret put AI_ENABLED false
wrangler deploy --env production
```

L'integrazione è progettata per **zero downtime** e **backward compatibility** completa.