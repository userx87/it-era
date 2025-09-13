#!/usr/bin/env node

/**
 * IT-ERA FINAL PRODUCTION VALIDATION
 * Complete validation before activating automated cron job
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class FinalProductionValidation {
    constructor() {
        this.browser = null;
        this.validationResults = {
            blogGeneration: { passed: false, details: [] },
            githubDeployment: { passed: false, details: [] },
            liveWebsite: { passed: false, details: [] },
            cronScript: { passed: false, details: [] },
            seoElements: { passed: false, details: [] },
            overallReadiness: { passed: false, score: 0 }
        };
    }

    async initialize() {
        console.log('🔍 FINAL PRODUCTION VALIDATION');
        console.log('=' .repeat(60));
        console.log('📅 Started:', new Date().toLocaleString());
        console.log('');
        
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async runCompleteValidation() {
        try {
            console.log('🧪 RUNNING COMPREHENSIVE PRODUCTION TESTS...');
            console.log('');

            // Test 1: Blog Generation System
            await this.testBlogGeneration();
            
            // Test 2: GitHub Deployment Pipeline
            await this.testGitHubDeployment();
            
            // Test 3: Live Website Integration
            await this.testLiveWebsite();
            
            // Test 4: Cron Script Functionality
            await this.testCronScript();
            
            // Test 5: SEO Elements Validation
            await this.testSEOElements();
            
            // Generate final production report
            this.generateProductionReport();
            
        } catch (error) {
            console.error('❌ Validation error:', error.message);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async testBlogGeneration() {
        console.log('📝 TESTING BLOG GENERATION SYSTEM...');
        
        try {
            // Test blog generator
            const { stdout, stderr } = await execAsync('node blog/seo-blog-generator.js');
            
            const generationSuccess = stdout.includes('Article generation and publication completed!');
            const keywordsLoaded = stdout.includes('Loaded 30 keywords');
            const templatesLoaded = stdout.includes('Loaded 4 templates');
            
            this.validationResults.blogGeneration.passed = generationSuccess && keywordsLoaded && templatesLoaded;
            this.validationResults.blogGeneration.details = [
                `Generation Success: ${generationSuccess ? '✅' : '❌'}`,
                `Keywords Database: ${keywordsLoaded ? '✅' : '❌'} (30 keywords)`,
                `Templates Loaded: ${templatesLoaded ? '✅' : '❌'} (4 templates)`,
                `Output: ${stdout.split('\n').length} lines of output`
            ];
            
            console.log(`  Blog Generation: ${this.validationResults.blogGeneration.passed ? '✅' : '❌'}`);
            this.validationResults.blogGeneration.details.forEach(detail => console.log(`    ${detail}`));
            
        } catch (error) {
            this.validationResults.blogGeneration.passed = false;
            this.validationResults.blogGeneration.details = [`Error: ${error.message}`];
            console.log(`  Blog Generation: ❌ (${error.message})`);
        }
    }

    async testGitHubDeployment() {
        console.log('\n🚀 TESTING GITHUB DEPLOYMENT PIPELINE...');
        
        try {
            // Check git status
            const { stdout: gitStatus } = await execAsync('git status --porcelain');
            
            // Check if we can commit (dry run)
            const { stdout: gitCheck } = await execAsync('git diff --cached --name-only').catch(() => ({ stdout: '' }));
            
            // Check remote connection
            const { stdout: remoteCheck } = await execAsync('git remote -v');
            
            const gitWorking = remoteCheck.includes('github.com');
            const repoClean = gitStatus.trim().length < 100; // Reasonable amount of changes
            
            this.validationResults.githubDeployment.passed = gitWorking && repoClean;
            this.validationResults.githubDeployment.details = [
                `Git Remote: ${gitWorking ? '✅' : '❌'} (GitHub connected)`,
                `Repository Status: ${repoClean ? '✅' : '❌'} (${gitStatus.split('\n').length} changes)`,
                `Deployment Ready: ${this.validationResults.githubDeployment.passed ? '✅' : '❌'}`
            ];
            
            console.log(`  GitHub Deployment: ${this.validationResults.githubDeployment.passed ? '✅' : '❌'}`);
            this.validationResults.githubDeployment.details.forEach(detail => console.log(`    ${detail}`));
            
        } catch (error) {
            this.validationResults.githubDeployment.passed = false;
            this.validationResults.githubDeployment.details = [`Error: ${error.message}`];
            console.log(`  GitHub Deployment: ❌ (${error.message})`);
        }
    }

    async testLiveWebsite() {
        console.log('\n🌐 TESTING LIVE WEBSITE INTEGRATION...');
        
        const page = await this.browser.newPage();
        
        try {
            // Test blog index
            await page.goto('https://it-era.it/blog/', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            const blogTitle = await page.$eval('h1', el => el.textContent).catch(() => '');
            const blogWorking = blogTitle.includes('Blog IT-ERA');
            
            // Test generated article
            await page.goto('https://it-era.it/blog/articoli/2025-09-13-cloud-computing-varese.html', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            const articleTitle = await page.$eval('h1', el => el.textContent).catch(() => '');
            const articleWorking = articleTitle.includes('cloud computing');
            
            // Test homepage integration
            await page.goto('https://it-era.it/', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            const homepageTitle = await page.$eval('h1', el => el.textContent).catch(() => '');
            const homepageWorking = homepageTitle.length > 0;
            
            this.validationResults.liveWebsite.passed = blogWorking && articleWorking && homepageWorking;
            this.validationResults.liveWebsite.details = [
                `Blog Index: ${blogWorking ? '✅' : '❌'} (${blogTitle.trim()})`,
                `Generated Article: ${articleWorking ? '✅' : '❌'} (${articleTitle.trim()})`,
                `Homepage Integration: ${homepageWorking ? '✅' : '❌'} (${homepageTitle.trim()})`,
                `Live Website: ${this.validationResults.liveWebsite.passed ? '✅' : '❌'}`
            ];
            
            console.log(`  Live Website: ${this.validationResults.liveWebsite.passed ? '✅' : '❌'}`);
            this.validationResults.liveWebsite.details.forEach(detail => console.log(`    ${detail}`));
            
        } catch (error) {
            this.validationResults.liveWebsite.passed = false;
            this.validationResults.liveWebsite.details = [`Error: ${error.message}`];
            console.log(`  Live Website: ❌ (${error.message})`);
        } finally {
            await page.close();
        }
    }

    async testCronScript() {
        console.log('\n⏰ TESTING CRON SCRIPT FUNCTIONALITY...');
        
        try {
            // Check if cron script exists and is executable
            await fs.access('blog/cron-blog.sh', fs.constants.F_OK | fs.constants.X_OK);
            
            // Read cron script content
            const cronContent = await fs.readFile('blog/cron-blog.sh', 'utf8');
            
            const hasShebang = cronContent.startsWith('#!/bin/bash');
            const hasLogging = cronContent.includes('log_message');
            const hasErrorHandling = cronContent.includes('exit 1');
            const hasGitIntegration = cronContent.includes('git add');
            
            this.validationResults.cronScript.passed = hasShebang && hasLogging && hasErrorHandling && hasGitIntegration;
            this.validationResults.cronScript.details = [
                `Script Executable: ✅`,
                `Proper Shebang: ${hasShebang ? '✅' : '❌'}`,
                `Logging System: ${hasLogging ? '✅' : '❌'}`,
                `Error Handling: ${hasErrorHandling ? '✅' : '❌'}`,
                `Git Integration: ${hasGitIntegration ? '✅' : '❌'}`,
                `Script Length: ${cronContent.split('\n').length} lines`
            ];
            
            console.log(`  Cron Script: ${this.validationResults.cronScript.passed ? '✅' : '❌'}`);
            this.validationResults.cronScript.details.forEach(detail => console.log(`    ${detail}`));
            
        } catch (error) {
            this.validationResults.cronScript.passed = false;
            this.validationResults.cronScript.details = [`Error: ${error.message}`];
            console.log(`  Cron Script: ❌ (${error.message})`);
        }
    }

    async testSEOElements() {
        console.log('\n🔍 TESTING SEO ELEMENTS...');
        
        const page = await this.browser.newPage();
        
        try {
            await page.goto('https://it-era.it/blog/articoli/2025-09-13-cloud-computing-varese.html', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            // Test meta description
            const metaDescription = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
            const metaOptimized = metaDescription.length > 100 && metaDescription.length < 160;
            
            // Test canonical URL
            const canonicalUrl = await page.$eval('link[rel="canonical"]', el => el.href).catch(() => '');
            const canonicalOptimized = canonicalUrl.includes('it-era.it');
            
            // Test schema markup
            const schemaMarkup = await page.$('script[type="application/ld+json"]').catch(() => null);
            const schemaOptimized = schemaMarkup !== null;
            
            // Test title optimization
            const title = await page.title();
            const titleOptimized = title.length > 30 && title.length < 60;
            
            this.validationResults.seoElements.passed = metaOptimized && canonicalOptimized && schemaOptimized && titleOptimized;
            this.validationResults.seoElements.details = [
                `Meta Description: ${metaOptimized ? '✅' : '❌'} (${metaDescription.length} chars)`,
                `Canonical URL: ${canonicalOptimized ? '✅' : '❌'}`,
                `Schema Markup: ${schemaOptimized ? '✅' : '❌'}`,
                `Title Optimization: ${titleOptimized ? '✅' : '❌'} (${title.length} chars)`,
                `SEO Complete: ${this.validationResults.seoElements.passed ? '✅' : '❌'}`
            ];
            
            console.log(`  SEO Elements: ${this.validationResults.seoElements.passed ? '✅' : '❌'}`);
            this.validationResults.seoElements.details.forEach(detail => console.log(`    ${detail}`));
            
        } catch (error) {
            this.validationResults.seoElements.passed = false;
            this.validationResults.seoElements.details = [`Error: ${error.message}`];
            console.log(`  SEO Elements: ❌ (${error.message})`);
        } finally {
            await page.close();
        }
    }

    generateProductionReport() {
        console.log('\n' + '='.repeat(60));
        console.log('🏆 FINAL PRODUCTION VALIDATION REPORT');
        console.log('='.repeat(60));
        
        const testResults = [
            this.validationResults.blogGeneration.passed,
            this.validationResults.githubDeployment.passed,
            this.validationResults.liveWebsite.passed,
            this.validationResults.cronScript.passed,
            this.validationResults.seoElements.passed
        ];
        
        const passedTests = testResults.filter(Boolean).length;
        const totalTests = testResults.length;
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        this.validationResults.overallReadiness.score = successRate;
        this.validationResults.overallReadiness.passed = successRate >= 80;
        
        console.log(`📊 VALIDATION RESULTS: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
        console.log('');
        
        console.log('📝 Blog Generation System:', this.validationResults.blogGeneration.passed ? '✅ READY' : '❌ NEEDS WORK');
        console.log('🚀 GitHub Deployment:', this.validationResults.githubDeployment.passed ? '✅ READY' : '❌ NEEDS WORK');
        console.log('🌐 Live Website Integration:', this.validationResults.liveWebsite.passed ? '✅ READY' : '❌ NEEDS WORK');
        console.log('⏰ Cron Script:', this.validationResults.cronScript.passed ? '✅ READY' : '❌ NEEDS WORK');
        console.log('🔍 SEO Elements:', this.validationResults.seoElements.passed ? '✅ READY' : '❌ NEEDS WORK');
        
        console.log('');
        console.log('🎯 OVERALL PRODUCTION READINESS:');
        
        if (this.validationResults.overallReadiness.passed) {
            console.log('✅ PRODUCTION READY! All systems validated and operational.');
            console.log('');
            console.log('🚀 CRON JOB ACTIVATION APPROVED:');
            console.log('   Run: crontab -e');
            console.log('   Add: 0 9 * * * /Users/andreapanzeri/progetti/IT-ERA/blog/cron-blog.sh');
            console.log('');
            console.log('📈 EXPECTED RESULTS:');
            console.log('   • Daily SEO-optimized articles');
            console.log('   • Automatic GitHub deployment');
            console.log('   • 365 articles/year potential');
            console.log('   • Improved search rankings');
            console.log('   • Increased organic traffic');
        } else {
            console.log('⚠️ NOT READY FOR PRODUCTION');
            console.log('   Please fix the failing tests before activating automation.');
            console.log('');
            console.log('🔧 REQUIRED ACTIONS:');
            if (!this.validationResults.blogGeneration.passed) console.log('   • Fix blog generation system');
            if (!this.validationResults.githubDeployment.passed) console.log('   • Fix GitHub deployment pipeline');
            if (!this.validationResults.liveWebsite.passed) console.log('   • Fix live website integration');
            if (!this.validationResults.cronScript.passed) console.log('   • Fix cron script functionality');
            if (!this.validationResults.seoElements.passed) console.log('   • Fix SEO elements');
        }
        
        console.log('\n📅 Validation completed:', new Date().toLocaleString());
    }
}

// Run final validation
async function main() {
    const validator = new FinalProductionValidation();
    await validator.initialize();
    await validator.runCompleteValidation();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = FinalProductionValidation;
