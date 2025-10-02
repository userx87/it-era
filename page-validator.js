#!/usr/bin/env node

/**
 * IT-ERA Page Validator
 * Valida tutte le pagine per consistenza di stile, script e funzionalità
 */

const fs = require('fs');
const path = require('path');

class ITERAPageValidator {
    constructor() {
        this.issues = [];
        this.validPages = 0;
        this.totalPages = 0;
        
        // Required elements for all pages
        this.requiredElements = {
            html: ['<html', '<head>', '<body>', '</html>'],
            meta: [
                'meta charset="UTF-8"',
                'meta name="viewport"',
                'meta name="description"',
                '<title>'
            ],
            structure: [
                'header-placeholder',
                'footer-placeholder'
            ],
            css: [
                'tailwindcss.com',
                'font-awesome',
                'components-separated.css'
            ],
            scripts: [
                'components-loader.js',
                'analytics-tracking.js'
            ]
        };
        
        // Pages to validate
        this.pagesToValidate = [
            'index.html',
            'servizi.html', 
            'contatti.html',
            'chi-siamo.html'
        ];
        
        // Sector pages
        this.sectorPages = [
            'settori/pmi-startup.html',
            'settori/commercialisti.html',
            'settori/studi-legali.html',
            'settori/studi-medici.html',
            'settori/industria-40.html',
            'settori/retail-gdo.html'
        ];
        
        // Landing pages
        this.landingPages = [
            'landing/sicurezza-informatica.html',
            'landing/assistenza-emergenza.html',
            'landing/cloud-migration.html',
            'landing/digitalizzazione-pmi.html',
            'landing/software-commercialisti.html'
        ];
    }
    
    async validateAllPages() {
        console.log('🔍 IT-ERA Page Validator\n');
        
        // Validate main pages
        console.log('📄 Validating main pages...');
        for (const page of this.pagesToValidate) {
            await this.validatePage(page, 'main');
        }
        
        // Validate sector pages
        console.log('\n🏢 Validating sector pages...');
        for (const page of this.sectorPages) {
            await this.validatePage(page, 'sector');
        }
        
        // Validate landing pages
        console.log('\n🎯 Validating landing pages...');
        for (const page of this.landingPages) {
            await this.validatePage(page, 'landing');
        }
        
        // Validate sample service pages
        console.log('\n🔧 Validating service pages (sample)...');
        const sampleServicePages = [
            'servizi-it/computer-non-si-accende-milano.html',
            'servizi-it/assistenza-informatica-ufficio-bergamo.html',
            'servizi-it/riparazione-computer-milano.html'
        ];
        
        for (const page of sampleServicePages) {
            await this.validatePage(page, 'service');
        }
        
        // Show results
        this.showResults();
        
        return {
            totalPages: this.totalPages,
            validPages: this.validPages,
            issues: this.issues,
            successRate: (this.validPages / this.totalPages * 100).toFixed(1)
        };
    }
    
    async validatePage(pagePath, pageType) {
        this.totalPages++;
        
        if (!fs.existsSync(pagePath)) {
            this.issues.push({
                page: pagePath,
                type: 'missing_file',
                severity: 'critical',
                message: 'File not found'
            });
            console.log(`  ❌ ${pagePath}: File not found`);
            return false;
        }
        
        const content = fs.readFileSync(pagePath, 'utf8');
        const pageIssues = [];
        
        // Validate HTML structure
        this.requiredElements.html.forEach(element => {
            if (!content.includes(element)) {
                pageIssues.push({
                    type: 'missing_html_element',
                    severity: 'high',
                    message: `Missing HTML element: ${element}`
                });
            }
        });
        
        // Validate meta tags
        this.requiredElements.meta.forEach(meta => {
            if (!content.includes(meta)) {
                pageIssues.push({
                    type: 'missing_meta',
                    severity: 'medium',
                    message: `Missing meta tag: ${meta}`
                });
            }
        });
        
        // Validate structure
        this.requiredElements.structure.forEach(structure => {
            if (!content.includes(structure)) {
                pageIssues.push({
                    type: 'missing_structure',
                    severity: 'high',
                    message: `Missing structure element: ${structure}`
                });
            }
        });
        
        // Validate CSS
        this.requiredElements.css.forEach(css => {
            if (!content.includes(css)) {
                pageIssues.push({
                    type: 'missing_css',
                    severity: 'medium',
                    message: `Missing CSS: ${css}`
                });
            }
        });
        
        // Validate scripts
        this.requiredElements.scripts.forEach(script => {
            if (!content.includes(script)) {
                pageIssues.push({
                    type: 'missing_script',
                    severity: 'medium',
                    message: `Missing script: ${script}`
                });
            }
        });
        
        // Page-specific validations
        await this.validatePageSpecific(content, pagePath, pageType, pageIssues);
        
        // Add issues to global list
        pageIssues.forEach(issue => {
            this.issues.push({
                page: pagePath,
                ...issue
            });
        });
        
        if (pageIssues.length === 0) {
            this.validPages++;
            console.log(`  ✅ ${pagePath}: Valid`);
            return true;
        } else {
            const criticalIssues = pageIssues.filter(i => i.severity === 'critical').length;
            const highIssues = pageIssues.filter(i => i.severity === 'high').length;
            
            if (criticalIssues === 0 && highIssues === 0) {
                this.validPages++;
                console.log(`  ⚠️ ${pagePath}: Valid with minor issues (${pageIssues.length})`);
            } else {
                console.log(`  ❌ ${pagePath}: Issues found (${pageIssues.length})`);
            }
            return false;
        }
    }
    
