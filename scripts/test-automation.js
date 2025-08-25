#!/usr/bin/env node

/**
 * IT-ERA Website Test Automation Suite
 * Comprehensive testing script for quality assurance
 * 
 * Usage: node scripts/test-automation.js [test-suite]
 * 
 * Test Suites:
 * - all: Run all tests
 * - performance: Performance and Core Web Vitals
 * - accessibility: WCAG 2.1 AA compliance
 * - seo: Technical SEO validation
 * - functionality: Forms and interactions
 * - security: Security scanning
 * - content: Content validation
 */

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const axeCore = require('@axe-core/puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  baseUrl: 'https://it-era.it',
  testPages: [
    '/',
    '/assistenza-it-milano.html',
    '/sicurezza-informatica-monza.html',
    '/cloud-storage-como.html',
    '/assistenza-it-bergamo.html'
  ],
  performance: {
    mobile: {
      lcp: 2500, // ms
      inp: 200,  // ms
      cls: 0.1,  // score
      fcp: 1800, // ms
      tti: 3800, // ms
      tbt: 300   // ms
    },
    desktop: {
      lcp: 2000,
      inp: 100,
      cls: 0.1,
      fcp: 1200,
      tti: 2500,
      tbt: 150
    }
  },
  accessibility: {
    level: 'AA',
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
  },
  security: {
    headers: [
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options'
    ]
  }
};

// Test Results Storage
let testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  tests: []
};

/**
 * Main test runner
 */
async function runTests(suite = 'all') {
  console.log('🚀 Starting IT-ERA Website Test Automation');
  console.log(`📊 Test Suite: ${suite}`);
  console.log(`🌐 Base URL: ${CONFIG.baseUrl}`);
  console.log('─'.repeat(60));

  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    if (suite === 'all' || suite === 'performance') {
      await runPerformanceTests(browser);
    }
    
    if (suite === 'all' || suite === 'accessibility') {
      await runAccessibilityTests(browser);
    }
    
    if (suite === 'all' || suite === 'seo') {
      await runSEOTests(browser);
    }
    
    if (suite === 'all' || suite === 'functionality') {
      await runFunctionalityTests(browser);
    }
    
    if (suite === 'all' || suite === 'security') {
      await runSecurityTests(browser);
    }
    
    if (suite === 'all' || suite === 'content') {
      await runContentTests(browser);
    }

    await browser.close();
    
    // Generate reports
    await generateReports();
    
    console.log('─'.repeat(60));
    console.log('✅ Testing completed successfully');
    printSummary();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

/**
 * Performance Testing with Lighthouse
 */
async function runPerformanceTests(browser) {
  console.log('🔍 Running Performance Tests...');
  
  for (const pagePath of CONFIG.testPages) {
    const url = `${CONFIG.baseUrl}${pagePath}`;
    console.log(`  Testing: ${url}`);
    
    try {
      // Mobile Performance Test
      const mobileResult = await lighthouse(url, {
        port: 9222,
        output: 'json',
        logLevel: 'error',
        emulatedFormFactor: 'mobile',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        }
      });

      // Desktop Performance Test  
      const desktopResult = await lighthouse(url, {
        port: 9222,
        output: 'json',
        logLevel: 'error',
        emulatedFormFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1
        }
      });

      // Evaluate results
      const mobileMetrics = extractCoreWebVitals(mobileResult);
      const desktopMetrics = extractCoreWebVitals(desktopResult);
      
      const performanceTest = {
        name: `Performance Test - ${pagePath}`,
        url: url,
        type: 'performance',
        status: 'passed',
        details: {
          mobile: mobileMetrics,
          desktop: desktopMetrics,
          scores: {
            mobile: mobileResult.lhr.categories.performance.score * 100,
            desktop: desktopResult.lhr.categories.performance.score * 100
          }
        },
        issues: []
      };

      // Check performance thresholds
      if (performanceTest.details.scores.mobile < 70) {
        performanceTest.status = 'failed';
        performanceTest.issues.push('Mobile performance score below 70');
      } else if (performanceTest.details.scores.mobile < 90) {
        performanceTest.status = 'warning';
        performanceTest.issues.push('Mobile performance score below 90');
      }

      if (mobileMetrics.lcp > CONFIG.performance.mobile.lcp) {
        performanceTest.status = 'failed';
        performanceTest.issues.push(`Mobile LCP too high: ${mobileMetrics.lcp}ms`);
      }

      if (mobileMetrics.cls > CONFIG.performance.mobile.cls) {
        performanceTest.status = 'failed';
        performanceTest.issues.push(`Mobile CLS too high: ${mobileMetrics.cls}`);
      }

      addTestResult(performanceTest);
      
    } catch (error) {
      addTestResult({
        name: `Performance Test - ${pagePath}`,
        url: url,
        type: 'performance',
        status: 'failed',
        error: error.message
      });
    }
  }
}

