#!/usr/bin/env node
/**
 * Accessibility (WCAG) Checker for IT-ERA Landing Pages
 * Tests for WCAG 2.1 AA compliance and accessibility best practices
 */

const fs = require('fs');
const path = require('path');

class AccessibilityChecker {
    constructor() {
        this.wcagLevel = 'AA';
        this.checkedElements = 0;
    }

    checkAccessibility(content, fileName) {
        const issues = [];
        const features = {
            hasLangAttribute: false,
            hasSkipLinks: false,
            hasProperHeadingStructure: false,
            hasAltAttributes: true, // Assume true until proven false
            hasFormLabels: true,
            hasRoleAttributes: false,
            hasAriaLabels: false,
            hasProperContrast: true, // Visual check needed
            hasKeyboardNavigation: false
        };

        this.checkedElements = 0;

        // Check lang attribute
        if (content.match(/<html[^>]*lang=["'][^"']+["'][^>]*>/i)) {
            features.hasLangAttribute = true;
        } else {
            issues.push({
                type: 'error',
                message: 'Missing lang attribute on html element (WCAG 3.1.1)',
                wcag: '3.1.1'
            });
        }

        // Check skip links
        if (content.includes('skip') && content.includes('#main')) {
            features.hasSkipLinks = true;
        } else {
            issues.push({
                type: 'warning',
                message: 'No skip links found - important for keyboard navigation',
                wcag: '2.4.1'
            });
        }

        // Check heading structure
        const headingIssues = this.checkHeadingStructure(content);
        if (headingIssues.length === 0) {
            features.hasProperHeadingStructure = true;
        } else {
            issues.push(...headingIssues);
        }

        // Check image alt attributes
        const imgIssues = this.checkImageAlt(content);
        if (imgIssues.length > 0) {
            features.hasAltAttributes = false;
            issues.push(...imgIssues);
        }

        // Check form labels
        const formIssues = this.checkFormLabels(content);
        if (formIssues.length > 0) {
            features.hasFormLabels = false;
            issues.push(...formIssues);
        }

        // Check ARIA attributes
        if (content.includes('aria-') || content.includes('role=')) {
            if (content.includes('aria-label') || content.includes('aria-labelledby')) {
                features.hasAriaLabels = true;
            }
            if (content.includes('role=')) {
                features.hasRoleAttributes = true;
            }
        }

        // Check keyboard navigation indicators
        if (content.includes(':focus') || content.includes('tabindex')) {
            features.hasKeyboardNavigation = true;
        } else {
            issues.push({
                type: 'warning',
                message: 'No focus styles or tabindex attributes found - may not be keyboard accessible',
                wcag: '2.1.1'
            });
        }

        // Check color contrast (basic heuristic)
        const contrastIssues = this.checkColorContrast(content);
        if (contrastIssues.length > 0) {
            features.hasProperContrast = false;
            issues.push(...contrastIssues);
        }

        // Check links
        const linkIssues = this.checkLinks(content);
        issues.push(...linkIssues);

        // Check tables
        const tableIssues = this.checkTables(content);
        issues.push(...tableIssues);

        return { fileName, features, issues, elementsChecked: this.checkedElements };
    }

    checkHeadingStructure(content) {
        const issues = [];
        const headingMatches = content.match(/<h[1-6][^>]*>/gi) || [];
        
        if (headingMatches.length === 0) {
            issues.push({
                type: 'warning',
                message: 'No heading tags found - important for screen readers',
                wcag: '1.3.1'
            });
            return issues;
        }

        const headingLevels = headingMatches.map(heading => {
            const level = parseInt(heading.match(/h([1-6])/i)[1]);
            return level;
        });

        // Check if starts with h1
        if (headingLevels[0] !== 1) {
            issues.push({
                type: 'error',
                message: 'Page should start with h1 tag',
                wcag: '1.3.1'
            });
        }

        // Check for skipped levels
        for (let i = 1; i < headingLevels.length; i++) {
            if (headingLevels[i] > headingLevels[i-1] + 1) {
                issues.push({
                    type: 'error',
                    message: `Heading structure skips levels: h${headingLevels[i-1]} to h${headingLevels[i]}`,
                    wcag: '1.3.1'
                });
            }
        }

        this.checkedElements += headingMatches.length;
        return issues;
    }

