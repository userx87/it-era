#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');

class SimpleContentChecker {
    constructor() {
        this.baseUrl = 'https://it-era.pages.dev';
        this.sectorPages = [
            {
                name: 'PMI e Startup',
                expectedUrls: [
                    '/pages/settori-pmi-startup.html',
                    '/pages/servizi-pmi-startup.html',
                    '/settori-pmi-startup.html',
                    '/pmi-startup.html'
                ],
                keywords: ['pmi', 'startup', 'piccole medie imprese', 'IT-ERA']
            },
            {
                name: 'Studi Medici',
                expectedUrls: [
                    '/pages/settori-studi-medici.html',
                    '/pages/servizi-studi-medici.html',
                    '/settori-studi-medici.html',
                    '/studi-medici.html'
                ],
                keywords: ['studi medici', 'sanitario', 'medici', 'IT-ERA']
            },
            {
                name: 'Commercialisti',
                expectedUrls: [
                    '/pages/settori-commercialisti.html',
                    '/pages/servizi-commercialisti.html',
                    '/settori-commercialisti.html',
                    '/commercialisti.html'
                ],
                keywords: ['commercialisti', 'contabilità', 'fiscale', 'IT-ERA']
            },
            {
                name: 'Studi Legali',
                expectedUrls: [
                    '/pages/settori-studi-legali.html',
                    '/pages/servizi-studi-legali.html',
                    '/settori-studi-legali.html',
                    '/studi-legali.html'
                ],
                keywords: ['studi legali', 'avvocati', 'giuridica', 'IT-ERA']
            }
        ];
    }

