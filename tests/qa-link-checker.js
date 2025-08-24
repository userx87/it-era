#!/usr/bin/env node
/**
 * Link Checker for IT-ERA Landing Pages
 * Validates internal links and navigation consistency
 */

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

class LinkChecker {
    constructor() {
        this.baseUrl = 'https://it-era.it';
        this.internalLinks = new Set();
        this.externalLinks = new Set();
        this.brokenLinks = [];
        this.existingPages = new Set();
    }

    extractLinks(content, filePath) {
        const fileName = path.basename(filePath);
        const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
        const srcRegex = /<(?:img|script|link)[^>]+(?:src|href)=["']([^"']+)["'][^>]*>/gi;
        
        const links = [];
        let match;
        
        // Extract href links
        while ((match = linkRegex.exec(content)) !== null) {
            links.push({ type: 'link', url: match[1], context: match[0] });
        }
        
        // Extract src/href from images, scripts, stylesheets
        while ((match = srcRegex.exec(content)) !== null) {
            links.push({ type: 'resource', url: match[1], context: match[0] });
        }
        
        return { fileName, links };
    }

    categorizeLinks(links) {
        const categorized = {
            internal: [],
            external: [],
            relative: [],
            anchors: [],
            emails: [],
            phone: []
        };

        links.forEach(link => {
            const url = link.url.trim();
            
            if (url.startsWith('mailto:')) {
                categorized.emails.push(link);
            } else if (url.startsWith('tel:')) {
                categorized.phone.push(link);
            } else if (url.startsWith('#')) {
                categorized.anchors.push(link);
            } else if (url.startsWith('http://') || url.startsWith('https://')) {
                if (url.includes('it-era.it') || url.includes('localhost')) {
                    categorized.internal.push(link);
                } else {
                    categorized.external.push(link);
                }
            } else if (url.startsWith('/') || url.startsWith('./') || url.match(/^[^\/]+\.html/)) {
                categorized.relative.push(link);
            } else {
                categorized.relative.push(link);
            }
        });

        return categorized;
    }

