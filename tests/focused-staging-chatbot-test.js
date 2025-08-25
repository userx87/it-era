const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

/**
 * FOCUSED STAGING CHATBOT TEST
 * Specifically tests https://it-era.pages.dev with detailed chatbot detection
 */

class FocusedStagingChatbotTest {
  constructor() {
    this.stagingUrl = 'https://it-era.pages.dev';
    this.results = {
      pageLoad: false,
      chatbotDetection: {},
      interaction: {},
      security: {},
      phoneValidation: {},
      screenshots: []
    };
  }

  async runTest() {
    console.log('🎯 FOCUSED STAGING CHATBOT TEST STARTING...');
    console.log(`🌐 Testing: ${this.stagingUrl}`);
    
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    try {
      const page = await browser.newPage();
      
      // Set desktop viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Phase 1: Page Load Test
      console.log('\n📍 PHASE 1: Loading staging page...');
      await page.goto(this.stagingUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const title = await page.title();
      console.log(`✅ Page loaded: ${title}`);
      this.results.pageLoad = true;
      
      // Take initial screenshot
      await this.takeScreenshot(page, 'initial-load');
      
      // Phase 2: Comprehensive Chatbot Detection
      console.log('\n🤖 PHASE 2: Comprehensive chatbot detection...');
      
      const chatbotAnalysis = await page.evaluate(() => {
        // Look for various chatbot patterns
        const selectors = [
          '#chatbot-widget',
          '[id*="chat"]',
          '[class*="chat"]',
          '[id*="bot"]',
          '[class*="bot"]',
          'iframe[src*="chat"]',
          '[data-chatbot]',
          '.chatbot',
          '#chat-widget',
          '.chat-widget',
          '[role="dialog"]',
          '.floating-chat',
          '#floating-chat',
          '.chat-button',
          '.chat-toggle',
          '.message-widget',
          '.widget-chat',
          'div[style*="position: fixed"]'
        ];
        
        const found = [];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            elements.forEach((el, index) => {
              found.push({
                selector,
                index,
                tagName: el.tagName,
                id: el.id,
                className: el.className,
                textContent: (el.textContent || '').substring(0, 100),
                style: el.getAttribute('style'),
                visible: el.offsetHeight > 0 && el.offsetWidth > 0,
                rect: el.getBoundingClientRect()
              });
            });
          }
        });
        
        // Look for iframes that might contain chatbot
        const iframes = document.querySelectorAll('iframe');
        const iframeInfo = Array.from(iframes).map((iframe, index) => ({
          index,
          src: iframe.src,
          id: iframe.id,
          className: iframe.className
        }));
        
        return {
          foundElements: found,
          iframes: iframeInfo,
          totalElements: found.length,
          bodyText: document.body.textContent.substring(0, 1000)
        };
      });
      
      console.log(`🔍 Found ${chatbotAnalysis.totalElements} potential chatbot elements:`);
      chatbotAnalysis.foundElements.forEach((el, i) => {
        console.log(`   ${i + 1}. ${el.selector} - ${el.tagName} (visible: ${el.visible})`);
      });
      
      this.results.chatbotDetection = chatbotAnalysis;
      await this.takeScreenshot(page, 'chatbot-detection');
      
      // Phase 3: Manual chatbot interaction attempt
      console.log('\n💬 PHASE 3: Attempting chatbot interaction...');
      
      let chatbotOpened = false;
      
      // Try clicking on each potential chatbot element
      for (let i = 0; i < chatbotAnalysis.foundElements.length; i++) {
        const element = chatbotAnalysis.foundElements[i];
        
        if (!element.visible) continue;
        
        console.log(`👆 Attempting to click element ${i + 1}: ${element.selector}`);
        
        try {
          // Try to click the element
          const clickResult = await page.evaluate((selector, index) => {
            const elements = document.querySelectorAll(selector);
            if (elements[index]) {
              elements[index].click();
              return true;
            }
            return false;
          }, element.selector, element.index);
          
          if (clickResult) {
            console.log('✅ Click successful, waiting for response...');
            await page.waitForTimeout(3000);
            
            // Check if chatbot opened
            const chatbotState = await page.evaluate(() => {
              // Look for chat interface elements
              const chatInputs = document.querySelectorAll('input[type="text"], textarea');
              const messages = document.querySelectorAll('[class*="message"], [class*="chat-message"]');
              const chatAreas = document.querySelectorAll('[class*="chat-area"], [class*="conversation"]');
              
              return {
                inputs: chatInputs.length,
                messages: messages.length,
                chatAreas: chatAreas.length,
                hasVisibleChat: Array.from(document.querySelectorAll('*')).some(el => {
                  const style = window.getComputedStyle(el);
                  return style.position === 'fixed' && 
                         style.zIndex > 1000 && 
                         el.offsetHeight > 200 &&
                         (el.textContent.includes('chat') || el.textContent.includes('message'));
                })
              };
            });
            
            console.log(`📊 Chat state: inputs=${chatbotState.inputs}, messages=${chatbotState.messages}, areas=${chatbotState.chatAreas}, visible=${chatbotState.hasVisibleChat}`);
            
            if (chatbotState.inputs > 0 || chatbotState.messages > 0 || chatbotState.hasVisibleChat) {
              chatbotOpened = true;
              console.log('🎉 Chatbot appears to be open!');
              await this.takeScreenshot(page, `chatbot-opened-${i}`);
              break;
            }
          }
        } catch (error) {
          console.log(`❌ Failed to click element ${i + 1}: ${error.message}`);
        }
      }
      