/**
 * Accessibility Testing with axe-core
 */
async function runAccessibilityTests(browser) {
  console.log('♿ Running Accessibility Tests...');
  
  for (const pagePath of CONFIG.testPages) {
    const url = `${CONFIG.baseUrl}${pagePath}`;
    console.log(`  Testing: ${url}`);
    
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      await axeCore.injectIntoPage(page);
      
      const results = await page.evaluate(async () => {
        return await axe.run();
      });
      
      const accessibilityTest = {
        name: `Accessibility Test - ${pagePath}`,
        url: url,
        type: 'accessibility',
        status: results.violations.length === 0 ? 'passed' : 'failed',
        details: {
          violations: results.violations.length,
          passes: results.passes.length,
          incomplete: results.incomplete.length,
          inapplicable: results.inapplicable.length
        },
        issues: results.violations.map(v => `${v.impact}: ${v.help}`)
      };
      
      addTestResult(accessibilityTest);
      await page.close();
      
    } catch (error) {
      addTestResult({
        name: `Accessibility Test - ${pagePath}`,
        url: url,
        type: 'accessibility',
        status: 'failed',
        error: error.message
      });
    }
  }
}

/**
 * SEO Testing
 */
async function runSEOTests(browser) {
  console.log('🔍 Running SEO Tests...');
  
  for (const pagePath of CONFIG.testPages) {
    const url = `${CONFIG.baseUrl}${pagePath}`;
    console.log(`  Testing: ${url}`);
    
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Extract SEO elements
      const seoData = await page.evaluate(() => {
        return {
          title: document.title,
          metaDescription: document.querySelector('meta[name="description"]')?.content,
          canonical: document.querySelector('link[rel="canonical"]')?.href,
          h1: document.querySelector('h1')?.textContent,
          h2Count: document.querySelectorAll('h2').length,
          imageAltCount: Array.from(document.querySelectorAll('img')).filter(img => !img.alt).length,
          structuredData: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).length,
          wordCount: document.body.textContent.split(' ').length
        };
      });
      
      const seoTest = {
        name: `SEO Test - ${pagePath}`,
        url: url,
        type: 'seo',
        status: 'passed',
        details: seoData,
        issues: []
      };
      
      // SEO validation rules
      if (!seoData.title || seoData.title.length < 30) {
        seoTest.status = 'failed';
        seoTest.issues.push('Title tag missing or too short');
      }
      
      if (!seoData.metaDescription || seoData.metaDescription.length < 120) {
        seoTest.status = 'failed';
        seoTest.issues.push('Meta description missing or too short');
      }
      
      if (!seoData.canonical || !seoData.canonical.includes('it-era.it')) {
        seoTest.status = 'failed';
        seoTest.issues.push('Canonical URL incorrect');
      }
      
      if (!seoData.h1) {
        seoTest.status = 'failed';
        seoTest.issues.push('H1 tag missing');
      }
      
      if (seoData.imageAltCount > 0) {
        seoTest.status = 'failed';
        seoTest.issues.push(`${seoData.imageAltCount} images missing alt text`);
      }
      
      if (seoData.wordCount < 800 && !pagePath.includes('cloud-storage')) {
        seoTest.status = 'warning';
        seoTest.issues.push(`Low word count: ${seoData.wordCount} words`);
      }
      
      addTestResult(seoTest);
      await page.close();
      
    } catch (error) {
      addTestResult({
        name: `SEO Test - ${pagePath}`,
        url: url,
        type: 'seo',
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // Test sitemap and robots.txt
  await testSitemapAndRobots();
}

/**
 * Functionality Testing
 */
async function runFunctionalityTests(browser) {
  console.log('⚙️ Running Functionality Tests...');
  
  for (const pagePath of CONFIG.testPages) {
    const url = `${CONFIG.baseUrl}${pagePath}`;
    console.log(`  Testing: ${url}`);
    
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Test form functionality
      const formTest = await testContactForm(page);
      
      // Test navigation
      const navTest = await testNavigation(page);
      
      // Test phone and email links
      const linksTest = await testContactLinks(page);
      
      const functionalityTest = {
        name: `Functionality Test - ${pagePath}`,
        url: url,
        type: 'functionality',
        status: 'passed',
        details: {
          form: formTest,
          navigation: navTest,
          contactLinks: linksTest
        },
        issues: []
      };
      
      // Evaluate results
      if (!formTest.working) {
        functionalityTest.status = 'failed';
        functionalityTest.issues.push('Contact form not working');
      }
      
      if (navTest.brokenLinks > 0) {
        functionalityTest.status = 'failed';
        functionalityTest.issues.push(`${navTest.brokenLinks} broken navigation links`);
      }
      
      if (!linksTest.phoneWorking) {
        functionalityTest.status = 'warning';
        functionalityTest.issues.push('Phone links not properly formatted');
      }
      
      addTestResult(functionalityTest);
      await page.close();
      
    } catch (error) {
      addTestResult({
        name: `Functionality Test - ${pagePath}`,
        url: url,
        type: 'functionality',
        status: 'failed',
        error: error.message
      });
    }
  }
}

/**
 * Security Testing
 */
async function runSecurityTests(browser) {
  console.log('🔒 Running Security Tests...');
  
  for (const pagePath of CONFIG.testPages) {
    const url = `${CONFIG.baseUrl}${pagePath}`;
    console.log(`  Testing: ${url}`);
    
    try {
      const page = await browser.newPage();
      const response = await page.goto(url, { waitUntil: 'networkidle2' });
      
      const securityTest = {
        name: `Security Test - ${pagePath}`,
        url: url,
        type: 'security',
        status: 'passed',
        details: {
          https: url.startsWith('https://'),
          headers: {},
          mixedContent: false,
          externalLinks: []
        },
        issues: []
      };
      
      // Check security headers
      CONFIG.security.headers.forEach(header => {
        securityTest.details.headers[header] = response.headers()[header] || null;
        if (!response.headers()[header]) {
          securityTest.status = 'warning';
          securityTest.issues.push(`Missing security header: ${header}`);
        }
      });
      
      // Check for mixed content
      const mixedContent = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img, script, link'))
          .filter(el => {
            const src = el.src || el.href;
            return src && src.startsWith('http://');
          }).length;
      });
      
      if (mixedContent > 0) {
        securityTest.status = 'failed';
        securityTest.issues.push(`${mixedContent} mixed content resources found`);
      }
      
      // Check external links for security attributes
      const externalLinksWithoutNoopener = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href^="http"]'))
          .filter(link => !link.rel.includes('noopener')).length;
      });
      
      if (externalLinksWithoutNoopener > 0) {
        securityTest.status = 'warning';
        securityTest.issues.push(`${externalLinksWithoutNoopener} external links missing rel="noopener"`);
      }
      
      addTestResult(securityTest);
      await page.close();
      
    } catch (error) {
      addTestResult({
        name: `Security Test - ${pagePath}`,
        url: url,
        type: 'security',
        status: 'failed',
        error: error.message
      });
    }
  }
}

