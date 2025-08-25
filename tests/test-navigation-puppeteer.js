const puppeteer = require('puppeteer');

async function testITERANavigation() {
    console.log('🚀 Starting IT-ERA Navigation Test with Puppeteer\n');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    const results = {
        passed: [],
        failed: [],
        missing: []
    };
    
    // Test URLs
    const pagesToTest = [
        { url: 'https://it-era.pages.dev/', name: 'Homepage' },
        { url: 'https://it-era.pages.dev/pages/assistenza-it.html', name: 'Assistenza IT (Generic)' },
        { url: 'https://it-era.pages.dev/pages/sicurezza-informatica.html', name: 'Sicurezza Informatica' },
        { url: 'https://it-era.pages.dev/pages/cloud-storage.html', name: 'Cloud Storage' },
        { url: 'https://it-era.pages.dev/pages/settori-pmi-startup.html', name: 'Settori PMI' },
        { url: 'https://it-era.pages.dev/pages/settori-industria.html', name: 'Settori Industria' },
        { url: 'https://it-era.pages.dev/pages/settori-retail.html', name: 'Settori Retail' },
        { url: 'https://it-era.pages.dev/pages/contatti.html', name: 'Contatti' },
        { url: 'https://it-era.pages.dev/pages/perche-it-era.html', name: 'Perché IT-ERA' }
    ];
    
    // Test each page
    for (const pageTest of pagesToTest) {
        console.log(`\n📄 Testing: ${pageTest.name}`);
        console.log(`   URL: ${pageTest.url}`);
        
        try {
            const response = await page.goto(pageTest.url, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            if (response.status() === 404) {
                console.log(`   ❌ Page not found (404)`);
                results.missing.push(pageTest);
                continue;
            }
            
            console.log(`   ✅ Page loaded (Status: ${response.status()})`);
            
            // Check navigation menu exists
            const hasNavbar = await page.$('.navbar') !== null;
            console.log(`   ${hasNavbar ? '✅' : '❌'} Navigation menu exists`);
            
            // Check for dropdowns
            const servicesDropdown = await page.$('a.dropdown-toggle:has-text("Servizi")') !== null ||
                                    await page.evaluate(() => {
                                        const links = document.querySelectorAll('a.dropdown-toggle');
                                        return Array.from(links).some(link => link.textContent.includes('Servizi'));
                                    });
            
            const sectorsDropdown = await page.evaluate(() => {
                const links = document.querySelectorAll('a.dropdown-toggle');
                return Array.from(links).some(link => link.textContent.includes('Settori'));
            });
            
            console.log(`   ${servicesDropdown ? '✅' : '❌'} Services dropdown present`);
            console.log(`   ${sectorsDropdown ? '✅' : '❌'} Sectors dropdown present`);
            
            // Test navigation links
            const navigationLinks = await page.evaluate(() => {
                const links = [];
                document.querySelectorAll('.navbar a').forEach(link => {
                    if (link.href && !link.href.includes('#')) {
                        links.push({
                            text: link.textContent.trim(),
                            href: link.href
                        });
                    }
                });
                return links;
            });
            
            console.log(`   📊 Found ${navigationLinks.length} navigation links`);
            
            // Check for critical service links
            const criticalLinks = [
                '/pages/assistenza-it.html',
                '/pages/sicurezza-informatica.html',
                '/pages/cloud-storage.html'
            ];
            
            for (const criticalLink of criticalLinks) {
                const found = navigationLinks.some(link => link.href.includes(criticalLink));
                if (!found && !pageTest.url.includes(criticalLink)) {
                    console.log(`   ⚠️  Missing critical link: ${criticalLink}`);
                }
            }
            
            results.passed.push(pageTest);
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            results.failed.push({ ...pageTest, error: error.message });
        }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed.length} pages`);
    console.log(`❌ Failed: ${results.failed.length} pages`);
    console.log(`🚫 Missing: ${results.missing.length} pages`);
    
    if (results.missing.length > 0) {
        console.log('\n🚫 MISSING PAGES (404):');
        results.missing.forEach(page => {
            console.log(`   - ${page.name}: ${page.url}`);
        });
    }
    
    if (results.failed.length > 0) {
        console.log('\n❌ FAILED PAGES:');
        results.failed.forEach(page => {
            console.log(`   - ${page.name}: ${page.error}`);
        });
    }
    
    await browser.close();
    
    // Return exit code
    const exitCode = (results.failed.length + results.missing.length) > 0 ? 1 : 0;
    process.exit(exitCode);
}

// Run the test
testITERANavigation().catch(console.error);