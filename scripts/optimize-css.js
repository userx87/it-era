#!/usr/bin/env node

/**
 * IT-ERA CSS Optimization Script
 * Minifies CSS, removes unused code, implements critical CSS
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class CSSOptimizer {
    constructor() {
        this.cssFiles = [
            'web/css/unified-styles.css',
            'web/css/enhanced-chatbot.css'
        ];
        this.criticalCSS = '';
        this.optimizedCSS = new Map();
    }

    async optimize() {
        console.log('🎨 Starting CSS optimization...');
        
        // 1. Analyze and minify CSS files
        for (const cssFile of this.cssFiles) {
            await this.processCSSFile(cssFile);
        }
        
        // 2. Extract critical CSS
        await this.extractCriticalCSS();
        
        // 3. Create optimized versions
        await this.createOptimizedVersions();
        
        // 4. Update HTML files with critical CSS
        await this.updateHTMLFiles();
        
        console.log('✅ CSS optimization completed!');
    }

    async processCSSFile(cssFile) {
        const filePath = path.join(projectRoot, cssFile);
        
        try {
            const content = await fs.readFile(filePath, 'utf8');
            console.log(`📄 Processing ${cssFile}...`);
            
            // Basic minification
            const minified = this.minifyCSS(content);
            
            // Remove unused CSS (basic implementation)
            const cleaned = this.removeUnusedCSS(minified);
            
            this.optimizedCSS.set(cssFile, cleaned);
            
            // Save minified version
            const minifiedPath = filePath.replace('.css', '.min.css');
            await fs.writeFile(minifiedPath, cleaned);
            
            console.log(`✅ Minified ${cssFile} -> ${path.basename(minifiedPath)}`);
            
        } catch (error) {
            console.error(`❌ Error processing ${cssFile}:`, error.message);
        }
    }

    minifyCSS(css) {
        return css
            // Remove comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            // Remove whitespace around selectors and properties
            .replace(/\s*{\s*/g, '{')
            .replace(/;\s*/g, ';')
            .replace(/}\s*/g, '}')
            .replace(/:\s*/g, ':')
            .replace(/,\s*/g, ',')
            // Remove trailing semicolons
            .replace(/;}/g, '}')
            .trim();
    }

    removeUnusedCSS(css) {
        // Basic unused CSS removal - remove obvious unused selectors
        const unusedSelectors = [
            '.unused-class',
            '.old-component',
            '.deprecated'
        ];
        
        let cleaned = css;
        unusedSelectors.forEach(selector => {
            const regex = new RegExp(`${selector.replace('.', '\\.')}[^}]*}`, 'g');
            cleaned = cleaned.replace(regex, '');
        });
        
        return cleaned;
    }

    async extractCriticalCSS() {
        console.log('🔍 Extracting critical CSS...');
        
        // Critical CSS for above-the-fold content
        this.criticalCSS = `
/* IT-ERA Critical CSS - Above the fold */
:root{--primary:#0056cc;--primary-light:#3374d4;--primary-dark:#003d99;--secondary:#00b336;--white:#ffffff;--gray-800:#212529;--font-family-primary:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:var(--font-family-primary);font-size:16px;line-height:1.6;color:var(--gray-800);background-color:var(--white);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;padding-top:76px}
.navbar{position:fixed;top:0;left:0;right:0;z-index:1030;background:var(--white)!important;box-shadow:0 2px 4px rgba(0,0,0,.1);transition:all .3s ease}
.hero{background:linear-gradient(135deg,var(--primary) 0%,var(--primary-dark) 100%);color:var(--white);padding:80px 0;text-align:center}
.btn-primary{background:var(--primary);border-color:var(--primary);color:var(--white);padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;transition:all .3s ease}
.btn-primary:hover{background:var(--primary-dark);transform:translateY(-2px)}
.container{max-width:1200px;margin:0 auto;padding:0 15px}
.text-center{text-align:center}
.d-none{display:none}
@media (max-width:768px){.container{padding:0 10px}.hero{padding:60px 0}}
        `.trim();
    }

    async createOptimizedVersions() {
        console.log('📦 Creating optimized CSS bundles...');
        
        // Create combined and minified CSS
        let combinedCSS = '';
        for (const [file, content] of this.optimizedCSS) {
            combinedCSS += `/* ${file} */\n${content}\n\n`;
        }
        
        // Save combined CSS
        const combinedPath = path.join(projectRoot, 'web/css/combined.min.css');
        await fs.writeFile(combinedPath, combinedCSS);
        
        // Save critical CSS
        const criticalPath = path.join(projectRoot, 'web/css/critical.min.css');
        await fs.writeFile(criticalPath, this.criticalCSS);
        
        console.log('✅ Created optimized CSS bundles');
    }

    async updateHTMLFiles() {
        console.log('🔄 Updating HTML files with critical CSS...');
        
        const htmlFiles = await this.findHTMLFiles();
        
        for (const htmlFile of htmlFiles) {
            await this.updateHTMLFile(htmlFile);
        }
    }

    async findHTMLFiles() {
        const webDir = path.join(projectRoot, 'web');
        const files = await fs.readdir(webDir);
        return files
            .filter(file => file.endsWith('.html'))
            .map(file => path.join(webDir, file));
    }

    async updateHTMLFile(htmlFile) {
        try {
            let content = await fs.readFile(htmlFile, 'utf8');
            
            // Check if critical CSS is already injected
            if (content.includes('/* IT-ERA Critical CSS')) {
                return;
            }
            
            // Inject critical CSS in head
            const criticalCSSTag = `
    <!-- IT-ERA Critical CSS -->
    <style>
${this.criticalCSS}
    </style>`;
            
            // Insert before closing head tag
            content = content.replace('</head>', `${criticalCSSTag}\n</head>`);
            
            // Make main CSS load asynchronously
            content = content.replace(
                /<link[^>]*href="[^"]*unified-styles\.css"[^>]*>/g,
                '<link rel="preload" href="css/combined.min.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">\n    <noscript><link rel="stylesheet" href="css/combined.min.css"></noscript>'
            );
            
            await fs.writeFile(htmlFile, content);
            console.log(`✅ Updated ${path.basename(htmlFile)}`);
            
        } catch (error) {
            console.error(`❌ Error updating ${htmlFile}:`, error.message);
        }
    }
}

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const optimizer = new CSSOptimizer();
    optimizer.optimize().catch(console.error);
}

export default CSSOptimizer;
