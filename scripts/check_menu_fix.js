const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function checkMenuFix(templatePath, templateName) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.setViewport({ width: 1200, height: 800 });
        await page.goto(`file://${templatePath}`, { waitUntil: 'networkidle0', timeout: 10000 });
        
        // Check if body has padding-top
        const bodyPaddingTop = await page.evaluate(() => {
            const body = document.body;
            const styles = window.getComputedStyle(body);
            return styles.paddingTop;
        });
        
        // Check navbar height
        const navbarHeight = await page.evaluate(() => {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                const rect = navbar.getBoundingClientRect();
                return rect.height;
            }
            return 0;
        });
        
        // Check if first content element is visible
        const firstContentVisible = await page.evaluate(() => {
            const firstSection = document.querySelector('section, main, .hero-section');
            if (firstSection) {
                const rect = firstSection.getBoundingClientRect();
                return rect.top >= 0;
            }
            return false;
        });
        
        console.log(`📋 ${templateName}:`);
        console.log(`   Body padding-top: ${bodyPaddingTop}`);
        console.log(`   Navbar height: ${navbarHeight}px`);
        console.log(`   Content visible: ${firstContentVisible ? '✅' : '❌'}`);
        
        // Take screenshot focusing on top area
        const screenshotPath = path.join(path.dirname(templatePath), '..', 'screenshots', `menu-fix-${templateName.replace('.html', '')}.png`);
        await page.screenshot({ 
            path: screenshotPath, 
            clip: { x: 0, y: 0, width: 1200, height: 600 }
        });
        
    } catch (error) {
        console.log(`   ❌ Check failed: ${error.message}`);
    } finally {
        await browser.close();
    }
}

async function main() {
    const templatesDir = '/Users/andreapanzeri/progetti/IT-ERA/templates';
    const templates = fs.readdirSync(templatesDir).filter(file => file.endsWith('.html'));
    
    console.log('🔍 Checking menu fixes...\n');
    
    for (const template of templates) {
        const templatePath = path.join(templatesDir, template);
        await checkMenuFix(templatePath, template);
    }
    
    console.log('\n✅ Menu check completed!');
}

main().catch(console.error);