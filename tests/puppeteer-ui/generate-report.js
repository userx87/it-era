const fs = require('fs-extra');
const path = require('path');

class TestReportGenerator {
  constructor() {
    this.reportsDir = path.join(__dirname, 'reports');
    this.screenshotsDir = path.join(__dirname, 'screenshots');
    this.outputDir = path.join(__dirname, 'final-reports');
  }
  
  async generateComprehensiveReport() {
    await fs.ensureDir(this.outputDir);
    
    console.log('🚀 Generating comprehensive IT-ERA Chatbot UI Test Report...\n');
    
    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        testSuite: 'IT-ERA Swarm Chatbot UI Testing',
        version: '1.0.0',
        environment: 'Staging',
        targetAPI: 'https://it-era-chatbot-staging.bulltech.workers.dev'
      },
      summary: await this.generateSummary(),
      testResults: await this.aggregateTestResults(),
      performanceAnalysis: await this.analyzePerformance(),
      accessibilityReport: await this.analyzeAccessibility(),
      recommendations: await this.generateRecommendations(),
      screenshots: await this.catalogScreenshots()
    };
    
    // Generate HTML report
    const htmlReport = await this.generateHTMLReport(reportData);
    await fs.writeFile(path.join(this.outputDir, 'comprehensive-ui-test-report.html'), htmlReport);
    
    // Generate JSON data
    await fs.writeJson(path.join(this.outputDir, 'test-results-data.json'), reportData, { spaces: 2 });
    
    // Generate markdown summary
    const markdownReport = await this.generateMarkdownReport(reportData);
    await fs.writeFile(path.join(this.outputDir, 'TEST-SUMMARY.md'), markdownReport);
    
    console.log('✅ Reports generated successfully!');
    console.log(`📁 Output directory: ${this.outputDir}`);
    
    return reportData;
  }
  
  async generateSummary() {
    const summary = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testCategories: {
        uiResponsiveness: { status: 'unknown', details: 'Not executed' },
        chatbotInterface: { status: 'unknown', details: 'Not executed' },
        adminPanel: { status: 'unknown', details: 'Not executed' },
        interactionFlow: { status: 'unknown', details: 'Not executed' },
        performance: { status: 'unknown', details: 'Not executed' },
        accessibility: { status: 'unknown', details: 'Not executed' }
      },
      psdComplianceScore: 0
    };
    
    // This would be populated by actual test execution
    // For now, providing estimated structure
    return summary;
  }
  
  async aggregateTestResults() {
    const testFiles = [
      'ui-load-test-results.json',
      'browser-compatibility-results.json',
      'keyboard-navigation.json',
      'lighthouse-metrics.json',
      'api-performance.json',
      'accessibility-audit.json'
    ];
    
    const results = {};
    
    for (const file of testFiles) {
      const filePath = path.join(this.reportsDir, file);
      if (await fs.pathExists(filePath)) {
        try {
          results[file] = await fs.readJson(filePath);
        } catch (error) {
          results[file] = { error: `Failed to load: ${error.message}` };
        }
      } else {
        results[file] = { status: 'not_executed' };
      }
    }
    
    return results;
  }
  
  async analyzePerformance() {
    const performanceFiles = [
      'page-load-performance.json',
      'javascript-performance.json',
      'api-performance.json',
      'lighthouse-metrics.json',
      'memory-usage.json'
    ];
    
    const analysis = {
      summary: {
        pageLoadTime: 'N/A',
        apiResponseTime: 'N/A',
        lighthouseScore: 'N/A',
        memoryUsage: 'N/A'
      },
      psdCompliance: {
        responseTimeUnder1600ms: false,
        costPerQueryUnder004: false,
        errorRateUnder5Percent: false
      },
      recommendations: []
    };
    
    for (const file of performanceFiles) {
      const filePath = path.join(this.reportsDir, file);
      if (await fs.pathExists(filePath)) {
        try {
          const data = await fs.readJson(filePath);
          
          if (file === 'api-performance.json' && data.averageResponseTime) {
            analysis.summary.apiResponseTime = `${data.averageResponseTime}ms`;
            analysis.psdCompliance.responseTimeUnder1600ms = data.averageResponseTime < 1600;
          }
          
          if (file === 'lighthouse-metrics.json' && data.performanceScore) {
            analysis.summary.lighthouseScore = `${data.performanceScore}/100`;
          }
          
          if (file === 'memory-usage.json' && data.memoryUsageMB) {
            analysis.summary.memoryUsage = `${data.memoryUsageMB.toFixed(2)}MB`;
          }
          
        } catch (error) {
          console.error(`Error analyzing ${file}:`, error.message);
        }
      }
    }
    
    // Generate recommendations based on performance data
    if (!analysis.psdCompliance.responseTimeUnder1600ms) {
      analysis.recommendations.push({
        category: 'Performance',
        priority: 'High',
        issue: 'API response time exceeds PSD requirement of <1.6s',
        solution: 'Optimize swarm processing, implement caching, or upgrade infrastructure'
      });
    }
    
    return analysis;
  }
  
  async analyzeAccessibility() {
    const accessibilityFiles = [
      'accessibility-audit.json',
      'keyboard-navigation.json',
      'color-contrast.json',
      'mobile-accessibility.json'
    ];
    
    const analysis = {
      wcagCompliance: {
        level: 'Unknown',
        violations: 0,
        passes: 0
      },
      keyboardNavigation: {
        supported: false,
        focusableElements: 0
      },
      colorContrast: {
        compliant: false,
        violations: 0
      },
      mobileAccessibility: {
        touchTargetsAdequate: false,
        inadequateTargets: 0
      },
      recommendations: []
    };
    
    for (const file of accessibilityFiles) {
      const filePath = path.join(this.reportsDir, file);
      if (await fs.pathExists(filePath)) {
        try {
          const data = await fs.readJson(filePath);
          
          if (file === 'accessibility-audit.json') {
            analysis.wcagCompliance.violations = data.violations?.length || 0;
            analysis.wcagCompliance.passes = data.passes?.length || 0;
            analysis.wcagCompliance.level = analysis.wcagCompliance.violations === 0 ? 'AA Compliant' : 'Non-compliant';
          }
          
          if (file === 'keyboard-navigation.json') {
            analysis.keyboardNavigation.focusableElements = data.focusableElements?.length || 0;
            analysis.keyboardNavigation.supported = analysis.keyboardNavigation.focusableElements > 0;
          }
          
          if (file === 'mobile-accessibility.json') {
            analysis.mobileAccessibility.inadequateTargets = data.inadequateTouchTargets || 0;
            analysis.mobileAccessibility.touchTargetsAdequate = analysis.mobileAccessibility.inadequateTargets === 0;
          }
          
        } catch (error) {
          console.error(`Error analyzing ${file}:`, error.message);
        }
      }
    }
    
    // Generate accessibility recommendations
    if (analysis.wcagCompliance.violations > 0) {
      analysis.recommendations.push({
        category: 'Accessibility',
        priority: 'Critical',
        issue: `${analysis.wcagCompliance.violations} WCAG violations found`,
        solution: 'Review and fix accessibility violations to ensure compliance'
      });
    }
    
    if (analysis.mobileAccessibility.inadequateTargets > 0) {
      analysis.recommendations.push({
        category: 'Mobile Accessibility',
        priority: 'High',
        issue: `${analysis.mobileAccessibility.inadequateTargets} touch targets below 44px minimum`,
        solution: 'Increase touch target sizes for mobile accessibility'
      });
    }
    
    return analysis;
  }
  
  async generateRecommendations() {
    return {
      immediate: [
        {
          priority: 'Critical',
          category: 'Performance',
          issue: 'API response time validation',
          action: 'Verify that all API responses meet the <1.6s requirement from PSD',
          effort: 'Low',
          impact: 'High'
        },
        {
          priority: 'Critical',
          category: 'Accessibility',
          issue: 'WCAG compliance verification',
          action: 'Run axe-core audit and fix any violations',
          effort: 'Medium',
          impact: 'High'
        }
      ],
      shortTerm: [
        {
          priority: 'High',
          category: 'User Experience',
          issue: 'Cross-browser compatibility testing',
          action: 'Test on Safari, Firefox, and Edge browsers',
          effort: 'Medium',
          impact: 'Medium'
        },
        {
          priority: 'High',
          category: 'Performance',
          issue: 'Memory usage optimization',
          action: 'Implement cleanup routines for long conversations',
          effort: 'High',
          impact: 'Medium'
        }
      ],
      longTerm: [
        {
          priority: 'Medium',
          category: 'Testing',
          issue: 'Automated UI testing pipeline',
          action: 'Integrate tests into CI/CD pipeline',
          effort: 'High',
          impact: 'High'
        },
        {
          priority: 'Medium',
          category: 'Monitoring',
          issue: 'Real user monitoring',
          action: 'Implement RUM for production performance tracking',
          effort: 'High',
          impact: 'Medium'
        }
      ]
    };
  }
  
  async catalogScreenshots() {
    const screenshots = [];
    
    if (await fs.pathExists(this.screenshotsDir)) {
      const files = await fs.readdir(this.screenshotsDir);
      
      for (const file of files) {
        if (file.endsWith('.png')) {
          const filePath = path.join(this.screenshotsDir, file);
          const stats = await fs.stat(filePath);
          
          screenshots.push({
            filename: file,
            path: filePath,
            category: this.categorizeScreenshot(file),
            timestamp: stats.mtime,
            size: stats.size
          });
        }
      }
    }
    
    return screenshots.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  categorizeScreenshot(filename) {
    if (filename.includes('mobile') || filename.includes('tablet')) return 'Responsive Design';
    if (filename.includes('admin')) return 'Admin Panel';
    if (filename.includes('accessibility')) return 'Accessibility';
    if (filename.includes('performance') || filename.includes('lighthouse')) return 'Performance';
    if (filename.includes('journey') || filename.includes('flow')) return 'User Journey';
    if (filename.includes('error') || filename.includes('validation')) return 'Error Handling';
    return 'General UI';
  }
  
  async generateHTMLReport(data) {
    return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA Chatbot UI Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f6fa;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 300;
        }
        
        .header .subtitle {
            margin-top: 10px;
            opacity: 0.9;
            font-size: 16px;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            color: #2c3e50;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #667eea;
        }
        
        .card h3 {
            margin-top: 0;
            color: #667eea;
        }
        
        .status-pass {
            color: #27ae60;
            font-weight: bold;
        }
        
        .status-fail {
            color: #e74c3c;
            font-weight: bold;
        }
        
        .status-warning {
            color: #f39c12;
            font-weight: bold;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .metric:last-child {
            border-bottom: none;
        }
        
        .recommendations {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .recommendations h4 {
            color: #e17055;
            margin-top: 0;
        }
        
        .recommendation-item {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #e17055;
        }
        
        .priority-critical {
            border-left-color: #e74c3c;
        }
        
        .priority-high {
            border-left-color: #f39c12;
        }
        
        .priority-medium {
            border-left-color: #3498db;
        }
        
        .screenshots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .screenshot-item {
            text-align: center;
            background: #f8f9fa;
            padding: 10px;
            border-radius: 8px;
        }
        
        .screenshot-item img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .footer {
            background: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 IT-ERA Chatbot UI Test Report</h1>
            <div class="subtitle">Comprehensive Testing Results & Analysis</div>
            <div class="subtitle">Generated: ${new Date(data.metadata.generatedAt).toLocaleString('it-IT')}</div>
        </div>
        
        <div class="content">
            <!-- Executive Summary -->
            <div class="section">
                <h2>📊 Executive Summary</h2>
                <div class="grid">
                    <div class="card">
                        <h3>Test Overview</h3>
                        <div class="metric">
                            <span>Total Tests:</span>
                            <span class="status-warning">${data.summary.totalTests || 'In Progress'}</span>
                        </div>
                        <div class="metric">
                            <span>Passed:</span>
                            <span class="status-pass">${data.summary.passedTests || 'TBD'}</span>
                        </div>
                        <div class="metric">
                            <span>Failed:</span>
                            <span class="status-fail">${data.summary.failedTests || 'TBD'}</span>
                        </div>
                        <div class="metric">
                            <span>PSD Compliance:</span>
                            <span class="status-warning">${data.summary.psdComplianceScore || 'Evaluating'}%</span>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3>Performance Highlights</h3>
                        <div class="metric">
                            <span>Page Load:</span>
                            <span>${data.performanceAnalysis.summary.pageLoadTime}</span>
                        </div>
                        <div class="metric">
                            <span>API Response:</span>
                            <span>${data.performanceAnalysis.summary.apiResponseTime}</span>
                        </div>
                        <div class="metric">
                            <span>Lighthouse Score:</span>
                            <span>${data.performanceAnalysis.summary.lighthouseScore}</span>
                        </div>
                        <div class="metric">
                            <span>Memory Usage:</span>
                            <span>${data.performanceAnalysis.summary.memoryUsage}</span>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3>Accessibility Status</h3>
                        <div class="metric">
                            <span>WCAG Compliance:</span>
                            <span class="${data.accessibilityReport.wcagCompliance.violations === 0 ? 'status-pass' : 'status-fail'}">
                                ${data.accessibilityReport.wcagCompliance.level}
                            </span>
                        </div>
                        <div class="metric">
                            <span>Violations:</span>
                            <span class="${data.accessibilityReport.wcagCompliance.violations === 0 ? 'status-pass' : 'status-fail'}">
                                ${data.accessibilityReport.wcagCompliance.violations}
                            </span>
                        </div>
                        <div class="metric">
                            <span>Keyboard Navigation:</span>
                            <span class="${data.accessibilityReport.keyboardNavigation.supported ? 'status-pass' : 'status-fail'}">
                                ${data.accessibilityReport.keyboardNavigation.supported ? 'Supported' : 'Issues Found'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Test Categories -->
            <div class="section">
                <h2>🧪 Test Categories</h2>
                <div class="grid">
                    ${Object.entries(data.summary.testCategories).map(([category, info]) => `
                        <div class="card">
                            <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                            <div class="metric">
                                <span>Status:</span>
                                <span class="status-${info.status === 'pass' ? 'pass' : info.status === 'fail' ? 'fail' : 'warning'}">
                                    ${info.status.toUpperCase()}
                                </span>
                            </div>
                            <p style="margin-top: 10px; font-size: 14px; color: #666;">
                                ${info.details}
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Recommendations -->
            <div class="section">
                <h2>💡 Recommendations</h2>
                
                <div class="recommendations">
                    <h4>🚨 Immediate Actions Required</h4>
                    ${data.recommendations.immediate.map(rec => `
                        <div class="recommendation-item priority-${rec.priority.toLowerCase()}">
                            <strong>${rec.category}: ${rec.issue}</strong>
                            <p>${rec.action}</p>
                            <small>Effort: ${rec.effort} | Impact: ${rec.impact}</small>
                        </div>
                    `).join('')}
                </div>
                
                <div class="recommendations">
                    <h4>📅 Short-term Improvements</h4>
                    ${data.recommendations.shortTerm.map(rec => `
                        <div class="recommendation-item priority-${rec.priority.toLowerCase()}">
                            <strong>${rec.category}: ${rec.issue}</strong>
                            <p>${rec.action}</p>
                            <small>Effort: ${rec.effort} | Impact: ${rec.impact}</small>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Screenshots Gallery -->
            <div class="section">
                <h2>📸 Test Screenshots</h2>
                <p>Total screenshots captured: ${data.screenshots.length}</p>
                <div class="screenshots-grid">
                    ${data.screenshots.slice(0, 12).map(screenshot => `
                        <div class="screenshot-item">
                            <h4>${screenshot.category}</h4>
                            <p style="font-size: 12px; color: #666;">${screenshot.filename}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>IT-ERA Chatbot UI Testing Suite v1.0 | Generated with Puppeteer & Jest</p>
            <p>Target API: ${data.metadata.targetAPI}</p>
        </div>
    </div>
</body>
</html>`;
  }
  
  async generateMarkdownReport(data) {
    return `# IT-ERA Chatbot UI Test Report

## 📊 Executive Summary

- **Generated:** ${new Date(data.metadata.generatedAt).toLocaleString('it-IT')}
- **Test Suite:** ${data.metadata.testSuite}
- **Environment:** ${data.metadata.environment}
- **Target API:** ${data.metadata.targetAPI}

## 🎯 Test Results Overview

| Metric | Status | Details |
|--------|--------|---------|
| Total Tests | ${data.summary.totalTests || 'In Progress'} | Comprehensive UI testing suite |
| Passed Tests | ${data.summary.passedTests || 'TBD'} | Successfully executed tests |
| Failed Tests | ${data.summary.failedTests || 'TBD'} | Tests requiring attention |
| PSD Compliance | ${data.summary.psdComplianceScore || 'Evaluating'}% | Compliance with Product Specification |

## 🚀 Performance Analysis

### Key Metrics
- **Page Load Time:** ${data.performanceAnalysis.summary.pageLoadTime}
- **API Response Time:** ${data.performanceAnalysis.summary.apiResponseTime}
- **Lighthouse Score:** ${data.performanceAnalysis.summary.lighthouseScore}
- **Memory Usage:** ${data.performanceAnalysis.summary.memoryUsage}

### PSD Compliance Check
- ✅ Response Time < 1.6s: ${data.performanceAnalysis.psdCompliance.responseTimeUnder1600ms ? 'PASS' : 'FAIL'}
- ✅ Cost per Query < €0.04: ${data.performanceAnalysis.psdCompliance.costPerQueryUnder004 ? 'PASS' : 'PENDING'}
- ✅ Error Rate < 5%: ${data.performanceAnalysis.psdCompliance.errorRateUnder5Percent ? 'PASS' : 'PENDING'}

## ♿ Accessibility Report

- **WCAG Compliance:** ${data.accessibilityReport.wcagCompliance.level}
- **Violations Found:** ${data.accessibilityReport.wcagCompliance.violations}
- **Successful Checks:** ${data.accessibilityReport.wcagCompliance.passes}
- **Keyboard Navigation:** ${data.accessibilityReport.keyboardNavigation.supported ? '✅ Supported' : '❌ Issues Found'}
- **Mobile Touch Targets:** ${data.accessibilityReport.mobileAccessibility.touchTargetsAdequate ? '✅ Adequate' : '❌ Need Improvement'}

## 🛠️ Recommendations

### Immediate Actions (Critical Priority)
${data.recommendations.immediate.map(rec => `
- **${rec.category}:** ${rec.issue}
  - *Action:* ${rec.action}
  - *Effort:* ${rec.effort} | *Impact:* ${rec.impact}
`).join('')}

### Short-term Improvements (High Priority)
${data.recommendations.shortTerm.map(rec => `
- **${rec.category}:** ${rec.issue}
  - *Action:* ${rec.action}
  - *Effort:* ${rec.effort} | *Impact:* ${rec.impact}
`).join('')}

### Long-term Enhancements (Medium Priority)
${data.recommendations.longTerm.map(rec => `
- **${rec.category}:** ${rec.issue}
  - *Action:* ${rec.action}
  - *Effort:* ${rec.effort} | *Impact:* ${rec.impact}
`).join('')}

## 📸 Test Evidence

Total screenshots captured: **${data.screenshots.length}**

### Screenshot Categories:
${Object.entries(
  data.screenshots.reduce((acc, screenshot) => {
    acc[screenshot.category] = (acc[screenshot.category] || 0) + 1;
    return acc;
  }, {})
).map(([category, count]) => `- ${category}: ${count} screenshots`).join('\n')}

## 🔍 Detailed Test Categories

${Object.entries(data.summary.testCategories).map(([category, info]) => `
### ${category.charAt(0).toUpperCase() + category.slice(1)}
- **Status:** ${info.status.toUpperCase()}
- **Details:** ${info.details}
`).join('')}

## 📋 Next Steps

1. **Execute remaining test suites** - Complete all planned test scenarios
2. **Address critical issues** - Focus on performance and accessibility violations
3. **Validate PSD compliance** - Ensure all Product Specification requirements are met
4. **Set up CI/CD integration** - Automate testing pipeline for continuous validation
5. **Monitor production metrics** - Implement real-user monitoring after deployment

---

*Report generated by IT-ERA UI Testing Suite v1.0*
*Contact: Development Team | IT-ERA*`;
  }
}

// CLI execution
if (require.main === module) {
  const generator = new TestReportGenerator();
  generator.generateComprehensiveReport()
    .then((data) => {
      console.log('\\n✨ Report generation complete!');
      console.log('📁 Check the final-reports directory for outputs');
    })
    .catch((error) => {
      console.error('❌ Report generation failed:', error);
      process.exit(1);
    });
}

module.exports = TestReportGenerator;