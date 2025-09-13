#!/usr/bin/env node

/**
 * IT-ERA Sitemap Generator
 * Genera automaticamente sitemap.xml completa con tutte le pagine
 */

const fs = require('fs');
const path = require('path');

class ITERASitemapGenerator {
    constructor() {
        this.baseUrl = 'https://it-era.it';
        this.currentDate = new Date().toISOString().split('T')[0];
        
        // Static pages with priorities
        this.staticPages = [
            { url: '/', priority: 1.0, changefreq: 'weekly' },
            { url: '/servizi.html', priority: 0.9, changefreq: 'weekly' },
            { url: '/contatti.html', priority: 0.8, changefreq: 'monthly' },
            { url: '/chi-siamo.html', priority: 0.7, changefreq: 'monthly' },
            { url: '/admin/followup-dashboard.html', priority: 0.5, changefreq: 'daily' }
        ];
        
        // Sector pages
        this.sectorPages = [
            'pmi-startup', 'commercialisti', 'studi-legali', 
            'studi-medici', 'industria-40', 'retail-gdo'
        ];
        
        // Landing pages
        this.landingPages = [
            'sicurezza-informatica', 'assistenza-emergenza', 'cloud-migration',
            'digitalizzazione-pmi', 'software-commercialisti'
        ];
        
        // Provinces with population for priority calculation
        this.provinces = [
            { name: 'Milano', code: 'milano', population: 3200000, priority: 0.95 },
            { name: 'Bergamo', code: 'bergamo', population: 1100000, priority: 0.9 },
            { name: 'Brescia', code: 'brescia', population: 1200000, priority: 0.9 },
            { name: 'Como', code: 'como', population: 600000, priority: 0.85 },
            { name: 'Varese', code: 'varese', population: 900000, priority: 0.85 },
            { name: 'Monza e Brianza', code: 'monza-brianza', population: 870000, priority: 0.85 },
            { name: 'Pavia', code: 'pavia', population: 550000, priority: 0.8 },
            { name: 'Cremona', code: 'cremona', population: 360000, priority: 0.75 },
            { name: 'Mantova', code: 'mantova', population: 410000, priority: 0.75 },
            { name: 'Lecco', code: 'lecco', population: 340000, priority: 0.7 },
            { name: 'Lodi', code: 'lodi', population: 230000, priority: 0.7 },
            { name: 'Sondrio', code: 'sondrio', population: 180000, priority: 0.7 }
        ];
        
        // Service pages with search volume and priority
        this.servicePages = [
            // B2C Problem-Specific (High Priority)
            { 
                slug: 'computer-non-si-accende', 
                name: 'Computer Non Si Accende',
                searchVolume: 200,
                priority: 0.95,
                type: 'emergency'
            },
            { 
                slug: 'wifi-non-funziona-computer', 
                name: 'WiFi Non Funziona Computer',
                searchVolume: 250,
                priority: 0.9,
                type: 'urgent'
            },
            { 
                slug: 'computer-si-spegne-da-solo', 
                name: 'Computer Si Spegne Da Solo',
                searchVolume: 180,
                priority: 0.9,
                type: 'urgent'
            },
            { 
                slug: 'schermo-nero-computer', 
                name: 'Schermo Nero Computer',
                searchVolume: 150,
                priority: 0.85,
                type: 'urgent'
            },
            { 
                slug: 'hard-disk-non-funziona', 
                name: 'Hard Disk Non Funziona',
                searchVolume: 120,
                priority: 0.85,
                type: 'urgent'
            },
            
            // B2B Business Services (High Priority)
            { 
                slug: 'assistenza-informatica-ufficio', 
                name: 'Assistenza Informatica Ufficio',
                searchVolume: 300,
                priority: 0.9,
                type: 'business'
            },
            { 
                slug: 'configurazione-rete-ufficio', 
                name: 'Configurazione Rete Ufficio',
                searchVolume: 200,
                priority: 0.85,
                type: 'business'
            },
            { 
                slug: 'backup-automatico-azienda', 
                name: 'Backup Automatico Azienda',
                searchVolume: 150,
                priority: 0.8,
                type: 'business'
            },
            
            // Standard Services (Medium Priority)
            { 
                slug: 'riparazione-computer', 
                name: 'Riparazione Computer',
                searchVolume: 400,
                priority: 0.8,
                type: 'standard'
            },
            { 
                slug: 'assistenza-server', 
                name: 'Assistenza Server',
                searchVolume: 200,
                priority: 0.75,
                type: 'standard'
            }
        ];
        
        this.sitemapEntries = [];
    }
    
