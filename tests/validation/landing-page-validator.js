const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class LandingPageValidator {
  constructor() {
    this.browser = null;
    this.results = [];
    this.testUrls = [
      'https://13d750b1.it-era.pages.dev/pages/assistenza-it-milano',
      'https://13d750b1.it-era.pages.dev/pages/sicurezza-informatica-bergamo',
      'https://13d750b1.it-era.pages.dev/pages/cloud-storage-como',
      'https://13d750b1.it-era.pages.dev/pages/assistenza-it-lecco',
      'https://13d750b1.it-era.pages.dev/pages/sicurezza-informatica-monza',
      // Additional random samples
      'https://13d750b1.it-era.pages.dev/pages/assistenza-it-brescia',
      'https://13d750b1.it-era.pages.dev/pages/cloud-storage-mantova',
      'https://13d750b1.it-era.pages.dev/pages/sicurezza-informatica-varese',
      'https://13d750b1.it-era.pages.dev/pages/assistenza-it-pavia',
      'https://13d750b1.it-era.pages.dev/pages/cloud-storage-cremona'
    ];
  }

  async init() {
    this.browser = await puppeteer.launch({
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
  }

  async validatePage(url) {
    const page = await this.browser.newPage();
    const result = {
      url,
      timestamp: new Date().toISOString(),
      tests: {},
      score: 0,
      maxScore: 0,
      errors: [],
      warnings: []
    };

    try {
      // Set viewport for mobile testing
      await page.setViewport({ width: 1920, height: 1080 });

      console.log(`Testing: ${url}`);

      // Test 1: Page Loading
      result.tests.pageLoading = await this.testPageLoading(page, url);
      
      // Test 2: Placeholder Replacement
      result.tests.placeholderReplacement = await this.testPlaceholderReplacement(page, url);
      
      // Test 3: Contact Form
      result.tests.contactForm = await this.testContactForm(page);
      
      // Test 4: Logo and Images
      result.tests.imagesLoading = await this.testImagesLoading(page);
      
      // Test 5: Navigation Menu
      result.tests.navigationMenu = await this.testNavigationMenu(page);
      
      // Test 6: Mobile Responsiveness
      result.tests.mobileResponsiveness = await this.testMobileResponsiveness(page);
      
      // Test 7: Performance
      result.tests.performance = await this.testPerformance(page, url);

      // Calculate overall score
      this.calculateScore(result);

    } catch (error) {
      result.errors.push(`General test error: ${error.message}`);
      console.error(`Error testing ${url}:`, error);
    } finally {
      await page.close();
    }

    return result;
  }

  async testPageLoading(page, url) {
    const test = { name: 'Page Loading', passed: false, details: {}, weight: 15 };
    
    try {
      const startTime = Date.now();
      
      // Navigate to page and wait for network idle
      const response = await page.goto(url, { 
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000 
      });
      
      const loadTime = Date.now() - startTime;
      
      test.details.loadTime = loadTime;
      test.details.statusCode = response.status();
      test.details.loadTimeUnder3s = loadTime < 3000;
      
      // Check for JavaScript errors
      const jsErrors = [];
      page.on('pageerror', error => jsErrors.push(error.message));
      
      // Wait a bit to catch any delayed errors
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      test.details.jsErrors = jsErrors;
      test.details.hasJsErrors = jsErrors.length > 0;
      
      // Check if page loaded successfully
      test.passed = response.status() === 200 && !test.details.hasJsErrors;
      
      if (loadTime >= 3000) {
        test.warning = `Load time ${loadTime}ms exceeds 3 second target`;
      }
      
    } catch (error) {
      test.details.error = error.message;
      test.passed = false;
    }
    
    return test;
  }

  async testPlaceholderReplacement(page, url) {
    const test = { name: 'Placeholder Replacement', passed: false, details: {}, weight: 20 };
    
    try {
      // Extract expected city name from URL
      const urlParts = url.split('/').pop().split('.')[0];
      const cityFromUrl = urlParts.split('-').slice(-1)[0];
      const expectedCity = this.formatCityName(cityFromUrl);
      
      test.details.expectedCity = expectedCity;
      test.details.cityFromUrl = cityFromUrl;
      
      // Get page content
      const pageContent = await page.content();
      
      // Check for unreplaced placeholders
      const placeholderPattern = /\{\{[^}]+\}\}/g;
      const unreplacedPlaceholders = pageContent.match(placeholderPattern) || [];
      
      test.details.unreplacedPlaceholders = unreplacedPlaceholders;
      test.details.hasUnreplacedPlaceholders = unreplacedPlaceholders.length > 0;
      
      // Check if city name appears in title and content
      const title = await page.title();
      const h1Text = await page.$eval('h1', el => el.textContent).catch(() => '');
      
      test.details.title = title;
      test.details.h1Text = h1Text;
      test.details.cityInTitle = title.toLowerCase().includes(expectedCity.toLowerCase());
      test.details.cityInH1 = h1Text.toLowerCase().includes(expectedCity.toLowerCase());
      
      // Check meta description
      const metaDescription = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
      test.details.metaDescription = metaDescription;
      test.details.cityInMeta = metaDescription.toLowerCase().includes(expectedCity.toLowerCase());
      
      test.passed = !test.details.hasUnreplacedPlaceholders && 
                    test.details.cityInTitle && 
                    test.details.cityInH1;
      
    } catch (error) {
      test.details.error = error.message;
      test.passed = false;
    }
    
    return test;
  }

  async testContactForm(page) {
    const test = { name: 'Contact Form Functionality', passed: false, details: {}, weight: 15 };
    
    try {
      // Look for contact form
      const formExists = await page.$('form') !== null;
      test.details.formExists = formExists;
      
      if (formExists) {
        // Check for required form fields
        const nameField = await page.$('input[name="name"], input[name="nome"]') !== null;
        const emailField = await page.$('input[name="email"], input[type="email"]') !== null;
        const messageField = await page.$('textarea[name="message"], textarea[name="messaggio"]') !== null;
        const submitButton = await page.$('input[type="submit"], button[type="submit"]') !== null;
        
        test.details.hasNameField = nameField;
        test.details.hasEmailField = emailField;
        test.details.hasMessageField = messageField;
        test.details.hasSubmitButton = submitButton;
        
        // Test form validation (try to submit empty form)
        if (submitButton) {
          try {
            await page.click('input[type="submit"], button[type="submit"]');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check if validation messages appear
            const validationMessages = await page.$$eval('input:invalid', els => els.length);
            test.details.hasValidation = validationMessages > 0;
          } catch (e) {
            test.details.validationError = e.message;
          }
        }
        
        test.passed = nameField && emailField && messageField && submitButton;
      } else {
        test.passed = false;
        test.details.error = 'No contact form found on page';
      }
      
    } catch (error) {
      test.details.error = error.message;
      test.passed = false;
    }
    
    return test;
  }

  async testImagesLoading(page) {
    const test = { name: 'Images and Logo Loading', passed: false, details: {}, weight: 10 };
    
    try {
      // Get all images on the page
      const images = await page.$$eval('img', imgs => 
        imgs.map(img => ({
          src: img.src,
          alt: img.alt,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete
        }))
      );
      
      test.details.totalImages = images.length;
      test.details.images = images;
      
      // Check for broken images
      const brokenImages = images.filter(img => !img.complete || img.naturalWidth === 0);
      test.details.brokenImages = brokenImages;
      test.details.brokenImageCount = brokenImages.length;
      
      // Look for logo specifically
      const logoExists = images.some(img => 
        img.src.toLowerCase().includes('logo') || 
        img.alt.toLowerCase().includes('logo') ||
        img.alt.toLowerCase().includes('it-era')
      );
      test.details.logoExists = logoExists;
      
      // Check for missing alt attributes
      const imagesWithoutAlt = images.filter(img => !img.alt || img.alt.trim() === '');
      test.details.imagesWithoutAlt = imagesWithoutAlt.length;
      
      test.passed = brokenImages.length === 0 && logoExists;
      
      if (imagesWithoutAlt.length > 0) {
        test.warning = `${imagesWithoutAlt.length} images missing alt attributes`;
      }
      
    } catch (error) {
      test.details.error = error.message;
      test.passed = false;
    }
    
    return test;
  }

  async testNavigationMenu(page) {
    const test = { name: 'Navigation Menu', passed: false, details: {}, weight: 10 };
    
    try {
      // Look for navigation elements
      const navExists = await page.$('nav, .nav, .navbar, .menu') !== null;
      test.details.navExists = navExists;
      
      if (navExists) {
        // Get navigation links
        const navLinks = await page.$$eval('nav a, .nav a, .navbar a, .menu a', links =>
          links.map(link => ({
            href: link.href,
            text: link.textContent.trim(),
            hasHref: !!link.href
          }))
        ).catch(() => []);
        
        test.details.navLinks = navLinks;
        test.details.navLinkCount = navLinks.length;
        
        // Check for working links (have href attributes)
        const workingLinks = navLinks.filter(link => link.hasHref && link.href !== '#');
        test.details.workingLinks = workingLinks.length;
        
        // Test mobile menu toggle if exists
        const mobileToggle = await page.$('.navbar-toggle, .menu-toggle, .hamburger') !== null;
        test.details.hasMobileToggle = mobileToggle;
        
        test.passed = navLinks.length > 0 && workingLinks.length > 0;
      } else {
        test.passed = false;
        test.details.error = 'No navigation menu found';
      }
      
    } catch (error) {
      test.details.error = error.message;
      test.passed = false;
    }
    
    return test;
  }

  async testMobileResponsiveness(page) {
    const test = { name: 'Mobile Responsiveness', passed: false, details: {}, weight: 15 };
    
    try {
      // Test different viewport sizes
      const viewports = [
        { width: 375, height: 667, device: 'iPhone SE' },
        { width: 768, height: 1024, device: 'iPad' },
        { width: 1920, height: 1080, device: 'Desktop' }
      ];
      
      test.details.viewportTests = [];
      
      for (const viewport of viewports) {
        await page.setViewport({ width: viewport.width, height: viewport.height });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for responsive changes
        
        // Check if content fits in viewport
        const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const bodyScrollHeight = await page.evaluate(() => document.body.scrollHeight);
        
        const fitsHorizontally = bodyScrollWidth <= viewport.width + 20; // 20px tolerance
        const hasVerticalScroll = bodyScrollHeight > viewport.height;
        
        // Check for responsive meta tag
        const hasViewportMeta = await page.$('meta[name="viewport"]') !== null;
        
        const viewportTest = {
          device: viewport.device,
          width: viewport.width,
          height: viewport.height,
          fitsHorizontally,
          hasVerticalScroll,
          hasViewportMeta,
          bodyScrollWidth,
          bodyScrollHeight
        };
        
        test.details.viewportTests.push(viewportTest);
      }
      
      // Check if all viewports pass
      const mobileTest = test.details.viewportTests.find(t => t.device === 'iPhone SE');
      const tabletTest = test.details.viewportTests.find(t => t.device === 'iPad');
      
      test.passed = mobileTest?.fitsHorizontally && tabletTest?.fitsHorizontally && 
                    test.details.viewportTests[0]?.hasViewportMeta;
      
      // Reset to desktop viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
    } catch (error) {
      test.details.error = error.message;
      test.passed = false;
    }
    
    return test;
  }

  async testPerformance(page, url) {
    const test = { name: 'Performance Metrics', passed: false, details: {}, weight: 15 };
    
    try {
      // Enable performance monitoring
      await page.setCacheEnabled(false);
      
      const startTime = Date.now();
      
      // Fresh page load with performance metrics
      await page.goto(url, { waitUntil: 'networkidle0' });
      
      const endTime = Date.now();
      const totalLoadTime = endTime - startTime;
      
      // Get performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
        };
      });
      
      // Get resource loading info
      const resources = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map(resource => ({
          name: resource.name,
          size: resource.transferSize || 0,
          duration: resource.duration,
          type: resource.initiatorType
        }));
      });
      
      test.details.totalLoadTime = totalLoadTime;
      test.details.performanceMetrics = performanceMetrics;
      test.details.resourceCount = resources.length;
      test.details.totalTransferSize = resources.reduce((sum, r) => sum + r.size, 0);
      
      // Performance criteria
      const loadTimeGood = totalLoadTime < 3000;
      const fcpGood = performanceMetrics.firstContentfulPaint < 2000;
      const resourceSizeReasonable = test.details.totalTransferSize < 3 * 1024 * 1024; // 3MB
      
      test.details.loadTimeGood = loadTimeGood;
      test.details.fcpGood = fcpGood;
      test.details.resourceSizeReasonable = resourceSizeReasonable;
      
      test.passed = loadTimeGood && fcpGood && resourceSizeReasonable;
      
    } catch (error) {
      test.details.error = error.message;
      test.passed = false;
    }
    
    return test;
  }

  calculateScore(result) {
    let totalScore = 0;
    let maxScore = 0;
    
    for (const [testName, testResult] of Object.entries(result.tests)) {
      maxScore += testResult.weight;
      if (testResult.passed) {
        totalScore += testResult.weight;
      } else if (testResult.warning) {
        totalScore += testResult.weight * 0.5; // Half points for warnings
      }
    }
    
    result.score = totalScore;
    result.maxScore = maxScore;
    result.percentage = Math.round((totalScore / maxScore) * 100);
  }

  formatCityName(citySlug) {
    return citySlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async runValidation() {
    console.log('Starting landing page validation...');
    console.log(`Testing ${this.testUrls.length} pages`);
    
    await this.init();
    
    for (const url of this.testUrls) {
      const result = await this.validatePage(url);
      this.results.push(result);
    }
    
    await this.browser.close();
    
    // Generate summary report
    this.generateReport();
    
    return this.results;
  }

  generateReport() {
    console.log('\n=== LANDING PAGE VALIDATION REPORT ===\n');
    
    const totalPages = this.results.length;
    const passedPages = this.results.filter(r => r.percentage >= 80).length;
    const failedPages = this.results.filter(r => r.percentage < 60).length;
    const warningPages = totalPages - passedPages - failedPages;
    
    console.log(`Total Pages Tested: ${totalPages}`);
    console.log(`✅ Passed (≥80%): ${passedPages}`);
    console.log(`⚠️  Warnings (60-79%): ${warningPages}`);
    console.log(`❌ Failed (<60%): ${failedPages}`);
    console.log(`Success Rate: ${Math.round((passedPages / totalPages) * 100)}%\n`);
    
    // Overall statistics
    const avgScore = this.results.reduce((sum, r) => sum + r.percentage, 0) / totalPages;
    console.log(`Average Score: ${Math.round(avgScore)}%\n`);
    
    // Individual page results
    console.log('=== INDIVIDUAL PAGE RESULTS ===\n');
    
    this.results.forEach((result, index) => {
      const status = result.percentage >= 80 ? '✅' : result.percentage >= 60 ? '⚠️' : '❌';
      const city = result.url.split('/').pop().split('.')[0].split('-').slice(-1)[0];
      
      console.log(`${status} ${city.toUpperCase()} - ${result.percentage}% (${result.score}/${result.maxScore})`);
      console.log(`   URL: ${result.url}`);
      
      // Show failed tests
      const failedTests = Object.entries(result.tests).filter(([_, test]) => !test.passed);
      if (failedTests.length > 0) {
        console.log(`   Failed Tests: ${failedTests.map(([name]) => name).join(', ')}`);
      }
      
      // Show warnings
      const warnings = Object.entries(result.tests).filter(([_, test]) => test.warning);
      if (warnings.length > 0) {
        console.log(`   Warnings: ${warnings.map(([_, test]) => test.warning).join('; ')}`);
      }
      
      // Show errors
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join('; ')}`);
      }
      
      console.log('');
    });
    
    // Test category summary
    console.log('=== TEST CATEGORY PERFORMANCE ===\n');
    
    const testCategories = {};
    this.results.forEach(result => {
      Object.entries(result.tests).forEach(([testName, testResult]) => {
        if (!testCategories[testName]) {
          testCategories[testName] = { passed: 0, total: 0 };
        }
        testCategories[testName].total++;
        if (testResult.passed) testCategories[testName].passed++;
      });
    });
    
    Object.entries(testCategories).forEach(([testName, stats]) => {
      const percentage = Math.round((stats.passed / stats.total) * 100);
      const status = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌';
      console.log(`${status} ${testName}: ${percentage}% (${stats.passed}/${stats.total})`);
    });
    
    // Critical issues
    console.log('\n=== CRITICAL ISSUES ===\n');
    
    const criticalIssues = [];
    this.results.forEach(result => {
      // Check for unreplaced placeholders
      if (result.tests.placeholderReplacement && !result.tests.placeholderReplacement.passed) {
        if (result.tests.placeholderReplacement.details.hasUnreplacedPlaceholders) {
          criticalIssues.push(`${result.url}: Unreplaced placeholders found`);
        }
      }
      
      // Check for broken images
      if (result.tests.imagesLoading && !result.tests.imagesLoading.passed) {
        if (result.tests.imagesLoading.details.brokenImageCount > 0) {
          criticalIssues.push(`${result.url}: ${result.tests.imagesLoading.details.brokenImageCount} broken images`);
        }
      }
      
      // Check for page loading failures
      if (result.tests.pageLoading && !result.tests.pageLoading.passed) {
        criticalIssues.push(`${result.url}: Page loading failed`);
      }
    });
    
    if (criticalIssues.length > 0) {
      criticalIssues.forEach(issue => console.log(`❌ ${issue}`));
    } else {
      console.log('✅ No critical issues found!');
    }
    
    console.log('\n=== END REPORT ===\n');
  }

  // Save detailed results to JSON file
  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tests/validation/validation-results-${timestamp}.json`;
    
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPages: this.results.length,
        passedPages: this.results.filter(r => r.percentage >= 80).length,
        failedPages: this.results.filter(r => r.percentage < 60).length,
        averageScore: Math.round(this.results.reduce((sum, r) => sum + r.percentage, 0) / this.results.length)
      },
      results: this.results
    };
    
    fs.writeFileSync(filename, JSON.stringify(reportData, null, 2));
    console.log(`Detailed results saved to: ${filename}`);
  }
}

module.exports = LandingPageValidator;