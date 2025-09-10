#!/usr/bin/env node

/**
 * IT-ERA Node.js Application Entry Point
 * Main application file for Plesk Node.js hosting
 * 
 * This file serves as the entry point for the IT-ERA website
 * when deployed on Plesk with Node.js support enabled.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express application
const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'web')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Load cities data
let citiesData = {};
try {
    const citiesDataPath = path.join(__dirname, 'data', 'cities-data.json');
    if (fs.existsSync(citiesDataPath)) {
        citiesData = JSON.parse(fs.readFileSync(citiesDataPath, 'utf8'));
        console.log('✅ Cities data loaded successfully');
    } else {
        console.warn('⚠️ Cities data file not found');
    }
} catch (error) {
    console.error('❌ Error loading cities data:', error.message);
}

// Routes

// Homepage
app.get('/', (req, res) => {
    try {
        res.render('index', {
            title: 'IT-ERA - Assistenza IT Professionale in Lombardia',
            description: 'Assistenza informatica 24/7 per aziende in Lombardia. Supporto tecnico specializzato, cybersecurity e soluzioni IT professionali.',
            keywords: 'assistenza informatica, IT support, cybersecurity, Lombardia, Milano, Bergamo',
            canonicalUrl: 'https://it-era.it',
            currentPath: '/'
        });
    } catch (error) {
        console.error('Error rendering homepage:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Services page
app.get('/servizi', (req, res) => {
    try {
        res.render('servizi', {
            title: 'Servizi IT Professionali - IT-ERA',
            description: 'Scopri tutti i nostri servizi IT: assistenza tecnica, cybersecurity, cloud storage, backup e disaster recovery.',
            keywords: 'servizi IT, assistenza tecnica, cybersecurity, cloud storage, backup',
            canonicalUrl: 'https://it-era.it/servizi',
            currentPath: '/servizi'
        });
    } catch (error) {
        console.error('Error rendering services page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Dynamic city pages
app.get('/assistenza-it-:city', (req, res) => {
    const city = req.params.city;
    const cityData = citiesData[city];
    
    if (!cityData) {
        return res.status(404).render('404', {
            title: 'Pagina non trovata - IT-ERA',
            message: `Assistenza IT per ${city} non disponibile`
        });
    }

    try {
        res.render('assistenza-it-city', {
            title: `Assistenza IT ${cityData.name} - Supporto Tecnico Professionale`,
            description: `Assistenza informatica professionale a ${cityData.name}. Supporto tecnico 24/7, cybersecurity e soluzioni IT per aziende.`,
            keywords: `assistenza IT ${cityData.name}, supporto tecnico ${cityData.name}, informatica ${cityData.name}`,
            canonicalUrl: `https://it-era.it/assistenza-it-${city}`,
            currentPath: `/assistenza-it-${city}`,
            city: cityData,
            citySlug: city
        });
    } catch (error) {
        console.error(`Error rendering city page for ${city}:`, error);
        res.status(500).send('Internal Server Error');
    }
});

// Dynamic service-city pages
app.get('/:service-:city', (req, res) => {
    const service = req.params.service;
    const city = req.params.city;
    const cityData = citiesData[city];
    
    // List of valid services
    const validServices = [
        'cloud-storage',
        'backup-disaster-recovery',
        'cybersecurity',
        'riparazione-pc',
        'assistenza-server'
    ];
    
    if (!validServices.includes(service) || !cityData) {
        return res.status(404).render('404', {
            title: 'Pagina non trovata - IT-ERA',
            message: 'Servizio o città non disponibile'
        });
    }

    try {
        res.render('service-city', {
            title: `${service.replace('-', ' ').toUpperCase()} ${cityData.name} - IT-ERA`,
            description: `Servizi di ${service.replace('-', ' ')} professionali a ${cityData.name}. Soluzioni IT specializzate per aziende.`,
            keywords: `${service} ${cityData.name}, servizi IT ${cityData.name}`,
            canonicalUrl: `https://it-era.it/${service}-${city}`,
            currentPath: `/${service}-${city}`,
            service: service,
            city: cityData,
            citySlug: city
        });
    } catch (error) {
        console.error(`Error rendering service-city page for ${service}-${city}:`, error);
        res.status(500).send('Internal Server Error');
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        port: PORT,
        uptime: process.uptime()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Pagina non trovata - IT-ERA',
        message: 'La pagina richiesta non è stata trovata'
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Application error:', error);
    res.status(500).render('500', {
        title: 'Errore del server - IT-ERA',
        message: 'Si è verificato un errore interno del server'
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log('🚀 IT-ERA server running on port', PORT);
    console.log('📍 Environment:', NODE_ENV);
    console.log('🌐 URL: http://localhost:' + PORT);
    console.log('⏰ Started at:', new Date().toISOString());
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Export app for testing
module.exports = app;
