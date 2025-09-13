#!/usr/bin/env node

/**
 * Script per aggiornare tutti i riferimenti da servizi-keyword a servizi-it
 */

const fs = require('fs');
const path = require('path');

class PathUpdater {
    constructor() {
        this.updated = 0;
        this.errors = 0;
    }
    
    async updateAllPaths() {
        console.log('🔄 Updating all path references from servizi-keyword to servizi-it...\n');
        
        // Update HTML files in servizi-it directory
        await this.updateDirectory('./servizi-it');
        
        // Update main HTML files
        await this.updateMainFiles();
        
        // Update JavaScript files
        await this.updateJavaScriptFiles();
        
        this.showSummary();
    }
    
    async updateDirectory(dirPath) {
        console.log(`📁 Updating files in ${dirPath}...`);
        
        if (!fs.existsSync(dirPath)) {
            console.log(`❌ Directory ${dirPath} not found`);
            return;
        }
        
        const files = fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.html'));
        
        console.log(`Found ${files.length} HTML files to update`);
        
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            this.updateFile(filePath);
        }
    }
    
    async updateMainFiles() {
        console.log('\n📄 Updating main HTML files...');
        
        const mainFiles = [
            './index.html',
            './contatti.html',
            './test-resend.html',
            './test-form-simple.html'
        ];
        
        for (const filePath of mainFiles) {
            if (fs.existsSync(filePath)) {
                this.updateFile(filePath);
            }
        }
    }
    
    async updateJavaScriptFiles() {
        console.log('\n📜 Updating JavaScript files...');
        
        const jsFiles = [
            './create-lombardy-pages.js',
            './js/components-loader.js',
            './js/resend-integration.js'
        ];
        
        for (const filePath of jsFiles) {
            if (fs.existsSync(filePath)) {
                this.updateFile(filePath);
            }
        }
    }
    
    updateFile(filePath) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let hasChanges = false;
            
            // Update URL references
            if (content.includes('servizi-keyword/')) {
                content = content.replace(/servizi-keyword\//g, 'servizi-it/');
                hasChanges = true;
            }
            
            // Update path references in JavaScript
            if (content.includes('./servizi-keyword/')) {
                content = content.replace(/\.\/servizi-keyword\//g, './servizi-it/');
                hasChanges = true;
            }
            
            // Update absolute path references
            if (content.includes('/servizi-keyword/')) {
                content = content.replace(/\/servizi-keyword\//g, '/servizi-it/');
                hasChanges = true;
            }
            
            if (hasChanges) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ Updated: ${filePath}`);
                this.updated++;
            } else {
                console.log(`⏭️ No changes needed: ${filePath}`);
            }
            
        } catch (error) {
            console.error(`❌ Error updating ${filePath}:`, error.message);
            this.errors++;
        }
    }
    
    showSummary() {
        console.log('\n📊 Path Update Summary:');
        console.log(`✅ Files updated: ${this.updated}`);
        console.log(`❌ Errors: ${this.errors}`);
        
        if (this.updated > 0) {
            console.log('\n🎉 Path references updated successfully!');
            console.log('💡 Next steps:');
            console.log('1. Test updated paths');
            console.log('2. Update email configuration');
            console.log('3. Test form functionality');
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const updater = new PathUpdater();
    updater.updateAllPaths().catch(console.error);
}

module.exports = PathUpdater;
