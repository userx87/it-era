#!/usr/bin/env node

/**
 * IT-ERA SEO-Optimized Pages Generator
 * Genera pagine ottimizzate per keyword ad alta conversione
 */

const fs = require('fs');
const path = require('path');

class ITERASEOPagesGenerator {
    constructor() {
        this.provinces = [
            { name: 'Bergamo', code: 'bergamo', lat: '45.6983', lng: '9.6773' },
            { name: 'Milano', code: 'milano', lat: '45.4642', lng: '9.1900' },
            { name: 'Brescia', code: 'brescia', lat: '45.5416', lng: '10.2118' },
            { name: 'Como', code: 'como', lat: '45.8081', lng: '9.0852' },
            { name: 'Varese', code: 'varese', lat: '45.8206', lng: '8.8251' },
            { name: 'Pavia', code: 'pavia', lat: '45.1847', lng: '9.1582' },
            { name: 'Cremona', code: 'cremona', lat: '45.1335', lng: '10.0422' },
            { name: 'Mantova', code: 'mantova', lat: '45.1564', lng: '10.7914' },
            { name: 'Lecco', code: 'lecco', lat: '45.8566', lng: '9.3931' },
            { name: 'Lodi', code: 'lodi', lat: '45.3142', lng: '9.5034' },
            { name: 'Sondrio', code: 'sondrio', lat: '46.1712', lng: '9.8728' },
            { name: 'Monza e Brianza', code: 'monza-brianza', lat: '45.5845', lng: '9.2744' }
        ];
        
        // B2C Problem-Specific Services (High-Conversion Keywords)
        this.problemServices = [
            {
                problemTitle: 'Computer Non Si Accende',
                problemKeyword: 'computer non si accende',
                solutionKeyword: 'riparazione computer',
                solution: 'Riparazione Immediata',
                timeframe: '2 ore',
                urlSlug: 'computer-non-si-accende',
                problemIcon: 'fas fa-power-off',
                problemDescription: 'Il tuo computer non si accende più',
                problemDescriptionLong: 'Computer che non si accende, nessun segno di vita, LED spenti o lampeggianti.',
                solutionDescription: 'Diagnosi e riparazione immediata del problema di accensione',
                solutionDescriptionLong: 'Identifichiamo rapidamente se il problema è nell\'alimentatore, scheda madre, RAM o altri componenti critici.',
                diagnosisDescription: 'Test completo alimentatore, scheda madre e componenti critici.',
                repairDescription: 'Sostituzione componenti guasti con ricambi originali certificati.',
                testDescription: 'Verifica completa funzionamento e stress test di stabilità.',
                problemPlaceholder: 'Descrivi quando è iniziato il problema, se ci sono LED accesi, rumori particolari...',
                searchVolume: 200,
                serviceCategory: 'Riparazione Computer',
                serviceName: 'Riparazione Computer Non Si Accende',
                serviceType: 'computer_power_repair',
                problemType: 'power_failure',
                analyticsTitle: 'Computer Non Si Accende'
            },
            {
                problemTitle: 'Schermo Nero Computer',
                problemKeyword: 'schermo nero computer',
                solutionKeyword: 'riparazione schermo',
                solution: 'Risoluzione Schermo Nero',
                timeframe: '1 ora',
                urlSlug: 'schermo-nero-computer',
                problemIcon: 'fas fa-desktop',
                problemDescription: 'Computer acceso ma schermo completamente nero',
                problemDescriptionLong: 'Computer che si accende ma lo schermo rimane nero, nessuna immagine visualizzata.',
                solutionDescription: 'Diagnosi e riparazione problemi video e schermo nero',
                solutionDescriptionLong: 'Risolviamo problemi di scheda video, driver, cavi video e monitor per ripristinare la visualizzazione.',
                diagnosisDescription: 'Test scheda video, connessioni, driver e compatibilità monitor.',
                repairDescription: 'Riparazione o sostituzione scheda video, aggiornamento driver.',
                testDescription: 'Test completo visualizzazione su diversi monitor e risoluzioni.',
                problemPlaceholder: 'Descrivi se il computer si accende, se senti rumori, se hai cambiato qualcosa...',
                searchVolume: 150,
                serviceCategory: 'Riparazione Computer',
                serviceName: 'Riparazione Schermo Nero Computer',
                serviceType: 'display_repair',
                problemType: 'black_screen',
                analyticsTitle: 'Schermo Nero Computer'
            },
            {
                problemTitle: 'Computer Si Spegne Da Solo',
                problemKeyword: 'computer si spegne da solo',
                solutionKeyword: 'riparazione spegnimento',
                solution: 'Risoluzione Spegnimenti',
                timeframe: '3 ore',
                urlSlug: 'computer-si-spegne-da-solo',
                problemIcon: 'fas fa-exclamation-triangle',
                problemDescription: 'Computer che si spegne improvvisamente senza preavviso',
                problemDescriptionLong: 'Spegnimenti improvvisi, riavvii casuali, instabilità del sistema operativo.',
                solutionDescription: 'Diagnosi e risoluzione problemi di stabilità e spegnimenti',
                solutionDescriptionLong: 'Identifichiamo cause di surriscaldamento, problemi alimentazione, RAM difettosa o software instabile.',
                diagnosisDescription: 'Monitoraggio temperature, test stress, analisi log di sistema.',
                repairDescription: 'Pulizia raffreddamento, sostituzione componenti, ottimizzazione sistema.',
                testDescription: 'Test di stabilità prolungati e monitoraggio temperature.',
                problemPlaceholder: 'Descrivi quando si spegne (durante quale attività), se fa rumore, se è caldo...',
                searchVolume: 180,
                serviceCategory: 'Riparazione Computer',
                serviceName: 'Riparazione Computer Instabile',
                serviceType: 'stability_repair',
                problemType: 'random_shutdown',
                analyticsTitle: 'Computer Si Spegne Da Solo'
            },
            {
                problemTitle: 'Hard Disk Non Funziona',
                problemKeyword: 'hard disk non funziona',
                solutionKeyword: 'riparazione hard disk',
                solution: 'Recupero e Sostituzione',
                timeframe: '4 ore',
                urlSlug: 'hard-disk-non-funziona',
                problemIcon: 'fas fa-hdd',
                problemDescription: 'Hard disk danneggiato, non riconosciuto o con errori',
                problemDescriptionLong: 'Disco rigido che non viene riconosciuto, errori di lettura, rumori strani.',
                solutionDescription: 'Recupero dati e sostituzione hard disk danneggiato',
                solutionDescriptionLong: 'Recuperiamo i tuoi dati importanti e installiamo un nuovo disco con sistema operativo.',
                diagnosisDescription: 'Test completo integrità disco, settori danneggiati, recuperabilità dati.',
                repairDescription: 'Recupero dati, clonazione su nuovo disco, installazione sistema.',
                testDescription: 'Verifica integrità dati recuperati e funzionamento nuovo disco.',
                problemPlaceholder: 'Descrivi i sintomi: rumori strani, errori, quando è iniziato il problema...',
                searchVolume: 120,
                serviceCategory: 'Riparazione Computer',
                serviceName: 'Riparazione Hard Disk',
                serviceType: 'hdd_repair',
                problemType: 'disk_failure',
                analyticsTitle: 'Hard Disk Non Funziona'
            },
            {
                problemTitle: 'WiFi Non Funziona Computer',
                problemKeyword: 'wifi non funziona computer',
                solutionKeyword: 'riparazione wifi',
                solution: 'Ripristino Connessione',
                timeframe: '1 ora',
                urlSlug: 'wifi-non-funziona-computer',
                problemIcon: 'fas fa-wifi',
                problemDescription: 'Computer non si connette al WiFi o connessione instabile',
                problemDescriptionLong: 'Problemi di connessione WiFi, rete non rilevata, disconnessioni frequenti.',
                solutionDescription: 'Riparazione e configurazione connessione WiFi',
                solutionDescriptionLong: 'Risolviamo problemi di scheda WiFi, driver, configurazione rete e sicurezza.',
                diagnosisDescription: 'Test scheda WiFi, driver, configurazione rete e interferenze.',
                repairDescription: 'Aggiornamento driver, configurazione rete, ottimizzazione segnale.',
                testDescription: 'Test connessione, velocità e stabilità su diverse reti.',
                problemPlaceholder: 'Descrivi il problema: non vede reti, si disconnette, è lento...',
                searchVolume: 250,
                serviceCategory: 'Riparazione Computer',
                serviceName: 'Riparazione WiFi Computer',
                serviceType: 'wifi_repair',
                problemType: 'network_issue',
                analyticsTitle: 'WiFi Non Funziona Computer'
            }
        ];
        
        // B2B Business Services
        this.businessServices = [
            {
                serviceName: 'Assistenza Informatica Ufficio',
                serviceKeyword: 'assistenza informatica ufficio',
                businessKeyword: 'supporto IT aziendale',
                guarantee: 'Uptime Garantito',
                percentage: '99.9%',
                urlSlug: 'assistenza-informatica-ufficio',
                serviceIcon: 'fas fa-building',
                serviceDescription: 'Assistenza informatica completa per uffici e aziende',
                serviceDescriptionLong: 'Supporto IT completo per uffici: gestione server, workstation, rete, backup e sicurezza.',
                professionalQualifier: 'Tecnici certificati Microsoft e Cisco',
                solutionTitle: 'Supporto IT Professionale',
                solutionDescriptionLong: 'Gestiamo completamente l\'infrastruttura IT del tuo ufficio con contratti di assistenza personalizzati.',
                analysisDescription: 'Audit completo infrastruttura IT e identificazione criticità.',
                implementationDescription: 'Implementazione soluzioni con pianificazione dettagliata.',
                trainingDescription: 'Formazione staff e documentazione procedure operative.',
                supportDescription: 'Supporto continuativo con SLA definiti e monitoraggio proattivo.',
                projectPlaceholder: 'Descrivi le esigenze del tuo ufficio: numero PC, server, problemi attuali...',
                searchVolume: 300,
                serviceCategory: 'Assistenza IT Business',
                serviceType: 'office_it_support',
                analyticsTitle: 'Assistenza Informatica Ufficio'
            },
            {
                serviceName: 'Configurazione Rete Ufficio',
                serviceKeyword: 'configurazione rete ufficio',
                businessKeyword: 'setup rete aziendale',
                guarantee: 'Performance Garantite',
                percentage: '100%',
                urlSlug: 'configurazione-rete-ufficio',
                serviceIcon: 'fas fa-network-wired',
                serviceDescription: 'Progettazione e configurazione reti aziendali professionali',
                serviceDescriptionLong: 'Configurazione rete LAN/WiFi aziendale con sicurezza, performance e scalabilità.',
                professionalQualifier: 'Specialisti certificati Cisco e Ubiquiti',
                solutionTitle: 'Rete Aziendale Professionale',
                solutionDescriptionLong: 'Progettiamo e configuriamo reti aziendali sicure, veloci e affidabili per ogni esigenza.',
                analysisDescription: 'Analisi esigenze, mappatura ufficio e progettazione architettura rete.',
                implementationDescription: 'Installazione apparati, cablaggio e configurazione avanzata.',
                trainingDescription: 'Training amministratori e documentazione configurazioni.',
                supportDescription: 'Monitoraggio rete 24/7 e supporto specialistico.',
                projectPlaceholder: 'Descrivi l\'ufficio: dimensioni, numero utenti, esigenze specifiche...',
                searchVolume: 200,
                serviceCategory: 'Networking Business',
                serviceType: 'network_setup',
                analyticsTitle: 'Configurazione Rete Ufficio'
            },
            {
                serviceName: 'Backup Automatico Azienda',
                serviceKeyword: 'backup automatico azienda',
                businessKeyword: 'backup aziendale',
                guarantee: 'Dati Protetti',
                percentage: '100%',
                urlSlug: 'backup-automatico-azienda',
                serviceIcon: 'fas fa-shield-alt',
                serviceDescription: 'Sistemi di backup automatico per protezione dati aziendali',
                serviceDescriptionLong: 'Implementazione backup automatici con ridondanza locale e cloud per massima sicurezza.',
                professionalQualifier: 'Esperti in disaster recovery e business continuity',
                solutionTitle: 'Protezione Dati Aziendale',
                solutionDescriptionLong: 'Implementiamo sistemi di backup multi-livello con recovery point objective (RPO) personalizzati.',
                analysisDescription: 'Audit dati critici, analisi rischi e definizione strategie backup.',
                implementationDescription: 'Setup backup automatici, test recovery e configurazione alerting.',
                trainingDescription: 'Training procedure recovery e gestione backup per staff IT.',
                supportDescription: 'Monitoraggio backup 24/7 e test recovery periodici.',
                projectPlaceholder: 'Descrivi i dati da proteggere: server, database, documenti, email...',
                searchVolume: 150,
                serviceCategory: 'Data Protection Business',
                serviceType: 'backup_solution',
                analyticsTitle: 'Backup Automatico Azienda'
            }
        ];
        
        this.created = 0;
        this.errors = 0;
        this.results = [];
    }
    
