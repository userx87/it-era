#!/usr/bin/env node

/**
 * 🐝 IT-ERA SWARM DEPLOYMENT SCRIPT - VERSIONE SEMPLIFICATA
 * Sistema multi-agent semplificato senza dipendenze esterne
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Funzioni di colore semplici
const colors = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// Spinner semplice
function spinner(text) {
    console.log(`🔄 ${text}`);
    return {
        succeed: (msg) => console.log(`✅ ${msg}`),
        fail: (msg) => console.log(`❌ ${msg}`)
    };
}

/**
 * Agente SEO semplificato
 */
class SimpleSEOAgent {
    constructor() {
        this.name = 'SEO Agent';
        console.log(`🤖 ${this.name} initialized`);
    }

    async createSEOPages() {
        console.log('📄 Creating SEO pages...');
        
        const pages = [
            {
                url: '/servizi/backup-disaster-recovery.html',
                title: 'Backup e Disaster Recovery Milano | IT-ERA',
                description: 'Servizi di backup aziendale e disaster recovery a Milano. Protezione dati garantita e ripristino rapido.',
                content: this.generatePageContent('Backup e Disaster Recovery', 'Milano')
            },
            {
                url: '/servizi/microsoft-365-aziende.html',
                title: 'Microsoft 365 per Aziende Milano | IT-ERA',
                description: 'Implementazione Microsoft 365 per aziende a Milano. Produttività cloud e collaborazione avanzata.',
                content: this.generatePageContent('Microsoft 365 per Aziende', 'Milano')
            },
            {
                url: '/settori/industria-manifatturiera.html',
                title: 'Assistenza IT Industria Manifatturiera | IT-ERA',
                description: 'Assistenza informatica specializzata per industria manifatturiera in Lombardia. ERP e automazione.',
                content: this.generatePageContent('Industria Manifatturiera', 'Lombardia')
            }
        ];

        let created = 0;
        for (const page of pages) {
            try {
                await this.createSinglePage(page);
                created++;
                console.log(`  ✅ Created: ${page.url}`);
            } catch (error) {
                console.log(`  ❌ Failed: ${page.url} - ${error.message}`);
            }
        }

        return { created, total: pages.length };
    }

    async createSinglePage(page) {
        const filePath = path.join('_site', page.url);
        const dirPath = path.dirname(filePath);
        
        // Crea directory se non esiste
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Genera HTML
        const html = this.generateHTML(page);
        fs.writeFileSync(filePath, html);
    }

    generatePageContent(service, location) {
        return {
            hero: {
                title: `${service} a ${location}`,
                subtitle: `Servizi IT professionali per ${service.toLowerCase()} a ${location}`,
                cta: 'Contattaci per un preventivo gratuito'
            },
            benefits: [
                'Supporto tecnico specializzato 24/7',
                'Interventi rapidi entro 2 ore',
                'Tecnici certificati e qualificati',
                'Prezzi trasparenti e competitivi',
                'Consulenza gratuita iniziale'
            ],
            process: [
                { step: 1, title: 'Analisi', desc: 'Analizziamo le tue esigenze' },
                { step: 2, title: 'Proposta', desc: 'Creiamo una soluzione su misura' },
                { step: 3, title: 'Implementazione', desc: 'Realizziamo la soluzione' },
                { step: 4, title: 'Supporto', desc: 'Forniamo assistenza continua' }
            ]
        };
    }

    generateHTML(page) {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title}</title>
    <meta name="description" content="${page.description}">
    
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
            "addressLocality": "Milano",
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
        <section class="hero py-20 bg-gradient-to-br from-brand-50 to-brand-100">
            <div class="container mx-auto px-6 text-center">
                <h1 class="text-4xl font-bold text-neutral-900 mb-6">${page.content.hero.title}</h1>
                <p class="text-xl text-neutral-700 mb-8">${page.content.hero.subtitle}</p>
                <a href="/it-era/contatti.html" class="btn-primary">${page.content.hero.cta}</a>
            </div>
        </section>
        
