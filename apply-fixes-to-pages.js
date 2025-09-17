#!/usr/bin/env node

/**
 * IT-ERA Apply Fixes to Real Pages
 * Applica le correzioni generate alle pagine reali del sito
 */

const fs = require('fs');
const path = require('path');

class PageFixApplicator {
    constructor() {
        this.fixesReport = null;
        this.appliedFixes = [];
        this.failedApplications = [];
    }
    
    // Carica il report delle correzioni
    loadFixesReport() {
        try {
            const data = fs.readFileSync('sitemap-fixes-report.json', 'utf8');
            this.fixesReport = JSON.parse(data);
            console.log(`📊 Loaded fixes for ${this.fixesReport.fixedPages.length} pages`);
            return true;
        } catch (error) {
            console.error('❌ Error loading fixes report:', error.message);
            return false;
        }
    }
    
    // Applica le correzioni alle pagine reali
    async applyFixesToRealPages() {
        if (!this.loadFixesReport()) return;
        
        console.log('🔧 Starting to apply fixes to real pages...\n');
        
        // Applica correzioni alle pagine critiche prima
        const criticalFixes = this.fixesReport.fixedPages.filter(fix => 
            fix.url.includes('it-era.it/') && 
            (fix.url === 'https://it-era.it' || 
             fix.url.includes('contatti') || 
             fix.url.includes('computer-non-si-accende'))
        );
        
        for (const fix of criticalFixes) {
            await this.applyFixToPage(fix);
        }
        
        this.generateApplicationReport();
    }
    
    // Applica correzione a una singola pagina
    async applyFixToPage(fixData) {
        const url = fixData.url;
        const localPath = this.getLocalPagePath(url);
        
        console.log(`🔧 Applying fixes to: ${url}`);
        console.log(`   Local path: ${localPath}`);
        console.log(`   Fixes: ${fixData.fixes.join(', ')}`);
        
        try {
            // Leggi il contenuto della pagina esistente
            let pageContent = '';
            if (fs.existsSync(localPath)) {
                pageContent = fs.readFileSync(localPath, 'utf8');
                console.log(`   ✅ Found existing page (${pageContent.length} chars)`);
            } else {
                // Crea una nuova pagina se non esiste
                pageContent = this.generateNewPageTemplate(url, fixData);
                console.log(`   🆕 Creating new page template`);
            }
            
            // Applica le correzioni
            const updatedContent = this.applyFixesToContent(pageContent, fixData);
            
            // Assicurati che la directory esista
            const dir = path.dirname(localPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`   📁 Created directory: ${dir}`);
            }
            
            // Scrivi il contenuto aggiornato
            fs.writeFileSync(localPath, updatedContent);
            
            this.appliedFixes.push({
                url: url,
                localPath: localPath,
                fixes: fixData.fixes,
                success: true,
                contentLength: updatedContent.length
            });
            
            console.log(`   ✅ Successfully applied fixes\n`);
            
        } catch (error) {
            console.error(`   ❌ Failed to apply fixes: ${error.message}\n`);
            
            this.failedApplications.push({
                url: url,
                localPath: localPath,
                fixes: fixData.fixes,
                error: error.message
            });
        }
    }
    
    // Ottieni il percorso locale della pagina
    getLocalPagePath(url) {
        let localPath = url.replace('https://it-era.it', '.');
        
        // Handle root URL
        if (localPath === '.') {
            localPath = './index.html';
        }
        
        // Add .html if missing
        if (!localPath.endsWith('.html') && !localPath.includes('.')) {
            localPath += '.html';
        }
        
        // Handle directory index
        if (localPath.endsWith('/')) {
            localPath += 'index.html';
        }
        
        return localPath;
    }
    
    // Genera template per nuova pagina
    generateNewPageTemplate(url, fixData) {
        const pageTitle = this.generatePageTitle(url);
        const pageDescription = this.generatePageDescription(url);
        
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <meta name="description" content="${pageDescription}">
    <meta name="keywords" content="assistenza informatica, IT support, Milano, Bergamo, Brescia, Lombardia">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${pageTitle}">
    <meta property="og:description" content="${pageDescription}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="https://it-era.it/images/og-image.jpg">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${pageTitle}">
    <meta name="twitter:description" content="${pageDescription}">
    <meta name="twitter:image" content="https://it-era.it/images/og-image.jpg">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="/css/style.css">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "IT-ERA",
        "description": "${pageDescription}",
        "url": "${url}",
        "telephone": "+39 039 888 2041",
        "email": "info@it-era.it",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Via Roma 123",
            "addressLocality": "Vimercate",
            "postalCode": "20871",
            "addressRegion": "MB",
            "addressCountry": "IT"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": "45.6167",
            "longitude": "9.3667"
        },
        "openingHours": "Mo-Fr 09:00-18:00",
        "sameAs": [
            "https://www.facebook.com/itera.it",
            "https://www.linkedin.com/company/it-era"
        ]
    }
    </script>
