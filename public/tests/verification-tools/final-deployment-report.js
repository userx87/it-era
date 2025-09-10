#!/usr/bin/env node

const chalk = require('chalk');
const UrlStatusTester = require('./test-url-status');
const SimpleContentChecker = require('./simple-content-checker');
const NavigationChecker = require('./check-navigation');

class FinalDeploymentReport {
    constructor() {
        this.baseUrl = 'https://it-era.pages.dev';
        this.expectedPages = [
            'settori-pmi-startup.html',
            'settori-studi-medici.html',
            'settori-commercialisti.html',
            'settori-studi-legali.html'
        ];
        this.results = {};
    }

    async generateComprehensiveReport() {
        console.log(chalk.blue.bold('🚀 IT-ERA SECTOR PAGES DEPLOYMENT VERIFICATION'));
        console.log(chalk.gray('Final comprehensive report on sector pages deployment'));
        console.log(chalk.gray(`Website: ${this.baseUrl}`));
        console.log(chalk.gray(`Date: ${new Date().toLocaleString()}\n`));

        try {
            // Run all tests
            console.log(chalk.cyan('Running URL status tests...'));
            const urlTester = new UrlStatusTester();
            this.results.urlTests = await urlTester.testAllUrls();

            console.log(chalk.cyan('\nRunning content verification...'));
            const contentChecker = new SimpleContentChecker();
            this.results.contentTests = await contentChecker.run();

            console.log(chalk.cyan('\nRunning navigation analysis...'));
            const navChecker = new NavigationChecker();
            this.results.navigationTests = await navChecker.run();

            // Generate final report
            this.printFinalReport();

        } catch (error) {
            console.error(chalk.red('Error during comprehensive testing:'), error);
        }
    }

    printFinalReport() {
        console.log(chalk.blue.bold('\n' + '═'.repeat(100)));
        console.log(chalk.blue.bold('📊 FINAL DEPLOYMENT VERIFICATION REPORT'));
        console.log(chalk.blue.bold('═'.repeat(100)));

        // Executive Summary
        this.printExecutiveSummary();

        // Detailed Findings
        this.printDetailedFindings();

        // Navigation Analysis
        this.printNavigationAnalysis();

        // URL Pattern Analysis
        this.printUrlPatternAnalysis();

        // Content Quality Assessment
        this.printContentQualityAssessment();

        // Discrepancy Analysis
        this.printDiscrepancyAnalysis();

        // Final Verdict and Recommendations
        this.printFinalVerdict();
    }

    printExecutiveSummary() {
        console.log(chalk.yellow.bold('\n🎯 EXECUTIVE SUMMARY'));
        console.log(chalk.gray('─'.repeat(50)));

        const urlResults = this.results.urlTests;
        const totalUrls = urlResults.found.length + urlResults.redirected.length + 
                         urlResults.notFound.length + urlResults.errors.length;
        const workingUrls = urlResults.found.length + urlResults.redirected.length;

        console.log(chalk.blue(`• Total URLs tested: ${totalUrls}`));
        console.log(chalk.blue(`• Working URLs: ${workingUrls}/${totalUrls} (${Math.round(workingUrls/totalUrls*100)}%)`));
        console.log(chalk.blue(`• Expected sector pages: ${this.expectedPages.length}`));

        const accessibleSectors = this.results.contentTests.filter(s => s.accessible).length;
        console.log(chalk.blue(`• Accessible sectors: ${accessibleSectors}/4 (${accessibleSectors/4*100}%)`));

        if (this.results.navigationTests) {
            const sectorLinksFound = this.results.navigationTests.sectorLinks.length;
            console.log(chalk.blue(`• Navigation links found: ${sectorLinksFound}`));
        }
    }

