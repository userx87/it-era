#!/usr/bin/env node
/**
 * Master QA Test Runner for IT-ERA Landing Pages
 * Orchestrates all quality assurance tests and generates comprehensive reports
 */

const fs = require('fs');
const path = require('path');
const HTMLValidator = require('./qa-html-validator');
const LinkChecker = require('./qa-link-checker');
const ResponsiveTester = require('./qa-responsive-tester');
const AccessibilityChecker = require('./qa-accessibility-checker');
const PerformanceTester = require('./qa-performance-tester');

class MasterQARunner {
    constructor() {
        this.startTime = Date.now();
        this.results = {
            html: [],
            links: [],
            responsive: [],
            accessibility: [],
            performance: []
        };
        this.summary = {
            totalFiles: 0,
            totalIssues: 0,
            criticalIssues: 0,
            overallScore: 0
        };
    }

    async runAllTests(pagesDir, testFileCount = 20) {
        console.log(`🚀 Starting comprehensive QA testing...`);
        console.log(`📁 Testing directory: ${pagesDir}`);
        
        if (!fs.existsSync(pagesDir)) {
            throw new Error(`Pages directory not found: ${pagesDir}`);
        }

        const allFiles = fs.readdirSync(pagesDir)
            .filter(f => f.endsWith('.html'))
            .slice(0, testFileCount);

        this.summary.totalFiles = allFiles.length;
        console.log(`📄 Files to test: ${allFiles.length}`);

        // Run HTML validation
        console.log('\n🔍 Running HTML validation...');
        await this.runHTMLValidation(pagesDir, allFiles);

        // Run link checking
        console.log('\n🔗 Running link validation...');
        await this.runLinkValidation(pagesDir, allFiles);

        // Run responsive design testing
        console.log('\n📱 Running responsive design analysis...');
        await this.runResponsiveAnalysis(pagesDir, allFiles);

        // Run accessibility testing
        console.log('\n♿ Running accessibility checks...');
        await this.runAccessibilityChecks(pagesDir, allFiles);

        // Run performance testing
        console.log('\n⚡ Running performance analysis...');
        await this.runPerformanceAnalysis(pagesDir, allFiles);

        // Calculate overall scores
        this.calculateOverallScore();

        // Generate master report
        const masterReport = this.generateMasterReport();
        
        // Save reports
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        fs.writeFileSync(`tests/qa-reports/master-qa-report-${timestamp}.md`, masterReport);
        
        console.log(`\n✅ QA testing complete! Reports saved to tests/qa-reports/`);
        console.log(`⏱️  Total time: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
        
        return this.summary;
    }

    async runHTMLValidation(pagesDir, files) {
        const validator = new HTMLValidator();
        
        this.results.html = files.map(file => {
            const filePath = path.join(pagesDir, file);
            return validator.validateFile(filePath);
        });

        const report = validator.generateReport(this.results.html);
        fs.writeFileSync('tests/qa-reports/html-validation-report.md', report);
        
        console.log(`   ✓ HTML validation complete - ${this.results.html.filter(r => r.issues.length === 0).length}/${files.length} files passed`);
    }

    async runLinkValidation(pagesDir, files) {
        const checker = new LinkChecker();
        
        this.results.links = files.map(file => {
            const filePath = path.join(pagesDir, file);
            return checker.checkFile(filePath, pagesDir);
        });

        const report = checker.generateReport(this.results.links);
        fs.writeFileSync('tests/qa-reports/link-validation-report.md', report);
        
        const brokenLinks = this.results.links.reduce((sum, r) => 
            sum + r.issues.filter(i => i.message.includes('Broken')).length, 0
        );
        console.log(`   ✓ Link validation complete - ${brokenLinks} broken links found`);
    }

    async runResponsiveAnalysis(pagesDir, files) {
        const tester = new ResponsiveTester();
        
        this.results.responsive = files.map(file => {
            const filePath = path.join(pagesDir, file);
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                return tester.analyzeCSS(content, file);
            } catch (error) {
                return {
                    fileName: file,
                    features: {},
                    issues: [{ type: 'error', message: `Failed to analyze: ${error.message}` }]
                };
            }
        });

        const report = tester.generateReport(this.results.responsive);
        fs.writeFileSync('tests/qa-reports/responsive-analysis-report.md', report);
        
        const responsiveFiles = this.results.responsive.filter(r => 
            r.features.hasViewportMeta && r.features.hasMediaQueries
        ).length;
        console.log(`   ✓ Responsive analysis complete - ${responsiveFiles}/${files.length} files are responsive`);
    }

    async runAccessibilityChecks(pagesDir, files) {
        const checker = new AccessibilityChecker();
        
        this.results.accessibility = files.map(file => {
            const filePath = path.join(pagesDir, file);
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const result = checker.checkAccessibility(content, file);
                result.score = checker.calculateScore(result.features, result.issues);
                return result;
            } catch (error) {
                return {
                    fileName: file,
                    features: {},
                    issues: [{ type: 'error', message: `Failed to check: ${error.message}` }],
                    score: 0
                };
            }
        });

        const report = checker.generateReport(this.results.accessibility);
        fs.writeFileSync('tests/qa-reports/accessibility-report.md', report);
        
        const averageScore = Math.round(
            this.results.accessibility.reduce((sum, r) => sum + r.score, 0) / files.length
        );
        console.log(`   ✓ Accessibility checks complete - Average score: ${averageScore}/100`);
    }

    async runPerformanceAnalysis(pagesDir, files) {
        const tester = new PerformanceTester();
        
        this.results.performance = files.map(file => {
            const filePath = path.join(pagesDir, file);
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                return tester.analyzePerformance(content, file);
            } catch (error) {
                return {
                    fileName: file,
                    metrics: { fileSize: 0, totalRequests: 0 },
                    issues: [{ type: 'error', message: `Failed to analyze: ${error.message}` }],
                    score: 0
                };
            }
        });

        const report = tester.generateReport(this.results.performance);
        fs.writeFileSync('tests/qa-reports/performance-report.md', report);
        
        const averageScore = Math.round(
            this.results.performance.reduce((sum, r) => sum + r.score, 0) / files.length
        );
        console.log(`   ✓ Performance analysis complete - Average score: ${averageScore}/100`);
    }

    calculateOverallScore() {
        const weights = {
            html: 0.15,      // 15% - Basic validity
            links: 0.20,     // 20% - Link integrity
            responsive: 0.20, // 20% - Mobile compatibility
            accessibility: 0.25, // 25% - Accessibility compliance
            performance: 0.20  // 20% - Performance optimization
        };

        let totalWeightedScore = 0;

        // HTML score (inverse of issues)
        const htmlIssues = this.results.html.reduce((sum, r) => sum + r.issues.length, 0);
        const htmlScore = Math.max(0, 100 - (htmlIssues / this.summary.totalFiles * 10));
        totalWeightedScore += htmlScore * weights.html;

        // Links score (inverse of broken links)
        const brokenLinks = this.results.links.reduce((sum, r) => 
            sum + r.issues.filter(i => i.message.includes('Broken')).length, 0
        );
        const linksScore = Math.max(0, 100 - (brokenLinks / this.summary.totalFiles * 20));
        totalWeightedScore += linksScore * weights.links;

        // Responsive score
        const responsiveFiles = this.results.responsive.filter(r => 
            r.features.hasViewportMeta && r.features.hasMediaQueries
        ).length;
        const responsiveScore = (responsiveFiles / this.summary.totalFiles) * 100;
        totalWeightedScore += responsiveScore * weights.responsive;

        // Accessibility average score
        const accessibilityScore = this.results.accessibility.reduce((sum, r) => sum + r.score, 0) / this.summary.totalFiles;
        totalWeightedScore += accessibilityScore * weights.accessibility;

        // Performance average score
        const performanceScore = this.results.performance.reduce((sum, r) => sum + r.score, 0) / this.summary.totalFiles;
        totalWeightedScore += performanceScore * weights.performance;

        this.summary.overallScore = Math.round(totalWeightedScore);

        // Count total issues
        this.summary.totalIssues = 
            this.results.html.reduce((sum, r) => sum + r.issues.length, 0) +
            this.results.links.reduce((sum, r) => sum + r.issues.length, 0) +
            this.results.responsive.reduce((sum, r) => sum + r.issues.length, 0) +
            this.results.accessibility.reduce((sum, r) => sum + r.issues.length, 0) +
            this.results.performance.reduce((sum, r) => sum + r.issues.length, 0);

        // Count critical issues (errors)
        this.summary.criticalIssues = 
            this.results.html.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'error').length, 0) +
            this.results.links.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'error').length, 0) +
            this.results.responsive.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'error').length, 0) +
            this.results.accessibility.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'error').length, 0) +
            this.results.performance.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'error').length, 0);
    }

    generateMasterReport() {
        const timestamp = new Date().toLocaleString();
        let report = `# 🔍 Master QA Report - IT-ERA Landing Pages\n\n`;
        report += `**Generated:** ${timestamp}\n`;
        report += `**Test Duration:** ${Math.round((Date.now() - this.startTime) / 1000)}s\n\n`;

        // Executive Summary
        report += `## 📊 Executive Summary\n\n`;
        const scoreColor = this.summary.overallScore >= 80 ? '🟢' : 
                          this.summary.overallScore >= 60 ? '🟡' : '🔴';
        
        report += `### Overall QA Score: ${scoreColor} ${this.summary.overallScore}/100\n\n`;
        report += `- **Files Tested:** ${this.summary.totalFiles}\n`;
        report += `- **Total Issues:** ${this.summary.totalIssues}\n`;
        report += `- **Critical Issues:** ${this.summary.criticalIssues}\n`;
        report += `- **Status:** ${this.getStatusMessage()}\n\n`;

        // Test Results Breakdown
        report += `## 🧪 Test Results Breakdown\n\n`;
        
        // HTML Validation
        const htmlPassed = this.results.html.filter(r => r.issues.length === 0).length;
        report += `### 🔍 HTML Validation\n`;
        report += `- **Passed:** ${htmlPassed}/${this.summary.totalFiles} files\n`;
        report += `- **Issues Found:** ${this.results.html.reduce((sum, r) => sum + r.issues.length, 0)}\n\n`;

        // Link Validation
        const brokenLinks = this.results.links.reduce((sum, r) => 
            sum + r.issues.filter(i => i.message.includes('Broken')).length, 0
        );
        report += `### 🔗 Link Validation\n`;
        report += `- **Broken Links:** ${brokenLinks}\n`;
        report += `- **Total Links:** ${this.results.links.reduce((sum, r) => sum + r.stats.total, 0)}\n\n`;

        // Responsive Design
        const responsiveFiles = this.results.responsive.filter(r => 
            r.features.hasViewportMeta && r.features.hasMediaQueries
        ).length;
        report += `### 📱 Responsive Design\n`;
        report += `- **Mobile Ready:** ${responsiveFiles}/${this.summary.totalFiles} files\n`;
        report += `- **Bootstrap Usage:** ${this.results.responsive.filter(r => r.features.usesBootstrap).length} files\n\n`;

        // Accessibility
        const avgAccessibilityScore = Math.round(
            this.results.accessibility.reduce((sum, r) => sum + r.score, 0) / this.summary.totalFiles
        );
        report += `### ♿ Accessibility (WCAG 2.1 AA)\n`;
        report += `- **Average Score:** ${avgAccessibilityScore}/100\n`;
        report += `- **Files >80 Score:** ${this.results.accessibility.filter(r => r.score >= 80).length}\n\n`;

        // Performance
        const avgPerformanceScore = Math.round(
            this.results.performance.reduce((sum, r) => sum + r.score, 0) / this.summary.totalFiles
        );
        const avgFileSize = Math.round(
            this.results.performance.reduce((sum, r) => sum + r.metrics.fileSize, 0) / this.summary.totalFiles / 1024
        );
        report += `### ⚡ Performance\n`;
        report += `- **Average Score:** ${avgPerformanceScore}/100\n`;
        report += `- **Average File Size:** ${avgFileSize}KB\n`;
        report += `- **Files >90 Score:** ${this.results.performance.filter(r => r.score >= 90).length}\n\n`;

        // Recommendations
        report += `## 🎯 Recommendations\n\n`;
        report += this.generateRecommendations();

        // Quality Gates
        report += `## 🚦 Quality Gates\n\n`;
        report += this.generateQualityGates();

        return report;
    }

    generateRecommendations() {
        let recommendations = '';
        
        if (this.summary.criticalIssues > 0) {
            recommendations += `### 🚨 Critical Issues (${this.summary.criticalIssues})\n`;
            recommendations += `These must be fixed before production deployment.\n\n`;
        }

        if (this.summary.overallScore < 80) {
            recommendations += `### 📈 Priority Improvements\n`;
            
            // Accessibility recommendations
            const lowAccessibilityFiles = this.results.accessibility.filter(r => r.score < 70).length;
            if (lowAccessibilityFiles > 0) {
                recommendations += `- Fix accessibility issues in ${lowAccessibilityFiles} files (WCAG compliance risk)\n`;
            }

            // Performance recommendations
            const slowFiles = this.results.performance.filter(r => r.score < 60).length;
            if (slowFiles > 0) {
                recommendations += `- Optimize performance in ${slowFiles} files (user experience impact)\n`;
            }

            // Link recommendations
            const brokenLinks = this.results.links.reduce((sum, r) => 
                sum + r.issues.filter(i => i.message.includes('Broken')).length, 0
            );
            if (brokenLinks > 0) {
                recommendations += `- Fix ${brokenLinks} broken links (SEO and UX impact)\n`;
            }
            
            recommendations += '\n';
        }

        recommendations += `### 🔧 Maintenance Tasks\n`;
        recommendations += `- Set up automated QA testing in CI/CD pipeline\n`;
        recommendations += `- Monitor performance metrics regularly\n`;
        recommendations += `- Schedule monthly accessibility audits\n`;
        recommendations += `- Implement link checking automation\n\n`;

        return recommendations;
    }

    generateQualityGates() {
        let gates = '';
        
        const checks = [
            {
                name: 'Overall QA Score',
                current: this.summary.overallScore,
                threshold: 80,
                status: this.summary.overallScore >= 80 ? '✅' : '❌'
            },
            {
                name: 'Critical Issues',
                current: this.summary.criticalIssues,
                threshold: 0,
                status: this.summary.criticalIssues === 0 ? '✅' : '❌'
            },
            {
                name: 'Broken Links',
                current: this.results.links.reduce((sum, r) => 
                    sum + r.issues.filter(i => i.message.includes('Broken')).length, 0
                ),
                threshold: 0,
                status: this.results.links.reduce((sum, r) => 
                    sum + r.issues.filter(i => i.message.includes('Broken')).length, 0
                ) === 0 ? '✅' : '❌'
            },
            {
                name: 'Accessibility Average',
                current: Math.round(this.results.accessibility.reduce((sum, r) => sum + r.score, 0) / this.summary.totalFiles),
                threshold: 75,
                status: Math.round(this.results.accessibility.reduce((sum, r) => sum + r.score, 0) / this.summary.totalFiles) >= 75 ? '✅' : '❌'
            }
        ];

        checks.forEach(check => {
            gates += `${check.status} **${check.name}:** ${check.current} (threshold: ${check.threshold})\n`;
        });

        gates += '\n';
        gates += `**Deployment Status:** ${checks.every(c => c.status === '✅') ? '🟢 APPROVED' : '🔴 BLOCKED'}\n\n`;

        return gates;
    }

    getStatusMessage() {
        if (this.summary.overallScore >= 90) return '🟢 Excellent - Production ready';
        if (this.summary.overallScore >= 80) return '🟡 Good - Minor improvements recommended';
        if (this.summary.overallScore >= 60) return '🟠 Fair - Significant improvements needed';
        return '🔴 Poor - Major issues must be resolved';
    }
}

// CLI usage
if (require.main === module) {
    const runner = new MasterQARunner();
    const pagesDir = process.argv[2] || 'web/pages';
    const testCount = parseInt(process.argv[3]) || 25;

    runner.runAllTests(pagesDir, testCount)
        .then(summary => {
            console.log('\n📋 Final Summary:');
            console.log(`Overall Score: ${summary.overallScore}/100`);
            console.log(`Total Issues: ${summary.totalIssues}`);
            console.log(`Critical Issues: ${summary.criticalIssues}`);
        })
        .catch(error => {
            console.error('❌ QA testing failed:', error.message);
            process.exit(1);
        });
}

module.exports = MasterQARunner;