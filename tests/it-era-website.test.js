/**
 * IT-ERA Website Comprehensive Test Suite
 * Testing UX improvements, performance optimizations, and business logic
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = 'https://main.it-era.pages.dev';
const LOCAL_URL = 'file:///Users/andreapanzeri/progetti/IT-ERA/web';

test.describe('IT-ERA Homepage Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${LOCAL_URL}/index.html`);
    });

    test('Homepage loads with all critical elements', async ({ page }) => {
        // Check page title
        await expect(page).toHaveTitle(/IT-ERA.*Assistenza IT.*Lombardia/);
        
        // Emergency banner is visible
        const emergencyBanner = await page.locator('.emergency-banner');
        await expect(emergencyBanner).toBeVisible();
        await expect(emergencyBanner).toContainText('039 888 2041');
        
        // Hero section with CTAs
        const heroCTA = await page.locator('.btn-cta-primary').first();
        await expect(heroCTA).toBeVisible();
        await expect(heroCTA).toHaveText(/Assistenza Urgente/);
        
        // Trust metrics are displayed
        const trustBar = await page.locator('.trust-bar');
        await expect(trustBar).toBeVisible();
        await expect(trustBar).toContainText('300+');
        await expect(trustBar).toContainText('15min');
        await expect(trustBar).toContainText('24/7');
    });

    test('Mobile responsiveness and touch targets', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Check mobile menu
        const menuToggler = await page.locator('.navbar-toggler');
        await expect(menuToggler).toBeVisible();
        
        // Check touch target sizes (minimum 48px)
        const buttons = await page.locator('.btn, .btn-cta-primary, .btn-cta-secondary');
        const count = await buttons.count();
        
        for (let i = 0; i < count; i++) {
            const button = buttons.nth(i);
            const box = await button.boundingBox();
            if (box) {
                expect(box.height).toBeGreaterThanOrEqual(48);
            }
        }
    });

    test('CTA effectiveness and urgency', async ({ page }) => {
        // Check primary CTA
        const primaryCTA = await page.locator('.btn-cta-primary').first();
        await expect(primaryCTA).toContainText('Risposta in 15 min');
        
        // Check phone number consistency
        const phoneLinks = await page.locator('a[href="tel:+390398882041"]');
        const phoneCount = await phoneLinks.count();
        expect(phoneCount).toBeGreaterThan(2); // Multiple phone CTAs
        
        // Check urgency indicators
        await expect(page.locator('text=/Sistema bloccato/')).toBeVisible();
        await expect(page.locator('text=/RISPARMIA 30%/')).toBeVisible();
    });

    test('Service cards and pricing transparency', async ({ page }) => {
        // Check all 6 service cards
        const serviceCards = await page.locator('.service-card');
        await expect(serviceCards).toHaveCount(6);
        
        // Check pricing is visible
        const prices = await page.locator('.price');
        const priceCount = await prices.count();
        expect(priceCount).toBeGreaterThanOrEqual(6);
        
        // Check special offer card
        const specialCard = await page.locator('.service-card[style*="border"]');
        await expect(specialCard).toBeVisible();
        await expect(specialCard).toContainText('All-Inclusive');
    });

    test('Trust signals and partner logos', async ({ page }) => {
        // Check partner badges
        const partnerLogos = await page.locator('.client-logos img');
        await expect(partnerLogos).toHaveCount(5);
        
        // Verify partner names
        await expect(page.locator('img[alt="Microsoft Partner"]')).toBeVisible();
        await expect(page.locator('img[alt="Veeam Gold Partner"]')).toBeVisible();
        await expect(page.locator('img[alt="Wildix Gold Partner"]')).toBeVisible();
    });

    test('Geographic coverage section', async ({ page }) => {
        // Check coverage section
        const coverageSection = await page.locator('.coverage');
        await expect(coverageSection).toBeVisible();
        
        // Check city tags
        const cityTags = await page.locator('.city-tag');
        const cityCount = await cityTags.count();
        expect(cityCount).toBeGreaterThanOrEqual(15);
        
        // Check major cities
        await expect(page.locator('.city-tag:has-text("Milano")')).toBeVisible();
        await expect(page.locator('.city-tag:has-text("Monza")')).toBeVisible();
        await expect(page.locator('.city-tag:has-text("Vimercate")')).toBeVisible();
    });
});

test.describe('Performance Optimizations', () => {
    test('Critical CSS is inlined', async ({ page }) => {
        const response = await page.goto(`${LOCAL_URL}/index.html`);
        const html = await response.text();
        
        // Check for inline critical CSS
        expect(html).toContain('<style>');
        expect(html).toContain(':root {');
        expect(html).toContain('--primary: #0056cc');
        
        // Check for deferred loading
        expect(html).toContain('media="print" onload="this.media=\'all\'"');
    });

    test('Images and resources are optimized', async ({ page }) => {
        await page.goto(`${LOCAL_URL}/index.html`);
        
        // Check preconnect hints
        const preconnects = await page.locator('link[rel="preconnect"]');
        await expect(preconnects).toHaveCount(2);
        
        // Check font display swap
        const fontLink = await page.locator('link[href*="fonts.googleapis"]');
        const href = await fontLink.getAttribute('href');
        expect(href).toContain('display=swap');
    });

    test('Page loads within performance budget', async ({ page }) => {
        const startTime = Date.now();
        await page.goto(`${LOCAL_URL}/index.html`);
        const loadTime = Date.now() - startTime;
        
        // Page should load in under 3 seconds locally
        expect(loadTime).toBeLessThan(3000);
        
        // Check no console errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        
        await page.waitForTimeout(1000);
        expect(consoleErrors).toHaveLength(0);
    });
});

test.describe('Navigation and User Flow', () => {
    test('Main navigation works correctly', async ({ page }) => {
        await page.goto(`${LOCAL_URL}/index.html`);
        
        // Check dropdown menus
        await page.click('text=Servizi');
        const dropdown = await page.locator('.dropdown-menu').first();
        await expect(dropdown).toBeVisible();
        
        // Check service links
        await expect(page.locator('text=🔧 Assistenza IT')).toBeVisible();
        await expect(page.locator('text=☁️ Cloud Storage')).toBeVisible();
        await expect(page.locator('text=🛡️ Sicurezza')).toBeVisible();
    });

    test('Skip navigation for accessibility', async ({ page }) => {
        await page.goto(`${LOCAL_URL}/index.html`);
        
        // Focus skip link
        await page.keyboard.press('Tab');
        const skipLink = await page.locator('.skip-link');
        await expect(skipLink).toBeFocused();
        
        // Click skip link
        await skipLink.click();
        const mainContent = await page.locator('#main-content');
        await expect(mainContent).toBeInViewport();
    });

    test('Footer contains correct contact info', async ({ page }) => {
        await page.goto(`${LOCAL_URL}/index.html`);
        
        const footer = await page.locator('footer');
        await expect(footer).toContainText('Viale Risorgimento 32, Vimercate MB');
        await expect(footer).toContainText('039 888 2041');
        await expect(footer).toContainText('info@it-era.it');
    });
});

test.describe('Conversion Elements', () => {
    test('Multiple conversion points available', async ({ page }) => {
        await page.goto(`${LOCAL_URL}/index.html`);
        
        // Count all CTAs
        const phoneCTAs = await page.locator('a[href^="tel:"]');
        const phoneCount = await phoneCTAs.count();
        expect(phoneCount).toBeGreaterThanOrEqual(4);
        
        const emailCTAs = await page.locator('a[href^="mailto:"]');
        const emailCount = await emailCTAs.count();
        expect(emailCount).toBeGreaterThanOrEqual(1);
        
        // Service page links
        const serviceLinks = await page.locator('a[href*="/pages/"]');
        const linkCount = await serviceLinks.count();
        expect(linkCount).toBeGreaterThanOrEqual(20);
    });

    test('Emergency support banner stays visible', async ({ page }) => {
        await page.goto(`${LOCAL_URL}/index.html`);
        
        // Scroll down
        await page.evaluate(() => window.scrollBy(0, 500));
        
        // Emergency banner should still be visible (fixed)
        const emergencyBanner = await page.locator('.emergency-banner');
        await expect(emergencyBanner).toBeVisible();
        
        // Check it has fixed positioning
        const position = await emergencyBanner.evaluate(el => 
            window.getComputedStyle(el).position
        );
        expect(position).toBe('fixed');
    });

    test('Pricing calculator elements', async ({ page }) => {
        await page.goto(`${LOCAL_URL}/index.html`);
        
        // Check pricing visibility
        const prices = await page.locator('.price');
        for (let i = 0; i < 6; i++) {
            await expect(prices.nth(i)).toBeVisible();
        }
        
        // Check special offer highlighting
        const specialOffer = await page.locator('text=RISPARMIA 30%');
        await expect(specialOffer).toBeVisible();
    });
});

test.describe('SEO and Meta Tags', () => {
    test('Essential meta tags are present', async ({ page }) => {
        await page.goto(`${LOCAL_URL}/index.html`);
        
        // Check meta description
        const description = await page.getAttribute('meta[name="description"]', 'content');
        expect(description).toContain('IT-ERA');
        expect(description).toContain('Lombardia');
        expect(description).toContain('24/7');
        
        // Check viewport
        const viewport = await page.getAttribute('meta[name="viewport"]', 'content');
        expect(viewport).toContain('width=device-width');
    });

    test('Proper heading hierarchy', async ({ page }) => {
        await page.goto(`${LOCAL_URL}/index.html`);
        
        // Check H1
        const h1 = await page.locator('h1');
        await expect(h1).toHaveCount(1);
        await expect(h1).toContainText('Partner IT');
        
        // Check H2s
        const h2s = await page.locator('h2');
        const h2Count = await h2s.count();
        expect(h2Count).toBeGreaterThanOrEqual(3);
        
        // Check H3s in service cards
        const h3s = await page.locator('.service-card h3');
        await expect(h3s).toHaveCount(6);
    });
});

// Export for TestSprite
module.exports = {
    testSuites: [
        'IT-ERA Homepage Tests',
        'Performance Optimizations',
        'Navigation and User Flow',
        'Conversion Elements',
        'SEO and Meta Tags'
    ],
    totalTests: 20,
    priority: 'high',
    expectedDuration: '2-3 minutes'
};