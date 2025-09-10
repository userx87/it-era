/**
 * Content Analysis & Error Resolution System
 * IT-ERA Website Content Quality Assurance
 */

const fs = require('fs').promises;
const path = require('path');

class ContentAnalyzer {
    constructor() {
        this.analysisResults = {
            grammar: {},
            technical: {},
            local: {},
            cta: {},
            overall: {}
        };
        
        this.italianGrammarRules = [
            {
                pattern: /\b(un|una|uno)\s+(assistenza|informatica|supporto)\b/gi,
                correction: 'un\'assistenza, un\'informatica, un supporto',
                type: 'article_agreement'
            },
            {
                pattern: /\b(il|la|lo)\s+([aeiou])/gi,
                correction: 'Use l\' before vowels',
                type: 'article_elision'
            },
            {
                pattern: /\bproblem[ai]\b/gi,
                correction: 'problema (singular), problemi (plural)',
                type: 'noun_agreement'
            },
            {
                pattern: /\bserviz[io]\s+(di|per)\s+/gi,
                correction: 'servizio di/per (check context)',
                type: 'preposition_usage'
            }
        ];
        
        this.technicalTerms = {
            correct: [
                'cybersecurity', 'cloud storage', 'backup', 'disaster recovery',
                'Microsoft 365', 'VoIP', 'firewall', 'antivirus', 'malware',
                'phishing', 'ransomware', 'SSL', 'HTTPS', 'VPN', 'SLA'
            ],
            incorrect: {
                'cyber security': 'cybersecurity',
                'cloud-storage': 'cloud storage',
                'back-up': 'backup',
                'microsoft365': 'Microsoft 365',
                'voip': 'VoIP',
                'fire wall': 'firewall',
                'anti virus': 'antivirus',
                'mal ware': 'malware',
                'ssl certificate': 'certificato SSL',
                'https protocol': 'protocollo HTTPS'
            }
        };
        
        this.lombardyCities = [
            'Milano', 'Bergamo', 'Brescia', 'Como', 'Cremona', 'Mantova',
            'Pavia', 'Sondrio', 'Varese', 'Lecco', 'Lodi', 'Monza'
        ];
        
        this.ctaPatterns = [
            {
                pattern: /contatta(ci|mi|re)/gi,
                strength: 'medium',
                suggestions: ['Richiedi preventivo gratuito', 'Chiama ora per assistenza immediata']
            },
            {
                pattern: /chiama\s+(ora|subito)/gi,
                strength: 'high',
                suggestions: ['Ottimo CTA urgente']
            },
            {
                pattern: /scopri\s+(di\s+più|altro)/gi,
                strength: 'low',
                suggestions: ['Richiedi consulenza gratuita', 'Ottieni supporto immediato']
            }
        ];
    }

    /**
     * Perform comprehensive content analysis
     */
    async analyzeAllContent() {
        console.log('🔍 Starting comprehensive content analysis...');
        
        try {
            // Analyze template files
            await this.analyzeTemplates();
            
            // Analyze data files
            await this.analyzeDataFiles();
            
            // Analyze static content
            await this.analyzeStaticContent();
            
            // Generate analysis report
            await this.generateAnalysisReport();
            
            // Deploy error correction if needed
            await this.deployErrorCorrection();
            
            console.log('✅ Content analysis completed successfully!');
            return this.analysisResults;
            
        } catch (error) {
            console.error('❌ Content analysis failed:', error);
            throw error;
        }
    }

    /**
     * Analyze EJS template files
     */
    async analyzeTemplates() {
        console.log('📄 Analyzing template files...');
        
        const templatesDir = path.join(__dirname, '../views');
        const templateFiles = await this.getFilesRecursively(templatesDir, '.ejs');
        
        for (const filePath of templateFiles) {
            const relativePath = path.relative(templatesDir, filePath);
            console.log(`   Analyzing: ${relativePath}`);
            
            const content = await fs.readFile(filePath, 'utf8');
            const analysis = await this.analyzeContent(content, relativePath);
            
            this.analysisResults.grammar[relativePath] = analysis.grammar;
            this.analysisResults.technical[relativePath] = analysis.technical;
            this.analysisResults.local[relativePath] = analysis.local;
            this.analysisResults.cta[relativePath] = analysis.cta;
        }
    }

    /**
     * Analyze data files
     */
    async analyzeDataFiles() {
        console.log('📊 Analyzing data files...');
        
        const dataDir = path.join(__dirname, '../data');
        
        try {
            const citiesData = await fs.readFile(path.join(dataDir, 'cities-data.json'), 'utf8');
            const cities = JSON.parse(citiesData);
            
            // Analyze city data consistency
            const cityAnalysis = this.analyzeCityData(cities);
            this.analysisResults.local['cities-data.json'] = cityAnalysis;
            
        } catch (error) {
            console.warn('⚠️  Could not analyze cities data:', error.message);
        }
    }

