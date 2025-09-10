#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configurazione
const SITE_BASE_URL = 'https://userx87.github.io/it-era';
const SITE_DIR = '_site';
const REPORT_FILE = 'design-system-test-report.json';

// Breakpoints per test responsività
const BREAKPOINTS = {
    mobile: { width: 320, height: 568, name: 'Mobile (iPhone SE)' },
    mobileLarge: { width: 414, height: 896, name: 'Mobile Large (iPhone 11)' },
    tablet: { width: 768, height: 1024, name: 'Tablet (iPad)' },
    desktop: { width: 1200, height: 800, name: 'Desktop' },
    desktopLarge: { width: 1920, height: 1080, name: 'Desktop Large (Full HD)' }
};

// Colori brand IT-ERA
const BRAND_COLORS = {
    primary: '#0056cc',
    secondary: '#f8f9fa',
    accent: '#28a745',
    text: '#333333',
    textLight: '#6c757d',
    background: '#ffffff',
    border: '#dee2e6'
};

class DesignSystemTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            summary: {
                totalPages: 0,
                cssFilesLoaded: 0,
                cssFilesFailed: 0,
                responsiveBreakpoints: 0,
                interactiveComponents: 0,
                accessibilityScore: 0
            },
            cssTests: [],
            responsivityTests: [],
            componentTests: [],
            accessibilityTests: [],
            performanceMetrics: [],
            issues: [],
            recommendations: []
        };
    }

    // Testa il caricamento dei file CSS
    async testCSSLoading() {
        console.log('🎨 Testing CSS Loading...\n');
        
        const cssFiles = [
            '/styles.css',
            '/css/enhanced-chatbot.min.css',
            '/css/assistenza-informatica.css',
            '/css/styles.css'
        ];

        for (const cssFile of cssFiles) {
            const result = await this.testResourceLoad(cssFile, 'CSS');
            this.results.cssTests.push(result);
            
            if (result.success) {
                this.results.summary.cssFilesLoaded++;
                console.log(`✅ ${cssFile} - ${result.loadTime}ms`);
            } else {
                this.results.summary.cssFilesFailed++;
                console.log(`❌ ${cssFile} - ${result.error}`);
                this.results.issues.push(`CSS file failed to load: ${cssFile}`);
            }
        }
        console.log('');
    }

    // Testa una risorsa specifica
    async testResourceLoad(resourcePath, type) {
        return new Promise((resolve) => {
            const url = `${SITE_BASE_URL}${resourcePath}`;
            const startTime = Date.now();
            
            const req = https.request(url, { method: 'HEAD' }, (res) => {
                const loadTime = Date.now() - startTime;
                resolve({
                    path: resourcePath,
                    type: type,
                    url: url,
                    status: res.statusCode,
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    loadTime: loadTime,
                    size: res.headers['content-length'] || 'unknown'
                });
            });

            req.on('error', (error) => {
                resolve({
                    path: resourcePath,
                    type: type,
                    url: url,
                    status: 0,
                    success: false,
                    error: error.message,
                    loadTime: Date.now() - startTime
                });
            });

            req.setTimeout(5000, () => {
                req.destroy();
                resolve({
                    path: resourcePath,
                    type: type,
                    url: url,
                    status: 0,
                    success: false,
                    error: 'Timeout',
                    loadTime: Date.now() - startTime
                });
            });

            req.end();
        });
    }

    // Analizza la struttura CSS per design system
    analyzeCSSStructure() {
        console.log('🎯 Analyzing CSS Structure...\n');
        
        const cssFiles = [
            path.join(SITE_DIR, 'styles.css'),
            path.join(SITE_DIR, 'css', 'enhanced-chatbot.min.css'),
            path.join(SITE_DIR, 'css', 'assistenza-informatica.css')
        ];

        const analysis = {
            totalRules: 0,
            mediaQueries: 0,
            colorVariables: 0,
            fontFamilies: [],
            breakpoints: [],
            animations: 0
        };

        cssFiles.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Conta regole CSS
                const rules = content.match(/[^{}]+\{[^{}]*\}/g) || [];
                analysis.totalRules += rules.length;
                
                // Conta media queries
                const mediaQueries = content.match(/@media[^{]+\{/g) || [];
                analysis.mediaQueries += mediaQueries.length;
                
                // Trova breakpoints
                mediaQueries.forEach(mq => {
                    const widthMatch = mq.match(/\((?:min-|max-)?width:\s*(\d+)px\)/);
                    if (widthMatch) {
                        analysis.breakpoints.push(parseInt(widthMatch[1]));
                    }
                });
                
                // Conta variabili colore
                const colorVars = content.match(/--[^:]+:\s*#[0-9a-fA-F]{3,6}/g) || [];
                analysis.colorVariables += colorVars.length;
                
                // Trova font families
                const fontMatches = content.match(/font-family:\s*([^;]+)/g) || [];
                fontMatches.forEach(font => {
                    const cleanFont = font.replace('font-family:', '').trim();
                    if (!analysis.fontFamilies.includes(cleanFont)) {
                        analysis.fontFamilies.push(cleanFont);
                    }
                });
                
                // Conta animazioni
                const animations = content.match(/@keyframes|animation:|transition:/g) || [];
                analysis.animations += animations.length;
            }
        });

        // Rimuovi duplicati e ordina breakpoints
        analysis.breakpoints = [...new Set(analysis.breakpoints)].sort((a, b) => a - b);
        
        this.results.responsivityTests.push({
            type: 'CSS Analysis',
            ...analysis,
            score: this.calculateCSSScore(analysis)
        });

        console.log(`📊 CSS Rules: ${analysis.totalRules}`);
        console.log(`📱 Media Queries: ${analysis.mediaQueries}`);
        console.log(`🎨 Color Variables: ${analysis.colorVariables}`);
        console.log(`🔤 Font Families: ${analysis.fontFamilies.length}`);
        console.log(`📐 Breakpoints: ${analysis.breakpoints.join(', ')}px`);
        console.log(`✨ Animations: ${analysis.animations}`);
        console.log('');
    }

    // Calcola score CSS
    calculateCSSScore(analysis) {
        let score = 0;
        
        // Punti per media queries (max 25)
        score += Math.min(analysis.mediaQueries * 5, 25);
        
        // Punti per breakpoints standard (max 25)
        const standardBreakpoints = [320, 768, 1024, 1200];
        const matchingBreakpoints = standardBreakpoints.filter(bp => 
            analysis.breakpoints.some(abp => Math.abs(abp - bp) <= 50)
        );
        score += matchingBreakpoints.length * 6;
        
        // Punti per variabili colore (max 20)
        score += Math.min(analysis.colorVariables * 4, 20);
        
        // Punti per font consistency (max 15)
        if (analysis.fontFamilies.length <= 3) score += 15;
        else if (analysis.fontFamilies.length <= 5) score += 10;
        else score += 5;
        
        // Punti per animazioni (max 15)
        score += Math.min(analysis.animations * 2, 15);
        
        return Math.min(score, 100);
    }

    // Testa componenti interattivi
    testInteractiveComponents() {
        console.log('🖱️ Testing Interactive Components...\n');
        
        const htmlFiles = [
            'index.html',
            'servizi.html',
            'contatti.html'
        ];

        htmlFiles.forEach(file => {
            const filePath = path.join(SITE_DIR, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                const components = {
                    buttons: (content.match(/<button[^>]*>|<a[^>]*class="[^"]*btn[^"]*"/g) || []).length,
                    forms: (content.match(/<form[^>]*>/g) || []).length,
                    inputs: (content.match(/<input[^>]*>|<textarea[^>]*>/g) || []).length,
                    modals: (content.match(/modal|popup|dialog/gi) || []).length,
                    dropdowns: (content.match(/dropdown|select/gi) || []).length,
                    chatbot: (content.match(/chatbot|chat-widget/gi) || []).length,
                    navigation: (content.match(/<nav[^>]*>|navbar/gi) || []).length
                };

                const totalComponents = Object.values(components).reduce((a, b) => a + b, 0);
                this.results.summary.interactiveComponents += totalComponents;

                this.results.componentTests.push({
                    file: file,
                    components: components,
                    total: totalComponents,
                    score: this.calculateComponentScore(components)
                });

                console.log(`📄 ${file}:`);
                console.log(`  🔘 Buttons: ${components.buttons}`);
                console.log(`  📝 Forms: ${components.forms}`);
                console.log(`  ⌨️  Inputs: ${components.inputs}`);
                console.log(`  💬 Chatbot: ${components.chatbot}`);
                console.log(`  🧭 Navigation: ${components.navigation}`);
                console.log(`  📊 Total: ${totalComponents}`);
                console.log('');
            }
        });
    }

    // Calcola score componenti
    calculateComponentScore(components) {
        let score = 0;
        
        // Punti per presenza componenti essenziali
        if (components.buttons > 0) score += 20;
        if (components.forms > 0) score += 25;
        if (components.inputs > 0) score += 20;
        if (components.navigation > 0) score += 20;
        if (components.chatbot > 0) score += 15;
        
        return Math.min(score, 100);
    }

    // Testa accessibilità
    testAccessibility() {
        console.log('♿ Testing Accessibility...\n');
        
        const htmlFiles = [
            'index.html',
            'servizi.html',
            'contatti.html'
        ];

        let totalScore = 0;
        let fileCount = 0;

        htmlFiles.forEach(file => {
            const filePath = path.join(SITE_DIR, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                const accessibility = {
                    altTexts: this.countAltTexts(content),
                    headingStructure: this.analyzeHeadingStructure(content),
                    ariaLabels: (content.match(/aria-label|aria-labelledby|aria-describedby/g) || []).length,
                    focusableElements: (content.match(/tabindex|:focus/g) || []).length,
                    semanticElements: (content.match(/<(main|nav|section|article|aside|header|footer)[^>]*>/g) || []).length,
                    langAttribute: content.includes('lang=') ? 1 : 0
                };

                const score = this.calculateAccessibilityScore(accessibility);
                totalScore += score;
                fileCount++;

                this.results.accessibilityTests.push({
                    file: file,
                    ...accessibility,
                    score: score
                });

                console.log(`📄 ${file} (Score: ${score}/100):`);
                console.log(`  🖼️  Alt texts: ${accessibility.altTexts.withAlt}/${accessibility.altTexts.total}`);
                console.log(`  📑 Heading structure: ${accessibility.headingStructure.valid ? '✅' : '❌'}`);
                console.log(`  🏷️  ARIA labels: ${accessibility.ariaLabels}`);
                console.log(`  🎯 Focusable elements: ${accessibility.focusableElements}`);
                console.log(`  🏗️  Semantic elements: ${accessibility.semanticElements}`);
                console.log('');
            }
        });

        this.results.summary.accessibilityScore = fileCount > 0 ? Math.round(totalScore / fileCount) : 0;
    }

    // Conta alt texts
    countAltTexts(content) {
        const images = content.match(/<img[^>]*>/g) || [];
        const withAlt = images.filter(img => img.includes('alt=')).length;
        return { total: images.length, withAlt: withAlt };
    }

    // Analizza struttura heading
    analyzeHeadingStructure(content) {
        const headings = [];
        for (let i = 1; i <= 6; i++) {
            const regex = new RegExp(`<h${i}[^>]*>`, 'g');
            const matches = content.match(regex) || [];
            headings.push({ level: i, count: matches.length });
        }
        
        // Verifica che ci sia un solo H1
        const h1Count = headings[0].count;
        const valid = h1Count === 1;
        
        return { headings: headings, valid: valid, h1Count: h1Count };
    }

    // Calcola score accessibilità
    calculateAccessibilityScore(accessibility) {
        let score = 0;
        
        // Alt texts (25 punti)
        if (accessibility.altTexts.total > 0) {
            score += (accessibility.altTexts.withAlt / accessibility.altTexts.total) * 25;
        } else {
            score += 25; // Nessuna immagine = perfetto
        }
        
        // Heading structure (25 punti)
        score += accessibility.headingStructure.valid ? 25 : 10;
        
        // ARIA labels (20 punti)
        score += Math.min(accessibility.ariaLabels * 5, 20);
        
        // Semantic elements (15 punti)
        score += Math.min(accessibility.semanticElements * 3, 15);
        
        // Lang attribute (10 punti)
        score += accessibility.langAttribute * 10;
        
        // Focusable elements (5 punti)
        score += Math.min(accessibility.focusableElements * 1, 5);
        
        return Math.round(Math.min(score, 100));
    }

    // Genera raccomandazioni
    generateRecommendations() {
        // Raccomandazioni CSS
        if (this.results.summary.cssFilesFailed > 0) {
            this.results.recommendations.push({
                category: 'CSS',
                priority: 'High',
                issue: `${this.results.summary.cssFilesFailed} CSS files failed to load`,
                solution: 'Fix broken CSS file paths and ensure all files are accessible'
            });
        }

        // Raccomandazioni accessibilità
        if (this.results.summary.accessibilityScore < 80) {
            this.results.recommendations.push({
                category: 'Accessibility',
                priority: 'High',
                issue: `Low accessibility score: ${this.results.summary.accessibilityScore}/100`,
                solution: 'Add missing alt texts, ARIA labels, and improve semantic structure'
            });
        }

        // Raccomandazioni componenti
        if (this.results.summary.interactiveComponents < 10) {
            this.results.recommendations.push({
                category: 'Components',
                priority: 'Medium',
                issue: 'Low number of interactive components',
                solution: 'Add more interactive elements to improve user engagement'
            });
        }
    }

    // Esegue tutti i test
    async runAllTests() {
        console.log('🎨 DESIGN SYSTEM & RENDERING TEST');
        console.log('==================================\n');

        await this.testCSSLoading();
        this.analyzeCSSStructure();
        this.testInteractiveComponents();
        this.testAccessibility();
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
        console.log('📊 RIASSUNTO DESIGN SYSTEM TEST');
        console.log('================================');
        console.log(`🎨 CSS Files Loaded: ${this.results.summary.cssFilesLoaded}/${this.results.summary.cssFilesLoaded + this.results.summary.cssFilesFailed}`);
        console.log(`📱 Responsive Breakpoints: ${this.results.responsivityTests[0]?.breakpoints?.length || 0}`);
        console.log(`🖱️  Interactive Components: ${this.results.summary.interactiveComponents}`);
        console.log(`♿ Accessibility Score: ${this.results.summary.accessibilityScore}/100`);
        console.log(`⚠️  Issues Found: ${this.results.issues.length}`);
        console.log(`💡 Recommendations: ${this.results.recommendations.length}`);
        
        if (this.results.recommendations.length > 0) {
            console.log('\n🎯 TOP RECOMMENDATIONS:');
            this.results.recommendations.slice(0, 3).forEach((rec, i) => {
                console.log(`${i + 1}. [${rec.priority}] ${rec.issue}`);
            });
        }
    }
}

// Esegui i test
const tester = new DesignSystemTester();
tester.runAllTests().catch(console.error);
