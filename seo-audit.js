#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configurazione
const SITE_DIR = '_site';
const REPORT_FILE = 'seo-audit-report.json';

// Target keywords per IT-ERA
const TARGET_KEYWORDS = [
    'assistenza informatica',
    'IT support',
    'cybersecurity',
    'sicurezza informatica',
    'cloud storage',
    'Lombardia',
    'Milano',
    'Bergamo',
    'Vimercate',
    'supporto IT',
    'consulenza informatica'
];

class SEOAuditor {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            summary: {
                totalPages: 0,
                pagesWithTitle: 0,
                pagesWithDescription: 0,
                pagesWithH1: 0,
                pagesWithStructuredData: 0,
                averageKeywordDensity: 0
            },
            pages: [],
            recommendations: [],
            keywords: {}
        };
    }

    // Trova tutti i file HTML principali
    findMainHtmlFiles() {
        const htmlFiles = [];
        const mainFiles = [
            'index.html',
            'servizi.html', 
            'contatti.html',
            'settori/pmi-startup.html',
            'settori/studi-medici.html',
            'settori/commercialisti.html',
            'settori/studi-legali.html',
            'settori/industria-40.html',
            'settori/retail-gdo.html'
        ];

        for (const file of mainFiles) {
            const fullPath = path.join(SITE_DIR, file);
            if (fs.existsSync(fullPath)) {
                htmlFiles.push(fullPath);
            }
        }

        return htmlFiles;
    }

    // Analizza una singola pagina HTML
    analyzePage(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(SITE_DIR, filePath);
        
        const analysis = {
            file: relativePath,
            url: `https://userx87.github.io/it-era/${relativePath}`,
            seo: {
                title: this.extractTitle(content),
                metaDescription: this.extractMetaDescription(content),
                metaKeywords: this.extractMetaKeywords(content),
                headings: this.extractHeadings(content),
                structuredData: this.extractStructuredData(content),
                openGraph: this.extractOpenGraph(content),
                twitterCard: this.extractTwitterCard(content),
                canonicalUrl: this.extractCanonical(content),
                altTexts: this.extractAltTexts(content)
            },
            content: {
                wordCount: this.countWords(content),
                keywordDensity: this.calculateKeywordDensity(content),
                readabilityScore: this.calculateReadability(content)
            },
            issues: [],
            score: 0
        };

        // Valuta la pagina
        this.evaluatePage(analysis);
        
        return analysis;
    }

    // Estrae il title tag
    extractTitle(content) {
        const match = content.match(/<title[^>]*>([^<]+)<\/title>/i);
        return match ? match[1].trim() : null;
    }

    // Estrae meta description
    extractMetaDescription(content) {
        const match = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        return match ? match[1].trim() : null;
    }

    // Estrae meta keywords
    extractMetaKeywords(content) {
        const match = content.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
        return match ? match[1].trim() : null;
    }

    // Estrae tutti i heading
    extractHeadings(content) {
        const headings = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
        
        for (let i = 1; i <= 6; i++) {
            const regex = new RegExp(`<h${i}[^>]*>([^<]+)</h${i}>`, 'gi');
            let match;
            while ((match = regex.exec(content)) !== null) {
                headings[`h${i}`].push(match[1].trim());
            }
        }
        
        return headings;
    }

    // Estrae structured data
    extractStructuredData(content) {
        const scripts = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi);
        if (!scripts) return [];
        
        return scripts.map(script => {
            try {
                const jsonMatch = script.match(/>([^<]+)</);
                return jsonMatch ? JSON.parse(jsonMatch[1]) : null;
            } catch (e) {
                return null;
            }
        }).filter(Boolean);
    }

    // Estrae Open Graph tags
    extractOpenGraph(content) {
        const og = {};
        const ogRegex = /<meta[^>]*property=["']og:([^"']+)["'][^>]*content=["']([^"']+)["']/gi;
        let match;
        
        while ((match = ogRegex.exec(content)) !== null) {
            og[match[1]] = match[2];
        }
        
        return og;
    }

    // Estrae Twitter Card tags
    extractTwitterCard(content) {
        const twitter = {};
        const twitterRegex = /<meta[^>]*name=["']twitter:([^"']+)["'][^>]*content=["']([^"']+)["']/gi;
        let match;
        
        while ((match = twitterRegex.exec(content)) !== null) {
            twitter[match[1]] = match[2];
        }
        
        return twitter;
    }

    // Estrae canonical URL
    extractCanonical(content) {
        const match = content.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
        return match ? match[1] : null;
    }

    // Estrae alt texts delle immagini
    extractAltTexts(content) {
        const altTexts = [];
        const imgRegex = /<img[^>]*alt=["']([^"']*)["']/gi;
        let match;
        
        while ((match = imgRegex.exec(content)) !== null) {
            altTexts.push(match[1]);
        }
        
        return altTexts;
    }

    // Conta le parole nel contenuto
    countWords(content) {
        // Rimuove HTML tags e conta le parole
        const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return textContent.split(' ').length;
    }

    // Calcola la densità delle keywords
    calculateKeywordDensity(content) {
        const textContent = content.replace(/<[^>]*>/g, ' ').toLowerCase();
        const totalWords = textContent.split(/\s+/).length;
        const density = {};
        
        TARGET_KEYWORDS.forEach(keyword => {
            const regex = new RegExp(keyword.toLowerCase(), 'gi');
            const matches = textContent.match(regex) || [];
            density[keyword] = {
                count: matches.length,
                density: totalWords > 0 ? (matches.length / totalWords * 100).toFixed(2) : 0
            };
        });
        
        return density;
    }

    // Calcola un punteggio di leggibilità semplificato
    calculateReadability(content) {
        const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const sentences = textContent.split(/[.!?]+/).length;
        const words = textContent.split(/\s+/).length;
        
        if (sentences === 0) return 0;
        
        const avgWordsPerSentence = words / sentences;
        
        // Punteggio semplificato: ideale 15-20 parole per frase
        if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) return 100;
        if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) return 80;
        if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 30) return 60;
        return 40;
    }

    // Valuta la pagina e assegna un punteggio
    evaluatePage(analysis) {
        let score = 0;
        const issues = [];

        // Title (20 punti)
        if (analysis.seo.title) {
            if (analysis.seo.title.length >= 30 && analysis.seo.title.length <= 60) {
                score += 20;
            } else if (analysis.seo.title.length > 0) {
                score += 10;
                issues.push(`Title length (${analysis.seo.title.length}) should be 30-60 characters`);
            }
        } else {
            issues.push('Missing title tag');
        }

        // Meta Description (20 punti)
        if (analysis.seo.metaDescription) {
            if (analysis.seo.metaDescription.length >= 150 && analysis.seo.metaDescription.length <= 160) {
                score += 20;
            } else if (analysis.seo.metaDescription.length > 0) {
                score += 10;
                issues.push(`Meta description length (${analysis.seo.metaDescription.length}) should be 150-160 characters`);
            }
        } else {
            issues.push('Missing meta description');
        }

        // H1 (15 punti)
        if (analysis.seo.headings.h1.length === 1) {
            score += 15;
        } else if (analysis.seo.headings.h1.length === 0) {
            issues.push('Missing H1 tag');
        } else {
            issues.push(`Multiple H1 tags found (${analysis.seo.headings.h1.length})`);
            score += 5;
        }

        // Structured Data (15 punti)
        if (analysis.seo.structuredData.length > 0) {
            score += 15;
        } else {
            issues.push('Missing structured data (JSON-LD)');
        }

        // Open Graph (10 punti)
        if (Object.keys(analysis.seo.openGraph).length >= 4) {
            score += 10;
        } else {
            score += Object.keys(analysis.seo.openGraph).length * 2;
            issues.push('Incomplete Open Graph tags');
        }

        // Alt texts (10 punti)
        const imagesWithoutAlt = analysis.seo.altTexts.filter(alt => alt === '').length;
        if (imagesWithoutAlt === 0) {
            score += 10;
        } else {
            score += Math.max(0, 10 - imagesWithoutAlt * 2);
            issues.push(`${imagesWithoutAlt} images without alt text`);
        }

        // Keywords density (10 punti)
        const keywordScores = Object.values(analysis.content.keywordDensity).map(kw => parseFloat(kw.density));
        const avgDensity = keywordScores.reduce((a, b) => a + b, 0) / keywordScores.length;
        if (avgDensity >= 1 && avgDensity <= 3) {
            score += 10;
        } else if (avgDensity > 0) {
            score += 5;
            issues.push(`Keyword density ${avgDensity.toFixed(2)}% should be 1-3%`);
        } else {
            issues.push('No target keywords found');
        }

        analysis.score = score;
        analysis.issues = issues;
    }

    // Genera raccomandazioni
    generateRecommendations() {
        const allIssues = this.results.pages.flatMap(page => page.issues);
        const issueFrequency = {};
        
        allIssues.forEach(issue => {
            issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
        });

        // Ordina per frequenza e crea raccomandazioni
        const sortedIssues = Object.entries(issueFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        this.results.recommendations = sortedIssues.map(([issue, count]) => ({
            issue,
            frequency: count,
            priority: count >= this.results.pages.length * 0.5 ? 'High' : 
                     count >= this.results.pages.length * 0.3 ? 'Medium' : 'Low'
        }));
    }

    // Esegue l'audit completo
    async runAudit() {
        console.log('🔍 SEO AUDIT IT-ERA');
        console.log('===================\n');

        const htmlFiles = this.findMainHtmlFiles();
        this.results.summary.totalPages = htmlFiles.length;

        console.log(`📄 Analizzando ${htmlFiles.length} pagine principali...\n`);

        for (const filePath of htmlFiles) {
            const relativePath = path.relative(SITE_DIR, filePath);
            console.log(`📝 Analizzando: ${relativePath}`);

            const analysis = this.analyzePage(filePath);
            this.results.pages.push(analysis);

            // Aggiorna statistiche
            if (analysis.seo.title) this.results.summary.pagesWithTitle++;
            if (analysis.seo.metaDescription) this.results.summary.pagesWithDescription++;
            if (analysis.seo.headings.h1.length > 0) this.results.summary.pagesWithH1++;
            if (analysis.seo.structuredData.length > 0) this.results.summary.pagesWithStructuredData++;

            console.log(`  📊 Score: ${analysis.score}/100`);
            if (analysis.issues.length > 0) {
                console.log(`  ⚠️  Issues: ${analysis.issues.length}`);
            }
            console.log('');
        }

        this.generateRecommendations();
        this.saveReport();
        this.printSummary();
    }

    // Salva il report
    saveReport() {
        fs.writeFileSync(REPORT_FILE, JSON.stringify(this.results, null, 2));
        console.log(`📊 Report salvato in: ${REPORT_FILE}\n`);
    }

    // Stampa il riassunto
    printSummary() {
        const avgScore = this.results.pages.reduce((sum, page) => sum + page.score, 0) / this.results.pages.length;
        
        console.log('📊 RIASSUNTO SEO AUDIT');
        console.log('======================');
        console.log(`📄 Pagine analizzate: ${this.results.summary.totalPages}`);
        console.log(`📝 Pagine con title: ${this.results.summary.pagesWithTitle}/${this.results.summary.totalPages}`);
        console.log(`📄 Pagine con description: ${this.results.summary.pagesWithDescription}/${this.results.summary.totalPages}`);
        console.log(`🏷️  Pagine con H1: ${this.results.summary.pagesWithH1}/${this.results.summary.totalPages}`);
        console.log(`📋 Pagine con structured data: ${this.results.summary.pagesWithStructuredData}/${this.results.summary.totalPages}`);
        console.log(`📈 Score medio: ${avgScore.toFixed(1)}/100`);
        
        console.log('\n🎯 TOP RACCOMANDAZIONI:');
        this.results.recommendations.slice(0, 5).forEach((rec, i) => {
            console.log(`${i + 1}. [${rec.priority}] ${rec.issue} (${rec.frequency} pagine)`);
        });
    }
}

// Esegui l'audit
const auditor = new SEOAuditor();
auditor.runAudit().catch(console.error);
