# 📧 Guida Completa Sistema Email IT-ERA

## 🚀 Panoramica

Il sistema email IT-ERA è una soluzione serverless completa basata su **Cloudflare Workers** e **Resend API** per gestire tutte le comunicazioni email dal sito web aziendale.

## 🔑 Informazioni Chiave

### Endpoints API
- **Produzione**: `https://it-era-email.bulltech.workers.dev/api/contact`
- **Health Check**: `https://it-era-email.bulltech.workers.dev/health`

### Configurazione Email
- **Mittente**: `info@it-era.it`
- **Destinatario**: `andrea@bulltech.it`
- **Provider**: Resend.com
- **Limite giornaliero**: 95 email (piano free)

## 📝 Come Usare il Sistema

### 1. Integrazione Form HTML

```html
<!-- Form di contatto base -->
<form id="contactForm" data-form-type="contatto">
  <input type="text" name="nome" required minlength="2" placeholder="Nome e Cognome">
  <input type="email" name="email" required placeholder="Email">
  <input type="tel" name="telefono" required placeholder="Telefono">
  <input type="text" name="azienda" placeholder="Azienda (opzionale)">
  <input type="text" name="comune" placeholder="Città">
  <textarea name="messaggio" rows="5" placeholder="Il tuo messaggio"></textarea>
  
  <!-- Servizi multipli -->
  <label><input type="checkbox" name="servizi" value="Sito web"> Sito Web</label>
  <label><input type="checkbox" name="servizi" value="Assistenza IT"> Assistenza IT</label>
  <label><input type="checkbox" name="servizi" value="Server"> Server e Cloud</label>
  
  <!-- Urgenza -->
  <select name="urgenza">
    <option value="normale">Normale</option>
    <option value="urgente">Urgente</option>
  </select>
  
  <!-- Privacy obbligatoria -->
  <label>
    <input type="checkbox" name="privacy" required>
    Accetto la privacy policy
  </label>
  
  <button type="submit">Invia Richiesta</button>
  <div class="form-feedback"></div>
</form>

<!-- Includi il JavaScript handler -->
<script src="/src/form-handler.js"></script>
```

### 2. Invio Diretto via JavaScript

```javascript
// Esempio invio form con fetch
async function inviaRichiesta(datiCliente) {
  const response = await fetch('https://it-era-email.bulltech.workers.dev/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nome: datiCliente.nome,           // OBBLIGATORIO
      email: datiCliente.email,         // OBBLIGATORIO
      telefono: datiCliente.telefono,   // OBBLIGATORIO
      privacy: true,                     // OBBLIGATORIO
      
      // Campi opzionali
      azienda: datiCliente.azienda,
      comune: datiCliente.comune,
      dipendenti: '10-50',
      servizi: ['Sito web', 'Server'],
      urgenza: 'normale',
      messaggio: datiCliente.messaggio,
      formType: 'preventivo'  // tipo: preventivo, contatto, supporto, etc.
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Email inviata!', result.ticketId);
    // Mostra messaggio di successo
  } else {
    console.error('Errore:', result.error);
    // Gestisci errore
  }
}
```

### 3. Integrazione con React/Next.js

```jsx
import { useState } from 'react';

function ContactForm() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefono: '',
    messaggio: '',
    privacy: false
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('https://it-era-email.bulltech.workers.dev/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStatus({ type: 'success', message: result.message, ticket: result.ticketId });
        setFormData({ nome: '', email: '', telefono: '', messaggio: '', privacy: false });
      } else {
        setStatus({ type: 'error', message: result.error });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Errore di connessione' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Invio...' : 'Invia Richiesta'}
      </button>
      
      {status && (
        <div className={`alert ${status.type}`}>
          {status.message}
          {status.ticket && <p>Ticket: {status.ticket}</p>}
        </div>
      )}
    </form>
  );
}
```

## 📊 Parametri API

### Request (POST /api/contact)

| Campo | Tipo | Obbligatorio | Descrizione | Validazione |
|-------|------|--------------|-------------|-------------|
| **nome** | string | ✅ | Nome completo | Min 2 caratteri |
| **email** | string | ✅ | Email valida | Formato email |
| **telefono** | string | ✅ | Numero telefono | Formato italiano |
| **privacy** | boolean | ✅ | Accettazione privacy | Deve essere true |
| azienda | string | ❌ | Nome azienda | Max 200 caratteri |
| comune | string | ❌ | Città/Comune | Max 100 caratteri |
| dipendenti | string | ❌ | Range dipendenti | es: "1-10", "10-50" |
| servizi | array | ❌ | Servizi richiesti | Array di stringhe |
| urgenza | string | ❌ | Livello urgenza | "normale" o "urgente" |
| messaggio | string | ❌ | Messaggio dettagliato | Max 1000 caratteri |
| formType | string | ❌ | Tipo form | Default: "preventivo" |

### Response

#### Successo (200)
```json
{
  "success": true,
  "message": "Richiesta inviata con successo! Ti contatteremo entro 2 ore lavorative.",
  "ticketId": "ITERA-1756039540740",
  "emailId": "ed5a9b71-4786-41e4-88f8-ee3a4d923e14",
  "usedFallback": false
}
```

