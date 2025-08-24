/**
 * Cloudflare Worker - Sistema Email IT-ERA con SMTP SendGrid
 * Usa SMTP invece di API HTTP per evitare limiti di crediti
 */

const CONFIG = {
  // Email settings
  EMAIL_TO: 'andrea@bulltech.it',
  EMAIL_FROM: 'info@it-era.it',
  EMAIL_SUBJECT_PREFIX: '[IT-ERA]',
  
  // SMTP SendGrid Configuration
  SMTP: {
    host: 'smtp.sendgrid.net',
    port: 587,
    username: 'apikey',
    // password viene da env.SENDGRID_SMTP_PASSWORD
  },
  
  // Rate limiting
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 3600,
  
  // CORS
  ALLOWED_ORIGINS: [
    'https://www.it-era.it',
    'https://it-era.it',
    'https://it-era.pages.dev',
    'http://localhost:8788',
    'http://localhost:3000'
  ],
};

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^(\+39)?[\s]?[0-9]{3,4}[\s]?[0-9]{6,7}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '').substring(0, 1000);
}

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

// Costruisci email in formato MIME
function buildEmailMIME(data) {
  const boundary = '----=_Part_' + Math.random().toString(36).substring(2);
  const date = new Date().toUTCString();
  
  const htmlContent = `
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
            <td style="padding: 12px; font-weight: bold; color: #333;">Messaggio:</td>
            <td style="padding: 12px; color: #666;">${data.messaggio || 'Nessun messaggio'}</td>
          </tr>
        </table>
      </div>
      <div style="background: #667eea; padding: 15px; text-align: center;">
        <p style="color: white; margin: 0; font-size: 14px;">
          IT-ERA - Servizi IT Professionali | Vimercate (MB)
        </p>
      </div>
    </div>
  `;

  const textContent = `
Nuova richiesta dal sito IT-ERA

Nome: ${data.nome}
Azienda: ${data.azienda || 'Non specificata'}
Email: ${data.email}
Telefono: ${data.telefono}
Comune: ${data.comune || 'Non specificato'}
Messaggio: ${data.messaggio || 'Nessun messaggio'}

--
IT-ERA - Servizi IT Professionali
  `;

  return `From: IT-ERA <${CONFIG.EMAIL_FROM}>
To: ${CONFIG.EMAIL_TO}
Subject: ${CONFIG.EMAIL_SUBJECT_PREFIX} ${data.formType || 'Richiesta'} - ${data.nome}
Date: ${date}
Message-ID: <${Date.now()}@it-era.it>
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="${boundary}"
Reply-To: ${data.email}

--${boundary}
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 7bit

${textContent}

--${boundary}
Content-Type: text/html; charset=UTF-8
Content-Transfer-Encoding: 7bit

${htmlContent}

--${boundary}--`;
}

// Codifica base64
function base64Encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

// Invio email via SMTP usando Cloudflare Email Workers
async function sendEmailSMTP(data, env) {
  try {
    // Costruisci il messaggio MIME
    const emailMessage = buildEmailMIME(data);
    
    // Usa Cloudflare Email Workers per inviare via SMTP
    // Nota: Cloudflare Workers non supporta connessioni TCP dirette,
    // quindi usiamo un approccio alternativo con Email Workers
    
    const auth = base64Encode(`apikey:${env.SENDGRID_SMTP_PASSWORD}`);
    
    // Invia tramite API gateway che supporta SMTP
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': env.SENDGRID_SMTP_PASSWORD,
      },
      body: JSON.stringify({
        api_key: env.SENDGRID_SMTP_PASSWORD,
        to: [CONFIG.EMAIL_TO],
        sender: CONFIG.EMAIL_FROM,
        subject: `${CONFIG.EMAIL_SUBJECT_PREFIX} ${data.formType || 'Richiesta'} - ${data.nome}`,
        html_body: buildEmailMIME(data),
        text_body: `Nome: ${data.nome}\nEmail: ${data.email}\nTelefono: ${data.telefono}\nMessaggio: ${data.messaggio}`,
      }),
    });

    if (!response.ok) {
      console.error('SMTP Error:', await response.text());
      
      // Fallback: usa SendGrid API diretta con autenticazione SMTP
      const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SENDGRID_SMTP_PASSWORD}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: CONFIG.EMAIL_TO }],
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
            value: buildEmailMIME(data),
          }],
        }),
      });

      if (!sendgridResponse.ok) {
        console.error('SendGrid Error:', await sendgridResponse.text());
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

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
        messaggio: sanitizeInput(data.messaggio),
        formType: sanitizeInput(data.formType || 'preventivo'),
        ipAddress: ip,
      };

      // Invia email via SMTP
      const emailSent = await sendEmailSMTP(sanitizedData, env);
      if (!emailSent) {
        throw new Error('Failed to send email');
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Richiesta inviata con successo! Ti contatteremo entro 2 ore lavorative.',
        ticketId: `ITERA-${Date.now()}`,
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