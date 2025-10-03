# 📧 Guida Integrazione Form di Contatto Universale

## 🎯 Obiettivo
Tutti i form di contatto del sito (in tutti i branch e pagine) usano lo stesso sistema centralizzato.

## ⚡ Quick Start

### 1. Aggiungi lo script alla pagina HTML

```html
<!-- Alla fine del body, prima della chiusura </body> -->
<script src="/js/contact-form-universal.js"></script>
```

### 2. Usa la classe CSS nel form

```html
<form class="universal-contact-form" data-service="Consulenza IT" data-urgency="medium">
    <input type="text" name="name" required placeholder="Nome *">
    <input type="email" name="email" required placeholder="Email *">
    <input type="tel" name="phone" placeholder="Telefono">
    <input type="text" name="company" placeholder="Azienda">
    <textarea name="message" required placeholder="Messaggio *"></textarea>
    <button type="submit">Invia Richiesta</button>
</form>
```

## 📋 Parametri Form

### Campi Input (name attributes)
| Campo | Required | Nome campo | Alternative |
|-------|----------|------------|-------------|
| Nome | ✅ | `name` | - |
| Email | ✅ | `email` | - |
| Telefono | ❌ | `phone` | `telefono` |
| Azienda | ❌ | `company` | `azienda` |
| Messaggio | ✅ | `message` | `messaggio` |

### Attributi Data (opzionali)
- `data-service` - Nome del servizio (es: "Consulenza IT", "Assistenza", "Preventivo")
- `data-urgency` - Livello urgenza: `low`, `medium`, `high`, `emergency`

## 🎨 Esempi di Utilizzo

### Form Base
```html
<form class="universal-contact-form">
    <input type="text" name="name" required>
    <input type="email" name="email" required>
    <textarea name="message" required></textarea>
    <button type="submit">Invia</button>
</form>
<script src="/js/contact-form-universal.js"></script>
```

### Form Completo con Servizio
```html
<form class="universal-contact-form" data-service="Cloud Computing" data-urgency="high">
    <input type="text" name="name" required placeholder="Nome e Cognome *">
    <input type="email" name="email" required placeholder="Email aziendale *">
    <input type="tel" name="phone" placeholder="Telefono">
    <input type="text" name="company" placeholder="Nome Azienda">
    <select name="service">
        <option value="Cloud AWS">Cloud AWS</option>
        <option value="Cloud Azure">Cloud Azure</option>
        <option value="Cloud Google">Cloud Google</option>
    </select>
    <textarea name="message" required placeholder="Descrivi la tua esigenza *"></textarea>
    <button type="submit">Richiedi Preventivo</button>
</form>
<script src="/js/contact-form-universal.js"></script>
```

### Form Emergenza
```html
<form class="universal-contact-form" data-service="Assistenza Urgente" data-urgency="emergency">
    <input type="text" name="name" required>
    <input type="email" name="email" required>
    <input type="tel" name="phone" required>
    <textarea name="message" required placeholder="Descrivi l'urgenza *"></textarea>
    <button type="submit" style="background: #dc3545;">🚨 Invia Richiesta Urgente</button>
</form>
<script src="/js/contact-form-universal.js"></script>
```

## 🔧 Configurazione Email

### Backend (API Route)
- **File**: `pages/api/contact.ts`
- **FROM**: `info@it-era.it` (dominio verificato su Resend)
- **TO**: `info@bulltech.it` (destinazione principale)
- **TO Emergency**: `info@bulltech.it` + `emergenze@bulltech.it`

### Logica Routing Email
```javascript
if (urgency === 'emergency') {
    // Invia a: info@bulltech.it + emergenze@bulltech.it
} else {
    // Invia a: info@bulltech.it
}
```

## ✅ Vantaggi Soluzione Centralizzata

1. **✨ Un solo file da mantenere** - `contact-form-universal.js`
2. **🔄 Aggiornamenti istantanei** - Modifica una volta, funziona ovunque
3. **📊 Tracking centralizzato** - Google Analytics integrato
4. **🎯 Validazione consistente** - Stessa logica su tutte le pagine
5. **🚀 Performance** - Script cacheable, caricato una volta
6. **🔒 Sicurezza** - Validazione client + server
7. **📱 Responsive** - Funziona su mobile/desktop

## 🔍 Testing

### Test Manuale
```bash
# 1. Avvia il server di sviluppo
npm run dev

# 2. Apri una pagina con form
open http://localhost:3000/contatti.html

# 3. Compila e invia il form
# 4. Controlla console browser (F12)
# 5. Verifica email ricevuta su info@bulltech.it
```

### Test Automatico
```bash
# Test API endpoint
node scripts/test-contact-form.js

# Test tutte le pagine con form
node scripts/test-all-contact-forms.js
```

## 📝 Personalizzazione Stili

### CSS Base
```css
.universal-contact-form {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}

.universal-contact-form input,
.universal-contact-form textarea {
    width: 100%;
    padding: 12px;
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.universal-contact-form button[type="submit"] {
    background: #007bff;
    color: white;
    padding: 12px 30px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.form-message-success {
    /* Automatico dallo script */
}
```

## 🔄 Migrazione Pagine Esistenti

### Prima (vecchio sistema)
```html
<form id="contact-form" action="/api/contact" method="POST">
    <!-- campi form -->
    <script>
        document.getElementById('contact-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            // logica custom duplicata in ogni pagina...
        });
    </script>
</form>
```

### Dopo (sistema universale)
```html
<form class="universal-contact-form" data-service="Servizio XYZ">
    <!-- campi form -->
</form>
<script src="/js/contact-form-universal.js"></script>
```

**Risparmio**: 50-100 righe di codice per pagina!

## 🌐 Compatibilità Branch

Questo sistema funziona su **TUTTI i branch**:
- ✅ main / production
- ✅ feature/* branches
- ✅ settore-* branches
- ✅ fix/* branches

**Non serve modificare ogni branch** - basta includere lo script!

## 📊 Analytics Integration

Il form invia automaticamente eventi a Google Analytics:

```javascript
gtag('event', 'form_submit', {
    event_category: 'Contact',
    event_label: 'Nome Servizio',
    value: 1
});
```

## 🚨 Troubleshooting

### Form non funziona
1. Controlla console browser (F12) per errori
2. Verifica che lo script sia caricato: `contact-form-universal.js`
3. Controlla che il form abbia classe `universal-contact-form`
4. Verifica campi required: `name`, `email`, `message`

### Email non arrivano
1. Test API: `node scripts/test-contact-form.js`
2. Controlla Resend dashboard: https://resend.com/emails
3. Verifica dominio it-era.it sia verificato
4. Controlla spam folder di info@bulltech.it

### Validazione non funziona
1. Aggiungi attributo `required` ai campi obbligatori
2. Usa `type="email"` per email
3. Usa `type="tel"` per telefono

## 🔐 Sicurezza

- ✅ Validazione client-side (UX)
- ✅ Validazione server-side (Sicurezza)
- ✅ Sanitizzazione input
- ✅ Rate limiting API
- ✅ HTTPS obbligatorio in produzione

## 📚 Risorse

- [Resend Dashboard](https://resend.com/emails)
- [Script Test](../scripts/test-contact-form.js)
- [API Route](../pages/api/contact.ts)
- [Script Universale](../public/js/contact-form-universal.js)

---

**Aggiornato**: 2025-10-03
**Versione**: 1.0.0
**Status**: ✅ Production Ready
