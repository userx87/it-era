#!/usr/bin/env node

/**
 * Script per creare pagine professionali per tutte le province lombarde
 * Usa il template di Bergamo come base
 */

const fs = require('fs');
const path = require('path');

class LombardyPagesGenerator {
    constructor() {
        this.templateFile = './servizi-it/assistenza-informatica-aziende-bergamo.html';
        this.provinces = [
            {
                name: 'Milano',
                code: 'milano',
                lat: '45.4642',
                lng: '9.1900',
                description: 'Supporto IT professionale per aziende a Milano. Assistenza 24/7, sicurezza informatica, gestione infrastrutture nel cuore economico della Lombardia.'
            },
            {
                name: 'Brescia',
                code: 'brescia',
                lat: '45.5416',
                lng: '10.2118',
                description: 'Assistenza informatica per aziende a Brescia. Supporto IT completo, sicurezza dati e infrastrutture per il settore industriale bresciano.'
            },
            {
                name: 'Como',
                code: 'como',
                lat: '45.8081',
                lng: '9.0852',
                description: 'Servizi IT professionali per aziende a Como. Assistenza informatica, cloud solutions e sicurezza per le imprese del territorio comasco.'
            },
            {
                name: 'Varese',
                code: 'varese',
                lat: '45.8206',
                lng: '8.8251',
                description: 'Assistenza informatica aziende Varese. Supporto IT 24/7, gestione reti e sicurezza informatica per le imprese varesine.'
            },
            {
                name: 'Pavia',
                code: 'pavia',
                lat: '45.1847',
                lng: '9.1582',
                description: 'Supporto IT per aziende a Pavia. Assistenza informatica professionale, cloud migration e sicurezza dati per il territorio pavese.'
            },
            {
                name: 'Cremona',
                code: 'cremona',
                lat: '45.1335',
                lng: '10.0422',
                description: 'Servizi informatici per aziende a Cremona. Assistenza IT, gestione infrastrutture e consulenza tecnologica per le imprese cremonesi.'
            },
            {
                name: 'Mantova',
                code: 'mantova',
                lat: '45.1564',
                lng: '10.7914',
                description: 'Assistenza informatica aziende Mantova. Supporto IT completo, sicurezza informatica e soluzioni cloud per il territorio mantovano.'
            },
            {
                name: 'Lecco',
                code: 'lecco',
                lat: '45.8566',
                lng: '9.3931',
                description: 'Supporto IT professionale per aziende a Lecco. Assistenza informatica, gestione reti e sicurezza dati per le imprese lecchesi.'
            },
            {
                name: 'Lodi',
                code: 'lodi',
                lat: '45.3142',
                lng: '9.5034',
                description: 'Servizi IT per aziende a Lodi. Assistenza informatica professionale, cloud solutions e supporto tecnico per il territorio lodigiano.'
            },
            {
                name: 'Sondrio',
                code: 'sondrio',
                lat: '46.1712',
                lng: '9.8728',
                description: 'Assistenza informatica aziende Sondrio. Supporto IT specializzato per le imprese della Valtellina e delle zone montane lombarde.'
            },
            {
                name: 'Monza e Brianza',
                code: 'monza-brianza',
                lat: '45.5845',
                lng: '9.2744',
                description: 'Supporto IT per aziende a Monza e Brianza. Assistenza informatica avanzata per il distretto industriale brianzolo.'
            }
        ];
        
        this.created = 0;
        this.errors = 0;
    }
    
    async generateAllPages() {
        console.log('🏢 Generating Lombardy province pages...\n');
        
        // Check if template exists
        if (!fs.existsSync(this.templateFile)) {
            console.error('❌ Template file not found:', this.templateFile);
            return;
        }
        
        // Read template
        const template = fs.readFileSync(this.templateFile, 'utf8');
        console.log('✅ Template loaded successfully');
        
        // Generate pages for each province
        for (const province of this.provinces) {
            this.generateProvincePage(template, province);
        }
        
        this.showSummary();
    }
    
