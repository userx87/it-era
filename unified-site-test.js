#!/usr/bin/env node

const https = require('https');

// Test per verificare l'unificazione del sito
const SITE_BASE_URL = 'https://userx87.github.io/it-era';
const PAGES_TO_TEST = [
    { path: '/', name: 'Homepage' },
    { path: '/servizi.html', name: 'Servizi' },
    { path: '/contatti.html', name: 'Contatti' },
    { path: '/settori/pmi-startup.html', name: 'PMI e Startup' },
    { path: '/settori/studi-medici.html', name: 'Studi Medici' },
    { path: '/settori/commercialisti.html', name: 'Commercialisti' },
    { path: '/settori/studi-legali.html', name: 'Studi Legali' },
    { path: '/settori/industria-40.html', name: 'Industria 4.0' },
    { path: '/settori/retail-gdo.html', name: 'Retail e GDO' }
];

class UnifiedSiteTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            pages: [],
            summary: {
                totalPages: PAGES_TO_TEST.length,
                successfulPages: 0,
                failedPages: 0,
                unifiedDesignScore: 0,
                navigationScore: 0,
                functionalityScore: 0,
                overallScore: 0
            },
            issues: [],
            successes: []
        };
    }

    // Testa una singola URL
    async testUrl(url) {
        return new Promise((resolve) => {
            const req = https.request(url, { method: 'GET' }, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        url: url,
                        status: res.statusCode,
                        success: res.statusCode >= 200 && res.statusCode < 400,
                        content: data,
                        size: data.length
                    });
                });
            });

            req.on('error', (error) => {
                resolve({
                    url: url,
                    status: 0,
                    success: false,
                    error: error.message
                });
            });

            req.setTimeout(10000, () => {
                req.destroy();
                resolve({
                    url: url,
                    status: 0,
                    success: false,
                    error: 'Timeout'
                });
            });

            req.end();
        });
    }

    // Test design unificato
    testUnifiedDesign(content) {
        const tests = {
            modernHeader: content.includes('backdrop-blur-xl'),
            modernLogo: content.includes('bg-gradient-to-br from-brand-500 to-brand-600'),
            modernNavigation: content.includes('group-hover:opacity-100'),
            modernFooter: content.includes('bg-neutral-900'),
            modernChatbot: content.includes('chatbot-widget'),
            modernCSS: content.includes('it-era-tailwind.css'),
            analyticsSetup: content.includes('ANALYTICS & TRACKING'),
            modernJavaScript: content.includes('Modern IT-ERA Website Interactions')
        };

        const score = Object.values(tests).filter(Boolean).length;
        return { tests, score: Math.round((score / Object.keys(tests).length) * 100) };
    }

    // Test navigation
    testNavigation(content) {
        const tests = {
            homeLink: content.includes('href="/it-era/"'),
            serviziLink: content.includes('href="/it-era/servizi.html"'),
            contattiLink: content.includes('href="/it-era/contatti.html"'),
            settoriDropdown: content.includes('Settori'),
            pmiLink: content.includes('href="/it-era/settori/pmi-startup.html"'),
            studiMediciLink: content.includes('href="/it-era/settori/studi-medici.html"'),
            mobileMenu: content.includes('mobile-menu'),
            phoneLink: content.includes('tel:+390398882041')
        };

        const score = Object.values(tests).filter(Boolean).length;
        return { tests, score: Math.round((score / Object.keys(tests).length) * 100) };
    }

    // Test funzionalità
    testFunctionality(content) {
        const tests = {
            mobileMenuJS: content.includes('mobile-menu-button'),
            chatbotJS: content.includes('chatbot-button'),
            responsiveDesign: content.includes('lg:hidden'),
            hoverEffects: content.includes('hover:'),
            animations: content.includes('transition-'),
            emergencyContact: content.includes('Emergenza IT'),
            trustBadge: content.includes('Risposta garantita'),
            socialLinks: content.includes('LinkedIn')
        };

        const score = Object.values(tests).filter(Boolean).length;
        return { tests, score: Math.round((score / Object.keys(tests).length) * 100) };
    }

    // Testa tutte le pagine
    async testAllPages() {
        console.log('🎨 UNIFIED SITE TEST');
        console.log('====================\n');

        for (const page of PAGES_TO_TEST) {
            const url = `${SITE_BASE_URL}${page.path}`;
            console.log(`📄 Testing: ${page.name} (${page.path})`);

            const result = await this.testUrl(url);
            
            if (result.success) {
                const designTest = this.testUnifiedDesign(result.content);
                const navigationTest = this.testNavigation(result.content);
                const functionalityTest = this.testFunctionality(result.content);
                
                const overallScore = Math.round((designTest.score + navigationTest.score + functionalityTest.score) / 3);
                
                const pageResult = {
                    ...page,
                    url: url,
                    status: result.status,
                    size: result.size,
                    designScore: designTest.score,
                    navigationScore: navigationTest.score,
                    functionalityScore: functionalityTest.score,
                    overallScore: overallScore,
                    tests: {
                        design: designTest.tests,
                        navigation: navigationTest.tests,
                        functionality: functionalityTest.tests
                    },
                    success: true
                };

                // Report results
                console.log(`  ✅ Status: ${result.status} OK`);
                console.log(`  📊 Size: ${(result.size / 1024).toFixed(1)}KB`);
                console.log(`  🎨 Design Score: ${designTest.score}/100`);
                console.log(`  🧭 Navigation Score: ${navigationTest.score}/100`);
                console.log(`  ⚡ Functionality Score: ${functionalityTest.score}/100`);
                console.log(`  🏆 Overall Score: ${overallScore}/100`);

                // Check for issues
                if (designTest.score < 80) {
                    this.results.issues.push(`${page.name}: Low design score (${designTest.score}/100)`);
                }
                if (navigationTest.score < 80) {
                    this.results.issues.push(`${page.name}: Navigation issues (${navigationTest.score}/100)`);
                }
                if (functionalityTest.score < 80) {
                    this.results.issues.push(`${page.name}: Functionality issues (${functionalityTest.score}/100)`);
                }

                if (overallScore >= 90) {
                    this.results.successes.push(`${page.name}: Excellent unified design (${overallScore}/100)`);
                }

                this.results.pages.push(pageResult);
                this.results.summary.successfulPages++;

            } else {
                console.log(`  ❌ FAILED: ${result.error || result.status}`);
                this.results.pages.push({
                    ...page,
                    url: url,
                    success: false,
                    error: result.error || `HTTP ${result.status}`
                });
                this.results.summary.failedPages++;
            }
            
            console.log('');
        }
    }

    // Calcola score generali
    calculateOverallScores() {
        const successfulPages = this.results.pages.filter(p => p.success);
        
        if (successfulPages.length === 0) return;

        this.results.summary.unifiedDesignScore = Math.round(
            successfulPages.reduce((sum, p) => sum + p.designScore, 0) / successfulPages.length
        );
        
        this.results.summary.navigationScore = Math.round(
            successfulPages.reduce((sum, p) => sum + p.navigationScore, 0) / successfulPages.length
        );
        
        this.results.summary.functionalityScore = Math.round(
            successfulPages.reduce((sum, p) => sum + p.functionalityScore, 0) / successfulPages.length
        );
        
        this.results.summary.overallScore = Math.round(
            (this.results.summary.unifiedDesignScore + 
             this.results.summary.navigationScore + 
             this.results.summary.functionalityScore) / 3
        );
    }

    // Stampa riassunto finale
    printSummary() {
        this.calculateOverallScores();

        console.log('🏆 UNIFIED SITE TEST SUMMARY');
        console.log('=============================');
        console.log(`🎯 Overall Score: ${this.results.summary.overallScore}/100`);
        console.log(`📄 Successful Pages: ${this.results.summary.successfulPages}/${this.results.summary.totalPages}`);
        console.log(`❌ Failed Pages: ${this.results.summary.failedPages}/${this.results.summary.totalPages}`);
        
        console.log('\n📊 DETAILED SCORES:');
        console.log(`🎨 Unified Design: ${this.results.summary.unifiedDesignScore}/100`);
        console.log(`🧭 Navigation: ${this.results.summary.navigationScore}/100`);
        console.log(`⚡ Functionality: ${this.results.summary.functionalityScore}/100`);

        if (this.results.successes.length > 0) {
            console.log('\n✅ SUCCESSES:');
            this.results.successes.forEach(success => {
                console.log(`  ${success}`);
            });
        }

        if (this.results.issues.length > 0) {
            console.log('\n⚠️  ISSUES TO REVIEW:');
            this.results.issues.forEach(issue => {
                console.log(`  ${issue}`);
            });
        }

        // Final assessment
        if (this.results.summary.overallScore >= 95) {
            console.log('\n🎉 PERFECT! Site is completely unified with excellent modern design.');
        } else if (this.results.summary.overallScore >= 90) {
            console.log('\n🌟 EXCELLENT! Site unification is nearly perfect.');
        } else if (this.results.summary.overallScore >= 80) {
            console.log('\n✅ GOOD! Site is well unified with minor improvements needed.');
        } else if (this.results.summary.overallScore >= 70) {
            console.log('\n⚠️  FAIR! Site unification needs some work.');
        } else {
            console.log('\n❌ POOR! Site unification needs significant improvements.');
        }

        console.log(`\n🌐 Test completed at: ${this.results.timestamp}`);
        console.log(`🔗 Site URL: ${SITE_BASE_URL}`);
    }

    // Esegue tutti i test
    async runAllTests() {
        await this.testAllPages();
        this.printSummary();
    }
}

// Esegui i test
const tester = new UnifiedSiteTester();
tester.runAllTests().catch(console.error);
