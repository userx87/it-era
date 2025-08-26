#!/usr/bin/env node
/**
 * IT-ERA Quality Assurance with Puppeteer
 * Comprehensive testing for H1, meta, word count, navigation, and GA4
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ITERAQualityAssurance {
  constructor(options = {}) {
    this.options = {
      headless: true,
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (compatible; ITERA-QA-Bot/1.0)',
      viewport: { width: 1366, height: 768 },
      outputDir: './qa-reports',
      ...options
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async initialize() {
    console.log('🚀 Starting IT-ERA QA Tests...');
    
    this.browser = await puppeteer.launch({
      headless: this.options.headless,
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

    this.page = await this.browser.newPage();
    await this.page.setUserAgent(this.options.userAgent);
    await this.page.setViewport(this.options.viewport);

    // Setup console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Error:', msg.text());
      }
    });
  }

  async testPage(url, testName = '') {
    console.log(`📄 Testing: ${url}`);
    
    const test = {
      url,
      testName: testName || url,
      timestamp: new Date().toISOString(),
      results: {},
      status: 'pending',
      duration: 0
    };

    const startTime = Date.now();

    try {
      // Navigate to page
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.options.timeout
      });

      // Run all tests
      test.results.h1 = await this.testH1();
      test.results.meta = await this.testMeta();
      test.results.wordCount = await this.testWordCount();
      test.results.navigation = await this.testNavigation();
      test.results.ga4 = await this.testGA4();
      test.results.performance = await this.testPerformance();
      test.results.accessibility = await this.testAccessibility();

      // Calculate overall status
      test.status = this.calculateTestStatus(test.results);
      test.duration = Date.now() - startTime;

      this.results.tests.push(test);
      this.updateSummary(test.status);

      console.log(`✅ ${url} - ${test.status.toUpperCase()} (${test.duration}ms)`);

    } catch (error) {
      test.status = 'error';
      test.error = error.message;
      test.duration = Date.now() - startTime;
      
      this.results.tests.push(test);
      this.updateSummary('failed');

      console.log(`❌ ${url} - ERROR: ${error.message}`);
    }

    return test;
  }

  async testH1() {
    const h1Elements = await this.page.$$eval('h1', elements => 
      elements.map(el => ({
        text: el.textContent.trim(),
        visible: el.offsetHeight > 0 && el.offsetWidth > 0
      }))
    );

    const visibleH1s = h1Elements.filter(h1 => h1.visible);

    return {
      status: visibleH1s.length === 1 ? 'pass' : 'fail',
      count: visibleH1s.length,
      h1s: visibleH1s,
      message: visibleH1s.length === 1 
        ? 'Single H1 found' 
        : `Expected 1 H1, found ${visibleH1s.length}`,
      recommendation: visibleH1s.length !== 1 
        ? 'Ensure exactly one visible H1 per page for SEO' 
        : null
    };
  }

  async testMeta() {
    const metaData = await this.page.evaluate(() => {
      const getMetaContent = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.getAttribute('content') : null;
      };

      return {
        title: document.title,
        description: getMetaContent('meta[name="description"]'),
        keywords: getMetaContent('meta[name="keywords"]'),
        viewport: getMetaContent('meta[name="viewport"]'),
        robots: getMetaContent('meta[name="robots"]'),
        ogTitle: getMetaContent('meta[property="og:title"]'),
        ogDescription: getMetaContent('meta[property="og:description"]'),
        ogImage: getMetaContent('meta[property="og:image"]')
      };
    });

    const issues = [];
    
    if (!metaData.title || metaData.title.length < 10) {
      issues.push('Title too short (min 10 chars)');
    }
    if (metaData.title && metaData.title.length > 60) {
      issues.push('Title too long (max 60 chars)');
    }
    if (!metaData.description || metaData.description.length < 120) {
      issues.push('Description too short (min 120 chars)');
    }
    if (metaData.description && metaData.description.length > 160) {
      issues.push('Description too long (max 160 chars)');
    }
    if (!metaData.viewport) {
      issues.push('Missing viewport meta tag');
    }

    return {
      status: issues.length === 0 ? 'pass' : 'fail',
      data: metaData,
      issues,
      message: issues.length === 0 
        ? 'All meta tags properly configured' 
        : `${issues.length} meta tag issues found`
    };
  }

  async testWordCount() {
    const content = await this.page.evaluate(() => {
      // Remove script and style elements
      const elementsToRemove = ['script', 'style', 'nav', 'header', 'footer'];
      elementsToRemove.forEach(tag => {
        const elements = document.getElementsByTagName(tag);
        for (let i = elements.length - 1; i >= 0; i--) {
          elements[i].remove();
        }
      });

      const bodyText = document.body.innerText || document.body.textContent;
      const words = bodyText.trim().split(/\s+/).filter(word => word.length > 0);
      
      return {
        wordCount: words.length,
        characterCount: bodyText.length,
        readingTime: Math.ceil(words.length / 200) // 200 WPM average
      };
    });

    const minWords = 300;
    const optimalWords = 600;

    return {
      status: content.wordCount >= minWords ? 'pass' : 'fail',
      ...content,
      message: content.wordCount >= optimalWords 
        ? 'Excellent content length' 
        : content.wordCount >= minWords 
          ? 'Good content length' 
          : `Too short (${content.wordCount} words, min ${minWords})`,
      recommendation: content.wordCount < minWords 
        ? 'Add more valuable content for better SEO' 
        : null
    };
  }

  async testNavigation() {
    const navigation = await this.page.evaluate(() => {
      const navElements = document.querySelectorAll('nav, .navbar, .navigation, .menu');
      const links = [];
      
      navElements.forEach(nav => {
        const navLinks = nav.querySelectorAll('a[href]');
        navLinks.forEach(link => {
          links.push({
            text: link.textContent.trim(),
            href: link.getAttribute('href'),
            visible: link.offsetHeight > 0 && link.offsetWidth > 0
          });
        });
      });

      return {
        navigationElements: navElements.length,
        totalLinks: links.length,
        visibleLinks: links.filter(link => link.visible).length,
        links: links.filter(link => link.visible)
      };
    });

    const expectedLinks = [
      'Commercialisti', 'Studi Legali', 'PMI', 'Medici',
      'Assistenza IT', 'Sicurezza Informatica', 'Cloud Storage',
      'Blog', 'Contatti'
    ];

    const foundExpectedLinks = expectedLinks.filter(expected =>
      navigation.links.some(link => 
        link.text.toLowerCase().includes(expected.toLowerCase())
      )
    );

    return {
      status: foundExpectedLinks.length >= 7 ? 'pass' : 'fail',
      ...navigation,
      expectedLinks: expectedLinks.length,
      foundExpectedLinks: foundExpectedLinks.length,
      message: `Found ${foundExpectedLinks.length}/${expectedLinks.length} expected navigation links`,
      recommendation: foundExpectedLinks.length < 7 
        ? 'Ensure all main navigation links are present and visible' 
        : null
    };
  }

  async testGA4() {
    const ga4Status = await this.page.evaluate(() => {
      const hasGtag = typeof window.gtag === 'function';
      const hasDataLayer = Array.isArray(window.dataLayer);
      const hasGAScript = !!document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
      const hasGTMScript = !!document.querySelector('script[src*="googletagmanager.com/gtm.js"]');
      const hasGTMNoScript = !!document.querySelector('noscript iframe[src*="googletagmanager.com/ns.html"]');

      return {
        gtag: hasGtag,
        dataLayer: hasDataLayer,
        gaScript: hasGAScript,
        gtmScript: hasGTMScript,
        gtmNoscript: hasGTMNoScript,
        dataLayerLength: window.dataLayer ? window.dataLayer.length : 0
      };
    });

    const requiredComponents = ['gtag', 'dataLayer', 'gaScript'];
    const presentComponents = requiredComponents.filter(component => ga4Status[component]);

    return {
      status: presentComponents.length >= 2 ? 'pass' : 'fail',
      ...ga4Status,
      requiredComponents,
      presentComponents,
      message: `${presentComponents.length}/${requiredComponents.length} GA4 components detected`,
      recommendation: presentComponents.length < 2 
        ? 'Ensure GA4 tracking is properly implemented' 
        : null
    };
  }

  async testPerformance() {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });

    const imageCount = await this.page.$$eval('img', imgs => imgs.length);
    const cssCount = await this.page.$$eval('link[rel="stylesheet"]', links => links.length);
    const jsCount = await this.page.$$eval('script[src]', scripts => scripts.length);

    const status = metrics.firstContentfulPaint < 2500 && imageCount < 20 ? 'pass' : 'warn';

    return {
      status,
      ...metrics,
      resources: {
        images: imageCount,
        css: cssCount,
        javascript: jsCount
      },
      message: `FCP: ${Math.round(metrics.firstContentfulPaint)}ms, ${imageCount} images`,
      recommendation: status === 'warn' 
        ? 'Consider optimizing images and reducing resource count' 
        : null
    };
  }

  async testAccessibility() {
    const a11y = await this.page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt'));
      
      const forms = document.querySelectorAll('form');
      const inputsWithoutLabels = [];
      
      forms.forEach(form => {
        const inputs = form.querySelectorAll('input[type="text"], input[type="email"], textarea');
        inputs.forEach(input => {
          const hasLabel = input.getAttribute('aria-label') || 
                          document.querySelector(`label[for="${input.id}"]`) ||
                          input.closest('label');
          if (!hasLabel) {
            inputsWithoutLabels.push(input.type || 'input');
          }
        });
      });

      return {
        totalImages: images.length,
        imagesWithoutAlt: imagesWithoutAlt.length,
        inputsWithoutLabels: inputsWithoutLabels.length,
        hasSkipLink: !!document.querySelector('a[href="#main"], a[href="#content"]')
      };
    });

    const issues = [];
    if (a11y.imagesWithoutAlt > 0) issues.push(`${a11y.imagesWithoutAlt} images without alt text`);
    if (a11y.inputsWithoutLabels > 0) issues.push(`${a11y.inputsWithoutLabels} inputs without labels`);
    if (!a11y.hasSkipLink) issues.push('No skip link found');

    return {
      status: issues.length === 0 ? 'pass' : 'warn',
      ...a11y,
      issues,
      message: issues.length === 0 
        ? 'No accessibility issues found' 
        : `${issues.length} accessibility issues detected`
    };
  }

  calculateTestStatus(results) {
    const statuses = Object.values(results).map(result => result.status);
    
    if (statuses.includes('fail')) return 'failed';
    if (statuses.includes('warn')) return 'warning';
    if (statuses.every(status => status === 'pass')) return 'passed';
    
    return 'unknown';
  }

  updateSummary(status) {
    this.results.summary.total++;
    
    switch (status) {
      case 'passed':
        this.results.summary.passed++;
        break;
      case 'failed':
        this.results.summary.failed++;
        break;
      case 'warning':
        this.results.summary.warnings++;
        break;
    }
  }

  async generateReport() {
    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    const reportPath = path.join(
      this.options.outputDir, 
      `qa-report-${Date.now()}.json`
    );

    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log(`\n📊 QA Report Generated:`);
    console.log(`   Total Tests: ${this.results.summary.total}`);
    console.log(`   ✅ Passed: ${this.results.summary.passed}`);
    console.log(`   ⚠️  Warnings: ${this.results.summary.warnings}`);
    console.log(`   ❌ Failed: ${this.results.summary.failed}`);
    console.log(`   📄 Report: ${reportPath}`);

    return reportPath;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Static method for quick testing
  static async quickTest(urls) {
    const qa = new ITERAQualityAssurance();
    await qa.initialize();

    for (const url of urls) {
      await qa.testPage(url);
    }

    await qa.generateReport();
    await qa.close();

    return qa.results;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const urls = args.length > 0 ? args : [
    'http://localhost:3000',
    'http://localhost:3000/assistenza-it',
    'http://localhost:3000/sicurezza-informatica',
    'http://localhost:3000/pages/settori-commercialisti'
  ];

  ITERAQualityAssurance.quickTest(urls)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ QA Test Failed:', error);
      process.exit(1);
    });
}

module.exports = ITERAQualityAssurance;