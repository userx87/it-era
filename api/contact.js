/**
 * IT-ERA Contact Form Handler - Cloudflare Worker
 * Handles contact form submissions with Resend.com integration
 * 
 * Environment Variables Required:
 * - RESEND_API_KEY: Resend.com API key
 * - OWNER_EMAIL: Owner email (andrea@bulltech.it)
 * - FROM_EMAIL: From email address
 */

import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(RESEND_API_KEY);

// Configuration
const CONFIG = {
  ownerEmail: 'andrea@bulltech.it',
  fromEmail: 'noreply@it-era.it',
  companyName: 'IT-ERA',
  supportPhone: '039 888 2041',
  supportAddress: 'Viale Risorgimento 32, Vimercate MB',
};

/**
 * Generate unique ticket ID
 * Format: IT{timestamp}{random} (e.g., IT202501251A2B3C)
 */
function generateTicketId() {
  const now = new Date();
  const timestamp = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
  const random = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 chars
  return `IT${timestamp}${random}`;
}

/**
 * Validate form data
 */
function validateFormData(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Nome è obbligatorio (min 2 caratteri)');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email valida è obbligatoria');
  }
  
  if (data.phone && !/^[\d\s\+\-\(\)]+$/.test(data.phone)) {
    errors.push('Numero di telefono non valido');
  }
  
  if (!data.message || data.message.trim().length < 10) {
    errors.push('Messaggio è obbligatorio (min 10 caratteri)');
  }
  
  if (!data.privacy_accepted) {
    errors.push('Accettazione privacy policy è obbligatoria');
  }
  
  return errors;
}

/**
 * Create owner notification email content
 */
function createOwnerNotificationEmail(data, ticketId) {
  const subject = `Nuovo contatto IT-ERA #${ticketId}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0056cc; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #555; }
        .value { background: white; padding: 8px; border-left: 3px solid #0056cc; }
        .ticket { background: #e8f4f8; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
        .urgent { color: #dc3545; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎫 Nuovo Contatto IT-ERA</h1>
        </div>
        
        <div class="ticket">
          <h2>Ticket ID: <span style="color: #0056cc;">${ticketId}</span></h2>
          <p><strong>Data/Ora:</strong> ${new Date().toLocaleString('it-IT')}</p>
        </div>
        
        <div class="content">
          <div class="field">
            <div class="label">👤 Nome:</div>
            <div class="value">${data.name}</div>
          </div>
          
          <div class="field">
            <div class="label">📧 Email:</div>
            <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
          </div>
          
          ${data.phone ? `
          <div class="field">
            <div class="label">📞 Telefono:</div>
            <div class="value"><a href="tel:${data.phone}">${data.phone}</a></div>
          </div>
          ` : ''}
          
          ${data.city ? `
          <div class="field">
            <div class="label">🏙️ Città:</div>
            <div class="value">${data.city}</div>
          </div>
          ` : ''}
          
          ${data.service ? `
          <div class="field">
            <div class="label">🔧 Servizio:</div>
            <div class="value">${data.service}</div>
          </div>
          ` : ''}
          
          <div class="field">
            <div class="label">💬 Messaggio:</div>
            <div class="value">${data.message.replace(/\n/g, '<br>')}</div>
          </div>
          
          <div class="field">
            <div class="label">🔗 Pagina Sorgente:</div>
            <div class="value"><a href="https://it-era.it${data.src || ''}">${data.src || 'Non specificata'}</a></div>
          </div>
          
          <div class="field">
            <div class="label">🌐 User Agent:</div>
            <div class="value" style="font-size: 12px; color: #666;">${data.user_agent || 'N/A'}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Nuovo contatto IT-ERA - Ticket #${ticketId}

Nome: ${data.name}
Email: ${data.email}
${data.phone ? `Telefono: ${data.phone}` : ''}
${data.city ? `Città: ${data.city}` : ''}
${data.service ? `Servizio: ${data.service}` : ''}

Messaggio:
${data.message}

Pagina sorgente: ${data.src || 'Non specificata'}
Data/Ora: ${new Date().toLocaleString('it-IT')}
  `;
  
  return { subject, html, text };
}

/**
 * Create customer confirmation email content
 */
