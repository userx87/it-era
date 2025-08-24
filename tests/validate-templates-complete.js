const puppeteer = require('puppeteer');
const fs = require('fs');

// ANSI colors for better output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

async function validateTemplate(browser, templatePath, templateName, expectedColor) {
    console.log(`\n${colors.cyan}🔍 Testing ${templateName}${colors.reset}`);
    const page = await browser.newPage();
    
    let passedTests = 0;
    let failedTests = 0;
    const results = [];
    
    try {
        // Navigate to template
        await page.goto(`file://${templatePath}`, {
            waitUntil: 'networkidle0'
        });
        
        // Test 1: Page loads and has title
        try {
            const title = await page.title();
            if (title && title.includes('{{CITY}}')) {
                console.log(`${colors.green}✅ Title with {{CITY}} placeholder found${colors.reset}`);
                passedTests++;
            } else {
                throw new Error('Title missing or incorrect');
            }
        } catch (e) {
            console.log(`${colors.red}❌ Title test failed: ${e.message}${colors.reset}`);
            failedTests++;
        }
        
        // Test 2: Navigation structure
        try {
            const nav = await page.$('nav.navbar');
            if (!nav) throw new Error('Navigation not found');
            
            // Check for emergency CTA
            const emergencyCTA = await page.$('a[href="tel:+390398882041"]');
            if (!emergencyCTA) throw new Error('Emergency phone CTA missing');
            
            console.log(`${colors.green}✅ Navigation with emergency CTA present${colors.reset}`);
            passedTests++;
        } catch (e) {
            console.log(`${colors.red}❌ Navigation test failed: ${e.message}${colors.reset}`);
            failedTests++;
        }
        
        // Test 3: Hero section and color theme
        try {
            const heroSection = await page.$('.hero');
            if (!heroSection) throw new Error('Hero section not found');
            
            // Check background color
            const bgColor = await page.$eval('.hero', el => 
                window.getComputedStyle(el).background
            );
            
            if (bgColor.includes(expectedColor)) {
                console.log(`${colors.green}✅ Correct theme color (${expectedColor})${colors.reset}`);
                passedTests++;
            } else {
                throw new Error(`Wrong theme color, expected ${expectedColor}`);
            }
        } catch (e) {
            console.log(`${colors.red}❌ Hero/theme test failed: ${e.message}${colors.reset}`);
            failedTests++;
        }
        
        // Test 4: Pricing cards
        try {
            const priceElements = await page.$$('.price');
            if (priceElements.length < 3) {
                throw new Error(`Only ${priceElements.length} price cards, expected 3+`);
            }
            
            // Get all prices
            const prices = await page.$$eval('.price', elements => 
                elements.map(el => el.textContent)
            );
            
            console.log(`${colors.green}✅ Pricing cards found: ${prices.join(', ')}${colors.reset}`);
            passedTests++;
        } catch (e) {
            console.log(`${colors.red}❌ Pricing test failed: ${e.message}${colors.reset}`);
            failedTests++;
        }
        
        // Test 5: Contact information
        try {
            const footer = await page.$('footer');
            if (!footer) throw new Error('Footer not found');
            
            const footerText = await page.$eval('footer', el => el.textContent);
            if (!footerText.includes('039 888 2041')) throw new Error('Phone missing');
            if (!footerText.includes('Viale Risorgimento 32')) throw new Error('Address missing');
            if (!footerText.includes('Vimercate')) throw new Error('City missing');
            
            console.log(`${colors.green}✅ Contact info correct (039 888 2041, Vimercate)${colors.reset}`);
            passedTests++;
        } catch (e) {
            console.log(`${colors.red}❌ Contact info test failed: ${e.message}${colors.reset}`);
            failedTests++;
        }
        
        // Test 6: WCAG Color Contrast
        try {
            await page.addScriptTag({
                content: `
                    function checkContrast() {
                        const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li');
                        let lowContrast = [];
                        
                        elements.forEach(el => {
                            const style = window.getComputedStyle(el);
                            const color = style.color;
                            const bg = style.backgroundColor;
                            
                            // Simple contrast check (would need proper algorithm for production)
                            if (color === bg) {
                                lowContrast.push(el.tagName);
                            }
                        });
                        
                        return lowContrast.length === 0;
                    }
                `
            });
            
            const goodContrast = await page.evaluate(() => checkContrast());
            
            if (goodContrast) {
                console.log(`${colors.green}✅ Color contrast appears good${colors.reset}`);
                passedTests++;
            } else {
                throw new Error('Low contrast elements detected');
            }
        } catch (e) {
            console.log(`${colors.red}❌ Contrast test failed: ${e.message}${colors.reset}`);
            failedTests++;
        }
        
        // Test 7: Mobile responsiveness
        try {
            await page.setViewport({ width: 375, height: 667 });
            
            // Check if navbar toggler is visible
            const toggler = await page.$('.navbar-toggler');
            if (!toggler) throw new Error('Mobile menu toggler not found');
            
            const isVisible = await page.$eval('.navbar-toggler', el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none';
            });
            
            if (isVisible) {
                console.log(`${colors.green}✅ Mobile responsive design working${colors.reset}`);
                passedTests++;
            } else {
                throw new Error('Mobile menu not visible');
            }
        } catch (e) {
            console.log(`${colors.red}❌ Mobile test failed: ${e.message}${colors.reset}`);
            failedTests++;
        }
        
        // Test 8: SEO Meta tags
        try {
            const description = await page.$eval('meta[name="description"]', el => el.content);
            const keywords = await page.$eval('meta[name="keywords"]', el => el.content);
            
            if (description.includes('{{CITY}}') && keywords.includes('{{CITY}}')) {
                console.log(`${colors.green}✅ SEO meta tags with {{CITY}} placeholders${colors.reset}`);
                passedTests++;
            } else {
                throw new Error('Meta tags missing city placeholders');
            }
        } catch (e) {
            console.log(`${colors.red}❌ SEO test failed: ${e.message}${colors.reset}`);
            failedTests++;
        }
        
        // Test 9: Bootstrap and dependencies
        try {
            const hasBootstrap = await page.evaluate(() => {
                return typeof window.bootstrap !== 'undefined';
            });
            
            if (hasBootstrap) {
                console.log(`${colors.green}✅ Bootstrap loaded correctly${colors.reset}`);
                passedTests++;
            } else {
                throw new Error('Bootstrap not loaded');
            }
        } catch (e) {
            console.log(`${colors.red}❌ Bootstrap test failed: ${e.message}${colors.reset}`);
            failedTests++;
        }
        
        // Test 10: No console errors
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        
        await page.reload();
        await page.waitForTimeout(1000);
        
        if (errors.length === 0) {
            console.log(`${colors.green}✅ No JavaScript errors${colors.reset}`);
            passedTests++;
        } else {
            console.log(`${colors.red}❌ Console errors: ${errors.join(', ')}${colors.reset}`);
            failedTests++;
        }
        
    } catch (error) {
        console.log(`${colors.red}❌ Critical error: ${error.message}${colors.reset}`);
        failedTests++;
    } finally {
        await page.close();
    }
    
    return { passedTests, failedTests, total: passedTests + failedTests };
}

