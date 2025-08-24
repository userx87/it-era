const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testPage(pagePath, pageName) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.setViewport({ width: 1200, height: 800 });
        await page.goto(`file://${pagePath}`, { waitUntil: 'networkidle0', timeout: 10000 });
        
        // Check unified components
        const hasUnifiedNav = await page.$eval('.navbar', el => {
            return el.textContent.includes('IT-ERA') && el.textContent.includes('039 888 2041');
        }).catch(() => false);
        
        const hasUnifiedFooter = await page.$eval('footer', el => {
            return el.textContent.includes('Viale Risorgimento 32') && el.textContent.includes('Vimercate MB');
        }).catch(() => false);
        
        const hasMenuFix = await page.evaluate(() => {
            const styles = window.getComputedStyle(document.body);
            return styles.paddingTop === '76px';
        });
        
        const hasMainContent = await page.$('#main-content').then(el => !!el).catch(() => false);
        
        console.log(`\n📄 ${pageName}:`);
        console.log(`   Unified Nav: ${hasUnifiedNav ? '✅' : '❌'}`);
        console.log(`   Unified Footer: ${hasUnifiedFooter ? '✅' : '❌'}`);
        console.log(`   Menu Fix Applied: ${hasMenuFix ? '✅' : '❌'}`);
        console.log(`   Main Content: ${hasMainContent ? '✅' : '❌'}`);
        
        // Take screenshot
        const screenshotPath = path.join('screenshots', `sample-${pageName.replace('.html', '')}.png`);
        await page.screenshot({ 
            path: screenshotPath,
            clip: { x: 0, y: 0, width: 1200, height: 600 }
        });
        
        return hasUnifiedNav && hasUnifiedFooter && hasMenuFix;
        
    } catch (error) {
        console.log(`   ❌ Test failed: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

async function main() {
    const testPages = [
        '/Users/andreapanzeri/progetti/IT-ERA/web/pages/cloud-storage-sovico.html',
        '/Users/andreapanzeri/progetti/IT-ERA/web/pages/sicurezza-informatica-rovello-porro.html',
        '/Users/andreapanzeri/progetti/IT-ERA/web/pages/assistenza-it-scanzorosciate.html',
        '/Users/andreapanzeri/progetti/IT-ERA/web/pages-draft/assistenza-it-milano.html',
        '/Users/andreapanzeri/progetti/IT-ERA/web/pages-draft/cloud-storage-monza.html'
    ];
    
    console.log('🔍 Testing sample pages with unified components...\n');
    
    let successful = 0;
    for (const pagePath of testPages) {
        if (fs.existsSync(pagePath)) {
            const pageName = path.basename(pagePath);
            const result = await testPage(pagePath, pageName);
            if (result) successful++;
        }
    }
    
    console.log(`\n✅ ${successful}/${testPages.length} pages passed all checks`);
}

main().catch(console.error);