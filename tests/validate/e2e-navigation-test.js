const { test, expect } = require('@playwright/test');

const TEST_URLS = [
  'https://it-era.it',
  'https://it-era.it/assistenza-it-milano.html',
  'https://it-era.it/cloud-storage-monza.html',
  'https://it-era.it/sicurezza-informatica-bergamo.html',
  'https://it-era.it/riparazione-pc-como.html'
];

const EXPECTED_NAV_LINKS = [
  { text: 'Home', href: '/' },
  { text: 'PMI e Startup', href: '#pmi' },
  { text: 'Studi Medici', href: '#medici' },
  { text: 'Commercialisti', href: '#commercialisti' },
  { text: 'Studi Legali', href: '#legali' }
];

test.describe('Navigation Consistency Tests', () => {
  TEST_URLS.forEach(url => {
    test(`Navigation consistency - ${url}`, async ({ page }) => {
      const errors = [];
      
      // Monitor console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(`Console Error: ${msg.text()}`);
        }
      });

      // Navigate to page
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Check page loads without errors
      expect(errors).toHaveLength(0);

      // Verify navigation menu exists
      const nav = await page.locator('nav, .navbar, .navigation').first();
      await expect(nav).toBeVisible();

      // Check all expected navigation links
      for (const link of EXPECTED_NAV_LINKS) {
        const navLink = page.locator(`nav a:has-text("${link.text}"), .navbar a:has-text("${link.text}"), .navigation a:has-text("${link.text}")`);
        await expect(navLink).toBeVisible();
        
        // Verify link has correct href or functionality
        const href = await navLink.getAttribute('href');
        expect(href).toBeTruthy();
      }

      // Verify unified contact information
      const phoneLink = page.locator('a[href*="039 888 2041"], a[href*="0398882041"]');
      await expect(phoneLink).toBeVisible();

      // Check for presence of unified menu component
      const menuComponent = page.locator('.menu-unified, #unified-navigation, .navigation-optimized');
      if (await menuComponent.count() > 0) {
        await expect(menuComponent).toBeVisible();
      }

      // Verify no broken images in navigation
      const navImages = await page.locator('nav img, .navbar img, .navigation img').all();
      for (const img of navImages) {
        const naturalWidth = await img.evaluate(el => el.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }

      // Check for responsive navigation toggle if mobile
      const viewport = page.viewportSize();
      if (viewport.width < 768) {
        const mobileToggle = page.locator('.navbar-toggle, .menu-toggle, button[aria-label*="menu"]');
        if (await mobileToggle.count() > 0) {
          await expect(mobileToggle).toBeVisible();
        }
      }
    });
  });

  test('Cross-page navigation functionality', async ({ page }) => {
    // Start from homepage
    await page.goto('https://it-era.it');
    
    // Test navigation to service pages
    const servicesLink = page.locator('nav a:has-text("Servizi"), .navbar a:has-text("Servizi")').first();
    if (await servicesLink.count() > 0) {
      await servicesLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify we navigated successfully
      expect(page.url()).not.toBe('https://it-era.it');
      
      // Verify navigation is still consistent on new page
      const nav = await page.locator('nav, .navbar, .navigation').first();
      await expect(nav).toBeVisible();
    }
  });

  test('Footer consistency across pages', async ({ page }) => {
    for (const url of TEST_URLS.slice(0, 3)) { // Test first 3 URLs
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Check for footer presence
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();

      // Verify contact information in footer
      const footerContact = footer.locator(':has-text("039 888 2041")');
      await expect(footerContact).toBeVisible();

      // Verify address information
      const addressInfo = footer.locator(':has-text("Vimercate")');
      await expect(addressInfo).toBeVisible();
    }
  });
});