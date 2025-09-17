#!/usr/bin/env node

/**
 * IT-ERA Deploy Navigation Fix
 * Applica il fix del navigation menu direttamente alle pagine esistenti
 */

const fs = require('fs');
const path = require('path');

class NavigationFixDeployer {
    constructor() {
        this.navigationTemplate = this.getNavigationTemplate();
        this.pagesFixed = [];
        this.pagesFailed = [];
    }
    
    // Template navigation menu corretto
    getNavigationTemplate() {
        return `<!-- IT-ERA Navigation Menu -->
<nav class="bg-white shadow-lg sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
            <div class="flex items-center">
                <a href="/" class="flex-shrink-0 flex items-center">
                    <img class="h-8 w-auto" src="/images/logo-it-era.png" alt="IT-ERA">
                    <span class="ml-2 text-xl font-bold text-gray-800">IT-ERA</span>
                </a>
            </div>
            
            <!-- Desktop Menu -->
            <div class="hidden md:flex items-center space-x-8">
                <a href="/" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Home</a>
                <div class="relative group">
                    <button class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                        Servizi IT <svg class="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    </button>
                    <div class="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <a href="/servizi-it/assistenza-informatica-aziende-milano.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Assistenza Aziendale</a>
                        <a href="/servizi-it/assistenza-informatica-privati-milano.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Assistenza Privati</a>
                        <a href="/servizi-it/computer-non-si-accende-milano.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">🚨 Emergenze</a>
                    </div>
                </div>
                <div class="relative group">
                    <button class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                        Settori <svg class="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    </button>
                    <div class="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <a href="/settori/commercialisti.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Commercialisti</a>
                        <a href="/settori/studi-legali.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Studi Legali</a>
                        <a href="/settori/studi-medici.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Studi Medici</a>
                        <a href="/settori/pmi-startup.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">PMI & Startup</a>
                    </div>
                </div>
                <a href="/contatti.html" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Contatti</a>
                <a href="tel:+390398882041" class="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition duration-200">
                    📞 039 888 2041
                </a>
            </div>
            
            <!-- Mobile menu button -->
            <div class="md:hidden flex items-center">
                <button id="mobile-menu-button" class="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    </div>
    
    <!-- Mobile Menu -->
    <div id="mobile-menu" class="md:hidden hidden bg-white border-t border-gray-200">
        <div class="px-2 pt-2 pb-3 space-y-1">
            <a href="/" class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">Home</a>
            <a href="/servizi-it/" class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">Servizi IT</a>
            <a href="/settori/" class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">Settori</a>
            <a href="/contatti.html" class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">Contatti</a>
            <a href="tel:+390398882041" class="block px-3 py-2 text-base font-medium bg-red-600 text-white hover:bg-red-700 rounded-md text-center">
                📞 Chiama: 039 888 2041
            </a>
        </div>
    </div>
</nav>

<script>
// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
});
</script>`;
    }
    
    // Applica il fix alle pagine principali
    applyNavigationFix() {
        console.log('🚀 Applying navigation fix to main pages...\n');
        
        const mainPages = [
            'index.html',
            'contatti.html'
        ];
        
        mainPages.forEach(pagePath => {
            this.fixSinglePage(pagePath);
        });
        
        this.generateReport();
    }
    
    // Applica il fix a una singola pagina
    fixSinglePage(pagePath) {
        console.log(`🔧 Fixing navigation on: ${pagePath}`);
        
        try {
            if (!fs.existsSync(pagePath)) {
                console.log(`   ⚠️ File not found: ${pagePath}`);
                this.pagesFailed.push({
                    page: pagePath,
                    error: 'File not found'
                });
                return;
            }
            
            let content = fs.readFileSync(pagePath, 'utf8');
            
            // Cerca e sostituisci il navigation esistente
            const navRegex = /<nav[\s\S]*?<\/nav>/i;
            
            if (navRegex.test(content)) {
                // Sostituisci navigation esistente
                content = content.replace(navRegex, this.navigationTemplate);
                console.log(`   ✅ Replaced existing navigation`);
            } else {
                // Aggiungi navigation dopo il <body>
                const bodyRegex = /<body[^>]*>/i;
                if (bodyRegex.test(content)) {
                    content = content.replace(bodyRegex, (match) => {
                        return match + '\n' + this.navigationTemplate + '\n';
                    });
                    console.log(`   ✅ Added new navigation after <body>`);
                } else {
                    throw new Error('No <body> tag found');
                }
            }
            
            // Scrivi il file aggiornato
            fs.writeFileSync(pagePath, content);
            
            this.pagesFixed.push({
                page: pagePath,
                action: 'Navigation menu updated',
                size: content.length
            });
            
            console.log(`   ✅ Successfully updated ${pagePath}\n`);
            
        } catch (error) {
            console.error(`   ❌ Failed to fix ${pagePath}: ${error.message}\n`);
            
            this.pagesFailed.push({
                page: pagePath,
                error: error.message
            });
        }
    }
    
    // Genera report
    generateReport() {
        console.log('📊 NAVIGATION FIX DEPLOYMENT REPORT');
        console.log('===================================');
        console.log(`✅ Pages Fixed: ${this.pagesFixed.length}`);
        console.log(`❌ Pages Failed: ${this.pagesFailed.length}`);
        
        if (this.pagesFixed.length > 0) {
            console.log('\n✅ Successfully Fixed:');
            this.pagesFixed.forEach(fix => {
                console.log(`  ${fix.page} - ${fix.action}`);
            });
        }
        
        if (this.pagesFailed.length > 0) {
            console.log('\n❌ Failed to Fix:');
            this.pagesFailed.forEach(fail => {
                console.log(`  ${fail.page} - ${fail.error}`);
            });
        }
        
        const report = {
            timestamp: new Date().toISOString(),
            pagesFixed: this.pagesFixed,
            pagesFailed: this.pagesFailed,
            successRate: Math.round((this.pagesFixed.length / (this.pagesFixed.length + this.pagesFailed.length)) * 100)
        };
        
        fs.writeFileSync('navigation-fix-deployment-report.json', JSON.stringify(report, null, 2));
        console.log('\n💾 Report saved to: navigation-fix-deployment-report.json');
        
        return report;
    }
}

// Esegui se chiamato direttamente
if (require.main === module) {
    const deployer = new NavigationFixDeployer();
    deployer.applyNavigationFix();
}

module.exports = NavigationFixDeployer;
