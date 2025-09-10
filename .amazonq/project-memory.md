# IT-ERA Project Memory

## 🎯 Progetto Overview
- **Nome:** IT-ERA - Assistenza IT Professionale in Lombardia
- **Stack:** Node.js + Express.js (Serverless su Vercel)
- **Frontend:** EJS Templates + Vanilla JavaScript
- **Deployment:** Vercel Platform
- **URL Production:** https://it-4csnzw34n-andreas-projects-d0af77c4.vercel.app

## 🤖 Agenti Specializzati Creati

### Orchestratore Principale
- **IT-ERA-Orchestrator** - Coordina tutti gli agenti con workflow strutturati

### Agenti Specializzati
- **EspertoVercel** - Deploy automatici Vercel con Context7
- **SEO-Master** - Gestione 1400+ pagine SEO lombarde
- **Content-Manager** - Contenuti servizi IT e città
- **Performance-Guru** - Ottimizzazioni CSS/JS/images
- **Test-Engineer** - Jest, Playwright, Puppeteer
- **DevOps-Pro** - Vercel deployments, CI/CD
- **Security-Auditor** - Helmet.js, rate limiting

## 🔄 Workflow Standard
1. **VERIFICA** (Security-Auditor) - Audit sicurezza
2. **TESTING** (Test-Engineer) - Test completi
3. **SVILUPPO** (Content-Manager + SEO-Master + Performance-Guru) - Parallelo
4. **TESTING FINALE** (Test-Engineer) - Validazione pre-deploy
5. **CHECK ONLINE** (DevOps-Pro + EspertoVercel) - Deploy e monitoraggio

## 🛠️ Context7 Integration
- Tutti gli agenti DEVONO usare Context7 prima di ogni operazione
- Server MCP configurato in `.mcp.json`
- Documentazioni scaricate: `vercel-context7-docs.txt`, `seo-context7-docs.txt`, etc.

## 📁 Struttura Chiave
- `api/index.js` - Main Express app per Vercel
- `views/` - EJS templates
- `public/` - 1400+ pagine SEO generate
- `config/` - Configurazioni SEO, analytics, email
- `data/cities-data.json` - Dati città lombarde
- `.mcp.json` - Configurazione server MCP

## 🚀 Comandi Rapidi
```bash
/agent IT-ERA-Orchestrator    # Workflow completo
/agent EspertoVercel         # Deploy Vercel
/knowledge add ~/progetti/IT-ERA  # Salva in knowledge base
```

## 📊 Metriche Target
- Lighthouse Score: 95+
- Core Web Vitals: Excellent
- Coverage: >80%
- Uptime: 99.9%

---
*Ultimo aggiornamento: 2025-09-10*