    generateSitemap() {
        console.log('🗺️ IT-ERA Sitemap Generator\n');
        
        // Add static pages
        this.addStaticPages();
        
        // Add sector pages
        this.addSectorPages();
        
        // Add landing pages
        this.addLandingPages();
        
        // Add service pages for all provinces
        this.addServicePages();
        
        // Generate XML
        const xml = this.generateXML();
        
        // Save sitemap
        fs.writeFileSync('sitemap.xml', xml, 'utf8');
        
        // Show summary
        this.showSummary();
        
        return xml;
    }
    
    addStaticPages() {
        console.log('📄 Adding static pages...');
        
        this.staticPages.forEach(page => {
            this.sitemapEntries.push({
                url: this.baseUrl + page.url,
                lastmod: this.currentDate,
                changefreq: page.changefreq,
                priority: page.priority,
                type: 'static'
            });
        });
        
        console.log(`  ✅ Added ${this.staticPages.length} static pages`);
    }
    
    addSectorPages() {
        console.log('🏢 Adding sector pages...');
        
        this.sectorPages.forEach(sector => {
            this.sitemapEntries.push({
                url: `${this.baseUrl}/settori/${sector}.html`,
                lastmod: this.currentDate,
                changefreq: 'weekly',
                priority: 0.8,
                type: 'sector'
            });
        });
        
        console.log(`  ✅ Added ${this.sectorPages.length} sector pages`);
    }
    
    addLandingPages() {
        console.log('🎯 Adding landing pages...');
        
        this.landingPages.forEach(landing => {
            this.sitemapEntries.push({
                url: `${this.baseUrl}/landing/${landing}.html`,
                lastmod: this.currentDate,
                changefreq: 'weekly',
                priority: 0.9,
                type: 'landing'
            });
        });
        
        console.log(`  ✅ Added ${this.landingPages.length} landing pages`);
    }
    
    addServicePages() {
        console.log('🔧 Adding service pages for all provinces...');
        
        let totalServicePages = 0;
        
        this.servicePages.forEach(service => {
            console.log(`  📋 ${service.name} (${service.searchVolume}+ searches/month)`);
            
            this.provinces.forEach(province => {
                // Calculate priority based on service priority and province population
                const basePriority = service.priority;
                const provincePriority = province.priority;
                const finalPriority = Math.min(0.95, (basePriority + provincePriority) / 2);
                
                this.sitemapEntries.push({
                    url: `${this.baseUrl}/servizi-it/${service.slug}-${province.code}.html`,
                    lastmod: this.currentDate,
                    changefreq: 'weekly',
                    priority: finalPriority,
                    type: service.type,
                    service: service.name,
                    province: province.name,
                    searchVolume: service.searchVolume
                });
                
                totalServicePages++;
            });
            
            console.log(`    ✅ ${this.provinces.length} pages for ${service.name}`);
        });
        
        console.log(`  🎉 Total service pages: ${totalServicePages}`);
    }
    