    /**
     * Analyze static content files
     */
    async analyzeStaticContent() {
        console.log('🌐 Analyzing static content...');
        
        const webDir = path.join(__dirname, '../web');
        const htmlFiles = await this.getFilesRecursively(webDir, '.html');
        
        for (const filePath of htmlFiles) {
            const relativePath = path.relative(webDir, filePath);
            console.log(`   Analyzing: ${relativePath}`);
            
            const content = await fs.readFile(filePath, 'utf8');
            const analysis = await this.analyzeContent(content, relativePath);
            
            this.analysisResults.grammar[relativePath] = analysis.grammar;
            this.analysisResults.technical[relativePath] = analysis.technical;
            this.analysisResults.cta[relativePath] = analysis.cta;
        }
    }

    /**
     * Analyze individual content
     */
    async analyzeContent(content, filePath) {
        const analysis = {
            grammar: this.analyzeGrammar(content),
            technical: this.analyzeTechnicalAccuracy(content),
            local: this.analyzeLocalRelevance(content),
            cta: this.analyzeCTAEffectiveness(content)
        };
        
        return analysis;
    }

    /**
     * Analyze grammar and spelling
     */
    analyzeGrammar(content) {
        const issues = [];
        
        // Remove HTML tags for text analysis
        const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
        
        // Check Italian grammar rules
        this.italianGrammarRules.forEach(rule => {
            const matches = textContent.match(rule.pattern);
            if (matches) {
                matches.forEach(match => {
                    issues.push({
                        type: rule.type,
                        text: match,
                        suggestion: rule.correction,
                        severity: 'medium'
                    });
                });
            }
        });
        
        // Check for common spelling errors
        const commonErrors = {
            'assitenza': 'assistenza',
            'informatico': 'informatica (check gender agreement)',
            'servizzi': 'servizi',
            'problemi': 'problemi (correct)',
            'soluzioni': 'soluzioni (correct)'
        };
        
        Object.entries(commonErrors).forEach(([error, correction]) => {
            const regex = new RegExp(`\\b${error}\\b`, 'gi');
            const matches = textContent.match(regex);
            if (matches) {
                issues.push({
                    type: 'spelling',
                    text: error,
                    suggestion: correction,
                    severity: 'high'
                });
            }
        });
        
        return {
            totalIssues: issues.length,
            issues: issues,
            score: Math.max(0, 100 - (issues.length * 10))
        };
    }

    /**
     * Analyze technical accuracy
     */
    analyzeTechnicalAccuracy(content) {
        const issues = [];
        const textContent = content.replace(/<[^>]*>/g, ' ').toLowerCase();
        
        // Check for incorrect technical terms
        Object.entries(this.technicalTerms.incorrect).forEach(([incorrect, correct]) => {
            const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
            if (textContent.includes(incorrect.toLowerCase())) {
                issues.push({
                    type: 'technical_term',
                    text: incorrect,
                    suggestion: correct,
                    severity: 'medium'
                });
            }
        });
        
        // Check for outdated technology references
        const outdatedTerms = [
            'windows xp', 'internet explorer', 'flash player',
            'windows vista', 'office 2003', 'windows 7'
        ];
        
        outdatedTerms.forEach(term => {
            if (textContent.includes(term)) {
                issues.push({
                    type: 'outdated_technology',
                    text: term,
                    suggestion: 'Update to current technology',
                    severity: 'high'
                });
            }
        });
        
        return {
            totalIssues: issues.length,
            issues: issues,
            score: Math.max(0, 100 - (issues.length * 15))
        };
    }

    /**
     * Analyze local relevance
     */
    analyzeLocalRelevance(content) {
        const issues = [];
        const textContent = content.replace(/<[^>]*>/g, ' ');
        
        // Check for Lombardy city mentions
        const cityMentions = [];
        this.lombardyCities.forEach(city => {
            const regex = new RegExp(`\\b${city}\\b`, 'gi');
            const matches = textContent.match(regex);
            if (matches) {
                cityMentions.push({
                    city: city,
                    count: matches.length
                });
            }
        });
        
        // Check for local business information
        const localElements = {
            phone: /039\s*888\s*2041/g,
            address: /vimercate|lombardia|bergamo/gi,
            localServices: /assistenza\s+(locale|in\s+loco|on-site)/gi
        };
        
        const localScore = Object.entries(localElements).reduce((score, [key, pattern]) => {
            const matches = textContent.match(pattern);
            return score + (matches ? matches.length * 10 : 0);
        }, 0);
        
        return {
            cityMentions: cityMentions,
            localScore: Math.min(100, localScore),
            issues: issues,
            score: Math.min(100, localScore + (cityMentions.length * 5))
        };
    }

    /**
     * Analyze CTA effectiveness
     */
    analyzeCTAEffectiveness(content) {
        const ctas = [];
        const textContent = content.replace(/<[^>]*>/g, ' ');
        
        // Find CTAs
        this.ctaPatterns.forEach(pattern => {
            const matches = textContent.match(pattern.pattern);
            if (matches) {
                matches.forEach(match => {
                    ctas.push({
                        text: match,
                        strength: pattern.strength,
                        suggestions: pattern.suggestions
                    });
                });
            }
        });
        
        // Analyze CTA placement (look for button/link context)
        const ctaElements = content.match(/<(button|a)[^>]*>(.*?)<\/(button|a)>/gi) || [];
        const ctaAnalysis = ctaElements.map(element => {
            const text = element.replace(/<[^>]*>/g, '').trim();
            const urgency = /\b(ora|subito|immediato|urgente)\b/i.test(text) ? 'high' : 'medium';
            const clarity = text.length > 5 && text.length < 30 ? 'good' : 'poor';
            
            return {
                element: text,
                urgency: urgency,
                clarity: clarity,
                score: urgency === 'high' && clarity === 'good' ? 90 : 60
            };
        });
        
        const averageScore = ctaAnalysis.length > 0 
            ? ctaAnalysis.reduce((sum, cta) => sum + cta.score, 0) / ctaAnalysis.length 
            : 50;
        
        return {
            totalCTAs: ctas.length,
            ctas: ctas,
            ctaElements: ctaAnalysis,
            score: averageScore
        };
    }

    /**
     * Analyze city data consistency
     */
    analyzeCityData(cities) {
        const issues = [];
        
        Object.entries(cities).forEach(([slug, cityData]) => {
            // Check required fields
            const requiredFields = ['name', 'province', 'population'];
            requiredFields.forEach(field => {
                if (!cityData[field]) {
                    issues.push({
                        type: 'missing_field',
                        city: slug,
                        field: field,
                        severity: 'high'
                    });
                }
            });
            
            // Check data consistency
            if (cityData.name && !this.lombardyCities.includes(cityData.name)) {
                issues.push({
                    type: 'unknown_city',
                    city: slug,
                    name: cityData.name,
                    severity: 'medium'
                });
            }
        });
        
        return {
            totalCities: Object.keys(cities).length,
            issues: issues,
            score: Math.max(0, 100 - (issues.length * 10))
        };
    }

    /**
     * Get files recursively
     */
    async getFilesRecursively(dir, extension) {
        const files = [];
        
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    const subFiles = await this.getFilesRecursively(fullPath, extension);
                    files.push(...subFiles);
                } else if (entry.name.endsWith(extension)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            console.warn(`Could not read directory ${dir}:`, error.message);
        }
        
        return files;
    }

    /**
     * Generate comprehensive analysis report
     */
    async generateAnalysisReport() {
        const report = {
            summary: this.generateSummary(),
            detailed: this.analysisResults,
            recommendations: this.generateRecommendations(),
            timestamp: new Date().toISOString()
        };
        
        // Save report
        await fs.mkdir('test-results', { recursive: true });
        await fs.writeFile(
            'test-results/content-analysis-report.json',
            JSON.stringify(report, null, 2)
        );
        
        // Generate HTML report
        const htmlReport = this.generateContentHTMLReport(report);
        await fs.writeFile('test-results/content-analysis-report.html', htmlReport);
        
        console.log('📊 Content analysis report generated:');
        console.log('   - test-results/content-analysis-report.json');
        console.log('   - test-results/content-analysis-report.html');
    }

    /**
     * Generate analysis summary
     */
    generateSummary() {
        const allGrammarIssues = Object.values(this.analysisResults.grammar)
            .reduce((total, analysis) => total + (analysis.totalIssues || 0), 0);
        
        const allTechnicalIssues = Object.values(this.analysisResults.technical)
            .reduce((total, analysis) => total + (analysis.totalIssues || 0), 0);
        
        const averageGrammarScore = this.calculateAverageScore(this.analysisResults.grammar);
        const averageTechnicalScore = this.calculateAverageScore(this.analysisResults.technical);
        const averageCTAScore = this.calculateAverageScore(this.analysisResults.cta);
        
        return {
            totalFiles: Object.keys(this.analysisResults.grammar).length,
            grammarIssues: allGrammarIssues,
            technicalIssues: allTechnicalIssues,
            averageGrammarScore: averageGrammarScore,
            averageTechnicalScore: averageTechnicalScore,
            averageCTAScore: averageCTAScore,
            overallScore: (averageGrammarScore + averageTechnicalScore + averageCTAScore) / 3
        };
    }

    /**
     * Calculate average score
     */
    calculateAverageScore(results) {
        const scores = Object.values(results)
            .map(result => result.score || 0)
            .filter(score => score > 0);
        
        return scores.length > 0 
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
            : 0;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Grammar recommendations
        const grammarIssues = Object.values(this.analysisResults.grammar)
            .reduce((total, analysis) => total + (analysis.totalIssues || 0), 0);
        
        if (grammarIssues > 10) {
            recommendations.push({
                type: 'grammar',
                priority: 'high',
                issue: `${grammarIssues} grammar issues found`,
                action: 'Review and correct Italian grammar and spelling errors'
            });
        }
        
        // Technical recommendations
        const technicalIssues = Object.values(this.analysisResults.technical)
            .reduce((total, analysis) => total + (analysis.totalIssues || 0), 0);
        
        if (technicalIssues > 5) {
            recommendations.push({
                type: 'technical',
                priority: 'medium',
                issue: `${technicalIssues} technical accuracy issues found`,
                action: 'Update technical terminology and remove outdated references'
            });
        }
        
        // CTA recommendations
        const avgCTAScore = this.calculateAverageScore(this.analysisResults.cta);
        if (avgCTAScore < 70) {
            recommendations.push({
                type: 'cta',
                priority: 'medium',
                issue: 'CTA effectiveness below optimal',
                action: 'Improve call-to-action clarity and urgency'
            });
        }
        
        return recommendations;
    }

    /**
     * Deploy error correction if needed
     */
    async deployErrorCorrection() {
        const summary = this.generateSummary();
        
        if (summary.grammarIssues > 20 || summary.technicalIssues > 10) {
            console.log('🚨 Critical content issues detected - deploying error correction swarm...');
            
            // In a real implementation, this would trigger specialized agents
            // For now, we'll log the issues that need correction
            console.log('📝 Issues requiring immediate attention:');
            
            Object.entries(this.analysisResults.grammar).forEach(([file, analysis]) => {
                if (analysis.issues && analysis.issues.length > 0) {
                    console.log(`   ${file}: ${analysis.issues.length} grammar issues`);
                }
            });
            
            Object.entries(this.analysisResults.technical).forEach(([file, analysis]) => {
                if (analysis.issues && analysis.issues.length > 0) {
                    console.log(`   ${file}: ${analysis.issues.length} technical issues`);
                }
            });
        } else {
            console.log('✅ Content quality is acceptable - no error correction needed');
        }
    }

    /**
     * Generate HTML report for content analysis
     */
    generateContentHTMLReport(report) {
        const overallScore = report.summary.overallScore.toFixed(1);
        const scoreClass = overallScore >= 80 ? 'success' : overallScore >= 60 ? 'warning' : 'danger';
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA Content Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .section { margin-bottom: 30px; }
        .issue { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .issue.high { background: #f8d7da; border-color: #f5c6cb; }
        .recommendation { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; margin: 10px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>IT-ERA Content Analysis Report</h1>
            <p>Generated: ${report.timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value ${scoreClass}">${overallScore}</div>
                <div>Overall Score</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.totalFiles}</div>
                <div>Files Analyzed</div>
            </div>
            <div class="metric">
                <div class="metric-value ${report.summary.grammarIssues > 10 ? 'danger' : 'success'}">${report.summary.grammarIssues}</div>
                <div>Grammar Issues</div>
            </div>
            <div class="metric">
                <div class="metric-value ${report.summary.technicalIssues > 5 ? 'danger' : 'success'}">${report.summary.technicalIssues}</div>
                <div>Technical Issues</div>
            </div>
        </div>
        
        <div class="section">
            <h2>Recommendations</h2>
            ${report.recommendations.map(rec => `
            <div class="recommendation">
                <strong>${rec.priority.toUpperCase()}:</strong> ${rec.issue}<br>
                <strong>Action:</strong> ${rec.action}
            </div>
            `).join('')}
        </div>
        
        <div class="section">
            <h2>Detailed Analysis</h2>
            <p>Content quality analysis completed across ${report.summary.totalFiles} files.</p>
            <p>Average Grammar Score: ${report.summary.averageGrammarScore.toFixed(1)}/100</p>
            <p>Average Technical Score: ${report.summary.averageTechnicalScore.toFixed(1)}/100</p>
            <p>Average CTA Score: ${report.summary.averageCTAScore.toFixed(1)}/100</p>
        </div>
    </div>
</body>
</html>`;
    }
}

module.exports = ContentAnalyzer;