        <section class="py-16">
            <div class="container mx-auto px-6">
                <h2 class="text-3xl font-bold text-center mb-12">Perché Scegliere IT-ERA</h2>
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    ${page.content.benefits.map(benefit => `
                        <div class="text-center p-6 bg-white rounded-xl shadow-sm">
                            <div class="w-12 h-12 bg-brand-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                                <span class="text-brand-600 text-xl">✓</span>
                            </div>
                            <p class="text-neutral-700">${benefit}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
    </main>
    
    <!-- Footer -->
    <footer class="bg-neutral-900 text-white py-12">
        <div class="container mx-auto px-6 text-center">
            <p>&copy; 2025 IT-ERA. Tutti i diritti riservati.</p>
        </div>
    </footer>
</body>
</html>`;
    }
}

/**
 * Agente Deploy semplificato
 */
class SimpleDeployAgent {
    constructor() {
        this.name = 'Deploy Agent';
        console.log(`🚀 ${this.name} initialized`);
    }

    async optimizeBuild() {
        console.log('🔧 Optimizing build...');
        
        // Genera sitemap
        await this.generateSitemap();
        
        return { optimized: true };
    }

    async generateSitemap() {
        console.log('🗺️ Generating sitemap...');
        
        const siteUrl = 'https://userx87.github.io/it-era/';
        const pages = this.discoverPages();
        const sitemap = this.createSitemapXML(pages, siteUrl);
        
        fs.writeFileSync(path.join('_site', 'sitemap.xml'), sitemap);
        console.log('  ✅ Sitemap generated');
    }

    discoverPages() {
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
                        priority: url === '' ? '1.0' : '0.8'
                    });
                }
            });
        };
        
        scanDirectory(siteDir);
        return pages;
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

    async deployToGitHub() {
        console.log('🚀 Deploying to GitHub Pages...');
        
        try {
            // Verifica modifiche
            const { stdout: status } = await execAsync('git status --porcelain');
            
            if (status.trim() === '') {
                console.log('📭 No changes to deploy');
                return { deployed: false, reason: 'No changes' };
            }

            // Deploy
            await execAsync('git add .');
            await execAsync(`git commit -m "🚀 Swarm deployment - ${new Date().toISOString()}"`);
            await execAsync('git push origin main');
            
            console.log('  ✅ Deployed successfully');
            
            return {
                deployed: true,
                url: 'https://userx87.github.io/it-era/',
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            throw new Error(`Deploy failed: ${error.message}`);
        }
    }
}

/**
 * Coordinatore semplificato
 */
class SimpleSwarmCoordinator {
    constructor() {
        this.seoAgent = new SimpleSEOAgent();
        this.deployAgent = new SimpleDeployAgent();
        console.log('🐝 Swarm Coordinator initialized');
    }

    async implementSEOStrategy() {
        console.log('🎯 Starting SEO strategy implementation...');
        
        const results = {
            seo: null,
            build: null,
            deploy: null
        };

        try {
            // 1. Crea pagine SEO
            results.seo = await this.seoAgent.createSEOPages();
            
            // 2. Ottimizza build
            results.build = await this.deployAgent.optimizeBuild();
            
            // 3. Deploy
            results.deploy = await this.deployAgent.deployToGitHub();
            
            return results;
            
        } catch (error) {
            throw error;
        }
    }
}

/**
 * Main function
 */
async function main() {
    console.log(colors.bold(colors.blue('\n🐝 IT-ERA SWARM MULTI-AGENT SYSTEM')));
    console.log(colors.blue('=====================================\n'));
    
    const swarm = new SimpleSwarmCoordinator();
    
    try {
        const seoSpinner = spinner('🎯 Implementing complete SEO strategy...');
        
        const results = await swarm.implementSEOStrategy();
        
        seoSpinner.succeed('✅ SEO strategy implemented successfully');
        
        console.log(colors.green('\n🎉 DEPLOYMENT RESULTS:'));
        console.log(`📄 SEO Pages created: ${results.seo?.created || 0}`);
        console.log(`🔧 Build optimized: ${results.build?.optimized ? 'Yes' : 'No'}`);
        console.log(`🚀 Deployed: ${results.deploy?.deployed ? 'Yes' : 'No'}`);
        
        if (results.deploy?.deployed) {
            console.log(`🌐 Site URL: ${results.deploy.url}`);
        }
        
        console.log(colors.bold(colors.green('\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!')));
        console.log(colors.cyan('\n🌐 Your site is now live at:'));
        console.log(colors.bold(colors.cyan('  https://userx87.github.io/it-era/')));
        
    } catch (error) {
        console.error(colors.red(`\n❌ Deployment failed: ${error.message}`));
        process.exit(1);
    }
}

// Avvia il deployment
if (require.main === module) {
    main();
}

module.exports = main;
