const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing optimized IT-ERA servizi page...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('📊 Loading optimized servizi page...');
    await page.goto('https://it-era.it/servizi.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Test new hero section
    const heroH1 = await page.$eval('h1', el => el.textContent);
    console.log('🎯 New Hero H1:', heroH1.includes('Servizi IT Completi') ? '✅ Optimized' : '❌ Not updated');
    
    // Test keyword optimization in hero
    const heroText = await page.$eval('section', el => el.textContent);
    const keywordChecks = {
      'assistenza informatica aziende': heroText.toLowerCase().includes('assistenza informatica aziende'),
      'milano': heroText.toLowerCase().includes('milano'),
      'intervento in 2 ore': heroText.toLowerCase().includes('intervento in 2 ore'),
      'consulenza gratuita': heroText.toLowerCase().includes('consulenza gratuita')
    };
    
    console.log('🔍 Hero Keyword Optimization:');
    Object.entries(keywordChecks).forEach(([keyword, found]) => {
      console.log(`  ${keyword}: ${found ? '✅' : '❌'}`);
    });
    
    // Test enhanced service cards
    const serviceCards = await page.$$('.bg-white.p-8.rounded-2xl');
    console.log('💼 Enhanced Service Cards:', serviceCards.length >= 2 ? `✅ ${serviceCards.length} cards` : '❌ Not enough');
    
    // Test specific service improvements
    const assistenzaCard = await page.$eval('h3', el => 
      el.textContent.includes('Assistenza Informatica Aziende')
    );
    console.log('🔧 Assistenza Card Optimized:', assistenzaCard ? '✅ Enhanced' : '❌ Not updated');
    
    const sicurezzaCard = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      return headings.some(h => h.textContent.includes('Sicurezza Informatica Aziende'));
    });
    console.log('🔒 Sicurezza Card Optimized:', sicurezzaCard ? '✅ Enhanced' : '❌ Not updated');
    
    // Test pricing section
    const pricingSection = await page.$('section:has(h2:contains("Pacchetti Servizi"))');
    console.log('💰 Pricing Section:', pricingSection ? '✅ Added' : '❌ Not found');
    
    // Test pricing packages
    const pricingCards = await page.$$('.bg-white.rounded-2xl.shadow-lg');
    console.log('📦 Pricing Packages:', pricingCards.length >= 3 ? `✅ ${pricingCards.length} packages` : '❌ Not enough');
    
    // Test specific pricing elements
    const prices = await page.$$eval('.text-4xl.font-bold', 
      elements => elements.map(el => el.textContent.trim())
    );
    console.log('💵 Package Prices:', prices.length > 0 ? `✅ ${prices.join(', ')}` : '❌ Not found');
    
    // Test CTA buttons in services
    const ctaButtons = await page.$$eval('a[href="/contatti.html"]', 
      buttons => buttons.map(btn => btn.textContent.trim())
    );
    console.log('🔘 CTA Buttons:', ctaButtons.length >= 5 ? `✅ ${ctaButtons.length} CTAs` : '❌ Not enough');
    
    // Test emergency contact buttons
    const emergencyButtons = await page.$$eval('a[href^="tel:"]', 
      buttons => buttons.map(btn => btn.textContent.trim())
    );
    console.log('📞 Emergency Buttons:', emergencyButtons.length >= 3 ? `✅ ${emergencyButtons.length} emergency CTAs` : '❌ Not enough');
    
    // Test trust indicators in hero
    const trustIndicators = await page.$$('.bg-white\\/10.backdrop-blur-sm');
    console.log('🏆 Trust Indicators:', trustIndicators.length >= 3 ? `✅ ${trustIndicators.length} indicators` : '❌ Not enough');
    
    // Test benefit highlights
    const benefitHighlights = await page.$$('.bg-gradient-to-r.from-blue-50, .bg-gradient-to-r.from-red-50');
    console.log('💎 Benefit Highlights:', benefitHighlights.length >= 2 ? `✅ ${benefitHighlights.length} highlights` : '❌ Not enough');
    
    // Test mobile responsiveness
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileHero = await page.$eval('h1', el => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.fontSize) > 20; // Should be responsive
    });
    console.log('📱 Mobile Responsive:', mobileHero ? '✅ Responsive' : '❌ Not responsive');
    
    // Test conversion optimization score
    const conversionScore = {
      heroOptimized: heroH1.includes('Servizi IT Completi'),
      keywordsIntegrated: Object.values(keywordChecks).filter(Boolean).length >= 3,
      serviceCardsEnhanced: serviceCards.length >= 2,
      pricingAdded: pricingSection !== null,
      ctaOptimized: ctaButtons.length >= 5,
      emergencyContact: emergencyButtons.length >= 3,
      trustIndicators: trustIndicators.length >= 3,
      benefitHighlights: benefitHighlights.length >= 2
    };
    
    const score = Object.values(conversionScore).filter(Boolean).length;
    const totalChecks = Object.keys(conversionScore).length;
    
    console.log('🎯 Conversion Optimization Score:', `${score}/${totalChecks} (${Math.round(score/totalChecks*100)}%)`);
    
    // Detailed scoring breakdown
    console.log('📊 Detailed Score Breakdown:');
    Object.entries(conversionScore).forEach(([check, passed]) => {
      console.log(`  ${check}: ${passed ? '✅' : '❌'}`);
    });
    
    if (score >= totalChecks * 0.8) {
      console.log('✅ Servizi page optimization SUCCESSFUL!');
    } else {
      console.log('⚠️ Servizi page optimization needs improvement');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
  }
})();
