# Deploy su Cloudflare Pages (IT-ERA)

Questa guida spiega come pubblicare il sito e l’API per i post del blog su Cloudflare Pages, usando Pages Functions (endpoint: `POST /api/blog/publish`).

## 1) Prerequisiti
- Account Cloudflare e permessi sullo spazio `Workers & Pages`
- Repository GitHub con questo progetto (branch di build es.: `main`)
- Token GitHub (PAT) con scope `repo` (per creare/aggiornare file via API)

## 2) Struttura del repository
- Statico: `web/` (contiene il sito; l’output directory della build sarà `web`)
- Functions: `functions/api/blog/publish.ts` (Pages Function che riceve il POST, renderizza HTML e committa su GitHub)
- Blog: i post vengono salvati in `web/pages/blog/{slug}.html`
- Sitemap: `web/sitemap.xml` (viene creato/aggiornato automaticamente alla pubblicazione di un post)

## 3) Creazione progetto Pages
1. Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git
2. Seleziona il repository GitHub
3. Build settings:
   - Framework preset: `None`
   - Build command: (lascia vuoto)
   - Output directory: `web`
4. Functions: Pages rileverà automaticamente la cartella `functions/` (Pages Functions attive). Se richiesto, abilita Pages Functions.

## 4) Variabili d’ambiente (Environment variables)
Imposta le seguenti variabili in Cloudflare Pages → Settings → Environment Variables (Production + Preview):

- `BLOG_API_KEY`: chiave segreta per autorizzare il POST (sarà usata nell’header `Authorization: Bearer ...`)
- `GITHUB_TOKEN`: PAT GitHub con scope `repo`
- `GITHUB_OWNER`: owner del repo (es. `bulltech-it`)
- `GITHUB_REPO`: nome repo (es. `it-era-site`)
- `GITHUB_BRANCH` (opzionale): branch di build (default `main`)
- `SITE_BASE_URL` (opzionale): base URL del sito (default `https://it-era.pages.dev`)
- `BLOG_DIR` (opzionale): cartella dei post (default `web/pages/blog`)
- `SITEMAP_PATH` (opzionale): path della sitemap (default `web/sitemap.xml`)

Note sicurezza:
- Non esporre mai i valori dei segreti in log o output. Usa solo variabili d’ambiente.

## 5) Deploy
- Salva le variabili d’ambiente, poi esegui un primo deploy:
  - Pages innesca automaticamente la build al push su `main`, oppure puoi fare “Retry deployment” dalla UI.
- Al termine, verifica che il sito sia online e che l’endpoint Functions sia attivo.

### 5.1) Deploy via Wrangler (CLI)
Se preferisci usare il CLI (senza collegare il repo):

Prerequisiti
- Node.js LTS, npm
- Wrangler installato: `npm i -g wrangler`
- Token/Account: esporta le variabili o fai `wrangler login`

Credenziali (se NON usi `wrangler login`)
```bash
export CLOUDFLARE_API_TOKEN={{CF_API_TOKEN}}
export CLOUDFLARE_ACCOUNT_ID={{CF_ACCOUNT_ID}}
```

Crea il progetto Pages (solo la prima volta)
```bash
wrangler pages project create <project_name> --production-branch=main || true
```

Deploy con static assets + Pages Functions
IMPORTANTE: per includere le Functions, usa il flag `--functions` puntando alla cartella `functions/` del repo.
```bash
# dalla root del repository
wrangler pages deploy ./web \
  --project-name=<project_name> \
  --branch=main \
  --functions=./functions
```
Note
- Se ometti `--functions`, verranno pubblicati solo gli asset statici e l’endpoint `/api/blog/publish` non sarà attivo.
- Le variabili d’ambiente per Pages (BLOG_API_KEY, GITHUB_TOKEN, ecc.) vanno impostate dalla Dashboard (consigliato). In alternativa, vedi la sezione seguente per impostarle via CLI.

#### Impostare secrets/variabili via Wrangler (CLI)
Puoi impostare i secrets direttamente da terminale senza esporli in chiaro. Esempio di procedura sicura:

1) Autenticazione Wrangler (uno dei due metodi)
```bash
# Metodo A (interattivo)
wrangler login

# Metodo B (non interattivo)
export CLOUDFLARE_API_TOKEN={{CF_API_TOKEN}}
export CLOUDFLARE_ACCOUNT_ID={{CF_ACCOUNT_ID}}
```

2) Prepara i valori in ambiente (senza stamparli)
```bash
# Inserisci i secret in modo sicuro (digitazione invisibile)
read -s BLOG_API_KEY; echo
read -s GITHUB_TOKEN; echo

# Variabili non sensibili (puoi cambiarle secondo necessità)
export GITHUB_OWNER="<owner>"
export GITHUB_REPO="<repo>"
export GITHUB_BRANCH="main"
export SITE_BASE_URL="https://it-era.pages.dev"
export BLOG_DIR="web/pages/blog"
export SITEMAP_PATH="web/sitemap.xml"
```

