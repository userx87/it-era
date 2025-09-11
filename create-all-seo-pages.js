#!/usr/bin/env node

/**
 * 🎯 CREAZIONE COMPLETA PAGINE SEO
 * Script per creare tutte le 20 pagine SEO pianificate
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Funzioni di colore
const colors = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
};

/**
 * Configurazione completa delle 20 pagine SEO
 */
const SEO_PAGES_CONFIG = {
    // 🔧 SERVIZI SPECIFICI (5 pagine)
    services: [
        {
            url: '/servizi/backup-disaster-recovery.html',
            title: 'Backup e Disaster Recovery Milano | IT-ERA',
            description: 'Servizi di backup aziendale e disaster recovery a Milano. Protezione dati garantita, ripristino rapido in caso di emergenza.',
            service: 'Backup e Disaster Recovery',
            location: 'Milano',
            keywords: ['backup aziendale', 'disaster recovery', 'protezione dati', 'ripristino emergenza'],
            benefits: 'Protezione dati garantita, ripristino rapido, continuità operativa'
        },
        {
            url: '/servizi/microsoft-365-aziende.html',
            title: 'Microsoft 365 per Aziende Milano | IT-ERA',
            description: 'Implementazione Microsoft 365 per aziende a Milano. Produttività cloud, collaborazione avanzata e sicurezza enterprise.',
            service: 'Microsoft 365 per Aziende',
            location: 'Milano',
            keywords: ['microsoft 365', 'office 365', 'produttività cloud', 'collaborazione'],
            benefits: 'Produttività aumentata, collaborazione cloud, sicurezza enterprise'
        },
        {
            url: '/servizi/virtualizzazione-server.html',
            title: 'Virtualizzazione Server Milano | IT-ERA',
            description: 'Servizi di virtualizzazione server a Milano. Riduzione costi hardware, scalabilità e alta disponibilità.',
            service: 'Virtualizzazione Server',
            location: 'Milano',
            keywords: ['virtualizzazione', 'server virtuali', 'vmware', 'hyper-v'],
            benefits: 'Riduzione costi hardware, scalabilità, alta disponibilità'
        },
        {
            url: '/servizi/sicurezza-informatica-avanzata.html',
            title: 'Sicurezza Informatica Avanzata Milano | IT-ERA',
            description: 'Servizi di cybersecurity avanzata a Milano. Firewall enterprise, antivirus, monitoraggio 24/7.',
            service: 'Sicurezza Informatica Avanzata',
            location: 'Milano',
            keywords: ['cybersecurity', 'firewall', 'antivirus enterprise', 'monitoraggio'],
            benefits: 'Protezione completa, firewall enterprise, monitoraggio 24/7'
        },
        {
            url: '/servizi/noleggio-operativo-it.html',
            title: 'Noleggio Operativo IT Milano | IT-ERA',
            description: 'Noleggio operativo di PC, server e stampanti a Milano. Leasing informatico conveniente per aziende.',
            service: 'Noleggio Operativo IT',
            location: 'Milano',
            keywords: ['noleggio pc', 'leasing informatico', 'noleggio server', 'noleggio stampanti'],
            benefits: 'Costi fissi mensili, aggiornamento tecnologico, assistenza inclusa'
        }
    ],

    // 🏢 SETTORI AGGIUNTIVI (5 pagine)
    sectors: [
        {
            url: '/settori/industria-manifatturiera.html',
            title: 'Assistenza IT Industria Manifatturiera | IT-ERA',
            description: 'Assistenza informatica specializzata per industria manifatturiera in Lombardia. ERP integrati, automazione industriale.',
            sector: 'Industria Manifatturiera',
            location: 'Lombardia',
            keywords: ['it industria', 'erp manifatturiero', 'automazione industriale', 'industry 4.0'],
            benefits: 'ERP integrati, automazione industriale, Industry 4.0'
        },
        {
            url: '/settori/settore-sanitario.html',
            title: 'Assistenza IT Settore Sanitario Milano | IT-ERA',
            description: 'Assistenza informatica per settore sanitario a Milano. Cartelle cliniche digitali, GDPR compliance.',
            sector: 'Settore Sanitario',
            location: 'Milano',
            keywords: ['it sanitario', 'cartelle cliniche', 'gdpr sanitario', 'ospedali'],
            benefits: 'Cartelle cliniche digitali, GDPR compliance, sicurezza dati'
        },
        {
            url: '/settori/settore-finanziario.html',
            title: 'Assistenza IT Settore Finanziario Milano | IT-ERA',
            description: 'Assistenza informatica per banche e assicurazioni a Milano. Sicurezza transazioni, compliance PCI-DSS.',
            sector: 'Settore Finanziario',
            location: 'Milano',
            keywords: ['it finanziario', 'banche', 'assicurazioni', 'pci-dss'],
            benefits: 'Sicurezza transazioni, compliance PCI-DSS, protezione dati finanziari'
        },
        {
            url: '/settori/settore-immobiliare.html',
            title: 'Assistenza IT Settore Immobiliare Milano | IT-ERA',
            description: 'Assistenza informatica per agenzie immobiliari a Milano. CRM immobiliare, portali, virtual tour.',
            sector: 'Settore Immobiliare',
            location: 'Milano',
            keywords: ['it immobiliare', 'crm immobiliare', 'portali immobiliari', 'virtual tour'],
            benefits: 'CRM immobiliare, portali integrati, virtual tour'
        },
        {
            url: '/settori/settore-alimentare.html',
            title: 'Assistenza IT Settore Alimentare Milano | IT-ERA',
            description: 'Assistenza informatica per ristoranti e food delivery a Milano. POS, gestionale ristoranti.',
            sector: 'Settore Alimentare',
            location: 'Milano',
            keywords: ['it ristorazione', 'pos ristoranti', 'food delivery', 'gestionale'],
            benefits: 'POS integrati, gestionale ristoranti, food delivery'
        }
    ],

    // 📍 PAGINE GEOGRAFICHE (5 pagine)
    locations: [
        {
            url: '/zone/assistenza-it-milano-centro.html',
            title: 'Assistenza Informatica Milano Centro | IT-ERA',
            description: 'Assistenza IT professionale nel centro di Milano. Supporto tecnico per uffici, studi professionali.',
            location: 'Milano Centro',
            coverage: 'Centro storico, Brera, Porta Garibaldi',
            keywords: ['assistenza it milano centro', 'supporto tecnico centro', 'uffici milano'],
            benefits: 'Interventi rapidi in centro, supporto uffici, studi professionali'
        },
        {
            url: '/zone/assistenza-it-bergamo.html',
            title: 'Assistenza Informatica Bergamo | IT-ERA',
            description: 'Assistenza IT professionale a Bergamo e provincia. Supporto tecnico per industrie e PMI bergamasche.',
            location: 'Bergamo',
            coverage: 'Bergamo città, Valle Seriana, Isola Bergamasca',
            keywords: ['assistenza informatica bergamo', 'it bergamo', 'supporto tecnico bergamo'],
            benefits: 'Copertura provincia bergamasca, supporto industrie, PMI locali'
        },
        {
            url: '/zone/assistenza-it-brescia.html',
            title: 'Assistenza Informatica Brescia | IT-ERA',
            description: 'Assistenza IT professionale a Brescia e provincia. Supporto per settore metalmeccanico e manifatturiero.',
            location: 'Brescia',
            coverage: 'Brescia città, Franciacorta, Valle Trompia',
            keywords: ['assistenza informatica brescia', 'it brescia', 'metalmeccanico'],
            benefits: 'Specializzazione metalmeccanico, copertura Franciacorta'
        },
        {
            url: '/zone/assistenza-it-monza.html',
            title: 'Assistenza Informatica Monza | IT-ERA',
            description: 'Assistenza IT professionale a Monza e Brianza. Supporto per PMI innovative e startup.',
            location: 'Monza',
            coverage: 'Monza, Brianza, hinterland milanese',
            keywords: ['assistenza informatica monza', 'it brianza', 'startup monza'],
            benefits: 'Focus PMI innovative, startup, hinterland milanese'
        },
        {
            url: '/zone/assistenza-it-como.html',
            title: 'Assistenza Informatica Como | IT-ERA',
            description: 'Assistenza IT professionale a Como e provincia. Supporto per turismo, hospitality e aziende locali.',
            location: 'Como',
            coverage: 'Como città, Lago di Como, Erbese',
            keywords: ['assistenza informatica como', 'it como', 'turismo lago'],
            benefits: 'Specializzazione turismo, hospitality, aziende lago'
        }
    ],

    // 📚 CONTENUTI INFORMATIVI (5 pagine)
    content: [
        {
            url: '/servizi/contratti-assistenza-it.html',
            title: 'Contratti Assistenza Informatica Milano | IT-ERA',
            description: 'Contratti di assistenza IT a Milano. Tipologie, SLA, prezzi trasparenti per aziende.',
            service: 'Contratti di Assistenza IT',
            location: 'Milano',
            keywords: ['contratto assistenza', 'sla informatico', 'prezzi assistenza'],
            benefits: 'SLA garantiti, prezzi trasparenti, supporto continuativo'
        },
        {
            url: '/faq-assistenza-informatica.html',
            title: 'FAQ Assistenza Informatica | IT-ERA',
            description: 'Domande frequenti su assistenza informatica. Risposte complete su servizi IT, prezzi, tempi.',
            service: 'FAQ Assistenza Informatica',
            location: 'Milano',
            keywords: ['faq it', 'domande assistenza', 'supporto tecnico'],
            benefits: 'Risposte immediate, chiarimenti servizi, supporto pre-vendita'
        },
        {
            url: '/glossario-it-aziende.html',
            title: 'Glossario IT per Aziende | IT-ERA',
            description: 'Glossario informatico per aziende. Termini tecnici spiegati in modo semplice.',
            service: 'Glossario IT',
            location: 'Milano',
            keywords: ['glossario informatico', 'termini it', 'dizionario tecnico'],
            benefits: 'Termini semplificati, comprensione tecnologie, formazione'
        },
        {
            url: '/prezzi-assistenza-informatica.html',
            title: 'Prezzi Assistenza Informatica Milano | IT-ERA',
            description: 'Listino prezzi assistenza informatica a Milano. Tariffe trasparenti, pacchetti, preventivi.',
            service: 'Prezzi Assistenza Informatica',
            location: 'Milano',
            keywords: ['prezzi assistenza it', 'tariffe informatiche', 'preventivi'],
            benefits: 'Prezzi trasparenti, pacchetti convenienti, preventivi gratuiti'
        },
        {
            url: '/blog/index.html',
            title: 'Blog IT-ERA | Assistenza Informatica Milano',
            description: 'Blog di IT-ERA con guide tecniche, news informatiche e case study per aziende.',
            service: 'Blog IT-ERA',
            location: 'Milano',
            keywords: ['blog it', 'guide tecniche', 'news informatiche'],
            benefits: 'Guide pratiche, aggiornamenti tecnologici, case study'
        }
    ]
};

