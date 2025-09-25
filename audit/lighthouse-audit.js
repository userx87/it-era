#!/usr/bin/env node

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Main landing pages to audit
const LANDING_PAGES = [
  { url: 'http://localhost:8080/', name: 'Homepage', priority: 'critical' },
  { url: 'http://localhost:8080/contatti.html', name: 'Contatti', priority: 'high' },
  { url: 'http://localhost:8080/servizi.html', name: 'Servizi', priority: 'high' },
  { url: 'http://localhost:8080/fixes-landing-digitalizzazione-pmi.html', name: 'Digitalizzazione PMI', priority: 'high' },
  { url: 'http://localhost:8080/fixes-landing-assistenza-emergenza.html', name: 'Assistenza Emergenza', priority: 'high' },
  { url: 'http://localhost:8080/fixes-landing-cloud-migration.html', name: 'Cloud Migration', priority: 'medium' },
  { url: 'http://localhost:8080/fixes-landing-sicurezza-informatica.html', name: 'Sicurezza Informatica', priority: 'high' },
  { url: 'http://localhost:8080/fixes-landing-software-commercialisti.html', name: 'Software Commercialisti', priority: 'medium' },
  { url: 'http://localhost:8080/fixes-settori-commercialisti.html', name: 'Settore Commercialisti', priority: 'medium' },
  { url: 'http://localhost:8080/fixes-settori-industria-40.html', name: 'Industria 4.0', priority: 'medium' }
];

// Audit configurations
const DESKTOP_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false
    }
  }
};

const MOBILE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'mobile',
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    },
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 2.625,
      disabled: false
    }
  }
};

// 3G Mobile simulation
const MOBILE_3G_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'mobile',
    throttling: {
      rttMs: 300,
      throughputKbps: 700,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 150,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    },
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 2.625,
      disabled: false
    }
  }
};

class LighthouseAuditor {
  constructor() {
    this.results = {};
    this.auditDir = path.join(__dirname, 'results');
    this.ensureAuditDir();
  }

  ensureAuditDir() {
    if (!fs.existsSync(this.auditDir)) {
      fs.mkdirSync(this.auditDir, { recursive: true });
    }
  }

