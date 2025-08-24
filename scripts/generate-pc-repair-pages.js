#!/usr/bin/env node

/**
 * IT-ERA PC Repair Pages Generator
 * Generates all 1,502 PC repair landing pages for Lombardy municipalities
 * 
 * Features:
 * - Processes riparazione-pc-template.html with city-specific replacements
 * - Creates riparazione-pc-[city-slug].html for each municipality
 * - Updates sitemap.xml with new PC repair pages
 * - Generates comprehensive generation log
 */

const fs = require('fs').promises;
const path = require('path');

class PCRepairPagesGenerator {
    constructor() {
        this.baseDir = '/Users/andreapanzeri/progetti/IT-ERA';
        this.templatePath = path.join(this.baseDir, 'templates/riparazione-pc-template.html');
        this.dataPath = path.join(this.baseDir, 'data/lombardy-complete-official.json');
        this.outputDir = path.join(this.baseDir, 'web/pages');
        this.sitemapPath = path.join(this.baseDir, 'web/sitemap.xml');
        
        this.stats = {
            totalPages: 0,
            successfulPages: 0,
            errors: [],
            processingTime: 0,
            provinces: {},
            startTime: new Date()
        };
        
        this.template = '';
        this.lombardyData = null;
    }

    /**
     * Initialize the generator by loading template and data
     */
    async initialize() {
        console.log('🚀 Initializing PC Repair Pages Generator...');
        
        try {
            // Load template
            console.log('📄 Loading template...');
            this.template = await fs.readFile(this.templatePath, 'utf8');
            console.log(`✅ Template loaded (${this.template.length} characters)`);
            
            // Load Lombardy data
            console.log('📊 Loading Lombardy municipalities data...');
            const dataContent = await fs.readFile(this.dataPath, 'utf8');
            this.lombardyData = JSON.parse(dataContent);
            console.log(`✅ Data loaded - ${this.lombardyData.total_municipalities} municipalities`);
            
            // Ensure output directory exists
            await fs.mkdir(this.outputDir, { recursive: true });
            console.log('✅ Output directory ready');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Generate city slug from city name
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
     * Replace template placeholders with city-specific data
     */
    processTemplate(city, province) {
        const citySlug = this.generateSlug(city.name);
        
        return this.template
            .replace(/\{\{CITY\}\}/g, city.name)
            .replace(/\{\{CITY_SLUG\}\}/g, citySlug)
            .replace(/\{\{REGION\}\}/g, 'Lombardia')
            .replace(/\{\{PROVINCE\}\}/g, province)
            .replace(/\{\{PROVINCE_CODE\}\}/g, city.car_code || '')
            .replace(/\{\{ISTAT_CODE\}\}/g, city.istat_code || '');
    }

    /**
     * Generate individual PC repair page for a city
     */
    async generatePageForCity(city, province) {
        try {
            const citySlug = this.generateSlug(city.name);
            const fileName = `riparazione-pc-${citySlug}.html`;
            const filePath = path.join(this.outputDir, fileName);
            
            // Process template with city data
            const pageContent = this.processTemplate(city, province);
            
            // Write the page
            await fs.writeFile(filePath, pageContent, 'utf8');
            
            // Update stats
            this.stats.successfulPages++;
            if (!this.stats.provinces[province]) {
                this.stats.provinces[province] = 0;
            }
            this.stats.provinces[province]++;
            
            return {
                success: true,
                city: city.name,
                province: province,
                slug: citySlug,
                fileName: fileName,
                size: pageContent.length
            };
            
        } catch (error) {
            this.stats.errors.push({
                city: city.name,
                province: province,
                error: error.message
            });
            
            return {
                success: false,
                city: city.name,
                province: province,
                error: error.message
            };
        }
    }

    /**
     * Generate all PC repair pages
     */
    async generateAllPages() {
        console.log('\n🏗️  Starting PC repair pages generation...');
        const startTime = Date.now();
        const results = [];
        
        // Process each province
        for (const [province, cities] of Object.entries(this.lombardyData.provinces)) {
            console.log(`\n📍 Processing province: ${province} (${cities.length} cities)`);
            
            let provinceSuccess = 0;
            let provinceErrors = 0;
            
            // Process cities in batches to avoid overwhelming the system
            const BATCH_SIZE = 50;
            for (let i = 0; i < cities.length; i += BATCH_SIZE) {
                const batch = cities.slice(i, i + BATCH_SIZE);
                const batchPromises = batch.map(city => this.generatePageForCity(city, province));
                const batchResults = await Promise.all(batchPromises);
                
                // Count successes and errors for this batch
                batchResults.forEach(result => {
                    if (result.success) {
                        provinceSuccess++;
                    } else {
                        provinceErrors++;
                    }
                    results.push(result);
                });
                
                // Progress update
                const processed = Math.min(i + BATCH_SIZE, cities.length);
                process.stdout.write(`\r  ⏳ ${processed}/${cities.length} cities processed...`);
            }
            
            console.log(`\n  ✅ ${province}: ${provinceSuccess} success, ${provinceErrors} errors`);
        }
        
        const endTime = Date.now();
        this.stats.processingTime = endTime - startTime;
        this.stats.totalPages = results.length;
        
        console.log(`\n🎉 Page generation completed in ${(this.stats.processingTime / 1000).toFixed(2)}s`);
        console.log(`📊 Total: ${this.stats.totalPages} pages, ${this.stats.successfulPages} successful`);
        
        return results;
    }

    /**
     * Update sitemap with new PC repair pages
     */
    async updateSitemap() {
        console.log('\n🗺️  Updating sitemap...');
        
        try {
            // Read existing sitemap
            let sitemapContent = await fs.readFile(this.sitemapPath, 'utf8');
            
            // Generate PC repair URLs
            const pcRepairUrls = [];
            const today = new Date().toISOString().split('T')[0];
            
            for (const [province, cities] of Object.entries(this.lombardyData.provinces)) {
                for (const city of cities) {
                    const citySlug = this.generateSlug(city.name);
                    const url = `  <url>
    <loc>https://it-era.pages.dev/pages/riparazione-pc-${citySlug}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
                    pcRepairUrls.push(url);
                }
            }
            
            // Remove existing PC repair pages from sitemap
            sitemapContent = sitemapContent.replace(
                /<url>\s*<loc>https:\/\/it-era\.pages\.dev\/pages\/riparazione-pc-[^<]+<\/loc>[\s\S]*?<\/url>/g,
                ''
            );
            
            // Add new PC repair URLs before closing </urlset>
            const newPcRepairSection = pcRepairUrls.join('\n');
            sitemapContent = sitemapContent.replace(
                '</urlset>',
                `${newPcRepairSection}\n</urlset>`
            );
            
            // Write updated sitemap
            await fs.writeFile(this.sitemapPath, sitemapContent, 'utf8');
            
            console.log(`✅ Sitemap updated with ${pcRepairUrls.length} PC repair pages`);
            
        } catch (error) {
            console.error('❌ Sitemap update failed:', error);
            this.stats.errors.push({
                type: 'sitemap',
                error: error.message
            });
        }
    }

    /**
     * Generate comprehensive generation log
     */
    async generateLog(results) {
        console.log('\n📝 Generating comprehensive log...');
        
        const logPath = path.join(this.baseDir, 'logs/pc-repair-generation.log');
        
        // Ensure logs directory exists
        await fs.mkdir(path.dirname(logPath), { recursive: true });
        
        const logContent = `
IT-ERA PC REPAIR PAGES GENERATION LOG
=====================================
Generated: ${new Date().toISOString()}
Template: ${this.templatePath}
Data Source: ${this.dataPath}

SUMMARY
-------
Total Municipalities: ${this.lombardyData.total_municipalities}
Pages Generated: ${this.stats.totalPages}
Successful: ${this.stats.successfulPages}
Errors: ${this.stats.errors.length}
Processing Time: ${(this.stats.processingTime / 1000).toFixed(2)} seconds
Pages per Second: ${(this.stats.successfulPages / (this.stats.processingTime / 1000)).toFixed(2)}

PROVINCE BREAKDOWN
------------------
${Object.entries(this.stats.provinces)
    .map(([province, count]) => `${province}: ${count} pages`)
    .join('\n')}

SUCCESSFUL PAGES
----------------
${results
    .filter(r => r.success)
    .map(r => `✅ ${r.fileName} (${r.city}, ${r.province}) - ${(r.size / 1024).toFixed(1)}KB`)
    .join('\n')}

${this.stats.errors.length > 0 ? `
ERRORS
------
${this.stats.errors
    .map(e => `❌ ${e.city || e.type}: ${e.error}`)
    .join('\n')}
` : 'No errors occurred during generation.'}

TEMPLATE DETAILS
----------------
Original Size: ${this.template.length} characters
Placeholders: {{CITY}}, {{CITY_SLUG}}, {{REGION}}, {{PROVINCE}}, {{PROVINCE_CODE}}, {{ISTAT_CODE}}

OUTPUT STRUCTURE
----------------
- Pages saved to: ${this.outputDir}
- Naming pattern: riparazione-pc-[city-slug].html
- Sitemap updated: ${this.sitemapPath}
- Log file: ${logPath}

GENERATION COMPLETE
==================
All ${this.stats.successfulPages} PC repair pages have been successfully generated!
        `.trim();
        
        await fs.writeFile(logPath, logContent, 'utf8');
        
        console.log(`✅ Detailed log saved to: ${logPath}`);
        
        return logPath;
    }

    /**
     * Main execution method
     */
    async run() {
        console.log('🔧 IT-ERA PC Repair Pages Generator');
        console.log('===================================');
        
        try {
            // Initialize
            await this.initialize();
            
            // Generate all pages
            const results = await this.generateAllPages();
            
            // Update sitemap
            await this.updateSitemap();
            
            // Generate log
            const logPath = await this.generateLog(results);
            
            // Final summary
            console.log('\n🎯 GENERATION SUMMARY');
            console.log('====================');
            console.log(`✅ Successfully generated ${this.stats.successfulPages} PC repair pages`);
            console.log(`📊 Coverage: ${((this.stats.successfulPages / this.lombardyData.total_municipalities) * 100).toFixed(2)}%`);
            console.log(`⏱️  Total time: ${(this.stats.processingTime / 1000).toFixed(2)} seconds`);
            console.log(`🗺️  Sitemap updated with all pages`);
            console.log(`📝 Detailed log: ${logPath}`);
            
            if (this.stats.errors.length > 0) {
                console.log(`⚠️  ${this.stats.errors.length} errors encountered (see log for details)`);
            }
            
            return {
                success: this.stats.errors.length === 0,
                stats: this.stats,
                logPath: logPath
            };
            
        } catch (error) {
            console.error('\n❌ CRITICAL ERROR:', error);
            throw error;
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const generator = new PCRepairPagesGenerator();
    
    generator.run()
        .then(result => {
            if (result.success) {
                console.log('\n🚀 PC repair pages generation completed successfully!');
                process.exit(0);
            } else {
                console.log('\n⚠️  PC repair pages generation completed with errors.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Generation failed:', error);
            process.exit(1);
        });
}

module.exports = PCRepairPagesGenerator;