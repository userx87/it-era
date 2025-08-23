# IT-ERA API - Documentazione

## 🚀 Panoramica

Sistema API completo per il sito IT-ERA Bulltech basato su Cloudflare Workers, che include:

- **Form Contatti**: Gestione richieste preventivo con validazione, email e notifiche
- **Calcolo Preventivi**: Sistema dinamico per calcolo prezzi personalizzati
- **Analytics Custom**: Tracking visite, conversioni e metriche senza dipendere da GA4
- **Ticket Support**: Sistema ticketing integrato (da sviluppare)
- **Webhook**: Integrazioni con CRM e sistemi esterni (da sviluppare)

## 📋 Prerequisiti

- Account Cloudflare (gratuito)
- Wrangler CLI installato (`npm install -g wrangler`)
- Node.js 16+ installato

## 🛠️ Setup Iniziale

### 1. Login Cloudflare
```bash
wrangler login
```

### 2. Crea KV Namespaces
```bash
# Crea namespace per contatti
wrangler kv:namespace create "CONTACT_KV"
wrangler kv:namespace create "CONTACT_KV" --preview

# Crea namespace per analytics
wrangler kv:namespace create "ANALYTICS_KV"
wrangler kv:namespace create "ANALYTICS_KV" --preview

# Crea namespace per preventivi
wrangler kv:namespace create "QUOTES_KV"
wrangler kv:namespace create "QUOTES_KV" --preview
```

### 3. Crea Database D1
```bash
# Crea database contatti
wrangler d1 create it-era-contacts

# Crea database analytics
wrangler d1 create it-era-analytics

# Inizializza schema
wrangler d1 execute it-era-contacts --file=./schema.sql
wrangler d1 execute it-era-analytics --file=./schema.sql
```

### 4. Configura wrangler.toml
Aggiorna `wrangler.toml` con gli ID ottenuti dai comandi precedenti:
- account_id
- KV namespace IDs
- D1 database IDs

### 5. Configura Secrets (Opzionale)
```bash
# Per email con SendGrid
wrangler secret put SENDGRID_API_KEY

# Per notifiche Telegram
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID

# Per email con Mailgun
wrangler secret put MAILGUN_API_KEY
```

## 📦 Deploy

### Deploy in Development
```bash
cd api
wrangler dev
# API disponibile su http://localhost:8787
```

### Deploy in Production
```bash
wrangler deploy
# API disponibile su https://it-era-api.YOUR-SUBDOMAIN.workers.dev
```

### Deploy con dominio custom
```bash
# Configura route in wrangler.toml
# pattern = "api.bulltech.it/*"
wrangler deploy
```

## 🔌 Integrazione nel Sito

### 1. Aggiorna Form Contatti
```javascript
// In ogni form del sito, aggiungi:
document.getElementById('preventivo-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = {
    nome: formData.get('nome'),
    azienda: formData.get('azienda'),
    email: formData.get('email'),
    telefono: formData.get('telefono'),
    comune: formData.get('comune'),
    dipendenti: formData.get('dipendenti'),
    servizi: formData.getAll('servizi[]'),
    urgenza: formData.get('urgenza'),
    messaggio: formData.get('messaggio'),
    privacy: formData.get('privacy') === 'on',
    formType: 'preventivo'
  };
  
  try {
    const response = await fetch('https://api.bulltech.it/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Richiesta inviata! Ti contatteremo entro 2 ore.');
      e.target.reset();
    } else {
      alert('Errore: ' + (result.errors ? result.errors.join(', ') : result.error));
    }
  } catch (error) {
    alert('Errore di connessione. Riprova o chiamaci.');
  }
});
```

### 2. Tracking Analytics
```javascript
// Aggiungi nel tracking.js esistente:
const API_URL = 'https://api.bulltech.it';
let sessionId = localStorage.getItem('it-era-session');

// Inizializza sessione
if (!sessionId) {
  sessionId = Date.now() + '-' + Math.random().toString(36).substring(2);
  localStorage.setItem('it-era-session', sessionId);
}

// Traccia page view
async function trackPageView() {
  await fetch(`${API_URL}/api/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      type: 'page_view',
      page: window.location.pathname,
      referrer: document.referrer,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      utm: {
        source: new URLSearchParams(window.location.search).get('utm_source'),
        medium: new URLSearchParams(window.location.search).get('utm_medium'),
        campaign: new URLSearchParams(window.location.search).get('utm_campaign')
      }
    })
  });
}

