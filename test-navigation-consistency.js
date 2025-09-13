/*!
 * IT-ERA Navigation Consistency Test
 * Comprehensive testing for navigation consistency across all pages
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    headless: true,
    viewport: { width: 1920, height: 1080 },
    timeout: 30000,
    baseUrl: 'file://' + __dirname,
    pages: [
        'index.html',
        'servizi.html', 
        'contatti.html',
        'settori/commercialisti.html',
        'settori/pmi-startup.html',
        'settori/studi-legali.html',
        'settori/industria-40.html',
        'settori/retail-gdo.html',
        'settori/studi-medici/index.html',
        'landing/assistenza-emergenza.html',
        'landing/cloud-migration.html',
        'landing/digitalizzazione-pmi.html',
        'landing/sicurezza-informatica.html',
        'landing/software-commercialisti.html'
    ]
};

// Test results storage
let testResults = {
    timestamp: new Date().toISOString(),
    totalPages: TEST_CONFIG.pages.length,
    passedPages: 0,
    failedPages: 0,
    results: []
};

/**
 * Test navigation consistency on a single page
 */
async function testPageNavigation(page, pageUrl, pageName) {
    console.log(`🧪 Testing navigation on: ${pageName}`);
    
    const result = {
        page: pageName,
        url: pageUrl,
        passed: true,
        issues: [],
        checks: {
            headerLoaded: false,
            navigationLinks: false,
            mobileMenu: false,
            dropdownMenu: false,
            footerLoaded: false,
            chatbotLoaded: false,
            componentsSystem: false
        }
    };

    try {
        // Navigate to page
        await page.goto(pageUrl, { waitUntil: 'networkidle0', timeout: TEST_CONFIG.timeout });
        
        // Wait for components to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 1: Check if header component loaded
        try {
            const headerExists = await page.$('#header-placeholder header') || await page.$('header');
            result.checks.headerLoaded = !!headerExists;
            if (!headerExists) {
                result.issues.push('Header component not found');
                result.passed = false;
            }
        } catch (error) {
            result.issues.push(`Header check failed: ${error.message}`);
            result.passed = false;
        }

        // Test 2: Check navigation links
        try {
            const navLinks = await page.$$('nav a[href], .nav-link');
            result.checks.navigationLinks = navLinks.length >= 3; // Should have at least Home, Servizi, Contatti
            if (navLinks.length < 3) {
                result.issues.push(`Insufficient navigation links found: ${navLinks.length}`);
                result.passed = false;
            }
        } catch (error) {
            result.issues.push(`Navigation links check failed: ${error.message}`);
            result.passed = false;
        }

        // Test 3: Check mobile menu functionality
        try {
            const mobileMenuButton = await page.$('#mobile-menu-button');
            const mobileMenu = await page.$('#mobile-menu');
            result.checks.mobileMenu = !!(mobileMenuButton && mobileMenu);
            if (!mobileMenuButton || !mobileMenu) {
                result.issues.push('Mobile menu components not found');
                result.passed = false;
            }
        } catch (error) {
            result.issues.push(`Mobile menu check failed: ${error.message}`);
            result.passed = false;
        }

        // Test 4: Check dropdown menu (Settori)
        try {
            const dropdownTrigger = await page.$('button:has-text("Settori"), .group button');
            if (dropdownTrigger) {
                result.checks.dropdownMenu = true;
            } else {
                // Try alternative selector
                const altDropdown = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.some(btn => btn.textContent.includes('Settori'));
                });
                result.checks.dropdownMenu = altDropdown;
            }
        } catch (error) {
            result.issues.push(`Dropdown menu check failed: ${error.message}`);
        }

        // Test 5: Check footer component
        try {
            const footerExists = await page.$('#footer-placeholder footer') || await page.$('footer');
            result.checks.footerLoaded = !!footerExists;
            if (!footerExists) {
                result.issues.push('Footer component not found');
                result.passed = false;
            }
        } catch (error) {
            result.issues.push(`Footer check failed: ${error.message}`);
            result.passed = false;
        }

        // Test 6: Check chatbot component
        try {
            const chatbotExists = await page.$('#chatbot-placeholder') || await page.$('#chatbot-button');
            result.checks.chatbotLoaded = !!chatbotExists;
            if (!chatbotExists) {
                result.issues.push('Chatbot component not found');
                result.passed = false;
            }
        } catch (error) {
            result.issues.push(`Chatbot check failed: ${error.message}`);
            result.passed = false;
        }

        // Test 7: Check if components system is working
        try {
            const componentsLoaderScript = await page.evaluate(() => {
                const scripts = Array.from(document.querySelectorAll('script'));
                return scripts.some(script => 
                    script.src.includes('components-loader.js') || 
                    script.textContent.includes('ITERAComponents')
                );
            });
            result.checks.componentsSystem = componentsLoaderScript;
            if (!componentsLoaderScript) {
                result.issues.push('Components loader system not detected');
                result.passed = false;
            }
        } catch (error) {
            result.issues.push(`Components system check failed: ${error.message}`);
            result.passed = false;
        }

        // Test 8: Mobile responsiveness test
        try {
            await page.setViewport({ width: 375, height: 667 }); // Mobile viewport
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const mobileMenuVisible = await page.evaluate(() => {
                const button = document.querySelector('#mobile-menu-button');
                return button && window.getComputedStyle(button).display !== 'none';
            });
            
            if (!mobileMenuVisible) {
                result.issues.push('Mobile menu button not visible on mobile viewport');
                result.passed = false;
            }
            
            // Reset viewport
            await page.setViewport(TEST_CONFIG.viewport);
        } catch (error) {
            result.issues.push(`Mobile responsiveness check failed: ${error.message}`);
            result.passed = false;
        }

    } catch (error) {
        result.passed = false;
        result.issues.push(`Page load failed: ${error.message}`);
    }

    // Update counters
    if (result.passed) {
        testResults.passedPages++;
        console.log(`✅ ${pageName} - PASSED`);
    } else {
        testResults.failedPages++;
        console.log(`❌ ${pageName} - FAILED (${result.issues.length} issues)`);
        result.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    return result;
}