</head>
<body class="bg-gray-50">
    <!-- NAVIGATION WILL BE INSERTED HERE -->
    
    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
        <!-- EMERGENCY CONTACT WILL BE INSERTED HERE -->
        
        <div class="bg-white rounded-lg shadow-lg p-8">
            <h1 class="text-4xl font-bold text-gray-800 mb-6">${pageTitle}</h1>
            
            <div class="prose max-w-none">
                <p class="text-lg text-gray-600 mb-6">${pageDescription}</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">I Nostri Servizi</h2>
                        <ul class="space-y-2">
                            <li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i> Assistenza Tecnica 24/7</li>
                            <li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i> Riparazione Hardware</li>
                            <li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i> Supporto Software</li>
                            <li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i> Consulenza IT</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">Perché Scegliere IT-ERA</h2>
                        <ul class="space-y-2">
                            <li class="flex items-center"><i class="fas fa-star text-yellow-500 mr-2"></i> Esperienza Pluriennale</li>
                            <li class="flex items-center"><i class="fas fa-star text-yellow-500 mr-2"></i> Tecnici Certificati</li>
                            <li class="flex items-center"><i class="fas fa-star text-yellow-500 mr-2"></i> Assistenza Rapida</li>
                            <li class="flex items-center"><i class="fas fa-star text-yellow-500 mr-2"></i> Prezzi Competitivi</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- CONTACT FORM WILL BE INSERTED HERE -->
        <!-- CTA SECTION WILL BE INSERTED HERE -->
    </main>
    
    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-8 mt-12">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h3 class="text-xl font-bold mb-4">IT-ERA</h3>
                    <p class="text-gray-300">Assistenza informatica professionale in Lombardia</p>
                </div>
                <div>
                    <h3 class="text-xl font-bold mb-4">Contatti</h3>
                    <p class="text-gray-300">📞 039 888 2041</p>
                    <p class="text-gray-300">📧 info@it-era.it</p>
                </div>
                <div>
                    <h3 class="text-xl font-bold mb-4">Servizi</h3>
                    <p class="text-gray-300">Assistenza 24/7 in tutta la Lombardia</p>
                </div>
            </div>
        </div>
    </footer>
    
    <!-- Scripts -->
    <script src="/js/components-loader.js"></script>
    <!-- UX IMPROVEMENTS WILL BE INSERTED HERE -->
    <!-- RESEND INTEGRATION WILL BE INSERTED HERE -->
