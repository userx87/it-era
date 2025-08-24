#!/usr/bin/env node
/**
 * HTML Validation Script for IT-ERA Landing Pages
 * Tests HTML syntax, structure, and basic compliance
 */

const fs = require('fs');
const path = require('path');

class HTMLValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.tested = 0;
    }

    validateHTML(filePath, content) {
        this.tested++;
        const fileName = path.basename(filePath);
        
        // Basic HTML structure validation
        const issues = [];
        
        // Check DOCTYPE
        if (!content.includes('<!DOCTYPE html>') && !content.includes('<!doctype html>')) {
            issues.push({ type: 'error', message: 'Missing DOCTYPE declaration' });
        }
        
        // Check html tag
        if (!content.match(/<html[^>]*>/i)) {
            issues.push({ type: 'error', message: 'Missing <html> tag' });
        }
        
        // Check head tag
        if (!content.match(/<head[^>]*>/i)) {
            issues.push({ type: 'error', message: 'Missing <head> tag' });
        }
        
        // Check body tag
        if (!content.match(/<body[^>]*>/i)) {
            issues.push({ type: 'error', message: 'Missing <body> tag' });
        }
        
        // Check title tag
        if (!content.match(/<title[^>]*>.*<\/title>/i)) {
            issues.push({ type: 'error', message: 'Missing or empty <title> tag' });
        }
        
        // Check meta charset
        if (!content.match(/<meta[^>]*charset[^>]*>/i)) {
            issues.push({ type: 'warning', message: 'Missing charset meta tag' });
        }
        
        // Check viewport meta
        if (!content.match(/<meta[^>]*name=["']viewport["'][^>]*>/i)) {
            issues.push({ type: 'warning', message: 'Missing viewport meta tag' });
        }
        
        // Check unclosed tags (basic check)
        const openTags = content.match(/<[a-zA-Z][^>]*(?<!\/|-)>/g) || [];
        const closeTags = content.match(/<\/[a-zA-Z][^>]*>/g) || [];
        
        // Self-closing tags that don't need closing tags
        const selfClosing = ['meta', 'link', 'input', 'img', 'br', 'hr', 'area', 'base'];
        const filteredOpenTags = openTags.filter(tag => {
            const tagName = tag.match(/<([a-zA-Z]+)/)[1].toLowerCase();
            return !selfClosing.includes(tagName) && !tag.endsWith('/>');
        });
        
        if (filteredOpenTags.length > closeTags.length + 5) { // Allow some tolerance
            issues.push({ type: 'warning', message: 'Potential unclosed tags detected' });
        }
        
        // Check for alt attributes on images
        const imgTags = content.match(/<img[^>]*>/gi) || [];
        const imgWithoutAlt = imgTags.filter(img => !img.match(/alt=/i));
        if (imgWithoutAlt.length > 0) {
            issues.push({ type: 'warning', message: `${imgWithoutAlt.length} img tags missing alt attribute` });
        }
        
        return { fileName, issues };
    }

    async validateFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return this.validateHTML(filePath, content);
        } catch (error) {
            return {
                fileName: path.basename(filePath),
                issues: [{ type: 'error', message: `Failed to read file: ${error.message}` }]
            };
        }
    }

    generateReport(results) {
        let report = '# HTML Validation Report\n\n';
        report += `## Summary\n`;
        report += `- Files tested: ${this.tested}\n`;
        report += `- Total errors: ${results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'error').length, 0)}\n`;
        report += `- Total warnings: ${results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'warning').length, 0)}\n\n`;
        
        const filesWithIssues = results.filter(r => r.issues.length > 0);
        
        if (filesWithIssues.length === 0) {
            report += '## 🎉 All files passed validation!\n';
        } else {
            report += '## Issues Found\n\n';
            
            filesWithIssues.forEach(result => {
                report += `### ${result.fileName}\n`;
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

module.exports = HTMLValidator;

// CLI usage
if (require.main === module) {
    const validator = new HTMLValidator();
    const pagesDir = process.argv[2] || 'web/pages';
    
    if (!fs.existsSync(pagesDir)) {
        console.error('Pages directory not found:', pagesDir);
        process.exit(1);
    }
    
    const files = fs.readdirSync(pagesDir)
        .filter(f => f.endsWith('.html'))
        .slice(0, 10); // Test first 10 files for demo
    
    console.log(`Testing ${files.length} HTML files...`);
    
    const results = files.map(file => {
        const filePath = path.join(pagesDir, file);
        return validator.validateFile(filePath);
    });
    
    const report = validator.generateReport(results);
    console.log(report);
    
    // Write report to file
    fs.writeFileSync('tests/qa-reports/html-validation-report.md', report);
    console.log('Report saved to tests/qa-reports/html-validation-report.md');
}