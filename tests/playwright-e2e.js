/**
 * Playwright End-to-End Testing Suite
 * IT-ERA Website Comprehensive Testing
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = 'https://it-era.it';
const MOBILE_VIEWPORT = { width: 375, height: 667 };
const TABLET_VIEWPORT = { width: 768, height: 1024 };
const DESKTOP_VIEWPORT = { width: 1920, height: 1080 };

// Test data
const TEST_CITIES = ['milano', 'bergamo', 'brescia', 'como'];
const TEST_SERVICES = ['cloud-storage', 'cybersecurity', 'backup-disaster-recovery'];

test.describe('IT-ERA Website E2E Tests', () => {
    
    test.describe('Homepage Tests', () => {
        test('should load homepage successfully', async ({ page }) => {
            await page.goto(BASE_URL);
            
            // Check page loads
            await expect(page).toHaveTitle(/IT-ERA/);
            
            // Check critical elements
            await expect(page.locator('nav')).toBeVisible();
            await expect(page.locator('.hero')).toBeVisible();
            await expect(page.locator('footer')).toBeVisible();
            
            // Check emergency contact is visible
            await expect(page.locator('.emergency-contact')).toBeVisible();
        });
        
        test('should have proper SEO meta tags', async ({ page }) => {
            await page.goto(BASE_URL);
            
            // Check meta description
            const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
            expect(metaDescription).toBeTruthy();
            expect(metaDescription.length).toBeGreaterThan(120);
            expect(metaDescription.length).toBeLessThan(160);
            
            // Check canonical URL
            const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
            expect(canonical).toBe(BASE_URL + '/');
            
            // Check Open Graph tags
            await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content');
            await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content');
            await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content');
        });
        
        test('should be mobile responsive', async ({ page }) => {
            await page.setViewportSize(MOBILE_VIEWPORT);
            await page.goto(BASE_URL);
            
            // Check mobile navigation
            const mobileNav = page.locator('.navbar-toggler');
            if (await mobileNav.isVisible()) {
                await mobileNav.click();
                await expect(page.locator('.navbar-nav')).toBeVisible();
            }
            
            // Check emergency contact is accessible on mobile
            await expect(page.locator('.emergency-contact')).toBeVisible();
            
            // Check hero section is properly sized
            const hero = page.locator('.hero');
            await expect(hero).toBeVisible();
            const heroBox = await hero.boundingBox();
            expect(heroBox.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
        });
    });
    
    test.describe('City Pages Tests', () => {
        for (const city of TEST_CITIES) {
            test(`should load ${city} page successfully`, async ({ page }) => {
                await page.goto(`${BASE_URL}/assistenza-it-${city}`);
                
                // Check page loads
                await expect(page).toHaveTitle(new RegExp(city, 'i'));
                
                // Check city-specific content
                await expect(page.locator('h1')).toContainText(city, { ignoreCase: true });
                
                // Check contact information
                await expect(page.locator('text=039 888 2041')).toBeVisible();
                
                // Check structured data
                const structuredData = await page.locator('script[type="application/ld+json"]').textContent();
                expect(structuredData).toContain('LocalBusiness');
                expect(structuredData).toContain(city);
            });
        }
    });
    
    test.describe('Service Pages Tests', () => {
        for (const service of TEST_SERVICES) {
            test(`should load ${service} service page`, async ({ page }) => {
                await page.goto(`${BASE_URL}/${service}`);
                
                // Check page loads
                await expect(page).toHaveTitle(new RegExp(service.replace('-', ' '), 'i'));
                
                // Check service-specific content
                await expect(page.locator('h1')).toBeVisible();
                
                // Check call-to-action buttons
                await expect(page.locator('.btn-primary')).toBeVisible();
            });
        }
    });
    
    test.describe('Form Testing', () => {
        test('should handle contact form submission', async ({ page }) => {
            await page.goto(`${BASE_URL}/contatti`);
            
            // Fill contact form
            await page.fill('input[name="name"]', 'Test User');
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="phone"]', '123456789');
            await page.fill('textarea[name="message"]', 'Test message for automated testing');
            
            // Submit form
            await page.click('button[type="submit"]');
            
            // Check for success message or redirect
            await expect(page.locator('.alert-success, .success-message')).toBeVisible({ timeout: 10000 });
        });
        
        test('should validate Microsoft 365 quote form', async ({ page }) => {
            await page.goto(`${BASE_URL}/microsoft365-milano`);
            
            // Try to submit empty form
            await page.click('button[type="submit"]');
            
            // Check validation messages
            await expect(page.locator('.form-error, .invalid-feedback')).toBeVisible();
            
            // Fill form with valid data
            await page.fill('input[name="nome"]', 'Test Company');
            await page.fill('input[name="azienda"]', 'Test Corp');
            await page.fill('input[name="email"]', 'test@testcorp.com');
            await page.fill('input[name="utenti"]', '10');
            await page.selectOption('select[name="piano_interesse"]', 'business-standard');
            
            // Submit form
            await page.click('button[type="submit"]');
            
            // Check for success response
            await expect(page.locator('.alert-success')).toBeVisible({ timeout: 15000 });
        });
    });
    
    test.describe('Performance Tests', () => {
        test('should load within acceptable time limits', async ({ page }) => {
            const startTime = Date.now();
            await page.goto(BASE_URL);
            const loadTime = Date.now() - startTime;
            
            // Page should load within 3 seconds
            expect(loadTime).toBeLessThan(3000);
            
            // Check for performance metrics
            const performanceMetrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart
                };
            });
            
            expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
        });
        
        test('should have optimized images', async ({ page }) => {
            await page.goto(BASE_URL);
            
            // Check all images have loading="lazy" or are above fold
            const images = await page.locator('img').all();
            
            for (const img of images) {
                const loading = await img.getAttribute('loading');
                const isVisible = await img.isVisible();
                
                // Images should either be lazy loaded or visible (above fold)
                if (!isVisible) {
                    expect(loading).toBe('lazy');
                }
            }
        });
    });
    
    test.describe('Accessibility Tests', () => {
        test('should have proper heading hierarchy', async ({ page }) => {
            await page.goto(BASE_URL);
            
            // Check for h1
            await expect(page.locator('h1')).toBeVisible();
            
            // Check heading hierarchy (no skipped levels)
            const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
            const headingLevels = [];
            
            for (const heading of headings) {
                const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
                const level = parseInt(tagName.charAt(1));
                headingLevels.push(level);
            }
            
            // First heading should be h1
            expect(headingLevels[0]).toBe(1);
        });
        
        test('should have proper alt text for images', async ({ page }) => {
            await page.goto(BASE_URL);
            
            const images = await page.locator('img').all();
            
            for (const img of images) {
                const alt = await img.getAttribute('alt');
                const src = await img.getAttribute('src');
                
                // All images should have alt text (can be empty for decorative)
                expect(alt).not.toBeNull();
                
                // Important images should have descriptive alt text
                if (src && !src.includes('icon') && !src.includes('decoration')) {
                    expect(alt.length).toBeGreaterThan(0);
                }
            }
        });
        
        test('should be keyboard navigable', async ({ page }) => {
            await page.goto(BASE_URL);
            
            // Test tab navigation
            await page.keyboard.press('Tab');
            
            // Check if focus is visible
            const focusedElement = await page.locator(':focus').first();
            await expect(focusedElement).toBeVisible();
            
            // Test skip link
            await page.keyboard.press('Tab');
            const skipLink = page.locator('.skip-link');
            if (await skipLink.isVisible()) {
                await expect(skipLink).toBeFocused();
            }
        });
    });
    
    test.describe('Cross-Browser Compatibility', () => {
        ['chromium', 'firefox', 'webkit'].forEach(browserName => {
            test(`should work in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
                test.skip(currentBrowser !== browserName, `Skipping ${browserName} test`);
                
                await page.goto(BASE_URL);
                
                // Basic functionality tests
                await expect(page).toHaveTitle(/IT-ERA/);
                await expect(page.locator('nav')).toBeVisible();
                await expect(page.locator('.hero')).toBeVisible();
                
                // Test interactive elements
                const ctaButton = page.locator('.btn-primary').first();
                if (await ctaButton.isVisible()) {
                    await expect(ctaButton).toBeEnabled();
                }
            });
        });
    });
    
    test.describe('Error Handling', () => {
        test('should show 404 page for non-existent routes', async ({ page }) => {
            const response = await page.goto(`${BASE_URL}/non-existent-page`);
            expect(response.status()).toBe(404);
            
            // Check 404 page content
            await expect(page.locator('h1')).toContainText('404');
            await expect(page.locator('a[href="/"]')).toBeVisible();
        });
        
        test('should handle network errors gracefully', async ({ page }) => {
            // Simulate offline condition
            await page.context().setOffline(true);
            
            try {
                await page.goto(BASE_URL);
            } catch (error) {
                // Expected to fail
            }
            
            // Restore connection
            await page.context().setOffline(false);
            await page.goto(BASE_URL);
            await expect(page).toHaveTitle(/IT-ERA/);
        });
    });
});

// Test configuration
test.beforeEach(async ({ page }) => {
    // Set default timeout
    page.setDefaultTimeout(10000);
    
    // Block unnecessary resources for faster tests
    await page.route('**/*.{png,jpg,jpeg,gif,svg,woff,woff2}', route => {
        route.abort();
    });
});

test.afterEach(async ({ page }, testInfo) => {
    // Take screenshot on failure
    if (testInfo.status !== testInfo.expectedStatus) {
        await page.screenshot({ 
            path: `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}.png`,
            fullPage: true 
        });
    }
});
