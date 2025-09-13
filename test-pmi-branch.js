const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 TESTING PMI E STARTUP BRANCH OPTIMIZATION');
  console.log('=' .repeat(50));
  
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
    
    // Test optimized hero section
    const heroH1 = await page.$eval('h1', el => el.textContent);
    const hasKeywords = heroH1.includes('Digitalizzazione PMI Milano') && heroH1.includes('Software Gestionale PMI');
    console.log(`🎯 Hero Keywords: ${hasKeywords ? '✅' : '❌'}`);
    console.log(`   H1: "${heroH1}"`);
    
    // Test ROI highlights
    const roiHighlights = await page.$$('.bg-white\\/10.backdrop-blur-sm');
    console.log(`💰 ROI Highlights: ${roiHighlights.length >= 3 ? '✅' : '❌'} (${roiHighlights.length} found)`);
    
    // Test case studies
    const caseStudies = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('TechModa') && text.includes('InnovaStudio');
    });
    console.log(`📈 Case Studies: ${caseStudies ? '✅' : '❌'}`);
    
    // Test urgency message
    const urgencyMessage = await page.$('.bg-gradient-to-r.from-orange-100\\/20');
    console.log(`⚡ Urgency Message: ${urgencyMessage ? '✅' : '❌'}`);
    
    // Test enhanced CTA
    const enhancedCTA = await page.evaluate(() => {
      const ctas = Array.from(document.querySelectorAll('a[href*="contatti"]'));
      return ctas.some(cta => cta.textContent.includes('Analisi Digitalizzazione'));
    });
    console.log(`🔘 Enhanced CTA: ${enhancedCTA ? '✅' : '❌'}`);
    
    // Test service section optimization
    const serviceTitle = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.some(h2 => h2.textContent.includes('Software Gestionale PMI'));
    });
    console.log(`🛠️ Service Section: ${serviceTitle ? '✅' : '❌'}`);
    
    // Test ROI guarantee
    const roiGuarantee = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Aumento fatturato medio del 30%') || text.includes('ROI garantito');
    });
    console.log(`💎 ROI Guarantee: ${roiGuarantee ? '✅' : '❌'}`);
    
    // Calculate score
    const checks = [hasKeywords, roiHighlights.length >= 3, caseStudies, urgencyMessage !== null, enhancedCTA, serviceTitle, roiGuarantee];
    const score = checks.filter(Boolean).length;
    const percentage = Math.round(score / checks.length * 100);
    
    console.log(`\n🎯 PMI BRANCH OPTIMIZATION SCORE: ${score}/${checks.length} (${percentage}%)`);
    
    if (percentage >= 90) {
      console.log('✅ EXCELLENT! PMI branch fully optimized and working!');
    } else if (percentage >= 75) {
      console.log('✅ GOOD! PMI branch mostly optimized!');
    } else {
      console.log('⚠️ NEEDS WORK! PMI branch optimization incomplete.');
    }
    
  } catch (error) {
    console.error('❌ Error testing PMI branch:', error.message);
  } finally {
    await browser.close();
  }
})();