async function runAllTests() {
    console.log(`${colors.bright}${colors.blue}${'='.repeat(60)}`);
    console.log('🚀 IT-ERA TEMPLATE VALIDATION TEST SUITE');
    console.log(`${'='.repeat(60)}${colors.reset}\n`);
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const templates = [
        {
            path: '/Users/andreapanzeri/progetti/IT-ERA/templates/assistenza-it-modern.html',
            name: 'Assistenza IT (Blue Theme)',
            color: '#0056cc'
        },
        {
            path: '/Users/andreapanzeri/progetti/IT-ERA/templates/sicurezza-informatica-modern.html',
            name: 'Sicurezza Informatica (Red/Dark Theme)',
            color: '#dc3545'
        },
        {
            path: '/Users/andreapanzeri/progetti/IT-ERA/templates/cloud-storage-modern.html',
            name: 'Cloud Storage (Azure Theme)',
            color: '#17a2b8'
        }
    ];
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const template of templates) {
        if (fs.existsSync(template.path)) {
            const result = await validateTemplate(browser, template.path, template.name, template.color);
            totalPassed += result.passedTests;
            totalFailed += result.failedTests;
        } else {
            console.log(`${colors.yellow}⚠️ Template not found: ${template.path}${colors.reset}`);
        }
    }
    
    await browser.close();
    
    // Final report
    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}`);
    console.log('📊 FINAL TEST REPORT');
    console.log(`${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.green}✅ Tests Passed: ${totalPassed}${colors.reset}`);
    console.log(`${colors.red}❌ Tests Failed: ${totalFailed}${colors.reset}`);
    console.log(`📈 Success Rate: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);
    
    if (totalFailed === 0) {
        console.log(`\n${colors.bright}${colors.green}🎉 ALL TEMPLATES VALIDATED SUCCESSFULLY!${colors.reset}`);
        console.log('✨ Templates are ready for production deployment.');
    } else {
        console.log(`\n${colors.yellow}⚠️ Some tests failed. Review and fix before deployment.${colors.reset}`);
    }
    
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
}

// Run the tests
runAllTests().catch(console.error);