/**
 * Content Validation Testing
 */
async function runContentTests(browser) {
  console.log('📝 Running Content Tests...');
  
  for (const pagePath of CONFIG.testPages) {
    const url = `${CONFIG.baseUrl}${pagePath}`;
    console.log(`  Testing: ${url}`);
    
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      const contentData = await page.evaluate(() => {
        return {
          phone: document.body.textContent.includes('039 888 2041'),
          address: document.body.textContent.includes('Viale Risorgimento 32'),
          email: document.body.textContent.includes('info@it-era.it'),
          piva: document.body.textContent.includes('10524040966'),
          faqCount: document.querySelectorAll('[itemtype*="Question"]').length,
          cityMention: document.body.textContent.toLowerCase(),
          placeholders: document.body.textContent.includes('{{CITY}}')
        };
      });
      
      const contentTest = {
        name: `Content Test - ${pagePath}`,
        url: url,
        type: 'content',
        status: 'passed',
        details: contentData,
        issues: []
      };
      
      // Content validation rules
      if (!contentData.phone) {
        contentTest.status = 'failed';
        contentTest.issues.push('Phone number 039 888 2041 not found');
      }
      
      if (!contentData.address) {
        contentTest.status = 'failed';
        contentTest.issues.push('Address not found');
      }
      
      if (!contentData.email) {
        contentTest.status = 'failed';
        contentTest.issues.push('Email info@it-era.it not found');
      }
      
      if (contentData.placeholders) {
        contentTest.status = 'failed';
        contentTest.issues.push('Unresolved {{CITY}} placeholders found');
      }
      
      if (contentData.faqCount < 6) {
        contentTest.status = 'warning';
        contentTest.issues.push(`Only ${contentData.faqCount} FAQs found, target is 6+`);
      }
      
      addTestResult(contentTest);
      await page.close();
      
    } catch (error) {
      addTestResult({
        name: `Content Test - ${pagePath}`,
        url: url,
        type: 'content',
        status: 'failed',
        error: error.message
      });
    }
  }
}

