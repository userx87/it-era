# 📦 Cloudflare Pages Deployment Guide

## ✅ Repository Ready
Il codice è stato pushato su GitHub ed è pronto per il deployment su Cloudflare Pages.

## 🚀 Configurazione Cloudflare Pages

### 1. Accedi a Cloudflare Dashboard
1. Vai su https://dash.cloudflare.com
2. Seleziona "Workers & Pages" dal menu laterale
3. Clicca "Create application" → "Pages" → "Connect to Git"

### 2. Connetti il Repository GitHub
1. Autorizza Cloudflare ad accedere a GitHub
2. Seleziona il repository: `userx87/it-era`
3. Clicca "Begin setup"

### 3. Configurazione Build
Inserisci questi parametri:

```
Project name: it-era
Production branch: main
Framework preset: Next.js (Static HTML Export)
Build command: npm run build
Build output directory: out
```

### 4. Variabili d'Ambiente
Clicca "Environment variables" e aggiungi:

```
RESEND_API_KEY = re_BhJiCJEe_JXYWoB3W4NcpoPtjA2qyvqYL
NODE_ENV = production
NEXT_PUBLIC_SITE_URL = https://it-era.pages.dev
NEXT_PUBLIC_COMPANY_EMAIL = info@bulltech.it
NEXT_PUBLIC_COMPANY_PHONE = 039 888 2041
```

### 5. Deploy
1. Clicca "Save and Deploy"
2. Attendi il completamento (circa 2-3 minuti)
3. Il sito sarà disponibile su: `https://it-era.pages.dev`

## 🌐 Dominio Personalizzato

### Configura it-era.it
1. In Cloudflare Pages → Settings → Custom domains
2. Clicca "Set up a custom domain"
3. Inserisci: `it-era.it` e `www.it-era.it`
4. Segui le istruzioni per i DNS

### Record DNS Necessari:
```
CNAME    @       it-era.pages.dev
CNAME    www     it-era.pages.dev
```

## ⚠️ IMPORTANTE: Verifica Dominio Resend

Per abilitare l'invio email in produzione:

1. **Accedi a Resend.com**
   - https://resend.com/domains

2. **Aggiungi Dominio**
   - Clicca "Add Domain"
   - Inserisci: `bulltech.it`

3. **Configura DNS**
   Aggiungi questi record nel tuo DNS:
   ```
   TXT     resend._domainkey    p=MIGfMA0GCS...
   TXT     _dmarc              v=DMARC1; p=none;
   MX      feedback-smtp       feedback-smtp.resend.com
   ```

4. **Verifica**
   - Attendi 5-10 minuti
   - Clicca "Verify DNS Records"

## 📊 Monitoraggio

### Analytics
- Cloudflare Analytics: Automatico
- Google Analytics: Aggiungi ID in variabili d'ambiente

### Logs
- Vai su Functions → Logs per vedere i log delle API

### Email Tracking
- Dashboard Resend: https://resend.com/emails

## 🔧 Comandi Utili

```bash
# Build locale per test
npm run build

# Deploy manuale (se necessario)
npm run deploy:cf

# Test API locale
curl -X POST https://it-era.pages.dev/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test"}'
```

## ✅ Checklist Post-Deploy

- [ ] Sito raggiungibile su it-era.pages.dev
- [ ] Form di contatto funzionanti
- [ ] Email inviate correttamente
- [ ] SEO cron job configurato
- [ ] SSL attivo
- [ ] DNS configurato per dominio personalizzato
- [ ] Resend dominio verificato

## 📱 Supporto

Per assistenza con Cloudflare Pages:
- Docs: https://developers.cloudflare.com/pages
- Community: https://community.cloudflare.com

---

**Status:** READY FOR DEPLOYMENT ✅
**Last Update:** 2025-10-02