# 📧 Sistema Email IT-ERA - Guida Completa

## 🎯 Panoramica Rapida

Sistema email professionale per IT-ERA basato su **Cloudflare Workers** e **Resend API**.

### ✅ Stato Sistema: **OPERATIVO**

- **API**: `https://it-era-email.bulltech.workers.dev/api/contact`
- **Provider**: Resend
- **Mittente**: `info@it-era.it`
- **Destinatario**: `andrea@bulltech.it`
- **Limite**: 95 email/giorno

## 🚀 Quick Start (2 minuti)

### 1. Test Immediato

```bash
# Test health check
curl https://it-era-email.bulltech.workers.dev/health

# Invia email di test
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://it-era.it" \
  -d '{
    "nome": "Test",
    "email": "test@example.com",
    "telefono": "333 1234567",
    "messaggio": "Test messaggio",
    "privacy": true
  }' \
  https://it-era-email.bulltech.workers.dev/api/contact
```

### 2. Integrazione HTML Rapida

```html
<!-- Copia questo nel tuo sito -->
<form action="https://it-era-email.bulltech.workers.dev/api/contact" method="POST">
  <input name="nome" required placeholder="Nome">
  <input name="email" type="email" required placeholder="Email">
  <input name="telefono" required placeholder="Telefono">
  <textarea name="messaggio" placeholder="Messaggio"></textarea>
  <label>
    <input name="privacy" type="checkbox" required> Accetto privacy
  </label>
  <button type="submit">Invia</button>
</form>
```

## 📁 Struttura File

```
/api/
├── contact-form-resend.js     # Worker principale Resend ✅
├── wrangler.toml              # Configurazione Cloudflare
├── docs/
│   ├── GUIDA-SISTEMA-EMAIL.md     # Documentazione completa
│   ├── INTEGRAZIONE-FRONTEND.md   # Guide per sviluppatori
│   └── resend-setup-guide.md      # Setup Resend
├── scripts/
│   ├── test-resend.sh         # Test suite Resend
│   ├── test-email-auto.sh     # Test automatici
│   └── monitor-email.sh       # Dashboard monitoring
└── src/
    └── form-handler.js        # JavaScript client-side
```

## 🔧 Comandi Essenziali

### Deploy e Gestione

```bash
# Deploy worker
wrangler deploy --env=""

# Aggiorna API key
echo "re_EfPosTwY_CUSBriryDvbUB5QA7Eq9NWag" | wrangler secret put RESEND_API_KEY

# Monitor logs real-time
wrangler tail

# Test completo sistema
./scripts/test-email-auto.sh

# Dashboard monitoring live
./scripts/monitor-email.sh
```

## 📊 API Reference

### POST /api/contact

**Campi Obbligatori:**
- `nome` (string, min 2 char)
- `email` (string, valid email)
- `telefono` (string, Italian format)
- `privacy` (boolean, must be true)

**Campi Opzionali:**
- `azienda` (string)
- `comune` (string)
- `messaggio` (string, max 1000 char)
- `servizi` (array of strings)
- `urgenza` ("normale" | "urgente")
- `formType` (string, default: "preventivo")

**Response Success:**
```json
{
  "success": true,
  "message": "Richiesta inviata con successo!",
  "ticketId": "ITERA-1756039540740",
  "emailId": "ed5a9b71-4786-41e4-88f8"
}
```

## 🎨 Integrazione Frontend

### JavaScript Vanilla

```javascript
async function sendEmail(data) {
  const response = await fetch('https://it-era-email.bulltech.workers.dev/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: data.nome,
      email: data.email,
      telefono: data.telefono,
      privacy: true,
      messaggio: data.messaggio
    })
  });
  
  const result = await response.json();
  if (result.success) {
    console.log('Email sent! Ticket:', result.ticketId);
  }
}
```

### React Component

```jsx
function ContactForm() {
  const [sending, setSending] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    
    const formData = new FormData(e.target);
    const response = await fetch('https://it-era-email.bulltech.workers.dev/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    
    const result = await response.json();
    setSending(false);
    
    if (result.success) {
      alert(`Inviato! Ticket: ${result.ticketId}`);
      e.target.reset();
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="nome" required />
      <input name="email" type="email" required />
      <input name="telefono" required />
      <textarea name="messaggio" />
      <label>
        <input name="privacy" type="checkbox" required />
        Privacy
      </label>
      <button disabled={sending}>
        {sending ? 'Invio...' : 'Invia'}
      </button>
    </form>
  );
}
```

## 📈 Monitoring

### Dashboard Live

```bash
# Avvia monitoring interattivo
./scripts/monitor-email.sh

# Comandi disponibili:
# t - Invia test email
# l - Mostra logs
# r - Reset contatori
# q - Quit
```

### Metriche Disponibili
- Health status (UP/DOWN)
- Response time (ms)
- Uptime percentage
- Email count (daily limit)
- Error tracking

## 🔍 Troubleshooting

### Email non arrivano

1. **Check spam folder**
2. **Verifica logs:**
   ```bash
   wrangler tail
   ```
3. **Test health:**
   ```bash
   curl https://it-era-email.bulltech.workers.dev/health
   ```

### Errore CORS

Aggiungi header Origin:
```javascript
headers: {
  'Content-Type': 'application/json',
  'Origin': 'https://it-era.it'  // o http://localhost:3000 per dev
}
```

### Rate Limit

- **Limite**: 95 email/giorno
- **Reset**: 00:00 UTC
- **Check status**: Usa monitor script

## 🔐 Sicurezza

### Validazione Input
- ✅ XSS sanitization
- ✅ Email format validation
- ✅ Phone Italian format
- ✅ Length limits
- ✅ Required privacy consent

### Rate Limiting
- 50 requests/hour per IP
- 95 emails/day total
- Automatic blocking

### CORS Domains
- `https://it-era.it`
- `https://www.it-era.it`
- `http://localhost:3000` (dev)

## 📝 Memory Configuration

Il sistema salva automaticamente configurazioni e log in memory permanente:

```javascript
// Recupera configurazione
mcp__claude-flow__memory_usage({
  action: "retrieve",
  key: "it-era/email-system/config",
  namespace: "production"
})

// Keys disponibili:
// - it-era/email-system/config
// - it-era/email-system/troubleshooting
// - it-era/email-system/scripts
```

## 🚨 Alerts e Limiti

### Limiti Piano Free Resend
- **100 email/giorno** (safety: 95)
- **No attachments**
- **1 domain**

### Quando fare upgrade
- Volume > 90 email/giorno
- Necessità allegati
- Multiple domini

## 📞 Supporto

**Developer**: Andrea Panzeri  
**Email**: andrea@bulltech.it  
**Tel**: 039 888 2041  

**API Status**: https://it-era-email.bulltech.workers.dev/health  
**Docs**: `/api/docs/`

---

## ✅ Checklist Completa

- [x] Sistema email configurato con Resend
- [x] Worker deployato su Cloudflare
- [x] API endpoint funzionante
- [x] Template HTML professionale
- [x] Validazione completa input
- [x] Rate limiting attivo
- [x] CORS configurato
- [x] Documentazione completa
- [x] Guide integrazione frontend
- [x] Script monitoring
- [x] Test automatici
- [x] Memory persistence
- [x] Troubleshooting guide
- [x] Analytics tracking

**Sistema Completamente Operativo** ✅

---

*IT-ERA Email System v2.0 - Powered by Resend & Cloudflare Workers*  
*Last Update: 24 Agosto 2025*