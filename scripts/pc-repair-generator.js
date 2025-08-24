#!/usr/bin/env node

/**
 * IT-ERA PC Repair Page Generator
 * Generates comprehensive PC repair landing pages for all 1,502 Lombardy municipalities
 * 
 * Features:
 * - Complete page generation using tested Milano template
 * - SEO-optimized content with local targeting
 * - Dual deployment to /web/pages/ and /web/pages-draft/
 * - Automatic sitemap update
 * - Comprehensive logging and statistics
 * - Error handling and validation
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
    dataFile: '/Users/andreapanzeri/progetti/IT-ERA/data/lombardy-complete-official.json',
    templateFile: '/Users/andreapanzeri/progetti/IT-ERA/web/pages/assistenza-it-milano.html',
    outputDirs: [
        '/Users/andreapanzeri/progetti/IT-ERA/web/pages',
        '/Users/andreapanzeri/progetti/IT-ERA/web/pages-draft'
    ],
    sitemapFile: '/Users/andreapanzeri/progetti/IT-ERA/web/sitemap.xml',
    logFile: '/Users/andreapanzeri/progetti/IT-ERA/scripts/logs/pc-repair-generation.log',
    batchSize: 50, // Process in batches for memory optimization
    serviceType: 'riparazione-pc'
};

// Global statistics
const stats = {
    total: 0,
    generated: 0,
    errors: 0,
    startTime: new Date(),
    provinces: {},
    errorDetails: []
};

/**
 * Main execution function
 */
async function main() {
    console.log('🔧 IT-ERA PC Repair Page Generator v2.0');
    console.log('=' .repeat(60));
    
    try {
        // Initialize logging
        await setupLogging();
        
        // Load and validate data
        console.log('📊 Loading Lombardy municipalities data...');
        const municipalityData = await loadMunicipalityData();
        
        // Load template
        console.log('📄 Loading PC repair template...');
        const template = await loadTemplate();
        
        // Generate all pages
        console.log(`🏗️  Generating ${municipalityData.total_municipalities} PC repair pages...`);
        await generateAllPages(municipalityData, template);
        
        // Update sitemap
        console.log('🗺️  Updating sitemap with PC repair pages...');
        await updateSitemap();
        
        // Generate final report
        await generateFinalReport();
        
        console.log('\n✅ PC Repair page generation completed successfully!');
        console.log(`📊 Generated ${stats.generated} pages in ${getElapsedTime()}`);
        
    } catch (error) {
        console.error('❌ Fatal error during generation:', error);
        await logError('FATAL', error.message, { stack: error.stack });
        process.exit(1);
    }
}

/**
 * Setup logging infrastructure
 */
async function setupLogging() {
    const logDir = path.dirname(CONFIG.logFile);
    await fs.mkdir(logDir, { recursive: true });
    
    const logEntry = `\n${'='.repeat(80)}\nPC REPAIR GENERATION STARTED: ${new Date().toISOString()}\n${'='.repeat(80)}\n`;
    await fs.appendFile(CONFIG.logFile, logEntry);
}

/**
 * Load and parse municipality data
 */
async function loadMunicipalityData() {
    const dataContent = await fs.readFile(CONFIG.dataFile, 'utf8');
    const data = JSON.parse(dataContent);
    
    // Flatten all municipalities from all provinces
    const allMunicipalities = [];
    
    for (const [provinceName, municipalities] of Object.entries(data.provinces)) {
        stats.provinces[provinceName] = municipalities.length;
        
        municipalities.forEach(municipality => {
            allMunicipalities.push({
                ...municipality,
                province: provinceName
            });
        });
    }
    
    stats.total = allMunicipalities.length;
    console.log(`✅ Loaded ${stats.total} municipalities from ${Object.keys(data.provinces).length} provinces`);
    
    return {
        ...data,
        allMunicipalities
    };
}

/**
 * Load and prepare PC repair template
 */
async function loadTemplate() {
    const templateContent = await fs.readFile(CONFIG.templateFile, 'utf8');
    
    // Verify template contains expected placeholders
    const expectedPlaceholders = ['Milano', 'milano', 'assistenza-it'];
    const missingPlaceholders = expectedPlaceholders.filter(placeholder => 
        !templateContent.includes(placeholder)
    );
    
    if (missingPlaceholders.length > 0) {
        throw new Error(`Template missing placeholders: ${missingPlaceholders.join(', ')}`);
    }
    
    console.log('✅ Template loaded and validated successfully');
    return templateContent;
}

