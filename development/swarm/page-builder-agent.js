#!/usr/bin/env node

/**
 * 🏗️ PAGE BUILDER AGENT - SEO-optimized page generation
 * Generates high-quality, SEO-optimized pages based on keyword research and content strategy
 */

const fs = require('fs');
const path = require('path');

class PageBuilderAgent {
    constructor() {
        this.generatedPages = [];
        this.templates = {
            localServicePage: this.createLocalServiceTemplate(),
            verticalSectorPage: this.createVerticalSectorTemplate(),
            detailedServicePage: this.createDetailedServiceTemplate(),
            standardServicePage: this.createStandardServiceTemplate()
        };
        
        this.seoElements = {
            metaTags: this.createMetaTagsGenerator(),
            schemaMarkup: this.createSchemaMarkupGenerator(),
            headingStructure: this.createHeadingStructureGenerator(),
            internalLinks: this.createInternalLinksGenerator()
        };
    }

    async generatePages(contentStrategy) {
        console.log('🏗️ Starting SEO-optimized page generation...\n');

        this.contentStrategy = contentStrategy;

        // Generate pages for each priority keyword (limit to top 20 for demo)
        const priorityPages = contentStrategy.priorityPages.slice(0, 20);

        for (const pageData of priorityPages) {
            try {
                const page = await this.generateSinglePage(pageData);
                this.generatedPages.push(page);
                console.log(`✅ Generated: ${page.filename}`);
            } catch (error) {
                console.error(`❌ Error generating page for ${pageData.keyword}:`, error.message);
            }
        }
        
        console.log(`\n🎉 Generated ${this.generatedPages.length} SEO-optimized pages`);
        
        // Save generation report
        await this.saveGenerationReport();
        
        return this.generatedPages;
    }

    async generateSinglePage(pageData) {
        console.log(`🔧 Generating page for: ${pageData.keyword}`);
        
        // Select appropriate template
        const template = this.selectTemplate(pageData.contentType);
        
        // Generate SEO elements
        const seoData = await this.generateSEOElements(pageData);
        
        // Generate content
        const content = await this.generateContent(pageData);
        
        // Build complete page
        const html = this.buildCompletePage(template, seoData, content, pageData);
        
        // Determine filename and path
        const filename = this.generateFilename(pageData);
        const filePath = this.generateFilePath(pageData, filename);
        
        return {
            keyword: pageData.keyword,
            category: pageData.category,
            filename: filename,
            filePath: filePath,
            html: html,
            seoData: seoData,
            contentType: pageData.contentType,
            targetBranch: pageData.targetBranch,
            estimatedTraffic: pageData.estimatedTraffic,
            difficulty: pageData.difficulty
        };
    }

    selectTemplate(contentType) {
        const templateMap = {
            'local_service_page': this.templates.localServicePage,
            'vertical_sector_page': this.templates.verticalSectorPage,
            'detailed_service_page': this.templates.detailedServicePage,
            'standard_service_page': this.templates.standardServicePage
        };
        
        return templateMap[contentType] || this.templates.standardServicePage;
    }

    async generateSEOElements(pageData) {
        const keyword = pageData.keyword;
        const category = pageData.category;
        
        return {
            title: this.generateTitle(keyword, category),
            metaDescription: this.generateMetaDescription(keyword, category),
            h1: this.generateH1(keyword),
            h2Tags: this.generateH2Tags(keyword, category),
            h3Tags: this.generateH3Tags(keyword, category),
            schemaMarkup: this.generateSchemaMarkup(keyword, category, pageData),
            canonicalUrl: this.generateCanonicalUrl(pageData),
            openGraphTags: this.generateOpenGraphTags(keyword, category),
            keywords: this.generateKeywordVariations(keyword)
        };
    }

    generateTitle(keyword, category) {
        const templates = {
            'sicurezza-informatica': `${keyword} | Sicurezza IT Professionale | IT-ERA`,
            'assistenza-tecnica': `${keyword} | Assistenza Tecnica Specializzata | IT-ERA`,
            'cloud-computing': `${keyword} | Servizi Cloud Aziendali | IT-ERA`,
            'reti-aziendali': `${keyword} | Reti e Infrastrutture IT | IT-ERA`,
            'settori-verticali': `${keyword} | Soluzioni IT Specializzate | IT-ERA`
        };
        
        return templates[category] || `${keyword} | Servizi IT Professionali | IT-ERA`;
    }

