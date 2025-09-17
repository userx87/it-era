#!/usr/bin/env node

/**
 * IT-ERA Validate Fixes Effectiveness
 * Valida l'efficacia delle correzioni applicate
 */

const { execSync } = require('child_process');
const fs = require('fs');

class FixesEffectivenessValidator {
    constructor() {
        this.originalAnalysis = null;
        this.newAnalysis = null;
        this.improvements = [];
        this.regressions = [];
    }
    
    // Carica l'analisi originale
    loadOriginalAnalysis() {
        try {
            const data = fs.readFileSync('comprehensive-sitemap-analysis.json', 'utf8');
            this.originalAnalysis = JSON.parse(data);
            console.log(`📊 Loaded original analysis for ${this.originalAnalysis.results.length} pages`);
            return true;
        } catch (error) {
            console.error('❌ Error loading original analysis:', error.message);
            return false;
        }
    }
    
    // Esegui nuova analisi per confronto
    async runNewAnalysis() {
        console.log('🔄 Running new analysis to validate fixes...');
        
        try {
            // Esegui l'analizzatore per le pagine corrette
            const fixedPages = [
                'https://it-era.it',
                'https://it-era.it/contatti.html',
                'https://it-era.it/servizi-it/computer-non-si-accende-milano.html',
                'https://it-era.it/servizi-it/computer-non-si-accende-bergamo.html',
                'https://it-era.it/servizi-it/computer-non-si-accende-brescia.html'
            ];
            
            const newResults = [];
            
            for (const url of fixedPages) {
                console.log(`🔍 Re-analyzing: ${url}`);
                const result = await this.analyzePageAfterFixes(url);
                newResults.push(result);
            }
            
            this.newAnalysis = {
                timestamp: new Date().toISOString(),
                results: newResults
            };
            
            return true;
            
        } catch (error) {
            console.error('❌ Error running new analysis:', error.message);
            return false;
        }
    }
    
    // Analizza una pagina dopo le correzioni
    async analyzePageAfterFixes(url) {
        try {
            const content = execSync(`curl -s -m 10 "${url}"`, { encoding: 'utf8' });
            
            if (!content || content.includes('404') || content.length < 500) {
                return {
                    url,
                    status: 'FAILED',
                    scores: { linkValidity: 0, formFunctionality: 0, uxDesign: 0, menuNavigation: 0, conversionOptimization: 0, overall: 0 },
                    hasForm: false,
                    hasResend: false,
                    hasEmergencyContact: false,
                    hasMenu: false,
                    hasCTA: false
                };
            }
            
            // Analisi migliorata post-correzioni
            const scores = {
                linkValidity: this.analyzeLinkValidity(content),
                formFunctionality: this.analyzeFormFunctionality(content),
                uxDesign: this.analyzeUXDesign(content),
                menuNavigation: this.analyzeMenuNavigation(content),
                conversionOptimization: this.analyzeConversionOptimization(content)
            };
            
            scores.overall = Math.round(
                (scores.linkValidity * 0.25 + 
                 scores.formFunctionality * 0.25 + 
                 scores.uxDesign * 0.20 + 
                 scores.menuNavigation * 0.15 + 
                 scores.conversionOptimization * 0.15)
            );
            
            const status = scores.overall >= 90 ? 'EXCELLENT' : 
                          scores.overall >= 80 ? 'GOOD' : 
                          scores.overall >= 70 ? 'WARNING' : 'FAILED';
            
            return {
                url,
                status,
                scores,
                hasForm: content.includes('<form'),
                hasResend: content.includes('data-resend="true"'),
                hasEmergencyContact: content.includes('039 888 2041'),
                hasMenu: content.includes('<nav') || content.includes('navigation'),
                hasCTA: content.includes('btn') || content.includes('button'),
                contentLength: content.length
            };
            
        } catch (error) {
            return {
                url,
                status: 'ERROR',
                scores: { linkValidity: 0, formFunctionality: 0, uxDesign: 0, menuNavigation: 0, conversionOptimization: 0, overall: 0 },
                error: error.message
            };
        }
    }
    
