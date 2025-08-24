/**
 * Contact Form API with Resend Integration
 * Cybersecurity Landing Page - IT-ERA
 * 
 * This serverless function handles contact form submissions
 * with security validation and Resend email service integration.
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Security configuration
const ALLOWED_ORIGINS = [
    'https://www.it-era.it',
    'https://it-era.it',
    'http://localhost:3000' // For development
];

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // Max 5 submissions per window
const submissionTracker = new Map();

// Email templates
const ADMIN_EMAIL_TEMPLATE = (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); color: #00ff88; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .field { margin-bottom: 20px; padding: 15px; background: white; border-left: 4px solid #00ff88; }
        .field-label { font-weight: bold; color: #333; margin-bottom: 5px; }
        .field-value { color: #666; }
        .urgent { background: #fff3cd; border-left-color: #ffc107; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
        .cyber-badge { background: #00ff88; color: #0a0a0a; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ NUOVA RICHIESTA CYBERSECURITY</h1>
            <span class="cyber-badge">ASSESSMENT GRATUITO</span>
        </div>
        
        <div class="content">
            <div class="field urgent">
                <div class="field-label">⏰ RISPOSTA RICHIESTA ENTRO:</div>
                <div class="field-value">2 ore lavorative</div>
            </div>
            
            <div class="field">
                <div class="field-label">👤 CONTATTO PRINCIPALE:</div>
                <div class="field-value">${data.nome} ${data.cognome || ''}</div>
            </div>
            
            <div class="field">
                <div class="field-label">🏢 AZIENDA:</div>
                <div class="field-value">${data.azienda || 'Non specificata'}</div>
            </div>
            
            <div class="field">
                <div class="field-label">📍 UBICAZIONE:</div>
                <div class="field-value">${data.comune || 'Non specificata'}</div>
            </div>
            
            <div class="field">
                <div class="field-label">📧 EMAIL:</div>
                <div class="field-value"><a href="mailto:${data.email}">${data.email}</a></div>
            </div>
            
            <div class="field">
                <div class="field-label">📞 TELEFONO:</div>
                <div class="field-value"><a href="tel:${data.telefono}">${data.telefono}</a></div>
            </div>
            
            <div class="field">
                <div class="field-label">👥 DIMENSIONE AZIENDA:</div>
                <div class="field-value">${data.dimensione || 'Non specificata'}</div>
            </div>
            
            <div class="field">
                <div class="field-label">🏭 SETTORE:</div>
                <div class="field-value">${data.settore || 'Non specificato'}</div>
            </div>
            
            ${data.priorita ? `
            <div class="field">
                <div class="field-label">🎯 PRIORITÀ SICUREZZA:</div>
                <div class="field-value">${data.priorita}</div>
            </div>
            ` : ''}
            
            ${data.messaggio ? `
            <div class="field">
                <div class="field-label">💬 MESSAGGIO:</div>
                <div class="field-value">${data.messaggio}</div>
            </div>
            ` : ''}
            
            <div class="field">
                <div class="field-label">🌐 DATI TECNICI:</div>
                <div class="field-value">
                    • IP: ${data.clientIP || 'N/A'}<br>
                    • User Agent: ${data.userAgent?.substring(0, 100) || 'N/A'}...<br>
                    • Referrer: ${data.referrer || 'Diretto'}<br>
                    • Timestamp: ${data.timestamp}
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>🚨 RICHIESTA URGENTE - CYBERSECURITY ASSESSMENT</p>
            <p>IT-ERA - Protezione Avanzata per le Aziende</p>
            <p>Viale Risorgimento 32, Vimercate (MB) • +39 039 888 2041</p>
        </div>
    </div>
</body>
</html>
`;

const CLIENT_CONFIRMATION_TEMPLATE = (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #e8e8e8; background: #0a0a0a; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #00ff88 0%, #0066ff 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #0a0a0a; margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 40px 20px; background: #1a1a1a; }
        .highlight-box { background: rgba(0, 255, 136, 0.1); border: 1px solid #00ff88; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .next-steps { background: #2a2a2a; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .step { display: flex; align-items: center; margin: 15px 0; }
        .step-number { background: #00ff88; color: #0a0a0a; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; }
        .footer { background: #0a0a0a; padding: 30px 20px; text-align: center; color: #888; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #00ff88 0%, #0066ff 100%); color: #0a0a0a; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
        .security-badge { background: rgba(255, 0, 102, 0.2); color: #ff0066; padding: 5px 15px; border-radius: 20px; font-size: 14px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ RICHIESTA RICEVUTA</h1>
            <p style="color: #0a0a0a; margin: 10px 0 0 0;">Assessment Cybersecurity Programmato</p>
        </div>
        
        <div class="content">
            <p>Gentile <strong>${data.nome}</strong>,</p>
            
            <p>La tua richiesta di <strong>Assessment Cybersecurity Gratuito</strong> è stata ricevuta con successo.</p>
            
            <div class="highlight-box">
                <h3 style="color: #00ff88; margin-top: 0;">⏰ TEMPI DI RISPOSTA</h3>
                <p><strong>Ti contatteremo entro 2 ore lavorative</strong> per programmare l'assessment gratuito della tua infrastruttura IT.</p>
                <span class="security-badge">PRIORITÀ ALTA</span>
            </div>
            
            <div class="next-steps">
                <h3 style="color: #ffffff; margin-top: 0;">🚀 PROSSIMI PASSI</h3>
                
                <div class="step">
                    <div class="step-number">1</div>
                    <div>
                        <strong>Chiamata di Qualifica</strong><br>
                        Colloquio telefonico per comprendere le tue esigenze specifiche di sicurezza
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">2</div>
                    <div>
                        <strong>Assessment Gratuito</strong><br>
                        Analisi completa della tua infrastruttura IT e dei potenziali rischi cyber
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">3</div>
                    <div>
                        <strong>Report Dettagliato</strong><br>
                        Consegna del report con vulnerabilità identificate e raccomandazioni
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">4</div>
                    <div>
                        <strong>Proposta Personalizzata</strong><br>
                        Piano di protezione cyber su misura per la tua azienda
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="tel:+390398882041" class="cta-button">
                    📞 CHIAMA ORA: 039 888 2041
                </a>
            </div>
            
            <div class="highlight-box">
                <h3 style="color: #ff0066; margin-top: 0;">🚨 EMERGENZA CYBER?</h3>
                <p>In caso di <strong>incidente di sicurezza in corso</strong>, contattaci immediatamente:</p>
                <p style="font-size: 18px;"><strong>📞 +39 039 888 2041</strong></p>
                <p><em>Il nostro SOC è attivo 24/7/365</em></p>
            </div>
        </div>
        
        <div class="footer">
            <h4 style="color: #00ff88;">IT-ERA Cybersecurity</h4>
            <p>Esperti in Sicurezza Informatica per le Aziende</p>
            <p>Viale Risorgimento 32, 20871 Vimercate (MB)</p>
            <p>📧 info@it-era.it • 🌐 www.it-era.it</p>
        </div>
    </div>
</body>
</html>
`;

// Validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    return phoneRegex.test(phone);
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
}

function detectSuspiciousContent(data) {
    const suspiciousPatterns = [
        /script|javascript|vbscript/i,
        /on\w+\s*=/i,
        /SELECT.*FROM|DROP.*TABLE|UNION.*SELECT/i,
        /eval\(|exec\(|system\(/i
    ];

    const allValues = Object.values(data).join(' ');
    return suspiciousPatterns.some(pattern => pattern.test(allValues));
}

function isRateLimited(ip) {
    const now = Date.now();
    const key = `rate_limit_${ip}`;
    
    if (!submissionTracker.has(key)) {
        submissionTracker.set(key, { count: 1, firstAttempt: now });
        return false;
    }
    
    const data = submissionTracker.get(key);
    
    if (now - data.firstAttempt > RATE_LIMIT_WINDOW) {
        submissionTracker.set(key, { count: 1, firstAttempt: now });
        return false;
    }
    
    if (data.count >= RATE_LIMIT_MAX) {
        return true;
    }
    
    data.count++;
    return false;
}

export default async function handler(req, res) {
    // Set CORS headers
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        // Get client IP
        const clientIP = req.headers['x-forwarded-for'] || 
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress ||
                        (req.connection.socket ? req.connection.socket.remoteAddress : null);

        // Rate limiting
        if (isRateLimited(clientIP)) {
            return res.status(429).json({ 
                success: false, 
                message: 'Troppi tentativi. Riprova tra 15 minuti.' 
            });
        }

        const data = req.body;

        // Basic validation
        if (!data.nome || !data.email || !data.telefono) {
            return res.status(400).json({ 
                success: false, 
                message: 'Campi obbligatori mancanti' 
            });
        }

        // Validate email
        if (!validateEmail(data.email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email non valida' 
            });
        }

        // Validate phone
        if (!validatePhone(data.telefono)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Numero di telefono non valido' 
            });
        }

        // Sanitize all inputs
        const sanitizedData = {};
        for (const [key, value] of Object.entries(data)) {
            sanitizedData[key] = sanitizeInput(value);
        }

        // Security checks
        if (detectSuspiciousContent(sanitizedData)) {
            console.warn('Suspicious content detected:', { ip: clientIP, data: sanitizedData });
            return res.status(400).json({ 
                success: false, 
                message: 'Contenuto non valido rilevato' 
            });
        }

        // Check honeypot
        if (sanitizedData.website_url) {
            console.warn('Bot detected via honeypot:', { ip: clientIP });
            // Return success to not alert the bot
            return res.status(200).json({ success: true });
        }

        // Add metadata
        sanitizedData.clientIP = clientIP;
        sanitizedData.timestamp = new Date().toISOString();
        sanitizedData.source = 'cybersecurity_landing';

        // Send emails via Resend
        const [adminEmailResult, clientEmailResult] = await Promise.allSettled([
            // Email to admin
            resend.emails.send({
                from: 'IT-ERA Cybersecurity <noreply@it-era.it>',
                to: ['info@it-era.it', 'cybersecurity@it-era.it'],
                subject: '🚨 NUOVO ASSESSMENT CYBERSECURITY RICHIESTO',
                html: ADMIN_EMAIL_TEMPLATE(sanitizedData),
                tags: [
                    { name: 'type', value: 'cybersecurity_lead' },
                    { name: 'priority', value: 'high' },
                    { name: 'source', value: 'landing_page' }
                ]
            }),
            
            // Confirmation email to client
            resend.emails.send({
                from: 'IT-ERA Cybersecurity <noreply@it-era.it>',
                to: [sanitizedData.email],
                subject: '🛡️ Assessment Cybersecurity Confermato - IT-ERA',
                html: CLIENT_CONFIRMATION_TEMPLATE(sanitizedData),
                tags: [
                    { name: 'type', value: 'confirmation' },
                    { name: 'service', value: 'cybersecurity' }
                ]
            })
        ]);

        // Check if admin email failed
        if (adminEmailResult.status === 'rejected') {
            console.error('Admin email failed:', adminEmailResult.reason);
            return res.status(500).json({ 
                success: false, 
                message: 'Errore nell\'invio della richiesta' 
            });
        }

        // Log client email failure (but don't fail the request)
        if (clientEmailResult.status === 'rejected') {
            console.error('Client confirmation email failed:', clientEmailResult.reason);
        }

        // Success response
        res.status(200).json({ 
            success: true,
            message: 'Richiesta inviata con successo',
            data: {
                emailId: adminEmailResult.value.data.id,
                timestamp: sanitizedData.timestamp
            }
        });

    } catch (error) {
        console.error('Contact form error:', error);
        
        res.status(500).json({ 
            success: false, 
            message: 'Errore interno del server' 
        });
    }
}