#!/usr/bin/env node

/**
 * IT-ERA Comprehensive Sitemap Analyzer
 * Analizza tutte le 568 pagine per: validità link, form funzionanti, UX design, menu, conversioni
 */

const { execSync } = require('child_process');
const fs = require('fs');

class ComprehensiveSitemapAnalyzer {
    constructor() {
        this.results = [];
        this.baseUrl = 'https://it-era.it';
        this.totalPages = 0;
        this.batchSize = 10; // Analizza 10 pagine alla volta
        
        // Criteri di analisi completi
        this.analysisConfig = {
            linkValidity: {
                weight: 25,
                criteria: ['200 status', 'content length > 1000', 'no 404 errors']
            },
            formFunctionality: {
                weight: 25,
                criteria: ['form present', 'data-resend integration', 'validation', 'submit button']
            },
            uxDesign: {
                weight: 20,
                criteria: ['responsive design', 'professional layout', 'brand consistency', 'loading speed']
            },
            menuNavigation: {
                weight: 15,
                criteria: ['navigation menu', 'breadcrumbs', 'internal links', 'mobile menu']
            },
            conversionOptimization: {
                weight: 15,
                criteria: ['CTA buttons', 'contact info', 'emergency contact', 'lead capture']
            }
        };
        
        // Pattern per identificare tipi di pagina
        this.pageTypes = {
            homepage: { pattern: /^https:\/\/it-era\.it\/?$/, priority: 'CRITICAL' },
            contact: { pattern: /\/contatti/, priority: 'CRITICAL' },
            emergency: { pattern: /computer-non-si-accende|schermo-nero|hard-disk-non-funziona/, priority: 'CRITICAL' },
            serviceIT: { pattern: /\/servizi-it\//, priority: 'HIGH' },
            landing: { pattern: /\/landing\//, priority: 'HIGH' },
            sector: { pattern: /\/settori\//, priority: 'HIGH' },
            service: { pattern: /\/servizi\//, priority: 'MEDIUM' },
            blog: { pattern: /\/blog\//, priority: 'MEDIUM' },
            admin: { pattern: /\/admin\/|\/dashboard\//, priority: 'LOW' },
            test: { pattern: /\/test-|development/, priority: 'LOW' }
        };
    }
    
    // Ottieni tutte le pagine dalla sitemap
    async getAllPagesFromSitemap() {
        console.log('🗺️ Fetching all pages from sitemap...');
        
        try {
            const sitemapContent = execSync('curl -s https://it-era.it/sitemap.xml', { encoding: 'utf8' });
            const urlMatches = sitemapContent.match(/https:\/\/it-era\.it[^<]*/g);
            
            if (urlMatches) {
                this.totalPages = urlMatches.length;
                console.log(`  📄 Found ${this.totalPages} total pages in sitemap`);
                return urlMatches;
            }
            
            throw new Error('No URLs found in sitemap');
            
        } catch (error) {
            console.error('❌ Error fetching sitemap:', error.message);
            return [];
        }
    }
    
    // Determina tipo e priorità pagina
    getPageTypeAndPriority(url) {
        for (const [type, config] of Object.entries(this.pageTypes)) {
            if (config.pattern.test(url)) {
                return { type, priority: config.priority };
            }
        }
        return { type: 'other', priority: 'MEDIUM' };
    }
    
    // Analisi completa di una singola pagina
    async analyzePageComprehensive(url) {
        const { type, priority } = this.getPageTypeAndPriority(url);
        
        console.log(`🔍 Analyzing: ${url} [${type.toUpperCase()}]`);
        
        try {
            // Fetch page content con timeout
            const content = execSync(`curl -s -m 10 "${url}"`, { encoding: 'utf8' });
            
            if (!content || content.includes('404') || content.includes('Not Found') || content.length < 500) {
                return {
                    url,
                    type,
                    priority,
                    status: 'FAILED',
                    scores: { linkValidity: 0, formFunctionality: 0, uxDesign: 0, menuNavigation: 0, conversionOptimization: 0, overall: 0 },
                    issues: ['Page not accessible, 404, or content too short'],
                    recommendations: ['Fix page accessibility', 'Ensure proper content length']
                };
            }
            
            // Analisi dettagliata
            const linkValidityScore = this.analyzeLinkValidity(content, url);
            const formFunctionalityScore = this.analyzeFormFunctionality(content, url);
            const uxDesignScore = this.analyzeUXDesign(content, url);
            const menuNavigationScore = this.analyzeMenuNavigation(content, url);
            const conversionOptimizationScore = this.analyzeConversionOptimization(content, url);
            
            // Calcola score complessivo pesato
            const overallScore = Math.round(
                (linkValidityScore * this.analysisConfig.linkValidity.weight +
                 formFunctionalityScore * this.analysisConfig.formFunctionality.weight +
                 uxDesignScore * this.analysisConfig.uxDesign.weight +
                 menuNavigationScore * this.analysisConfig.menuNavigation.weight +
                 conversionOptimizationScore * this.analysisConfig.conversionOptimization.weight) / 100
            );
            
            const status = overallScore >= 90 ? 'EXCELLENT' : 
                          overallScore >= 80 ? 'GOOD' : 
                          overallScore >= 70 ? 'WARNING' : 'FAILED';
            
            const issues = this.identifyIssues(content, url, {
                linkValidity: linkValidityScore,
                formFunctionality: formFunctionalityScore,
                uxDesign: uxDesignScore,
                menuNavigation: menuNavigationScore,
                conversionOptimization: conversionOptimizationScore
            });
            
            const recommendations = this.generateRecommendations(issues, type);
            
            return {
                url,
                type,
                priority,
                status,
                scores: {
                    linkValidity: linkValidityScore,
                    formFunctionality: formFunctionalityScore,
                    uxDesign: uxDesignScore,
                    menuNavigation: menuNavigationScore,
                    conversionOptimization: conversionOptimizationScore,
                    overall: overallScore
                },
                issues,
                recommendations,
                contentLength: content.length,
                hasForm: content.includes('<form'),
                hasResend: content.includes('data-resend'),
                hasEmergencyContact: content.includes('039 888 2041'),
                hasMenu: content.includes('nav') || content.includes('menu'),
                hasCTA: content.includes('btn') || content.includes('button')
            };
            
        } catch (error) {
            return {
                url,
                type,
                priority,
                status: 'ERROR',
                scores: { linkValidity: 0, formFunctionality: 0, uxDesign: 0, menuNavigation: 0, conversionOptimization: 0, overall: 0 },
                issues: [`Error analyzing page: ${error.message}`],
                recommendations: ['Fix page accessibility', 'Check server response']
            };
        }
    }
    
    // Analisi validità link
    analyzeLinkValidity(content, url) {
        let score = 0;
        
        // Check basic HTML structure (25 points)
        if (content.includes('<!DOCTYPE html>') && content.includes('<html') && content.includes('</html>')) {
            score += 25;
        }
        
        // Check content length (25 points)
        if (content.length > 5000) {
            score += 25;
        } else if (content.length > 2000) {
            score += 15;
        } else if (content.length > 1000) {
            score += 10;
        }
        
        // Check no error indicators (25 points)
        if (!content.includes('404') && !content.includes('Not Found') && !content.includes('Error')) {
            score += 25;
        }
        
        // Check proper meta tags (25 points)
        if (content.includes('<title>') && content.includes('meta name="description"')) {
            score += 25;
        }
        
        return Math.min(score, 100);
    }
    
    // Analisi funzionalità form
    analyzeFormFunctionality(content, url) {
        let score = 0;
        
        // Check form presence (30 points)
        if (content.includes('<form')) {
            score += 30;
        }
        
        // Check Resend integration (30 points)
        if (content.includes('data-resend="true"')) {
            score += 30;
        } else if (content.includes('data-resend')) {
            score += 15;
        }
        
        // Check form validation (20 points)
        if (content.includes('required') && content.includes('validation')) {
            score += 20;
        } else if (content.includes('required')) {
            score += 10;
        }
        
        // Check submit functionality (20 points)
        if (content.includes('type="submit"') || content.includes('button')) {
            score += 20;
        }
        
        return Math.min(score, 100);
    }
    
    // Analisi UX Design
    analyzeUXDesign(content, url) {
        let score = 0;
        
        // Check responsive design (30 points)
        if (content.includes('viewport') && content.includes('responsive')) {
            score += 30;
        } else if (content.includes('viewport')) {
            score += 20;
        }
        
        // Check professional styling (25 points)
        if (content.includes('tailwind') || content.includes('bootstrap') || content.includes('.css')) {
            score += 25;
        }
        
        // Check brand consistency (25 points)
        if (content.includes('IT-ERA') && content.includes('logo')) {
            score += 25;
        }
        
        // Check loading optimization (20 points)
        if (content.includes('async') || content.includes('defer') || content.includes('cdn')) {
            score += 20;
        }
        
        return Math.min(score, 100);
    }
    
    // Analisi navigazione menu
    analyzeMenuNavigation(content, url) {
        let score = 0;
        
        // Check navigation menu (40 points)
        if (content.includes('<nav') || content.includes('navigation')) {
            score += 40;
        } else if (content.includes('menu')) {
            score += 25;
        }
        
        // Check internal links (30 points)
        const internalLinks = (content.match(/href="\/[^"]*"/g) || []).length;
        if (internalLinks > 10) {
            score += 30;
        } else if (internalLinks > 5) {
            score += 20;
        } else if (internalLinks > 0) {
            score += 10;
        }
        
        // Check mobile menu (30 points)
        if (content.includes('mobile') && (content.includes('menu') || content.includes('hamburger'))) {
            score += 30;
        }
        
        return Math.min(score, 100);
    }
    
    // Analisi ottimizzazione conversioni
    analyzeConversionOptimization(content, url) {
        let score = 0;
        
        // Check CTA buttons (30 points)
        const ctaCount = (content.match(/btn|button|CTA/gi) || []).length;
        if (ctaCount > 5) {
            score += 30;
        } else if (ctaCount > 2) {
            score += 20;
        } else if (ctaCount > 0) {
            score += 10;
        }
        
        // Check contact information (25 points)
        if (content.includes('039 888 2041') && content.includes('info@')) {
            score += 25;
        } else if (content.includes('039 888 2041')) {
            score += 15;
        }
        
        // Check emergency contact prominence (25 points)
        if (content.includes('emergenza') || content.includes('emergency')) {
            score += 25;
        }
        
        // Check lead capture elements (20 points)
        if (content.includes('form') && content.includes('lead')) {
            score += 20;
        } else if (content.includes('form')) {
            score += 10;
        }
        
        return Math.min(score, 100);
    }
    
    // Identifica issues specifici
    identifyIssues(content, url, scores) {
        const issues = [];
        
        if (scores.linkValidity < 70) issues.push('Link validity issues');
        if (scores.formFunctionality < 70) issues.push('Form functionality problems');
        if (scores.uxDesign < 70) issues.push('UX design improvements needed');
        if (scores.menuNavigation < 70) issues.push('Navigation menu issues');
        if (scores.conversionOptimization < 70) issues.push('Conversion optimization needed');
        
        if (!content.includes('039 888 2041')) issues.push('Missing emergency contact');
        if (!content.includes('<form')) issues.push('No contact form present');
        if (!content.includes('data-resend')) issues.push('Missing Resend integration');
        if (content.length < 2000) issues.push('Content too short');
        
        return issues.length > 0 ? issues : ['No critical issues found'];
    }
    
    // Genera raccomandazioni
    generateRecommendations(issues, pageType) {
        const recommendations = [];
        
        issues.forEach(issue => {
            switch (issue) {
                case 'Link validity issues':
                    recommendations.push('Fix broken links and ensure proper HTML structure');
                    break;
                case 'Form functionality problems':
                    recommendations.push('Implement working contact form with Resend integration');
                    break;
                case 'UX design improvements needed':
                    recommendations.push('Improve responsive design and visual consistency');
                    break;
                case 'Navigation menu issues':
                    recommendations.push('Add proper navigation menu and internal linking');
                    break;
                case 'Conversion optimization needed':
                    recommendations.push('Add more CTA buttons and optimize for conversions');
                    break;
                case 'Missing emergency contact':
                    recommendations.push('Add prominent 039 888 2041 emergency contact');
                    break;
                case 'No contact form present':
                    recommendations.push('Add contact form for lead capture');
                    break;
                case 'Missing Resend integration':
                    recommendations.push('Implement data-resend="true" integration');
                    break;
            }
        });
        
        // Raccomandazioni specifiche per tipo pagina
        if (pageType === 'emergency') {
            recommendations.push('Ensure emergency banner is prominent');
            recommendations.push('Add urgent CTA styling');
        } else if (pageType === 'serviceIT') {
            recommendations.push('Add service-specific pricing information');
            recommendations.push('Include FAQ section');
        }
        
        return recommendations.length > 0 ? recommendations : ['Page is well optimized'];
    }
    
    // Analizza batch di pagine
    async analyzeBatch(urls, batchNumber, totalBatches) {
        console.log(`\n🔄 Analyzing batch ${batchNumber}/${totalBatches} (${urls.length} pages)`);
        
        const results = [];
        
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const result = await this.analyzePageComprehensive(url);
            results.push(result);
            
            // Progress indicator
            const status = result.status === 'EXCELLENT' ? '🟢' : 
                          result.status === 'GOOD' ? '🟡' : 
                          result.status === 'WARNING' ? '🟠' : '🔴';
            console.log(`  ${status} [${i + 1}/${urls.length}] ${result.overall || 0}% - ${result.type}`);
            
            // Small delay to avoid overwhelming server
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        return results;
    }
    
    // Genera report completo
    generateComprehensiveReport(allResults) {
        const stats = {
            total: allResults.length,
            excellent: allResults.filter(r => r.status === 'EXCELLENT').length,
            good: allResults.filter(r => r.status === 'GOOD').length,
            warning: allResults.filter(r => r.status === 'WARNING').length,
            failed: allResults.filter(r => r.status === 'FAILED').length,
            error: allResults.filter(r => r.status === 'ERROR').length
        };
        
        const avgScores = {
            linkValidity: Math.round(allResults.reduce((sum, r) => sum + r.scores.linkValidity, 0) / allResults.length),
            formFunctionality: Math.round(allResults.reduce((sum, r) => sum + r.scores.formFunctionality, 0) / allResults.length),
            uxDesign: Math.round(allResults.reduce((sum, r) => sum + r.scores.uxDesign, 0) / allResults.length),
            menuNavigation: Math.round(allResults.reduce((sum, r) => sum + r.scores.menuNavigation, 0) / allResults.length),
            conversionOptimization: Math.round(allResults.reduce((sum, r) => sum + r.scores.conversionOptimization, 0) / allResults.length),
            overall: Math.round(allResults.reduce((sum, r) => sum + r.scores.overall, 0) / allResults.length)
        };
        
        // Salva report dettagliato
        const report = {
            timestamp: new Date().toISOString(),
            summary: stats,
            averageScores: avgScores,
            results: allResults
        };
        
        fs.writeFileSync('comprehensive-sitemap-analysis.json', JSON.stringify(report, null, 2));
        
        // Console summary
        console.log('\n📊 COMPREHENSIVE SITEMAP ANALYSIS REPORT');
        console.log('==========================================');
        console.log(`Total Pages Analyzed: ${stats.total}`);
        console.log(`🟢 Excellent: ${stats.excellent} (${Math.round((stats.excellent/stats.total)*100)}%)`);
        console.log(`🟡 Good: ${stats.good} (${Math.round((stats.good/stats.total)*100)}%)`);
        console.log(`🟠 Warning: ${stats.warning} (${Math.round((stats.warning/stats.total)*100)}%)`);
        console.log(`🔴 Failed: ${stats.failed} (${Math.round((stats.failed/stats.total)*100)}%)`);
        console.log(`❌ Error: ${stats.error} (${Math.round((stats.error/stats.total)*100)}%)`);
        
        console.log(`\n📈 Average Scores:`);
        console.log(`Link Validity: ${avgScores.linkValidity}%`);
        console.log(`Form Functionality: ${avgScores.formFunctionality}%`);
        console.log(`UX Design: ${avgScores.uxDesign}%`);
        console.log(`Menu Navigation: ${avgScores.menuNavigation}%`);
        console.log(`Conversion Optimization: ${avgScores.conversionOptimization}%`);
        console.log(`Overall Quality: ${avgScores.overall}%`);
        
        return report;
    }
    
    // Esegui analisi completa
    async runComprehensiveAnalysis() {
        console.log('🚀 Starting Comprehensive Sitemap Analysis...\n');
        
        // Ottieni tutte le pagine
        const allPages = await this.getAllPagesFromSitemap();
        
        if (allPages.length === 0) {
            console.log('❌ No pages found to analyze');
            return;
        }
        
        // Analizza in batch
        const totalBatches = Math.ceil(allPages.length / this.batchSize);
        const allResults = [];
        
        for (let i = 0; i < totalBatches; i++) {
            const startIndex = i * this.batchSize;
            const batch = allPages.slice(startIndex, startIndex + this.batchSize);
            
            const batchResults = await this.analyzeBatch(batch, i + 1, totalBatches);
            allResults.push(...batchResults);
        }
        
        // Genera report finale
        const report = this.generateComprehensiveReport(allResults);
        
        console.log('\n🎉 Comprehensive analysis completed!');
        console.log('💾 Detailed report saved to: comprehensive-sitemap-analysis.json');
        
        return report;
    }
}

// Esegui se chiamato direttamente
if (require.main === module) {
    const analyzer = new ComprehensiveSitemapAnalyzer();
    analyzer.runComprehensiveAnalysis()
        .then(report => {
            console.log('\n✅ Analysis completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Analysis failed:', error);
            process.exit(1);
        });
}

module.exports = ComprehensiveSitemapAnalyzer;
