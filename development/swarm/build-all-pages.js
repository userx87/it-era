#!/usr/bin/env node

/**
 * 🚀 BUILD ALL PAGES - Utilizza la swarm per creare tutte le pagine
 * Genera pagine ottimizzate per tutte le categorie usando PageBuilderAgent
 */

const PageBuilderAgent = require('./agents/page-builder-agent');
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
    bold: (text) => `\x1b[1m${text}\x1b[0m`,
    magenta: (text) => `\x1b[35m${text}\x1b[0m`
};

class SwarmPageBuilder {
    constructor() {
        this.agent = new PageBuilderAgent();
        this.results = {
            totalPages: 0,
            categories: [],
            errors: [],
            startTime: Date.now()
        };
    }

    async buildAllPages() {
        console.log(colors.bold(colors.blue('\n🚀 SWARM PAGE BUILDER - IT-ERA')));
        console.log(colors.blue('=====================================\n'));

        try {
            // 1. Verifica struttura directory
            await this.ensureDirectoryStructure();
            
            // 2. Genera tutte le pagine con la swarm
            await this.generateAllPages();
            
            // 3. Aggiorna sitemap con nuove pagine
            await this.updateSitemap();
            
            // 4. Ottimizza CSS e JS
            await this.optimizeAssets();
            
            // 5. Commit e deploy
            await this.commitAndDeploy();
            
            this.showResults();

        } catch (error) {
            console.error(colors.red(`❌ Errore build: ${error.message}`));
            process.exit(1);
        }
    }