/**
 * Generatore di pagine SEO
 */
class SEOPageGenerator {
    constructor() {
        this.created = 0;
        this.errors = [];
    }

    async createAllPages() {
        console.log(colors.bold(colors.blue('\n🎯 CREAZIONE COMPLETA PAGINE SEO')));
        console.log(colors.blue('===================================\n'));

        // Crea tutte le categorie
        await this.createCategory('services', '🔧 SERVIZI SPECIFICI');
        await this.createCategory('sectors', '🏢 SETTORI AGGIUNTIVI');
        await this.createCategory('locations', '📍 PAGINE GEOGRAFICHE');
        await this.createCategory('content', '📚 CONTENUTI INFORMATIVI');

        // Genera sitemap aggiornato
        await this.generateSitemap();

        // Mostra risultati
        this.showResults();

        return {
            created: this.created,
            errors: this.errors.length,
            total: this.getTotalPages()
        };
    }

    async createCategory(category, title) {
        console.log(colors.yellow(`\n${title}:`));
        
        const pages = SEO_PAGES_CONFIG[category];
        
        for (const page of pages) {
            try {
                await this.createSinglePage(page, category);
                this.created++;
                console.log(`  ✅ ${page.url}`);
            } catch (error) {
                this.errors.push({ url: page.url, error: error.message });
                console.log(`  ❌ ${page.url} - ${error.message}`);
            }
        }
    }

