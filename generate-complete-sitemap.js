#!/usr/bin/env node

/**
 * IT-ERA Complete Sitemap Generator
 * Genera una sitemap completa includendo TUTTE le pagine HTML esistenti
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ITERACompleteSitemapGenerator {
    constructor() {
        this.baseUrl = 'https://it-era.it';
        this.currentDate = new Date().toISOString().split('T')[0];
        this.sitemapEntries = [];
        
        // Configurazione priorità per tipo di pagina
        this.priorityConfig = {
            // Pagine principali
            '/': 1.0,
            '/index.html': 1.0,
            '/servizi.html': 0.9,
            '/contatti.html': 0.8,
            
            // Landing pages - alta priorità
            '/landing/': 0.9,
            
            // Settori - alta priorità
            '/settori/': 0.8,
            
            // Servizi IT - priorità basata su provincia
            '/servizi-it/': {
                'milano': 0.95,
                'bergamo': 0.90,
                'brescia': 0.90,
                'como': 0.88,
                'varese': 0.88,
                'monza-brianza': 0.88,
                'pavia': 0.85,
                'cremona': 0.82,
                'mantova': 0.82,
                'lecco': 0.80,
                'lodi': 0.80,
                'sondrio': 0.80
            },
            
            // Servizi generali
            '/servizi/': 0.75,
            
            // Blog
            '/blog/': 0.70,
            
            // Admin e utility
            '/admin/': 0.5,
            '/api/': 0.3,
            '/test-': 0.1,
            '/development/': 0.1,
            
            // Default
            'default': 0.6
        };
        
        // Configurazione change frequency
        this.changeFreqConfig = {
            '/': 'weekly',
            '/servizi.html': 'weekly',
            '/contatti.html': 'monthly',
            '/landing/': 'weekly',
            '/settori/': 'weekly',
            '/servizi-it/': 'weekly',
            '/servizi/': 'monthly',
            '/blog/': 'weekly',
            '/admin/': 'daily',
            'default': 'monthly'
        };
    }
    
    // Trova tutte le pagine HTML
    findAllHtmlPages() {
        console.log('🔍 Scanning for all HTML pages...');
        
        try {
            // Usa find per trovare tutti i file HTML, escludendo cartelle non necessarie
            const findCommand = `find . -name "*.html" \\
                -not -path "./node_modules/*" \\
                -not -path "./.git/*" \\
                -not -path "./swarm/*" \\
                -not -path "./development/templates/*" \\
                -not -path "./components/*" \\
                | sort`;
            
            const output = execSync(findCommand, { encoding: 'utf8' });
            const files = output.trim().split('\n').filter(file => file.length > 0);
            
            console.log(`  📄 Found ${files.length} HTML pages`);
            
            return files;
        } catch (error) {
            console.error('Error finding HTML pages:', error);
            return [];
        }
    }
    
    // Calcola priorità per una pagina
    calculatePriority(filePath) {
        const urlPath = filePath.replace('./', '/').replace('/index.html', '/');

        // Priorità specifiche per pagine principali
        if (urlPath === '/' || urlPath === '/index.html') return 1.0;
        if (urlPath === '/servizi.html') return 0.9;
        if (urlPath === '/contatti.html') return 0.8;
        if (urlPath === '/chi-siamo.html') return 0.7;

        // Landing pages - alta priorità
        if (urlPath.startsWith('/landing/')) return 0.9;

        // Settori - alta priorità
        if (urlPath.startsWith('/settori/')) return 0.8;

        // Servizi IT - priorità basata su provincia e tipo
        if (urlPath.startsWith('/servizi-it/')) {
            let basePriority = 0.75;

            // Priorità per provincia
            const provinces = this.priorityConfig['/servizi-it/'];
            for (const [province, provincePriority] of Object.entries(provinces)) {
                if (urlPath.includes(`-${province}.html`)) {
                    basePriority = provincePriority;
                    break;
                }
            }

            // Bonus per tipi di servizio critici
            if (urlPath.includes('computer-non-si-accende') ||
                urlPath.includes('schermo-nero') ||
                urlPath.includes('hard-disk-non-funziona')) {
                basePriority = Math.min(0.95, basePriority + 0.05);
            }

            // Bonus per servizi business
            else if (urlPath.includes('assistenza-informatica-ufficio') ||
                     urlPath.includes('backup-automatico') ||
                     urlPath.includes('configurazione-rete')) {
                basePriority = Math.min(0.93, basePriority + 0.03);
            }

            // Bonus per servizi popolari
            else if (urlPath.includes('riparazione-computer') ||
                     urlPath.includes('wifi-non-funziona') ||
                     urlPath.includes('assistenza-server')) {
                basePriority = Math.min(0.90, basePriority + 0.02);
            }

            return basePriority;
        }

        // Servizi generali
        if (urlPath.startsWith('/servizi/')) return 0.75;

        // Blog
        if (urlPath.startsWith('/blog/')) return 0.70;

        // Contatti
        if (urlPath.includes('contatti')) return 0.8;

        // Admin e utility
        if (urlPath.startsWith('/admin/')) return 0.5;
        if (urlPath.startsWith('/api/')) return 0.3;
        if (urlPath.includes('test-') || urlPath.includes('development')) return 0.1;
        if (urlPath.includes('404.html')) return 0.2;

        // Default
        return 0.6;
    }
    
    // Calcola change frequency per una pagina
    calculateChangeFreq(filePath) {
        const urlPath = filePath.replace('./', '/').replace('/index.html', '/');
        
        // Controlla configurazioni specifiche
        for (const [pattern, freq] of Object.entries(this.changeFreqConfig)) {
            if (urlPath === pattern || (pattern !== 'default' && urlPath.startsWith(pattern))) {
                return freq;
            }
        }
        
        return this.changeFreqConfig.default;
    }
    
    // Determina il tipo di pagina
    getPageType(filePath) {
        const urlPath = filePath.replace('./', '/');
        
        if (urlPath === '/index.html' || urlPath === '/') return 'homepage';
        if (urlPath.startsWith('/landing/')) return 'landing';
        if (urlPath.startsWith('/settori/')) return 'sector';
        if (urlPath.startsWith('/servizi-it/')) return 'service-it';
        if (urlPath.startsWith('/servizi/')) return 'service';
        if (urlPath.startsWith('/blog/')) return 'blog';
        if (urlPath.startsWith('/admin/')) return 'admin';
        if (urlPath.includes('contatti')) return 'contact';
        if (urlPath.includes('test-') || urlPath.includes('development')) return 'test';
        
        return 'page';
    }
    
    // Processa tutte le pagine
    processAllPages() {
        const htmlFiles = this.findAllHtmlPages();
        
        console.log('📊 Processing pages by category...');
        
        const categories = {};
        
        htmlFiles.forEach(file => {
            // Converti path del file in URL
            let url = file.replace('./', '');
            if (url === 'index.html') {
                url = '';
            }
            
            const fullUrl = url ? `${this.baseUrl}/${url}` : this.baseUrl;
            const priority = this.calculatePriority(file);
            const changefreq = this.calculateChangeFreq(file);
            const pageType = this.getPageType(file);
            
            // Raggruppa per categoria per statistiche
            if (!categories[pageType]) {
                categories[pageType] = 0;
            }
            categories[pageType]++;
            
            this.sitemapEntries.push({
                url: fullUrl,
                lastmod: this.currentDate,
                changefreq: changefreq,
                priority: priority.toFixed(2),
                type: pageType,
                file: file
            });
        });
        
        // Mostra statistiche
        console.log('  📋 Pages by category:');
        Object.entries(categories)
            .sort(([,a], [,b]) => b - a)
            .forEach(([type, count]) => {
                console.log(`    ${type}: ${count} pages`);
            });
        
        console.log(`  ✅ Total pages processed: ${this.sitemapEntries.length}`);
    }
    
    // Genera XML sitemap
    generateXML() {
        console.log('📝 Generating XML sitemap...');
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

`;

        // Ordina per priorità (alta -> bassa) e poi alfabeticamente
        this.sitemapEntries.sort((a, b) => {
            if (b.priority !== a.priority) {
                return parseFloat(b.priority) - parseFloat(a.priority);
            }
            return a.url.localeCompare(b.url);
        });
        
        // Raggruppa per tipo per organizzazione
        const groupedEntries = {};
        this.sitemapEntries.forEach(entry => {
            if (!groupedEntries[entry.type]) {
                groupedEntries[entry.type] = [];
            }
            groupedEntries[entry.type].push(entry);
        });
        
        // Ordine di visualizzazione dei gruppi
        const groupOrder = [
            'homepage', 'contact', 'landing', 'sector', 
            'service-it', 'service', 'blog', 'page', 'admin', 'test'
        ];
        
        groupOrder.forEach(groupType => {
            if (groupedEntries[groupType]) {
                const groupName = {
                    'homepage': 'Homepage',
                    'contact': 'Contact Pages',
                    'landing': 'Landing Pages',
                    'sector': 'Sector Pages',
                    'service-it': 'IT Services',
                    'service': 'General Services',
                    'blog': 'Blog Pages',
                    'page': 'Static Pages',
                    'admin': 'Admin Pages',
                    'test': 'Test Pages'
                }[groupType] || groupType;
                
                xml += `    <!-- ${groupName} -->\n`;
                
                groupedEntries[groupType].forEach(entry => {
                    xml += `    <url>
        <loc>${entry.url}</loc>
        <lastmod>${entry.lastmod}</lastmod>
        <changefreq>${entry.changefreq}</changefreq>
        <priority>${entry.priority}</priority>
    </url>
`;
                });
                xml += '\n';
            }
        });
        
        xml += '</urlset>';
        
        return xml;
    }
    
    // Mostra statistiche finali
    showStatistics() {
        console.log('\n📊 Complete Sitemap Statistics:');
        console.log(`✅ Total URLs: ${this.sitemapEntries.length}`);
        
        // Statistiche per priorità
        const priorityStats = {};
        this.sitemapEntries.forEach(entry => {
            const priority = parseFloat(entry.priority);
            let range;
            if (priority >= 0.9) range = 'Critical (0.9+)';
            else if (priority >= 0.8) range = 'High (0.8-0.89)';
            else if (priority >= 0.7) range = 'Medium (0.7-0.79)';
            else if (priority >= 0.5) range = 'Normal (0.5-0.69)';
            else range = 'Low (<0.5)';
            
            priorityStats[range] = (priorityStats[range] || 0) + 1;
        });
        
        console.log('\n📈 Priority Distribution:');
        Object.entries(priorityStats)
            .sort(([,a], [,b]) => b - a)
            .forEach(([range, count]) => {
                console.log(`  ${range}: ${count} pages`);
            });
        
        // Top priority pages
        console.log('\n🎯 Top Priority Pages:');
        this.sitemapEntries
            .filter(entry => parseFloat(entry.priority) >= 0.9)
            .slice(0, 10)
            .forEach(entry => {
                console.log(`  ${entry.priority} - ${entry.url}`);
            });
    }
    
    // Genera sitemap completa
    generateCompleteSitemap() {
        console.log('🗺️ IT-ERA Complete Sitemap Generator\n');
        
        // Processa tutte le pagine
        this.processAllPages();
        
        // Genera XML
        const xml = this.generateXML();
        
        // Salva sitemap
        fs.writeFileSync('sitemap.xml', xml, 'utf8');
        
        // Mostra statistiche
        this.showStatistics();
        
        console.log('\n🎉 Complete sitemap generated successfully: sitemap.xml');
        console.log('💡 Next steps:');
        console.log('1. Submit to Google Search Console');
        console.log('2. Add to robots.txt');
        console.log('3. Monitor indexing status');
        console.log('4. Track ranking improvements');
        
        return xml;
    }
}

// Esegui se chiamato direttamente
if (require.main === module) {
    const generator = new ITERACompleteSitemapGenerator();
    generator.generateCompleteSitemap();
}

module.exports = ITERACompleteSitemapGenerator;