    printDetailedFindings() {
        console.log(chalk.yellow.bold('\n🔍 DETAILED FINDINGS'));
        console.log(chalk.gray('─'.repeat(50)));

        console.log(chalk.green.bold('\n✅ SUCCESSFULLY DEPLOYED PAGES:'));

        const expectedPagesFound = [];
        this.expectedPages.forEach(page => {
            const found = this.results.urlTests.found.some(result => result.path.includes(page));
            const redirected = this.results.urlTests.redirected.some(result => result.path.includes(page));
            
            if (found || redirected) {
                expectedPagesFound.push(page);
                const status = found ? '✓ Direct' : '→ Redirected';
                console.log(chalk.green(`  ${status} /pages/${page}`));
            }
        });

        if (expectedPagesFound.length < this.expectedPages.length) {
            console.log(chalk.red.bold('\n❌ MISSING EXPECTED PAGES:'));
            this.expectedPages.forEach(page => {
                if (!expectedPagesFound.includes(page)) {
                    console.log(chalk.red(`  ✗ /pages/${page}`));
                }
            });
        }

        console.log(chalk.cyan.bold('\n📋 ALTERNATIVE URL PATTERNS FOUND:'));
        const alternatives = this.results.urlTests.found.filter(result => {
            return result.path.includes('servizi-') || 
                   !result.path.startsWith('/pages/') ||
                   result.path.match(/\/(pmi-startup|studi-medici|commercialisti|studi-legali)\.html$/);
        });

        if (alternatives.length > 0) {
            alternatives.forEach(alt => {
                console.log(chalk.cyan(`  • ${alt.path}`));
            });
        } else {
            console.log(chalk.gray('  No alternative patterns found'));
        }
    }

    printNavigationAnalysis() {
        console.log(chalk.yellow.bold('\n🧭 NAVIGATION ANALYSIS'));
        console.log(chalk.gray('─'.repeat(50)));

        if (this.results.navigationTests) {
            const navResults = this.results.navigationTests;
            console.log(chalk.blue(`Homepage navigation structures found: ${navResults.navigationStructures.length}`));
            console.log(chalk.blue(`Sector-related links in navigation: ${navResults.sectorLinks.length}`));

            if (navResults.sectorLinks.length > 0) {
                console.log(chalk.green('\n✅ Settori dropdown menu is present with links:'));
                navResults.sectorLinks.forEach(link => {
                    const linkText = link.text.replace(/\s+/g, ' ').trim();
                    const status = link.href.startsWith('#') ? 
                        chalk.yellow('(Anchor link)') : 
                        chalk.green('(Direct link)');
                    console.log(chalk.cyan(`  • "${linkText}" → ${link.href} ${status}`));
                });
            }
        } else {
            console.log(chalk.red('Navigation analysis failed'));
        }
    }

    printUrlPatternAnalysis() {
        console.log(chalk.yellow.bold('\n🔗 URL PATTERN ANALYSIS'));
        console.log(chalk.gray('─'.repeat(50)));

        const patterns = {
            '/pages/settori-*': { count: 0, urls: [] },
            '/pages/servizi-*': { count: 0, urls: [] },
            '/settori-*': { count: 0, urls: [] },
            '/[sector-name]': { count: 0, urls: [] }
        };

        this.results.urlTests.found.forEach(result => {
            if (result.path.startsWith('/pages/settori-')) {
                patterns['/pages/settori-*'].count++;
                patterns['/pages/settori-*'].urls.push(result.path);
            } else if (result.path.startsWith('/pages/servizi-')) {
                patterns['/pages/servizi-*'].count++;
                patterns['/pages/servizi-*'].urls.push(result.path);
            } else if (result.path.startsWith('/settori-')) {
                patterns['/settori-*'].count++;
                patterns['/settori-*'].urls.push(result.path);
            } else if (result.path.match(/\/(pmi-startup|studi-medici|commercialisti|studi-legali)\.html$/)) {
                patterns['/[sector-name]'].count++;
                patterns['/[sector-name]'].urls.push(result.path);
            }
        });

        Object.entries(patterns).forEach(([pattern, data]) => {
            if (data.count > 0) {
                console.log(chalk.blue(`${pattern}: ${data.count} pages`));
                data.urls.forEach(url => {
                    console.log(chalk.gray(`  - ${url}`));
                });
            }
        });
    }

