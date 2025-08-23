# Configurazione DNS per API IT-ERA

## Setup Subdomain api.bulltech.it

Per attivare l'API su `api.bulltech.it`, è necessario configurare il DNS su Cloudflare.

### Opzione 1: CNAME Record (Consigliato)

1. Accedi a Cloudflare Dashboard
2. Seleziona il dominio `bulltech.it`
3. Vai nella sezione **DNS**
4. Aggiungi un nuovo record:
   - **Type**: CNAME
   - **Name**: api
   - **Target**: it-era-api.bulltech.workers.dev
   - **Proxy status**: Arancione (Proxied)
   - **TTL**: Auto

### Opzione 2: Workers Route

Se preferisci utilizzare Workers Routes senza CNAME:

1. Vai in **Workers Routes** nel dashboard Cloudflare
2. Aggiungi route:
   - **Route**: api.bulltech.it/*
   - **Worker**: it-era-api
   - **Zone**: bulltech.it

### Verifica Configurazione

Dopo aver configurato il DNS, verifica con:

```bash
# Test health endpoint
curl https://api.bulltech.it/api/health

# Dovrebbe restituire:
{
  "status": "healthy",
  "timestamp": "2025-08-23T...",
  "environment": "production"
}
```

## Configurazione Secrets

I secrets devono essere configurati tramite Wrangler CLI:

```bash
# Email provider (scegli uno)
npx wrangler secret put SENDGRID_API_KEY
# oppure
npx wrangler secret put MAILGUN_API_KEY

# Notifiche Telegram (opzionale)
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

## Utilizzo nelle Pagine Web

### 1. Includi API Client

Aggiungi in tutte le pagine che necessitano delle API:

```html
<!-- Prima del closing </body> -->
<script src="/static/js/api-client.js" defer></script>
```

### 2. Aggiungi Classe ai Form

Aggiungi la classe `api-form` ai form che devono utilizzare l'API:

```html
<form class="api-form needs-validation" novalidate>
  <!-- campi del form -->
  <button type="submit" class="btn btn-primary">Invia</button>
</form>
```

### 3. Form Fields Richiesti

I form devono includere almeno:

```html
<input type="text" name="nome" required>
<input type="email" name="email" required>
<input type="tel" name="telefono" required>
<textarea name="messaggio"></textarea>
```

## Endpoints Disponibili

### Contact Form
- **POST** `/api/contact` - Invia form contatto
  - Body: `{ nome, email, telefono, azienda, messaggio, ... }`

### Pricing & Quotes
- **GET** `/api/pricing` - Ottieni listino prezzi
- **POST** `/api/quote` - Calcola preventivo personalizzato
  - Body: `{ service, workstations, addons, ... }`
- **GET** `/api/quote/:id` - Recupera preventivo salvato
- **POST** `/api/hourly-quote` - Calcola monte ore

### Analytics
- **POST** `/api/track` - Traccia evento
  - Body: `{ event, category, label, value, ... }`
- **GET** `/api/analytics/dashboard` - Dashboard metriche
- **GET** `/api/analytics/realtime` - Dati in tempo reale
- **GET** `/api/analytics/report` - Report dettagliato

### Health Check
- **GET** `/api/health` - Verifica stato API
- **GET** `/api` - Documentazione endpoints

## Monitoraggio

### Cloudflare Analytics

1. Vai su **Workers** → **it-era-api** → **Analytics**
2. Monitora:
   - Request count
   - Error rate
   - Response time
   - Bandwidth usage

### Logs in Tempo Reale

```bash
# Tail dei logs
npx wrangler tail

# Con filtri
npx wrangler tail --format pretty --status error
```

### Test API Locale

Per sviluppo e test:

```bash
# Avvia server locale
npx wrangler dev --port 8788

# Test endpoints
curl http://localhost:8788/api/health
curl -X POST http://localhost:8788/api/contact \
  -H "Content-Type: application/json" \
  -d '{"nome":"Test","email":"test@example.com","telefono":"1234567890"}'
```

## Troubleshooting

### API non raggiungibile

1. Verifica DNS: `nslookup api.bulltech.it`
2. Controlla Workers Routes in Cloudflare
3. Verifica deployment: `npx wrangler deployments list`

### CORS Errors

L'API include già headers CORS permissivi. Se ci sono problemi:

1. Verifica che il dominio chiamante sia su HTTPS
2. Controlla console browser per dettagli errore
3. Test con: `curl -I https://api.bulltech.it/api/health`

### Form non si inviano

1. Verifica classe `api-form` nel form HTML
2. Controlla che `api-client.js` sia caricato
3. Ispeziona Network tab nel browser per errori
4. Verifica campi required nel form

## Deploy Updates

Per aggiornare l'API:

```bash
cd /Users/andreapanzeri/progetti/IT-ERA/api

# Test locale
npx wrangler dev

# Deploy in produzione
npx wrangler deploy

# Deploy in staging (opzionale)
npx wrangler deploy --env staging
```

## Backup e Recovery

### Backup KV Data

```bash
# Export data da KV
npx wrangler kv:key list --namespace-id=e8bd03a1105a46208000adfc1cc84487 > contacts_backup.json
```

### Backup D1 Database

```bash
# Export database
npx wrangler d1 export it-era-contacts --output=contacts_backup.sql
```

## Costi e Limiti

### Cloudflare Workers Free Tier
- 100,000 requests/day
- 10ms CPU time per request
- Adeguato per ~500 form submissions/day

### Quando fare Upgrade
- Oltre 3,000 visite/giorno
- Necessità di analytics avanzate
- Backup automatici frequenti

## Contatti Supporto

Per assistenza con le API:
- Email: andrea@bulltech.it
- Tel: +39 393 813 5085
- Slack: #it-era-dev (interno)
