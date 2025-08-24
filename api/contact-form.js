/**
 * Cloudflare Worker - API Gestione Form Contatti IT-ERA
 * Gestisce invio form, validazione, email e salvataggio su KV/D1
 */

// Configurazione
const CONFIG = {
  // Email settings
  EMAIL_TO: 'andrea@bulltech.it',  // Destinatario principale
  EMAIL_FROM: 'info@it-era.it', // Usa l'email verificata su SendGrid
  EMAIL_SUBJECT_PREFIX: '[IT-ERA]',
  EMAIL_CC: '', // Copia per backup (disabilitata per ora)
  
  // Rate limiting
  RATE_LIMIT_REQUESTS: 100, // Aumentato per test
  RATE_LIMIT_WINDOW: 3600, // 1 ora in secondi
  
  // CORS
  ALLOWED_ORIGINS: [
    'https://www.it-era.it',
    'https://it-era.it',
    'https://it-era.pages.dev',
    'http://localhost:8788',
    'http://localhost:3000'
  ],
  
  // Telegram notifications (optional)
  TELEGRAM_BOT_TOKEN: '', // Inserisci token bot
  TELEGRAM_CHAT_ID: '', // Inserisci chat ID
};

// Headers CORS
const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
});

// Validazione email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validazione telefono italiano
function isValidPhone(phone) {
  const phoneRegex = /^(\+39)?[\s]?[0-9]{3,4}[\s]?[0-9]{6,7}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Sanitizzazione input
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 1000); // Max 1000 caratteri
}

// Rate limiting usando Cloudflare KV
async function checkRateLimit(ip, KV) {
  const key = `ratelimit:${ip}`;
  const current = await KV.get(key);
  
  if (current) {
    const count = parseInt(current);
    if (count >= CONFIG.RATE_LIMIT_REQUESTS) {
      return false;
    }
    await KV.put(key, String(count + 1), { expirationTtl: CONFIG.RATE_LIMIT_WINDOW });
  } else {
    await KV.put(key, '1', { expirationTtl: CONFIG.RATE_LIMIT_WINDOW });
  }
  
  return true;
}