    async generateAllSEOPages() {
        console.log('🎯 IT-ERA SEO-Optimized Pages Generator\n');
        
        const totalB2C = this.problemServices.length * this.provinces.length;
        const totalB2B = this.businessServices.length * this.provinces.length;
        const total = totalB2C + totalB2B;
        
        console.log(`📊 Generating SEO pages:`);
        console.log(`   🔧 B2C Problem Services: ${this.problemServices.length} × ${this.provinces.length} = ${totalB2C} pages`);
        console.log(`   🏢 B2B Business Services: ${this.businessServices.length} × ${this.provinces.length} = ${totalB2B} pages`);
        console.log(`   📄 Total: ${total} pages\n`);
        
        // Generate B2C Problem-Specific Pages
        console.log('🔧 Generating B2C Problem-Specific Pages...');
        for (const service of this.problemServices) {
            await this.generateProblemPages(service);
        }
        
        // Generate B2B Business Pages
        console.log('\n🏢 Generating B2B Business Pages...');
        for (const service of this.businessServices) {
            await this.generateBusinessPages(service);
        }
        
        this.showSummary();
        this.validateSEOPages();
    }
    
    async generateProblemPages(service) {
        console.log(`  🚨 ${service.problemTitle} (${service.searchVolume}+ searches/month)`);
        
        const template = fs.readFileSync('./development/templates/problem-specific-template.html', 'utf8');
        
        for (const province of this.provinces) {
            try {
                const filename = `${service.urlSlug}-${province.code}.html`;
                const filepath = `./servizi-it/${filename}`;
                
                const content = this.processProblemTemplate(template, province, service);
                fs.writeFileSync(filepath, content, 'utf8');
                
                console.log(`    ✅ ${province.name}: ${filename}`);
                this.created++;
                
            } catch (error) {
                console.error(`    ❌ ${province.name}: ${error.message}`);
                this.errors++;
            }
        }
    }
    
