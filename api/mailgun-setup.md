# Alternativa: Mailgun (100 email/giorno gratis per 3 mesi)

## Setup Rapido Mailgun

1. **Registrati su mailgun.com**
   - Piano Flex Free: 100 email/giorno per 3 mesi
   - Poi 1000 email gratis/mese

2. **Ottieni API Key:**
   - Dashboard → API Keys → Create API Key

3. **Aggiungi dominio:**
   - Domains → Add Domain → it-era.it

4. **Configura DNS:**
   - Aggiungi i record TXT e CNAME forniti

5. **Aggiorna Worker:**
```javascript
// Sostituisci l'URL SendGrid con:
const response = await fetch(`https://api.mailgun.net/v3/${DOMAIN}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa(`api:${env.MAILGUN_API_KEY}`),
  },
  body: new URLSearchParams({
    from: 'IT-ERA <info@it-era.it>',
    to: 'andrea@bulltech.it',
    subject: subject,
    html: htmlContent,
    text: textContent,
  }),
});
```

## Alternative Gratuite:

### Brevo (ex SendinBlue)
- **300 email/giorno gratis** (migliore di SendGrid!)
- Registrati su brevo.com
- API semplice

### Amazon SES
- **62,000 email/mese gratis** (se hai AWS)
- Pay as you go dopo: $0.10 per 1000 email

### Postmark
- **100 email/mese gratis**
- Ottima deliverability
- API moderna