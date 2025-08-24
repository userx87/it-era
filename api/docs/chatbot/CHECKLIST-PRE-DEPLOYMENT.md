# 🚨 CHECKLIST PRE-DEPLOYMENT - CHATBOT IT-ERA

**⚠️ IMPORTANTE: Segui questa checklist PRIMA di inserire il codice nelle pagine**

## ✅ **STEP 1: DEPLOY IL CHATBOT WORKER**

### 1.1 Verifica configurazione
```bash
cd /Users/andreapanzeri/progetti/IT-ERA/api
cat wrangler-chatbot.toml
```

### 1.2 Deploy produzione
```bash
wrangler deploy --config wrangler-chatbot.toml --env production
```

**✅ Endpoint finale sarà:** `https://it-era-chatbot-prod.bulltech.workers.dev`

---

## ✅ **STEP 2: TEST ENDPOINT API**

### 2.1 Test health check
```bash
curl https://it-era-chatbot-prod.bulltech.workers.dev/health
```

**Risposta attesa:**
```json
{
  "status": "ok",
  "service": "IT-ERA Chatbot API",
  "timestamp": "2025-08-24T..."
}
```

### 2.2 Test conversazione
```bash
curl -X POST https://it-era-chatbot-prod.bulltech.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

**Risposta attesa:**
```json
{
  "success": true,
  "sessionId": "chat_...",
  "response": "👋 Ciao! Sono l'assistente...",
  "options": [...]
}
```

---

## ✅ **STEP 3: VERIFICA TEAMS WEBHOOK**

### 3.1 Teams webhook già testato ✅
Il webhook funziona correttamente (ricevuta risposta "1")

### 3.2 Test notifica preventivo
```bash
curl -X POST https://it-era-chatbot-prod.bulltech.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "action": "message",
    "message": "Vorrei un preventivo per firewall WatchGuard",
    "sessionId": "test_session"
  }'
```

---

## ✅ **STEP 4: AGGIORNA CODICE INTEGRAZIONE**

### 4.1 Endpoint corretto nel codice
Il file `CODICE-COPIA-INCOLLA.html` è già aggiornato con:
```javascript
const API_ENDPOINT = 'https://it-era-chatbot-prod.bulltech.workers.dev/api/chat';
```

### 4.2 Dati IT-ERA verificati ✅
- Telefono: 039 888 2041
- Sede: Viale Risorgimento 32, Vimercate (MB)
- Email: info@it-era.it
- Teams webhook configurato

---

## ✅ **STEP 5: TEST COMPLETO**

### 5.1 Test pagina HTML
1. Apri `examples/example-homepage-with-chatbot.html`
2. Clicca sul pulsante blu chatbot
3. Verifica messaggio di benvenuto
4. Invia messaggio di test
5. Conferma risposta corretta

### 5.2 Test mobile
1. Apri DevTools → Device Mode
2. Simula iPhone/Android
3. Verifica widget responsive
4. Test funzionalità complete

---

## ✅ **STEP 6: DEPLOYMENT PAGINE SITO**

### 6.1 Codice da copiare
Usa il contenuto di `docs/chatbot/CODICE-COPIA-INCOLLA.html`

### 6.2 Pagine da aggiornare
- [ ] Homepage (index.html)
- [ ] Servizi (/servizi/)
- [ ] Chi siamo (/chi-siamo/)
- [ ] Contatti (/contatti/)
- [ ] Altre pagine principali

### 6.3 Posizionamento codice
**SEMPRE prima del tag `</body>`**

---

## ⚠️ **PROBLEMI COMUNI E SOLUZIONI**

### Worker non deploy
```bash
# Verifica account
wrangler whoami

# Re-login se necessario  
wrangler logout && wrangler login
```

### API non risponde
- Verifica CORS headers
- Controlla Workers logs: `wrangler tail --env production`
- Verifica KV namespaces esistenti

### Teams non riceve notifiche
- Testa webhook URL manualmente
- Verifica formato messaggio Teams
- Controlla logs per errori

### Chatbot non appare
- Verifica console browser per errori
- Controlla endpoint API
- Test con DevTools Network tab

---

## 📞 **SUPPORTO**

Se qualcosa non funziona:
1. **Controlla console browser** per errori JavaScript
2. **Verifica Workers logs** con `wrangler tail`
3. **Testa endpoint** con curl/Postman
4. **Teams webhook** - invia messaggio di test

---

## ✅ **APPROVAZIONE FINALE**

Solo quando tutti i test passano:
- [ ] ✅ Worker deployed successfully
- [ ] ✅ Health check OK
- [ ] ✅ Conversazione test OK  
- [ ] ✅ Teams webhook OK
- [ ] ✅ Mobile responsive OK
- [ ] ✅ Endpoint aggiornato nel codice

**🚀 AUTORIZZATO PER DEPLOYMENT NELLE PAGINE**