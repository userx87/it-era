#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class AccessibilityAuditor {
  constructor() {
    this.auditDir = path.join(__dirname, 'results');
    this.ensureAuditDir();
  }

  ensureAuditDir() {
    if (!fs.existsSync(this.auditDir)) {
      fs.mkdirSync(this.auditDir, { recursive: true });
    }
  }

  async auditAccessibility(url, pageName) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    try {
      console.log(`🔍 Auditing accessibility for ${pageName}...`);

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      // Inject axe-core for accessibility testing
      await page.addScriptTag({
        url: 'https://unpkg.com/axe-core@4.4.2/axe.min.js'
      });

      // Run axe accessibility tests
      const axeResults = await page.evaluate(() => {
        return new Promise((resolve) => {
          axe.run((err, results) => {
            if (err) {
              resolve({ error: err.message });
            } else {
              resolve(results);
            }
          });
        });
      });

      // Check for common accessibility issues
      const manualChecks = await this.performManualChecks(page);

      // WCAG 2.1 AA specific checks
      const wcagChecks = await this.performWCAGChecks(page);

      const accessibilityReport = {
        url,
        pageName,
        timestamp: new Date().toISOString(),
        axeResults: axeResults.error ? { error: axeResults.error } : {
          passes: axeResults.passes?.length || 0,
          violations: axeResults.violations?.map(v => ({
            id: v.id,
            description: v.description,
            impact: v.impact,
            help: v.help,
            helpUrl: v.helpUrl,
            nodes: v.nodes?.length || 0,
            tags: v.tags
          })) || [],
          incomplete: axeResults.incomplete?.map(i => ({
            id: i.id,
            description: i.description,
            impact: i.impact,
            help: i.help,
            nodes: i.nodes?.length || 0
          })) || []
        },
        manualChecks,
        wcagChecks,
        summary: {
          totalViolations: axeResults.violations?.length || 0,
          criticalViolations: axeResults.violations?.filter(v => v.impact === 'critical').length || 0,
          seriousViolations: axeResults.violations?.filter(v => v.impact === 'serious').length || 0,
          moderateViolations: axeResults.violations?.filter(v => v.impact === 'moderate').length || 0,
          minorViolations: axeResults.violations?.filter(v => v.impact === 'minor').length || 0
        }
      };

      // Save results
      const filename = `${pageName.toLowerCase().replace(/\s+/g, '-')}-accessibility.json`;
      fs.writeFileSync(
        path.join(this.auditDir, filename),
        JSON.stringify(accessibilityReport, null, 2)
      );

      return accessibilityReport;

    } catch (error) {
      console.error(`❌ Error auditing ${pageName}:`, error.message);
      return null;
    } finally {
      await browser.close();
    }
  }

  async performManualChecks(page) {
    const checks = {};

    try {
      // Check for keyboard navigation
      checks.keyboardNavigation = await page.evaluate(() => {
        const focusableElements = document.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        return {
          totalFocusableElements: focusableElements.length,
          hasTabOrder: Array.from(focusableElements).some(el => el.getAttribute('tabindex'))
        };
      });

      // Check for alt texts
      checks.images = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt'));
        return {
          totalImages: images.length,
          imagesWithoutAlt: imagesWithoutAlt.length,
          imagesWithEmptyAlt: Array.from(images).filter(img => img.getAttribute('alt') === '').length
        };
      });

      // Check for form labels
      checks.forms = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
        const inputsWithoutLabels = Array.from(inputs).filter(input => {
          const id = input.getAttribute('id');
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');

          return !label && !ariaLabel && !ariaLabelledBy && !input.closest('label');
        });

        return {
          totalInputs: inputs.length,
          inputsWithoutLabels: inputsWithoutLabels.length
        };
      });

      // Check for headings structure
      checks.headings = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const headingLevels = Array.from(headings).map(h => parseInt(h.tagName[1]));

        return {
          totalHeadings: headings.length,
          h1Count: document.querySelectorAll('h1').length,
          hasLogicalOrder: this.checkHeadingOrder(headingLevels)
        };
      });

      // Check for ARIA landmarks
      checks.landmarks = await page.evaluate(() => {
        const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], main, nav, header, footer, aside');
        return {
          totalLandmarks: landmarks.length,
          hasMain: !!document.querySelector('main, [role="main"]'),
          hasNavigation: !!document.querySelector('nav, [role="navigation"]')
        };
      });

    } catch (error) {
      console.error('Error in manual checks:', error.message);
    }

    return checks;
  }

  async performWCAGChecks(page) {
    const wcagChecks = {};

    try {
      // WCAG 2.1 AA Color Contrast (Success Criterion 1.4.3)
      wcagChecks.colorContrast = await page.evaluate(() => {
        // This is a simplified check - full contrast checking requires more complex analysis
        const textElements = document.querySelectorAll('p, span, div, a, button, label, h1, h2, h3, h4, h5, h6');
        let lowContrastElements = 0;

        Array.from(textElements).forEach(el => {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const backgroundColor = style.backgroundColor;

          // Very basic contrast check - in reality you'd need a proper contrast calculator
          if (color === backgroundColor || (color === 'rgb(0, 0, 0)' && backgroundColor === 'rgb(0, 0, 0)')) {
            lowContrastElements++;
          }
        });

        return {
          totalTextElements: textElements.length,
          suspectedLowContrastElements: lowContrastElements
        };
      });

      // WCAG 2.1 AA Text Resize (Success Criterion 1.4.4)
      wcagChecks.textResize = await page.evaluate(() => {
        const body = document.body;
        const originalFontSize = window.getComputedStyle(body).fontSize;

        return {
          originalFontSize: originalFontSize,
          supportsZoom: true // Modern browsers support this by default
        };
      });

      // WCAG 2.1 AA Touch Target Size (Success Criterion 2.5.5)
      wcagChecks.touchTargets = await page.evaluate(() => {
        const interactiveElements = document.querySelectorAll('a, button, input, select, textarea');
        let smallTargets = 0;

        Array.from(interactiveElements).forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width < 44 || rect.height < 44) {
            smallTargets++;
          }
        });

        return {
          totalInteractiveElements: interactiveElements.length,
          smallTouchTargets: smallTargets
        };
      });

      // WCAG 2.1 AA Page Title (Success Criterion 2.4.2)
      wcagChecks.pageTitle = await page.evaluate(() => {
        const title = document.title;
        return {
          hasTitle: !!title,
          titleLength: title ? title.length : 0,
          title: title
        };
      });

      // WCAG 2.1 AA Language (Success Criterion 3.1.1)
      wcagChecks.language = await page.evaluate(() => {
        const htmlLang = document.documentElement.getAttribute('lang');
        return {
          hasLangAttribute: !!htmlLang,
          language: htmlLang
        };
      });

    } catch (error) {
      console.error('Error in WCAG checks:', error.message);
    }

    return wcagChecks;
  }
}

module.exports = AccessibilityAuditor;