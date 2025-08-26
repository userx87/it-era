/**
 * IT-ERA Contact System - Cloudflare Worker
 * Handles contact form submissions with Resend.com integration
 */

import { Resend } from 'resend';

export default {
  async fetch(request, env, ctx) {
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method === 'POST' && new URL(request.url).pathname === '/contact') {
      try {
        const formData = await request.json();
        
        // Validate required fields
        const requiredFields = ['nome', 'email', 'messaggio'];
        const missing = requiredFields.filter(field => !formData[field]);
        
        if (missing.length > 0) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Campi obbligatori mancanti: ' + missing.join(', ')
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // Generate unique ticket ID: IT{YYYYMMDD}{6-char-random}
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const ticketId = `IT${dateStr}${randomStr}`;

        // Initialize Resend
        const resend = new Resend(env.RESEND_API_KEY);

        // Determine service type for routing
        const serviceType = determineServiceType(formData);
        const ownerEmail = getOwnerEmail(serviceType);

        // Send notification to owner
        await resend.emails.send({
          from: 'IT-ERA Contact System <noreply@it-era.it>',
          to: [ownerEmail],
          subject: `Nuova richiesta ${serviceType.toUpperCase()} - Ticket ${ticketId}`,
          html: generateOwnerNotificationTemplate(formData, ticketId, serviceType)
        });

        // Send confirmation to customer
        await resend.emails.send({
          from: 'IT-ERA <info@it-era.it>',
          to: [formData.email],
          subject: `Conferma ricezione richiesta - Ticket ${ticketId}`,
          html: generateCustomerConfirmationTemplate(formData, ticketId, serviceType)
        });

        // Log contact for analytics (store in KV if needed)
        await logContact(env, formData, ticketId, serviceType);

        return new Response(JSON.stringify({
          success: true,
          ticketId: ticketId,
          message: 'Richiesta inviata con successo! Riceverai una conferma via email.'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (error) {
        console.error('Contact form error:', error);
        
        return new Response(JSON.stringify({
          success: false,
          error: 'Errore interno del server. Riprova più tardi.'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};

// Determine service type from form data or URL
function determineServiceType(formData) {
  const url = formData.pageUrl || '';
  const service = formData.servizio || 'generale';
  
  if (url.includes('assistenza-it') || service.includes('assistenza')) {
    return 'assistenza-it';
  } else if (url.includes('sicurezza-informatica') || service.includes('sicurezza')) {
    return 'sicurezza-informatica';
  } else if (url.includes('cloud-storage') || service.includes('cloud')) {
    return 'cloud-storage';
  }
  
  return 'generale';
}

// Get owner email based on service type
function getOwnerEmail(serviceType) {
  const emailRouting = {
    'assistenza-it': 'assistenza@it-era.it',
    'sicurezza-informatica': 'sicurezza@it-era.it',
    'cloud-storage': 'cloud@it-era.it',
    'generale': 'info@it-era.it'
  };
  
  return emailRouting[serviceType] || 'info@it-era.it';
}

// Generate owner notification email template
function generateOwnerNotificationTemplate(formData, ticketId, serviceType) {
  const serviceNames = {
    'assistenza-it': 'Assistenza IT',
    'sicurezza-informatica': 'Sicurezza Informatica',
    'cloud-storage': 'Cloud Storage',
    'generale': 'Richiesta Generale'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nuova Richiesta IT-ERA</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0056cc; color: white; padding: 20px; text-align: center;">
          <h1>IT-ERA - Nuova Richiesta Cliente</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #0056cc;">
          <h2>Ticket: ${ticketId}</h2>
          <p><strong>Servizio:</strong> ${serviceNames[serviceType] || 'Generale'}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString('it-IT')}</p>
        </div>
        
        <div style="padding: 20px;">
          <h3>Dati Cliente</h3>
          <p><strong>Nome:</strong> ${formData.nome}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          ${formData.telefono ? `<p><strong>Telefono:</strong> ${formData.telefono}</p>` : ''}
          ${formData.azienda ? `<p><strong>Azienda:</strong> ${formData.azienda}</p>` : ''}
          
          <h3>Messaggio</h3>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
            ${formData.messaggio.replace(/\n/g, '<br>')}
          </div>
          
          ${formData.pageUrl ? `<p><strong>Pagina di provenienza:</strong> ${formData.pageUrl}</p>` : ''}
          ${formData.servizio ? `<p><strong>Servizio richiesto:</strong> ${formData.servizio}</p>` : ''}
        </div>
        
        <div style="background: #28a745; color: white; padding: 15px; text-align: center;">
          <p>Rispondere entro 2 ore durante l'orario lavorativo</p>
          <p><strong>Email di risposta:</strong> ${formData.email}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate customer confirmation email template
function generateCustomerConfirmationTemplate(formData, ticketId, serviceType) {
  const serviceNames = {
    'assistenza-it': 'Assistenza IT',
    'sicurezza-informatica': 'Sicurezza Informatica',
    'cloud-storage': 'Cloud Storage',
    'generale': 'Richiesta Generale'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Conferma Richiesta IT-ERA</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0056cc; color: white; padding: 20px; text-align: center;">
          <h1>IT-ERA</h1>
          <p>Grazie per averci contattato!</p>
        </div>
        
        <div style="padding: 20px;">
          <p>Gentile <strong>${formData.nome}</strong>,</p>
          
          <p>abbiamo ricevuto la sua richiesta di <strong>${serviceNames[serviceType] || 'informazioni'}</strong> 
          e le confermiamo che è stata presa in carico dal nostro team.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #0056cc; margin: 20px 0;">
            <p><strong>Numero Ticket:</strong> ${ticketId}</p>
            <p><strong>Data richiesta:</strong> ${new Date().toLocaleString('it-IT')}</p>
            <p><strong>Servizio:</strong> ${serviceNames[serviceType] || 'Generale'}</p>
          </div>
          
          <h3>La sua richiesta:</h3>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            ${formData.messaggio.replace(/\n/g, '<br>')}
          </div>
          
          <p><strong>Le risponderemo entro 2 ore durante l'orario lavorativo.</strong></p>
          
          <div style="background: #28a745; color: white; padding: 15px; text-align: center; border-radius: 5px;">
            <h3>I nostri contatti</h3>
            <p><strong>Telefono:</strong> 039 888 2041</p>
            <p><strong>Email:</strong> info@it-era.it</p>
            <p><strong>Indirizzo:</strong> Viale Risorgimento 32, Vimercate MB</p>
          </div>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Se ha bisogno di assistenza urgente, non esiti a chiamarci al numero 039 888 2041.
            Citi sempre il numero ticket ${ticketId} per un servizio più rapido.
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>IT-ERA - Soluzioni informatiche professionali</p>
          <p>Viale Risorgimento 32, 20871 Vimercate (MB) - P.IVA: 10524040966</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Log contact for analytics
async function logContact(env, formData, ticketId, serviceType) {
  try {
    // Store in KV for analytics (optional)
    if (env.CONTACT_LOGS) {
      const logData = {
        ticketId,
        serviceType,
        email: formData.email,
        timestamp: new Date().toISOString(),
        pageUrl: formData.pageUrl || '',
        userAgent: formData.userAgent || ''
      };
      
      await env.CONTACT_LOGS.put(ticketId, JSON.stringify(logData));
    }
  } catch (error) {
    console.error('Logging error:', error);
    // Don't fail the main request for logging errors
  }
}