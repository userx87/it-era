const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function validateTemplate(templatePath, templateName) {
    console.log(`\n🔍 Validating ${templateName}...`);
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Set viewport
        await page.setViewport({ width: 1200, height: 800 });
        
        // Navigate to template
        await page.goto(`file://${templatePath}`, { waitUntil: 'networkidle0', timeout: 10000 });
        
        // Check if page loads
        const title = await page.title();
        console.log(`   📄 Title: ${title}`);
        
        // Check for missing images
        const missingImages = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'));
            return images.filter(img => !img.complete || img.naturalHeight === 0).map(img => img.src);
        });
        
        if (missingImages.length > 0) {
            console.log(`   ⚠️ Missing images: ${missingImages.length}`);
            missingImages.forEach(src => console.log(`     - ${src}`));
        } else {
            console.log(`   ✅ All images loaded successfully`);
        }
        
        // Check for JavaScript errors
        const jsErrors = [];
        page.on('pageerror', error => {
            jsErrors.push(error.message);
        });
        
        // Wait a moment for JS to execute
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (jsErrors.length > 0) {
            console.log(`   ⚠️ JavaScript errors: ${jsErrors.length}`);
            jsErrors.forEach(error => console.log(`     - ${error}`));
        } else {
            console.log(`   ✅ No JavaScript errors`);
        }
        
        // Check for key elements
        const headerExists = await page.$('nav, header') !== null;
        const footerExists = await page.$('footer') !== null;
        const mainContentExists = await page.$('main, section') !== null;
        
        console.log(`   📋 Structure check:`);
        console.log(`     Header/Nav: ${headerExists ? '✅' : '❌'}`);
        console.log(`     Main Content: ${mainContentExists ? '✅' : '❌'}`);
        console.log(`     Footer: ${footerExists ? '✅' : '❌'}`);
        
        // Take screenshot
        const screenshotPath = path.join(path.dirname(templatePath), '..', 'screenshots', `${templateName.replace('.html', '')}.png`);
        await fs.promises.mkdir(path.dirname(screenshotPath), { recursive: true });
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`   📸 Screenshot saved: ${screenshotPath}`);
        
    } catch (error) {
        console.log(`   ❌ Validation failed: ${error.message}`);
    } finally {
        await browser.close();
    }
}

async function main() {
    const templatesDir = '/Users/andreapanzeri/progetti/IT-ERA/templates';
    const templates = fs.readdirSync(templatesDir).filter(file => file.endsWith('.html'));
    
    console.log('🚀 Starting template validation...\n');
    console.log(`Found ${templates.length} templates to validate:\n`);
    
    for (const template of templates) {
        const templatePath = path.join(templatesDir, template);
        await validateTemplate(templatePath, template);
    }
    
    console.log('\n✅ Template validation completed!');
}

main().catch(console.error);