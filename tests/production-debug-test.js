/**
 * Production Chatbot Debug Test
 * Comprehensive analysis of IT-ERA production site to debug chatbot loading issues
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

describe('Production Site Chatbot Debug Analysis', () => {
  let browser, page;
  const PRODUCTION_URL = 'https://it-era.pages.dev/';
  const DEBUG_DIR = path.join(__dirname, 'debug-output');
  
  beforeAll(async () => {
    // Ensure debug directory exists
    try {
      await fs.mkdir(DEBUG_DIR, { recursive: true });
    } catch (err) {
      // Directory already exists
    }
    
    browser = await puppeteer.launch({
      headless: false, // Run in visible mode for debugging
      devtools: true,  // Open DevTools
      slowMo: 250,     // Slow down operations for visibility
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    page = await browser.newPage();
    
    // Set viewport to desktop size
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable request interception for network analysis
    await page.setRequestInterception(true);
    
    // Track all network requests
    const requests = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        type: request.resourceType(),
        headers: request.headers()
      });
      request.continue();
    });
    
    // Track responses
    const responses = [];
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers()
      });
    });
    
    // Track console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });
    
    // Track JavaScript errors
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push({
        message: error.message,
        stack: error.stack
      });
    });
    
    // Store references for later use
    page.requests = requests;
    page.responses = responses;
    page.consoleLogs = consoleLogs;
    page.jsErrors = jsErrors;
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('1. Basic Site Load and Screenshot', async () => {
    console.log('🔍 Loading production site...');
    
    // Load the main page with extended timeout
    await page.goto(PRODUCTION_URL, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait additional time for any delayed scripts
    await page.waitForTimeout(5000);
    
    // Take full page screenshot
    await page.screenshot({
      path: path.join(DEBUG_DIR, '01-initial-load.png'),
      fullPage: true
    });
    
    console.log('✅ Initial page loaded and screenshot saved');
    
    // Get page title and URL
    const title = await page.title();
    const url = page.url();
    
    expect(title).toBeDefined();
    expect(url).toBe(PRODUCTION_URL);
    
    console.log(`📄 Page Title: ${title}`);
    console.log(`🌐 Current URL: ${url}`);
  });

  test('2. HTML Source Analysis', async () => {
    console.log('🔍 Analyzing HTML source...');
    
    // Get full HTML content
    const htmlContent = await page.content();
    
    // Save HTML to file for analysis
    await fs.writeFile(
      path.join(DEBUG_DIR, '02-page-source.html'),
      htmlContent,
      'utf8'
    );
    
    // Analyze chatbot-related elements
    const chatbotAnalysis = {
      containsWidget: htmlContent.includes('chat-widget'),
      containsChatbot: htmlContent.includes('chatbot'),
      containsCloudflare: htmlContent.includes('cloudflare'),
      containsWorker: htmlContent.includes('worker'),
      hasScriptTags: (htmlContent.match(/<script/g) || []).length,
      hasExternalScripts: (htmlContent.match(/<script[^>]*src=/g) || []).length
    };
    
    // Search for specific chatbot indicators
    const chatbotIndicators = [
      'chat-widget',
      'chatbot-container',
      'chat-button',
      'chat-iframe',
      'it-era-chat',
      'cloudflare-worker',
      'chat.js',
      'widget.js'
    ];
    
    const foundIndicators = chatbotIndicators.filter(indicator => 
      htmlContent.toLowerCase().includes(indicator.toLowerCase())
    );
    
    console.log('📊 Chatbot Analysis Results:');
    console.log(JSON.stringify(chatbotAnalysis, null, 2));
    console.log('🎯 Found Indicators:', foundIndicators);
    
    // Save analysis results
    await fs.writeFile(
      path.join(DEBUG_DIR, '02-chatbot-analysis.json'),
      JSON.stringify({
        analysis: chatbotAnalysis,
        foundIndicators,
        htmlLength: htmlContent.length
      }, null, 2),
      'utf8'
    );
  });

  test('3. Network Requests Analysis', async () => {
    console.log('🔍 Analyzing network requests...');
    
    // Filter requests for chatbot-related resources
    const chatbotRequests = page.requests.filter(req => 
      req.url.toLowerCase().includes('chat') ||
      req.url.toLowerCase().includes('widget') ||
      req.url.toLowerCase().includes('cloudflare') ||
      req.url.includes('it-era') ||
      req.type === 'script'
    );
    
    // Filter responses for errors
    const errorResponses = page.responses.filter(res => 
      res.status >= 400
    );
    
    console.log(`📡 Total Requests: ${page.requests.length}`);
    console.log(`🎯 Chatbot-related Requests: ${chatbotRequests.length}`);
    console.log(`❌ Error Responses: ${errorResponses.length}`);
    
    // Save network analysis
    const networkAnalysis = {
      totalRequests: page.requests.length,
      chatbotRequests: chatbotRequests.length,
      errorResponses: errorResponses.length,
      chatbotRequestDetails: chatbotRequests,
      errorDetails: errorResponses,
      allRequests: page.requests
    };
    
    await fs.writeFile(
      path.join(DEBUG_DIR, '03-network-analysis.json'),
      JSON.stringify(networkAnalysis, null, 2),
      'utf8'
    );
    
    console.log('🔗 Chatbot Requests Found:');
    chatbotRequests.forEach((req, index) => {
      console.log(`  ${index + 1}. ${req.method} ${req.url} (${req.type})`);
    });
    
    console.log('❌ Error Responses:');
    errorResponses.forEach((res, index) => {
      console.log(`  ${index + 1}. ${res.status} ${res.statusText} - ${res.url}`);
    });
  });

  test('4. DOM Element Search', async () => {
    console.log('🔍 Searching for chatbot DOM elements...');
    
    // Define multiple selector strategies
    const selectors = [
      '#chat-widget',
      '.chat-widget',
      '[id*="chat"]',
      '[class*="chat"]',
      '[data-chat]',
      'iframe[src*="chat"]',
      'script[src*="chat"]',
      'script[src*="widget"]',
      'div[id*="chatbot"]',
      '.chatbot-container',
      '#it-era-chat',
      '[data-testid*="chat"]'
    ];
    
    const elementResults = {};
    
    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector);
        elementResults[selector] = {
          found: elements.length > 0,
          count: elements.length,
          details: []
        };
        
        // Get details for found elements
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const element = elements[i];
          const tagName = await element.evaluate(el => el.tagName);
          const id = await element.evaluate(el => el.id);
          const className = await element.evaluate(el => el.className);
          const textContent = await element.evaluate(el => el.textContent?.substring(0, 100));
          
          elementResults[selector].details.push({
            tagName,
            id,
            className,
            textContent
          });
        }
        
        console.log(`${selector}: ${elements.length} element(s) found`);
      } catch (error) {
        elementResults[selector] = {
          found: false,
          error: error.message
        };
        console.log(`${selector}: Error - ${error.message}`);
      }
    }
    
    // Save DOM analysis
    await fs.writeFile(
      path.join(DEBUG_DIR, '04-dom-analysis.json'),
      JSON.stringify(elementResults, null, 2),
      'utf8'
    );
    
    // Take screenshot with DevTools open for element inspection
    await page.screenshot({
      path: path.join(DEBUG_DIR, '04-dom-inspection.png'),
      fullPage: true
    });
  });

  test('5. JavaScript Console and Error Analysis', async () => {
    console.log('🔍 Analyzing JavaScript console logs and errors...');
    
    console.log(`📝 Console Logs: ${page.consoleLogs.length}`);
    console.log(`❌ JavaScript Errors: ${page.jsErrors.length}`);
    
    // Filter for chatbot-related logs
    const chatbotLogs = page.consoleLogs.filter(log => 
      log.text.toLowerCase().includes('chat') ||
      log.text.toLowerCase().includes('widget') ||
      log.text.toLowerCase().includes('cloudflare')
    );
    
    console.log('💬 Chatbot-related Console Logs:');
    chatbotLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
    });
    
    console.log('🚨 JavaScript Errors:');
    page.jsErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.message}`);
      if (error.stack) {
        console.log(`     Stack: ${error.stack.substring(0, 200)}...`);
      }
    });
    
    // Save console analysis
    const consoleAnalysis = {
      totalLogs: page.consoleLogs.length,
      totalErrors: page.jsErrors.length,
      chatbotLogs,
      allLogs: page.consoleLogs,
      allErrors: page.jsErrors
    };
    
    await fs.writeFile(
      path.join(DEBUG_DIR, '05-console-analysis.json'),
      JSON.stringify(consoleAnalysis, null, 2),
      'utf8'
    );
  });

  test('6. Specific Page Tests', async () => {
    console.log('🔍 Testing specific pages for chatbot presence...');
    
    const pagesToTest = [
      '',  // Home page
      'pages/assistenza-it-milano.html',
      'pages/sicurezza-informatica-monza.html',
      'pages/cloud-storage-como.html'
    ];
    
    const pageResults = {};
    
    for (const pagePath of pagesToTest) {
      const fullUrl = PRODUCTION_URL + pagePath;
      console.log(`Testing: ${fullUrl}`);
      
      try {
        await page.goto(fullUrl, { 
          waitUntil: 'networkidle2',
          timeout: 15000 
        });
        
        await page.waitForTimeout(3000);
        
        // Check for chatbot elements
        const hasChatWidget = await page.$('#chat-widget') !== null;
        const hasChatButton = await page.$('.chat-button') !== null;
        const hasChatElements = await page.$$('[id*="chat"], [class*="chat"]');
        
        // Take screenshot
        const fileName = pagePath.replace(/[^a-zA-Z0-9]/g, '_') || 'home';
        await page.screenshot({
          path: path.join(DEBUG_DIR, `06-page-${fileName}.png`),
          fullPage: true
        });
        
        pageResults[pagePath || 'home'] = {
          url: fullUrl,
          loaded: true,
          hasChatWidget,
          hasChatButton,
          chatElementsCount: hasChatElements.length,
          title: await page.title()
        };
        
        console.log(`  ✅ Loaded - Chat elements: ${hasChatElements.length}`);
        
      } catch (error) {
        pageResults[pagePath || 'home'] = {
          url: fullUrl,
          loaded: false,
          error: error.message
        };
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    
    // Save page test results
    await fs.writeFile(
      path.join(DEBUG_DIR, '06-page-tests.json'),
      JSON.stringify(pageResults, null, 2),
      'utf8'
    );
  });

  test('7. Wait and Retry Strategy', async () => {
    console.log('🔍 Testing with extended wait times and retry strategies...');
    
    // Go back to home page
    await page.goto(PRODUCTION_URL, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    const waitStrategies = [
      { name: 'Immediate', wait: 0 },
      { name: '2 seconds', wait: 2000 },
      { name: '5 seconds', wait: 5000 },
      { name: '10 seconds', wait: 10000 },
      { name: '15 seconds', wait: 15000 }
    ];
    
    const waitResults = {};
    
    for (const strategy of waitStrategies) {
      console.log(`Testing wait strategy: ${strategy.name}`);
      
      if (strategy.wait > 0) {
        await page.waitForTimeout(strategy.wait);
      }
      
      // Check for various chatbot elements
      const results = {
        chatWidget: await page.$('#chat-widget') !== null,
        chatButton: await page.$('.chat-button') !== null,
        chatElements: (await page.$$('[id*="chat"], [class*="chat"]')).length,
        scripts: (await page.$$('script')).length,
        iframes: (await page.$$('iframe')).length
      };
      
      waitResults[strategy.name] = results;
      
      console.log(`  Results:`, results);
    }
    
    // Save wait strategy results
    await fs.writeFile(
      path.join(DEBUG_DIR, '07-wait-strategies.json'),
      JSON.stringify(waitResults, null, 2),
      'utf8'
    );
    
    // Final screenshot after all waits
    await page.screenshot({
      path: path.join(DEBUG_DIR, '07-final-state.png'),
      fullPage: true
    });
  });

  test('8. Generate Debug Report', async () => {
    console.log('📋 Generating comprehensive debug report...');
    
    const debugReport = {
      timestamp: new Date().toISOString(),
      productionUrl: PRODUCTION_URL,
      testEnvironment: {
        puppeteerVersion: puppeteer.version,
        nodeVersion: process.version,
        platform: process.platform
      },
      summary: {
        totalNetworkRequests: page.requests.length,
        chatbotRelatedRequests: page.requests.filter(req => 
          req.url.toLowerCase().includes('chat') ||
          req.url.toLowerCase().includes('widget')
        ).length,
        javascriptErrors: page.jsErrors.length,
        consoleWarnings: page.consoleLogs.filter(log => log.type === 'warning').length,
        httpErrors: page.responses.filter(res => res.status >= 400).length
      },
      recommendations: [
        'Check if chatbot script is properly deployed to Cloudflare Pages',
        'Verify chatbot JavaScript files are accessible',
        'Ensure chatbot initialization code is running after page load',
        'Check for JavaScript errors preventing chatbot loading',
        'Verify Cloudflare Worker is deployed and accessible',
        'Test chatbot functionality in different browsers',
        'Check if Content Security Policy is blocking chatbot scripts'
      ],
      filesGenerated: [
        '01-initial-load.png',
        '02-page-source.html',
        '02-chatbot-analysis.json',
        '03-network-analysis.json',
        '04-dom-analysis.json',
        '04-dom-inspection.png',
        '05-console-analysis.json',
        '06-page-tests.json',
        '06-page-*.png',
        '07-wait-strategies.json',
        '07-final-state.png',
        '08-debug-report.json'
      ]
    };
    
    // Save comprehensive debug report
    await fs.writeFile(
      path.join(DEBUG_DIR, '08-debug-report.json'),
      JSON.stringify(debugReport, null, 2),
      'utf8'
    );
    
    // Create human-readable summary
    const summaryText = `
# IT-ERA Production Chatbot Debug Report
Generated: ${debugReport.timestamp}

## Summary
- Production URL: ${debugReport.productionUrl}
- Total Network Requests: ${debugReport.summary.totalNetworkRequests}
- Chatbot-related Requests: ${debugReport.summary.chatbotRelatedRequests}
- JavaScript Errors: ${debugReport.summary.javascriptErrors}
- HTTP Errors: ${debugReport.summary.httpErrors}

## Key Findings
${debugReport.summary.chatbotRelatedRequests === 0 ? 
  '❌ NO CHATBOT REQUESTS FOUND - Chatbot scripts may not be deployed' :
  '✅ Chatbot requests detected'}

${debugReport.summary.javascriptErrors > 0 ? 
  `❌ ${debugReport.summary.javascriptErrors} JavaScript errors found - May prevent chatbot loading` :
  '✅ No JavaScript errors detected'}

## Recommendations
${debugReport.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

## Debug Files Generated
${debugReport.filesGenerated.map(file => `- ${file}`).join('\n')}

Check the debug-output directory for detailed analysis files and screenshots.
    `;
    
    await fs.writeFile(
      path.join(DEBUG_DIR, '08-SUMMARY.txt'),
      summaryText,
      'utf8'
    );
    
    console.log('✅ Debug report generated!');
    console.log(`📁 Check ${DEBUG_DIR} for all debug files`);
    console.log('\n' + summaryText);
  });
});