// Traccia conversioni
async function trackGoal(goalName, goalValue = 1) {
  await fetch(`${API_URL}/api/analytics/goal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      goalName,
      goalValue
    })
  });
}

// Avvia tracking
trackPageView();
```

### 3. Calcolatore Preventivi Dinamico
```javascript
// Per il calcolatore prezzi dinamico:
async function calculateQuote() {
  const params = {
    workstations: document.getElementById('workstations').value,
    sector: document.getElementById('sector').value,
    contractMonths: document.getElementById('contract').value,
    addons: Array.from(document.querySelectorAll('input[name="addons"]:checked'))
      .map(cb => cb.value),
    needsOnsite: document.getElementById('onsite').checked
  };
  
  const response = await fetch('https://api.bulltech.it/api/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  
  const { quote } = await response.json();
  
  // Mostra risultati
  document.getElementById('monthly-price').textContent = `€${quote.pricing.finalMonthlyPrice}`;
  document.getElementById('quote-id').textContent = quote.id;
  
  // Mostra breakdown
  quote.pricing.services.forEach(service => {
    console.log(`${service.item}: €${service.price}`);
  });
}
```

## 📊 Dashboard Analytics

Crea una pagina admin per visualizzare le metriche:

```html
<!-- /admin/dashboard.html -->
<!DOCTYPE html>
<html>
<head>
  <title>IT-ERA Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>Analytics Dashboard</h1>
  
  <div id="metrics"></div>
  
  <script>
  async function loadDashboard() {
    const response = await fetch('https://api.bulltech.it/api/analytics/dashboard?period=week');
    const { metrics } = await response.json();
    
    document.getElementById('metrics').innerHTML = `
      <p>Page Views: ${metrics.pageViews}</p>
      <p>Unique Visitors: ${metrics.uniqueVisitors}</p>
      <p>Conversion Rate: ${metrics.conversionRate}%</p>
    `;
  }
  
  loadDashboard();
  setInterval(loadDashboard, 30000); // Refresh ogni 30 secondi
  </script>
</body>
</html>
```

## 🔒 Sicurezza

1. **Rate Limiting**: Implementato automaticamente (5 richieste/ora per IP)
2. **CORS**: Solo domini autorizzati possono fare richieste
3. **Validazione**: Tutti gli input sono validati e sanitizzati
4. **GDPR**: Dati salvati con consenso esplicito privacy

## 📈 Monitoraggio

### Cloudflare Dashboard
- Vai su dashboard.cloudflare.com
- Seleziona Workers & Pages
- Visualizza metriche, logs, errors

### Custom Metrics
```bash
# Visualizza metriche giornaliere
curl https://api.bulltech.it/api/analytics/dashboard?period=today

# Report conversioni
curl https://api.bulltech.it/api/analytics/report?type=conversions&start=2024-01-01&end=2024-01-31
```

## 🧪 Testing

### Test Form Contatti
```bash
curl -X POST https://api.bulltech.it/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Test User",
    "email": "test@example.com",
    "telefono": "393 123 4567",
    "messaggio": "Test messaggio",
    "privacy": true
  }'
```

### Test Calcolo Preventivo
```bash
curl -X POST https://api.bulltech.it/api/quote \
  -H "Content-Type: application/json" \
  -d '{
    "workstations": 25,
    "sector": "manufacturing",
    "addons": ["cybersecurity", "backup"],
    "contractMonths": 24
  }'
```

## 🔧 Troubleshooting

### Errore CORS
- Verifica che il dominio sia in ALLOWED_ORIGINS
- Controlla headers nella response

### Email non inviate
- Configura SENDGRID_API_KEY o MAILGUN_API_KEY
- Verifica logs in Cloudflare Dashboard

### Database errors
- Verifica che D1 sia inizializzato con schema.sql
- Controlla binding names in wrangler.toml

## 📝 TODO

- [ ] Implementare sistema ticket completo
- [ ] Aggiungere autenticazione JWT per admin
- [ ] Webhook per Zapier/Make
- [ ] Export dati in CSV
- [ ] Dashboard real-time con WebSocket
- [ ] A/B testing per form
- [ ] Integrazione CRM (HubSpot/Pipedrive)

## 📞 Supporto

Per problemi o domande:
- Email: andrea@bulltech.it
- Tel: 393 813 5085

## 📄 License

Proprietario - IT-ERA Bulltech © 2024