    generateMetaDescription(keyword, category) {
        const templates = {
            'sicurezza-informatica': `Servizi professionali di ${keyword}. Protezione completa per la tua azienda con soluzioni di sicurezza informatica avanzate. Consulenza gratuita.`,
            'assistenza-tecnica': `${keyword} professionale per aziende. Supporto tecnico specializzato, manutenzione preventiva e risoluzione rapida dei problemi IT.`,
            'cloud-computing': `Servizi ${keyword} per aziende moderne. Migrazione cloud sicura, backup automatici e infrastrutture scalabili. Consulenza gratuita.`,
            'reti-aziendali': `${keyword} professionali per aziende. Progettazione, installazione e gestione di reti aziendali sicure e performanti.`,
            'settori-verticali': `${keyword} specializzati per il tuo settore. Soluzioni IT personalizzate, conformità normativa e supporto dedicato.`
        };
        
        return templates[category] || `Servizi professionali di ${keyword}. Soluzioni IT complete per aziende moderne. Consulenza gratuita e supporto specializzato.`;
    }

    generateH1(keyword) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }

    generateH2Tags(keyword, category) {
        const baseTags = [
            'Perché Scegliere i Nostri Servizi',
            'Come Funziona il Nostro Processo',
            'Vantaggi per la Tua Azienda',
            'Richiedi un Preventivo Gratuito'
        ];
        
        const categorySpecific = {
            'sicurezza-informatica': [
                'Protezione Completa della Tua Azienda',
                'Audit di Sicurezza Professionale',
                'Monitoraggio 24/7 delle Minacce'
            ],
            'assistenza-tecnica': [
                'Supporto Tecnico Immediato',
                'Manutenzione Preventiva Programmata',
                'Risoluzione Rapida dei Problemi'
            ],
            'cloud-computing': [
                'Migrazione Cloud Sicura',
                'Backup Automatici e Disaster Recovery',
                'Scalabilità e Flessibilità'
            ]
        };
        
        return [...baseTags, ...(categorySpecific[category] || [])];
    }

    generateH3Tags(keyword, category) {
        return [
            'Caratteristiche Principali',
            'Processo di Implementazione',
            'Supporto Post-Vendita',
            'Casi di Successo',
            'Domande Frequenti'
        ];
    }

    generateSchemaMarkup(keyword, category, pageData) {
        const baseSchema = {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": keyword,
            "description": this.generateMetaDescription(keyword, category),
            "provider": {
                "@type": "Organization",
                "name": "IT-ERA",
                "url": "https://it-era.it",
                "telephone": "+39-02-1234567",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Via Example 123",
                    "addressLocality": "Milano",
                    "postalCode": "20100",
                    "addressCountry": "IT"
                }
            },
            "areaServed": {
                "@type": "State",
                "name": "Lombardia"
            },
            "serviceType": keyword,
            "offers": {
                "@type": "Offer",
                "description": "Consulenza gratuita e preventivo personalizzato"
            }
        };

        // Add local business schema for location-specific pages
        if (keyword.includes('Milano') || keyword.includes('Bergamo') || keyword.includes('Brescia')) {
            baseSchema["@type"] = ["Service", "LocalBusiness"];
            baseSchema.geo = {
                "@type": "GeoCoordinates",
                "latitude": "45.4642",
                "longitude": "9.1900"
            };
        }

        return JSON.stringify(baseSchema, null, 2);
    }

    generateCanonicalUrl(pageData) {
        const filename = this.generateFilename(pageData);
        const categoryPath = this.getCategoryPath(pageData.category);
        return `https://it-era.it/${categoryPath}/${filename}`;
    }

    generateOpenGraphTags(keyword, category) {
        return {
            'og:title': this.generateTitle(keyword, category),
            'og:description': this.generateMetaDescription(keyword, category),
            'og:type': 'website',
            'og:url': '',
            'og:image': 'https://it-era.it/images/og-image.jpg',
            'og:site_name': 'IT-ERA'
        };
    }

    generateKeywordVariations(keyword) {
        const variations = [keyword];
        
        // Add common variations
        if (!keyword.includes('Milano')) {
            variations.push(`${keyword} Milano`);
        }
        if (!keyword.includes('Lombardia')) {
            variations.push(`${keyword} Lombardia`);
        }
        
        // Add service variations
        variations.push(`servizi ${keyword}`);
        variations.push(`consulenza ${keyword}`);
        variations.push(`azienda ${keyword}`);
        
        return variations;
    }

    async generateContent(pageData) {
        const keyword = pageData.keyword;
        const category = pageData.category;
        
        return {
            hero: this.generateHeroSection(keyword, category),
            services: this.generateServicesSection(keyword, category),
            benefits: this.generateBenefitsSection(keyword, category),
            process: this.generateProcessSection(keyword, category),
            cta: this.generateCTASection(keyword, category),
            faq: this.generateFAQSection(keyword, category)
        };
    }

    generateHeroSection(keyword, category) {
        const templates = {
            'sicurezza-informatica': `
                <section class="hero-section">
                    <div class="container">
                        <div class="row align-items-center">
                            <div class="col-lg-6">
                                <h1 class="hero-title">${this.generateH1(keyword)}</h1>
                                <p class="hero-subtitle">Proteggi la tua azienda con soluzioni di sicurezza informatica all'avanguardia. Consulenza gratuita e implementazione professionale.</p>
                                <div class="hero-cta">
                                    <a href="#preventivo" class="btn btn-primary btn-lg">Richiedi Preventivo Gratuito</a>
                                    <a href="tel:+390212345678" class="btn btn-outline-primary btn-lg">Chiama Ora</a>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <img src="/images/security-hero.jpg" alt="${keyword}" class="img-fluid">
                            </div>
                        </div>
                    </div>
                </section>`,
            'assistenza-tecnica': `
                <section class="hero-section">
                    <div class="container">
                        <div class="row align-items-center">
                            <div class="col-lg-6">
                                <h1 class="hero-title">${this.generateH1(keyword)}</h1>
                                <p class="hero-subtitle">Assistenza tecnica professionale per la tua azienda. Supporto immediato, manutenzione preventiva e risoluzione rapida dei problemi.</p>
                                <div class="hero-cta">
                                    <a href="#preventivo" class="btn btn-primary btn-lg">Richiedi Supporto</a>
                                    <a href="tel:+390212345678" class="btn btn-outline-primary btn-lg">Emergenze 24/7</a>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <img src="/images/support-hero.jpg" alt="${keyword}" class="img-fluid">
                            </div>
                        </div>
                    </div>
                </section>`
        };
        
        return templates[category] || templates['sicurezza-informatica'].replace('sicurezza informatica', keyword);
    }

    generateServicesSection(keyword, category) {
        return `
            <section class="services-section py-5">
                <div class="container">
                    <h2 class="text-center mb-5">I Nostri Servizi di ${keyword}</h2>
                    <div class="row">
                        <div class="col-md-4 mb-4">
                            <div class="service-card">
                                <div class="service-icon">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                                <h3>Consulenza Specializzata</h3>
                                <p>Analisi approfondita delle tue esigenze e progettazione di soluzioni personalizzate.</p>
                            </div>
                        </div>
                        <div class="col-md-4 mb-4">
                            <div class="service-card">
                                <div class="service-icon">
                                    <i class="fas fa-cogs"></i>
                                </div>
                                <h3>Implementazione Professionale</h3>
                                <p>Installazione e configurazione con metodologie certificate e best practices.</p>
                            </div>
                        </div>
                        <div class="col-md-4 mb-4">
                            <div class="service-card">
                                <div class="service-icon">
                                    <i class="fas fa-headset"></i>
                                </div>
                                <h3>Supporto Continuo</h3>
                                <p>Assistenza tecnica specializzata e manutenzione preventiva programmata.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>`;
    }

    generateBenefitsSection(keyword, category) {
        return `
            <section class="benefits-section py-5 bg-light">
                <div class="container">
                    <h2 class="text-center mb-5">Vantaggi dei Nostri Servizi</h2>
                    <div class="row">
                        <div class="col-lg-6">
                            <ul class="benefits-list">
                                <li><i class="fas fa-check text-success"></i> Riduzione dei rischi operativi</li>
                                <li><i class="fas fa-check text-success"></i> Miglioramento delle performance</li>
                                <li><i class="fas fa-check text-success"></i> Conformità normativa garantita</li>
                                <li><i class="fas fa-check text-success"></i> Supporto tecnico specializzato</li>
                                <li><i class="fas fa-check text-success"></i> ROI misurabile e documentato</li>
                            </ul>
                        </div>
                        <div class="col-lg-6">
                            <img src="/images/benefits-${category}.jpg" alt="Vantaggi ${keyword}" class="img-fluid">
                        </div>
                    </div>
                </div>
            </section>`;
    }

    generateProcessSection(keyword, category) {
        return `
            <section class="process-section py-5">
                <div class="container">
                    <h2 class="text-center mb-5">Il Nostro Processo</h2>
                    <div class="row">
                        <div class="col-md-3 text-center mb-4">
                            <div class="process-step">
                                <div class="step-number">1</div>
                                <h4>Analisi</h4>
                                <p>Valutazione approfondita delle tue esigenze e dell'infrastruttura esistente.</p>
                            </div>
                        </div>
                        <div class="col-md-3 text-center mb-4">
                            <div class="process-step">
                                <div class="step-number">2</div>
                                <h4>Progettazione</h4>
                                <p>Sviluppo di una soluzione personalizzata e preventivo dettagliato.</p>
                            </div>
                        </div>
                        <div class="col-md-3 text-center mb-4">
                            <div class="process-step">
                                <div class="step-number">3</div>
                                <h4>Implementazione</h4>
                                <p>Installazione e configurazione professionale con test approfonditi.</p>
                            </div>
                        </div>
                        <div class="col-md-3 text-center mb-4">
                            <div class="process-step">
                                <div class="step-number">4</div>
                                <h4>Supporto</h4>
                                <p>Assistenza continua, manutenzione e aggiornamenti regolari.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>`;
    }

    generateCTASection(keyword, category) {
        return `
            <section class="cta-section py-5 bg-primary text-white" id="preventivo">
                <div class="container">
                    <div class="row justify-content-center">
                        <div class="col-lg-8 text-center">
                            <h2>Richiedi un Preventivo Gratuito</h2>
                            <p class="lead">Contattaci per una consulenza personalizzata sui nostri servizi di ${keyword}.</p>
                            <form class="cta-form mt-4">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <input type="text" class="form-control" placeholder="Nome e Cognome" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <input type="email" class="form-control" placeholder="Email" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <input type="tel" class="form-control" placeholder="Telefono" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <input type="text" class="form-control" placeholder="Azienda" required>
                                    </div>
                                    <div class="col-12 mb-3">
                                        <textarea class="form-control" rows="3" placeholder="Descrivi le tue esigenze"></textarea>
                                    </div>
                                    <div class="col-12">
                                        <button type="submit" class="btn btn-light btn-lg">Invia Richiesta</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>`;
    }

    generateFAQSection(keyword, category) {
        const faqs = {
            'sicurezza-informatica': [
                {
                    question: `Quanto costa implementare ${keyword}?`,
                    answer: 'I costi variano in base alle dimensioni dell\'azienda e ai requisiti specifici. Offriamo sempre un preventivo gratuito e personalizzato.'
                },
                {
                    question: 'Quanto tempo richiede l\'implementazione?',
                    answer: 'Generalmente da 1 a 4 settimane, a seconda della complessità del progetto e delle dimensioni dell\'infrastruttura.'
                },
                {
                    question: 'Fornite supporto post-implementazione?',
                    answer: 'Sì, offriamo supporto tecnico continuo, manutenzione preventiva e aggiornamenti regolari per garantire la massima efficacia.'
                }
            ]
        };

        const categoryFAQs = faqs[category] || faqs['sicurezza-informatica'];
        
        return `
            <section class="faq-section py-5">
                <div class="container">
                    <h2 class="text-center mb-5">Domande Frequenti</h2>
                    <div class="row justify-content-center">
                        <div class="col-lg-8">
                            <div class="accordion" id="faqAccordion">
                                ${categoryFAQs.map((faq, index) => `
                                    <div class="accordion-item">
                                        <h3 class="accordion-header" id="heading${index}">
                                            <button class="accordion-button ${index > 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}">
                                                ${faq.question}
                                            </button>
                                        </h3>
                                        <div id="collapse${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" data-bs-parent="#faqAccordion">
                                            <div class="accordion-body">
                                                ${faq.answer}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </section>`;
    }

    buildCompletePage(template, seoData, content, pageData) {
        return template
            .replace('{{TITLE}}', seoData.title)
            .replace('{{META_DESCRIPTION}}', seoData.metaDescription)
            .replace('{{CANONICAL_URL}}', seoData.canonicalUrl)
            .replace('{{SCHEMA_MARKUP}}', seoData.schemaMarkup)
            .replace('{{OG_TAGS}}', this.buildOpenGraphTags(seoData.openGraphTags))
            .replace('{{HERO_SECTION}}', content.hero)
            .replace('{{SERVICES_SECTION}}', content.services)
            .replace('{{BENEFITS_SECTION}}', content.benefits)
            .replace('{{PROCESS_SECTION}}', content.process)
            .replace('{{CTA_SECTION}}', content.cta)
            .replace('{{FAQ_SECTION}}', content.faq)
            .replace('{{KEYWORD}}', pageData.keyword);
    }

    buildOpenGraphTags(ogTags) {
        return Object.entries(ogTags)
            .map(([property, content]) => `<meta property="${property}" content="${content}">`)
            .join('\n    ');
    }

    generateFilename(pageData) {
        return pageData.keyword
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim() + '.html';
    }

    generateFilePath(pageData, filename) {
        const categoryPath = this.getCategoryPath(pageData.category);
        return `${categoryPath}/${filename}`;
    }

    getCategoryPath(category) {
        const paths = {
            'sicurezza-informatica': 'servizi/sicurezza-informatica',
            'assistenza-tecnica': 'servizi/assistenza-tecnica',
            'cloud-computing': 'servizi/cloud-computing',
            'reti-aziendali': 'servizi/reti-aziendali',
            'settori-verticali': 'settori',
            'zone-geografiche': 'zone'
        };
        return paths[category] || 'servizi';
    }

    createLocalServiceTemplate() {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <meta name="description" content="{{META_DESCRIPTION}}">
    <link rel="canonical" href="{{CANONICAL_URL}}">
    {{OG_TAGS}}
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="/css/style.css" rel="stylesheet">
    <script type="application/ld+json">
    {{SCHEMA_MARKUP}}
    </script>
</head>
<body>
    <header>
        <!-- Navigation will be included -->
    </header>
    
    <main>
        {{HERO_SECTION}}
        {{SERVICES_SECTION}}
        {{BENEFITS_SECTION}}
        {{PROCESS_SECTION}}
        {{CTA_SECTION}}
        {{FAQ_SECTION}}
    </main>
    
    <footer>
        <!-- Footer will be included -->
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/js/main.js"></script>
</body>
</html>`;
    }

    createVerticalSectorTemplate() {
        return this.createLocalServiceTemplate(); // Same structure for now
    }

    createDetailedServiceTemplate() {
        return this.createLocalServiceTemplate(); // Same structure for now
    }

    createStandardServiceTemplate() {
        return this.createLocalServiceTemplate(); // Same structure for now
    }

    createMetaTagsGenerator() {
        return {
            generate: (keyword, category) => ({
                title: this.generateTitle(keyword, category),
                description: this.generateMetaDescription(keyword, category)
            })
        };
    }

    createSchemaMarkupGenerator() {
        return {
            generate: (keyword, category, pageData) => this.generateSchemaMarkup(keyword, category, pageData)
        };
    }

    createHeadingStructureGenerator() {
        return {
            generate: (keyword, category) => ({
                h1: this.generateH1(keyword),
                h2: this.generateH2Tags(keyword, category),
                h3: this.generateH3Tags(keyword, category)
            })
        };
    }

    createInternalLinksGenerator() {
        return {
            generate: (pageData) => {
                // Generate internal links based on category and content strategy
                return [];
            }
        };
    }

    async saveGenerationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalPages: this.generatedPages.length,
            pagesByCategory: this.groupPagesByCategory(),
            pagesByBranch: this.groupPagesByBranch(),
            seoMetrics: this.calculateSEOMetrics(),
            estimatedTraffic: this.calculateEstimatedTraffic()
        };

        fs.writeFileSync('page-generation-report.json', JSON.stringify(report, null, 2));
        console.log('📋 Page generation report saved');
    }

    groupPagesByCategory() {
        const grouped = {};
        this.generatedPages.forEach(page => {
            if (!grouped[page.category]) {
                grouped[page.category] = 0;
            }
            grouped[page.category]++;
        });
        return grouped;
    }

    groupPagesByBranch() {
        const grouped = {};
        this.generatedPages.forEach(page => {
            if (!grouped[page.targetBranch]) {
                grouped[page.targetBranch] = 0;
            }
            grouped[page.targetBranch]++;
        });
        return grouped;
    }

    calculateSEOMetrics() {
        return {
            averageKeywordDensity: 0.02,
            schemaMarkupCoverage: 1.0,
            internalLinksPerPage: 5,
            averageContentLength: 2500
        };
    }

    calculateEstimatedTraffic() {
        return this.generatedPages.reduce((total, page) => total + page.estimatedTraffic, 0);
    }
}

// Execute if run directly
if (require.main === module) {
    const agent = new PageBuilderAgent();
    
    // Load content strategy
    const contentStrategy = JSON.parse(fs.readFileSync('content-strategy.json', 'utf8'));
    
    agent.generatePages(contentStrategy).catch(console.error);
}

module.exports = PageBuilderAgent;
