#!/usr/bin/env node

const https = require('https');

// Configurazione test
const SITE_BASE_URL = 'https://userx87.github.io/it-era';
const TEST_PAGES = [
    { path: '/', name: 'Homepage' },
    { path: '/servizi.html', name: 'Servizi' },
    { path: '/contatti.html', name: 'Contatti' },
    { path: '/settori/commercialisti.html', name: 'Settore Commercialisti' },
    { path: '/blog/', name: 'Blog' }
];

const CSS_FILES = [
    { path: '/styles.css', name: 'Main CSS' },
    { path: '/css/enhanced-chatbot.min.css', name: 'Chatbot CSS' },
    { path: '/css/assistenza-informatica.css', name: 'Settori CSS' }
];

class CSSLoadingTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            pages: [],
            cssFiles: [],
            summary: {
                totalPages: TEST_PAGES.length,
                pagesWithTailwind: 0,
                pagesWithBootstrap: 0,
                cssFilesLoaded: 0,
                cssFilesFailed: 0,
                overallStatus: 'UNKNOWN'
            }
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
                        size: data.length,
                        headers: res.headers
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

    // Analizza il contenuto HTML per framework CSS
    analyzePageCSS(content) {
        const analysis = {
            hasTailwind: content.includes('tailwindcss.com'),
            hasBootstrap: content.includes('bootstrap'),
            hasCustomCSS: content.includes('/styles.css') || content.includes('/css/'),
            tailwindClasses: this.countTailwindClasses(content),
            bootstrapClasses: this.countBootstrapClasses(content),
            customStyles: content.includes('<style>') || content.includes('style=')
        };

        return analysis;
    }

    // Conta le classi Tailwind comuni
    countTailwindClasses(content) {
        const tailwindClasses = [
            'container', 'mx-auto', 'px-4', 'py-3', 'flex', 'items-center',
            'justify-between', 'text-gray-700', 'hover:text-blue-600',
            'bg-white', 'shadow-sm', 'fixed', 'top-0', 'left-0', 'right-0',
            'z-50', 'md:flex', 'space-x-6', 'md:hidden', 'w-6', 'h-6'
        ];

        let count = 0;
        tailwindClasses.forEach(className => {
            const regex = new RegExp(`class="[^"]*\\b${className}\\b[^"]*"`, 'g');
            const matches = content.match(regex) || [];
            count += matches.length;
        });

        return count;
    }

    // Conta le classi Bootstrap comuni
    countBootstrapClasses(content) {
        const bootstrapClasses = [
            'btn', 'btn-primary', 'btn-secondary', 'container-fluid',
            'row', 'col-', 'navbar', 'nav-link', 'card', 'card-body'
        ];

        let count = 0;
        bootstrapClasses.forEach(className => {
            const regex = new RegExp(`class="[^"]*\\b${className}\\b[^"]*"`, 'g');
            const matches = content.match(regex) || [];
            count += matches.length;
        });

        return count;
    }

    // Testa tutte le pagine
    async testAllPages() {
        console.log('🎨 TESTING CSS LOADING ON ALL PAGES');
        console.log('===================================\n');

        for (const page of TEST_PAGES) {
            const url = `${SITE_BASE_URL}${page.path}`;
            console.log(`📄 Testing: ${page.name} (${page.path})`);

            const result = await this.testUrl(url);
            
            if (result.success) {
                const cssAnalysis = this.analyzePageCSS(result.content);
                
                const pageResult = {
                    ...page,
                    url: url,
                    status: result.status,
                    size: result.size,
                    cssAnalysis: cssAnalysis,
                    success: true
                };

                // Aggiorna contatori
                if (cssAnalysis.hasTailwind) {
                    this.results.summary.pagesWithTailwind++;
                    console.log(`  ✅ Tailwind CSS: LOADED`);
                } else if (cssAnalysis.tailwindClasses > 0) {
                    console.log(`  ⚠️  Tailwind CSS: MISSING (${cssAnalysis.tailwindClasses} classes found)`);
                }

                if (cssAnalysis.hasBootstrap) {
                    this.results.summary.pagesWithBootstrap++;
                    console.log(`  ✅ Bootstrap CSS: LOADED`);
                }

                if (cssAnalysis.hasCustomCSS) {
                    console.log(`  ✅ Custom CSS: INCLUDED`);
                }

                console.log(`  📊 Size: ${(result.size / 1024).toFixed(1)}KB`);
                console.log(`  🎯 CSS Framework: ${cssAnalysis.hasTailwind ? 'Tailwind' : cssAnalysis.hasBootstrap ? 'Bootstrap' : 'Custom'}`);

                this.results.pages.push(pageResult);
            } else {
                console.log(`  ❌ FAILED: ${result.error || result.status}`);
                this.results.pages.push({
                    ...page,
                    url: url,
                    success: false,
                    error: result.error || `HTTP ${result.status}`
                });
            }
            
            console.log('');
        }
    }

    // Testa tutti i file CSS
    async testAllCSSFiles() {
        console.log('🎨 TESTING CSS FILES DIRECTLY');
        console.log('==============================\n');

        for (const cssFile of CSS_FILES) {
            const url = `${SITE_BASE_URL}${cssFile.path}`;
            console.log(`📄 Testing: ${cssFile.name} (${cssFile.path})`);

            const result = await this.testUrl(url);
            
            if (result.success) {
                this.results.summary.cssFilesLoaded++;
                console.log(`  ✅ Status: ${result.status} OK`);
                console.log(`  📊 Size: ${(result.size / 1024).toFixed(1)}KB`);
                console.log(`  🕐 Content-Type: ${result.headers['content-type'] || 'unknown'}`);

                this.results.cssFiles.push({
                    ...cssFile,
                    url: url,
                    status: result.status,
                    size: result.size,
                    contentType: result.headers['content-type'],
                    success: true
                });
            } else {
                this.results.summary.cssFilesFailed++;
                console.log(`  ❌ FAILED: ${result.error || result.status}`);

                this.results.cssFiles.push({
                    ...cssFile,
                    url: url,
                    success: false,
                    error: result.error || `HTTP ${result.status}`
                });
            }
            
            console.log('');
        }
    }

    // Determina lo status generale
    determineOverallStatus() {
        const successfulPages = this.results.pages.filter(p => p.success).length;
        const pagesWithCSS = this.results.summary.pagesWithTailwind + this.results.summary.pagesWithBootstrap;
        const cssFilesWorking = this.results.summary.cssFilesLoaded;

        if (successfulPages === TEST_PAGES.length && 
            pagesWithCSS >= 3 && 
            cssFilesWorking === CSS_FILES.length) {
            this.results.summary.overallStatus = 'EXCELLENT';
        } else if (successfulPages >= TEST_PAGES.length * 0.8 && 
                   pagesWithCSS >= 2 && 
                   cssFilesWorking >= CSS_FILES.length * 0.8) {
            this.results.summary.overallStatus = 'GOOD';
        } else if (successfulPages >= TEST_PAGES.length * 0.6) {
            this.results.summary.overallStatus = 'FAIR';
        } else {
            this.results.summary.overallStatus = 'POOR';
        }
    }

    // Stampa riassunto finale
    printSummary() {
        this.determineOverallStatus();

        console.log('📊 FINAL CSS LOADING REPORT');
        console.log('============================');
        console.log(`🎯 Overall Status: ${this.results.summary.overallStatus}`);
        console.log(`📄 Pages Tested: ${this.results.summary.totalPages}`);
        console.log(`🎨 Pages with Tailwind: ${this.results.summary.pagesWithTailwind}`);
        console.log(`🅱️  Pages with Bootstrap: ${this.results.summary.pagesWithBootstrap}`);
        console.log(`📁 CSS Files Loaded: ${this.results.summary.cssFilesLoaded}/${CSS_FILES.length}`);
        console.log(`❌ CSS Files Failed: ${this.results.summary.cssFilesFailed}`);

        console.log('\n🎯 RECOMMENDATIONS:');
        
        if (this.results.summary.overallStatus === 'EXCELLENT') {
            console.log('✅ All CSS is loading correctly! Site is fully styled.');
        } else if (this.results.summary.overallStatus === 'GOOD') {
            console.log('✅ Most CSS is working. Minor issues may exist.');
        } else {
            console.log('⚠️  CSS loading issues detected. Check the following:');
            
            if (this.results.summary.cssFilesFailed > 0) {
                console.log('   - Fix broken CSS file paths');
            }
            
            const pagesWithoutCSS = this.results.pages.filter(p => 
                p.success && p.cssAnalysis && 
                !p.cssAnalysis.hasTailwind && 
                !p.cssAnalysis.hasBootstrap && 
                p.cssAnalysis.tailwindClasses > 0
            );
            
            if (pagesWithoutCSS.length > 0) {
                console.log('   - Add missing CSS frameworks to pages:');
                pagesWithoutCSS.forEach(page => {
                    console.log(`     * ${page.name}: Missing Tailwind CSS`);
                });
            }
        }

        console.log(`\n🌐 Test completed at: ${this.results.timestamp}`);
        console.log(`🔗 Site URL: ${SITE_BASE_URL}`);
    }

    // Esegue tutti i test
    async runAllTests() {
        await this.testAllPages();
        await this.testAllCSSFiles();
        this.printSummary();
    }
}

// Esegui i test
const tester = new CSSLoadingTester();
tester.runAllTests().catch(console.error);