    async generateBusinessPages(service) {
        console.log(`  💼 ${service.serviceName} (${service.searchVolume}+ searches/month)`);
        
        const template = fs.readFileSync('./development/templates/business-services-template.html', 'utf8');
        
        for (const province of this.provinces) {
            try {
                const filename = `${service.urlSlug}-${province.code}.html`;
                const filepath = `./servizi-it/${filename}`;
                
                const content = this.processBusinessTemplate(template, province, service);
                fs.writeFileSync(filepath, content, 'utf8');
                
                console.log(`    ✅ ${province.name}: ${filename}`);
                this.created++;
                
            } catch (error) {
                console.error(`    ❌ ${province.name}: ${error.message}`);
                this.errors++;
            }
        }
    }
    
    processProblemTemplate(template, province, service) {
        let content = template;
        
        // Basic replacements
        content = content.replace(/\{\{CITY\}\}/g, province.name);
        content = content.replace(/\{\{CITY_LOWER\}\}/g, province.name.toLowerCase());
        content = content.replace(/\{\{CITY_CODE\}\}/g, province.code);
        content = content.replace(/\{\{LATITUDE\}\}/g, province.lat);
        content = content.replace(/\{\{LONGITUDE\}\}/g, province.lng);
        
        // Problem-specific replacements
        content = content.replace(/\{\{PROBLEM_TITLE\}\}/g, service.problemTitle);
        content = content.replace(/\{\{PROBLEM_KEYWORD\}\}/g, service.problemKeyword);
        content = content.replace(/\{\{SOLUTION_KEYWORD\}\}/g, service.solutionKeyword);
        content = content.replace(/\{\{SOLUTION\}\}/g, service.solution);
        content = content.replace(/\{\{TIMEFRAME\}\}/g, service.timeframe);
        content = content.replace(/\{\{URL_SLUG\}\}/g, service.urlSlug);
        content = content.replace(/\{\{PROBLEM_ICON\}\}/g, service.problemIcon);
        content = content.replace(/\{\{PROBLEM_DESCRIPTION\}\}/g, service.problemDescription);
        content = content.replace(/\{\{PROBLEM_DESCRIPTION_LONG\}\}/g, service.problemDescriptionLong);
        content = content.replace(/\{\{SOLUTION_DESCRIPTION\}\}/g, service.solutionDescription);
        content = content.replace(/\{\{SOLUTION_DESCRIPTION_LONG\}\}/g, service.solutionDescriptionLong);
        content = content.replace(/\{\{DIAGNOSIS_DESCRIPTION\}\}/g, service.diagnosisDescription);
        content = content.replace(/\{\{REPAIR_DESCRIPTION\}\}/g, service.repairDescription);
        content = content.replace(/\{\{TEST_DESCRIPTION\}\}/g, service.testDescription);
        content = content.replace(/\{\{PROBLEM_PLACEHOLDER\}\}/g, service.problemPlaceholder);
        content = content.replace(/\{\{SERVICE_CATEGORY\}\}/g, service.serviceCategory);
        content = content.replace(/\{\{SERVICE_NAME\}\}/g, service.serviceName);
        content = content.replace(/\{\{SERVICE_TYPE\}\}/g, service.serviceType);
        content = content.replace(/\{\{PROBLEM_TYPE\}\}/g, service.problemType);
        content = content.replace(/\{\{ANALYTICS_TITLE\}\}/g, service.analyticsTitle);
        
        return content;
    }
    
