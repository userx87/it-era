#!/usr/bin/env node

const BaseAgent = require('./base-agent');
const fs = require('fs');
const path = require('path');

/**
 * SEO Agent - Specializzato nella creazione di contenuti SEO e pagine ottimizzate
 */
class SEOAgent extends BaseAgent {
    constructor() {
        super('SEO Agent', 'SEO Specialist', [
            'create_seo_pages',
            'optimize_content',
            'generate_meta_tags',
            'create_sitemap',
            'keyword_research',
            'competitor_analysis'
        ]);
        
        this.seoTemplates = this.loadSEOTemplates();
        this.keywordDatabase = this.loadKeywordDatabase();
    }

    /**
     * Carica i template SEO
     */
    loadSEOTemplates() {
        return {
            service_page: {
                title: "{service} - {location} | IT-ERA",
                description: "{service} professionale a {location}. {benefits}. Contattaci per un preventivo gratuito.",
                h1: "{service} a {location}",
                structure: ['hero', 'benefits', 'process', 'testimonials', 'cta', 'faq']
            },
            sector_page: {
                title: "Assistenza IT {sector} - {location} | IT-ERA",
                description: "Assistenza informatica specializzata per {sector} a {location}. {specific_benefits}.",
                h1: "Assistenza IT per {sector}",
                structure: ['hero', 'sector_specific', 'case_studies', 'services', 'cta']
            },
            location_page: {
                title: "Assistenza Informatica {location} | IT-ERA",
                description: "Assistenza IT professionale a {location}. Supporto tecnico, sicurezza e consulenza.",
                h1: "Assistenza Informatica a {location}",
                structure: ['hero', 'local_services', 'coverage', 'testimonials', 'cta']
            }
        };
    }

    /**
     * Carica il database delle keyword
     */
    loadKeywordDatabase() {
        return {
            services: [
                { keyword: "assistenza informatica", volume: 1000, difficulty: 65 },
                { keyword: "supporto IT", volume: 800, difficulty: 60 },
                { keyword: "sicurezza informatica", volume: 600, difficulty: 70 },
                { keyword: "backup aziendale", volume: 400, difficulty: 55 },
                { keyword: "virtualizzazione server", volume: 300, difficulty: 75 }
            ],
            locations: [
                { keyword: "Milano", volume: 2000, difficulty: 80 },
                { keyword: "Bergamo", volume: 500, difficulty: 60 },
                { keyword: "Brescia", volume: 400, difficulty: 55 },
                { keyword: "Monza", volume: 350, difficulty: 50 },
                { keyword: "Como", volume: 250, difficulty: 45 }
            ],
            sectors: [
                { keyword: "studi medici", volume: 300, difficulty: 50 },
                { keyword: "commercialisti", volume: 250, difficulty: 45 },
                { keyword: "studi legali", volume: 200, difficulty: 55 },
                { keyword: "industria manifatturiera", volume: 150, difficulty: 60 }
            ]
        };
    }

    /**
     * Processa un task specifico
     */
    async processTask(task) {
        switch (task.type) {
            case 'create_seo_pages':
                return await this.createSEOPages(task.data);
            case 'optimize_content':
                return await this.optimizeContent(task.data);
            case 'generate_meta_tags':
                return await this.generateMetaTags(task.data);
            case 'create_sitemap':
                return await this.createSitemap(task.data);
            case 'keyword_research':
                return await this.performKeywordResearch(task.data);
            default:
                throw new Error(`Unknown task type: ${task.type}`);
        }
    }

