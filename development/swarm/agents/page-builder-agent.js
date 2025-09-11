#!/usr/bin/env node

/**
 * 🏗️ PAGE BUILDER AGENT - Swarm Agent per creazione pagine categorizzate
 * Crea pagine ottimizzate per ogni categoria con design system unificato
 */

const fs = require('fs');
const path = require('path');
const BaseAgent = require('./base-agent');

class PageBuilderAgent extends BaseAgent {
    constructor() {
        super('PageBuilder', '🏗️');
        
        this.domain = 'http://it-era.it';
        this.brandName = 'IT-ERA';
        this.brandTagline = 'Assistenza IT Professionale';
        
        // Template base per tutte le pagine
        this.baseTemplate = {
            doctype: '<!DOCTYPE html>',
            lang: 'it',
            charset: 'UTF-8',
            viewport: 'width=device-width, initial-scale=1.0',
            tailwindCDN: 'https://cdn.tailwindcss.com',
            tailwindConfig: '/css/tailwind-config.js',
            mainCSS: '/css/it-era-tailwind.css'
        };
        
        // Configurazioni per categorie
        this.categoryConfigs = {
            'sicurezza-informatica': {
                title: 'Sicurezza Informatica',
                description: 'Servizi completi di sicurezza informatica per proteggere la tua azienda da minacce cyber',
                icon: '🔒',
                color: 'red',
                services: [
                    { name: 'Firewall Aziendali', desc: 'Protezione perimetrale avanzata', icon: '🛡️' },
                    { name: 'Antivirus Enterprise', desc: 'Protezione endpoint completa', icon: '🦠' },
                    { name: 'Backup e Disaster Recovery', desc: 'Continuità operativa garantita', icon: '💾' },
                    { name: 'Audit di Sicurezza', desc: 'Valutazione vulnerabilità', icon: '🔍' },
                    { name: 'Penetration Testing', desc: 'Test di sicurezza avanzati', icon: '⚡' }
                ]
            },
            'assistenza-tecnica': {
                title: 'Assistenza Tecnica',
                description: 'Supporto IT completo per la tua azienda con interventi rapidi e risolutivi',
                icon: '🛠️',
                color: 'blue',
                services: [
                    { name: 'Help Desk 24/7', desc: 'Supporto tecnico sempre disponibile', icon: '📞' },
                    { name: 'Manutenzione Preventiva', desc: 'Prevenzione problemi IT', icon: '🔧' },
                    { name: 'Riparazione Hardware', desc: 'Riparazione computer e server', icon: '💻' },
                    { name: 'Supporto Remoto', desc: 'Assistenza da remoto immediata', icon: '🌐' }
                ]
            },
            'cloud-computing': {
                title: 'Cloud Computing',
                description: 'Migrazione al cloud e gestione infrastrutture moderne e scalabili',
                icon: '☁️',
                color: 'cyan',
                services: [
                    { name: 'Microsoft 365', desc: 'Suite produttività cloud', icon: '📧' },
                    { name: 'Server Virtuali', desc: 'Infrastruttura cloud scalabile', icon: '🖥️' },
                    { name: 'Migrazione Cloud', desc: 'Trasferimento sicuro al cloud', icon: '📤' },
                    { name: 'Backup Cloud', desc: 'Backup automatici nel cloud', icon: '☁️' }
                ]
            }
        };
    }

    async createCategoryPages(category) {
        this.log(`Creazione pagine per categoria: ${category}`);
        
        const config = this.categoryConfigs[category];
        if (!config) {
            throw new Error(`Configurazione non trovata per categoria: ${category}`);
        }

        const results = {
            created: [],
            errors: []
        };

        try {
            // 1. Crea pagina principale categoria
            const indexPage = await this.createCategoryIndex(category, config);
            results.created.push(`servizi/${category}/index.html`);
            
            // 2. Crea sottopagine servizi
            for (const service of config.services) {
                try {
                    const servicePage = await this.createServicePage(category, service, config);
                    results.created.push(`servizi/${category}/${this.slugify(service.name)}.html`);
                } catch (error) {
                    results.errors.push({ service: service.name, error: error.message });
                }
            }
            
            this.log(`✅ Categoria ${category}: ${results.created.length} pagine create`);
            return results;
            
        } catch (error) {
            this.error(`Errore creazione categoria ${category}: ${error.message}`);
            throw error;
        }
    }