    processBusinessTemplate(template, province, service) {
        let content = template;
        
        // Basic replacements
        content = content.replace(/\{\{CITY\}\}/g, province.name);
        content = content.replace(/\{\{CITY_LOWER\}\}/g, province.name.toLowerCase());
        content = content.replace(/\{\{CITY_CODE\}\}/g, province.code);
        content = content.replace(/\{\{LATITUDE\}\}/g, province.lat);
        content = content.replace(/\{\{LONGITUDE\}\}/g, province.lng);
        
        // Business-specific replacements
        content = content.replace(/\{\{SERVICE_NAME\}\}/g, service.serviceName);
        content = content.replace(/\{\{SERVICE_KEYWORD\}\}/g, service.serviceKeyword);
        content = content.replace(/\{\{BUSINESS_KEYWORD\}\}/g, service.businessKeyword);
        content = content.replace(/\{\{GUARANTEE\}\}/g, service.guarantee);
        content = content.replace(/\{\{PERCENTAGE\}\}/g, service.percentage);
        content = content.replace(/\{\{URL_SLUG\}\}/g, service.urlSlug);
        content = content.replace(/\{\{SERVICE_ICON\}\}/g, service.serviceIcon);
        content = content.replace(/\{\{SERVICE_DESCRIPTION\}\}/g, service.serviceDescription);
        content = content.replace(/\{\{SERVICE_DESCRIPTION_LONG\}\}/g, service.serviceDescriptionLong);
        content = content.replace(/\{\{PROFESSIONAL_QUALIFIER\}\}/g, service.professionalQualifier);
        content = content.replace(/\{\{SOLUTION_TITLE\}\}/g, service.solutionTitle);
        content = content.replace(/\{\{SOLUTION_DESCRIPTION_LONG\}\}/g, service.solutionDescriptionLong);
        content = content.replace(/\{\{ANALYSIS_DESCRIPTION\}\}/g, service.analysisDescription);
        content = content.replace(/\{\{IMPLEMENTATION_DESCRIPTION\}\}/g, service.implementationDescription);
        content = content.replace(/\{\{TRAINING_DESCRIPTION\}\}/g, service.trainingDescription);
        content = content.replace(/\{\{SUPPORT_DESCRIPTION\}\}/g, service.supportDescription);
        content = content.replace(/\{\{PROJECT_PLACEHOLDER\}\}/g, service.projectPlaceholder);
        content = content.replace(/\{\{SERVICE_CATEGORY\}\}/g, service.serviceCategory);
        content = content.replace(/\{\{SERVICE_TYPE\}\}/g, service.serviceType);
        content = content.replace(/\{\{ANALYTICS_TITLE\}\}/g, service.analyticsTitle);
        
        return content;
    }
    
