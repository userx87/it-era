#!/usr/bin/env node

/**
 * PC Repair Pages Quality Verification Script
 * Verifies the quality and completeness of generated PC repair pages
 */

const fs = require('fs').promises;
const path = require('path');

class PCRepairPagesVerifier {
    constructor() {
        this.baseDir = '/Users/andreapanzeri/progetti/IT-ERA';
        this.outputDir = path.join(this.baseDir, 'web/pages');
        this.dataPath = path.join(this.baseDir, 'data/lombardy-complete-official.json');
        
        this.checks = {
            templatePlaceholders: 0,
            missingFiles: [],
            contentIssues: [],
            seoIssues: [],
            validPages: 0,
            totalExpected: 0
        };
    }

    /**
     * Initialize verifier
     */
    async initialize() {
        console.log('🔍 Initializing PC Repair Pages Verifier...');
        
        try {
            // Load expected data
            const dataContent = await fs.readFile(this.dataPath, 'utf8');
            this.lombardyData = JSON.parse(dataContent);
            this.checks.totalExpected = this.lombardyData.total_municipalities;
            
            console.log(`✅ Verification initialized - expecting ${this.checks.totalExpected} pages`);
            
        } catch (error) {
            console.error('❌ Verification initialization failed:', error);
            throw error;
        }
    }

    /**
     * Generate slug (must match generator)
     */
    generateSlug(cityName) {
        return cityName
            .toLowerCase()
            .replace(/[àáâäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôöø]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[ñ]/g, 'n')
            .replace(/'/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Verify individual page content
     */
    async verifyPageContent(filePath, city, province) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const issues = [];
            
            // Check for unprocessed placeholders
            const placeholders = content.match(/\{\{[^}]+\}\}/g);
            if (placeholders) {
                this.checks.templatePlaceholders += placeholders.length;
                issues.push(`Unprocessed placeholders: ${placeholders.join(', ')}`);
            }
            
            // Check essential content
            if (!content.includes(city.name)) {
                issues.push('City name not found in content');
            }
            
            if (!content.includes('Lombardia')) {
                issues.push('Region not properly set');
            }
            
            // SEO checks
            if (!content.includes(`<title>Riparazione PC ${city.name}`)) {
                this.checks.seoIssues.push(`${city.name}: Missing proper title tag`);
            }
            
            // Check for meta description with regex
            const metaDescriptionRegex = /<meta[^>]+name=["\']description["\'][^>]*>/i;
            const metaDescMatch = content.match(metaDescriptionRegex);
            if (!metaDescMatch || !metaDescMatch[0].includes(city.name)) {
                this.checks.seoIssues.push(`${city.name}: Missing proper meta description`);
            }
            
            // Check for corrected content (no "gratuito", proper services)
            if (content.includes('gratuito')) {
                issues.push('Contains "gratuito" references (should be removed)');
            }
            
            if (!content.includes('Assistenza presso di noi')) {
                issues.push('Missing "Assistenza presso di noi" service');
            }
            
            if (issues.length > 0) {
                this.checks.contentIssues.push({
                    city: city.name,
                    province: province,
                    issues: issues
                });
            } else {
                this.checks.validPages++;
            }
            
            return {
                valid: issues.length === 0,
                issues: issues,
                size: content.length
            };
            
        } catch (error) {
            this.checks.contentIssues.push({
                city: city.name,
                province: province,
                issues: [`File read error: ${error.message}`]
            });
            
            return {
                valid: false,
                issues: [error.message],
                size: 0
            };
        }
    }

    /**
     * Verify all generated pages
     */
    async verifyAllPages() {
        console.log('\n🔍 Verifying all PC repair pages...');
        
        const results = [];
        let totalChecked = 0;
        
        for (const [province, cities] of Object.entries(this.lombardyData.provinces)) {
            console.log(`\n📍 Verifying ${province} (${cities.length} cities)...`);
            
            for (const city of cities) {
                const citySlug = this.generateSlug(city.name);
                const fileName = `riparazione-pc-${citySlug}.html`;
                const filePath = path.join(this.outputDir, fileName);
                
                try {
                    await fs.access(filePath);
                    const verification = await this.verifyPageContent(filePath, city, province);
                    results.push({
                        city: city.name,
                        province: province,
                        fileName: fileName,
                        ...verification
                    });
                } catch (error) {
                    this.checks.missingFiles.push(`${fileName} (${city.name}, ${province})`);
                    results.push({
                        city: city.name,
                        province: province,
                        fileName: fileName,
                        valid: false,
                        issues: ['File not found'],
                        size: 0
                    });
                }
                
                totalChecked++;
                if (totalChecked % 100 === 0) {
                    process.stdout.write(`\r  ⏳ ${totalChecked}/${this.checks.totalExpected} pages verified...`);
                }
            }
        }
        
        console.log(`\n✅ Verification completed: ${totalChecked} pages checked`);
        return results;
    }

