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

            // 1. Aggiorna link servizi nel dropdown
            content = content.replace(/href="\/assistenza-informatica"/g, 'href="/it-era/servizi.html"');
            content = content.replace(/href="\/sicurezza-informatica"/g, 'href="/it-era/servizi.html"');
            content = content.replace(/href="\/assistenza-server"/g, 'href="/it-era/servizi.html"');
            content = content.replace(/href="\/assistenza-email"/g, 'href="/it-era/servizi.html"');

            // 2. Aggiorna link mobile menu se presenti
            content = content.replace(/href="\/contatti"/g, 'href="/it-era/contatti.html"');

            // 3. Verifica se ci sono stati cambiamenti
            if (content.includes('/it-era/')) {
                updated = true;
            }

            if (updated) {
                this.writeFile(filePath, content);
                this.results.unifiedPages.push({
                    path: filePath,
                    success: true,
                    changes: ['Navigation links', 'Dropdown links', 'Mobile menu']
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
