const puppeteer = require('puppeteer');

async function checkMenuConsistency() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    const urls = [
        'https://it-era.pages.dev/',
        'https://it-era.pages.dev/blog/',
        'https://it-era.pages.dev/pages/assistenza-it-milano.html'
    ];
    
    console.log('🔍 Checking menu consistency across pages...\n');
    
    for (const url of urls) {
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Check for Blog link in menu
        const hasBlogLink = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('.navbar a'));
            return links.some(link => link.textContent.includes('Blog'));
        });
        
        // Get all menu items
        const menuItems = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.navbar-nav > li > a'));
            return items.map(item => item.textContent.trim());
        });
        
        console.log(`📍 ${url}`);
        console.log(`   Has Blog link: ${hasBlogLink ? '✅' : '❌'}`);
        console.log(`   Menu items: ${menuItems.join(' | ')}`);
        console.log('');
    }
    
    await browser.close();
}

checkMenuConsistency().catch(console.error);