    showSummary() {
        console.log('\n📊 SEO Pages Generation Summary:');
        console.log(`✅ Pages created: ${this.created}`);
        console.log(`❌ Errors: ${this.errors}`);
        
        const totalB2C = this.problemServices.length * this.provinces.length;
        const totalB2B = this.businessServices.length * this.provinces.length;
        
        console.log(`\n📋 Breakdown:`);
        console.log(`🔧 B2C Problem Pages: ${totalB2C}`);
        console.log(`🏢 B2B Business Pages: ${totalB2B}`);
        
        // Calculate total search volume
        const b2cVolume = this.problemServices.reduce((sum, s) => sum + s.searchVolume, 0) * this.provinces.length;
        const b2bVolume = this.businessServices.reduce((sum, s) => sum + s.searchVolume, 0) * this.provinces.length;
        
        console.log(`\n🎯 Total Monthly Search Volume Targeted:`);
        console.log(`🔧 B2C: ${b2cVolume.toLocaleString()}+ searches/month`);
        console.log(`🏢 B2B: ${b2bVolume.toLocaleString()}+ searches/month`);
        console.log(`📊 TOTAL: ${(b2cVolume + b2bVolume).toLocaleString()}+ searches/month`);
        
        if (this.created > 0) {
            console.log('\n🎉 SEO-optimized pages generated successfully!');
            console.log('\n💡 Next steps:');
            console.log('1. Deploy pages to production');
            console.log('2. Submit sitemap to Google');
            console.log('3. Monitor rankings and conversions');
            console.log('4. A/B test high-traffic pages');
        }
    }
    
