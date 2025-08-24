const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class PCRepairValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'https://65e7c6fa.it-era.pages.dev/pages';
    this.testPages = [
      'riparazione-pc-milano.html',
      'riparazione-pc-bergamo.html',
      'riparazione-pc-segrate.html'
    ];
    this.results = {
      summary: {},
      detailedResults: [],
      screenshots: [],
      performanceMetrics: [],
      issues: []
    };
    this.screenshotDir = './screenshots';
    this.reportDir = './reports';
  }

  async initialize() {
    // Create directories
    await fs.ensureDir(this.screenshotDir);
    await fs.ensureDir(this.reportDir);

    // Launch browser with performance monitoring
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--enable-features=NetworkService,NetworkServiceLogging'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Enable performance monitoring
    await this.page.setCacheEnabled(false);
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  }

  async validatePage(pageName) {
    const url = `${this.baseUrl}/${pageName}`;
    const cityName = this.extractCityName(pageName);
    
    console.log(`\n🔍 Validating: ${cityName} - ${url}`);
    
    const pageResult = {
      page: pageName,
      city: cityName,
      url: url,
      timestamp: new Date().toISOString(),
      tests: {},
      performance: {},
      screenshots: {},
      issues: []
    };

    try {
      // Navigate to page with performance monitoring
      const navigationStart = Date.now();
      await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      const navigationEnd = Date.now();
      pageResult.performance.navigationTime = navigationEnd - navigationStart;

      // Wait for page to fully load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test 1: Check for 'gratuito' references
      pageResult.tests.gratuitoCheck = await this.checkGratuitoReferences();
      
      // Test 2: Validate placeholders replacement
      pageResult.tests.placeholderCheck = await this.checkPlaceholders(cityName);
      
      // Test 3: Test chatbot functionality
      pageResult.tests.chatbotTest = await this.testChatbot();
      
      // Test 4: Test contact forms
      pageResult.tests.contactFormTest = await this.testContactForms();
      
      // Test 5: Test mobile responsiveness
      pageResult.tests.mobileResponsiveness = await this.testMobileResponsiveness(pageName);
      
      // Test 6: Measure Core Web Vitals
      pageResult.performance.coreWebVitals = await this.measureCoreWebVitals();
      
      // Test 7: Accessibility checks
      pageResult.tests.accessibilityCheck = await this.checkAccessibility();
      
      // Test 8: SEO validation
      pageResult.tests.seoValidation = await this.validateSEO(cityName);
      
      // Capture main screenshot
      pageResult.screenshots.main = await this.captureScreenshot(pageName, 'main');
      
      // Calculate overall score
      pageResult.overallScore = this.calculateOverallScore(pageResult.tests);
      
    } catch (error) {
      console.error(`❌ Error validating ${pageName}:`, error.message);
      pageResult.error = error.message;
      pageResult.issues.push({
        type: 'critical',
        message: `Page validation failed: ${error.message}`
      });
    }

    return pageResult;
  }

  async checkGratuitoReferences() {
    console.log('  📝 Checking for "gratuito" references...');
    
    const gratuitoInstances = await this.page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const html = document.documentElement.outerHTML.toLowerCase();
      
      // Check for various forms of "gratuito"
      const patterns = [
        /gratuito/gi,
        /gratis/gi,
        /free/gi,
        /\bgratuita\b/gi,
        /\bgratuiti\b/gi,
        /\bgratuita\b/gi
      ];
      
      const found = [];
      patterns.forEach((pattern, index) => {
        const matches = html.match(pattern);
        if (matches) {
          found.push({
            pattern: pattern.source,
            count: matches.length,
            instances: matches
          });
        }
      });
      
      return found;
    });
    
    const hasIssues = gratuitoInstances.length > 0;
    if (hasIssues) {
      console.log(`    ❌ Found ${gratuitoInstances.length} "gratuito" pattern(s)`);
      gratuitoInstances.forEach(instance => {
        console.log(`      - Pattern: ${instance.pattern}, Count: ${instance.count}`);
      });
    } else {
      console.log('    ✅ No "gratuito" references found');
    }
    
    return {
      passed: !hasIssues,
      instances: gratuitoInstances,
      message: hasIssues ? `Found ${gratuitoInstances.length} "gratuito" references` : 'No "gratuito" references found'
    };
  }

  async checkPlaceholders(cityName) {
    console.log('  🔍 Checking placeholder replacement...');
    
    const placeholderCheck = await this.page.evaluate((expectedCity) => {
      const html = document.documentElement.outerHTML;
      const text = document.body.innerText;
      
      // Check for common placeholder patterns
      const placeholders = [
        /\{\{city\}\}/gi,
        /\{\{CITY\}\}/gi,
        /\[city\]/gi,
        /\[CITY\]/gi,
        /%CITY%/gi,
        /__CITY__/gi,
        /PLACEHOLDER/gi,
        /TODO:/gi,
        /TBD/gi
      ];
      
      const foundPlaceholders = [];
      placeholders.forEach(pattern => {
        const matches = html.match(pattern);
        if (matches) {
          foundPlaceholders.push({
            pattern: pattern.source,
            count: matches.length
          });
        }
      });
      
      // Check if city name is properly used
      const cityMentions = (text.match(new RegExp(expectedCity, 'gi')) || []).length;
      
      return {
        foundPlaceholders,
        cityMentions,
        expectedCity
      };
    }, cityName);
    
    const hasPlaceholderIssues = placeholderCheck.foundPlaceholders.length > 0;
    const hasCityMentions = placeholderCheck.cityMentions > 0;
    
    if (hasPlaceholderIssues) {
      console.log(`    ❌ Found ${placeholderCheck.foundPlaceholders.length} placeholder(s)`);
    } else {
      console.log('    ✅ No placeholders found');
    }
    
    if (hasCityMentions) {
      console.log(`    ✅ City "${cityName}" mentioned ${placeholderCheck.cityMentions} times`);
    } else {
      console.log(`    ⚠️  City "${cityName}" not found in content`);
    }
    
    return {
      passed: !hasPlaceholderIssues && hasCityMentions,
      placeholders: placeholderCheck.foundPlaceholders,
      cityMentions: placeholderCheck.cityMentions,
      message: hasPlaceholderIssues ? 
        `Found ${placeholderCheck.foundPlaceholders.length} placeholders` : 
        `All placeholders replaced, ${placeholderCheck.cityMentions} city mentions`
    };
  }

  async testChatbot() {
    console.log('  💬 Testing chatbot functionality...');
    
    try {
      // Look for chatbot elements
      const chatbotPresent = await this.page.evaluate(() => {
        // Common chatbot selectors
        const selectors = [
          '[id*="chat"]',
          '[class*="chat"]',
          '[id*="widget"]',
          '[class*="widget"]',
          'iframe[src*="chat"]',
          'iframe[src*="widget"]',
          '[data-chat]',
          '[data-widget]'
        ];
        
        let found = false;
        let foundSelector = '';
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            found = true;
            foundSelector = selector;
            break;
          }
        }
        
        return { found, selector: foundSelector };
      });
      
      if (chatbotPresent.found) {
        console.log(`    ✅ Chatbot found (${chatbotPresent.selector})`);
        
        // Try to interact with chatbot if visible
        try {
          await this.page.waitForSelector(chatbotPresent.selector, { timeout: 5000 });
          const isVisible = await this.page.isVisible(chatbotPresent.selector);
          
          return {
            passed: true,
            present: true,
            visible: isVisible,
            selector: chatbotPresent.selector,
            message: `Chatbot found and ${isVisible ? 'visible' : 'hidden'}`
          };
        } catch (e) {
          return {
            passed: true,
            present: true,
            visible: false,
            selector: chatbotPresent.selector,
            message: 'Chatbot found but not immediately visible'
          };
        }
      } else {
        console.log('    ⚠️  No chatbot found');
        return {
          passed: false,
          present: false,
          message: 'No chatbot elements detected'
        };
      }
    } catch (error) {
      console.log(`    ❌ Chatbot test failed: ${error.message}`);
      return {
        passed: false,
        error: error.message,
        message: 'Chatbot test failed'
      };
    }
  }

  async testContactForms() {
    console.log('  📝 Testing contact forms...');
    
    try {
      const formsTest = await this.page.evaluate(() => {
        const forms = document.querySelectorAll('form');
        const formData = [];
        
        forms.forEach((form, index) => {
          const inputs = form.querySelectorAll('input, textarea, select');
          const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
          
          const formInfo = {
            index,
            hasAction: !!form.action,
            action: form.action,
            method: form.method || 'GET',
            inputCount: inputs.length,
            hasSubmitButton: !!submitButton,
            inputs: Array.from(inputs).map(input => ({
              type: input.type || input.tagName.toLowerCase(),
              name: input.name,
              required: input.required,
              placeholder: input.placeholder
            }))
          };
          
          formData.push(formInfo);
        });
        
        return {
          formCount: forms.length,
          forms: formData
        };
      });
      
      const hasValidForms = formsTest.formCount > 0 && 
        formsTest.forms.some(form => form.hasAction && form.hasSubmitButton);
      
      if (hasValidForms) {
        console.log(`    ✅ Found ${formsTest.formCount} form(s) with proper configuration`);
      } else if (formsTest.formCount > 0) {
        console.log(`    ⚠️  Found ${formsTest.formCount} form(s) but with potential issues`);
      } else {
        console.log('    ❌ No forms found');
      }
      
      return {
        passed: hasValidForms,
        formCount: formsTest.formCount,
        forms: formsTest.forms,
        message: hasValidForms ? 
          `${formsTest.formCount} properly configured form(s)` : 
          `${formsTest.formCount} form(s) found but may have issues`
      };
    } catch (error) {
      console.log(`    ❌ Form test failed: ${error.message}`);
      return {
        passed: false,
        error: error.message,
        message: 'Form test failed'
      };
    }
  }

  async testMobileResponsiveness(pageName) {
    console.log('  📱 Testing mobile responsiveness...');
    
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    const responsiveResults = [];
    
    for (const viewport of viewports) {
      try {
        await this.page.setViewport({
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 1
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for responsive changes
        
        const metrics = await this.page.evaluate(() => {
          return {
            scrollHeight: document.body.scrollHeight,
            scrollWidth: document.body.scrollWidth,
            clientHeight: document.documentElement.clientHeight,
            clientWidth: document.documentElement.clientWidth,
            hasHorizontalScroll: document.body.scrollWidth > document.documentElement.clientWidth
          };
        });
        
        // Capture screenshot for each viewport
        const screenshotPath = await this.captureScreenshot(pageName, viewport.name);
        
        responsiveResults.push({
          viewport: viewport.name,
          dimensions: `${viewport.width}x${viewport.height}`,
          metrics,
          screenshot: screenshotPath,
          hasIssues: metrics.hasHorizontalScroll && viewport.name === 'mobile'
        });
        
        console.log(`    📱 ${viewport.name}: ${viewport.width}x${viewport.height} - ${metrics.hasHorizontalScroll ? '⚠️ ' : '✅'}`);
        
      } catch (error) {
        responsiveResults.push({
          viewport: viewport.name,
          error: error.message
        });
      }
    }
    
    // Reset to desktop viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    const hasResponsiveIssues = responsiveResults.some(result => result.hasIssues);
    
    return {
      passed: !hasResponsiveIssues,
      results: responsiveResults,
      message: hasResponsiveIssues ? 'Some responsive issues detected' : 'Responsive design working well'
    };
  }

  async measureCoreWebVitals() {
    console.log('  ⚡ Measuring Core Web Vitals...');
    
    try {
      // Get performance metrics
      const metrics = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals = {};
            
            entries.forEach(entry => {
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.LCP = entry.startTime;
              }
              if (entry.entryType === 'first-input') {
                vitals.FID = entry.processingStart - entry.startTime;
              }
              if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                vitals.CLS = (vitals.CLS || 0) + entry.value;
              }
            });
            
            // Get navigation timing
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
              vitals.FCP = navigation.responseStart - navigation.fetchStart;
              vitals.TTFB = navigation.responseStart - navigation.requestStart;
              vitals.loadTime = navigation.loadEventEnd - navigation.fetchStart;
            }
            
            resolve(vitals);
          });
          
          try {
            observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
          } catch (e) {
            // Fallback to basic timing
            const navigation = performance.getEntriesByType('navigation')[0];
            resolve({
              loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
              TTFB: navigation ? navigation.responseStart - navigation.requestStart : 0
            });
          }
          
          // Timeout after 5 seconds
          setTimeout(() => resolve({}), 5000);
        });
      });
      
      // Evaluate Core Web Vitals scores
      const scores = {
        LCP: this.evaluateMetric(metrics.LCP, [2500, 4000]), // Good < 2.5s, Poor > 4s
        FID: this.evaluateMetric(metrics.FID, [100, 300]), // Good < 100ms, Poor > 300ms
        CLS: this.evaluateMetric(metrics.CLS, [0.1, 0.25]), // Good < 0.1, Poor > 0.25
        TTFB: this.evaluateMetric(metrics.TTFB, [600, 1500]), // Good < 600ms, Poor > 1.5s
        loadTime: this.evaluateMetric(metrics.loadTime, [3000, 5000]) // Good < 3s, Poor > 5s
      };
      
      const overallScore = Object.values(scores).reduce((sum, score) => sum + (score === 'good' ? 1 : score === 'needs-improvement' ? 0.5 : 0), 0) / Object.keys(scores).length;
      
      console.log(`    ⚡ Performance Score: ${(overallScore * 100).toFixed(1)}%`);
      console.log(`    📊 LCP: ${metrics.LCP?.toFixed(0) || 'N/A'}ms (${scores.LCP})`);
      console.log(`    📊 FID: ${metrics.FID?.toFixed(0) || 'N/A'}ms (${scores.FID})`);
      console.log(`    📊 CLS: ${metrics.CLS?.toFixed(3) || 'N/A'} (${scores.CLS})`);
      
      return {
        metrics,
        scores,
        overallScore: overallScore * 100,
        passed: overallScore >= 0.7
      };
    } catch (error) {
      console.log(`    ❌ Performance measurement failed: ${error.message}`);
      return {
        error: error.message,
        passed: false
      };
    }
  }

  evaluateMetric(value, thresholds) {
    if (value === undefined || value === null) return 'unknown';
    if (value <= thresholds[0]) return 'good';
    if (value <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  }

  async checkAccessibility() {
    console.log('  ♿ Checking accessibility...');
    
    const accessibilityCheck = await this.page.evaluate(() => {
      const issues = [];
      
      // Check for missing alt texts
      const images = document.querySelectorAll('img');
      let missingAlt = 0;
      images.forEach(img => {
        if (!img.alt) missingAlt++;
      });
      if (missingAlt > 0) issues.push(`${missingAlt} images missing alt text`);
      
      // Check for heading structure
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const h1Count = document.querySelectorAll('h1').length;
      if (h1Count === 0) issues.push('No H1 heading found');
      if (h1Count > 1) issues.push('Multiple H1 headings found');
      
      // Check for form labels
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
      let unlabeledInputs = 0;
      inputs.forEach(input => {
        const hasLabel = input.labels?.length > 0 || 
                        input.hasAttribute('aria-label') || 
                        input.hasAttribute('placeholder');
        if (!hasLabel) unlabeledInputs++;
      });
      if (unlabeledInputs > 0) issues.push(`${unlabeledInputs} form inputs without labels`);
      
      // Check for color contrast (basic)
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span, div, a');
      let lowContrastElements = 0;
      
      return {
        issues,
        imageCount: images.length,
        missingAlt,
        headingCount: headings.length,
        h1Count,
        inputCount: inputs.length,
        unlabeledInputs
      };
    });
    
    const hasIssues = accessibilityCheck.issues.length > 0;
    
    if (hasIssues) {
      console.log(`    ❌ Found ${accessibilityCheck.issues.length} accessibility issue(s):`);
      accessibilityCheck.issues.forEach(issue => console.log(`      - ${issue}`));
    } else {
      console.log('    ✅ No major accessibility issues found');
    }
    
    return {
      passed: !hasIssues,
      issues: accessibilityCheck.issues,
      details: accessibilityCheck,
      message: hasIssues ? 
        `${accessibilityCheck.issues.length} accessibility issues` : 
        'No major accessibility issues'
    };
  }

  async validateSEO(cityName) {
    console.log('  🔍 Validating SEO elements...');
    
    const seoCheck = await this.page.evaluate((expectedCity) => {
      const results = {};
      
      // Title tag
      const title = document.title;
      results.title = {
        present: !!title,
        content: title,
        length: title?.length || 0,
        containsCity: title?.toLowerCase().includes(expectedCity.toLowerCase())
      };
      
      // Meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      results.metaDescription = {
        present: !!metaDesc,
        content: metaDesc?.content || '',
        length: metaDesc?.content?.length || 0,
        containsCity: metaDesc?.content?.toLowerCase().includes(expectedCity.toLowerCase())
      };
      
      // H1 tag
      const h1 = document.querySelector('h1');
      results.h1 = {
        present: !!h1,
        content: h1?.textContent || '',
        containsCity: h1?.textContent?.toLowerCase().includes(expectedCity.toLowerCase())
      };
      
      // Canonical URL
      const canonical = document.querySelector('link[rel="canonical"]');
      results.canonical = {
        present: !!canonical,
        href: canonical?.href || ''
      };
      
      // Open Graph tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDesc = document.querySelector('meta[property="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
      
      results.openGraph = {
        title: !!ogTitle,
        description: !!ogDesc,
        image: !!ogImage
      };
      
      // Schema.org markup
      const jsonLd = document.querySelector('script[type="application/ld+json"]');
      results.schema = {
        present: !!jsonLd
      };
      
      return results;
    }, cityName);
    
    // Evaluate SEO score
    let seoScore = 0;
    const issues = [];
    
    if (seoCheck.title.present && seoCheck.title.length >= 30 && seoCheck.title.length <= 60 && seoCheck.title.containsCity) {
      seoScore += 20;
    } else {
      issues.push('Title tag issues');
    }
    
    if (seoCheck.metaDescription.present && seoCheck.metaDescription.length >= 120 && seoCheck.metaDescription.length <= 160 && seoCheck.metaDescription.containsCity) {
      seoScore += 20;
    } else {
      issues.push('Meta description issues');
    }
    
    if (seoCheck.h1.present && seoCheck.h1.containsCity) {
      seoScore += 15;
    } else {
      issues.push('H1 tag issues');
    }
    
    if (seoCheck.canonical.present) {
      seoScore += 10;
    } else {
      issues.push('Missing canonical URL');
    }
    
    if (seoCheck.openGraph.title && seoCheck.openGraph.description) {
      seoScore += 15;
    } else {
      issues.push('Incomplete Open Graph tags');
    }
    
    if (seoCheck.schema.present) {
      seoScore += 20;
    } else {
      issues.push('Missing schema markup');
    }
    
    const passed = seoScore >= 70;
    
    if (passed) {
      console.log(`    ✅ SEO Score: ${seoScore}/100`);
    } else {
      console.log(`    ❌ SEO Score: ${seoScore}/100`);
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    return {
      passed,
      score: seoScore,
      details: seoCheck,
      issues,
      message: `SEO Score: ${seoScore}/100`
    };
  }

  async captureScreenshot(pageName, suffix) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${pageName.replace('.html', '')}_${suffix}_${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    
    await this.page.screenshot({
      path: filepath,
      fullPage: true,
      type: 'png'
    });
    
    return filename;
  }

  extractCityName(pageName) {
    const match = pageName.match(/riparazione-pc-(.+)\.html/);
    if (match) {
      return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return 'Unknown';
  }

  calculateOverallScore(tests) {
    const weights = {
      gratuitoCheck: 25,
      placeholderCheck: 20,
      chatbotTest: 10,
      contactFormTest: 15,
      mobileResponsiveness: 15,
      accessibilityCheck: 10,
      seoValidation: 5
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(tests).forEach(([testName, result]) => {
      if (weights[testName] && result.passed !== undefined) {
        totalScore += (result.passed ? weights[testName] : 0);
        totalWeight += weights[testName];
      }
    });
    
    return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  }

  async generateReport() {
    console.log('\n📊 Generating comprehensive validation report...');
    
    const report = {
      metadata: {
        testDate: new Date().toISOString(),
        baseUrl: this.baseUrl,
        pagesValidated: this.testPages.length,
        totalTests: this.results.detailedResults.reduce((sum, page) => sum + Object.keys(page.tests).length, 0)
      },
      summary: {
        overallScore: 0,
        totalIssues: 0,
        criticalIssues: 0,
        passedPages: 0,
        failedPages: 0
      },
      pages: this.results.detailedResults,
      recommendations: []
    };
    
    // Calculate summary statistics
    report.pages.forEach(page => {
      if (page.overallScore >= 70) {
        report.summary.passedPages++;
      } else {
        report.summary.failedPages++;
      }
      
      report.summary.totalIssues += page.issues.length;
      report.summary.criticalIssues += page.issues.filter(issue => issue.type === 'critical').length;
    });
    
    report.summary.overallScore = report.pages.length > 0 ? 
      report.pages.reduce((sum, page) => sum + (page.overallScore || 0), 0) / report.pages.length : 0;
    
    // Generate recommendations
    this.generateRecommendations(report);
    
    // Save report
    const reportPath = path.join(this.reportDir, `pc-repair-validation-report-${Date.now()}.json`);
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    // Generate HTML report
    const htmlReportPath = await this.generateHTMLReport(report);
    
    console.log(`\n📋 Reports generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
    
    return report;
  }

  generateRecommendations(report) {
    const commonIssues = {};
    
    report.pages.forEach(page => {
      Object.entries(page.tests).forEach(([testName, result]) => {
        if (!result.passed) {
          commonIssues[testName] = (commonIssues[testName] || 0) + 1;
        }
      });
    });
    
    Object.entries(commonIssues).forEach(([issue, count]) => {
      if (count >= 2) { // If issue appears in 2+ pages
        const recommendations = {
          gratuitoCheck: 'Remove all "gratuito" references from page content and HTML',
          placeholderCheck: 'Replace all placeholder text with city-specific content',
          chatbotTest: 'Implement or fix chatbot widget integration',
          contactFormTest: 'Ensure contact forms have proper action URLs and submit buttons',
          mobileResponsiveness: 'Fix mobile layout issues causing horizontal scroll',
          accessibilityCheck: 'Add alt text to images and proper labels to form inputs',
          seoValidation: 'Optimize SEO elements including title, meta description, and schema markup'
        };
        
        if (recommendations[issue]) {
          report.recommendations.push({
            priority: count === report.pages.length ? 'HIGH' : 'MEDIUM',
            issue: issue,
            affectedPages: count,
            recommendation: recommendations[issue]
          });
        }
      }
    });
  }

  async generateHTMLReport(report) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PC Repair Pages Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .metric { background: white; padding: 15px; border-left: 4px solid #007cba; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; color: #007cba; }
        .page-result { border: 1px solid #ddd; margin-bottom: 20px; border-radius: 5px; overflow: hidden; }
        .page-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
        .page-content { padding: 15px; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 3px; }
        .test-passed { background: #d4edda; border-left: 4px solid #28a745; }
        .test-failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 20px; margin-top: 30px; }
        .score { font-weight: bold; font-size: 1.2em; }
        .score.good { color: #28a745; }
        .score.warning { color: #ffc107; }
        .score.danger { color: #dc3545; }
        .performance-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 10px 0; }
        .metric-small { text-align: center; padding: 10px; background: #f8f9fa; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 PC Repair Pages Validation Report</h1>
        <p><strong>Test Date:</strong> ${new Date(report.metadata.testDate).toLocaleString('it-IT')}</p>
        <p><strong>Base URL:</strong> ${report.metadata.baseUrl}</p>
        <p><strong>Pages Validated:</strong> ${report.metadata.pagesValidated}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Overall Score</h3>
            <div class="value ${report.summary.overallScore >= 70 ? 'good' : report.summary.overallScore >= 50 ? 'warning' : 'danger'}">${report.summary.overallScore.toFixed(1)}%</div>
        </div>
        <div class="metric">
            <h3>Passed Pages</h3>
            <div class="value">${report.summary.passedPages}/${report.metadata.pagesValidated}</div>
        </div>
        <div class="metric">
            <h3>Total Issues</h3>
            <div class="value">${report.summary.totalIssues}</div>
        </div>
        <div class="metric">
            <h3>Critical Issues</h3>
            <div class="value">${report.summary.criticalIssues}</div>
        </div>
    </div>

    <h2>📄 Page Results</h2>
    ${report.pages.map(page => `
        <div class="page-result">
            <div class="page-header">
                <h3>${page.city} - ${page.page}</h3>
                <p><strong>URL:</strong> <a href="${page.url}" target="_blank">${page.url}</a></p>
                <p><strong>Overall Score:</strong> <span class="score ${(page.overallScore || 0) >= 70 ? 'good' : (page.overallScore || 0) >= 50 ? 'warning' : 'danger'}">${(page.overallScore || 0).toFixed(1)}%</span></p>
            </div>
            <div class="page-content">
                <h4>🧪 Test Results</h4>
                ${Object.entries(page.tests).map(([testName, result]) => `
                    <div class="test-result ${result.passed ? 'test-passed' : 'test-failed'}">
                        <strong>${testName}:</strong> ${result.message || (result.passed ? '✅ Passed' : '❌ Failed')}
                    </div>
                `).join('')}
                
                ${page.performance?.coreWebVitals ? `
                    <h4>⚡ Performance Metrics</h4>
                    <div class="performance-metrics">
                        ${Object.entries(page.performance.coreWebVitals.scores || {}).map(([metric, score]) => `
                            <div class="metric-small">
                                <div>${metric}</div>
                                <div class="score ${score === 'good' ? 'good' : score === 'needs-improvement' ? 'warning' : 'danger'}">${score}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${page.issues.length > 0 ? `
                    <h4>⚠️ Issues Found</h4>
                    <ul>
                        ${page.issues.map(issue => `<li><strong>${issue.type}:</strong> ${issue.message}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        </div>
    `).join('')}

    ${report.recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>💡 Recommendations</h2>
            ${report.recommendations.map(rec => `
                <div style="margin-bottom: 15px;">
                    <strong style="color: ${rec.priority === 'HIGH' ? '#dc3545' : '#ffc107'};">${rec.priority}:</strong>
                    ${rec.recommendation}
                    <em>(affects ${rec.affectedPages}/${report.metadata.pagesValidated} pages)</em>
                </div>
            `).join('')}
        </div>
    ` : ''}

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; text-align: center;">
        <p>Report generated on ${new Date().toLocaleString('it-IT')} by Puppeteer Validation Suite</p>
    </footer>
</body>
</html>`;

    const htmlReportPath = path.join(this.reportDir, `pc-repair-validation-report-${Date.now()}.html`);
    await fs.writeFile(htmlReportPath, htmlContent);
    
    return htmlReportPath;
  }

  async run() {
    try {
      console.log('🚀 Starting PC Repair Pages Validation...\n');
      
      await this.initialize();
      
      // Validate each page
      for (const pageName of this.testPages) {
        const result = await this.validatePage(pageName);
        this.results.detailedResults.push(result);
      }
      
      // Generate final report
      const report = await this.generateReport();
      
      console.log('\n🎉 Validation Complete!');
      console.log(`📊 Overall Score: ${report.summary.overallScore.toFixed(1)}%`);
      console.log(`✅ Pages Passed: ${report.summary.passedPages}/${this.testPages.length}`);
      console.log(`⚠️  Total Issues: ${report.summary.totalIssues}`);
      
      return report;
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

module.exports = PCRepairValidator;

// Run if called directly
if (require.main === module) {
  const validator = new PCRepairValidator();
  validator.run()
    .then(report => {
      console.log('\n✅ Validation completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Validation failed:', error);
      process.exit(1);
    });
}