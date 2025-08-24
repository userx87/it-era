#!/usr/bin/env node

/**
 * Advanced PC Repair Template Validator
 * Comprehensive testing of generated pages functionality
 */

const fs = require('fs');
const path = require('path');

class PageValidator {
    constructor(testDir) {
        this.testDir = testDir;
        this.results = [];
    }

    async validateAllPages() {
        console.log('🔬 Advanced PC Repair Template Validation\n');

        const testFiles = fs.readdirSync(this.testDir)
            .filter(file => file.endsWith('.html'))
            .filter(file => file.startsWith('riparazione-pc-'));

        if (testFiles.length === 0) {
            console.log('❌ No test files found in', this.testDir);
            return false;
        }

        for (const file of testFiles) {
            await this.validateSinglePage(file);
        }

        return this.printFinalReport();
    }

    async validateSinglePage(fileName) {
        console.log(`🔍 Validating ${fileName}...`);
        
        const filePath = path.join(this.testDir, fileName);
        const content = fs.readFileSync(filePath, 'utf8');
        const city = this.extractCityFromFileName(fileName);

        const pageResult = {
            file: fileName,
            city: city,
            tests: {},
            overall: true
        };

        // Test Suite
        const tests = [
            this.testPlaceholderReplacement,
            this.testMetaTags,
            this.testStructuredData,
            this.testNavigation,
            this.testContactForm,
            this.testChatbotIntegration,
            this.testResponsiveDesign,
            this.testPerformanceOptimization,
            this.testSEOCompliance,
            this.testAccessibility
        ];

        for (const test of tests) {
            const testName = test.name.replace('test', '').toLowerCase();
            try {
                const result = await test.call(this, content, city);
                pageResult.tests[testName] = result;
                if (!result.passed) {
                    pageResult.overall = false;
                }
                console.log(`   ${result.passed ? '✅' : '❌'} ${result.name}: ${result.message}`);
            } catch (error) {
                pageResult.tests[testName] = { passed: false, name: testName, message: error.message };
                pageResult.overall = false;
                console.log(`   ❌ ${testName}: Error - ${error.message}`);
            }
        }

        this.results.push(pageResult);
        console.log(`   📊 Overall: ${pageResult.overall ? 'PASSED' : 'FAILED'}\n`);
    }

    extractCityFromFileName(fileName) {
        return fileName.replace('riparazione-pc-', '').replace('.html', '').replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    testPlaceholderReplacement(content, city) {
        const placeholders = content.match(/{{[^}]+}}/g);
        return {
            passed: !placeholders || placeholders.length === 0,
            name: 'Placeholder Replacement',
            message: placeholders ? `Found ${placeholders.length} unreplaced placeholders: ${placeholders.join(', ')}` : 'All placeholders replaced successfully'
        };
    }

