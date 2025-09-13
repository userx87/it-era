#!/usr/bin/env node

/**
 * IT-ERA Service Pages Generator
 * Genera automaticamente pagine per servizi IT con template personalizzati
 */

const fs = require('fs');
const path = require('path');

class ITERAServicePagesGenerator {
    constructor() {
        this.provinces = [
            {
                name: 'Bergamo',
                code: 'bergamo',
                lat: '45.6983',
                lng: '9.6773',
                description: 'Bergamo e provincia'
            },
            {
                name: 'Milano',
                code: 'milano',
                lat: '45.4642',
                lng: '9.1900',
                description: 'Milano e area metropolitana'
            },
            {
                name: 'Brescia',
                code: 'brescia',
                lat: '45.5416',
                lng: '10.2118',
                description: 'Brescia e provincia'
            },
            {
                name: 'Como',
                code: 'como',
                lat: '45.8081',
                lng: '9.0852',
                description: 'Como e provincia'
            },
            {
                name: 'Varese',
                code: 'varese',
                lat: '45.8206',
                lng: '8.8251',
                description: 'Varese e provincia'
            },
            {
                name: 'Pavia',
                code: 'pavia',
                lat: '45.1847',
                lng: '9.1582',
                description: 'Pavia e provincia'
            },
            {
                name: 'Cremona',
                code: 'cremona',
                lat: '45.1335',
                lng: '10.0422',
                description: 'Cremona e provincia'
            },
            {
                name: 'Mantova',
                code: 'mantova',
                lat: '45.1564',
                lng: '10.7914',
                description: 'Mantova e provincia'
            },
            {
                name: 'Lecco',
                code: 'lecco',
                lat: '45.8566',
                lng: '9.3931',
                description: 'Lecco e provincia'
            },
            {
                name: 'Lodi',
                code: 'lodi',
                lat: '45.3142',
                lng: '9.5034',
                description: 'Lodi e provincia'
            },
            {
                name: 'Sondrio',
                code: 'sondrio',
                lat: '46.1712',
                lng: '9.8728',
                description: 'Sondrio e Valtellina'
            },
            {
                name: 'Monza e Brianza',
                code: 'monza-brianza',
                lat: '45.5845',
                lng: '9.2744',
                description: 'Monza, Brianza e provincia'
            }
        ];
        
        this.services = [
            {
                name: 'Riparazione Computer',
                template: 'riparazione-computer-template.html',
                filename: 'riparazione-computer',
                description: 'Riparazione professionale PC, notebook e workstation'
            },
            {
                name: 'Assistenza Server',
                template: 'assistenza-server-template.html',
                filename: 'assistenza-server',
                description: 'Supporto server Dell, HP, IBM, Lenovo e tutti i brand'
            }
        ];
        
        this.created = 0;
        this.errors = 0;
        this.results = [];
    }
    
    async generateAllServices() {
        console.log('🚀 IT-ERA Service Pages Generator\n');
        console.log(`📊 Generating pages for ${this.services.length} services × ${this.provinces.length} provinces = ${this.services.length * this.provinces.length} total pages\n`);
        
        for (const service of this.services) {
            console.log(`🔧 Generating service: ${service.name}`);
            await this.generateServicePages(service);
            console.log('');
        }
        
        this.showSummary();
        this.validatePages();
    }
    
    async generateServicePages(service) {
        const templatePath = `./development/templates/${service.template}`;
        
        if (!fs.existsSync(templatePath)) {
            console.error(`❌ Template not found: ${templatePath}`);
            this.errors++;
            return;
        }
        
        const template = fs.readFileSync(templatePath, 'utf8');
        console.log(`✅ Template loaded: ${service.template}`);
        
        const serviceResults = {
            service: service.name,
            pages: [],
            errors: []
        };
        
        for (const province of this.provinces) {
            try {
                const filename = `${service.filename}-${province.code}.html`;
                const filepath = `./servizi-it/${filename}`;
                
                const content = this.processTemplate(template, province, service);
                
                fs.writeFileSync(filepath, content, 'utf8');
                
                console.log(`  ✅ ${province.name}: ${filename}`);
                this.created++;
                serviceResults.pages.push({
                    province: province.name,
                    filename: filename,
                    size: content.length
                });
                
            } catch (error) {
                console.error(`  ❌ ${province.name}: ${error.message}`);
                this.errors++;
                serviceResults.errors.push({
                    province: province.name,
                    error: error.message
                });
            }
        }
        
        this.results.push(serviceResults);
    }
    
    processTemplate(template, province, service) {
        let content = template;
        
        // Replace province placeholders
        content = content.replace(/\{\{CITY\}\}/g, province.name);
        content = content.replace(/\{\{CITY_LOWER\}\}/g, province.name.toLowerCase());
        content = content.replace(/\{\{CITY_CODE\}\}/g, province.code);
        content = content.replace(/\{\{LATITUDE\}\}/g, province.lat);
        content = content.replace(/\{\{LONGITUDE\}\}/g, province.lng);
        
        // Add service-specific customizations
        if (service.filename === 'riparazione-computer') {
            // Customize for computer repair service
            content = this.customizeComputerRepair(content, province);
        } else if (service.filename === 'assistenza-server') {
            // Customize for server assistance service
            content = this.customizeServerAssistance(content, province);
        }
        
        return content;
    }
    