3) Scrivi i secrets su Pages (produzione e preview)
```bash
# Produzione
printf "%s" "$BLOG_API_KEY" | wrangler pages secret put BLOG_API_KEY --project-name=<project_name> --env=production
printf "%s" "$GITHUB_TOKEN" | wrangler pages secret put GITHUB_TOKEN --project-name=<project_name> --env=production
printf "%s" "$GITHUB_OWNER" | wrangler pages secret put GITHUB_OWNER --project-name=<project_name> --env=production
printf "%s" "$GITHUB_REPO"  | wrangler pages secret put GITHUB_REPO  --project-name=<project_name> --env=production
printf "%s" "$GITHUB_BRANCH"| wrangler pages secret put GITHUB_BRANCH --project-name=<project_name> --env=production
printf "%s" "$SITE_BASE_URL"| wrangler pages secret put SITE_BASE_URL --project-name=<project_name> --env=production
printf "%s" "$BLOG_DIR"     | wrangler pages secret put BLOG_DIR     --project-name=<project_name> --env=production
printf "%s" "$SITEMAP_PATH" | wrangler pages secret put SITEMAP_PATH --project-name=<project_name> --env=production

# Preview
printf "%s" "$BLOG_API_KEY" | wrangler pages secret put BLOG_API_KEY --project-name=<project_name> --env=preview
printf "%s" "$GITHUB_TOKEN" | wrangler pages secret put GITHUB_TOKEN --project-name=<project_name> --env=preview
printf "%s" "$GITHUB_OWNER" | wrangler pages secret put GITHUB_OWNER --project-name=<project_name> --env=preview
printf "%s" "$GITHUB_REPO"  | wrangler pages secret put GITHUB_REPO  --project-name=<project_name> --env=preview
printf "%s" "$GITHUB_BRANCH"| wrangler pages secret put GITHUB_BRANCH --project-name=<project_name> --env=preview
printf "%s" "$SITE_BASE_URL"| wrangler pages secret put SITE_BASE_URL --project-name=<project_name> --env=preview
printf "%s" "$BLOG_DIR"     | wrangler pages secret put BLOG_DIR     --project-name=<project_name> --env=preview
printf "%s" "$SITEMAP_PATH" | wrangler pages secret put SITEMAP_PATH --project-name=<project_name> --env=preview
```
Note:
- I comandi usano `read -s` e `printf` per non stampare mai i valori dei secret in chiaro.
- Le variabili non sensibili possono essere impostate anche come normali Environment Variables dalla Dashboard.
```

## 6) Test API di pubblicazione
Esegui una POST verso l’endpoint (sostituisci `{{BLOG_API_KEY}}` con la tua chiave):

```bash
curl -sS -X POST "https://it-era.pages.dev/api/blog/publish" \
  -H "Authorization: Bearer {{BLOG_API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Strategia Backup 3-2-1 per PMI",
    "slug": "prova-articolo-lecco",
    "content_html": "<h1>Strategia 3-2-1</h1><p>Backup locale + offsite + test periodici.</p>",
    "meta": {
      "title": "Backup 3-2-1 per PMI a Lecco",
      "description": "Come applicare la strategia 3-2-1 per mettere al sicuro i dati aziendali a Lecco (guida pratica).",
      "keywords": ["backup lecco", "strategy 3-2-1", "veeam", "disaster recovery"]
    },
    "schema_jsonld": {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Backup 3-2-1 per PMI a Lecco",
      "datePublished": "2025-08-23"
    },
    "cover": { "url": "https://it-era.pages.dev/static/images/backup-cover.jpg" },
    "commit_message": "feat(blog): publish prova-articolo-lecco"
  }'
```

Risposta attesa: `{"status":"ok","url":"https://it-era.pages.dev/pages/blog/prova-articolo-lecco.html"}`

## 7) Verifiche post-deploy
- Repository GitHub: verifica i commit creati su:
  - `web/pages/blog/{slug}.html`
  - `web/sitemap.xml` (dovrebbe includere `<loc>.../{slug}.html</loc>` con `<lastmod>` aggiornato)
- Sito live: visita `https://it-era.pages.dev/pages/blog/{slug}.html`

## 8) Log & debug
- Cloudflare Pages → Deployments → apri l’ultimo deployment → “View functions logs” per tracciare richieste e risposte dell’endpoint.
- In caso di errori 401: controlla l’header `Authorization: Bearer ...` e `BLOG_API_KEY` in Pages.
- In caso di errori GitHub (4xx/5xx): verifica `GITHUB_TOKEN` (scope `repo`) e i valori `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`.

## 9) Manutenzione
- Rotazione chiavi: rigenera periodicamente `BLOG_API_KEY` e `GITHUB_TOKEN` e aggiorna le variabili in Pages.
- Modello HTML: per modifiche SEO/OG/JSON-LD, aggiorna `functions/api/blog/publish.ts` (funzione `htmlTemplate`).
- Struttura cartelle: se cambi il path dei post, aggiorna anche `BLOG_DIR` e `SITEMAP_PATH` nelle variabili d’ambiente.

