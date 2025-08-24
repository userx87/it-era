#!/usr/bin/env node

/**
 * PC Repair Generator Validation Script
 * Tests the generator with sample municipalities before full execution
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Test configuration
const TEST_CONFIG = {
    sampleMunicipalities: [
        { name: 'Milano', slug: 'milano', province: 'Milano' },
        { name: 'Bergamo', slug: 'bergamo', province: 'Bergamo' },
        { name: 'Como', slug: 'como', province: 'Como' },
        { name: 'Lecco', slug: 'lecco', province: 'Lecco' },
        { name: 'Monza', slug: 'monza', province: 'Monza e della Brianza' }
    ],
    testDir: '/Users/andreapanzeri/progetti/IT-ERA/scripts/test-output'
};

async function main() {
    console.log('🧪 PC Repair Generator Validation');
    console.log('=' .repeat(50));
    
    try {
        // Setup test environment
        await setupTestEnvironment();
        
        // Load generator
        const generator = require('./pc-repair-generator.js');
        
        // Load template
        console.log('📄 Loading template...');
        const templateContent = await fs.readFile(
            '/Users/andreapanzeri/progetti/IT-ERA/web/pages/assistenza-it-milano.html',
            'utf8'
        );
        
        // Test sample generations
        console.log('🏗️  Testing sample page generation...');
        const results = [];
        
        for (const municipality of TEST_CONFIG.sampleMunicipalities) {
            console.log(`   Testing: ${municipality.name}`);
            
            try {
                // Generate test page
                const testTemplate = await generateTestPage(municipality, templateContent);
                
                // Validate content
                const validation = await validatePageContent(municipality, testTemplate);
                
                results.push({
                    municipality: municipality.name,
                    success: validation.isValid,
                    issues: validation.issues
                });
                
                console.log(`   ✅ ${municipality.name}: ${validation.isValid ? 'VALID' : 'ISSUES FOUND'}`);
                
            } catch (error) {
                results.push({
                    municipality: municipality.name,
                    success: false,
                    error: error.message
                });
                console.log(`   ❌ ${municipality.name}: ERROR - ${error.message}`);
            }
        }
        
        // Generate validation report
        await generateValidationReport(results);
        
        // Summary
        const successful = results.filter(r => r.success).length;
        console.log(`\n📊 Validation Summary:`);
        console.log(`   ✅ Successful: ${successful}/${results.length}`);
        console.log(`   ❌ Failed: ${results.length - successful}/${results.length}`);
        
        if (successful === results.length) {
            console.log('\n🎉 All validation tests passed! Generator is ready for full execution.');
            return true;
        } else {
            console.log('\n⚠️  Some validation tests failed. Please review the issues before full execution.');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Validation failed:', error);
        return false;
    }
}

async function setupTestEnvironment() {
    await fs.mkdir(TEST_CONFIG.testDir, { recursive: true });
    console.log(`📁 Test directory created: ${TEST_CONFIG.testDir}`);
}

async function generateTestPage(municipality, template) {
    const citySlug = municipality.slug;
    const cityName = municipality.name;
    
    // Apply the same transformations as the main generator
    let pageContent = template;
    
    // Replace city-specific content
    pageContent = pageContent.replace(/Milano/g, cityName);
    pageContent = pageContent.replace(/milano/g, citySlug);
    
    // Update service type
    pageContent = pageContent.replace(/assistenza-it-/g, 'riparazione-pc-');
    pageContent = pageContent.replace(/assistenza-it/g, 'riparazione-pc');
    
    // Update titles for PC repair
    pageContent = pageContent.replace(
        /Assistenza IT ([^|]+) \| Supporto Tecnico Professionale 24\/7/g,
        `Riparazione PC $1 | Centro Assistenza Computer Professionale`
    );
    
    // Update meta descriptions
    pageContent = pageContent.replace(
        /Assistenza IT professionale a ([^,]+), Lombardia\. Supporto tecnico 24\/7, risoluzione problemi computer, installazione software\. SLA 4 ore garantito\./g,
        `Riparazione PC professionale a $1, Lombardia. Centro assistenza computer specializzato: hardware, software, virus, recupero dati. Intervento rapido garantito.`
    );
    
    // Update keywords
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
    
    // Update main headings
    pageContent = pageContent.replace(
        /Assistenza IT Professionale a ([^<]+)/g,
        `Riparazione PC e Computer a $1`
    );
    
    // Update canonical URLs
    pageContent = pageContent.replace(
        /https:\/\/it-era\.pages\.dev\/pages\/assistenza-it-([^\.]+)\.html/g,
        `https://it-era.pages.dev/pages/riparazione-pc-$1.html`
    );
    
    // Update Open Graph titles
    pageContent = pageContent.replace(
        /property="og:title" content="Assistenza IT ([^"]+)"/g,
        `property="og:title" content="Riparazione PC $1"`
    );
    
    pageContent = pageContent.replace(
        /name="twitter:title" content="Assistenza IT ([^"]+)"/g,
        `name="twitter:title" content="Riparazione PC $1"`
    );
    
    // Update structured data
    pageContent = pageContent.replace(
        /"serviceType": ?\[\s*"Assistenza IT"\s*\]/g,
        `"serviceType": ["Riparazione PC", "Assistenza Computer"]`
    );
    
    // Save test file
    const filename = `riparazione-pc-${citySlug}.html`;
    const filepath = path.join(TEST_CONFIG.testDir, filename);
    await fs.writeFile(filepath, pageContent, 'utf8');
    
    return pageContent;
}

async function validatePageContent(municipality, content) {
    const issues = [];
    const cityName = municipality.name;
    const citySlug = municipality.slug;
    
    // Check title
    if (!content.includes(`Riparazione PC ${cityName}`)) {
        issues.push('Title not properly updated for PC repair');
    }
    
    // Check meta description
    if (!content.includes(`Riparazione PC professionale a ${cityName}`)) {
        issues.push('Meta description not updated for PC repair');
    }
    
    // Check keywords (case insensitive)
    if (!content.toLowerCase().includes(`riparazione pc ${citySlug.toLowerCase()}`)) {
        issues.push('Keywords not updated for PC repair');
    }
    
    // Check main heading
    if (!content.includes(`Riparazione PC e Computer a ${cityName}`)) {
        issues.push('Main heading not updated');
    }
    
    // Check canonical URL
    if (!content.includes(`riparazione-pc-${citySlug}.html`)) {
        issues.push('Canonical URL not updated');
    }
    
    // Check service type replacement
    if (content.includes('assistenza-it-')) {
        issues.push('Some assistenza-it references not replaced');
    }
    
    // Check structured data
    if (!content.includes('"Riparazione PC"') && !content.includes('["Riparazione PC"')) {
        issues.push('Structured data not updated for PC repair');
    }
    
    // Check for PC repair specific content
    if (!content.includes('Centro assistenza computer') && !content.includes('riparazione hardware')) {
        issues.push('PC repair specific content missing');
    }
    
    return {
        isValid: issues.length === 0,
        issues: issues
    };
}

async function generateValidationReport(results) {
    const report = {
        validation_date: new Date().toISOString(),
        total_tests: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results: results
    };
    
    const reportPath = path.join(TEST_CONFIG.testDir, 'validation-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Validation report saved: ${reportPath}`);
}

// Run validation if called directly
if (require.main === module) {
    main().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = {
    main,
    validatePageContent,
    generateTestPage
};