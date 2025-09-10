#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const http = require('http');

// Configurazione
const SITE_BASE_URL = 'https://userx87.github.io/it-era';
const REPORT_FILE = 'end-to-end-test-report.json';

// User Journeys da testare
const USER_JOURNEYS = [
    {
        name: 'Visitatore cerca assistenza IT Milano',
        description: 'Utente arriva su homepage → naviga servizi → compila form contatti',
        steps: [
            { action: 'visit', url: '/', expected: 200, description: 'Visita homepage' },
            { action: 'visit', url: '/servizi.html', expected: 200, description: 'Naviga ai servizi' },
            { action: 'visit', url: '/contatti.html', expected: 200, description: 'Vai ai contatti' },
            { action: 'check_form', url: '/contatti.html', description: 'Verifica form contatti' }
        ]
    },
    {
        name: 'Cliente business cerca cybersecurity Lombardia',
        description: 'Utente cerca cybersecurity → arriva su settore → legge case study → contatta via chatbot',
        steps: [
            { action: 'visit', url: '/settori/pmi-startup.html', expected: 200, description: 'Visita settore PMI' },
            { action: 'visit', url: '/settori/studi-medici.html', expected: 200, description: 'Visita settore medico' },
            { action: 'visit', url: '/settori/commercialisti.html', expected: 200, description: 'Visita commercialisti' },
            { action: 'check_chatbot', url: '/', description: 'Verifica chatbot funzionante' }
        ]
    },
    {
        name: 'Utente mobile naviga sito completo',
        description: 'Test completo navigazione mobile su tutte le pagine principali',
        steps: [
            { action: 'visit', url: '/', expected: 200, description: 'Homepage mobile' },
            { action: 'visit', url: '/servizi.html', expected: 200, description: 'Servizi mobile' },
            { action: 'visit', url: '/contatti.html', expected: 200, description: 'Contatti mobile' },
            { action: 'visit', url: '/blog/', expected: 200, description: 'Blog mobile' },
            { action: 'check_responsive', url: '/', description: 'Verifica responsive design' }
        ]
    }
];

// Metriche performance target
const PERFORMANCE_TARGETS = {
    loadTime: 3000, // 3 secondi max
    firstContentfulPaint: 1500, // 1.5 secondi max
    largestContentfulPaint: 2500, // 2.5 secondi max
    cumulativeLayoutShift: 0.1, // CLS < 0.1
    firstInputDelay: 100 // 100ms max
};

class EndToEndTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            summary: {
                totalJourneys: USER_JOURNEYS.length,
                successfulJourneys: 0,
                failedJourneys: 0,
                totalSteps: 0,
                successfulSteps: 0,
                averageLoadTime: 0,
                performanceScore: 0,
                businessCriticalScore: 0,
                overallScore: 0
            },
            journeys: [],
            performance: [],
            businessCritical: [],
            security: [],
            compliance: [],
            issues: [],
            recommendations: [],
            certification: {
                passed: false,
                grade: 'F',
                score: 0,
                requirements: []
            }
        };
    }

    // Testa una singola URL
    async testUrl(url, timeout = 5000) {
        return new Promise((resolve) => {
            const fullUrl = url.startsWith('http') ? url : `${SITE_BASE_URL}${url}`;
            const startTime = Date.now();
            
            const urlObj = new URL(fullUrl);
            const client = urlObj.protocol === 'https:' ? https : http;
            
            const req = client.request(fullUrl, { method: 'GET', timeout }, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const loadTime = Date.now() - startTime;
                    resolve({
                        url: fullUrl,
                        status: res.statusCode,
                        success: res.statusCode >= 200 && res.statusCode < 400,
                        loadTime: loadTime,
                        size: data.length,
                        headers: res.headers,
                        content: data,
                        contentType: res.headers['content-type'] || 'unknown'
                    });
                });
            });

            req.on('error', (error) => {
                resolve({
                    url: fullUrl,
                    status: 0,
                    success: false,
                    error: error.message,
                    loadTime: Date.now() - startTime
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    url: fullUrl,
                    status: 0,
                    success: false,
                    error: 'Timeout',
                    loadTime: Date.now() - startTime
                });
            });

            req.end();
        });
    }

    // Verifica presenza form
    checkFormPresence(content) {
        const hasForm = content.includes('<form');
        const hasInputs = (content.match(/<input/g) || []).length;
        const hasSubmit = content.includes('type="submit"') || content.includes('button');
        const hasValidation = content.includes('required') || content.includes('aria-required');
        
        return {
            hasForm,
            inputCount: hasInputs,
            hasSubmit,
            hasValidation,
            score: (hasForm ? 25 : 0) + (hasInputs > 0 ? 25 : 0) + (hasSubmit ? 25 : 0) + (hasValidation ? 25 : 0)
        };
    }

    // Verifica presenza chatbot
    checkChatbotPresence(content) {
        const hasChatbot = content.includes('chatbot') || content.includes('chat-widget') || content.includes('chat-button');
        const hasWhatsApp = content.includes('wa.me') || content.includes('whatsapp');
        const hasPhone = content.includes('tel:') || content.includes('039 888 2041');
        
        return {
            hasChatbot,
            hasWhatsApp,
            hasPhone,
            score: (hasChatbot ? 40 : 0) + (hasWhatsApp ? 30 : 0) + (hasPhone ? 30 : 0)
        };
    }

    // Verifica responsive design
    checkResponsiveDesign(content) {
        const hasViewport = content.includes('viewport');
        const hasMediaQueries = content.includes('@media') || content.includes('responsive');
        const hasMobileMenu = content.includes('md:hidden') || content.includes('mobile-menu');
        const hasFlexGrid = content.includes('flex') || content.includes('grid');
        
        return {
            hasViewport,
            hasMediaQueries,
            hasMobileMenu,
            hasFlexGrid,
            score: (hasViewport ? 25 : 0) + (hasMediaQueries ? 25 : 0) + (hasMobileMenu ? 25 : 0) + (hasFlexGrid ? 25 : 0)
        };
    }

    // Esegue un singolo step
    async executeStep(step) {
        console.log(`    🔄 ${step.description}...`);
        
        switch (step.action) {
            case 'visit':
                const result = await this.testUrl(step.url);
                const success = result.success && result.status === step.expected;
                
                if (success) {
                    console.log(`    ✅ ${step.description} - ${result.loadTime}ms`);
                } else {
                    console.log(`    ❌ ${step.description} - ${result.status || result.error}`);
                }
                
                return {
                    ...step,
                    result,
                    success,
                    loadTime: result.loadTime
                };
                
            case 'check_form':
                const formResult = await this.testUrl(step.url);
                if (formResult.success) {
                    const formCheck = this.checkFormPresence(formResult.content);
                    const success = formCheck.score >= 75;
                    
                    console.log(`    ${success ? '✅' : '⚠️'} ${step.description} - Score: ${formCheck.score}/100`);
                    
                    return {
                        ...step,
                        result: { ...formResult, formCheck },
                        success,
                        score: formCheck.score
                    };
                }
                break;
                
            case 'check_chatbot':
                const chatbotResult = await this.testUrl(step.url);
                if (chatbotResult.success) {
                    const chatbotCheck = this.checkChatbotPresence(chatbotResult.content);
                    const success = chatbotCheck.score >= 70;
                    
                    console.log(`    ${success ? '✅' : '⚠️'} ${step.description} - Score: ${chatbotCheck.score}/100`);
                    
                    return {
                        ...step,
                        result: { ...chatbotResult, chatbotCheck },
                        success,
                        score: chatbotCheck.score
                    };
                }
                break;
                
            case 'check_responsive':
                const responsiveResult = await this.testUrl(step.url);
                if (responsiveResult.success) {
                    const responsiveCheck = this.checkResponsiveDesign(responsiveResult.content);
                    const success = responsiveCheck.score >= 75;
                    
                    console.log(`    ${success ? '✅' : '⚠️'} ${step.description} - Score: ${responsiveCheck.score}/100`);
                    
                    return {
                        ...step,
                        result: { ...responsiveResult, responsiveCheck },
                        success,
                        score: responsiveCheck.score
                    };
                }
                break;
        }
        
        return {
            ...step,
            success: false,
            error: 'Unknown action or failed to execute'
        };
    }

    // Esegue un user journey completo
    async executeJourney(journey) {
        console.log(`\n🎯 Testing: ${journey.name}`);
        console.log(`📝 ${journey.description}\n`);
        
        const journeyResult = {
            ...journey,
            startTime: Date.now(),
            steps: [],
            success: true,
            totalLoadTime: 0,
            averageLoadTime: 0
        };
        
        for (const step of journey.steps) {
            const stepResult = await this.executeStep(step);
            journeyResult.steps.push(stepResult);
            
            if (stepResult.loadTime) {
                journeyResult.totalLoadTime += stepResult.loadTime;
            }
            
            if (!stepResult.success) {
                journeyResult.success = false;
                this.results.issues.push(`Journey "${journey.name}" failed at step: ${step.description}`);
            }
            
            this.results.summary.totalSteps++;
            if (stepResult.success) {
                this.results.summary.successfulSteps++;
            }
        }
        
        journeyResult.endTime = Date.now();
        journeyResult.duration = journeyResult.endTime - journeyResult.startTime;
        journeyResult.averageLoadTime = journeyResult.totalLoadTime / journey.steps.length;
        
        if (journeyResult.success) {
            this.results.summary.successfulJourneys++;
            console.log(`\n✅ Journey completed successfully in ${journeyResult.duration}ms`);
        } else {
            this.results.summary.failedJourneys++;
            console.log(`\n❌ Journey failed`);
        }
        
        return journeyResult;
    }

    // Testa performance delle pagine principali
    async testPerformance() {
        console.log('\n⚡ Testing Performance...\n');
        
        const pages = ['/', '/servizi.html', '/contatti.html'];
        let totalLoadTime = 0;
        let pageCount = 0;
        
        for (const page of pages) {
            const result = await this.testUrl(page);
            
            if (result.success) {
                totalLoadTime += result.loadTime;
                pageCount++;
                
                const performanceScore = this.calculatePerformanceScore(result);
                
                this.results.performance.push({
                    page,
                    loadTime: result.loadTime,
                    size: result.size,
                    score: performanceScore,
                    meetsTargets: {
                        loadTime: result.loadTime <= PERFORMANCE_TARGETS.loadTime,
                        size: result.size <= 50000 // 50KB target
                    }
                });
                
                console.log(`📄 ${page}: ${result.loadTime}ms - ${(result.size/1024).toFixed(1)}KB - Score: ${performanceScore}/100`);
            }
        }
        
        this.results.summary.averageLoadTime = pageCount > 0 ? Math.round(totalLoadTime / pageCount) : 0;
        this.results.summary.performanceScore = this.calculateOverallPerformanceScore();
        
        console.log(`\n📊 Average Load Time: ${this.results.summary.averageLoadTime}ms`);
        console.log(`📈 Performance Score: ${this.results.summary.performanceScore}/100`);
    }

    // Calcola score performance per singola pagina
    calculatePerformanceScore(result) {
        let score = 0;
        
        // Load time (40 punti)
        if (result.loadTime <= 1000) score += 40;
        else if (result.loadTime <= 2000) score += 30;
        else if (result.loadTime <= 3000) score += 20;
        else score += 10;
        
        // Size (30 punti)
        if (result.size <= 20000) score += 30; // 20KB
        else if (result.size <= 50000) score += 20; // 50KB
        else if (result.size <= 100000) score += 10; // 100KB
        
        // Status code (30 punti)
        if (result.status === 200) score += 30;
        else if (result.status >= 200 && result.status < 400) score += 20;
        
        return Math.min(score, 100);
    }

    // Calcola score performance complessivo
    calculateOverallPerformanceScore() {
        if (this.results.performance.length === 0) return 0;
        
        const totalScore = this.results.performance.reduce((sum, p) => sum + p.score, 0);
        return Math.round(totalScore / this.results.performance.length);
    }

    // Testa funzionalità business-critical
    async testBusinessCritical() {
        console.log('\n💼 Testing Business-Critical Functions...\n');
        
        const criticalTests = [
            {
                name: 'Contact Form Accessibility',
                url: '/contatti.html',
                test: (content) => this.checkFormPresence(content),
                weight: 30
            },
            {
                name: 'Phone Contact Available',
                url: '/',
                test: (content) => ({
                    score: content.includes('039 888 2041') && content.includes('tel:') ? 100 : 0
                }),
                weight: 25
            },
            {
                name: 'Service Pages Accessible',
                url: '/servizi.html',
                test: (content) => ({
                    score: content.includes('Assistenza') && content.includes('IT') ? 100 : 0
                }),
                weight: 20
            },
            {
                name: 'Chatbot/WhatsApp Available',
                url: '/',
                test: (content) => this.checkChatbotPresence(content),
                weight: 25
            }
        ];
        
        let totalWeightedScore = 0;
        let totalWeight = 0;
        
        for (const test of criticalTests) {
            const result = await this.testUrl(test.url);
            
            if (result.success) {
                const testResult = test.test(result.content);
                const weightedScore = (testResult.score * test.weight) / 100;
                
                totalWeightedScore += weightedScore;
                totalWeight += test.weight;
                
                this.results.businessCritical.push({
                    name: test.name,
                    score: testResult.score,
                    weight: test.weight,
                    weightedScore: weightedScore,
                    passed: testResult.score >= 70
                });
                
                console.log(`${testResult.score >= 70 ? '✅' : '❌'} ${test.name}: ${testResult.score}/100 (Weight: ${test.weight}%)`);
            } else {
                console.log(`❌ ${test.name}: Failed to load page`);
                this.results.issues.push(`Business critical test failed: ${test.name}`);
            }
        }
        
        this.results.summary.businessCriticalScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) : 0;
        console.log(`\n💼 Business Critical Score: ${this.results.summary.businessCriticalScore}/100`);
    }

    // Calcola score finale e certificazione
    calculateFinalScore() {
        const journeyScore = this.results.summary.totalSteps > 0 ? 
            (this.results.summary.successfulSteps / this.results.summary.totalSteps) * 100 : 0;
        
        const performanceScore = this.results.summary.performanceScore;
        const businessScore = this.results.summary.businessCriticalScore;
        
        // Weighted average: Journey 40%, Performance 30%, Business 30%
        const overallScore = Math.round(
            (journeyScore * 0.4) + 
            (performanceScore * 0.3) + 
            (businessScore * 0.3)
        );
        
        this.results.summary.overallScore = overallScore;
        
        // Determina grade e certificazione
        let grade, passed;
        if (overallScore >= 90) { grade = 'A+'; passed = true; }
        else if (overallScore >= 85) { grade = 'A'; passed = true; }
        else if (overallScore >= 80) { grade = 'B+'; passed = true; }
        else if (overallScore >= 75) { grade = 'B'; passed = true; }
        else if (overallScore >= 70) { grade = 'C+'; passed = true; }
        else if (overallScore >= 65) { grade = 'C'; passed = false; }
        else if (overallScore >= 60) { grade = 'D'; passed = false; }
        else { grade = 'F'; passed = false; }
        
        this.results.certification = {
            passed,
            grade,
            score: overallScore,
            requirements: [
                { name: 'User Journey Success', score: Math.round(journeyScore), required: 80, passed: journeyScore >= 80 },
                { name: 'Performance Optimization', score: performanceScore, required: 75, passed: performanceScore >= 75 },
                { name: 'Business Critical Functions', score: businessScore, required: 85, passed: businessScore >= 85 },
                { name: 'Zero Critical Issues', score: this.results.issues.length === 0 ? 100 : 0, required: 100, passed: this.results.issues.length === 0 }
            ]
        };
    }

    // Genera raccomandazioni finali
    generateFinalRecommendations() {
        // Raccomandazioni basate sui risultati
        if (this.results.summary.failedJourneys > 0) {
            this.results.recommendations.push({
                priority: 'Critical',
                category: 'User Experience',
                issue: `${this.results.summary.failedJourneys} user journeys failed`,
                solution: 'Fix broken navigation paths and ensure all critical pages are accessible'
            });
        }
        
        if (this.results.summary.performanceScore < 80) {
            this.results.recommendations.push({
                priority: 'High',
                category: 'Performance',
                issue: `Performance score below target: ${this.results.summary.performanceScore}/100`,
                solution: 'Optimize images, minify CSS/JS, implement caching strategies'
            });
        }
        
        if (this.results.summary.businessCriticalScore < 85) {
            this.results.recommendations.push({
                priority: 'High',
                category: 'Business Critical',
                issue: `Business functions score below target: ${this.results.summary.businessCriticalScore}/100`,
                solution: 'Ensure contact forms, phone numbers, and chatbot are fully functional'
            });
        }
        
        if (this.results.issues.length > 0) {
            this.results.recommendations.push({
                priority: 'Medium',
                category: 'Quality Assurance',
                issue: `${this.results.issues.length} issues found during testing`,
                solution: 'Review and fix all identified issues before production deployment'
            });
        }
    }

    // Esegue tutti i test end-to-end
    async runAllTests() {
        console.log('🎯 END-TO-END TESTING - IT-ERA WEBSITE');
        console.log('=====================================');
        
        // Esegui user journeys
        for (const journey of USER_JOURNEYS) {
            const journeyResult = await this.executeJourney(journey);
            this.results.journeys.push(journeyResult);
        }
        
        // Test performance
        await this.testPerformance();
        
        // Test business critical
        await this.testBusinessCritical();
        
        // Calcola score finale
        this.calculateFinalScore();
        
        // Genera raccomandazioni
        this.generateFinalRecommendations();
        
        // Salva report e stampa riassunto
        this.saveReport();
        this.printFinalSummary();
    }

    // Salva il report
    saveReport() {
        fs.writeFileSync(REPORT_FILE, JSON.stringify(this.results, null, 2));
        console.log(`\n📊 Report completo salvato in: ${REPORT_FILE}`);
    }

    // Stampa riassunto finale
    printFinalSummary() {
        console.log('\n🏆 FINAL CERTIFICATION REPORT');
        console.log('==============================');
        console.log(`🎯 Overall Score: ${this.results.summary.overallScore}/100`);
        console.log(`🏅 Grade: ${this.results.certification.grade}`);
        console.log(`✅ Certification: ${this.results.certification.passed ? 'PASSED' : 'FAILED'}`);
        
        console.log('\n📊 DETAILED SCORES:');
        console.log(`🛤️  User Journeys: ${this.results.summary.successfulJourneys}/${this.results.summary.totalJourneys} successful`);
        console.log(`⚡ Performance: ${this.results.summary.performanceScore}/100`);
        console.log(`💼 Business Critical: ${this.results.summary.businessCriticalScore}/100`);
        console.log(`⚠️  Issues Found: ${this.results.issues.length}`);
        
        if (this.results.certification.requirements.length > 0) {
            console.log('\n📋 CERTIFICATION REQUIREMENTS:');
            this.results.certification.requirements.forEach(req => {
                console.log(`${req.passed ? '✅' : '❌'} ${req.name}: ${req.score}/${req.required}`);
            });
        }
        
        if (this.results.recommendations.length > 0) {
            console.log('\n💡 TOP RECOMMENDATIONS:');
            this.results.recommendations.slice(0, 5).forEach((rec, i) => {
                console.log(`${i + 1}. [${rec.priority}] ${rec.issue}`);
            });
        }
        
        console.log('\n🎉 END-TO-END TESTING COMPLETED!');
    }
}

// Esegui tutti i test
const tester = new EndToEndTester();
tester.runAllTests().catch(console.error);