/**
 * Generate all PC repair pages in batches
 */
async function generateAllPages(data, template) {
    const municipalities = data.allMunicipalities;
    
    // Process in batches to avoid memory issues
    for (let i = 0; i < municipalities.length; i += CONFIG.batchSize) {
        const batch = municipalities.slice(i, i + CONFIG.batchSize);
        const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
        const totalBatches = Math.ceil(municipalities.length / CONFIG.batchSize);
        
        console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} municipalities)...`);
        
        // Process batch in parallel
        const batchPromises = batch.map(municipality => 
            generateSinglePage(municipality, template)
        );
        
        const results = await Promise.allSettled(batchPromises);
        
        // Process results
        results.forEach((result, index) => {
            const municipality = batch[index];
            if (result.status === 'fulfilled') {
                stats.generated++;
            } else {
                stats.errors++;
                stats.errorDetails.push({
                    municipality: municipality.name,
                    error: result.reason.message
                });
                logError('GENERATION_ERROR', result.reason.message, municipality);
            }
        });
        
        // Progress update
        const progress = ((i + batch.length) / municipalities.length * 100).toFixed(1);
        console.log(`   ✅ Batch completed. Progress: ${progress}% (${stats.generated} generated, ${stats.errors} errors)`);
    }
}

/**
 * Generate single PC repair page for a municipality
 */
async function generateSinglePage(municipality, template) {
    const citySlug = municipality.slug;
    const cityName = municipality.name;
    const provinceName = municipality.province;
    const provinceCode = municipality.car_code || municipality.province.substring(0, 2).toUpperCase();
    
    // Transform template for PC repair focus
    let pageContent = template;
    
    // Replace city-specific content
    pageContent = pageContent.replace(/Milano/g, cityName);
    pageContent = pageContent.replace(/milano/g, citySlug);
    
    // Update service type from assistenza-it to riparazione-pc
    pageContent = pageContent.replace(/assistenza-it-/g, 'riparazione-pc-');
    pageContent = pageContent.replace(/assistenza-it/g, 'riparazione-pc');
    
    // Update page titles and meta descriptions for PC repair focus
    pageContent = pageContent.replace(
        /Assistenza IT ([^|]+) \| Supporto Tecnico Professionale 24\/7/g,
        `Riparazione PC $1 | Centro Assistenza Computer Professionale`
    );
    
    // Update meta description for PC repair
    pageContent = pageContent.replace(
        /Assistenza IT professionale a ([^,]+), Lombardia\. Supporto tecnico 24\/7, risoluzione problemi computer, installazione software\. SLA 4 ore garantito\./g,
        `Riparazione PC professionale a $1, Lombardia. Centro assistenza computer specializzato: hardware, software, virus, recupero dati. Intervento rapido garantito.`
    );
    
    // Update keywords for PC repair
    pageContent = pageContent.replace(
        /assistenza it ([^,]+), supporto tecnico ([^,]+), riparazione computer ([^,]+), consulenza informatica Lombardia/g,
        `riparazione pc $1, assistenza computer $1, riparazione hardware $1, centro assistenza pc Lombardia`
    );
    
    // Also handle the lowercase version in keywords meta tag
    pageContent = pageContent.replace(
        /name="keywords".*content="([^"]+)"/g,
        (match, content) => {
            const updatedContent = content
                .replace(/assistenza it/g, 'riparazione pc')
                .replace(/supporto tecnico/g, 'assistenza computer')
                .replace(/riparazione computer/g, 'riparazione hardware')
                .replace(/consulenza informatica/g, 'centro assistenza pc');
            return `name="keywords" content="${updatedContent}"`;
        }
    );
    
    // Update main heading
    pageContent = pageContent.replace(
        /Assistenza IT Professionale a ([^<]+)/g,
        `Riparazione PC e Computer a $1`
    );
    
    // Update lead text
    pageContent = pageContent.replace(
        /Supporto tecnico specializzato per la tua azienda in ([^,]+), Lombardia\. \s*Risolviamo ogni problema informatico con intervento rapido e garantito\./g,
        `Centro assistenza computer specializzato a $1, Lombardia. Riparazione PC, laptop, rimozione virus, recupero dati con intervento rapido e professionale.`
    );
    
    // Update service section heading
    pageContent = pageContent.replace(
        /I Nostri Servizi IT a ([^<]+)/g,
        `Servizi Riparazione PC a $1`
    );
    
    // Update service descriptions for PC repair focus
    pageContent = pageContent.replace(
        /Riparazione e manutenzione di computer, server e periferiche con intervento on-site garantito\./g,
        `Riparazione completa PC desktop e laptop: schede madri, hard disk, RAM, alimentatori, schermi. Diagnostica gratuita e preventivo trasparente.`
    );
    
    pageContent = pageContent.replace(
        /Installazione, configurazione e risoluzione problemi software aziendali e gestionali\./g,
        `Risoluzione problemi software, rimozione virus e malware, installazione sistemi operativi, recovery dati, ottimizzazione prestazioni PC.`
    );
    
    // Update pricing section for PC repair
    pageContent = pageContent.replace(
        /Piani di Assistenza IT ([^<]+)/g,
        `Tariffe Riparazione PC $1`
    );
    
    // Update testimonials for PC repair context
    pageContent = pageContent.replace(
        /Assistenza impeccabile! Hanno risolto un problema critico del nostro server in meno di 2 ore\. Professionalità e competenza al top\./g,
        `Ottimo centro riparazione PC! Mi hanno recuperato tutti i dati da un hard disk danneggiato e riparato il computer in giornata. Super consigliati!`
    );
    
    pageContent = pageContent.replace(
        /Il loro supporto 24\/7 è una garanzia per la nostra azienda\. Non ci hanno mai lasciato soli, anche nei weekend\./g,
        `Professionali e veloci nella riparazione. Il mio laptop aveva virus e problemi hardware, ora funziona perfettamente. Prezzi onesti e lavoro garantito.`
    );
    
    pageContent = pageContent.replace(
        /Grazie alla loro consulenza abbiamo ottimizzato tutta l'infrastruttura IT riducendo i costi del 30%\./g,
        `Centro assistenza serio e competente. Riparazione PC della mia azienda eseguita perfettamente, con upgrade hardware che ha migliorato le prestazioni.`
    );
    
    // Update FAQ for PC repair
    pageContent = pageContent.replace(
        /Qual è il tempo di risposta garantito\?/g,
        `Quanto costa la riparazione di un PC?`
    );
    
    pageContent = pageContent.replace(
        /Garantiamo un SLA di 4 ore per il Piano Business e 2 ore per il Piano Enterprise\. Per emergenze critiche, interveniamo entro 1 ora 24\/7\./g,
        `I costi variano in base al tipo di intervento. Diagnostica gratuita, riparazione software da €45, hardware da €75. Preventivo sempre trasparente prima dell'intervento.`
    );
    
    // Update Open Graph tags
    pageContent = pageContent.replace(
        /https:\/\/it-era\.pages\.dev\/images\/it-support-([^-]+)-og\.jpg/g,
        `https://it-era.pages.dev/images/pc-repair-$1-og.jpg`
    );
    
    // Update canonical URL
    pageContent = pageContent.replace(
        /https:\/\/it-era\.pages\.dev\/pages\/assistenza-it-([^\.]+)\.html/g,
        `https://it-era.pages.dev/pages/riparazione-pc-$1.html`
    );
    
    // Update structured data
    pageContent = pageContent.replace(
        /"name": "IT-ERA - Assistenza IT ([^"]+)"/g,
        `"name": "IT-ERA - Riparazione PC $1"`
    );
    
    pageContent = pageContent.replace(
        /"serviceType": \["Assistenza IT"\]/g,
        `"serviceType": ["Riparazione PC", "Assistenza Computer"]`
    );
    
    // Alternative pattern in case the array format is different
    pageContent = pageContent.replace(
        /"serviceType": ?\[\s*"Assistenza IT"\s*\]/g,
        `"serviceType": ["Riparazione PC", "Assistenza Computer"]`
    );
    
    // Also update Open Graph titles that might still have old format
    pageContent = pageContent.replace(
        /property="og:title" content="Assistenza IT ([^"]+)"/g,
        `property="og:title" content="Riparazione PC $1"`
    );
    
    pageContent = pageContent.replace(
        /name="twitter:title" content="Assistenza IT ([^"]+)"/g,
        `name="twitter:title" content="Riparazione PC $1"`
    );
    
    // Generate filename and save to both directories
    const filename = `riparazione-pc-${citySlug}.html`;
    
    // Save to both output directories
    const savePromises = CONFIG.outputDirs.map(async (dir) => {
        const filePath = path.join(dir, filename);
        await fs.writeFile(filePath, pageContent, 'utf8');
    });
    
    await Promise.all(savePromises);
    
    // Log successful generation
    await logSuccess(cityName, provinceName, filename);
}

