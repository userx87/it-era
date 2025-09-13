#!/usr/bin/env node

/**
 * IT-ERA PAGE OPTIMIZATION SWARM ORCHESTRATOR
 * Coordinates 4 specialized agents to enhance all 469 keyword pages
 */

const fs = require('fs');
const path = require('path');

class SwarmOrchestrator {
    constructor() {
        this.config = {
            batchSize: 50,
            keywordPagesDir: './servizi-keyword',
            outputDir: './swarm/output',
            logDir: './swarm/logs',
            priorityCategories: [
                'business-it-support',
                'hardware-repair', 
                'computer-assembly',
                'specialized-services',
                'home-it-support'
            ]
        };
        
        this.agents = {
            contentReview: require('./agents/content-review-agent'),
            designEnhancement: require('./agents/design-enhancement-agent'),
            contentEnhancement: require('./agents/content-enhancement-agent'),
            technicalImplementation: require('./agents/technical-implementation-agent')
        };
        
        this.state = {
            totalPages: 0,
            processedPages: 0,
            currentBatch: 0,
            errors: [],
            reports: {}
        };
        
        this.initializeDirectories();
    }
    
    initializeDirectories() {
        [this.config.outputDir, this.config.logDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    async initialize() {
        console.log('🚀 IT-ERA Page Optimization Swarm Initializing...\n');
        
        // Get all keyword pages
        const pages = this.getKeywordPages();
        this.state.totalPages = pages.length;
        
        console.log(`📄 Found ${this.state.totalPages} keyword pages to optimize`);
        console.log(`📦 Processing in batches of ${this.config.batchSize}`);
        console.log(`🎯 Priority categories: ${this.config.priorityCategories.join(', ')}\n`);
        
        return pages;
    }
    
    getKeywordPages() {
        if (!fs.existsSync(this.config.keywordPagesDir)) {
            throw new Error(`Keyword pages directory not found: ${this.config.keywordPagesDir}`);
        }
        
        const files = fs.readdirSync(this.config.keywordPagesDir)
            .filter(file => file.endsWith('.html'))
            .map(file => ({
                filename: file,
                path: path.join(this.config.keywordPagesDir, file),
                category: this.categorizeFile(file),
                priority: this.getPriority(file)
            }));
        
        // Sort by priority (high priority first)
        return files.sort((a, b) => b.priority - a.priority);
    }
    
    categorizeFile(filename) {
        if (filename.includes('assistenza-informatica-aziende') || filename.includes('supporto-it-aziendale')) {
            return 'business-it-support';
        } else if (filename.includes('riparazione-') || filename.includes('sostituzione-')) {
            return 'hardware-repair';
        } else if (filename.includes('assemblaggio-') || filename.includes('computer-su-misura')) {
            return 'computer-assembly';
        } else if (filename.includes('recupero-dati') || filename.includes('sicurezza-informatica')) {
            return 'specialized-services';
        } else {
            return 'home-it-support';
        }
    }
    
    getPriority(filename) {
        const category = this.categorizeFile(filename);
        const priorityIndex = this.config.priorityCategories.indexOf(category);
        return priorityIndex >= 0 ? (5 - priorityIndex) : 1;
    }
    
    async processBatch(pages, batchNumber) {
        console.log(`\n🔄 Processing Batch ${batchNumber + 1}/${Math.ceil(this.state.totalPages / this.config.batchSize)}`);
        console.log(`📄 Pages: ${pages.map(p => p.filename).join(', ')}`);
        
        const batchResults = {
            batchNumber: batchNumber + 1,
            pages: pages.length,
            results: {},
            errors: [],
            timestamp: new Date().toISOString()
        };
        
        try {
            // Phase 1: Content Review Agent
            console.log('📊 Phase 1: Content Review Analysis...');
            const contentReviewResults = await this.agents.contentReview.analyze(pages);
            batchResults.results.contentReview = contentReviewResults;
            
            // Phase 2: Design Enhancement Agent
            console.log('🎨 Phase 2: Design Enhancement Planning...');
            const designResults = await this.agents.designEnhancement.enhance(pages, contentReviewResults);
            batchResults.results.designEnhancement = designResults;
            
            // Phase 3: Content Enhancement Agent
            console.log('✍️ Phase 3: Content Enhancement...');
            const contentResults = await this.agents.contentEnhancement.enhance(pages, contentReviewResults);
            batchResults.results.contentEnhancement = contentResults;
            
            // Phase 4: Technical Implementation Agent
            console.log('⚙️ Phase 4: Technical Implementation...');
            const techResults = await this.agents.technicalImplementation.implement(pages, {
                contentReview: contentReviewResults,
                design: designResults,
                content: contentResults
            });
            batchResults.results.technicalImplementation = techResults;
            
            console.log(`✅ Batch ${batchNumber + 1} completed successfully`);
            
        } catch (error) {
            console.error(`❌ Error in batch ${batchNumber + 1}:`, error.message);
            batchResults.errors.push(error.message);
        }
        
        // Save batch results
        const batchLogPath = path.join(this.config.logDir, `batch-${batchNumber + 1}-results.json`);
        fs.writeFileSync(batchLogPath, JSON.stringify(batchResults, null, 2));
        
        return batchResults;
    }
    
    async execute() {
        try {
            const pages = await this.initialize();
            const batches = this.createBatches(pages);
            
            console.log(`🎯 Starting optimization of ${this.state.totalPages} pages in ${batches.length} batches\n`);
            
            const allResults = [];
            
            for (let i = 0; i < batches.length; i++) {
                const batchResult = await this.processBatch(batches[i], i);
                allResults.push(batchResult);
                
                this.state.currentBatch = i + 1;
                this.state.processedPages += batches[i].length;
                
                // Progress update
                const progress = ((this.state.processedPages / this.state.totalPages) * 100).toFixed(1);
                console.log(`📈 Progress: ${progress}% (${this.state.processedPages}/${this.state.totalPages} pages)`);
                
                // Small delay between batches
                if (i < batches.length - 1) {
                    console.log('⏳ Waiting 2 seconds before next batch...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            // Generate final report
            await this.generateFinalReport(allResults);
            
            console.log('\n🎉 IT-ERA Page Optimization Swarm Completed Successfully!');
            console.log(`📊 Final Report: ${path.join(this.config.outputDir, 'final-report.json')}`);
            
        } catch (error) {
            console.error('💥 Swarm execution failed:', error);
            throw error;
        }
    }
    
    createBatches(pages) {
        const batches = [];
        for (let i = 0; i < pages.length; i += this.config.batchSize) {
            batches.push(pages.slice(i, i + this.config.batchSize));
        }
        return batches;
    }
    
    async generateFinalReport(allResults) {
        const finalReport = {
            summary: {
                totalPages: this.state.totalPages,
                processedPages: this.state.processedPages,
                totalBatches: allResults.length,
                completionRate: ((this.state.processedPages / this.state.totalPages) * 100).toFixed(1) + '%',
                executionTime: new Date().toISOString()
            },
            batchResults: allResults,
            aggregatedStats: this.calculateAggregatedStats(allResults)
        };
        
        const reportPath = path.join(this.config.outputDir, 'final-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
        
        // Generate human-readable summary
        const summaryPath = path.join(this.config.outputDir, 'summary.md');
        const summaryContent = this.generateSummaryMarkdown(finalReport);
        fs.writeFileSync(summaryPath, summaryContent);
        
        return finalReport;
    }
    
    calculateAggregatedStats(allResults) {
        // Implementation for aggregating statistics across all batches
        return {
            totalIssuesFound: 0,
            totalIssuesFixed: 0,
            categoriesProcessed: this.config.priorityCategories.length,
            averageProcessingTime: 0
        };
    }
    
    generateSummaryMarkdown(report) {
        return `# IT-ERA Page Optimization Report

## Summary
- **Total Pages**: ${report.summary.totalPages}
- **Processed Pages**: ${report.summary.processedPages}
- **Completion Rate**: ${report.summary.completionRate}
- **Execution Time**: ${report.summary.executionTime}

## Results
${report.batchResults.map((batch, i) => `
### Batch ${i + 1}
- Pages processed: ${batch.pages}
- Status: ${batch.errors.length === 0 ? '✅ Success' : '❌ Errors'}
`).join('')}

Generated by IT-ERA Swarm System
`;
    }
}

// Export for use as module
module.exports = SwarmOrchestrator;

// Run if called directly
if (require.main === module) {
    const orchestrator = new SwarmOrchestrator();
    orchestrator.execute().catch(console.error);
}
