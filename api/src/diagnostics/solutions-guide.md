# 🔧 Guida Soluzioni SendGrid - IT-ERA.IT

## 📋 Diagnosi Problema Attuale

**SINTOMO**: Cloudflare Worker restituisce errore 500 quando tenta invio email tramite SendGrid  
**DOMINIO**: it-era.it  
**MITTENTI TESTATI**: info@it-era.it, noreply@it-era.it  
**API KEY**: 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  

---

## 🚨 CAUSE PROBABILI (in ordine di probabilità)

### 1. **DOMINIO NON AUTENTICATO** (90% probabilità)
**Problema**: it-era.it non è configurato correttamente su SendGrid  
**Sintomi**: Errore 403 Forbidden dall'API SendGrid  

**✅ SOLUZIONE IMMEDIATA**:
```bash
# 1. Login SendGrid Dashboard
# 2. Settings > Sender Authentication > Authenticate Your Domain
# 3. Inserisci: it-era.it
# 4. Aggiungi questi DNS records al tuo provider:

# CNAME Records da aggiungere:
s1._domainkey.it-era.it -> s1.domainkey.u[USER_ID].wl[DOMAIN_ID].sendgrid.net
s2._domainkey.it-era.it -> s2.domainkey.u[USER_ID].wl[DOMAIN_ID].sendgrid.net

# CNAME per link tracking (opzionale):
[SUBDOMAIN].it-era.it -> sendgrid.net
```

### 2. **SENDER IDENTITY NON VERIFICATA** (85% probabilità)  
**Problema**: info@it-era.it non è verificata come mittente  
**Sintomi**: Errore 403 con messaggio "sender not verified"  

**✅ SOLUZIONE RAPIDA (Single Sender)**:
```bash
# 1. SendGrid Dashboard > Settings > Sender Authentication
# 2. Create a Single Sender
# 3. Email: info@it-era.it
# 4. Nome: IT-ERA Sistema Notifiche  
# 5. Verifica email ricevuta
```

**✅ SOLUZIONE COMPLETA (Domain Auth - CONSIGLIATA)**:
Usa Domain Authentication (Soluzione 1) invece di Single Sender

### 3. **API KEY LIMITATA** (70% probabilità)
**Problema**: API Key non ha permessi "Mail Send"  
**Sintomi**: Errore 401 Unauthorized  

**✅ SOLUZIONE**:
```bash
# 1. SendGrid Dashboard > Settings > API Keys
# 2. Crea nuova API Key con nome "IT-ERA-MAIL-SEND"
# 3. Permessi: "Mail Send" (minimo) o "Full Access"
# 4. Copia la nuova key e sostituisci nel Cloudflare Worker
```

---

## 🔍 TEST DIAGNOSTICI IMMEDIATI

### Test 1: Esegui Script Diagnostico
```bash
cd /Users/andreapanzeri/progetti/IT-ERA/api/src/diagnostics
./quick-tests.sh
```

### Test 2: Verifica API Key Manualmente
```bash
curl -X GET "https://api.sendgrid.com/v3/scopes" \
  -H "Authorization: Bearer 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"
```

**Risultati attesi**:
- ✅ 200 OK + lista permessi → API Key valida
- ❌ 401 Unauthorized → API Key non valida/scaduta

### Test 3: Verifica Domini
```bash
curl -X GET "https://api.sendgrid.com/v3/whitelabel/domains" \
  -H "Authorization: Bearer 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"
```

**Cosa cercare**:
- ✅ it-era.it presente con `"valid": true`
- ❌ it-era.it assente o `"valid": false`

---

## 🛠️ SOLUZIONI PASSO-PASSO

### SOLUZIONE A: Domain Authentication (CONSIGLIATA)

**Passo 1**: Login SendGrid Dashboard
```
https://app.sendgrid.com/settings/sender_auth/domain
```

**Passo 2**: Clicca "Authenticate Your Domain"

**Passo 3**: Inserisci dati:
- Domain: `it-era.it`  
- Advanced Settings: Lascia default
- Use automated security: ✅ SI

**Passo 4**: Aggiungi DNS Records
SendGrid fornirà 3 CNAME records da aggiungere:
```
s1._domainkey.it-era.it -> s1.domainkey.u[NUMERO].wl[NUMERO].sendgrid.net
s2._domainkey.it-era.it -> s2.domainkey.u[NUMERO].wl[NUMERO].sendgrid.net  
[SUBDOMAIN].it-era.it -> sendgrid.net
```

**Passo 5**: Verifica DNS (attendi 24-48h)

**Passo 6**: Testa invio email

---

### SOLUZIONE B: Single Sender (RAPIDA)

**Passo 1**: SendGrid Dashboard > Settings > Sender Authentication

**Passo 2**: Clicca "Create a Single Sender"  

**Passo 3**: Compila form:
```
From Name: IT-ERA Sistema Notifiche
From Email: info@it-era.it
Reply To: info@it-era.it  
Company: IT-ERA
Address: [Il tuo indirizzo]
City: [La tua città]
State: [La tua regione]
Zip: [Il tuo CAP]
Country: Italy
```

**Passo 4**: Clicca "Create" → Riceverai email di verifica

**Passo 5**: Apri email e clicca "Verify Single Sender"

**Passo 6**: Testa invio email

---

### SOLUZIONE C: Nuova API Key

**Passo 1**: SendGrid Dashboard > Settings > API Keys

**Passo 2**: Clicca "Create API Key"

**Passo 3**: Configura:
```
Name: IT-ERA-MAIL-SEND-2024
Type: Full Access (o Restricted con Mail Send)
```

**Passo 4**: Copia la nuova API Key

**Passo 5**: Aggiorna Cloudflare Worker:
```javascript
// Sostituisci nel Worker la variabile SENDGRID_API_KEY
// con la nuova key
```

---

## 🧪 CONFIGURAZIONE WORKER MIGLIORATA

Usa il file `sendgrid-worker-improved.js` che include:

- ✅ Error handling dettagliato
- ✅ Logging diagnostico
- ✅ Analisi automatica errori
- ✅ CORS headers corretti
- ✅ Validazione input

**Deploy**: Sostituisci il codice del tuo Cloudflare Worker con il contenuto del file migliorato.

---

## 📊 COSA FARE DOPO AVER RISOLTO

### 1. Test Completo
```bash
# Esegui tutti i test
node /Users/andreapanzeri/progetti/IT-ERA/api/src/diagnostics/sendgrid-diagnosis.js
```

### 2. Configurazione DNS Monitor
Imposta monitoring per i DNS records DKIM

### 3. Rate Limiting
Implementa rate limiting per evitare spamming

### 4. Monitoring
Configura alerting per errori email

---

## ❓ TROUBLESHOOTING COMUNI

### Errore: "The from address does not match a verified Sender Identity"
**Soluzione**: Completa Domain Authentication o Single Sender Verification

### Errore: "Forbidden"  
**Soluzione**: Verifica API Key permissions e sender authentication

### Errore: "Bad Request - malformed request"
**Soluzione**: Controlla formato JSON del payload

### DNS non si propaga
**Soluzione**: Attendi 24-48h, usa DNS checker online

---

## 🔗 Link Utili

- [SendGrid Dashboard](https://app.sendgrid.com)
- [Sender Authentication](https://app.sendgrid.com/settings/sender_auth)  
- [API Keys](https://app.sendgrid.com/settings/api_keys)
- [DNS Checker](https://dnschecker.org)
- [SendGrid Status](https://status.sendgrid.com)

---

**PRIORITÀ**: Inizia con Domain Authentication (Soluzione A) - risolve la maggior parte dei problemi.