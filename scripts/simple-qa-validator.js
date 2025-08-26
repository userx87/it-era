#!/usr/bin/env node
/**
 * Simple QA Validator - IT-ERA Production
 * Comprehensive validation without complex dependencies
 */

const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  baseUrl: 'https://it-era.it',
  testPages: [
    '/',
    '/assistenza-informatica-bergamo.html',
    '/sicurezza-informatica-milano.html',
    '/cloud-storage-monza.html',
    '/riparazione-pc-como.html'
  ],
  thresholds: {
    minWordCount: 350,
    metaDescriptionMin: 120,
    metaDescriptionMax: 160
  },
  ga4Config: {
    trackingId: 'G-T5VWN9EH21',
    gtmId: 'GTM-KPF3JZT'
  }
};

class SimpleQAValidator {
  constructor() {
    this.results = {
      tests: [],
      metrics: {
        all_tests_pass: true,
        critical_issues: 0,
        warnings: 0,
        qa_score: '100%'
      }
    };
  }

  async testHttpUrl(url) {
    return new Promise((resolve) => {
      const request = https.get(url, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          resolve({
            status: response.statusCode,
            headers: response.headers,
            content: data.substring(0, 1000),
            hasUrlSet: data.includes('<urlset') || data.includes('Sitemap:'),
            size: data.length
          });
        });
      });
      
      request.on('error', (error) => {
        resolve({
          status: 0,
          error: error.message
        });
      });
      
