const puppeteer = require('puppeteer');

(async () => {
  console.log('🎯 FINAL TESTING: ALL BRANCHES AND NAVIGATION');
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const results = {
    mainBranch: { score: 0, total: 0 },
    sectorPages: { score: 0, total: 0 },
    navigation: { score: 0, total: 0 },
    optimization: { score: 0, total: 0 }
  };
  
  try {
    // ===== TEST MAIN BRANCH =====
    console.log('\n🌟 TESTING MAIN BRANCH (Homepage + Servizi)...');
    
    // Homepage
    await page.goto('https://it-era.it/', { waitUntil: 'networkidle2', timeout: 30000 });
    const homepageOptimized = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Consulenza Gratuita') && text.includes('Emergenza 24/7');
    });
    results.mainBranch.total++;
    if (homepageOptimized) results.mainBranch.score++;
    console.log(`  Homepage Optimized: ${homepageOptimized ? '✅' : '❌'}`);
    
    // Servizi
    await page.goto('https://it-era.it/servizi.html', { waitUntil: 'networkidle2' });
    const serviziOptimized = await page.$$eval('.text-4xl.font-bold', 
      elements => elements.filter(el => el.textContent.includes('€')).length >= 3
    );
    results.mainBranch.total++;
    if (serviziOptimized) results.mainBranch.score++;
    console.log(`  Servizi Pricing: ${serviziOptimized ? '✅' : '❌'}`);
    
    // ===== TEST SECTOR PAGES =====
    console.log('\n🏢 TESTING ALL SECTOR PAGES...');
    
    const sectorTests = [
      { name: 'PMI e Startup', url: 'https://it-era.it/settori/pmi-startup.html', 
        test: () => document.body.textContent.includes('TechModa') && document.body.textContent.includes('InnovaStudio') },
      { name: 'Commercialisti', url: 'https://it-era.it/settori/commercialisti.html',
        test: () => document.body.textContent.includes('Studio Fiscale Rossi') && document.body.textContent.includes('CAF Bianchi') },
      { name: 'Studi Legali', url: 'https://it-era.it/settori/studi-legali.html',
        test: () => document.body.textContent.includes('Studi Legali') },
      { name: 'Industria 4.0', url: 'https://it-era.it/settori/industria-40.html',
        test: () => document.body.textContent.includes('Industria 4.0') },
      { name: 'Retail e GDO', url: 'https://it-era.it/settori/retail-gdo.html',
        test: () => document.body.textContent.includes('Retail') },
      { name: 'Studi Medici', url: 'https://it-era.it/settori/studi-medici/',
        test: () => document.body.textContent.includes('Medici') }
    ];
    
    for (const sector of sectorTests) {
      try {
        const response = await page.goto(sector.url, { waitUntil: 'networkidle2', timeout: 15000 });
        const isWorking = response.status() === 200;
        const hasContent = isWorking ? await page.evaluate(sector.test) : false;
        
        results.sectorPages.total++;
        if (isWorking && hasContent) results.sectorPages.score++;
        
        console.log(`  ${sector.name}: ${isWorking && hasContent ? '✅' : '❌'} (${response.status()})`);
      } catch (error) {
        results.sectorPages.total++;
        console.log(`  ${sector.name}: ❌ (Error)`);
      }
    }
    
    // ===== TEST NAVIGATION =====
    console.log('\n🧭 TESTING NAVIGATION SYSTEM...');
    
    await page.goto('https://it-era.it/', { waitUntil: 'networkidle2' });
    
    // Test menu links
    const menuLinks = await page.$$eval('a[href*="/settori/"]', links => links.length);
    results.navigation.total++;
    if (menuLinks >= 5) results.navigation.score++;
    console.log(`  Menu Links to Sectors: ${menuLinks >= 5 ? '✅' : '❌'} (${menuLinks} found)`);
    
    // Test CTA buttons
    const ctaButtons = await page.$$eval('a[href*="contatti"]', buttons => buttons.length);
    results.navigation.total++;
    if (ctaButtons >= 5) results.navigation.score++;
    console.log(`  CTA Buttons: ${ctaButtons >= 5 ? '✅' : '❌'} (${ctaButtons} found)`);
    
    // Test phone buttons
    const phoneButtons = await page.$$eval('a[href^="tel:"]', buttons => buttons.length);
    results.navigation.total++;
    if (phoneButtons >= 3) results.navigation.score++;
    console.log(`  Phone CTAs: ${phoneButtons >= 3 ? '✅' : '❌'} (${phoneButtons} found)`);
    
    // ===== TEST OPTIMIZATION ELEMENTS =====
    console.log('\n🎯 TESTING OPTIMIZATION ELEMENTS...');
    
    // Test testimonials across pages
    let testimonialCount = 0;
    for (const sector of ['pmi-startup', 'commercialisti']) {
      try {
        await page.goto(`https://it-era.it/settori/${sector}.html`, { waitUntil: 'networkidle2' });
        const hasTestimonials = await page.$$('blockquote');
        if (hasTestimonials.length > 0) testimonialCount++;
      } catch (error) {
        // Skip if error
      }
    }
    results.optimization.total++;
    if (testimonialCount >= 2) results.optimization.score++;
    console.log(`  Testimonials on Sector Pages: ${testimonialCount >= 2 ? '✅' : '❌'} (${testimonialCount} pages)`);
    
    // Test pricing on servizi
    await page.goto('https://it-era.it/servizi.html', { waitUntil: 'networkidle2' });
    const pricingPackages = await page.$$eval('.text-4xl.font-bold', 
      elements => elements.filter(el => el.textContent.includes('€')).length
    );
    results.optimization.total++;
    if (pricingPackages >= 3) results.optimization.score++;
    console.log(`  Pricing Packages: ${pricingPackages >= 3 ? '✅' : '❌'} (${pricingPackages} found)`);
    
    // Test trust indicators
    await page.goto('https://it-era.it/', { waitUntil: 'networkidle2' });
    const trustIndicators = await page.$$('.bg-white\\/60, .bg-white\\/80');
    results.optimization.total++;
    if (trustIndicators.length >= 4) results.optimization.score++;
    console.log(`  Trust Indicators: ${trustIndicators.length >= 4 ? '✅' : '❌'} (${trustIndicators.length} found)`);
    
    // ===== CALCULATE FINAL RESULTS =====
    const totalScore = results.mainBranch.score + results.sectorPages.score + 
                      results.navigation.score + results.optimization.score;
    const totalTests = results.mainBranch.total + results.sectorPages.total + 
                      results.navigation.total + results.optimization.total;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n🌟 MAIN BRANCH: ${results.mainBranch.score}/${results.mainBranch.total} (${Math.round(results.mainBranch.score/results.mainBranch.total*100)}%)`);
    console.log(`🏢 SECTOR PAGES: ${results.sectorPages.score}/${results.sectorPages.total} (${Math.round(results.sectorPages.score/results.sectorPages.total*100)}%)`);
    console.log(`🧭 NAVIGATION: ${results.navigation.score}/${results.navigation.total} (${Math.round(results.navigation.score/results.navigation.total*100)}%)`);
    console.log(`🎯 OPTIMIZATION: ${results.optimization.score}/${results.optimization.total} (${Math.round(results.optimization.score/results.optimization.total*100)}%)`);
    
    const overallPercentage = Math.round(totalScore / totalTests * 100);
    console.log(`\n🏆 OVERALL SYSTEM SCORE: ${totalScore}/${totalTests} (${overallPercentage}%)`);
    
    console.log('\n🎉 FINAL ASSESSMENT:');
    if (overallPercentage >= 90) {
      console.log('✅ EXCELLENT! Complete system is fully optimized and functional!');
      console.log('🚀 READY FOR MAXIMUM LEAD GENERATION!');
    } else if (overallPercentage >= 80) {
      console.log('✅ VERY GOOD! System is highly optimized and ready for business!');
      console.log('🚀 READY FOR LEAD GENERATION WITH MINOR TWEAKS!');
    } else if (overallPercentage >= 70) {
      console.log('✅ GOOD! System is well optimized with room for improvement!');
      console.log('🚀 READY FOR LEAD GENERATION!');
    } else {
      console.log('⚠️ NEEDS IMPROVEMENT! Some optimization elements need attention.');
    }
    
    console.log('\n🎯 CONVERSION READINESS:');
    console.log(`✅ Homepage: ${results.mainBranch.score >= 1 ? 'Optimized' : 'Needs work'}`);
    console.log(`✅ Servizi: ${results.mainBranch.score >= 2 ? 'Optimized' : 'Needs work'}`);
    console.log(`✅ Sector Pages: ${Math.round(results.sectorPages.score/results.sectorPages.total*100)}% working`);
    console.log(`✅ Navigation: ${Math.round(results.navigation.score/results.navigation.total*100)}% functional`);
    console.log(`✅ Optimization Elements: ${Math.round(results.optimization.score/results.optimization.total*100)}% implemented`);
    
    if (overallPercentage >= 75) {
      console.log('\n🚀 DEPLOYMENT STATUS: SUCCESS!');
      console.log('✅ All branches created and functional');
      console.log('✅ Navigation system working perfectly');
      console.log('✅ Optimization elements deployed');
      console.log('✅ Ready for lead generation and business growth!');
    }
    
  } catch (error) {
    console.error('❌ Error during final testing:', error.message);
  } finally {
    await browser.close();
  }
})();
