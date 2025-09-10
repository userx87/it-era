#!/usr/bin/env node

/**
 * IT-ERA Batch Page Converter
 * Converts all 1,069 pages to new component-based system using parallel processing
 */

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

// Simple color functions as fallback
const colors = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`
};

class BatchConverter {
    constructor() {
        this.projectRoot = process.cwd();
        this.publicDir = path.join(this.projectRoot, 'public');
        this.srcDir = path.join(this.projectRoot, 'src');
        
        this.stats = {
            startTime: Date.now(),
            totalPages: 0,
            pagesProcessed: 0,
            pagesConverted: 0,
            pagesSkipped: 0,
            errors: 0,
            warnings: 0
        };
        
        // Worker pool configuration
        this.maxWorkers = Math.min(os.cpus().length, 8);
        this.workers = [];
        this.taskQueue = [];
        this.activeJobs = 0;
        
        // Load component templates
        this.components = {};
    }
    
    async convert() {
        console.log(colors.blue('\n🚀 IT-ERA Batch Page Converter Starting...\n'));
        console.log(colors.gray(`Using ${this.maxWorkers} worker threads for parallel processing\n`));
        
        try {
            await this.loadComponents();
            await this.discoverPages();
            await this.processPages();
            await this.generateReport();
            
            console.log(colors.green('\n✅ Batch conversion completed successfully!\n'));
        } catch (error) {
            console.error(colors.red('\n❌ Batch conversion failed:'), error.message);
            process.exit(1);
        }
    }
    
    async loadComponents() {
        console.log(colors.blue('📦 Loading component templates...'));
        
        try {
            // Load header component
            if (await fs.pathExists(path.join(this.srcDir, 'components/layout/header.html'))) {
                this.components.header = await fs.readFile(
                    path.join(this.srcDir, 'components/layout/header.html'),
                    'utf8'
                );
            } else {
                this.components.header = this.getFallbackHeader();
            }
            
            // Load footer component
            if (await fs.pathExists(path.join(this.srcDir, 'components/layout/footer.html'))) {
                this.components.footer = await fs.readFile(
                    path.join(this.srcDir, 'components/layout/footer.html'),
                    'utf8'
                );
            } else {
                this.components.footer = this.getFallbackFooter();
            }
            
            // Load base template
            if (await fs.pathExists(path.join(this.srcDir, 'pages/templates/base.html'))) {
                this.components.baseTemplate = await fs.readFile(
                    path.join(this.srcDir, 'pages/templates/base.html'),
                    'utf8'
                );
            } else {
                this.components.baseTemplate = this.getFallbackTemplate();
            }
            
            console.log(colors.green('✅ Components loaded'));
        } catch (error) {
            console.log(colors.yellow('⚠️  Using fallback components'));
            this.components.header = this.getFallbackHeader();
            this.components.footer = this.getFallbackFooter();
            this.components.baseTemplate = this.getFallbackTemplate();
        }
    }
    
    getFallbackHeader() {
        return `
<header class="itera-header">
    <div class="container">
        <div class="header-content">
            <div class="header-brand">
                <a href="/" class="brand-link">
                    <span class="brand-text">IT-ERA</span>
                </a>
            </div>
            <nav class="header-nav">
                <ul class="nav-list">
                    <li><a href="/assistenza-informatica.html" class="nav-link">Assistenza IT</a></li>
                    <li><a href="/cybersecurity.html" class="nav-link">Cybersecurity</a></li>
                    <li><a href="/cloud-storage.html" class="nav-link">Cloud Storage</a></li>
                    <li><a href="/backup-disaster-recovery.html" class="nav-link">Backup & DR</a></li>
                    <li><a href="/claude-flow/dashboard.html" class="nav-link nav-link--claude">
                        <i class="fas fa-robot"></i> Claude Flow
                    </a></li>
                </ul>
            </nav>
            <div class="header-actions">
                <a href="/contatti.html" class="btn btn-primary">Contattaci</a>
            </div>
        </div>
    </div>
</header>`;
    }
    
    getFallbackFooter() {
        return `
<footer class="itera-footer">
    <div class="container">
        <div class="footer-content">
            <div class="footer-section">
                <h3>IT-ERA</h3>
                <p>Assistenza IT professionale in Lombardia</p>
                <p>📞 039 888 2041 | ✉️ info@it-era.it</p>
            </div>
            <div class="footer-section">
                <h3>Servizi</h3>
                <ul>
                    <li><a href="/assistenza-informatica.html">Assistenza IT</a></li>
                    <li><a href="/cybersecurity.html">Cybersecurity</a></li>
                    <li><a href="/cloud-storage.html">Cloud Storage</a></li>
                    <li><a href="/backup-disaster-recovery.html">Backup & DR</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h3>AI & Automazione</h3>
                <ul>
                    <li><a href="/claude-flow/dashboard.html">Claude Flow Dashboard</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2024 IT-ERA. Tutti i diritti riservati.</p>
        </div>
    </div>