/**
 * Run comprehensive navigation tests
 */
async function runNavigationTests() {
    console.log('🚀 Starting IT-ERA Navigation Consistency Tests...\n');
    
    const browser = await puppeteer.launch({ 
        headless: TEST_CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport(TEST_CONFIG.viewport);
    
    // Test each page
    for (const pagePath of TEST_CONFIG.pages) {
        const pageUrl = `${TEST_CONFIG.baseUrl}/${pagePath}`;
        const result = await testPageNavigation(page, pageUrl, pagePath);
        testResults.results.push(result);
    }
    
    await browser.close();
    
    // Generate report
    generateTestReport();
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 IT-ERA NAVIGATION CONSISTENCY TEST REPORT');
    console.log('='.repeat(80));
    console.log(`Test Date: ${testResults.timestamp}`);
    console.log(`Total Pages Tested: ${testResults.totalPages}`);
    console.log(`✅ Passed: ${testResults.passedPages}`);
    console.log(`❌ Failed: ${testResults.failedPages}`);
    console.log(`Success Rate: ${((testResults.passedPages / testResults.totalPages) * 100).toFixed(1)}%`);
    console.log('='.repeat(80));
    
    // Detailed results
    testResults.results.forEach(result => {
        console.log(`\n📄 ${result.page}`);
        console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
        
        // Show check results
        Object.entries(result.checks).forEach(([check, passed]) => {
            console.log(`  ${passed ? '✅' : '❌'} ${check}`);
        });
        
        // Show issues if any
        if (result.issues.length > 0) {
            console.log('  Issues:');
            result.issues.forEach(issue => console.log(`    - ${issue}`));
        }
    });
    
    // Save detailed report to file
    const reportPath = path.join(__dirname, 'navigation-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📝 Detailed report saved to: ${reportPath}`);
    
    // Summary
    console.log('\n' + '='.repeat(80));
    if (testResults.failedPages === 0) {
        console.log('🎉 ALL TESTS PASSED! Navigation consistency is perfect across all pages.');
    } else {
        console.log(`⚠️  ${testResults.failedPages} pages need attention for navigation consistency.`);
    }
    console.log('='.repeat(80));
}

// Run tests
if (require.main === module) {
    runNavigationTests().catch(console.error);
}

module.exports = { runNavigationTests, testPageNavigation };
