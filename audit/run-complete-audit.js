#!/usr/bin/env node

const LighthouseAuditor = require('./lighthouse-audit');
const AccessibilityAuditor = require('./accessibility-audit');
const SEOAuditor = require('./seo-audit');
const fs = require('fs');
const path = require('path');

// Landing pages to audit
const LANDING_PAGES = [
  { url: 'http://localhost:8080/', name: 'Homepage', priority: 'critical' },
  { url: 'http://localhost:8080/contatti.html', name: 'Contatti', priority: 'high' },
  { url: 'http://localhost:8080/servizi.html', name: 'Servizi', priority: 'high' },
  { url: 'http://localhost:8080/fixes-landing-digitalizzazione-pmi.html', name: 'Digitalizzazione PMI', priority: 'high' },
  { url: 'http://localhost:8080/fixes-landing-assistenza-emergenza.html', name: 'Assistenza Emergenza', priority: 'high' },
  { url: 'http://localhost:8080/fixes-landing-cloud-migration.html', name: 'Cloud Migration', priority: 'medium' },
  { url: 'http://localhost:8080/fixes-landing-sicurezza-informatica.html', name: 'Sicurezza Informatica', priority: 'high' },
  { url: 'http://localhost:8080/fixes-landing-software-commercialisti.html', name: 'Software Commercialisti', priority: 'medium' }
];

class CompleteAuditor {
  constructor() {
    this.lighthouseAuditor = new LighthouseAuditor();
    this.accessibilityAuditor = new AccessibilityAuditor();
    this.seoAuditor = new SEOAuditor();
    this.auditDir = path.join(__dirname, 'results');
    this.ensureAuditDir();
  }

  ensureAuditDir() {
    if (!fs.existsSync(this.auditDir)) {
      fs.mkdirSync(this.auditDir, { recursive: true });
    }
  }

