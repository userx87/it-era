#!/usr/bin/env node
/**
 * Responsive Design Tester for IT-ERA Landing Pages
 * Tests responsive breakpoints and mobile-first design
 */

const fs = require('fs');
const path = require('path');

class ResponsiveTester {
    constructor() {
        this.breakpoints = {
            mobile: { min: 320, max: 767, description: 'Mobile devices' },
            tablet: { min: 768, max: 991, description: 'Tablet devices' },
            desktop: { min: 992, max: 1199, description: 'Desktop devices' },
            large: { min: 1200, max: 9999, description: 'Large screens' }
        };
    }

    analyzeCSS(content, fileName) {
        const issues = [];
        const features = {
            hasViewportMeta: false,
            hasMediaQueries: false,
            usesFlexbox: false,
            usesBootstrap: false,
            hasResponsiveImages: false,
            mobileFirst: false
        };

        // Check viewport meta tag
        if (content.match(/<meta[^>]*name=["']viewport["'][^>]*>/i)) {
            features.hasViewportMeta = true;
        } else {
            issues.push({ 
                type: 'error', 
                message: 'Missing viewport meta tag - essential for mobile responsiveness' 
            });
        }

        // Check for media queries
        const mediaQueries = content.match(/@media[^{]+{[^}]*}/gi) || [];
        if (mediaQueries.length > 0) {
            features.hasMediaQueries = true;
            
            // Check for mobile-first approach
            const mobileFirstQueries = mediaQueries.filter(mq => 
                mq.includes('min-width') && !mq.includes('max-width')
            );
            if (mobileFirstQueries.length >= mediaQueries.length * 0.7) {
                features.mobileFirst = true;
            }
        } else {
            issues.push({
                type: 'warning',
                message: 'No media queries found - may not be responsive'
            });
        }

        // Check for Bootstrap usage
        if (content.includes('bootstrap') || content.includes('col-') || content.includes('container')) {
            features.usesBootstrap = true;
        }

        // Check for flexbox usage
        if (content.includes('display: flex') || content.includes('d-flex')) {
            features.usesFlexbox = true;
        }

        // Check for responsive images
        const imgTags = content.match(/<img[^>]*>/gi) || [];
        const responsiveImages = imgTags.filter(img => 
            img.includes('responsive') || 
            img.includes('img-fluid') || 
            img.includes('max-width: 100%')
        );
        if (responsiveImages.length > 0 || content.includes('img-fluid')) {
            features.hasResponsiveImages = true;
        }

        // Check common responsive issues
        if (content.includes('position: fixed') && !content.includes('@media')) {
            issues.push({
                type: 'warning',
                message: 'Fixed positioning without media queries may cause mobile issues'
            });
        }

        // Check for large fixed widths
        const fixedWidths = content.match(/width:\s*(\d+)px/gi) || [];
        const largeFixedWidths = fixedWidths.filter(width => {
            const value = parseInt(width.match(/\d+/)[0]);
            return value > 768;
        });
        if (largeFixedWidths.length > 0) {
            issues.push({
                type: 'warning',
                message: `Found ${largeFixedWidths.length} large fixed width elements that may not be mobile-friendly`
            });
        }

        return { fileName, features, issues, mediaQueries: mediaQueries.length };
    }

    checkCommonPatterns(content) {
        const patterns = [];
        
        // Bootstrap responsive utilities
        if (content.includes('d-none d-md-block') || content.includes('d-block d-md-none')) {
            patterns.push('Bootstrap responsive display utilities');
        }
        
        // Bootstrap grid system
        if (content.match(/col-(xs|sm|md|lg|xl)-\d+/)) {
            patterns.push('Bootstrap responsive grid system');
        }
        
        // Custom breakpoint handling
        if (content.includes('@media (max-width:') || content.includes('@media (min-width:')) {
            patterns.push('Custom media query breakpoints');
        }

        // Responsive typography
        if (content.includes('vw') || content.includes('vh') || content.includes('rem')) {
            patterns.push('Responsive typography units');
        }

        return patterns;
    }

    generateReport(results) {
        let report = '# Responsive Design Analysis Report\n\n';
        
        const totalFiles = results.length;
        const filesWithViewport = results.filter(r => r.features.hasViewportMeta).length;
        const filesWithMediaQueries = results.filter(r => r.features.hasMediaQueries).length;
        const mobileFirstFiles = results.filter(r => r.features.mobileFirst).length;

        report += `## Summary\n`;
        report += `- Files analyzed: ${totalFiles}\n`;
        report += `- Files with viewport meta: ${filesWithViewport} (${Math.round(filesWithViewport/totalFiles*100)}%)\n`;
        report += `- Files with media queries: ${filesWithMediaQueries} (${Math.round(filesWithMediaQueries/totalFiles*100)}%)\n`;
        report += `- Mobile-first approach: ${mobileFirstFiles} (${Math.round(mobileFirstFiles/totalFiles*100)}%)\n\n`;

        // Feature analysis
        const features = ['hasViewportMeta', 'hasMediaQueries', 'usesFlexbox', 'usesBootstrap', 'hasResponsiveImages'];
        
        report += `## Feature Analysis\n`;
        features.forEach(feature => {
            const count = results.filter(r => r.features[feature]).length;
            const percentage = Math.round(count/totalFiles*100);
            const featureName = feature.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase());
            report += `- ${featureName}: ${count}/${totalFiles} (${percentage}%)\n`;
        });
        report += '\n';

        const filesWithIssues = results.filter(r => r.issues.length > 0);
        
        if (filesWithIssues.length === 0) {
            report += '## ✅ All files appear to be responsive!\n';
        } else {
            report += `## Issues Found (${filesWithIssues.length} files)\n\n`;
            
            filesWithIssues.forEach(result => {
                report += `### ${result.fileName}\n`;
                
                // Show features
                const activeFeatures = Object.entries(result.features)
                    .filter(([key, value]) => value)
                    .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase());
                
                if (activeFeatures.length > 0) {
                    report += `**Features:** ${activeFeatures.join(', ')}\n`;
                }
                
                // Show issues
                result.issues.forEach(issue => {
                    const icon = issue.type === 'error' ? '❌' : '⚠️';
                    report += `${icon} ${issue.message}\n`;
                });
                report += '\n';
            });
        }

        return report;
    }
}

module.exports = ResponsiveTester;

// CLI usage
if (require.main === module) {
    const tester = new ResponsiveTester();
    const pagesDir = process.argv[2] || 'web/pages';
    
    if (!fs.existsSync(pagesDir)) {
        console.error('Pages directory not found:', pagesDir);
        process.exit(1);
    }
    
    const files = fs.readdirSync(pagesDir)
        .filter(f => f.endsWith('.html'))
        .slice(0, 10); // Test first 10 files for demo
    
    console.log(`Analyzing responsive design in ${files.length} HTML files...`);
    
    const results = files.map(file => {
        const filePath = path.join(pagesDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return tester.analyzeCSS(content, file);
        } catch (error) {
            return {
                fileName: file,
                features: {},
                issues: [{ type: 'error', message: `Failed to analyze: ${error.message}` }],
                mediaQueries: 0
            };
        }
    });
    
    const report = tester.generateReport(results);
    console.log(report);
    
    // Write report to file
    fs.writeFileSync('tests/qa-reports/responsive-analysis-report.md', report);
    console.log('Report saved to tests/qa-reports/responsive-analysis-report.md');
}