#!/usr/bin/env node
/**
 * IT-ERA Swarm Agents Configuration
 * Specialized agents for systematic HTML to Node.js conversion
 */

const fs = require('fs');
const path = require('path');

class SwarmOrchestrator {
    constructor() {
        this.agents = {
            architecture: new ArchitectureAgent(),
            migration: new MigrationAgent(),
            seo: new SEOAgent(),
            testing: new TestingAgent(),
            cleanup: new CleanupAgent()
        };
        
        this.projectRoot = process.cwd();
        this.webDir = path.join(this.projectRoot, 'web');
        this.backupDir = path.join(this.projectRoot, 'backups');
        this.conversionLog = [];
    }

    async initialize() {
        console.log('🚀 Initializing IT-ERA Conversion Swarm...');
        
        // Create backup directory
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
        
        // Initialize each agent
        for (const [name, agent] of Object.entries(this.agents)) {
            console.log(`🤖 Initializing ${name} agent...`);
            await agent.initialize(this.projectRoot);
        }
        
        console.log('✅ Swarm initialization complete');
    }

    async executeConversionPlan() {
        const batches = [
            {
                name: 'Core Pages',
                files: ['index.html', 'servizi.html', 'contatti.html', 'chi-siamo.html'],
                priority: 1
            },
            {
                name: 'Sectoral Pages',
                files: ['settori-studi-legali.html', 'settori-commercialisti.html', 'settori-studi-medici.html', 'settori-pmi-startup.html'],
                priority: 2
            },
            {
                name: 'Major Cities',
                files: ['assistenza-it-milano.html', 'assistenza-it-bergamo.html', 'assistenza-it-brescia.html', 'assistenza-it-como.html', 'assistenza-it-varese.html'],
                priority: 3
            }
        ];

        for (const batch of batches) {
            console.log(`\n📦 Processing batch: ${batch.name}`);
            await this.processBatch(batch);
        }
    }

    async processBatch(batch) {
        // 1. Architecture Agent: Plan conversion
        const conversionPlan = await this.agents.architecture.planConversion(batch.files);
        
        // 2. Create backup
        await this.createBatchBackup(batch);
        
        // 3. Migration Agent: Convert files
        const convertedFiles = await this.agents.migration.convertBatch(batch.files, conversionPlan);
        
        // 4. SEO Agent: Preserve SEO elements
        await this.agents.seo.preserveSEOElements(convertedFiles);
        
        // 5. Testing Agent: Validate conversion
        const testResults = await this.agents.testing.validateBatch(convertedFiles);
        
        if (testResults.success) {
            // 6. Cleanup Agent: Remove old files
            await this.agents.cleanup.cleanupBatch(batch.files);
            console.log(`✅ Batch ${batch.name} converted successfully`);
        } else {
            console.error(`❌ Batch ${batch.name} failed validation:`, testResults.errors);
            await this.rollbackBatch(batch);
        }
    }

    async createBatchBackup(batch) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `batch-${batch.name}-${timestamp}`);
        
        fs.mkdirSync(backupPath, { recursive: true });
        
        for (const file of batch.files) {
            const sourcePath = path.join(this.webDir, file);
            const backupFilePath = path.join(backupPath, file);
            
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, backupFilePath);
            }
        }
        
        console.log(`💾 Backup created: ${backupPath}`);
    }

    async rollbackBatch(batch) {
        console.log(`🔄 Rolling back batch: ${batch.name}`);
        // Implementation for rollback logic
    }
}

class ArchitectureAgent {
    async initialize(projectRoot) {
        this.projectRoot = projectRoot;
        this.routingMap = new Map();
        this.templateStructure = {};
    }

    async planConversion(files) {
        console.log('🏗️ Architecture Agent: Planning conversion...');
        
        const plan = {
            routes: [],
            templates: [],
            middleware: [],
            staticAssets: []
        };

        for (const file of files) {
            const route = this.generateRoute(file);
            const template = this.generateTemplate(file);
            
            plan.routes.push(route);
            plan.templates.push(template);
        }

        return plan;
    }

