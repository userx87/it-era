#!/usr/bin/env node
/**
 * IT-ERA Page Analysis Script
 * Catalogs all existing HTML pages and extracts SEO data
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class PageAnalyzer {
    constructor() {
        this.webDir = path.join(process.cwd(), 'web');
        this.outputDir = path.join(process.cwd(), 'data');
        this.pages = [];
        this.seoData = {};
        this.urlStructure = {};
        
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async analyzeAllPages() {
        console.log('🔍 Starting comprehensive page analysis...');
        
        // Find all HTML files
        await this.findHTMLFiles(this.webDir);
        
        console.log(`📊 Found ${this.pages.length} HTML pages to analyze`);
        
        // Analyze each page
        for (const page of this.pages) {
            await this.analyzePage(page);
        }
        
        // Generate reports
        await this.generateReports();
        
        console.log('✅ Analysis complete!');
    }

    async findHTMLFiles(dir, relativePath = '') {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const relativeItemPath = path.join(relativePath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Skip certain directories
                if (!['node_modules', '.git', 'temp', 'backup'].includes(item)) {
                    await this.findHTMLFiles(fullPath, relativeItemPath);
                }
            } else if (item.endsWith('.html')) {
                this.pages.push({
                    filename: item,
                    relativePath: relativeItemPath,
                    fullPath: fullPath,
                    directory: relativePath || 'root'
                });
            }
        }
    }

    async analyzePage(page) {
        try {
            const content = fs.readFileSync(page.fullPath, 'utf8');
            const dom = new JSDOM(content);
            const document = dom.window.document;
            
            // Extract SEO data
            const seoData = this.extractSEOData(document);
            
            // Extract page structure
            const structure = this.extractPageStructure(document);
            
            // Extract dependencies
            const dependencies = this.extractDependencies(document);
            
            // Generate URL from filename
            const url = this.generateURL(page.filename);
            
            const analysis = {
                ...page,
                url: url,
                seo: seoData,
                structure: structure,
                dependencies: dependencies,
                fileSize: fs.statSync(page.fullPath).size,
                lastModified: fs.statSync(page.fullPath).mtime
            };
            
            this.seoData[page.filename] = seoData;
            this.urlStructure[url] = analysis;
            
            console.log(`✅ Analyzed: ${page.filename} → ${url}`);
            
        } catch (error) {
            console.error(`❌ Error analyzing ${page.filename}:`, error.message);
        }
    }

    extractSEOData(document) {
        const getMetaContent = (name) => {
            const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
            return meta ? meta.getAttribute('content') : '';
        };

        const title = document.querySelector('title');
        const canonical = document.querySelector('link[rel="canonical"]');
        
        // Extract Open Graph tags
        const ogTags = {};
        const ogMetas = document.querySelectorAll('meta[property^="og:"]');
        ogMetas.forEach(meta => {
            const property = meta.getAttribute('property').replace('og:', '');
            ogTags[property] = meta.getAttribute('content');
        });
        
        // Extract structured data
        const structuredData = [];
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        jsonLdScripts.forEach(script => {
            try {
                structuredData.push(JSON.parse(script.textContent));
            } catch (e) {
                console.warn('Invalid JSON-LD found');
            }
        });

        return {
            title: title ? title.textContent.trim() : '',
            description: getMetaContent('description'),
            keywords: getMetaContent('keywords'),
            canonical: canonical ? canonical.getAttribute('href') : '',
            ogTags: ogTags,
            structuredData: structuredData,
            robots: getMetaContent('robots'),
            viewport: getMetaContent('viewport')
        };
    }

    extractPageStructure(document) {
        const structure = {
            headings: {},
            navigation: null,
            footer: null,
            forms: [],
            images: [],
            links: []
        };

        // Extract headings
        for (let i = 1; i <= 6; i++) {
            const headings = document.querySelectorAll(`h${i}`);
            structure.headings[`h${i}`] = Array.from(headings).map(h => h.textContent.trim());
        }

        // Extract navigation
        const nav = document.querySelector('nav');
        if (nav) {
            structure.navigation = {
                html: nav.outerHTML.substring(0, 500) + '...',
                links: Array.from(nav.querySelectorAll('a')).map(a => ({
                    text: a.textContent.trim(),
                    href: a.getAttribute('href')
                }))
            };
        }

        // Extract footer
        const footer = document.querySelector('footer');
        if (footer) {
            structure.footer = {
                html: footer.outerHTML.substring(0, 500) + '...',
                links: Array.from(footer.querySelectorAll('a')).map(a => ({
                    text: a.textContent.trim(),
                    href: a.getAttribute('href')
                }))
            };
        }

        // Extract forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
                type: input.type || input.tagName.toLowerCase(),
                name: input.getAttribute('name'),
                id: input.getAttribute('id'),
                required: input.hasAttribute('required')
            }));
            
            structure.forms.push({
                action: form.getAttribute('action'),
                method: form.getAttribute('method'),
                inputs: inputs
            });
        });

        // Extract images
        const images = document.querySelectorAll('img');
        structure.images = Array.from(images).map(img => ({
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            loading: img.getAttribute('loading')
        }));

        // Extract external links
        const links = document.querySelectorAll('a[href^="http"]');
        structure.links = Array.from(links).map(link => ({
            href: link.getAttribute('href'),
            text: link.textContent.trim(),
            target: link.getAttribute('target')
        }));

        return structure;
    }

    extractDependencies(document) {
        const dependencies = {
            css: [],
            js: [],
            fonts: [],
            external: []
        };

        // CSS dependencies
        const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
        cssLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                if (href.startsWith('http')) {
                    dependencies.external.push({ type: 'css', url: href });
                } else {
                    dependencies.css.push(href);
                }
            }
        });

        // JavaScript dependencies
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            const src = script.getAttribute('src');
            if (src) {
                if (src.startsWith('http')) {
                    dependencies.external.push({ type: 'js', url: src });
                } else {
                    dependencies.js.push(src);
                }
            }
        });

        // Font dependencies
        const fontLinks = document.querySelectorAll('link[href*="fonts"]');
        fontLinks.forEach(link => {
            dependencies.fonts.push(link.getAttribute('href'));
        });

        return dependencies;
    }

    generateURL(filename) {
        if (filename === 'index.html') return '/';
        return '/' + filename.replace('.html', '');
    }

    async generateReports() {
        console.log('📊 Generating analysis reports...');

        // SEO Data Report
        fs.writeFileSync(
            path.join(this.outputDir, 'seo-data.json'),
            JSON.stringify(this.seoData, null, 2)
        );

        // URL Structure Report
        fs.writeFileSync(
            path.join(this.outputDir, 'url-structure.json'),
            JSON.stringify(this.urlStructure, null, 2)
        );

        // Page Catalog
        const catalog = {
            totalPages: this.pages.length,
            pagesByDirectory: this.groupPagesByDirectory(),
            pagesByType: this.categorizePages(),
            conversionPriority: this.generateConversionPriority(),
            summary: this.generateSummary()
        };

        fs.writeFileSync(
            path.join(this.outputDir, 'page-catalog.json'),
            JSON.stringify(catalog, null, 2)
        );

        // Conversion Plan
        const conversionPlan = this.generateConversionPlan();
        fs.writeFileSync(
            path.join(this.outputDir, 'conversion-plan.json'),
            JSON.stringify(conversionPlan, null, 2)
        );

        // Human-readable report
        await this.generateMarkdownReport(catalog);

        console.log('📁 Reports saved to /data/ directory');
    }

    groupPagesByDirectory() {
        const grouped = {};
        this.pages.forEach(page => {
            const dir = page.directory || 'root';
            if (!grouped[dir]) grouped[dir] = [];
            grouped[dir].push(page.filename);
        });
        return grouped;
    }

    categorizePages() {
        const categories = {
            core: [],
            sectoral: [],
            cities: [],
            services: [],
            blog: [],
            other: []
        };

        this.pages.forEach(page => {
            const filename = page.filename.toLowerCase();
            
            if (['index.html', 'servizi.html', 'contatti.html', 'chi-siamo.html'].includes(filename)) {
                categories.core.push(filename);
            } else if (filename.includes('settori-') || filename.includes('studi-') || filename.includes('commercialisti')) {
                categories.sectoral.push(filename);
            } else if (filename.includes('assistenza-it-') && !filename.includes('aziendale')) {
                categories.cities.push(filename);
            } else if (filename.includes('sicurezza-') || filename.includes('cloud-') || filename.includes('backup-') || filename.includes('microsoft-') || filename.includes('voip-')) {
                categories.services.push(filename);
            } else if (filename.includes('blog/') || page.directory.includes('blog')) {
                categories.blog.push(filename);
            } else {
                categories.other.push(filename);
            }
        });

        return categories;
    }

    generateConversionPriority() {
        const priority = {
            high: [],
            medium: [],
            low: []
        };

        const categories = this.categorizePages();
        
        priority.high = [...categories.core, ...categories.sectoral.slice(0, 4)];
        priority.medium = [...categories.cities.slice(0, 10), ...categories.services.slice(0, 6)];
        priority.low = [...categories.cities.slice(10), ...categories.services.slice(6), ...categories.blog, ...categories.other];

        return priority;
    }

    generateSummary() {
        const categories = this.categorizePages();
        
        return {
            totalPages: this.pages.length,
            corePages: categories.core.length,
            sectoralPages: categories.sectoral.length,
            cityPages: categories.cities.length,
            servicePages: categories.services.length,
            blogPages: categories.blog.length,
            otherPages: categories.other.length,
            estimatedConversionTime: this.estimateConversionTime()
        };
    }

    estimateConversionTime() {
        const categories = this.categorizePages();
        
        // Time estimates in hours
        const timePerPage = {
            core: 3,      // Complex pages with forms, etc.
            sectoral: 2,  // Template-based pages
            cities: 1,    // Simple template pages
            services: 2,  // Service description pages
            blog: 1,      // Simple content pages
            other: 1.5    // Miscellaneous pages
        };

        const totalHours = 
            categories.core.length * timePerPage.core +
            categories.sectoral.length * timePerPage.sectoral +
            categories.cities.length * timePerPage.cities +
            categories.services.length * timePerPage.services +
            categories.blog.length * timePerPage.blog +
            categories.other.length * timePerPage.other;

        return {
            totalHours: totalHours,
            estimatedDays: Math.ceil(totalHours / 8),
            estimatedWeeks: Math.ceil(totalHours / 40)
        };
    }

    generateConversionPlan() {
        const priority = this.generateConversionPriority();
        
        return {
            phase1: {
                name: "Core Pages & Foundation",
                pages: priority.high,
                estimatedTime: "3-5 days",
                description: "Convert homepage, main service pages, and key sectoral pages"
            },
            phase2: {
                name: "Major Cities & Services",
                pages: priority.medium,
                estimatedTime: "5-7 days", 
                description: "Convert major city pages and specialized service pages"
            },
            phase3: {
                name: "Remaining Content",
                pages: priority.low,
                estimatedTime: "7-10 days",
                description: "Convert remaining city pages, blog posts, and miscellaneous content"
            },
            totalEstimate: "15-22 days"
        };
    }

    async generateMarkdownReport(catalog) {
        const report = `# IT-ERA Page Analysis Report

## Summary
- **Total Pages**: ${catalog.totalPages}
- **Core Pages**: ${catalog.summary.corePages}
- **Sectoral Pages**: ${catalog.summary.sectoralPages}
- **City Pages**: ${catalog.summary.cityPages}
- **Service Pages**: ${catalog.summary.servicePages}
- **Blog Pages**: ${catalog.summary.blogPages}
- **Other Pages**: ${catalog.summary.otherPages}

## Conversion Timeline
- **Estimated Hours**: ${catalog.summary.estimatedConversionTime.totalHours}
- **Estimated Days**: ${catalog.summary.estimatedConversionTime.estimatedDays}
- **Estimated Weeks**: ${catalog.summary.estimatedConversionTime.estimatedWeeks}

## Conversion Priority

### High Priority (Phase 1)
${catalog.conversionPriority.high.map(page => `- ${page}`).join('\n')}

### Medium Priority (Phase 2)
${catalog.conversionPriority.medium.slice(0, 10).map(page => `- ${page}`).join('\n')}
${catalog.conversionPriority.medium.length > 10 ? `... and ${catalog.conversionPriority.medium.length - 10} more` : ''}

### Low Priority (Phase 3)
${catalog.conversionPriority.low.slice(0, 10).map(page => `- ${page}`).join('\n')}
${catalog.conversionPriority.low.length > 10 ? `... and ${catalog.conversionPriority.low.length - 10} more` : ''}

## Pages by Directory
${Object.entries(catalog.pagesByDirectory).map(([dir, pages]) => 
    `### ${dir}\n${pages.slice(0, 5).map(page => `- ${page}`).join('\n')}${pages.length > 5 ? `\n... and ${pages.length - 5} more` : ''}`
).join('\n\n')}

Generated on: ${new Date().toISOString()}
`;

        fs.writeFileSync(
            path.join(this.outputDir, 'analysis-report.md'),
            report
        );
    }
}

// CLI execution
if (require.main === module) {
    const analyzer = new PageAnalyzer();
    analyzer.analyzeAllPages().catch(console.error);
}

module.exports = { PageAnalyzer };
