/**
 * IT-ERA Comprehensive Test Suite
 * Tests all functionality, performance, SEO, and responsive design
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ITERATestSuite {
    constructor() {
        this.baseUrl = 'https://it-rgxoa648j-andreas-projects-d0af77c4.vercel.app';
        this.results = {
            timestamp: new Date().toISOString(),
            baseUrl: this.baseUrl,
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            },
            performance: {},
            issues: [],
            recommendations: []
        };
        this.browser = null;
        this.page = null;
    }

    /**
     * Initialize browser and page
     */
    async init() {
        console.log('🚀 Initializing IT-ERA Test Suite...');
        
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Set user agent
        await this.page.setUserAgent('Mozilla/5.0 (compatible; IT-ERA-TestBot/1.0; +https://it-era.vercel.app)');
        
        console.log('✅ Browser initialized');
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        try {
            await this.init();
            
            console.log('🧪 Starting comprehensive testing...\n');
            
            // Test main pages
            await this.testMainPages();
            
            // Test city pages
            await this.testCityPages();
            
            // Test navigation
            await this.testNavigation();
            
            // Test responsive design
            await this.testResponsiveDesign();
            
            // Test performance
            await this.testPerformance();
            
            // Test SEO elements
            await this.testSEO();
            
            // Test static assets
            await this.testStaticAssets();
            
            // Generate final report
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.addIssue('CRITICAL', 'Test suite execution failed', error.message);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    /**
     * Test main pages
     */
    async testMainPages() {
        console.log('📄 Testing main pages...');
        
        const pages = [
            { url: '/', name: 'Homepage', expectedTitle: 'IT-ERA - Assistenza IT Professionale in Lombardia' },
            { url: '/servizi', name: 'Services', expectedTitle: 'Servizi IT Professionali - IT-ERA' },
            { url: '/contatti', name: 'Contact', expectedTitle: 'Contatti - IT-ERA Assistenza IT' }
        ];
        
        for (const pageInfo of pages) {
            await this.testPage(pageInfo);
        }
    }

    /**
     * Test individual page
     */
    async testPage(pageInfo) {
        const testName = `Page: ${pageInfo.name}`;
        console.log(`  🔍 Testing ${pageInfo.name}...`);
        
        try {
            const startTime = Date.now();
            
            // Navigate to page
            const response = await this.page.goto(this.baseUrl + pageInfo.url, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            
            const loadTime = Date.now() - startTime;
            
            // Check response status
            if (response.status() !== 200) {
                throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
            }
            
            // Check title
            const title = await this.page.title();
            if (title !== pageInfo.expectedTitle) {
                this.addIssue('WARNING', `Title mismatch on ${pageInfo.name}`, 
                    `Expected: "${pageInfo.expectedTitle}", Got: "${title}"`);
            }
            
            // Check for JavaScript errors
            const jsErrors = await this.page.evaluate(() => {
                return window.jsErrors || [];
            });
            
            if (jsErrors.length > 0) {
                this.addIssue('ERROR', `JavaScript errors on ${pageInfo.name}`, jsErrors.join(', '));
            }
            
            // Check for broken images
            const brokenImages = await this.page.evaluate(() => {
                const images = Array.from(document.querySelectorAll('img'));
                return images.filter(img => !img.complete || img.naturalWidth === 0).length;
            });
            
            if (brokenImages > 0) {
                this.addIssue('WARNING', `Broken images on ${pageInfo.name}`, `${brokenImages} broken images found`);
            }
            
            this.addTestResult(testName, 'PASS', {
                loadTime: `${loadTime}ms`,
                title: title,
                status: response.status(),
                brokenImages: brokenImages
            });
            
        } catch (error) {
            this.addTestResult(testName, 'FAIL', { error: error.message });
            this.addIssue('ERROR', `Page load failed: ${pageInfo.name}`, error.message);
        }
    }

    /**
     * Test city pages
     */
    async testCityPages() {
        console.log('🏙️ Testing city pages...');
        
        const cities = ['milano', 'bergamo', 'brescia', 'como'];
        
        for (const city of cities) {
            const testName = `City Page: ${city}`;
            console.log(`  🔍 Testing ${city}...`);
            
            try {
                const response = await this.page.goto(`${this.baseUrl}/assistenza-it-${city}`, {
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });
                
                if (response.status() !== 200) {
                    throw new Error(`HTTP ${response.status()}`);
                }
                
                // Check if city name appears in content
                const cityNameFound = await this.page.evaluate((cityName) => {
                    return document.body.textContent.toLowerCase().includes(cityName.toLowerCase());
                }, city);
                
                if (!cityNameFound) {
                    this.addIssue('WARNING', `City name not found in content: ${city}`, 
                        'City name should appear in page content');
                }
                
                this.addTestResult(testName, 'PASS', {
                    status: response.status(),
                    cityNameFound: cityNameFound
                });
                
            } catch (error) {
                this.addTestResult(testName, 'FAIL', { error: error.message });
                this.addIssue('ERROR', `City page failed: ${city}`, error.message);
            }
        }
    }

    /**
     * Test navigation functionality
     */
    async testNavigation() {
        console.log('🧭 Testing navigation...');
        
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
            
            // Test main navigation links
            const navLinks = await this.page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('nav a, .nav a'));
                return links.map(link => ({
                    text: link.textContent.trim(),
                    href: link.href,
                    visible: link.offsetParent !== null
                }));
            });
            
            console.log(`  Found ${navLinks.length} navigation links`);
            
            // Test each navigation link
            for (const link of navLinks.slice(0, 5)) { // Test first 5 links
                if (link.href && link.href.startsWith(this.baseUrl)) {
                    try {
                        const response = await this.page.goto(link.href, { 
                            waitUntil: 'networkidle0',
                            timeout: 15000 
                        });
                        
                        if (response.status() !== 200) {
                            this.addIssue('ERROR', `Navigation link broken: ${link.text}`, 
                                `Link "${link.href}" returned ${response.status()}`);
                        }
                    } catch (error) {
                        this.addIssue('ERROR', `Navigation link failed: ${link.text}`, error.message);
                    }
                }
            }
            
            this.addTestResult('Navigation Links', 'PASS', {
                totalLinks: navLinks.length,
                testedLinks: Math.min(5, navLinks.length)
            });
            
        } catch (error) {
            this.addTestResult('Navigation Links', 'FAIL', { error: error.message });
            this.addIssue('ERROR', 'Navigation test failed', error.message);
        }
    }

    /**
     * Test responsive design
     */
    async testResponsiveDesign() {
        console.log('📱 Testing responsive design...');
        
        const viewports = [
            { name: 'Mobile', width: 375, height: 667 },
            { name: 'Tablet', width: 768, height: 1024 },
            { name: 'Desktop', width: 1920, height: 1080 }
        ];
        
        for (const viewport of viewports) {
            const testName = `Responsive: ${viewport.name}`;
            console.log(`  📐 Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
            
            try {
                await this.page.setViewport({
                    width: viewport.width,
                    height: viewport.height
                });
                
                await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
                
                // Check for horizontal scrollbar
                const hasHorizontalScroll = await this.page.evaluate(() => {
                    return document.body.scrollWidth > window.innerWidth;
                });
                
                if (hasHorizontalScroll) {
                    this.addIssue('WARNING', `Horizontal scroll on ${viewport.name}`, 
                        'Page content overflows viewport width');
                }
                
                // Check if navigation is accessible
                const navVisible = await this.page.evaluate(() => {
                    const nav = document.querySelector('nav, .nav');
                    return nav && nav.offsetParent !== null;
                });
                
                this.addTestResult(testName, 'PASS', {
                    viewport: `${viewport.width}x${viewport.height}`,
                    horizontalScroll: hasHorizontalScroll,
                    navigationVisible: navVisible
                });
                
            } catch (error) {
                this.addTestResult(testName, 'FAIL', { error: error.message });
                this.addIssue('ERROR', `Responsive test failed: ${viewport.name}`, error.message);
            }
        }
        
        // Reset to desktop viewport
        await this.page.setViewport({ width: 1920, height: 1080 });
    }

    /**
     * Test performance metrics
     */
    async testPerformance() {
        console.log('⚡ Testing performance...');
        
        try {
            // Enable performance monitoring
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
            
            // Get performance metrics
            const metrics = await this.page.evaluate(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                    loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
                    firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
                    firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
                };
            });
            
            this.results.performance = metrics;
            
            // Performance thresholds
            const thresholds = {
                domContentLoaded: 2000,
                loadComplete: 3000,
                firstContentfulPaint: 1500
            };
            
            // Check performance against thresholds
            Object.keys(thresholds).forEach(metric => {
                if (metrics[metric] > thresholds[metric]) {
                    this.addIssue('WARNING', `Slow ${metric}`, 
                        `${metrics[metric]}ms exceeds threshold of ${thresholds[metric]}ms`);
                }
            });
            
            this.addTestResult('Performance Metrics', 'PASS', metrics);
            
        } catch (error) {
            this.addTestResult('Performance Metrics', 'FAIL', { error: error.message });
            this.addIssue('ERROR', 'Performance test failed', error.message);
        }
    }

    /**
     * Test SEO elements
     */
    async testSEO() {
        console.log('🔍 Testing SEO elements...');
        
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
            
            // Check meta tags
            const seoData = await this.page.evaluate(() => {
                return {
                    title: document.title,
                    description: document.querySelector('meta[name="description"]')?.content || '',
                    keywords: document.querySelector('meta[name="keywords"]')?.content || '',
                    ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
                    ogDescription: document.querySelector('meta[property="og:description"]')?.content || '',
                    canonical: document.querySelector('link[rel="canonical"]')?.href || '',
                    h1Count: document.querySelectorAll('h1').length,
                    h2Count: document.querySelectorAll('h2').length,
                    imgWithoutAlt: Array.from(document.querySelectorAll('img')).filter(img => !img.alt).length
                };
            });
            
            // SEO validations
            if (!seoData.title || seoData.title.length < 30) {
                this.addIssue('WARNING', 'SEO: Title too short', 'Page title should be at least 30 characters');
            }
            
            if (!seoData.description || seoData.description.length < 120) {
                this.addIssue('WARNING', 'SEO: Description too short', 'Meta description should be at least 120 characters');
            }
            
            if (seoData.h1Count !== 1) {
                this.addIssue('WARNING', 'SEO: H1 count', `Found ${seoData.h1Count} H1 tags, should be exactly 1`);
            }
            
            if (seoData.imgWithoutAlt > 0) {
                this.addIssue('WARNING', 'SEO: Images without alt text', `${seoData.imgWithoutAlt} images missing alt attributes`);
            }
            
            this.addTestResult('SEO Elements', 'PASS', seoData);
            
        } catch (error) {
            this.addTestResult('SEO Elements', 'FAIL', { error: error.message });
            this.addIssue('ERROR', 'SEO test failed', error.message);
        }
    }

    /**
     * Test static assets
     */
    async testStaticAssets() {
        console.log('📦 Testing static assets...');
        
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
            
            // Check CSS files
            const cssFiles = await this.page.evaluate(() => {
                return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                    .map(link => link.href);
            });
            
            // Check JS files
            const jsFiles = await this.page.evaluate(() => {
                return Array.from(document.querySelectorAll('script[src]'))
                    .map(script => script.src);
            });
            
            let brokenAssets = 0;
            
            // Test CSS files
            for (const cssFile of cssFiles) {
                try {
                    const response = await this.page.goto(cssFile, { timeout: 10000 });
                    if (response.status() !== 200) {
                        brokenAssets++;
                        this.addIssue('ERROR', 'Broken CSS file', cssFile);
                    }
                } catch (error) {
                    brokenAssets++;
                    this.addIssue('ERROR', 'CSS file load failed', `${cssFile}: ${error.message}`);
                }
            }
            
            this.addTestResult('Static Assets', brokenAssets === 0 ? 'PASS' : 'FAIL', {
                cssFiles: cssFiles.length,
                jsFiles: jsFiles.length,
                brokenAssets: brokenAssets
            });
            
        } catch (error) {
            this.addTestResult('Static Assets', 'FAIL', { error: error.message });
            this.addIssue('ERROR', 'Static assets test failed', error.message);
        }
    }

    /**
     * Add test result
     */
    addTestResult(name, status, details = {}) {
        this.results.tests.push({
            name,
            status,
            details,
            timestamp: new Date().toISOString()
        });
        
        this.results.summary.total++;
        if (status === 'PASS') {
            this.results.summary.passed++;
            console.log(`    ✅ ${name}`);
        } else {
            this.results.summary.failed++;
            console.log(`    ❌ ${name}`);
        }
    }

    /**
     * Add issue
     */
    addIssue(severity, title, description) {
        this.results.issues.push({
            severity,
            title,
            description,
            timestamp: new Date().toISOString()
        });
        
        if (severity === 'WARNING') {
            this.results.summary.warnings++;
        }
    }

    /**
     * Generate comprehensive test report
     */
    async generateReport() {
        console.log('\n📊 Generating test report...');
        
        // Add recommendations based on issues
        this.generateRecommendations();
        
        // Calculate success rate
        const successRate = this.results.summary.total > 0 
            ? Math.round((this.results.summary.passed / this.results.summary.total) * 100)
            : 0;
        
        this.results.summary.successRate = `${successRate}%`;
        this.results.summary.productionReady = successRate >= 80 && this.results.issues.filter(i => i.severity === 'ERROR').length === 0;
        
        // Save report to file
        const reportPath = path.join(__dirname, 'test-report.json');
        await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
        
        console.log(`📄 Test report saved to: ${reportPath}`);
        
        // Display summary
        this.displaySummary();
    }

    /**
     * Generate recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Performance recommendations
        if (this.results.performance.firstContentfulPaint > 1500) {
            recommendations.push('Optimize images and reduce bundle size to improve First Contentful Paint');
        }
        
        // SEO recommendations
        const seoIssues = this.results.issues.filter(i => i.title.startsWith('SEO:'));
        if (seoIssues.length > 0) {
            recommendations.push('Address SEO issues to improve search engine ranking');
        }
        
        // Error recommendations
        const errors = this.results.issues.filter(i => i.severity === 'ERROR');
        if (errors.length > 0) {
            recommendations.push('Fix critical errors before production deployment');
        }
        
        this.results.recommendations = recommendations;
    }

    /**
     * Display test summary
     */
    displaySummary() {
        console.log('\n🎯 TEST SUMMARY');
        console.log('================');
        console.log(`Total Tests: ${this.results.summary.total}`);
        console.log(`Passed: ${this.results.summary.passed}`);
        console.log(`Failed: ${this.results.summary.failed}`);
        console.log(`Warnings: ${this.results.summary.warnings}`);
        console.log(`Success Rate: ${this.results.summary.successRate}`);
        console.log(`Production Ready: ${this.results.summary.productionReady ? '✅ YES' : '❌ NO'}`);
        
        if (this.results.issues.length > 0) {
            console.log('\n⚠️  ISSUES FOUND:');
            this.results.issues.forEach(issue => {
                const icon = issue.severity === 'ERROR' ? '❌' : '⚠️';
                console.log(`${icon} [${issue.severity}] ${issue.title}: ${issue.description}`);
            });
        }
        
        if (this.results.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            this.results.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        }
        
        console.log(`\n🌐 Live Site: ${this.baseUrl}`);
    }
}

// Run tests if called directly
if (require.main === module) {
    const testSuite = new ITERATestSuite();
    testSuite.runAllTests()
        .then(() => {
            console.log('\n🎉 Test suite completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = ITERATestSuite;
