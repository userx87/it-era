#!/usr/bin/env node

const puppeteer = require('puppeteer');
const chalk = require('chalk');

class ContentTester {
    constructor() {
        this.baseUrl = 'https://it-era.pages.dev';
        this.sectorPages = [
            {
                name: 'PMI e Startup',
                url: '/pages/settori-pmi-startup.html',
                keywords: ['pmi', 'startup', 'piccole medie imprese', 'innovazione', 'crescita', 'digitalizzazione'],
                expectedContent: ['PMI', 'startup', 'piccole e medie imprese', 'IT-ERA']
            },
            {
                name: 'Studi Medici',
                url: '/pages/settori-studi-medici.html', 
                keywords: ['medici', 'sanitario', 'cliniche', 'ambulatori', 'pazienti', 'cartelle cliniche'],
                expectedContent: ['studi medici', 'sanitario', 'medici', 'IT-ERA']
            },
            {
                name: 'Commercialisti',
                url: '/pages/settori-commercialisti.html',
                keywords: ['commercialisti', 'contabilità', 'fiscale', 'consulenza', 'fatturazione'],
                expectedContent: ['commercialisti', 'contabilità', 'fiscale', 'IT-ERA']
            },
            {
                name: 'Studi Legali',
                url: '/pages/settori-studi-legali.html',
                keywords: ['legali', 'avvocati', 'giuridica', 'tribunale', 'cause', 'consulenza legale'],
                expectedContent: ['studi legali', 'avvocati', 'giuridica', 'IT-ERA']
            }
        ];
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    }

