/**
 * IT-ERA KEYWORD PAGES ORCHESTRATOR
 * Sistema di orchestrazione principale che coordina SPARC e Subagent
 * per la generazione massiva di pagine keyword
 */

const SPARCKeywordPagesGenerator = require('../sparc/keyword-pages-generator');
const KeywordPagesSubagentSystem = require('../subagents/keyword-pages-subagents');
const fs = require('fs').promises;
const path = require('path');

class KeywordPagesOrchestrator {
    constructor() {
        this.sparc = new SPARCKeywordPagesGenerator();
        this.subagentSystem = new KeywordPagesSubagentSystem();
        
        this.config = {
            outputDir: './servizi-keyword/',
            batchSize: 10,
            maxConcurrentBatches: 3,
            qualityCheckEnabled: true,
            seoValidationEnabled: true,
            performanceOptimization: true
        };
        
        this.stats = {
            totalPages: 0,
            generatedPages: 0,
            failedPages: 0,
            startTime: null,
            endTime: null,
            averageGenerationTime: 0
        };
        
        this.generationQueue = [];
        this.completedPages = [];
        this.failedPages = [];
    }

    /**
     * Avvia il processo completo di generazione massiva
     */
    async startMassGeneration() {
        console.log('🚀 Starting IT-ERA Keyword Pages Mass Generation...');
        console.log('📊 Initializing SPARC methodology and Subagent system...');
        
        this.stats.startTime = Date.now();
        
        try {
            // FASE 1: SPARC Specification & Pseudocode
            console.log('\n🔍 PHASE 1: SPARC Specification & Pseudocode Generation');
            const sparcResult = await this.sparc.generateKeywordPages();
            
            this.stats.totalPages = sparcResult.totalPages;
            console.log(`✅ Generated specifications for ${this.stats.totalPages} pages`);
            
            // FASE 2: SPARC Architecture (Template Selection & Optimization)
            console.log('\n🏗️ PHASE 2: SPARC Architecture - Template Selection');
            const architectureResult = await this.generateArchitecture(sparcResult.specifications);
            console.log(`✅ Architecture defined for ${architectureResult.processedPages} pages`);
            
            // FASE 3: SPARC Refinement (Subagent Assignment & Processing)
            console.log('\n⚡ PHASE 3: SPARC Refinement - Subagent Processing');
            const refinementResult = await this.executeRefinement(architectureResult.specifications);
            console.log(`✅ Refinement completed for ${refinementResult.processedPages} pages`);
            
            // FASE 4: SPARC Completion (Final Generation & Quality Check)
            console.log('\n🎯 PHASE 4: SPARC Completion - Final Generation');
            const completionResult = await this.executeCompletion(refinementResult.specifications);
            console.log(`✅ Completion phase finished: ${completionResult.successfulPages} pages generated`);
            
            // FASE 5: Post-Processing & Validation
            console.log('\n🔍 PHASE 5: Post-Processing & Validation');
            await this.executePostProcessing();
            
            this.stats.endTime = Date.now();
            this.stats.averageGenerationTime = (this.stats.endTime - this.stats.startTime) / this.stats.generatedPages;
            
            // Report finale
            await this.generateFinalReport();
            
            console.log('\n🎉 MASS GENERATION COMPLETED SUCCESSFULLY!');
            return this.getFinalStats();
            
        } catch (error) {
            console.error('❌ Error in mass generation:', error);
            await this.handleGenerationError(error);
            throw error;
        }
    }

    /**
     * SPARC PHASE 3: ARCHITECTURE
     * Definisce l'architettura e seleziona i template appropriati
     */
    async generateArchitecture(specifications) {
        console.log('🏗️ Executing SPARC Architecture phase...');
        
        const architectureSpecs = [];
        
        for (const spec of specifications) {
            // Seleziona template basato sulla categoria
            const templateInfo = this.selectOptimalTemplate(spec);
            
            // Definisce l'architettura della pagina
            const architecture = {
                ...spec,
                architecture: {
                    template: templateInfo.template,
                    components: templateInfo.components,
                    layout: templateInfo.layout,
                    seoStructure: this.defineSEOStructure(spec),
                    leadCaptureStrategy: this.defineLeadCaptureStrategy(spec),
                    performanceOptimizations: this.definePerformanceOptimizations(spec)
                }
            };
            
            architectureSpecs.push(architecture);
        }
        
        return {
            specifications: architectureSpecs,
            processedPages: architectureSpecs.length
        };
    }

