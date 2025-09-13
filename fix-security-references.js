#!/usr/bin/env node

/**
 * Script per rimuovere riferimenti alla sicurezza informatica dalle pagine esistenti
 * e sostituirli con supporto tecnico
 */

const fs = require('fs');
const path = require('path');

class SecurityReferenceFixer {
    constructor() {
        this.updated = 0;
        this.errors = 0;
        this.changes = [];
    }
    
    async fixAllPages() {
        console.log('🔧 Fixing security references in all pages...\n');
        
        // Fix pages in servizi-it directory
        await this.fixDirectory('./servizi-it');
        
        this.showSummary();
    }
    
    async fixDirectory(dirPath) {
        console.log(`📁 Processing directory: ${dirPath}`);
        
        if (!fs.existsSync(dirPath)) {
            console.log(`❌ Directory ${dirPath} not found`);
            return;
        }
        
        const files = fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.html'))
            .filter(file => !file.includes('guida-sicurezza')); // Skip the security guide itself
        
        console.log(`Found ${files.length} HTML files to process`);
        
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            this.fixFile(filePath);
        }
    }
    
    fixFile(filePath) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let hasChanges = false;
            const changes = [];
            
            // 1. Fix security service card
            if (content.includes('🛡️') && content.includes('Sicurezza Informatica')) {
                content = content.replace(
                    /<div class="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">\s*<span class="text-2xl">🛡️<\/span>\s*<\/div>/g,
                    '<div class="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">\n                            <span class="text-2xl">⚡</span>\n                        </div>'
                );
                
                content = content.replace(
                    /<h3 class="text-xl font-bold text-gray-900 mb-4">Sicurezza Informatica<\/h3>/g,
                    '<h3 class="text-xl font-bold text-gray-900 mb-4">Supporto Tecnico</h3>'
                );
                
                content = content.replace(
                    /<p class="text-gray-600 mb-4">Consulenza e audit sicurezza IT<\/p>/g,
                    '<p class="text-gray-600 mb-4">Assistenza IT professionale</p>'
                );
                
                // Fix list items
                content = content.replace(/Penetration testing/g, 'Risoluzione problemi');
                content = content.replace(/Vulnerability assessment/g, 'Manutenzione preventiva');
                content = content.replace(/Report dettagliato/g, 'Consulenza tecnica');
                
                hasChanges = true;
                changes.push('Security service card updated to Technical Support');
            }
            
            // 2. Fix form options
            if (content.includes('sicurezza-informatica')) {
                content = content.replace(
                    /<option value="sicurezza-informatica">Sicurezza Informatica<\/option>/g,
                    '<option value="supporto-tecnico">Supporto Tecnico</option>'
                );
                hasChanges = true;
                changes.push('Form option updated');
            }
            
            // 3. Fix any remaining security references in text
            if (content.includes('sicurezza informatica') && !content.includes('guida-sicurezza')) {
                // Be careful not to change legitimate security mentions
                content = content.replace(
                    /servizio di sicurezza informatica/gi,
                    'servizio di supporto tecnico'
                );
                content = content.replace(
                    /consulenza sicurezza informatica/gi,
                    'consulenza supporto tecnico'
                );
                hasChanges = true;
                changes.push('Text references updated');
            }
            
            // 4. Fix analytics tracking
            if (content.includes("'Sicurezza Informatica'")) {
                content = content.replace(
                    /'Sicurezza Informatica'/g,
                    "'Supporto Tecnico'"
                );
                hasChanges = true;
                changes.push('Analytics tracking updated');
            }
            
            if (hasChanges) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ Updated: ${filePath}`);
                console.log(`   Changes: ${changes.join(', ')}`);
                this.updated++;
                this.changes.push({
                    file: filePath,
                    changes: changes
                });
            } else {
                console.log(`⏭️ No changes needed: ${filePath}`);
            }
            
        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
            this.errors++;
        }
    }
    
    showSummary() {
        console.log('\n📊 Security Reference Fix Summary:');
        console.log(`✅ Files updated: ${this.updated}`);
        console.log(`❌ Errors: ${this.errors}`);
        
        if (this.changes.length > 0) {
            console.log('\n📝 Detailed Changes:');
            this.changes.forEach(change => {
                console.log(`\n📄 ${change.file}:`);
                change.changes.forEach(c => console.log(`   • ${c}`));
            });
        }
        
        if (this.updated > 0) {
            console.log('\n🎉 Security references fixed successfully!');
            console.log('💡 Changes made:');
            console.log('• 🛡️ Sicurezza Informatica → ⚡ Supporto Tecnico');
            console.log('• Red shield icon → Green lightning icon');
            console.log('• Security services → Technical support services');
            console.log('• Form options updated');
            console.log('• Analytics tracking updated');
        }
        
        console.log('\n🔍 Note: The security guide page was preserved as a standalone service');
    }
}

// Execute if run directly
if (require.main === module) {
    const fixer = new SecurityReferenceFixer();
    fixer.fixAllPages().catch(console.error);
}

module.exports = SecurityReferenceFixer;
