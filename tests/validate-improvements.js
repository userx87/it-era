const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test results collector
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

async function runTest(name, testFn) {
    try {
        await testFn();
        testResults.passed++;
        testResults.tests.push({ name, status: '✅ PASSED' });
        console.log(`✅ ${name}`);
    } catch (error) {
        testResults.failed++;
        testResults.tests.push({ name, status: '❌ FAILED', error: error.message });
        console.log(`❌ ${name}: ${error.message}`);
    }
}

async function validateImprovements() {
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    console.log('🔍 IT-ERA Website Improvement Validation\n');
    console.log('Testing: /Users/andreapanzeri/progetti/IT-ERA/web/index.html\n');
    
    // Navigate to homepage
    await page.goto(`file:///Users/andreapanzeri/progetti/IT-ERA/web/index.html`, {
        waitUntil: 'networkidle0'
    });
    
    // Test 1: Homepage exists and loads
    await runTest('Homepage loads successfully', async () => {
        const title = await page.title();
        if (!title.includes('IT-ERA')) throw new Error('Title missing IT-ERA');
    });
    
    // Test 2: Emergency banner is visible
    await runTest('Emergency support banner visible', async () => {
        const banner = await page.$('.emergency-banner');
        if (!banner) throw new Error('Emergency banner not found');
        const text = await page.$eval('.emergency-banner', el => el.textContent);
        if (!text.includes('039 888 2041')) throw new Error('Phone number not in banner');
    });
    
    // Test 3: Hero section with improved CTAs
    await runTest('Hero CTAs with urgency indicators', async () => {
        const primaryCTA = await page.$('.btn-cta-primary');
        if (!primaryCTA) throw new Error('Primary CTA not found');
        const ctaText = await page.$eval('.btn-cta-primary', el => el.textContent);
        if (!ctaText.includes('15 min')) throw new Error('Urgency indicator missing');
    });
    
    // Test 4: Trust metrics bar
    await runTest('Trust metrics displayed', async () => {
        const metrics = await page.$$('.metric-value');
        if (metrics.length < 5) throw new Error(`Only ${metrics.length} metrics found, expected 5`);
        const values = await page.$$eval('.metric-value', els => els.map(el => el.textContent));
        if (!values.includes('300+')) throw new Error('300+ companies metric missing');
        if (!values.includes('15min')) throw new Error('15min response metric missing');
    });
    
    // Test 5: Service cards with pricing
    await runTest('Service cards with transparent pricing', async () => {
        const cards = await page.$$('.service-card');
        if (cards.length < 6) throw new Error(`Only ${cards.length} service cards, expected 6`);
        const prices = await page.$$('.price');
        if (prices.length < 6) throw new Error('Pricing not visible on all cards');
    });
    
    // Test 6: Mobile responsiveness
    await runTest('Mobile responsive design', async () => {
        await page.setViewport({ width: 375, height: 667 });
        const menuToggler = await page.$('.navbar-toggler');
        if (!menuToggler) throw new Error('Mobile menu toggler not found');
        const isVisible = await page.$eval('.navbar-toggler', el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none';
        });
        if (!isVisible) throw new Error('Menu toggler not visible on mobile');
    });
    
    // Test 7: Touch target sizes
    await runTest('Touch targets meet 48px minimum', async () => {
        const buttons = await page.$$('.btn, .btn-cta-primary, .btn-cta-secondary');
        for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
            const box = await button.boundingBox();
            if (box && box.height < 48) {
                throw new Error(`Button height ${box.height}px is less than 48px minimum`);
            }
        }
    });
    
    // Test 8: Partner logos visible
    await runTest('Partner badges displayed', async () => {
        const logos = await page.$$('.client-logos img');
        if (logos.length < 5) throw new Error(`Only ${logos.length} partner logos, expected 5`);
        const altTexts = await page.$$eval('.client-logos img', imgs => 
            imgs.map(img => img.alt)
        );
        if (!altTexts.includes('Microsoft Partner')) throw new Error('Microsoft logo missing');
        if (!altTexts.includes('Veeam Gold Partner')) throw new Error('Veeam logo missing');
    });
    
    // Test 9: Coverage section with city tags
    await runTest('Geographic coverage section', async () => {
        const cityTags = await page.$$('.city-tag');
        if (cityTags.length < 15) throw new Error(`Only ${cityTags.length} city tags found`);
        const cities = await page.$$eval('.city-tag', tags => 
            tags.map(tag => tag.textContent)
        );
        if (!cities.includes('Milano')) throw new Error('Milano not in coverage');
        if (!cities.includes('Vimercate')) throw new Error('Vimercate not in coverage');
    });
    
    // Test 10: Performance optimizations
    await runTest('Critical CSS inlined', async () => {
        const html = await page.content();
        if (!html.includes('<style>')) throw new Error('No inline styles found');
        if (!html.includes('--primary: #0056cc')) throw new Error('CSS variables not inlined');
        if (!html.includes('media="print" onload')) throw new Error('CSS not deferred');
    });
    
    // Test 11: Contact information consistency
    await runTest('Correct contact information', async () => {
        const footer = await page.$('footer');
        const footerText = await page.$eval('footer', el => el.textContent);
        if (!footerText.includes('Viale Risorgimento 32')) throw new Error('Address incorrect');
        if (!footerText.includes('Vimercate MB')) throw new Error('City incorrect');
        if (!footerText.includes('039 888 2041')) throw new Error('Phone incorrect');
    });
    
    // Test 12: Multiple conversion points
    await runTest('Multiple conversion opportunities', async () => {
        const phoneCTAs = await page.$$('a[href="tel:+390398882041"]');
        if (phoneCTAs.length < 3) throw new Error(`Only ${phoneCTAs.length} phone CTAs found`);
        const serviceCTAs = await page.$$('.service-card .btn');
        if (serviceCTAs.length < 6) throw new Error('Service CTAs missing');
    });
    
    // Test 13: Accessibility features
    await runTest('Accessibility skip link', async () => {
        const skipLink = await page.$('.skip-link');
        if (!skipLink) throw new Error('Skip navigation link missing');
        const href = await page.$eval('.skip-link', el => el.href);
        if (!href.includes('#main-content')) throw new Error('Skip link target incorrect');
    });
    
    // Test 14: SEO meta tags
    await runTest('SEO meta tags present', async () => {
        const description = await page.$eval('meta[name="description"]', el => el.content);
        if (!description.includes('IT-ERA')) throw new Error('Meta description missing brand');
        if (!description.includes('Lombardia')) throw new Error('Meta description missing location');
        const viewport = await page.$eval('meta[name="viewport"]', el => el.content);
        if (!viewport.includes('width=device-width')) throw new Error('Viewport meta incorrect');
    });
    
    // Test 15: Navigation structure
    await runTest('Navigation menu structure', async () => {
        const navItems = await page.$$('.navbar-nav .nav-item');
        if (navItems.length < 5) throw new Error('Navigation items missing');
        const dropdowns = await page.$$('.dropdown-menu');
        if (dropdowns.length < 2) throw new Error('Dropdown menus missing');
    });
    
    // Test 16: Special offer highlighting
    await runTest('Special offer package highlighted', async () => {
        const specialCard = await page.$('.service-card[style*="border"]');
        if (!specialCard) throw new Error('Special offer card not highlighted');
        const text = await page.$eval('.service-card[style*="border"]', el => el.textContent);
        if (!text.includes('RISPARMIA 30%')) throw new Error('Savings percentage not shown');
    });
    
    // Test 17: Font optimization
    await runTest('Font loading optimized', async () => {
        const fontLink = await page.$('link[href*="fonts.googleapis"]');
        const href = await page.$eval('link[href*="fonts.googleapis"]', el => el.href);
        if (!href.includes('display=swap')) throw new Error('Font display swap not enabled');
    });
    
    // Test 18: No console errors
    await runTest('No JavaScript errors', async () => {
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        await page.reload();
        await page.waitForTimeout(1000);
        if (errors.length > 0) throw new Error(`Console errors: ${errors.join(', ')}`);
    });
    
    // Generate summary report
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY REPORT');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
    
    // Performance metrics
    const metrics = await page.metrics();
    console.log('\n⚡ PERFORMANCE METRICS:');
    console.log(`- DOM Nodes: ${metrics.Nodes}`);
    console.log(`- JavaScript Heap: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
    console.log(`- Layout Duration: ${Math.round(metrics.LayoutDuration * 1000)}ms`);
    
    // Take final screenshot
    await page.setViewport({ width: 1200, height: 800 });
    await page.goto(`file:///Users/andreapanzeri/progetti/IT-ERA/web/index.html`);
    await page.screenshot({ 
        path: 'screenshots/homepage-final.png',
        fullPage: false 
    });
    console.log('\n📸 Screenshot saved: screenshots/homepage-final.png');
    
    await browser.close();
    
    // Final verdict
    console.log('\n' + '='.repeat(60));
    if (testResults.failed === 0) {
        console.log('🎉 ALL IMPROVEMENTS SUCCESSFULLY VALIDATED!');
        console.log('✨ The IT-ERA website is ready for production deployment.');
    } else {
        console.log('⚠️ Some tests failed. Please review and fix before deployment.');
        console.log('\nFailed tests:');
        testResults.tests
            .filter(t => t.status.includes('FAILED'))
            .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
    }
    console.log('='.repeat(60));
}

// Run validation
validateImprovements().catch(console.error);