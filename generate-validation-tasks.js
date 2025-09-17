#!/usr/bin/env node

/**
 * IT-ERA Validation Tasks Generator
 * Genera automaticamente task di validazione per tutte le 568 pagine della sitemap
 */

const fs = require('fs');
const { execSync } = require('child_process');

class ValidationTasksGenerator {
    constructor() {
        this.baseUrl = 'https://it-era.it';
        this.allPages = [];
        this.createdTasks = [];
        
        // Pagine già create manualmente (da escludere)
        this.excludePages = [
            'https://it-era.it',
            'https://it-era.it/contatti.html',
            'https://it-era.it/servizi-it/computer-non-si-accende-milano.html',
            'https://it-era.it/servizi-it/computer-non-si-accende-bergamo.html',
            'https://it-era.it/servizi-it/computer-non-si-accende-brescia.html',
            'https://it-era.it/landing/assistenza-emergenza.html',
            'https://it-era.it/landing/cloud-migration.html',
            'https://it-era.it/landing/sicurezza-informatica.html',
            'https://it-era.it/landing/digitalizzazione-pmi.html',
            'https://it-era.it/landing/software-commercialisti.html',
            'https://it-era.it/settori/commercialisti.html',
            'https://it-era.it/settori/studi-medici/index.html',
            'https://it-era.it/settori/studi-legali.html',
            'https://it-era.it/settori/pmi-startup.html',
            'https://it-era.it/settori/industria-40.html',
            'https://it-era.it/settori/retail-gdo.html'
        ];
        
        // Configurazione priorità e categorie
        this.categoryConfig = {
            emergency: {
                priority: 'CRITICAL',
                emoji: '🔴',
                keywords: ['computer-non-si-accende', 'schermo-nero', 'hard-disk-non-funziona', 'virus', 'hacker'],
                description: 'Emergency banner, 039 888 2041 prominente, CTA styled, descrizione problema'
            },
            'service-it': {
                priority: 'HIGH',
                emoji: '🟡',
                keywords: ['servizi-it'],
                description: 'Descrizione servizio, pricing section, FAQ, related services'
            },
            service: {
                priority: 'MEDIUM',
                emoji: '🟢',
                keywords: ['servizi'],
                description: 'Service overview, benefits, CTA, testimonials'
            },
            blog: {
                priority: 'MEDIUM',
                emoji: '🟢',
                keywords: ['blog'],
                description: 'Article content, related posts, social sharing, comments'
            },
            page: {
                priority: 'MEDIUM',
                emoji: '🟢',
                keywords: [],
                description: 'Page content, navigation, CTA, footer'
            },
            admin: {
                priority: 'LOW',
                emoji: '⚪',
                keywords: ['admin', 'dashboard'],
                description: 'Admin interface, functionality, security'
            },
            test: {
                priority: 'LOW',
                emoji: '⚪',
                keywords: ['test-', 'development'],
                description: 'Test functionality, development features'
            }
        };
    }
    
    // Ottieni tutte le pagine dalla sitemap
    getAllPagesFromSitemap() {
        console.log('🔍 Fetching all pages from sitemap...');
        
        try {
            const sitemapContent = execSync('curl -s https://it-era.it/sitemap.xml', { encoding: 'utf8' });
            const urlMatches = sitemapContent.match(/https:\/\/it-era\.it[^<]*/g);
            
            if (urlMatches) {
                this.allPages = urlMatches.filter(url => !this.excludePages.includes(url));
                console.log(`  📄 Found ${urlMatches.length} total pages`);
                console.log(`  ✅ ${this.excludePages.length} already created manually`);
                console.log(`  🆕 ${this.allPages.length} pages to create tasks for`);
            }
            
        } catch (error) {
            console.error('Error fetching sitemap:', error);
        }
    }
    
