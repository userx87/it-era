#!/usr/bin/env node

/**
 * IT-ERA JavaScript Optimization Script
 * Minifies JS, implements code splitting, lazy loading for chatbot AI
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class JSOptimizer {
    constructor() {
        this.jsFiles = [
            'web/js/ai-config.js',
            'web/js/smart-chatbot.js',
            'web/js/analytics-system.js',
            'web/js/sector-personalization.js',
            'web/js/auggie-integration.js',
            'web/js/itera-ai-enhanced.js'
        ];
        this.criticalJS = '';
        this.optimizedJS = new Map();
    }

    async optimize() {
        console.log('⚡ Starting JavaScript optimization...');
        
        // 1. Analyze and minify JS files
        for (const jsFile of this.jsFiles) {
            await this.processJSFile(jsFile);
        }
        
        // 2. Create critical JS for immediate loading
        await this.createCriticalJS();
        
        // 3. Create lazy-loaded bundles
        await this.createLazyBundles();
        
        // 4. Update HTML files with optimized loading
        await this.updateHTMLFiles();
        
        console.log('✅ JavaScript optimization completed!');
    }

    async processJSFile(jsFile) {
        const filePath = path.join(projectRoot, jsFile);
        
        try {
            const content = await fs.readFile(filePath, 'utf8');
            console.log(`📄 Processing ${jsFile}...`);
            
            // Basic minification
            const minified = this.minifyJS(content);
            
            this.optimizedJS.set(jsFile, minified);
            
            // Save minified version
            const minifiedPath = filePath.replace('.js', '.min.js');
            await fs.writeFile(minifiedPath, minified);
            
            console.log(`✅ Minified ${jsFile} -> ${path.basename(minifiedPath)}`);
            
        } catch (error) {
            console.error(`❌ Error processing ${jsFile}:`, error.message);
        }
    }

    minifyJS(js) {
        return js
            // Remove single-line comments (but preserve URLs and important comments)
            .replace(/\/\/(?![^\r\n]*https?:)[^\r\n]*/g, '')
            // Remove multi-line comments (preserve license comments)
            .replace(/\/\*(?!\*![\s\S]*?\*\/)[\s\S]*?\*\//g, '')
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            // Remove whitespace around operators and punctuation
            .replace(/\s*([{}();,=+\-*/<>!&|])\s*/g, '$1')
            // Remove trailing semicolons before }
            .replace(/;}/g, '}')
            .trim();
    }

    async createCriticalJS() {
        console.log('🔍 Creating critical JavaScript...');
        
        // Critical JS for immediate functionality
        this.criticalJS = `
/* IT-ERA Critical JavaScript - Immediate loading */
(function(){
'use strict';
// Performance optimization markers
window.ITERAPerformanceOptimizationsActive=true;
console.log('🚀 IT-ERA Performance Optimizations Active');

// Critical CSS injection
const criticalCSS=\`body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif!important}.hero{background:linear-gradient(135deg,#0056cc 0%,#004bb3 100%)!important;color:white!important}.navbar{background:white!important;box-shadow:0 2px 4px rgba(0,0,0,.1)!important}.btn-primary{background:#0056cc!important;border-color:#0056cc!important}\`;
const criticalStyle=document.createElement('style');
criticalStyle.textContent=criticalCSS;
document.head.insertBefore(criticalStyle,document.head.firstChild);

// Immediate DOM optimizations
const images=document.querySelectorAll('img:not([loading])');
images.forEach(img=>{
img.loading='lazy';
img.decoding='async';
});

// Mark completion
window.ITERAPerformanceOptimizationsComplete=true;
document.body.setAttribute('data-itera-performance','active');

// Lazy load non-critical scripts
const lazyLoadScript=(src,callback)=>{
const script=document.createElement('script');
script.src=src;
script.async=true;
script.onload=callback;
document.head.appendChild(script);
};

// Load chatbot after page interaction or 3 seconds
let chatbotLoaded=false;
const loadChatbot=()=>{
if(chatbotLoaded)return;
chatbotLoaded=true;
lazyLoadScript('js/chatbot-bundle.min.js',()=>{
console.log('🤖 Chatbot loaded');
});
};

// Load on interaction
['click','scroll','keydown','touchstart'].forEach(event=>{
document.addEventListener(event,loadChatbot,{once:true,passive:true});
});

// Fallback load after 3 seconds
setTimeout(loadChatbot,3000);
})();
        `.trim();
    }

    async createLazyBundles() {
        console.log('📦 Creating lazy-loaded bundles...');
        
        // Create chatbot bundle (non-critical)
        const chatbotFiles = [
            'web/js/ai-config.js',
            'web/js/smart-chatbot.js',
            'web/js/itera-ai-enhanced.js'
        ];
        
        let chatbotBundle = '';
        for (const file of chatbotFiles) {
            if (this.optimizedJS.has(file)) {
                chatbotBundle += `/* ${file} */\n${this.optimizedJS.get(file)}\n\n`;
            }
        }
        
        // Create analytics bundle (non-critical)
        const analyticsFiles = [
            'web/js/analytics-system.js',
            'web/js/sector-personalization.js'
        ];
        
        let analyticsBundle = '';
        for (const file of analyticsFiles) {
            if (this.optimizedJS.has(file)) {
                analyticsBundle += `/* ${file} */\n${this.optimizedJS.get(file)}\n\n`;
            }
        }
        
        // Save bundles
        const chatbotPath = path.join(projectRoot, 'web/js/chatbot-bundle.min.js');
        await fs.writeFile(chatbotPath, chatbotBundle);
        
        const analyticsPath = path.join(projectRoot, 'web/js/analytics-bundle.min.js');
        await fs.writeFile(analyticsPath, analyticsBundle);
        
        // Save critical JS
        const criticalPath = path.join(projectRoot, 'web/js/critical.min.js');
        await fs.writeFile(criticalPath, this.criticalJS);
        
        console.log('✅ Created lazy-loaded bundles');
    }

    async updateHTMLFiles() {
        console.log('🔄 Updating HTML files with optimized JS loading...');
        
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
            
            // Check if optimization is already applied
            if (content.includes('IT-ERA Critical JavaScript')) {
                return;
            }
            
            // Remove existing individual JS includes
            content = content.replace(
                /<script[^>]*src="[^"]*\/js\/(ai-config|smart-chatbot|analytics-system|sector-personalization|auggie-integration|itera-ai-enhanced)\.js"[^>]*><\/script>/g,
                ''
            );
            
            // Add critical JS inline before closing head
            const criticalJSTag = `
    <!-- IT-ERA Critical JavaScript -->
    <script>
${this.criticalJS}
    </script>`;
            
            content = content.replace('</head>', `${criticalJSTag}\n</head>`);
            
            // Add analytics bundle loading at end of body
            const analyticsTag = `
    <!-- IT-ERA Analytics Bundle - Lazy Loaded -->
    <script>
    // Load analytics after page load
    window.addEventListener('load', function() {
        setTimeout(function() {
            const script = document.createElement('script');
            script.src = 'js/analytics-bundle.min.js';
            script.async = true;
            document.head.appendChild(script);
        }, 1000);
    });
    </script>`;
            
            content = content.replace('</body>', `${analyticsTag}\n</body>`);
            
            await fs.writeFile(htmlFile, content);
            console.log(`✅ Updated ${path.basename(htmlFile)}`);
            
        } catch (error) {
            console.error(`❌ Error updating ${htmlFile}:`, error.message);
        }
    }
}

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const optimizer = new JSOptimizer();
    optimizer.optimize().catch(console.error);
}

export default JSOptimizer;