    /**
     * SPARC PHASE 4: REFINEMENT
     * Assegna task ai subagent e esegue il processing
     */
    async executeRefinement(specifications) {
        console.log('⚡ Executing SPARC Refinement phase...');
        
        // Divide le specifiche in batch per processing parallelo
        const batches = this.createProcessingBatches(specifications, this.config.batchSize);
        
        const refinedSpecs = [];
        
        for (let i = 0; i < batches.length; i += this.config.maxConcurrentBatches) {
            const currentBatches = batches.slice(i, i + this.config.maxConcurrentBatches);
            
            console.log(`📊 Processing batches ${i + 1}-${Math.min(i + this.config.maxConcurrentBatches, batches.length)} of ${batches.length}`);
            
            // Processa batch in parallelo
            const batchPromises = currentBatches.map(batch => this.processBatch(batch));
            const batchResults = await Promise.all(batchPromises);
            
            // Aggrega risultati
            for (const result of batchResults) {
                refinedSpecs.push(...result.specifications);
            }
            
            // Progress update
            console.log(`✅ Completed ${refinedSpecs.length}/${specifications.length} pages`);
        }
        
        return {
            specifications: refinedSpecs,
            processedPages: refinedSpecs.length
        };
    }

    /**
     * SPARC PHASE 5: COMPLETION
     * Genera i file finali e esegue quality check
     */
    async executeCompletion(specifications) {
        console.log('🎯 Executing SPARC Completion phase...');
        
        let successfulPages = 0;
        let failedPages = 0;
        
        // Assicura che la directory di output esista
        await this.ensureOutputDirectory();
        
        for (const spec of specifications) {
            try {
                // Genera il file HTML finale
                const htmlContent = await this.generateFinalHTML(spec);
                
                // Salva il file
                const filename = this.generateFilename(spec);
                const filepath = path.join(this.config.outputDir, filename);
                
                await fs.writeFile(filepath, htmlContent, 'utf8');
                
                // Quality check
                if (this.config.qualityCheckEnabled) {
                    const qualityResult = await this.performQualityCheck(filepath, spec);
                    if (!qualityResult.passed) {
                        console.warn(`⚠️ Quality check failed for ${filename}: ${qualityResult.issues.join(', ')}`);
                    }
                }
                
                this.completedPages.push({
                    spec: spec,
                    filename: filename,
                    filepath: filepath,
                    generatedAt: new Date().toISOString()
                });
                
                successfulPages++;
                
                if (successfulPages % 10 === 0) {
                    console.log(`📈 Progress: ${successfulPages}/${specifications.length} pages completed`);
                }
                
            } catch (error) {
                console.error(`❌ Failed to generate page for ${spec.targetKeyword}:`, error.message);
                this.failedPages.push({
                    spec: spec,
                    error: error.message,
                    failedAt: new Date().toISOString()
                });
                failedPages++;
            }
        }
        
        this.stats.generatedPages = successfulPages;
        this.stats.failedPages = failedPages;
        
        return {
            successfulPages,
            failedPages,
            totalProcessed: specifications.length
        };
    }

    /**
     * Post-processing: SEO validation, sitemap generation, etc.
     */
    async executePostProcessing() {
        console.log('🔍 Executing post-processing tasks...');
        
        const tasks = [
            this.generateSitemap(),
            this.generateRobotsEntries(),
            this.generateAnalyticsConfig(),
            this.generateNavigationUpdates(),
            this.generatePerformanceReport()
        ];
        
        await Promise.all(tasks);
        console.log('✅ Post-processing completed');
    }

