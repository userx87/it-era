/*!
 * IT-ERA Simple Navigation Test
 * Basic test to verify navigation components are loading
 */

const puppeteer = require('puppeteer');

async function testPage(page, url, pageName) {
    console.log(`\n🧪 Testing: ${pageName}`);
    console.log(`📍 URL: ${url}`);
    
    try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for components
        
        // Check if header placeholder exists
        const headerPlaceholder = await page.$('#header-placeholder');
        console.log(`📦 Header placeholder: ${headerPlaceholder ? '✅ Found' : '❌ Missing'}`);
        
        // Check if header content loaded
        const headerContent = await page.$('#header-placeholder header, header');
        console.log(`🎯 Header content: ${headerContent ? '✅ Loaded' : '❌ Not loaded'}`);
        
        // Check navigation links
        const navLinks = await page.$$('nav a, .nav-link');
        console.log(`🔗 Navigation links: ${navLinks.length} found`);
        
        // Check mobile menu
        const mobileMenu = await page.$('#mobile-menu-button');
        console.log(`📱 Mobile menu button: ${mobileMenu ? '✅ Found' : '❌ Missing'}`);
        
        // Check footer
        const footer = await page.$('footer');
        console.log(`🦶 Footer: ${footer ? '✅ Found' : '❌ Missing'}`);
        
        // Check chatbot
        const chatbot = await page.$('#chatbot-button, #chatbot-placeholder');
        console.log(`💬 Chatbot: ${chatbot ? '✅ Found' : '❌ Missing'}`);
        
        // Check for JavaScript errors
        const errors = await page.evaluate(() => {
            return window.errors || [];
        });
        
        if (errors.length > 0) {
            console.log(`❌ JavaScript errors: ${errors.length}`);
            errors.forEach(error => console.log(`   - ${error}`));
        } else {
            console.log(`✅ No JavaScript errors`);
        }
        
        return {
            page: pageName,
            headerPlaceholder: !!headerPlaceholder,
            headerContent: !!headerContent,
            navLinks: navLinks.length,
            mobileMenu: !!mobileMenu,
            footer: !!footer,
            chatbot: !!chatbot,
            errors: errors.length
        };
        
    } catch (error) {
        console.log(`❌ Error testing ${pageName}: ${error.message}`);
        return {
            page: pageName,
            error: error.message
        };
    }
}

async function runSimpleTest() {
    console.log('🚀 Starting Simple Navigation Test...');
    
    const browser = await puppeteer.launch({ 
        headless: false, // Show browser for debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
        console.log(`❌ Page error: ${error.message}`);
    });
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`❌ Console error: ${msg.text()}`);
        }
    });
    
    const baseUrl = 'file://' + __dirname;
    const results = [];
    
    // Test key pages
    const testPages = [
        { name: 'Homepage', path: 'index.html' },
        { name: 'Servizi', path: 'servizi.html' },
        { name: 'Contatti', path: 'contatti.html' },
        { name: 'Commercialisti', path: 'settori/commercialisti.html' },
        { name: 'Landing Emergency', path: 'landing/assistenza-emergenza.html' }
    ];
    
    for (const pageInfo of testPages) {
        const url = `${baseUrl}/${pageInfo.path}`;
        const result = await testPage(page, url, pageInfo.name);
        results.push(result);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    results.forEach(result => {
        if (result.error) {
            console.log(`❌ ${result.page}: ERROR - ${result.error}`);
        } else {
            const score = [
                result.headerPlaceholder,
                result.headerContent,
                result.navLinks >= 3,
                result.mobileMenu,
                result.footer,
                result.chatbot,
                result.errors === 0
            ].filter(Boolean).length;
            
            console.log(`${score >= 6 ? '✅' : '⚠️'} ${result.page}: ${score}/7 checks passed`);
        }
    });
    
    console.log('\n🔍 Keep browser open for manual inspection...');
    console.log('Press Ctrl+C to close when done.');
    
    // Keep browser open for manual inspection
    await new Promise(() => {}); // Wait indefinitely
}

if (require.main === module) {
    runSimpleTest().catch(console.error);
}
