#!/usr/bin/env node

const chalk = require('chalk');
const DeploymentVerifier = require('./verify-deployment');
const UrlStatusTester = require('./test-url-status');
const NavigationTester = require('./test-navigation');
const ContentTester = require('./test-content');

class ComprehensiveVerificationSuite {
    constructor() {
        this.results = {
            urlTests: null,
            navigationTests: null,
            contentTests: null,
            deploymentTests: null,
            startTime: new Date(),
            endTime: null
        };
    }

    async runAllTests() {
        console.log(chalk.blue.bold('🚀 IT-ERA COMPREHENSIVE VERIFICATION SUITE'));
        console.log(chalk.gray('Testing sector pages deployment at https://it-era.pages.dev'));
        console.log(chalk.gray(`Started at: ${this.results.startTime.toLocaleString()}\n`));

        try {
            // Test 1: URL Status Tests
            console.log(chalk.cyan.bold('═'.repeat(60)));
            console.log(chalk.cyan.bold('TEST 1: URL STATUS VERIFICATION'));
            console.log(chalk.cyan.bold('═'.repeat(60)));
            
            const urlTester = new UrlStatusTester();
            this.results.urlTests = await urlTester.testAllUrls();

            // Test 2: Navigation Tests  
            console.log(chalk.cyan.bold('\n' + '═'.repeat(60)));
            console.log(chalk.cyan.bold('TEST 2: HOMEPAGE NAVIGATION VERIFICATION'));
            console.log(chalk.cyan.bold('═'.repeat(60)));
            
            const navTester = new NavigationTester();
            await navTester.run();

            // Test 3: Content Tests
            console.log(chalk.cyan.bold('\n' + '═'.repeat(60)));
            console.log(chalk.cyan.bold('TEST 3: PAGE CONTENT VERIFICATION'));
            console.log(chalk.cyan.bold('═'.repeat(60)));
            
            const contentTester = new ContentTester();
            await contentTester.run();

            // Test 4: Complete Deployment Verification
            console.log(chalk.cyan.bold('\n' + '═'.repeat(60)));
            console.log(chalk.cyan.bold('TEST 4: COMPREHENSIVE DEPLOYMENT CHECK'));
            console.log(chalk.cyan.bold('═'.repeat(60)));
            
            const deploymentVerifier = new DeploymentVerifier();
            await deploymentVerifier.run();

            this.results.endTime = new Date();
            this.generateFinalReport();

        } catch (error) {
            console.error(chalk.red.bold('\n❌ VERIFICATION SUITE FAILED:'), error);
            this.results.endTime = new Date();
            this.generateErrorReport(error);
        }
    }

    generateFinalReport() {
        const duration = Math.round((this.results.endTime - this.results.startTime) / 1000);
        
        console.log(chalk.blue.bold('\n' + '═'.repeat(80)));
        console.log(chalk.blue.bold('📊 FINAL VERIFICATION REPORT'));
        console.log(chalk.blue.bold('═'.repeat(80)));

        console.log(chalk.gray(`Duration: ${duration} seconds`));
        console.log(chalk.gray(`Completed at: ${this.results.endTime.toLocaleString()}\n`));

        // URL Test Summary
        if (this.results.urlTests) {
            const total = this.results.urlTests.found.length + 
                         this.results.urlTests.redirected.length + 
                         this.results.urlTests.notFound.length + 
                         this.results.urlTests.errors.length;
            const working = this.results.urlTests.found.length + this.results.urlTests.redirected.length;
            
            console.log(chalk.blue('🔗 URL Status Results:'));
            console.log(`   Working URLs: ${working}/${total} (${Math.round(working/total*100)}%)`);
            console.log(`   Direct Access: ${this.results.urlTests.found.length}`);
            console.log(`   Redirected: ${this.results.urlTests.redirected.length}`);
            console.log(`   Not Found: ${this.results.urlTests.notFound.length}`);
            console.log(`   Errors: ${this.results.urlTests.errors.length}\n`);
        }

        // Key Findings
        console.log(chalk.yellow.bold('🔍 KEY FINDINGS:'));

        // Check expected sector pages
        const expectedPages = [
            'settori-pmi-startup.html',
            'settori-studi-medici.html', 
            'settori-commercialisti.html',
            'settori-studi-legali.html'
        ];

        const foundExpected = expectedPages.filter(page => 
            this.results.urlTests?.found.some(result => result.path.includes(page)) ||
            this.results.urlTests?.redirected.some(result => result.path.includes(page))
        );

        if (foundExpected.length === expectedPages.length) {
            console.log(chalk.green('✓ All expected sector pages are accessible'));
        } else {
            console.log(chalk.red(`✗ Missing sector pages: ${expectedPages.length - foundExpected.length}/${expectedPages.length}`));
            const missing = expectedPages.filter(page => !foundExpected.includes(page));
            missing.forEach(page => {
                console.log(chalk.red(`  - ${page}`));
            });
        }

        // Check for alternatives
        const alternatives = this.results.urlTests?.found.filter(result => 
            result.path.includes('servizi-') || !result.path.includes('pages/')
        ) || [];

        if (alternatives.length > 0) {
            console.log(chalk.yellow(`⚠ Found ${alternatives.length} alternative URL patterns:`));
            alternatives.forEach(alt => {
                console.log(chalk.yellow(`  - ${alt.path}`));
            });
        }

        // Final verdict
        console.log(chalk.blue.bold('\n📋 FINAL VERDICT:'));
        
        if (foundExpected.length === expectedPages.length) {
            console.log(chalk.green.bold('🎉 DEPLOYMENT VERIFICATION SUCCESSFUL!'));
            console.log(chalk.green('All expected sector pages are deployed and accessible.'));
        } else if (alternatives.length > 0 && foundExpected.length + alternatives.length >= expectedPages.length) {
            console.log(chalk.yellow.bold('⚠️ DEPLOYMENT PARTIALLY SUCCESSFUL'));
            console.log(chalk.yellow('Pages are accessible but may be using different URL patterns than expected.'));
        } else {
            console.log(chalk.red.bold('❌ DEPLOYMENT ISSUES DETECTED'));
            console.log(chalk.red('Some or all sector pages are not accessible at expected URLs.'));
        }

        // Recommendations
        console.log(chalk.blue.bold('\n💡 RECOMMENDATIONS:'));
        
        if (foundExpected.length < expectedPages.length) {
            console.log(chalk.yellow('1. Check deployment pipeline for sector pages'));
            console.log(chalk.yellow('2. Verify file paths and naming conventions'));
            console.log(chalk.yellow('3. Check for redirect rules or URL rewrites'));
        }

        if (alternatives.length > 0) {
            console.log(chalk.yellow('4. Update navigation links to match actual deployed URLs'));
            console.log(chalk.yellow('5. Consider implementing redirects for consistency'));
        }

        console.log(chalk.gray('\nDetailed test results available in individual test outputs above.'));
        console.log(chalk.blue.bold('═'.repeat(80)));
    }

    generateErrorReport(error) {
        console.log(chalk.red.bold('\n❌ VERIFICATION SUITE ERROR REPORT'));
        console.log(chalk.red('Error occurred during testing:'), error.message);
        console.log(chalk.gray('Stack trace:'), error.stack);
    }
}

// Run comprehensive suite if called directly
if (require.main === module) {
    const suite = new ComprehensiveVerificationSuite();
    suite.runAllTests().catch(console.error);
}

module.exports = ComprehensiveVerificationSuite;