  async launchChrome() {
    const chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-features=TranslateUI',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-field-trial-config',
        '--disable-ipc-flooding-protection'
      ]
    });
    return chrome;
  }

  async auditPage(url, pageName, config, configName) {
    const chrome = await this.launchChrome();

    try {
      console.log(`🔍 Auditing ${pageName} (${configName})...`);

      const runnerResult = await lighthouse(url, {
        port: chrome.port,
        output: 'json'
      }, config);

      const report = runnerResult.report;
      const lhr = JSON.parse(report);

      // Extract key metrics
      const scores = {
        performance: lhr.categories.performance?.score * 100 || 0,
        accessibility: lhr.categories.accessibility?.score * 100 || 0,
        bestPractices: lhr.categories['best-practices']?.score * 100 || 0,
        seo: lhr.categories.seo?.score * 100 || 0
      };

      // Core Web Vitals
      const metrics = {
        lcp: lhr.audits['largest-contentful-paint']?.numericValue || 0,
        fid: lhr.audits['max-potential-fid']?.numericValue || 0,
        cls: lhr.audits['cumulative-layout-shift']?.numericValue || 0,
        fcp: lhr.audits['first-contentful-paint']?.numericValue || 0,
        si: lhr.audits['speed-index']?.numericValue || 0,
        tti: lhr.audits['interactive']?.numericValue || 0
      };

      // Performance opportunities
      const opportunities = lhr.audits ? Object.keys(lhr.audits)
        .filter(key => lhr.audits[key].details && lhr.audits[key].details.type === 'opportunity')
        .map(key => ({
          id: key,
          title: lhr.audits[key].title,
          description: lhr.audits[key].description,
          score: lhr.audits[key].score,
          numericValue: lhr.audits[key].numericValue,
          displayValue: lhr.audits[key].displayValue
        }))
        .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0)) : [];

      // Accessibility issues
      const a11yIssues = lhr.audits ? Object.keys(lhr.audits)
        .filter(key => lhr.categories.accessibility?.auditRefs.some(ref => ref.id === key))
        .filter(key => lhr.audits[key].score !== null && lhr.audits[key].score < 1)
        .map(key => ({
          id: key,
          title: lhr.audits[key].title,
          description: lhr.audits[key].description,
          score: lhr.audits[key].score,
          impact: this.getImpactLevel(lhr.audits[key].score)
        })) : [];

      // SEO issues
      const seoIssues = lhr.audits ? Object.keys(lhr.audits)
        .filter(key => lhr.categories.seo?.auditRefs.some(ref => ref.id === key))
        .filter(key => lhr.audits[key].score !== null && lhr.audits[key].score < 1)
        .map(key => ({
          id: key,
          title: lhr.audits[key].title,
          description: lhr.audits[key].description,
          score: lhr.audits[key].score
        })) : [];

      const result = {
        url,
        pageName,
        configName,
        timestamp: new Date().toISOString(),
        scores,
        metrics,
        opportunities: opportunities.slice(0, 10), // Top 10
        a11yIssues,
        seoIssues,
        rawLighthouseResult: lhr
      };

      // Save individual result
      const filename = `${pageName.toLowerCase().replace(/\s+/g, '-')}-${configName}.json`;
      fs.writeFileSync(
        path.join(this.auditDir, filename),
        JSON.stringify(result, null, 2)
      );

      return result;

    } catch (error) {
      console.error(`❌ Error auditing ${pageName} (${configName}):`, error.message);
      return null;
    } finally {
      await chrome.kill();
    }
  }

  getImpactLevel(score) {
    if (score === 0) return 'critical';
    if (score < 0.5) return 'high';
    if (score < 0.9) return 'medium';
    return 'low';
  }

  async runFullAudit() {
    console.log('🚀 Starting comprehensive Lighthouse audit...\n');

    const allResults = [];

    for (const page of LANDING_PAGES) {
      console.log(`\n📊 Auditing: ${page.name} (${page.priority} priority)`);
      console.log(`🔗 URL: ${page.url}`);

      // Desktop audit
      const desktopResult = await this.auditPage(page.url, page.name, DESKTOP_CONFIG, 'desktop');
      if (desktopResult) allResults.push(desktopResult);

      // Mobile audit
      const mobileResult = await this.auditPage(page.url, page.name, MOBILE_CONFIG, 'mobile');
      if (mobileResult) allResults.push(mobileResult);

      // Mobile 3G audit (for performance critical pages)
      if (page.priority === 'critical' || page.priority === 'high') {
        const mobile3gResult = await this.auditPage(page.url, page.name, MOBILE_3G_CONFIG, 'mobile-3g');
        if (mobile3gResult) allResults.push(mobile3gResult);
      }

      // Brief pause between pages
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Generate comprehensive report
    this.generateComprehensiveReport(allResults);

    return allResults;
  }

  generateComprehensiveReport(results) {
    const report = {
      auditDate: new Date().toISOString(),
      summary: this.generateSummary(results),
      detailedResults: results,
      recommendations: this.generateRecommendations(results),
      priorityMatrix: this.generatePriorityMatrix(results)
    };

    // Save comprehensive report
    fs.writeFileSync(
      path.join(this.auditDir, 'comprehensive-audit-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate markdown report
    this.generateMarkdownReport(report);

    console.log('\n✅ Comprehensive audit completed!');
    console.log(`📊 Results saved in: ${this.auditDir}`);

    return report;
  }

  generateSummary(results) {
    const summary = {
      totalPagesAudited: new Set(results.map(r => r.pageName)).size,
      averageScores: {
        desktop: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
        mobile: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 }
      },
      coreWebVitals: {
        desktop: { lcp: 0, fid: 0, cls: 0 },
        mobile: { lcp: 0, fid: 0, cls: 0 }
      },
      criticalIssues: 0,
      highImpactOpportunities: 0
    };

    const desktopResults = results.filter(r => r.configName === 'desktop');
    const mobileResults = results.filter(r => r.configName === 'mobile');

    // Calculate average scores
    if (desktopResults.length > 0) {
      summary.averageScores.desktop = {
        performance: Math.round(desktopResults.reduce((sum, r) => sum + r.scores.performance, 0) / desktopResults.length),
        accessibility: Math.round(desktopResults.reduce((sum, r) => sum + r.scores.accessibility, 0) / desktopResults.length),
        bestPractices: Math.round(desktopResults.reduce((sum, r) => sum + r.scores.bestPractices, 0) / desktopResults.length),
        seo: Math.round(desktopResults.reduce((sum, r) => sum + r.scores.seo, 0) / desktopResults.length)
      };

      summary.coreWebVitals.desktop = {
        lcp: Math.round(desktopResults.reduce((sum, r) => sum + r.metrics.lcp, 0) / desktopResults.length),
        fid: Math.round(desktopResults.reduce((sum, r) => sum + r.metrics.fid, 0) / desktopResults.length),
        cls: Math.round((desktopResults.reduce((sum, r) => sum + r.metrics.cls, 0) / desktopResults.length) * 1000) / 1000
      };
    }

    if (mobileResults.length > 0) {
      summary.averageScores.mobile = {
        performance: Math.round(mobileResults.reduce((sum, r) => sum + r.scores.performance, 0) / mobileResults.length),
        accessibility: Math.round(mobileResults.reduce((sum, r) => sum + r.scores.accessibility, 0) / mobileResults.length),
        bestPractices: Math.round(mobileResults.reduce((sum, r) => sum + r.scores.bestPractices, 0) / mobileResults.length),
        seo: Math.round(mobileResults.reduce((sum, r) => sum + r.scores.seo, 0) / mobileResults.length)
      };

      summary.coreWebVitals.mobile = {
        lcp: Math.round(mobileResults.reduce((sum, r) => sum + r.metrics.lcp, 0) / mobileResults.length),
        fid: Math.round(mobileResults.reduce((sum, r) => sum + r.metrics.fid, 0) / mobileResults.length),
        cls: Math.round((mobileResults.reduce((sum, r) => sum + r.metrics.cls, 0) / mobileResults.length) * 1000) / 1000
      };
    }

    // Count critical issues
    results.forEach(result => {
      summary.criticalIssues += result.a11yIssues.filter(issue => issue.impact === 'critical').length;
      summary.highImpactOpportunities += result.opportunities.filter(opp => (opp.numericValue || 0) > 1000).length;
    });

    return summary;
  }

  generateRecommendations(results) {
    const recommendations = {
      performance: [],
      accessibility: [],
      seo: [],
      mobile: []
    };

    // Analyze all results to generate recommendations
    const allOpportunities = [];
    const allA11yIssues = [];
    const allSeoIssues = [];

    results.forEach(result => {
      allOpportunities.push(...result.opportunities);
      allA11yIssues.push(...result.a11yIssues);
      allSeoIssues.push(...result.seoIssues);
    });

    // Group and prioritize opportunities
    const opportunityGroups = {};
    allOpportunities.forEach(opp => {
      if (!opportunityGroups[opp.id]) {
        opportunityGroups[opp.id] = { ...opp, count: 1, totalImpact: opp.numericValue || 0 };
      } else {
        opportunityGroups[opp.id].count++;
        opportunityGroups[opp.id].totalImpact += opp.numericValue || 0;
      }
    });

    // Generate performance recommendations
    const topOpportunities = Object.values(opportunityGroups)
      .sort((a, b) => b.totalImpact - a.totalImpact)
      .slice(0, 5);

    topOpportunities.forEach(opp => {
      recommendations.performance.push({
        title: opp.title,
        description: opp.description,
        impact: opp.totalImpact > 2000 ? 'High' : opp.totalImpact > 1000 ? 'Medium' : 'Low',
        pagesAffected: opp.count
      });
    });

    // Generate accessibility recommendations
    const a11yGroups = {};
    allA11yIssues.forEach(issue => {
      if (!a11yGroups[issue.id]) {
        a11yGroups[issue.id] = { ...issue, count: 1 };
      } else {
        a11yGroups[issue.id].count++;
      }
    });

    Object.values(a11yGroups)
      .sort((a, b) => (b.impact === 'critical' ? 1 : 0) - (a.impact === 'critical' ? 1 : 0))
      .slice(0, 5)
      .forEach(issue => {
        recommendations.accessibility.push({
          title: issue.title,
          description: issue.description,
          impact: issue.impact,
          pagesAffected: issue.count
        });
      });

    return recommendations;
  }

  generatePriorityMatrix(results) {
    return results.map(result => ({
      page: result.pageName,
      device: result.configName,
      overallScore: Math.round((result.scores.performance + result.scores.accessibility + result.scores.bestPractices + result.scores.seo) / 4),
      performanceScore: result.scores.performance,
      criticalIssues: result.a11yIssues.filter(issue => issue.impact === 'critical').length,
      priority: this.calculatePriority(result)
    })).sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));
  }

  calculatePriority(result) {
    const perfScore = result.scores.performance;
    const a11yScore = result.scores.accessibility;
    const criticalIssues = result.a11yIssues.filter(issue => issue.impact === 'critical').length;
    const highImpactOpportunities = result.opportunities.filter(opp => (opp.numericValue || 0) > 1000).length;

    if (perfScore < 50 || a11yScore < 50 || criticalIssues > 0) return 'Critical';
    if (perfScore < 70 || a11yScore < 70 || highImpactOpportunities > 2) return 'High';
    if (perfScore < 85 || a11yScore < 85) return 'Medium';
    return 'Low';
  }

  getPriorityValue(priority) {
    const values = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    return values[priority] || 0;
  }

  generateMarkdownReport(report) {
    const markdown = `# IT-ERA Lighthouse Audit Report

## Executive Summary

**Audit Date:** ${new Date(report.auditDate).toLocaleString()}
**Pages Audited:** ${report.summary.totalPagesAudited}

### Average Scores

#### Desktop
- **Performance:** ${report.summary.averageScores.desktop.performance}/100
- **Accessibility:** ${report.summary.averageScores.desktop.accessibility}/100
- **Best Practices:** ${report.summary.averageScores.desktop.bestPractices}/100
- **SEO:** ${report.summary.averageScores.desktop.seo}/100

#### Mobile
- **Performance:** ${report.summary.averageScores.mobile.performance}/100
- **Accessibility:** ${report.summary.averageScores.mobile.accessibility}/100
- **Best Practices:** ${report.summary.averageScores.mobile.bestPractices}/100
- **SEO:** ${report.summary.averageScores.mobile.seo}/100

### Core Web Vitals

#### Desktop
- **LCP (Largest Contentful Paint):** ${report.summary.coreWebVitals.desktop.lcp}ms
- **FID (First Input Delay):** ${report.summary.coreWebVitals.desktop.fid}ms
- **CLS (Cumulative Layout Shift):** ${report.summary.coreWebVitals.desktop.cls}

#### Mobile
- **LCP (Largest Contentful Paint):** ${report.summary.coreWebVitals.mobile.lcp}ms
- **FID (First Input Delay):** ${report.summary.coreWebVitals.mobile.fid}ms
- **CLS (Cumulative Layout Shift):** ${report.summary.coreWebVitals.mobile.cls}

### Critical Issues Summary
- **Critical Issues Found:** ${report.summary.criticalIssues}
- **High Impact Opportunities:** ${report.summary.highImpactOpportunities}

## Priority Matrix

| Page | Device | Overall Score | Performance | Critical Issues | Priority |
|------|---------|---------------|-------------|-----------------|----------|
${report.priorityMatrix.map(item =>
  `| ${item.page} | ${item.device} | ${item.overallScore}/100 | ${item.performanceScore}/100 | ${item.criticalIssues} | ${item.priority} |`
).join('\n')}

## Top Performance Recommendations

${report.recommendations.performance.map((rec, index) => `
### ${index + 1}. ${rec.title}
**Impact:** ${rec.impact} | **Pages Affected:** ${rec.pagesAffected}

${rec.description}
`).join('')}

## Top Accessibility Recommendations

${report.recommendations.accessibility.map((rec, index) => `
### ${index + 1}. ${rec.title}
**Impact:** ${rec.impact} | **Pages Affected:** ${rec.pagesAffected}

${rec.description}
`).join('')}

## Detailed Results

${report.detailedResults.map(result => `
### ${result.pageName} - ${result.configName.toUpperCase()}

**URL:** ${result.url}
**Audit Time:** ${new Date(result.timestamp).toLocaleString()}

#### Scores
- Performance: ${result.scores.performance}/100
- Accessibility: ${result.scores.accessibility}/100
- Best Practices: ${result.scores.bestPractices}/100
- SEO: ${result.scores.seo}/100

#### Core Web Vitals
- LCP: ${result.metrics.lcp}ms
- FID: ${result.metrics.fid}ms
- CLS: ${result.metrics.cls}
- FCP: ${result.metrics.fcp}ms
- Speed Index: ${result.metrics.si}ms
- TTI: ${result.metrics.tti}ms

#### Top Opportunities
${result.opportunities.slice(0, 3).map(opp => `- **${opp.title}:** ${opp.displayValue || 'N/A'}`).join('\n')}

#### Accessibility Issues
${result.a11yIssues.slice(0, 3).map(issue => `- **${issue.title}** (${issue.impact})`).join('\n')}

---
`).join('')}

## Next Steps

1. **Immediate Actions (Critical Priority)**
   - Fix critical accessibility issues
   - Optimize images and resources for largest contentful paint
   - Implement performance best practices

2. **Short-term Improvements (High Priority)**
   - Optimize JavaScript bundles
   - Implement lazy loading for images
   - Improve mobile responsiveness

3. **Long-term Optimizations (Medium Priority)**
   - Implement advanced caching strategies
   - Optimize third-party scripts
   - Enhance SEO structure

---

*Report generated by IT-ERA Performance Audit System*
*Powered by Google Lighthouse*
`;

    fs.writeFileSync(
      path.join(this.auditDir, 'LIGHTHOUSE-AUDIT-REPORT.md'),
      markdown
    );
  }
}

// Run the audit if called directly
if (require.main === module) {
  const auditor = new LighthouseAuditor();
  auditor.runFullAudit().catch(console.error);
}

module.exports = LighthouseAuditor;