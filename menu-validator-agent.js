#!/usr/bin/env node

/**
 * IT-ERA Menu Validator Agent
 * Controlla e corregge problemi nel menu e nella navigazione
 */

const fs = require('fs');
const path = require('path');

class ITERAMenuValidator {
    constructor() {
        this.issues = [];
        this.fixes = [];
        this.menuFiles = [
            'components/header.html',
            'contatti.html',
            'servizi.html',
            'index.html'
        ];
        
        this.expectedMenuItems = [
            { text: 'Home', href: '/', page: 'home' },
            { text: 'Servizi', href: '/servizi.html', page: 'servizi' },
            { text: 'Contatti', href: '/contatti.html', page: 'contatti' }
        ];
        
        this.expectedSectorItems = [
            { text: 'PMI e Startup', href: '/settori/pmi-startup.html' },
            { text: 'Studi Medici', href: '/settori/studi-medici.html' },
            { text: 'Commercialisti', href: '/settori/commercialisti.html' },
            { text: 'Studi Legali', href: '/settori/studi-legali.html' },
            { text: 'Industria 4.0', href: '/settori/industria-40.html' },
            { text: 'Retail e GDO', href: '/settori/retail-gdo.html' }
        ];
        
        this.requiredScripts = [
            '/js/components-loader.js',
            '/js/analytics-tracking.js',
            '/js/resend-integration.js'
        ];
        
        this.requiredCSS = [
            '/css/it-era-design-system.css',
            '/css/components-separated.css',
            '/css/it-era-enhanced.css'
        ];
    }
    
    async validateMenu() {
        console.log('🔍 IT-ERA Menu Validator Agent\n');
        
        // Check header component
        await this.validateHeaderComponent();
        
        // Check pages consistency
        await this.validatePagesConsistency();
        
        // Check contact page specific issues
        await this.validateContactPage();
        
        // Generate fixes
        await this.generateFixes();
        
        // Show results
        this.showResults();
        
        return {
            issues: this.issues,
            fixes: this.fixes,
            success: this.issues.length === 0
        };
    }
    
    async validateHeaderComponent() {
        console.log('📋 Validating header component...');
        
        const headerPath = 'components/header.html';
        
        if (!fs.existsSync(headerPath)) {
            this.issues.push({
                type: 'missing_file',
                file: headerPath,
                message: 'Header component file missing',
                severity: 'critical'
            });
            return;
        }
        
        const headerContent = fs.readFileSync(headerPath, 'utf8');
        
        // Check menu items
        this.expectedMenuItems.forEach(item => {
            if (!headerContent.includes(item.href)) {
                this.issues.push({
                    type: 'missing_menu_item',
                    file: headerPath,
                    message: `Missing menu item: ${item.text} (${item.href})`,
                    severity: 'high',
                    item: item
                });
            }
        });
        
        // Check sector dropdown
        this.expectedSectorItems.forEach(item => {
            if (!headerContent.includes(item.href)) {
                this.issues.push({
                    type: 'missing_sector_item',
                    file: headerPath,
                    message: `Missing sector item: ${item.text} (${item.href})`,
                    severity: 'medium',
                    item: item
                });
            }
        });
        
        // Check mobile menu
        if (!headerContent.includes('mobile-menu')) {
            this.issues.push({
                type: 'missing_mobile_menu',
                file: headerPath,
                message: 'Mobile menu not found',
                severity: 'high'
            });
        }
        
        // Check phone number consistency
        const phoneNumbers = headerContent.match(/039\s*888\s*2041/g);
        if (!phoneNumbers || phoneNumbers.length < 2) {
            this.issues.push({
                type: 'inconsistent_phone',
                file: headerPath,
                message: 'Phone number not consistent across menu',
                severity: 'medium'
            });
        }
        
        console.log(`  ✅ Header component checked`);
    }
    
    async validatePagesConsistency() {
        console.log('📄 Validating pages consistency...');
        
        const pagesToCheck = ['contatti.html', 'servizi.html'];
        
        for (const pagePath of pagesToCheck) {
            if (!fs.existsSync(pagePath)) {
                this.issues.push({
                    type: 'missing_page',
                    file: pagePath,
                    message: `Page file missing: ${pagePath}`,
                    severity: 'critical'
                });
                continue;
            }
            
            const pageContent = fs.readFileSync(pagePath, 'utf8');
            
            // Check header placeholder
            if (!pageContent.includes('header-placeholder')) {
                this.issues.push({
                    type: 'missing_header_placeholder',
                    file: pagePath,
                    message: 'Header placeholder missing',
                    severity: 'high'
                });
            }
            
            // Check required scripts
            this.requiredScripts.forEach(script => {
                if (!pageContent.includes(script)) {
                    this.issues.push({
                        type: 'missing_script',
                        file: pagePath,
                        message: `Missing required script: ${script}`,
                        severity: 'medium',
                        script: script
                    });
                }
            });
            
            // Check required CSS
            this.requiredCSS.forEach(css => {
                if (!pageContent.includes(css)) {
                    this.issues.push({
                        type: 'missing_css',
                        file: pagePath,
                        message: `Missing required CSS: ${css}`,
                        severity: 'medium',
                        css: css
                    });
                }
            });
            
            // Check Tailwind CSS version
            if (pageContent.includes('tailwindcss@2.2.19')) {
                this.issues.push({
                    type: 'outdated_tailwind',
                    file: pagePath,
                    message: 'Using outdated Tailwind CSS version',
                    severity: 'low'
                });
            }
        }
        
        console.log(`  ✅ Pages consistency checked`);
    }
    