    // Determina categoria e priorità di una pagina
    categorizePage(url) {
        const urlPath = url.replace('https://it-era.it', '');
        
        // Check for emergency pages
        if (this.categoryConfig.emergency.keywords.some(keyword => urlPath.includes(keyword))) {
            return 'emergency';
        }
        
        // Check for service-it pages
        if (urlPath.startsWith('/servizi-it/')) {
            return 'service-it';
        }
        
        // Check for general services
        if (urlPath.startsWith('/servizi/')) {
            return 'service';
        }
        
        // Check for blog
        if (urlPath.startsWith('/blog/')) {
            return 'blog';
        }
        
        // Check for admin
        if (urlPath.includes('admin') || urlPath.includes('dashboard')) {
            return 'admin';
        }
        
        // Check for test pages
        if (urlPath.includes('test-') || urlPath.includes('development')) {
            return 'test';
        }
        
        // Default to page
        return 'page';
    }
    
    // Genera nome pagina user-friendly
    generatePageName(url) {
        let pageName = url.replace('https://it-era.it/', '').replace('.html', '');
        
        // Handle root
        if (!pageName) return 'Homepage';
        
        // Handle index files
        pageName = pageName.replace('/index', '');
        
        // Convert dashes to spaces and capitalize
        pageName = pageName.split('/').pop().replace(/-/g, ' ');
        pageName = pageName.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        return pageName;
    }
    
    // Genera provincia dalla URL
    getProvince(url) {
        const provinces = [
            'milano', 'bergamo', 'brescia', 'como', 'varese', 'monza-brianza',
            'pavia', 'cremona', 'mantova', 'lecco', 'lodi', 'sondrio'
        ];
        
        for (const province of provinces) {
            if (url.includes(`-${province}.html`)) {
                return province.charAt(0).toUpperCase() + province.slice(1).replace('-', ' ');
            }
        }
        
        return '';
    }
    
    // Genera task description
    generateTaskDescription(url, category) {
        const config = this.categoryConfig[category];
        const province = this.getProvince(url);
        const provinceText = province ? ` (${province})` : '';
        
        let visualStep, codeStep, contactStep;
        
        switch (category) {
            case 'emergency':
                visualStep = 'Emergency banner, 039 888 2041 prominente, CTA styled, descrizione problema';
                codeStep = `Title emergenza+${province || 'provincia'}, meta urgenza, schema Service, emergency tracking`;
                contactStep = 'Emergency form prioritario, Resend notification immediata, phone/WhatsApp links';
                break;
                
            case 'service-it':
                visualStep = 'Descrizione servizio dettagliata, pricing section, FAQ, related services';
                codeStep = `Title servizio+${province || 'provincia'}, meta keywords, schema Service, tracking`;
                contactStep = 'Form preventivo specifico, Resend lead capture, consultation CTA';
                break;
                
            case 'service':
                visualStep = 'Service overview, benefits, CTA, testimonials, related services';
                codeStep = 'Title servizio, meta description, schema Service, internal linking';
                contactStep = 'Service inquiry form, Resend integration, consultation request';
                break;
                
            case 'blog':
                visualStep = 'Article content, related posts, social sharing, author info';
                codeStep = 'Title article, meta description, schema Article, social tags';
                contactStep = 'Newsletter signup, Resend subscription, social sharing';
                break;
                
            case 'admin':
                visualStep = 'Admin interface, functionality, navigation, security';
                codeStep = 'Title admin, meta noindex, security headers, access control';
                contactStep = 'Admin contact form, Resend admin notifications, security alerts';
                break;
                
            case 'test':
                visualStep = 'Test functionality, development features, debugging info';
                codeStep = 'Title test, meta noindex, development tracking, error handling';
                contactStep = 'Test form submission, Resend test integration, validation';
                break;
                
            default: // page
                visualStep = 'Page content, navigation, CTA, footer, mobile responsive';
                codeStep = 'Title page, meta description, schema WebPage, analytics tracking';
                contactStep = 'Contact form, Resend integration, inquiry handling';
        }
        
        return `Validate page: ${url}${provinceText}
Category: ${category}
Priority: ${config.priority}

STEP 1 - Visual: [ ] ${visualStep}
STEP 2 - Code: [ ] ${codeStep}
STEP 3 - Contact/Resend: [ ] ${contactStep}

Issues Found: [To be determined]
Resolution: [To be determined]`;
    }
    