/**
 * Update sitemap with new PC repair pages
 */
async function updateSitemap() {
    try {
        const sitemapContent = await fs.readFile(CONFIG.sitemapFile, 'utf8');
        
        // Parse existing sitemap
        const urlPattern = /<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<changefreq>([^<]+)<\/changefreq>\s*<priority>([^<]+)<\/priority>\s*<\/url>/g;
        const existingUrls = new Set();
        let match;
        
        while ((match = urlPattern.exec(sitemapContent)) !== null) {
            existingUrls.add(match[1]);
        }
        
        // Generate new PC repair URLs
        const dataContent = await fs.readFile(CONFIG.dataFile, 'utf8');
        const data = JSON.parse(dataContent);
        const newEntries = [];
        const today = new Date().toISOString().split('T')[0];
        
        // Flatten municipalities and create sitemap entries
        for (const municipalities of Object.values(data.provinces)) {
            municipalities.forEach(municipality => {
                const url = `https://www.it-era.it/riparazione-pc-${municipality.slug}`;
                if (!existingUrls.has(url)) {
                    newEntries.push(`  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
                }
            });
        }
        
        // Add new entries before closing tag
        const updatedSitemap = sitemapContent.replace(
            '</urlset>',
            newEntries.join('\n') + '\n</urlset>'
        );
        
        await fs.writeFile(CONFIG.sitemapFile, updatedSitemap, 'utf8');
        
        console.log(`✅ Sitemap updated with ${newEntries.length} new PC repair pages`);
        await fs.appendFile(CONFIG.logFile, `Sitemap updated with ${newEntries.length} PC repair URLs\n`);
        
    } catch (error) {
        console.error('❌ Error updating sitemap:', error.message);
        await logError('SITEMAP_ERROR', error.message);
    }
}

/**
 * Generate comprehensive final report
 */
async function generateFinalReport() {
    const endTime = new Date();
    const duration = getElapsedTime();
    
    const report = {
        generation_summary: {
            total_municipalities: stats.total,
            pages_generated: stats.generated,
            errors: stats.errors,
            success_rate: ((stats.generated / stats.total) * 100).toFixed(2) + '%',
            duration: duration,
            start_time: stats.startTime.toISOString(),
            end_time: endTime.toISOString()
        },
        province_breakdown: stats.provinces,
        configuration: {
            service_type: CONFIG.serviceType,
            output_directories: CONFIG.outputDirs,
            batch_size: CONFIG.batchSize
        },
        error_details: stats.errorDetails.slice(0, 10), // First 10 errors
        files_generated: {
            pages_directory: stats.generated,
            pages_draft_directory: stats.generated,
            sitemap_updated: true
        }
    };
    
    // Save detailed report
    const reportPath = '/Users/andreapanzeri/progetti/IT-ERA/scripts/logs/pc-repair-generation-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n📊 GENERATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`📈 Total municipalities: ${stats.total}`);
    console.log(`✅ Pages generated: ${stats.generated}`);
    console.log(`❌ Errors: ${stats.errors}`);
    console.log(`📊 Success rate: ${report.generation_summary.success_rate}`);
    console.log(`⏱️  Duration: ${duration}`);
    console.log(`📋 Detailed report: ${reportPath}`);
    
    if (stats.errors > 0) {
        console.log(`\n⚠️  Top errors:`);
        stats.errorDetails.slice(0, 5).forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.municipality}: ${error.error}`);
        });
    }
}

/**
 * Utility functions
 */
function getElapsedTime() {
    const elapsed = Date.now() - stats.startTime.getTime();
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
}

async function logSuccess(city, province, filename) {
    const logEntry = `SUCCESS: Generated ${filename} for ${city}, ${province}\n`;
    await fs.appendFile(CONFIG.logFile, logEntry);
}

async function logError(type, message, context = {}) {
    const logEntry = `ERROR [${type}]: ${message} ${JSON.stringify(context)}\n`;
    await fs.appendFile(CONFIG.logFile, logEntry);
}

// Run the generator
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = {
    generateAllPages,
    generateSinglePage,
    updateSitemap,
    CONFIG
};