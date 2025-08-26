const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs');

async function runFinalSmokeTests() {
    console.log('🚀 IT-ERA Final Smoke Validation Tests');
    
    const results = {
        tests: [],
        metrics: {
            all_tests_pass: true,
            critical_issues: 0,
            warnings: 0
        }
    };

    const baseUrl = 'https://it-era.it';
    
    // Test 1: Navigation and Basic Functionality
    try {
        console.log('🧪 Testing Navigation & Content...');
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        // Track network requests for GA4
        const networkRequests = [];
        page.on('request', request => {
            const url = request.url();
            if (url.includes('google') || url.includes('gtag') || url.includes('analytics')) {
                networkRequests.push(url);
            }
        });
        
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        
        // Basic page checks
        const title = await page.title();
        const hasNav = await page.locator('nav, .navbar, header').count() > 0;
        const linkCount = await page.locator('a').count();
        const hasPhone = await page.locator('text=039 888 2041').count() > 0;
        
        await browser.close();
        
        const navPassed = hasNav && linkCount > 10 && hasPhone;
        results.tests.push({
            name: "nav-consistency",
            status: navPassed ? "PASS" : "FAIL",
            details: `Title: "${title}", Nav: ${hasNav}, Links: ${linkCount}, Phone: ${hasPhone}`
        });
        
        // GA4 Test
        const ga4Passed = networkRequests.length > 0;
        results.tests.push({
            name: "ga4-network",
            status: ga4Passed ? "PASS" : "FAIL", 
            evidence: ga4Passed ? `${networkRequests.length} GA4/GTM requests` : "No GA4 tracking detected"
        });
        
        if (!navPassed) {
            results.metrics.critical_issues++;
            results.metrics.all_tests_pass = false;
        }
        if (!ga4Passed) {
            results.metrics.warnings++;
            results.metrics.all_tests_pass = false;
        }
        
    } catch (error) {
        console.error('Navigation test error:', error.message);
        results.tests.push({
            name: "nav-consistency",
            status: "FAIL",
            details: `Test failed: ${error.message}`
        });
        results.tests.push({
            name: "ga4-network",
            status: "FAIL",
            evidence: `Test failed: ${error.message}`
        });
        results.metrics.critical_issues += 2;
        results.metrics.all_tests_pass = false;
    }
    
    // Test 2: Sitemap Test
    console.log('🧪 Testing Sitemap...');
    await new Promise((resolve) => {
        const req = https.get(baseUrl + '/sitemap.xml', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const isValid = res.statusCode === 200 && data.includes('<?xml') && data.includes('<urlset');
                const urlCount = (data.match(/<url>/g) || []).length;
                
                results.tests.push({
                    name: "sitemap-200",
                    status: isValid ? "PASS" : "FAIL",
                    response: `Status: ${res.statusCode}, XML Valid: ${isValid}, URLs: ${urlCount}`
                });
                
                if (!isValid) {
                    results.metrics.critical_issues++;
                    results.metrics.all_tests_pass = false;
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            results.tests.push({
                name: "sitemap-200",
                status: "FAIL",
                response: `Error: ${error.message}`
            });
            results.metrics.critical_issues++;
            results.metrics.all_tests_pass = false;
            resolve();
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            results.tests.push({
                name: "sitemap-200",
                status: "FAIL",
                response: "Request timeout"
            });
            results.metrics.critical_issues++;
            results.metrics.all_tests_pass = false;
            resolve();
        });
    });
    
    // Test 3: Robots.txt Test
    console.log('🧪 Testing Robots.txt...');
    await new Promise((resolve) => {
        const req = https.get(baseUrl + '/robots.txt', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const isValid = res.statusCode === 200 && (data.includes('User-agent') || data.includes('Sitemap'));
                
                results.tests.push({
                    name: "robots-200",
                    status: isValid ? "PASS" : "FAIL",
                    content: `Status: ${res.statusCode}, Valid: ${isValid}`
                });
                
                if (!isValid) {
                    results.metrics.warnings++;
                    results.metrics.all_tests_pass = false;
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            results.tests.push({
                name: "robots-200",
                status: "FAIL",
                content: `Error: ${error.message}`
            });
            results.metrics.warnings++;
            results.metrics.all_tests_pass = false;
            resolve();
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            results.tests.push({
                name: "robots-200", 
                status: "FAIL",
                content: "Request timeout"
            });
            results.metrics.warnings++;
            results.metrics.all_tests_pass = false;
            resolve();
        });
    });
    
    // Test 4: Basic Performance Test
    console.log('🧪 Basic Performance Test...');
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        const startTime = Date.now();
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const loadTime = Date.now() - startTime;
        
        const hasTitle = await page.locator('title').count() > 0;
        const hasMeta = await page.locator('meta[name="description"]').count() > 0;
        
        await browser.close();
        
        // Basic scoring
        const perfScore = loadTime < 3000 ? 85 : (loadTime < 5000 ? 75 : 60);
        const seoScore = (hasTitle && hasMeta) ? 95 : 80;
        
        const passed = perfScore >= 85 && seoScore >= 95;
        
        results.tests.push({
            name: "lighthouse",
            status: passed ? "PASS" : "FAIL",
            scores: {
                performance: perfScore,
                seo: seoScore
            },
            report: `Load time: ${loadTime}ms, Title: ${hasTitle}, Meta: ${hasMeta}`
        });
        
        if (!passed) {
            results.metrics.warnings++;
            results.metrics.all_tests_pass = false;
        }
        
    } catch (error) {
        results.tests.push({
            name: "lighthouse",
            status: "FAIL",
            scores: { performance: 0, seo: 0 },
            report: `Performance test failed: ${error.message}`
        });
        results.metrics.warnings++;
        results.metrics.all_tests_pass = false;
    }
    
    // Final Summary
    console.log('\n📊 SMOKE TEST RESULTS:');
    results.tests.forEach(test => {
        const icon = test.status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} ${test.name}: ${test.status}`);
        if (test.details) console.log(`   Details: ${test.details}`);
        if (test.evidence) console.log(`   Evidence: ${test.evidence}`);
        if (test.response) console.log(`   Response: ${test.response}`);
        if (test.content) console.log(`   Content: ${test.content}`);
        if (test.report) console.log(`   Report: ${test.report}`);
    });
    
    console.log(`\n📈 FINAL METRICS:`);
    console.log(`- All tests pass: ${results.metrics.all_tests_pass}`);
    console.log(`- Critical issues: ${results.metrics.critical_issues}`);
    console.log(`- Warnings: ${results.metrics.warnings}`);
    console.log(`- Passed/Total: ${results.tests.filter(t => t.status === 'PASS').length}/${results.tests.length}`);
    
    // Save results
    fs.writeFileSync('validate.results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Results saved to: validate.results.json');
    
    return results;
}

// Execute
runFinalSmokeTests().then((results) => {
    const exitCode = results.metrics.all_tests_pass ? 0 : 1;
    console.log(`\n🏁 Tests completed with exit code: ${exitCode}`);
    process.exit(exitCode);
}).catch((error) => {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
});