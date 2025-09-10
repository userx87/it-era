const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware essenziale
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Dati città
let cities = {};
try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/cities-data.json'), 'utf8'));
    if (data.lombardy_cities?.major_cities) {
        data.lombardy_cities.major_cities.forEach(city => cities[city.slug] = city);
    }
} catch (e) {}

// Routes
app.get('/', (req, res) => {
    res.render('index', {
        title: 'IT-ERA - Assistenza IT Lombardia',
        description: 'Assistenza informatica professionale',
        keywords: 'assistenza IT, Lombardia',
        canonicalUrl: 'https://it-era.vercel.app',
        currentPath: '/',
        env: 'production'
    });
});

app.get('/servizi', (req, res) => {
    res.render('servizi', {
        title: 'Servizi IT - IT-ERA',
        description: 'I nostri servizi IT professionali',
        keywords: 'servizi IT',
        canonicalUrl: 'https://it-era.vercel.app/servizi',
        currentPath: '/servizi',
        env: 'production'
    });
});

app.get('/contatti', (req, res) => {
    res.render('contatti', {
        title: 'Contatti - IT-ERA',
        description: 'Contatta IT-ERA per assistenza',
        keywords: 'contatti IT-ERA',
        canonicalUrl: 'https://it-era.vercel.app/contatti',
        currentPath: '/contatti',
        env: 'production'
    });
});

app.get('/assistenza-it-:city', (req, res) => {
    const city = cities[req.params.city];
    if (!city) return res.status(404).send('Città non trovata');
    
    res.render('assistenza-it-city', {
        title: `Assistenza IT ${city.name} - IT-ERA`,
        description: `Assistenza informatica a ${city.name}`,
        keywords: `assistenza IT ${city.name}`,
        canonicalUrl: `https://it-era.vercel.app/assistenza-it-${city.slug}`,
        currentPath: `/assistenza-it-${city.slug}`,
        city: city,
        env: 'production'
    });
});

// Dynamic city pages
app.get('/assistenza-it-:city', (req, res) => {
    const city = req.params.city;
    const cityData = citiesData[city];
    
    if (!cityData) {
        return res.status(404).render('404', {
            title: 'Pagina non trovata - IT-ERA',
            message: `Assistenza IT per ${city} non disponibile`,
            env: NODE_ENV
        });
    }

    try {
        res.render('assistenza-it-city', {
            title: `Assistenza IT ${cityData.name} - Supporto Tecnico Professionale`,
            description: `Assistenza informatica professionale a ${cityData.name}. Supporto tecnico 24/7, cybersecurity e soluzioni IT per aziende.`,
            keywords: `assistenza IT ${cityData.name}, supporto tecnico ${cityData.name}, informatica ${cityData.name}`,
            canonicalUrl: getCanonicalUrl(`/assistenza-it-${city}`, NODE_ENV),
            currentPath: `/assistenza-it-${city}`,
            city: cityData,
            cityData: cityData,
            cityName: cityData.name,
            citySlug: city,
            responseTime: '15-30 min',
            coverage: 'Tutta la provincia',
            emergencyPhone: '039 888 2041',
            services: [
                'Assistenza tecnica on-site',
                'Cybersecurity avanzata',
                'Cloud storage sicuro',
                'Backup e disaster recovery',
                'Microsoft 365',
                'Networking e VoIP'
            ],
            env: NODE_ENV
        });
    } catch (error) {
        console.error(`Error rendering city page for ${city}:`, error);
        res.status(500).send('Internal Server Error');
    }
});

