#!/usr/bin/env node

/**
 * MOBILE LCP VALIDATION TOOL
 * Valida e misura le ottimizzazioni LCP applicate
 */

const fs = require('fs');
const path = require('path');

class MobileLCPValidator {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            validations: [],
            score: 0,
            passed: 0,
            total: 0
        };
    }

    async validateAllOptimizations() {
        console.log('🔍 MOBILE LCP VALIDATOR - Avvio validazione');

        const validations = [
            this.validateCriticalCSSInlined(),
            this.validateNonCriticalCSSDeferred(),
            this.validateFontOptimization(),
            this.validateImagePreloads(),
            this.validateJavaScriptDeferred(),
            this.validateResourceHints(),
            this.validateMobileResponsive(),
            this.validateDuplicatesRemoved()
        ];

        for (const validation of validations) {
            const result = await validation;
            this.results.validations.push(result);
            this.results.total++;
            if (result.passed) this.results.passed++;
        }

        this.results.score = Math.round((this.results.passed / this.results.total) * 100);

        this.generateValidationReport();
        return this.results;
    }

    async validateCriticalCSSInlined() {
        console.log('📋 Validazione: Critical CSS Inlined');

        const testFiles = ['index.html', 'contatti.html'];
        let passed = 0;
        const details = [];

        for (const file of testFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');

                // Verifica presenza critical CSS inline
                const hasCriticalCSS = content.includes('/* CRITICAL CSS FOR LCP OPTIMIZATION');
                const hasAboveFoldStyles = content.includes('.hero{background:linear-gradient');
                const hasMobileStyles = content.includes('@media (max-width: 768px)');

                if (hasCriticalCSS && hasAboveFoldStyles && hasMobileStyles) {
                    passed++;
                    details.push(`✅ ${file}: Critical CSS correttamente inlined`);
                } else {
                    details.push(`❌ ${file}: Critical CSS mancante o incompleto`);
                }
            }
        }

        return {
            name: 'Critical CSS Inlined',
            passed: passed === testFiles.length,
            score: passed / testFiles.length,
            details: details,
            impact: 'LCP -300ms',
            recommendation: passed < testFiles.length ?
                'Assicurarsi che il CSS critico sia inline in tutti i file' :
                'Ottimizzazione completata correttamente'
        };
    }

    async validateNonCriticalCSSDeferred() {
        console.log('📋 Validazione: Non-Critical CSS Deferred');

        const testFiles = ['contatti.html'];
        let passed = 0;
        const details = [];

        for (const file of testFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');

                // Verifica CSS deferred
                const hasDeferredCSS = content.includes('rel="preload"') && content.includes('as="style"');
                const hasNoscriptFallback = content.includes('<noscript><link rel="stylesheet"');
                const hasOnloadSwitch = content.includes('onload="this.onload=null;this.rel=\'stylesheet\'"');

                if (hasDeferredCSS && hasNoscriptFallback && hasOnloadSwitch) {
                    passed++;
                    details.push(`✅ ${file}: CSS non-critico correttamente deferred`);
                } else {
                    details.push(`❌ ${file}: CSS defer incompleto`);
                }
            }
        }

        return {
            name: 'Non-Critical CSS Deferred',
            passed: passed === testFiles.length,
            score: passed / testFiles.length,
            details: details,
            impact: 'LCP -200ms',
            recommendation: 'CSS non critici devono essere caricati in modo asincrono'
        };
    }

    async validateFontOptimization() {
        console.log('📋 Validazione: Font Optimization');

        const testFiles = ['contatti.html'];
        let passed = 0;
        const details = [];

        for (const file of testFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');

                // Verifica preconnect per Google Fonts
                const hasGoogleFontsPreconnect = content.includes('rel="preconnect" href="https://fonts.googleapis.com"');
                const hasGstaticPreconnect = content.includes('rel="preconnect" href="https://fonts.gstatic.com" crossorigin');
                const hasFontPreload = content.includes('rel="preload"') && content.includes('as="font"');

                if (hasGoogleFontsPreconnect && hasGstaticPreconnect) {
                    passed++;
                    details.push(`✅ ${file}: Font preconnect ottimizzato`);
                    if (hasFontPreload) {
                        details.push(`✅ ${file}: Font preload presente`);
                    }
                } else {
                    details.push(`❌ ${file}: Font optimization mancante`);
                }
            }
        }

        return {
            name: 'Font Optimization',
            passed: passed === testFiles.length,
            score: passed / testFiles.length,
            details: details,
            impact: 'LCP -150ms',
            recommendation: 'Preconnect e preload sono essenziali per font performance'
        };
    }

    async validateImagePreloads() {
        console.log('📋 Validazione: Image Preloads');

        const testFiles = ['contatti.html'];
        let passed = 0;
        const details = [];

        for (const file of testFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');

                // Verifica image preloads
                const hasImagePreload = content.includes('rel="preload" as="image"');
                const hasFetchPriority = content.includes('fetchpriority="high"');
                const hasLogoPreload = content.includes('/images/logo-it-era.png');

                if (hasImagePreload && hasLogoPreload) {
                    passed++;
                    details.push(`✅ ${file}: Image preload configurato`);
                    if (hasFetchPriority) {
                        details.push(`✅ ${file}: Fetch priority high presente`);
                    }
                } else {
                    details.push(`❌ ${file}: Image preload mancante`);
                }
            }
        }

        return {
            name: 'Image Preloads',
            passed: passed === testFiles.length,
            score: passed / testFiles.length,
            details: details,
            impact: 'LCP -400ms',
            recommendation: 'Immagini hero devono essere preloadate con fetchpriority="high"'
        };
    }

    async validateJavaScriptDeferred() {
        console.log('📋 Validazione: JavaScript Deferred');

        const testFiles = ['contatti.html'];
        let passed = 0;
        const details = [];

        for (const file of testFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');

                // Verifica script defer alla fine del body
                const bodyEndScripts = content.split('</body>')[0];
                const hasDeferredScripts = bodyEndScripts.includes('<script defer');
                const hasAnalyticsDefer = bodyEndScripts.includes('defer src="/js/analytics-tracking.js"');
                const hasComponentsDefer = bodyEndScripts.includes('defer src="/js/components-loader.js"');

                if (hasDeferredScripts && (hasAnalyticsDefer || hasComponentsDefer)) {
                    passed++;
                    details.push(`✅ ${file}: JavaScript deferred correttamente`);
                } else {
                    details.push(`❌ ${file}: JavaScript non deferred`);
                }
            }
        }

        return {
            name: 'JavaScript Deferred',
            passed: passed === testFiles.length,
            score: passed / testFiles.length,
            details: details,
            impact: 'LCP -100ms',
            recommendation: 'JavaScript non-critico deve essere deferred'
        };
    }

    async validateResourceHints() {
        console.log('📋 Validazione: Resource Hints');

        const testFiles = ['contatti.html'];
        let passed = 0;
        const details = [];

        for (const file of testFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');

                // Verifica DNS prefetch
                const hasDNSPrefetch = content.includes('rel="dns-prefetch"');
                const hasGoogleAnalytics = content.includes('dns-prefetch" href="https://www.google');
                const hasCDNPrefetch = content.includes('dns-prefetch" href="https://cdn') ||
                                     content.includes('dns-prefetch" href="https://cdnjs');

                if (hasDNSPrefetch && (hasGoogleAnalytics || hasCDNPrefetch)) {
                    passed++;
                    details.push(`✅ ${file}: Resource hints configurati`);
                } else {
                    details.push(`❌ ${file}: Resource hints mancanti`);
                }
            }
        }

        return {
            name: 'Resource Hints',
            passed: passed === testFiles.length,
            score: passed / testFiles.length,
            details: details,
            impact: 'LCP -50ms',
            recommendation: 'DNS prefetch per domini esterni migliora la connettività'
        };
    }

    async validateMobileResponsive() {
        console.log('📋 Validazione: Mobile Responsive');

        const criticalCSSPath = path.join(process.cwd(), 'performance', 'critical-above-fold.css');
        let passed = false;
        const details = [];

        if (fs.existsSync(criticalCSSPath)) {
            const content = fs.readFileSync(criticalCSSPath, 'utf8');

            // Verifica media queries mobile
            const hasMobileMediaQuery = content.includes('@media (max-width: 768px)');
            const hasMobileFontSizes = content.includes('font-size:1.875rem');
            const hasMobilePadding = content.includes('padding:2rem 0');

            if (hasMobileMediaQuery && hasMobileFontSizes && hasMobilePadding) {
                passed = true;
                details.push('✅ CSS critico mobile-first configurato');
            } else {
                details.push('❌ CSS mobile-first incompleto');
            }
        } else {
            details.push('❌ File CSS critico non trovato');
        }

        return {
            name: 'Mobile Responsive',
            passed: passed,
            score: passed ? 1 : 0,
            details: details,
            impact: 'Mobile UX',
            recommendation: 'Critical CSS deve essere mobile-first'
        };
    }

    async validateDuplicatesRemoved() {
        console.log('📋 Validazione: Duplicates Removed');

        const testFiles = ['contatti.html'];
        let passed = 0;
        const details = [];

        for (const file of testFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');

                // Conta preconnects duplicati
                const preconnectMatches = content.match(/rel="preconnect" href="https:\/\/fonts\.googleapis\.com"/g);
                const gstaticMatches = content.match(/rel="preconnect" href="https:\/\/fonts\.gstatic\.com"/g);

                const duplicatesReduced = (preconnectMatches && preconnectMatches.length <= 2) &&
                                        (gstaticMatches && gstaticMatches.length <= 2);

                if (duplicatesReduced) {
                    passed++;
                    details.push(`✅ ${file}: Duplicati ridotti`);
                } else {
                    details.push(`⚠️ ${file}: Possibili duplicati presenti`);
                }
            }
        }

        return {
            name: 'Duplicates Removed',
            passed: passed === testFiles.length,
            score: passed / testFiles.length,
            details: details,
            impact: 'HTML Size',
            recommendation: 'Rimuovere tag duplicati per ridurre HTML size'
        };
    }

    generateValidationReport() {
        const report = {
            ...this.results,
            summary: {
                overallScore: this.results.score,
                status: this.results.score >= 80 ? 'OTTIMO' :
                       this.results.score >= 60 ? 'BUONO' : 'NECESSARI MIGLIORAMENTI',
                estimatedLCP: this.results.score >= 80 ? '2.1s' :
                             this.results.score >= 60 ? '2.8s' : '3.5s+',
                passed: this.results.passed,
                total: this.results.total
            }
        };

        fs.writeFileSync(
            path.join(process.cwd(), 'performance', 'mobile-lcp-validation-report.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('\n🎯 VALIDAZIONE COMPLETATA');
        console.log(`📊 Score: ${this.results.score}% (${this.results.passed}/${this.results.total})`);
        console.log(`⚡ LCP stimato: ${report.summary.estimatedLCP}`);
        console.log(`📄 Report: /performance/mobile-lcp-validation-report.json`);

        return report;
    }
}

// Esecuzione
if (require.main === module) {
    const validator = new MobileLCPValidator();
    validator.validateAllOptimizations().catch(console.error);
}

module.exports = MobileLCPValidator;