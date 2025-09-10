/**
 * Microsoft 365 Quote API Route
 * Converted from PHP to Node.js
 * Handles form submission, validation, and email sending
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

// Rate limiting middleware
const quoteRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Max 5 requests per window
    message: {
        success: false,
        message: 'Troppe richieste. Riprova tra qualche minuto.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Validation middleware
const validateQuoteForm = [
    body('nome')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome non valido (minimo 2 caratteri)'),
    
    body('azienda')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Nome azienda richiesto'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email non valida'),
    
    body('telefono')
        .optional()
        .matches(/^[+]?[\d\s\-\(\)]{6,20}$/)
        .withMessage('Numero di telefono non valido'),
    
    body('utenti')
        .isInt({ min: 1, max: 10000 })
        .withMessage('Numero di utenti non valido'),
    
    body('piano_interesse')
        .isIn(['business-basic', 'business-standard', 'business-premium', 'enterprise'])
        .withMessage('Piano di interesse non valido'),
    
    body('messaggio')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Messaggio troppo lungo'),
    
    // Honeypot field (should be empty)
    body('website')
        .isEmpty()
        .withMessage('Richiesta non valida')
];

// Email configuration
const createEmailTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });
};

// Logging function
const logActivity = async (message, level = 'INFO', req = null) => {
    try {
        const logDir = path.join(__dirname, '../../logs');
        const logFile = path.join(logDir, 'microsoft365-form.log');
        
        // Ensure log directory exists
        await fs.mkdir(logDir, { recursive: true });
        
        const timestamp = new Date().toISOString();
        const ip = req ? (req.ip || req.connection.remoteAddress || 'unknown') : 'system';
        const logMessage = `[${timestamp}] [${level}] [IP: ${ip}] ${message}\n`;
        
        await fs.appendFile(logFile, logMessage);
    } catch (error) {
        console.error('Logging error:', error);
    }
};

// Save quote request to file
const saveQuoteRequest = async (data) => {
    try {
        const quotesDir = path.join(__dirname, '../../data/quotes');
        await fs.mkdir(quotesDir, { recursive: true });
        
        const filename = `quote-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID()}.json`;
        const filePath = path.join(quotesDir, filename);
        
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        await logActivity(`Failed to save quote: ${error.message}`, 'ERROR');
        return false;
    }
};

// Send notification email to IT-ERA
const sendNotificationEmail = async (formData) => {
    try {
        const transporter = createEmailTransporter();
        
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: 'info@it-era.it',
            subject: `Nuova Richiesta Microsoft 365 - ${formData.azienda}`,
            html: `
                <h2>Nuova Richiesta Preventivo Microsoft 365</h2>
                <p><strong>Nome:</strong> ${formData.nome}</p>
                <p><strong>Azienda:</strong> ${formData.azienda}</p>
                <p><strong>Email:</strong> ${formData.email}</p>
                <p><strong>Telefono:</strong> ${formData.telefono || 'Non fornito'}</p>
                <p><strong>Numero Utenti:</strong> ${formData.utenti}</p>
                <p><strong>Piano di Interesse:</strong> ${formData.piano_interesse}</p>
                <p><strong>Messaggio:</strong> ${formData.messaggio || 'Nessun messaggio'}</p>
                <p><strong>Città:</strong> ${formData.city}</p>
                <p><strong>Pagina Sorgente:</strong> ${formData.source_page}</p>
                <p><strong>Data:</strong> ${formData.timestamp}</p>
                <p><strong>IP:</strong> ${formData.ip_address}</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        await logActivity(`Email notification failed: ${error.message}`, 'ERROR');
        return false;
    }
};

// Send auto-response to customer
const sendAutoResponse = async (formData) => {
    try {
        const transporter = createEmailTransporter();
        
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: formData.email,
            subject: 'Conferma Richiesta Microsoft 365 - IT-ERA',
            html: `
                <h2>Grazie per la tua richiesta!</h2>
                <p>Ciao ${formData.nome},</p>
                <p>Abbiamo ricevuto la tua richiesta per Microsoft 365 per ${formData.utenti} utenti.</p>
                <p>Il nostro team ti contatterà entro 2 ore lavorative per fornirti un preventivo personalizzato.</p>
                <p><strong>Dettagli della richiesta:</strong></p>
                <ul>
                    <li>Azienda: ${formData.azienda}</li>
                    <li>Numero Utenti: ${formData.utenti}</li>
                    <li>Piano: ${formData.piano_interesse}</li>
                </ul>
                <p>Per qualsiasi urgenza, contattaci al <strong>039 888 2041</strong></p>
                <p>Cordiali saluti,<br>Il Team IT-ERA</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        await logActivity(`Auto-response failed: ${error.message}`, 'ERROR');
        return false;
    }
};

// Main route handler
router.post('/', quoteRateLimit, validateQuoteForm, async (req, res) => {
    try {
        // Check validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await logActivity(`Validation errors: ${errors.array().map(e => e.msg).join(', ')}`, 'WARNING', req);
            return res.status(400).json({
                success: false,
                message: 'Errori di validazione: ' + errors.array().map(e => e.msg).join(', ')
            });
        }
        
        // Collect and sanitize form data
        const formData = {
            nome: req.body.nome,
            azienda: req.body.azienda,
            email: req.body.email,
            telefono: req.body.telefono || '',
            utenti: parseInt(req.body.utenti),
            piano_interesse: req.body.piano_interesse,
            messaggio: req.body.messaggio || '',
            city: req.body.city || 'Milano',
            source_page: req.body.source_page || 'Microsoft 365 Milano',
            user_agent: req.get('User-Agent') || '',
            ip_address: req.ip || req.connection.remoteAddress || 'unknown',
            timestamp: new Date().toISOString()
        };
        
        // Log successful form submission
        await logActivity(`Form submitted: ${formData.nome} (${formData.email}) - ${formData.utenti} utenti`, 'INFO', req);
        
        // Send emails and save data
        const [notificationSent, autoResponseSent, saved] = await Promise.all([
            sendNotificationEmail(formData),
            sendAutoResponse(formData),
            saveQuoteRequest(formData)
        ]);
        
        if (notificationSent && autoResponseSent) {
            await logActivity(`Emails sent successfully for: ${formData.email}`, 'INFO', req);
            res.json({
                success: true,
                message: 'Richiesta inviata con successo! Riceverai presto una risposta personalizzata.',
                data: {
                    notification_sent: notificationSent,
                    auto_response_sent: autoResponseSent,
                    saved: saved
                }
            });
        } else {
            await logActivity(`Email sending failed for: ${formData.email}`, 'ERROR', req);
            res.status(500).json({
                success: false,
                message: 'Si è verificato un errore nell\'invio. Riprova o contattaci direttamente.'
            });
        }
        
    } catch (error) {
        await logActivity(`Exception: ${error.message}`, 'ERROR', req);
        res.status(500).json({
            success: false,
            message: 'Si è verificato un errore interno. Riprova più tardi.'
        });
    }
});

module.exports = router;
