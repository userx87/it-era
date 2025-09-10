#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Pagine settori da unificare
const SETTORI_PAGES = [
    '_site/settori/studi-medici.html',
    '_site/settori/commercialisti.html',
    '_site/settori/studi-legali.html',
    '_site/settori/industria-40.html',
    '_site/settori/retail-gdo.html'
];

class SettoriNavigationUnifier {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            unifiedPages: [],
            errors: [],
            summary: {
                totalPages: SETTORI_PAGES.length,
                successfulUnifications: 0,
                failedUnifications: 0
            }
        };
    }

    // Legge un file
    readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Cannot read file ${filePath}: ${error.message}`);
        }
    }

    // Scrive un file
    writeFile(filePath, content) {
        try {
            fs.writeFileSync(filePath, content, 'utf8');
        } catch (error) {
            throw new Error(`Cannot write file ${filePath}: ${error.message}`);
        }
    }

    // Unifica una singola pagina settore
    unifyPage(filePath) {
        console.log(`🔗 Unifying navigation: ${filePath}`);
        
        try {
            let content = this.readFile(filePath);
            let updated = false;

            // 1. Aggiorna logo con design moderno
            const oldLogoPattern = /<div class="flex items-center">\s*<a href="\/" class="text-2xl font-bold text-primary-500" aria-label="IT-ERA Homepage">\s*IT-<span class="text-gray-900">ERA<\/span>\s*<\/a>\s*<\/div>/s;
            const newLogo = `<div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center">
                        <span class="text-white font-bold text-xl">IT</span>
                    </div>
                    <div class="hidden sm:block">
                        <h1 class="text-2xl font-bold text-neutral-900">IT-ERA</h1>
                        <p class="text-sm text-neutral-600 -mt-1">Assistenza IT Professionale</p>
                    </div>
                </div>`;

            if (oldLogoPattern.test(content)) {
                content = content.replace(oldLogoPattern, newLogo);
                updated = true;
                console.log('  ✅ Updated logo with modern design');
            }

            // 2. Aggiorna link navigation principali
            content = content.replace(
                /<a href="\/chi-siamo" class="text-gray-700 hover:text-primary-500 font-medium transition-colors">Chi Siamo<\/a>/g,
                '<a href="/it-era/" class="text-gray-700 hover:text-primary-500 font-medium transition-colors">Home</a>'
            );
            content = content.replace(
                /<a href="\/blog" class="text-gray-700 hover:text-primary-500 font-medium transition-colors">Blog<\/a>/g,
                '<a href="/it-era/servizi.html" class="text-gray-700 hover:text-primary-500 font-medium transition-colors">Servizi</a>'
            );
            content = content.replace(
                /<a href="\/contatti" class="text-gray-700 hover:text-primary-500 font-medium transition-colors">Contatti<\/a>/g,
                '<a href="/it-era/contatti.html" class="text-gray-700 hover:text-primary-500 font-medium transition-colors">Contatti</a>'
            );

            // 3. Aggiorna link settori nel dropdown
            content = content.replace(/href="\/settori\/pmi-startup"/g, 'href="/it-era/settori/pmi-startup.html"');
            content = content.replace(/href="\/settori\/studi-medici"/g, 'href="/it-era/settori/studi-medici.html"');
            content = content.replace(/href="\/settori\/commercialisti"/g, 'href="/it-era/settori/commercialisti.html"');
            content = content.replace(/href="\/settori\/studi-legali"/g, 'href="/it-era/settori/studi-legali.html"');
            content = content.replace(/href="\/settori\/industria-40"/g, 'href="/it-era/settori/industria-40.html"');
            content = content.replace(/href="\/settori\/retail-gdo"/g, 'href="/it-era/settori/retail-gdo.html"');

            // 4. Aggiorna link servizi nel dropdown
            content = content.replace(/href="\/assistenza-informatica"/g, 'href="/it-era/servizi.html"');
            content = content.replace(/href="\/sicurezza-informatica"/g, 'href="/it-era/servizi.html"');
            content = content.replace(/href="\/assistenza-server"/g, 'href="/it-era/servizi.html"');
            content = content.replace(/href="\/assistenza-email"/g, 'href="/it-era/servizi.html"');

            // 5. Aggiorna link mobile menu
            content = content.replace(/href="\/assistenza-informatica"/g, 'href="/it-era/servizi.html"');
            content = content.replace(/href="\/contatti"/g, 'href="/it-era/contatti.html"');

            if (updated || content.includes('/it-era/')) {
                this.writeFile(filePath, content);
                this.results.unifiedPages.push({
                    path: filePath,
                    success: true,
                    changes: ['Logo', 'Navigation links', 'Dropdown links', 'Mobile menu']
                });
                this.results.summary.successfulUnifications++;
                console.log(`  ✅ Successfully unified ${filePath}`);
            } else {
                console.log(`  ⚠️  No unification needed for ${filePath}`);
            }

        } catch (error) {
            console.log(`  ❌ Failed to unify ${filePath}: ${error.message}`);
            this.results.errors.push({
                path: filePath,
                error: error.message
            });
            this.results.summary.failedUnifications++;
        }
    }

    // Unifica tutte le pagine settori
    unifyAllPages() {
        console.log('🔗 UNIFYING SETTORI NAVIGATION');
        console.log('==============================\n');

        SETTORI_PAGES.forEach(pagePath => {
            if (fs.existsSync(pagePath)) {
                this.unifyPage(pagePath);
            } else {
                console.log(`  ⚠️  File not found: ${pagePath}`);
                this.results.errors.push({
                    path: pagePath,
                    error: 'File not found'
                });
                this.results.summary.failedUnifications++;
            }
            console.log('');
        });

        this.printSummary();
    }

    // Stampa riassunto finale
    printSummary() {
        console.log('🏆 SETTORI NAVIGATION UNIFICATION SUMMARY');
        console.log('=========================================');
        console.log(`🎯 Total Pages: ${this.results.summary.totalPages}`);
        console.log(`✅ Successful Unifications: ${this.results.summary.successfulUnifications}`);
        console.log(`❌ Failed Unifications: ${this.results.summary.failedUnifications}`);

        if (this.results.unifiedPages.length > 0) {
            console.log('\n📄 SUCCESSFULLY UNIFIED PAGES:');
            this.results.unifiedPages.forEach(page => {
                console.log(`  ✅ ${page.path}`);
                console.log(`     Changes: ${page.changes.join(', ')}`);
            });
        }

        if (this.results.errors.length > 0) {
            console.log('\n⚠️  ERRORS:');
            this.results.errors.forEach(error => {
                console.log(`  ❌ ${error.path}: ${error.error}`);
            });
        }

        const successRate = Math.round((this.results.summary.successfulUnifications / this.results.summary.totalPages) * 100);
        
        if (successRate >= 90) {
            console.log('\n🎉 EXCELLENT! Settori navigation unified successfully.');
        } else if (successRate >= 70) {
            console.log('\n✅ GOOD! Most settori navigation unified with some issues.');
        } else {
            console.log('\n⚠️  NEEDS ATTENTION! Several settori pages failed to unify.');
        }

        console.log(`\n🌐 Unification completed at: ${this.results.timestamp}`);
    }
}

// Esegui l'unificazione della navigation settori
const unifier = new SettoriNavigationUnifier();
unifier.unifyAllPages();
