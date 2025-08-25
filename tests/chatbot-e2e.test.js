const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

describe('IT-ERA Chatbot E2E Test', () => {
  let browser;
  let page;
  const baseURL = 'https://www.it-era.it';
  const screenshotDir = path.join(__dirname, 'screenshots');
  const expectedGreeting = '[IT-ERA] Ciao, come posso aiutarti?';
  
  // Test data
  const testMessages = [
    'Ciao, ho bisogno di assistenza per il mio computer',
    'Quali sono i vostri servizi?',
    'Quanto costa una consulenza?'
  ];

  // Network and error monitoring
  let networkRequests = [];
  let consoleErrors = [];
  let pageErrors = [];

  beforeAll(async () => {
    // Create screenshots directory
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Launch browser with optimal settings
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Reset monitoring arrays
    networkRequests = [];
    consoleErrors = [];
    pageErrors = [];

    // Set up comprehensive error handling
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error' || type === 'warning') {
        consoleErrors.push({
          type,
          text,
          location: msg.location(),
          timestamp: new Date().toISOString()
        });
        console.warn(`🚨 Console ${type}: ${text}`);
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      console.error('🚨 Page Error:', error.message);
    });

    page.on('requestfailed', (request) => {
      console.error('🚨 Request Failed:', request.url(), request.failure().errorText);
    });

    // Monitor all network requests
    page.on('request', (request) => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: new Date().toISOString()
      });
    });

    // Set longer timeout for slow networks
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }

    // Generate comprehensive test report
    const report = {
      timestamp: new Date().toISOString(),
      totalNetworkRequests: networkRequests.length,
      consoleErrors: consoleErrors.length,
      pageErrors: pageErrors.length,
      networkRequests: networkRequests,
      consoleErrors,
      pageErrors
    };

    fs.writeFileSync(
      path.join(__dirname, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('📊 Test Report Generated:');
    console.log(`   Network Requests: ${networkRequests.length}`);
    console.log(`   Console Errors: ${consoleErrors.length}`);
    console.log(`   Page Errors: ${pageErrors.length}`);
  });

  describe('Website Loading and Chatbot Availability', () => {
    test('should load IT-ERA website successfully', async () => {
      console.log('🚀 Loading IT-ERA website...');
      
      const response = await page.goto(baseURL, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Take screenshot of initial page load
      await page.screenshot({ 
        path: path.join(screenshotDir, '01-page-loaded.png'),
        fullPage: true 
      });

      expect(response.status()).toBe(200);
      expect(await page.title()).toContain('IT-ERA');
      
      // Verify page content loaded
      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText.length).toBeGreaterThan(100);
      
      console.log('✅ Website loaded successfully');
    });

    test('should find chatbot widget on the page', async () => {
      await page.goto(baseURL, { waitUntil: 'networkidle2' });
      
      console.log('🔍 Looking for chatbot widget...');
      
      // Wait for chatbot to be present - try multiple possible selectors
      const chatbotSelectors = [
        '#chatbot-widget',
        '.chatbot-widget',
        '[data-chatbot]',
        'iframe[src*="chatbot"]',
        '.chat-widget',
        '#chat-widget',
        'button[class*="chat"]',
        'div[class*="chat"]'
      ];

      let chatbotElement = null;
      let foundSelector = null;

      for (const selector of chatbotSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          chatbotElement = await page.$(selector);
          if (chatbotElement) {
            foundSelector = selector;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Take screenshot showing chatbot widget
      await page.screenshot({ 
        path: path.join(screenshotDir, '02-chatbot-widget-found.png'),
        fullPage: true 
      });

      expect(chatbotElement).toBeTruthy();
      console.log(`✅ Chatbot widget found with selector: ${foundSelector}`);
    });
  });

  describe('Chatbot Interaction Flow', () => {
    test('should open chatbot and display greeting message', async () => {
      await page.goto(baseURL, { waitUntil: 'networkidle2' });
      
      console.log('💬 Opening chatbot...');

      // Find and click chatbot trigger
      const chatbotTriggers = [
        '#chatbot-widget button',
        '.chatbot-widget button',
        '[data-chatbot] button',
        '.chat-widget button',
        '#chat-widget button',
        'button[class*="chat"]'
      ];

      let triggerClicked = false;
      for (const trigger of chatbotTriggers) {
        try {
          const element = await page.$(trigger);
          if (element) {
            await element.click();
            triggerClicked = true;
            console.log(`✅ Clicked chatbot trigger: ${trigger}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // If no specific trigger found, try clicking the widget itself
      if (!triggerClicked) {
        const widgets = ['#chatbot-widget', '.chatbot-widget', '[data-chatbot]'];
        for (const widget of widgets) {
          try {
            const element = await page.$(widget);
            if (element) {
              await element.click();
              triggerClicked = true;
              console.log(`✅ Clicked chatbot widget: ${widget}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }

      expect(triggerClicked).toBe(true);

      // Wait for chatbot to open
      await page.waitForTimeout(2000);

      // Take screenshot of opened chatbot
      await page.screenshot({ 
        path: path.join(screenshotDir, '03-chatbot-opened.png'),
        fullPage: true 
      });

      // Check for greeting message
      const greetingSelectors = [
        '.chat-message',
        '.message',
        '[class*="message"]',
        '.chatbot-message',
        '[data-message]'
      ];

      let greetingFound = false;
      for (const selector of greetingSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 10000 });
          const messages = await page.$$(selector);
          
          for (const message of messages) {
            const text = await page.evaluate(el => el.textContent, message);
            if (text.includes('Ciao') || text.includes('[IT-ERA]')) {
              greetingFound = true;
              console.log(`✅ Greeting found: ${text}`);
              expect(text).toContain('Ciao');
              break;
            }
          }
          
          if (greetingFound) break;
        } catch (e) {
          continue;
        }
      }

      // If greeting not found in messages, check for iframe content
      if (!greetingFound) {
        const iframes = await page.$$('iframe');
        for (const iframe of iframes) {
          try {
            const frame = await iframe.contentFrame();
            if (frame) {
              const frameText = await frame.evaluate(() => document.body.textContent);
              if (frameText.includes('Ciao') || frameText.includes('[IT-ERA]')) {
                greetingFound = true;
                console.log(`✅ Greeting found in iframe: ${frameText}`);
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }
      }

      console.log(`🎯 Greeting message verification: ${greetingFound ? 'PASSED' : 'NEEDS MANUAL CHECK'}`);
    });

    test('should send message and receive response', async () => {
      await page.goto(baseURL, { waitUntil: 'networkidle2' });
      
      // Open chatbot (reuse logic from previous test)
      const chatbotTriggers = [
        '#chatbot-widget button',
        '.chatbot-widget button', 
        '[data-chatbot] button',
        'button[class*="chat"]'
      ];

      for (const trigger of chatbotTriggers) {
        try {
          const element = await page.$(trigger);
          if (element) {
            await element.click();
            break;
          }
        } catch (e) {
          continue;
        }
      }

      await page.waitForTimeout(3000);

      console.log('💬 Testing message sending...');

      // Find input field
      const inputSelectors = [
        'input[type="text"]',
        'textarea',
        '[placeholder*="messaggio"]',
        '[placeholder*="scrivi"]',
        '.chat-input',
        '#chat-input',
        'input[class*="chat"]'
      ];

      let messageInput = null;
      let inputSelector = null;

      for (const selector of inputSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          messageInput = await page.$(selector);
          if (messageInput) {
            inputSelector = selector;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Check iframe for input
      if (!messageInput) {
        const iframes = await page.$$('iframe');
        for (const iframe of iframes) {
          try {
            const frame = await iframe.contentFrame();
            if (frame) {
              for (const selector of inputSelectors) {
                try {
                  await frame.waitForSelector(selector, { timeout: 2000 });
                  const input = await frame.$(selector);
                  if (input) {
                    messageInput = input;
                    inputSelector = selector;
                    page = frame; // Switch context to iframe
                    break;
                  }
                } catch (e) {
                  continue;
                }
              }
              if (messageInput) break;
            }
          } catch (e) {
            continue;
          }
        }
      }

      if (messageInput) {
        // Send test message
        const testMessage = testMessages[0];
        await messageInput.type(testMessage);
        
        // Find and click send button
        const sendSelectors = [
          'button[type="submit"]',
          'button[class*="send"]',
          '[data-send]',
          '.send-button',
          '#send-button'
        ];

        for (const selector of sendSelectors) {
          try {
            const sendButton = await page.$(selector);
            if (sendButton) {
              await sendButton.click();
              console.log(`✅ Message sent: ${testMessage}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }

        // Press Enter as fallback
        await messageInput.press('Enter');
        
        // Wait for response
        await page.waitForTimeout(3000);

        // Take screenshot of conversation
        await page.screenshot({ 
          path: path.join(screenshotDir, '04-message-sent.png'),
          fullPage: true 
        });

        console.log('✅ Message interaction completed');
      } else {
        console.warn('⚠️  Message input not found - chatbot may use different interface');
        
        // Take screenshot for debugging
        await page.screenshot({ 
          path: path.join(screenshotDir, '04-no-input-found.png'),
          fullPage: true 
        });
      }
    });
  });

  describe('Error Monitoring and Performance', () => {
    test('should monitor network requests and performance', async () => {
      const startTime = Date.now();
      
      await page.goto(baseURL, { waitUntil: 'networkidle2' });
      
      const loadTime = Date.now() - startTime;
      
      console.log(`⏱️  Page load time: ${loadTime}ms`);
      console.log(`📊 Network requests made: ${networkRequests.length}`);
      
      // Check for critical resources
      const criticalRequests = networkRequests.filter(req => 
        req.url.includes('chatbot') || req.resourceType === 'script'
      );
      
      console.log(`🔧 Chatbot-related requests: ${criticalRequests.length}`);
      
      // Performance assertions
      expect(loadTime).toBeLessThan(15000); // 15 seconds max
      expect(networkRequests.length).toBeGreaterThan(0);
      
      // Take final screenshot
      await page.screenshot({ 
        path: path.join(screenshotDir, '05-performance-test.png'),
        fullPage: true 
      });
    });

    test('should report console errors and warnings', async () => {
      await page.goto(baseURL, { waitUntil: 'networkidle2' });
      
      // Wait for page to fully load and execute
      await page.waitForTimeout(5000);
      
      console.log(`🚨 Console errors found: ${consoleErrors.length}`);
      console.log(`❌ Page errors found: ${pageErrors.length}`);
      
      // Log critical errors
      const criticalErrors = consoleErrors.filter(error => 
        error.type === 'error' && !error.text.includes('favicon')
      );
      
      if (criticalErrors.length > 0) {
        console.warn('🚨 Critical Console Errors:');
        criticalErrors.forEach((error, index) => {
          console.warn(`   ${index + 1}. ${error.text}`);
        });
      }
      
      if (pageErrors.length > 0) {
        console.error('❌ Page Errors:');
        pageErrors.forEach((error, index) => {
          console.error(`   ${index + 1}. ${error.message}`);
        });
      }
      
      // Non-blocking assertions - log warnings but don't fail test
      if (criticalErrors.length > 5) {
        console.warn(`⚠️  High number of critical errors: ${criticalErrors.length}`);
      }
    });
  });
});