      request.setTimeout(15000, () => {
        request.destroy();
        resolve({
          status: 0,
          error: 'Request timeout'
        });
      });
    });
  }

  async validateWithPuppeteer() {
    let browser;
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      for (const pagePath of CONFIG.testPages) {
        const fullUrl = pagePath.startsWith('/') ? `${CONFIG.baseUrl}${pagePath}` : pagePath;
        const page = await browser.newPage();
        
        const consoleErrors = [];
        const networkRequests = [];
        
        // Monitor console errors
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        // Monitor network requests for GA4
        page.on('response', response => {
          const url = response.url();
          if (url.includes('google-analytics.com') || url.includes('/g/collect') || url.includes('/collect')) {
            networkRequests.push({
              url,
              status: response.status(),
              type: 'analytics'
            });
          }
        });

        try {
          console.log(`🔍 Validating: ${fullUrl}`);
          
          await page.goto(fullUrl, { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
          });
          
          // Wait a bit for GA4 to load
          await page.waitForFunction(() => document.readyState === 'complete');
          await new Promise(resolve => setTimeout(resolve, 3000));

          const pageData = await page.evaluate((ga4Id, gtmId) => {
            const results = {};

            // Check H1
            const h1Elements = document.querySelectorAll('h1');
            results.h1 = {
              present: h1Elements.length > 0,
              count: h1Elements.length,
              text: h1Elements[0] ? h1Elements[0].textContent.trim() : null
            };

            // Check Meta Description
            const metaDesc = document.querySelector('meta[name="description"]');
            results.metaDescription = {
              present: !!metaDesc,
              content: metaDesc ? metaDesc.getAttribute('content') : null,
              length: metaDesc ? metaDesc.getAttribute('content').length : 0
            };

            // Word Count
            const bodyText = document.body.innerText || '';
            const words = bodyText.trim().split(/\s+/).filter(word => word.length > 0);
            results.wordCount = words.length;

            // Navigation Check
            const navElements = document.querySelectorAll('nav, .navbar, .navigation, .menu');
            const navLinks = document.querySelectorAll('nav a, .navbar a, .navigation a, .menu a');
            results.navigation = {
              navElementsCount: navElements.length,
              navLinksCount: navLinks.length,
              hasWorkingLinks: navLinks.length > 0
            };

            // GA4 Check
            results.ga4 = {
              gtagPresent: typeof window.gtag === 'function',
              dataLayerPresent: Array.isArray(window.dataLayer),
              trackingIdFound: document.documentElement.innerHTML.includes(ga4Id),
              gtmFound: document.documentElement.innerHTML.includes(gtmId)
            };

            // Page Title
            results.title = document.title;

            // Canonical URL
            const canonical = document.querySelector('link[rel="canonical"]');
            results.canonical = canonical ? canonical.getAttribute('href') : null;

            return results;
          }, CONFIG.ga4Config.trackingId, CONFIG.ga4Config.gtmId);

          // Take screenshot
          const screenshotName = fullUrl.replace(/[^a-z0-9]/gi, '_') + '.png';
          const screenshotPath = path.join(process.cwd(), 'reports/screens', screenshotName);
          await page.screenshot({ 
            path: screenshotPath, 
            fullPage: false,
            clip: { x: 0, y: 0, width: 1200, height: 800 }
          });

          // Validate metrics
          const checks = {
            h1: pageData.h1.present && pageData.h1.count === 1,
            meta: pageData.metaDescription.present && 
                  pageData.metaDescription.length >= CONFIG.thresholds.metaDescriptionMin &&
                  pageData.metaDescription.length <= CONFIG.thresholds.metaDescriptionMax,
            wordcount: pageData.wordCount >= CONFIG.thresholds.minWordCount,
            nav: pageData.navigation.hasWorkingLinks && pageData.navigation.navLinksCount > 5,
            errors: consoleErrors.length === 0,
            ga4: pageData.ga4.gtagPresent && pageData.ga4.dataLayerPresent && pageData.ga4.trackingIdFound
          };

          const testResult = {
            name: `page-validation-${pagePath.replace(/[^a-z0-9]/gi, '_')}`,
            url: fullUrl,
            status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
            checks,
            details: {
              h1: pageData.h1,
              metaDescription: pageData.metaDescription,
              wordCount: pageData.wordCount,
              navigation: pageData.navigation,
              ga4: pageData.ga4,
              title: pageData.title,
              canonical: pageData.canonical
            },
            consoleErrors: consoleErrors.length,
            ga4NetworkRequests: networkRequests.length,
            screenshot: screenshotName
          };

          this.results.tests.push(testResult);

          if (testResult.status === 'FAIL') {
            this.results.metrics.critical_issues++;
            this.results.metrics.all_tests_pass = false;
          }

          if (consoleErrors.length > 0) {
            this.results.metrics.warnings += consoleErrors.length;
          }

          console.log(`${testResult.status === 'PASS' ? '✅' : '❌'} ${fullUrl}`);

        } catch (error) {
          console.error(`❌ Error validating ${fullUrl}:`, error.message);
          this.results.tests.push({
            name: `page-validation-${pagePath.replace(/[^a-z0-9]/gi, '_')}`,
            url: fullUrl,
            status: 'FAIL',
            error: error.message
          });
          this.results.metrics.critical_issues++;
          this.results.metrics.all_tests_pass = false;
        }

        await page.close();
      }

    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async validateSitemapRobots() {
    console.log('🗺️ Validating sitemap.xml...');
    const sitemapResult = await this.testHttpUrl(`${CONFIG.baseUrl}/sitemap.xml`);
    this.results.tests.push({
      name: 'sitemap-200',
      status: sitemapResult.status === 200 ? 'PASS' : 'FAIL',
      response: {
        status: sitemapResult.status,
        hasUrlSet: sitemapResult.hasUrlSet,
        size: sitemapResult.size
      }
    });

    console.log('🤖 Validating robots.txt...');
    const robotsResult = await this.testHttpUrl(`${CONFIG.baseUrl}/robots.txt`);
    this.results.tests.push({
      name: 'robots-200',
      status: robotsResult.status === 200 ? 'PASS' : 'FAIL',
      content: {
        status: robotsResult.status,
        hasSitemap: robotsResult.hasUrlSet,
        size: robotsResult.size
      }
    });

    if (sitemapResult.status !== 200) {
      this.results.metrics.critical_issues++;
      this.results.metrics.all_tests_pass = false;
    }

    if (robotsResult.status !== 200) {
      this.results.metrics.critical_issues++;
      this.results.metrics.all_tests_pass = false;
    }
  }

  async runValidation() {
    console.log('🚀 Starting Simple QA Validation Suite...');
    console.log(`🎯 Target: ${CONFIG.baseUrl}`);
    
    try {
      // Test sitemap and robots
      await this.validateSitemapRobots();
      
      // Test pages with Puppeteer
      await this.validateWithPuppeteer();

      // Calculate final score
      const passedTests = this.results.tests.filter(t => t.status === 'PASS').length;
      const totalTests = this.results.tests.length;
      this.results.metrics.qa_score = `${Math.round((passedTests / totalTests) * 100)}%`;

      // Save results
      const reportPath = path.join(process.cwd(), 'reports/qa.json');
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

      console.log('\n📊 QA Validation Complete!');
      console.log(`✅ Passed: ${passedTests}/${totalTests}`);
      console.log(`🚨 Critical Issues: ${this.results.metrics.critical_issues}`);
      console.log(`⚠️ Warnings: ${this.results.metrics.warnings}`);
      console.log(`📈 QA Score: ${this.results.metrics.qa_score}`);

      return this.results;

    } catch (error) {
      console.error('❌ QA Validation failed:', error);
      this.results.metrics.all_tests_pass = false;
      this.results.metrics.critical_issues++;
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new SimpleQAValidator();
  validator.runValidation()
    .then(results => {
      process.exit(results.metrics.all_tests_pass ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = SimpleQAValidator;