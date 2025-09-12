const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing optimized Commercialisti page...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('📊 Loading Commercialisti page...');
    await page.goto('https://it-era.it/settori/commercialisti.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Test new hero section with keywords
    const heroH1 = await page.$eval('h1', el => el.textContent);
    console.log('🎯 Hero H1 Keywords:', 
      heroH1.includes('Software Commercialisti Milano') ? '✅ Primary keyword' : '❌ Missing primary keyword',
      heroH1.includes('Gestionale Studio Fiscale') ? '✅ Secondary keyword' : '❌ Missing secondary keyword'
    );
    
    // Test compliance highlights in hero
    const complianceHighlights = await page.$$('.bg-white\\/10.backdrop-blur-sm');
    console.log('🔒 Compliance Highlights:', complianceHighlights.length >= 3 ? `✅ ${complianceHighlights.length} highlights` : '❌ Not enough');
    
    // Test specific compliance indicators
    const complianceIndicators = await page.$$eval('.font-bold.text-lg', 
      elements => elements.map(el => el.textContent.trim())
    );
    console.log('📊 Compliance Indicators:', complianceIndicators.length > 0 ? `✅ ${complianceIndicators.join(', ')}` : '❌ Not found');
    
    // Test enhanced CTA
    const auditCTA = await page.evaluate(() => {
      const ctas = Array.from(document.querySelectorAll('a[href*="contatti"]'));
      return ctas.some(cta => cta.textContent.includes('Audit Sicurezza Gratuito'));
    });
    console.log('🔘 Audit CTA:', auditCTA ? '✅ Optimized' : '❌ Not updated');
    
    // Test trust message
    const trustMessage = await page.$('.bg-gradient-to-r.from-emerald-100\\/20');
    console.log('🛡️ Trust Message:', trustMessage ? '✅ Added' : '❌ Not found');
    
    // Test enhanced service section
    const serviceTitle = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.some(h2 => h2.textContent.includes('Software Commercialisti Milano'));
    });
    console.log('🛠️ Service Section Keywords:', serviceTitle ? '✅ Optimized' : '❌ Not updated');
    
    // Test enhanced service card
    const softwareCard = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      return h3s.some(h3 => h3.textContent.includes('Software Commercialisti Milano'));
    });
    console.log('💼 Software Card:', softwareCard ? '✅ Enhanced' : '❌ Not updated');
    
    // Test efficiency guarantee in service card
    const efficiencyGuarantee = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Riduzione 70% tempo gestione') || text.includes('gestionale studio fiscale');
    });
    console.log('💎 Efficiency Guarantee:', efficiencyGuarantee ? '✅ Added' : '❌ Not found');
    
    // Test testimonial section
    const testimonialSection = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.some(h2 => h2.textContent.includes('Commercialisti che si Fidano'));
    });
    console.log('💬 Testimonial Section:', testimonialSection ? '✅ Added' : '❌ Not found');
    
    // Test testimonial cards
    const testimonialCards = await page.$$('.bg-white.rounded-2xl.shadow-lg');
    console.log('📊 Testimonial Cards:', testimonialCards.length >= 2 ? `✅ ${testimonialCards.length} testimonials` : '❌ Not enough');
    
    // Test specific testimonial content
    const testimonialContent = await page.evaluate(() => {
      const blockquotes = Array.from(document.querySelectorAll('blockquote'));
      return blockquotes.some(quote => 
        quote.textContent.includes('software gestionale') || 
        quote.textContent.includes('sicurezza dei dati')
      );
    });
    console.log('💭 Testimonial Content:', testimonialContent ? '✅ Relevant content' : '❌ Generic content');
    
    // Test star ratings
    const starRatings = await page.$$('.text-yellow-400');
    console.log('⭐ Star Ratings:', starRatings.length >= 2 ? `✅ ${starRatings.length} ratings` : '❌ Not enough');
    
    // Test keyword density
    const pageText = await page.evaluate(() => document.body.textContent.toLowerCase());
    const keywordChecks = {
      'software commercialisti': (pageText.match(/software commercialisti/g) || []).length,
      'gestionale studio fiscale': (pageText.match(/gestionale studio fiscale/g) || []).length,
      'sicurezza dati fiscali': (pageText.match(/sicurezza dati fiscali/g) || []).length,
      'compliance': (pageText.match(/compliance/g) || []).length,
      'gdpr': (pageText.match(/gdpr/g) || []).length
    };
    
    console.log('🔍 Keyword Density:');
    Object.entries(keywordChecks).forEach(([keyword, count]) => {
      console.log(`  ${keyword}: ${count >= 2 ? '✅' : '❌'} (${count} occurrences)`);
    });
    
    // Test mobile responsiveness
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileCompliance = await page.$$('.bg-white\\/10.backdrop-blur-sm');
    console.log('📱 Mobile Compliance Highlights:', mobileCompliance.length >= 3 ? '✅ Responsive' : '❌ Not responsive');
    
    // Test conversion optimization score
    const conversionScore = {
      keywordsInHero: heroH1.includes('Software Commercialisti Milano') && heroH1.includes('Gestionale Studio Fiscale'),
      complianceHighlights: complianceHighlights.length >= 3,
      auditCTA: auditCTA,
      trustMessage: trustMessage !== null,
      serviceOptimized: serviceTitle && softwareCard,
      efficiencyGuarantee: efficiencyGuarantee,
      testimonials: testimonialSection && testimonialCards.length >= 2,
      testimonialContent: testimonialContent,
      keywordDensity: Object.values(keywordChecks).filter(count => count >= 2).length >= 4
    };
    
    const score = Object.values(conversionScore).filter(Boolean).length;
    const totalChecks = Object.keys(conversionScore).length;
    
    console.log('🎯 Commercialisti Conversion Score:', `${score}/${totalChecks} (${Math.round(score/totalChecks*100)}%)`);
    
    // Detailed scoring breakdown
    console.log('📊 Detailed Score Breakdown:');
    Object.entries(conversionScore).forEach(([check, passed]) => {
      console.log(`  ${check}: ${passed ? '✅' : '❌'}`);
    });
    
    if (score >= totalChecks * 0.8) {
      console.log('✅ Commercialisti page optimization SUCCESSFUL!');
    } else {
      console.log('⚠️ Commercialisti page optimization needs improvement');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
  }
})();