    /**
     * Crea pagine SEO ottimizzate
     */
    async createSEOPages(data) {
        const { pages } = data;
        const createdPages = [];

        for (const pageConfig of pages) {
            try {
                const page = await this.createSingleSEOPage(pageConfig);
                createdPages.push(page);
                this.log(`✅ Created SEO page: ${pageConfig.url}`, 'success');
            } catch (error) {
                this.log(`❌ Failed to create page ${pageConfig.url}: ${error.message}`, 'error');
            }
        }

        return {
            created: createdPages.length,
            pages: createdPages,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Crea una singola pagina SEO
     */
    async createSingleSEOPage(config) {
        const { type, url, data } = config;
        const template = this.seoTemplates[type];
        
        if (!template) {
            throw new Error(`Template not found for type: ${type}`);
        }

        // Genera contenuto ottimizzato
        const content = this.generateOptimizedContent(template, data);
        
        // Crea il file HTML
        const filePath = path.join('_site', url);
        const dirPath = path.dirname(filePath);
        
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Genera HTML completo
        const html = this.generateHTML(content, data);
        fs.writeFileSync(filePath, html);

        return {
            url: url,
            filePath: filePath,
            title: content.title,
            description: content.description,
            keywords: content.keywords,
            wordCount: content.wordCount,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Genera contenuto ottimizzato
     */
    generateOptimizedContent(template, data) {
        const title = this.replaceVariables(template.title, data);
        const description = this.replaceVariables(template.description, data);
        const h1 = this.replaceVariables(template.h1, data);
        
        // Genera keywords
        const keywords = this.generateKeywords(data);
        
        // Genera contenuto per sezioni
        const sections = this.generateSections(template.structure, data);
        
        return {
            title,
            description,
            h1,
            keywords,
            sections,
            wordCount: this.calculateWordCount(sections)
        };
    }

    /**
     * Sostituisce le variabili nel template
     */
    replaceVariables(text, data) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return data[key] || match;
        });
    }

    /**
     * Genera keywords per la pagina
     */
    generateKeywords(data) {
        const keywords = [];
        
        // Keyword principali
        if (data.service) keywords.push(data.service);
        if (data.location) keywords.push(data.location);
        if (data.sector) keywords.push(data.sector);
        
        // Keyword correlate
        keywords.push('assistenza informatica');
        keywords.push('supporto IT');
        keywords.push('consulenza informatica');
        
        return keywords.slice(0, 10); // Massimo 10 keywords
    }

    /**
     * Genera sezioni del contenuto
     */
    generateSections(structure, data) {
        const sections = {};
        
        structure.forEach(sectionType => {
            sections[sectionType] = this.generateSection(sectionType, data);
        });
        
        return sections;
    }

    /**
     * Genera una singola sezione
     */
    generateSection(type, data) {
        const sectionTemplates = {
            hero: {
                title: data.h1 || `${data.service || 'Assistenza IT'} a ${data.location || 'Milano'}`,
                content: `Servizi IT professionali per ${data.sector || 'aziende'} a ${data.location || 'Milano'}. Supporto tecnico specializzato, sicurezza informatica e consulenza personalizzata.`,
                cta: 'Contattaci per un preventivo gratuito'
            },
            benefits: {
                title: 'Perché Scegliere IT-ERA',
                items: [
                    'Supporto tecnico 24/7',
                    'Interventi rapidi entro 2 ore',
                    'Tecnici certificati e specializzati',
                    'Prezzi trasparenti e competitivi',
                    'Consulenza gratuita iniziale'
                ]
            },
            process: {
                title: 'Come Lavoriamo',
                steps: [
                    { step: 1, title: 'Analisi', description: 'Analizziamo le tue esigenze IT' },
                    { step: 2, title: 'Proposta', description: 'Creiamo una soluzione su misura' },
                    { step: 3, title: 'Implementazione', description: 'Realizziamo la soluzione' },
                    { step: 4, title: 'Supporto', description: 'Forniamo assistenza continua' }
                ]
            },
            cta: {
                title: 'Richiedi una Consulenza Gratuita',
                content: 'Contattaci oggi stesso per una valutazione gratuita delle tue esigenze IT.',
                phone: '039 888 2041',
                email: 'info@it-era.it'
            }
        };
        
        return sectionTemplates[type] || { title: type, content: 'Contenuto da definire' };
    }

    /**
     * Calcola il numero di parole
     */
    calculateWordCount(sections) {
        let wordCount = 0;
        
        Object.values(sections).forEach(section => {
            if (section.content) {
                wordCount += section.content.split(' ').length;
            }
            if (section.items) {
                section.items.forEach(item => {
                    wordCount += item.split(' ').length;
                });
            }
        });
        
        return wordCount;
    }

    /**
     * Genera HTML completo
     */
    generateHTML(content, data) {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title}</title>
    <meta name="description" content="${content.description}">
    <meta name="keywords" content="${content.keywords.join(', ')}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${content.title}">
    <meta property="og:description" content="${content.description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://userx87.github.io/it-era${data.url}">
    
    <!-- Schema.org -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "IT-ERA",
        "description": "${content.description}",
        "url": "https://userx87.github.io/it-era${data.url}",
        "telephone": "+39 039 888 2041",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "${data.location || 'Milano'}",
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
        <!-- Navigation content here -->
    </header>
    
    <!-- Main Content -->
    <main class="pt-20">
        <section class="hero py-20 bg-gradient-to-br from-brand-50 to-brand-100">
            <div class="container mx-auto px-6">
                <h1 class="text-4xl font-bold text-neutral-900 mb-6">${content.h1}</h1>
                <p class="text-xl text-neutral-700 mb-8">${content.sections.hero?.content || ''}</p>
                <a href="/it-era/contatti.html" class="btn-primary">${content.sections.hero?.cta || 'Contattaci'}</a>
            </div>
        </section>
        
        <!-- Additional sections would be generated here -->
    </main>
    
    <!-- Footer -->
    <footer class="bg-neutral-900 text-white py-12">
        <!-- Footer content here -->
    </footer>
</body>
</html>`;
    }

    /**
     * Ottimizza contenuto esistente
     */
    async optimizeContent(data) {
        // Implementazione ottimizzazione contenuto
        return { optimized: true, improvements: [] };
    }

    /**
     * Genera meta tags
     */
    async generateMetaTags(data) {
        // Implementazione generazione meta tags
        return { metaTags: [] };
    }

    /**
     * Crea sitemap
     */
    async createSitemap(data) {
        // Implementazione creazione sitemap
        return { sitemap: 'sitemap.xml' };
    }

    /**
     * Ricerca keyword
     */
    async performKeywordResearch(data) {
        // Implementazione ricerca keyword
        return { keywords: this.keywordDatabase };
    }
}

module.exports = SEOAgent;
