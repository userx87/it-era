/**
 * Netlify Function per IT-ERA - Integrazione Resend.com
 * Endpoint: https://it-era.netlify.app/.netlify/functions/contact
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_BhJiCJEe_JXYWoB3W4NcpoPtjA2qyvqYL';
const FROM_EMAIL = 'noreply@it-era.it';
const TO_EMAIL = 'info@it-era.it';

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Health check
  if (event.path.endsWith('/health')) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        service: 'IT-ERA Resend Handler',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
      })
    };
  }

  // Solo POST per contact
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed'
      })
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    // Validazione base
    if (!data.email || !data.full_name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Nome e email sono obbligatori'
        })
      };
    }

    // Se è un test, restituisci successo
    if (data.test) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Test completato con successo',
          data: {
            timestamp: new Date().toISOString(),
            test_mode: true,
            function: 'netlify'
          }
        })
      };
    }

    // Prepara email per Resend
    const emailData = {
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: `Nuovo contatto IT-ERA: ${data.full_name} - ${data.service_type || 'Contatto generico'}`,
      html: generateEmailHTML(data)
    };

    // Invia email tramite Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (resendResponse.ok) {
      const result = await resendResponse.json();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Messaggio inviato con successo! Ti contatteremo presto.',
          data: {
            id: result.id,
            timestamp: new Date().toISOString()
          }
        })
      };
    } else {
      const error = await resendResponse.text();
      console.error('Resend API Error:', error);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Errore durante l\'invio. Riprova più tardi.'
        })
      };
    }

  } catch (error) {
    console.error('Function Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Errore interno del server'
      })
    };
  }
};

/**
 * Genera HTML per l'email
 */
function generateEmailHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nuovo contatto IT-ERA</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #1e40af; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔧 Nuovo Contatto IT-ERA</h1>
      </div>
      
      <div class="content">
        <div class="field">
          <span class="label">Nome:</span> ${data.full_name || data.nome || 'Non fornito'}
        </div>
        
        <div class="field">
          <span class="label">Email:</span> ${data.email || 'Non fornita'}
        </div>
        
        <div class="field">
          <span class="label">Telefono:</span> ${data.phone || data.telefono || 'Non fornito'}
        </div>
        
        <div class="field">
          <span class="label">Azienda:</span> ${data.company || data.azienda || 'Non fornita'}
        </div>
        
        <div class="field">
          <span class="label">Tipo servizio:</span> ${data.service_type || 'Non specificato'}
        </div>
        
        <div class="field">
          <span class="label">Messaggio:</span><br>
          ${(data.message || data.messaggio || data.project_description || 'Nessun messaggio').replace(/\n/g, '<br>')}
        </div>
        
        <div class="field">
          <span class="label">Pagina:</span> ${data.pagina || 'Non specificata'}
        </div>
        
        <div class="field">
          <span class="label">URL:</span> ${data.pageUrl || 'Non specificato'}
        </div>
      </div>
      
      <div class="footer">
        <p>Ricevuto il: ${new Date().toLocaleString('it-IT')}</p>
        <p>Sistema automatico IT-ERA - Non rispondere a questa email</p>
      </div>
    </body>
    </html>
  `;
}
