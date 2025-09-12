const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing optimized PMI e Startup page...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('📊 Loading PMI e Startup page...');
    await page.goto('https://it-era.it/settori/pmi-startup.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Test new hero section with keywords
    const heroH1 = await page.$eval('h1', el => el.textContent);
    console.log('🎯 Hero H1 Keywords:', 
      heroH1.includes('Digitalizzazione PMI Milano') ? '✅ Primary keyword' : '❌ Missing primary keyword',
      heroH1.includes('Software Gestionale PMI') ? '✅ Secondary keyword' : '❌ Missing secondary keyword'
    );
    
    // Test ROI highlights in hero
    const roiHighlights = await page.$$('.bg-white\\/10.backdrop-blur-sm');
    console.log('💰 ROI Highlights:', roiHighlights.length >= 3 ? `✅ ${roiHighlights.length} highlights` : '❌ Not enough');
    
    // Test specific ROI numbers
    const roiNumbers = await page.$$eval('.font-bold.text-lg', 
      elements => elements.map(el => el.textContent.trim())
    );
    console.log('📊 ROI Numbers:', roiNumbers.length > 0 ? `✅ ${roiNumbers.join(', ')}` : '❌ Not found');
    
    // Test enhanced CTA
    const enhancedCTA = await page.evaluate(() => {
      const ctas = Array.from(document.querySelectorAll('a[href*="contatti"]'));
      return ctas.some(cta => cta.textContent.includes('Analisi Digitalizzazione Gratuita'));
    });
    console.log('🔘 Enhanced CTA:', enhancedCTA ? '✅ Optimized' : '❌ Not updated');
    
    // Test urgency message
    const urgencyMessage = await page.$('.bg-gradient-to-r.from-orange-100\\/20');
    console.log('⚡ Urgency Message:', urgencyMessage ? '✅ Added' : '❌ Not found');
    
    // Test enhanced service section
    const serviceTitle = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.some(h2 => h2.textContent.includes('Software Gestionale PMI'));
    });
    console.log('🛠️ Service Section Keywords:', serviceTitle ? '✅ Optimized' : '❌ Not updated');
    
    // Test enhanced service card
    const digitalizzazioneCard = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      return h3s.some(h3 => h3.textContent.includes('Digitalizzazione PMI Milano'));
    });
    console.log('🏢 Digitalizzazione Card:', digitalizzazioneCard ? '✅ Enhanced' : '❌ Not updated');
    
    // Test ROI guarantee in service card
    const roiGuarantee = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('ROI garantito in 6 mesi') || text.includes('Aumento fatturato medio del 30%');
    });
    console.log('💎 ROI Guarantee:', roiGuarantee ? '✅ Added' : '❌ Not found');
    
    // Test case study section
    const caseStudySection = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.some(h2 => h2.textContent.includes('Case Study'));
    });
    console.log('📈 Case Study Section:', caseStudySection ? '✅ Added' : '❌ Not found');
    
    // Test case study cards
    const caseStudyCards = await page.$$('.bg-white.rounded-2xl.shadow-lg');
    console.log('📊 Case Study Cards:', caseStudyCards.length >= 2 ? `✅ ${caseStudyCards.length} case studies` : '❌ Not enough');
    
    // Test specific case study metrics
    const caseStudyMetrics = await page.$$eval('.text-2xl.font-bold', 
      elements => elements.map(el => el.textContent.trim()).filter(text => text.includes('%') || text.includes('mesi'))
    );
    console.log('📊 Case Study Metrics:', caseStudyMetrics.length > 0 ? `✅ ${caseStudyMetrics.join(', ')}` : '❌ Not found');
    
    // Test testimonials
    const testimonials = await page.$$('blockquote');
    console.log('💬 Testimonials:', testimonials.length >= 2 ? `✅ ${testimonials.length} testimonials` : '❌ Not enough');
    
    // Test keyword density
    const pageText = await page.evaluate(() => document.body.textContent.toLowerCase());
    const keywordChecks = {
      'digitalizzazione pmi': (pageText.match(/digitalizzazione pmi/g) || []).length,
      'software gestionale': (pageText.match(/software gestionale/g) || []).length,
      'milano': (pageText.match(/milano/g) || []).length,
      'roi': (pageText.match(/roi/g) || []).length,
      'fatturato': (pageText.match(/fatturato/g) || []).length
    };
    
    console.log('🔍 Keyword Density:');
    Object.entries(keywordChecks).forEach(([keyword, count]) => {
      console.log(`  ${keyword}: ${count >= 2 ? '✅' : '❌'} (${count} occurrences)`);
    });
    
    // Test mobile responsiveness
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileROI = await page.$$('.bg-white\\/10.backdrop-blur-sm');
    console.log('📱 Mobile ROI Highlights:', mobileROI.length >= 3 ? '✅ Responsive' : '❌ Not responsive');
    
    // Test conversion optimization score
    const conversionScore = {
      keywordsInHero: heroH1.includes('Digitalizzazione PMI Milano') && heroH1.includes('Software Gestionale PMI'),
      roiHighlights: roiHighlights.length >= 3,
      enhancedCTA: enhancedCTA,
      urgencyMessage: urgencyMessage !== null,
      serviceOptimized: serviceTitle && digitalizzazioneCard,
      roiGuarantee: roiGuarantee,
      caseStudies: caseStudySection && caseStudyCards.length >= 2,
      testimonials: testimonials.length >= 2,
      keywordDensity: Object.values(keywordChecks).filter(count => count >= 2).length >= 4
    };
    
    const score = Object.values(conversionScore).filter(Boolean).length;
    const totalChecks = Object.keys(conversionScore).length;
    
    console.log('🎯 PMI Conversion Optimization Score:', `${score}/${totalChecks} (${Math.round(score/totalChecks*100)}%)`);
    
    // Detailed scoring breakdown
    console.log('📊 Detailed Score Breakdown:');
    Object.entries(conversionScore).forEach(([check, passed]) => {
      console.log(`  ${check}: ${passed ? '✅' : '❌'}`);
    });
    
    if (score >= totalChecks * 0.8) {
      console.log('✅ PMI e Startup page optimization SUCCESSFUL!');
    } else {
      console.log('⚠️ PMI e Startup page optimization needs improvement');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
  }
})();