    generateRoute(htmlFile) {
        const routePath = htmlFile.replace('.html', '').replace('index', '');
        return {
            path: `/${routePath}`,
            method: 'GET',
            handler: `render${this.toPascalCase(routePath)}`,
            template: htmlFile.replace('.html', '.ejs')
        };
    }

    generateTemplate(htmlFile) {
        return {
            name: htmlFile.replace('.html', '.ejs'),
            layout: 'layout.ejs',
            sections: ['header', 'main', 'footer']
        };
    }

    toPascalCase(str) {
        return str.replace(/(^\w|-\w)/g, (match) => 
            match.replace('-', '').toUpperCase()
        );
    }
}

class MigrationAgent {
    async initialize(projectRoot) {
        this.projectRoot = projectRoot;
        this.templatesDir = path.join(projectRoot, 'views');
        
        if (!fs.existsSync(this.templatesDir)) {
            fs.mkdirSync(this.templatesDir, { recursive: true });
        }
    }

    async convertBatch(files, conversionPlan) {
        console.log('🔄 Migration Agent: Converting HTML to templates...');
        
        const convertedFiles = [];
        
        for (const file of files) {
            const converted = await this.convertHTMLToTemplate(file, conversionPlan);
            convertedFiles.push(converted);
        }
        
        return convertedFiles;
    }

    async convertHTMLToTemplate(htmlFile, plan) {
        const htmlPath = path.join(this.projectRoot, 'web', htmlFile);
        const templatePath = path.join(this.templatesDir, htmlFile.replace('.html', '.ejs'));
        
        if (!fs.existsSync(htmlPath)) {
            console.warn(`⚠️ File not found: ${htmlPath}`);
            return null;
        }
        
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        // Convert to EJS template
        const templateContent = this.convertToEJS(htmlContent);
        
        fs.writeFileSync(templatePath, templateContent);
        
        console.log(`✅ Converted: ${htmlFile} → ${path.basename(templatePath)}`);
        
        return {
            original: htmlFile,
            template: templatePath,
            route: plan.routes.find(r => r.template === htmlFile.replace('.html', '.ejs'))
        };
    }

    convertToEJS(htmlContent) {
        // Extract and convert dynamic elements
        let ejsContent = htmlContent;
        
        // Convert meta tags to dynamic
        ejsContent = ejsContent.replace(
            /<title>(.*?)<\/title>/g,
            '<title><%= pageTitle || "IT-ERA" %></title>'
        );
        
        ejsContent = ejsContent.replace(
            /<meta name="description" content="(.*?)">/g,
            '<meta name="description" content="<%= pageDescription || \'$1\' %>">'
        );
        
        // Convert navigation to include
        ejsContent = ejsContent.replace(
            /<nav[^>]*>[\s\S]*?<\/nav>/g,
            '<%- include(\'partials/navigation\') %>'
        );
        
        // Convert footer to include
        ejsContent = ejsContent.replace(
            /<footer[^>]*>[\s\S]*?<\/footer>/g,
            '<%- include(\'partials/footer\') %>'
        );
        
        return ejsContent;
    }
}

class SEOAgent {
    async initialize(projectRoot) {
        this.projectRoot = projectRoot;
        this.seoData = {};
    }

    async preserveSEOElements(convertedFiles) {
        console.log('🔍 SEO Agent: Preserving SEO elements...');
        
        for (const file of convertedFiles) {
            if (file) {
                await this.extractAndPreserveSEO(file);
            }
        }
    }

    async extractAndPreserveSEO(file) {
        // Extract SEO data from original HTML
        const originalPath = path.join(this.projectRoot, 'web', file.original);
        
        if (fs.existsSync(originalPath)) {
            const content = fs.readFileSync(originalPath, 'utf8');
            
            const seoData = {
                title: this.extractTitle(content),
                description: this.extractDescription(content),
                keywords: this.extractKeywords(content),
                canonical: this.extractCanonical(content),
                ogTags: this.extractOGTags(content),
                structuredData: this.extractStructuredData(content)
            };
            
            this.seoData[file.original] = seoData;
            console.log(`📊 SEO data preserved for: ${file.original}`);
        }
    }

