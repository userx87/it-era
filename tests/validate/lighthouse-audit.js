const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const TEST_URLS = [
  'https://it-era.it',
  'https://it-era.it/assistenza-it-milano.html',
  'https://it-era.it/cloud-storage-monza.html',
  'https://it-era.it/sicurezza-informatica-bergamo.html',
  'https://it-era.it/riparazione-pc-como.html'
];

const LIGHTHOUSE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
  },
};

async function runLighthouseAudit() {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
  });

  const results = [];
  
  for (const url of TEST_URLS) {
    console.log(`Running Lighthouse audit for: ${url}`);
    
    try {
      const runnerResult = await lighthouse(url, {
        port: chrome.port,
        output: 'json'
      }, LIGHTHOUSE_CONFIG);

      const { lhr } = runnerResult;
      
      const auditResult = {
        url,
        timestamp: new Date().toISOString(),
        scores: {
          performance: Math.round(lhr.categories.performance.score * 100),
          accessibility: Math.round(lhr.categories.accessibility.score * 100),
          bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
          seo: Math.round(lhr.categories.seo.score * 100)
        },
        metrics: {
          firstContentfulPaint: lhr.audits['first-contentful-paint'].displayValue,
          largestContentfulPaint: lhr.audits['largest-contentful-paint'].displayValue,
          cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].displayValue,
          speedIndex: lhr.audits['speed-index'].displayValue,
          totalBlockingTime: lhr.audits['total-blocking-time'].displayValue
        },
        opportunities: lhr.audits['unused-css-rules'] ? lhr.audits['unused-css-rules'].details?.items?.length || 0 : 0,
        diagnostics: {
          domSize: lhr.audits['dom-size'].numericValue,
          renderBlockingResources: lhr.audits['render-blocking-resources'].details?.items?.length || 0
        }
      };

      results.push(auditResult);
      
      // Save individual report
      const reportPath = path.join(__dirname, `lighthouse-${url.split('/').pop() || 'homepage'}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(runnerResult.lhr, null, 2));
      
      console.log(`✅ ${url} - Performance: ${auditResult.scores.performance}, SEO: ${auditResult.scores.seo}`);
      
    } catch (error) {
      console.error(`❌ Error auditing ${url}:`, error.message);
      results.push({
        url,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  await chrome.kill();

  // Generate summary report
  const summary = {
    timestamp: new Date().toISOString(),
    totalUrls: TEST_URLS.length,
    successfulAudits: results.filter(r => !r.error).length,
    averageScores: calculateAverageScores(results.filter(r => !r.error)),
    results
  };

  // Save comprehensive report
  const summaryPath = path.join(__dirname, `lighthouse-summary-${Date.now()}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n📊 LIGHTHOUSE AUDIT SUMMARY');
  console.log(`Total URLs tested: ${summary.totalUrls}`);
  console.log(`Successful audits: ${summary.successfulAudits}`);
  if (summary.averageScores) {
    console.log(`Average Performance: ${summary.averageScores.performance}`);
    console.log(`Average SEO: ${summary.averageScores.seo}`);
    console.log(`Average Accessibility: ${summary.averageScores.accessibility}`);
    console.log(`Average Best Practices: ${summary.averageScores.bestPractices}`);
  }
  
  return summary;
}

function calculateAverageScores(results) {
  if (results.length === 0) return null;
  
  const totals = results.reduce((acc, result) => {
    acc.performance += result.scores.performance;
    acc.accessibility += result.scores.accessibility;
    acc.bestPractices += result.scores.bestPractices;
    acc.seo += result.scores.seo;
    return acc;
  }, { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 });

  return {
    performance: Math.round(totals.performance / results.length),
    accessibility: Math.round(totals.accessibility / results.length),
    bestPractices: Math.round(totals.bestPractices / results.length),
    seo: Math.round(totals.seo / results.length)
  };
}

if (require.main === module) {
  runLighthouseAudit().then(summary => {
    process.exit(summary.averageScores && 
      summary.averageScores.performance >= 85 && 
      summary.averageScores.seo >= 95 ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runLighthouseAudit };