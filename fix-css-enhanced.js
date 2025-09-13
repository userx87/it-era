#!/usr/bin/env node

/**
 * Script per aggiungere il CSS enhanced a tutte le pagine keyword
 * Risolve il problema di styling inconsistente
 */

const fs = require('fs');
const path = require('path');

class CSSEnhancedFixer {
    constructor() {
        this.cssLink = '<link rel="stylesheet" href="/css/it-era-enhanced.css">';
        this.processed = 0;
        this.errors = 0;
        this.skipped = 0;
    }
    
    async fixAllPages() {
        console.log('🔧 Fixing CSS Enhanced loading on all pages...\n');
        
        // Fix keyword pages
        await this.fixKeywordPages();
        
        // Fix main pages
        await this.fixMainPages();
        
        // Fix templates
        await this.fixTemplates();
        
        this.showSummary();
    }
    
    async fixKeywordPages() {
        console.log('📄 Fixing keyword pages...');
        
        const keywordDir = './servizi-keyword';
        if (!fs.existsSync(keywordDir)) {
            console.log('❌ Keyword directory not found');
            return;
        }
        
        const files = fs.readdirSync(keywordDir)
            .filter(file => file.endsWith('.html'));
        
        console.log(`Found ${files.length} keyword pages to fix`);
        
        for (const file of files) {
            const filePath = path.join(keywordDir, file);
            this.fixSinglePage(filePath, file);
        }
    }
    
    async fixMainPages() {
        console.log('\n📄 Fixing main pages...');
        
        const mainPages = [
            './index.html',
            './contatti.html',
            './test-resend.html',
            './test-form-simple.html'
        ];
        
        for (const pagePath of mainPages) {
            if (fs.existsSync(pagePath)) {
                this.fixSinglePage(pagePath, path.basename(pagePath));
            }
        }
    }
    
    async fixTemplates() {
        console.log('\n📄 Fixing templates...');
        
        const templateDir = './development/templates';
        if (!fs.existsSync(templateDir)) {
            console.log('❌ Template directory not found');
            return;
        }
        
        const templates = fs.readdirSync(templateDir)
            .filter(file => file.endsWith('.html'));
        
        for (const template of templates) {
            const templatePath = path.join(templateDir, template);
            this.fixSinglePage(templatePath, template);
        }
    }
    
    fixSinglePage(filePath, filename) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Check if CSS enhanced is already present
            if (content.includes('it-era-enhanced.css')) {
                console.log(`✅ ${filename} - already has enhanced CSS`);
                this.skipped++;
                return;
            }
            
            // Find the head section and add CSS link
            const headEndPattern = /<\/head>/i;
            
            if (headEndPattern.test(content)) {
                // Add CSS link before closing head tag
                content = content.replace(
                    headEndPattern,
                    `    ${this.cssLink}\n</head>`
                );
                
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ ${filename} - enhanced CSS added`);
                this.processed++;
            } else {
                console.log(`⚠️ ${filename} - no head tag found`);
                this.errors++;
            }
            
        } catch (error) {
            console.error(`❌ Error fixing ${filename}:`, error.message);
            this.errors++;
        }
    }
    
    showSummary() {
        console.log('\n📊 Summary:');
        console.log(`✅ Fixed: ${this.processed}`);
        console.log(`⏭️ Skipped: ${this.skipped}`);
        console.log(`❌ Errors: ${this.errors}`);
        console.log(`📄 Total: ${this.processed + this.skipped + this.errors}`);
        
        if (this.processed > 0) {
            console.log('\n🎉 CSS Enhanced successfully added to pages!');
            console.log('💡 Next: Commit and deploy changes');
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const fixer = new CSSEnhancedFixer();
    fixer.fixAllPages().catch(console.error);
}

module.exports = CSSEnhancedFixer;
