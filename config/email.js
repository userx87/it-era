/**
 * Email Configuration
 * IT-ERA Express.js Application
 */

const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER || 'info@it-era.it',
            pass: process.env.SMTP_PASSWORD || 'your-app-password'
        }
    },
    
    defaults: {
        from: process.env.SMTP_FROM || 'IT-ERA <info@it-era.it>',
        replyTo: process.env.SMTP_REPLY_TO || 'info@it-era.it'
    },
    
    templates: {
        microsoft365Quote: {
            subject: 'Nuova Richiesta Microsoft 365 - {{azienda}}',
            notificationTemplate: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c5aa0;">Nuova Richiesta Preventivo Microsoft 365</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Nome:</strong> {{nome}}</p>
                        <p><strong>Azienda:</strong> {{azienda}}</p>
                        <p><strong>Email:</strong> {{email}}</p>
                        <p><strong>Telefono:</strong> {{telefono}}</p>
                        <p><strong>Numero Utenti:</strong> {{utenti}}</p>
                        <p><strong>Piano di Interesse:</strong> {{piano_interesse}}</p>
                        <p><strong>Messaggio:</strong> {{messaggio}}</p>
                        <p><strong>Città:</strong> {{city}}</p>
                        <p><strong>Pagina Sorgente:</strong> {{source_page}}</p>
                        <p><strong>Data:</strong> {{timestamp}}</p>
                        <p><strong>IP:</strong> {{ip_address}}</p>
                    </div>
                </div>
            `,
            autoResponseTemplate: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2c5aa0; color: white; padding: 20px; text-align: center;">
                        <h1>IT-ERA</h1>
                        <p>Assistenza IT Professionale</p>
                    </div>
                    <div style="padding: 20px;">
                        <h2>Grazie per la tua richiesta!</h2>
                        <p>Ciao <strong>{{nome}}</strong>,</p>
                        <p>Abbiamo ricevuto la tua richiesta per Microsoft 365 per <strong>{{utenti}} utenti</strong>.</p>
                        <p>Il nostro team ti contatterà entro <strong>2 ore lavorative</strong> per fornirti un preventivo personalizzato.</p>
                        
                        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h3>Dettagli della richiesta:</h3>
                            <ul>
                                <li><strong>Azienda:</strong> {{azienda}}</li>
                                <li><strong>Numero Utenti:</strong> {{utenti}}</li>
                                <li><strong>Piano:</strong> {{piano_interesse}}</li>
                            </ul>
                        </div>
                        
                        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>🚨 Per qualsiasi urgenza, contattaci al:</strong></p>
                            <p style="font-size: 18px; color: #2c5aa0;"><strong>📞 039 888 2041</strong></p>
                            <p><strong>📧 info@it-era.it</strong></p>
                        </div>
                        
                        <p>Cordiali saluti,<br><strong>Il Team IT-ERA</strong></p>
                    </div>
                    <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                        <p>IT-ERA - Assistenza IT Professionale<br>
                        Viale Risorgimento 32, Vimercate MB<br>
                        Tel: 039 888 2041 | Email: info@it-era.it</p>
                    </div>
                </div>
            `
        },
        
        contact: {
            subject: 'Nuovo Messaggio di Contatto - {{name}}',
            notificationTemplate: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c5aa0;">Nuovo Messaggio di Contatto</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Nome:</strong> {{name}}</p>
                        <p><strong>Email:</strong> {{email}}</p>
                        <p><strong>Telefono:</strong> {{phone}}</p>
                        <p><strong>Messaggio:</strong></p>
                        <div style="background: white; padding: 15px; border-left: 4px solid #2c5aa0;">
                            {{message}}
                        </div>
                        <p><strong>Data:</strong> {{timestamp}}</p>
                        <p><strong>IP:</strong> {{ip_address}}</p>
                    </div>
                </div>
            `,
            autoResponseTemplate: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2c5aa0; color: white; padding: 20px; text-align: center;">
                        <h1>IT-ERA</h1>
                        <p>Assistenza IT Professionale</p>
                    </div>
                    <div style="padding: 20px;">
                        <h2>Grazie per averci contattato!</h2>
                        <p>Ciao <strong>{{name}}</strong>,</p>
                        <p>Abbiamo ricevuto il tuo messaggio e ti risponderemo entro <strong>24 ore</strong>.</p>
                        
                        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>🚨 Per urgenze immediate, contattaci al:</strong></p>
                            <p style="font-size: 18px; color: #2c5aa0;"><strong>📞 039 888 2041</strong></p>
                            <p><strong>Tempo di risposta garantito: 15 minuti</strong></p>
                        </div>
                        
                        <p>Cordiali saluti,<br><strong>Il Team IT-ERA</strong></p>
                    </div>
                    <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                        <p>IT-ERA - Assistenza IT Professionale<br>
                        Viale Risorgimento 32, Vimercate MB<br>
                        Tel: 039 888 2041 | Email: info@it-era.it</p>
                    </div>
                </div>
            `
        }
    }
};

// Template rendering function
const renderTemplate = (template, data) => {
    let rendered = template;
    for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, value || '');
    }
    return rendered;
};

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransporter(emailConfig.smtp);
};

// Send email function
const sendEmail = async (to, subject, htmlContent, options = {}) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: options.from || emailConfig.defaults.from,
            to: to,
            subject: subject,
            html: htmlContent,
            replyTo: options.replyTo || emailConfig.defaults.replyTo,
            ...options
        };
        
        const result = await transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    emailConfig,
    renderTemplate,
    createTransporter,
    sendEmail
};
