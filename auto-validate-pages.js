#!/usr/bin/env node

/**
 * IT-ERA Automated Page Validation System
 * Valida automaticamente le pagine con i 3 step: Visual, Code, Contact/Resend
 */

const { execSync } = require('child_process');
const fs = require('fs');

class AutoPageValidator {
    constructor() {
        this.results = [];
        this.baseUrl = 'https://it-era.it';
        
        // Criteri di validazione
        this.validationCriteria = {
            visual: {
                responsive: ['viewport', 'mobile-first'],
                branding: ['IT-ERA', 'logo'],
                navigation: ['menu', 'nav'],
                cta: ['button', 'btn', 'CTA'],
                emergency: ['039 888 2041', '0398882041', 'emergency']
            },
            code: {
                html: ['<!DOCTYPE html>', '<html lang="it">', '<meta charset="UTF-8">'],
                meta: ['<title>', '<meta name="description"', '<meta name="keywords"'],
                og: ['og:title', 'og:description', 'og:type'],
                schema: ['application/ld+json', 'LocalBusiness', 'Service'],
                analytics: ['ITERAAnalytics', 'trackPageView', 'trackEvent']
            },
            contact: {
                forms: ['<form', 'data-resend', 'contact-form'],
                resend: ['data-resend="true"', 'ITERAResendIntegration', 'sendToResend'],
                emergency: ['tel:+390398882041', '039 888 2041', 'emergency'],
                validation: ['required', 'validation', 'error handling']
            }
        };
    }
    
    // Valida una singola pagina
    async validatePage(url) {
        console.log(`🔍 Validating: ${url}`);
        
        try {
            // Fetch page content
            const content = execSync(`curl -s "${url}"`, { encoding: 'utf8', timeout: 10000 });
            
            if (!content || content.includes('404') || content.includes('Not Found')) {
                return {
                    url,
                    status: 'FAILED',
                    error: '404 Not Found',
                    scores: { visual: 0, code: 0, contact: 0, overall: 0 }
                };
            }
            
            // Validate each step
            const visualScore = this.validateVisual(content, url);
            const codeScore = this.validateCode(content, url);
            const contactScore = this.validateContact(content, url);
            
            const overallScore = Math.round((visualScore + codeScore + contactScore) / 3);
            const status = overallScore >= 90 ? 'PASSED' : overallScore >= 70 ? 'WARNING' : 'FAILED';
            
            return {
                url,
                status,
                scores: {
                    visual: visualScore,
                    code: codeScore,
                    contact: contactScore,
                    overall: overallScore
                },
                details: this.getValidationDetails(content, url)
            };
            
        } catch (error) {
            console.error(`❌ Error validating ${url}:`, error.message);
            return {
                url,
                status: 'ERROR',
                error: error.message,
                scores: { visual: 0, code: 0, contact: 0, overall: 0 }
            };
        }
    }
    
    // STEP 1 - Visual Validation
    validateVisual(content, url) {
        let score = 0;
        const criteria = this.validationCriteria.visual;
        
        // Responsive design (20 points)
        if (criteria.responsive.some(term => content.includes(term))) {
            score += 20;
        }
        
        // Branding (20 points)
        if (criteria.branding.some(term => content.includes(term))) {
            score += 20;
        }
        
        // Navigation (20 points)
        if (criteria.navigation.some(term => content.includes(term))) {
            score += 20;
        }
        
        // CTA buttons (20 points)
        if (criteria.cta.some(term => content.includes(term))) {
            score += 20;
        }
        
        // Emergency contact (20 points)
        if (criteria.emergency.some(term => content.includes(term))) {
            score += 20;
        }
        
        return Math.min(score, 100);
    }
    
    // STEP 2 - Code Validation
    validateCode(content, url) {
        let score = 0;
        const criteria = this.validationCriteria.code;
        
        // HTML structure (20 points)
        if (criteria.html.every(term => content.includes(term))) {
            score += 20;
        }
        
        // Meta tags (25 points)
        const metaCount = criteria.meta.filter(term => content.includes(term)).length;
        score += Math.round((metaCount / criteria.meta.length) * 25);
        
        // Open Graph (20 points)
        const ogCount = criteria.og.filter(term => content.includes(term)).length;
        score += Math.round((ogCount / criteria.og.length) * 20);
        
        // Structured data (20 points)
        if (criteria.schema.some(term => content.includes(term))) {
            score += 20;
        }
        
        // Analytics (15 points)
        if (criteria.analytics.some(term => content.includes(term))) {
            score += 15;
        }
        
        return Math.min(score, 100);
    }
    
