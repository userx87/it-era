const puppeteer = require('puppeteer');

async function testAllNavigationLinks() {
    console.log('🚀 IT-ERA Complete Navigation Test with Puppeteer\n');
    console.log('🌍 Testing deployment: https://c8508083.it-era.pages.dev\n');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    const baseUrl = 'https://c8508083.it-era.pages.dev';
    const results = {
        totalLinks: 0,
        workingLinks: [],
        brokenLinks: [],
        navigationStructure: {}
    };
    
    // First, test the homepage and extract all navigation links
    console.log('📄 Analyzing Homepage Navigation Structure...\n');
    
    try {
        await page.goto(baseUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Extract all navigation links
        const navigationLinks = await page.evaluate(() => {
            const links = [];
            const navElements = document.querySelectorAll('.navbar a[href]');
            
            navElements.forEach(link => {
                // Skip anchors and external links
                if (!link.href.startsWith('#') && 
                    !link.href.startsWith('tel:') && 
                    !link.href.startsWith('mailto:')) {
                    links.push({
                        text: link.textContent.trim().replace(/\s+/g, ' '),
                        href: link.href,
                        isDropdown: link.closest('.dropdown-menu') !== null
                    });
                }
            });
            
            return links;
        });
        
        console.log(`📊 Found ${navigationLinks.length} navigation links\n`);
        results.totalLinks = navigationLinks.length;
        
        // Test each link
        console.log('🔍 Testing Each Navigation Link:\n');
        console.log('-'.repeat(80));
        
        for (const link of navigationLinks) {
            const relativeUrl = link.href.replace(baseUrl, '').replace('https://c8508083.it-era.pages.dev', '');
            console.log(`Testing: ${link.text}`);
            console.log(`URL: ${relativeUrl}`);
            
            try {
                const response = await page.goto(link.href, {
                    waitUntil: 'domcontentloaded',
                    timeout: 10000
                });
                
                const status = response.status();
                
                if (status === 200) {
                    console.log(`✅ Status: ${status} - OK`);
                    
                    // Check if page has navigation
                    const hasNav = await page.$('.navbar') !== null;
                    const hasContent = await page.$('main, .container') !== null;
                    
                    console.log(`   Navigation: ${hasNav ? '✅' : '❌'} | Content: ${hasContent ? '✅' : '❌'}`);
                    
                    results.workingLinks.push({
                        text: link.text,
                        url: relativeUrl,
                        status: status,
                        hasNav: hasNav,
                        hasContent: hasContent
                    });
                } else if (status === 404) {
                    console.log(`❌ Status: ${status} - NOT FOUND`);
                    results.brokenLinks.push({
                        text: link.text,
                        url: relativeUrl,
                        status: status
                    });
                } else {
                    console.log(`⚠️  Status: ${status}`);
                    results.brokenLinks.push({
                        text: link.text,
                        url: relativeUrl,
                        status: status
                    });
                }
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
                results.brokenLinks.push({
                    text: link.text,
                    url: relativeUrl,
                    error: error.message
                });
            }
            
            console.log('-'.repeat(80));
        }
        
        // Test specific critical pages
        console.log('\n📋 Testing Critical Service Pages:\n');
        const criticalPages = [
            '/pages/assistenza-it.html',
            '/pages/sicurezza-informatica.html',
            '/pages/cloud-storage.html',
            '/pages/settori-pmi-startup.html',
            '/pages/settori-industria.html',
            '/pages/settori-retail.html',
            '/pages/contatti.html',
            '/pages/perche-it-era.html'
        ];
        
        for (const pagePath of criticalPages) {
            const url = baseUrl + pagePath;
            console.log(`Testing: ${pagePath}`);
            
            try {
                const response = await page.goto(url, {
                    waitUntil: 'domcontentloaded',
                    timeout: 10000
                });
                
                const status = response.status();
                console.log(`   Status: ${status === 200 ? '✅' : '❌'} ${status}`);
                
                if (status === 200) {
                    // Check navigation consistency
                    const hasServicesDropdown = await page.evaluate(() => {
                        const elements = Array.from(document.querySelectorAll('.dropdown-toggle'));
                        return elements.some(el => el.textContent.includes('Servizi'));
                    });
                    
                    const hasSettoriDropdown = await page.evaluate(() => {
                        const elements = Array.from(document.querySelectorAll('.dropdown-toggle'));
                        return elements.some(el => el.textContent.includes('Settori'));
                    });
                    
                    console.log(`   Servizi Dropdown: ${hasServicesDropdown ? '✅' : '❌'}`);
                    console.log(`   Settori Dropdown: ${hasSettoriDropdown ? '✅' : '❌'}`);
                }
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('Fatal error:', error);
    }
    
    // Generate summary report
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL TEST REPORT');
    console.log('='.repeat(80));
    console.log(`Total Links Tested: ${results.totalLinks}`);
    console.log(`✅ Working Links: ${results.workingLinks.length}`);
    console.log(`❌ Broken Links: ${results.brokenLinks.length}`);
    console.log(`Success Rate: ${Math.round((results.workingLinks.length / results.totalLinks) * 100)}%`);
    
    if (results.brokenLinks.length > 0) {
        console.log('\n❌ BROKEN LINKS FOUND:');
        results.brokenLinks.forEach(link => {
            console.log(`   - ${link.text}: ${link.url}`);
            if (link.status) console.log(`     Status: ${link.status}`);
            if (link.error) console.log(`     Error: ${link.error}`);
        });
    }
    
    // Check navigation consistency
    const inconsistentPages = results.workingLinks.filter(link => !link.hasNav);
    if (inconsistentPages.length > 0) {
        console.log('\n⚠️  PAGES WITH MISSING NAVIGATION:');
        inconsistentPages.forEach(page => {
            console.log(`   - ${page.text}: ${page.url}`);
        });
    }
    
    await browser.close();
    
    // Success if no broken links
    const exitCode = results.brokenLinks.length > 0 ? 1 : 0;
    console.log(`\n${exitCode === 0 ? '✅ All navigation links working!' : '❌ Some links need fixing'}`);
    process.exit(exitCode);
}

// Run the test
testAllNavigationLinks().catch(console.error);