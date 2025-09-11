#!/usr/bin/env node

/**
 * 🚀 DEPLOY GENERATED PAGES - Deploy SEO pages to isolated branches
 * Deploys the generated SEO-optimized pages to appropriate isolated branches
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class PageDeployer {
    constructor() {
        this.deployedPages = [];
        this.errors = [];
        
        // Load generated pages
        this.loadGeneratedPages();
    }

    loadGeneratedPages() {
        try {
            const reportPath = path.join(__dirname, 'page-generation-report.json');
            if (fs.existsSync(reportPath)) {
                const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
                this.generatedPages = this.loadPagesFromFiles();
                console.log(`📊 Found ${this.generatedPages.length} generated pages to deploy`);
            } else {
                console.log('❌ No page generation report found');
                this.generatedPages = [];
            }
        } catch (error) {
            console.error('❌ Error loading generated pages:', error.message);
            this.generatedPages = [];
        }
    }

    loadPagesFromFiles() {
        // Load the actual generated page files
        const pages = [];
        
        // Read content strategy to get page information
        const contentStrategyPath = path.join(__dirname, 'content-strategy.json');
        if (fs.existsSync(contentStrategyPath)) {
            const contentStrategy = JSON.parse(fs.readFileSync(contentStrategyPath, 'utf8'));
            
            // For each priority page, check if HTML file exists
            for (const pageData of contentStrategy.priorityPages.slice(0, 20)) {
                const filename = this.generateFilename(pageData.keyword);
                const htmlPath = path.join(__dirname, filename);
                
                if (fs.existsSync(htmlPath)) {
                    const html = fs.readFileSync(htmlPath, 'utf8');
                    pages.push({
                        keyword: pageData.keyword,
                        category: pageData.category,
                        filename: filename,
                        filePath: this.generateFilePath(pageData, filename),
                        html: html,
                        targetBranch: pageData.targetBranch,
                        estimatedTraffic: pageData.estimatedTraffic
                    });
                } else {
                    // Generate a simple page if file doesn't exist
                    const html = this.generateSimplePage(pageData);
                    pages.push({
                        keyword: pageData.keyword,
                        category: pageData.category,
                        filename: filename,
                        filePath: this.generateFilePath(pageData, filename),
                        html: html,
                        targetBranch: pageData.targetBranch,
                        estimatedTraffic: pageData.estimatedTraffic
                    });
                }
            }
        }
        
        return pages;
    }

    generateSimplePage(pageData) {
        const keyword = pageData.keyword;
        const category = pageData.category;
        
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${keyword} | Servizi IT Professionali | IT-ERA</title>
    <meta name="description" content="Servizi professionali di ${keyword}. Soluzioni IT complete per aziende moderne. Consulenza gratuita e supporto specializzato.">
    <link rel="canonical" href="https://it-era.it/${this.generateFilePath(pageData, this.generateFilename(keyword))}">
    <meta property="og:title" content="${keyword} | Servizi IT Professionali | IT-ERA">
    <meta property="og:description" content="Servizi professionali di ${keyword}. Soluzioni IT complete per aziende moderne.">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://it-era.it/images/og-image.jpg">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="/css/style.css" rel="stylesheet">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "${keyword}",
        "description": "Servizi professionali di ${keyword} per aziende moderne",
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
        }
    }
    </script>
</head>
<body>
    <header class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="/">IT-ERA</a>
            <nav class="navbar-nav ms-auto">
                <a class="nav-link" href="/servizi">Servizi</a>
                <a class="nav-link" href="/contatti">Contatti</a>
            </nav>
        </div>
    </header>
    
    <main>
        <section class="hero-section py-5 bg-light">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-lg-8">
                        <h1 class="display-4 mb-4">${keyword.charAt(0).toUpperCase() + keyword.slice(1)}</h1>
                        <p class="lead mb-4">Servizi professionali di ${keyword} per la tua azienda. Soluzioni IT complete, consulenza specializzata e supporto dedicato.</p>
                        <div class="d-flex gap-3">
                            <a href="/contatti" class="btn btn-primary btn-lg">Richiedi Preventivo</a>
                            <a href="tel:+390212345678" class="btn btn-outline-primary btn-lg">Chiama Ora</a>
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <img src="/images/services-hero.jpg" alt="${keyword}" class="img-fluid rounded">
                    </div>
                </div>
            </div>
        </section>

        <section class="services-section py-5">
            <div class="container">
                <h2 class="text-center mb-5">I Nostri Servizi di ${keyword}</h2>
                <div class="row">
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <i class="fas fa-shield-alt fa-3x text-primary mb-3"></i>
                                <h3 class="card-title">Consulenza Specializzata</h3>
                                <p class="card-text">Analisi approfondita delle tue esigenze e progettazione di soluzioni personalizzate.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <i class="fas fa-cogs fa-3x text-primary mb-3"></i>
                                <h3 class="card-title">Implementazione Professionale</h3>
                                <p class="card-text">Installazione e configurazione con metodologie certificate e best practices.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <i class="fas fa-headset fa-3x text-primary mb-3"></i>
                                <h3 class="card-title">Supporto Continuo</h3>
                                <p class="card-text">Assistenza tecnica specializzata e manutenzione preventiva programmata.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="benefits-section py-5 bg-light">
            <div class="container">
                <h2 class="text-center mb-5">Vantaggi dei Nostri Servizi</h2>
                <div class="row">
                    <div class="col-lg-6">
                        <ul class="list-unstyled">
                            <li class="mb-3"><i class="fas fa-check text-success me-2"></i> Riduzione dei rischi operativi</li>
                            <li class="mb-3"><i class="fas fa-check text-success me-2"></i> Miglioramento delle performance</li>
                            <li class="mb-3"><i class="fas fa-check text-success me-2"></i> Conformità normativa garantita</li>
                            <li class="mb-3"><i class="fas fa-check text-success me-2"></i> Supporto tecnico specializzato</li>
                            <li class="mb-3"><i class="fas fa-check text-success me-2"></i> ROI misurabile e documentato</li>
                        </ul>
                    </div>
                    <div class="col-lg-6">
                        <img src="/images/benefits.jpg" alt="Vantaggi ${keyword}" class="img-fluid rounded">
                    </div>
                </div>
            </div>
        </section>

        <section class="cta-section py-5 bg-primary text-white">
            <div class="container text-center">
                <h2 class="mb-4">Richiedi un Preventivo Gratuito</h2>
                <p class="lead mb-4">Contattaci per una consulenza personalizzata sui nostri servizi di ${keyword}.</p>
                <a href="/contatti" class="btn btn-light btn-lg">Contattaci Ora</a>
            </div>
        </section>
    </main>
    
    <footer class="bg-dark text-white py-4">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h5>IT-ERA</h5>
                    <p>Servizi IT professionali per aziende moderne</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <p>Via Example 123, Milano | Tel: +39 02 1234567</p>
                </div>
            </div>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
    }

    async deployPages() {
        console.log('🚀 Starting deployment of generated SEO pages...\n');
        
        if (this.generatedPages.length === 0) {
            console.log('❌ No pages to deploy');
            return;
        }
        
        // Group pages by target branch
        const pagesByBranch = this.groupPagesByBranch();
        
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
        
        // Return to main branch
        await execAsync('git checkout main');
        
        // Generate deployment summary
        this.generateDeploymentSummary();
    }

    groupPagesByBranch() {
        const grouped = {};
        
        this.generatedPages.forEach(page => {
            const branch = page.targetBranch;
            if (!grouped[branch]) {
                grouped[branch] = [];
            }
            grouped[branch].push(page);
        });
        
        return grouped;
    }

    async deployToBranch(branchName, pages) {
        console.log(`📦 Deploying ${pages.length} pages to ${branchName}...`);
        
        // Switch to target branch
        await execAsync(`git checkout ${branchName}`);
        await execAsync(`git pull origin ${branchName}`);
        
        // Deploy each page
        for (const page of pages) {
            try {
                // Ensure directory exists
                const dirPath = path.dirname(page.filePath);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
                
                // Write page file
                fs.writeFileSync(page.filePath, page.html);
                
                this.deployedPages.push({
                    ...page,
                    deployedAt: new Date().toISOString(),
                    branch: branchName,
                    status: 'success'
                });
                
                console.log(`  📄 Deployed: ${page.filePath}`);
            } catch (error) {
                console.error(`  ❌ Failed to deploy ${page.filename}:`, error.message);
                this.errors.push({ page: page.filename, error: error.message });
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

    generateDeploymentSummary() {
        console.log('\n📊 DEPLOYMENT SUMMARY');
        console.log('====================');
        console.log(`Total Pages Generated: ${this.generatedPages.length}`);
        console.log(`Successfully Deployed: ${this.deployedPages.length}`);
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
        }
        
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.errors.forEach(error => {
                console.log(`  ${error.branch || error.page}: ${error.error}`);
            });
        }
        
        console.log('\n🎉 Deployment completed successfully!');
    }
}

// Execute if run directly
if (require.main === module) {
    const deployer = new PageDeployer();
    deployer.deployPages().catch(console.error);
}

module.exports = PageDeployer;