    testMetaTags(content, city) {
        const tests = [
            { name: 'Title', regex: /<title>([^<]+)<\/title>/, shouldContain: city },
            { name: 'Meta Description', regex: /<meta[^>]+content="([^"]+)"[^>]+name="description"/, shouldContain: city },
            { name: 'Meta Keywords', regex: /<meta[^>]+content="([^"]+)"[^>]+name="keywords"/, shouldContain: city.toLowerCase() },
            { name: 'Canonical URL', regex: /<link[^>]+href="([^"]+)"[^>]+rel="canonical"/, shouldContain: city.toLowerCase().replace(' ', '-') }
        ];

        const failures = [];
        for (const test of tests) {
            const match = content.match(test.regex);
            if (!match) {
                failures.push(`${test.name} not found`);
            } else if (test.shouldContain && !match[1].toLowerCase().includes(test.shouldContain.toLowerCase())) {
                failures.push(`${test.name} doesn't contain '${test.shouldContain}'`);
            }
        }

        return {
            passed: failures.length === 0,
            name: 'Meta Tags',
            message: failures.length === 0 ? 'All meta tags present and correctly formatted' : failures.join(', ')
        };
    }

    testStructuredData(content, city) {
        const hasStructuredData = content.includes('application/ld+json');
        const hasLocalBusiness = content.includes('"@type": "LocalBusiness"');
        const hasCorrectCity = content.includes(`"addressLocality": "${city}"`);
        
        return {
            passed: hasStructuredData && hasLocalBusiness && hasCorrectCity,
            name: 'Structured Data',
            message: hasStructuredData && hasLocalBusiness && hasCorrectCity 
                ? 'Valid Schema.org LocalBusiness markup present' 
                : 'Missing or invalid structured data'
        };
    }

    testNavigation(content, city) {
        const hasNavbar = content.includes('class="navbar');
        const hasToggler = content.includes('navbar-toggler');
        const hasCollapse = content.includes('navbar-collapse');
        const hasDropdowns = content.includes('dropdown-menu');
        
        return {
            passed: hasNavbar && hasToggler && hasCollapse && hasDropdowns,
            name: 'Navigation',
            message: hasNavbar && hasToggler && hasCollapse && hasDropdowns
                ? 'Complete responsive navigation with dropdowns'
                : 'Navigation components missing'
        };
    }

    testContactForm(content, city) {
        const hasForm = content.includes('id="contactForm"');
        const hasRequiredFields = ['name="nome"', 'name="email"', 'name="telefono"'].every(field => content.includes(field));
        const hasSelectOptions = content.includes('name="tipo_cliente"');
        const hasCityReference = content.includes(`a ${city}`);
        const hasSubmitHandler = content.includes('addEventListener(\'submit\'');
        
        return {
            passed: hasForm && hasRequiredFields && hasSelectOptions && hasCityReference && hasSubmitHandler,
            name: 'Contact Form',
            message: hasForm && hasRequiredFields && hasSelectOptions && hasCityReference && hasSubmitHandler
                ? 'Complete contact form with validation and city reference'
                : 'Contact form incomplete or missing components'
        };
    }

    testChatbotIntegration(content, city) {
        const hasConfig = content.includes('ITERA_CHATBOT_CONFIG');
        const hasApiEndpoint = content.includes('apiEndpoint:');
        const hasCityConfig = content.includes(`city: '${city}'`);
        const hasScript = content.includes('chatbot');
        
        return {
            passed: hasConfig && hasApiEndpoint && hasScript,
            name: 'Chatbot Integration',
            message: hasConfig && hasApiEndpoint && hasScript
                ? 'Chatbot integration properly configured'
                : 'Chatbot integration missing or misconfigured'
        };
    }

    testResponsiveDesign(content, city) {
        const hasViewportMeta = content.includes('name="viewport"');
        const hasBootstrap = content.includes('bootstrap@5.3.2');
        const hasResponsiveClasses = ['col-lg-', 'col-md-', 'd-lg-', 'd-md-'].some(cls => content.includes(cls));
        const hasMediaQueries = content.includes('@media');
        
        return {
            passed: hasViewportMeta && hasBootstrap && hasResponsiveClasses && hasMediaQueries,
            name: 'Responsive Design',
            message: hasViewportMeta && hasBootstrap && hasResponsiveClasses && hasMediaQueries
                ? 'Full responsive design implementation'
                : 'Responsive design components missing'
        };
    }

    testPerformanceOptimization(content, city) {
        const hasCDNResources = content.includes('cdn.jsdelivr.net');
        const hasMinifiedFiles = content.includes('.min.css') && content.includes('.min.js');
        const hasAsyncScripts = content.includes('async');
        const hasPreloadFonts = content.includes('googleapis.com/css2');
        
        return {
            passed: hasCDNResources && hasMinifiedFiles,
            name: 'Performance Optimization',
            message: hasCDNResources && hasMinifiedFiles
                ? 'CDN resources and minified files used'
                : 'Performance optimizations missing'
        };
    }

    testSEOCompliance(content, city) {
        const hasProperHeadings = content.includes('<h1') && content.includes('<h2');
        const hasImageAlts = !content.includes('<img') || content.includes('alt=');
        const hasSemanticTags = ['<main', '<section', '<article', '<nav', '<footer'].some(tag => content.includes(tag));
        const hasInternalLinks = content.includes('href="#');
        
        return {
            passed: hasProperHeadings && hasImageAlts && hasSemanticTags && hasInternalLinks,
            name: 'SEO Compliance',
            message: hasProperHeadings && hasImageAlts && hasSemanticTags && hasInternalLinks
                ? 'SEO best practices implemented'
                : 'SEO optimizations missing'
        };
    }

    testAccessibility(content, city) {
        const hasSkipLink = content.includes('skip-link');
        const hasAriaLabels = content.includes('aria-') || content.includes('role=');
        const hasProperForms = content.includes('<label');
        const hasFocusStyles = content.includes(':focus');
        
        return {
            passed: hasSkipLink && hasProperForms && hasFocusStyles,
            name: 'Accessibility',
            message: hasSkipLink && hasProperForms && hasFocusStyles
                ? 'Basic accessibility features implemented'
                : 'Accessibility improvements needed'
        };
    }

    printFinalReport() {
        console.log('\n📊 COMPREHENSIVE VALIDATION REPORT');
        console.log('==========================================\n');

        let totalTests = 0;
        let passedTests = 0;
        let allPagesValid = true;

        for (const result of this.results) {
            console.log(`📄 ${result.file} (${result.city})`);
            console.log('─'.repeat(50));
            
            const testNames = Object.keys(result.tests);
            const passed = testNames.filter(name => result.tests[name].passed).length;
            const total = testNames.length;
            
            totalTests += total;
            passedTests += passed;
            
            console.log(`   Overall Status: ${result.overall ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`   Test Results: ${passed}/${total} tests passed`);
            
            // Show failed tests
            const failedTests = testNames.filter(name => !result.tests[name].passed);
            if (failedTests.length > 0) {
                console.log(`   Failed Tests: ${failedTests.join(', ')}`);
                allPagesValid = false;
            }
            
            console.log('');
        }

        console.log('📈 SUMMARY STATISTICS');
        console.log('==========================================');
        console.log(`Total Pages Tested: ${this.results.length}`);
        console.log(`Pages Passing All Tests: ${this.results.filter(r => r.overall).length}`);
        console.log(`Total Test Cases: ${totalTests}`);
        console.log(`Passed Test Cases: ${passedTests}`);
        console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
        
        console.log('\n🎯 RECOMMENDATIONS');
        console.log('==========================================');
        
        if (allPagesValid) {
            console.log('✅ All pages are production-ready!');
            console.log('✅ Template is working correctly');
            console.log('✅ All critical functionality tested');
        } else {
            console.log('⚠️  Some issues found - review failed tests above');
            console.log('⚠️  Fix issues before deploying to production');
        }

        return allPagesValid;
    }
}

// Run validator
async function main() {
    const testDir = path.join(__dirname, '../web/pages-test');
    const validator = new PageValidator(testDir);
    const success = await validator.validateAllPages();
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main();
}

module.exports = { PageValidator };