    async checkPageContent(url) {
        try {
            const response = await axios.get(`${this.baseUrl}${url}`, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (response.status !== 200) {
                return { accessible: false, status: response.status };
            }

            const html = response.data;
            
            // Extract basic content information
            const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : null;

            const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
            const h1 = h1Match ? h1Match[1].replace(/<[^>]*>/g, '').trim() : null;

            const metaDescMatch = html.match(/<meta[^>]*name=['""]description['""][^>]*content=['""]([^'""]*)['""][^>]*>/i);
            const metaDescription = metaDescMatch ? metaDescMatch[1] : null;

            // Get plain text content (rough approximation)
            const plainText = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();

            const wordCount = plainText.split(' ').filter(word => word.length > 2).length;

            return {
                accessible: true,
                status: response.status,
                title,
                h1,
                metaDescription,
                wordCount,
                contentLength: plainText.length,
                plainText: plainText.substring(0, 500) + '...', // First 500 chars for analysis
                fullText: plainText // For keyword analysis
            };

        } catch (error) {
            return {
                accessible: false,
                error: error.message,
                status: error.response?.status || 'ERROR'
            };
        }
    }

    analyzeKeywords(text, keywords) {
        const found = [];
        const missing = [];

        keywords.forEach(keyword => {
            if (text.toLowerCase().includes(keyword.toLowerCase())) {
                found.push(keyword);
            } else {
                missing.push(keyword);
            }
        });

        return { found, missing, score: found.length / keywords.length };
    }

    async checkAllSectors() {
        console.log(chalk.blue.bold('🔍 Simple Content Checker for IT-ERA Sector Pages'));
        console.log(chalk.gray(`Checking content at: ${this.baseUrl}\n`));

        const results = [];

        for (const sector of this.sectorPages) {
            console.log(chalk.yellow.bold(`\n📋 Checking: ${sector.name}`));
            console.log(chalk.gray('─'.repeat(50)));

            const sectorResult = {
                name: sector.name,
                urls: [],
                bestUrl: null,
                accessible: false
            };

            // Check each possible URL for this sector
            for (const url of sector.expectedUrls) {
                console.log(chalk.gray(`Testing: ${url}`));
                
                const result = await this.checkPageContent(url);
                result.url = url;

                if (result.accessible) {
                    console.log(chalk.green(`✓ Accessible (${result.status})`));
                    console.log(chalk.blue(`  Title: ${result.title || 'No title'}`));
                    console.log(chalk.blue(`  H1: ${result.h1 || 'No H1'}`));
                    console.log(chalk.blue(`  Words: ${result.wordCount}`));

                    // Keyword analysis
                    const keywordAnalysis = this.analyzeKeywords(result.fullText, sector.keywords);
                    console.log(chalk.blue(`  Keywords: ${keywordAnalysis.found.length}/${sector.keywords.length} (${Math.round(keywordAnalysis.score * 100)}%)`));
                    
                    if (keywordAnalysis.found.length > 0) {
                        console.log(chalk.green(`    Found: ${keywordAnalysis.found.join(', ')}`));
                    }
                    if (keywordAnalysis.missing.length > 0) {
                        console.log(chalk.yellow(`    Missing: ${keywordAnalysis.missing.join(', ')}`));
                    }

                    result.keywordAnalysis = keywordAnalysis;
                    sectorResult.accessible = true;

                    // Mark as best URL if it's the first accessible or has better keyword score
                    if (!sectorResult.bestUrl || keywordAnalysis.score > sectorResult.bestUrl.keywordAnalysis.score) {
                        sectorResult.bestUrl = result;
                    }
                } else {
                    console.log(chalk.red(`✗ ${result.status} - ${result.error || 'Not accessible'}`));
                }

                sectorResult.urls.push(result);
            }

            results.push(sectorResult);
        }

        this.generateReport(results);
        return results;
    }

    generateReport(results) {
        console.log(chalk.blue.bold('\n' + '═'.repeat(80)));
        console.log(chalk.blue.bold('📊 CONTENT VERIFICATION REPORT'));
        console.log(chalk.blue.bold('═'.repeat(80)));

        const accessibleSectors = results.filter(r => r.accessible);
        const inaccessibleSectors = results.filter(r => !r.accessible);

        console.log(chalk.blue(`\nOverall Status: ${accessibleSectors.length}/${results.length} sectors have accessible pages\n`));

        // Accessible sectors summary
        if (accessibleSectors.length > 0) {
            console.log(chalk.green.bold('✅ ACCESSIBLE SECTORS:'));
            
            accessibleSectors.forEach(sector => {
                const best = sector.bestUrl;
                console.log(chalk.green(`\n${sector.name}:`));
                console.log(chalk.blue(`  🔗 Best URL: ${best.url}`));
                console.log(chalk.blue(`  📄 Title: "${best.title}"`));
                console.log(chalk.blue(`  📝 H1: "${best.h1}"`));
                console.log(chalk.blue(`  📊 Content: ${best.wordCount} words, ${Math.round(best.contentLength/1000)}KB`));
                
                const keywordScore = best.keywordAnalysis.score * 100;
                const scoreColor = keywordScore >= 75 ? chalk.green : keywordScore >= 50 ? chalk.yellow : chalk.red;
                console.log(scoreColor(`  🎯 Keyword Score: ${Math.round(keywordScore)}%`));

                // Show all accessible URLs for this sector
                const accessibleUrls = sector.urls.filter(u => u.accessible);
                if (accessibleUrls.length > 1) {
                    console.log(chalk.cyan(`  📋 All accessible URLs (${accessibleUrls.length}):`));
                    accessibleUrls.forEach(u => {
                        const marker = u === best ? '⭐' : '  ';
                        console.log(chalk.cyan(`    ${marker} ${u.url}`));
                    });
                }
            });
        }

        // Inaccessible sectors
        if (inaccessibleSectors.length > 0) {
            console.log(chalk.red.bold('\n❌ INACCESSIBLE SECTORS:'));
            
            inaccessibleSectors.forEach(sector => {
                console.log(chalk.red(`\n${sector.name}:`));
                console.log(chalk.red('  No accessible URLs found'));
                sector.urls.forEach(u => {
                    console.log(chalk.red(`    ✗ ${u.url} - ${u.status}`));
                });
            });
        }

        // URL Pattern Analysis
        console.log(chalk.blue.bold('\n🔍 URL PATTERN ANALYSIS:'));
        
        const urlPatterns = {
            '/pages/settori-*': 0,
            '/pages/servizi-*': 0,
            '/settori-*': 0,
            '/*': 0
        };

        accessibleSectors.forEach(sector => {
            const bestUrl = sector.bestUrl.url;
            if (bestUrl.startsWith('/pages/settori-')) urlPatterns['/pages/settori-*']++;
            else if (bestUrl.startsWith('/pages/servizi-')) urlPatterns['/pages/servizi-*']++;
            else if (bestUrl.startsWith('/settori-')) urlPatterns['/settori-*']++;
            else urlPatterns['/*']++;
        });

        Object.entries(urlPatterns).forEach(([pattern, count]) => {
            if (count > 0) {
                console.log(chalk.blue(`  ${pattern}: ${count} sectors`));
            }
        });

        // Recommendations
        console.log(chalk.blue.bold('\n💡 RECOMMENDATIONS:'));

        if (inaccessibleSectors.length > 0) {
            console.log(chalk.red(`• Fix ${inaccessibleSectors.length} inaccessible sector pages`));
        }

        const lowKeywordScores = accessibleSectors.filter(s => s.bestUrl.keywordAnalysis.score < 0.5);
        if (lowKeywordScores.length > 0) {
            console.log(chalk.yellow(`• Improve keyword relevance for ${lowKeywordScores.length} sectors`));
        }

        const multiplePatterns = new Set(accessibleSectors.map(s => {
            const url = s.bestUrl.url;
            if (url.startsWith('/pages/settori-')) return '/pages/settori-*';
            if (url.startsWith('/pages/servizi-')) return '/pages/servizi-*';
            if (url.startsWith('/settori-')) return '/settori-*';
            return '/*';
        }));

        if (multiplePatterns.size > 1) {
            console.log(chalk.yellow('• Standardize URL patterns for consistency'));
        }

        // Final verdict
        if (accessibleSectors.length === results.length) {
            const avgKeywordScore = accessibleSectors.reduce((sum, s) => sum + s.bestUrl.keywordAnalysis.score, 0) / accessibleSectors.length;
            if (avgKeywordScore >= 0.75) {
                console.log(chalk.green.bold('\n🎉 EXCELLENT! All sectors are accessible with good content quality.'));
            } else {
                console.log(chalk.yellow.bold('\n✅ GOOD! All sectors are accessible but content could be improved.'));
            }
        } else if (accessibleSectors.length >= results.length * 0.75) {
            console.log(chalk.yellow.bold('\n⚠️ PARTIAL SUCCESS - Most sectors are accessible.'));
        } else {
            console.log(chalk.red.bold('\n❌ DEPLOYMENT ISSUES - Many sectors are inaccessible.'));
        }

        console.log(chalk.blue.bold('\n═'.repeat(80)));
    }

    async run() {
        try {
            const results = await this.checkAllSectors();
            return results;
        } catch (error) {
            console.error(chalk.red('Fatal error during content checking:'), error);
            throw error;
        }
    }
}

// Run if called directly
if (require.main === module) {
    const checker = new SimpleContentChecker();
    checker.run().catch(console.error);
}

module.exports = SimpleContentChecker;