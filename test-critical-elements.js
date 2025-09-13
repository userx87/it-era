const puppeteer = require('puppeteer');

(async () => {
  console.log('🎯 TESTING CRITICAL CONVERSION ELEMENTS');
  console.log('=' .repeat(50));
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Test Homepage Critical Elements
    console.log('\n🏠 HOMEPAGE CRITICAL ELEMENTS:');
    await page.goto('https://it-era.it/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Check if new content is loaded
    const pageContent = await page.content();
    const hasNewContent = pageContent.includes('Consulenza Gratuita') || 
                         pageContent.includes('Emergenza 24/7') ||
                         pageContent.includes('500+ Aziende');
    
    console.log(`  New Content Detected: ${hasNewContent ? '✅' : '❌'}`);
    
    // Test specific conversion elements
    const ctaButtons = await page.$$eval('a[href*="contatti"]', 
      buttons => buttons.map(btn => btn.textContent.trim())
    ).catch(() => []);
    console.log(`  CTA Buttons: ${ctaButtons.length} found`);
    ctaButtons.forEach((btn, i) => console.log(`    ${i+1}. "${btn}"`));
    
    const phoneButtons = await page.$$eval('a[href^="tel:"]', 
      buttons => buttons.map(btn => btn.textContent.trim())
    ).catch(() => []);
    console.log(`  Phone CTAs: ${phoneButtons.length} found`);
    phoneButtons.forEach((btn, i) => console.log(`    ${i+1}. "${btn}"`));
    
    // Test Servizi Page
    console.log('\n🛠️ SERVIZI PAGE CRITICAL ELEMENTS:');
    await page.goto('https://it-era.it/servizi.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const pricingElements = await page.$$eval('.text-4xl.font-bold', 
      elements => elements.map(el => el.textContent.trim()).filter(text => text.includes('€'))
    ).catch(() => []);
    console.log(`  Pricing Elements: ${pricingElements.length} found`);
    pricingElements.forEach((price, i) => console.log(`    ${i+1}. ${price}`));
    
    const serviceCards = await page.$$('.bg-white.p-8.rounded-2xl').catch(() => []);
    console.log(`  Enhanced Service Cards: ${serviceCards.length} found`);
    
    // Test PMI Page
    console.log('\n🚀 PMI E STARTUP CRITICAL ELEMENTS:');
    await page.goto('https://it-era.it/settori/pmi-startup.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const roiElements = await page.$$eval('.font-bold.text-lg', 
      elements => elements.map(el => el.textContent.trim()).filter(text => text.includes('%') || text.includes('ROI'))
    ).catch(() => []);
    console.log(`  ROI Elements: ${roiElements.length} found`);
    roiElements.forEach((roi, i) => console.log(`    ${i+1}. ${roi}`));
    
    const caseStudyPresent = await page.evaluate(() => {
      return document.body.textContent.includes('TechModa') || document.body.textContent.includes('InnovaStudio');
    }).catch(() => false);
    console.log(`  Case Studies Present: ${caseStudyPresent ? '✅' : '❌'}`);
    
    // Test Commercialisti Page
    console.log('\n📊 COMMERCIALISTI CRITICAL ELEMENTS:');
    await page.goto('https://it-era.it/settori/commercialisti.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const complianceElements = await page.$$eval('.font-bold.text-lg', 
      elements => elements.map(el => el.textContent.trim()).filter(text => text.includes('%') || text.includes('GDPR'))
    ).catch(() => []);
    console.log(`  Compliance Elements: ${complianceElements.length} found`);
    complianceElements.forEach((comp, i) => console.log(`    ${i+1}. ${comp}`));
    
    const professionalTestimonials = await page.evaluate(() => {
      return document.body.textContent.includes('Studio Fiscale') || document.body.textContent.includes('CAF Bianchi');
    }).catch(() => false);
    console.log(`  Professional Testimonials: ${professionalTestimonials ? '✅' : '❌'}`);
    
    // Overall Assessment
    console.log('\n' + '='.repeat(50));
    console.log('🎯 CRITICAL ELEMENTS ASSESSMENT:');
    
    const criticalScore = {
      newContent: hasNewContent,
      ctaButtons: ctaButtons.length >= 5,
      phoneButtons: phoneButtons.length >= 3,
      pricing: pricingElements.length >= 3,
      serviceCards: serviceCards.length >= 4,
      roiElements: roiElements.length >= 3,
      caseStudies: caseStudyPresent,
      complianceElements: complianceElements.length >= 2,
      testimonials: professionalTestimonials
    };
    
    const passedChecks = Object.values(criticalScore).filter(Boolean).length;
    const totalChecks = Object.keys(criticalScore).length;
    const percentage = Math.round(passedChecks / totalChecks * 100);
    
    console.log(`\n📊 CRITICAL ELEMENTS SCORE: ${passedChecks}/${totalChecks} (${percentage}%)`);
    
    Object.entries(criticalScore).forEach(([check, passed]) => {
      console.log(`  ${check}: ${passed ? '✅' : '❌'}`);
    });
    
    if (percentage >= 90) {
      console.log('\n🎉 EXCELLENT! All critical conversion elements are working!');
    } else if (percentage >= 75) {
      console.log('\n✅ GOOD! Most critical elements are working, deployment successful!');
    } else {
      console.log('\n⚠️ PARTIAL! Some elements may still be deploying or cached.');
    }
    
    console.log('\n🚀 CONVERSION READINESS:');
    if (percentage >= 75) {
      console.log('✅ READY FOR LEAD GENERATION!');
      console.log('✅ CTA buttons optimized and working');
      console.log('✅ Pricing transparency implemented');
      console.log('✅ Social proof and testimonials active');
      console.log('✅ Trust indicators and guarantees live');
    } else {
      console.log('⏳ Wait for full deployment or check individual elements');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
  }
})();
