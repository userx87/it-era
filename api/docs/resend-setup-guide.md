# Guida Configurazione Resend per IT-ERA

## 🚀 Setup Completo Integrazione Resend.com

Questa guida descrive la configurazione completa dell'integrazione Resend per il sistema email di IT-ERA.

## 📋 Prerequisiti Completati

- ✅ API Key Resend: `re_EfPosTwY_CUSBriryDvbUB5QA7Eq9NWag`
- ✅ Cloudflare Worker deployato: `it-era-email.bulltech.workers.dev`
- ✅ File principale: `/contact-form-resend.js`
- ✅ Secret configurato in Cloudflare

## 🔧 Configurazione API

### 1. API Key Configurata
```bash
# Secret già configurato in Cloudflare Workers
RESEND_API_KEY=re_EfPosTwY_CUSBriryDvbUB5QA7Eq9NWag
```

### 2. Endpoint Attivo
```
API URL: https://it-era-email.bulltech.workers.dev/api/contact
Health Check: https://it-era-email.bulltech.workers.dev/health
```

### 3. Email Configuration
```javascript
EMAIL_FROM: 'IT-ERA <info@it-era.it>'
EMAIL_FROM_FALLBACK: 'onboarding@resend.dev'
EMAIL_TO: 'andrea@bulltech.it'
```

## 📧 Verifica Dominio su Resend

### Status Dominio: ⚠️ Da Verificare

Il dominio `it-era.it` deve essere verificato su Resend per utilizzare `info@it-era.it` come mittente.

#### Opzioni disponibili:

### Opzione 1: Verifica Dominio (RACCOMANDATA)
1. **Login su Resend Dashboard**: https://resend.com/domains
2. **Aggiungi dominio**: `it-era.it`
3. **Configura record DNS** sul provider del dominio:

```dns
Tipo: TXT
Nome: @
Valore: resend._domainkey=<valore-fornito-da-resend>

Tipo: CNAME
Nome: resend._domainkey
Valore: <valore-fornito-da-resend>
```

### Opzione 2: Usa Email Fallback (TEMPORANEO)
Il sistema è configurato con fallback automatico:
- Se `info@it-era.it` fallisce → usa `onboarding@resend.dev`
- Tutte le email arrivano comunque a `andrea@bulltech.it`

## 🎯 Funzionalità Implementate

### ✅ Features Principali
- **Resend API Integration**: Completa con gestione errori avanzata
- **Email Template Responsive**: Design professionale IT-ERA
- **Fallback Domain**: Sistema automatico per dominio non verificato
- **Rate Limiting**: 95 email/giorno (sotto limite free)
- **Validazione Avanzata**: Input sanitization e validazione
- **Error Handling**: Gestione specifica errori Resend
- **Analytics**: Tracking completo con KV storage
- **CORS**: Headers ottimizzati per sicurezza

### 🔒 Sicurezza
- Validazione input con sanitizzazione XSS
- Rate limiting per IP e globale
- CORS headers sicuri
- Timeout configurabili
- Headers sicurezza (CSP, XSS Protection)

### 📊 Monitoring
- Health check endpoint: `/health`
- Analytics su Cloudflare KV
- Logs dettagliati per debug
- Response time tracking

## 🧪 Test dell'Integrazione

### Test Base (Health Check)
```bash
curl -X GET https://it-era-email.bulltech.workers.dev/health
```

**Risposta attesa:**
```json
{
  "status": "ok",
  "timestamp": "2025-08-24T12:30:54.123Z",
  "service": "IT-ERA Resend Email API"
}
```

### Test Completo (Invio Email)
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://it-era.it" \
  -d '{
    "nome": "Test Cliente",
    "email": "cliente@example.com",
    "telefono": "3331234567",
    "messaggio": "Test integrazione Resend",
    "privacy": true,
    "formType": "preventivo"
  }' \
  https://it-era-email.bulltech.workers.dev/api/contact
```

**Risposta successo:**
```json
{
  "success": true,
  "message": "Richiesta inviata con successo! Ti contatteremo entro 2 ore lavorative.",
  "ticketId": "ITERA-1724515854123-ABC123",
  "metadata": {
    "responseTime": "2.1s",
    "emailId": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
    "usedFallback": false
  }
}
```

## 📈 Limiti Piano Free Resend

### Limiti Attuali
- **100 email/giorno** (configurato 95 per sicurezza)
- **Rate limit**: 50 richieste/ora per IP
- **Attachment**: Max 40MB
- **Template**: Illimitati

### Monitoring Quotidiano
```bash
# Controlla usage giornaliero
curl -X GET https://it-era-email.bulltech.workers.dev/health
```

## 🔧 Comandi Utili

### Deploy & Configurazione
```bash
# Deploy worker
wrangler deploy

# Configura API key
echo "re_EfPosTwY_CUSBriryDvbUB5QA7Eq9NWag" | wrangler secret put RESEND_API_KEY

# Monitora logs
wrangler tail

# Test completo con script
./scripts/deploy-resend.sh --test
```

### Debug & Monitoring
```bash
# Logs in tempo reale
wrangler tail --env production

# Test CORS
curl -I -X OPTIONS \
  -H "Origin: https://it-era.it" \
  -H "Access-Control-Request-Method: POST" \
  https://it-era-email.bulltech.workers.dev/api/contact

# Verifica secrets
wrangler secret list
```

## 🚨 Troubleshooting

### Errore: "Domain not verified"
**Soluzione**: Il sistema usa automaticamente il fallback `onboarding@resend.dev`
**Azione**: Verifica il dominio su Resend Dashboard per usare `info@it-era.it`

### Errore: "Rate limit exceeded"
**Soluzione**: Limite giornaliero raggiunto (100 email/giorno)
**Azione**: Attendi il reset giornaliero o aggiorna al piano Pro

### Errore: "API Key missing"
**Soluzione**: Secret non configurato
**Azione**: `echo "API_KEY" | wrangler secret put RESEND_API_KEY`

### Email non arrivano
**Check**:
1. Controlla spam folder
2. Verifica email destinatario: `andrea@bulltech.it`
3. Controlla logs: `wrangler tail`
4. Test con fallback abilitato

## 📞 Supporto

### Contatti Tecnici
- **Developer**: Andrea Panzeri
- **Email**: andrea@bulltech.it
- **API Docs**: https://resend.com/docs

### Risorse Utili
- [Resend Dashboard](https://resend.com/overview)
- [API Documentation](https://resend.com/docs/api-reference)
- [Domain Verification](https://resend.com/docs/dashboard/domains/introduction)

## 🏁 Next Steps

### Immediati
1. ✅ **Sistema operativo** con fallback email
2. ⏳ **Verifica dominio** `it-era.it` su Resend
3. ⏳ **Test produzione** dal sito web
4. ⏳ **Monitoraggio** primo giorno di utilizzo

### Ottimizzazioni Future
- [ ] Setup Telegram notifications
- [ ] Configurazione email template avanzati
- [ ] Integration con CRM
- [ ] Backup automation
- [ ] Scaling al piano Pro se necessario

---

**Sistema Status**: ✅ **OPERATIVO** con fallback automatico per dominio non verificato

*Ultimo aggiornamento: 24 agosto 2025*