#!/usr/bin/env node

/**
 * IT-ERA Page Generator
 * Automatizza la creazione di nuove pagine usando il template system
 * 
 * Usage: node scripts/generate-page.js <page-type> <page-name>
 * Example: node scripts/generate-page.js settore "studi-veterinari"
 */

const fs = require('fs');
const path = require('path');

// Configuration per tipi di pagina
const PAGE_CONFIGS = {
    servizio: {
        template: 'page-template.html',
        directory: 'web/pages',
        titlePrefix: 'Servizio',
        descriptionTemplate: 'Servizio IT specializzato: {{SERVICE_NAME}}. Supporto professionale 24/7 per aziende in Lombardia.',
        keywordsTemplate: 'IT {{SERVICE_NAME}}, supporto tecnico Lombardia, assistenza informatica Milano',
        heroGradient: 'from-primary-500 to-primary-600',
        iconClass: 'fas fa-cogs'
    },
    settore: {
        template: 'page-template.html', 
        directory: 'web/pages',
        titlePrefix: 'Soluzioni IT per',
        descriptionTemplate: 'Soluzioni IT specializzate per {{SECTOR_NAME}} in Lombardia: sicurezza, backup, gestione dati. Supporto 24/7.',
        keywordsTemplate: 'IT {{SECTOR_NAME}} Lombardia, sicurezza informatica {{SECTOR_SIMPLE}}, software gestionale {{SECTOR_SIMPLE}}',
        heroGradient: 'from-secondary-500 to-primary-600',
        iconClass: 'fas fa-building'
    },
    citta: {
        template: 'page-template.html',
        directory: 'web/pages',
        titlePrefix: 'Assistenza IT',
        descriptionTemplate: 'Assistenza IT professionale a {{CITY_NAME}}: supporto tecnico, sicurezza informatica, cloud storage. Intervento in 15 minuti.',
        keywordsTemplate: 'assistenza IT {{CITY_NAME}}, supporto tecnico {{CITY_NAME}}, sicurezza informatica {{CITY_NAME}}',
        heroGradient: 'from-accent-500 to-primary-600',
        iconClass: 'fas fa-map-marker-alt'
    }
};

