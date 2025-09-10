#!/usr/bin/env node

/**
 * IT-ERA Page Converter
 * Converts existing HTML pages to new component-based system
 */

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

// Simple color functions as fallback
const colors = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`
};

class PageConverter {
    constructor() {
        this.projectRoot = process.cwd();
        this.publicDir = path.join(this.projectRoot, 'public');
        this.srcDir = path.join(this.projectRoot, 'src');
        this.templatesDir = path.join(this.srcDir, 'pages/templates');
        
        this.stats = {
            pagesProcessed: 0,
            pagesConverted: 0,
            errors: 0,
            warnings: 0
        };
        
        // Load component templates
        this.components = {};
    }
    
    async convert() {
        console.log(colors.blue('\n🔄 IT-ERA Page Converter Starting...\n'));
        
        try {
            await this.loadComponents();
            await this.convertHomepage();
            await this.convertServicePages();
            await this.generateReport();
            
            console.log(colors.green('\n✅ Page conversion completed successfully!\n'));
        } catch (error) {
            console.error(colors.red('\n❌ Page conversion failed:'), error.message);
            process.exit(1);
        }
    }
    
    async loadComponents() {
        console.log(colors.blue('📦 Loading component templates...'));
        
        try {
            this.components.header = await fs.readFile(
                path.join(this.srcDir, 'components/layout/header.html'),
                'utf8'
            );
            
            this.components.footer = await fs.readFile(
                path.join(this.srcDir, 'components/layout/footer.html'),
                'utf8'
            );
            
            this.components.baseTemplate = await fs.readFile(
                path.join(this.srcDir, 'pages/templates/base.html'),
                'utf8'
            );
            
            console.log(colors.green('✅ Components loaded'));
        } catch (error) {
            console.log(colors.yellow('⚠️  Using fallback components'));
            await this.createFallbackComponents();
        }
    }
    
    async createFallbackComponents() {
        // Create minimal fallback components if they don't exist
        this.components.header = `
<header class="itera-header">
    <div class="container">
        <div class="header-content">
            <div class="header-brand">
                <a href="/" class="brand-link">
                    <span class="brand-text">IT-ERA</span>
                </a>
            </div>
            <nav class="header-nav">
                <ul class="nav-list">
                    <li><a href="/assistenza-informatica.html">Assistenza IT</a></li>
                    <li><a href="/cybersecurity.html">Cybersecurity</a></li>
                    <li><a href="/cloud-storage.html">Cloud Storage</a></li>
                    <li><a href="/backup-disaster-recovery.html">Backup & DR</a></li>
                    <li><a href="/claude-flow/dashboard.html" class="nav-link--claude">Claude Flow</a></li>
                </ul>
            </nav>
            <div class="header-actions">
                <a href="/contatti.html" class="btn btn-primary">Contattaci</a>
            </div>
        </div>
    </div>
</header>`;
        
        this.components.footer = `
<footer class="itera-footer">
    <div class="container">
        <div class="footer-content">
            <div class="footer-section">
                <h3>IT-ERA</h3>
                <p>Assistenza IT professionale in Lombardia</p>
                <p>📞 039 888 2041</p>
                <p>✉️ info@it-era.it</p>
            </div>
            <div class="footer-section">
                <h3>Servizi</h3>
                <ul>
                    <li><a href="/assistenza-informatica.html">Assistenza IT</a></li>
                    <li><a href="/cybersecurity.html">Cybersecurity</a></li>
                    <li><a href="/cloud-storage.html">Cloud Storage</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h3>AI & Automazione</h3>
                <ul>
                    <li><a href="/claude-flow/dashboard.html">Claude Flow</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2024 IT-ERA. Tutti i diritti riservati.</p>
        </div>
    </div>