    // Genera batch di task (max 50 per volta per non sovraccaricare)
    generateTaskBatch(startIndex = 0, batchSize = 50) {
        const batch = this.allPages.slice(startIndex, startIndex + batchSize);
        const tasks = [];
        
        console.log(`\n📝 Generating batch ${Math.floor(startIndex/batchSize) + 1}: pages ${startIndex + 1}-${Math.min(startIndex + batchSize, this.allPages.length)}`);
        
        batch.forEach((url, index) => {
            const category = this.categorizePage(url);
            const config = this.categoryConfig[category];
            const pageName = this.generatePageName(url);
            const province = this.getProvince(url);
            const provinceText = province ? ` - ${province}` : '';
            
            const task = {
                name: `${config.emoji} [${config.priority}] Validate: ${pageName}${provinceText}`,
                description: this.generateTaskDescription(url, category),
                parent_task_id: "5fbo3HzLtJ6U4rJhHb38Hu", // Master task ID
                state: "NOT_STARTED"
            };
            
            tasks.push(task);
        });
        
        return tasks;
    }
    
    // Genera statistiche
    generateStatistics() {
        const stats = {};
        
        this.allPages.forEach(url => {
            const category = this.categorizePage(url);
            const config = this.categoryConfig[category];
            const priority = config.priority;
            
            if (!stats[priority]) {
                stats[priority] = { total: 0, categories: {} };
            }
            
            stats[priority].total++;
            
            if (!stats[priority].categories[category]) {
                stats[priority].categories[category] = 0;
            }
            
            stats[priority].categories[category]++;
        });
        
        console.log('\n📊 Task Generation Statistics:');
        console.log(`✅ Total pages to validate: ${this.allPages.length}`);
        
        Object.entries(stats).forEach(([priority, data]) => {
            console.log(`\n${priority} Priority: ${data.total} pages`);
            Object.entries(data.categories).forEach(([category, count]) => {
                const emoji = this.categoryConfig[category].emoji;
                console.log(`  ${emoji} ${category}: ${count} pages`);
            });
        });
    }
    
    // Salva batch come JSON per import manuale
    saveBatchAsJSON(batch, batchNumber) {
        const filename = `validation-tasks-batch-${batchNumber}.json`;
        fs.writeFileSync(filename, JSON.stringify(batch, null, 2));
        console.log(`💾 Saved batch ${batchNumber} to ${filename}`);
        return filename;
    }
    
    // Genera tutte le task
    generateAllTasks() {
        console.log('🎯 IT-ERA Validation Tasks Generator\n');
        
        // Ottieni tutte le pagine
        this.getAllPagesFromSitemap();
        
        if (this.allPages.length === 0) {
            console.log('❌ No pages found to generate tasks for');
            return;
        }
        
        // Genera statistiche
        this.generateStatistics();
        
        // Genera task in batch
        const batchSize = 50;
        const totalBatches = Math.ceil(this.allPages.length / batchSize);
        
        console.log(`\n🔄 Generating ${totalBatches} batches of ${batchSize} tasks each...`);
        
        for (let i = 0; i < totalBatches; i++) {
            const startIndex = i * batchSize;
            const batch = this.generateTaskBatch(startIndex, batchSize);
            const filename = this.saveBatchAsJSON(batch, i + 1);
            
            console.log(`  ✅ Batch ${i + 1}/${totalBatches}: ${batch.length} tasks generated`);
        }
        
        console.log('\n🎉 All validation tasks generated successfully!');
        console.log('\n💡 Next steps:');
        console.log('1. Import batches using task management system');
        console.log('2. Start validation with CRITICAL priority pages');
        console.log('3. Progress through HIGH → MEDIUM → LOW priority');
        console.log('4. Track completion in master task');
        
        return totalBatches;
    }
}

// Esegui se chiamato direttamente
if (require.main === module) {
    const generator = new ValidationTasksGenerator();
    generator.generateAllTasks();
}

module.exports = ValidationTasksGenerator;