    generateXML() {
        console.log('\n📝 Generating XML sitemap...');
        
        // Sort entries by priority (highest first)
        this.sitemapEntries.sort((a, b) => b.priority - a.priority);
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

`;
        
        // Group entries by type for better organization
        const groupedEntries = this.groupEntriesByType();
        
        // Add entries in order of importance
        const typeOrder = ['static', 'landing', 'sector', 'emergency', 'urgent', 'business', 'standard'];
        
        typeOrder.forEach(type => {
            if (groupedEntries[type] && groupedEntries[type].length > 0) {
                xml += `    <!-- ${this.getTypeComment(type)} -->\n`;
                
                groupedEntries[type].forEach(entry => {
                    xml += `    <url>
        <loc>${entry.url}</loc>
        <lastmod>${entry.lastmod}</lastmod>
        <changefreq>${entry.changefreq}</changefreq>
        <priority>${entry.priority.toFixed(2)}</priority>
    </url>
`;
                });
                xml += '\n';
            }
        });
        
        xml += '</urlset>';
        
        return xml;
    }
    
    groupEntriesByType() {
        const grouped = {};
        
        this.sitemapEntries.forEach(entry => {
            if (!grouped[entry.type]) {
                grouped[entry.type] = [];
            }
            grouped[entry.type].push(entry);
        });
        
        // Sort each group by priority
        Object.keys(grouped).forEach(type => {
            grouped[type].sort((a, b) => b.priority - a.priority);
        });
        
        return grouped;
    }
    
    getTypeComment(type) {
        const comments = {
            'static': 'Main Static Pages',
            'landing': 'High-Converting Landing Pages',
            'sector': 'Industry Sector Pages',
            'emergency': 'Emergency Services - CRITICAL PRIORITY',
            'urgent': 'Urgent Problem Services - HIGH PRIORITY',
            'business': 'Business Services B2B - HIGH PRIORITY',
            'standard': 'Standard Services - MEDIUM PRIORITY'
        };
        
        return comments[type] || type.toUpperCase();
    }
    
    showSummary() {
        console.log('\n📊 Sitemap Generation Summary:');
        console.log(`✅ Total URLs: ${this.sitemapEntries.length}`);
        
        // Count by type
        const typeCounts = {};
        this.sitemapEntries.forEach(entry => {
            typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1;
        });
        
        console.log('\n📋 Breakdown by Type:');
        Object.entries(typeCounts).forEach(([type, count]) => {
            console.log(`  ${this.getTypeComment(type)}: ${count} pages`);
        });
        
        // Calculate total search volume
        const totalSearchVolume = this.sitemapEntries
            .filter(entry => entry.searchVolume)
            .reduce((sum, entry) => sum + entry.searchVolume, 0);
        
        console.log(`\n🎯 Total Monthly Search Volume: ${totalSearchVolume.toLocaleString()}+ searches`);
        
        // Priority distribution
        const priorityRanges = {
            'Critical (0.9+)': 0,
            'High (0.8-0.89)': 0,
            'Medium (0.7-0.79)': 0,
            'Low (<0.7)': 0
        };
        
        this.sitemapEntries.forEach(entry => {
            if (entry.priority >= 0.9) priorityRanges['Critical (0.9+)']++;
            else if (entry.priority >= 0.8) priorityRanges['High (0.8-0.89)']++;
            else if (entry.priority >= 0.7) priorityRanges['Medium (0.7-0.79)']++;
            else priorityRanges['Low (<0.7)']++;
        });
        
        console.log('\n📈 Priority Distribution:');
        Object.entries(priorityRanges).forEach(([range, count]) => {
            console.log(`  ${range}: ${count} pages`);
        });
        
        console.log('\n🎉 Sitemap generated successfully: sitemap.xml');
        console.log('💡 Next steps:');
        console.log('1. Submit to Google Search Console');
        console.log('2. Add to robots.txt');
        console.log('3. Monitor indexing status');
        console.log('4. Track ranking improvements');
    }
    
    // Method to validate existing pages
    validatePages() {
        console.log('\n🔍 Validating existing pages...');
        
        let validPages = 0;
        let missingPages = 0;
        const missingList = [];
        
        this.sitemapEntries.forEach(entry => {
            if (entry.type === 'static' || entry.type === 'landing' || entry.type === 'sector') {
                return; // Skip validation for these
            }
            
            const urlPath = entry.url.replace(this.baseUrl, '.');
            if (fs.existsSync(urlPath)) {
                validPages++;
            } else {
                missingPages++;
                missingList.push(urlPath);
            }
        });
        
        console.log(`✅ Valid pages: ${validPages}`);
        console.log(`❌ Missing pages: ${missingPages}`);
        
        if (missingList.length > 0 && missingList.length <= 10) {
            console.log('\n📋 Missing pages:');
            missingList.forEach(page => console.log(`  - ${page}`));
        }
        
        return { validPages, missingPages, missingList };
    }
}

// CLI interface
if (require.main === module) {
    const generator = new ITERASitemapGenerator();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--validate')) {
        generator.addServicePages();
        generator.validatePages();
    } else {
        generator.generateSitemap();
        
        if (args.includes('--validate-after')) {
            generator.validatePages();
        }
    }
}

module.exports = ITERASitemapGenerator;