    checkImageAlt(content) {
        const issues = [];
        const imgTags = content.match(/<img[^>]*>/gi) || [];
        
        imgTags.forEach((img, index) => {
            if (!img.includes('alt=')) {
                issues.push({
                    type: 'error',
                    message: `Image ${index + 1} missing alt attribute`,
                    wcag: '1.1.1'
                });
            } else {
                // Check for empty alt on decorative images
                const altMatch = img.match(/alt=["']([^"']*)["']/i);
                if (altMatch) {
                    const altText = altMatch[1].trim();
                    if (altText.length === 0 && !img.includes('decorative')) {
                        issues.push({
                            type: 'warning',
                            message: `Image ${index + 1} has empty alt text - ensure it's decorative`,
                            wcag: '1.1.1'
                        });
                    }
                    if (altText.length > 125) {
                        issues.push({
                            type: 'warning',
                            message: `Image ${index + 1} alt text is very long (${altText.length} chars)`,
                            wcag: '1.1.1'
                        });
                    }
                }
            }
        });

        this.checkedElements += imgTags.length;
        return issues;
    }

    checkFormLabels(content) {
        const issues = [];
        const inputTags = content.match(/<input[^>]*>/gi) || [];
        const selectTags = content.match(/<select[^>]*>/gi) || [];
        const textareaTags = content.match(/<textarea[^>]*>/gi) || [];
        
        const formElements = [...inputTags, ...selectTags, ...textareaTags];
        
        formElements.forEach((element, index) => {
            // Skip hidden inputs and buttons
            if (element.includes('type="hidden"') || element.includes('type="button"') || element.includes('type="submit"')) {
                return;
            }

            const hasId = element.includes('id=');
            const hasAriaLabel = element.includes('aria-label=');
            const hasAriaLabelledby = element.includes('aria-labelledby=');
            
            if (!hasId && !hasAriaLabel && !hasAriaLabelledby) {
                issues.push({
                    type: 'error',
                    message: `Form element ${index + 1} has no associated label`,
                    wcag: '1.3.1'
                });
            }

            // Check for required fields without aria-required
            if (element.includes('required') && !element.includes('aria-required')) {
                issues.push({
                    type: 'warning',
                    message: `Required form element ${index + 1} should have aria-required="true"`,
                    wcag: '3.3.2'
                });
            }
        });

        this.checkedElements += formElements.length;
        return issues;
    }

    checkColorContrast(content) {
        const issues = [];
        
        // Basic heuristic checks for potential contrast issues
        const lightColors = ['white', '#fff', '#ffffff', '#f0f0f0', '#e0e0e0'];
        const darkColors = ['black', '#000', '#000000', '#333', '#444'];
        
        // This is a simplified check - real contrast testing requires more sophisticated tools
        if (content.includes('color: white') && content.includes('background: white')) {
            issues.push({
                type: 'error',
                message: 'Potential contrast issue: white text on white background',
                wcag: '1.4.3'
            });
        }

        if (content.includes('color: #ccc') || content.includes('color: #ddd')) {
            issues.push({
                type: 'warning',
                message: 'Light gray text may have contrast issues',
                wcag: '1.4.3'
            });
        }

        return issues;
    }

    checkLinks(content) {
        const issues = [];
        const linkTags = content.match(/<a[^>]*>.*?<\/a>/gi) || [];
        
        linkTags.forEach((link, index) => {
            const linkText = link.replace(/<[^>]*>/g, '').trim();
            
            if (linkText.length === 0 && !link.includes('aria-label')) {
                issues.push({
                    type: 'error',
                    message: `Link ${index + 1} has no accessible text`,
                    wcag: '2.4.4'
                });
            }

            // Check for generic link text
            const genericTexts = ['click here', 'read more', 'here', 'more'];
            if (genericTexts.some(text => linkText.toLowerCase().includes(text))) {
                issues.push({
                    type: 'warning',
                    message: `Link ${index + 1} uses generic text: "${linkText}"`,
                    wcag: '2.4.4'
                });
            }

            // Check external links
            if (link.includes('target="_blank"') && !link.includes('aria-label')) {
                issues.push({
                    type: 'warning',
                    message: `External link ${index + 1} should indicate it opens in new window`,
                    wcag: '3.2.5'
                });
            }
        });

        this.checkedElements += linkTags.length;
        return issues;
    }