function createCustomerConfirmationEmail(data, ticketId) {
  const subject = `Conferma richiesta IT-ERA #${ticketId}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0056cc; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .ticket { background: #e8f4f8; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
        .next-steps { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .contact-info { background: #0056cc; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Richiesta Ricevuta</h1>
          <p>Grazie per aver contattato IT-ERA</p>
        </div>
        
        <div class="content">
          <p>Gentile <strong>${data.name}</strong>,</p>
          
          <p>Abbiamo ricevuto la tua richiesta e ti ricontatteremo il prima possibile.</p>
          
          <div class="ticket">
            <h2>Il tuo ticket ID è: <span style="color: #0056cc;">${ticketId}</span></h2>
            <p>Conserva questo numero per future comunicazioni</p>
          </div>
          
          <div class="next-steps">
            <h3>🚀 Prossimi Passi:</h3>
            <ul>
              <li><strong>Entro 2 ore:</strong> Riceverai una chiamata o email di conferma</li>
              <li><strong>Entro 24 ore:</strong> Analisi dettagliata della tua richiesta</li>
              <li><strong>Entro 48 ore:</strong> Proposta personalizzata (se applicabile)</li>
            </ul>
          </div>
          
          <div class="contact-info">
            <h3>📞 Contatti Diretti:</h3>
            <p><strong>Telefono:</strong> ${CONFIG.supportPhone}</p>
            <p><strong>Email:</strong> ${CONFIG.ownerEmail}</p>
            <p><strong>Indirizzo:</strong> ${CONFIG.supportAddress}</p>
          </div>
          
          <p><strong>Riepilogo della tua richiesta:</strong></p>
          <ul>
            <li><strong>Servizio:</strong> ${data.service || 'Informazioni generali'}</li>
            ${data.city ? `<li><strong>Città:</strong> ${data.city}</li>` : ''}
            <li><strong>Messaggio:</strong> ${data.message}</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>© 2024 IT-ERA - Assistenza Informatica Professionale</p>
          <p>Questo messaggio è stato generato automaticamente. Per assistenza immediata chiama il ${CONFIG.supportPhone}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Grazie per aver contattato IT-ERA!

Gentile ${data.name},

Abbiamo ricevuto la tua richiesta con ticket ID: ${ticketId}

PROSSIMI PASSI:
- Entro 2 ore: Chiamata o email di conferma
- Entro 24 ore: Analisi dettagliata
- Entro 48 ore: Proposta personalizzata

CONTATTI DIRETTI:
Telefono: ${CONFIG.supportPhone}
Email: ${CONFIG.ownerEmail}
Indirizzo: ${CONFIG.supportAddress}

RIEPILOGO RICHIESTA:
Servizio: ${data.service || 'Informazioni generali'}
${data.city ? `Città: ${data.city}` : ''}
Messaggio: ${data.message}

Conserva il ticket ID ${ticketId} per future comunicazioni.

© 2024 IT-ERA - Assistenza Informatica Professionale
  `;
  
  return { subject, html, text };
}

/**
 * Log contact to JSON (for analytics/history)
 */
async function logContact(data, ticketId, env) {
  const logEntry = {
    ticketId,
    timestamp: new Date().toISOString(),
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    city: data.city || null,
    service: data.service || null,
    source: data.src || null,
    message: data.message,
    userAgent: data.user_agent || null,
    ip: data.ip || null
  };
  
  // Store in KV or send to external logging service
  try {
    if (env.CONTACT_LOG) {
      const existingLog = await env.CONTACT_LOG.get('contacts', 'json') || [];
      existingLog.push(logEntry);
      
      // Keep only last 1000 entries
      if (existingLog.length > 1000) {
        existingLog.splice(0, existingLog.length - 1000);
      }
      
      await env.CONTACT_LOG.put('contacts', JSON.stringify(existingLog));
    }
  } catch (error) {
    console.error('Failed to log contact:', error);
  }
}

/**
 * Handle CORS preflight
 */
function handleCORS(request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}

/**
 * Main handler
 */
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }
    
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Method not allowed' 
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    try {
      // Parse form data
      const formData = await request.formData();
      const data = {
        name: formData.get('name')?.trim(),
        email: formData.get('email')?.trim().toLowerCase(),
        phone: formData.get('phone')?.trim(),
        city: formData.get('city')?.trim(),
        service: formData.get('service')?.trim(),
        message: formData.get('message')?.trim(),
        src: formData.get('src')?.trim(),
        privacy_accepted: formData.get('privacy_accepted') === 'on',
        user_agent: request.headers.get('User-Agent'),
        ip: request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')
      };
      
      // Validate data
      const validationErrors = validateFormData(data);
      if (validationErrors.length > 0) {
        return new Response(JSON.stringify({
          ok: false,
          errors: validationErrors
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }
      
      // Generate ticket ID
      const ticketId = generateTicketId();
      
      // Initialize Resend with environment variable
      const resendClient = new Resend(env.RESEND_API_KEY);
      
      // Create email contents
      const ownerEmail = createOwnerNotificationEmail(data, ticketId);
      const customerEmail = createCustomerConfirmationEmail(data, ticketId);
      
      // Send emails in parallel
      const [ownerResult, customerResult] = await Promise.allSettled([
        // Owner notification
        resendClient.emails.send({
          from: env.FROM_EMAIL || CONFIG.fromEmail,
          to: env.OWNER_EMAIL || CONFIG.ownerEmail,
          subject: ownerEmail.subject,
          html: ownerEmail.html,
          text: ownerEmail.text,
        }),
        
        // Customer confirmation
        resendClient.emails.send({
          from: env.FROM_EMAIL || CONFIG.fromEmail,
          to: data.email,
          subject: customerEmail.subject,
          html: customerEmail.html,
          text: customerEmail.text,
        })
      ]);
      
      // Log contact (don't fail if logging fails)
      ctx.waitUntil(logContact(data, ticketId, env));
      
      // Check if emails were sent successfully
      const ownerEmailSuccess = ownerResult.status === 'fulfilled';
      const customerEmailSuccess = customerResult.status === 'fulfilled';
      
      if (!ownerEmailSuccess || !customerEmailSuccess) {
        console.error('Email sending failed:', {
          owner: ownerResult,
          customer: customerResult
        });
        
        return new Response(JSON.stringify({
          ok: false,
          error: 'Errore nell\'invio delle email. Riprova tra qualche minuto.',
          ticketId // Include ticket ID even if emails failed
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }
      
      // Success response
      return new Response(JSON.stringify({
        ok: true,
        ticketId,
        message: 'Richiesta inviata con successo!'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
      
    } catch (error) {
      console.error('Contact form error:', error);
      
      return new Response(JSON.stringify({
        ok: false,
        error: 'Errore interno del server. Riprova tra qualche minuto.'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
};