  async runCompleteAudit() {
    console.log('🚀 Starting COMPLETE IT-ERA Performance & Accessibility Audit...\n');
    console.log(`📊 Auditing ${LANDING_PAGES.length} landing pages`);
    console.log(`🎯 Tests: Lighthouse + Accessibility + SEO + Mobile 3G\n`);

    const startTime = Date.now();
    const allResults = {
      lighthouse: [],
      accessibility: [],
      seo: []
    };

    // Run Lighthouse audits first (most comprehensive)
    console.log('🔍 Phase 1: Lighthouse Performance Audits...');
    const lighthouseResults = await this.lighthouseAuditor.runFullAudit();
    allResults.lighthouse = lighthouseResults;

    // Run Accessibility audits
    console.log('\n♿ Phase 2: Accessibility Audits (WCAG 2.1 AA)...');
    for (const page of LANDING_PAGES) {
      const accessibilityResult = await this.accessibilityAuditor.auditAccessibility(page.url, page.name);
      if (accessibilityResult) {
        allResults.accessibility.push(accessibilityResult);
      }
      // Brief pause
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Run SEO audits
    console.log('\n🔍 Phase 3: SEO Audits...');
    for (const page of LANDING_PAGES) {
      const seoResult = await this.seoAuditor.auditSEO(page.url, page.name);
      if (seoResult) {
        allResults.seo.push(seoResult);
      }
      // Brief pause
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate unified report
    const unifiedReport = this.generateUnifiedReport(allResults);

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ Complete audit finished in ${totalTime} seconds`);
    console.log(`📊 Results saved in: ${this.auditDir}`);

    return unifiedReport;
  }

  generateUnifiedReport(allResults) {
    console.log('\n📊 Generating unified performance report...');

    const report = {
      auditDate: new Date().toISOString(),
      summary: this.generateExecutiveSummary(allResults),
      detailedAnalysis: this.generateDetailedAnalysis(allResults),
      coreWebVitals: this.analyzeCoreWebVitals(allResults.lighthouse),
      accessibilityCompliance: this.analyzeAccessibility(allResults.accessibility),
      seoOptimization: this.analyzeSEO(allResults.seo),
      mobilePerformance: this.analyzeMobilePerformance(allResults.lighthouse),
      criticalIssues: this.identifyCriticalIssues(allResults),
      actionPlan: this.generateActionPlan(allResults),
      baselineComparison: this.generateBaselineComparison(allResults),
      rawResults: allResults
    };

    // Save unified report
    fs.writeFileSync(
      path.join(this.auditDir, 'UNIFIED-AUDIT-REPORT.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate executive markdown report
    this.generateExecutiveReport(report);

    return report;
  }

  generateExecutiveSummary(allResults) {
    const summary = {
      overallScore: 0,
      pagesAudited: LANDING_PAGES.length,
      totalIssues: 0,
      criticalIssues: 0,
      performanceGrade: 'N/A',
      accessibilityGrade: 'N/A',
      seoGrade: 'N/A',
      mobileReadiness: 'N/A'
    };

    // Calculate overall performance score from Lighthouse
    if (allResults.lighthouse.length > 0) {
      const avgPerformance = allResults.lighthouse
        .filter(r => r.configName === 'desktop')
        .reduce((sum, r) => sum + r.scores.performance, 0) / LANDING_PAGES.length;

      summary.performanceGrade = this.getGrade(avgPerformance);
    }

    // Calculate accessibility score
    if (allResults.accessibility.length > 0) {
      const totalViolations = allResults.accessibility.reduce((sum, r) => sum + r.summary.totalViolations, 0);
      const avgViolationsPerPage = totalViolations / allResults.accessibility.length;

      summary.accessibilityGrade = avgViolationsPerPage === 0 ? 'A+' :
                                   avgViolationsPerPage <= 2 ? 'A' :
                                   avgViolationsPerPage <= 5 ? 'B' :
                                   avgViolationsPerPage <= 10 ? 'C' : 'D';

      summary.criticalIssues += allResults.accessibility.reduce((sum, r) => sum + r.summary.criticalViolations, 0);
    }

    // Calculate SEO score
    if (allResults.seo.length > 0) {
      const avgSeoScore = allResults.seo.reduce((sum, r) => sum + r.seoScore, 0) / allResults.seo.length;
      summary.seoGrade = this.getGrade(avgSeoScore);
    }

    // Mobile readiness
    const mobileResults = allResults.lighthouse.filter(r => r.configName === 'mobile');
    if (mobileResults.length > 0) {
      const avgMobilePerf = mobileResults.reduce((sum, r) => sum + r.scores.performance, 0) / mobileResults.length;
      summary.mobileReadiness = this.getGrade(avgMobilePerf);
    }

    // Calculate overall score (weighted average)
    const scores = [
      allResults.lighthouse.filter(r => r.configName === 'desktop').reduce((sum, r) => sum + r.scores.performance, 0) / LANDING_PAGES.length,
      100 - (allResults.accessibility.reduce((sum, r) => sum + r.summary.totalViolations, 0) * 5), // Penalty per violation
      allResults.seo.reduce((sum, r) => sum + r.seoScore, 0) / allResults.seo.length
    ].filter(score => !isNaN(score));

    summary.overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

    return summary;
  }

  generateDetailedAnalysis(allResults) {
    const analysis = {};

    // Performance analysis
    analysis.performance = {
      averageScores: {
        desktop: this.calculateAverageScores(allResults.lighthouse, 'desktop'),
        mobile: this.calculateAverageScores(allResults.lighthouse, 'mobile')
      },
      topOpportunities: this.getTopOpportunities(allResults.lighthouse),
      slowestPages: this.getSlowestPages(allResults.lighthouse)
    };

    // Accessibility analysis
    analysis.accessibility = {
      totalViolations: allResults.accessibility.reduce((sum, r) => sum + r.summary.totalViolations, 0),
      violationsByImpact: this.groupViolationsByImpact(allResults.accessibility),
      commonIssues: this.getCommonAccessibilityIssues(allResults.accessibility)
    };

    // SEO analysis
    analysis.seo = {
      averageScore: allResults.seo.reduce((sum, r) => sum + r.seoScore, 0) / allResults.seo.length,
      commonIssues: this.getCommonSEOIssues(allResults.seo),
      missingElements: this.getMissingSEOElements(allResults.seo)
    };

    return analysis;
  }

  analyzeCoreWebVitals(lighthouseResults) {
    const desktopResults = lighthouseResults.filter(r => r.configName === 'desktop');
    const mobileResults = lighthouseResults.filter(r => r.configName === 'mobile');

    return {
      desktop: this.calculateWebVitalsStats(desktopResults),
      mobile: this.calculateWebVitalsStats(mobileResults),
      mobile3g: this.calculateWebVitalsStats(lighthouseResults.filter(r => r.configName === 'mobile-3g')),
      recommendations: this.generateWebVitalsRecommendations(lighthouseResults)
    };
  }

  calculateWebVitalsStats(results) {
    if (results.length === 0) return null;

    return {
      lcp: {
        average: Math.round(results.reduce((sum, r) => sum + r.metrics.lcp, 0) / results.length),
        best: Math.round(Math.min(...results.map(r => r.metrics.lcp))),
        worst: Math.round(Math.max(...results.map(r => r.metrics.lcp))),
        grade: this.getLCPGrade(results.reduce((sum, r) => sum + r.metrics.lcp, 0) / results.length)
      },
      fid: {
        average: Math.round(results.reduce((sum, r) => sum + r.metrics.fid, 0) / results.length),
        grade: this.getFIDGrade(results.reduce((sum, r) => sum + r.metrics.fid, 0) / results.length)
      },
      cls: {
        average: Math.round((results.reduce((sum, r) => sum + r.metrics.cls, 0) / results.length) * 1000) / 1000,
        grade: this.getCLSGrade(results.reduce((sum, r) => sum + r.metrics.cls, 0) / results.length)
      }
    };
  }

  identifyCriticalIssues(allResults) {
    const issues = [];

    // Performance critical issues
    allResults.lighthouse.forEach(result => {
      if (result.scores.performance < 50) {
        issues.push({
          type: 'Performance',
          severity: 'Critical',
          page: result.pageName,
          device: result.configName,
          description: `Performance score of ${result.scores.performance} is critically low`,
          impact: 'High user abandonment risk, poor SEO ranking'
        });
      }

      if (result.metrics.lcp > 4000) {
        issues.push({
          type: 'Core Web Vitals',
          severity: 'Critical',
          page: result.pageName,
          device: result.configName,
          description: `LCP of ${Math.round(result.metrics.lcp)}ms exceeds recommended 2.5s`,
          impact: 'Poor user experience, SEO penalty'
        });
      }
    });

    // Accessibility critical issues
    allResults.accessibility.forEach(result => {
      if (result.summary.criticalViolations > 0) {
        issues.push({
          type: 'Accessibility',
          severity: 'Critical',
          page: result.pageName,
          description: `${result.summary.criticalViolations} critical accessibility violations found`,
          impact: 'Legal compliance risk, users with disabilities cannot access content'
        });
      }
    });

    // SEO critical issues
    allResults.seo.forEach(result => {
      const criticalSeoIssues = result.recommendations.filter(r => r.category === 'Critical');
      if (criticalSeoIssues.length > 0) {
        issues.push({
          type: 'SEO',
          severity: 'Critical',
          page: result.pageName,
          description: `Critical SEO issues: ${criticalSeoIssues.map(i => i.issue).join(', ')}`,
          impact: 'Poor search engine visibility, loss of organic traffic'
        });
      }
    });

    return issues.sort((a, b) => (b.severity === 'Critical' ? 1 : 0) - (a.severity === 'Critical' ? 1 : 0));
  }

  generateActionPlan(allResults) {
    const plan = {
      immediate: [], // 0-1 week
      shortTerm: [], // 1-4 weeks
      longTerm: [] // 1-3 months
    };

    // Critical performance issues (immediate)
    const criticalPerfIssues = allResults.lighthouse.filter(r => r.scores.performance < 50);
    if (criticalPerfIssues.length > 0) {
      plan.immediate.push({
        action: 'Fix critical performance issues',
        description: 'Optimize images, minify CSS/JS, enable compression',
        pages: criticalPerfIssues.map(r => r.pageName),
        estimatedImpact: 'High',
        effort: 'Medium'
      });
    }

    // Critical accessibility issues (immediate)
    const criticalA11yIssues = allResults.accessibility.filter(r => r.summary.criticalViolations > 0);
    if (criticalA11yIssues.length > 0) {
      plan.immediate.push({
        action: 'Fix critical accessibility violations',
        description: 'Add missing alt texts, fix color contrast, ensure keyboard navigation',
        pages: criticalA11yIssues.map(r => r.pageName),
        estimatedImpact: 'High',
        effort: 'Low'
      });
    }

    // SEO optimizations (short term)
    plan.shortTerm.push({
      action: 'Optimize SEO fundamentals',
      description: 'Improve title tags, meta descriptions, add structured data',
      pages: 'All pages',
      estimatedImpact: 'Medium',
      effort: 'Medium'
    });

    // Mobile optimization (short term)
    const poorMobilePages = allResults.lighthouse.filter(r => r.configName === 'mobile' && r.scores.performance < 70);
    if (poorMobilePages.length > 0) {
      plan.shortTerm.push({
        action: 'Improve mobile performance',
        description: 'Implement responsive images, optimize for mobile-first loading',
        pages: poorMobilePages.map(r => r.pageName),
        estimatedImpact: 'High',
        effort: 'High'
      });
    }

    // Advanced optimizations (long term)
    plan.longTerm.push({
      action: 'Implement advanced performance optimizations',
      description: 'Service workers, code splitting, CDN implementation, advanced caching',
      pages: 'All pages',
      estimatedImpact: 'Medium',
      effort: 'High'
    });

    return plan;
  }

  generateBaselineComparison(allResults) {
    // This would compare with previous audit results
    // For now, return structure for future implementation
    return {
      availableBaselines: [],
      comparison: null,
      note: 'No previous baseline found. This audit will serve as the initial baseline.'
    };
  }

  generateExecutiveReport(report) {
    const markdown = `# IT-ERA COMPLETE PERFORMANCE & ACCESSIBILITY AUDIT

## 🎯 Executive Summary

**Audit Date:** ${new Date(report.auditDate).toLocaleString()}
**Pages Audited:** ${report.summary.pagesAudited}
**Overall Score:** ${report.summary.overallScore}/100

### 📊 Grade Summary
| Category | Grade | Status |
|----------|-------|--------|
| **Performance** | ${report.summary.performanceGrade} | ${report.summary.performanceGrade >= 'B' ? '✅ Good' : '⚠️ Needs Improvement'} |
| **Accessibility** | ${report.summary.accessibilityGrade} | ${report.summary.accessibilityGrade >= 'B' ? '✅ Compliant' : '❌ Non-Compliant'} |
| **SEO** | ${report.summary.seoGrade} | ${report.summary.seoGrade >= 'B' ? '✅ Optimized' : '⚠️ Needs Work'} |
| **Mobile Ready** | ${report.summary.mobileReadiness} | ${report.summary.mobileReadiness >= 'B' ? '✅ Mobile-First' : '📱 Mobile Issues'} |

## 🚨 Critical Issues (${report.criticalIssues.length})

${report.criticalIssues.slice(0, 5).map(issue => `
### ${issue.type}: ${issue.page}
**Severity:** ${issue.severity}
**Issue:** ${issue.description}
**Business Impact:** ${issue.impact}
`).join('')}

## ⚡ Core Web Vitals Analysis

### Desktop Performance
- **LCP (Largest Contentful Paint):** ${report.coreWebVitals.desktop?.lcp.average || 'N/A'}ms (${report.coreWebVitals.desktop?.lcp.grade || 'N/A'})
- **FID (First Input Delay):** ${report.coreWebVitals.desktop?.fid.average || 'N/A'}ms (${report.coreWebVitals.desktop?.fid.grade || 'N/A'})
- **CLS (Cumulative Layout Shift):** ${report.coreWebVitals.desktop?.cls.average || 'N/A'} (${report.coreWebVitals.desktop?.cls.grade || 'N/A'})

### Mobile Performance
- **LCP:** ${report.coreWebVitals.mobile?.lcp.average || 'N/A'}ms (${report.coreWebVitals.mobile?.lcp.grade || 'N/A'})
- **FID:** ${report.coreWebVitals.mobile?.fid.average || 'N/A'}ms (${report.coreWebVitals.mobile?.fid.grade || 'N/A'})
- **CLS:** ${report.coreWebVitals.mobile?.cls.average || 'N/A'} (${report.coreWebVitals.mobile?.cls.grade || 'N/A'})

${report.coreWebVitals.mobile3g ? `
### Mobile 3G Performance
- **LCP:** ${report.coreWebVitals.mobile3g.lcp.average}ms (${report.coreWebVitals.mobile3g.lcp.grade})
- **FID:** ${report.coreWebVitals.mobile3g.fid.average}ms (${report.coreWebVitals.mobile3g.fid.grade})
- **CLS:** ${report.coreWebVitals.mobile3g.cls.average} (${report.coreWebVitals.mobile3g.cls.grade})
` : ''}

## ♿ Accessibility Compliance (WCAG 2.1 AA)

- **Total Violations:** ${report.detailedAnalysis.accessibility.totalViolations}
- **Critical Violations:** ${report.detailedAnalysis.accessibility.violationsByImpact.critical || 0}
- **Compliance Status:** ${report.summary.accessibilityGrade >= 'B' ? '✅ WCAG 2.1 AA Compliant' : '❌ Non-Compliant - Immediate Action Required'}

## 🔍 SEO Optimization

- **Average SEO Score:** ${Math.round(report.detailedAnalysis.seo.averageScore)}/100
- **Common Issues:** ${report.detailedAnalysis.seo.commonIssues?.slice(0, 3).join(', ') || 'None identified'}

## 📱 Mobile Performance Analysis

${report.mobilePerformance ? `
- **Mobile vs Desktop Gap:** ${report.mobilePerformance.performanceGap || 'N/A'}%
- **3G Loading Time:** ${report.mobilePerformance.mobile3gLoadTime || 'N/A'}ms
- **Mobile Usability Issues:** ${report.mobilePerformance.usabilityIssues || 0}
` : 'Mobile analysis pending...'}

## 🎯 Immediate Action Plan (Next 7 Days)

${report.actionPlan.immediate.map((action, index) => `
### ${index + 1}. ${action.action}
**Pages:** ${Array.isArray(action.pages) ? action.pages.join(', ') : action.pages}
**Description:** ${action.description}
**Impact:** ${action.estimatedImpact} | **Effort:** ${action.effort}
`).join('')}

## 📈 Short-Term Improvements (1-4 Weeks)

${report.actionPlan.shortTerm.map((action, index) => `
### ${index + 1}. ${action.action}
**Description:** ${action.description}
**Impact:** ${action.estimatedImpact} | **Effort:** ${action.effort}
`).join('')}

## 🚀 Long-Term Optimization (1-3 Months)

${report.actionPlan.longTerm.map((action, index) => `
### ${index + 1}. ${action.action}
**Description:** ${action.description}
**Impact:** ${action.estimatedImpact} | **Effort:** ${action.effort}
`).join('')}

## 📊 Detailed Performance Breakdown

### Top Performance Opportunities
${report.detailedAnalysis.performance.topOpportunities?.slice(0, 5).map(opp => `- **${opp.title}:** ${opp.totalImpact}ms potential savings`).join('\n') || 'No major opportunities identified'}

### Slowest Pages
${report.detailedAnalysis.performance.slowestPages?.slice(0, 3).map(page => `- **${page.name}:** ${page.loadTime}ms average load time`).join('\n') || 'Performance data not available'}

---

## ✅ Next Steps Checklist

- [ ] Fix all critical accessibility violations
- [ ] Optimize images and enable compression
- [ ] Improve mobile Core Web Vitals
- [ ] Complete SEO meta tag optimization
- [ ] Implement performance monitoring
- [ ] Schedule follow-up audit in 30 days

---

*Report generated by IT-ERA Performance Audit System*
*Powered by Google Lighthouse + Custom Accessibility & SEO Audits*
`;

    fs.writeFileSync(
      path.join(this.auditDir, 'EXECUTIVE-AUDIT-REPORT.md'),
      markdown
    );

    console.log('✅ Executive report generated: EXECUTIVE-AUDIT-REPORT.md');
  }

  // Helper methods
  getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  getLCPGrade(lcp) {
    if (lcp <= 2500) return 'Good';
    if (lcp <= 4000) return 'Needs Improvement';
    return 'Poor';
  }

  getFIDGrade(fid) {
    if (fid <= 100) return 'Good';
    if (fid <= 300) return 'Needs Improvement';
    return 'Poor';
  }

  getCLSGrade(cls) {
    if (cls <= 0.1) return 'Good';
    if (cls <= 0.25) return 'Needs Improvement';
    return 'Poor';
  }

  calculateAverageScores(results, configName) {
    const filtered = results.filter(r => r.configName === configName);
    if (filtered.length === 0) return null;

    return {
      performance: Math.round(filtered.reduce((sum, r) => sum + r.scores.performance, 0) / filtered.length),
      accessibility: Math.round(filtered.reduce((sum, r) => sum + r.scores.accessibility, 0) / filtered.length),
      bestPractices: Math.round(filtered.reduce((sum, r) => sum + r.scores.bestPractices, 0) / filtered.length),
      seo: Math.round(filtered.reduce((sum, r) => sum + r.scores.seo, 0) / filtered.length)
    };
  }

  getTopOpportunities(lighthouseResults) {
    const allOpportunities = [];
    lighthouseResults.forEach(result => {
      result.opportunities.forEach(opp => {
        const existing = allOpportunities.find(a => a.id === opp.id);
        if (existing) {
          existing.totalImpact += opp.numericValue || 0;
          existing.count++;
        } else {
          allOpportunities.push({
            id: opp.id,
            title: opp.title,
            totalImpact: opp.numericValue || 0,
            count: 1
          });
        }
      });
    });

    return allOpportunities
      .sort((a, b) => b.totalImpact - a.totalImpact)
      .slice(0, 5);
  }

  getSlowestPages(lighthouseResults) {
    return lighthouseResults
      .filter(r => r.configName === 'mobile') // Focus on mobile performance
      .map(result => ({
        name: result.pageName,
        loadTime: Math.round(result.metrics.lcp),
        device: result.configName
      }))
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, 5);
  }

  groupViolationsByImpact(accessibilityResults) {
    const grouped = { critical: 0, serious: 0, moderate: 0, minor: 0 };

    accessibilityResults.forEach(result => {
      grouped.critical += result.summary.criticalViolations;
      grouped.serious += result.summary.seriousViolations;
      grouped.moderate += result.summary.moderateViolations;
      grouped.minor += result.summary.minorViolations;
    });

    return grouped;
  }

  getCommonAccessibilityIssues(accessibilityResults) {
    const issueCount = {};

    accessibilityResults.forEach(result => {
      if (result.axeResults && result.axeResults.violations) {
        result.axeResults.violations.forEach(violation => {
          issueCount[violation.id] = (issueCount[violation.id] || 0) + 1;
        });
      }
    });

    return Object.keys(issueCount)
      .sort((a, b) => issueCount[b] - issueCount[a])
      .slice(0, 5);
  }

  getCommonSEOIssues(seoResults) {
    const issueCount = {};

    seoResults.forEach(result => {
      result.recommendations.forEach(rec => {
        issueCount[rec.issue] = (issueCount[rec.issue] || 0) + 1;
      });
    });

    return Object.keys(issueCount)
      .sort((a, b) => issueCount[b] - issueCount[a])
      .slice(0, 5);
  }

  getMissingSEOElements(seoResults) {
    const missing = {
      titles: 0,
      descriptions: 0,
      canonical: 0,
      og: 0
    };

    seoResults.forEach(result => {
      if (!result.seoData.title.exists) missing.titles++;
      if (!result.seoData.metaDescription.exists) missing.descriptions++;
      if (!result.seoData.canonical.exists) missing.canonical++;
      if (!result.seoData.openGraph.title) missing.og++;
    });

    return missing;
  }

  generateWebVitalsRecommendations(lighthouseResults) {
    const recommendations = [];

    // Analyze LCP issues
    const avgLCP = lighthouseResults.reduce((sum, r) => sum + r.metrics.lcp, 0) / lighthouseResults.length;
    if (avgLCP > 2500) {
      recommendations.push({
        metric: 'LCP',
        issue: 'Largest Contentful Paint is too slow',
        recommendation: 'Optimize images, implement lazy loading, improve server response time'
      });
    }

    // Analyze CLS issues
    const avgCLS = lighthouseResults.reduce((sum, r) => sum + r.metrics.cls, 0) / lighthouseResults.length;
    if (avgCLS > 0.1) {
      recommendations.push({
        metric: 'CLS',
        issue: 'Layout shifts detected',
        recommendation: 'Set explicit dimensions for images/videos, reserve space for dynamic content'
      });
    }

    return recommendations;
  }

  analyzeMobilePerformance(lighthouseResults) {
    const desktopResults = lighthouseResults.filter(r => r.configName === 'desktop');
    const mobileResults = lighthouseResults.filter(r => r.configName === 'mobile');

    if (desktopResults.length === 0 || mobileResults.length === 0) {
      return null;
    }

    const desktopAvg = desktopResults.reduce((sum, r) => sum + r.scores.performance, 0) / desktopResults.length;
    const mobileAvg = mobileResults.reduce((sum, r) => sum + r.scores.performance, 0) / mobileResults.length;

    return {
      performanceGap: Math.round(desktopAvg - mobileAvg),
      mobile3gLoadTime: lighthouseResults
        .filter(r => r.configName === 'mobile-3g')
        .reduce((sum, r) => sum + r.metrics.lcp, 0) / lighthouseResults.filter(r => r.configName === 'mobile-3g').length || null,
      usabilityIssues: mobileResults.reduce((sum, r) =>
        sum + r.opportunities.filter(opp => opp.id.includes('mobile') || opp.id.includes('touch')).length, 0
      )
    };
  }

  analyzeAccessibility(accessibilityResults) {
    return {
      totalViolations: accessibilityResults.reduce((sum, r) => sum + r.summary.totalViolations, 0),
      criticalViolations: accessibilityResults.reduce((sum, r) => sum + r.summary.criticalViolations, 0),
      complianceRate: Math.round(100 - (accessibilityResults.reduce((sum, r) => sum + r.summary.totalViolations, 0) / accessibilityResults.length * 5))
    };
  }

  analyzeSEO(seoResults) {
    const avgScore = seoResults.reduce((sum, r) => sum + r.seoScore, 0) / seoResults.length;
    const criticalIssues = seoResults.reduce((sum, r) =>
      sum + r.recommendations.filter(rec => rec.category === 'Critical').length, 0
    );

    return {
      averageScore: Math.round(avgScore),
      criticalIssues,
      optimizationLevel: avgScore >= 80 ? 'Well Optimized' : avgScore >= 60 ? 'Partially Optimized' : 'Needs Work'
    };
  }
}

// Run the complete audit if called directly
if (require.main === module) {
  const auditor = new CompleteAuditor();
  auditor.runCompleteAudit()
    .then(result => {
      console.log('\n🎉 Audit Summary:');
      console.log(`📊 Overall Score: ${result.summary.overallScore}/100`);
      console.log(`⚡ Performance Grade: ${result.summary.performanceGrade}`);
      console.log(`♿ Accessibility Grade: ${result.summary.accessibilityGrade}`);
      console.log(`🔍 SEO Grade: ${result.summary.seoGrade}`);
      console.log(`📱 Mobile Grade: ${result.summary.mobileReadiness}`);
      console.log(`🚨 Critical Issues: ${result.criticalIssues.length}`);
    })
    .catch(console.error);
}

module.exports = CompleteAuditor;