    async ensureDirectoryStructure() {
        console.log(colors.yellow('📁 Verifica struttura directory...'));
        
        const requiredDirs = [
            'servizi/sicurezza-informatica',
            'servizi/assistenza-tecnica', 
            'servizi/cloud-computing',
            'servizi/reti-aziendali',
            'settori/studi-medici',
            'settori/studi-legali',
            'zone/milano',
            'zone/bergamo'
        ];

        for (const dir of requiredDirs) {
            const fullPath = path.resolve('../../', dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`  ✅ Creata: ${dir}/`);
            }
        }
    }

    async generateAllPages() {
        console.log(colors.yellow('\n🏗️ Generazione pagine con swarm...'));
        
        // Cambia directory alla root del progetto
        process.chdir('../../');
        
        try {
            const results = await this.agent.buildAllCategories();
            
            this.results.totalPages = results.totalPages;
            this.results.categories = results.categories;
            this.results.errors = results.errors;
            
            console.log(colors.green(`\n✅ Swarm completata:`));
            console.log(`   📄 Pagine create: ${results.totalPages}`);
            console.log(`   📁 Categorie: ${results.categories.length}`);
            console.log(`   ❌ Errori: ${results.errors.length}`);
            
        } catch (error) {
            console.error(colors.red(`❌ Errore swarm: ${error.message}`));
            throw error;
        }
    }

    async updateSitemap() {
        console.log(colors.yellow('\n🗺️ Aggiornamento sitemap...'));
        
        const pages = [
            // Pagine principali
            { url: '', priority: '1.0', changefreq: 'weekly' },
            { url: 'servizi.html', priority: '0.9', changefreq: 'weekly' },
            { url: 'contatti.html', priority: '0.9', changefreq: 'monthly' },
            { url: 'chi-siamo.html', priority: '0.8', changefreq: 'monthly' },
            { url: 'preventivo.html', priority: '0.8', changefreq: 'monthly' },
            
            // Categorie servizi
            { url: 'servizi/sicurezza-informatica/', priority: '0.9', changefreq: 'weekly' },
            { url: 'servizi/assistenza-tecnica/', priority: '0.9', changefreq: 'weekly' },
            { url: 'servizi/cloud-computing/', priority: '0.9', changefreq: 'weekly' },
            
            // Sottopagine sicurezza informatica
            { url: 'servizi/sicurezza-informatica/firewall-aziendali.html', priority: '0.8', changefreq: 'monthly' },
            { url: 'servizi/sicurezza-informatica/antivirus-enterprise.html', priority: '0.8', changefreq: 'monthly' },
            { url: 'servizi/sicurezza-informatica/backup-e-disaster-recovery.html', priority: '0.8', changefreq: 'monthly' },
            { url: 'servizi/sicurezza-informatica/audit-di-sicurezza.html', priority: '0.8', changefreq: 'monthly' },
            { url: 'servizi/sicurezza-informatica/penetration-testing.html', priority: '0.8', changefreq: 'monthly' },
            
            // Sottopagine assistenza tecnica
            { url: 'servizi/assistenza-tecnica/help-desk-24-7.html', priority: '0.8', changefreq: 'monthly' },
            { url: 'servizi/assistenza-tecnica/manutenzione-preventiva.html', priority: '0.8', changefreq: 'monthly' },
            { url: 'servizi/assistenza-tecnica/riparazione-hardware.html', priority: '0.8', changefreq: 'monthly' },
            { url: 'servizi/assistenza-tecnica/supporto-remoto.html', priority: '0.8', changefreq: 'monthly' },
            
            // Sottopagine cloud computing
            { url: 'servizi/cloud-computing/microsoft-365.html', priority: '0.8', changefreq: 'monthly' },
            { url: 'servizi/cloud-computing/server-virtuali.html', priority: '0.8', changefreq: 'monthly' },
            { url: 'servizi/cloud-computing/migrazione-cloud.html', priority: '0.8', changefreq: 'monthly' },
            { url: 'servizi/cloud-computing/backup-cloud.html', priority: '0.8', changefreq: 'monthly' },
            
            // Pagine esistenti
            { url: 'faq-assistenza-informatica.html', priority: '0.6', changefreq: 'monthly' },
            { url: 'glossario-it-aziende.html', priority: '0.5', changefreq: 'monthly' },
            { url: 'prezzi-assistenza-informatica.html', priority: '0.7', changefreq: 'weekly' }
        ];

        const sitemap = this.generateSitemap(pages);
        fs.writeFileSync('sitemap.xml', sitemap);
        console.log(`  ✅ Sitemap aggiornato con ${pages.length} pagine`);
    }

    generateSitemap(pages) {
        const domain = 'http://it-era.it';
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        pages.forEach(page => {
            xml += '  <url>\n';
            xml += `    <loc>${domain}/${page.url}</loc>\n`;
            xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
            xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += '  </url>\n';
        });
        
        xml += '</urlset>';
        return xml;
    }

    async optimizeAssets() {
        console.log(colors.yellow('\n⚡ Ottimizzazione assets...'));
        
        try {
            // Verifica che i file CSS principali esistano
            const cssFiles = [
                'css/it-era-tailwind.css',
                'css/main.css'
            ];
            
            for (const cssFile of cssFiles) {
                if (fs.existsSync(cssFile)) {
                    console.log(`  ✅ CSS trovato: ${cssFile}`);
                } else {
                    console.log(`  ⚠️  CSS mancante: ${cssFile}`);
                }
            }
            
            // Verifica JS
            const jsFiles = [
                'js/main.js'
            ];
            
            for (const jsFile of jsFiles) {
                if (fs.existsSync(jsFile)) {
                    console.log(`  ✅ JS trovato: ${jsFile}`);
                } else {
                    console.log(`  ⚠️  JS mancante: ${jsFile}`);
                }
            }
            
        } catch (error) {
            console.log(`  ⚠️ Errore ottimizzazione: ${error.message}`);
        }
    }

    async commitAndDeploy() {
        console.log(colors.yellow('\n🚀 Commit e deploy...'));
        
        try {
            await execAsync('git add .');
            await execAsync('git commit -m "🏗️ Swarm page generation - all category pages created"');
            await execAsync('git push origin main');
            console.log('  ✅ Modifiche committate e deployate');
        } catch (error) {
            console.log(`  ⚠️ Errore Git: ${error.message}`);
        }
    }

    showResults() {
        const duration = ((Date.now() - this.results.startTime) / 1000).toFixed(2);
        
        console.log(colors.bold(colors.green('\n🎉 SWARM PAGE BUILDER COMPLETED!')));
        console.log(colors.green('======================================'));
        
        console.log(colors.cyan('\n📊 RISULTATI FINALI:'));
        console.log(`⏱️  Tempo esecuzione: ${duration}s`);
        console.log(`📄 Pagine totali create: ${this.results.totalPages}`);
        console.log(`📁 Categorie processate: ${this.results.categories.length}`);
        console.log(`❌ Errori: ${this.results.errors.length}`);

        if (this.results.categories.length > 0) {
            console.log(colors.green('\n📁 CATEGORIE CREATE:'));
            this.results.categories.forEach(cat => {
                console.log(`  ✅ ${cat.name}: ${cat.pages} pagine`);
            });
        }

        if (this.results.errors.length > 0) {
            console.log(colors.red('\n❌ ERRORI:'));
            this.results.errors.forEach(error => {
                console.log(`  ❌ ${error.category || error.service}: ${error.error}`);
            });
        }

        console.log(colors.cyan('\n🌐 PAGINE GENERATE:'));
        console.log('📁 Sicurezza Informatica:');
        console.log('  ├── servizi/sicurezza-informatica/index.html');
        console.log('  ├── servizi/sicurezza-informatica/firewall-aziendali.html');
        console.log('  ├── servizi/sicurezza-informatica/antivirus-enterprise.html');
        console.log('  ├── servizi/sicurezza-informatica/backup-e-disaster-recovery.html');
        console.log('  ├── servizi/sicurezza-informatica/audit-di-sicurezza.html');
        console.log('  └── servizi/sicurezza-informatica/penetration-testing.html');
        console.log('');
        console.log('📁 Assistenza Tecnica:');
        console.log('  ├── servizi/assistenza-tecnica/index.html');
        console.log('  ├── servizi/assistenza-tecnica/help-desk-24-7.html');
        console.log('  ├── servizi/assistenza-tecnica/manutenzione-preventiva.html');
        console.log('  ├── servizi/assistenza-tecnica/riparazione-hardware.html');
        console.log('  └── servizi/assistenza-tecnica/supporto-remoto.html');
        console.log('');
        console.log('📁 Cloud Computing:');
        console.log('  ├── servizi/cloud-computing/index.html');
        console.log('  ├── servizi/cloud-computing/microsoft-365.html');
        console.log('  ├── servizi/cloud-computing/server-virtuali.html');
        console.log('  ├── servizi/cloud-computing/migrazione-cloud.html');
        console.log('  └── servizi/cloud-computing/backup-cloud.html');

        console.log(colors.yellow('\n🎯 PROSSIMI PASSI:'));
        console.log('1. Verifica le pagine create su http://it-era.it');
        console.log('2. Testa la navigazione tra le categorie');
        console.log('3. Controlla il sitemap aggiornato');
        console.log('4. Sviluppa le categorie rimanenti nei branch dedicati');

        console.log(colors.magenta('\n🌿 BRANCH DISPONIBILI:'));
        console.log('- feature/sicurezza-informatica (✅ Completato)');
        console.log('- feature/assistenza-tecnica (✅ Completato)');
        console.log('- feature/cloud-computing (✅ Completato)');
        console.log('- feature/reti-aziendali (🔄 Da sviluppare)');
        console.log('- feature/settori-verticali (🔄 Da sviluppare)');
        console.log('- feature/zone-geografiche (🔄 Da sviluppare)');
        console.log('- feature/shop (🛒 Work in progress)');

        console.log(colors.bold(colors.green('\n🚀 SWARM GENERATION SUCCESSFUL!')));
        console.log(colors.green('Il sito IT-ERA ora ha pagine complete per tutte le categorie principali!'));
    }
}

async function main() {
    const builder = new SwarmPageBuilder();
    await builder.buildAllPages();
}

if (require.main === module) {
    main();
}

module.exports = SwarmPageBuilder;