// Service-city pages for SEO
app.get('/:service-:city', (req, res) => {
    const service = req.params.service;
    const city = req.params.city;
    const cityData = citiesData[city];
    
    // List of valid services
    const validServices = [
        'cloud-storage', 'cybersecurity', 'backup-disaster-recovery',
        'microsoft365', 'assistenza-server', 'networking'
    ];
    
    if (!validServices.includes(service) || !cityData) {
        return res.status(404).render('404', {
            title: 'Pagina non trovata - IT-ERA',
            message: `Servizio ${service} per ${city} non disponibile`,
            env: NODE_ENV
        });
    }

    try {
        res.render('service-city', {
            title: `${service.replace('-', ' ')} ${cityData.name} - IT-ERA`,
            description: `Servizio ${service.replace('-', ' ')} professionale a ${cityData.name}. Soluzioni IT specializzate per aziende.`,
            keywords: `${service} ${cityData.name}, servizi IT ${cityData.name}`,
            canonicalUrl: getCanonicalUrl(`/${service}-${city}`, NODE_ENV),
            currentPath: `/${service}-${city}`,
            service: service,
            city: cityData,
            citySlug: city,
            env: NODE_ENV
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
        platform: 'Vercel',
        uptime: process.uptime(),
        version: '2.0.0'
    });
});

// Claude Flow API integration
const claudeFlowRouter = require('./claude-flow');
app.use('/api/claude-flow', claudeFlowRouter);

// API endpoints
app.get('/api/cities', (req, res) => {
    res.json(citiesData);
});

app.get('/api/cities/:city', (req, res) => {
    const city = req.params.city;
    const cityData = citiesData[city];

    if (!cityData) {
        return res.status(404).json({ error: 'City not found' });
    }

    res.json(cityData);
});

// Performance monitoring endpoint
app.get('/api/performance', (req, res) => {
    try {
        const monitoringConfig = getMonitoringConfig(NODE_ENV);

        // Get basic performance metrics
        const performanceMetrics = {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            environment: NODE_ENV,
            nodeVersion: process.version,
            endpoints: monitoringConfig.endpoints.map(endpoint => ({
                name: endpoint.name,
                url: endpoint.url,
                critical: endpoint.critical,
                expectedResponseTime: endpoint.expectedResponseTime
            }))
        };

        res.json(performanceMetrics);
    } catch (error) {
        console.error('Performance monitoring error:', error);
        res.status(500).json({ error: 'Performance monitoring unavailable' });
    }
});

// Core Web Vitals endpoint
app.post('/api/web-vitals', (req, res) => {
    try {
        const { lcp, fid, cls, fcp, ttfb } = req.body;

        // Generate performance report
        const report = generatePerformanceReport({
            lcp: parseFloat(lcp),
            fid: parseFloat(fid),
            cls: parseFloat(cls),
            fcp: parseFloat(fcp),
            ttfb: parseFloat(ttfb)
        });

        // Log performance data
        console.log('📊 Core Web Vitals Report:', JSON.stringify(report, null, 2));

        res.json({
            status: 'success',
            report: report
        });
    } catch (error) {
        console.error('Web Vitals tracking error:', error);
        res.status(500).json({ error: 'Web Vitals tracking failed' });
    }
});

// Sitemap
app.get('/sitemap.xml', (req, res) => {
    res.set('Content-Type', 'text/xml');

    const baseUrl = getDomain(NODE_ENV);

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/servizi</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/contatti</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <priority>0.7</priority>
    </url>`;

    // Add city pages
    Object.keys(citiesData).forEach(citySlug => {
        sitemap += `
    <url>
        <loc>${baseUrl}/assistenza-it-${citySlug}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <priority>0.6</priority>
    </url>`;
    });

    sitemap += `
</urlset>`;
    
    res.send(sitemap);
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Pagina non trovata - IT-ERA',
        message: 'La pagina richiesta non è stata trovata',
        env: NODE_ENV
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Application error:', error);
    res.status(500).render('500', {
        title: 'Errore del server - IT-ERA',
        message: 'Si è verificato un errore interno del server',
        error: NODE_ENV === 'development' ? error : {},
        env: NODE_ENV
    });
});

// Start server for local development
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 IT-ERA server running on port ${PORT}`);
        console.log(`📊 Claude Flow Dashboard: http://localhost:${PORT}/claude-flow/dashboard.html`);
        console.log(`🔗 API Health: http://localhost:${PORT}/api/claude-flow/health`);
    });
}

// Export for Vercel
module.exports = app;