    async validateContactPage() {
        console.log('📞 Validating contact page specifically...');
        
        const contactPath = 'contatti.html';
        
        if (!fs.existsSync(contactPath)) {
            return;
        }
        
        const contactContent = fs.readFileSync(contactPath, 'utf8');
        
        // Check form integration
        if (!contactContent.includes('data-resend="true"')) {
            this.issues.push({
                type: 'missing_form_integration',
                file: contactPath,
                message: 'Contact form missing Resend integration',
                severity: 'high'
            });
        }
        
        // Check emergency contact section
        if (!contactContent.includes('Emergenza IT 24/7')) {
            this.issues.push({
                type: 'missing_emergency_section',
                file: contactPath,
                message: 'Emergency contact section missing',
                severity: 'medium'
            });
        }
        
        // Check phone number consistency
        const phoneMatches = contactContent.match(/039\s*888\s*2041/g);
        if (!phoneMatches || phoneMatches.length < 3) {
            this.issues.push({
                type: 'insufficient_phone_presence',
                file: contactPath,
                message: 'Phone number should appear multiple times on contact page',
                severity: 'medium'
            });
        }
        
        // Check email consistency
        if (!contactContent.includes('info@bulltech.it') && !contactContent.includes('info@it-era.it')) {
            this.issues.push({
                type: 'missing_email',
                file: contactPath,
                message: 'Contact email missing or inconsistent',
                severity: 'high'
            });
        }
        
        // Check followup system integration
        if (!contactContent.includes('followup-automation.js')) {
            this.issues.push({
                type: 'missing_followup_integration',
                file: contactPath,
                message: 'Followup automation system not integrated',
                severity: 'medium'
            });
        }
        
        console.log(`  ✅ Contact page validated`);
    }
    
    async generateFixes() {
        console.log('🔧 Generating fixes...');
        
        for (const issue of this.issues) {
            switch (issue.type) {
                case 'missing_menu_item':
                    this.fixes.push({
                        type: 'add_menu_item',
                        file: issue.file,
                        action: `Add menu item: ${issue.item.text}`,
                        code: `<a href="${issue.item.href}" class="nav-link" data-page="${issue.item.page}">${issue.item.text}</a>`
                    });
                    break;
                    
                case 'missing_script':
                    this.fixes.push({
                        type: 'add_script',
                        file: issue.file,
                        action: `Add required script: ${issue.script}`,
                        code: `<script src="${issue.script}"></script>`
                    });
                    break;
                    
                case 'missing_css':
                    this.fixes.push({
                        type: 'add_css',
                        file: issue.file,
                        action: `Add required CSS: ${issue.css}`,
                        code: `<link rel="stylesheet" href="${issue.css}">`
                    });
                    break;
                    
                case 'outdated_tailwind':
                    this.fixes.push({
                        type: 'update_tailwind',
                        file: issue.file,
                        action: 'Update Tailwind CSS to latest version',
                        code: '<script src="https://cdn.tailwindcss.com"></script>'
                    });
                    break;
                    
                case 'missing_form_integration':
                    this.fixes.push({
                        type: 'add_form_integration',
                        file: issue.file,
                        action: 'Add Resend form integration',
                        code: 'data-resend="true" id="contact-form"'
                    });
                    break;
                    
                case 'missing_followup_integration':
                    this.fixes.push({
                        type: 'add_followup_scripts',
                        file: issue.file,
                        action: 'Add followup automation scripts',
                        code: `
    <!-- Followup Systems -->
    <script src="/js/email-templates.js"></script>
    <script src="/js/followup-automation.js"></script>
    <script src="/js/sms-followup.js"></script>
    <script src="/js/call-followup.js"></script>`
                    });
                    break;
            }
        }
        
        console.log(`  ✅ Generated ${this.fixes.length} fixes`);
    }
    