    async testPageContent(sectorInfo) {
        const fullUrl = `${this.baseUrl}${sectorInfo.url}`;
        
        try {
            console.log(chalk.yellow(`\n📄 Testing content for: ${sectorInfo.name}`));
            console.log(chalk.gray(`URL: ${fullUrl}`));

            const response = await this.page.goto(fullUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            if (response.status() !== 200) {
                return {
                    name: sectorInfo.name,
                    url: fullUrl,
                    success: false,
                    status: response.status(),
                    error: `HTTP ${response.status()}`
                };
            }

            // Wait for content to load
            await this.page.waitForTimeout(3000);

            // Extract page content
            const contentAnalysis = await this.analyzePage(sectorInfo);
            
            // Take screenshot for visual verification
            const screenshotPath = `verification-tools/${sectorInfo.name.toLowerCase().replace(/\s/g, '-')}-screenshot.png`;
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(chalk.gray(`📸 Screenshot saved: ${screenshotPath}`));

            return {
                name: sectorInfo.name,
                url: fullUrl,
                success: true,
                status: response.status(),
                ...contentAnalysis
            };

        } catch (error) {
            console.log(chalk.red(`❌ Failed to load ${sectorInfo.name}: ${error.message}`));
            
            return {
                name: sectorInfo.name,
                url: fullUrl,
                success: false,
                error: error.message
            };
        }
    }

    async analyzePage(sectorInfo) {
        try {
            // Basic page structure
            const title = await this.page.title();
            const h1 = await this.page.$eval('h1', el => el.textContent.trim()).catch(() => null);
            const h2s = await this.page.$$eval('h2', els => els.map(el => el.textContent.trim())).catch(() => []);
            
            // Meta description
            const metaDescription = await this.page.$eval('meta[name="description"]', el => el.content).catch(() => null);
            
            // Page content analysis
            const bodyText = await this.page.$eval('body', el => el.textContent).catch(() => '');
            const textLength = bodyText.length;
            const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;
            
            // Keyword analysis
            const keywordMatches = this.analyzeKeywords(bodyText.toLowerCase(), sectorInfo.keywords);
            const contentMatches = this.analyzeExpectedContent(bodyText.toLowerCase(), sectorInfo.expectedContent);
            
            // SEO elements
            const images = await this.page.$$eval('img', imgs => 
                imgs.map(img => ({
                    src: img.src,
                    alt: img.alt || '',
                    hasAlt: !!img.alt
                }))
            ).catch(() => []);
            
            // Links analysis
            const links = await this.page.$$eval('a', links => 
                links.map(link => ({
                    href: link.href,
                    text: link.textContent.trim(),
                    isInternal: link.href.includes('it-era.pages.dev') || link.href.startsWith('/')
                }))
            ).catch(() => []);

            // Check for specific IT-ERA branding
            const hasItEraBranding = bodyText.toLowerCase().includes('it-era') || 
                                   bodyText.toLowerCase().includes('it era');

            // Contact information
            const hasContactInfo = this.checkContactInfo(bodyText);

            // Service information
            const hasServiceInfo = this.checkServiceInfo(bodyText, sectorInfo.name);

            console.log(chalk.blue(`  Title: "${title}"`));
            console.log(chalk.blue(`  H1: "${h1}"`));
            console.log(chalk.blue(`  Word count: ${wordCount}`));
            console.log(chalk.blue(`  Keyword matches: ${keywordMatches.found}/${keywordMatches.total}`));
            console.log(chalk.blue(`  Has IT-ERA branding: ${hasItEraBranding ? 'Yes' : 'No'}`));

            return {
                title,
                h1,
                h2s,
                metaDescription,
                textLength,
                wordCount,
                keywordAnalysis: keywordMatches,
                contentAnalysis: contentMatches,
                images: {
                    total: images.length,
                    withAlt: images.filter(img => img.hasAlt).length,
                    list: images
                },
                links: {
                    total: links.length,
                    internal: links.filter(link => link.isInternal).length,
                    external: links.filter(link => !link.isInternal).length
                },
                seoScore: this.calculateSeoScore({
                    hasTitle: !!title,
                    hasH1: !!h1,
                    hasMetaDescription: !!metaDescription,
                    wordCount,
                    keywordDensity: keywordMatches.found / keywordMatches.total,
                    hasItEraBranding,
                    hasContactInfo,
                    hasServiceInfo
                }),
                hasItEraBranding,
                hasContactInfo,
                hasServiceInfo
            };

        } catch (error) {
            console.log(chalk.red(`Error analyzing page: ${error.message}`));
            return {
                error: error.message,
                title: null,
                h1: null
            };
        }
    }

    analyzeKeywords(text, keywords) {
        const found = keywords.filter(keyword => text.includes(keyword.toLowerCase()));
        
        return {
            total: keywords.length,
            found: found.length,
            matches: found,
            missing: keywords.filter(keyword => !text.includes(keyword.toLowerCase()))
        };
    }

    analyzeExpectedContent(text, expectedContent) {
        const found = expectedContent.filter(content => text.includes(content.toLowerCase()));
        
        return {
            total: expectedContent.length,
            found: found.length,
            matches: found,
            missing: expectedContent.filter(content => !text.includes(content.toLowerCase()))
        };
    }

    checkContactInfo(text) {
        const contactPatterns = [
            /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,  // Phone numbers
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,  // Email
            /contatt/i,
            /telefono/i,
            /email/i,
            /indirizzo/i
        ];

        return contactPatterns.some(pattern => pattern.test(text));
    }

    checkServiceInfo(text, sectorName) {
        const servicePatterns = {
            'PMI e Startup': [/servizi/i, /soluzioni/i, /consulenza/i, /supporto/i],
            'Studi Medici': [/software/i, /gestionale/i, /appuntamenti/i, /pazienti/i],
            'Commercialisti': [/software/i, /contabilità/i, /fatturazione/i, /dichiarazioni/i],
            'Studi Legali': [/gestionale/i, /cause/i, /clienti/i, /documenti/i]
        };

        const patterns = servicePatterns[sectorName] || [];
        return patterns.some(pattern => pattern.test(text));
    }

    calculateSeoScore(factors) {
        let score = 0;
        const weights = {
            hasTitle: 20,
            hasH1: 20,
            hasMetaDescription: 15,
            wordCount: 15, // 1 point per 50 words up to 15 points
            keywordDensity: 15,
            hasItEraBranding: 10,
            hasContactInfo: 5,
            hasServiceInfo: 10
        };

        if (factors.hasTitle) score += weights.hasTitle;
        if (factors.hasH1) score += weights.hasH1;
        if (factors.hasMetaDescription) score += weights.hasMetaDescription;
        
        // Word count scoring (ideal range 300-800 words)
        if (factors.wordCount >= 300) {
            score += Math.min(weights.wordCount, Math.floor(factors.wordCount / 50));
        }
        
        // Keyword density (ideal 0.5-0.8)
        score += factors.keywordDensity * weights.keywordDensity;
        
        if (factors.hasItEraBranding) score += weights.hasItEraBranding;
        if (factors.hasContactInfo) score += weights.hasContactInfo;
        if (factors.hasServiceInfo) score += weights.hasServiceInfo;

        return Math.min(100, Math.round(score));
    }

    async run() {
        try {
            await this.init();
            
            console.log(chalk.blue.bold('📄 Content Verification Tool'));
            console.log(chalk.gray(`Testing content quality for ${this.sectorPages.length} sector pages\n`));

            const results = [];

            for (const sector of this.sectorPages) {
                const result = await this.testPageContent(sector);
                results.push(result);
            }

            // Generate comprehensive report
            this.generateContentReport(results);

        } catch (error) {
            console.error(chalk.red('Fatal error during content testing:'), error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    generateContentReport(results) {
        console.log(chalk.blue.bold('\n📊 CONTENT VERIFICATION REPORT'));
        console.log(chalk.gray('=' * 60));

        const successfulTests = results.filter(r => r.success);
        const failedTests = results.filter(r => !r.success);

        console.log(chalk.blue(`\n📈 Overall Results: ${successfulTests.length}/${results.length} pages accessible`));

        // Successful pages analysis
        if (successfulTests.length > 0) {
            console.log(chalk.green.bold('\n✅ Accessible Pages:'));
            
            successfulTests.forEach(result => {
                console.log(chalk.green(`\n${result.name}:`));
                console.log(chalk.blue(`  📍 URL: ${result.url}`));
                console.log(chalk.blue(`  📄 Title: ${result.title || 'Missing'}`));
                console.log(chalk.blue(`  📝 H1: ${result.h1 || 'Missing'}`));
                console.log(chalk.blue(`  📊 Words: ${result.wordCount || 0}`));
                
                if (result.keywordAnalysis) {
                    const keywordScore = `${result.keywordAnalysis.found}/${result.keywordAnalysis.total}`;
                    console.log(chalk.blue(`  🔍 Keywords: ${keywordScore} matched`));
                    
                    if (result.keywordAnalysis.missing.length > 0) {
                        console.log(chalk.yellow(`    Missing: ${result.keywordAnalysis.missing.join(', ')}`));
                    }
                }

                if (result.seoScore !== undefined) {
                    const scoreColor = result.seoScore >= 80 ? chalk.green : 
                                     result.seoScore >= 60 ? chalk.yellow : chalk.red;
                    console.log(scoreColor(`  📊 SEO Score: ${result.seoScore}/100`));
                }

                const branding = result.hasItEraBranding ? chalk.green('Yes') : chalk.red('No');
                console.log(chalk.blue(`  🏢 IT-ERA Branding: ${branding}`));

                const contact = result.hasContactInfo ? chalk.green('Yes') : chalk.yellow('No');
                console.log(chalk.blue(`  📞 Contact Info: ${contact}`));
            });
        }

        // Failed pages
        if (failedTests.length > 0) {
            console.log(chalk.red.bold('\n❌ Inaccessible Pages:'));
            
            failedTests.forEach(result => {
                console.log(chalk.red(`\n${result.name}:`));
                console.log(chalk.red(`  URL: ${result.url}`));
                console.log(chalk.red(`  Error: ${result.error || `HTTP ${result.status}`}`));
            });
        }

        // Summary recommendations
        console.log(chalk.blue.bold('\n💡 RECOMMENDATIONS:'));
        
        if (failedTests.length > 0) {
            console.log(chalk.red('• Fix inaccessible pages - check URL patterns and deployment'));
        }

        const lowScoPages = successfulTests.filter(r => r.seoScore < 70);
        if (lowScoPages.length > 0) {
            console.log(chalk.yellow('• Improve SEO for pages with scores below 70'));
        }

        const noBrandingPages = successfulTests.filter(r => !r.hasItEraBranding);
        if (noBrandingPages.length > 0) {
            console.log(chalk.yellow('• Add IT-ERA branding to all pages'));
        }

        const noContactPages = successfulTests.filter(r => !r.hasContactInfo);
        if (noContactPages.length > 0) {
            console.log(chalk.yellow('• Add contact information to pages missing it'));
        }

        // Final verdict
        if (successfulTests.length === results.length && 
            successfulTests.every(r => r.seoScore >= 70)) {
            console.log(chalk.green.bold('\n🎉 CONTENT VERIFICATION PASSED!'));
        } else {
            console.log(chalk.yellow.bold('\n⚠️  CONTENT ISSUES DETECTED - Review recommendations above'));
        }
    }
}

// Run if called directly
if (require.main === module) {
    const tester = new ContentTester();
    tester.run().catch(console.error);
}

module.exports = ContentTester;