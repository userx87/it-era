/**
 * Cloudflare Worker per IT-ERA - Integrazione Resend.com
 * Deploy su: https://it-era-resend.bulltech.workers.dev/
 */

// Configurazione Resend
const RESEND_API_KEY = 're_BhJiCJEe_JXYWoB3W4NcpoPtjA2qyvqYL';
const FROM_EMAIL = 'noreply@it-era.it';
const TO_EMAIL = 'info@it-era.it';

export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint
    if (request.url.endsWith('/api/health')) {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        service: 'IT-ERA Resend Handler',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Contact form endpoint
    if (request.url.endsWith('/api/contact') && request.method === 'POST') {
      try {
        const data = await request.json();
        
        // Validazione base
        if (!data.email || !data.full_name) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Nome e email sono obbligatori'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Se è un test, restituisci successo
        if (data.test) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Test completato con successo',
            data: {
              timestamp: new Date().toISOString(),
              test_mode: true
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
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
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Messaggio inviato con successo! Ti contatteremo presto.',
            data: {
              id: result.id,
              timestamp: new Date().toISOString()
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          const error = await resendResponse.text();
          console.error('Resend API Error:', error);
          
          return new Response(JSON.stringify({
            success: false,
            error: 'Errore durante l\'invio. Riprova più tardi.'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      } catch (error) {
        console.error('Worker Error:', error);
        
        return new Response(JSON.stringify({
          success: false,
          error: 'Errore interno del server'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 404 per altri endpoint
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders
    });
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
          <span class="label">Urgenza:</span> ${data.urgency || 'Normale'}
        </div>
        
        <div class="field">
          <span class="label">Budget:</span> ${data.budget_range || 'Non specificato'}
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
