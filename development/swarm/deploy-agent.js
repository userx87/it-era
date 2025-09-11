#!/usr/bin/env node

/**
 * 🚀 DEPLOY AGENT - Automated deployment and testing
 * Deploys SEO-optimized pages to appropriate isolated branches with comprehensive testing
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class DeployAgent {
    constructor(targetBranches) {
        this.targetBranches = targetBranches || [
            'feature/sicurezza-informatica-isolated',
            'feature/assistenza-tecnica-isolated',
            'feature/cloud-computing-isolated',
            'feature/reti-aziendali-isolated',
            'feature/settori-verticali-isolated',
            'feature/zone-geografiche-isolated'
        ];
        
        this.deployedPages = [];
        this.testResults = [];
        this.deploymentReport = {
            timestamp: new Date().toISOString(),
            totalPages: 0,
            successfulDeployments: 0,
            failedDeployments: 0,
            testResults: {
                seoCompliance: [],
                pageSpeed: [],
                mobileResponsiveness: [],
                schemaValidation: [],
                internalLinks: []
            }
        };
    }

    async deployPages(generatedPages) {
        console.log('🚀 Starting automated deployment and testing...\n');
        
        this.generatedPages = generatedPages;
        this.deploymentReport.totalPages = generatedPages.length;
        
        // Group pages by target branch
        const pagesByBranch = this.groupPagesByBranch(generatedPages);
        
        // Deploy to each branch
        for (const [branchName, pages] of Object.entries(pagesByBranch)) {
            try {
                await this.deployToBranch(branchName, pages);
                console.log(`✅ Deployed ${pages.length} pages to ${branchName}`);
            } catch (error) {
                console.error(`❌ Error deploying to ${branchName}:`, error.message);
                this.deploymentReport.failedDeployments += pages.length;
            }
        }
        
        // Run comprehensive testing
        await this.runComprehensiveTesting();
        
        // Generate deployment report
        await this.generateDeploymentReport();
        
        console.log(`\n🎉 Deployment completed: ${this.deploymentReport.successfulDeployments}/${this.deploymentReport.totalPages} pages deployed successfully`);
        
        return this.deploymentReport;
    }

    groupPagesByBranch(pages) {
        const grouped = {};
        
        pages.forEach(page => {
            const branch = page.targetBranch;
            if (!grouped[branch]) {
                grouped[branch] = [];
            }
            grouped[branch].push(page);
        });
        
        return grouped;
    }

    async deployToBranch(branchName, pages) {
        console.log(`📦 Deploying ${pages.length} pages to ${branchName}...`);
        
        // Switch to target branch
        await this.switchToBranch(branchName);
        
        // Deploy each page
        for (const page of pages) {
            try {
                await this.deploySinglePage(page);
                this.deployedPages.push({
                    ...page,
                    deployedAt: new Date().toISOString(),
                    branch: branchName,
                    status: 'success'
                });
                this.deploymentReport.successfulDeployments++;
            } catch (error) {
                console.error(`❌ Failed to deploy ${page.filename}:`, error.message);
                this.deployedPages.push({
                    ...page,
                    deployedAt: new Date().toISOString(),
                    branch: branchName,
                    status: 'failed',
                    error: error.message
                });
                this.deploymentReport.failedDeployments++;
            }
        }
        
        // Commit and push changes
        await this.commitAndPush(branchName, pages.length);
    }

    async switchToBranch(branchName) {
        try {
            await execAsync(`git checkout ${branchName}`);
            await execAsync(`git pull origin ${branchName}`);
            console.log(`🔄 Switched to ${branchName}`);
        } catch (error) {
            throw new Error(`Failed to switch to branch ${branchName}: ${error.message}`);
        }
    }

    async deploySinglePage(page) {
        // Ensure directory exists
        const dirPath = path.dirname(page.filePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // Write page file
        fs.writeFileSync(page.filePath, page.html);
        
        console.log(`  📄 Deployed: ${page.filePath}`);
    }

    async commitAndPush(branchName, pageCount) {
        try {
            await execAsync('git add .');
            await execAsync(`git commit -m "🚀 Deploy ${pageCount} SEO-optimized pages via swarm system"`);
            await execAsync(`git push origin ${branchName}`);
            console.log(`  💾 Committed and pushed changes to ${branchName}`);
        } catch (error) {
            console.error(`⚠️ Warning: Could not commit/push to ${branchName}:`, error.message);
        }
    }

    async runComprehensiveTesting() {
        console.log('\n🧪 Running comprehensive testing suite...\n');
        
        // Test each deployed page
        for (const page of this.deployedPages.filter(p => p.status === 'success')) {
            try {
                const testResult = await this.testSinglePage(page);
                this.testResults.push(testResult);
                
                // Add to deployment report
                this.addTestResultToReport(testResult);
                
                console.log(`✅ Tested: ${page.filename} (Score: ${testResult.overallScore}/100)`);
            } catch (error) {
                console.error(`❌ Test failed for ${page.filename}:`, error.message);
            }
        }
        
        console.log(`\n📊 Testing completed: ${this.testResults.length} pages tested`);
    }

    async testSinglePage(page) {
        const testResult = {
            filename: page.filename,
            filePath: page.filePath,
            keyword: page.keyword,
            category: page.category,
            branch: page.branch,
            tests: {
                seoCompliance: await this.testSEOCompliance(page),
                pageSpeed: await this.testPageSpeed(page),
                mobileResponsiveness: await this.testMobileResponsiveness(page),
                schemaValidation: await this.testSchemaValidation(page),
                internalLinks: await this.testInternalLinks(page),
                contentQuality: await this.testContentQuality(page)
            },
            overallScore: 0
        };
        
        // Calculate overall score
        testResult.overallScore = this.calculateOverallScore(testResult.tests);
        
        return testResult;
    }

    async testSEOCompliance(page) {
        const html = page.html;
        const score = { score: 0, issues: [], passed: [] };
        
        // Test title tag
        if (html.includes('<title>') && html.match(/<title>([^<]+)<\/title>/)?.[1]?.length <= 60) {
            score.passed.push('Title tag present and optimal length');
            score.score += 15;
        } else {
            score.issues.push('Title tag missing or too long');
        }
        
        // Test meta description
        if (html.includes('name="description"') && html.match(/name="description" content="([^"]+)"/)?.[1]?.length <= 160) {
            score.passed.push('Meta description present and optimal length');
            score.score += 15;
        } else {
            score.issues.push('Meta description missing or too long');
        }
        
        // Test H1 tag
        if (html.includes('<h1>') && html.match(/<h1[^>]*>([^<]+)<\/h1>/)) {
            score.passed.push('H1 tag present');
            score.score += 10;
        } else {
            score.issues.push('H1 tag missing');
        }
        
        // Test canonical URL
        if (html.includes('rel="canonical"')) {
            score.passed.push('Canonical URL present');
            score.score += 10;
        } else {
            score.issues.push('Canonical URL missing');
        }
        
        // Test Open Graph tags
        if (html.includes('property="og:title"') && html.includes('property="og:description"')) {
            score.passed.push('Open Graph tags present');
            score.score += 10;
        } else {
            score.issues.push('Open Graph tags missing');
        }
        
        // Test schema markup
        if (html.includes('application/ld+json')) {
            score.passed.push('Schema markup present');
            score.score += 15;
        } else {
            score.issues.push('Schema markup missing');
        }
        
        // Test alt attributes (basic check)
        const imgTags = html.match(/<img[^>]+>/g) || [];
        const imgsWithAlt = imgTags.filter(img => img.includes('alt=')).length;
        if (imgTags.length === 0 || imgsWithAlt === imgTags.length) {
            score.passed.push('All images have alt attributes');
            score.score += 10;
        } else {
            score.issues.push(`${imgTags.length - imgsWithAlt} images missing alt attributes`);
        }
        
        // Test internal links
        const internalLinks = (html.match(/href="\/[^"]*"/g) || []).length;
        if (internalLinks >= 3) {
            score.passed.push('Adequate internal linking');
            score.score += 15;
        } else {
            score.issues.push('Insufficient internal links');
        }
        
        return score;
    }

    async testPageSpeed(page) {
        // Simulate page speed test (in real implementation, use tools like Lighthouse)
        const score = { score: 85, issues: [], passed: [] };
        
        // Check for common performance issues
        const html = page.html;
        
        if (html.includes('bootstrap.min.css')) {
            score.passed.push('Using minified CSS');
        }
        
        if (html.includes('bootstrap.bundle.min.js')) {
            score.passed.push('Using minified JavaScript');
        }
        
        if (html.includes('loading="lazy"')) {
            score.passed.push('Lazy loading implemented');
        } else {
            score.issues.push('Consider implementing lazy loading for images');
            score.score -= 5;
        }
        
        return score;
    }

    async testMobileResponsiveness(page) {
        const score = { score: 0, issues: [], passed: [] };
        const html = page.html;
        
        // Test viewport meta tag
        if (html.includes('name="viewport"')) {
            score.passed.push('Viewport meta tag present');
            score.score += 30;
        } else {
            score.issues.push('Viewport meta tag missing');
        }
        
        // Test responsive framework
        if (html.includes('bootstrap')) {
            score.passed.push('Responsive framework detected');
            score.score += 40;
        }
        
        // Test responsive classes
        if (html.includes('col-md-') || html.includes('col-lg-')) {
            score.passed.push('Responsive grid classes used');
            score.score += 30;
        } else {
            score.issues.push('No responsive grid classes detected');
        }
        
        return score;
    }

    async testSchemaValidation(page) {
        const score = { score: 0, issues: [], passed: [] };
        const html = page.html;
        
        // Extract schema markup
        const schemaMatch = html.match(/<script type="application\/ld\+json">\s*({[\s\S]*?})\s*<\/script>/);
        
        if (schemaMatch) {
            try {
                const schema = JSON.parse(schemaMatch[1]);
                
                // Validate required fields
                if (schema['@context'] === 'https://schema.org') {
                    score.passed.push('Valid schema context');
                    score.score += 20;
                }
                
                if (schema['@type']) {
                    score.passed.push('Schema type specified');
                    score.score += 20;
                }
                
                if (schema.name) {
                    score.passed.push('Schema name present');
                    score.score += 15;
                }
                
                if (schema.description) {
                    score.passed.push('Schema description present');
                    score.score += 15;
                }
                
                if (schema.provider) {
                    score.passed.push('Schema provider information present');
                    score.score += 15;
                }
                
                if (schema.areaServed) {
                    score.passed.push('Area served information present');
                    score.score += 15;
                }
                
            } catch (error) {
                score.issues.push('Invalid JSON in schema markup');
            }
        } else {
            score.issues.push('No schema markup found');
        }
        
        return score;
    }

    async testInternalLinks(page) {
        const score = { score: 0, issues: [], passed: [] };
        const html = page.html;
        
        // Count internal links
        const internalLinks = (html.match(/href="\/[^"]*"/g) || []).length;
        
        if (internalLinks >= 5) {
            score.passed.push(`Good internal linking (${internalLinks} links)`);
            score.score = 100;
        } else if (internalLinks >= 3) {
            score.passed.push(`Adequate internal linking (${internalLinks} links)`);
            score.score = 75;
        } else if (internalLinks >= 1) {
            score.passed.push(`Basic internal linking (${internalLinks} links)`);
            score.score = 50;
        } else {
            score.issues.push('No internal links found');
            score.score = 0;
        }
        
        // Check for navigation links
        if (html.includes('href="/contatti"') || html.includes('href="/servizi"')) {
            score.passed.push('Navigation links present');
        }
        
        return score;
    }

    async testContentQuality(page) {
        const score = { score: 0, issues: [], passed: [] };
        const html = page.html;
        
        // Remove HTML tags for content analysis
        const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const wordCount = textContent.split(' ').length;
        
        // Test content length
        if (wordCount >= 1500) {
            score.passed.push(`Comprehensive content (${wordCount} words)`);
            score.score += 40;
        } else if (wordCount >= 800) {
            score.passed.push(`Good content length (${wordCount} words)`);
            score.score += 30;
        } else if (wordCount >= 300) {
            score.passed.push(`Adequate content length (${wordCount} words)`);
            score.score += 20;
        } else {
            score.issues.push(`Content too short (${wordCount} words)`);
        }
        
        // Test keyword presence
        const keyword = page.keyword.toLowerCase();
        const keywordCount = (textContent.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
        const keywordDensity = keywordCount / wordCount;
        
        if (keywordDensity >= 0.01 && keywordDensity <= 0.03) {
            score.passed.push(`Good keyword density (${(keywordDensity * 100).toFixed(2)}%)`);
            score.score += 30;
        } else if (keywordDensity > 0) {
            score.passed.push(`Keyword present (${(keywordDensity * 100).toFixed(2)}%)`);
            score.score += 15;
        } else {
            score.issues.push('Target keyword not found in content');
        }
        
        // Test heading structure
        const h2Count = (html.match(/<h2[^>]*>/g) || []).length;
        const h3Count = (html.match(/<h3[^>]*>/g) || []).length;
        
        if (h2Count >= 3 && h3Count >= 2) {
            score.passed.push('Good heading structure');
            score.score += 30;
        } else if (h2Count >= 2) {
            score.passed.push('Basic heading structure');
            score.score += 15;
        } else {
            score.issues.push('Poor heading structure');
        }
        
        return score;
    }

    calculateOverallScore(tests) {
        const weights = {
            seoCompliance: 0.3,
            pageSpeed: 0.15,
            mobileResponsiveness: 0.15,
            schemaValidation: 0.15,
            internalLinks: 0.1,
            contentQuality: 0.15
        };
        
        let totalScore = 0;
        for (const [testName, weight] of Object.entries(weights)) {
            if (tests[testName]) {
                totalScore += tests[testName].score * weight;
            }
        }
        
        return Math.round(totalScore);
    }

    addTestResultToReport(testResult) {
        for (const [testName, result] of Object.entries(testResult.tests)) {
            if (!this.deploymentReport.testResults[testName]) {
                this.deploymentReport.testResults[testName] = [];
            }
            this.deploymentReport.testResults[testName].push({
                filename: testResult.filename,
                score: result.score,
                issues: result.issues,
                passed: result.passed
            });
        }
    }

    async generateDeploymentReport() {
        // Calculate summary statistics
        const avgScore = this.testResults.reduce((sum, test) => sum + test.overallScore, 0) / this.testResults.length;
        const highQualityPages = this.testResults.filter(test => test.overallScore >= 80).length;
        
        this.deploymentReport.summary = {
            averageScore: Math.round(avgScore),
            highQualityPages: highQualityPages,
            qualityRate: Math.round((highQualityPages / this.testResults.length) * 100),
            totalIssues: this.testResults.reduce((sum, test) => {
                return sum + Object.values(test.tests).reduce((testSum, testResult) => testSum + testResult.issues.length, 0);
            }, 0)
        };
        
        this.deploymentReport.deployedPages = this.deployedPages;
        this.deploymentReport.detailedTestResults = this.testResults;
        
        // Save report
        fs.writeFileSync('deployment-report.json', JSON.stringify(this.deploymentReport, null, 2));
        console.log('\n📋 Deployment report saved to deployment-report.json');
        
        // Print summary
        this.printDeploymentSummary();
    }

    printDeploymentSummary() {
        console.log('\n📊 DEPLOYMENT SUMMARY');
        console.log('====================');
        console.log(`Total Pages: ${this.deploymentReport.totalPages}`);
        console.log(`Successful Deployments: ${this.deploymentReport.successfulDeployments}`);
        console.log(`Failed Deployments: ${this.deploymentReport.failedDeployments}`);
        console.log(`Average Quality Score: ${this.deploymentReport.summary.averageScore}/100`);
        console.log(`High Quality Pages: ${this.deploymentReport.summary.highQualityPages}/${this.testResults.length} (${this.deploymentReport.summary.qualityRate}%)`);
        console.log(`Total Issues Found: ${this.deploymentReport.summary.totalIssues}`);
        
        console.log('\n🌿 PAGES BY BRANCH:');
        const pagesByBranch = this.groupPagesByBranch(this.deployedPages.filter(p => p.status === 'success'));
        for (const [branch, pages] of Object.entries(pagesByBranch)) {
            console.log(`  ${branch}: ${pages.length} pages`);
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const agent = new DeployAgent();
    
    // Load generated pages (placeholder)
    const generatedPages = [];
    
    agent.deployPages(generatedPages).catch(console.error);
}

module.exports = DeployAgent;