    // STEP 3 - Contact/Resend Validation
    validateContact(content, url) {
        let score = 0;
        const criteria = this.validationCriteria.contact;
        
        // Forms present (25 points)
        if (criteria.forms.some(term => content.includes(term))) {
            score += 25;
        }
        
        // Resend integration (30 points)
        const resendCount = criteria.resend.filter(term => content.includes(term)).length;
        score += Math.round((resendCount / criteria.resend.length) * 30);
        
        // Emergency contact (25 points)
        if (criteria.emergency.some(term => content.includes(term))) {
            score += 25;
        }
        
        // Validation (20 points)
        if (criteria.validation.some(term => content.includes(term))) {
            score += 20;
        }
        
        return Math.min(score, 100);
    }
    
    // Get detailed validation info
    getValidationDetails(content, url) {
        const details = {
            hasTitle: content.includes('<title>'),
            hasDescription: content.includes('meta name="description"'),
            hasSchema: content.includes('application/ld+json'),
            hasForm: content.includes('<form'),
            hasResend: content.includes('data-resend="true"'),
            hasEmergencyPhone: content.includes('039 888 2041'),
            hasAnalytics: content.includes('ITERAAnalytics'),
            isResponsive: content.includes('viewport'),
            hasOG: content.includes('og:title')
        };
        
        return details;
    }
    
    // Valida batch di pagine
    async validateBatch(urls) {
        console.log(`🚀 Starting batch validation of ${urls.length} pages...\n`);
        
        const results = [];
        
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            console.log(`[${i + 1}/${urls.length}] Validating: ${url}`);
            
            const result = await this.validatePage(url);
            results.push(result);
            
            // Progress indicator
            const status = result.status === 'PASSED' ? '✅' : 
                          result.status === 'WARNING' ? '⚠️' : '❌';
            console.log(`  ${status} ${result.status} (${result.scores.overall}%)\n`);
            
            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return results;
    }
    
    // Genera report di validazione
    generateReport(results) {
        const passed = results.filter(r => r.status === 'PASSED').length;
        const warning = results.filter(r => r.status === 'WARNING').length;
        const failed = results.filter(r => r.status === 'FAILED').length;
        const errors = results.filter(r => r.status === 'ERROR').length;
        
        const avgScores = {
            visual: Math.round(results.reduce((sum, r) => sum + r.scores.visual, 0) / results.length),
            code: Math.round(results.reduce((sum, r) => sum + r.scores.code, 0) / results.length),
            contact: Math.round(results.reduce((sum, r) => sum + r.scores.contact, 0) / results.length),
            overall: Math.round(results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length)
        };
        
        const report = {
            summary: {
                total: results.length,
                passed: passed,
                warning: warning,
                failed: failed,
                errors: errors,
                successRate: Math.round((passed / results.length) * 100)
            },
            averageScores: avgScores,
            results: results,
            timestamp: new Date().toISOString()
        };
        
        // Save report
        fs.writeFileSync('validation-report.json', JSON.stringify(report, null, 2));
        
        // Console summary
        console.log('\n📊 VALIDATION REPORT SUMMARY');
        console.log('================================');
        console.log(`Total Pages: ${report.summary.total}`);
        console.log(`✅ Passed: ${passed} (${Math.round((passed/results.length)*100)}%)`);
        console.log(`⚠️ Warning: ${warning} (${Math.round((warning/results.length)*100)}%)`);
        console.log(`❌ Failed: ${failed} (${Math.round((failed/results.length)*100)}%)`);
        console.log(`🚫 Errors: ${errors} (${Math.round((errors/results.length)*100)}%)`);
        console.log(`\n📈 Average Scores:`);
        console.log(`Visual: ${avgScores.visual}%`);
        console.log(`Code: ${avgScores.code}%`);
        console.log(`Contact: ${avgScores.contact}%`);
        console.log(`Overall: ${avgScores.overall}%`);
        console.log(`\n💾 Detailed report saved to: validation-report.json`);
        
        return report;
    }
    
    // Valida le pagine critiche
    async validateCriticalPages() {
        const criticalPages = [
            'https://it-era.it',
            'https://it-era.it/contatti.html',
            'https://it-era.it/servizi-it/computer-non-si-accende-milano.html',
            'https://it-era.it/servizi-it/computer-non-si-accende-bergamo.html',
            'https://it-era.it/servizi-it/computer-non-si-accende-brescia.html',
            'https://it-era.it/landing/assistenza-emergenza.html',
            'https://it-era.it/landing/cloud-migration.html',
            'https://it-era.it/landing/sicurezza-informatica.html',
            'https://it-era.it/settori/commercialisti.html',
            'https://it-era.it/settori/studi-medici.html'
        ];
        
        console.log('🔴 CRITICAL PAGES VALIDATION\n');
        const results = await this.validateBatch(criticalPages);
        return this.generateReport(results);
    }
}

// Esegui se chiamato direttamente
if (require.main === module) {
    const validator = new AutoPageValidator();
    validator.validateCriticalPages()
        .then(report => {
            console.log('\n🎉 Critical pages validation completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Validation failed:', error);
            process.exit(1);
        });
}

module.exports = AutoPageValidator;
