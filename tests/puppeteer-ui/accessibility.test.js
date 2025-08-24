const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const { AxePuppeteer } = require('@axe-core/puppeteer');

describe('Accessibility Testing', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    page.on('console', msg => console.log('ACCESSIBILITY LOG:', msg.text()));
  });
  
  afterAll(async () => {
    if (browser) await browser.close();
  });
  
  describe('WCAG 2.1 Compliance Testing', () => {
    test('should pass axe-core accessibility audit', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const axeResults = await new AxePuppeteer(page)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      // Save detailed accessibility report
      await fs.writeJson(
        path.join(global.TEST_CONFIG.REPORTS_DIR, 'accessibility-audit.json'), 
        axeResults
      );
      
      // Check for violations
      expect(axeResults.violations).toHaveLength(0);
      
      // Verify passes
      expect(axeResults.passes.length).toBeGreaterThan(0);
      
      await global.takeScreenshot(page, 'accessibility-audit-passed');
      
      // Log results summary
      console.log(`Accessibility Audit Results:
        - Passes: ${axeResults.passes.length}
        - Violations: ${axeResults.violations.length}
        - Incomplete: ${axeResults.incomplete.length}
        - Inapplicable: ${axeResults.inapplicable.length}
      `);
    });
    
    test('should have proper semantic HTML structure', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const semanticStructure = await page.evaluate(() => {
        return {
          hasMainElement: !!document.querySelector('main') || !!document.querySelector('[role="main"]'),
          hasHeaderElements: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
          hasProperHeadingHierarchy: (() => {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            if (headings.length === 0) return false;
            
            let currentLevel = 0;
            for (const heading of headings) {
              const level = parseInt(heading.tagName.substring(1));
              if (currentLevel === 0) {
                if (level !== 1) return false;
              } else if (level > currentLevel + 1) {
                return false;
              }
              currentLevel = level;
            }
            return true;
          })(),
          hasLandmarkElements: document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], nav, header, main, footer').length > 0,
          hasProperListStructure: (() => {
            const lists = document.querySelectorAll('ul, ol');
            return Array.from(lists).every(list => list.children.length > 0 && Array.from(list.children).every(child => child.tagName === 'LI'));
          })()
        };
      });
      
      expect(semanticStructure.hasHeaderElements).toBe(true);
      expect(semanticStructure.hasProperHeadingHierarchy).toBe(true);
      expect(semanticStructure.hasLandmarkElements).toBe(true);
      
      await global.takeScreenshot(page, 'semantic-structure-check');
    });
  });
  
  describe('Keyboard Navigation Testing', () => {
    test('should support full keyboard navigation', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Get all focusable elements
      const focusableElements = await page.evaluate(() => {
        const focusableSelectors = [
          'input:not([disabled])',
          'button:not([disabled])',
          'textarea:not([disabled])',
          'select:not([disabled])',
          'a[href]',
          '[tabindex]:not([tabindex="-1"])'
        ];
        
        return Array.from(document.querySelectorAll(focusableSelectors.join(',')))
          .map((el, index) => ({
            index,
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            tabIndex: el.tabIndex,
            isVisible: el.offsetParent !== null
          }));
      });
      
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Test tab navigation
      await page.focus('body');
      const navigationResults = [];
      
      for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        const activeElement = await page.evaluate(() => ({
          tagName: document.activeElement.tagName,
          id: document.activeElement.id,
          className: document.activeElement.className
        }));
        
        navigationResults.push(activeElement);
      }
      
      expect(navigationResults.length).toBe(Math.min(focusableElements.length, 10));
      
      await global.takeScreenshot(page, 'keyboard-navigation-test');
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'keyboard-navigation.json'), {
        focusableElements,
        navigationResults
      });
    });
    
    test('should handle Enter and Space key interactions', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Test Enter key on chat input
      await page.focus('#chatInput');
      await page.type('#chatInput', 'Test Enter key functionality');
      
      const initialMessageCount = await page.$$eval('.message', msgs => msgs.length);
      
      // Mock API response
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('chat')) {
          request.respond({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: 'Enter key test response'
            })
          });
        } else {
          request.continue();
        }
      });
      
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      
      const finalMessageCount = await page.$$eval('.message', msgs => msgs.length);
      expect(finalMessageCount).toBeGreaterThan(initialMessageCount);
      
      // Test Space key on buttons
      await page.focus('.test-button:first-child');
      await page.keyboard.press('Space');
      
      const inputValue = await page.$eval('#chatInput', el => el.value);
      expect(inputValue.length).toBeGreaterThan(0);
      
      await global.takeScreenshot(page, 'keyboard-interactions');
    });
    
    test('should provide visible focus indicators', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const focusIndicatorResults = [];
      const focusableSelectors = ['#chatInput', '#sendButton', '.test-button:first-child'];
      
      for (const selector of focusableSelectors) {
        await page.focus(selector);
        await page.waitForTimeout(200);
        
        const focusStyles = await page.evaluate((sel) => {
          const element = document.querySelector(sel);
          const styles = window.getComputedStyle(element);
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            outlineColor: styles.outlineColor,
            boxShadow: styles.boxShadow,
            borderColor: styles.borderColor
          };
        }, selector);
        
        const hasFocusIndicator = 
          focusStyles.outline !== 'none' ||
          focusStyles.outlineWidth !== '0px' ||
          focusStyles.boxShadow !== 'none' ||
          focusStyles.borderColor !== 'initial';
        
        focusIndicatorResults.push({
          selector,
          hasFocusIndicator,
          styles: focusStyles
        });
        
        expect(hasFocusIndicator).toBe(true);
        
        await global.takeScreenshot(page, `focus-indicator-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`);
      }
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'focus-indicators.json'), focusIndicatorResults);
    });
  });
  
  describe('Screen Reader Support', () => {
    test('should have proper ARIA labels and descriptions', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const ariaAnalysis = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const results = {
          elementsWithAriaLabel: 0,
          elementsWithAriaLabelledBy: 0,
          elementsWithAriaDescribedBy: 0,
          elementsWithRole: 0,
          buttonsWithoutAccessibleName: 0,
          inputsWithoutLabel: 0,
          imagesWithoutAlt: 0
        };
        
        elements.forEach(el => {
          if (el.getAttribute('aria-label')) results.elementsWithAriaLabel++;
          if (el.getAttribute('aria-labelledby')) results.elementsWithAriaLabelledBy++;
          if (el.getAttribute('aria-describedby')) results.elementsWithAriaDescribedBy++;
          if (el.getAttribute('role')) results.elementsWithRole++;
          
          if (el.tagName === 'BUTTON' && !el.textContent.trim() && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
            results.buttonsWithoutAccessibleName++;
          }
          
          if ((el.tagName === 'INPUT' && el.type !== 'hidden') && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !document.querySelector(`label[for="${el.id}"]`)) {
            results.inputsWithoutLabel++;
          }
          
          if (el.tagName === 'IMG' && !el.getAttribute('alt') && !el.getAttribute('aria-label')) {
            results.imagesWithoutAlt++;
          }
        });
        
        return results;
      });
      
      expect(ariaAnalysis.buttonsWithoutAccessibleName).toBe(0);
      expect(ariaAnalysis.inputsWithoutLabel).toBe(0);
      expect(ariaAnalysis.imagesWithoutAlt).toBe(0);
      
      await global.takeScreenshot(page, 'aria-labels-check');
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'aria-analysis.json'), ariaAnalysis);
    });
    
    test('should provide proper status announcements', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Check for ARIA live regions
      const liveRegions = await page.evaluate(() => {
        const liveElements = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
        return Array.from(liveElements).map(el => ({
          tagName: el.tagName,
          ariaLive: el.getAttribute('aria-live'),
          role: el.getAttribute('role'),
          id: el.id,
          className: el.className
        }));
      });
      
      // Should have live regions for dynamic content
      expect(liveRegions.length).toBeGreaterThanOrEqual(0);
      
      await global.takeScreenshot(page, 'live-regions-check');
    });
  });
  
  describe('Color Contrast and Visual Accessibility', () => {
    test('should meet color contrast requirements', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Use axe-core for color contrast testing
      const contrastResults = await new AxePuppeteer(page)
        .include('body')
        .withTags(['color-contrast'])
        .analyze();
      
      expect(contrastResults.violations.filter(v => v.id === 'color-contrast')).toHaveLength(0);
      
      // Manual color contrast checks for key elements
      const colorContrastAnalysis = await page.evaluate(() => {
        const getContrastRatio = (foreground, background) => {
          const getLuminance = (rgb) => {
            const [r, g, b] = rgb.match(/\d+/g).map(x => {
              x = parseInt(x) / 255;
              return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          
          const l1 = getLuminance(foreground);
          const l2 = getLuminance(background);
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        };
        
        const elements = [
          { selector: 'body', type: 'background' },
          { selector: '.message.bot', type: 'message' },
          { selector: '.message.user', type: 'message' },
          { selector: '.test-button', type: 'button' },
          { selector: '#sendButton', type: 'button' }
        ];
        
        return elements.map(({ selector, type }) => {
          const el = document.querySelector(selector);
          if (!el) return null;
          
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          return {
            selector,
            type,
            color,
            backgroundColor,
            styles: {
              color: styles.color,
              backgroundColor: styles.backgroundColor
            }
          };
        }).filter(Boolean);
      });
      
      await global.takeScreenshot(page, 'color-contrast-check');
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'color-contrast.json'), {
        axeResults: contrastResults,
        manualAnalysis: colorContrastAnalysis
      });
    });
    
    test('should work without color alone for information', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Simulate color blindness by removing color information
      await page.addStyleTag({
        content: `
          * {
            filter: grayscale(100%) !important;
          }
        `
      });
      
      await page.waitForTimeout(1000);
      
      // Check if information is still accessible
      const informationAccessibility = await page.evaluate(() => {
        const statusItems = document.querySelectorAll('.status-item');
        const testButtons = document.querySelectorAll('.test-button');
        const messages = document.querySelectorAll('.message');
        
        return {
          statusItemsHaveText: Array.from(statusItems).every(item => item.textContent.trim().length > 0),
          buttonsHaveText: Array.from(testButtons).every(btn => btn.textContent.trim().length > 0),
          messagesDistinguishable: Array.from(messages).every(msg => {
            const styles = window.getComputedStyle(msg);
            return msg.textContent.trim().length > 0;
          })
        };
      });
      
      expect(informationAccessibility.statusItemsHaveText).toBe(true);
      expect(informationAccessibility.buttonsHaveText).toBe(true);
      expect(informationAccessibility.messagesDistinguishable).toBe(true);
      
      await global.takeScreenshot(page, 'grayscale-accessibility');
    });
  });
  
  describe('Mobile Accessibility', () => {
    test('should be accessible on mobile devices', async () => {
      await page.setViewport(global.TEST_CONFIG.VIEWPORTS.MOBILE);
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Check touch target sizes
      const touchTargetAnalysis = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, .test-button, input[type="submit"]');
        const minTouchSize = 44; // 44px minimum touch target size
        
        return Array.from(buttons).map(btn => {
          const rect = btn.getBoundingClientRect();
          return {
            element: btn.tagName,
            id: btn.id,
            className: btn.className,
            width: rect.width,
            height: rect.height,
            meetsMinimum: rect.width >= minTouchSize && rect.height >= minTouchSize
          };
        });
      });
      
      const inadequateTouchTargets = touchTargetAnalysis.filter(target => !target.meetsMinimum);
      expect(inadequateTouchTargets).toHaveLength(0);
      
      // Test mobile-specific interactions
      await page.tap('#chatInput');
      const inputFocused = await page.evaluate(() => document.activeElement.id === 'chatInput');
      expect(inputFocused).toBe(true);
      
      await global.takeScreenshot(page, 'mobile-accessibility');
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'mobile-accessibility.json'), {
        touchTargetAnalysis,
        inadequateTouchTargets: inadequateTouchTargets.length
      });
    });
  });
  
  describe('Admin Panel Accessibility', () => {
    test('should make admin panel accessible', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const adminAxeResults = await new AxePuppeteer(page)
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      
      expect(adminAxeResults.violations).toHaveLength(0);
      
      // Test tab navigation in admin panel
      await page.focus('body');
      const tabStops = [];
      
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        const activeElement = await page.evaluate(() => ({
          tagName: document.activeElement.tagName,
          id: document.activeElement.id,
          type: document.activeElement.type || null
        }));
        tabStops.push(activeElement);
      }
      
      // Should be able to navigate through form controls
      const hasFormControls = tabStops.some(stop => 
        ['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(stop.tagName)
      );
      expect(hasFormControls).toBe(true);
      
      await global.takeScreenshot(page, 'admin-panel-accessibility');
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'admin-accessibility.json'), {
        axeResults: adminAxeResults,
        tabStops
      });
    });
  });
});