/**
 * Helper Functions
 */

function extractCoreWebVitals(lighthouseResult) {
  const audits = lighthouseResult.lhr.audits;
  return {
    lcp: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
    inp: Math.round(audits['max-potential-fid']?.numericValue || 0),
    cls: Math.round((audits['cumulative-layout-shift']?.numericValue || 0) * 1000) / 1000,
    fcp: Math.round(audits['first-contentful-paint']?.numericValue || 0),
    tti: Math.round(audits['interactive']?.numericValue || 0),
    tbt: Math.round(audits['total-blocking-time']?.numericValue || 0)
  };
}

async function testContactForm(page) {
  try {
    const form = await page.$('form');
    if (!form) return { working: false, reason: 'No form found' };
    
    const hasNameField = await page.$('input[name*="name"], input[name*="nome"]');
    const hasEmailField = await page.$('input[type="email"], input[name*="email"]');
    const hasSubmitButton = await page.$('button[type="submit"], input[type="submit"]');
    
    return {
      working: !!(hasNameField && hasEmailField && hasSubmitButton),
      fields: {
        name: !!hasNameField,
        email: !!hasEmailField,
        submit: !!hasSubmitButton
      }
    };
  } catch (error) {
    return { working: false, reason: error.message };
  }
}

async function testNavigation(page) {
  try {
    const links = await page.$$eval('nav a, .menu a', links => 
      links.map(link => link.href).filter(href => href.includes('it-era.it'))
    );
    
    let brokenLinks = 0;
    for (const link of links.slice(0, 5)) { // Test first 5 links
      try {
        const response = await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 5000 });
        if (response.status() >= 400) brokenLinks++;
      } catch {
        brokenLinks++;
      }
    }
    
    return {
      totalLinks: links.length,
      brokenLinks: brokenLinks
    };
  } catch (error) {
    return { totalLinks: 0, brokenLinks: 0, error: error.message };
  }
}

async function testContactLinks(page) {
  try {
    const phoneLinks = await page.$$eval('a[href^="tel:"]', links => links.length);
    const emailLinks = await page.$$eval('a[href^="mailto:"]', links => links.length);
    const whatsappLinks = await page.$$eval('a[href*="whatsapp"]', links => links.length);
    
    return {
      phoneWorking: phoneLinks > 0,
      emailWorking: emailLinks > 0,
      whatsappWorking: whatsappLinks > 0,
      counts: {
        phone: phoneLinks,
        email: emailLinks,
        whatsapp: whatsappLinks
      }
    };
  } catch (error) {
    return { phoneWorking: false, emailWorking: false, whatsappWorking: false };
  }
}

async function testSitemapAndRobots() {
  try {
    // Test robots.txt
    const robotsResponse = await fetch(`${CONFIG.baseUrl}/robots.txt`);
    const robotsTest = {
      name: 'Robots.txt Test',
      type: 'seo',
      status: robotsResponse.ok ? 'passed' : 'failed',
      details: { status: robotsResponse.status },
      issues: robotsResponse.ok ? [] : ['Robots.txt not accessible']
    };
    addTestResult(robotsTest);
    
    // Test sitemap.xml
    const sitemapResponse = await fetch(`${CONFIG.baseUrl}/sitemap.xml`);
    const sitemapTest = {
      name: 'Sitemap.xml Test',
      type: 'seo', 
      status: sitemapResponse.ok ? 'passed' : 'failed',
      details: { status: sitemapResponse.status },
      issues: sitemapResponse.ok ? [] : ['Sitemap.xml not accessible']
    };
    addTestResult(sitemapTest);
    
  } catch (error) {
    addTestResult({
      name: 'Sitemap/Robots Test',
      type: 'seo',
      status: 'failed',
      error: error.message
    });
  }
}