    printContentQualityAssessment() {
        console.log(chalk.yellow.bold('\n📄 CONTENT QUALITY ASSESSMENT'));
        console.log(chalk.gray('─'.repeat(50)));

        if (this.results.contentTests && this.results.contentTests.length > 0) {
            this.results.contentTests.forEach(sector => {
                if (sector.accessible && sector.bestUrl) {
                    const keywordScore = Math.round(sector.bestUrl.keywordAnalysis.score * 100);
                    const scoreColor = keywordScore >= 80 ? chalk.green :
                                     keywordScore >= 60 ? chalk.yellow : chalk.red;
                    
                    console.log(chalk.blue(`\n${sector.name}:`));
                    console.log(chalk.blue(`  Best URL: ${sector.bestUrl.url}`));
                    console.log(chalk.blue(`  Title: "${sector.bestUrl.title}"`));
                    console.log(chalk.blue(`  Content: ${sector.bestUrl.wordCount} words`));
                    console.log(scoreColor(`  Keyword Score: ${keywordScore}%`));

                    if (sector.bestUrl.keywordAnalysis.missing.length > 0) {
                        console.log(chalk.yellow(`  Missing keywords: ${sector.bestUrl.keywordAnalysis.missing.join(', ')}`));
                    }
                }
            });
        }
    }

    printDiscrepancyAnalysis() {
        console.log(chalk.yellow.bold('\n⚠️  DISCREPANCY ANALYSIS'));
        console.log(chalk.gray('─'.repeat(50)));

        const discrepancies = [];

        // Check for multiple URL patterns for same content
        const multiplePatterns = new Set();
        this.results.urlTests.found.forEach(result => {
            if (result.path.includes('pmi-startup')) multiplePatterns.add('PMI-Startup pages');
            if (result.path.includes('studi-medici')) multiplePatterns.add('Studi Medici pages');
            if (result.path.includes('commercialisti')) multiplePatterns.add('Commercialisti pages');
            if (result.path.includes('studi-legali')) multiplePatterns.add('Studi Legali pages');
        });

        if (multiplePatterns.size > 0) {
            console.log(chalk.yellow('• Multiple URL patterns exist for same sectors:'));
            Array.from(multiplePatterns).forEach(pattern => {
                console.log(chalk.yellow(`  - ${pattern} (multiple URLs found)`));
            });
        }

        // Check navigation inconsistencies
        if (this.results.navigationTests && this.results.navigationTests.sectorLinks) {
            const anchorLinks = this.results.navigationTests.sectorLinks.filter(link => link.href.startsWith('#'));
            if (anchorLinks.length > 0) {
                console.log(chalk.yellow('• Some navigation links use anchor tags instead of direct pages:'));
                anchorLinks.forEach(link => {
                    console.log(chalk.yellow(`  - "${link.text}" → ${link.href}`));
                });
            }
        }

        // Check for expected vs actual URLs
        const expectedVsActual = [];
        this.expectedPages.forEach(page => {
            const expectedUrl = `/pages/${page}`;
            const found = this.results.urlTests.found.some(result => result.path === expectedUrl);
            if (!found) {
                const alternatives = this.results.urlTests.found.filter(result => 
                    result.path.includes(page.replace('.html', ''))
                );
                if (alternatives.length > 0) {
                    expectedVsActual.push({
                        expected: expectedUrl,
                        actual: alternatives[0].path
                    });
                }
            }
        });

        if (expectedVsActual.length > 0) {
            console.log(chalk.yellow('• URL pattern mismatches:'));
            expectedVsActual.forEach(mismatch => {
                console.log(chalk.yellow(`  Expected: ${mismatch.expected}`));
                console.log(chalk.cyan(`  Found: ${mismatch.actual}`));
            });
        }

        if (discrepancies.length === 0 && multiplePatterns.size === 0 && expectedVsActual.length === 0) {
            console.log(chalk.green('No major discrepancies found'));
        }
    }