    async createSinglePage(page, category) {
        const filePath = path.join('_site', page.url);
        const dirPath = path.dirname(filePath);
        
        // Crea directory se non esiste
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Genera HTML basato sulla categoria
        let html;
        switch (category) {
            case 'services':
                html = this.generateServicePage(page);
                break;
            case 'sectors':
                html = this.generateSectorPage(page);
                break;
            case 'locations':
                html = this.generateLocationPage(page);
                break;
            case 'content':
                html = this.generateContentPage(page);
                break;
            default:
                html = this.generateGenericPage(page);
        }

        fs.writeFileSync(filePath, html);
    }

    generateServicePage(page) {
        return this.generateHTML(page, {
            heroTitle: `${page.service} a ${page.location}`,
            heroSubtitle: `Servizi IT professionali per ${page.service.toLowerCase()} a ${page.location}. ${page.benefits}.`,
            sections: this.getServiceSections(page)
        });
    }

    generateSectorPage(page) {
        return this.generateHTML(page, {
            heroTitle: `Assistenza IT per ${page.sector}`,
            heroSubtitle: `Assistenza informatica specializzata per ${page.sector.toLowerCase()} a ${page.location}. ${page.benefits}.`,
            sections: this.getSectorSections(page)
        });
    }

    generateLocationPage(page) {
        return this.generateHTML(page, {
            heroTitle: `Assistenza Informatica a ${page.location}`,
            heroSubtitle: `Servizi IT professionali a ${page.location}. Copertura: ${page.coverage}. ${page.benefits}.`,
            sections: this.getLocationSections(page)
        });
    }

