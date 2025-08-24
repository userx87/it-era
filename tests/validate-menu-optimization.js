const puppeteer = require('puppeteer');

async function validateMenuOptimization() {
    console.log('🔍 Validating Optimized Menu Implementation\n');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    let passedTests = 0;
    let totalTests = 0;
    
    // Test homepage
    await page.goto(`file:///Users/andreapanzeri/progetti/IT-ERA/web/index.html`, {
        waitUntil: 'networkidle0'
    });
    
    // Test 1: Emergency CTA is visible
    totalTests++;
    try {
        const emergencyCTA = await page.$('.nav-link.text-danger');
        if (!emergencyCTA) throw new Error('Emergency CTA not found');
        const emergencyText = await page.$eval('.nav-link.text-danger', el => el.textContent);
        if (!emergencyText.includes('Supporto Urgente')) throw new Error('Emergency text incorrect');
        console.log('✅ Emergency support CTA is prominent');
        passedTests++;
    } catch (e) {
        console.log('❌ Emergency CTA test failed:', e.message);
    }
    
    // Test 2: Services dropdown with urgency badges
    totalTests++;
    try {
        await page.click('text=Servizi');
        await page.waitForSelector('.dropdown-menu', { visible: true });
        const urgencyBadge = await page.$('.badge.bg-danger');
        if (!urgencyBadge) throw new Error('Urgency badge not found');
        const badgeText = await page.$eval('.badge.bg-danger', el => el.textContent);
        if (!badgeText.includes('15min')) throw new Error('15min urgency not shown');
        console.log('✅ Services dropdown has urgency indicators');
        passedTests++;
    } catch (e) {
        console.log('❌ Services dropdown test failed:', e.message);
    }
    
    // Test 3: Industry sectors dropdown
    totalTests++;
    try {
        await page.click('text=Settori');
        await page.waitForSelector('.dropdown-menu', { visible: true });
        const sectors = await page.$$eval('.dropdown-item', items => 
            items.filter(el => el.textContent.includes('PMI') || 
                              el.textContent.includes('Studi Medici')).length
        );
        if (sectors < 2) throw new Error('Industry sectors missing');
        console.log('✅ Industry sectors dropdown working');
        passedTests++;
    } catch (e) {
        console.log('❌ Industry sectors test failed:', e.message);
    }
    
    // Test 4: Coverage areas dropdown
    totalTests++;
    try {
        await page.click('text=Zone Coperte');
        await page.waitForSelector('.dropdown-menu-columns', { visible: true });
        const cities = await page.$$('.dropdown-menu-columns .dropdown-item');
        if (cities.length < 5) throw new Error('Not enough cities shown');
        console.log('✅ Coverage areas dropdown populated');
        passedTests++;
    } catch (e) {
        console.log('❌ Coverage areas test failed:', e.message);
    }
    
    // Test 5: Mobile emergency button
    totalTests++;
    try {
        await page.setViewport({ width: 375, height: 667 });
        const mobileEmergency = await page.$('.d-lg-none .btn-danger');
        if (!mobileEmergency) throw new Error('Mobile emergency button not found');
        const isVisible = await page.$eval('.d-lg-none .btn-danger', el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none';
        });
        if (!isVisible) throw new Error('Mobile emergency button not visible');
        console.log('✅ Mobile emergency button is visible');
        passedTests++;
    } catch (e) {
        console.log('❌ Mobile emergency test failed:', e.message);
    }
    
    // Test 6: Primary phone CTA
    totalTests++;
    try {
        await page.setViewport({ width: 1200, height: 800 });
        const phoneCTA = await page.$('.navbar .btn-primary');
        if (!phoneCTA) throw new Error('Primary phone CTA not found');
        const phoneText = await page.$eval('.navbar .btn-primary', el => el.textContent);
        if (!phoneText.includes('039 888 2041')) throw new Error('Phone number incorrect');
        console.log('✅ Primary phone CTA is prominent');
        passedTests++;
    } catch (e) {
        console.log('❌ Phone CTA test failed:', e.message);
    }
    
    // Test 7: Special offer badge
    totalTests++;
    try {
        await page.click('text=Servizi');
        const offerBadge = await page.$('.badge.bg-success');
        if (!offerBadge) throw new Error('Special offer badge not found');
        const offerText = await page.$eval('.badge.bg-success', el => el.textContent);
        if (!offerText.includes('-30%')) throw new Error('Discount percentage not shown');
        console.log('✅ Special offer badge displayed');
        passedTests++;
    } catch (e) {
        console.log('❌ Special offer test failed:', e.message);
    }
    
    // Test random landing page
    totalTests++;
    try {
        await page.goto(`file:///Users/andreapanzeri/progetti/IT-ERA/web/pages/assistenza-it-milano.html`);
        const nav = await page.$('.navbar');
        if (!nav) throw new Error('Navigation not found on landing page');
        const emergencyLink = await page.$('a[href="tel:+390398882041"]');
        if (!emergencyLink) throw new Error('Emergency link not found on landing page');
        console.log('✅ Optimized menu applied to landing pages');
        passedTests++;
    } catch (e) {
        console.log('❌ Landing page menu test failed:', e.message);
    }
    
    // Generate report
    console.log('\n' + '='.repeat(50));
    console.log('📊 MENU OPTIMIZATION VALIDATION REPORT');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 ALL MENU OPTIMIZATIONS SUCCESSFULLY VALIDATED!');
        console.log('✨ The conversion-oriented menu is ready for deployment.');
    } else {
        console.log('\n⚠️ Some optimizations need attention.');
    }
    console.log('='.repeat(50));
    
    await browser.close();
}

validateMenuOptimization().catch(console.error);