// Template content builders
const CONTENT_BUILDERS = {
    settore: (data) => `
    <!-- Hero Section -->
    <section class="bg-gradient-to-r ${data.heroGradient} text-white py-20">
        <div class="container">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                    <h1 class="text-4xl lg:text-6xl font-bold mb-6">
                        <span class="text-yellow-400">Soluzioni IT</span><br>
                        per ${data.sectorDisplayName}
                    </h1>
                    <p class="text-xl lg:text-2xl text-blue-100 mb-8">
                        Tecnologie specializzate per <strong class="text-white">${data.sectorDisplayName}</strong>: 
                        sicurezza dati, backup automatici, gestione documentale e conformità normative.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4">
                        <a href="tel:+390398882041" 
                           class="bg-accent-500 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-accent-600 transition-all transform hover:scale-105 shadow-2xl">
                            <i class="fas fa-phone mr-3"></i>
                            Emergenza: 039 888 2041
                        </a>
                        <a href="#preventivo" 
                           class="bg-white/20 backdrop-blur text-white border-2 border-white/30 px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/30 transition-all">
                            <i class="${data.iconClass} mr-3"></i>
                            Consulenza Gratuita
                        </a>
                    </div>
                </div>
                <div class="bg-white/10 backdrop-blur p-8 rounded-3xl">
                    <h3 class="text-2xl font-bold mb-6">Specializzati in:</h3>
                    <ul class="space-y-4 text-lg">
                        <li class="flex items-center">
                            <i class="fas fa-shield-alt text-yellow-400 mr-4"></i>
                            Sicurezza informatica avanzata
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-cloud-upload-alt text-yellow-400 mr-4"></i>
                            Backup automatici certificati
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-file-alt text-yellow-400 mr-4"></i>
                            Gestione documentale digitale
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-user-shield text-yellow-400 mr-4"></i>
                            Conformità normative GDPR
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- Solutions Section -->
    <section class="py-20">
        <div class="container">
            <div class="text-center mb-16">
                <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                    Soluzioni IT <span class="text-primary-500">per ${data.sectorDisplayName}</span>
                </h2>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    Tecnologie specifiche per il settore ${data.sectorSimple}, dalla gestione dati alla sicurezza avanzata
                </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <!-- Service 1 -->
                <div class="bg-white p-8 rounded-2xl shadow-xl">
                    <div class="w-16 h-16 bg-primary-500 text-white rounded-2xl flex items-center justify-center mb-6">
                        <i class="fas fa-database text-2xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Gestione Dati Professionale</h3>
                    <p class="text-gray-600 mb-6">
                        Sistema avanzato per organizzare e proteggere i dati specifici del settore ${data.sectorSimple}.
                    </p>
                    <ul class="space-y-3">
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                            <span>Archiviazione sicura e organizzata</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                            <span>Backup automatici giornalieri</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                            <span>Accesso sicuro da qualsiasi dispositivo</span>
                        </li>
                    </ul>
                </div>

                <!-- Service 2 -->
                <div class="bg-white p-8 rounded-2xl shadow-xl">
                    <div class="w-16 h-16 bg-secondary-500 text-white rounded-2xl flex items-center justify-center mb-6">
                        <i class="fas fa-shield-check text-2xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Sicurezza Avanzata</h3>
                    <p class="text-gray-600 mb-6">
                        Protezione completa per dati sensibili con conformità alle normative di settore.
                    </p>
                    <ul class="space-y-3">
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                            <span>Crittografia end-to-end</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                            <span>Controllo accessi granulare</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                            <span>Conformità GDPR completa</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section id="preventivo" class="py-20 bg-primary-500 text-white">
        <div class="container text-center">
            <h2 class="text-3xl lg:text-4xl font-bold mb-6">
                Trasforma l'IT del tuo <span class="text-yellow-400">${data.sectorSimple}</span>
            </h2>
            <p class="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                Ricevi una consulenza gratuita e scopri come ottimizzare 
                l'IT del tuo ${data.sectorSimple} con soluzioni specializzate
            </p>
            
            <div class="bg-white/10 backdrop-blur rounded-3xl p-8 max-w-2xl mx-auto">
                <form class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Nome ${data.sectorDisplayName}" required 
                               class="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
                        <input type="tel" placeholder="Telefono" required 
                               class="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
                    </div>
                    <select required class="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
                        <option value="" class="text-gray-900">Di cosa hai bisogno?</option>
                        <option value="gestione-dati" class="text-gray-900">Gestione Dati</option>
                        <option value="sicurezza" class="text-gray-900">Sicurezza Informatica</option>
                        <option value="backup" class="text-gray-900">Backup e Recovery</option>
                        <option value="consulenza" class="text-gray-900">Consulenza Generale</option>
                    </select>
                    <button type="submit" 
                            class="w-full bg-yellow-400 text-primary-500 py-4 rounded-xl text-lg font-bold hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg">
                        <i class="${data.iconClass} mr-3"></i>
                        Richiedi Consulenza Gratuita
                    </button>
                </form>
            </div>

            <div class="mt-8">
                <a href="tel:+390398882041" 
                   class="inline-flex items-center bg-accent-500 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-accent-600 transition-all transform hover:scale-105 shadow-2xl">
                    <i class="fas fa-phone mr-3"></i>
                    Emergenza: 039 888 2041
                </a>
            </div>
        </div>
    </section>
    `
};

