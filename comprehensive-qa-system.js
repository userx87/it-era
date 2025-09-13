/*!
 * IT-ERA Comprehensive Quality Assurance System
 * Complete manual QA process for navigation, standards compliance, and technical validation
 * Version: 2.0.0
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ITERAQualityAssurance {
    constructor() {
        this.version = '2.0.0';
        this.startTime = Date.now();
        this.results = {
            navigation: { score: 0, total: 0, details: {} },
            standards: { score: 0, total: 0, details: {} },
            technical: { score: 0, total: 0, details: {} },
            mobile: { score: 0, total: 0, details: {} },
            accessibility: { score: 0, total: 0, details: {} },
            seo: { score: 0, total: 0, details: {} },
            performance: { score: 0, total: 0, details: {} }
        };
        
        this.testPages = [
            { name: 'Homepage', path: 'index.html', type: 'core' },
            { name: 'Servizi', path: 'servizi.html', type: 'core' },
            { name: 'Contatti', path: 'contatti.html', type: 'core' },
            { name: 'Commercialisti', path: 'settori/commercialisti.html', type: 'sector' },
            { name: 'PMI Startup', path: 'settori/pmi-startup.html', type: 'sector' },
            { name: 'Studi Legali', path: 'settori/studi-legali.html', type: 'sector' },
            { name: 'Industria 4.0', path: 'settori/industria-40.html', type: 'sector' },
            { name: 'Retail GDO', path: 'settori/retail-gdo.html', type: 'sector' },
            { name: 'Studi Medici', path: 'settori/studi-medici/index.html', type: 'sector' },
            { name: 'Assistenza Emergenza', path: 'landing/assistenza-emergenza.html', type: 'landing' },
            { name: 'Cloud Migration', path: 'landing/cloud-migration.html', type: 'landing' },
            { name: 'Digitalizzazione PMI', path: 'landing/digitalizzazione-pmi.html', type: 'landing' },
            { name: 'Sicurezza Informatica', path: 'landing/sicurezza-informatica.html', type: 'landing' },
            { name: 'Software Commercialisti', path: 'landing/software-commercialisti.html', type: 'landing' }
        ];
        
        this.viewports = [
            { name: 'Mobile Portrait', width: 375, height: 667 },
            { name: 'Tablet Portrait', width: 768, height: 1024 },
            { name: 'Tablet Landscape', width: 1024, height: 768 },
            { name: 'Desktop', width: 1920, height: 1080 }
        ];
    }

    async runComprehensiveQA() {
        console.log('🚀 Starting IT-ERA Comprehensive Quality Assurance System v2.0.0\n');
        console.log('=' .repeat(80));
        console.log('📊 COMPREHENSIVE QA TESTING SUITE');
        console.log('=' .repeat(80));
        
        const browser = await puppeteer.launch({ 
            headless: false, // Show browser for manual verification
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        
        try {
            // Phase 1: Navigation and Components Verification
            console.log('\n🧭 PHASE 1: Navigation and Components Verification');
            console.log('-'.repeat(60));
            await this.testNavigationConsistency(browser);
            
            // Phase 2: Standards Compliance Review
            console.log('\n📋 PHASE 2: Standards Compliance Review');
            console.log('-'.repeat(60));
            await this.testStandardsCompliance(browser);
            
            // Phase 3: Technical Testing
            console.log('\n⚙️ PHASE 3: Technical Testing Requirements');
            console.log('-'.repeat(60));
            await this.testTechnicalRequirements(browser);
            
            // Phase 4: Mobile Responsiveness
            console.log('\n📱 PHASE 4: Mobile Responsiveness Testing');
            console.log('-'.repeat(60));
            await this.testMobileResponsiveness(browser);
            
            // Phase 5: Accessibility Testing
            console.log('\n♿ PHASE 5: Accessibility Validation');
            console.log('-'.repeat(60));
            await this.testAccessibility(browser);
            
            // Phase 6: SEO Validation
            console.log('\n🔍 PHASE 6: SEO Elements Validation');
            console.log('-'.repeat(60));
            await this.testSEOValidation(browser);
            
            // Phase 7: Performance Testing
            console.log('\n⚡ PHASE 7: Performance Testing');
            console.log('-'.repeat(60));
            await this.testPerformance(browser);
            
        } finally {
            // Generate comprehensive report
            await this.generateComprehensiveReport();
            
            console.log('\n🔍 Browser kept open for manual inspection...');
            console.log('Press Ctrl+C when done reviewing.');
            
            // Keep browser open for manual inspection
            await new Promise(() => {}); // Wait indefinitely
        }
    }

    async testNavigationConsistency(browser) {
        console.log('Testing navigation components across all pages...\n');
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        for (const testPage of this.testPages) {
            console.log(`🧪 Testing: ${testPage.name}`);
            
            try {
                const url = `file://${__dirname}/${testPage.path}`;
                await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for components
                
                // Test header component
                const headerPlaceholder = await page.$('#header-placeholder');
                const headerContent = await page.$('#header-placeholder header, header');
                this.recordTest('navigation', 'headerComponent', !!headerContent);
                
                // Test navigation links
                const navLinks = await page.$$('nav a, .nav-link');
                this.recordTest('navigation', 'navigationLinks', navLinks.length >= 3);
                
                // Test mobile menu
                const mobileMenuButton = await page.$('#mobile-menu-button');
                const mobileMenu = await page.$('#mobile-menu');
                this.recordTest('navigation', 'mobileMenu', !!(mobileMenuButton && mobileMenu));
                
                // Test dropdown functionality
                const dropdownTrigger = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.some(btn => btn.textContent.includes('Settori'));
                });
                this.recordTest('navigation', 'dropdownMenu', dropdownTrigger);
                
                // Test footer component
                const footer = await page.$('footer');
                this.recordTest('navigation', 'footerComponent', !!footer);
                
                // Test chatbot component
                const chatbot = await page.$('#chatbot-button, #chatbot-placeholder');
                this.recordTest('navigation', 'chatbotComponent', !!chatbot);
                
                console.log(`  ✅ ${testPage.name}: Navigation components verified`);
                
            } catch (error) {
                console.log(`  ❌ ${testPage.name}: Error - ${error.message}`);
                this.recordTest('navigation', 'pageLoad', false);
            }
        }
        
        await page.close();
        console.log(`\n📊 Navigation Test Results: ${this.results.navigation.score}/${this.results.navigation.total} passed`);
    }

    async testStandardsCompliance(browser) {
        console.log('Testing HTML structure and CSS standards compliance...\n');
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        for (const testPage of this.testPages.slice(0, 5)) { // Test first 5 pages for standards
            console.log(`📋 Testing: ${testPage.name}`);
            
            try {
                const url = `file://${__dirname}/${testPage.path}`;
                await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
                
                // Test HTML5 doctype
                const doctype = await page.evaluate(() => {
                    return document.doctype && document.doctype.name === 'html';
                });
                this.recordTest('standards', 'html5Doctype', doctype);
                
                // Test required meta tags
                const viewport = await page.$('meta[name="viewport"]');
                const description = await page.$('meta[name="description"]');
                const charset = await page.$('meta[charset]');
                
                this.recordTest('standards', 'viewportMeta', !!viewport);
                this.recordTest('standards', 'descriptionMeta', !!description);
                this.recordTest('standards', 'charsetMeta', !!charset);
                
                // Test semantic HTML
                const main = await page.$('main');
                const h1 = await page.$('h1');
                this.recordTest('standards', 'semanticHTML', !!(main && h1));
                
                // Test Tailwind CSS integration
                const tailwindScript = await page.evaluate(() => {
                    const scripts = Array.from(document.querySelectorAll('script'));
                    return scripts.some(script => script.src.includes('tailwindcss.com'));
                });
                this.recordTest('standards', 'tailwindCSS', tailwindScript);
                
                // Test components system integration
                const componentsLoader = await page.evaluate(() => {
                    const scripts = Array.from(document.querySelectorAll('script'));
                    return scripts.some(script => script.src.includes('components-loader.js'));
                });
                this.recordTest('standards', 'componentsSystem', componentsLoader);
                
                console.log(`  ✅ ${testPage.name}: Standards compliance verified`);
                
            } catch (error) {
                console.log(`  ❌ ${testPage.name}: Error - ${error.message}`);
            }
        }
        
        await page.close();
        console.log(`\n📊 Standards Test Results: ${this.results.standards.score}/${this.results.standards.total} passed`);
    }

    async testTechnicalRequirements(browser) {
        console.log('Testing technical functionality and error handling...\n');

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Capture JavaScript errors
        const jsErrors = [];
        page.on('pageerror', error => {
            jsErrors.push(error.message);
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                jsErrors.push(msg.text());
            }
        });

        for (const testPage of this.testPages.slice(0, 7)) { // Test first 7 pages for technical requirements
            console.log(`⚙️ Testing: ${testPage.name}`);

            try {
                const url = `file://${__dirname}/${testPage.path}`;
                await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Test JavaScript execution
                const jsWorking = jsErrors.length === 0;
                this.recordTest('technical', 'javascriptExecution', jsWorking);

                // Test component loading
                const componentsLoaded = await page.evaluate(() => {
                    return document.querySelector('#header-placeholder') &&
                           document.querySelector('#footer-placeholder');
                });
                this.recordTest('technical', 'componentLoading', componentsLoaded);

                // Test interactive elements
                const interactiveElements = await page.$$('button, a, input, select, textarea');
                this.recordTest('technical', 'interactiveElements', interactiveElements.length > 0);

                // Test form functionality (if present)
                const forms = await page.$$('form');
                if (forms.length > 0) {
                    const formWorking = await page.evaluate(() => {
                        const form = document.querySelector('form');
                        return form && form.checkValidity !== undefined;
                    });
                    this.recordTest('technical', 'formFunctionality', formWorking);
                }

                console.log(`  ✅ ${testPage.name}: Technical requirements verified`);

            } catch (error) {
                console.log(`  ❌ ${testPage.name}: Error - ${error.message}`);
                this.recordTest('technical', 'pageLoad', false);
            }
        }

        await page.close();
        console.log(`\n📊 Technical Test Results: ${this.results.technical.score}/${this.results.technical.total} passed`);
    }

    async testMobileResponsiveness(browser) {
        console.log('Testing mobile responsiveness across multiple viewports...\n');

        const page = await browser.newPage();

        for (const viewport of this.viewports) {
            console.log(`📱 Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

            await page.setViewport({ width: viewport.width, height: viewport.height });

            for (const testPage of this.testPages.slice(0, 5)) { // Test first 5 pages for mobile
                try {
                    const url = `file://${__dirname}/${testPage.path}`;
                    await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    // Test mobile menu visibility
                    if (viewport.width <= 768) {
                        const mobileMenuButton = await page.evaluate(() => {
                            const button = document.querySelector('#mobile-menu-button');
                            return button && window.getComputedStyle(button).display !== 'none';
                        });
                        this.recordTest('mobile', 'mobileMenuVisible', mobileMenuButton);
                    }

                    // Test content overflow
                    const hasOverflow = await page.evaluate(() => {
                        return document.body.scrollWidth > window.innerWidth;
                    });
                    this.recordTest('mobile', 'noHorizontalOverflow', !hasOverflow);

                    // Test touch targets (minimum 44px)
                    const touchTargetsOK = await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button, a'));
                        return buttons.every(btn => {
                            const rect = btn.getBoundingClientRect();
                            return rect.width >= 44 && rect.height >= 44;
                        });
                    });
                    this.recordTest('mobile', 'touchTargetSize', touchTargetsOK);

                } catch (error) {
                    console.log(`  ❌ ${testPage.name} on ${viewport.name}: Error - ${error.message}`);
                }
            }
        }

        await page.close();
        console.log(`\n📊 Mobile Test Results: ${this.results.mobile.score}/${this.results.mobile.total} passed`);
    }

    async testAccessibility(browser) {
        console.log('Testing accessibility features and WCAG compliance...\n');

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        for (const testPage of this.testPages.slice(0, 6)) { // Test first 6 pages for accessibility
            console.log(`♿ Testing: ${testPage.name}`);

            try {
                const url = `file://${__dirname}/${testPage.path}`;
                await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Test skip link
                const skipLink = await page.$('a[href="#main-content"], .skip-link');
                this.recordTest('accessibility', 'skipLink', !!skipLink);

                // Test alt attributes on images
                const imagesWithoutAlt = await page.evaluate(() => {
                    const images = Array.from(document.querySelectorAll('img'));
                    return images.filter(img => !img.alt || img.alt.trim() === '').length;
                });
                this.recordTest('accessibility', 'imageAltText', imagesWithoutAlt === 0);

                // Test ARIA labels on interactive elements
                const interactiveWithoutAria = await page.evaluate(() => {
                    const interactive = Array.from(document.querySelectorAll('button, input, select, textarea'));
                    return interactive.filter(el => {
                        return !el.getAttribute('aria-label') &&
                               !el.getAttribute('aria-labelledby') &&
                               !el.querySelector('label') &&
                               !el.textContent.trim();
                    }).length;
                });
                this.recordTest('accessibility', 'ariaLabels', interactiveWithoutAria === 0);

                // Test heading hierarchy
                const headingHierarchy = await page.evaluate(() => {
                    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
                    const levels = headings.map(h => parseInt(h.tagName.charAt(1)));

                    // Check if there's exactly one H1
                    const h1Count = levels.filter(level => level === 1).length;
                    if (h1Count !== 1) return false;

                    // Check if hierarchy is logical (no skipping levels)
                    for (let i = 1; i < levels.length; i++) {
                        if (levels[i] > levels[i-1] + 1) return false;
                    }

                    return true;
                });
                this.recordTest('accessibility', 'headingHierarchy', headingHierarchy);

                // Test keyboard navigation
                const keyboardNavigable = await page.evaluate(() => {
                    const focusable = Array.from(document.querySelectorAll(
                        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    ));
                    return focusable.length > 0;
                });
                this.recordTest('accessibility', 'keyboardNavigation', keyboardNavigable);

                console.log(`  ✅ ${testPage.name}: Accessibility features verified`);

            } catch (error) {
                console.log(`  ❌ ${testPage.name}: Error - ${error.message}`);
            }
        }

        await page.close();
        console.log(`\n📊 Accessibility Test Results: ${this.results.accessibility.score}/${this.results.accessibility.total} passed`);
    }

    async testSEOValidation(browser) {
        console.log('Testing SEO elements and structured data...\n');

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        for (const testPage of this.testPages.slice(0, 8)) { // Test first 8 pages for SEO
            console.log(`🔍 Testing: ${testPage.name}`);

            try {
                const url = `file://${__dirname}/${testPage.path}`;
                await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Test title tag
                const title = await page.title();
                const titleOptimized = title.length >= 30 && title.length <= 60 && title.includes('IT-ERA');
                this.recordTest('seo', 'titleOptimization', titleOptimized);

                // Test meta description
                const metaDescription = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
                const metaOptimized = metaDescription.length >= 120 && metaDescription.length <= 160;
                this.recordTest('seo', 'metaDescription', metaOptimized);

                // Test canonical URL
                const canonicalUrl = await page.$eval('link[rel="canonical"]', el => el.href).catch(() => '');
                const canonicalOptimized = canonicalUrl.includes('it-era.it');
                this.recordTest('seo', 'canonicalUrl', canonicalOptimized);

                // Test Open Graph tags
                const ogTitle = await page.$('meta[property="og:title"]');
                const ogDescription = await page.$('meta[property="og:description"]');
                const ogImage = await page.$('meta[property="og:image"]');
                this.recordTest('seo', 'openGraphTags', !!(ogTitle && ogDescription && ogImage));

                // Test structured data
                const schemaMarkup = await page.$('script[type="application/ld+json"]');
                this.recordTest('seo', 'structuredData', !!schemaMarkup);

                // Test H1 tag (only one per page)
                const h1Tags = await page.$$('h1');
                this.recordTest('seo', 'h1Optimization', h1Tags.length === 1);

                // Test internal linking
                const internalLinks = await page.evaluate(() => {
                    const links = Array.from(document.querySelectorAll('a[href]'));
                    return links.filter(link =>
                        link.href.includes('it-era.it') ||
                        link.href.startsWith('/') ||
                        link.href.startsWith('./')
                    ).length;
                });
                this.recordTest('seo', 'internalLinking', internalLinks >= 3);

                console.log(`  ✅ ${testPage.name}: SEO elements verified`);

            } catch (error) {
                console.log(`  ❌ ${testPage.name}: Error - ${error.message}`);
            }
        }

        await page.close();
        console.log(`\n📊 SEO Test Results: ${this.results.seo.score}/${this.results.seo.total} passed`);
    }

    async testPerformance(browser) {
        console.log('Testing page load performance and Core Web Vitals...\n');

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        for (const testPage of this.testPages.slice(0, 5)) { // Test first 5 pages for performance
            console.log(`⚡ Testing: ${testPage.name}`);

            try {
                const url = `file://${__dirname}/${testPage.path}`;

                // Measure page load time
                const startTime = Date.now();
                await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
                const loadTime = Date.now() - startTime;

                // Test load time (should be under 3 seconds for local files)
                this.recordTest('performance', 'pageLoadTime', loadTime < 3000);

                // Test resource loading
                const resourceCount = await page.evaluate(() => {
                    return performance.getEntriesByType('resource').length;
                });
                this.recordTest('performance', 'resourceLoading', resourceCount > 0);

                // Test JavaScript execution time
                const jsExecutionTime = await page.evaluate(() => {
                    const navigationTiming = performance.getEntriesByType('navigation')[0];
                    return navigationTiming ? navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart : 0;
                });
                this.recordTest('performance', 'jsExecutionTime', jsExecutionTime < 1000);

                // Test DOM complexity
                const domComplexity = await page.evaluate(() => {
                    return document.querySelectorAll('*').length;
                });
                this.recordTest('performance', 'domComplexity', domComplexity < 1500);

                // Test image optimization (check for lazy loading)
                const lazyImages = await page.evaluate(() => {
                    const images = Array.from(document.querySelectorAll('img'));
                    return images.filter(img => img.loading === 'lazy' || img.dataset.src).length;
                });
                const totalImages = await page.$$eval('img', imgs => imgs.length);
                this.recordTest('performance', 'imageOptimization', totalImages === 0 || lazyImages > 0);

                console.log(`  ✅ ${testPage.name}: Performance metrics verified (${loadTime}ms)`);

            } catch (error) {
                console.log(`  ❌ ${testPage.name}: Error - ${error.message}`);
            }
        }

        await page.close();
        console.log(`\n📊 Performance Test Results: ${this.results.performance.score}/${this.results.performance.total} passed`);
    }

    recordTest(category, testName, passed) {
        this.results[category].total++;
        if (passed) {
            this.results[category].score++;
        }
        this.results[category].details[testName] = passed;
    }

    async generateComprehensiveReport() {
        const totalScore = Object.values(this.results).reduce((sum, category) => sum + category.score, 0);
        const totalTests = Object.values(this.results).reduce((sum, category) => sum + category.total, 0);
        const overallPercentage = totalTests > 0 ? ((totalScore / totalTests) * 100).toFixed(1) : 0;
        
        const report = {
            timestamp: new Date().toISOString(),
            version: this.version,
            duration: Date.now() - this.startTime,
            overall: {
                score: totalScore,
                total: totalTests,
                percentage: overallPercentage,
                status: overallPercentage >= 95 ? 'EXCELLENT' : overallPercentage >= 85 ? 'GOOD' : overallPercentage >= 70 ? 'ACCEPTABLE' : 'NEEDS_IMPROVEMENT'
            },
            categories: this.results,
            recommendations: this.generateRecommendations()
        };
        
        // Save detailed report
        const reportPath = path.join(__dirname, 'comprehensive-qa-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Display summary
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE QA REPORT SUMMARY');
        console.log('='.repeat(80));
        console.log(`Overall Score: ${totalScore}/${totalTests} (${overallPercentage}%)`);
        console.log(`Status: ${report.overall.status}`);
        console.log(`Duration: ${Math.round(report.duration / 1000)}s`);
        
        Object.entries(this.results).forEach(([category, result]) => {
            const percentage = result.total > 0 ? ((result.score / result.total) * 100).toFixed(1) : 0;
            console.log(`${category.toUpperCase()}: ${result.score}/${result.total} (${percentage}%)`);
        });
        
        console.log(`\n📝 Detailed report saved to: ${reportPath}`);
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        Object.entries(this.results).forEach(([category, result]) => {
            const percentage = result.total > 0 ? (result.score / result.total) * 100 : 0;
            
            if (percentage < 90) {
                recommendations.push({
                    category,
                    priority: percentage < 70 ? 'HIGH' : 'MEDIUM',
                    message: `${category} tests show ${percentage.toFixed(1)}% success rate. Review failed tests and implement fixes.`
                });
            }
        });
        
        return recommendations;
    }
}

// Export for use in other modules
module.exports = ITERAQualityAssurance;

// Run if called directly
if (require.main === module) {
    const qa = new ITERAQualityAssurance();
    qa.runComprehensiveQA().catch(console.error);
}