function addTestResult(result) {
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (result.status === 'passed') {
    testResults.summary.passed++;
  } else if (result.status === 'warning') {
    testResults.summary.warnings++;
  } else {
    testResults.summary.failed++;
  }
}

async function generateReports() {
  try {
    // Create reports directory
    const reportsDir = path.join(__dirname, '..', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    // Generate JSON report
    await fs.writeFile(
      path.join(reportsDir, 'test-results.json'),
      JSON.stringify(testResults, null, 2)
    );
    
    // Generate HTML report
    const htmlReport = generateHTMLReport();
    await fs.writeFile(
      path.join(reportsDir, 'test-report.html'),
      htmlReport
    );
    
    // Generate CSV report
    const csvReport = generateCSVReport();
    await fs.writeFile(
      path.join(reportsDir, 'test-results.csv'),
      csvReport
    );
    
    console.log('📊 Reports generated in /reports directory');
    
  } catch (error) {
    console.error('Error generating reports:', error);
  }
}

function generateHTMLReport() {
  const passRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>IT-ERA Website Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #0056cc; color: white; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { padding: 15px; border-radius: 5px; text-align: center; }
        .passed { background: #d4edda; }
        .failed { background: #f8d7da; }
        .warning { background: #fff3cd; }
        .test { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .issues { color: #721c24; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>IT-ERA Website Test Report</h1>
        <p>Generated: ${testResults.timestamp}</p>
        <p>Overall Pass Rate: ${passRate}%</p>
    </div>
    
    <div class="summary">
        <div class="metric passed">
            <h3>${testResults.summary.passed}</h3>
            <p>Passed</p>
        </div>
        <div class="metric failed">
            <h3>${testResults.summary.failed}</h3>
            <p>Failed</p>
        </div>
        <div class="metric warning">
            <h3>${testResults.summary.warnings}</h3>
            <p>Warnings</p>
        </div>
    </div>
    
    <div class="tests">
        ${testResults.tests.map(test => `
            <div class="test">
                <h3>${test.name} - ${test.status.toUpperCase()}</h3>
                <p><strong>URL:</strong> ${test.url || 'N/A'}</p>
                <p><strong>Type:</strong> ${test.type}</p>
                ${test.issues && test.issues.length > 0 ? `
                    <div class="issues">
                        <strong>Issues:</strong>
                        <ul>
                            ${test.issues.map(issue => `<li>${issue}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>
  `;
}

function generateCSVReport() {
  const header = 'Test Name,URL,Type,Status,Issues\n';
  const rows = testResults.tests.map(test => {
    const issues = test.issues ? test.issues.join('; ') : '';
    return `"${test.name}","${test.url || ''}","${test.type}","${test.status}","${issues}"`;
  }).join('\n');
  
  return header + rows;
}

function printSummary() {
  console.log('📊 Test Results Summary:');
  console.log(`   Total Tests: ${testResults.summary.total}`);
  console.log(`   ✅ Passed: ${testResults.summary.passed}`);
  console.log(`   ❌ Failed: ${testResults.summary.failed}`);
  console.log(`   ⚠️  Warnings: ${testResults.summary.warnings}`);
  console.log(`   📈 Pass Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  
  if (testResults.summary.failed > 0) {
    console.log('\n❌ Critical Issues Found:');
    testResults.tests
      .filter(test => test.status === 'failed')
      .forEach(test => {
        console.log(`   - ${test.name}`);
        if (test.issues) {
          test.issues.forEach(issue => console.log(`     • ${issue}`));
        }
      });
  }
}

// Command line interface
if (require.main === module) {
  const suite = process.argv[2] || 'all';
  runTests(suite).catch(console.error);
}

module.exports = {
  runTests,
  CONFIG,
  testResults
};