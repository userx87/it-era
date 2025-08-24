#!/usr/bin/env node
/**
 * Performance Tester for IT-ERA Landing Pages
 * Analyzes page performance metrics and optimization opportunities
 */

const fs = require('fs');
const path = require('path');

class PerformanceTester {
    constructor() {
        this.metrics = {
            htmlSize: 0,
            inlineCSS: 0,
            externalCSS: 0,
            inlineJS: 0,
            externalJS: 0,
            images: 0,
            totalRequests: 0
        };
    }

    analyzePerformance(content, fileName) {
        const issues = [];
        const optimizations = [];
        const metrics = {
            fileSize: Buffer.byteLength(content, 'utf8'),
            inlineCSSLines: 0,
            externalCSSFiles: 0,
            inlineJSLines: 0,
            externalJSFiles: 0,
            imageCount: 0,
            totalRequests: 1, // HTML file itself
            compressionOpportunities: [],
            criticalResourcesCount: 0
        };

        // Analyze CSS
        const inlineCSS = content.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
        const externalCSS = content.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
        
        metrics.inlineCSSLines = inlineCSS.reduce((sum, style) => {
            return sum + (style.split('\n').length - 2); // Exclude style tags
        }, 0);
        metrics.externalCSSFiles = externalCSS.length;
        metrics.totalRequests += externalCSS.length;

        // Analyze JavaScript
        const inlineJS = content.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
        const externalJS = content.match(/<script[^>]*src=["'][^"']+["'][^>]*>/gi) || [];
        
        metrics.inlineJSLines = inlineJS.filter(script => !script.includes('src=')).reduce((sum, script) => {
            return sum + (script.split('\n').length - 2); // Exclude script tags
        }, 0);
        metrics.externalJSFiles = externalJS.length;
        metrics.totalRequests += externalJS.length;

        // Analyze Images
        const images = content.match(/<img[^>]*src=["'][^"']+["'][^>]*>/gi) || [];
        const backgroundImages = content.match(/background(?:-image)?:\s*url\([^)]+\)/gi) || [];
        metrics.imageCount = images.length + backgroundImages.length;
        metrics.totalRequests += metrics.imageCount;

        // Check for performance issues
        this.checkPerformanceIssues(content, metrics, issues, optimizations);

        // Calculate performance score
        const score = this.calculatePerformanceScore(metrics, issues);

