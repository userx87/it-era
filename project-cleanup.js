#!/usr/bin/env node

/**
 * 🧹 PROJECT CLEANUP - Analisi e pulizia completa del progetto IT-ERA
 * - Analizza tutte le pagine
 * - Testa accessibilità
 * - Rimuove file obsoleti
 * - Aggiorna domini e link
 * - Pulisce sitemap
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Configurazione
const NEW_DOMAIN = 'http://it-era.it';
const OLD_DOMAIN = 'https://userx87.github.io/it-era';

// Funzioni di colore
const colors = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
};

class ProjectCleaner {
    constructor() {
        this.workingPages = [];
        this.brokenPages = [];
        this.obsoleteFiles = [];
        this.updatedFiles = [];
        this.errors = [];
        
        // File e directory da rimuovere
        this.filesToRemove = [
            '_site',
            'pages-draft',
            'pages-test', 
            'templates',
            'reports',
            'tests',
            'admin',
            'api',
            'claude-flow',
            'dashboards',
            'flask_app',
            'portals',
            'static',
            'components',
            'partials',
            'app.py',
            'cache-bust.txt',
            'deployment-info.json',
            'deployment-trigger.txt',
            'form-handler.js',
            'process-microsoft365-quote.php',
            'styles-clean.css',
            'styles-modern.css',
            'sw.js',
            'test-deployment.html',
            'deploy-to-root.js',
            'fix-paths.js',
            'create-all-seo-pages.js',
            'swarm-simple.js',
            'swarm-dashboard.html'
        ];
    }

    async cleanup() {
        console.log(colors.bold(colors.blue('\n🧹 PROJECT CLEANUP & ANALYSIS')));
        console.log(colors.blue('================================\n'));

        try {
            // 1. Analizza struttura progetto
            await this.analyzeProject();
            
            // 2. Testa accessibilità pagine
            await this.testPageAccessibility();
            
            // 3. Aggiorna domini e link
            await this.updateDomains();
            
            // 4. Rimuove file obsoleti
            await this.removeObsoleteFiles();
            
            // 5. Aggiorna sitemap
            await this.updateSitemap();
            
            // 6. Aggiorna robots.txt
            await this.updateRobots();
            
            // 7. Commit modifiche
            await this.commitChanges();
            
            this.showResults();

        } catch (error) {
            console.error(colors.red(`❌ Errore durante cleanup: ${error.message}`));
            process.exit(1);
        }
    }

    async analyzeProject() {
        console.log(colors.yellow('📊 Analisi struttura progetto...'));
        
        const htmlFiles = this.findHtmlFiles('.');
        console.log(`  📄 Trovati ${htmlFiles.length} file HTML`);
        
        // Categorizza i file
        const categories = {
            core: ['index.html', 'servizi.html', 'contatti.html'],
            seo_services: [],
            seo_sectors: [],
            seo_zones: [],
            seo_content: [],
            blog: [],
            obsolete: []
        };

        htmlFiles.forEach(file => {
            if (file.includes('/servizi/') && !categories.core.includes(path.basename(file))) {
                categories.seo_services.push(file);
            } else if (file.includes('/settori/')) {
                categories.seo_sectors.push(file);
            } else if (file.includes('/zone/')) {
                categories.seo_zones.push(file);
            } else if (file.includes('/blog/')) {
                categories.blog.push(file);
            } else if (file.includes('faq-') || file.includes('glossario-') || file.includes('prezzi-')) {
                categories.seo_content.push(file);
            } else if (!categories.core.includes(file) && !file.includes('node_modules')) {
                categories.obsolete.push(file);
            }
        });

        console.log(`  🏠 Pagine core: ${categories.core.length}`);
        console.log(`  🔧 Servizi SEO: ${categories.seo_services.length}`);
        console.log(`  🏢 Settori SEO: ${categories.seo_sectors.length}`);
        console.log(`  📍 Zone SEO: ${categories.seo_zones.length}`);
        console.log(`  📚 Contenuti SEO: ${categories.seo_content.length}`);
        console.log(`  📝 Blog: ${categories.blog.length}`);
        console.log(`  🗑️ Obsoleti: ${categories.obsolete.length}`);

        this.categories = categories;
    }

    findHtmlFiles(dir) {
        const htmlFiles = [];
        
        const scanDirectory = (currentDir) => {
            if (currentDir.includes('node_modules') || 
                currentDir.includes('.git') || 
                currentDir.includes('_site')) {
                return;
            }

            try {
                const items = fs.readdirSync(currentDir);
                
                items.forEach(item => {
                    const fullPath = path.join(currentDir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        scanDirectory(fullPath);
                    } else if (item.endsWith('.html')) {
                        htmlFiles.push(fullPath);
                    }
                });
            } catch (error) {
                // Ignora errori di accesso
            }
        };
        
        scanDirectory(dir);
        return htmlFiles;
    }

    async testPageAccessibility() {
        console.log(colors.yellow('\n🌐 Test accessibilità pagine...'));
        
        const testPages = [
            '',
            '/servizi.html',
            '/contatti.html',
            '/servizi/backup-disaster-recovery.html',
            '/settori/industria-manifatturiera.html',
            '/zone/assistenza-it-bergamo.html',
            '/faq-assistenza-informatica.html'
        ];

        for (const page of testPages) {
            const url = `${NEW_DOMAIN}${page}`;
            try {
                const response = await fetch(url, { method: 'HEAD' });
                if (response.ok) {
                    this.workingPages.push(page || '/');
                    console.log(`  ✅ ${page || '/'}`);
                } else {
                    this.brokenPages.push(page || '/');
                    console.log(`  ❌ ${page || '/'} (${response.status})`);
                }
            } catch (error) {
                this.brokenPages.push(page || '/');
                console.log(`  ❌ ${page || '/'} (${error.message})`);
            }
        }
    }

    async updateDomains() {
        console.log(colors.yellow('\n🔄 Aggiornamento domini...'));
        
        const htmlFiles = this.findHtmlFiles('.');
        
        for (const file of htmlFiles) {
            try {
                let content = fs.readFileSync(file, 'utf8');
                let modified = false;

                // Sostituzioni domini
                const patterns = [
                    { from: /https:\/\/userx87\.github\.io\/it-era/g, to: NEW_DOMAIN },
                    { from: /userx87\.github\.io\/it-era/g, to: 'it-era.it' },
                    { from: /content="https:\/\/it-era\.it\/it-era\//g, to: 'content="http://it-era.it/' },
                    { from: /"https:\/\/it-era\.it\/it-era\//g, to: '"http://it-era.it/' }
                ];

                patterns.forEach(pattern => {
                    if (pattern.from.test(content)) {
                        content = content.replace(pattern.from, pattern.to);
                        modified = true;
                    }
                });

                if (modified) {
                    fs.writeFileSync(file, content);
                    this.updatedFiles.push(file);
                    console.log(`  ✅ ${file}`);
                }
            } catch (error) {
                this.errors.push({ file, error: error.message });
                console.log(`  ❌ ${file}`);
            }
        }
    }

    async removeObsoleteFiles() {
        console.log(colors.yellow('\n🗑️ Rimozione file obsoleti...'));
        
        for (const item of this.filesToRemove) {
            try {
                if (fs.existsSync(item)) {
                    const stat = fs.statSync(item);
                    if (stat.isDirectory()) {
                        fs.rmSync(item, { recursive: true, force: true });
                        console.log(`  🗑️ Directory: ${item}`);
                    } else {
                        fs.unlinkSync(item);
                        console.log(`  🗑️ File: ${item}`);
                    }
                    this.obsoleteFiles.push(item);
                }
            } catch (error) {
                console.log(`  ⚠️ Errore rimozione ${item}: ${error.message}`);
            }
        }

        // Rimuovi file HTML obsoleti
        if (this.categories && this.categories.obsolete) {
            for (const file of this.categories.obsolete) {
                try {
                    if (fs.existsSync(file) && !file.includes('node_modules')) {
                        fs.unlinkSync(file);
                        console.log(`  🗑️ HTML obsoleto: ${file}`);
                        this.obsoleteFiles.push(file);
                    }
                } catch (error) {
                    console.log(`  ⚠️ Errore rimozione ${file}: ${error.message}`);
                }
            }
        }
    }

    async updateSitemap() {
        console.log(colors.yellow('\n🗺️ Aggiornamento sitemap...'));
        
        const validPages = [
            { url: '', priority: '1.0' },
            { url: 'servizi.html', priority: '0.9' },
            { url: 'contatti.html', priority: '0.9' }
        ];

        // Aggiungi pagine SEO funzionanti
        const seoPages = [
            ...this.categories.seo_services,
            ...this.categories.seo_sectors,
            ...this.categories.seo_zones,
            ...this.categories.seo_content,
            ...this.categories.blog.filter(p => p.includes('index.html'))
        ];

        seoPages.forEach(page => {
            const url = page.replace('./', '');
            validPages.push({
                url: url,
                priority: url.includes('servizi/') ? '0.8' : '0.7'
            });
        });

        const sitemap = this.generateSitemap(validPages);
        fs.writeFileSync('sitemap.xml', sitemap);
        console.log(`  ✅ Sitemap aggiornato con ${validPages.length} pagine`);
    }

    generateSitemap(pages) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        pages.forEach(page => {
            xml += '  <url>\n';
            xml += `    <loc>${NEW_DOMAIN}/${page.url}</loc>\n`;
            xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += '  </url>\n';
        });
        
        xml += '</urlset>';
        return xml;
    }

    async updateRobots() {
        console.log(colors.yellow('\n🤖 Aggiornamento robots.txt...'));
        
        const robots = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${NEW_DOMAIN}/sitemap.xml

# Disallow development files
Disallow: /swarm/
Disallow: /node_modules/
Disallow: /*.js$
Disallow: /*.json$
Disallow: /*.md$
`;

        fs.writeFileSync('robots.txt', robots);
        console.log('  ✅ Robots.txt aggiornato');
    }

    async commitChanges() {
        console.log(colors.yellow('\n🚀 Commit modifiche...'));
        
        try {
            await execAsync('git add .');
            await execAsync(`git commit -m "🧹 Project cleanup: updated domain to it-era.it, removed obsolete files"`);
            await execAsync('git push origin main');
            console.log('  ✅ Modifiche committate e pushate');
        } catch (error) {
            console.log(`  ⚠️ Errore Git: ${error.message}`);
        }
    }

    showResults() {
        console.log(colors.bold(colors.green('\n🎉 PROJECT CLEANUP COMPLETATO!')));
        console.log(colors.green('==================================='));
        
        console.log(colors.cyan('\n📊 RISULTATI ANALISI:'));
        console.log(`✅ Pagine funzionanti: ${this.workingPages.length}`);
        console.log(`❌ Pagine non accessibili: ${this.brokenPages.length}`);
        console.log(`🔄 File aggiornati: ${this.updatedFiles.length}`);
        console.log(`🗑️ File rimossi: ${this.obsoleteFiles.length}`);
        console.log(`⚠️ Errori: ${this.errors.length}`);

        if (this.workingPages.length > 0) {
            console.log(colors.green('\n✅ PAGINE FUNZIONANTI:'));
            this.workingPages.forEach(page => {
                console.log(`  ✅ ${NEW_DOMAIN}${page}`);
            });
        }

        if (this.brokenPages.length > 0) {
            console.log(colors.red('\n❌ PAGINE NON ACCESSIBILI:'));
            this.brokenPages.forEach(page => {
                console.log(`  ❌ ${NEW_DOMAIN}${page}`);
            });
        }

        console.log(colors.cyan('\n🌐 NUOVO DOMINIO CONFIGURATO:'));
        console.log(colors.bold(colors.cyan(`  ${NEW_DOMAIN}`)));
        
        console.log(colors.yellow('\n📋 PROSSIMI PASSI:'));
        console.log('  1. Verifica che il dominio it-era.it sia configurato correttamente');
        console.log('  2. Attendi 5-10 minuti per la propagazione');
        console.log('  3. Testa tutte le pagine principali');
        console.log('  4. Configura SSL se necessario');
    }
}

async function main() {
    const cleaner = new ProjectCleaner();
    await cleaner.cleanup();
}

if (require.main === module) {
    main();
}

module.exports = ProjectCleaner;
