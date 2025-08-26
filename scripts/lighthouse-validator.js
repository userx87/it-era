#!/usr/bin/env node
/**
 * Lighthouse Validator for IT-ERA Production
 * Performance and SEO auditing
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  baseUrl: 'https://it-era.it',
  testPages: [
    '/',
    '/assistenza-informatica-bergamo.html',
    '/sicurezza-informatica-milano.html'
  ],
  thresholds: {
    performance: 85,
    seo: 95,
    accessibility: 90,
    bestPractices: 85
  }
};

class LighthouseValidator {
  constructor() {
    this.results = {
      tests: [],
      metrics: {
        all_tests_pass: true,
        average_scores: {},
        pages_tested: 0
      }
    };
  }

  async auditPage(url) {
    let chrome;
    
    try {
      chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
      });

      const options = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: ['performance', 'seo', 'accessibility', 'best-practices'],
        port: chrome.port
      };

      const runnerResult = await lighthouse(url, options);
      
      const scores = {
        performance: Math.round(runnerResult.lhr.categories.performance.score * 100),
        seo: Math.round(runnerResult.lhr.categories.seo.score * 100),
        accessibility: Math.round(runnerResult.lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(runnerResult.lhr.categories['best-practices'].score * 100)
      };

      const audit = {
        url,
        scores,
        metrics: {
          firstContentfulPaint: runnerResult.lhr.audits['first-contentful-paint']?.numericValue,
          largestContentfulPaint: runnerResult.lhr.audits['largest-contentful-paint']?.numericValue,
          cumulativeLayoutShift: runnerResult.lhr.audits['cumulative-layout-shift']?.numericValue,
          speedIndex: runnerResult.lhr.audits['speed-index']?.numericValue
        },
        opportunities: runnerResult.lhr.audits['unused-css-rules']?.details?.items?.length || 0,
        passed: scores.performance >= CONFIG.thresholds.performance && 
                scores.seo >= CONFIG.thresholds.seo
      };

      // Save detailed report
      const reportPath = path.join(process.cwd(), 'reports/data', `lighthouse-${url.replace(/[^a-z0-9]/gi, '_')}.json`);
      fs.writeFileSync(reportPath, runnerResult.report);

      return audit;

    } finally {
      if (chrome) {
        await chrome.kill();
      }
    }
  }

  async runLighthouseAudit() {
    console.log('🔍 Starting Lighthouse audits...');
    
    const audits = [];
    
    for (const pagePath of CONFIG.testPages) {
      const url = pagePath.startsWith('/') ? `${CONFIG.baseUrl}${pagePath}` : pagePath;
      
      try {
        console.log(`🔍 Auditing: ${url}`);
        const audit = await this.auditPage(url);
        audits.push(audit);
        
        this.results.tests.push({
          name: 'lighthouse',
          url,
          status: audit.passed ? 'PASS' : 'FAIL',
          scores: audit.scores,
          metrics: audit.metrics,
          report: `lighthouse-${url.replace(/[^a-z0-9]/gi, '_')}.json`
        });

        if (!audit.passed) {
          this.results.metrics.all_tests_pass = false;
        }

      } catch (error) {
        console.error(`❌ Error auditing ${url}:`, error.message);
        this.results.tests.push({
          name: 'lighthouse',
          url,
          status: 'FAIL',
          error: error.message
        });
        this.results.metrics.all_tests_pass = false;
      }
    }

    // Calculate averages
    if (audits.length > 0) {
      this.results.metrics.average_scores = {
        performance: Math.round(audits.reduce((sum, a) => sum + a.scores.performance, 0) / audits.length),
        seo: Math.round(audits.reduce((sum, a) => sum + a.scores.seo, 0) / audits.length),
        accessibility: Math.round(audits.reduce((sum, a) => sum + a.scores.accessibility, 0) / audits.length),
        bestPractices: Math.round(audits.reduce((sum, a) => sum + a.scores.bestPractices, 0) / audits.length)
      };
    }

    this.results.metrics.pages_tested = audits.length;

    // Save consolidated results
    const resultsPath = path.join(process.cwd(), 'reports/data/lighthouse-summary.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));

    console.log('✅ Lighthouse audits complete!');
    return this.results;
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new LighthouseValidator();
  validator.runLighthouseAudit()
    .then(results => {
      console.log('\n📊 Lighthouse Results:');
      console.log(`Performance: ${results.metrics.average_scores.performance || 'N/A'}`);
      console.log(`SEO: ${results.metrics.average_scores.seo || 'N/A'}`);
      console.log(`Accessibility: ${results.metrics.average_scores.accessibility || 'N/A'}`);
      console.log(`Best Practices: ${results.metrics.average_scores.bestPractices || 'N/A'}`);
      process.exit(results.metrics.all_tests_pass ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Lighthouse validation failed:', error);
      process.exit(1);
    });
}

module.exports = LighthouseValidator;