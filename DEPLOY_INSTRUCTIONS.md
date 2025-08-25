# Istruzioni Deploy - IT-ERA Bulltech

## 🚀 Deploy su Cloudflare Pages

Il sito è configurato per il deploy automatico su Cloudflare Pages.

### URL di Produzione
- **URL temporaneo**: https://it-era.it
- **URL di anteprima ultimo deploy**: https://3590e160.it-era.it

### Comandi Disponibili

```bash
# Deploy in produzione
npm run deploy

# Anteprima locale (con hot reload)
npm run dev

# Anteprima con Cloudflare Workers
npm run preview
```

### Struttura del Progetto

```
IT-ERA/
├── web/                    # Directory principale del sito
│   ├── index.html         # Homepage
│   ├── pages/             # Tutte le pagine HTML
│   │   ├── assistenza-it-*.html  # Pagine località
│   │   ├── servizi.html
│   │   ├── contatti.html
│   │   ├── prezzi.html
│   │   ├── blog/
│   │   └── case-study/
│   ├── static/            # Risorse statiche (CSS, JS, immagini)
│   ├── _headers          # Configurazione headers HTTP
│   ├── _redirects        # Configurazione redirect
│   ├── robots.txt
│   └── sitemap.xml
├── wrangler.toml         # Configurazione Cloudflare
└── package.json          # Script npm
```

### Per Aggiornare il Sito

1. **Modifica i file** nella cartella `web/`
2. **Test locale** (opzionale):
   ```bash
   npm run dev
   ```
3. **Deploy**:
   ```bash
   npm run deploy
   ```

### Configurare un Dominio Personalizzato

1. Accedi a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vai su **Pages** > **it-era**
3. Clicca su **Custom domains**
4. Aggiungi il dominio (es. `www.bulltech.it`)
5. Segui le istruzioni per configurare i DNS

### Funzionalità Attive

✅ **HTTPS automatico** - Certificato SSL gratuito
✅ **CDN globale** - Distribuzione su 200+ data center
✅ **Headers di sicurezza** - X-Frame-Options, CSP, etc.
✅ **Cache ottimizzata** - Cache lunga per risorse statiche
✅ **Redirect automatici** - URL brevi per tutte le pagine
✅ **Compressione Brotli** - Automatica per tutti i file

### Monitoraggio

- **Analytics**: Disponibile nel dashboard Cloudflare Pages
- **Web Analytics**: Attivabile gratuitamente senza cookie
- **Real User Monitoring**: Disponibile con piano Pro

### Backup e Rollback

Ogni deploy crea automaticamente una versione salvata. Per fare rollback:

1. Vai su Cloudflare Dashboard > Pages > it-era
2. Clicca su "View deployments"
3. Seleziona un deployment precedente
4. Clicca "Rollback to this deployment"

### Supporto

- [Documentazione Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Community Discord](https://discord.cloudflare.com)

---

## 📝 Note Importanti

1. **Non eliminare** i file `_headers` e `_redirects` - gestiscono sicurezza e SEO
2. **Test sempre** in locale prima del deploy con `npm run dev`
3. **Sitemap**: Aggiorna `sitemap.xml` quando aggiungi nuove pagine
4. **Analytics**: Considera l'attivazione di Cloudflare Web Analytics (gratuito, privacy-friendly)

## 🔧 Troubleshooting

### Errore di autenticazione
```bash
npx wrangler login
```

### Cache non aggiornata
Cloudflare Pages invalida automaticamente la cache, ma puoi forzare:
1. Dashboard > Caching > Configuration > Purge Everything

### File troppo grandi
Limite: 25MB per file, 20.000 file totali

---

Ultimo aggiornamento: 23 Agosto 2024
