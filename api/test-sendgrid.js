// Test diretto SendGrid senza Cloudflare Worker
const sgMail = require('@sendgrid/mail');

// Configura API key (nuova)
sgMail.setApiKey('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');

const msg = {
  to: 'andrea@bulltech.it',
  from: 'info@it-era.it', // Assicurati che sia verificato su SendGrid
  subject: 'Test SendGrid IT-ERA',
  text: 'Test invio email con SendGrid',
  html: '<strong>Test invio email con SendGrid per IT-ERA</strong>',
};

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Email inviata con successo!');
  })
  .catch((error) => {
    console.error('❌ Errore:', error);
    if (error.response) {
      console.error('Dettagli errore:', error.response.body);
    }
  });