    async validatePageSpecific(content, pagePath, pageType, pageIssues) {
        switch (pageType) {
            case 'main':
                await this.validateMainPage(content, pagePath, pageIssues);
                break;
            case 'service':
                await this.validateServicePage(content, pagePath, pageIssues);
                break;
            case 'sector':
                await this.validateSectorPage(content, pagePath, pageIssues);
                break;
            case 'landing':
                await this.validateLandingPage(content, pagePath, pageIssues);
                break;
        }
    }
    
    async validateMainPage(content, pagePath, pageIssues) {
        // Check phone number consistency
        const phoneMatches = content.match(/039\s*888\s*2041/g);
        if (!phoneMatches || phoneMatches.length < 2) {
            pageIssues.push({
                type: 'phone_consistency',
                severity: 'medium',
                message: 'Phone number should appear multiple times'
            });
        }
        
        // Check email consistency
        if (!content.includes('info@bulltech.it')) {
            pageIssues.push({
                type: 'email_consistency',
                severity: 'medium',
                message: 'Missing or inconsistent email address'
            });
        }
        
        // Check contact page specific
        if (pagePath === 'contatti.html') {
            if (!content.includes('data-resend="true"')) {
                pageIssues.push({
                    type: 'missing_form_integration',
                    severity: 'high',
                    message: 'Contact form missing Resend integration'
                });
            }
            
            if (!content.includes('followup-automation.js')) {
                pageIssues.push({
                    type: 'missing_followup',
                    severity: 'medium',
                    message: 'Missing followup automation'
                });
            }
        }
    }
    
    async validateServicePage(content, pagePath, pageIssues) {
        // Check emergency contact
        if (!content.includes('039 888 2041')) {
            pageIssues.push({
                type: 'missing_emergency_contact',
                severity: 'high',
                message: 'Missing emergency contact number'
            });
        }
        
        // Check form integration
        if (!content.includes('data-resend="true"')) {
            pageIssues.push({
                type: 'missing_form_integration',
                severity: 'high',
                message: 'Service form missing integration'
            });
        }
        
        // Check followup system
        if (!content.includes('followup-automation.js')) {
            pageIssues.push({
                type: 'missing_followup_system',
                severity: 'medium',
                message: 'Missing followup automation system'
            });
        }
        
        // Check structured data
        if (!content.includes('"@type": "LocalBusiness"')) {
            pageIssues.push({
                type: 'missing_structured_data',
                severity: 'medium',
                message: 'Missing LocalBusiness structured data'
            });
        }
    }
    
    async validateSectorPage(content, pagePath, pageIssues) {
        // Check sector-specific content
        if (!content.includes('settore') && !content.includes('industria')) {
            pageIssues.push({
                type: 'missing_sector_content',
                severity: 'medium',
                message: 'Missing sector-specific content'
            });
        }
    }
    
    async validateLandingPage(content, pagePath, pageIssues) {
        // Check CTA presence
        const ctaElements = content.match(/button|btn-|cta-/gi);
        if (!ctaElements || ctaElements.length < 2) {
            pageIssues.push({
                type: 'insufficient_cta',
                severity: 'medium',
                message: 'Landing page should have multiple CTAs'
            });
        }
        
        // Check conversion tracking
        if (!content.includes('trackConversion')) {
            pageIssues.push({
                type: 'missing_conversion_tracking',
                severity: 'medium',
                message: 'Missing conversion tracking'
            });
        }
    }
    
