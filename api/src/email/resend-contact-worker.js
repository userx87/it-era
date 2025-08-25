/**
 * IT-ERA Contact Form with Resend.com Integration
 * Cloudflare Worker for handling contact form submissions with professional email delivery
 * Optimized for conversion tracking and customer experience
 */

export default {
  async fetch(request, env, ctx) {
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Only allow POST requests for contact form
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Metodo non consentito. Utilizzare POST.'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Parse request body
      const requestData = await request.json();
      
      // Enhanced validation
      const validation = validateContactForm(requestData);
      if (!validation.isValid) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Dati non validi',
          errors: validation.errors,
          message: 'Controlla i campi richiesti e riprova.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const {
        nome,
        email,
        telefono = '',
        azienda = '',
        comune = '',
        servizio = 'Assistenza IT',
        messaggio,
        privacy,
        urgenza = 'normale',
        dipendenti = '',
        sendCopy = false
      } = requestData;

      // Generate ticket ID for tracking
      const ticketId = generateTicketId();
      const timestamp = new Date().toLocaleString('it-IT', { 
        timeZone: 'Europe/Rome' 
      });

      // Prepare professional email content
      const customerEmailHtml = createCustomerEmail({
        nome,
        ticketId,
        servizio,
        timestamp
      });

      const notificationEmailHtml = createNotificationEmail({
        nome,
        email,
        telefono,
        azienda,
        comune,
        servizio,
        messaggio,
        urgenza,
        dipendenti,
        ticketId,
        timestamp,
        userAgent: request.headers.get('User-Agent') || 'Unknown',
        ip: request.headers.get('CF-Connecting-IP') || 'Unknown'
      });

      // Send emails via Resend API
      const emailPromises = [];

      // 1. Send notification to IT-ERA team
      emailPromises.push(
        sendResendEmail({
          from: 'IT-ERA Sistema <noreply@it-era.it>',
          to: ['info@it-era.it'],
          subject: `🚨 Nuova Richiesta ${urgenza === 'urgente' ? 'URGENTE' : ''} - ${servizio} - ${ticketId}`,
          html: notificationEmailHtml
        }, env.RESEND_API_KEY)
      );

      // 2. Send confirmation to customer
      emailPromises.push(
        sendResendEmail({
          from: 'IT-ERA <info@it-era.it>',
          to: [email],
          subject: `✅ Richiesta ricevuta - ${servizio} - ${ticketId}`,
          html: customerEmailHtml
        }, env.RESEND_API_KEY)
      );

      // 3. Optional: Send copy to customer if requested
      if (sendCopy && telefono) {
        emailPromises.push(
          sendResendEmail({
            from: 'IT-ERA Sistema <noreply@it-era.it>',
            to: [email],
            subject: `📋 Copia della tua richiesta - ${ticketId}`,
            html: createCopyEmail({ nome, servizio, messaggio, ticketId })
          }, env.RESEND_API_KEY)
        );
      }

      // Execute all email sends in parallel
      const emailResults = await Promise.allSettled(emailPromises);
      
      // Check if at least the notification email was sent
      const notificationResult = emailResults[0];
      const customerResult = emailResults[1];

      if (notificationResult.status === 'rejected' && customerResult.status === 'rejected') {
        throw new Error('Errore nell\'invio delle email principali');
      }

      // Log for monitoring
      console.log('📧 Contact form processed:', {
        ticketId,
        email,
        servizio,
        urgenza,
        notificationSent: notificationResult.status === 'fulfilled',
        customerSent: customerResult.status === 'fulfilled',
        timestamp
      });

      // Success response
      return new Response(JSON.stringify({
        success: true,
        message: urgenza === 'urgente' 
          ? '🚨 Richiesta urgente ricevuta! Ti contatteremo entro 15 minuti.'
          : '✅ Richiesta inviata con successo! Ti risponderemo entro 4 ore lavorative.',
        ticketId,
        nextSteps: getNextSteps(urgenza, servizio),
        estimatedResponse: getEstimatedResponse(urgenza)
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('❌ Contact form error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Errore interno del server',
        message: 'Si è verificato un problema. Ti preghiamo di riprovare o contattarci direttamente al 039 888 2041.',
        supportPhone: '039 888 2041',
        supportEmail: 'info@it-era.it'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Validate contact form data
 */
function validateContactForm(data) {
  const errors = [];
  
  if (!data.nome || data.nome.length < 2) {
    errors.push('Nome richiesto (minimo 2 caratteri)');
  }
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Email valida richiesta');
  }
  
  if (!data.messaggio || data.messaggio.length < 10) {
    errors.push('Messaggio richiesto (minimo 10 caratteri)');
  }
  
  if (!data.privacy) {
    errors.push('Accettazione privacy obbligatoria');
  }
  
  // Optional phone validation
  if (data.telefono && !isValidPhone(data.telefono)) {
    errors.push('Formato telefono non valido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Email validation
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Phone validation (Italian format)
 */
function isValidPhone(phone) {
  const phoneRegex = /^(\+39)?[\s]?[0-9]{3,4}[\s]?[0-9]{6,7}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Generate unique ticket ID
 */
function generateTicketId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `IT${timestamp}${random}`.toUpperCase();
}

/**
 * Send email via Resend API
 */
async function sendResendEmail(emailData, apiKey) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorData}`);
  }

  return await response.json();
}

/**
 * Create customer confirmation email
 */
function createCustomerEmail({ nome, ticketId, servizio, timestamp }) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conferma Richiesta - IT-ERA</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0056cc 0%, #00b336 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">IT-ERA</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Soluzioni IT Professionali</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #0056cc; margin: 0 0 20px 0;">Ciao ${nome}! 👋</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">
                Abbiamo ricevuto la tua richiesta per <strong>${servizio}</strong> e siamo già al lavoro per aiutarti!
            </p>
            
            <!-- Ticket Info -->
            <div style="background-color: #f8f9fa; border-left: 4px solid #0056cc; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h3 style="margin: 0 0 10px 0; color: #0056cc; font-size: 18px;">📋 Dettagli Richiesta</h3>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Ticket ID:</strong> ${ticketId}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Servizio:</strong> ${servizio}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Data:</strong> ${timestamp}</p>
            </div>
            
            <h3 style="color: #0056cc; margin: 30px 0 15px 0;">🚀 Prossimi Passi</h3>
            <ul style="padding-left: 20px; line-height: 1.8; color: #333;">
                <li>Un nostro tecnico analizzerà la tua richiesta</li>
                <li>Ti contatteremo entro 4 ore lavorative</li>
                <li>Riceverai un preventivo personalizzato</li>
                <li>Pianificheremo l'intervento più adatto</li>
            </ul>
            
            <!-- Emergency Contact -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; margin: 30px 0; border-radius: 8px; text-align: center;">
                <h3 style="color: #856404; margin: 0 0 10px 0;">🚨 Hai un'emergenza?</h3>
                <p style="color: #856404; margin: 0 0 15px 0; font-size: 14px;">Per supporto immediato chiamaci ora:</p>
                <a href="tel:+390398882041" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                    📞 039 888 2041
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                <strong>IT-ERA</strong> - La tua partnership tecnologica di fiducia
            </p>
            <p style="margin: 0 0 15px 0; color: #6c757d; font-size: 12px;">
                Viale Risorgimento 32, Vimercate MB | P.IVA: 10524040966
            </p>
            <div style="margin: 15px 0;">
                <a href="mailto:info@it-era.it" style="color: #0056cc; text-decoration: none; margin: 0 10px;">info@it-era.it</a>
                <a href="tel:+390398882041" style="color: #0056cc; text-decoration: none; margin: 0 10px;">039 888 2041</a>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Create notification email for IT-ERA team
 */
function createNotificationEmail({ nome, email, telefono, azienda, comune, servizio, messaggio, urgenza, dipendenti, ticketId, timestamp, userAgent, ip }) {
  const urgencyFlag = urgenza === 'urgente' ? '🚨 URGENTE' : '📋 Normale';
  const urgencyColor = urgenza === 'urgente' ? '#dc3545' : '#0056cc';
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuova Richiesta Cliente - ${ticketId}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 700px; margin: 0 auto; background-color: white; padding: 0;">
        <!-- Header -->
        <div style="background-color: ${urgencyColor}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${urgencyFlag} Nuova Richiesta</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Ticket: ${ticketId} | ${timestamp}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <!-- Customer Info -->
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">👤 Informazioni Cliente</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; width: 120px;">Nome:</td>
                        <td style="padding: 8px 0;">${nome}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                        <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #0056cc;">${email}</a></td>
                    </tr>
                    ${telefono ? `
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Telefono:</td>
                        <td style="padding: 8px 0;"><a href="tel:${telefono}" style="color: #0056cc;">${telefono}</a></td>
                    </tr>` : ''}
                    ${azienda ? `
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Azienda:</td>
                        <td style="padding: 8px 0;">${azienda}</td>
                    </tr>` : ''}
                    ${comune ? `
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Località:</td>
                        <td style="padding: 8px 0;">${comune}</td>
                    </tr>` : ''}
                    ${dipendenti ? `
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Dipendenti:</td>
                        <td style="padding: 8px 0;">${dipendenti}</td>
                    </tr>` : ''}
                </table>
            </div>
            
            <!-- Request Details -->
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">📋 Dettagli Richiesta</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; width: 120px;">Servizio:</td>
                        <td style="padding: 8px 0;">${servizio}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Urgenza:</td>
                        <td style="padding: 8px 0;"><strong style="color: ${urgencyColor};">${urgenza.toUpperCase()}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Ticket ID:</td>
                        <td style="padding: 8px 0;">${ticketId}</td>
                    </tr>
                </table>
            </div>
            
            <!-- Message -->
            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #0056cc; margin: 0 0 15px 0; font-size: 18px;">💬 Messaggio</h2>
                <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${messaggio}</p>
            </div>
            
            <!-- Technical Info -->
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <h3 style="color: #6c757d; margin: 0 0 10px 0; font-size: 14px;">🔧 Info Tecniche</h3>
                <p style="margin: 0; font-size: 12px; color: #6c757d; line-height: 1.4;">
                    <strong>IP:</strong> ${ip}<br>
                    <strong>User Agent:</strong> ${userAgent}<br>
                    <strong>Timestamp:</strong> ${timestamp}
                </p>
            </div>
            
            <!-- Quick Actions -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="tel:${telefono}" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold;">
                    📞 Chiama Cliente
                </a>
                <a href="mailto:${email}" style="display: inline-block; background-color: #0056cc; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold;">
                    ✉️ Rispondi Email
                </a>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Create copy email for customer
 */
function createCopyEmail({ nome, servizio, messaggio, ticketId }) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Copia della tua richiesta - ${ticketId}</h2>
    <p><strong>Nome:</strong> ${nome}</p>
    <p><strong>Servizio:</strong> ${servizio}</p>
    <p><strong>Messaggio:</strong></p>
    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        ${messaggio}
    </div>
    <p style="font-size: 12px; color: #6c757d; margin-top: 30px;">
        Questa è una copia automatica della tua richiesta inviata a IT-ERA.
    </p>
</body>
</html>
  `;
}

/**
 * Get next steps based on urgency and service
 */
function getNextSteps(urgenza, servizio) {
  if (urgenza === 'urgente') {
    return [
      'Il nostro team di emergenza è stato notificato',
      'Riceverai una chiamata entro 15 minuti',
      'Prepareremo un intervento immediato se necessario'
    ];
  }
  
  return [
    'Analisi della richiesta da parte del team tecnico',
    'Contatto entro 4 ore lavorative',
    'Invio preventivo personalizzato',
    'Pianificazione intervento'
  ];
}

/**
 * Get estimated response time
 */
function getEstimatedResponse(urgenza) {
  return urgenza === 'urgente' ? '15 minuti' : '4 ore lavorative';
}