    /**
     * Generate verification report
     */
    async generateReport(results) {
        console.log('\n📊 Generating verification report...');
        
        const reportPath = path.join(this.baseDir, 'logs/pc-repair-verification.log');
        
        // Ensure logs directory exists
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        
        const successRate = ((this.checks.validPages / this.checks.totalExpected) * 100).toFixed(2);
        
        const reportContent = `
PC REPAIR PAGES VERIFICATION REPORT
==================================
Generated: ${new Date().toISOString()}
Total Expected: ${this.checks.totalExpected}
Total Checked: ${results.length}

SUMMARY
-------
✅ Valid Pages: ${this.checks.validPages}
❌ Pages with Issues: ${this.checks.contentIssues.length}
🚫 Missing Files: ${this.checks.missingFiles.length}
🔧 Template Placeholders Found: ${this.checks.templatePlaceholders}
📊 Success Rate: ${successRate}%

QUALITY METRICS
--------------
Average Page Size: ${(results.reduce((sum, r) => sum + r.size, 0) / results.length / 1024).toFixed(1)}KB
SEO Issues: ${this.checks.seoIssues.length}
Content Issues: ${this.checks.contentIssues.length}

${this.checks.missingFiles.length > 0 ? `
MISSING FILES (${this.checks.missingFiles.length})
--------------
${this.checks.missingFiles.join('\n')}
` : ''}

${this.checks.contentIssues.length > 0 ? `
CONTENT ISSUES (${this.checks.contentIssues.length})
--------------
${this.checks.contentIssues.map(issue => 
    `❌ ${issue.city} (${issue.province}):\n   ${issue.issues.join('\n   ')}`
).join('\n\n')}
` : ''}

${this.checks.seoIssues.length > 0 ? `
SEO ISSUES (${this.checks.seoIssues.length})
----------
${this.checks.seoIssues.join('\n')}
` : ''}

VALID PAGES SAMPLE
------------------
${results.filter(r => r.valid).slice(0, 10).map(r => 
    `✅ ${r.fileName} (${r.city}, ${r.province}) - ${(r.size / 1024).toFixed(1)}KB`
).join('\n')}

VERIFICATION COMPLETE
====================
${this.checks.validPages} of ${this.checks.totalExpected} pages are valid (${successRate}% success rate)
        `.trim();
        
        await fs.writeFile(reportPath, reportContent, 'utf8');
        
        console.log(`✅ Verification report saved to: ${reportPath}`);
        
        return {
            reportPath,
            successRate: parseFloat(successRate),
            summary: {
                total: this.checks.totalExpected,
                valid: this.checks.validPages,
                issues: this.checks.contentIssues.length,
                missing: this.checks.missingFiles.length
            }
        };
    }

    /**
     * Run verification
     */
    async run() {
        console.log('🔍 PC Repair Pages Verification Tool');
        console.log('====================================');
        
        try {
            await this.initialize();
            const results = await this.verifyAllPages();
            const report = await this.generateReport(results);
            
            // Final summary
            console.log('\n🎯 VERIFICATION SUMMARY');
            console.log('======================');
            console.log(`✅ Valid pages: ${this.checks.validPages}/${this.checks.totalExpected} (${report.successRate}%)`);
            console.log(`❌ Issues found: ${this.checks.contentIssues.length}`);
            console.log(`🚫 Missing files: ${this.checks.missingFiles.length}`);
            console.log(`📊 Report: ${report.reportPath}`);
            
            return report;
            
        } catch (error) {
            console.error('\n❌ Verification failed:', error);
            throw error;
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const verifier = new PCRepairPagesVerifier();
    
    verifier.run()
        .then(report => {
            if (report.successRate >= 98) {
                console.log('\n🚀 All pages verified successfully!');
                process.exit(0);
            } else {
                console.log('\n⚠️  Some issues found in generated pages.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Verification failed:', error);
            process.exit(1);
        });
}

module.exports = PCRepairPagesVerifier;