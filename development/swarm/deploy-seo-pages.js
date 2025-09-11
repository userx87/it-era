#!/usr/bin/env node

/**
 * 🚀 DEPLOY SEO PAGES - Manual deployment of generated SEO pages
 * Creates and deploys SEO-optimized pages to isolated branches
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class SEOPageDeployer {
    constructor() {
        this.deployedPages = [];
        this.errors = [];
        
        // Load content strategy
        this.loadContentStrategy();
    }

    loadContentStrategy() {
        try {
            const strategyPath = path.join(__dirname, 'content-strategy.json');
            if (fs.existsSync(strategyPath)) {
                this.contentStrategy = JSON.parse(fs.readFileSync(strategyPath, 'utf8'));
                console.log(`📊 Loaded content strategy with ${this.contentStrategy.priorityPages.length} priority pages`);
            } else {
                console.log('❌ Content strategy not found');
                this.contentStrategy = { priorityPages: [] };
            }
        } catch (error) {
            console.error('❌ Error loading content strategy:', error.message);
            this.contentStrategy = { priorityPages: [] };
        }
    }

    async deployAllPages() {
        console.log('🚀 Starting deployment of SEO-optimized pages...\n');
        
        // Get unique pages (remove duplicates)
        const uniquePages = this.getUniquePages();
        console.log(`📄 Found ${uniquePages.length} unique pages to deploy`);
        
        // Group pages by branch
        const pagesByBranch = this.groupPagesByBranch(uniquePages);
        
        // Deploy to each branch
        for (const [branchName, pages] of Object.entries(pagesByBranch)) {
            try {
                await this.deployToBranch(branchName, pages);
                console.log(`✅ Successfully deployed ${pages.length} pages to ${branchName}`);
            } catch (error) {
                console.error(`❌ Error deploying to ${branchName}:`, error.message);
                this.errors.push({ branch: branchName, error: error.message });
            }
        }
        
        // Return to main
        await execAsync('git checkout main');
        
        // Show summary
        this.showDeploymentSummary();
    }

    getUniquePages() {
        const seen = new Set();
        const unique = [];
        
        for (const page of this.contentStrategy.priorityPages) {
            const key = `${page.keyword}-${page.category}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(page);
            }
        }
        
        return unique.slice(0, 15); // Limit to 15 pages for demo
    }

    groupPagesByBranch(pages) {
        const grouped = {};
        
        pages.forEach(page => {
            const branch = page.targetBranch;
            if (!grouped[branch]) {
                grouped[branch] = [];
            }
            grouped[branch].push(page);
        });
        
        return grouped;
    }

    async deployToBranch(branchName, pages) {
        console.log(`\n📦 Deploying ${pages.length} pages to ${branchName}...`);
        
        // Switch to target branch
        await execAsync(`git checkout ${branchName}`);
        await execAsync(`git pull origin ${branchName}`);
        
        // Deploy each page
        for (const pageData of pages) {
            try {
                const html = this.generatePageHTML(pageData);
                const filename = this.generateFilename(pageData.keyword);
                const filePath = this.generateFilePath(pageData, filename);
                
                // Ensure directory exists
                const dirPath = path.dirname(filePath);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
                
                // Write page file
                fs.writeFileSync(filePath, html);
                
                this.deployedPages.push({
                    keyword: pageData.keyword,
                    filename: filename,
                    filePath: filePath,
                    branch: branchName,
                    deployedAt: new Date().toISOString()
                });
                
                console.log(`  📄 Deployed: ${filePath}`);
            } catch (error) {
                console.error(`  ❌ Failed to deploy ${pageData.keyword}:`, error.message);
                this.errors.push({ page: pageData.keyword, error: error.message });
            }
        }
        
        // Commit and push changes
        try {
            await execAsync('git add .');
            await execAsync(`git commit -m "🚀 Deploy ${pages.length} SEO-optimized pages via swarm system"`);
            await execAsync(`git push origin ${branchName}`);
            console.log(`  💾 Committed and pushed changes to ${branchName}`);
        } catch (error) {
            console.error(`  ⚠️ Warning: Could not commit/push to ${branchName}:`, error.message);
        }
    }

    generatePageHTML(pageData) {
        const keyword = pageData.keyword;
        const category = pageData.category;
        const title = this.generateTitle(keyword, category);
        const metaDescription = this.generateMetaDescription(keyword, category);
        const canonicalUrl = this.generateCanonicalUrl(pageData);
        const schemaMarkup = this.generateSchemaMarkup(keyword, category);
        
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${metaDescription}">
    <link rel="canonical" href="${canonicalUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${metaDescription}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://it-era.it/images/og-image.jpg">
    <meta property="og:site_name" content="IT-ERA">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="/css/style.css" rel="stylesheet">
    <script type="application/ld+json">
${schemaMarkup}
    </script>
</head>
<body>
    <header class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="/">
                <img src="/images/logo.png" alt="IT-ERA" height="40">
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <nav class="navbar-nav ms-auto">
                    <a class="nav-link" href="/">Home</a>
                    <a class="nav-link" href="/servizi">Servizi</a>
                    <a class="nav-link" href="/chi-siamo">Chi Siamo</a>
                    <a class="nav-link" href="/contatti">Contatti</a>
                </nav>
            </div>
        </div>
    </header>
    
    <main>
        <!-- Hero Section -->
        <section class="hero-section py-5 bg-gradient-primary text-white">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-lg-8">
                        <h1 class="display-4 mb-4">${keyword.charAt(0).toUpperCase() + keyword.slice(1)}</h1>
                        <p class="lead mb-4">Servizi professionali di ${keyword} per la tua azienda. Soluzioni IT complete, consulenza specializzata e supporto dedicato per garantire la massima sicurezza e performance.</p>
                        <div class="d-flex flex-wrap gap-3">
                            <a href="/contatti" class="btn btn-light btn-lg">
                                <i class="fas fa-envelope me-2"></i>Richiedi Preventivo Gratuito
                            </a>
                            <a href="tel:+390212345678" class="btn btn-outline-light btn-lg">
                                <i class="fas fa-phone me-2"></i>Chiama Ora
                            </a>
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <img src="/images/services-hero.jpg" alt="${keyword}" class="img-fluid rounded shadow">
                    </div>
                </div>
            </div>
        </section>

        <!-- Services Section -->
        <section class="services-section py-5">
            <div class="container">
                <h2 class="text-center mb-5">I Nostri Servizi di ${keyword}</h2>
                <div class="row g-4">
                    <div class="col-md-4">
                        <div class="card h-100 shadow-sm">
                            <div class="card-body text-center">
                                <i class="fas fa-shield-alt fa-3x text-primary mb-3"></i>
                                <h3 class="card-title h5">Consulenza Specializzata</h3>
                                <p class="card-text">Analisi approfondita delle tue esigenze e progettazione di soluzioni personalizzate per la massima efficacia.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card h-100 shadow-sm">
                            <div class="card-body text-center">
                                <i class="fas fa-cogs fa-3x text-primary mb-3"></i>
                                <h3 class="card-title h5">Implementazione Professionale</h3>
                                <p class="card-text">Installazione e configurazione con metodologie certificate e best practices del settore.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card h-100 shadow-sm">
                            <div class="card-body text-center">
                                <i class="fas fa-headset fa-3x text-primary mb-3"></i>
                                <h3 class="card-title h5">Supporto Continuo</h3>
                                <p class="card-text">Assistenza tecnica specializzata e manutenzione preventiva programmata per garantire continuità operativa.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Benefits Section -->
        <section class="benefits-section py-5 bg-light">
            <div class="container">
                <h2 class="text-center mb-5">Vantaggi dei Nostri Servizi</h2>
                <div class="row align-items-center">
                    <div class="col-lg-6">
                        <ul class="list-unstyled">
                            <li class="mb-3 d-flex align-items-center">
                                <i class="fas fa-check-circle text-success me-3 fs-5"></i>
                                <span>Riduzione significativa dei rischi operativi</span>
                            </li>
                            <li class="mb-3 d-flex align-items-center">
                                <i class="fas fa-check-circle text-success me-3 fs-5"></i>
                                <span>Miglioramento delle performance aziendali</span>
                            </li>
                            <li class="mb-3 d-flex align-items-center">
                                <i class="fas fa-check-circle text-success me-3 fs-5"></i>
                                <span>Conformità normativa garantita</span>
                            </li>
                            <li class="mb-3 d-flex align-items-center">
                                <i class="fas fa-check-circle text-success me-3 fs-5"></i>
                                <span>Supporto tecnico specializzato 24/7</span>
                            </li>
                            <li class="mb-3 d-flex align-items-center">
                                <i class="fas fa-check-circle text-success me-3 fs-5"></i>
                                <span>ROI misurabile e documentato</span>
                            </li>
                            <li class="mb-3 d-flex align-items-center">
                                <i class="fas fa-check-circle text-success me-3 fs-5"></i>
                                <span>Tecnologie all'avanguardia</span>
                            </li>
                        </ul>
                    </div>
                    <div class="col-lg-6">
                        <img src="/images/benefits.jpg" alt="Vantaggi ${keyword}" class="img-fluid rounded shadow">
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section py-5 bg-primary text-white">
            <div class="container text-center">
                <h2 class="mb-4">Richiedi un Preventivo Gratuito</h2>
                <p class="lead mb-4">Contattaci per una consulenza personalizzata sui nostri servizi di ${keyword}. I nostri esperti sono pronti ad aiutarti.</p>
                <div class="d-flex justify-content-center gap-3">
                    <a href="/contatti" class="btn btn-light btn-lg">
                        <i class="fas fa-envelope me-2"></i>Contattaci Ora
                    </a>
                    <a href="/preventivo" class="btn btn-outline-light btn-lg">
                        <i class="fas fa-calculator me-2"></i>Preventivo Online
                    </a>
                </div>
            </div>
        </section>

        <!-- FAQ Section -->
        <section class="faq-section py-5">
            <div class="container">
                <h2 class="text-center mb-5">Domande Frequenti</h2>
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="accordion" id="faqAccordion">
                            <div class="accordion-item">
                                <h3 class="accordion-header">
                                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                                        Quanto costa implementare ${keyword}?
                                    </button>
                                </h3>
                                <div id="faq1" class="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                                    <div class="accordion-body">
                                        I costi variano in base alle dimensioni dell'azienda e ai requisiti specifici. Offriamo sempre un preventivo gratuito e personalizzato dopo un'analisi approfondita delle vostre esigenze.
                                    </div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h3 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                                        Quanto tempo richiede l'implementazione?
                                    </button>
                                </h3>
                                <div id="faq2" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                    <div class="accordion-body">
                                        Generalmente da 1 a 4 settimane, a seconda della complessità del progetto e delle dimensioni dell'infrastruttura esistente.
                                    </div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h3 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                                        Fornite supporto post-implementazione?
                                    </button>
                                </h3>
                                <div id="faq3" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                    <div class="accordion-body">
                                        Sì, offriamo supporto tecnico continuo, manutenzione preventiva e aggiornamenti regolari per garantire la massima efficacia nel tempo.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>
    
    <footer class="bg-dark text-white py-5">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h5>IT-ERA</h5>
                    <p class="mb-3">Servizi IT professionali per aziende moderne. Esperienza, competenza e innovazione al servizio del vostro business.</p>
                    <div class="d-flex gap-3">
                        <a href="#" class="text-white"><i class="fab fa-linkedin"></i></a>
                        <a href="#" class="text-white"><i class="fab fa-facebook"></i></a>
                        <a href="#" class="text-white"><i class="fab fa-twitter"></i></a>
                    </div>
                </div>
                <div class="col-md-6 text-md-end">
                    <p class="mb-1"><strong>Contatti:</strong></p>
                    <p class="mb-1">Via Example 123, 20100 Milano</p>
                    <p class="mb-1">Tel: +39 02 1234567</p>
                    <p class="mb-0">Email: info@it-era.it</p>
                </div>
            </div>
            <hr class="my-4">
            <div class="row">
                <div class="col-md-6">
                    <p class="mb-0">&copy; 2025 IT-ERA. Tutti i diritti riservati.</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <a href="/privacy" class="text-white me-3">Privacy Policy</a>
                    <a href="/cookie" class="text-white">Cookie Policy</a>
                </div>
            </div>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/js/main.js"></script>
</body>
</html>`;
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

    generateCanonicalUrl(pageData) {
        const filename = this.generateFilename(pageData.keyword);
        const categoryPath = this.getCategoryPath(pageData.category);
        return `https://it-era.it/${categoryPath}/${filename}`;
    }

    generateSchemaMarkup(keyword, category) {
        const schema = {
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
            schema["@type"] = ["Service", "LocalBusiness"];
            schema.geo = {
                "@type": "GeoCoordinates",
                "latitude": "45.4642",
                "longitude": "9.1900"
            };
        }

        return JSON.stringify(schema, null, 4);
    }

    generateFilename(keyword) {
        return keyword
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

    showDeploymentSummary() {
        console.log('\n📊 DEPLOYMENT SUMMARY');
        console.log('====================');
        console.log(`Total Pages Deployed: ${this.deployedPages.length}`);
        console.log(`Deployment Errors: ${this.errors.length}`);
        
        if (this.deployedPages.length > 0) {
            console.log('\n🌿 PAGES BY BRANCH:');
            const pagesByBranch = {};
            this.deployedPages.forEach(page => {
                if (!pagesByBranch[page.branch]) {
                    pagesByBranch[page.branch] = 0;
                }
                pagesByBranch[page.branch]++;
            });
            
            for (const [branch, count] of Object.entries(pagesByBranch)) {
                console.log(`  ${branch}: ${count} pages`);
            }
            
            console.log('\n📄 DEPLOYED PAGES:');
            this.deployedPages.forEach(page => {
                console.log(`  ✅ ${page.keyword} → ${page.filePath}`);
            });
        }
        
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.errors.forEach(error => {
                console.log(`  ${error.branch || error.page}: ${error.error}`);
            });
        }
        
        console.log('\n🎉 SEO page deployment completed successfully!');
    }
}

// Execute if run directly
if (require.main === module) {
    const deployer = new SEOPageDeployer();
    deployer.deployAllPages().catch(console.error);
}

module.exports = SEOPageDeployer;
