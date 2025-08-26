const playwright = require('playwright');
const fs = require('fs');
const https = require('https');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

class SmokeValidator {
    constructor() {
        this.results = {
            tests: [],
            metrics: {
                all_tests_pass: true,
                critical_issues: 0,
                warnings: 0
            }
        };
        this.baseUrl = 'https://it-era.it';
        this.testRoutes = [
            '/',
            '/assistenza-it',
            '/sicurezza-informatica', 
            '/cloud-storage',
            '/contatti'
        ];
    }

    async runAllTests() {
        console.log('🚀 Starting IT-ERA Smoke Validation Tests...');
        
        // Test 1: Navigation Consistency + Console Errors
        await this.testNavigationConsistency();
        
        // Test 2: GA4 Network Tracking
        await this.testGA4Tracking();
        
        // Test 3: Sitemap 200 Status
        await this.testSitemapStatus();
        
        // Test 4: Robots.txt Status
        await this.testRobotsStatus();
        
        // Test 5: Lighthouse Performance & SEO
        await this.testLighthouseScores();
        
        // Calculate final metrics
        this.calculateFinalMetrics();
        
        // Export results
        this.exportResults();
        
        console.log('✅ Smoke validation completed!');
        return this.results;
    }

    async testNavigationConsistency() {
        console.log('🧪 Testing Navigation Consistency...');
        
        try {
            const browser = await playwright.chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();
            
            // Collect console errors
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });
            
            let navConsistencyPassed = true;
            let navDetails = [];
            
            for (const route of this.testRoutes) {
                try {
                    await page.goto(this.baseUrl + route, { waitUntil: 'networkidle' });
                    
                    // Check navigation menu exists
                    const navMenu = await page.locator('nav, .navbar, .navigation').count();
                    if (navMenu === 0) {
                        navConsistencyPassed = false;
                        navDetails.push(`${route}: No navigation menu found`);
                    }
                    
                    // Check for key navigation links
                    const keyLinks = ['assistenza-it', 'sicurezza-informatica', 'cloud-storage', 'contatti'];
                    for (const link of keyLinks) {
                        const linkExists = await page.locator(`a[href*="${link}"]`).count();
                        if (linkExists === 0) {
                            navConsistencyPassed = false;
                            navDetails.push(`${route}: Missing link to ${link}`);
                        }
                    }
                    
                    // Check phone number consistency
                    const phoneExists = await page.locator('text=039 888 2041').count();
                    if (phoneExists === 0) {
                        navConsistencyPassed = false;
                        navDetails.push(`${route}: Missing unified phone number`);
                    }
                    
                } catch (error) {
                    navConsistencyPassed = false;
                    navDetails.push(`${route}: Navigation test failed - ${error.message}`);
                }
            }
            
            await browser.close();
            
            // Critical console errors check
            const criticalErrors = consoleErrors.filter(error => 
                error.includes('TypeError') || 
                error.includes('ReferenceError') ||
                error.includes('SyntaxError')
            );
            
            if (criticalErrors.length > 0) {
                navConsistencyPassed = false;
                navDetails.push(`Critical console errors: ${criticalErrors.join(', ')}`);
                this.results.metrics.critical_issues += criticalErrors.length;
            }
            
            this.results.tests.push({
                name: "nav-consistency",
                status: navConsistencyPassed ? "PASS" : "FAIL",
                details: navDetails.length > 0 ? navDetails.join('; ') : "Navigation consistent across all routes"
            });
            