      // Phase 4: Search for greeting message
      console.log('\n📬 PHASE 4: Searching for greeting message...');
      
      const greetingAnalysis = await page.evaluate(() => {
        const text = document.body.textContent || document.body.innerText;
        
        return {
          hasITERA: text.includes('[IT-ERA]'),
          hasCiao: text.includes('Ciao, come posso aiutarti'),
          fullGreeting: text.includes('[IT-ERA] Ciao, come posso aiutarti?'),
          bodyTextSample: text.substring(0, 2000)
        };
      });
      
      console.log(`📝 Greeting analysis:`);
      console.log(`   Contains [IT-ERA]: ${greetingAnalysis.hasITERA}`);
      console.log(`   Contains greeting: ${greetingAnalysis.hasCiao}`);
      console.log(`   Full greeting found: ${greetingAnalysis.fullGreeting}`);
      
      this.results.interaction = {
        chatbotOpened,
        greeting: greetingAnalysis
      };
      
      // Phase 5: Security check
      console.log('\n🔒 PHASE 5: Security validation...');
      
      const securityCheck = await page.evaluate(() => {
        const text = document.body.textContent.toLowerCase();
        const suspiciousTerms = [
          'system:', 'prompt:', 'assistant:', 'ai model', 'openai', 
          'anthropic', 'claude', 'gpt', 'language model'
        ];
        
        const findings = suspiciousTerms.filter(term => text.includes(term));
        
        return {
          systemPromptExposed: findings.length > 0,
          exposedTerms: findings,
          safe: findings.length === 0
        };
      });
      
      console.log(`🔒 Security check: ${securityCheck.safe ? 'SAFE' : 'VULNERABLE'}`);
      if (!securityCheck.safe) {
        console.log(`⚠️  Exposed terms: ${securityCheck.exposedTerms.join(', ')}`);
      }
      
      this.results.security = securityCheck;
      
      // Phase 6: Phone number validation
      console.log('\n📞 PHASE 6: Phone number validation...');
      
      const phoneCheck = await page.evaluate(() => {
        const text = document.body.textContent || document.body.innerText;
        const phonePattern = /(039[\s\-\.]?888[\s\-\.]?2041)/g;
        const matches = text.match(phonePattern);
        
        return {
          found: matches !== null,
          count: matches ? matches.length : 0,
          formats: matches || [],
          locations: {
            header: false,
            footer: false,
            contact: false,
            body: matches !== null
          }
        };
      });
      
      console.log(`📞 Phone validation:`);
      console.log(`   Number found: ${phoneCheck.found}`);
      console.log(`   Occurrences: ${phoneCheck.count}`);
      console.log(`   Formats: ${phoneCheck.formats.join(', ')}`);
      
      this.results.phoneValidation = phoneCheck;
      
      // Final screenshot
      await this.takeScreenshot(page, 'final-state');
      