        return {
            fileName,
            metrics,
            issues,
            optimizations,
            score
        };
    }

    checkPerformanceIssues(content, metrics, issues, optimizations) {
        // Large HTML size
        if (metrics.fileSize > 100000) { // 100KB
            issues.push({
                type: 'warning',
                message: `Large HTML file size: ${Math.round(metrics.fileSize/1024)}KB`
            });
        }

        // Too much inline CSS
        if (metrics.inlineCSSLines > 200) {
            issues.push({
                type: 'warning',
                message: `Large amount of inline CSS: ${metrics.inlineCSSLines} lines`
            });
            optimizations.push('Consider extracting CSS to external files');
        }

        // Too much inline JS
        if (metrics.inlineJSLines > 50) {
            issues.push({
                type: 'warning',
                message: `Large amount of inline JavaScript: ${metrics.inlineJSLines} lines`
            });
            optimizations.push('Consider extracting JavaScript to external files');
        }

        // Too many HTTP requests
        if (metrics.totalRequests > 50) {
            issues.push({
                type: 'error',
                message: `High number of HTTP requests: ${metrics.totalRequests}`
            });
            optimizations.push('Combine CSS/JS files, use CSS sprites, optimize images');
        }

        // Check for unoptimized images
        const imgTags = content.match(/<img[^>]*>/gi) || [];
        const imagesWithoutDimensions = imgTags.filter(img => 
            !img.includes('width=') && !img.includes('height=')
        );
        if (imagesWithoutDimensions.length > 0) {
            issues.push({
                type: 'warning',
                message: `${imagesWithoutDimensions.length} images without dimensions (causes layout shift)`
            });
            optimizations.push('Add width and height attributes to images');
        }

        // Check for missing lazy loading
        const imagesWithoutLazy = imgTags.filter(img => !img.includes('loading="lazy"'));
        if (imagesWithoutLazy.length > 3) {
            optimizations.push('Add lazy loading to images below the fold');
        }

        // Check for render-blocking resources
        const renderBlockingCSS = content.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
        const renderBlockingJS = content.match(/<script[^>]*src=[^>]*>/gi) || [];
        
        metrics.criticalResourcesCount = renderBlockingCSS.length + 
            renderBlockingJS.filter(js => !js.includes('async') && !js.includes('defer')).length;

        if (metrics.criticalResourcesCount > 5) {
            issues.push({
                type: 'warning',
                message: `${metrics.criticalResourcesCount} render-blocking resources`
            });
            optimizations.push('Add async/defer to non-critical scripts, inline critical CSS');
        }

        // Check for missing compression hints
        if (!content.includes('gzip') && !content.includes('br')) {
            optimizations.push('Enable Gzip or Brotli compression');
        }

        // Check for CDN usage
        const cdnDomains = ['jsdelivr', 'unpkg', 'cdnjs', 'googleapis'];
        const usesCDN = cdnDomains.some(domain => content.includes(domain));
        if (!usesCDN) {
            optimizations.push('Consider using CDN for static assets');
        }

        // Check for missing resource hints
        if (!content.includes('dns-prefetch') && !content.includes('preconnect')) {
            optimizations.push('Add DNS prefetch/preconnect for external domains');
        }

        // Check for missing meta tags affecting performance
        if (!content.includes('theme-color')) {
            optimizations.push('Add theme-color meta tag for faster mobile rendering');
        }

        // Check for font optimization
        if (content.includes('fonts.googleapis.com') && !content.includes('display=swap')) {
            issues.push({
                type: 'warning',
                message: 'Google Fonts without font-display optimization'
            });
            optimizations.push('Add font-display: swap to Google Fonts');
        }
    }

    calculatePerformanceScore(metrics, issues) {
        let score = 100;

        // Penalize based on file size
        if (metrics.fileSize > 50000) score -= 10;
        if (metrics.fileSize > 100000) score -= 20;

        // Penalize based on requests
        if (metrics.totalRequests > 20) score -= 10;
        if (metrics.totalRequests > 50) score -= 20;

        // Penalize based on render-blocking resources
        if (metrics.criticalResourcesCount > 3) score -= 10;
        if (metrics.criticalResourcesCount > 8) score -= 15;

        // Penalize based on issues
        const errorCount = issues.filter(i => i.type === 'error').length;
        const warningCount = issues.filter(i => i.type === 'warning').length;
        
        score -= errorCount * 10;
        score -= warningCount * 5;

        return Math.max(0, Math.round(score));
    }

    estimateLoadTime(metrics) {
        // Rough estimation based on file size and requests
        const baseTime = metrics.fileSize / 1000000; // 1MB/s assumption
        const requestOverhead = metrics.totalRequests * 0.1; // 100ms per request
        return Math.round((baseTime + requestOverhead) * 100) / 100;
    }

    generateReport(results) {
        let report = '# Performance Analysis Report\n\n';
        
        const totalFiles = results.length;
        const averageScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalFiles);
        const averageSize = Math.round(results.reduce((sum, r) => sum + r.metrics.fileSize, 0) / totalFiles / 1024);
        const averageRequests = Math.round(results.reduce((sum, r) => sum + r.metrics.totalRequests, 0) / totalFiles);

        report += `## Summary\n`;
        report += `- Files analyzed: ${totalFiles}\n`;
        report += `- Average performance score: ${averageScore}/100\n`;
        report += `- Average file size: ${averageSize}KB\n`;
        report += `- Average HTTP requests: ${averageRequests}\n\n`;

        // Performance distribution
        const scoreRanges = {
            excellent: results.filter(r => r.score >= 90).length,
            good: results.filter(r => r.score >= 70 && r.score < 90).length,
            needsWork: results.filter(r => r.score >= 50 && r.score < 70).length,
            poor: results.filter(r => r.score < 50).length
        };

        report += `## Performance Distribution\n`;
        report += `- 🟢 Excellent (90-100): ${scoreRanges.excellent}\n`;
        report += `- 🟡 Good (70-89): ${scoreRanges.good}\n`;
        report += `- 🟠 Needs Work (50-69): ${scoreRanges.needsWork}\n`;
        report += `- 🔴 Poor (<50): ${scoreRanges.poor}\n\n`;

        // Common optimizations
        const allOptimizations = results.flatMap(r => r.optimizations);
        const optimizationFrequency = allOptimizations.reduce((acc, opt) => {
            acc[opt] = (acc[opt] || 0) + 1;
            return acc;
        }, {});

        const topOptimizations = Object.entries(optimizationFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        if (topOptimizations.length > 0) {
            report += `## Top Optimization Opportunities\n`;
            topOptimizations.forEach(([opt, count]) => {
                report += `- ${opt} (${count} pages)\n`;
            });
            report += '\n';
        }

        // Resource analysis
        const totalCSS = results.reduce((sum, r) => sum + r.metrics.externalCSSFiles, 0);
        const totalJS = results.reduce((sum, r) => sum + r.metrics.externalJSFiles, 0);
        const totalImages = results.reduce((sum, r) => sum + r.metrics.imageCount, 0);

        report += `## Resource Analysis\n`;
        report += `- Total CSS files: ${totalCSS} (avg: ${Math.round(totalCSS/totalFiles)})\n`;
        report += `- Total JS files: ${totalJS} (avg: ${Math.round(totalJS/totalFiles)})\n`;
        report += `- Total images: ${totalImages} (avg: ${Math.round(totalImages/totalFiles)})\n\n`;

        // Individual results for worst performers
        const worstPerformers = results
            .filter(r => r.score < 70)
            .sort((a, b) => a.score - b.score)
            .slice(0, 5);

        if (worstPerformers.length > 0) {
            report += `## Pages Needing Attention\n\n`;
            worstPerformers.forEach(result => {
                report += `### ${result.fileName} (${result.score}/100)\n`;
                report += `- File size: ${Math.round(result.metrics.fileSize/1024)}KB\n`;
                report += `- HTTP requests: ${result.metrics.totalRequests}\n`;
                report += `- Estimated load time: ${this.estimateLoadTime(result.metrics)}s\n`;
                
                if (result.issues.length > 0) {
                    report += '**Issues:**\n';
                    result.issues.forEach(issue => {
                        const icon = issue.type === 'error' ? '❌' : '⚠️';
                        report += `${icon} ${issue.message}\n`;
                    });
                }
                
                if (result.optimizations.length > 0) {
                    report += '**Recommended optimizations:**\n';
                    result.optimizations.forEach(opt => {
                        report += `- ${opt}\n`;
                    });
                }
                report += '\n';
            });
        }

        return report;
    }
}

module.exports = PerformanceTester;

// CLI usage
if (require.main === module) {
    const tester = new PerformanceTester();
    const pagesDir = process.argv[2] || 'web/pages';
    
    if (!fs.existsSync(pagesDir)) {
        console.error('Pages directory not found:', pagesDir);
        process.exit(1);
    }
    
    const files = fs.readdirSync(pagesDir)
        .filter(f => f.endsWith('.html'))
        .slice(0, 15); // Test first 15 files for demo
    
    console.log(`Analyzing performance of ${files.length} HTML files...`);
    
    const results = files.map(file => {
        const filePath = path.join(pagesDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return tester.analyzePerformance(content, file);
        } catch (error) {
            return {
                fileName: file,
                metrics: { fileSize: 0, totalRequests: 0 },
                issues: [{ type: 'error', message: `Failed to analyze: ${error.message}` }],
                optimizations: [],
                score: 0
            };
        }
    });
    
    const report = tester.generateReport(results);
    console.log(report);
    
    // Write report to file
    fs.writeFileSync('tests/qa-reports/performance-report.md', report);
    console.log('Report saved to tests/qa-reports/performance-report.md');
}