    // Analisi validità link migliorata
    analyzeLinkValidity(content) {
        let score = 0;
        
        if (content.includes('<!DOCTYPE html>') && content.includes('<html') && content.includes('</html>')) score += 30;
        if (content.length > 5000) score += 30;
        else if (content.length > 2000) score += 20;
        if (!content.includes('404') && !content.includes('Not Found')) score += 20;
        if (content.includes('<title>') && content.includes('meta name="description"')) score += 20;
        
        return Math.min(score, 100);
    }
    
    // Analisi funzionalità form migliorata
    analyzeFormFunctionality(content) {
        let score = 0;
        
        if (content.includes('<form')) score += 25;
        if (content.includes('data-resend="true"')) score += 35;
        else if (content.includes('data-resend')) score += 20;
        if (content.includes('required') && content.includes('validation')) score += 25;
        else if (content.includes('required')) score += 15;
        if (content.includes('type="submit"') || content.includes('button')) score += 15;
        
        return Math.min(score, 100);
    }
    
    // Analisi UX design migliorata
    analyzeUXDesign(content) {
        let score = 0;
        
        if (content.includes('viewport') && content.includes('responsive')) score += 25;
        else if (content.includes('viewport')) score += 15;
        if (content.includes('tailwind') || content.includes('bootstrap') || content.includes('.css')) score += 25;
        if (content.includes('IT-ERA') && content.includes('logo')) score += 25;
        if (content.includes('async') || content.includes('defer') || content.includes('cdn')) score += 15;
        if (content.includes('animation') || content.includes('transition')) score += 10;
        
        return Math.min(score, 100);
    }
    
