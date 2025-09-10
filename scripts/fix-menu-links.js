#!/usr/bin/env node

/**
 * IT-ERA Menu Links Fix Script
 * Fixes broken menu links and ensures all pages exist
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class ITERAMenuLinksFixer {
    constructor() {
        this.webDir = path.join(projectRoot, 'web');
        this.brokenLinks = [];
        this.fixedLinks = [];
        this.missingPages = [];
        
        console.log('🔧 IT-ERA Menu Links Fixer initialized');
    }
    
    async getAllHtmlFiles() {
        const files = await fs.readdir(this.webDir);
        return files.filter(file => file.endsWith('.html'));
    }
    
    async checkFileExists(filePath) {
        try {
            await fs.access(path.join(this.webDir, filePath));
            return true;
        } catch {
            return false;
        }
    }
    
    async findCorrectPath(fileName) {
        // Check different possible locations
        const possiblePaths = [
            fileName,
            `pages/${fileName}`,
            `pages-generated/${fileName}`,
            fileName.replace('.html', '.html')
        ];
        
        for (const possiblePath of possiblePaths) {
            if (await this.checkFileExists(possiblePath)) {
                return possiblePath;
            }
        }
        
        return null;
    }
    
    async analyzeMenuLinks() {
        console.log('🔍 Analyzing menu links...');
        
        const menuFile = path.join(this.webDir, 'menu-clean.html');
        const menuContent = await fs.readFile(menuFile, 'utf8');
        
        // Extract all href links
        const hrefRegex = /href="([^"]+)"/g;
        const links = [];
        let match;
        
        while ((match = hrefRegex.exec(menuContent)) !== null) {
            const href = match[1];
            if (href.startsWith('/') && href.endsWith('.html')) {
                links.push(href.substring(1)); // Remove leading slash
            }
        }
        
        console.log(`📋 Found ${links.length} HTML links in menu`);
        
        // Check each link
        for (const link of links) {
            const exists = await this.checkFileExists(link);
            if (!exists) {
                const correctPath = await this.findCorrectPath(path.basename(link));
                if (correctPath) {
                    this.brokenLinks.push({ original: link, correct: correctPath });
                    console.log(`🔧 Broken link found: ${link} → ${correctPath}`);
                } else {
                    this.missingPages.push(link);
                    console.log(`❌ Missing page: ${link}`);
                }
            } else {
                console.log(`✅ Link OK: ${link}`);
            }
        }
        
        return { brokenLinks: this.brokenLinks, missingPages: this.missingPages };
    }
    
    async createMissingPages() {
        console.log('📄 Creating missing pages...');
        
        for (const missingPage of this.missingPages) {
            const fileName = path.basename(missingPage);
            const cityName = this.extractCityName(fileName);
            const serviceName = this.extractServiceName(fileName);
            
            const pageContent = this.generatePageContent(cityName, serviceName, fileName);
            const filePath = path.join(this.webDir, missingPage);
            
            // Create directory if it doesn't exist
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            
            await fs.writeFile(filePath, pageContent, 'utf8');
            console.log(`✅ Created missing page: ${missingPage}`);
        }
    }
    
    extractCityName(fileName) {
        const cityMap = {
            'milano': 'Milano',
            'bergamo': 'Bergamo',
            'brescia': 'Brescia',
            'monza': 'Monza',
            'como': 'Como',
            'cremona': 'Cremona',
            'lecco': 'Lecco',
            'lodi': 'Lodi',
            'mantova': 'Mantova',
            'pavia': 'Pavia',
            'sondrio': 'Sondrio',
            'varese': 'Varese'
        };
        
        for (const [key, value] of Object.entries(cityMap)) {
            if (fileName.includes(key)) {
                return value;
            }
        }
        
        return 'Lombardia';
    }
    
    extractServiceName(fileName) {
        if (fileName.includes('assistenza-it')) return 'Assistenza IT';
        if (fileName.includes('sicurezza-informatica')) return 'Sicurezza Informatica';
        if (fileName.includes('cloud-storage')) return 'Cloud Storage';
        if (fileName.includes('studi-medici')) return 'IT per Studi Medici';
        if (fileName.includes('studi-legali')) return 'IT per Studi Legali';
        if (fileName.includes('commercialisti')) return 'IT per Commercialisti';
        if (fileName.includes('pmi-startup')) return 'IT per PMI e Startup';
        
        return 'Servizi IT';
    }
    
    generatePageContent(cityName, serviceName, fileName) {
        const title = `${serviceName} ${cityName} - IT-ERA`;
        const description = `${serviceName} professionale a ${cityName}. IT-ERA offre supporto tecnico 24/7 con risposta garantita in 15 minuti. Chiamaci: 039 888 2041`;
        
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="${serviceName.toLowerCase()}, ${cityName.toLowerCase()}, IT-ERA, assistenza informatica, supporto tecnico">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://it-era.it/${fileName}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="https://it-era.it/${fileName}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://it-era.it/images/it-era-og-image.jpg">
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/styles.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
        <div class="container">
            <a class="navbar-brand" href="/">
                <span style="color: #0056cc;">IT</span>-ERA
            </a>
            <div class="d-flex">
                <a href="tel:+390398882041" class="btn btn-danger me-2">
                    📞 039 888 2041
                </a>
                <a href="/" class="btn btn-outline-light">
                    🏠 Home
                </a>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section bg-primary text-white py-5" style="margin-top: 76px;">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-8">
                    <h1 class="display-4 fw-bold mb-4">${serviceName} ${cityName}</h1>
                    <p class="lead mb-4">${description}</p>
                    
                    <!-- Emergency Contact -->
                    <div class="alert alert-danger d-flex align-items-center mb-4">
                        <i class="fas fa-exclamation-triangle me-3 fs-4"></i>
                        <div>
                            <strong>EMERGENZA IT?</strong><br>
                            Chiamaci subito: <a href="tel:+390398882041" class="text-white"><strong>039 888 2041</strong></a><br>
                            <small>Risposta garantita in 15 minuti - Servizio 24/7</small>
                        </div>
                    </div>
                    
                    <!-- CTA Buttons -->
                    <div class="d-flex flex-wrap gap-3">
                        <a href="tel:+390398882041" class="btn btn-danger btn-lg">
                            📞 Chiama Ora: 039 888 2041
                        </a>
                        <a href="/#contatti" class="btn btn-outline-light btn-lg">
                            📧 Richiedi Preventivo
                        </a>
                    </div>
                </div>
                <div class="col-lg-4 text-center">
                    <i class="fas fa-laptop-code display-1 mb-3"></i>
                    <h3>Supporto Professionale</h3>
                    <p>Team certificato disponibile 24/7</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section class="py-5">
        <div class="container">
            <div class="row">
                <div class="col-lg-8">
                    <h2>I Nostri Servizi a ${cityName}</h2>
                    <div class="row g-4 mt-3">
                        <div class="col-md-6">
                            <div class="card h-100">
                                <div class="card-body">
                                    <i class="fas fa-tools text-primary fs-2 mb-3"></i>
                                    <h5>Assistenza Tecnica</h5>
                                    <p>Riparazione hardware, installazione software, configurazione reti</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card h-100">
                                <div class="card-body">
                                    <i class="fas fa-shield-alt text-primary fs-2 mb-3"></i>
                                    <h5>Sicurezza Informatica</h5>
                                    <p>Protezione da malware, backup sicuri, conformità GDPR</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card h-100">
                                <div class="card-body">
                                    <i class="fas fa-cloud text-primary fs-2 mb-3"></i>
                                    <h5>Cloud Storage</h5>
                                    <p>Archiviazione sicura, sincronizzazione, accesso remoto</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card h-100">
                                <div class="card-body">
                                    <i class="fas fa-headset text-primary fs-2 mb-3"></i>
                                    <h5>Supporto 24/7</h5>
                                    <p>Assistenza telefonica e remota sempre disponibile</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <h5>Contattaci Subito</h5>
                            <p class="mb-3">Siamo qui per aiutarti</p>
                            <a href="tel:+390398882041" class="btn btn-danger btn-lg w-100 mb-3">
                                📞 039 888 2041
                            </a>
                            <p class="small text-muted">
                                Chiamata gratuita<br>
                                Risposta in 15 minuti<br>
                                Servizio 24 ore su 24
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-dark text-white py-4">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h5>IT-ERA</h5>
                    <p>Assistenza IT professionale per aziende in Lombardia</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <h5>Emergenza IT</h5>
                    <p class="mb-0">
                        <a href="tel:+390398882041" class="text-white">
                            <i class="fas fa-phone"></i> 039 888 2041
                        </a>
                    </p>
                    <small>Disponibile 24/7 - Risposta in 15 minuti</small>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "${title}",
        "description": "${description}",
        "url": "https://it-era.it/${fileName}",
        "mainEntity": {
            "@type": "Service",
            "name": "${serviceName}",
            "provider": {
                "@type": "LocalBusiness",
                "name": "IT-ERA",
                "telephone": "+39-039-888-2041",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "${cityName}",
                    "addressRegion": "Lombardia",
                    "addressCountry": "IT"
                }
            },
            "areaServed": "${cityName}",
            "availableChannel": {
                "@type": "ServiceChannel",
                "servicePhone": "+39-039-888-2041",
                "serviceUrl": "https://it-era.it/${fileName}"
            }
        }
    }
    </script>
</body>
</html>`;
    }
    
    async fixMenuLinks() {
        console.log('🔧 Fixing menu links...');
        
        const menuFile = path.join(this.webDir, 'menu-clean.html');
        let menuContent = await fs.readFile(menuFile, 'utf8');
        
        // Fix broken links
        for (const { original, correct } of this.brokenLinks) {
            const oldHref = `href="/${original}"`;
            const newHref = `href="/${correct}"`;
            menuContent = menuContent.replace(new RegExp(oldHref, 'g'), newHref);
            this.fixedLinks.push({ from: original, to: correct });
            console.log(`✅ Fixed link: ${original} → ${correct}`);
        }
        
        // Write updated menu
        await fs.writeFile(menuFile, menuContent, 'utf8');
        console.log('✅ Menu links updated');
    }
    
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                brokenLinksFound: this.brokenLinks.length,
                brokenLinksFixed: this.fixedLinks.length,
                missingPagesFound: this.missingPages.length,
                missingPagesCreated: this.missingPages.length
            },
            brokenLinks: this.brokenLinks,
            fixedLinks: this.fixedLinks,
            missingPages: this.missingPages
        };
        
        await fs.writeFile(
            path.join(projectRoot, 'menu-links-fix-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('📋 Report saved to menu-links-fix-report.json');
        return report;
    }
    
    async run() {
        console.log('🚀 Starting menu links fix...\n');
        
        try {
            // Analyze current menu links
            await this.analyzeMenuLinks();
            
            // Create missing pages
            if (this.missingPages.length > 0) {
                await this.createMissingPages();
            }
            
            // Fix broken links in menu
            if (this.brokenLinks.length > 0) {
                await this.fixMenuLinks();
            }
            
            // Generate report
            const report = await this.generateReport();
            
            console.log('\n🎉 Menu links fix completed!');
            console.log(`🔧 Fixed ${report.summary.brokenLinksFixed} broken links`);
            console.log(`📄 Created ${report.summary.missingPagesCreated} missing pages`);
            
            if (report.summary.brokenLinksFound === 0 && report.summary.missingPagesFound === 0) {
                console.log('✅ All menu links are working correctly!');
            }
            
            return report;
            
        } catch (error) {
            console.error('💥 Menu links fix failed:', error);
            process.exit(1);
        }
    }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const fixer = new ITERAMenuLinksFixer();
    fixer.run().catch(console.error);
}

export default ITERAMenuLinksFixer;
