const { test, expect } = require('@playwright/test');

const TEST_URLS = [
  'https://it-era.it',
  'https://it-era.it/assistenza-it-milano.html',
  'https://it-era.it/cloud-storage-monza.html'
];

const GA4_TRACKING_ID = 'G-T5VWN9EH21';
const GTM_CONTAINER_ID = 'GTM-KPF3JZT';

test.describe('GA4 & GTM Tracking Verification', () => {
  TEST_URLS.forEach(url => {
    test(`GA4 tracking verification - ${url}`, async ({ page }) => {
      const networkCalls = [];
      const errors = [];

      // Monitor network requests
      page.on('request', request => {
        const requestUrl = request.url();
        if (requestUrl.includes('google-analytics.com') || 
            requestUrl.includes('googletagmanager.com') ||
            requestUrl.includes('collect') ||
            requestUrl.includes('/g/collect')) {
          networkCalls.push({
            url: requestUrl,
            method: request.method(),
            timestamp: Date.now()
          });
        }
      });

      // Monitor console for GA4 errors
      page.on('console', msg => {
        if (msg.type() === 'error' && 
            (msg.text().includes('gtag') || msg.text().includes('ga4'))) {
          errors.push(`GA4 Console Error: ${msg.text()}`);
        }
      });

      // Navigate to page
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Wait for tracking scripts to initialize
      await page.waitForTimeout(3000);

      // Verify GA4 script is loaded
      const ga4Script = await page.locator(`script[src*="gtag/js?id=${GA4_TRACKING_ID}"]`);
      await expect(ga4Script).toBeVisible();

      // Verify GTM script is loaded
      const gtmScript = await page.locator(`script[src*="googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}"]`);
      await expect(gtmScript).toBeVisible();

      // Check for gtag configuration
      const gtagConfig = await page.evaluate((trackingId) => {
        return window.gtag && window.dataLayer && 
               window.dataLayer.some(item => 
                 item && item[1] === trackingId && item[0] === 'config'
               );
      }, GA4_TRACKING_ID);
      
      expect(gtagConfig).toBe(true);

      // Verify dataLayer exists and has been initialized
      const dataLayerExists = await page.evaluate(() => {
        return Array.isArray(window.dataLayer) && window.dataLayer.length > 0;
      });
      
      expect(dataLayerExists).toBe(true);

      // Trigger a page_view event manually and verify it's tracked
      await page.evaluate((trackingId) => {
        if (window.gtag) {
          window.gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            send_to: trackingId
          });
        }
      }, GA4_TRACKING_ID);

      // Wait for potential network calls
      await page.waitForTimeout(2000);

      // Verify we have tracking network calls
      const ga4Calls = networkCalls.filter(call => 
        call.url.includes('collect') || call.url.includes('google-analytics.com')
      );
      
      expect(ga4Calls.length).toBeGreaterThan(0);

      // Verify no tracking errors occurred
      expect(errors).toHaveLength(0);

      // Check for GTM NoScript fallback
      const gtmNoScript = await page.locator(`noscript iframe[src*="googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}"]`);
      await expect(gtmNoScript).toBeVisible();

      console.log(`✅ GA4 tracking verified for ${url} - ${ga4Calls.length} tracking calls made`);
    });
  });

  test('Enhanced ecommerce tracking capability', async ({ page }) => {
    await page.goto('https://it-era.it');
    await page.waitForLoadState('networkidle');

    // Check if enhanced ecommerce tracking is configured
    const ecommerceCapability = await page.evaluate(() => {
      return window.gtag && typeof window.gtag === 'function';
    });

    expect(ecommerceCapability).toBe(true);

    // Test custom event tracking capability
    const customEventResult = await page.evaluate(() => {
      if (window.gtag) {
        window.gtag('event', 'test_validation', {
          event_category: 'validation',
          event_label: 'devi_validate',
          value: 1
        });
        return true;
      }
      return false;
    });

    expect(customEventResult).toBe(true);
  });
});