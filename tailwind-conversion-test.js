#!/usr/bin/env node

const https = require('https');

// Configurazione test
const SITE_BASE_URL = 'https://userx87.github.io/it-era';
const TEST_PAGES = [
    { path: '/', name: 'Homepage' },
    { path: '/servizi.html', name: 'Servizi' },
    { path: '/contatti.html', name: 'Contatti' }
];

class TailwindConversionTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            pages: [],
            summary: {
                totalPages: TEST_PAGES.length,
                pagesWithTailwindConfig: 0,
                pagesWithUnifiedCSS: 0,
                pagesWithOldCSS: 0,
                tailwindUtilitiesFound: 0,
                customComponentsFound: 0,
                overallScore: 0
            },
            issues: [],
            recommendations: []
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

    // Analizza la conversione Tailwind
    analyzeTailwindConversion(content) {
        const analysis = {
            // CSS Framework Detection
            hasTailwindCDN: content.includes('tailwindcss.com'),
            hasTailwindConfig: content.includes('tailwind-config.js'),
            hasUnifiedCSS: content.includes('it-era-tailwind.css'),
            
            // Old CSS Detection (should be removed)
            hasOldStyles: content.includes('/styles.css'),
            hasOldChatbot: content.includes('enhanced-chatbot.min.css'),
            hasOldAssistenza: content.includes('assistenza-informatica.css'),
            
            // Tailwind Utilities Count
            tailwindUtilities: this.countTailwindUtilities(content),
            
            // Custom Components Count
            customComponents: this.countCustomComponents(content),
            
            // Design System Elements
            designSystemElements: this.countDesignSystemElements(content),
            
            // Interactive Elements
            interactiveElements: this.countInteractiveElements(content),
            
            // Responsive Design
            responsiveClasses: this.countResponsiveClasses(content)
        };

        return analysis;
    }

    // Conta le utility Tailwind
    countTailwindUtilities(content) {
        const utilities = [
            // Layout
            'container-it', 'flex', 'grid', 'block', 'inline', 'hidden',
            // Spacing
            'p-', 'm-', 'px-', 'py-', 'mx-', 'my-', 'space-x-', 'space-y-',
            // Sizing
            'w-', 'h-', 'max-w-', 'min-h-',
            // Typography
            'text-', 'font-', 'leading-', 'tracking-',
            // Colors
            'bg-', 'text-blue-', 'text-gray-', 'border-',
            // Effects
            'shadow-', 'rounded-', 'opacity-', 'transition-',
            // Responsive
            'sm:', 'md:', 'lg:', 'xl:', '2xl:',
            // States
            'hover:', 'focus:', 'active:', 'group-hover:'
        ];

        let count = 0;
        utilities.forEach(utility => {
            const regex = new RegExp(`class="[^"]*\\b${utility.replace('-', '\\-')}`, 'g');
            const matches = content.match(regex) || [];
            count += matches.length;
        });

        return count;
    }

    // Conta i componenti personalizzati
    countCustomComponents(content) {
        const components = [
            'btn-it-primary', 'btn-it-secondary', 'btn-it-outline',
            'card-it', 'card-it-featured',
            'input-it', 'textarea-it', 'label-it',
            'nav-link-it', 'hero-it', 'section-it'
        ];

        let count = 0;
        components.forEach(component => {
            const regex = new RegExp(`class="[^"]*\\b${component}\\b[^"]*"`, 'g');
            const matches = content.match(regex) || [];
            count += matches.length;
        });

        return count;
    }

    // Conta elementi del design system
    countDesignSystemElements(content) {
        return {
            gradients: (content.match(/bg-gradient-/g) || []).length,
            animations: (content.match(/animate-/g) || []).length,
            shadows: (content.match(/shadow-/g) || []).length,
            borders: (content.match(/border-/g) || []).length,
            spacing: (content.match(/(?:p|m|space)-\d+/g) || []).length
        };
    }

    // Conta elementi interattivi
    countInteractiveElements(content) {
        return {
            buttons: (content.match(/<button[^>]*>/g) || []).length,
            links: (content.match(/<a[^>]*href/g) || []).length,
            forms: (content.match(/<form[^>]*>/g) || []).length,
            inputs: (content.match(/<input[^>]*>/g) || []).length,
            dropdowns: (content.match(/dropdown|group-hover/g) || []).length
        };
    }

    // Conta classi responsive
    countResponsiveClasses(content) {
        const breakpoints = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];
        let count = 0;
        
        breakpoints.forEach(bp => {
            const regex = new RegExp(`class="[^"]*\\b${bp}`, 'g');
            const matches = content.match(regex) || [];
            count += matches.length;
        });

        return count;
    }

    // Calcola score per pagina
    calculatePageScore(analysis) {
        let score = 0;

        // Framework Setup (30 punti)
        if (analysis.hasTailwindCDN) score += 10;
        if (analysis.hasTailwindConfig) score += 10;
        if (analysis.hasUnifiedCSS) score += 10;

        // CSS Cleanup (20 punti)
        if (!analysis.hasOldStyles) score += 7;
        if (!analysis.hasOldChatbot) score += 7;
        if (!analysis.hasOldAssistenza) score += 6;

        // Tailwind Usage (25 punti)
        if (analysis.tailwindUtilities > 50) score += 15;
        else if (analysis.tailwindUtilities > 20) score += 10;
        else if (analysis.tailwindUtilities > 10) score += 5;

        if (analysis.customComponents > 5) score += 10;
        else if (analysis.customComponents > 2) score += 5;

        // Design System (15 punti)
        const dsElements = analysis.designSystemElements;
        if (dsElements.gradients > 0) score += 3;
        if (dsElements.animations > 0) score += 3;
        if (dsElements.shadows > 0) score += 3;
        if (dsElements.spacing > 10) score += 3;
        if (dsElements.borders > 0) score += 3;

        // Responsive Design (10 punti)
        if (analysis.responsiveClasses > 20) score += 10;
        else if (analysis.responsiveClasses > 10) score += 7;
        else if (analysis.responsiveClasses > 5) score += 4;

        return Math.min(score, 100);
    }

    // Testa tutte le pagine
    async testAllPages() {
        console.log('🎨 TAILWIND CSS CONVERSION TEST');
        console.log('===============================\n');

        for (const page of TEST_PAGES) {
            const url = `${SITE_BASE_URL}${page.path}`;
            console.log(`📄 Testing: ${page.name} (${page.path})`);

            const result = await this.testUrl(url);
            
            if (result.success) {
                const analysis = this.analyzeTailwindConversion(result.content);
                const score = this.calculatePageScore(analysis);
                
                const pageResult = {
                    ...page,
                    url: url,
                    status: result.status,
                    size: result.size,
                    analysis: analysis,
                    score: score,
                    success: true
                };

                // Update summary
                if (analysis.hasTailwindConfig) this.results.summary.pagesWithTailwindConfig++;
                if (analysis.hasUnifiedCSS) this.results.summary.pagesWithUnifiedCSS++;
                if (analysis.hasOldStyles || analysis.hasOldChatbot || analysis.hasOldAssistenza) {
                    this.results.summary.pagesWithOldCSS++;
                }
                
                this.results.summary.tailwindUtilitiesFound += analysis.tailwindUtilities;
                this.results.summary.customComponentsFound += analysis.customComponents;

                // Report results
                console.log(`  ✅ Status: ${result.status} OK`);
                console.log(`  📊 Size: ${(result.size / 1024).toFixed(1)}KB`);
                console.log(`  🎯 Score: ${score}/100`);
                
                console.log(`  🔧 Framework:`);
                console.log(`    ${analysis.hasTailwindCDN ? '✅' : '❌'} Tailwind CDN`);
                console.log(`    ${analysis.hasTailwindConfig ? '✅' : '❌'} Custom Config`);
                console.log(`    ${analysis.hasUnifiedCSS ? '✅' : '❌'} Unified CSS`);
                
                console.log(`  🧹 CSS Cleanup:`);
                console.log(`    ${!analysis.hasOldStyles ? '✅' : '❌'} Old styles.css removed`);
                console.log(`    ${!analysis.hasOldChatbot ? '✅' : '❌'} Old chatbot CSS removed`);
                console.log(`    ${!analysis.hasOldAssistenza ? '✅' : '❌'} Old assistenza CSS removed`);
                
                console.log(`  🎨 Tailwind Usage:`);
                console.log(`    📦 Utilities: ${analysis.tailwindUtilities}`);
                console.log(`    🧩 Components: ${analysis.customComponents}`);
                console.log(`    📱 Responsive: ${analysis.responsiveClasses}`);

                // Check for issues
                if (analysis.hasOldStyles || analysis.hasOldChatbot || analysis.hasOldAssistenza) {
                    this.results.issues.push(`${page.name}: Still has old CSS files`);
                }
                if (analysis.tailwindUtilities < 10) {
                    this.results.issues.push(`${page.name}: Low Tailwind utility usage`);
                }
                if (!analysis.hasTailwindConfig) {
                    this.results.issues.push(`${page.name}: Missing Tailwind config`);
                }

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

    // Genera raccomandazioni
    generateRecommendations() {
        if (this.results.summary.pagesWithOldCSS > 0) {
            this.results.recommendations.push({
                priority: 'High',
                category: 'CSS Cleanup',
                issue: `${this.results.summary.pagesWithOldCSS} pages still have old CSS files`,
                solution: 'Remove references to old CSS files and ensure all styling uses Tailwind'
            });
        }

        if (this.results.summary.pagesWithTailwindConfig < this.results.summary.totalPages) {
            this.results.recommendations.push({
                priority: 'Medium',
                category: 'Configuration',
                issue: 'Not all pages have Tailwind config',
                solution: 'Add tailwind-config.js to all pages for consistent styling'
            });
        }

        const avgUtilities = this.results.summary.tailwindUtilitiesFound / this.results.summary.totalPages;
        if (avgUtilities < 30) {
            this.results.recommendations.push({
                priority: 'Medium',
                category: 'Tailwind Usage',
                issue: `Low average Tailwind utility usage: ${avgUtilities.toFixed(1)} per page`,
                solution: 'Convert more custom CSS to Tailwind utilities for better maintainability'
            });
        }
    }

    // Calcola score generale
    calculateOverallScore() {
        if (this.results.pages.length === 0) return 0;
        
        const totalScore = this.results.pages
            .filter(p => p.success)
            .reduce((sum, p) => sum + p.score, 0);
        
        return Math.round(totalScore / this.results.pages.filter(p => p.success).length);
    }

    // Stampa riassunto finale
    printSummary() {
        this.generateRecommendations();
        this.results.summary.overallScore = this.calculateOverallScore();

        console.log('🏆 TAILWIND CONVERSION SUMMARY');
        console.log('==============================');
        console.log(`🎯 Overall Score: ${this.results.summary.overallScore}/100`);
        console.log(`📄 Pages Tested: ${this.results.summary.totalPages}`);
        console.log(`🔧 Pages with Tailwind Config: ${this.results.summary.pagesWithTailwindConfig}/${this.results.summary.totalPages}`);
        console.log(`🎨 Pages with Unified CSS: ${this.results.summary.pagesWithUnifiedCSS}/${this.results.summary.totalPages}`);
        console.log(`🧹 Pages with Old CSS: ${this.results.summary.pagesWithOldCSS}/${this.results.summary.totalPages}`);
        console.log(`📦 Total Tailwind Utilities: ${this.results.summary.tailwindUtilitiesFound}`);
        console.log(`🧩 Total Custom Components: ${this.results.summary.customComponentsFound}`);
        console.log(`⚠️  Issues Found: ${this.results.issues.length}`);

        if (this.results.summary.overallScore >= 90) {
            console.log('\n🎉 EXCELLENT! Tailwind conversion is complete and professional.');
        } else if (this.results.summary.overallScore >= 80) {
            console.log('\n✅ GOOD! Tailwind conversion is mostly complete with minor issues.');
        } else if (this.results.summary.overallScore >= 70) {
            console.log('\n⚠️  FAIR! Tailwind conversion needs some improvements.');
        } else {
            console.log('\n❌ POOR! Tailwind conversion needs significant work.');
        }

        if (this.results.recommendations.length > 0) {
            console.log('\n💡 TOP RECOMMENDATIONS:');
            this.results.recommendations.slice(0, 3).forEach((rec, i) => {
                console.log(`${i + 1}. [${rec.priority}] ${rec.issue}`);
            });
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
const tester = new TailwindConversionTester();
tester.runAllTests().catch(console.error);