    /**
     * Utility methods
     */
    selectOptimalTemplate(spec) {
        const templateMap = {
            'assistenza_aziendale': {
                template: 'business-it-support-template.html',
                components: ['enterprise-forms', 'b2b-testimonials', 'business-pricing'],
                layout: 'business-focused'
            },
            'assistenza_privati': {
                template: 'home-it-support-template.html',
                components: ['simple-booking', 'home-testimonials', 'transparent-pricing'],
                layout: 'consumer-friendly'
            },
            'riparazione_hardware': {
                template: 'hardware-repair-template.html',
                components: ['diagnostic-tools', 'repair-gallery', 'warranty-info'],
                layout: 'technical-focused'
            },
            'assemblaggio_computer': {
                template: 'computer-assembly-template.html',
                components: ['configurator', 'build-gallery', 'custom-quotes'],
                layout: 'product-focused'
            },
            'servizi_specializzati': {
                template: 'specialized-services-template.html',
                components: ['expertise-showcase', 'consultation-booking', 'case-studies'],
                layout: 'expertise-focused'
            }
        };
        
        return templateMap[spec.category] || templateMap['assistenza_privati'];
    }

    defineSEOStructure(spec) {
        return {
            titleTag: spec.seo.title,
            metaDescription: spec.seo.metaDescription,
            h1: spec.seo.h1,
            headingStructure: ['h1', 'h2', 'h2', 'h2', 'h3', 'h3'],
            schemaMarkup: ['LocalBusiness', 'Service', 'Organization'],
            internalLinks: this.generateInternalLinks(spec),
            canonicalUrl: spec.seo.canonicalUrl
        };
    }

    defineLeadCaptureStrategy(spec) {
        const strategies = {
            'assistenza_aziendale': {
                primary: 'business-consultation-form',
                secondary: 'phone-cta',
                exitIntent: 'enterprise-whitepaper'
            },
            'assistenza_privati': {
                primary: 'simple-booking-form',
                secondary: 'phone-cta',
                exitIntent: 'discount-popup'
            }
        };
        
        return strategies[spec.category] || strategies['assistenza_privati'];
    }

    definePerformanceOptimizations(spec) {
        return {
            criticalCSS: true,
            lazyLoading: true,
            imageOptimization: true,
            minification: true,
            caching: true,
            cdnDelivery: true
        };
    }

    createProcessingBatches(specifications, batchSize) {
        const batches = [];
        for (let i = 0; i < specifications.length; i += batchSize) {
            batches.push(specifications.slice(i, i + batchSize));
        }
        return batches;
    }

    async processBatch(batch) {
        const processedSpecs = [];
        
        for (const spec of batch) {
            // Simula il processing del subagent
            const processedSpec = await this.subagentSystem.assignTask(spec);
            processedSpecs.push(processedSpec || spec);
        }
        
        return {
            specifications: processedSpecs,
            batchSize: batch.length
        };
    }

    async generateFinalHTML(spec) {
        // Carica il template appropriato
        const templatePath = path.join('./development/templates/', spec.architecture.template);
        let template = await fs.readFile(templatePath, 'utf8');
        
        // Sostituisce i placeholder con i dati reali
        template = this.replacePlaceholders(template, spec);
        
        return template;
    }

    replacePlaceholders(template, spec) {
        const locationCoords = this.getLocationCoordinates(spec.location);

        const replacements = {
            '{{SEO_TITLE}}': spec.seo?.title || `${spec.keyword} ${spec.location} - IT-ERA`,
            '{{SEO_DESCRIPTION}}': spec.seo?.metaDescription || `${spec.keyword} professionale a ${spec.location}. Contatta IT-ERA per assistenza specializzata.`,
            '{{SEO_KEYWORDS}}': spec.seo?.secondaryKeywords?.join(', ') || spec.keyword,
            '{{CANONICAL_URL}}': spec.seo?.canonicalUrl || `https://it-era.it/${this.generateSlug(spec.keyword)}.html`,
            '{{PRIMARY_KEYWORD}}': spec.keyword || 'Servizi IT',
            '{{LOCATION}}': spec.location || 'Milano',
            '{{SERVICE_NAME}}': spec.keyword || 'Servizi IT',
            '{{SERVICE_CATEGORY}}': this.getCategoryDisplayName(spec.category),
            '{{LOCATION_SLUG}}': this.generateSlug(spec.location),
            '{{LOCATION_LAT}}': locationCoords.lat,
            '{{LOCATION_LNG}}': locationCoords.lng,
            '{{MAIN_BENEFIT}}': this.generateMainBenefit(spec),
            '{{CLIENTS_COUNT}}': this.getClientsCount(spec.location),
            '{{HOME_CLIENTS_COUNT}}': this.getHomeClientsCount(spec.location),
            '{{REPAIRS_COUNT}}': this.getRepairsCount(spec.location),
            '{{ASSEMBLIES_COUNT}}': this.getAssembliesCount(spec.location),
            '{{PROJECTS_COUNT}}': this.getProjectsCount(spec.location),
            '{{RESPONSE_TIME}}': this.getResponseTime(spec.category)
        };

        let result = template;

        // Replace simple placeholders
        for (const [placeholder, value] of Object.entries(replacements)) {
            result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value || '');
        }