    checkTables(content) {
        const issues = [];
        const tableTags = content.match(/<table[^>]*>.*?<\/table>/gi) || [];
        
        tableTags.forEach((table, index) => {
            if (!table.includes('<th')) {
                issues.push({
                    type: 'error',
                    message: `Table ${index + 1} missing header cells (th elements)`,
                    wcag: '1.3.1'
                });
            }

            if (!table.includes('<caption') && !table.includes('aria-label')) {
                issues.push({
                    type: 'warning',
                    message: `Table ${index + 1} missing caption or aria-label`,
                    wcag: '1.3.1'
                });
            }
        });

        this.checkedElements += tableTags.length;
        return issues;
    }

    calculateScore(features, issues) {
        const totalFeatures = Object.keys(features).length;
        const activeFeatures = Object.values(features).filter(Boolean).length;
        const errorCount = issues.filter(i => i.type === 'error').length;
        const warningCount = issues.filter(i => i.type === 'warning').length;

        // Score based on features (60%) and issues (40%)
        const featureScore = (activeFeatures / totalFeatures) * 60;
        const issueScore = Math.max(0, 40 - (errorCount * 8 + warningCount * 3));
        
        return Math.round(featureScore + issueScore);
    }

    generateReport(results) {
        let report = '# Accessibility (WCAG 2.1 AA) Report\n\n';
        
        const totalFiles = results.length;
        const averageScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalFiles);
        const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
        const totalErrors = results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'error').length, 0);

        report += `## Summary\n`;
        report += `- Files tested: ${totalFiles}\n`;
        report += `- Average accessibility score: ${averageScore}/100\n`;
        report += `- Total issues: ${totalIssues} (${totalErrors} errors)\n`;
        report += `- Elements checked: ${results.reduce((sum, r) => sum + r.elementsChecked, 0)}\n\n`;

        // Feature compliance
        const features = Object.keys(results[0]?.features || {});
        report += `## WCAG Feature Compliance\n`;
        features.forEach(feature => {
            const count = results.filter(r => r.features[feature]).length;
            const percentage = Math.round(count/totalFiles*100);
            const featureName = feature.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase());
            const status = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌';
            report += `${status} ${featureName}: ${count}/${totalFiles} (${percentage}%)\n`;
        });
        report += '\n';

        // Top issues by frequency
        const allIssues = results.flatMap(r => r.issues);
        const issueFrequency = allIssues.reduce((acc, issue) => {
            const key = issue.message;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const sortedIssues = Object.entries(issueFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        if (sortedIssues.length > 0) {
            report += `## Most Common Issues\n`;
            sortedIssues.forEach(([issue, count]) => {
                report += `- ${issue} (${count} occurrences)\n`;
            });
            report += '\n';
        }

        // Individual file results
        const filesWithIssues = results.filter(r => r.issues.length > 0);
        
        if (filesWithIssues.length === 0) {
            report += '## 🎉 All files passed accessibility checks!\n';
        } else {
            report += `## Detailed Results\n\n`;
            
            results.forEach(result => {
                const scoreColor = result.score >= 80 ? '🟢' : result.score >= 60 ? '🟡' : '🔴';
                report += `### ${result.fileName} ${scoreColor} (${result.score}/100)\n`;
                
                if (result.issues.length === 0) {
                    report += '✅ No accessibility issues found\n\n';
                } else {
                    result.issues.forEach(issue => {
                        const icon = issue.type === 'error' ? '❌' : '⚠️';
                        report += `${icon} ${issue.message}`;
                        if (issue.wcag) {
                            report += ` (WCAG ${issue.wcag})`;
                        }
                        report += '\n';
                    });
                    report += '\n';
                }
            });
        }

        return report;
    }
}

module.exports = AccessibilityChecker;

// CLI usage
if (require.main === module) {
    const checker = new AccessibilityChecker();
    const pagesDir = process.argv[2] || 'web/pages';
    
    if (!fs.existsSync(pagesDir)) {
        console.error('Pages directory not found:', pagesDir);
        process.exit(1);
    }
    
    const files = fs.readdirSync(pagesDir)
        .filter(f => f.endsWith('.html'))
        .slice(0, 10); // Test first 10 files for demo
    
    console.log(`Checking accessibility in ${files.length} HTML files...`);
    
    const results = files.map(file => {
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
                elementsChecked: 0,
                score: 0
            };
        }
    });
    
    const report = checker.generateReport(results);
    console.log(report);
    
    // Write report to file
    fs.writeFileSync('tests/qa-reports/accessibility-report.md', report);
    console.log('Report saved to tests/qa-reports/accessibility-report.md');
}