const puppeteer = require('puppeteer');
const fs = require('fs');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

async function testTemplate(browser, templatePath, templateName, expectedFeatures) {
    console.log(`\n${colors.cyan}🧪 Testing ${templateName}${colors.reset}`);
    const page = await browser.newPage();
    
    let results = {
        passed: 0,
        failed: 0,
        issues: []
    };
    
    try {
        if (!fs.existsSync(templatePath)) {
            results.issues.push(`❌ Template file not found: ${templatePath}`);
            results.failed++;
            return results;
        }
        
        await page.goto(`file://${templatePath}`, { waitUntil: 'networkidle0' });
        
        // Test 1: Page loads with title containing {{CITY}}
        try {
            const title = await page.title();
            if (title.includes('{{CITY}}')) {
                console.log(`${colors.green}✅ Title has {{CITY}} placeholder${colors.reset}`);
                results.passed++;
            } else {
                throw new Error('Missing {{CITY}} in title');
            }
        } catch (e) {
            console.log(`${colors.red}❌ Title test failed: ${e.message}${colors.reset}`);
            results.failed++;
            results.issues.push(e.message);
        }
        
        // Test 2: Navigation present
        try {
            const nav = await page.$('nav.navbar');
            if (!nav) throw new Error('Navigation not found');
            
            const emergencyCTA = await page.$('a[href="tel:+390398882041"]');
            if (!emergencyCTA) throw new Error('Emergency phone CTA missing');
            
            console.log(`${colors.green}✅ Navigation with emergency CTA${colors.reset}`);
            results.passed++;
        } catch (e) {
            console.log(`${colors.red}❌ Navigation test failed: ${e.message}${colors.reset}`);
            results.failed++;
            results.issues.push(e.message);
        }
        
        // Test 3: Pricing information
        try {
            const prices = await page.$$('.price, .pricing-card .display-4, .pricing-card h3');
            if (prices.length === 0) {
                throw new Error('No pricing information found');
            }
            
            const priceTexts = await page.$$eval('.price, .pricing-card .display-4, .pricing-card h3', 
                elements => elements.map(el => el.textContent)
            );
            
            console.log(`${colors.green}✅ Pricing information present: ${priceTexts.slice(0,3).join(', ')}${colors.reset}`);
            results.passed++;
        } catch (e) {
            console.log(`${colors.red}❌ Pricing test failed: ${e.message}${colors.reset}`);
            results.failed++;
            results.issues.push(e.message);
        }
        
        // Test 4: Contact form
        try {
            const form = await page.$('#contactForm, form[data-form-type]');
            if (!form) throw new Error('Contact form not found');
            
            const requiredFields = await page.$$('input[required]');
            if (requiredFields.length < 3) throw new Error('Not enough required fields');
            
            const privacyCheckbox = await page.$('input[name="privacy"]');
            if (!privacyCheckbox) throw new Error('Privacy checkbox missing');
            
            console.log(`${colors.green}✅ Contact form with ${requiredFields.length} required fields${colors.reset}`);
            results.passed++;
        } catch (e) {
            console.log(`${colors.red}❌ Contact form test failed: ${e.message}${colors.reset}`);
            results.failed++;
            results.issues.push(e.message);
        }
        
        // Test 5: Mobile responsiveness
        try {
            await page.setViewport({ width: 375, height: 667 });
            
            const mobileMenu = await page.$('.navbar-toggler');
            if (!mobileMenu) throw new Error('Mobile menu toggler not found');
            
            // Check if content is responsive
            const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
            if (bodyWidth > 400) throw new Error('Content not mobile responsive');
            
            console.log(`${colors.green}✅ Mobile responsive design${colors.reset}`);
            results.passed++;
        } catch (e) {
            console.log(`${colors.red}❌ Mobile test failed: ${e.message}${colors.reset}`);
            results.failed++;
            results.issues.push(e.message);
        }
        
        // Test 6: Contact info
        try {
            const pageContent = await page.content();
            if (!pageContent.includes('039 888 2041')) throw new Error('Phone number missing');
            if (!pageContent.includes('Viale Risorgimento 32')) throw new Error('Address missing');
            if (!pageContent.includes('Vimercate')) throw new Error('City missing');
            
            console.log(`${colors.green}✅ Contact info correct${colors.reset}`);
            results.passed++;
        } catch (e) {
            console.log(`${colors.red}❌ Contact info test failed: ${e.message}${colors.reset}`);
            results.failed++;
            results.issues.push(e.message);
        }
        
        // Test 7: SEO meta tags
        try {
            const description = await page.$eval('meta[name="description"]', el => el.content);
            const keywords = await page.$eval('meta[name="keywords"]', el => el.content);
            
            if (!description.includes('{{CITY}}')) throw new Error('Meta description missing {{CITY}}');
            if (!keywords.includes('{{CITY}}')) throw new Error('Keywords missing {{CITY}}');
            
            console.log(`${colors.green}✅ SEO meta tags optimized${colors.reset}`);
            results.passed++;
        } catch (e) {
            console.log(`${colors.red}❌ SEO meta test failed: ${e.message}${colors.reset}`);
            results.failed++;
            results.issues.push(e.message);
        }
        
        // Test 8: No console errors
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        
        await page.reload();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (errors.length === 0) {
            console.log(`${colors.green}✅ No JavaScript errors${colors.reset}`);
            results.passed++;
        } else {
            console.log(`${colors.red}❌ JavaScript errors found: ${errors.slice(0,2).join(', ')}${colors.reset}`);
            results.failed++;
            results.issues.push(`JavaScript errors: ${errors.length}`);
        }
        
    } catch (error) {
        console.log(`${colors.red}❌ Critical error: ${error.message}${colors.reset}`);
        results.failed++;
        results.issues.push(`Critical: ${error.message}`);
    } finally {
        await page.close();
    }
    
    return results;
}