    generateContentPage(page) {
        return this.generateHTML(page, {
            heroTitle: page.service,
            heroSubtitle: `${page.service} - ${page.benefits}`,
            sections: this.getContentSections(page)
        });
    }

    getServiceSections(page) {
        return [
            {
                title: `Vantaggi ${page.service}`,
                content: `I nostri servizi di ${page.service.toLowerCase()} offrono: ${page.benefits}. Supporto tecnico specializzato 24/7.`
            },
            {
                title: 'Come Funziona',
                content: 'Analisi delle esigenze, progettazione soluzione, implementazione e supporto continuo.'
            }
        ];
    }

    getSectorSections(page) {
        return [
            {
                title: `Soluzioni per ${page.sector}`,
                content: `Assistenza IT specializzata per ${page.sector.toLowerCase()}: ${page.benefits}.`
            },
            {
                title: 'Esperienza Settoriale',
                content: `Anni di esperienza nel ${page.sector.toLowerCase()} con soluzioni su misura.`
            }
        ];
    }

    getLocationSections(page) {
        return [
            {
                title: `Copertura ${page.location}`,
                content: `Serviamo ${page.location} e zone limitrofe: ${page.coverage}.`
            },
            {
                title: 'Servizi Locali',
                content: `Interventi rapidi a ${page.location} con tecnici specializzati della zona.`
            }
        ];
    }

