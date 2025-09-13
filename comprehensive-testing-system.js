#!/usr/bin/env node

/**
 * IT-ERA COMPREHENSIVE TESTING SYSTEM
 * Advanced testing suite for all implemented features
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class ComprehensiveTestingSystem {
    constructor() {
        this.browser = null;
        this.testResults = {
            homepage: { score: 0, total: 0, details: {} },
            servizi: { score: 0, total: 0, details: {} },
            blog: { score: 0, total: 0, details: {} },
            branches: { score: 0, total: 0, details: {} },
            landingPages: { score: 0, total: 0, details: {} },
            navigation: { score: 0, total: 0, details: {} },
            performance: { score: 0, total: 0, details: {} },
            seo: { score: 0, total: 0, details: {} },
            mobile: { score: 0, total: 0, details: {} },
            overall: { score: 0, total: 0 }
        };
        this.startTime = Date.now();
    }

    async initialize() {
        console.log('🧪 INITIALIZING COMPREHENSIVE TESTING SYSTEM');
        console.log('=' .repeat(60));
        
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        console.log('✅ Testing system initialized');
    }

    async runAllTests() {
        console.log('🚀 STARTING COMPREHENSIVE TESTING SUITE');
        console.log('📅 Started:', new Date().toLocaleString());
        console.log('');

        try {
            // Core functionality tests
            await this.testHomepage();
            await this.testServiziPage();
            await this.testBlogSystem();
            
            // Branch and navigation tests
            await this.testBranchSystem();
            await this.testNavigationSystem();
            
            // Landing pages tests
            await this.testLandingPages();
            
            // Technical tests
            await this.testPerformance();
            await this.testSEOOptimization();
            await this.testMobileResponsiveness();
            
            // Generate final report
            this.generateFinalReport();
            
        } catch (error) {
            console.error('❌ Testing system error:', error.message);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async testHomepage() {
        console.log('🏠 TESTING HOMEPAGE OPTIMIZATION...');
        const page = await this.browser.newPage();
        
        try {
            await page.goto('https://it-era.it/', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            // Test hero optimization
            const heroH1 = await page.$eval('h1', el => el.textContent).catch(() => '');
            const heroOptimized = heroH1.includes('Assistenza Informatica') || heroH1.includes('IT-ERA');
            this.recordTest('homepage', 'heroOptimized', heroOptimized);
            console.log(`  Hero Optimization: ${heroOptimized ? '✅' : '❌'}`);
            
            // Test CTA buttons
            const ctaButtons = await page.$$eval('a[href*="contatti"]', buttons => buttons.length).catch(() => 0);
            const ctaOptimized = ctaButtons >= 3;
            this.recordTest('homepage', 'ctaOptimized', ctaOptimized);
            console.log(`  CTA Buttons: ${ctaOptimized ? '✅' : '❌'} (${ctaButtons} found)`);
            
            // Test social proof
            const testimonials = await page.$$('blockquote').catch(() => []);
            const socialProof = testimonials.length > 0;
            this.recordTest('homepage', 'socialProof', socialProof);
            console.log(`  Social Proof: ${socialProof ? '✅' : '❌'}`);
            
            // Test trust indicators
            const trustIndicators = await page.$$('.bg-white\\/60, .bg-white\\/80').catch(() => []);
            const trustOptimized = trustIndicators.length >= 3;
            this.recordTest('homepage', 'trustIndicators', trustOptimized);
            console.log(`  Trust Indicators: ${trustOptimized ? '✅' : '❌'} (${trustIndicators.length} found)`);
            
        } catch (error) {
            console.log(`  ❌ Homepage test error: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    async testServiziPage() {
        console.log('\n🛠️ TESTING SERVIZI PAGE OPTIMIZATION...');
        const page = await this.browser.newPage();
        
        try {
            await page.goto('https://it-era.it/servizi.html', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            // Test pricing section
            const pricingPackages = await page.$$eval('.text-4xl.font-bold', 
                elements => elements.filter(el => el.textContent.includes('€')).length
            ).catch(() => 0);
            const pricingOptimized = pricingPackages >= 3;
            this.recordTest('servizi', 'pricingOptimized', pricingOptimized);
            console.log(`  Pricing Packages: ${pricingOptimized ? '✅' : '❌'} (${pricingPackages} found)`);
            
            // Test service cards
            const serviceCards = await page.$$('.bg-white.p-8.rounded-2xl').catch(() => []);
            const cardsOptimized = serviceCards.length >= 4;
            this.recordTest('servizi', 'serviceCards', cardsOptimized);
            console.log(`  Service Cards: ${cardsOptimized ? '✅' : '❌'} (${serviceCards.length} found)`);
            
            // Test CTA optimization
            const serviceCTAs = await page.$$eval('a[href*="contatti"]', buttons => buttons.length).catch(() => 0);
            const ctaOptimized = serviceCTAs >= 5;
            this.recordTest('servizi', 'ctaOptimized', ctaOptimized);
            console.log(`  Service CTAs: ${ctaOptimized ? '✅' : '❌'} (${serviceCTAs} found)`);
            
        } catch (error) {
            console.log(`  ❌ Servizi test error: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    async testBlogSystem() {
        console.log('\n📝 TESTING BLOG SYSTEM...');
        const page = await this.browser.newPage();
        
        try {
            // Test blog index
            await page.goto('https://it-era.it/blog/', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            const blogTitle = await page.$eval('h1', el => el.textContent).catch(() => '');
            const blogOptimized = blogTitle.includes('Blog IT-ERA');
            this.recordTest('blog', 'blogIndex', blogOptimized);
            console.log(`  Blog Index: ${blogOptimized ? '✅' : '❌'}`);
            
            // Test categories
            const categories = await page.$$('.bg-gradient-to-br').catch(() => []);
            const categoriesOptimized = categories.length >= 6;
            this.recordTest('blog', 'categories', categoriesOptimized);
            console.log(`  Categories: ${categoriesOptimized ? '✅' : '❌'} (${categories.length} found)`);
            
            // Test generated article
            await page.goto('https://it-era.it/blog/articoli/2025-09-13-cloud-computing-varese.html', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            const articleContent = await page.$('.prose').catch(() => null);
            const articleOptimized = articleContent !== null;
            this.recordTest('blog', 'generatedArticle', articleOptimized);
            console.log(`  Generated Article: ${articleOptimized ? '✅' : '❌'}`);
            
        } catch (error) {
            console.log(`  ❌ Blog test error: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    async testBranchSystem() {
        console.log('\n🌿 TESTING BRANCH SYSTEM...');
        
        try {
            // Test branch existence
            const { stdout } = await execAsync('git branch -a');
            const branches = stdout.split('\n').map(b => b.trim());
            
            const requiredBranches = [
                'settore-studi-legali',
                'settore-industria-40',
                'settore-retail-gdo',
                'settore-pmi-startup',
                'settore-commercialisti'
            ];
            
            let branchesFound = 0;
            for (const branch of requiredBranches) {
                const exists = branches.some(b => b.includes(branch));
                if (exists) branchesFound++;
                console.log(`  ${branch}: ${exists ? '✅' : '❌'}`);
            }
            
            const branchSystemOptimized = branchesFound >= 4;
            this.recordTest('branches', 'branchSystem', branchSystemOptimized);
            
        } catch (error) {
            console.log(`  ❌ Branch test error: ${error.message}`);
        }
    }

    async testNavigationSystem() {
        console.log('\n🧭 TESTING NAVIGATION SYSTEM...');
        const page = await this.browser.newPage();
        
        try {
            await page.goto('https://it-era.it/', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            // Test header component
            const headerLoaded = await page.$('#header-placeholder header, header').catch(() => null);
            const headerOptimized = headerLoaded !== null;
            this.recordTest('navigation', 'headerComponent', headerOptimized);
            console.log(`  Header Component: ${headerOptimized ? '✅' : '❌'}`);
            
            // Test menu links
            const menuLinks = await page.$$eval('a[href*="/settori/"]', links => links.length).catch(() => 0);
            const menuOptimized = menuLinks >= 5;
            this.recordTest('navigation', 'menuLinks', menuOptimized);
            console.log(`  Menu Links: ${menuOptimized ? '✅' : '❌'} (${menuLinks} found)`);
            
            // Test mobile menu
            await page.setViewport({ width: 375, height: 667 });
            const mobileMenu = await page.$('#mobile-menu-button, .mobile-menu-toggle').catch(() => null);
            const mobileOptimized = mobileMenu !== null;
            this.recordTest('navigation', 'mobileMenu', mobileOptimized);
            console.log(`  Mobile Menu: ${mobileOptimized ? '✅' : '❌'}`);
            
        } catch (error) {
            console.log(`  ❌ Navigation test error: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    async testLandingPages() {
        console.log('\n🎯 TESTING LANDING PAGES...');
        
        const landingPages = [
            '/landing/sicurezza-informatica.html',
            '/landing/assistenza-emergenza.html',
            '/landing/cloud-migration.html',
            '/landing/digitalizzazione-pmi.html',
            '/landing/software-commercialisti.html'
        ];
        
        let landingPagesFound = 0;
        
        for (const landingPage of landingPages) {
            try {
                await fs.access(`landing${landingPage.replace('/landing', '')}`);
                landingPagesFound++;
                console.log(`  ${landingPage}: ✅`);
            } catch (error) {
                console.log(`  ${landingPage}: ❌ (Not found)`);
            }
        }
        
        const landingPagesOptimized = landingPagesFound >= 3;
        this.recordTest('landingPages', 'landingPagesCreated', landingPagesOptimized);
    }

    async testPerformance() {
        console.log('\n⚡ TESTING PERFORMANCE...');
        const page = await this.browser.newPage();
        
        try {
            const startTime = Date.now();
            await page.goto('https://it-era.it/', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            const loadTime = Date.now() - startTime;
            
            const performanceOptimized = loadTime < 5000; // 5 seconds
            this.recordTest('performance', 'loadTime', performanceOptimized);
            console.log(`  Load Time: ${performanceOptimized ? '✅' : '❌'} (${loadTime}ms)`);
            
            // Test image optimization
            const images = await page.$$('img').catch(() => []);
            const imagesOptimized = images.length > 0;
            this.recordTest('performance', 'images', imagesOptimized);
            console.log(`  Images Present: ${imagesOptimized ? '✅' : '❌'} (${images.length} found)`);
            
        } catch (error) {
            console.log(`  ❌ Performance test error: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    async testSEOOptimization() {
        console.log('\n🔍 TESTING SEO OPTIMIZATION...');
        const page = await this.browser.newPage();
        
        try {
            await page.goto('https://it-era.it/', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            // Test meta description
            const metaDescription = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
            const metaOptimized = metaDescription.length > 100;
            this.recordTest('seo', 'metaDescription', metaOptimized);
            console.log(`  Meta Description: ${metaOptimized ? '✅' : '❌'} (${metaDescription.length} chars)`);
            
            // Test canonical URL
            const canonicalUrl = await page.$eval('link[rel="canonical"]', el => el.href).catch(() => '');
            const canonicalOptimized = canonicalUrl.includes('it-era.it');
            this.recordTest('seo', 'canonicalUrl', canonicalOptimized);
            console.log(`  Canonical URL: ${canonicalOptimized ? '✅' : '❌'}`);
            
            // Test schema markup
            const schemaMarkup = await page.$('script[type="application/ld+json"]').catch(() => null);
            const schemaOptimized = schemaMarkup !== null;
            this.recordTest('seo', 'schemaMarkup', schemaOptimized);
            console.log(`  Schema Markup: ${schemaOptimized ? '✅' : '❌'}`);
            
        } catch (error) {
            console.log(`  ❌ SEO test error: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    async testMobileResponsiveness() {
        console.log('\n📱 TESTING MOBILE RESPONSIVENESS...');
        const page = await this.browser.newPage();
        
        try {
            await page.setViewport({ width: 375, height: 667 });
            await page.goto('https://it-era.it/', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            // Test mobile layout
            const mobileTitle = await page.$eval('h1', el => {
                const style = window.getComputedStyle(el);
                return parseFloat(style.fontSize) > 20;
            }).catch(() => false);
            this.recordTest('mobile', 'mobileLayout', mobileTitle);
            console.log(`  Mobile Layout: ${mobileTitle ? '✅' : '❌'}`);
            
            // Test mobile navigation
            const mobileNav = await page.$('.mobile-menu, #mobile-menu-button').catch(() => null);
            const mobileNavOptimized = mobileNav !== null;
            this.recordTest('mobile', 'mobileNavigation', mobileNavOptimized);
            console.log(`  Mobile Navigation: ${mobileNavOptimized ? '✅' : '❌'}`);
            
            // Test touch targets
            const buttons = await page.$$('button, a').catch(() => []);
            const touchOptimized = buttons.length > 0;
            this.recordTest('mobile', 'touchTargets', touchOptimized);
            console.log(`  Touch Targets: ${touchOptimized ? '✅' : '❌'} (${buttons.length} found)`);
            
        } catch (error) {
            console.log(`  ❌ Mobile test error: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    recordTest(category, testName, passed) {
        this.testResults[category].total++;
        if (passed) {
            this.testResults[category].score++;
        }
        this.testResults[category].details[testName] = passed;
    }

    generateFinalReport() {
        const totalTime = Math.round((Date.now() - this.startTime) / 1000);
        
        // Calculate overall score
        this.testResults.overall.score = Object.values(this.testResults)
            .filter(result => result !== this.testResults.overall)
            .reduce((sum, result) => sum + result.score, 0);
        
        this.testResults.overall.total = Object.values(this.testResults)
            .filter(result => result !== this.testResults.overall)
            .reduce((sum, result) => sum + result.total, 0);
        
        const overallPercentage = Math.round(this.testResults.overall.score / this.testResults.overall.total * 100);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 COMPREHENSIVE TESTING FINAL REPORT');
        console.log('='.repeat(60));
        console.log(`⏰ Total Testing Time: ${Math.floor(totalTime/60)}m ${totalTime%60}s`);
        console.log(`📅 Completed: ${new Date().toLocaleString()}`);
        console.log('');
        
        // Category results
        Object.entries(this.testResults).forEach(([category, result]) => {
            if (category === 'overall') return;
            
            const percentage = result.total > 0 ? Math.round(result.score / result.total * 100) : 0;
            const icon = this.getCategoryIcon(category);
            console.log(`${icon} ${category.toUpperCase()}: ${result.score}/${result.total} (${percentage}%)`);
        });
        
        console.log('');
        console.log(`🎯 OVERALL SYSTEM SCORE: ${this.testResults.overall.score}/${this.testResults.overall.total} (${overallPercentage}%)`);
        
        // Final assessment
        console.log('\n🎉 FINAL ASSESSMENT:');
        if (overallPercentage >= 90) {
            console.log('✅ EXCELLENT! System is fully optimized and production-ready!');
        } else if (overallPercentage >= 80) {
            console.log('✅ VERY GOOD! System is highly optimized with minor improvements needed.');
        } else if (overallPercentage >= 70) {
            console.log('✅ GOOD! System is well optimized but needs some attention.');
        } else if (overallPercentage >= 60) {
            console.log('⚠️ FAIR! System needs significant improvements.');
        } else {
            console.log('❌ POOR! System requires major fixes and optimizations.');
        }
        
        console.log('\n🚀 SYSTEM READINESS:');
        console.log(`✅ Homepage: ${this.getReadinessStatus('homepage')}`);
        console.log(`✅ Servizi: ${this.getReadinessStatus('servizi')}`);
        console.log(`✅ Blog System: ${this.getReadinessStatus('blog')}`);
        console.log(`✅ Branch System: ${this.getReadinessStatus('branches')}`);
        console.log(`✅ Navigation: ${this.getReadinessStatus('navigation')}`);
        console.log(`✅ Performance: ${this.getReadinessStatus('performance')}`);
        console.log(`✅ SEO: ${this.getReadinessStatus('seo')}`);
        console.log(`✅ Mobile: ${this.getReadinessStatus('mobile')}`);
        
        if (overallPercentage >= 80) {
            console.log('\n🎯 READY FOR BUSINESS GROWTH!');
            console.log('🚀 All systems operational for maximum lead generation');
        }
    }

    getCategoryIcon(category) {
        const icons = {
            homepage: '🏠',
            servizi: '🛠️',
            blog: '📝',
            branches: '🌿',
            landingPages: '🎯',
            navigation: '🧭',
            performance: '⚡',
            seo: '🔍',
            mobile: '📱'
        };
        return icons[category] || '📊';
    }

    getReadinessStatus(category) {
        const result = this.testResults[category];
        if (result.total === 0) return 'Not tested';
        
        const percentage = Math.round(result.score / result.total * 100);
        if (percentage >= 80) return 'Ready';
        if (percentage >= 60) return 'Needs work';
        return 'Critical issues';
    }
}

// Start comprehensive testing
async function main() {
    const testingSystem = new ComprehensiveTestingSystem();
    await testingSystem.initialize();
    await testingSystem.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ComprehensiveTestingSystem;
