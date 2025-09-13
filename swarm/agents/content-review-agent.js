/**
 * AGENT 1: CONTENT REVIEW AGENT
 * Analyzes all keyword pages for content quality, SEO, and pricing issues
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

class ContentReviewAgent {
    constructor() {
        this.name = 'Content Review Agent';
        this.issues = {
            SEO_ISSUES: 'seo_issues',
            CONTENT_QUALITY: 'content_quality',
            PRICING_ISSUES: 'pricing_issues',
            SPARSE_CONTENT: 'sparse_content',
            GRAMMAR_ISSUES: 'grammar_issues'
        };
    }
    
    async analyze(pages) {
        console.log(`📊 ${this.name}: Analyzing ${pages.length} pages...`);
        
        const results = {
            agent: this.name,
            timestamp: new Date().toISOString(),
            pagesAnalyzed: pages.length,
            issues: {},
            recommendations: {},
            summary: {}
        };
        
        for (const page of pages) {
            try {
                const pageAnalysis = await this.analyzePage(page);
                results.issues[page.filename] = pageAnalysis.issues;
                results.recommendations[page.filename] = pageAnalysis.recommendations;
                
            } catch (error) {
                console.error(`❌ Error analyzing ${page.filename}:`, error.message);
                results.issues[page.filename] = [{
                    type: 'ANALYSIS_ERROR',
                    severity: 'high',
                    message: `Failed to analyze page: ${error.message}`
                }];
            }
        }
        
        results.summary = this.generateSummary(results.issues);
        console.log(`✅ ${this.name}: Analysis complete. Found ${results.summary.totalIssues} issues.`);
        
        return results;
    }
    
    async analyzePage(page) {
        const content = fs.readFileSync(page.path, 'utf8');
        const $ = cheerio.load(content);
        
        const analysis = {
            issues: [],
            recommendations: [],
            metadata: {
                filename: page.filename,
                category: page.category,
                wordCount: this.getWordCount(content),
                hasForm: $('form[data-resend="true"]').length > 0
            }
        };
        
        // SEO Analysis
        this.analyzeSEO($, analysis);
        
        // Content Quality Analysis
        this.analyzeContentQuality($, analysis);
        
        // Pricing Issues Analysis
        this.analyzePricingIssues($, analysis);
        
        // Sparse Content Detection
        this.analyzeSparseContent($, analysis);
        
        // Grammar and Professional Tone
        this.analyzeGrammarAndTone($, analysis);
        
        return analysis;
    }
    
    analyzeSEO($, analysis) {
        const title = $('title').text();
        const metaDescription = $('meta[name="description"]').attr('content');
        const h1 = $('h1').first().text();
        const h2Count = $('h2').length;
        
        // Title issues
        if (!title || title.length < 30) {
            analysis.issues.push({
                type: this.issues.SEO_ISSUES,
                severity: 'high',
                element: 'title',
                message: 'Title tag is missing or too short (< 30 characters)',
                current: title || 'MISSING',
                recommendation: 'Add descriptive title 50-60 characters long'
            });
        } else if (title.length > 60) {
            analysis.issues.push({
                type: this.issues.SEO_ISSUES,
                severity: 'medium',
                element: 'title',
                message: 'Title tag is too long (> 60 characters)',
                current: title,
                recommendation: 'Shorten title to 50-60 characters'
            });
        }
        
        // Meta description issues
        if (!metaDescription || metaDescription.length < 120) {
            analysis.issues.push({
                type: this.issues.SEO_ISSUES,
                severity: 'high',
                element: 'meta_description',
                message: 'Meta description is missing or too short (< 120 characters)',
                current: metaDescription || 'MISSING',
                recommendation: 'Add compelling meta description 150-160 characters long'
            });
        }
        
        // H1 issues
        if (!h1) {
            analysis.issues.push({
                type: this.issues.SEO_ISSUES,
                severity: 'high',
                element: 'h1',
                message: 'H1 tag is missing',
                recommendation: 'Add descriptive H1 tag with target keywords'
            });
        }
        
        // H2 structure
        if (h2Count < 3) {
            analysis.issues.push({
                type: this.issues.SEO_ISSUES,
                severity: 'medium',
                element: 'h2_structure',
                message: `Only ${h2Count} H2 tags found. Need better content structure.`,
                recommendation: 'Add more H2 sections for better content organization'
            });
        }
    }
    
    analyzeContentQuality($, analysis) {
        const mainContent = $('main').text() || $('body').text();
        const wordCount = this.getWordCount(mainContent);
        
        // Word count analysis
        if (wordCount < 300) {
            analysis.issues.push({
                type: this.issues.CONTENT_QUALITY,
                severity: 'high',
                element: 'word_count',
                message: `Content is too short: ${wordCount} words`,
                recommendation: 'Expand content to at least 500-800 words'
            });
        }
        
        // Check for placeholder content
        const placeholders = ['{{', '}}', 'Lorem ipsum', 'placeholder'];
        placeholders.forEach(placeholder => {
            if (mainContent.includes(placeholder)) {
                analysis.issues.push({
                    type: this.issues.CONTENT_QUALITY,
                    severity: 'high',
                    element: 'placeholder_content',
                    message: `Found placeholder content: ${placeholder}`,
                    recommendation: 'Replace all placeholder content with real content'
                });
            }
        });
        
        // Check for professional tone indicators
        const unprofessionalWords = ['cheap', 'dirt cheap', 'super cheap', 'amazing deal'];
        unprofessionalWords.forEach(word => {
            if (mainContent.toLowerCase().includes(word)) {
                analysis.issues.push({
                    type: this.issues.CONTENT_QUALITY,
                    severity: 'medium',
                    element: 'professional_tone',
                    message: `Unprofessional language detected: "${word}"`,
                    recommendation: 'Use more professional business language'
                });
            }
        });
    }
    
    analyzePricingIssues($, analysis) {
        const content = $.html();
        
        // Look for specific prices
        const pricePatterns = [
            /€\s*\d+/g,
            /\d+\s*euro/gi,
            /\d+\s*€/g,
            /prezzo:\s*\d+/gi,
            /costa\s*\d+/gi
        ];
        
        pricePatterns.forEach((pattern, index) => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    analysis.issues.push({
                        type: this.issues.PRICING_ISSUES,
                        severity: 'high',
                        element: 'specific_pricing',
                        message: `Specific price found: "${match}"`,
                        recommendation: 'Replace with "Contatta per preventivo personalizzato"'
                    });
                });
            }
        });
        
        // Check for pricing tables or sections
        const pricingSections = $('[class*="price"], [id*="price"], [class*="pricing"], [id*="pricing"]');
        if (pricingSections.length > 0) {
            analysis.issues.push({
                type: this.issues.PRICING_ISSUES,
                severity: 'medium',
                element: 'pricing_sections',
                message: `Found ${pricingSections.length} pricing-related sections`,
                recommendation: 'Review pricing sections and make them generic'
            });
        }
    }
    
    analyzeSparseContent($, analysis) {
        const sections = $('section');
        let sparseSections = 0;
        
        sections.each((i, section) => {
            const sectionText = $(section).text();
            const wordCount = this.getWordCount(sectionText);
            
            if (wordCount < 50) {
                sparseSections++;
            }
        });
        
        if (sparseSections > sections.length / 2) {
            analysis.issues.push({
                type: this.issues.SPARSE_CONTENT,
                severity: 'high',
                element: 'sparse_sections',
                message: `${sparseSections} out of ${sections.length} sections have sparse content`,
                recommendation: 'Expand content in sparse sections with relevant information'
            });
        }
    }
    
    analyzeGrammarAndTone($, analysis) {
        const content = $('main').text() || $('body').text();
        
        // Basic grammar checks
        const grammarIssues = [
            { pattern: /\s{2,}/g, message: 'Multiple consecutive spaces found' },
            { pattern: /[.!?]\s*[a-z]/g, message: 'Sentences not properly capitalized' },
            { pattern: /\s+[.!?]/g, message: 'Spaces before punctuation' }
        ];
        
        grammarIssues.forEach(issue => {
            if (issue.pattern.test(content)) {
                analysis.issues.push({
                    type: this.issues.GRAMMAR_ISSUES,
                    severity: 'low',
                    element: 'grammar',
                    message: issue.message,
                    recommendation: 'Review and fix grammar issues'
                });
            }
        });
    }
    
    getWordCount(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    
    generateSummary(allIssues) {
        const summary = {
            totalIssues: 0,
            issuesByType: {},
            issuesBySeverity: { high: 0, medium: 0, low: 0 },
            pagesWithIssues: 0
        };
        
        Object.values(allIssues).forEach(pageIssues => {
            if (pageIssues.length > 0) {
                summary.pagesWithIssues++;
                summary.totalIssues += pageIssues.length;
                
                pageIssues.forEach(issue => {
                    // Count by type
                    summary.issuesByType[issue.type] = (summary.issuesByType[issue.type] || 0) + 1;
                    
                    // Count by severity
                    summary.issuesBySeverity[issue.severity]++;
                });
            }
        });
        
        return summary;
    }
}

module.exports = new ContentReviewAgent();