    getContentSections(page) {
        return [
            {
                title: 'Informazioni Utili',
                content: `Tutto quello che devi sapere su ${page.service.toLowerCase()}.`
            }
        ];
    }

    generateHTML(page, content) {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title}</title>
    <meta name="description" content="${page.description}">
    <meta name="keywords" content="${page.keywords.join(', ')}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${page.title}">
    <meta property="og:description" content="${page.description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://userx87.github.io/it-era${page.url}">
    
    <!-- Schema.org -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "IT-ERA",
        "description": "${page.description}",
        "url": "https://userx87.github.io/it-era${page.url}",
        "telephone": "+39 039 888 2041",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "${page.location || 'Milano'}",
            "addressRegion": "Lombardia",
            "addressCountry": "IT"
        }
    }
    </script>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/it-era/css/tailwind-config.js"></script>
    <link rel="stylesheet" href="/it-era/css/it-era-tailwind.css">
</head>
<body>
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <nav class="max-w-7xl mx-auto px-6 lg:px-8">
            <div class="flex items-center justify-between h-20">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center">
                        <span class="text-white font-bold text-xl">IT</span>
                    </div>
                    <div class="hidden sm:block">
                        <h1 class="text-2xl font-bold text-neutral-900">IT-ERA</h1>
                        <p class="text-sm text-neutral-600 -mt-1">Assistenza IT Professionale</p>
                    </div>
                </div>
                <div class="hidden lg:flex items-center space-x-8">
                    <a href="/it-era/" class="text-neutral-700 hover:text-brand-600 transition-colors">Home</a>
                    <a href="/it-era/servizi.html" class="text-neutral-700 hover:text-brand-600 transition-colors">Servizi</a>
                    <a href="/it-era/contatti.html" class="text-neutral-700 hover:text-brand-600 transition-colors">Contatti</a>
                </div>
                <div class="hidden lg:flex items-center space-x-4">
                    <a href="tel:+390398882041" class="text-brand-600 font-semibold">039 888 2041</a>
                    <a href="/it-era/contatti.html" class="btn-primary btn-sm">Contattaci</a>
                </div>
            </div>
        </nav>
    </header>
    
    <!-- Main Content -->
    <main class="pt-20">
        <!-- Hero Section -->
        <section class="hero py-20 bg-gradient-to-br from-brand-50 to-brand-100">
            <div class="container mx-auto px-6 text-center">
                <h1 class="text-4xl font-bold text-neutral-900 mb-6">${content.heroTitle}</h1>
                <p class="text-xl text-neutral-700 mb-8">${content.heroSubtitle}</p>
                <a href="/it-era/contatti.html" class="btn-primary">Contattaci per un preventivo gratuito</a>
            </div>
        </section>
        
        <!-- Content Sections -->
        ${content.sections.map(section => `
        <section class="py-16">
            <div class="container mx-auto px-6">
                <h2 class="text-3xl font-bold text-center mb-8">${section.title}</h2>
                <div class="max-w-4xl mx-auto text-lg text-neutral-700 text-center">
                    <p>${section.content}</p>
                </div>
            </div>
        </section>
        `).join('')}
        
        <!-- CTA Section -->
        <section class="py-16 bg-brand-50">
            <div class="container mx-auto px-6 text-center">
                <h2 class="text-3xl font-bold mb-6">Richiedi una Consulenza Gratuita</h2>
                <p class="text-xl text-neutral-700 mb-8">Contattaci oggi stesso per una valutazione delle tue esigenze IT</p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="tel:+390398882041" class="btn-primary">📞 039 888 2041</a>
                    <a href="/it-era/contatti.html" class="btn-secondary">Contattaci Online</a>
                </div>
            </div>
        </section>
    </main>
    
    <!-- Footer -->
    <footer class="bg-neutral-900 text-white py-12">
        <div class="container mx-auto px-6 text-center">
            <div class="mb-8">
                <h3 class="text-2xl font-bold mb-4">IT-ERA</h3>
                <p class="text-neutral-400">Assistenza IT Professionale in Lombardia</p>
            </div>
            <div class="border-t border-neutral-800 pt-8">
                <p>&copy; 2025 IT-ERA. Tutti i diritti riservati.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
    }

    async generateSitemap() {
        console.log(colors.yellow('\n🗺️ Aggiornamento Sitemap:'));
        
        const siteUrl = 'https://userx87.github.io/it-era/';
        const pages = this.discoverAllPages();
        const sitemap = this.createSitemapXML(pages, siteUrl);
        
        fs.writeFileSync(path.join('_site', 'sitemap.xml'), sitemap);
        console.log(`  ✅ Sitemap aggiornato con ${pages.length} pagine`);
    }

    discoverAllPages() {
        const pages = [];
        const siteDir = '_site';
        
        if (!fs.existsSync(siteDir)) return pages;
        
        const scanDirectory = (dir) => {
            const items = fs.readdirSync(dir);
            
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (item.endsWith('.html')) {
                    const relativePath = path.relative(siteDir, fullPath);
                    const url = relativePath.replace(/\\/g, '/').replace(/index\.html$/, '');
                    pages.push({
                        url: url || '',
                        lastmod: stat.mtime.toISOString(),
                        priority: this.calculatePriority(url)
                    });
                }
            });
        };
        
        scanDirectory(siteDir);
        return pages;
    }

    calculatePriority(url) {
        if (url === '' || url === 'index.html') return '1.0';
        if (url.includes('servizi') || url.includes('contatti')) return '0.9';
        if (url.includes('settori')) return '0.8';
        if (url.includes('zone')) return '0.7';
        return '0.6';
    }

    createSitemapXML(pages, siteUrl) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        pages.forEach(page => {
            xml += '  <url>\n';
            xml += `    <loc>${siteUrl}${page.url}</loc>\n`;
            xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += '  </url>\n';
        });
        
        xml += '</urlset>';
        return xml;
    }

    getTotalPages() {
        return Object.values(SEO_PAGES_CONFIG).reduce((total, category) => total + category.length, 0);
    }

    showResults() {
        console.log(colors.bold(colors.green('\n🎉 CREAZIONE PAGINE COMPLETATA!')));
        console.log(colors.green('====================================='));
        console.log(`📄 Pagine create: ${colors.bold(this.created.toString())}`);
        console.log(`❌ Errori: ${colors.bold(this.errors.length.toString())}`);
        console.log(`📊 Totale pianificate: ${colors.bold(this.getTotalPages().toString())}`);
        
        if (this.errors.length > 0) {
            console.log(colors.red('\n⚠️ ERRORI:'));
            this.errors.forEach(error => {
                console.log(`  ❌ ${error.url}: ${error.error}`);
            });
        }
        
        console.log(colors.cyan('\n🌐 Tutte le pagine sono ora disponibili su:'));
        console.log(colors.bold(colors.cyan('  https://userx87.github.io/it-era/')));
    }
}

/**
 * Main function
 */
async function main() {
    const generator = new SEOPageGenerator();
    
    try {
        const result = await generator.createAllPages();
        
        // Deploy automatico se richiesto
        if (process.argv.includes('--deploy')) {
            console.log(colors.yellow('\n🚀 Avvio deploy automatico...'));
            await execAsync('git add .');
            await execAsync(`git commit -m "🎯 Created ${result.created} SEO pages"`);
            await execAsync('git push origin main');
            console.log(colors.green('✅ Deploy completato!'));
        }
        
        return result;
        
    } catch (error) {
        console.error(colors.red(`❌ Errore: ${error.message}`));
        process.exit(1);
    }
}

// Avvia se chiamato direttamente
if (require.main === module) {
    main();
}

module.exports = { SEOPageGenerator, SEO_PAGES_CONFIG };
