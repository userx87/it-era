# IT-ERA • Pubblicazione Blog via n8n (Opzione A)

Questo pacchetto include:
- templates/blog_post_template.html – Template HTML con meta SEO (title, description, keywords), canonical, OG/Twitter, JSON-LD, GA4 placeholder e tracking.js.
- n8n/workflows/blog_publish_with_github.json – Workflow n8n: Webhook → Render HTML → GitHub Create/Update.
- examples/blog_payload_example.json – Payload di esempio con meta.description e meta.keywords.

Prerequisiti
- Un repository GitHub collegato a Cloudflare Pages (branch di build es. main).
- In n8n, configurare variabili d’ambiente sicure:
  - GITHUB_TOKEN: PAT con scope repo (crea/aggiorna file via API).
  - GA_MEASUREMENT_ID: ID GA4 (opzionale; se assente resta placeholder).

Import del workflow n8n
1) In n8n: Importa uno dei due workflow disponibili:
   - n8n/workflows/blog_publish_with_github.json (senza sitemap)
   - n8n/workflows/blog_publish_with_github_sitemap.json (con aggiornamento automatico sitemap.xml)
2) Apri il nodo “Config (owner/repo/branch)” (o “Config (owner/repo/branch/domain/sitemap)” nella versione con sitemap) e imposta:
   - owner: organizzazione o utente GitHub (es. bulltech-it)
   - repo: nome repo collegato a Pages (es. it-era-site)
   - branch: branch di build (es. main)
   - baseUrlDomain: https://it-era.pages.dev
   - sitemapPath: web/sitemap.xml (solo workflow con sitemap)
3) Salva e attiva il workflow (se vuoi URL pubblico). In fase di test usa l’URL di test del Webhook.

Sicurezza credenziali
- Il workflow usa l’header Authorization con la variabile d’ambiente n8n $env.GITHUB_TOKEN. Non inserire token in chiaro nel workflow.
- Imposta GITHUB_TOKEN nel container/host di n8n e riavvia il servizio.

Payload atteso (schema)
{
  title: string,
  slug: string,             // senza spazi, usato come nome file .html
  excerpt?: string,
  content_html: string,     // HTML completo dell’articolo (include H1/H2/H3)
  meta: {
    title: string,          // meta title (può differire dall’H1)
    description: string,    // 150–160 caratteri consigliati
    keywords?: string[] | string
  },
  schema_jsonld?: object | string,
  tags?: string[],
  canonical?: string,       // se non presente, viene costruito da baseUrlDomain + slug
  cover?: { url?: string, alt?: string },
  internal_links?: { href: string, anchor: string }[],
  commit_message?: string,  // opzionale
  GA_MEASUREMENT_ID?: string // opzionale, se vuoi forzare l’ID GA per questo post
}

Note SEO
- meta.keywords: non critico per Google, ma mantenuto per coerenza. Consigliate 3–8 keyword, includendo località (es. “cybersecurity Lecco”).
- meta.description: 150–160 caratteri, naturale, include 1–2 keyword e la località.
- canonical: punta a https://it-era.pages.dev/pages/blog/{slug}.html.

Come testare rapidamente
1) Avvia il workflow in modalità test, copia l’URL del Webhook (POST).
2) Esegui una POST con l’esempio incluso:
   - Body JSON: examples/blog_payload_example.json
3) Il workflow creerà/aggiornerà il file in pages/blog/{slug}.html nel repo GitHub.
4) Se usi la versione con sitemap: verifica che in web/sitemap.xml compaia una nuova entry <url><loc>https://it-era.pages.dev/pages/blog/{slug}.html</loc>...</url> con lastmod aggiornato.
5) Cloudflare Pages effettuerà il rebuild; dopo la build l’articolo sarà disponibile a:
   https://it-era.pages.dev/pages/blog/{slug}.html

Template HTML
- Il workflow incorpora un template interno; in alternativa, puoi usare templates/blog_post_template.html come riferimento.
- Placeholder supportati in template: {{meta.title}}, {{meta.description}}, {{meta.keywords}}, {{canonical}}, {{cover.url}}, {{schema_jsonld}}, {{content_html}}, {{GA_MEASUREMENT_ID}}.

Integrazione con context7 (MCP)
- Fai emettere a context7 il payload già nel formato sopra. In particolare, aggiungi:
  - meta.description (150–160 char) e meta.keywords (array di 3–8 keyword)
  - schema_jsonld come oggetto BlogPosting
  - canonical e cover.url se disponibili
- n8n userà questi campi senza mapping aggiuntivo.

Aggiornare la sitemap (opzionale)
- Variante semplice: sitemap generata automaticamente da Pages/build.
- Variante consigliata (inclusa): usare il workflow “blog_publish_with_github_sitemap.json” che aggiorna automaticamente sitemap.xml nel repo.
- Dettagli: dopo il commit del post, il workflow legge web/sitemap.xml (se esiste), inserisce/aggiorna l’entry per https://it-era.pages.dev/pages/blog/{slug}.html con lastmod=YYYY-MM-DD, quindi effettua un PUT con commit "chore(sitemap): add/update {slug}".

Troubleshooting
- 404 su GET file: è normale al primo publish; il workflow gestisce create vs update.
- 401/403 da GitHub: verifica $env.GITHUB_TOKEN e che lo scope includa repo:contents.
- GA4 non traccia: imposta GA_MEASUREMENT_ID come variabile d’ambiente in n8n o passalo nel payload.


