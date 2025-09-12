const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Starting Puppeteer analysis of IT-ERA homepage...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('📊 Loading homepage...');
    await page.goto('https://it-era.it/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Test basic page elements
    const title = await page.title();
    console.log('📄 Page Title:', title);
    
    // Check for key conversion elements
    const heroSection = await page.$('h1');
    const heroText = heroSection ? await page.evaluate(el => el.textContent, heroSection) : 'Not found';
    console.log('🎯 Hero H1:', heroText);
    
    // Check for CTA buttons
    const ctaButtons = await page.$$eval('a[href*="contatti"], .btn-primary', 
      buttons => buttons.map(btn => ({
        text: btn.textContent.trim(),
        href: btn.href || btn.getAttribute('href')
      }))
    );
    console.log('🔘 CTA Buttons found:', ctaButtons.length);
    ctaButtons.forEach((btn, i) => console.log(`  ${i+1}. "${btn.text}" -> ${btn.href}`));
    
    // Check for phone numbers
    const phoneLinks = await page.$$eval('a[href^="tel:"]', 
      links => links.map(link => ({
        text: link.textContent.trim(),
        href: link.href
      }))
    );
    console.log('📞 Phone Links found:', phoneLinks.length);
    phoneLinks.forEach((phone, i) => console.log(`  ${i+1}. "${phone.text}" -> ${phone.href}`));
    
    // Check page performance
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
      };
    });
    console.log('⚡ Performance Metrics:');
    console.log(`  Load Time: ${performanceMetrics.loadTime}ms`);
    console.log(`  DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`  First Paint: ${Math.round(performanceMetrics.firstPaint)}ms`);
    
    // Check for social proof elements
    const socialProof = await page.$$eval('*', elements => {
      const testimonialKeywords = ['testimonial', 'cliente', 'recensione', 'feedback'];
      const certificationKeywords = ['certificazione', 'partner', 'accreditato'];
      
      let testimonials = 0;
      let certifications = 0;
      
      elements.forEach(el => {
        const text = el.textContent?.toLowerCase() || '';
        const className = el.className?.toLowerCase() || '';
        
        if (testimonialKeywords.some(keyword => text.includes(keyword) || className.includes(keyword))) {
          testimonials++;
        }
        if (certificationKeywords.some(keyword => text.includes(keyword) || className.includes(keyword))) {
          certifications++;
        }
      });
      
      return { testimonials, certifications };
    });
    console.log('🏆 Social Proof Elements:');
    console.log(`  Testimonials: ${socialProof.testimonials}`);
    console.log(`  Certifications: ${socialProof.certifications}`);
    
    // Check mobile responsiveness
    await page.setViewport({ width: 375, height: 667 }); // iPhone size
    await page.waitForTimeout(1000);
    
    const mobileMenu = await page.$('#mobile-menu-button');
    console.log('📱 Mobile menu button:', mobileMenu ? 'Found' : 'Not found');
    
    console.log('✅ Homepage analysis completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
  } finally {
    await browser.close();
  }
})();
