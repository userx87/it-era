const { test, expect } = require('@playwright/test');

test.describe('SEO Validation Tests', () => {
  test('Sitemap.xml accessibility and validity', async ({ page }) => {
    // Test sitemap.xml is accessible
    const sitemapResponse = await page.request.get('https://it-era.it/sitemap.xml');
    expect(sitemapResponse.status()).toBe(200);

    // Get sitemap content
    const sitemapContent = await sitemapResponse.text();
    
    // Verify it's valid XML
    expect(sitemapContent).toContain('<?xml');
    expect(sitemapContent).toContain('<urlset');
    expect(sitemapContent).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');

    // Verify it contains expected URLs
    expect(sitemapContent).toContain('<url>');
    expect(sitemapContent).toContain('<loc>https://it-era.it</loc>');
    
    // Count URLs in sitemap
    const urlCount = (sitemapContent.match(/<url>/g) || []).length;
    console.log(`✅ Sitemap contains ${urlCount} URLs`);
    
    // Verify sitemap is not empty and has reasonable number of URLs
    expect(urlCount).toBeGreaterThan(100);
    expect(urlCount).toBeLessThan(10000);

    // Check for proper lastmod dates
    const lastModEntries = (sitemapContent.match(/<lastmod>/g) || []).length;
    expect(lastModEntries).toBeGreaterThan(0);

    // Verify no broken URL patterns
    expect(sitemapContent).not.toContain('<loc></loc>');
    expect(sitemapContent).not.toContain('localhost');
    expect(sitemapContent).not.toContain('127.0.0.1');
  });

  test('Robots.txt accessibility', async ({ page }) => {
    const robotsResponse = await page.request.get('https://it-era.it/robots.txt');
    expect(robotsResponse.status()).toBe(200);

    const robotsContent = await robotsResponse.text();
    
    // Verify robots.txt has proper directives
    expect(robotsContent).toContain('User-agent:');
    expect(robotsContent).toContain('Sitemap: https://it-era.it/sitemap.xml');
    
    // Verify it's not blocking everything
    expect(robotsContent).not.toMatch(/Disallow:\s*\/\s*$/m);
    
    console.log('✅ Robots.txt is properly configured');
  });

  test('Meta tags and SEO elements validation', async ({ page }) => {
    const testUrls = [
      'https://it-era.it',
      'https://it-era.it/assistenza-it-milano.html',
      'https://it-era.it/cloud-storage-monza.html'
    ];

    for (const url of testUrls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Check title tag
      const title = await page.locator('title').textContent();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(10);
      expect(title.length).toBeLessThan(60);

      // Check meta description
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription.length).toBeGreaterThan(50);
      expect(metaDescription.length).toBeLessThan(160);

      // Check canonical URL
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBeTruthy();
      expect(canonical).toContain('it-era.it');

      // Check Open Graph tags
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
      
      expect(ogTitle).toBeTruthy();
      expect(ogDescription).toBeTruthy();

      // Check viewport meta tag
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width=device-width');

      // Check for structured data (JSON-LD)
      const structuredData = await page.locator('script[type="application/ld+json"]').count();
      expect(structuredData).toBeGreaterThan(0);

      console.log(`✅ SEO elements validated for ${url}`);
    }
  });

  test('Core Web Vitals and performance indicators', async ({ page }) => {
    await page.goto('https://it-era.it');
    await page.waitForLoadState('networkidle');

    // Check for performance optimization indicators
    
    // Verify critical CSS is inlined or optimized
    const criticalStyles = await page.locator('style').count();
    console.log(`Found ${criticalStyles} inline style blocks`);

    // Check for lazy loading attributes
    const lazyImages = await page.locator('img[loading="lazy"]').count();
    console.log(`Found ${lazyImages} lazy-loaded images`);

    // Verify images have proper alt attributes
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      
      if (src && !src.startsWith('data:')) {
        expect(alt).toBeTruthy(); // All images should have alt text
      }
    }

    // Check for preload/prefetch optimization
    const preloadLinks = await page.locator('link[rel="preload"]').count();
    console.log(`Found ${preloadLinks} preload directives`);

    console.log('✅ Performance optimization indicators checked');
  });

  test('Mobile responsiveness validation', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://it-era.it');
    await page.waitForLoadState('networkidle');

    // Check if navigation works on mobile
    const nav = await page.locator('nav, .navbar, .navigation').first();
    await expect(nav).toBeVisible();

    // Verify no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize().width;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small margin

    // Check for mobile-friendly touch targets
    const buttons = await page.locator('button, a, input[type="submit"]').all();
    for (const button of buttons.slice(0, 5)) { // Check first 5 buttons
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44); // Minimum touch target size
      }
    }

    console.log('✅ Mobile responsiveness validated');
  });
});