#### Errore Validazione (400)
```json
{
  "success": false,
  "errors": [
    "Email valida richiesta",
    "Numero di telefono valido richiesto"
  ]
}
```

#### Rate Limit (429)
```json
{
  "success": false,
  "error": "Troppe richieste. Riprova domani."
}
```

## 🛡️ Sicurezza e Validazione

### Validazione Telefono Italiano
```javascript
// Formati accettati:
"+39 333 1234567"    ✅
"333 1234567"        ✅
"+393331234567"      ✅
"039 888 2041"       ✅
```

### Headers CORS Richiesti
```javascript
headers: {
  'Content-Type': 'application/json',
  'Origin': 'https://it-era.it' // o localhost per dev
}
```

### Domini Autorizzati
- `https://www.it-era.it`
- `https://it-era.it`
- `https://it-era.it`
- `http://localhost:3000`
- `http://localhost:8788`

## 🎨 Template Email

Il sistema invia email HTML professionali con:
- **Header** con logo IT-ERA e gradient
- **Tabella dati** strutturata con tutte le informazioni
- **Badge urgenza** colorato (rosso/verde)
- **Call-to-action** per risposta rapida
- **Footer** con dati aziendali

### Esempio Email Ricevuta
```
Da: IT-ERA <info@it-era.it>
A: andrea@bulltech.it
Oggetto: [IT-ERA] Preventivo - Mario Rossi

Dettagli Richiesta:
- Nome: Mario Rossi
- Email: mario@example.com
- Telefono: 333 1234567
- Azienda: Rossi SRL
- Comune: Milano
- Servizi: Sito web, Server
- Urgenza: NORMALE
- Messaggio: [contenuto messaggio]

[Bottone: Rispondi al Cliente]
```

## 🔍 Testing e Debug

### Test Health Check
```bash
curl https://it-era-email.bulltech.workers.dev/health
```

### Test Invio Email
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://it-era.it" \
  -d '{
    "nome": "Test Nome",
    "email": "test@example.com",
    "telefono": "333 1234567",
    "messaggio": "Test messaggio",
    "privacy": true
  }' \
  https://it-era-email.bulltech.workers.dev/api/contact
```

### Test con Script Completo
```bash
# Esegui test suite completa
./scripts/test-resend.sh
```

## ⚠️ Limiti e Considerazioni

### Piano Free Resend
- **100 email/giorno** (configurato 95 per sicurezza)
- **Rate limiting**: 50 richieste/ora per IP
- **Attachment**: Non supportati nel piano free
- **Tracking**: Email ID per ogni invio

### Quando Aggiornare al Piano Pro
- Volume > 90 email/giorno
- Necessità di allegati
- Analytics avanzate richieste
- Multiple domini sender

## 🚨 Troubleshooting

### Email Non Arrivano
1. **Controlla spam folder**
2. **Verifica destinatario**: `andrea@bulltech.it`
3. **Controlla logs**: `wrangler tail`
4. **Verifica API key**: `wrangler secret list`

### Errore "Maximum credits exceeded"
- Limite giornaliero raggiunto
- Attendi reset alle 00:00 UTC
- Considera upgrade piano

### Errore CORS
- Verifica Origin header
- Dominio deve essere in whitelist
- Per sviluppo usa `http://localhost:3000`

### Errore Validazione
- Nome minimo 2 caratteri
- Email formato valido
- Telefono formato italiano
- Privacy deve essere `true`

## 📈 Monitoring e Analytics

### KV Storage Metrics
- Contatore email giornaliero
- Rate limiting per IP
- Analytics per tipo form

### Cloudflare Analytics
- Response times
- Error rates
- Geographic distribution

### Ticket System
Ogni email genera un ticket univoco:
```
ITERA-[timestamp]
```
Usalo per tracking e riferimenti futuri.

## 🔧 Manutenzione

### Comandi Utili
```bash
# Deploy aggiornamenti
wrangler deploy

# Monitora logs real-time
wrangler tail

# Aggiorna API key
echo "NEW_KEY" | wrangler secret put RESEND_API_KEY

# Verifica configurazione
curl https://it-era-email.bulltech.workers.dev/health
```

### Backup Configurazione
La configurazione è salvata in:
- Cloudflare KV Storage
- Memory persistence
- File `contact-form-resend.js`

## 📞 Supporto

### Contatti Tecnici
- **Developer**: Andrea Panzeri
- **Email Sistema**: andrea@bulltech.it
- **Telefono**: 039 888 2041

### Risorse
- [Resend Dashboard](https://resend.com/overview)
- [Cloudflare Workers](https://dash.cloudflare.com)
- [Documentazione API](https://resend.com/docs)

## ✅ Checklist Integrazione

- [ ] Form HTML con campi richiesti
- [ ] JavaScript handler incluso
- [ ] Validazione client-side
- [ ] Gestione errori UI
- [ ] Test invio email
- [ ] Verifica ricezione
- [ ] Monitoring attivo

---

**Sistema Email IT-ERA - Versione 2.0**
*Ultimo aggiornamento: 24 Agosto 2025*
*Status: ✅ OPERATIVO*