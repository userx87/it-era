const puppeteer = require('puppeteer');

(async () => {
  console.log('📊 TESTING COMMERCIALISTI BRANCH OPTIMIZATION');
  console.log('=' .repeat(50));
  
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
    
    // Test optimized hero section
    const heroH1 = await page.$eval('h1', el => el.textContent);
    const hasKeywords = heroH1.includes('Software Commercialisti Milano') && heroH1.includes('Gestionale Studio Fiscale');
    console.log(`🎯 Hero Keywords: ${hasKeywords ? '✅' : '❌'}`);
    console.log(`   H1: "${heroH1}"`);
    
    // Test compliance highlights
    const complianceHighlights = await page.$$('.bg-white\\/10.backdrop-blur-sm');
    console.log(`🔒 Compliance Highlights: ${complianceHighlights.length >= 3 ? '✅' : '❌'} (${complianceHighlights.length} found)`);
    
    // Test professional testimonials
    const testimonials = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Studio Fiscale Rossi') && text.includes('CAF Bianchi');
    });
    console.log(`💬 Professional Testimonials: ${testimonials ? '✅' : '❌'}`);
    
    // Test trust message
    const trustMessage = await page.$('.bg-gradient-to-r.from-emerald-100\\/20');
    console.log(`🛡️ Trust Message: ${trustMessage ? '✅' : '❌'}`);
    
    // Test audit CTA
    const auditCTA = await page.evaluate(() => {
      const ctas = Array.from(document.querySelectorAll('a[href*="contatti"]'));
      return ctas.some(cta => cta.textContent.includes('Audit Sicurezza'));
    });
    console.log(`🔘 Audit CTA: ${auditCTA ? '✅' : '❌'}`);
    
    // Test service section optimization
    const serviceTitle = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.some(h2 => h2.textContent.includes('Software Commercialisti Milano'));
    });
    console.log(`🛠️ Service Section: ${serviceTitle ? '✅' : '❌'}`);
    
    // Test efficiency guarantee
    const efficiencyGuarantee = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Riduzione 70% tempo gestione') || text.includes('100% sicurezza');
    });
    console.log(`💎 Efficiency Guarantee: ${efficiencyGuarantee ? '✅' : '❌'}`);
    
    // Calculate score
    const checks = [hasKeywords, complianceHighlights.length >= 3, testimonials, trustMessage !== null, auditCTA, serviceTitle, efficiencyGuarantee];
    const score = checks.filter(Boolean).length;
    const percentage = Math.round(score / checks.length * 100);
    
    console.log(`\n🎯 COMMERCIALISTI BRANCH SCORE: ${score}/${checks.length} (${percentage}%)`);
    
    if (percentage >= 90) {
      console.log('✅ EXCELLENT! Commercialisti branch fully optimized!');
    } else if (percentage >= 75) {
      console.log('✅ GOOD! Commercialisti branch mostly optimized!');
    } else {
      console.log('⚠️ NEEDS WORK! Commercialisti branch optimization incomplete.');
    }
    
  } catch (error) {
    console.error('❌ Error testing Commercialisti branch:', error.message);
  } finally {
    await browser.close();
  }
})();