    // Analisi navigazione menu migliorata
    analyzeMenuNavigation(content) {
        let score = 0;
        
        if (content.includes('<nav') || content.includes('navigation')) score += 40;
        else if (content.includes('menu')) score += 25;
        
        const internalLinks = (content.match(/href="\/[^"]*"/g) || []).length;
        if (internalLinks > 15) score += 30;
        else if (internalLinks > 10) score += 25;
        else if (internalLinks > 5) score += 15;
        else if (internalLinks > 0) score += 10;
        
        if (content.includes('mobile') && (content.includes('menu') || content.includes('hamburger'))) score += 30;
        
        return Math.min(score, 100);
    }
    
    // Analisi ottimizzazione conversioni migliorata
    analyzeConversionOptimization(content) {
        let score = 0;
        
        const ctaCount = (content.match(/btn|button|CTA/gi) || []).length;
        if (ctaCount > 8) score += 30;
        else if (ctaCount > 5) score += 25;
        else if (ctaCount > 2) score += 15;
        else if (ctaCount > 0) score += 10;
        
        if (content.includes('039 888 2041') && content.includes('info@')) score += 25;
        else if (content.includes('039 888 2041')) score += 15;
        
        if (content.includes('emergenza') || content.includes('emergency')) score += 20;
        
        if (content.includes('form') && content.includes('lead')) score += 15;
        else if (content.includes('form')) score += 10;
        
        if (content.includes('WhatsApp') || content.includes('wa.me')) score += 10;
        
        return Math.min(score, 100);
    }
    
    // Confronta risultati prima e dopo
    compareResults() {
        if (!this.originalAnalysis || !this.newAnalysis) {
            console.error('❌ Missing analysis data for comparison');
            return;
        }
        
        console.log('\n📊 COMPARING BEFORE/AFTER RESULTS');
        console.log('==================================');
        
        this.newAnalysis.results.forEach(newResult => {
            const originalResult = this.originalAnalysis.results.find(r => r.url === newResult.url);
            
            if (originalResult) {
                const improvement = this.calculateImprovement(originalResult, newResult);
                
                if (improvement.overall > 0) {
                    this.improvements.push(improvement);
                } else if (improvement.overall < 0) {
                    this.regressions.push(improvement);
                }
                
                this.displayComparison(originalResult, newResult, improvement);
            }
        });
        
        this.generateEffectivenessReport();
    }
    
    // Calcola miglioramento
    calculateImprovement(original, updated) {
        return {
            url: updated.url,
            overall: updated.scores.overall - original.scores.overall,
            linkValidity: updated.scores.linkValidity - original.scores.linkValidity,
            formFunctionality: updated.scores.formFunctionality - original.scores.formFunctionality,
            uxDesign: updated.scores.uxDesign - original.scores.uxDesign,
            menuNavigation: updated.scores.menuNavigation - original.scores.menuNavigation,
            conversionOptimization: updated.scores.conversionOptimization - original.scores.conversionOptimization,
            statusChange: `${original.status} → ${updated.status}`,
            originalScores: original.scores,
            updatedScores: updated.scores
        };
    }
    
    // Mostra confronto
    displayComparison(original, updated, improvement) {
        const arrow = improvement.overall > 0 ? '📈' : improvement.overall < 0 ? '📉' : '➡️';
        const color = improvement.overall > 0 ? '✅' : improvement.overall < 0 ? '❌' : '⚪';
        
        console.log(`\n${color} ${updated.url}`);
        console.log(`   Status: ${improvement.statusChange}`);
        console.log(`   Overall: ${original.scores.overall}% → ${updated.scores.overall}% (${improvement.overall > 0 ? '+' : ''}${improvement.overall}%) ${arrow}`);
        
        if (Math.abs(improvement.formFunctionality) > 0) {
            console.log(`   Form: ${original.scores.formFunctionality}% → ${updated.scores.formFunctionality}% (${improvement.formFunctionality > 0 ? '+' : ''}${improvement.formFunctionality}%)`);
        }
        
        if (Math.abs(improvement.menuNavigation) > 0) {
            console.log(`   Menu: ${original.scores.menuNavigation}% → ${updated.scores.menuNavigation}% (${improvement.menuNavigation > 0 ? '+' : ''}${improvement.menuNavigation}%)`);
        }
        
        if (Math.abs(improvement.conversionOptimization) > 0) {
            console.log(`   Conversion: ${original.scores.conversionOptimization}% → ${updated.scores.conversionOptimization}% (${improvement.conversionOptimization > 0 ? '+' : ''}${improvement.conversionOptimization}%)`);
        }
    }
    
    // Genera report efficacia
    generateEffectivenessReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                pagesAnalyzed: this.newAnalysis.results.length,
                improvements: this.improvements.length,
                regressions: this.regressions.length,
                averageImprovement: this.improvements.length > 0 ? 
                    Math.round(this.improvements.reduce((sum, imp) => sum + imp.overall, 0) / this.improvements.length) : 0,
                totalImprovementPoints: this.improvements.reduce((sum, imp) => sum + imp.overall, 0)
            },
            improvements: this.improvements,
            regressions: this.regressions,
            detailedComparison: this.newAnalysis.results.map(newResult => {
                const originalResult = this.originalAnalysis.results.find(r => r.url === newResult.url);
                return originalResult ? this.calculateImprovement(originalResult, newResult) : null;
            }).filter(Boolean)
        };
        
        fs.writeFileSync('fixes-effectiveness-report.json', JSON.stringify(report, null, 2));
        
        console.log('\n📊 FIXES EFFECTIVENESS SUMMARY');
        console.log('===============================');
        console.log(`Pages Analyzed: ${report.summary.pagesAnalyzed}`);
        console.log(`✅ Improvements: ${report.summary.improvements}`);
        console.log(`❌ Regressions: ${report.summary.regressions}`);
        console.log(`📈 Average Improvement: +${report.summary.averageImprovement} points`);
        console.log(`🎯 Total Improvement: +${report.summary.totalImprovementPoints} points`);
        
        if (this.improvements.length > 0) {
            console.log('\n🏆 TOP IMPROVEMENTS:');
            this.improvements
                .sort((a, b) => b.overall - a.overall)
                .slice(0, 3)
                .forEach(imp => {
                    console.log(`  ${imp.url}: +${imp.overall} points`);
                });
        }
        
        console.log('\n💾 Detailed report saved to: fixes-effectiveness-report.json');
        
        return report;
    }
    
    // Esegui validazione completa
    async runCompleteValidation() {
        console.log('🎯 Starting fixes effectiveness validation...\n');
        
        if (!this.loadOriginalAnalysis()) return;
        
        if (!await this.runNewAnalysis()) return;
        
        this.compareResults();
        
        console.log('\n🎉 Fixes effectiveness validation completed!');
    }
}

// Esegui se chiamato direttamente
if (require.main === module) {
    const validator = new FixesEffectivenessValidator();
    validator.runCompleteValidation()
        .then(() => {
            console.log('\n✅ Validation completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Validation failed:', error);
            process.exit(1);
        });
}

module.exports = FixesEffectivenessValidator;
