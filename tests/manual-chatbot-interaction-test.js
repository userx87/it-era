const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

/**
 * MANUAL CHATBOT INTERACTION TEST
 * Step-by-step chatbot interaction with detailed logging
 */

class ManualChatbotInteractionTest {
  constructor() {
    this.baseUrl = 'https://it-era.pages.dev';
    this.results = {
      steps: [],
      chatbotDetected: false,
      conversationStarted: false,
      greetingReceived: false,
      emergencyTested: false,
      phoneNumberVisible: false,
      screenshots: []
    };
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async logStep(step, success, details) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      step,
      success,
      details
    };
    
    this.results.steps.push(logEntry);
    console.log(`${success ? '✅' : '❌'} ${step}: ${details}`);
  }

  async takeScreenshot(page, name) {
    const screenshotPath = path.join(__dirname, 'screenshots', 'manual-interaction', `${name}.png`);
    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    this.results.screenshots.push({ name, path: screenshotPath });
    console.log(`📸 Screenshot: ${name}`);
  }

  async runManualTest() {
    console.log('👨‍💻 MANUAL CHATBOT INTERACTION TEST STARTING...');
    console.log('🌐 URL:', this.baseUrl);
    
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      devtools: true,
      slowMo: 100, // Slow down for better observation
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport
      await page.setViewport({ width: 1366, height: 768 });
      
      // Step 1: Load page
      console.log('\n🔄 Step 1: Loading page...');
      await page.goto(this.baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      
      const title = await page.title();
      await this.logStep('Page Load', true, `Title: ${title}`);
      await this.takeScreenshot(page, '01-page-loaded');
      
      // Step 2: Wait for page to fully load
      console.log('\n⏳ Step 2: Waiting for dynamic content...');
      await this.delay(5000);
      await this.takeScreenshot(page, '02-after-wait');
      
      // Step 3: Inspect all elements that might be chatbot
      console.log('\n🔍 Step 3: Comprehensive element inspection...');
      
      const allElements = await page.evaluate(() => {
        const selectors = [
          '#chatbot', '#chat-widget', '#chat-container', '#widget-chat',
          '.chatbot', '.chat-widget', '.chat-container', '.widget-chat',
          '[id*="chat"]', '[class*="chat"]', '[id*="bot"]', '[class*="bot"]',
          'iframe[src*="chat"]', '[data-widget="chat"]'
        ];
        
        const found = [];
        
        selectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el, index) => {
              const rect = el.getBoundingClientRect();
              const computedStyle = window.getComputedStyle(el);
              
              found.push({
                selector,
                index,
                tagName: el.tagName.toLowerCase(),
                id: el.id,
                className: el.className,
                textContent: (el.textContent || '').trim().substring(0, 200),
                innerHTML: (el.innerHTML || '').substring(0, 300),
                visible: rect.width > 0 && rect.height > 0 && computedStyle.visibility !== 'hidden',
                position: {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height
                },
                zIndex: computedStyle.zIndex,
                display: computedStyle.display,
                position_style: computedStyle.position
              });
            });
          } catch (error) {
            console.log(`Error with selector ${selector}:`, error.message);
          }
        });
        
        return found;
      });
      
      console.log(`🔍 Found ${allElements.length} potential chatbot elements:`);
      allElements.forEach((el, i) => {
        console.log(`   ${i + 1}. ${el.tagName}#${el.id || 'no-id'}.${el.className || 'no-class'}`);
        console.log(`      Selector: ${el.selector}`);
        console.log(`      Visible: ${el.visible} | Position: ${el.position_style} | Z-Index: ${el.zIndex}`);
        console.log(`      Text: "${el.textContent.substring(0, 100)}"`);
        console.log('      ---');
      });
      
      await this.logStep('Element Inspection', true, `Found ${allElements.length} elements`);
      
      // Step 4: Try to interact with each visible element
      console.log('\n👆 Step 4: Attempting interactions...');
      
      let interactionSuccess = false;
      
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        
        if (!element.visible) {
          console.log(`⏭️  Skipping invisible element ${i + 1}`);
          continue;
        }
        
        console.log(`\n🎯 Trying to interact with element ${i + 1}:`);
        console.log(`   Tag: ${element.tagName}, ID: ${element.id}, Class: ${element.className}`);
        
        try {
          // Try multiple interaction methods
          const clickResult = await page.evaluate((selector, index) => {
            const elements = document.querySelectorAll(selector);
            const el = elements[index];
            
            if (!el) return { success: false, error: 'Element not found' };
            
            try {
              // Try different event types
              el.click();
              el.dispatchEvent(new Event('click', { bubbles: true }));
              el.dispatchEvent(new Event('mousedown', { bubbles: true }));
              el.dispatchEvent(new Event('mouseup', { bubbles: true }));
              
              return { success: true, message: 'Click events dispatched' };
            } catch (error) {
              return { success: false, error: error.message };
            }
          }, element.selector, element.index);
          
          console.log(`   Click result:`, clickResult);
          
          if (clickResult.success) {
            await this.delay(3000); // Wait for potential response
            await this.takeScreenshot(page, `03-interaction-${i + 1}`);
            
            // Check if anything changed
            const changeDetection = await page.evaluate(() => {
              // Look for new elements, dialogs, input fields
              const chatInputs = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
              const dialogs = document.querySelectorAll('[role="dialog"], .modal, .popup, [class*="dialog"]');
              const messages = document.querySelectorAll('[class*="message"], [class*="chat-message"], .chat-bubble');
              
              const newContent = {
                inputs: chatInputs.length,
                dialogs: dialogs.length,
                messages: messages.length,
                hasFloatingElements: false
              };
              
              // Check for floating/fixed positioned elements that might be chat
              const allDivs = document.querySelectorAll('div');
              for (let div of allDivs) {
                const style = window.getComputedStyle(div);
                if (style.position === 'fixed' && 
                    parseInt(style.zIndex) > 1000 && 
                    div.offsetHeight > 100 && 
                    div.offsetWidth > 200) {
                  newContent.hasFloatingElements = true;
                  break;
                }
              }
              
              return newContent;
            });
            
            console.log(`   Page changes detected:`, changeDetection);
            
            if (changeDetection.inputs > 0 || changeDetection.dialogs > 0 || 
                changeDetection.messages > 0 || changeDetection.hasFloatingElements) {
              console.log('🎉 Chatbot interaction appears successful!');
              interactionSuccess = true;
              this.results.chatbotDetected = true;
              break;
            }
          }
          
        } catch (error) {
          console.log(`❌ Interaction failed: ${error.message}`);
        }
      }
      
      await this.logStep('Chatbot Interaction', interactionSuccess, 
        interactionSuccess ? 'Successfully opened chatbot' : 'No successful interactions');
      
      // Step 5: Look for specific chatbot content
      console.log('\n🔍 Step 5: Searching for chatbot-specific content...');
      
      const contentAnalysis = await page.evaluate(() => {
        const bodyText = document.body.textContent || document.body.innerText;
        
        // Look for common chatbot patterns
        const patterns = {
          greeting: /ciao|salv|buongiorno|buonasera|posso aiutarti|come posso aiutare/i,
          itEra: /IT-?ERA/i,
          specificGreeting: /\[IT-ERA\].*ciao.*come posso aiutarti/i,
          emergencyPhone: /039[\s\-\.]?888[\s\-\.]?2041/,
          chatTerms: /chat|messag|conversazione|scrivi/i
        };
        
        const results = {};
        Object.keys(patterns).forEach(key => {
          results[key] = patterns[key].test(bodyText);
        });
        
        // Sample of body text for debugging
        results.bodyTextSample = bodyText.substring(0, 1000);
        
        return results;
      });
      
      console.log('📝 Content analysis results:');
      Object.keys(contentAnalysis).forEach(key => {
        if (key !== 'bodyTextSample') {
          console.log(`   ${key}: ${contentAnalysis[key] ? '✅' : '❌'}`);
        }
      });
      
      this.results.greetingReceived = contentAnalysis.specificGreeting;
      this.results.phoneNumberVisible = contentAnalysis.emergencyPhone;
      
      await this.logStep('Content Analysis', true, 
        `Greeting: ${contentAnalysis.specificGreeting}, Phone: ${contentAnalysis.emergencyPhone}`);
      
      // Step 6: Manual wait for user observation
      console.log('\n👁️  Step 6: Manual observation period...');
      console.log('🔍 Browser is open for manual inspection.');
      console.log('📋 Please manually check:');
      console.log('   1. Is there a chatbot widget visible?');
      console.log('   2. Can you click it to open a chat?');
      console.log('   3. Does it show the greeting "[IT-ERA] Ciao, come posso aiutarti?"');
      console.log('   4. Is the phone number 039 888 2041 visible?');
      console.log('⏰ Waiting 30 seconds for manual inspection...');
      
      await this.delay(30000);
      await this.takeScreenshot(page, '04-final-state');
      
      // Generate report
      await this.generateReport();
      
    } finally {
      console.log('\n🔄 Closing browser...');
      await browser.close();
    }
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    const reportData = {
      timestamp,
      baseUrl: this.baseUrl,
      results: this.results,
      summary: {
        totalSteps: this.results.steps.length,
        successfulSteps: this.results.steps.filter(s => s.success).length,
        chatbotDetected: this.results.chatbotDetected,
        conversationStarted: this.results.conversationStarted,
        greetingReceived: this.results.greetingReceived,
        phoneNumberVisible: this.results.phoneNumberVisible
      }
    };
    
    const htmlReport = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Manual Chatbot Interaction Test Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background: #007bff; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
            .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .pass { color: #28a745; }
            .fail { color: #dc3545; }
            .warning { color: #ffc107; }
            .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .step { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
            .step.success { border-left: 4px solid #28a745; }
            .step.fail { border-left: 4px solid #dc3545; }
            .screenshot { max-width: 300px; margin: 10px; border: 1px solid #ddd; border-radius: 4px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>👨‍💻 Manual Chatbot Interaction Test</h1>
                <p>URL: ${this.baseUrl}</p>
                <p>Generated: ${timestamp}</p>
            </div>
            
            <div class="summary">
                <div class="stat-card">
                    <h3>${reportData.summary.totalSteps}</h3>
                    <p>Total Steps</p>
                </div>
                <div class="stat-card">
                    <h3 class="${reportData.summary.successfulSteps === reportData.summary.totalSteps ? 'pass' : 'warning'}">
                        ${reportData.summary.successfulSteps}
                    </h3>
                    <p>Successful Steps</p>
                </div>
                <div class="stat-card">
                    <h3 class="${reportData.summary.chatbotDetected ? 'pass' : 'fail'}">
                        ${reportData.summary.chatbotDetected ? '✅' : '❌'}
                    </h3>
                    <p>Chatbot Detected</p>
                </div>
                <div class="stat-card">
                    <h3 class="${reportData.summary.greetingReceived ? 'pass' : 'fail'}">
                        ${reportData.summary.greetingReceived ? '✅' : '❌'}
                    </h3>
                    <p>Greeting Found</p>
                </div>
                <div class="stat-card">
                    <h3 class="${reportData.summary.phoneNumberVisible ? 'pass' : 'fail'}">
                        ${reportData.summary.phoneNumberVisible ? '✅' : '❌'}
                    </h3>
                    <p>Phone Visible</p>
                </div>
            </div>
            
            <div class="section">
                <h2>📋 Step-by-Step Log</h2>
                ${this.results.steps.map((step, index) => `
                    <div class="step ${step.success ? 'success' : 'fail'}">
                        <strong>Step ${index + 1}: ${step.step}</strong><br>
                        <small>Time: ${new Date(step.timestamp).toLocaleTimeString()}</small><br>
                        Status: ${step.success ? '✅' : '❌'}<br>
                        Details: ${step.details}
                    </div>
                `).join('')}
            </div>
            
            <div class="section">
                <h2>📷 Screenshots</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
                    ${this.results.screenshots.map(screenshot => `
                        <div>
                            <h4>${screenshot.name}</h4>
                            <img src="${screenshot.path}" class="screenshot" alt="${screenshot.name}">
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="section">
                <h2>🎯 Manual Inspection Checklist</h2>
                <table>
                    <tr>
                        <th>Item</th>
                        <th>Status</th>
                        <th>Notes</th>
                    </tr>
                    <tr>
                        <td>Chatbot widget visible</td>
                        <td class="${reportData.summary.chatbotDetected ? 'pass' : 'fail'}">${reportData.summary.chatbotDetected ? '✅ DETECTED' : '❌ NOT FOUND'}</td>
                        <td>Automatic detection result</td>
                    </tr>
                    <tr>
                        <td>IT-ERA greeting message</td>
                        <td class="${reportData.summary.greetingReceived ? 'pass' : 'fail'}">${reportData.summary.greetingReceived ? '✅ FOUND' : '❌ NOT FOUND'}</td>
                        <td>Looking for "[IT-ERA] Ciao, come posso aiutarti?"</td>
                    </tr>
                    <tr>
                        <td>Emergency phone number</td>
                        <td class="${reportData.summary.phoneNumberVisible ? 'pass' : 'fail'}">${reportData.summary.phoneNumberVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}</td>
                        <td>Should show 039 888 2041</td>
                    </tr>
                    <tr>
                        <td>Chat functionality</td>
                        <td class="warning">⏳ MANUAL CHECK REQUIRED</td>
                        <td>Requires manual testing of actual conversation</td>
                    </tr>
                </table>
            </div>
        </div>
    </body>
    </html>
    `;
    
    const reportPath = path.join(__dirname, 'reports', `manual-interaction-test-${Date.now()}.html`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, htmlReport);
    
    console.log(`\n📋 Manual test report generated: ${reportPath}`);
    return reportPath;
  }
}

// Main execution
async function runManualTest() {
  const tester = new ManualChatbotInteractionTest();
  
  try {
    await tester.runManualTest();
    console.log('\n🎉 Manual chatbot interaction test completed!');
    console.log('📋 Please review the generated report and screenshots for full analysis.');
  } catch (error) {
    console.error('❌ Manual test failed:', error);
    throw error;
  }
}

module.exports = { ManualChatbotInteractionTest };

// Run if called directly
if (require.main === module) {
  runManualTest()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}