    showResults() {
        console.log('\n📊 Page Validation Results:');
        console.log(`✅ Valid pages: ${this.validPages}/${this.totalPages} (${(this.validPages/this.totalPages*100).toFixed(1)}%)`);
        
        if (this.issues.length === 0) {
            console.log('🎉 All pages are valid!');
            return;
        }
        
        // Group issues by severity
        const critical = this.issues.filter(i => i.severity === 'critical');
        const high = this.issues.filter(i => i.severity === 'high');
        const medium = this.issues.filter(i => i.severity === 'medium');
        const low = this.issues.filter(i => i.severity === 'low');
        
        console.log(`\n❌ Total issues found: ${this.issues.length}`);
        
        if (critical.length > 0) {
            console.log(`\n🚨 CRITICAL ISSUES (${critical.length}):`);
            critical.forEach(issue => {
                console.log(`  - ${issue.page}: ${issue.message}`);
            });
        }
        
        if (high.length > 0) {
            console.log(`\n⚠️ HIGH PRIORITY ISSUES (${high.length}):`);
            high.forEach(issue => {
                console.log(`  - ${issue.page}: ${issue.message}`);
            });
        }
        
        if (medium.length > 0) {
            console.log(`\n📋 MEDIUM PRIORITY ISSUES (${medium.length}):`);
            const groupedMedium = {};
            medium.forEach(issue => {
                if (!groupedMedium[issue.type]) {
                    groupedMedium[issue.type] = [];
                }
                groupedMedium[issue.type].push(issue.page);
            });
            
            Object.entries(groupedMedium).forEach(([type, pages]) => {
                console.log(`  - ${type}: ${pages.length} pages`);
            });
        }
        
        console.log('\n💡 Recommendations:');
        console.log('1. Fix critical and high priority issues immediately');
        console.log('2. Ensure all forms have proper integration');
        console.log('3. Add missing followup automation to service pages');
        console.log('4. Verify phone number consistency across all pages');
        console.log('5. Test all pages on mobile devices');
        
        // Show success rate by page type
        const pageTypes = {};
        this.issues.forEach(issue => {
            const type = this.getPageType(issue.page);
            if (!pageTypes[type]) {
                pageTypes[type] = { total: 0, issues: 0 };
            }
            pageTypes[type].issues++;
        });
        
        console.log('\n📈 Success Rate by Page Type:');
        ['main', 'service', 'sector', 'landing'].forEach(type => {
            const typeIssues = pageTypes[type]?.issues || 0;
            const typeTotal = this.getPageCountByType(type);
            const successRate = ((typeTotal - typeIssues) / typeTotal * 100).toFixed(1);
            console.log(`  ${type}: ${successRate}% (${typeTotal - typeIssues}/${typeTotal})`);
        });
    }
    
    getPageType(pagePath) {
        if (pagePath.startsWith('servizi-it/')) return 'service';
        if (pagePath.startsWith('settori/')) return 'sector';
        if (pagePath.startsWith('landing/')) return 'landing';
        return 'main';
    }
    
    getPageCountByType(type) {
        switch (type) {
            case 'main': return this.pagesToValidate.length;
            case 'service': return 3; // sample count
            case 'sector': return this.sectorPages.length;
            case 'landing': return this.landingPages.length;
            default: return 0;
        }
    }
    
    // Generate fix report
    generateFixReport() {
        const fixes = [];
        
        this.issues.forEach(issue => {
            switch (issue.type) {
                case 'missing_form_integration':
                    fixes.push({
                        page: issue.page,
                        action: 'Add data-resend="true" to forms',
                        priority: 'high'
                    });
                    break;
                    
                case 'missing_followup_system':
                    fixes.push({
                        page: issue.page,
                        action: 'Add followup automation scripts',
                        priority: 'medium'
                    });
                    break;
                    
                case 'phone_consistency':
                    fixes.push({
                        page: issue.page,
                        action: 'Add more instances of 039 888 2041',
                        priority: 'medium'
                    });
                    break;
            }
        });
        
        return fixes;
    }
}

// CLI interface
if (require.main === module) {
    const validator = new ITERAPageValidator();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--page') && args[args.indexOf('--page') + 1]) {
        const pagePath = args[args.indexOf('--page') + 1];
        validator.validatePage(pagePath, 'custom').then(() => {
            validator.showResults();
        });
    } else {
        validator.validateAllPages().then(results => {
            if (args.includes('--fix-report')) {
                const fixes = validator.generateFixReport();
                console.log('\n🔧 Fix Report:');
                fixes.forEach(fix => {
                    console.log(`  ${fix.priority.toUpperCase()}: ${fix.page} - ${fix.action}`);
                });
            }
        });
    }
}

module.exports = ITERAPageValidator;
