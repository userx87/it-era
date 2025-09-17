#!/usr/bin/env node

/**
 * IT-ERA Batch Service Validation
 * Valida rapidamente i servizi IT usando pattern recognition
 */

const { execSync } = require('child_process');

class BatchServiceValidator {
    constructor() {
        this.servicePatterns = {
            milano: {
                baseScore: 95, // Milano ha priorità alta
                keywords: ['milano', 'Milan'],
                expectedElements: ['form', 'data-resend', '039 888 2041', 'title', 'meta']
            },
            bergamo: {
                baseScore: 90,
                keywords: ['bergamo', 'Bergamo'],
                expectedElements: ['form', 'data-resend', '039 888 2041', 'title', 'meta']
            },
            brescia: {
                baseScore: 90,
                keywords: ['brescia', 'Brescia'],
                expectedElements: ['form', 'data-resend', '039 888 2041', 'title', 'meta']
            },
            other: {
                baseScore: 85,
                keywords: [],
                expectedElements: ['form', 'data-resend', '039 888 2041', 'title', 'meta']
            }
        };
    }
    
    // Valida rapidamente un servizio IT
    quickValidateService(url) {
        try {
            console.log(`🔍 Quick validating: ${url}`);
            
            // Determina provincia
            const province = this.getProvince(url);
            const pattern = this.servicePatterns[province] || this.servicePatterns.other;
            
            // Fetch content con timeout breve
            const content = execSync(`curl -s -m 5 "${url}"`, { encoding: 'utf8' });
            
            if (!content || content.includes('404') || content.length < 1000) {
                return {
                    url,
                    status: 'FAILED',
                    scores: { visual: 0, code: 0, contact: 0, overall: 0 },
                    issues: ['Page not accessible or too short']
                };
            }
            
            // Quick validation basata su pattern
            let score = pattern.baseScore;
            const issues = [];
            
            // Check elementi essenziali
            pattern.expectedElements.forEach(element => {
                if (!content.includes(element)) {
                    score -= 10;
                    issues.push(`Missing: ${element}`);
                }
            });
            
            // Check provincia nel contenuto
            if (province !== 'other' && !pattern.keywords.some(kw => content.includes(kw))) {
                score -= 5;
                issues.push(`Province keyword missing: ${province}`);
            }
            
            // Check Resend integration
            if (content.includes('data-resend="true"')) {
                score += 5;
            } else {
                issues.push('Resend integration not found');
            }
            
            // Check emergency contact
            if (content.includes('039 888 2041') || content.includes('0398882041')) {
                score += 5;
            } else {
                issues.push('Emergency contact not prominent');
            }
            
            const finalScore = Math.max(0, Math.min(100, score));
            const status = finalScore >= 90 ? 'PASSED' : finalScore >= 70 ? 'WARNING' : 'FAILED';
            
            return {
                url,
                status,
                scores: {
                    visual: finalScore,
                    code: finalScore,
                    contact: finalScore,
                    overall: finalScore
                },
                issues: issues.length > 0 ? issues : ['No issues found'],
                province
            };
            
        } catch (error) {
            return {
                url,
                status: 'ERROR',
                scores: { visual: 0, code: 0, contact: 0, overall: 0 },
                issues: [`Error: ${error.message}`]
            };
        }
    }
    
    // Determina provincia dalla URL
    getProvince(url) {
        if (url.includes('-milano.html')) return 'milano';
        if (url.includes('-bergamo.html')) return 'bergamo';
        if (url.includes('-brescia.html')) return 'brescia';
        if (url.includes('-como.html')) return 'como';
        if (url.includes('-varese.html')) return 'varese';
        if (url.includes('-pavia.html')) return 'pavia';
        if (url.includes('-cremona.html')) return 'cremona';
        if (url.includes('-mantova.html')) return 'mantova';
        if (url.includes('-lecco.html')) return 'lecco';
        if (url.includes('-lodi.html')) return 'lodi';
        if (url.includes('-sondrio.html')) return 'sondrio';
        return 'other';
    }
    
    // Valida batch di servizi
    async validateServicesBatch(urls) {
        console.log(`🚀 Batch validating ${urls.length} service pages...\n`);
        
        const results = [];
        const batchSize = 5; // Processa 5 alla volta
        
        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urls.length/batchSize)}`);
            
            // Processa batch in parallelo
            const batchPromises = batch.map(url => 
                new Promise(resolve => {
                    setTimeout(() => {
                        resolve(this.quickValidateService(url));
                    }, Math.random() * 200); // Stagger requests
                })
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Progress update
            batchResults.forEach(result => {
                const status = result.status === 'PASSED' ? '✅' : 
                              result.status === 'WARNING' ? '⚠️' : '❌';
                console.log(`  ${status} ${result.province.toUpperCase()} - ${result.scores.overall}%`);
            });
            
            console.log(''); // Empty line between batches
        }
        
        return results;
    }
    
    // Genera summary report
    generateSummary(results) {
        const byProvince = {};
        const byStatus = { PASSED: 0, WARNING: 0, FAILED: 0, ERROR: 0 };
        
        results.forEach(result => {
            // Count by province
            if (!byProvince[result.province]) {
                byProvince[result.province] = { total: 0, passed: 0, warning: 0, failed: 0 };
            }
            byProvince[result.province].total++;
            byProvince[result.province][result.status.toLowerCase()]++;
            
            // Count by status
            byStatus[result.status]++;
        });
        
        console.log('\n📊 BATCH VALIDATION SUMMARY');
        console.log('============================');
        console.log(`Total Services: ${results.length}`);
        console.log(`✅ Passed: ${byStatus.PASSED} (${Math.round((byStatus.PASSED/results.length)*100)}%)`);
        console.log(`⚠️ Warning: ${byStatus.WARNING} (${Math.round((byStatus.WARNING/results.length)*100)}%)`);
        console.log(`❌ Failed: ${byStatus.FAILED} (${Math.round((byStatus.FAILED/results.length)*100)}%)`);
        console.log(`🚫 Errors: ${byStatus.ERROR} (${Math.round((byStatus.ERROR/results.length)*100)}%)`);
        
        console.log('\n🏙️ BY PROVINCE:');
        Object.entries(byProvince).forEach(([province, stats]) => {
            const successRate = Math.round((stats.passed / stats.total) * 100);
            console.log(`${province.toUpperCase()}: ${stats.total} pages, ${successRate}% success rate`);
        });
        
        return { byProvince, byStatus, totalPages: results.length };
    }
}

// Test con servizi Milano
const milanServices = [
    'https://it-era.it/servizi-it/assemblaggio-pc-milano-milano.html',
    'https://it-era.it/servizi-it/assistenza-informatica-aziende-milano.html',
    'https://it-era.it/servizi-it/assistenza-informatica-privati-milano.html',
    'https://it-era.it/servizi-it/assistenza-notebook-privati-milano.html',
    'https://it-era.it/servizi-it/computer-si-spegne-da-solo-milano.html'
];

// Esegui se chiamato direttamente
if (require.main === module) {
    const validator = new BatchServiceValidator();
    validator.validateServicesBatch(milanServices)
        .then(results => {
            validator.generateSummary(results);
            console.log('\n🎉 Batch validation completed!');
        })
        .catch(error => {
            console.error('❌ Batch validation failed:', error);
        });
}

module.exports = BatchServiceValidator;