    showResults() {
        console.log('\n📊 Menu Validation Results:');
        
        if (this.issues.length === 0) {
            console.log('🎉 No issues found! Menu is working correctly.');
            return;
        }
        
        console.log(`❌ Found ${this.issues.length} issues:`);
        
        // Group by severity
        const critical = this.issues.filter(i => i.severity === 'critical');
        const high = this.issues.filter(i => i.severity === 'high');
        const medium = this.issues.filter(i => i.severity === 'medium');
        const low = this.issues.filter(i => i.severity === 'low');
        
        if (critical.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES:');
            critical.forEach(issue => {
                console.log(`  - ${issue.file}: ${issue.message}`);
            });
        }
        
        if (high.length > 0) {
            console.log('\n⚠️ HIGH PRIORITY ISSUES:');
            high.forEach(issue => {
                console.log(`  - ${issue.file}: ${issue.message}`);
            });
        }
        
        if (medium.length > 0) {
            console.log('\n📋 MEDIUM PRIORITY ISSUES:');
            medium.forEach(issue => {
                console.log(`  - ${issue.file}: ${issue.message}`);
            });
        }
        
        if (low.length > 0) {
            console.log('\n💡 LOW PRIORITY ISSUES:');
            low.forEach(issue => {
                console.log(`  - ${issue.file}: ${issue.message}`);
            });
        }
        
        console.log(`\n🔧 Generated ${this.fixes.length} automatic fixes`);
        console.log('\n💡 Recommended actions:');
        console.log('1. Fix critical and high priority issues first');
        console.log('2. Update contact page email consistency');
        console.log('3. Integrate followup automation system');
        console.log('4. Test menu functionality on mobile devices');
        console.log('5. Validate all links are working');
    }
    
    // Method to apply fixes automatically
    async applyFixes() {
        console.log('\n🔧 Applying automatic fixes...');
        
        let appliedFixes = 0;
        
        for (const fix of this.fixes) {
            try {
                switch (fix.type) {
                    case 'update_tailwind':
                        await this.updateTailwindCSS(fix.file);
                        appliedFixes++;
                        break;
                        
                    case 'add_followup_scripts':
                        await this.addFollowupScripts(fix.file);
                        appliedFixes++;
                        break;
                        
                    // Add more fix implementations as needed
                }
            } catch (error) {
                console.error(`❌ Failed to apply fix for ${fix.file}: ${error.message}`);
            }
        }
        
        console.log(`✅ Applied ${appliedFixes} fixes successfully`);
        return appliedFixes;
    }
    
    async updateTailwindCSS(filePath) {
        if (!fs.existsSync(filePath)) return;
        
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(
            /https:\/\/cdn\.jsdelivr\.net\/npm\/tailwindcss@[\d\.]+\/dist\/tailwind\.min\.css/g,
            'https://cdn.tailwindcss.com'
        );
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✅ Updated Tailwind CSS in ${filePath}`);
    }
    
    async addFollowupScripts(filePath) {
        if (!fs.existsSync(filePath)) return;
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        const followupScripts = `
    <!-- Followup Systems -->
    <script src="/js/email-templates.js"></script>
    <script src="/js/followup-automation.js"></script>
    <script src="/js/sms-followup.js"></script>
    <script src="/js/call-followup.js"></script>`;
        
        // Add before closing body tag
        content = content.replace('</body>', followupScripts + '\n</body>');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✅ Added followup scripts to ${filePath}`);
    }
    
    // Method to validate specific page
    async validateSpecificPage(pagePath) {
        console.log(`🔍 Validating specific page: ${pagePath}`);
        
        if (!fs.existsSync(pagePath)) {
            console.log(`❌ Page not found: ${pagePath}`);
            return false;
        }
        
        const content = fs.readFileSync(pagePath, 'utf8');
        const pageIssues = [];
        
        // Check basic structure
        if (!content.includes('<html')) pageIssues.push('Missing HTML tag');
        if (!content.includes('<head>')) pageIssues.push('Missing head section');
        if (!content.includes('<body>')) pageIssues.push('Missing body section');
        if (!content.includes('header-placeholder')) pageIssues.push('Missing header placeholder');
        if (!content.includes('footer-placeholder')) pageIssues.push('Missing footer placeholder');
        
        // Check meta tags
        if (!content.includes('<title>')) pageIssues.push('Missing title tag');
        if (!content.includes('meta name="description"')) pageIssues.push('Missing meta description');
        if (!content.includes('meta name="viewport"')) pageIssues.push('Missing viewport meta tag');
        
        if (pageIssues.length === 0) {
            console.log(`✅ Page ${pagePath} is valid`);
            return true;
        } else {
            console.log(`❌ Page ${pagePath} has issues:`);
            pageIssues.forEach(issue => console.log(`  - ${issue}`));
            return false;
        }
    }
}

// CLI interface
if (require.main === module) {
    const validator = new ITERAMenuValidator();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--fix')) {
        validator.validateMenu().then(() => {
            return validator.applyFixes();
        });
    } else if (args.includes('--page') && args[args.indexOf('--page') + 1]) {
        const pagePath = args[args.indexOf('--page') + 1];
        validator.validateSpecificPage(pagePath);
    } else {
        validator.validateMenu();
    }
}

module.exports = ITERAMenuValidator;