    validateInternalLinks(categorizedLinks, pagesDir) {
        const issues = [];
        const allLinks = [...categorizedLinks.internal, ...categorizedLinks.relative];
        
        allLinks.forEach(link => {
            let filePath = link.url;
            
            // Convert URL to file path
            if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
                try {
                    const url = new URL(filePath);
                    filePath = url.pathname;
                } catch (e) {
                    issues.push({ type: 'error', message: `Invalid URL: ${link.url}` });
                    return;
                }
            }
            
            // Remove query params and anchors
            filePath = filePath.split('?')[0].split('#')[0];
            
            // Handle root or empty paths
            if (filePath === '/' || filePath === '') {
                filePath = '/index.html';
            }
            
            // Add .html extension if missing
            if (!path.extname(filePath) && !filePath.endsWith('/')) {
                filePath += '.html';
            }
            
            // Convert to actual file system path
            const actualPath = path.join(pagesDir, filePath.replace(/^\//, ''));
            
            if (!fs.existsSync(actualPath)) {
                issues.push({
                    type: 'error',
                    message: `Broken internal link: ${link.url} -> ${actualPath}`,
                    context: link.context
                });
            }
        });

        return issues;
    }

    checkNavigationConsistency(results) {
        const navigationPatterns = new Map();
        const issues = [];

        results.forEach(result => {
            // Extract navigation elements
            const navLinks = result.links.filter(link => 
                link.type === 'link' && 
                (link.context.includes('nav') || 
                 link.context.includes('menu') ||
                 link.context.includes('header'))
            );

            const pattern = navLinks.map(l => l.url).sort().join('|');
            
            if (!navigationPatterns.has(pattern)) {
                navigationPatterns.set(pattern, []);
            }
            navigationPatterns.get(pattern).push(result.fileName);
        });

        if (navigationPatterns.size > 3) {
            issues.push({
                type: 'warning',
                message: `Navigation inconsistency detected: ${navigationPatterns.size} different navigation patterns found`
            });
        }

        return issues;
    }

    async checkFile(filePath, pagesDir) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const extracted = this.extractLinks(content, filePath);
            const categorized = this.categorizeLinks(extracted.links);
            const internalIssues = this.validateInternalLinks(categorized, pagesDir);

            return {
                fileName: extracted.fileName,
                links: extracted.links,
                categorized,
                issues: internalIssues,
                stats: {
                    total: extracted.links.length,
                    internal: categorized.internal.length + categorized.relative.length,
                    external: categorized.external.length,
                    emails: categorized.emails.length,
                    anchors: categorized.anchors.length
                }
            };
        } catch (error) {
            return {
                fileName: path.basename(filePath),
                links: [],
                categorized: {},
                issues: [{ type: 'error', message: `Failed to process file: ${error.message}` }],
                stats: { total: 0, internal: 0, external: 0, emails: 0, anchors: 0 }
            };
        }
    }

    generateReport(results) {
        let report = '# Link Validation Report\n\n';
        
        const totalFiles = results.length;
        const totalLinks = results.reduce((sum, r) => sum + r.stats.total, 0);
        const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
        const brokenLinks = results.reduce((sum, r) => sum + r.issues.filter(i => i.message.includes('Broken')).length, 0);

        report += `## Summary\n`;
        report += `- Files processed: ${totalFiles}\n`;
        report += `- Total links found: ${totalLinks}\n`;
        report += `- Broken links: ${brokenLinks}\n`;
        report += `- Total issues: ${totalIssues}\n\n`;

        // Stats breakdown
        const totalStats = results.reduce((acc, r) => ({
            internal: acc.internal + r.stats.internal,
            external: acc.external + r.stats.external,
            emails: acc.emails + r.stats.emails,
            anchors: acc.anchors + r.stats.anchors
        }), { internal: 0, external: 0, emails: 0, anchors: 0 });

        report += `## Link Statistics\n`;
        report += `- Internal links: ${totalStats.internal}\n`;
        report += `- External links: ${totalStats.external}\n`;
        report += `- Email links: ${totalStats.emails}\n`;
        report += `- Anchor links: ${totalStats.anchors}\n\n`;

        const filesWithIssues = results.filter(r => r.issues.length > 0);
        
        if (filesWithIssues.length === 0) {
            report += '## ✅ All links are valid!\n';
        } else {
            report += `## Issues Found (${filesWithIssues.length} files)\n\n`;
            
            filesWithIssues.forEach(result => {
                report += `### ${result.fileName}\n`;
                result.issues.forEach(issue => {
                    const icon = issue.type === 'error' ? '❌' : '⚠️';
                    report += `${icon} ${issue.message}\n`;
                    if (issue.context) {
                        report += `   Context: \`${issue.context.substring(0, 80)}...\`\n`;
                    }
                });
                report += '\n';
            });
        }

        return report;
    }
}

module.exports = LinkChecker;

// CLI usage
if (require.main === module) {
    const checker = new LinkChecker();
    const pagesDir = process.argv[2] || 'web/pages';
    
    if (!fs.existsSync(pagesDir)) {
        console.error('Pages directory not found:', pagesDir);
        process.exit(1);
    }
    
    const files = fs.readdirSync(pagesDir)
        .filter(f => f.endsWith('.html'))
        .slice(0, 10); // Test first 10 files for demo
    
    console.log(`Checking links in ${files.length} HTML files...`);
    
    const results = files.map(file => {
        const filePath = path.join(pagesDir, file);
        return checker.checkFile(filePath, pagesDir);
    });
    
    const report = checker.generateReport(results);
    console.log(report);
    
    // Write report to file
    fs.writeFileSync('tests/qa-reports/link-validation-report.md', report);
    console.log('Report saved to tests/qa-reports/link-validation-report.md');
}