    extractTitle(content) {
        const match = content.match(/<title>(.*?)<\/title>/);
        return match ? match[1] : '';
    }

    extractDescription(content) {
        const match = content.match(/<meta name="description" content="(.*?)">/);
        return match ? match[1] : '';
    }

    extractKeywords(content) {
        const match = content.match(/<meta name="keywords" content="(.*?)">/);
        return match ? match[1] : '';
    }

    extractCanonical(content) {
        const match = content.match(/<link rel="canonical" href="(.*?)">/);
        return match ? match[1] : '';
    }

    extractOGTags(content) {
        const ogTags = {};
        const matches = content.matchAll(/<meta property="og:(\w+)" content="(.*?)">/g);
        
        for (const match of matches) {
            ogTags[match[1]] = match[2];
        }
        
        return ogTags;
    }

    extractStructuredData(content) {
        const matches = content.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
        const structuredData = [];
        
        for (const match of matches) {
            try {
                structuredData.push(JSON.parse(match[1]));
            } catch (e) {
                console.warn('Invalid JSON-LD found');
            }
        }
        
        return structuredData;
    }
}

class TestingAgent {
    async initialize(projectRoot) {
        this.projectRoot = projectRoot;
    }

    async validateBatch(convertedFiles) {
        console.log('🧪 Testing Agent: Validating conversions...');
        
        const results = {
            success: true,
            errors: [],
            warnings: []
        };

        for (const file of convertedFiles) {
            if (file) {
                const validation = await this.validateConversion(file);
                
                if (!validation.success) {
                    results.success = false;
                    results.errors.push(...validation.errors);
                }
                
                results.warnings.push(...validation.warnings);
            }
        }

        return results;
    }

    async validateConversion(file) {
        const validation = {
            success: true,
            errors: [],
            warnings: []
        };

        // Check if template file exists
        if (!fs.existsSync(file.template)) {
            validation.success = false;
            validation.errors.push(`Template file not found: ${file.template}`);
        }

        // Validate EJS syntax
        try {
            const content = fs.readFileSync(file.template, 'utf8');
            // Basic EJS syntax validation
            if (content.includes('<%') && !content.includes('%>')) {
                validation.warnings.push(`Potential EJS syntax issue in: ${file.template}`);
            }
        } catch (error) {
            validation.success = false;
            validation.errors.push(`Error reading template: ${error.message}`);
        }

        return validation;
    }
}

class CleanupAgent {
    async initialize(projectRoot) {
        this.projectRoot = projectRoot;
        this.cleanupLog = [];
    }

    async cleanupBatch(files) {
        console.log('🧹 Cleanup Agent: Removing obsolete files...');
        
        for (const file of files) {
            await this.cleanupFile(file);
        }
    }

    async cleanupFile(htmlFile) {
        const filePath = path.join(this.projectRoot, 'web', htmlFile);
        
        if (fs.existsSync(filePath)) {
            // Move to cleanup directory instead of deleting
            const cleanupDir = path.join(this.projectRoot, 'cleanup');
            if (!fs.existsSync(cleanupDir)) {
                fs.mkdirSync(cleanupDir, { recursive: true });
            }
            
            const cleanupPath = path.join(cleanupDir, htmlFile);
            fs.renameSync(filePath, cleanupPath);
            
            this.cleanupLog.push({
                original: filePath,
                moved: cleanupPath,
                timestamp: new Date().toISOString()
            });
            
            console.log(`🗑️ Moved to cleanup: ${htmlFile}`);
        }
    }
}

// Export for use
module.exports = { SwarmOrchestrator };

// CLI execution
if (require.main === module) {
    const orchestrator = new SwarmOrchestrator();
    
    orchestrator.initialize()
        .then(() => orchestrator.executeConversionPlan())
        .catch(console.error);
}