async function runFinalValidation() {
    console.log(`${colors.bright}${colors.blue}${'='.repeat(80)}`);
    console.log('🚀 IT-ERA FINAL TEMPLATE VALIDATION - PUPPETEER EDITION');
    console.log(`${'='.repeat(80)}${colors.reset}\n`);
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const templates = [
        {
            path: '/Users/andreapanzeri/progetti/IT-ERA/templates/assistenza-it-template-new.html',
            name: 'Assistenza IT (Good Reference)',
            features: ['SEO', 'Form', 'Pricing', 'Design']
        },
        {
            path: '/Users/andreapanzeri/progetti/IT-ERA/templates/sicurezza-informatica-modern.html',
            name: 'Sicurezza Informatica (Fixed)',
            features: ['Cyber Theme', 'Contrast', 'Form', 'Navigation']
        },
        {
            path: '/Users/andreapanzeri/progetti/IT-ERA/templates/cloud-storage-perfect.html',
            name: 'Cloud Storage (Perfect Copy)',
            features: ['Azure Theme', 'SEO', 'Form', 'Content']
        }
    ];
    
    let totalPassed = 0;
    let totalFailed = 0;
    let templateResults = [];
    
    // Test each template
    for (const template of templates) {
        const result = await testTemplate(browser, template.path, template.name, template.features);
        totalPassed += result.passed;
        totalFailed += result.failed;
        
        const score = Math.round((result.passed / (result.passed + result.failed)) * 100);
        templateResults.push({
            name: template.name,
            score: score,
            passed: result.passed,
            failed: result.failed,
            issues: result.issues
        });
    }
    
    await browser.close();
    
    // Generate comprehensive report
    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}`);
    console.log('📊 FINAL VALIDATION REPORT');
    console.log(`${'='.repeat(80)}${colors.reset}`);
    
    // Overall stats
    console.log(`${colors.green}✅ Total Tests Passed: ${totalPassed}${colors.reset}`);
    console.log(`${colors.red}❌ Total Tests Failed: ${totalFailed}${colors.reset}`);
    console.log(`📈 Overall Success Rate: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);
    
    // Template breakdown
    console.log(`\n${colors.bright}📋 TEMPLATE BREAKDOWN:${colors.reset}`);
    templateResults.forEach(template => {
        const status = template.score >= 90 ? colors.green + '🟢 EXCELLENT' : 
                      template.score >= 75 ? colors.yellow + '🟡 GOOD' : 
                      colors.red + '🔴 NEEDS WORK';
        
        console.log(`${status} ${template.name}: ${template.score}% (${template.passed}/${template.passed + template.failed})${colors.reset}`);
        
        if (template.issues.length > 0) {
            template.issues.slice(0, 3).forEach(issue => {
                console.log(`   ${colors.red}• ${issue}${colors.reset}`);
            });
        }
    });
    
    // Production readiness
    console.log(`\n${colors.bright}🚀 PRODUCTION READINESS:${colors.reset}`);
    const excellentTemplates = templateResults.filter(t => t.score >= 90).length;
    const goodTemplates = templateResults.filter(t => t.score >= 75 && t.score < 90).length;
    const needsWork = templateResults.filter(t => t.score < 75).length;
    
    console.log(`🟢 Production Ready: ${excellentTemplates} templates`);
    console.log(`🟡 Minor Fixes: ${goodTemplates} templates`);
    console.log(`🔴 Major Fixes: ${needsWork} templates`);
    
    if (excellentTemplates === templates.length) {
        console.log(`\n${colors.bright}${colors.green}🎉 ALL TEMPLATES ARE PRODUCTION READY!${colors.reset}`);
        console.log('✨ Ready for city page generation and deployment.');
    } else {
        console.log(`\n${colors.yellow}⚠️ Some templates need attention before mass deployment.${colors.reset}`);
    }
    
    console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
    
    return {
        totalScore: Math.round((totalPassed / (totalPassed + totalFailed)) * 100),
        templates: templateResults,
        readyForProduction: excellentTemplates === templates.length
    };
}

// Run the final validation
runFinalValidation().then(results => {
    console.log(`\n🏆 Final Score: ${results.totalScore}%`);
    console.log(`📋 Templates Ready: ${results.readyForProduction ? 'YES' : 'NO'}`);
}).catch(console.error);