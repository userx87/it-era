const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const VALIDATION_CONFIG = {
  cities: [
    'romano-di-lombardia', 'milano', 'bergamo', 'brescia', 'como',
    'cremona', 'mantova', 'pavia', 'sondrio', 'varese'
  ],
  baseUrl: 'https://it-era.it',
  localPath: '../web/pages-generated',
  tests: {
    statusCode: true,
    h1Present: true,
    metaDescription: true,
    wordCount: 300,
    consoleErrors: false,
    ga4Present: true
  }
};

async function validatePage(page, pageUrl, pageName) {
  const results = {
    name: pageName,
    url: pageUrl,
    tests: {},
    errors: []
  };

  try {
    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const response = await page.goto(pageUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Test 1: HTTP Status
    results.tests.statusCode = {
      expected: 200,
      actual: response.status(),
      pass: response.status() === 200
    };

    // Test 2: H1 Present and Correct
    const h1Text = await page.$eval('h1', el => el.textContent).catch(() => null);
    results.tests.h1Present = {
      expected: 'Present and contains city name',
      actual: h1Text || 'Missing',
      pass: h1Text && h1Text.toLowerCase().includes('romano di lombardia')
    };

    // Test 3: Meta Description Length
    const metaDesc = await page.$eval('meta[name="description"]', 
      el => el.getAttribute('content')).catch(() => '');
    const descLength = metaDesc.length;
    results.tests.metaDescription = {
      expected: '120-160 characters',
      actual: `${descLength} chars: "${metaDesc.substring(0, 50)}..."`,
      pass: descLength >= 120 && descLength <= 160
    };

    // Test 4: Word Count
    const bodyText = await page.$eval('body', el => el.innerText).catch(() => '');
    const wordCount = bodyText.split(/\s+/).length;
    results.tests.wordCount = {
      expected: '>=300 words',
      actual: `${wordCount} words`,
      pass: wordCount >= 300
    };

    // Test 5: Console Errors
    results.tests.consoleErrors = {
      expected: 'No errors',
      actual: `${consoleErrors.length} errors`,
      pass: consoleErrors.length === 0,
      details: consoleErrors.slice(0, 3)
    };

    // Test 6: GA4 Present
    const ga4Present = await page.evaluate(() => {
      return !!window.gtag || !!window.dataLayer || 
             document.querySelector('script[src*="googletagmanager.com/gtag"]');
    });
    results.tests.ga4Present = {
      expected: 'GA4 tracking present',
      actual: ga4Present ? 'Present' : 'Missing',
      pass: ga4Present
    };

  } catch (error) {
    results.errors.push(error.message);
  }

  return results;
}

async function runValidation() {
  console.log('🚀 Starting Puppeteer validation...');
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPages: 0,
      passedPages: 0,
      failedPages: 0
    },
    pages: []
  };

  // Test the one page we found
  const pageUrl = `${VALIDATION_CONFIG.baseUrl}/assistenza-it-romano-di-lombardia`;
  console.log(`Testing: ${pageUrl}`);
  
  const pageResult = await validatePage(page, pageUrl, 'assistenza-it-romano-di-lombardia');
  results.pages.push(pageResult);
  
  // Calculate summary
  results.summary.totalPages = results.pages.length;
  results.pages.forEach(page => {
    const allTestsPassed = Object.values(page.tests).every(test => test.pass);
    if (allTestsPassed && page.errors.length === 0) {
      results.summary.passedPages++;
    } else {
      results.summary.failedPages++;
    }
  });

  await browser.close();
  
  // Save results
  await fs.writeFile('reports/puppeteer-results.json', JSON.stringify(results, null, 2));
  
  console.log('✅ Validation complete');
  console.log(`📊 Summary: ${results.summary.passedPages}/${results.summary.totalPages} pages passed`);
  
  return results;
}

if (require.main === module) {
  runValidation().catch(console.error);
}

module.exports = { runValidation };