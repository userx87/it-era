/**
 * Main Routes Configuration
 * IT-ERA Express.js Application
 */

const express = require('express');
const router = express.Router();

// Import API routes
const microsoft365QuoteRouter = require('./api/microsoft365-quote');

// Import page routes
// const citiesRouter = require('./pages/cities');
// const servicesRouter = require('./pages/services');

// API Routes
router.use('/api/microsoft365-quote', microsoft365QuoteRouter);

// General API routes
router.post('/api/quote', (req, res) => {
    const { company, employees, services, budget } = req.body;
    
    // Process quote request
    console.log('Quote request:', { company, employees, services, budget });
    
    res.json({
        success: true,
        message: 'Richiesta preventivo ricevuta. Ti invieremo un preventivo personalizzato entro 2 ore.'
    });
});

// Contact form route
router.post('/api/contact', (req, res) => {
    const { name, email, message, phone } = req.body;
    
    // Process contact form
    console.log('Contact form:', { name, email, message, phone });
    
    res.json({
        success: true,
        message: 'Messaggio inviato con successo. Ti risponderemo presto!'
    });
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
    });
});

module.exports = router;
