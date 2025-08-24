/**
 * Cloudflare Worker - Sistema Email IT-ERA con Resend
 * Documentazione: https://resend.com/docs/send-with-nodejs
 */

const CONFIG = {
  // Email settings
  EMAIL_TO: 'andrea@bulltech.it',
  EMAIL_TO_TEST: 'codeagent087@gmail.com', // Per test mode Resend (temporaneo)
  EMAIL_FROM: 'info@it-era.it', // Usare dopo verifica dominio
  EMAIL_FROM_FALLBACK: 'onboarding@resend.dev', // Fallback se dominio non verificato
  EMAIL_FROM_NAME: 'IT-ERA',
  EMAIL_REPLY_TO: 'info@it-era.it',
  EMAIL_SUBJECT_PREFIX: '[IT-ERA]',
  
  // Rate limiting
  RATE_LIMIT_REQUESTS: 95, // Resend free: 100/giorno, lasciamo margine
  RATE_LIMIT_WINDOW: 86400, // 24 ore in secondi
  
  // CORS
  ALLOWED_ORIGINS: [
    'https://www.it-era.it',
    'https://it-era.it',
    'https://it-era.pages.dev',
    'http://localhost:8788',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
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
  if (!KV) return true; // Se KV non è configurato, permetti sempre
  
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

// Invio email con Resend API
async function sendEmailResend(data, env) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
        IT-ERA
      </h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
        Nuova richiesta dal sito web
      </p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <h2 style="color: #333; font-size: 20px; margin-bottom: 20px;">Dettagli Richiesta</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666; width: 35%;">
            <strong>Nome:</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">
            ${data.nome}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">
            <strong>Email:</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <a href="mailto:${data.email}" style="color: #667eea; text-decoration: none;">
              ${data.email}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">
            <strong>Telefono:</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <a href="tel:${data.telefono}" style="color: #667eea; text-decoration: none;">
              ${data.telefono}
            </a>
          </td>
        </tr>
        ${data.azienda ? `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">
            <strong>Azienda:</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">
            ${data.azienda}
          </td>
        </tr>
        ` : ''}
        ${data.comune ? `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">
            <strong>Comune:</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">
            ${data.comune}
          </td>
        </tr>
        ` : ''}
        ${data.servizi && data.servizi.length > 0 ? `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">
            <strong>Servizi:</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">
            ${data.servizi.join(', ')}
          </td>
        </tr>
        ` : ''}
        ${data.urgenza ? `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">
            <strong>Urgenza:</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; background-color: ${data.urgenza === 'urgente' ? '#ff4444' : '#4CAF50'}; color: white;">
              ${data.urgenza.toUpperCase()}
            </span>
          </td>
        </tr>
        ` : ''}
        ${data.messaggio ? `
        <tr>
          <td style="padding: 12px; color: #666; vertical-align: top;">
            <strong>Messaggio:</strong>
          </td>
          <td style="padding: 12px; color: #333;">
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; white-space: pre-wrap;">
              ${data.messaggio}
            </div>
          </td>
        </tr>
        ` : ''}
      </table>
      
      <!-- CTA -->
      <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">
          Rispondi direttamente a questa email o contatta il cliente:
        </p>
        <a href="mailto:${data.email}" style="display: inline-block; padding: 12px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 25px; font-weight: 600;">
          Rispondi al Cliente
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px; margin: 0;">
        IT-ERA - Servizi IT Professionali<br>
        Viale Risorgimento 32, Vimercate (MB)<br>
        Tel: 039 888 2041 | P.IVA: 10524040966
      </p>
      <p style="color: #999; font-size: 11px; margin: 10px 0 0 0;">
        Questa email è stata inviata dal sistema automatico del sito web IT-ERA
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
Nuova richiesta dal sito IT-ERA

DETTAGLI RICHIESTA
------------------
Nome: ${data.nome}
Email: ${data.email}
Telefono: ${data.telefono}
${data.azienda ? `Azienda: ${data.azienda}` : ''}
${data.comune ? `Comune: ${data.comune}` : ''}
${data.servizi && data.servizi.length > 0 ? `Servizi: ${data.servizi.join(', ')}` : ''}
${data.urgenza ? `Urgenza: ${data.urgenza}` : ''}
${data.messaggio ? `\nMessaggio:\n${data.messaggio}` : ''}

--
IT-ERA - Servizi IT Professionali
Viale Risorgimento 32, Vimercate (MB)
Tel: 039 888 2041 | P.IVA: 10524040966
  `;

  try {
    // Prima prova con dominio verificato info@it-era.it
    let emailFrom = `${CONFIG.EMAIL_FROM_NAME} <${CONFIG.EMAIL_FROM}>`;
    let emailTo = CONFIG.EMAIL_TO;
    let usedFallback = false;
    
    // Primo tentativo con configurazione principale
    let response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [emailTo],
        reply_to: data.email, // Rispondi direttamente al cliente
        subject: `${CONFIG.EMAIL_SUBJECT_PREFIX} ${data.formType || 'Richiesta'} - ${data.nome}`,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'source', value: 'website' },
          { name: 'type', value: data.formType || 'contact' }
        ]
      }),
    });
    
    // Se fallisce per dominio non verificato, usa fallback
    if (!response.ok && response.status === 403) {
      const errorText = await response.text();
      if (errorText.includes('verify a domain') || errorText.includes('testing emails')) {
        console.log('Dominio non verificato, usando fallback...');
        
        // Usa sender di fallback e email di test
        emailFrom = `${CONFIG.EMAIL_FROM_NAME} <${CONFIG.EMAIL_FROM_FALLBACK}>`;
        emailTo = CONFIG.EMAIL_TO_TEST; // Temporaneo finché non verifichiamo dominio
        usedFallback = true;
        
        // Riprova con fallback
        response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [emailTo],
            reply_to: data.email,
            subject: `${CONFIG.EMAIL_SUBJECT_PREFIX} ${data.formType || 'Richiesta'} - ${data.nome}`,
            html: htmlContent + `<p style="color: #999; font-size: 10px; margin-top: 20px;">Nota: Email inviata tramite sistema di test. Destinatario finale: ${CONFIG.EMAIL_TO}</p>`,
            text: textContent + `\n\nNota: Email inviata tramite sistema di test. Destinatario finale: ${CONFIG.EMAIL_TO}`,
            tags: [
              { name: 'source', value: 'website' },
              { name: 'type', value: data.formType || 'contact' },
              { name: 'fallback', value: 'true' }
            ]
          }),
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      // Parse error if JSON
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorText;
      } catch (e) {
        // Keep original error text
      }
      
      return { success: false, error: errorMessage, status: response.status };
    }

    const result = await response.json();
    return { success: true, id: result.id, usedFallback };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ 
        status: 'ok',
        service: 'IT-ERA Email Service',
        provider: 'Resend',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Gestione OPTIONS per CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(origin),
      });
    }

    // Solo POST su /api/contact
    if (request.method !== 'POST' || url.pathname !== '/api/contact') {
      return new Response(JSON.stringify({ 
        error: 'Method not allowed',
        message: 'Use POST /api/contact'
      }), {
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
            success: false,
            error: 'Troppe richieste. Riprova domani.' 
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
      };

      // Invia email con Resend
      const emailResult = await sendEmailResend(sanitizedData, env);
      if (!emailResult.success) {
        // Return more detailed error for debugging
        return new Response(JSON.stringify({
          success: false,
          error: emailResult.error || 'Failed to send email',
          status: emailResult.status,
          debug: 'Resend API error'
        }), {
          status: 400,
          headers: corsHeaders(origin),
        });
      }

      // Salva su database se disponibile
      if (env.CONTACT_DB) {
        try {
          const query = `
            INSERT INTO contacts (
              nome, azienda, email, telefono, comune, dipendenti,
              servizi, urgenza, messaggio, form_type, ip_address, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          await env.CONTACT_DB.prepare(query).bind(
            sanitizedData.nome,
            sanitizedData.azienda || null,
            sanitizedData.email,
            sanitizedData.telefono,
            sanitizedData.comune || null,
            sanitizedData.dipendenti || null,
            JSON.stringify(sanitizedData.servizi || []),
            sanitizedData.urgenza || 'normale',
            sanitizedData.messaggio || null,
            sanitizedData.formType || 'preventivo',
            ip,
            new Date().toISOString()
          ).run();
        } catch (dbError) {
          console.error('Database error:', dbError);
          // Non bloccare l'invio se il DB fallisce
        }
      }

      // Analytics
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
        message: emailResult.usedFallback ? 
          'Richiesta registrata! (Sistema in modalità test - verifica dominio in corso)' :
          'Richiesta inviata con successo! Ti contatteremo entro 2 ore lavorative.',
        ticketId: `ITERA-${Date.now()}`,
        emailId: emailResult.id,
        usedFallback: emailResult.usedFallback
      }), {
        status: 200,
        headers: corsHeaders(origin),
      });

    } catch (error) {
      console.error('Errore:', error);
      
      // In development, return detailed error
      const isDev = url.hostname.includes('localhost') || url.hostname.includes('127.0.0.1');
      const errorMessage = isDev ? 
        `Errore: ${error.message || error}` : 
        'Errore durante l\'invio. Riprova o contattaci al 039 888 2041.';
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        details: isDev ? error.stack : undefined
      }), {
        status: 500,
        headers: corsHeaders(origin),
      });
    }
  },
};