      // Generate report
      await this.generateReport();
      
    } finally {
      await browser.close();
    }
  }

  async takeScreenshot(page, name) {
    const screenshotPath = path.join(__dirname, 'screenshots', 'focused-test', `${name}.png`);
    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    this.results.screenshots.push(screenshotPath);
    console.log(`📸 Screenshot saved: ${name}.png`);
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    
    const report = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Focused Staging Chatbot Test Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1000px; margin: 0 auto; }
            .header { background: #0056cc; color: white; padding: 20px; border-radius: 8px; }
            .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; }
            .pass { color: #28a745; font-weight: bold; }
            .fail { color: #dc3545; font-weight: bold; }
            .warning { color: #ffc107; font-weight: bold; }
            .element { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 4px; }
            .screenshot { max-width: 300px; margin: 10px; border: 1px solid #ddd; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 Focused Staging Chatbot Test Report</h1>
                <p>URL: ${this.stagingUrl}</p>
                <p>Generated: ${timestamp}</p>
            </div>
            
            <div class="section">
                <h2>📍 Page Load Status</h2>
                <p class="${this.results.pageLoad ? 'pass' : 'fail'}">
                    ${this.results.pageLoad ? '✅ SUCCESS' : '❌ FAILED'}
                </p>
            </div>
            
            <div class="section">
                <h2>🤖 Chatbot Detection Results</h2>
                <p>Total potential chatbot elements found: <strong>${this.results.chatbotDetection.totalElements || 0}</strong></p>
                
                ${this.results.chatbotDetection.foundElements ? this.results.chatbotDetection.foundElements.map((el, i) => `
                    <div class="element">
                        <strong>Element ${i + 1}:</strong> ${el.selector}<br>
                        <strong>Tag:</strong> ${el.tagName}<br>
                        <strong>ID:</strong> ${el.id}<br>
                        <strong>Class:</strong> ${el.className}<br>
                        <strong>Visible:</strong> ${el.visible ? '✅' : '❌'}<br>
                        <strong>Text:</strong> ${el.textContent.substring(0, 100)}...
                    </div>
                `).join('') : '<p>No elements detected</p>'}
            </div>
            
            <div class="section">
                <h2>💬 Interaction Results</h2>
                <p><strong>Chatbot Opened:</strong> <span class="${this.results.interaction.chatbotOpened ? 'pass' : 'fail'}">${this.results.interaction.chatbotOpened ? '✅ YES' : '❌ NO'}</span></p>
                
                <h3>Greeting Analysis</h3>
                <ul>
                    <li>Contains [IT-ERA]: <span class="${this.results.interaction.greeting?.hasITERA ? 'pass' : 'fail'}">${this.results.interaction.greeting?.hasITERA ? '✅' : '❌'}</span></li>
                    <li>Contains greeting: <span class="${this.results.interaction.greeting?.hasCiao ? 'pass' : 'fail'}">${this.results.interaction.greeting?.hasCiao ? '✅' : '❌'}</span></li>
                    <li>Full greeting: <span class="${this.results.interaction.greeting?.fullGreeting ? 'pass' : 'fail'}">${this.results.interaction.greeting?.fullGreeting ? '✅' : '❌'}</span></li>
                </ul>
            </div>
            
            <div class="section">
                <h2>🔒 Security Validation</h2>
                <p><strong>Status:</strong> <span class="${this.results.security.safe ? 'pass' : 'fail'}">${this.results.security.safe ? '✅ SECURE' : '🚨 VULNERABLE'}</span></p>
                ${!this.results.security.safe ? `<p><strong>Exposed terms:</strong> ${this.results.security.exposedTerms.join(', ')}</p>` : ''}
            </div>
            
            <div class="section">
                <h2>📞 Phone Number Validation</h2>
                <p><strong>Number Found:</strong> <span class="${this.results.phoneValidation.found ? 'pass' : 'fail'}">${this.results.phoneValidation.found ? '✅ YES' : '❌ NO'}</span></p>
                <p><strong>Occurrences:</strong> ${this.results.phoneValidation.count}</p>
                <p><strong>Formats:</strong> ${this.results.phoneValidation.formats.join(', ')}</p>
            </div>
            
            <div class="section">
                <h2>📷 Screenshots</h2>
                <p>Total screenshots captured: ${this.results.screenshots.length}</p>
                <div style="display: flex; flex-wrap: wrap;">
                    ${this.results.screenshots.map(screenshot => `
                        <div>
                            <p>${path.basename(screenshot)}</p>
                            <img src="${screenshot}" class="screenshot" alt="Screenshot">
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
    
    const reportPath = path.join(__dirname, 'reports', `focused-staging-test-${Date.now()}.html`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, report);
    
    console.log(`\n📋 Focused test report generated: ${reportPath}`);
  }
}

// Main execution
async function runFocusedTest() {
  const tester = new FocusedStagingChatbotTest();
  
  try {
    await tester.runTest();
    console.log('\n🎉 Focused staging chatbot test completed!');
  } catch (error) {
    console.error('❌ Focused test failed:', error);
    throw error;
  }
}

module.exports = { FocusedStagingChatbotTest };

// Run if called directly
if (require.main === module) {
  runFocusedTest()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}