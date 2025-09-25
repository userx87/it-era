#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, 'results');

// Extract key metrics from Lighthouse JSON results
function extractLighthouseMetrics(jsonPath) {
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    const scores = {
      performance: Math.round((data.categories.performance?.score || 0) * 100),
      accessibility: Math.round((data.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((data.categories['best-practices']?.score || 0) * 100),
      seo: Math.round((data.categories.seo?.score || 0) * 100)
    };

    const metrics = {
      lcp: Math.round(data.audits['largest-contentful-paint']?.numericValue || 0),
      fid: Math.round(data.audits['max-potential-fid']?.numericValue || 0),
      cls: Math.round((data.audits['cumulative-layout-shift']?.numericValue || 0) * 1000) / 1000,
      fcp: Math.round(data.audits['first-contentful-paint']?.numericValue || 0),
      si: Math.round(data.audits['speed-index']?.numericValue || 0),
      tti: Math.round(data.audits['interactive']?.numericValue || 0),
      tbt: Math.round(data.audits['total-blocking-time']?.numericValue || 0)
    };

    // Key opportunities for improvement
    const opportunities = [
      'unused-css-rules',
      'unused-javascript',
      'render-blocking-resources',
      'unminified-css',
      'unminified-javascript',
      'efficient-animated-content',
      'modern-image-formats',
      'uses-optimized-images',
      'uses-webp-images',
      'uses-responsive-images'
    ].map(key => {
      const audit = data.audits[key];
      if (audit && audit.numericValue > 0) {
        return {
          id: key,
          title: audit.title,
          savings: Math.round(audit.numericValue),
          description: audit.description
        };
      }
      return null;
    }).filter(Boolean).sort((a, b) => b.savings - a.savings);

    return {
      scores,
      metrics,
      opportunities: opportunities.slice(0, 5),
      url: data.finalUrl,
      device: data.configSettings?.formFactor || 'unknown',
      timestamp: data.fetchTime
    };
  } catch (error) {
    console.error(`Error reading ${jsonPath}:`, error.message);
    return null;
  }
}

// Process all Lighthouse results
const lighthouseFiles = fs.readdirSync(resultsDir)
  .filter(file => file.endsWith('.json') && (file.includes('desktop') || file.includes('mobile')) && !file.includes('accessibility') && !file.includes('seo'));

console.log('📊 Extracting Lighthouse Results...\n');

const results = {};

lighthouseFiles.forEach(file => {
  console.log(`Processing: ${file}`);
  const filePath = path.join(resultsDir, file);
  const data = extractLighthouseMetrics(filePath);

  if (data) {
    const pageName = file.replace(/-desktop\.json|-mobile\.json/g, '');
    if (!results[pageName]) {
      results[pageName] = {};
    }

    const device = file.includes('desktop') ? 'desktop' : 'mobile';
    results[pageName][device] = data;
  }
});

// Generate summary report
const summaryReport = {
  auditDate: new Date().toISOString(),
  totalPages: Object.keys(results).length,
  results,
  overallSummary: {
    desktop: {
      avgPerformance: 0,
      avgAccessibility: 0,
      avgBestPractices: 0,
      avgSEO: 0,
      avgLCP: 0,
      avgCLS: 0
    },
    mobile: {
      avgPerformance: 0,
      avgAccessibility: 0,
      avgBestPractices: 0,
      avgSEO: 0,
      avgLCP: 0,
      avgCLS: 0
    }
  },
  criticalIssues: [],
  topOpportunities: []
};

// Calculate averages
let desktopCount = 0, mobileCount = 0;
const allOpportunities = [];

Object.values(results).forEach(pageResults => {
  if (pageResults.desktop) {
    const d = pageResults.desktop;
    summaryReport.overallSummary.desktop.avgPerformance += d.scores.performance;
    summaryReport.overallSummary.desktop.avgAccessibility += d.scores.accessibility;
    summaryReport.overallSummary.desktop.avgBestPractices += d.scores.bestPractices;
    summaryReport.overallSummary.desktop.avgSEO += d.scores.seo;
    summaryReport.overallSummary.desktop.avgLCP += d.metrics.lcp;
    summaryReport.overallSummary.desktop.avgCLS += d.metrics.cls;
    desktopCount++;

    allOpportunities.push(...d.opportunities);

    // Identify critical issues
    if (d.scores.performance < 50) {
      summaryReport.criticalIssues.push({
        page: Object.keys(results).find(key => results[key].desktop === d),
        device: 'desktop',
        issue: 'Critical performance score',
        score: d.scores.performance
      });
    }
  }

  if (pageResults.mobile) {
    const m = pageResults.mobile;
    summaryReport.overallSummary.mobile.avgPerformance += m.scores.performance;
    summaryReport.overallSummary.mobile.avgAccessibility += m.scores.accessibility;
    summaryReport.overallSummary.mobile.avgBestPractices += m.scores.bestPractices;
    summaryReport.overallSummary.mobile.avgSEO += m.scores.seo;
    summaryReport.overallSummary.mobile.avgLCP += m.metrics.lcp;
    summaryReport.overallSummary.mobile.avgCLS += m.metrics.cls;
    mobileCount++;

    allOpportunities.push(...m.opportunities);

    // Identify critical issues
    if (m.scores.performance < 50) {
      summaryReport.criticalIssues.push({
        page: Object.keys(results).find(key => results[key].mobile === m),
        device: 'mobile',
        issue: 'Critical performance score',
        score: m.scores.performance
      });
    }
  }
});

// Calculate final averages
if (desktopCount > 0) {
  summaryReport.overallSummary.desktop.avgPerformance = Math.round(summaryReport.overallSummary.desktop.avgPerformance / desktopCount);
  summaryReport.overallSummary.desktop.avgAccessibility = Math.round(summaryReport.overallSummary.desktop.avgAccessibility / desktopCount);
  summaryReport.overallSummary.desktop.avgBestPractices = Math.round(summaryReport.overallSummary.desktop.avgBestPractices / desktopCount);
  summaryReport.overallSummary.desktop.avgSEO = Math.round(summaryReport.overallSummary.desktop.avgSEO / desktopCount);
  summaryReport.overallSummary.desktop.avgLCP = Math.round(summaryReport.overallSummary.desktop.avgLCP / desktopCount);
  summaryReport.overallSummary.desktop.avgCLS = Math.round(summaryReport.overallSummary.desktop.avgCLS / desktopCount * 1000) / 1000;
}

if (mobileCount > 0) {
  summaryReport.overallSummary.mobile.avgPerformance = Math.round(summaryReport.overallSummary.mobile.avgPerformance / mobileCount);
  summaryReport.overallSummary.mobile.avgAccessibility = Math.round(summaryReport.overallSummary.mobile.avgAccessibility / mobileCount);
  summaryReport.overallSummary.mobile.avgBestPractices = Math.round(summaryReport.overallSummary.mobile.avgBestPractices / mobileCount);
  summaryReport.overallSummary.mobile.avgSEO = Math.round(summaryReport.overallSummary.mobile.avgSEO / mobileCount);
  summaryReport.overallSummary.mobile.avgLCP = Math.round(summaryReport.overallSummary.mobile.avgLCP / mobileCount);
  summaryReport.overallSummary.mobile.avgCLS = Math.round(summaryReport.overallSummary.mobile.avgCLS / mobileCount * 1000) / 1000;
}

// Top opportunities
const opportunityMap = {};
allOpportunities.forEach(opp => {
  if (!opportunityMap[opp.id]) {
    opportunityMap[opp.id] = {
      id: opp.id,
      title: opp.title,
      totalSavings: opp.savings,
      count: 1,
      description: opp.description
    };
  } else {
    opportunityMap[opp.id].totalSavings += opp.savings;
    opportunityMap[opp.id].count++;
  }
});

summaryReport.topOpportunities = Object.values(opportunityMap)
  .sort((a, b) => b.totalSavings - a.totalSavings)
  .slice(0, 10);

// Save summary
fs.writeFileSync(
  path.join(resultsDir, 'lighthouse-summary.json'),
  JSON.stringify(summaryReport, null, 2)
);

// Console output
console.log('\n🎯 LIGHTHOUSE AUDIT SUMMARY');
console.log('================================');
console.log(`📊 Pages Analyzed: ${summaryReport.totalPages}`);
console.log('\n📈 DESKTOP AVERAGES:');
console.log(`   Performance: ${summaryReport.overallSummary.desktop.avgPerformance}/100`);
console.log(`   Accessibility: ${summaryReport.overallSummary.desktop.avgAccessibility}/100`);
console.log(`   Best Practices: ${summaryReport.overallSummary.desktop.avgBestPractices}/100`);
console.log(`   SEO: ${summaryReport.overallSummary.desktop.avgSEO}/100`);
console.log(`   LCP: ${summaryReport.overallSummary.desktop.avgLCP}ms`);
console.log(`   CLS: ${summaryReport.overallSummary.desktop.avgCLS}`);

console.log('\n📱 MOBILE AVERAGES:');
console.log(`   Performance: ${summaryReport.overallSummary.mobile.avgPerformance}/100`);
console.log(`   Accessibility: ${summaryReport.overallSummary.mobile.avgAccessibility}/100`);
console.log(`   Best Practices: ${summaryReport.overallSummary.mobile.avgBestPractices}/100`);
console.log(`   SEO: ${summaryReport.overallSummary.mobile.avgSEO}/100`);
console.log(`   LCP: ${summaryReport.overallSummary.mobile.avgLCP}ms`);
console.log(`   CLS: ${summaryReport.overallSummary.mobile.avgCLS}`);

console.log('\n🚨 CRITICAL ISSUES:');
summaryReport.criticalIssues.forEach(issue => {
  console.log(`   ❌ ${issue.page} (${issue.device}): ${issue.issue} - Score: ${issue.score}/100`);
});

console.log('\n⚡ TOP PERFORMANCE OPPORTUNITIES:');
summaryReport.topOpportunities.slice(0, 5).forEach((opp, i) => {
  console.log(`   ${i + 1}. ${opp.title}: ${opp.totalSavings}ms potential savings (${opp.count} pages affected)`);
});

console.log('\n📊 Results saved to: lighthouse-summary.json');