// Invio email usando SendGrid
async function sendEmail(data, env) {
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">Nuova richiesta dal sito IT-ERA</h2>
      </div>
      <div style="background: #f7f7f7; padding: 20px;">
        <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; font-weight: bold; color: #333; width: 30%;">Nome:</td>
            <td style="padding: 12px; color: #666;">${data.nome}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; font-weight: bold; color: #333;">Azienda:</td>
            <td style="padding: 12px; color: #666;">${data.azienda || 'Non specificata'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; font-weight: bold; color: #333;">Email:</td>
            <td style="padding: 12px; color: #666;"><a href="mailto:${data.email}" style="color: #667eea;">${data.email}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; font-weight: bold; color: #333;">Telefono:</td>
            <td style="padding: 12px; color: #666;"><a href="tel:${data.telefono}" style="color: #667eea;">${data.telefono}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; font-weight: bold; color: #333;">Comune:</td>
            <td style="padding: 12px; color: #666;">${data.comune || 'Non specificato'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; font-weight: bold; color: #333;">Dipendenti:</td>
            <td style="padding: 12px; color: #666;">${data.dipendenti || 'Non specificato'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; font-weight: bold; color: #333;">Servizi:</td>
            <td style="padding: 12px; color: #666;">${data.servizi ? data.servizi.join(', ') : 'Nessuno'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; font-weight: bold; color: #333;">Urgenza:</td>
            <td style="padding: 12px; color: #666;">
              <span style="padding: 4px 8px; border-radius: 4px; background: ${data.urgenza === 'urgente' ? '#ff4444' : '#4CAF50'}; color: white;">
                ${data.urgenza || 'Normale'}
              </span>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; font-weight: bold; color: #333;">Messaggio:</td>
            <td style="padding: 12px; color: #666;">${data.messaggio || 'Nessun messaggio'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; font-weight: bold; color: #333;">Tipo Form:</td>
            <td style="padding: 12px; color: #666;">${data.formType || 'Preventivo'}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #333;">Data/Ora:</td>
            <td style="padding: 12px; color: #666;">${new Date().toLocaleString('it-IT')}</td>
          </tr>
        </table>
      </div>
      <div style="background: #667eea; padding: 15px; text-align: center;">
        <p style="color: white; margin: 0; font-size: 14px;">
          IT-ERA - Servizi IT Professionali | Lombardia
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_SMTP_PASSWORD || env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: CONFIG.EMAIL_TO }],
          cc: [
            ...(CONFIG.EMAIL_CC ? [{ email: CONFIG.EMAIL_CC }] : []),
            ...(data.sendCopy && data.email ? [{ email: data.email }] : [])
          ].filter(Boolean).length > 0 ? [
            ...(CONFIG.EMAIL_CC ? [{ email: CONFIG.EMAIL_CC }] : []),
            ...(data.sendCopy && data.email ? [{ email: data.email }] : [])
          ] : undefined,
        }],
        from: { 
          email: CONFIG.EMAIL_FROM,
          name: 'IT-ERA Sistema Notifiche'
        },
        reply_to: {
          email: data.email,
          name: data.nome
        },
        subject: `${CONFIG.EMAIL_SUBJECT_PREFIX} ${data.formType || 'Richiesta'} - ${data.nome}`,
        content: [{
          type: 'text/html',
          value: emailContent,
        }],
        tracking_settings: {
          click_tracking: { enable: false },
          open_tracking: { enable: false },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SendGrid error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

// Notifica Telegram (opzionale)
async function sendTelegramNotification(data) {
  if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) return;

  const message = `
🔔 *Nuova richiesta IT-ERA*

👤 *Nome:* ${data.nome}
🏢 *Azienda:* ${data.azienda || 'N/D'}
📧 *Email:* ${data.email}
📱 *Telefono:* ${data.telefono}
📍 *Comune:* ${data.comune || 'N/D'}
🎯 *Servizi:* ${data.servizi ? data.servizi.join(', ') : 'N/D'}
⚡ *Urgenza:* ${data.urgenza || 'Normale'}

💬 *Messaggio:*
${data.messaggio || 'Nessun messaggio'}
  `;

  try {
    await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
  } catch (error) {
    console.error('Errore invio Telegram:', error);
  }
}

// Salvataggio su database (Cloudflare D1)
async function saveToDatabase(data, DB) {
  try {
    const query = `
      INSERT INTO contacts (
        nome, azienda, email, telefono, comune, dipendenti,
        servizi, urgenza, messaggio, form_type, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await DB.prepare(query).bind(
      data.nome,
      data.azienda || null,
      data.email,
      data.telefono,
      data.comune || null,
      data.dipendenti || null,
      JSON.stringify(data.servizi || []),
      data.urgenza || 'normale',
      data.messaggio || null,
      data.formType || 'preventivo',
      data.ipAddress,
      new Date().toISOString()
    ).run();
    
    return true;
  } catch (error) {
    console.error('Errore database:', error);
    return false;
  }
}

// Handler principale
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // Gestione OPTIONS per CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(origin),
      });
    }

    // Solo POST su /api/contact
    if (request.method !== 'POST' || url.pathname !== '/api/contact') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders(origin),
      });
    }

    try {
      // Get client IP
      const ip = request.headers.get('CF-Connecting-IP') || 
                 request.headers.get('X-Forwarded-For') || 
                 'unknown';

      // Rate limiting
      if (env.CONTACT_KV) {
        const canProceed = await checkRateLimit(ip, env.CONTACT_KV);
        if (!canProceed) {
          return new Response(JSON.stringify({ 
            error: 'Troppe richieste. Riprova tra un\'ora.' 
          }), {
            status: 429,
            headers: corsHeaders(origin),
          });
        }
      }

      // Parse body
      const data = await request.json();

      // Validazione campi obbligatori
      const errors = [];
      
      if (!data.nome || data.nome.length < 2) {
        errors.push('Nome richiesto (minimo 2 caratteri)');
      }
      
      if (!data.email || !isValidEmail(data.email)) {
        errors.push('Email valida richiesta');
      }
      
      if (!data.telefono || !isValidPhone(data.telefono)) {
        errors.push('Numero di telefono valido richiesto');
      }
      
      if (!data.privacy) {
        errors.push('Accettazione privacy richiesta');
      }

      if (errors.length > 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          errors 
        }), {
          status: 400,
          headers: corsHeaders(origin),
        });
      }

      // Sanitizza tutti gli input
      const sanitizedData = {
        nome: sanitizeInput(data.nome),
        azienda: sanitizeInput(data.azienda),
        email: sanitizeInput(data.email),
        telefono: sanitizeInput(data.telefono),
        comune: sanitizeInput(data.comune),
        dipendenti: sanitizeInput(data.dipendenti),
        servizi: Array.isArray(data.servizi) ? data.servizi.map(s => sanitizeInput(s)) : [],
        urgenza: sanitizeInput(data.urgenza),
        messaggio: sanitizeInput(data.messaggio),
        formType: sanitizeInput(data.formType || 'preventivo'),
        ipAddress: ip,
      };

      // Salva su database se disponibile
      if (env.CONTACT_DB) {
        await saveToDatabase(sanitizedData, env.CONTACT_DB);
      }

      // Invia email
      const emailSent = await sendEmail(sanitizedData, env);
      if (!emailSent) {
        throw new Error('Failed to send email');
      }

      // Invia notifica Telegram
      await sendTelegramNotification(sanitizedData);

      // Log per analytics
      if (env.ANALYTICS_KV) {
        const today = new Date().toISOString().split('T')[0];
        const analyticsKey = `leads:${today}`;
        const currentCount = await env.ANALYTICS_KV.get(analyticsKey) || '0';
        await env.ANALYTICS_KV.put(analyticsKey, String(parseInt(currentCount) + 1), {
          expirationTtl: 86400 * 30 // 30 giorni
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Richiesta inviata con successo! Ti contatteremo entro 2 ore lavorative.',
        ticketId: `ITERA-${Date.now()}`, // ID ticket per tracking
      }), {
        status: 200,
        headers: corsHeaders(origin),
      });

    } catch (error) {
      console.error('Errore:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Errore durante l\'invio. Riprova o contattaci telefonicamente.',
      }), {
        status: 500,
        headers: corsHeaders(origin),
      });
    }
  },
};
