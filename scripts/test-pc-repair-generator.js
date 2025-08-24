#!/usr/bin/env node

/**
 * Test PC Repair Template Generator
 * Tests the riparazione-pc-template.html with 3 sample cities
 */

const fs = require('fs');
const path = require('path');

// Test cities configuration
const TEST_CITIES = [
    {
        name: 'Milano',
        slug: 'milano',
        province: 'MI'
    },
    {
        name: 'Segrate',
        slug: 'segrate',
        province: 'MI'
    },
    {
        name: 'Bergamo',
        slug: 'bergamo',
        province: 'BG'
    }
];

const REGION = 'Lombardia';

async function generateTestPages() {
    console.log('🧪 Testing PC Repair Template Generator...\n');

    try {
        // Read template
        const templatePath = path.join(__dirname, '../templates/riparazione-pc-template.html');
        if (!fs.existsSync(templatePath)) {
            throw new Error('Template file not found: ' + templatePath);
        }

        const template = fs.readFileSync(templatePath, 'utf8');
        console.log('✅ Template loaded successfully');

        // Create output directory
        const outputDir = path.join(__dirname, '../web/pages-test');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log('✅ Created output directory: pages-test/');
        }

        // Generate pages for each test city
        const results = [];
        for (const city of TEST_CITIES) {
            console.log(`\n🏙️  Generating page for ${city.name}...`);

            // Replace placeholders
            let pageContent = template;
            const replacements = [
                { placeholder: '{{CITY}}', value: city.name },
                { placeholder: '{{CITY_SLUG}}', value: city.slug },
                { placeholder: '{{REGION}}', value: REGION },
                { placeholder: '{{PROVINCE}}', value: city.province }
            ];

            let replacementCount = 0;
            for (const { placeholder, value } of replacements) {
                const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
                const matches = pageContent.match(regex);
                if (matches) {
                    pageContent = pageContent.replace(regex, value);
                    replacementCount += matches.length;
                    console.log(`   📝 Replaced ${matches.length}x ${placeholder} → ${value}`);
                }
            }

            // Write output file
            const outputFile = `riparazione-pc-${city.slug}.html`;
            const outputPath = path.join(outputDir, outputFile);
            fs.writeFileSync(outputPath, pageContent, 'utf8');

            const result = {
                city: city.name,
                slug: city.slug,
                file: outputFile,
                replacements: replacementCount,
                size: Buffer.byteLength(pageContent, 'utf8')
            };

            results.push(result);
            console.log(`   ✅ Generated: ${outputFile} (${Math.round(result.size / 1024)}KB, ${replacementCount} replacements)`);
        }

        // Validation summary
        console.log('\n📊 GENERATION SUMMARY:');
        console.log('=====================================');
        
        results.forEach(result => {
            console.log(`${result.city.padEnd(15)} | ${result.file.padEnd(30)} | ${result.replacements} replacements | ${Math.round(result.size / 1024)}KB`);
        });

        // Test validation
        console.log('\n🔍 VALIDATION TESTS:');
        console.log('=====================================');

        let allTestsPassed = true;

        for (const result of results) {
            const filePath = path.join(outputDir, result.file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            console.log(`\n📄 Testing ${result.file}:`);

            // Test 1: No remaining placeholders
            const remainingPlaceholders = content.match(/{{[^}]+}}/g);
            if (remainingPlaceholders) {
                console.log(`   ❌ Found remaining placeholders: ${remainingPlaceholders.join(', ')}`);
                allTestsPassed = false;
            } else {
                console.log(`   ✅ All placeholders replaced successfully`);
            }

            // Test 2: Title contains city name
            const titleMatch = content.match(/<title>([^<]+)<\/title>/);
            if (titleMatch && titleMatch[1].includes(result.city)) {
                console.log(`   ✅ Title contains city name: "${titleMatch[1]}"`);
            } else {
                console.log(`   ❌ Title missing or doesn't contain city name`);
                allTestsPassed = false;
            }

            // Test 3: Meta description contains city
            const metaDescMatch = content.match(/<meta[^>]+content="([^"]+)"[^>]+name="description"/);
            if (metaDescMatch && metaDescMatch[1].includes(result.city)) {
                console.log(`   ✅ Meta description contains city name`);
            } else {
                console.log(`   ❌ Meta description missing or doesn't contain city name`);
                allTestsPassed = false;
            }

            // Test 4: Contact form has city reference
            if (content.includes(`a ${result.city}`)) {
                console.log(`   ✅ Contact form references city`);
            } else {
                console.log(`   ❌ Contact form doesn't reference city`);
                allTestsPassed = false;
            }

            // Test 5: Bootstrap and JS includes present
            if (content.includes('bootstrap@5.3.2') && content.includes('bootstrap.bundle.min.js')) {
                console.log(`   ✅ Bootstrap CSS and JS included`);
            } else {
                console.log(`   ❌ Bootstrap resources missing`);
                allTestsPassed = false;
            }

            // Test 6: Chatbot integration present
            if (content.includes('IT-ERA Chatbot Integration') && content.includes('chatbot')) {
                console.log(`   ✅ Chatbot integration present`);
            } else {
                console.log(`   ❌ Chatbot integration missing`);
                allTestsPassed = false;
            }

            // Test 7: Schema.org structured data
            if (content.includes('application/ld+json') && content.includes('@type": "LocalBusiness"')) {
                console.log(`   ✅ Schema.org structured data present`);
            } else {
                console.log(`   ❌ Schema.org structured data missing`);
                allTestsPassed = false;
            }

            // Test 8: Navigation menu responsive
            if (content.includes('navbar-toggler') && content.includes('navbar-collapse')) {
                console.log(`   ✅ Responsive navigation present`);
            } else {
                console.log(`   ❌ Responsive navigation missing`);
                allTestsPassed = false;
            }
        }

        console.log('\n🎯 FINAL RESULTS:');
        console.log('=====================================');
        
        if (allTestsPassed) {
            console.log('✅ ALL TESTS PASSED! PC repair template is working correctly.');
            console.log(`✅ Generated ${results.length} test pages successfully.`);
            console.log(`✅ All placeholders replaced correctly.`);
            console.log(`✅ All validation tests passed.`);
        } else {
            console.log('❌ Some tests failed. Please check the issues above.');
        }

        console.log(`\n📁 Test pages saved to: ${outputDir}`);
        console.log(`📁 Files generated:`);
        results.forEach(result => {
            console.log(`   - ${result.file}`);
        });

        console.log(`\n🌐 To view the pages, open them in a browser or serve them locally:`);
        console.log(`   cd web/pages-test && python -m http.server 8000`);

        return allTestsPassed;

    } catch (error) {
        console.error('❌ Error during generation:', error.message);
        return false;
    }
}

// Run if called directly
if (require.main === module) {
    generateTestPages().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { generateTestPages, TEST_CITIES };