    validateSEOPages() {
        console.log('\n🔍 Validating SEO optimization...');
        
        let validPages = 0;
        let seoIssues = 0;
        
        // Sample validation on a few pages
        const sampleFiles = [
            'computer-non-si-accende-milano.html',
            'assistenza-informatica-ufficio-bergamo.html'
        ];
        
        sampleFiles.forEach(filename => {
            const filepath = `./servizi-it/${filename}`;
            
            if (fs.existsSync(filepath)) {
                const content = fs.readFileSync(filepath, 'utf8');
                
                // SEO validation checks
                const hasOptimizedTitle = content.includes('?') && content.includes('in ');
                const hasMetaDescription = content.includes('meta name="description"');
                const hasStructuredData = content.includes('"@type": "LocalBusiness"');
                const hasH1WithKeyword = content.includes('<h1') && content.includes('?');
                const hasEmergencyContact = content.includes('039 888 2041');
                const hasConversionTracking = content.includes('trackConversion');
                const noPlaceholders = !content.includes('{{') && !content.includes('}}');
                
                if (hasOptimizedTitle && hasMetaDescription && hasStructuredData && 
                    hasH1WithKeyword && hasEmergencyContact && hasConversionTracking && noPlaceholders) {
                    validPages++;
                    console.log(`  ✅ ${filename}: SEO optimized`);
                } else {
                    seoIssues++;
                    console.log(`  ⚠️ ${filename}: SEO issues detected`);
                    if (!hasOptimizedTitle) console.log('    - Title not optimized');
                    if (!hasH1WithKeyword) console.log('    - H1 missing keyword');
                    if (!hasEmergencyContact) console.log('    - Missing emergency contact');
                    if (!hasConversionTracking) console.log('    - Missing conversion tracking');
                    if (!noPlaceholders) console.log('    - Unprocessed placeholders');
                }
            }
        });
        
        console.log(`\n✅ SEO-optimized pages: ${validPages}`);
        console.log(`⚠️ Pages with SEO issues: ${seoIssues}`);
        
        if (seoIssues === 0) {
            console.log('\n🎉 All sampled pages passed SEO validation!');
        }
    }
}

// CLI interface
if (require.main === module) {
    const generator = new ITERASEOPagesGenerator();
    generator.generateAllSEOPages().catch(console.error);
}

module.exports = ITERASEOPagesGenerator;
