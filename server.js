#!/usr/bin/env node
/**
 * IT-ERA Express.js Server
 * Converted from static HTML to dynamic Node.js application
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://www.google-analytics.com"]
        }
    }
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files middleware
app.use('/css', express.static(path.join(__dirname, 'web/css'), {
    maxAge: '1y',
    etag: true
}));
app.use('/js', express.static(path.join(__dirname, 'web/js'), {
    maxAge: '1y',
    etag: true
}));
app.use('/images', express.static(path.join(__dirname, 'web/images'), {
    maxAge: '1y',
    etag: true
}));
app.use('/static', express.static(path.join(__dirname, 'web/static'), {
    maxAge: '1y',
    etag: true
}));

// Template engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// SEO and page data
const seoData = {
    default: {
        title: 'IT-ERA | Assistenza IT e Sicurezza Informatica per Aziende in Lombardia',
        description: 'IT-ERA: assistenza IT professionale, sicurezza informatica e cloud storage per aziende in Lombardia. Supporto tecnico specializzato 24/7.',
        keywords: 'assistenza IT Lombardia, sicurezza informatica Milano, cloud storage Bergamo',
        canonical: 'https://it-era.it'
    },
    pages: {}
};

// Load SEO data from converted files
function loadSEOData() {
    const seoFile = path.join(__dirname, 'data/seo-data.json');
    if (fs.existsSync(seoFile)) {
        const data = JSON.parse(fs.readFileSync(seoFile, 'utf8'));
        seoData.pages = data;
    }
}

// Middleware to inject SEO data
app.use((req, res, next) => {
    const pagePath = req.path === '/' ? 'index' : req.path.slice(1);
    const pageData = seoData.pages[pagePath] || seoData.default;
    
    res.locals.pageTitle = pageData.title;
    res.locals.pageDescription = pageData.description;
    res.locals.pageKeywords = pageData.keywords;
    res.locals.canonicalUrl = pageData.canonical || `https://it-era.it${req.path}`;
    res.locals.currentPath = req.path;
    
    next();
});

// Routes

// Homepage
app.get('/', (req, res) => {
    res.render('index', {
        pageTitle: 'IT-ERA | Assistenza IT e Sicurezza Informatica per Aziende in Lombardia - Supporto 24/7',
        heroTitle: 'Assistenza IT Professionale per la tua Azienda',
        heroSubtitle: 'Supporto tecnico specializzato 24/7 in tutta la Lombardia',
        trustIndicators: {
            responseTime: '15 minuti',
            clients: '500+',
            successRate: '95%'
        }
    });
});

// Core pages
app.get('/servizi', (req, res) => {
    res.render('servizi', {
        pageTitle: 'Servizi IT Professionali | IT-ERA Lombardia',
        services: [
            {
                name: 'Assistenza IT',
                description: 'Supporto tecnico completo per la tua infrastruttura IT',
                icon: 'computer'
            },
            {
                name: 'Sicurezza Informatica',
                description: 'Protezione avanzata contro cyber minacce',
                icon: 'shield'
            },
            {
                name: 'Cloud Storage',
                description: 'Soluzioni cloud sicure e scalabili',
                icon: 'cloud'
            }
        ]
    });
});

app.get('/contatti', (req, res) => {
    res.render('contatti', {
        pageTitle: 'Contatti | IT-ERA - Assistenza IT Lombardia',
        contactInfo: {
            phone: '039 888 2041',
            email: 'info@it-era.it',
            address: 'Lombardia, Italia',
            hours: 'Lun-Ven 8:00-18:00, Emergenze 24/7'
        }
    });
});

app.get('/chi-siamo', (req, res) => {
    res.render('chi-siamo', {
        pageTitle: 'Chi Siamo | IT-ERA - La tua Azienda IT di Fiducia',
        companyInfo: {
            founded: '2015',
            employees: '25+',
            experience: '9+ anni',
            certifications: ['Microsoft Partner', 'Cisco Certified', 'VMware Partner']
        }
    });
});

// Sectoral pages
app.get('/settori-studi-legali', (req, res) => {
    res.render('settori-studi-legali', {
        pageTitle: 'IT per Studi Legali | Soluzioni Specializzate IT-ERA',
        sector: 'Studi Legali',
        specializations: [
            'Gestione documentale sicura',
            'Backup automatizzato',
            'Compliance GDPR',
            'Sistemi di videoconferenza'
        ]
    });
});

app.get('/settori-commercialisti', (req, res) => {
    res.render('settori-commercialisti', {
        pageTitle: 'IT per Commercialisti | Soluzioni IT-ERA',
        sector: 'Commercialisti',
        specializations: [
            'Software gestionale integrato',
            'Sicurezza dati fiscali',
            'Backup cloud certificato',
            'Supporto software contabile'
        ]
    });
});

app.get('/settori-studi-medici', (req, res) => {
    res.render('settori-studi-medici', {
        pageTitle: 'IT per Studi Medici | Soluzioni Sanitarie IT-ERA',
        sector: 'Studi Medici',
        specializations: [
            'Gestione cartelle cliniche',
            'Sicurezza dati sanitari',
            'Telemedicina',
            'Backup GDPR compliant'
        ]
    });
});

app.get('/settori-pmi-startup', (req, res) => {
    res.render('settori-pmi-startup', {
        pageTitle: 'IT per PMI e Startup | Soluzioni Scalabili IT-ERA',
        sector: 'PMI e Startup',
        specializations: [
            'Infrastruttura scalabile',
            'Cloud computing',
            'Sicurezza informatica',
            'Supporto crescita digitale'
        ]
    });
});

// Load cities data
const citiesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/cities-data.json'), 'utf8'));

// City pages - Dynamic routing with data
citiesData.lombardy_cities.major_cities.forEach(cityData => {
    app.get(`/assistenza-it-${cityData.slug}`, (req, res) => {
        res.render('assistenza-it-city', {
            pageTitle: `Assistenza IT ${cityData.name} | Supporto Tecnico IT-ERA`,
            pageDescription: `Assistenza IT professionale a ${cityData.name}. Supporto tecnico 24/7, manutenzione sistemi e consulenza informatica per aziende in ${cityData.province}.`,
            pageKeywords: `assistenza IT ${cityData.name}, supporto tecnico ${cityData.name}, consulenza informatica ${cityData.province}`,
            cityName: cityData.name,
            citySlug: cityData.slug,
            cityData: cityData,
            services: [
                'Assistenza tecnica on-site',
                'Supporto remoto 24/7',
                'Manutenzione preventiva',
                'Consulenza IT strategica'
            ],
            responseTime: cityData.response_time || '30 minuti',
            coverage: cityData.coverage_area || `Tutta l'area di ${cityData.name} e provincia`
        });
    });
});

// Dynamic service-city routing
const serviceTypes = ['sicurezza-informatica', 'cloud-storage', 'backup-disaster-recovery', 'microsoft-365', 'voip-centralino', 'firewall-watchguard'];

serviceTypes.forEach(serviceType => {
    citiesData.lombardy_cities.major_cities.forEach(cityData => {
        app.get(`/${serviceType}-${cityData.slug}`, (req, res) => {
            const serviceTemplate = citiesData.lombardy_cities.service_templates[serviceType.replace('-', '_')] ||
                                   citiesData.lombardy_cities.service_templates['assistenza-it'];

            const title = serviceTemplate.title.replace(/{city}/g, cityData.name);
            const description = serviceTemplate.description.replace(/{city}/g, cityData.name).replace(/{province}/g, cityData.province);
            const keywords = serviceTemplate.keywords.replace(/{city}/g, cityData.name).replace(/{province}/g, cityData.province);

            res.render('service-city', {
                pageTitle: title,
                pageDescription: description,
                pageKeywords: keywords,
                cityName: cityData.name,
                citySlug: cityData.slug,
                cityData: cityData,
                serviceType: serviceType,
                serviceName: serviceType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                serviceData: serviceTemplate,
                responseTime: cityData.response_time || '30 minuti',
                coverage: cityData.coverage_area || `Tutta l'area di ${cityData.name} e provincia`
            });
        });
    });
});

// Service pages
app.get('/sicurezza-informatica', (req, res) => {
    res.render('sicurezza-informatica', {
        pageTitle: 'Sicurezza Informatica Aziendale | Protezione Cyber IT-ERA',
        services: [
            'Firewall e antivirus enterprise',
            'Monitoraggio 24/7',
            'Backup e disaster recovery',
            'Formazione cybersecurity'
        ]
    });
});

app.get('/cloud-storage', (req, res) => {
    res.render('cloud-storage', {
        pageTitle: 'Cloud Storage Aziendale | Soluzioni Cloud IT-ERA',
        benefits: [
            'Accesso da qualsiasi dispositivo',
            'Backup automatico',
            'Sincronizzazione real-time',
            'Sicurezza enterprise'
        ]
    });
});

// API endpoints
app.post('/api/contact', (req, res) => {
    const { name, email, phone, message, service } = req.body;
    
    // Basic validation
    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            error: 'Campi obbligatori mancanti'
        });
    }
    
    // Here you would typically send email, save to database, etc.
    console.log('Contact form submission:', { name, email, phone, message, service });
    
    res.json({
        success: true,
        message: 'Messaggio inviato con successo. Ti contatteremo entro 15 minuti!'
    });
});

app.post('/api/quote', (req, res) => {
    const { company, employees, services, budget } = req.body;
    
    // Process quote request
    console.log('Quote request:', { company, employees, services, budget });
    
    res.json({
        success: true,
        message: 'Richiesta preventivo ricevuta. Ti invieremo un preventivo personalizzato entro 2 ore.'
    });
});

// Blog routes (if needed)
app.get('/blog', (req, res) => {
    res.render('blog/index', {
        pageTitle: 'Blog IT-ERA | News e Guide Tecnologiche',
        posts: [] // Load from database or files
    });
});

// Sitemap
app.get('/sitemap.xml', (req, res) => {
    res.set('Content-Type', 'text/xml');
    
    const urls = [
        { loc: 'https://it-era.it/', priority: '1.0' },
        { loc: 'https://it-era.it/servizi', priority: '0.9' },
        { loc: 'https://it-era.it/contatti', priority: '0.9' },
        { loc: 'https://it-era.it/chi-siamo', priority: '0.8' }
    ];
    
    // Add city pages
    cities.forEach(city => {
        urls.push({
            loc: `https://it-era.it/assistenza-it-${city}`,
            priority: '0.7'
        });
    });
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <priority>${url.priority}</priority>
    <changefreq>weekly</changefreq>
  </url>`).join('\n')}
</urlset>`;
    
    res.send(sitemap);
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(`User-agent: *
Allow: /

Sitemap: https://it-era.it/sitemap.xml

Disallow: /admin/
Disallow: /api/
Disallow: /temp/`);
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', {
        pageTitle: 'Pagina non trovata | IT-ERA',
        requestedUrl: req.originalUrl
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).render('error', {
        pageTitle: 'Errore del server | IT-ERA',
        error: NODE_ENV === 'development' ? err : {}
    });
});

// Initialize and start server
loadSEOData();

app.listen(PORT, () => {
    console.log(`🚀 IT-ERA server running on port ${PORT}`);
    console.log(`📍 Environment: ${NODE_ENV}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
});

module.exports = app;