            if (!navConsistencyPassed) {
                this.results.metrics.all_tests_pass = false;
            }
            
        } catch (error) {
            this.results.tests.push({
                name: "nav-consistency",
                status: "FAIL",
                details: `Test failed: ${error.message}`
            });
            this.results.metrics.all_tests_pass = false;
            this.results.metrics.critical_issues++;
        }
    }

    async testGA4Tracking() {
        console.log('🧪 Testing GA4 Network Tracking...');
        
        try {
            const browser = await playwright.chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();
            
            // Monitor network requests
            const ga4Requests = [];
            page.on('request', request => {
                const url = request.url();
                if (url.includes('/g/collect') || url.includes('google-analytics.com/collect')) {
                    ga4Requests.push(url);
                }
            });
            
            // Test homepage
            await page.goto(this.baseUrl, { waitUntil: 'networkidle' });
            
            // Wait a bit for GA4 to fire
            await page.waitForTimeout(3000);
            
            await browser.close();
            
            const ga4Working = ga4Requests.length > 0;
            
            this.results.tests.push({
                name: "ga4-network",
                status: ga4Working ? "PASS" : "FAIL",
                evidence: ga4Working ? 
                    `GA4 requests detected: ${ga4Requests.length} requests` : 
                    "No GA4 tracking requests detected"
            });
            
            if (!ga4Working) {
                this.results.metrics.all_tests_pass = false;
                this.results.metrics.warnings++;
            }
            
        } catch (error) {
            this.results.tests.push({
                name: "ga4-network",
                status: "FAIL",
                evidence: `Test failed: ${error.message}`
            });
            this.results.metrics.all_tests_pass = false;
            this.results.metrics.critical_issues++;
        }
    }

    async testSitemapStatus() {
        console.log('🧪 Testing Sitemap Status...');
        
        return new Promise((resolve) => {
            const url = this.baseUrl + '/sitemap.xml';
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const status200 = res.statusCode === 200;
                    const hasXmlContent = data.includes('<?xml') && data.includes('<urlset');
                    
                    this.results.tests.push({
                        name: "sitemap-200",
                        status: (status200 && hasXmlContent) ? "PASS" : "FAIL",
                        response: `Status: ${res.statusCode}, Valid XML: ${hasXmlContent}, Size: ${data.length} bytes`
                    });
                    
                    if (!status200 || !hasXmlContent) {
                        this.results.metrics.all_tests_pass = false;
                        this.results.metrics.critical_issues++;
                    }
                    
                    resolve();
                });
            }).on('error', (error) => {
                this.results.tests.push({
                    name: "sitemap-200",
                    status: "FAIL",
                    response: `Request failed: ${error.message}`
                });
                this.results.metrics.all_tests_pass = false;
                this.results.metrics.critical_issues++;
                resolve();
            });
        });
    }

    async testRobotsStatus() {
        console.log('🧪 Testing Robots.txt Status...');
        
        return new Promise((resolve) => {
            const url = this.baseUrl + '/robots.txt';
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const status200 = res.statusCode === 200;
                    const hasRobotsContent = data.includes('User-agent') || data.includes('Sitemap');
                    
                    this.results.tests.push({
                        name: "robots-200",
                        status: (status200 && hasRobotsContent) ? "PASS" : "FAIL",
                        content: `Status: ${res.statusCode}, Valid robots.txt: ${hasRobotsContent}, Content: ${data.substring(0, 200)}...`
                    });
                    
                    if (!status200 || !hasRobotsContent) {
                        this.results.metrics.all_tests_pass = false;
                        this.results.metrics.warnings++;
                    }
                    
                    resolve();
                });
            }).on('error', (error) => {
                this.results.tests.push({
                    name: "robots-200",
                    status: "FAIL",
                    content: `Request failed: ${error.message}`
                });
                this.results.metrics.all_tests_pass = false;
                this.results.metrics.warnings++;
                resolve();
            });
        });
    }

    async testLighthouseScores() {
        console.log('🧪 Testing Lighthouse Performance & SEO...');
        
        try {
            const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
            const options = {
                logLevel: 'info',
                output: 'json',
                onlyCategories: ['performance', 'seo'],
                port: chrome.port,
            };
            
            const runnerResult = await lighthouse(this.baseUrl, options);
            
            await chrome.kill();
            
            const { lhr } = runnerResult;
            const performanceScore = Math.round(lhr.categories.performance.score * 100);
            const seoScore = Math.round(lhr.categories.seo.score * 100);
            
            const meetsCriteria = performanceScore >= 85 && seoScore >= 95;
            
            this.results.tests.push({
                name: "lighthouse",
                status: meetsCriteria ? "PASS" : "FAIL",
                scores: {
                    performance: performanceScore,
                    seo: seoScore
                },
                report: `Performance: ${performanceScore}/100, SEO: ${seoScore}/100`
            });
            
            if (!meetsCriteria) {
                this.results.metrics.all_tests_pass = false;
                if (performanceScore < 70 || seoScore < 80) {
                    this.results.metrics.critical_issues++;
                } else {
                    this.results.metrics.warnings++;
                }
            }
            
            // Save detailed Lighthouse report
            fs.writeFileSync('/Users/andreapanzeri/progetti/IT-ERA/tests/lighthouse-report.json', runnerResult.report);
            
        } catch (error) {
            this.results.tests.push({
                name: "lighthouse",
                status: "FAIL",
                scores: { performance: 0, seo: 0 },
                report: `Lighthouse test failed: ${error.message}`
            });
            this.results.metrics.all_tests_pass = false;
            this.results.metrics.critical_issues++;
        }
    }

    calculateFinalMetrics() {
        const failedTests = this.results.tests.filter(test => test.status === "FAIL");
        this.results.metrics.all_tests_pass = failedTests.length === 0;
        
        console.log(`\n📊 Final Metrics:`);
        console.log(`- All tests pass: ${this.results.metrics.all_tests_pass}`);
        console.log(`- Critical issues: ${this.results.metrics.critical_issues}`);
        console.log(`- Warnings: ${this.results.metrics.warnings}`);
        console.log(`- Failed tests: ${failedTests.length}/${this.results.tests.length}`);
    }

    exportResults() {
        const resultsPath = '/Users/andreapanzeri/progetti/IT-ERA/tests/validate.results.json';
        fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 Results exported to: ${resultsPath}`);
    }
}

// Run if called directly
if (require.main === module) {
    const validator = new SmokeValidator();
    validator.runAllTests().then((results) => {
        process.exit(results.metrics.all_tests_pass ? 0 : 1);
    }).catch((error) => {
        console.error('❌ Smoke validation failed:', error);
        process.exit(1);
    });
}

module.exports = SmokeValidator;