function generatePage(pageType, pageName, options = {}) {
    console.log(`🚀 Generazione pagina: ${pageType}/${pageName}`);

    // Validazione input
    if (!PAGE_CONFIGS[pageType]) {
        console.error(`❌ Tipo pagina non supportato: ${pageType}`);
        console.log('Tipi supportati:', Object.keys(PAGE_CONFIGS).join(', '));
        process.exit(1);
    }

    const config = PAGE_CONFIGS[pageType];
    const templatePath = path.join(__dirname, '..', 'web/templates', config.template);
    const outputDir = path.join(__dirname, '..', config.directory);
    const outputPath = path.join(outputDir, `${pageType}-${pageName}.html`);

    // Lettura template
    if (!fs.existsSync(templatePath)) {
        console.error(`❌ Template non trovato: ${templatePath}`);
        process.exit(1);
    }

    let template = fs.readFileSync(templatePath, 'utf8');

    // Preparazione dati per la sostituzione
    const data = {
        pageName,
        pageType,
        heroGradient: config.heroGradient,
        iconClass: config.iconClass,
        sectorDisplayName: options.displayName || pageName.charAt(0).toUpperCase() + pageName.slice(1),
        sectorSimple: options.simple || pageName,
        ...options
    };

    // Sostituzioni nei placeholder
    const replacements = {
        '{{PAGE_TITLE}}': `${config.titlePrefix} ${data.sectorDisplayName}`,
        '{{META_DESCRIPTION}}': config.descriptionTemplate
            .replace('{{SERVICE_NAME}}', data.sectorDisplayName)
            .replace('{{SECTOR_NAME}}', data.sectorDisplayName)
            .replace('{{CITY_NAME}}', data.sectorDisplayName),
        '{{META_KEYWORDS}}': config.keywordsTemplate
            .replace('{{SERVICE_NAME}}', pageName)
            .replace('{{SECTOR_NAME}}', pageName)
            .replace('{{SECTOR_SIMPLE}}', data.sectorSimple)
            .replace('{{CITY_NAME}}', pageName),
        '{{CANONICAL_URL}}': `https://it-era.it/pages/${pageType}-${pageName}.html`,
        '{{PAGE_CONTENT}}': CONTENT_BUILDERS[pageType] ? CONTENT_BUILDERS[pageType](data) : '<!-- Content here -->'
    };

    // Applicazione sostituzioni
    Object.entries(replacements).forEach(([placeholder, value]) => {
        template = template.replace(new RegExp(placeholder, 'g'), value);
    });

    // Creazione directory se non esiste
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Scrittura file
    fs.writeFileSync(outputPath, template);
    console.log(`✅ Pagina generata: ${outputPath}`);

    // Update sitemap (opzionale)
    updateSitemap(pageType, pageName);
    
    return outputPath;
}

function updateSitemap(pageType, pageName) {
    const sitemapPath = path.join(__dirname, '..', 'web/sitemap.xml');
    
    if (fs.existsSync(sitemapPath)) {
        let sitemap = fs.readFileSync(sitemapPath, 'utf8');
        
        const newUrl = `
    <url>
        <loc>https://it-era.it/pages/${pageType}-${pageName}.html</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`;
        
        sitemap = sitemap.replace('</urlset>', newUrl + '\n</urlset>');
        fs.writeFileSync(sitemapPath, sitemap);
        console.log(`✅ Sitemap aggiornata`);
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log(`
🎯 IT-ERA Page Generator

Usage: node generate-page.js <type> <name> [options]

Types:
  - servizio: Pagina servizio IT
  - settore: Pagina settore specializzato  
  - citta: Pagina assistenza per città

Examples:
  node generate-page.js settore "studi-veterinari"
  node generate-page.js servizio "cloud-backup"
  node generate-page.js citta "brescia"

Options (JSON):
  --displayName "Nome Visualizzato"
  --simple "nome-semplice"
        `);
        process.exit(1);
    }

    const [pageType, pageName, ...optionArgs] = args;
    const options = {};
    
    // Parse options
    for (let i = 0; i < optionArgs.length; i += 2) {
        if (optionArgs[i].startsWith('--')) {
            const key = optionArgs[i].substring(2);
            const value = optionArgs[i + 1];
            options[key] = value;
        }
    }

    generatePage(pageType, pageName, options);
}

module.exports = { generatePage, PAGE_CONFIGS };