    customizeComputerRepair(content, province) {
        // Add specific customizations for computer repair
        const businessHours = province.name === 'Milano' ? 'Lun-Dom: 8:00-20:00' : 'Lun-Ven: 8:00-18:00';
        content = content.replace(/Lun-Ven: 8:00-18:00/g, businessHours);
        
        return content;
    }
    
    customizeServerAssistance(content, province) {
        // Add specific customizations for server assistance
        const serverSupport = province.name === 'Milano' ? 'Server 24/7/365' : 'Server 24/7';
        content = content.replace(/Server 24\/7/g, serverSupport);
        
        return content;
    }
    
    showSummary() {
        console.log('📊 Generation Summary:');
        console.log(`✅ Pages created: ${this.created}`);
        console.log(`❌ Errors: ${this.errors}`);
        console.log(`📄 Total services: ${this.services.length}`);
        console.log(`🏢 Total provinces: ${this.provinces.length}`);
        
        if (this.created > 0) {
            console.log('\n🎉 Service pages generated successfully!');
            
            // Show breakdown by service
            console.log('\n📋 Breakdown by Service:');
            this.results.forEach(result => {
                console.log(`\n🔧 ${result.service}:`);
                console.log(`  ✅ Pages: ${result.pages.length}`);
                console.log(`  ❌ Errors: ${result.errors.length}`);
                
                if (result.pages.length > 0) {
                    const avgSize = Math.round(result.pages.reduce((sum, page) => sum + page.size, 0) / result.pages.length / 1024);
                    console.log(`  📏 Avg size: ${avgSize}KB`);
                }
            });
        }
        
        console.log('\n💡 Next steps:');
        console.log('1. Review generated pages');
        console.log('2. Test a few random pages');
        console.log('3. Commit and deploy');
        console.log('4. Monitor performance and conversions');
    }
    
    validatePages() {
        console.log('\n🔍 Validating generated pages...');
        
        let validPages = 0;
        let invalidPages = 0;
        
        this.results.forEach(result => {
            result.pages.forEach(page => {
                const filepath = `./servizi-it/${page.filename}`;
                
                try {
                    const content = fs.readFileSync(filepath, 'utf8');
                    
                    // Basic validation checks
                    const hasTitle = content.includes('<title>') && content.includes('</title>');
                    const hasH1 = content.includes('<h1');
                    const hasForm = content.includes('data-resend="true"');
                    const hasStructuredData = content.includes('"@type": "LocalBusiness"');
                    const noPlaceholders = !content.includes('{{') && !content.includes('}}');
                    
                    if (hasTitle && hasH1 && hasForm && hasStructuredData && noPlaceholders) {
                        validPages++;
                    } else {
                        invalidPages++;
                        console.log(`  ⚠️ Issues in ${page.filename}:`);
                        if (!hasTitle) console.log('    - Missing title tag');
                        if (!hasH1) console.log('    - Missing H1 tag');
                        if (!hasForm) console.log('    - Missing form');
                        if (!hasStructuredData) console.log('    - Missing structured data');
                        if (!noPlaceholders) console.log('    - Unprocessed placeholders');
                    }
                    
                } catch (error) {
                    invalidPages++;
                    console.log(`  ❌ Cannot validate ${page.filename}: ${error.message}`);
                }
            });
        });
        
        console.log(`\n✅ Valid pages: ${validPages}`);
        console.log(`⚠️ Invalid pages: ${invalidPages}`);
        
        if (invalidPages === 0) {
            console.log('\n🎉 All pages passed validation!');
        }
    }
    
    // Method to generate single service for testing
    async generateSingleService(serviceName, provinceName = null) {
        const service = this.services.find(s => s.name.toLowerCase().includes(serviceName.toLowerCase()));
        if (!service) {
            console.error(`❌ Service not found: ${serviceName}`);
            return;
        }
        
        if (provinceName) {
            const province = this.provinces.find(p => p.name.toLowerCase().includes(provinceName.toLowerCase()));
            if (!province) {
                console.error(`❌ Province not found: ${provinceName}`);
                return;
            }
            this.provinces = [province];
        }
        
        console.log(`🔧 Generating single service: ${service.name}`);
        await this.generateServicePages(service);
        this.showSummary();
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const generator = new ITERAServicePagesGenerator();
    
    if (args.length === 0) {
        // Generate all services
        generator.generateAllServices().catch(console.error);
    } else if (args.length === 1) {
        // Generate single service for all provinces
        generator.generateSingleService(args[0]).catch(console.error);
    } else if (args.length === 2) {
        // Generate single service for single province
        generator.generateSingleService(args[0], args[1]).catch(console.error);
    } else {
        console.log('Usage:');
        console.log('  node generate-service-pages.js                    # Generate all services');
        console.log('  node generate-service-pages.js "riparazione"      # Generate single service');
        console.log('  node generate-service-pages.js "server" "milano"  # Generate single service for single province');
    }
}

module.exports = ITERAServicePagesGenerator;
