/**
 * Security Middleware
 * IT-ERA Express.js Application
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// General rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Troppe richieste da questo IP, riprova più tardi.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Strict rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 API requests per windowMs
    message: {
        error: 'Troppe richieste API, riprova più tardi.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Security headers configuration
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
                "https://embed.tawk.to",
                "https://va.tawk.to",
                "https://www.googletagmanager.com",
                "https://www.google-analytics.com",
                "https://api.openai.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com",
                "https://embed.tawk.to"
            ],
            imgSrc: [
                "'self'",
                "https:",
                "data:",
                "blob:",
                "https://www.google-analytics.com",
                "https://www.googletagmanager.com",
                "https://embed.tawk.to"
            ],
            connectSrc: [
                "'self'",
                "https:",
                "https://api.openai.com",
                "https://www.google-analytics.com",
                "https://www.googletagmanager.com",
                "https://embed.tawk.to",
                "https://va.tawk.to"
            ],
            fontSrc: [
                "'self'",
                "https:",
                "https://fonts.gstatic.com",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            frameSrc: [
                "'self'",
                "https://embed.tawk.to",
                "https://www.google.com"
            ],
            workerSrc: ["'self'", "blob:"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'", "https:"],
            frameAncestors: ["'none'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'https://it-era.it',
            'https://www.it-era.it',
            'http://localhost:3000',
            'http://localhost:8080'
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Non autorizzato da CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${ip} - UA: ${userAgent}`);
    next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
        success: false,
        message: isDevelopment ? err.message : 'Si è verificato un errore interno',
        ...(isDevelopment && { stack: err.stack })
    });
};

module.exports = {
    generalLimiter,
    apiLimiter,
    securityHeaders,
    corsOptions,
    requestLogger,
    errorHandler
};