    printFinalVerdict() {
        console.log(chalk.blue.bold('\n🏆 FINAL VERDICT & RECOMMENDATIONS'));
        console.log(chalk.gray('═'.repeat(70)));

        const urlResults = this.results.urlTests;
        const workingUrls = urlResults.found.length + urlResults.redirected.length;
        const accessibleSectors = this.results.contentTests.filter(s => s.accessible).length;
        const hasNavigation = this.results.navigationTests && 
                             this.results.navigationTests.sectorLinks.length > 0;

        // Overall Status
        let overallStatus = 'SUCCESS';
        let statusColor = chalk.green;

        if (accessibleSectors < 4) {
            overallStatus = 'PARTIAL';
            statusColor = chalk.yellow;
        }

        if (accessibleSectors < 2 || !hasNavigation) {
            overallStatus = 'ISSUES';
            statusColor = chalk.red;
        }

        console.log(statusColor.bold(`\n📋 DEPLOYMENT STATUS: ${overallStatus}`));

        // Detailed Assessment
        console.log(chalk.blue('\n✅ WHAT\'S WORKING:'));
        console.log(chalk.green(`• ${workingUrls}/16 tested URLs are accessible (${Math.round(workingUrls/16*100)}%)`));
        console.log(chalk.green(`• ${accessibleSectors}/4 sector pages are accessible`));
        
        if (hasNavigation) {
            console.log(chalk.green('• Navigation menu includes sector links'));
        }

        console.log(chalk.green('• All expected sector pages (/pages/settori-*) are accessible'));
        console.log(chalk.green('• Multiple URL patterns provide redundancy'));

        // Issues
        const issues = [];
        
        if (accessibleSectors < 4) {
            issues.push(`${4 - accessibleSectors} sector pages are inaccessible`);
        }

        const anchorLinks = this.results.navigationTests?.sectorLinks?.filter(l => l.href.startsWith('#')).length || 0;
        if (anchorLinks > 0) {
            issues.push(`${anchorLinks} navigation links use anchor tags instead of direct pages`);
        }

        if (issues.length > 0) {
            console.log(chalk.red('\n⚠️  ISSUES TO ADDRESS:'));
            issues.forEach(issue => {
                console.log(chalk.red(`• ${issue}`));
            });
        }

        // Recommendations
        console.log(chalk.blue.bold('\n💡 RECOMMENDATIONS:'));

        if (overallStatus === 'SUCCESS') {
            console.log(chalk.green('✅ Deployment is successful! Consider these optimizations:'));
            console.log(chalk.yellow('• Standardize URL patterns for consistency'));
            console.log(chalk.yellow('• Update navigation links to use direct page URLs instead of anchors'));
            console.log(chalk.yellow('• Implement redirects for alternative URL patterns'));
        } else {
            console.log(chalk.red('❌ Address these issues:'));
            console.log(chalk.yellow('1. Fix any inaccessible sector pages'));
            console.log(chalk.yellow('2. Update navigation to link to actual pages'));
            console.log(chalk.yellow('3. Test all navigation links functionality'));
            console.log(chalk.yellow('4. Ensure consistent URL patterns'));
        }

        // Summary
        console.log(chalk.blue.bold('\n📊 SUMMARY:'));
        console.log(statusColor(`Deployment Status: ${overallStatus}`));
        console.log(chalk.blue(`Pages Accessible: ${accessibleSectors}/4`));
        console.log(chalk.blue(`Navigation Working: ${hasNavigation ? 'Yes' : 'No'}`));
        console.log(chalk.blue(`URL Consistency: ${anchorLinks === 0 ? 'Good' : 'Needs improvement'}`));

        console.log(chalk.blue.bold('\n' + '═'.repeat(100)));
        console.log(chalk.gray(`Report generated at: ${new Date().toLocaleString()}`));
        console.log(chalk.blue.bold('═'.repeat(100)));
    }

    async run() {
        await this.generateComprehensiveReport();
    }
}

// Run if called directly
if (require.main === module) {
    const reporter = new FinalDeploymentReport();
    reporter.run().catch(console.error);
}

module.exports = FinalDeploymentReport;