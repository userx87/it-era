/**
 * Cloudflare Worker Migliorato per SendGrid con Error Handling Completo
 * Versione diagnostica con logging dettagliato
 */

export default {
  async fetch(request, env, ctx) {
    // CORS headers per tutti i response
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      const { email, subject, message } = await request.json();
      
      // Validazione input
      if (!email || !subject || !message) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Parametri mancanti: email, subject, message sono richiesti'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Preparazione email con logging
      const emailData = {
        personalizations: [{
          to: [{ email: email }],
        }],
        from: { 
          email: 'info@it-era.it',  // Usa sempre lo stesso mittente verificato
          name: 'IT-ERA Sistema Notifiche'
        },
        subject: subject,
        content: [{
          type: 'text/html',
          value: message,
        }],
      };

      console.log('📤 Tentativo invio email:', {
        to: email,
        from: 'info@it-era.it',
        subject: subject,
        apiKeyPresent: !!env.SENDGRID_API_KEY,
        apiKeyLength: env.SENDGRID_API_KEY?.length
      });

      // Invio tramite SendGrid con error handling migliorato
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      // Logging dettagliato della risposta
      console.log('📨 SendGrid Response Status:', response.status);
      console.log('📨 SendGrid Response Headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('📨 SendGrid Response Body:', responseText);

      if (response.ok) {
        console.log('✅ Email inviata con successo');
        return new Response(JSON.stringify({
          success: true,
          message: 'Email inviata con successo',
          messageId: response.headers.get('X-Message-Id') || 'unknown'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        // Gestione errori SendGrid dettagliata
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }

        console.error('❌ SendGrid Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });

        // Analisi errori comuni
        const errorAnalysis = analyzeError(response.status, errorData);

        return new Response(JSON.stringify({
          success: false,
          error: 'Errore SendGrid',
          details: {
            status: response.status,
            statusText: response.statusText,
            sendgridError: errorData,
            analysis: errorAnalysis
          }
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

    } catch (error) {
      console.error('❌ Errore generale:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Errore interno del server',
        details: {
          message: error.message,
          stack: error.stack
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};

/**
 * Analisi degli errori SendGrid per fornire soluzioni specifiche
 */
function analyzeError(status, errorData) {
  const analysis = {
    status: status,
    possibleCauses: [],
    solutions: []
  };

  switch (status) {
    case 400:
      analysis.possibleCauses = [
        'Formato email non valido',
        'Campi richiesti mancanti',
        'Contenuto email non valido'
      ];
      analysis.solutions = [
        'Verificare formato email destinatario',
        'Controllare che tutti i campi required siano presenti',
        'Validare il contenuto HTML dell\'email'
      ];
      break;

    case 401:
      analysis.possibleCauses = [
        'API Key non valida o scaduta',
        'API Key non ha i permessi necessari'
      ];
      analysis.solutions = [
        'Rigenerare API Key su SendGrid Dashboard',
        'Verificare che API Key abbia permessi "Mail Send"',
        'Controllare che API Key sia configurata correttamente nel Worker'
      ];
      break;

    case 403:
      analysis.possibleCauses = [
        'Email mittente non verificata',
        'Dominio non autenticato su SendGrid',
        'Account SendGrid sospeso o limitato'
      ];
      analysis.solutions = [
        'Verificare email mittente su SendGrid Dashboard > Sender Authentication',
        'Configurare Domain Authentication per it-era.it',
        'Controllare stato account SendGrid'
      ];
      break;

    case 413:
      analysis.possibleCauses = [
        'Email troppo grande (limite SendGrid: 30MB)'
      ];
      analysis.solutions = [
        'Ridurre dimensione contenuto email',
        'Rimuovere allegati troppo grandi'
      ];
      break;

    case 429:
      analysis.possibleCauses = [
        'Troppi tentativi di invio (rate limiting)'
      ];
      analysis.solutions = [
        'Aspettare prima di riprovare',
        'Implementare backoff esponenziale',
        'Verificare piano SendGrid per limiti'
      ];
      break;

    case 500:
    case 502:
    case 503:
      analysis.possibleCauses = [
        'Errore temporaneo server SendGrid'
      ];
      analysis.solutions = [
        'Riprovare dopo alcuni minuti',
        'Implementare retry automatico',
        'Verificare status SendGrid su status.sendgrid.com'
      ];
      break;

    default:
      analysis.possibleCauses = [
        'Errore non identificato'
      ];
      analysis.solutions = [
        'Controllare documentazione SendGrid API',
        'Verificare configurazione completa',
        'Contattare supporto SendGrid se persiste'
      ];
  }

  // Aggiungi dettagli specifici dall'errore SendGrid
  if (errorData && errorData.errors) {
    errorData.errors.forEach(err => {
      if (err.field) {
        analysis.possibleCauses.push(`Problema campo: ${err.field}`);
      }
      if (err.message) {
        analysis.solutions.push(`SendGrid suggerisce: ${err.message}`);
      }
    });
  }

  return analysis;
}