</body>
</html>`;
    }
    
    // Genera titolo pagina
    generatePageTitle(url) {
        if (url === 'https://it-era.it') return 'IT-ERA - Assistenza Informatica Professionale in Lombardia';
        
        const path = url.replace('https://it-era.it/', '');
        
        if (path.includes('contatti')) return 'Contatti - IT-ERA Assistenza Informatica';
        if (path.includes('computer-non-si-accende')) {
            const city = path.match(/(milano|bergamo|brescia|como|varese)/i)?.[1] || '';
            return `Computer Non Si Accende ${city.charAt(0).toUpperCase() + city.slice(1)} - Assistenza Emergenza IT-ERA`;
        }
        if (path.includes('servizi-it')) return 'Servizi IT Professionali - IT-ERA Lombardia';
        if (path.includes('settori')) return 'Settori Specializzati - IT-ERA Consulenza';
        if (path.includes('landing')) return 'Soluzioni IT Avanzate - IT-ERA';
        
        return 'IT-ERA - Assistenza Informatica Professionale';
    }
    
    // Genera descrizione pagina
    generatePageDescription(url) {
        if (url === 'https://it-era.it') return 'Assistenza informatica professionale per aziende e privati in Lombardia. Supporto 24/7, riparazione PC, consulenza IT. Chiama 039 888 2041.';
        
        const path = url.replace('https://it-era.it/', '');
        
        if (path.includes('contatti')) return 'Contatta IT-ERA per assistenza informatica immediata. Chiamaci al 039 888 2041 o compila il form per un preventivo gratuito.';
        if (path.includes('computer-non-si-accende')) {
            const city = path.match(/(milano|bergamo|brescia|como|varese)/i)?.[1] || '';
            return `Computer non si accende a ${city.charAt(0).toUpperCase() + city.slice(1)}? Assistenza emergenza 24/7. Chiamaci subito al 039 888 2041 per riparazione immediata.`;
        }
        if (path.includes('servizi-it')) return 'Servizi IT completi per aziende e privati: assistenza tecnica, riparazione hardware, supporto software, consulenza informatica.';
        if (path.includes('settori')) return 'Soluzioni IT specializzate per settori specifici: commercialisti, studi legali, studi medici, PMI e startup.';
        if (path.includes('landing')) return 'Scopri le nostre soluzioni IT avanzate: cloud computing, sicurezza informatica, digitalizzazione aziendale.';
        
        return 'IT-ERA offre assistenza informatica professionale in Lombardia con supporto 24/7 e tecnici specializzati.';
    }
    
    // Applica correzioni al contenuto
    applyFixesToContent(content, fixData) {
        let updatedContent = content;
        
        // Carica i template delle correzioni
        const fixTemplates = this.loadFixTemplates();
        
        fixData.fixes.forEach(fixType => {
            if (fixTemplates[fixType]) {
                updatedContent = this.insertFixIntoContent(updatedContent, fixType, fixTemplates[fixType]);
            }
        });
        
        return updatedContent;
    }
    
    // Carica i template delle correzioni
    loadFixTemplates() {
        const templates = {};
        
        // Carica i template dai file di correzione generati
        fixData.fixes.forEach(fix => {
            try {
                const fixContent = fs.readFileSync(fix.fixFile, 'utf8');
                templates[fix.fixes.join('_')] = fixContent;
            } catch (error) {
                console.log(`   ⚠️ Could not load fix template: ${error.message}`);
            }
        });
        
        return templates;
    }
    
    // Inserisci correzione nel contenuto
    insertFixIntoContent(content, fixType, fixTemplate) {
        const insertionPoints = {
            missingMenu: '<!-- NAVIGATION WILL BE INSERTED HERE -->',
            missingForm: '<!-- CONTACT FORM WILL BE INSERTED HERE -->',
            missingEmergencyContact: '<!-- EMERGENCY CONTACT WILL BE INSERTED HERE -->',
            missingCTA: '<!-- CTA SECTION WILL BE INSERTED HERE -->',
            missingResend: '<!-- RESEND INTEGRATION WILL BE INSERTED HERE -->',
            improveUX: '<!-- UX IMPROVEMENTS WILL BE INSERTED HERE -->'
        };
        
        const insertionPoint = insertionPoints[fixType];
        if (insertionPoint && content.includes(insertionPoint)) {
            return content.replace(insertionPoint, fixTemplate);
        }
        
        // Se non trova il punto di inserimento, aggiungi prima del </body>
        if (content.includes('</body>')) {
            return content.replace('</body>', fixTemplate + '\n</body>');
        }
        
        // Altrimenti aggiungi alla fine
        return content + '\n' + fixTemplate;
    }
    
    // Genera report dell'applicazione
    generateApplicationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFixesAttempted: this.appliedFixes.length + this.failedApplications.length,
                successfulApplications: this.appliedFixes.length,
                failedApplications: this.failedApplications.length,
                successRate: Math.round((this.appliedFixes.length / (this.appliedFixes.length + this.failedApplications.length)) * 100)
            },
            appliedFixes: this.appliedFixes,
            failedApplications: this.failedApplications
        };
        
        fs.writeFileSync('page-fixes-application-report.json', JSON.stringify(report, null, 2));
        
        console.log('\n📊 PAGE FIXES APPLICATION REPORT');
        console.log('==================================');
        console.log(`Total Fixes Attempted: ${report.summary.totalFixesAttempted}`);
        console.log(`✅ Successful Applications: ${report.summary.successfulApplications}`);
        console.log(`❌ Failed Applications: ${report.summary.failedApplications}`);
        console.log(`📈 Success Rate: ${report.summary.successRate}%`);
        
        if (this.appliedFixes.length > 0) {
            console.log('\n✅ Successfully Fixed Pages:');
            this.appliedFixes.forEach(fix => {
                console.log(`  ${fix.url} -> ${fix.localPath}`);
            });
        }
        
        if (this.failedApplications.length > 0) {
            console.log('\n❌ Failed Applications:');
            this.failedApplications.forEach(fail => {
                console.log(`  ${fail.url}: ${fail.error}`);
            });
        }
        
        console.log('\n💾 Detailed report saved to: page-fixes-application-report.json');
        
        return report;
    }
}

// Esegui se chiamato direttamente
if (require.main === module) {
    const applicator = new PageFixApplicator();
    applicator.applyFixesToRealPages()
        .then(() => {
            console.log('\n🎉 Page fixes application completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Page fixes application failed:', error);
            process.exit(1);
        });
}

module.exports = PageFixApplicator;
