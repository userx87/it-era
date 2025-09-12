const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing optimized IT-ERA homepage...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('📊 Loading optimized homepage...');
    await page.goto('https://it-era.it/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Test new hero section
    const heroH1 = await page.$eval('h1', el => el.textContent);
    console.log('🎯 New Hero H1:', heroH1.includes('Assistenza Informatica') ? '✅ Optimized' : '❌ Not updated');
    
    // Test new value proposition points
    const valueProps = await page.$$eval('.bg-white\\/80.backdrop-blur-sm', 
      elements => elements.length
    );
    console.log('💎 Value Proposition Points:', valueProps > 0 ? `✅ ${valueProps} found` : '❌ Not found');
    
    // Test new CTA buttons
    const consultationCTA = await page.$eval('a[href="/contatti.html"]', 
      el => el.textContent.includes('Consulenza Gratuita')
    );
    console.log('🔘 Consultation CTA:', consultationCTA ? '✅ Optimized' : '❌ Not updated');
    
    const emergencyCTA = await page.$eval('a[href^="tel:"]', 
      el => el.textContent.includes('Emergenza 24/7')
    );
    console.log('📞 Emergency CTA:', emergencyCTA ? '✅ Optimized' : '❌ Not updated');
    
    // Test urgency message
    const urgencyMessage = await page.$('.bg-gradient-to-r.from-orange-100');
    console.log('⚡ Urgency Message:', urgencyMessage ? '✅ Added' : '❌ Not found');
    
    // Test new trust indicators
    const trustIndicators = await page.$$eval('.bg-white\\/60.backdrop-blur-sm.rounded-2xl', 
      elements => elements.length
    );
    console.log('🏆 Trust Indicators:', trustIndicators >= 4 ? `✅ ${trustIndicators} indicators` : '❌ Not enough');
    
    // Test testimonial section
    const testimonial = await page.$('blockquote');
    console.log('💬 Customer Testimonial:', testimonial ? '✅ Added' : '❌ Not found');
    
    // Test specific numbers in trust indicators
    const numbers = await page.$$eval('.font-bold.text-2xl', 
      elements => elements.map(el => el.textContent.trim())
    );
    console.log('📊 Trust Numbers:', numbers.length > 0 ? `✅ ${numbers.join(', ')}` : '❌ Not found');
    
    // Test keyword optimization
    const pageText = await page.evaluate(() => document.body.textContent);
    const keywordChecks = {
      'assistenza informatica': pageText.toLowerCase().includes('assistenza informatica'),
      'milano': pageText.toLowerCase().includes('milano'),
      'supporto it': pageText.toLowerCase().includes('supporto it'),
      'consulenza gratuita': pageText.toLowerCase().includes('consulenza gratuita')
    };
    
    console.log('🔍 Keyword Optimization:');
    Object.entries(keywordChecks).forEach(([keyword, found]) => {
      console.log(`  ${keyword}: ${found ? '✅' : '❌'}`);
    });
    
    // Test mobile responsiveness
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileHero = await page.$eval('h1', el => {
      const style = window.getComputedStyle(el);
      return style.fontSize;
    });
    console.log('📱 Mobile Hero Font Size:', mobileHero);
    
    // Test conversion elements
    const conversionScore = {
      heroOptimized: heroH1.includes('Assistenza Informatica'),
      ctaOptimized: consultationCTA && emergencyCTA,
      socialProof: testimonial !== null,
      urgency: urgencyMessage !== null,
      trustIndicators: trustIndicators >= 4,
      keywords: Object.values(keywordChecks).filter(Boolean).length >= 3
    };
    
    const score = Object.values(conversionScore).filter(Boolean).length;
    const totalChecks = Object.keys(conversionScore).length;
    
    console.log('🎯 Conversion Optimization Score:', `${score}/${totalChecks} (${Math.round(score/totalChecks*100)}%)`);
    
    if (score >= totalChecks * 0.8) {
      console.log('✅ Homepage optimization SUCCESSFUL!');
    } else {
      console.log('⚠️ Homepage optimization needs improvement');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
  }
})();
