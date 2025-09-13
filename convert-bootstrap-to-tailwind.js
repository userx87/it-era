#!/usr/bin/env node

/**
 * Script per convertire classi Bootstrap in Tailwind CSS
 * nella pagina assistenza-informatica-aziende-bergamo.html
 */

const fs = require('fs');
const path = require('path');

class BootstrapToTailwindConverter {
    constructor() {
        this.conversions = {
            // Container and Grid
            'container': 'max-w-7xl mx-auto px-6 lg:px-8',
            'row': 'flex flex-wrap',
            'col-12': 'w-full',
            'col-lg-4': 'lg:w-1/3',
            'col-lg-6': 'lg:w-1/2',
            'col-lg-8': 'lg:w-2/3',
            'col-md-6': 'md:w-1/2',
            'mx-auto': 'mx-auto',
            'g-4': 'gap-4',
            'g-3': 'gap-3',
            
            // Text and Typography
            'text-center': 'text-center',
            'text-muted': 'text-gray-600',
            'fw-bold': 'font-bold',
            'fw-semibold': 'font-semibold',
            'display-5': 'text-3xl lg:text-4xl',
            'lead': 'text-xl',
            'mb-3': 'mb-3',
            'mb-4': 'mb-4',
            'mb-5': 'mb-5',
            'mt-3': 'mt-3',
            'mt-5': 'mt-5',
            
            // Buttons
            'btn': 'inline-flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-300',
            'btn-lg': 'px-8 py-4 text-lg',
            'btn-success': 'bg-green-500 hover:bg-green-600 text-white',
            
            // Cards
            'card': 'bg-white rounded-lg shadow-lg border border-gray-200',
            'card-body': 'p-6',
            
            // Forms
            'form-control': 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'form-select': 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'form-label': 'block text-sm font-medium text-gray-700 mb-2',
            'form-check': 'flex items-start',
            'form-check-input': 'mr-2 mt-1',
            'form-check-label': 'text-sm text-gray-700',
            
            // Spacing
            'p-5': 'p-8',
            'px-6': 'px-6',
            'py-3': 'py-3',
            
            // Flexbox
            'd-flex': 'flex',
            'flex-wrap': 'flex-wrap',
            'align-items-center': 'items-center',
            'justify-content-center': 'justify-center',
            
            // Lists
            'list-unstyled': 'list-none',
            
            // Alerts
            'alert': 'p-4 rounded-lg',
            'alert-success': 'bg-green-100 border border-green-400 text-green-700',
            'alert-danger': 'bg-red-100 border border-red-400 text-red-700'
        };
    }
    
    convertFile(filePath) {
        console.log(`🔄 Converting ${filePath}...`);
        
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let conversions = 0;
            
            // Convert Bootstrap classes to Tailwind
            for (const [bootstrap, tailwind] of Object.entries(this.conversions)) {
                const regex = new RegExp(`\\b${bootstrap}\\b`, 'g');
                const matches = content.match(regex);
                if (matches) {
                    content = content.replace(regex, tailwind);
                    conversions += matches.length;
                    console.log(`  ✅ ${bootstrap} → ${tailwind} (${matches.length} times)`);
                }
            }
            
            // Additional specific conversions for this page
            content = this.additionalConversions(content);
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Conversion completed: ${conversions} classes converted`);
            
        } catch (error) {
            console.error(`❌ Error converting ${filePath}:`, error.message);
        }
    }
    
    additionalConversions(content) {
        // Convert grid system
        content = content.replace(
            /class="row g-4"/g,
            'class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"'
        );
        
        // Convert service cards container
        content = content.replace(
            /class="col-lg-4 col-md-6"/g,
            'class=""'
        );
        
        // Convert form grid
        content = content.replace(
            /class="row g-3"/g,
            'class="grid grid-cols-1 md:grid-cols-2 gap-6"'
        );
        
        // Convert form columns
        content = content.replace(
            /class="col-md-6"/g,
            'class=""'
        );
        
        content = content.replace(
            /class="col-12"/g,
            'class="md:col-span-2"'
        );
        
        // Convert contact info grid
        content = content.replace(
            /class="row mt-5"/g,
            'class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12"'
        );
        
        return content;
    }
}

// Execute if run directly
if (require.main === module) {
    const converter = new BootstrapToTailwindConverter();
    const filePath = './servizi-keyword/assistenza-informatica-aziende-bergamo.html';
    
    if (fs.existsSync(filePath)) {
        converter.convertFile(filePath);
        console.log('\n🎉 Bootstrap to Tailwind conversion completed!');
    } else {
        console.error('❌ File not found:', filePath);
    }
}

module.exports = BootstrapToTailwindConverter;