</footer>`;
        
        this.components.baseTemplate = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} | IT-ERA</title>
    <meta name="description" content="{{description}}">
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    {{header}}
    <main role="main">
        {{content}}
    </main>
    {{footer}}
    
    <!-- Claude Flow Integration -->
    <div id="chat-widget"></div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/js/main.js"></script>
</body>
</html>`;
    }
    
    async convertHomepage() {
        console.log(colors.blue('🏠 Converting homepage...'));
        
        try {
            const homepagePath = path.join(this.publicDir, 'index.html');
            
            if (!await fs.pathExists(homepagePath)) {
                console.log(colors.yellow('⚠️  Homepage not found, creating new one'));
                await this.createNewHomepage();
                return;
            }
            
            const originalContent = await fs.readFile(homepagePath, 'utf8');
            const $ = cheerio.load(originalContent);
            
            // Extract page metadata
            const pageData = {
                title: $('title').text().replace(' | IT-ERA', '') || 'Assistenza IT Professionale',
                description: $('meta[name="description"]').attr('content') || 'Assistenza IT professionale in Lombardia. Supporto tecnico 24/7 per la tua azienda.',
                keywords: $('meta[name="keywords"]').attr('content') || 'assistenza it, supporto tecnico, lombardia'
            };
            
            // Extract main content (remove existing header/footer/nav)
            $('header, nav, footer, .navbar, .header, .footer').remove();
            $('script').remove();
            $('link[rel="stylesheet"]').remove();
            
            const mainContent = $('main').html() || $('body').html() || '';
            
            // Create new page with components
            const newPage = this.components.baseTemplate
                .replace('{{title}}', pageData.title)
                .replace('{{description}}', pageData.description)
                .replace('{{header}}', this.components.header)
                .replace('{{footer}}', this.components.footer)
                .replace('{{content}}', mainContent);
            
            // Save converted page
            await fs.writeFile(homepagePath, newPage, 'utf8');
            
            this.stats.pagesConverted++;
            console.log(colors.green('✅ Homepage converted'));
            
        } catch (error) {
            this.stats.errors++;
            console.log(colors.red('❌ Homepage conversion failed:'), error.message);
        }
        
        this.stats.pagesProcessed++;
    }
    
    async createNewHomepage() {
        const homepageContent = `
        <section class="hero-section">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-lg-6">
                        <h1 class="hero-title">Assistenza IT Professionale in Lombardia</h1>
                        <p class="hero-subtitle">
                            Supporto tecnico 24/7 per la tua azienda. 
                            Cybersecurity, cloud storage e backup professionale.
                        </p>
                        <div class="hero-actions">
                            <a href="/contatti.html" class="btn btn-primary btn-lg">Richiedi Preventivo</a>
                            <a href="/claude-flow/dashboard.html" class="btn btn-outline-primary btn-lg">
                                <i class="fas fa-robot"></i> Claude Flow AI
                            </a>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="hero-image">
                            <img src="/images/hero-it-support.jpg" alt="Assistenza IT" class="img-fluid">
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <section class="services-section py-5">
            <div class="container">
                <div class="row">
                    <div class="col-12 text-center mb-5">
                        <h2>I Nostri Servizi</h2>
                        <p class="lead">Soluzioni IT complete per la tua azienda</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div class="service-card">
                            <div class="service-icon">
                                <i class="fas fa-tools"></i>
                            </div>
                            <h3>Assistenza IT</h3>
                            <p>Supporto tecnico professionale per hardware e software</p>
                            <a href="/assistenza-informatica.html" class="btn btn-outline-primary">Scopri di più</a>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div class="service-card">
                            <div class="service-icon">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <h3>Cybersecurity</h3>
                            <p>Protezione avanzata per i tuoi dati e sistemi</p>
                            <a href="/cybersecurity.html" class="btn btn-outline-primary">Scopri di più</a>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div class="service-card">
                            <div class="service-icon">
                                <i class="fas fa-cloud"></i>
                            </div>
                            <h3>Cloud Storage</h3>
                            <p>Archiviazione sicura e accessibile ovunque</p>
                            <a href="/cloud-storage.html" class="btn btn-outline-primary">Scopri di più</a>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div class="service-card">
                            <div class="service-icon">
                                <i class="fas fa-database"></i>
                            </div>
                            <h3>Backup & DR</h3>
                            <p>Backup automatico e disaster recovery</p>
                            <a href="/backup-disaster-recovery.html" class="btn btn-outline-primary">Scopri di più</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <section class="ai-section py-5 bg-light">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-lg-6">
                        <h2>Claude Flow AI</h2>
                        <p class="lead">
                            Sistema di automazione AI avanzato per ottimizzare i processi IT della tua azienda.
                        </p>
                        <ul class="feature-list">
                            <li><i class="fas fa-check text-success"></i> Automazione workflow</li>
                            <li><i class="fas fa-check text-success"></i> Analisi intelligente</li>
                            <li><i class="fas fa-check text-success"></i> Monitoraggio 24/7</li>
                            <li><i class="fas fa-check text-success"></i> Integrazione seamless</li>
                        </ul>
                        <a href="/claude-flow/dashboard.html" class="btn btn-primary btn-lg">
                            <i class="fas fa-robot"></i> Accedi al Dashboard
                        </a>
                    </div>
                    <div class="col-lg-6">
                        <div class="ai-demo">
                            <img src="/images/claude-flow-preview.jpg" alt="Claude Flow Dashboard" class="img-fluid rounded shadow">
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <section class="contact-section py-5">
            <div class="container">
                <div class="row">
                    <div class="col-12 text-center">
                        <h2>Contattaci Oggi</h2>
                        <p class="lead">Richiedi una consulenza gratuita per la tua azienda</p>
                        <div class="contact-info">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="contact-item">
                                        <i class="fas fa-phone fa-2x text-primary mb-3"></i>
                                        <h4>Telefono</h4>
                                        <p><a href="tel:0398882041">039 888 2041</a></p>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="contact-item">
                                        <i class="fas fa-envelope fa-2x text-primary mb-3"></i>
                                        <h4>Email</h4>
                                        <p><a href="mailto:info@it-era.it">info@it-era.it</a></p>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="contact-item">
                                        <i class="fas fa-map-marker-alt fa-2x text-primary mb-3"></i>
                                        <h4>Sede</h4>
                                        <p>Viale Risorgimento 32<br>Vimercate MB</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <a href="/contatti.html" class="btn btn-primary btn-lg mt-4">Richiedi Preventivo</a>
                    </div>
                </div>
            </div>
        </section>`;
        
        const newHomepage = this.components.baseTemplate
            .replace('{{title}}', 'Assistenza IT Professionale')
            .replace('{{description}}', 'Assistenza IT professionale in Lombardia. Supporto tecnico 24/7, cybersecurity, cloud storage e backup per la tua azienda.')
            .replace('{{header}}', this.components.header)
            .replace('{{footer}}', this.components.footer)
            .replace('{{content}}', homepageContent);
        
        await fs.writeFile(
            path.join(this.publicDir, 'index.html'),
            newHomepage,
            'utf8'
        );
        
        this.stats.pagesConverted++;
        console.log(colors.green('✅ New homepage created'));
    }
    
    async convertServicePages() {
        console.log(colors.blue('🛠️  Converting service pages...'));
        
        const servicePages = [
            'assistenza-informatica.html',
            'cybersecurity.html',
            'cloud-storage.html',
            'backup-disaster-recovery.html'
        ];
        
        for (const pageName of servicePages) {
            await this.convertServicePage(pageName);
        }
    }
    
    async convertServicePage(pageName) {
        try {
            const pagePath = path.join(this.publicDir, pageName);
            
            if (!await fs.pathExists(pagePath)) {
                console.log(colors.yellow(`⚠️  ${pageName} not found, skipping`));
                return;
            }
            
            const originalContent = await fs.readFile(pagePath, 'utf8');
            const $ = cheerio.load(originalContent);
            
            // Extract page metadata
            const pageData = {
                title: $('title').text().replace(' | IT-ERA', '') || pageName.replace('.html', '').replace('-', ' '),
                description: $('meta[name="description"]').attr('content') || `Servizio ${pageName.replace('.html', '')} professionale`,
                keywords: $('meta[name="keywords"]').attr('content') || ''
            };
            
            // Extract main content
            $('header, nav, footer, .navbar, .header, .footer').remove();
            $('script').remove();
            $('link[rel="stylesheet"]').remove();
            
            let mainContent = $('main').html() || $('body').html() || '';
            
            // Clean up the content
            mainContent = this.cleanupContent(mainContent);
            
            // Create new page
            const newPage = this.components.baseTemplate
                .replace('{{title}}', pageData.title)
                .replace('{{description}}', pageData.description)
                .replace('{{header}}', this.components.header)
                .replace('{{footer}}', this.components.footer)
                .replace('{{content}}', mainContent);
            
            // Save converted page
            await fs.writeFile(pagePath, newPage, 'utf8');
            
            this.stats.pagesConverted++;
            console.log(colors.green(`✅ ${pageName} converted`));
            
        } catch (error) {
            this.stats.errors++;
            console.log(colors.red(`❌ ${pageName} conversion failed:`), error.message);
        }
        
        this.stats.pagesProcessed++;
    }
    
    cleanupContent(content) {
        // Remove empty elements and clean up HTML
        const $ = cheerio.load(content);
        
        // Remove empty elements
        $('*').each(function() {
            if ($(this).is(':empty') && !$(this).is('img, br, hr, input')) {
                $(this).remove();
            }
        });
        
        // Add Bootstrap classes to common elements
        $('button').addClass('btn');
        $('table').addClass('table table-striped');
        $('img').addClass('img-fluid');
        
        return $.html();
    }
    
    async generateReport() {
        console.log(colors.blue('\n📊 Conversion Report:'));
        console.log(colors.gray(`Pages processed: ${this.stats.pagesProcessed}`));
        console.log(colors.gray(`Pages converted: ${this.stats.pagesConverted}`));
        console.log(colors.gray(`Errors: ${this.stats.errors}`));
        console.log(colors.gray(`Warnings: ${this.stats.warnings}`));
        
        const successRate = this.stats.pagesProcessed > 0 ? 
            ((this.stats.pagesConverted / this.stats.pagesProcessed) * 100).toFixed(1) : 0;
        console.log(colors.gray(`Success rate: ${successRate}%`));
    }
}

// Run converter if called directly
if (require.main === module) {
    const converter = new PageConverter();
    converter.convert().catch(console.error);
}

module.exports = PageConverter;
