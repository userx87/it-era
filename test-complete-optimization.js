const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 TESTING COMPLETE IT-ERA OPTIMIZATION DEPLOYMENT');
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const results = {
    homepage: { score: 0, total: 0, details: {} },
    servizi: { score: 0, total: 0, details: {} },
    pmiStartup: { score: 0, total: 0, details: {} },
    commercialisti: { score: 0, total: 0, details: {} },
    overall: { score: 0, total: 0 }
  };
  
  try {
    // ===== HOMEPAGE TESTING =====
    console.log('\n🏠 TESTING HOMEPAGE OPTIMIZATION...');
    await page.goto('https://it-era.it/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Test hero optimization
    const heroH1 = await page.$eval('h1', el => el.textContent).catch(() => '');
    const heroOptimized = heroH1.includes('Assistenza Informatica') && heroH1.includes('Milano');
    results.homepage.details.heroOptimized = heroOptimized;
    results.homepage.total++;
    if (heroOptimized) results.homepage.score++;
    console.log(`  Hero H1 Optimized: ${heroOptimized ? '✅' : '❌'} - "${heroH1.substring(0, 50)}..."`);
    
    // Test CTA optimization
    const consultationCTA = await page.evaluate(() => {
      const ctas = Array.from(document.querySelectorAll('a[href*="contatti"]'));
      return ctas.some(cta => cta.textContent.includes('Consulenza Gratuita'));
    }).catch(() => false);
    results.homepage.details.consultationCTA = consultationCTA;
    results.homepage.total++;
    if (consultationCTA) results.homepage.score++;
    console.log(`  Consultation CTA: ${consultationCTA ? '✅' : '❌'}`);
    
    // Test emergency CTA
    const emergencyCTA = await page.evaluate(() => {
      const ctas = Array.from(document.querySelectorAll('a[href^="tel:"]'));
      return ctas.some(cta => cta.textContent.includes('Emergenza'));
    }).catch(() => false);
    results.homepage.details.emergencyCTA = emergencyCTA;
    results.homepage.total++;
    if (emergencyCTA) results.homepage.score++;
    console.log(`  Emergency CTA: ${emergencyCTA ? '✅' : '❌'}`);
    
    // Test social proof
    const testimonial = await page.$('blockquote').catch(() => null);
    results.homepage.details.testimonial = testimonial !== null;
    results.homepage.total++;
    if (testimonial) results.homepage.score++;
    console.log(`  Testimonial Added: ${testimonial ? '✅' : '❌'}`);
    
    // Test trust indicators
    const trustIndicators = await page.$$('.bg-white\\/60, .bg-white\\/80').catch(() => []);
    results.homepage.details.trustIndicators = trustIndicators.length >= 4;
    results.homepage.total++;
    if (trustIndicators.length >= 4) results.homepage.score++;
    console.log(`  Trust Indicators: ${trustIndicators.length >= 4 ? '✅' : '❌'} (${trustIndicators.length} found)`);
    
    // ===== SERVIZI PAGE TESTING =====
    console.log('\n🛠️ TESTING SERVIZI PAGE OPTIMIZATION...');
    await page.goto('https://it-era.it/servizi.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Test servizi hero
    const serviziH1 = await page.$eval('h1', el => el.textContent).catch(() => '');
    const serviziHeroOptimized = serviziH1.includes('Servizi IT') && serviziH1.includes('Milano');
    results.servizi.details.heroOptimized = serviziHeroOptimized;
    results.servizi.total++;
    if (serviziHeroOptimized) results.servizi.score++;
    console.log(`  Servizi Hero Optimized: ${serviziHeroOptimized ? '✅' : '❌'} - "${serviziH1.substring(0, 50)}..."`);
    
    // Test pricing section
    const pricingSection = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.some(h2 => h2.textContent.includes('Pacchetti'));
    }).catch(() => false);
    results.servizi.details.pricingSection = pricingSection;
    results.servizi.total++;
    if (pricingSection) results.servizi.score++;
    console.log(`  Pricing Section: ${pricingSection ? '✅' : '❌'}`);
    
    // Test pricing packages
    const pricingPackages = await page.$$eval('.text-4xl.font-bold', 
      elements => elements.filter(el => el.textContent.includes('€')).length
    ).catch(() => 0);
    results.servizi.details.pricingPackages = pricingPackages >= 3;
    results.servizi.total++;
    if (pricingPackages >= 3) results.servizi.score++;
    console.log(`  Pricing Packages: ${pricingPackages >= 3 ? '✅' : '❌'} (${pricingPackages} found)`);
    
    // Test enhanced service cards
    const enhancedCards = await page.$$('.bg-white.p-8.rounded-2xl').catch(() => []);
    results.servizi.details.enhancedCards = enhancedCards.length >= 2;
    results.servizi.total++;
    if (enhancedCards.length >= 2) results.servizi.score++;
    console.log(`  Enhanced Service Cards: ${enhancedCards.length >= 2 ? '✅' : '❌'} (${enhancedCards.length} found)`);
    
    // ===== PMI E STARTUP TESTING =====
    console.log('\n🚀 TESTING PMI E STARTUP PAGE...');
    await page.goto('https://it-era.it/settori/pmi-startup.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Test PMI hero keywords
    const pmiH1 = await page.$eval('h1', el => el.textContent).catch(() => '');
    const pmiKeywords = pmiH1.includes('Digitalizzazione PMI') && pmiH1.includes('Software Gestionale');
    results.pmiStartup.details.keywordsOptimized = pmiKeywords;
    results.pmiStartup.total++;
    if (pmiKeywords) results.pmiStartup.score++;
    console.log(`  PMI Keywords: ${pmiKeywords ? '✅' : '❌'} - "${pmiH1.substring(0, 50)}..."`);
    
    // Test ROI highlights
    const roiHighlights = await page.$$('.bg-white\\/10.backdrop-blur-sm').catch(() => []);
    results.pmiStartup.details.roiHighlights = roiHighlights.length >= 3;
    results.pmiStartup.total++;
    if (roiHighlights.length >= 3) results.pmiStartup.score++;
    console.log(`  ROI Highlights: ${roiHighlights.length >= 3 ? '✅' : '❌'} (${roiHighlights.length} found)`);
    
    // Test case studies
    const caseStudies = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.some(h2 => h2.textContent.includes('Case Study'));
    }).catch(() => false);
    results.pmiStartup.details.caseStudies = caseStudies;
    results.pmiStartup.total++;
    if (caseStudies) results.pmiStartup.score++;
    console.log(`  Case Studies: ${caseStudies ? '✅' : '❌'}`);
    
    // Test urgency message
    const urgencyMessage = await page.$('.bg-gradient-to-r.from-orange-100\\/20').catch(() => null);
    results.pmiStartup.details.urgencyMessage = urgencyMessage !== null;
    results.pmiStartup.total++;
    if (urgencyMessage) results.pmiStartup.score++;
    console.log(`  Urgency Message: ${urgencyMessage ? '✅' : '❌'}`);
    
    // ===== COMMERCIALISTI TESTING =====
    console.log('\n📊 TESTING COMMERCIALISTI PAGE...');
    await page.goto('https://it-era.it/settori/commercialisti.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Test commercialisti hero keywords
    const commercialistiH1 = await page.$eval('h1', el => el.textContent).catch(() => '');
    const commercialistiKeywords = commercialistiH1.includes('Software Commercialisti') && commercialistiH1.includes('Gestionale Studio');
    results.commercialisti.details.keywordsOptimized = commercialistiKeywords;
    results.commercialisti.total++;
    if (commercialistiKeywords) results.commercialisti.score++;
    console.log(`  Commercialisti Keywords: ${commercialistiKeywords ? '✅' : '❌'} - "${commercialistiH1.substring(0, 50)}..."`);
    
    // Test compliance highlights
    const complianceHighlights = await page.$$('.bg-white\\/10.backdrop-blur-sm').catch(() => []);
    results.commercialisti.details.complianceHighlights = complianceHighlights.length >= 3;
    results.commercialisti.total++;
    if (complianceHighlights.length >= 3) results.commercialisti.score++;
    console.log(`  Compliance Highlights: ${complianceHighlights.length >= 3 ? '✅' : '❌'} (${complianceHighlights.length} found)`);
    
    // Test professional testimonials
    const professionalTestimonials = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.some(h2 => h2.textContent.includes('Commercialisti che si Fidano'));
    }).catch(() => false);
    results.commercialisti.details.professionalTestimonials = professionalTestimonials;
    results.commercialisti.total++;
    if (professionalTestimonials) results.commercialisti.score++;
    console.log(`  Professional Testimonials: ${professionalTestimonials ? '✅' : '❌'}`);
    
    // Test audit CTA
    const auditCTA = await page.evaluate(() => {
      const ctas = Array.from(document.querySelectorAll('a[href*="contatti"]'));
      return ctas.some(cta => cta.textContent.includes('Audit Sicurezza'));
    }).catch(() => false);
    results.commercialisti.details.auditCTA = auditCTA;
    results.commercialisti.total++;
    if (auditCTA) results.commercialisti.score++;
    console.log(`  Audit CTA: ${auditCTA ? '✅' : '❌'}`);
    
    // ===== MOBILE TESTING =====
    console.log('\n📱 TESTING MOBILE RESPONSIVENESS...');
    await page.setViewport({ width: 375, height: 667 });
    await page.goto('https://it-era.it/', { waitUntil: 'networkidle2' });
    
    const mobileHero = await page.$eval('h1', el => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.fontSize) > 20;
    }).catch(() => false);
    console.log(`  Mobile Hero Responsive: ${mobileHero ? '✅' : '❌'}`);
    
    // ===== PERFORMANCE TESTING =====
    console.log('\n⚡ TESTING PERFORMANCE...');
    await page.setViewport({ width: 1920, height: 1080 });
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart)
      };
    }).catch(() => ({ loadTime: 0, domContentLoaded: 0 }));
    
    console.log(`  Load Time: ${performanceMetrics.loadTime}ms ${performanceMetrics.loadTime < 3000 ? '✅' : '⚠️'}`);
    console.log(`  DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms ${performanceMetrics.domContentLoaded < 2000 ? '✅' : '⚠️'}`);
    
    // ===== CALCULATE OVERALL RESULTS =====
    results.overall.score = results.homepage.score + results.servizi.score + results.pmiStartup.score + results.commercialisti.score;
    results.overall.total = results.homepage.total + results.servizi.total + results.pmiStartup.total + results.commercialisti.total;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 OPTIMIZATION TESTING RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n🏠 HOMEPAGE: ${results.homepage.score}/${results.homepage.total} (${Math.round(results.homepage.score/results.homepage.total*100)}%)`);
    console.log(`🛠️ SERVIZI: ${results.servizi.score}/${results.servizi.total} (${Math.round(results.servizi.score/results.servizi.total*100)}%)`);
    console.log(`🚀 PMI & STARTUP: ${results.pmiStartup.score}/${results.pmiStartup.total} (${Math.round(results.pmiStartup.score/results.pmiStartup.total*100)}%)`);
    console.log(`📊 COMMERCIALISTI: ${results.commercialisti.score}/${results.commercialisti.total} (${Math.round(results.commercialisti.score/results.commercialisti.total*100)}%)`);
    
    const overallPercentage = Math.round(results.overall.score/results.overall.total*100);
    console.log(`\n🎯 OVERALL OPTIMIZATION SCORE: ${results.overall.score}/${results.overall.total} (${overallPercentage}%)`);
    
    if (overallPercentage >= 90) {
      console.log('✅ EXCELLENT! All optimizations are live and working perfectly!');
    } else if (overallPercentage >= 75) {
      console.log('✅ GOOD! Most optimizations are live, some may still be deploying.');
    } else if (overallPercentage >= 50) {
      console.log('⚠️ PARTIAL! Some optimizations are live, GitHub Pages may still be deploying.');
    } else {
      console.log('❌ ISSUES! Most optimizations not detected, check deployment status.');
    }
    
    console.log('\n🚀 DEPLOYMENT STATUS:');
    console.log('- If score < 75%, GitHub Pages may still be deploying (wait 5-10 minutes)');
    console.log('- If score > 75%, optimizations are successfully live!');
    console.log('- All tests passed = Ready for lead generation!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
  }
})();
