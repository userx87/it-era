#!/usr/bin/env node
/**
 * Playwright Validator for IT-ERA Production
 * Tests navigation consistency and core functionality
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  baseUrl: 'https://it-era.it',
  timeout: 30000,
  keyRoutes: [
    '/',
    '/assistenza-informatica-bergamo.html',
    '/sicurezza-informatica-milano.html',
    '/cloud-storage-monza.html',
    '/riparazione-pc-como.html'
  ]
};

class PlaywrightValidator {
  constructor() {
    this.browser = null;
    this.results = {
      tests: [],
      metrics: {
        all_tests_pass: true,
        total_pages_tested: 0,
        navigation_consistency: true,
        console_errors_found: 0
      }
    };
  }

  async initialize() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox']
    });
  }

  async testNavigationConsistency() {
    const page = await this.browser.newPage();
    const navStructures = [];

    for (const route of CONFIG.keyRoutes) {
      const url = `${CONFIG.baseUrl}${route}`;
      
      try {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        const navData = await page.evaluate(() => {
          const nav = document.querySelector('nav, .navbar, .navigation');
          if (!nav) return null;

          const links = Array.from(nav.querySelectorAll('a')).map(link => ({
            href: link.getAttribute('href'),
            text: link.textContent.trim(),
            visible: link.offsetParent !== null
          }));

          return {
            linksCount: links.length,
            links: links.slice(0, 10), // First 10 links for comparison
            hasLogo: !!nav.querySelector('img, .logo'),
            structure: nav.className
          };
        });

        navStructures.push({ url, navData });

      } catch (error) {
        navStructures.push({ url, error: error.message });
      }
    }

    await page.close();

    // Check consistency
    const firstNavStructure = navStructures[0]?.navData;
    const isConsistent = navStructures.every(item => 
      item.navData && 
      item.navData.linksCount === firstNavStructure?.linksCount
    );

    this.results.tests.push({
      name: 'nav-consistency',
      status: isConsistent ? 'PASS' : 'FAIL',
      details: {
        consistent: isConsistent,
        structures: navStructures,
        referenceLinksCount: firstNavStructure?.linksCount || 0
      }
    });

    this.results.metrics.navigation_consistency = isConsistent;
    if (!isConsistent) {
      this.results.metrics.all_tests_pass = false;
    }

    return navStructures;
  }

  async testConsoleErrors() {
    const page = await this.browser.newPage();
    const allErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        allErrors.push({
          url: page.url(),
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    for (const route of CONFIG.keyRoutes) {
      const url = `${CONFIG.baseUrl}${route}`;
      
      try {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000); // Wait for any async errors
      } catch (error) {
        allErrors.push({
          url,
          message: `Navigation error: ${error.message}`,
          timestamp: new Date().toISOString(),
          type: 'navigation'
        });
      }
    }

    await page.close();

    this.results.tests.push({
      name: 'console-errors',
      status: allErrors.length === 0 ? 'PASS' : 'FAIL',
      details: {
        errorCount: allErrors.length,
        errors: allErrors.slice(0, 5) // First 5 errors
      }
    });

    this.results.metrics.console_errors_found = allErrors.length;
    if (allErrors.length > 0) {
      this.results.metrics.all_tests_pass = false;
    }

    return allErrors;
  }

  async testGA4Network() {
    const page = await this.browser.newPage();
    const ga4Requests = [];

    page.on('response', response => {
      const url = response.url();
      if (url.includes('google-analytics.com') || 
          url.includes('/g/collect') || 
          url.includes('/collect') ||
          url.includes('gtag') ||
          url.includes('gtm')) {
        ga4Requests.push({
          url,
          status: response.status(),
          method: response.request().method(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Test homepage for GA4
    await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Wait for GA4 to fire

    await page.close();

    const hasGA4Traffic = ga4Requests.length > 0;
    const hasCollectRequests = ga4Requests.some(req => 
      req.url.includes('/collect') || req.url.includes('/g/collect')
    );

    this.results.tests.push({
      name: 'ga4-network',
      status: hasGA4Traffic && hasCollectRequests ? 'PASS' : 'FAIL',
      evidence: {
        totalRequests: ga4Requests.length,
        collectRequests: ga4Requests.filter(req => 
          req.url.includes('/collect') || req.url.includes('/g/collect')
        ).length,
        requests: ga4Requests.slice(0, 3) // First 3 requests
      }
    });

    if (!hasGA4Traffic || !hasCollectRequests) {
      this.results.metrics.all_tests_pass = false;
    }

    return ga4Requests;
  }

  async runValidation() {
    console.log('🎭 Starting Playwright Validation...');
    
    await this.initialize();

    try {
      // Test navigation consistency
      console.log('🧭 Testing navigation consistency...');
      await this.testNavigationConsistency();

      // Test console errors
      console.log('🚨 Testing console errors...');
      await this.testConsoleErrors();

      // Test GA4 network requests
      console.log('📊 Testing GA4 network requests...');
      await this.testGA4Network();

      this.results.metrics.total_pages_tested = CONFIG.keyRoutes.length;

    } finally {
      await this.browser.close();
    }

    // Save results
    const reportPath = path.join(process.cwd(), 'reports/data/playwright-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log('✅ Playwright validation complete!');
    return this.results;
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new PlaywrightValidator();
  validator.runValidation()
    .then(results => {
      console.log('\n📋 Playwright Results Summary:');
      console.log(`✅ All tests passed: ${results.metrics.all_tests_pass}`);
      console.log(`🧭 Navigation consistent: ${results.metrics.navigation_consistency}`);
      console.log(`🚨 Console errors: ${results.metrics.console_errors_found}`);
      process.exit(results.metrics.all_tests_pass ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Playwright validation failed:', error);
      process.exit(1);
    });
}

module.exports = PlaywrightValidator;