    generateProvincePage(template, province) {
        try {
            console.log(`🏗️ Creating page for ${province.name}...`);
            
            // Replace all Bergamo references with the new province
            let content = template;
            
            // Title and meta tags
            content = content.replace(
                /Assistenza Informatica Aziende Bergamo/g,
                `Assistenza Informatica Aziende ${province.name}`
            );
            
            content = content.replace(
                /assistenza informatica aziende bergamo/g,
                `assistenza informatica aziende ${province.code}`
            );
            
            content = content.replace(
                /supporto IT bergamo/g,
                `supporto IT ${province.code}`
            );
            
            content = content.replace(
                /consulenza informatica bergamo/g,
                `consulenza informatica ${province.code}`
            );
            
            // Meta description
            content = content.replace(
                /Assistenza informatica professionale per aziende a Bergamo\. Supporto IT 24\/7, gestione infrastrutture, sicurezza informatica\. Preventivo gratuito in 24h\./,
                province.description
            );
            
            // Open Graph description
            content = content.replace(
                /Supporto IT professionale per aziende a Bergamo\. Assistenza 24\/7, sicurezza informatica, gestione infrastrutture\./,
                province.description
            );
            
            // URL references
            content = content.replace(
                /assistenza-informatica-aziende-bergamo\.html/g,
                `assistenza-informatica-aziende-${province.code}.html`
            );
            
            // Structured data
            content = content.replace(
                /"name": "IT-ERA - Assistenza Informatica Aziende Bergamo"/,
                `"name": "IT-ERA - Assistenza Informatica Aziende ${province.name}"`
            );
            
            content = content.replace(
                /"description": "Assistenza informatica professionale per aziende a Bergamo[^"]*"/,
                `"description": "${province.description}"`
            );
            
            content = content.replace(
                /"addressLocality": "Bergamo"/,
                `"addressLocality": "${province.name}"`
            );
            
            // Coordinates
            content = content.replace(
                /"latitude": "45\.6983"/,
                `"latitude": "${province.lat}"`
            );
            
            content = content.replace(
                /"longitude": "9\.6773"/,
                `"longitude": "${province.lng}"`
            );
            
            // Hero section
            content = content.replace(
                /Professionale<\/span> a Bergamo/,
                `Professionale</span> a ${province.name}`
            );
            
            // Benefits section
            content = content.replace(
                /Perché Scegliere IT-ERA per la Tua Azienda a Bergamo/,
                `Perché Scegliere IT-ERA per la Tua Azienda a ${province.name}`
            );
            
            // Contact form section
            content = content.replace(
                /per i servizi IT della tua azienda a Bergamo\./,
                `per i servizi IT della tua azienda a ${province.name}.`
            );
            
            // Contact info
            content = content.replace(
                /Bergamo e provincia/,
                `${province.name} e provincia`
            );
            
            // Analytics tracking
            content = content.replace(
                /'Assistenza Informatica Aziende - Bergamo'/,
                `'Assistenza Informatica Aziende - ${province.name}'`
            );
            
            content = content.replace(
                /location: 'Bergamo'/g,
                `location: '${province.name}'`
            );
            
            // Save the file
            const fileName = `./servizi-it/assistenza-informatica-aziende-${province.code}.html`;
            fs.writeFileSync(fileName, content, 'utf8');
            
            console.log(`✅ ${province.name} page created: ${fileName}`);
            this.created++;
            
        } catch (error) {
            console.error(`❌ Error creating page for ${province.name}:`, error.message);
            this.errors++;
        }
    }
    
    showSummary() {
        console.log('\n📊 Generation Summary:');
        console.log(`✅ Pages created: ${this.created}`);
        console.log(`❌ Errors: ${this.errors}`);
        console.log(`📄 Total provinces: ${this.provinces.length}`);
        
        if (this.created > 0) {
            console.log('\n🎉 Lombardy pages generated successfully!');
            console.log('💡 Next steps:');
            console.log('1. Review generated pages');
            console.log('2. Test a few random pages');
            console.log('3. Commit and deploy');
            console.log('4. Monitor performance and conversions');
        }
        
        console.log('\n🏢 Generated pages:');
        this.provinces.forEach(province => {
            console.log(`- assistenza-informatica-aziende-${province.code}.html`);
        });
    }
}

// Execute if run directly
if (require.main === module) {
    const generator = new LombardyPagesGenerator();
    generator.generateAllPages().catch(console.error);
}

module.exports = LombardyPagesGenerator;