    async createCategoryIndex(category, config) {
        const filePath = `servizi/${category}/index.html`;
        
        const html = `${this.baseTemplate.doctype}
<html lang="${this.baseTemplate.lang}">
<head>
    <meta charset="${this.baseTemplate.charset}">
    <meta name="viewport" content="${this.baseTemplate.viewport}">
    <title>${config.title} - ${this.brandName} | Servizi Professionali</title>
    <meta name="description" content="${config.description}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${config.title} - ${this.brandName}">
    <meta property="og:description" content="${config.description}">
    <meta property="og:url" content="${this.domain}/servizi/${category}/">
    <meta property="og:type" content="website">
    <meta property="og:image" content="${this.domain}/images/og-${category}.jpg">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${config.title} - ${this.brandName}">
    <meta name="twitter:description" content="${config.description}">
    <meta name="twitter:image" content="${this.domain}/images/og-${category}.jpg">
    
    <!-- Tailwind CSS -->
    <script src="${this.baseTemplate.tailwindCDN}"></script>
    <script src="${this.baseTemplate.tailwindConfig}"></script>
    <link rel="stylesheet" href="${this.baseTemplate.mainCSS}">
    
    <!-- Schema Markup -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "${config.title}",
        "description": "${config.description}",
        "provider": {
            "@type": "LocalBusiness",
            "name": "${this.brandName}",
            "url": "${this.domain}/"
        },
        "areaServed": {"@type": "State", "name": "Lombardia"},
        "serviceType": "${config.title}",
        "offers": {
            "@type": "Offer",
            "description": "${config.description}",
            "priceRange": "€€"
        }
    }
    </script>
</head>
<body class="bg-neutral-50">
    <!-- Header -->
    ${this.generateHeader()}
    
    <!-- Main Content -->
    <main class="pt-20">
        <!-- Hero Section -->
        <section class="py-20 bg-gradient-to-br from-${config.color}-50 to-${config.color}-100">
            <div class="container mx-auto px-6 text-center">
                <div class="text-6xl mb-6">${config.icon}</div>
                <h1 class="text-4xl font-bold text-neutral-900 mb-6">${config.title}</h1>
                <p class="text-xl text-neutral-700 mb-8 max-w-3xl mx-auto">${config.description}</p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/contatti.html" class="btn-primary">Richiedi Consulenza Gratuita</a>
                    <a href="tel:+39039888204" class="btn-secondary">📞 Chiamata Immediata</a>
                </div>
            </div>
        </section>
        
        <!-- Services Grid -->
        <section class="py-16">
            <div class="container mx-auto px-6">
                <h2 class="text-3xl font-bold text-center mb-12">I Nostri Servizi di ${config.title}</h2>
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    ${config.services.map(service => `
                        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                            <div class="text-4xl mb-4">${service.icon}</div>
                            <h3 class="text-xl font-semibold mb-3">${service.name}</h3>
                            <p class="text-neutral-600 mb-4">${service.desc}</p>
                            <a href="${this.slugify(service.name)}.html" class="text-${config.color}-600 font-semibold hover:text-${config.color}-700 transition-colors">
                                Scopri di più →
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
        
        <!-- CTA Section -->
        <section class="py-16 bg-${config.color}-600 text-white">
            <div class="container mx-auto px-6 text-center">
                <h2 class="text-3xl font-bold mb-6">Hai bisogno di ${config.title}?</h2>
                <p class="text-xl mb-8 opacity-90">Contattaci per una consulenza gratuita e personalizzata</p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/contatti.html" class="bg-white text-${config.color}-600 px-8 py-3 rounded-xl font-semibold hover:bg-neutral-100 transition-colors">
                        Contattaci Ora
                    </a>
                    <a href="/preventivo.html" class="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-${config.color}-600 transition-colors">
                        Richiedi Preventivo
                    </a>
                </div>
            </div>
        </section>
    </main>
    
    <!-- Footer -->
    ${this.generateFooter()}
    
    <!-- Scripts -->
    <script src="/js/main.js"></script>
</body>
</html>`;

        // Assicurati che la directory esista
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, html);
        this.log(`✅ Creata: ${filePath}`);
        return filePath;
    }

    async createServicePage(category, service, categoryConfig) {
        const slug = this.slugify(service.name);
        const filePath = `servizi/${category}/${slug}.html`;
        
        const html = `${this.baseTemplate.doctype}
<html lang="${this.baseTemplate.lang}">
<head>
    <meta charset="${this.baseTemplate.charset}">
    <meta name="viewport" content="${this.baseTemplate.viewport}">
    <title>${service.name} - ${this.brandName} | ${categoryConfig.title}</title>
    <meta name="description" content="${service.desc} - Servizi professionali di ${service.name.toLowerCase()} per aziende in Lombardia.">
    
    <!-- Tailwind CSS -->
    <script src="${this.baseTemplate.tailwindCDN}"></script>
    <script src="${this.baseTemplate.tailwindConfig}"></script>
    <link rel="stylesheet" href="${this.baseTemplate.mainCSS}">
</head>
<body class="bg-neutral-50">
    <!-- Header -->
    ${this.generateHeader()}
    
    <!-- Main Content -->
    <main class="pt-20">
        <!-- Breadcrumb -->
        <nav class="py-4 bg-neutral-100">
            <div class="container mx-auto px-6">
                <ol class="flex items-center space-x-2 text-sm">
                    <li><a href="/" class="text-neutral-600 hover:text-neutral-900">Home</a></li>
                    <li class="text-neutral-400">/</li>
                    <li><a href="/servizi.html" class="text-neutral-600 hover:text-neutral-900">Servizi</a></li>
                    <li class="text-neutral-400">/</li>
                    <li><a href="/servizi/${category}/" class="text-neutral-600 hover:text-neutral-900">${categoryConfig.title}</a></li>
                    <li class="text-neutral-400">/</li>
                    <li class="text-neutral-900 font-medium">${service.name}</li>
                </ol>
            </div>
        </nav>
        
        <!-- Hero Section -->
        <section class="py-20 bg-gradient-to-br from-${categoryConfig.color}-50 to-${categoryConfig.color}-100">
            <div class="container mx-auto px-6 text-center">
                <div class="text-6xl mb-6">${service.icon}</div>
                <h1 class="text-4xl font-bold text-neutral-900 mb-6">${service.name}</h1>
                <p class="text-xl text-neutral-700 mb-8 max-w-3xl mx-auto">${service.desc}</p>
                <a href="/contatti.html" class="btn-primary">Richiedi Consulenza Gratuita</a>
            </div>
        </section>
        
        <!-- Content Section -->
        <section class="py-16">
            <div class="container mx-auto px-6">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-3xl font-bold mb-8">Perché Scegliere ${service.name}</h2>
                    <div class="prose prose-lg max-w-none">
                        <p class="text-lg text-neutral-700 mb-6">
                            I nostri servizi di ${service.name.toLowerCase()} sono progettati per garantire la massima 
                            sicurezza e affidabilità per la tua azienda. Con anni di esperienza nel settore IT, 
                            offriamo soluzioni personalizzate e all'avanguardia.
                        </p>
                        
                        <h3 class="text-2xl font-semibold mb-4">Vantaggi Principali</h3>
                        <ul class="list-disc list-inside space-y-2 text-neutral-700">
                            <li>Supporto tecnico specializzato 24/7</li>
                            <li>Soluzioni personalizzate per ogni esigenza</li>
                            <li>Tecnologie all'avanguardia e certificate</li>
                            <li>Assistenza rapida e professionale</li>
                            <li>Prezzi competitivi e trasparenti</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- CTA Section -->
        <section class="py-16 bg-${categoryConfig.color}-600 text-white">
            <div class="container mx-auto px-6 text-center">
                <h2 class="text-3xl font-bold mb-6">Pronto per ${service.name}?</h2>
                <p class="text-xl mb-8 opacity-90">Contattaci per una consulenza gratuita</p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/contatti.html" class="bg-white text-${categoryConfig.color}-600 px-8 py-3 rounded-xl font-semibold hover:bg-neutral-100 transition-colors">
                        Contattaci Ora
                    </a>
                    <a href="tel:+39039888204" class="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-${categoryConfig.color}-600 transition-colors">
                        📞 039 888 2041
                    </a>
                </div>
            </div>
        </section>
    </main>
    
    <!-- Footer -->
    ${this.generateFooter()}
    
    <!-- Scripts -->
    <script src="/js/main.js"></script>
</body>
</html>`;

        // Assicurati che la directory esista
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, html);
        this.log(`✅ Creata: ${filePath}`);
        return filePath;
    }

    generateHeader() {
        return `<header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <div class="container mx-auto px-6">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold">
                        IT
                    </div>
                    <div>
                        <div class="font-bold text-neutral-900">${this.brandName}</div>
                        <div class="text-xs text-neutral-600">${this.brandTagline}</div>
                    </div>
                </div>
                
                <nav class="hidden md:flex items-center space-x-8">
                    <a href="/" class="text-neutral-700 hover:text-neutral-900 transition-colors">Home</a>
                    <a href="/servizi.html" class="text-neutral-700 hover:text-neutral-900 transition-colors">Servizi</a>
                    <a href="/contatti.html" class="text-neutral-700 hover:text-neutral-900 transition-colors">Contatti</a>
                </nav>
                
                <div class="flex items-center space-x-4">
                    <a href="tel:+39039888204" class="hidden sm:flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors">
                        <span>📞</span>
                        <span class="font-semibold">039 888 2041</span>
                    </a>
                    <a href="/contatti.html" class="btn-primary">Contattaci</a>
                </div>
            </div>
        </div>
    </header>`;
    }

    generateFooter() {
        return `<footer class="bg-neutral-900 text-white py-12">
        <div class="container mx-auto px-6">
            <div class="grid md:grid-cols-4 gap-8">
                <div>
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold">
                            IT
                        </div>
                        <div>
                            <div class="font-bold">${this.brandName}</div>
                            <div class="text-sm text-neutral-400">${this.brandTagline}</div>
                        </div>
                    </div>
                    <p class="text-neutral-400 text-sm">
                        Assistenza informatica professionale per aziende in Lombardia.
                    </p>
                </div>
                
                <div>
                    <h3 class="font-semibold mb-4">Servizi</h3>
                    <ul class="space-y-2 text-sm text-neutral-400">
                        <li><a href="/servizi/sicurezza-informatica/" class="hover:text-white transition-colors">Sicurezza Informatica</a></li>
                        <li><a href="/servizi/assistenza-tecnica/" class="hover:text-white transition-colors">Assistenza Tecnica</a></li>
                        <li><a href="/servizi/cloud-computing/" class="hover:text-white transition-colors">Cloud Computing</a></li>
                    </ul>
                </div>
                
                <div>
                    <h3 class="font-semibold mb-4">Contatti</h3>
                    <ul class="space-y-2 text-sm text-neutral-400">
                        <li>📞 039 888 2041</li>
                        <li>📧 info@it-era.it</li>
                        <li>📍 Vimercate, Lombardia</li>
                    </ul>
                </div>
                
                <div>
                    <h3 class="font-semibold mb-4">Emergenza IT</h3>
                    <a href="tel:+39039888204" class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors inline-block">
                        📞 039 888 2041
                    </a>
                    <p class="text-xs text-neutral-400 mt-2">Disponibile 24/7</p>
                </div>
            </div>
            
            <div class="border-t border-neutral-800 mt-8 pt-8 text-center text-sm text-neutral-400">
                <p>&copy; 2025 ${this.brandName}. Tutti i diritti riservati.</p>
            </div>
        </div>
    </footer>`;
    }

    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[ñ]/g, 'n')
            .replace(/[ç]/g, 'c')
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    async buildAllCategories() {
        this.log('🚀 Avvio creazione di tutte le categorie...');
        
        const results = {
            categories: [],
            totalPages: 0,
            errors: []
        };

        for (const category of Object.keys(this.categoryConfigs)) {
            try {
                const categoryResult = await this.createCategoryPages(category);
                results.categories.push({
                    name: category,
                    pages: categoryResult.created.length,
                    errors: categoryResult.errors.length
                });
                results.totalPages += categoryResult.created.length;
                results.errors.push(...categoryResult.errors);
            } catch (error) {
                results.errors.push({ category, error: error.message });
            }
        }

        this.log(`🎉 Completato! ${results.totalPages} pagine create per ${results.categories.length} categorie`);
        return results;
    }
}

module.exports = PageBuilderAgent;
