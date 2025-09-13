#!/usr/bin/env node

/**
 * IT-ERA SWARM EXECUTION SCRIPT
 * Main entry point for running the multi-agent optimization system
 */

const SwarmOrchestrator = require('./swarm/orchestrator');
const fs = require('fs');
const path = require('path');

class SwarmRunner {
    constructor() {
        this.config = {
            dryRun: process.argv.includes('--dry-run'),
            batchSize: this.getBatchSize(),
            maxPages: this.getMaxPages(),
            categories: this.getCategories(),
            verbose: process.argv.includes('--verbose')
        };
    }
    
    getBatchSize() {
        const batchArg = process.argv.find(arg => arg.startsWith('--batch-size='));
        return batchArg ? parseInt(batchArg.split('=')[1]) : 50;
    }
    
    getMaxPages() {
        const maxArg = process.argv.find(arg => arg.startsWith('--max-pages='));
        return maxArg ? parseInt(maxArg.split('=')[1]) : null;
    }
    
    getCategories() {
        const catArg = process.argv.find(arg => arg.startsWith('--categories='));
        return catArg ? catArg.split('=')[1].split(',') : null;
    }
    
    async run() {
        console.log('🚀 IT-ERA Multi-Agent Swarm System Starting...\n');
        
        // Display configuration
        this.displayConfiguration();
        
        // Check prerequisites
        await this.checkPrerequisites();
        
        // Initialize orchestrator
        const orchestrator = new SwarmOrchestrator();
        
        // Override config if needed
        if (this.config.batchSize !== 50) {
            orchestrator.config.batchSize = this.config.batchSize;
        }
        
        try {
            if (this.config.dryRun) {
                console.log('🧪 DRY RUN MODE - No files will be modified\n');
                await this.runDryRun(orchestrator);
            } else {
                console.log('⚡ LIVE MODE - Files will be modified\n');
                await orchestrator.execute();
            }
            
            console.log('\n🎉 Swarm execution completed successfully!');
            this.displayResults();
            
        } catch (error) {
            console.error('\n💥 Swarm execution failed:', error.message);
            if (this.config.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }
    
    displayConfiguration() {
        console.log('⚙️ Configuration:');
        console.log(`   • Mode: ${this.config.dryRun ? 'DRY RUN' : 'LIVE'}`);
        console.log(`   • Batch Size: ${this.config.batchSize} pages`);
        console.log(`   • Max Pages: ${this.config.maxPages || 'All'}`);
        console.log(`   • Categories: ${this.config.categories?.join(', ') || 'All'}`);
        console.log(`   • Verbose: ${this.config.verbose ? 'Yes' : 'No'}`);
        console.log('');
    }
    
    async checkPrerequisites() {
        console.log('🔍 Checking prerequisites...');
        
        // Check if servizi-keyword directory exists
        if (!fs.existsSync('./servizi-keyword')) {
            throw new Error('servizi-keyword directory not found. Please run from project root.');
        }
        
        // Check if required directories exist
        const requiredDirs = ['./css', './js'];
        requiredDirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`   ✅ Created directory: ${dir}`);
            }
        });
        
        // Check if Node modules are installed
        if (!fs.existsSync('./swarm/node_modules')) {
            console.log('   📦 Installing dependencies...');
            const { execSync } = require('child_process');
            try {
                execSync('cd swarm && npm install', { stdio: 'inherit' });
                console.log('   ✅ Dependencies installed');
            } catch (error) {
                throw new Error('Failed to install dependencies. Please run: cd swarm && npm install');
            }
        }
        
        console.log('✅ Prerequisites check passed\n');
    }
    
    async runDryRun(orchestrator) {
        console.log('🧪 Running analysis without modifications...\n');
        
        const pages = await orchestrator.initialize();
        const samplePages = pages.slice(0, Math.min(10, pages.length));
        
        console.log(`📊 Analyzing sample of ${samplePages.length} pages...\n`);
        
        // Run only content review agent for dry run
        const contentReviewAgent = require('./swarm/agents/content-review-agent');
        const results = await contentReviewAgent.analyze(samplePages);
        
        console.log('\n📋 Dry Run Results:');
        console.log(`   • Pages analyzed: ${results.pagesAnalyzed}`);
        console.log(`   • Total issues found: ${results.summary.totalIssues}`);
        console.log(`   • High priority issues: ${results.summary.issuesBySeverity.high}`);
        console.log(`   • Medium priority issues: ${results.summary.issuesBySeverity.medium}`);
        console.log(`   • Low priority issues: ${results.summary.issuesBySeverity.low}`);
        
        // Save dry run results
        const dryRunPath = './swarm/output/dry-run-results.json';
        if (!fs.existsSync('./swarm/output')) {
            fs.mkdirSync('./swarm/output', { recursive: true });
        }
        fs.writeFileSync(dryRunPath, JSON.stringify(results, null, 2));
        console.log(`\n💾 Dry run results saved to: ${dryRunPath}`);
    }
    
    displayResults() {
        const outputDir = './swarm/output';
        const logsDir = './swarm/logs';
        
        console.log('\n📊 Results Location:');
        if (fs.existsSync(path.join(outputDir, 'final-report.json'))) {
            console.log(`   • Final Report: ${outputDir}/final-report.json`);
            console.log(`   • Summary: ${outputDir}/summary.md`);
        }
        
        if (fs.existsSync(logsDir)) {
            const logFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.json'));
            console.log(`   • Batch Logs: ${logFiles.length} files in ${logsDir}/`);
        }
        
        if (fs.existsSync('./css/it-era-enhanced.css')) {
            console.log(`   • Enhanced CSS: ./css/it-era-enhanced.css`);
        }
        
        console.log('\n💡 Next Steps:');
        console.log('   1. Review the final report and summary');
        console.log('   2. Test the enhanced pages in a browser');
        console.log('   3. Commit and deploy the changes');
        console.log('   4. Monitor performance and user engagement');
    }
}

// Help text
function showHelp() {
    console.log(`
IT-ERA Multi-Agent Swarm System

Usage: node run-swarm.js [options]

Options:
  --dry-run              Run analysis only, don't modify files
  --batch-size=N         Process N pages per batch (default: 50)
  --max-pages=N          Limit processing to N pages total
  --categories=cat1,cat2 Only process specific categories
  --verbose              Show detailed error information
  --help                 Show this help message

Examples:
  node run-swarm.js --dry-run
  node run-swarm.js --batch-size=25 --max-pages=100
  node run-swarm.js --categories=business-it-support,hardware-repair
  node run-swarm.js --verbose

Categories:
  - business-it-support
  - hardware-repair
  - computer-assembly
  - specialized-services
  - home-it-support
`);
}

// Main execution
if (require.main === module) {
    if (process.argv.includes('--help')) {
        showHelp();
        process.exit(0);
    }
    
    const runner = new SwarmRunner();
    runner.run().catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = SwarmRunner;
