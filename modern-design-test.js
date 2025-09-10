#!/usr/bin/env node

const https = require('https');

// Configurazione test design moderno
const SITE_BASE_URL = 'https://userx87.github.io/it-era';
const TEST_PAGES = [
    { path: '/', name: 'Homepage' }
];

class ModernDesignTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            pages: [],
            summary: {
                totalPages: TEST_PAGES.length,
                modernComponentsFound: 0,
                oldComponentsFound: 0,
                designSystemScore: 0,
                responsiveScore: 0,
                interactivityScore: 0,
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

    // Analizza il design moderno
    analyzeModernDesign(content) {
        const analysis = {
            // Modern Components
            modernComponents: this.countModernComponents(content),
            
            // Old Components (should be removed)
            oldComponents: this.countOldComponents(content),
            
            // Design System Elements
            designSystem: this.analyzeDesignSystem(content),
            
            // Responsive Design
            responsiveDesign: this.analyzeResponsiveDesign(content),
            
            // Interactivity
            interactivity: this.analyzeInteractivity(content),
            
            // Modern CSS Classes
            modernClasses: this.countModernClasses(content),
            
            // Performance Optimizations
            performance: this.analyzePerformance(content)
        };

        return analysis;
    }

    // Conta componenti moderni
    countModernComponents(content) {
        const modernComponents = [
            'btn-primary', 'btn-secondary', 'btn-outline',
            'card-service', 'card-featured',
            'backdrop-blur', 'glassmorphism',
            'gradient-to-br', 'rounded-3xl', 'rounded-2xl',
            'shadow-2xl', 'shadow-3xl',
            'animate-fade-in', 'animate-slide-up',
            'group-hover:', 'transform', 'transition-all'
        ];

        let count = 0;
        modernComponents.forEach(component => {
            const regex = new RegExp(`\\b${component.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
            const matches = content.match(regex) || [];
            count += matches.length;
        });

        return count;
    }

    // Conta componenti vecchi (da rimuovere)
    countOldComponents(content) {
        const oldComponents = [
            'btn-it-primary', 'btn-it-secondary', 'btn-it-outline',
            'card-it', 'card-it-featured',
            'nav-link-it', 'hero-it', 'section-it'
        ];

        let count = 0;
        oldComponents.forEach(component => {
            const regex = new RegExp(`\\b${component}\\b`, 'g');
            const matches = content.match(regex) || [];
            count += matches.length;
        });

        return count;
    }

    // Analizza design system
    analyzeDesignSystem(content) {
        return {
            brandColors: (content.match(/brand-\d+/g) || []).length,
            neutralColors: (content.match(/neutral-\d+/g) || []).length,
            modernSpacing: (content.match(/p-\d+|m-\d+|space-[xy]-\d+/g) || []).length,
            modernBorders: (content.match(/rounded-[23]xl/g) || []).length,
            gradients: (content.match(/gradient-to-/g) || []).length,
            shadows: (content.match(/shadow-[23]xl/g) || []).length
        };
    }

    // Analizza responsive design
    analyzeResponsiveDesign(content) {
        return {
            breakpoints: (content.match(/(?:sm|md|lg|xl|2xl):/g) || []).length,
            gridResponsive: (content.match(/grid-cols-1.*(?:md|lg):grid-cols-/g) || []).length,
            flexResponsive: (content.match(/flex-col.*(?:sm|md):flex-row/g) || []).length,
            textResponsive: (content.match(/text-\w+.*(?:md|lg):text-/g) || []).length,
            spacingResponsive: (content.match(/(?:p|m)-\d+.*(?:md|lg):(?:p|m)-/g) || []).length
        };
    }

    // Analizza interattività
    analyzeInteractivity(content) {
        return {
            hoverEffects: (content.match(/hover:/g) || []).length,
            groupHover: (content.match(/group-hover:/g) || []).length,
            transforms: (content.match(/transform|scale-|translate-/g) || []).length,
            transitions: (content.match(/transition-/g) || []).length,
            animations: (content.match(/animate-/g) || []).length,
            focusStates: (content.match(/focus:/g) || []).length
        };
    }

    // Conta classi moderne
    countModernClasses(content) {
        const modernClasses = [
            'backdrop-blur', 'bg-white/80', 'bg-white/95',
            'from-brand-', 'to-brand-', 'via-brand-',
            'rounded-3xl', 'rounded-2xl',
            'shadow-2xl', 'shadow-3xl',
            'group', 'group-hover:',
            'transform', 'scale-', 'translate-',
            'transition-all', 'duration-300'
        ];

        let count = 0;
        modernClasses.forEach(className => {
            const regex = new RegExp(`\\b${className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
            const matches = content.match(regex) || [];
            count += matches.length;
        });

        return count;
    }

    // Analizza performance
    analyzePerformance(content) {
        return {
            hasModernCSS: content.includes('it-era-tailwind.css'),
            hasModernConfig: content.includes('tailwind-config.js'),
            hasPreloading: content.includes('prefetch') || content.includes('preload'),
            hasOptimizedImages: content.includes('loading="lazy"'),
            hasMinifiedAssets: content.includes('.min.'),
            modernJavaScript: content.includes('IntersectionObserver')
        };
    }

    // Calcola score per pagina
    calculatePageScore(analysis) {
        let score = 0;

        // Modern Components (30 punti)
        if (analysis.modernComponents > 50) score += 30;
        else if (analysis.modernComponents > 30) score += 25;
        else if (analysis.modernComponents > 15) score += 20;
        else if (analysis.modernComponents > 5) score += 10;

        // No Old Components (20 punti)
        if (analysis.oldComponents === 0) score += 20;
        else if (analysis.oldComponents < 5) score += 15;
        else if (analysis.oldComponents < 10) score += 10;

        // Design System (20 punti)
        const ds = analysis.designSystem;
        if (ds.brandColors > 5) score += 5;
        if (ds.gradients > 3) score += 5;
        if (ds.modernBorders > 5) score += 5;
        if (ds.shadows > 3) score += 5;

        // Responsive Design (15 punti)
        const rd = analysis.responsiveDesign;
        if (rd.breakpoints > 20) score += 8;
        else if (rd.breakpoints > 10) score += 5;
        if (rd.gridResponsive > 0) score += 4;
        if (rd.textResponsive > 0) score += 3;

        // Interactivity (15 punti)
        const inter = analysis.interactivity;
        if (inter.hoverEffects > 10) score += 5;
        if (inter.transforms > 5) score += 5;
        if (inter.animations > 3) score += 5;

        return Math.min(score, 100);
    }

    // Testa tutte le pagine
    async testAllPages() {
        console.log('🎨 MODERN DESIGN SYSTEM TEST');
        console.log('=============================\n');

        for (const page of TEST_PAGES) {
            const url = `${SITE_BASE_URL}${page.path}`;
            console.log(`📄 Testing: ${page.name} (${page.path})`);

            const result = await this.testUrl(url);
            
            if (result.success) {
                const analysis = this.analyzeModernDesign(result.content);
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
                this.results.summary.modernComponentsFound += analysis.modernComponents;
                this.results.summary.oldComponentsFound += analysis.oldComponents;

                // Report results
                console.log(`  ✅ Status: ${result.status} OK`);
                console.log(`  📊 Size: ${(result.size / 1024).toFixed(1)}KB`);
                console.log(`  🎯 Design Score: ${score}/100`);
                
                console.log(`  🎨 Modern Components: ${analysis.modernComponents}`);
                console.log(`  🗑️  Old Components: ${analysis.oldComponents}`);
                console.log(`  🎭 Modern Classes: ${analysis.modernClasses}`);
                
                console.log(`  🎨 Design System:`);
                console.log(`    Brand Colors: ${analysis.designSystem.brandColors}`);
                console.log(`    Gradients: ${analysis.designSystem.gradients}`);
                console.log(`    Modern Borders: ${analysis.designSystem.modernBorders}`);
                console.log(`    Shadows: ${analysis.designSystem.shadows}`);
                
                console.log(`  📱 Responsive:`);
                console.log(`    Breakpoints: ${analysis.responsiveDesign.breakpoints}`);
                console.log(`    Grid Responsive: ${analysis.responsiveDesign.gridResponsive}`);
                console.log(`    Text Responsive: ${analysis.responsiveDesign.textResponsive}`);
                
                console.log(`  ⚡ Interactivity:`);
                console.log(`    Hover Effects: ${analysis.interactivity.hoverEffects}`);
                console.log(`    Transforms: ${analysis.interactivity.transforms}`);
                console.log(`    Animations: ${analysis.interactivity.animations}`);

                // Check for issues
                if (analysis.oldComponents > 0) {
                    this.results.issues.push(`${page.name}: Still has ${analysis.oldComponents} old components`);
                }
                if (analysis.modernComponents < 20) {
                    this.results.issues.push(`${page.name}: Low modern component usage`);
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
        this.results.summary.overallScore = this.calculateOverallScore();

        console.log('🏆 MODERN DESIGN SUMMARY');
        console.log('========================');
        console.log(`🎯 Overall Score: ${this.results.summary.overallScore}/100`);
        console.log(`🎨 Modern Components: ${this.results.summary.modernComponentsFound}`);
        console.log(`🗑️  Old Components: ${this.results.summary.oldComponentsFound}`);
        console.log(`⚠️  Issues Found: ${this.results.issues.length}`);

        if (this.results.summary.overallScore >= 90) {
            console.log('\n🎉 EXCELLENT! Modern design system is complete and professional.');
        } else if (this.results.summary.overallScore >= 80) {
            console.log('\n✅ GOOD! Modern design is mostly complete with minor improvements needed.');
        } else if (this.results.summary.overallScore >= 70) {
            console.log('\n⚠️  FAIR! Modern design needs some improvements.');
        } else {
            console.log('\n❌ POOR! Design system needs significant modernization.');
        }

        if (this.results.issues.length > 0) {
            console.log('\n💡 ISSUES TO FIX:');
            this.results.issues.forEach((issue, i) => {
                console.log(`${i + 1}. ${issue}`);
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
const tester = new ModernDesignTester();
tester.runAllTests().catch(console.error);