        // Remove complex template structures that aren't implemented
        result = result.replace(/\{\{#SERVICES\}\}[\s\S]*?\{\{\/SERVICES\}\}/g, '');
        result = result.replace(/\{\{#FEATURES\}\}[\s\S]*?\{\{\/FEATURES\}\}/g, '');
        result = result.replace(/\{\{#TESTIMONIALS\}\}[\s\S]*?\{\{\/TESTIMONIALS\}\}/g, '');
        result = result.replace(/\{\{#BENEFITS\}\}[\s\S]*?\{\{\/BENEFITS\}\}/g, '');
        result = result.replace(/\{\{#PROCESS_STEPS\}\}[\s\S]*?\{\{\/PROCESS_STEPS\}\}/g, '');
        result = result.replace(/\{\{#PRICING_PLANS\}\}[\s\S]*?\{\{\/PRICING_PLANS\}\}/g, '');
        result = result.replace(/\{\{#POPULAR\}\}[\s\S]*?\{\{\/POPULAR\}\}/g, '');
        result = result.replace(/\{\{\^POPULAR\}\}[\s\S]*?\{\{\/POPULAR\}\}/g, '');
        result = result.replace(/\{\{#FAQ\}\}[\s\S]*?\{\{\/FAQ\}\}/g, '');
        result = result.replace(/\{\{#LOCATIONS\}\}[\s\S]*?\{\{\/LOCATIONS\}\}/g, '');

        // Remove simple placeholders
        result = result.replace(/\{\{ICON\}\}/g, '🔧');
        result = result.replace(/\{\{NAME\}\}/g, 'Servizio IT');
        result = result.replace(/\{\{DESCRIPTION\}\}/g, 'Servizio professionale IT-ERA');
        result = result.replace(/\{\{FEATURE\}\}/g, 'Servizio incluso');
        result = result.replace(/\{\{TITLE\}\}/g, 'Servizio Professionale');
        result = result.replace(/\{\{STEP_NUMBER\}\}/g, '1');
        result = result.replace(/\{\{QUESTION\}\}/g, 'Domanda frequente');
        result = result.replace(/\{\{ANSWER\}\}/g, 'Risposta professionale del team IT-ERA');

        // Remove any remaining placeholders
        result = result.replace(/\{\{[^}]*\}\}/g, '');

        return result;
    }

    generateMainBenefit(spec) {
        const benefits = {
            'assistenza_aziendale': 'Massima produttività aziendale garantita',
            'assistenza_privati': 'Risolviamo ogni problema informatico',
            'riparazione_hardware': 'Riparazione professionale con garanzia',
            'assemblaggio_computer': 'Computer su misura per le tue esigenze',
            'servizi_specializzati': 'Expertise tecnica di alto livello'
        };
        
        return benefits[spec.category] || benefits['assistenza_privati'];
    }

    getClientsCount(location) {
        const counts = {
            'Milano': '500+',
            'Bergamo': '200+',
            'Monza': '150+',
            'Brescia': '180+'
        };
        
        return counts[location] || '100+';
    }

    getResponseTime(category) {
        const times = {
            'assistenza_aziendale': '< 2 ore',
            'assistenza_privati': '< 4 ore',
            'riparazione_hardware': '< 24 ore',
            'assemblaggio_computer': '3-5 giorni',
            'servizi_specializzati': '< 24 ore'
        };

        return times[category] || '< 24 ore';
    }

    getHomeClientsCount(location) {
        const counts = {
            'Milano': '300+',
            'Bergamo': '150+',
            'Monza': '120+',
            'Brescia': '140+'
        };

        return counts[location] || '80+';
    }

    getRepairsCount(location) {
        const counts = {
            'Milano': '800+',
            'Bergamo': '400+',
            'Monza': '300+',
            'Brescia': '350+'
        };

        return counts[location] || '200+';
    }

    getAssembliesCount(location) {
        const counts = {
            'Milano': '250+',
            'Bergamo': '120+',
            'Monza': '90+',
            'Brescia': '110+'
        };

        return counts[location] || '60+';
    }

    getProjectsCount(location) {
        const counts = {
            'Milano': '150+',
            'Bergamo': '80+',
            'Monza': '60+',
            'Brescia': '70+'
        };

        return counts[location] || '40+';
    }

    getCategoryDisplayName(category) {
        const names = {
            'assistenza_aziendale': 'Assistenza Aziendale',
            'assistenza_privati': 'Assistenza Privati',
            'riparazione_hardware': 'Riparazione Hardware',
            'assemblaggio_computer': 'Assemblaggio Computer',
            'servizi_specializzati': 'Servizi Specializzati'
        };

        return names[category] || 'Servizi IT';
    }

    generateSlug(text) {
        return text.toLowerCase()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[ñ]/g, 'n')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    getLocationCoordinates(location) {
        const coordinates = {
            'Milano': { lat: '45.4642', lng: '9.1900' },
            'Bergamo': { lat: '45.6983', lng: '9.6773' },
            'Monza': { lat: '45.5845', lng: '9.2744' },
            'Brescia': { lat: '45.5416', lng: '10.2118' },
            'Como': { lat: '45.8081', lng: '9.0852' },
            'Varese': { lat: '45.8206', lng: '8.8251' },
            'Pavia': { lat: '45.1847', lng: '9.1582' },
            'Cremona': { lat: '45.1335', lng: '10.0422' },
            'Mantova': { lat: '45.1564', lng: '10.7914' },
            'Lecco': { lat: '45.8566', lng: '9.3931' },
            'Sondrio': { lat: '46.1712', lng: '9.8728' },
            'Lodi': { lat: '45.3142', lng: '9.5034' }
        };

        return coordinates[location] || coordinates['Milano'];
    }

    generateFilename(spec) {
        const slug = this.sparc.generateSlug(spec.targetKeyword);
        return `${slug}.html`;
    }

    async ensureOutputDirectory() {
        try {
            await fs.access(this.config.outputDir);
        } catch {
            await fs.mkdir(this.config.outputDir, { recursive: true });
            console.log(`📁 Created output directory: ${this.config.outputDir}`);
        }
    }

    async performQualityCheck(filepath, spec) {
        // Implementa controlli di qualità
        const content = await fs.readFile(filepath, 'utf8');
        const issues = [];
        
        // Check SEO basics
        if (!content.includes('<title>')) issues.push('Missing title tag');
        if (!content.includes('meta name="description"')) issues.push('Missing meta description');
        if (!content.includes('<h1>')) issues.push('Missing H1 tag');
        
        // Check content length
        const textContent = content.replace(/<[^>]*>/g, '');
        if (textContent.length < 1000) issues.push('Content too short');
        
        return {
            passed: issues.length === 0,
            issues: issues
        };
    }

    generateInternalLinks(spec) {
        return [
            '/servizi.html',
            '/contatti.html',
            `/settori/${spec.category}.html`,
            `/zone/${this.sparc.generateSlug(spec.location)}/index.html`
        ];
    }

    async generateSitemap() {
        const sitemapEntries = this.completedPages.map(page => {
            return `  <url>
    <loc>https://it-era.it/${page.filename}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
        }).join('\n');
        
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>`;
        
        await fs.writeFile('./sitemap-keyword-pages.xml', sitemap);
        console.log('📄 Generated sitemap for keyword pages');
    }

    async generateRobotsEntries() {
        const entries = this.completedPages.map(page => `Allow: /${page.filename}`).join('\n');
        await fs.writeFile('./robots-keyword-pages.txt', entries);
        console.log('🤖 Generated robots.txt entries');
    }

    async generateAnalyticsConfig() {
        const config = {
            keywordPages: this.completedPages.map(page => ({
                url: `/${page.filename}`,
                category: page.spec.category,
                keyword: page.spec.targetKeyword,
                location: page.spec.location
            }))
        };
        
        await fs.writeFile('./analytics-keyword-pages-config.json', JSON.stringify(config, null, 2));
        console.log('📊 Generated analytics configuration');
    }

    async generateNavigationUpdates() {
        // Genera suggerimenti per aggiornamenti di navigazione
        const navUpdates = {
            newServicePages: this.completedPages.length,
            categories: [...new Set(this.completedPages.map(p => p.spec.category))],
            locations: [...new Set(this.completedPages.map(p => p.spec.location))]
        };
        
        await fs.writeFile('./navigation-updates.json', JSON.stringify(navUpdates, null, 2));
        console.log('🧭 Generated navigation update suggestions');
    }

    async generatePerformanceReport() {
        const report = {
            totalPages: this.stats.totalPages,
            generatedPages: this.stats.generatedPages,
            failedPages: this.stats.failedPages,
            successRate: ((this.stats.generatedPages / this.stats.totalPages) * 100).toFixed(2) + '%',
            totalTime: this.stats.endTime - this.stats.startTime,
            averageTimePerPage: this.stats.averageGenerationTime,
            generatedAt: new Date().toISOString()
        };
        
        await fs.writeFile('./performance-report.json', JSON.stringify(report, null, 2));
        console.log('📈 Generated performance report');
    }

    async generateFinalReport() {
        const report = `
# IT-ERA KEYWORD PAGES GENERATION REPORT

## Summary
- **Total Pages Specified**: ${this.stats.totalPages}
- **Successfully Generated**: ${this.stats.generatedPages}
- **Failed**: ${this.stats.failedPages}
- **Success Rate**: ${((this.stats.generatedPages / this.stats.totalPages) * 100).toFixed(2)}%

## Performance
- **Total Time**: ${((this.stats.endTime - this.stats.startTime) / 1000 / 60).toFixed(2)} minutes
- **Average Time per Page**: ${(this.stats.averageGenerationTime / 1000).toFixed(2)} seconds

## Generated Files
- HTML Pages: ${this.stats.generatedPages}
- Sitemap: sitemap-keyword-pages.xml
- Robots entries: robots-keyword-pages.txt
- Analytics config: analytics-keyword-pages-config.json
- Navigation updates: navigation-updates.json

## Next Steps
1. Review generated pages for quality
2. Update main sitemap.xml with new entries
3. Configure analytics tracking
4. Update navigation menus
5. Test all pages for functionality

Generated on: ${new Date().toISOString()}
`;
        
        await fs.writeFile('./KEYWORD-PAGES-GENERATION-REPORT.md', report);
        console.log('📋 Generated final report: KEYWORD-PAGES-GENERATION-REPORT.md');
    }

    getFinalStats() {
        return {
            ...this.stats,
            completedPages: this.completedPages.length,
            failedPages: this.failedPages.length,
            successRate: ((this.stats.generatedPages / this.stats.totalPages) * 100).toFixed(2) + '%'
        };
    }

    async handleGenerationError(error) {
        const errorReport = {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            stats: this.stats,
            completedPages: this.completedPages.length,
            failedPages: this.failedPages.length
        };
        
        await fs.writeFile('./error-report.json', JSON.stringify(errorReport, null, 2));
        console.log('💾 Error report saved to error-report.json');
    }
}

// Export per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeywordPagesOrchestrator;
}

// Auto-initialize se eseguito direttamente
if (typeof window === 'undefined' && require.main === module) {
    const orchestrator = new KeywordPagesOrchestrator();
    orchestrator.startMassGeneration().then(stats => {
        console.log('\n🎉 FINAL STATS:', stats);
    }).catch(console.error);
}