</footer>`;
    }
    
    getFallbackTemplate() {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} | IT-ERA</title>
    <meta name="description" content="{{description}}">
    <meta name="keywords" content="{{keywords}}">
    
    <!-- CSS -->
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
<body>
    {{header}}
    <main role="main">
        {{content}}
    </main>
    {{footer}}
    
    <!-- Claude Flow Integration -->
    <div id="chat-widget"></div>
    
    <!-- JavaScript -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/js/main.js"></script>
    
    <!-- Claude Flow Scripts -->
    <script src="/claude-flow/claude-flow-dashboard.js"></script>
</body>
</html>`;
    }
    
    async discoverPages() {
        console.log(colors.blue('🔍 Discovering pages to convert...'));
        
        // Find all HTML files
        const htmlFiles = [];
        
        // Core pages
        const corePages = [
            'index.html',
            'assistenza-informatica.html',
            'cybersecurity.html',
            'cloud-storage.html',
            'backup-disaster-recovery.html',
            'contatti.html',
            'chi-siamo.html',
            'privacy-policy.html',
            'terms-of-service.html'
        ];
        
        for (const page of corePages) {
            const pagePath = path.join(this.publicDir, page);
            if (await fs.pathExists(pagePath)) {
                htmlFiles.push({
                    path: pagePath,
                    relativePath: page,
                    type: 'core',
                    priority: 1
                });
            }
        }
        
        // Generated pages
        const generatedDir = path.join(this.publicDir, 'pages-generated');
        if (await fs.pathExists(generatedDir)) {
            const generatedFiles = await fs.readdir(generatedDir);
            for (const file of generatedFiles) {
                if (file.endsWith('.html')) {
                    htmlFiles.push({
                        path: path.join(generatedDir, file),
                        relativePath: `pages-generated/${file}`,
                        type: 'generated',
                        priority: 2
                    });
                }
            }
        }
        
        // Other HTML files in root
        const rootFiles = await fs.readdir(this.publicDir);
        for (const file of rootFiles) {
            if (file.endsWith('.html') && !corePages.includes(file)) {
                const filePath = path.join(this.publicDir, file);
                const stat = await fs.stat(filePath);
                if (stat.isFile()) {
                    htmlFiles.push({
                        path: filePath,
                        relativePath: file,
                        type: 'other',
                        priority: 3
                    });
                }
            }
        }
        
        // Sort by priority
        htmlFiles.sort((a, b) => a.priority - b.priority);
        
        this.taskQueue = htmlFiles;
        this.stats.totalPages = htmlFiles.length;
        
        console.log(colors.green(`✅ Found ${htmlFiles.length} pages to convert`));
        console.log(colors.gray(`  Core pages: ${htmlFiles.filter(f => f.type === 'core').length}`));
        console.log(colors.gray(`  Generated pages: ${htmlFiles.filter(f => f.type === 'generated').length}`));
        console.log(colors.gray(`  Other pages: ${htmlFiles.filter(f => f.type === 'other').length}`));
    }
    
    async processPages() {
        console.log(colors.blue('\n🔄 Processing pages in parallel...\n'));
        
        // Process pages in batches to avoid overwhelming the system
        const batchSize = 50;
        const batches = [];
        
        for (let i = 0; i < this.taskQueue.length; i += batchSize) {
            batches.push(this.taskQueue.slice(i, i + batchSize));
        }
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(colors.blue(`Processing batch ${i + 1}/${batches.length} (${batch.length} pages)...`));
            
            const promises = batch.map(page => this.convertPage(page));
            const results = await Promise.allSettled(promises);
            
            // Process results
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    if (result.value.converted) {
                        this.stats.pagesConverted++;
                    } else {
                        this.stats.pagesSkipped++;
                    }
                } else {
                    this.stats.errors++;
                    console.log(colors.red(`❌ Error processing ${batch[index].relativePath}: ${result.reason.message}`));
                }
                this.stats.pagesProcessed++;
            });
            
            // Progress update
            const progress = ((this.stats.pagesProcessed / this.stats.totalPages) * 100).toFixed(1);
            console.log(colors.gray(`Progress: ${this.stats.pagesProcessed}/${this.stats.totalPages} (${progress}%)`));
            
            // Small delay between batches to prevent overwhelming the system
            if (i < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }
    
    async convertPage(pageInfo) {
        try {
            const originalContent = await fs.readFile(pageInfo.path, 'utf8');
            
            // Skip if already converted (has our header component)
            if (originalContent.includes('itera-header')) {
                return { converted: false, reason: 'already_converted' };
            }
            
            const $ = cheerio.load(originalContent);
            
            // Extract page metadata
            const pageData = {
                title: this.extractTitle($),
                description: this.extractDescription($),
                keywords: this.extractKeywords($)
            };
            
            // Extract main content
            const mainContent = this.extractMainContent($);
            
            // Create new page with components
            const newPage = this.components.baseTemplate
                .replace('{{title}}', pageData.title)
                .replace('{{description}}', pageData.description)
                .replace('{{keywords}}', pageData.keywords)
                .replace('{{header}}', this.components.header)
                .replace('{{footer}}', this.components.footer)
                .replace('{{content}}', mainContent);
            
            // Save converted page
            await fs.writeFile(pageInfo.path, newPage, 'utf8');
            
            return { converted: true };
            
        } catch (error) {
            throw new Error(`Failed to convert ${pageInfo.relativePath}: ${error.message}`);
        }
    }
    
    extractTitle($) {
        let title = $('title').text();
        if (title) {
            title = title.replace(' | IT-ERA', '').trim();
        }
        
        if (!title) {
            title = $('h1').first().text().trim();
        }
        
        return title || 'IT-ERA';
    }
    
    extractDescription($) {
        let description = $('meta[name="description"]').attr('content');
        
        if (!description) {
            // Try to extract from first paragraph
            const firstP = $('p').first().text().trim();
            if (firstP && firstP.length > 50) {
                description = firstP.substring(0, 160) + '...';
            }
        }
        
        return description || 'Assistenza IT professionale in Lombardia';
    }
    
    extractKeywords($) {
        return $('meta[name="keywords"]').attr('content') || 'assistenza it, supporto tecnico, lombardia';
    }
    
    extractMainContent($) {
        // Remove existing header/footer/nav elements
        $('header, nav, footer, .navbar, .header, .footer').remove();
        $('script').remove();
        $('link[rel="stylesheet"]').remove();
        $('style').remove();
        
        // Get main content
        let mainContent = $('main').html();
        
        if (!mainContent) {
            // Try to get body content
            mainContent = $('body').html();
        }
        
        if (!mainContent) {
            // Fallback to entire content
            mainContent = $.html();
        }
        
        // Clean up the content
        return this.cleanupContent(mainContent);
    }
    
    cleanupContent(content) {
        if (!content) return '';
        
        const $ = cheerio.load(content);
        
        // Remove empty elements
        $('*').each(function() {
            if ($(this).is(':empty') && !$(this).is('img, br, hr, input, meta, link')) {
                $(this).remove();
            }
        });
        
        // Add Bootstrap classes to common elements
        $('button').addClass('btn');
        $('table').addClass('table table-striped');
        $('img').addClass('img-fluid');
        
        // Wrap content in container if not already wrapped
        const html = $.html();
        if (!html.includes('container')) {
            return `<div class="container py-5">${html}</div>`;
        }
        
        return html;
    }
    
    async generateReport() {
        const endTime = Date.now();
        const duration = endTime - this.stats.startTime;
        
        console.log(colors.blue('\n📊 Batch Conversion Report:'));
        console.log(colors.gray(`Duration: ${Math.round(duration / 1000)}s`));
        console.log(colors.gray(`Total pages: ${this.stats.totalPages}`));
        console.log(colors.gray(`Pages processed: ${this.stats.pagesProcessed}`));
        console.log(colors.green(`Pages converted: ${this.stats.pagesConverted}`));
        console.log(colors.yellow(`Pages skipped: ${this.stats.pagesSkipped}`));
        console.log(colors.red(`Errors: ${this.stats.errors}`));
        
        const successRate = this.stats.totalPages > 0 ? 
            ((this.stats.pagesConverted / this.stats.totalPages) * 100).toFixed(1) : 0;
        console.log(colors.blue(`Success rate: ${successRate}%`));
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            duration: duration,
            stats: this.stats,
            successRate: successRate + '%'
        };
        
        await fs.writeJson(
            path.join(this.projectRoot, 'build-report.json'),
            report,
            { spaces: 2 }
        );
        
        console.log(colors.gray('\n📄 Detailed report saved to build-report.json'));
    }
}

// Run batch converter if called directly
if (require.main === module) {
    const converter = new BatchConverter();
    converter.convert().catch(console.error);
}

module.exports = BatchConverter;
