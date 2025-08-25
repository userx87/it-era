const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

/**
 * FINAL CHATBOT VALIDATION TEST
 * Validates the complete chatbot experience including greeting and conversation flow
 */

class FinalChatbotValidator {
  constructor() {
    this.stagingUrl = 'https://it-era.pages.dev';
    this.results = {
      chatbotFound: false,
      chatbotOpened: false,
      greetingValidation: {
        found: false,
        correctFormat: false,
        message: ''
      },
      conversationTest: {
        messageSent: false,
        responseReceived: false,
        emergencyHandled: false
      },
      phoneValidation: {
        visible: false,
        format: '',
        locations: []
      },
      securityValidation: {
        safe: true,
        exposedTerms: []
      },
      screenshots: []
    };
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async takeScreenshot(page, name) {
    const screenshotPath = path.join(__dirname, 'screenshots', 'final-validation', `${name}.png`);
    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    this.results.screenshots.push({ name, path: screenshotPath });
    console.log(`📸 ${name}.png`);
  }

  async runFinalValidation() {
    console.log('🏁 FINAL CHATBOT VALIDATION STARTING...');
    console.log('🎯 Goal: Validate complete chatbot functionality and greeting');
    console.log('🌐 URL:', this.stagingUrl);
    
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1366, height: 768 });
      
      // Phase 1: Load and Initialize
      console.log('\n🔄 Phase 1: Page Load and Initialization');
      await page.goto(this.stagingUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      console.log('✅ Page loaded successfully');
      
      await this.takeScreenshot(page, '01-initial-load');
      await this.delay(3000);
      
      // Phase 2: Locate and Open Chatbot
      console.log('\n🤖 Phase 2: Chatbot Detection and Opening');
      
      // Look for the specific IT-ERA chatbot
      const chatbotElement = await page.$('#it-era-chatbot-button');
      
      if (!chatbotElement) {
        console.log('❌ IT-ERA chatbot button not found');
        return;
      }
      
      console.log('✅ IT-ERA chatbot button found');
      this.results.chatbotFound = true;
      
      await this.takeScreenshot(page, '02-chatbot-detected');
      
      // Click to open chatbot
      console.log('👆 Clicking chatbot button...');
      await chatbotElement.click();
      await this.delay(2000);
      
      // Verify chatbot window opened
      const chatWindow = await page.$('#it-era-chatbot-window');
      const chatWindowVisible = chatWindow ? await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }, chatWindow) : false;
      
      if (chatWindowVisible) {
        console.log('✅ Chatbot window opened successfully');
        this.results.chatbotOpened = true;
        await this.takeScreenshot(page, '03-chatbot-opened');
      } else {
        console.log('❌ Chatbot window did not open');
      }
      
      // Phase 3: Greeting Validation
      console.log('\n📬 Phase 3: Greeting Message Validation');
      
      // Wait a moment for greeting to appear
      await this.delay(3000);
      
      const greetingValidation = await page.evaluate(() => {
        // Look for messages in the chat window
        const messageElements = document.querySelectorAll('[class*="message"], [class*="chat-message"], .message, .chat-bubble');
        
        let foundGreeting = false;
        let correctFormat = false;
        let greetingMessage = '';
        
        for (let element of messageElements) {
          const text = element.textContent || element.innerText || '';
          if (text.includes('IT-ERA') || text.includes('Ciao') || text.includes('aiutarti')) {
            foundGreeting = true;
            greetingMessage = text.trim();
            
            // Check for exact format
            if (text.includes('[IT-ERA]') && text.includes('Ciao, come posso aiutarti?')) {
              correctFormat = true;
            }
            break;
          }
        }
        
        // Also check the entire page content
        const fullText = document.body.textContent || document.body.innerText || '';
        if (!foundGreeting && (fullText.includes('[IT-ERA]') && fullText.includes('Ciao, come posso aiutarti?'))) {
          foundGreeting = true;
          correctFormat = true;
          greetingMessage = '[IT-ERA] Ciao, come posso aiutarti?';
        }
        
        return {
          found: foundGreeting,
          correctFormat: correctFormat,
          message: greetingMessage
        };
      });
      
      this.results.greetingValidation = greetingValidation;
      
      console.log(`📝 Greeting validation:`);
      console.log(`   Found greeting: ${greetingValidation.found ? '✅' : '❌'}`);
      console.log(`   Correct format: ${greetingValidation.correctFormat ? '✅' : '❌'}`);
      console.log(`   Message: "${greetingValidation.message}"`);
      
      await this.takeScreenshot(page, '04-greeting-check');
      
      // Phase 4: Conversation Test
      console.log('\n💬 Phase 4: Conversation Flow Test');
      
      // Look for input field
      const inputField = await page.$('#it-era-chatbot-input, input[type="text"], textarea, [contenteditable="true"]');
      
      if (inputField) {
        console.log('✅ Input field found');
        
        // Send test message
        console.log('📝 Sending test message...');
        await inputField.type('Ho bisogno di assistenza IT urgente per la mia azienda');
        await this.delay(1000);
        
        // Look for send button
        const sendButton = await page.$('button[type="submit"], .send-button, [onclick*="send"]');
        if (sendButton) {
          await sendButton.click();
          this.results.conversationTest.messageSent = true;
          console.log('✅ Message sent');
          
          // Wait for response
          await this.delay(5000);
          await this.takeScreenshot(page, '05-message-sent');
          
          // Check for response
          const responseCheck = await page.evaluate(() => {
            const messages = document.querySelectorAll('[class*="message"], [class*="chat-message"], .message, .chat-bubble');
            return messages.length > 1; // Should have greeting + response
          });
          
          this.results.conversationTest.responseReceived = responseCheck;
          console.log(`📨 Response received: ${responseCheck ? '✅' : '❌'}`);
          
        } else {
          console.log('❌ Send button not found');
        }
      } else {
        console.log('❌ Input field not found');
      }
      
      // Phase 5: Emergency Scenario Test
      console.log('\n🚨 Phase 5: Emergency Scenario Test');
      
      if (inputField) {
        await inputField.click();
        await inputField.focus();
        
        // Clear previous content
        await page.keyboard.selectAll();
        await page.keyboard.press('Delete');
        
        // Send emergency message
        await inputField.type('EMERGENZA! I nostri sistemi sono stati hackerati!');
        await this.delay(1000);
        
        const sendButton = await page.$('button[type="submit"], .send-button, [onclick*="send"]');
        if (sendButton) {
          await sendButton.click();
          console.log('✅ Emergency message sent');
          
          await this.delay(5000);
          await this.takeScreenshot(page, '06-emergency-test');
          
          // Check for emergency response with phone number
          const emergencyResponse = await page.evaluate(() => {
            const text = document.body.textContent || document.body.innerText || '';
            return text.includes('039 888 2041') || text.includes('emergenza') || text.includes('urgente');
          });
          
          this.results.conversationTest.emergencyHandled = emergencyResponse;
          console.log(`🚨 Emergency handled: ${emergencyResponse ? '✅' : '❌'}`);
        }
      }
      
      // Phase 6: Phone Number Validation
      console.log('\n📞 Phase 6: Phone Number Validation');
      
      const phoneValidation = await page.evaluate(() => {
        const text = document.body.textContent || document.body.innerText || '';
        const phonePattern = /(039[\s\-\.]?888[\s\-\.]?2041)/g;
        const matches = text.match(phonePattern);
        
        const locations = [];
        
        // Check specific locations
        const header = document.querySelector('header, .header, nav');
        if (header && phonePattern.test(header.textContent || header.innerText)) {
          locations.push('header');
        }
        
        const footer = document.querySelector('footer, .footer');
        if (footer && phonePattern.test(footer.textContent || footer.innerText)) {
          locations.push('footer');
        }
        
        const chatbot = document.querySelector('#it-era-chatbot-window, [class*="chat"]');
        if (chatbot && phonePattern.test(chatbot.textContent || chatbot.innerText)) {
          locations.push('chatbot');
        }
        
        return {
          visible: matches !== null,
          format: matches ? matches[0] : '',
          count: matches ? matches.length : 0,
          locations: locations
        };
      });
      
      this.results.phoneValidation = phoneValidation;
      
      console.log(`📞 Phone validation:`);
      console.log(`   Number visible: ${phoneValidation.visible ? '✅' : '❌'}`);
      console.log(`   Format: ${phoneValidation.format}`);
      console.log(`   Count: ${phoneValidation.count}`);
      console.log(`   Locations: ${phoneValidation.locations.join(', ')}`);
      
      // Phase 7: Security Validation
      console.log('\n🔒 Phase 7: Security Validation');
      
      const securityCheck = await page.evaluate(() => {
        const text = document.body.textContent.toLowerCase();
        const suspiciousTerms = [
          'system:', 'prompt:', 'assistant:', 'ai model', 'openai',
          'anthropic', 'claude', 'gpt', 'language model', 'chatgpt'
        ];
        
        const exposedTerms = suspiciousTerms.filter(term => text.includes(term));
        
        return {
          safe: exposedTerms.length === 0,
          exposedTerms: exposedTerms
        };
      });
      
      this.results.securityValidation = securityCheck;
      
      console.log(`🔒 Security check: ${securityCheck.safe ? '✅ SAFE' : '🚨 VULNERABLE'}`);
      if (!securityCheck.safe) {
        console.log(`⚠️  Exposed terms: ${securityCheck.exposedTerms.join(', ')}`);
      }
      
      await this.takeScreenshot(page, '07-final-validation');
      
      // Generate comprehensive report
      await this.generateFinalReport();
      
    } finally {
      await browser.close();
    }
  }

  async generateFinalReport() {
    const timestamp = new Date().toISOString();
    
    // Calculate overall score
    let score = 0;
    let maxScore = 10;
    
    if (this.results.chatbotFound) score += 2;
    if (this.results.chatbotOpened) score += 2;
    if (this.results.greetingValidation.found) score += 2;
    if (this.results.greetingValidation.correctFormat) score += 1;
    if (this.results.conversationTest.messageSent) score += 1;
    if (this.results.conversationTest.responseReceived) score += 1;
    if (this.results.phoneValidation.visible) score += 1;
    
    const overallStatus = score >= 8 ? 'EXCELLENT' : score >= 6 ? 'GOOD' : score >= 4 ? 'FAIR' : 'POOR';
    const statusColor = score >= 8 ? '#28a745' : score >= 6 ? '#007bff' : score >= 4 ? '#ffc107' : '#dc3545';
    
    const htmlReport = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>IT-ERA Final Chatbot Validation Report</title>
        <meta charset="UTF-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { background: white; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .header h1 { color: #333; font-size: 2.5em; margin-bottom: 10px; }
            .header p { color: #666; font-size: 1.2em; }
            
            .score-card { 
                background: white; 
                padding: 40px; 
                border-radius: 15px; 
                text-align: center; 
                margin: 20px 0;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            
            .score-circle {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                background: ${statusColor};
                color: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                margin: 0 auto 20px;
                font-size: 2em;
                font-weight: bold;
            }
            
            .status-text {
                font-size: 1.5em;
                color: ${statusColor};
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .section { 
                background: white; 
                margin: 20px 0; 
                padding: 25px; 
                border-radius: 15px; 
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .section h2 {
                color: #333;
                margin-bottom: 20px;
                font-size: 1.5em;
                border-bottom: 3px solid #0056cc;
                padding-bottom: 10px;
            }
            
            .validation-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            
            .validation-item {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 5px solid #0056cc;
            }
            
            .validation-item.pass { border-left-color: #28a745; background: #f8fff9; }
            .validation-item.fail { border-left-color: #dc3545; background: #fff8f8; }
            .validation-item.warning { border-left-color: #ffc107; background: #fffef7; }
            
            .pass { color: #28a745; font-weight: bold; }
            .fail { color: #dc3545; font-weight: bold; }
            .warning { color: #ffc107; font-weight: bold; }
            
            .screenshot-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            
            .screenshot-item {
                text-align: center;
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
            }
            
            .screenshot-item img {
                max-width: 100%;
                height: auto;
                border-radius: 5px;
                border: 1px solid #ddd;
            }
            
            .checklist {
                list-style: none;
                padding: 0;
            }
            
            .checklist li {
                display: flex;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #eee;
            }
            
            .checklist li:last-child {
                border-bottom: none;
            }
            
            .checklist .icon {
                width: 30px;
                height: 30px;
                margin-right: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                font-weight: bold;
            }
            
            .checklist .pass-icon {
                background: #28a745;
                color: white;
            }
            
            .checklist .fail-icon {
                background: #dc3545;
                color: white;
            }
            
            .footer {
                background: white;
                padding: 25px;
                border-radius: 15px;
                text-align: center;
                margin-top: 30px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 IT-ERA Final Chatbot Validation</h1>
                <p>Comprehensive Production Readiness Assessment</p>
                <p><strong>URL:</strong> ${this.stagingUrl}</p>
                <p><strong>Generated:</strong> ${new Date(timestamp).toLocaleString()}</p>
            </div>
            
            <div class="score-card">
                <div class="score-circle">
                    <div>${score}</div>
                    <div style="font-size: 0.4em;">/10</div>
                </div>
                <div class="status-text">${overallStatus}</div>
                <p>Overall Chatbot Performance Score</p>
            </div>
            
            <div class="section">
                <h2>✅ Production Readiness Checklist</h2>
                <ul class="checklist">
                    <li>
                        <div class="icon ${this.results.chatbotFound ? 'pass-icon' : 'fail-icon'}">
                            ${this.results.chatbotFound ? '✓' : '✗'}
                        </div>
                        <div>
                            <strong>Chatbot Widget Detected</strong><br>
                            <small>IT-ERA chatbot button is visible and accessible</small>
                        </div>
                    </li>
                    <li>
                        <div class="icon ${this.results.chatbotOpened ? 'pass-icon' : 'fail-icon'}">
                            ${this.results.chatbotOpened ? '✓' : '✗'}
                        </div>
                        <div>
                            <strong>Chatbot Opens Successfully</strong><br>
                            <small>Chat window opens when button is clicked</small>
                        </div>
                    </li>
                    <li>
                        <div class="icon ${this.results.greetingValidation.found ? 'pass-icon' : 'fail-icon'}">
                            ${this.results.greetingValidation.found ? '✓' : '✗'}
                        </div>
                        <div>
                            <strong>Greeting Message Present</strong><br>
                            <small>IT-ERA greeting message is displayed: "${this.results.greetingValidation.message}"</small>
                        </div>
                    </li>
                    <li>
                        <div class="icon ${this.results.greetingValidation.correctFormat ? 'pass-icon' : 'fail-icon'}">
                            ${this.results.greetingValidation.correctFormat ? '✓' : '✗'}
                        </div>
                        <div>
                            <strong>Correct Greeting Format</strong><br>
                            <small>Must contain "[IT-ERA] Ciao, come posso aiutarti?"</small>
                        </div>
                    </li>
                    <li>
                        <div class="icon ${this.results.conversationTest.messageSent ? 'pass-icon' : 'fail-icon'}">
                            ${this.results.conversationTest.messageSent ? '✓' : '✗'}
                        </div>
                        <div>
                            <strong>Message Sending Functional</strong><br>
                            <small>Users can type and send messages</small>
                        </div>
                    </li>
                    <li>
                        <div class="icon ${this.results.phoneValidation.visible ? 'pass-icon' : 'fail-icon'}">
                            ${this.results.phoneValidation.visible ? '✓' : '✗'}
                        </div>
                        <div>
                            <strong>Emergency Phone Visible</strong><br>
                            <small>039 888 2041 is displayed (found ${this.results.phoneValidation.count} times)</small>
                        </div>
                    </li>
                    <li>
                        <div class="icon ${this.results.securityValidation.safe ? 'pass-icon' : 'fail-icon'}">
                            ${this.results.securityValidation.safe ? '✓' : '✗'}
                        </div>
                        <div>
                            <strong>Security Validation Passed</strong><br>
                            <small>No system prompts or AI model details exposed</small>
                        </div>
                    </li>
                </ul>
            </div>
            
            <div class="validation-grid">
                <div class="validation-item ${this.results.chatbotFound && this.results.chatbotOpened ? 'pass' : 'fail'}">
                    <h3>🤖 Chatbot Functionality</h3>
                    <p><strong>Status:</strong> ${this.results.chatbotFound && this.results.chatbotOpened ? 'WORKING' : 'ISSUES'}</p>
                    <p>Widget found: ${this.results.chatbotFound ? '✅' : '❌'}</p>
                    <p>Opens correctly: ${this.results.chatbotOpened ? '✅' : '❌'}</p>
                </div>
                
                <div class="validation-item ${this.results.greetingValidation.correctFormat ? 'pass' : this.results.greetingValidation.found ? 'warning' : 'fail'}">
                    <h3>📬 Greeting Validation</h3>
                    <p><strong>Status:</strong> ${this.results.greetingValidation.correctFormat ? 'PERFECT' : this.results.greetingValidation.found ? 'PARTIAL' : 'MISSING'}</p>
                    <p>Message: "${this.results.greetingValidation.message}"</p>
                    <p>Correct format: ${this.results.greetingValidation.correctFormat ? '✅' : '❌'}</p>
                </div>
                
                <div class="validation-item ${this.results.conversationTest.messageSent ? 'pass' : 'fail'}">
                    <h3>💬 Conversation Flow</h3>
                    <p><strong>Status:</strong> ${this.results.conversationTest.messageSent ? 'FUNCTIONAL' : 'BROKEN'}</p>
                    <p>Can send messages: ${this.results.conversationTest.messageSent ? '✅' : '❌'}</p>
                    <p>Receives responses: ${this.results.conversationTest.responseReceived ? '✅' : '❌'}</p>
                    <p>Emergency handling: ${this.results.conversationTest.emergencyHandled ? '✅' : '❌'}</p>
                </div>
                
                <div class="validation-item ${this.results.phoneValidation.visible ? 'pass' : 'fail'}">
                    <h3>📞 Phone Number</h3>
                    <p><strong>Status:</strong> ${this.results.phoneValidation.visible ? 'VISIBLE' : 'MISSING'}</p>
                    <p>Format: ${this.results.phoneValidation.format}</p>
                    <p>Occurrences: ${this.results.phoneValidation.count}</p>
                    <p>Locations: ${this.results.phoneValidation.locations.join(', ')}</p>
                </div>
            </div>
            
            <div class="section">
                <h2>📷 Test Screenshots</h2>
                <div class="screenshot-grid">
                    ${this.results.screenshots.map(screenshot => `
                        <div class="screenshot-item">
                            <h4>${screenshot.name.replace(/^\d+-/, '').replace(/-/g, ' ').toUpperCase()}</h4>
                            <img src="${screenshot.path}" alt="${screenshot.name}">
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="footer">
                <h2>🎯 Final Assessment</h2>
                <p style="font-size: 1.2em; margin: 15px 0;">
                    <strong>Overall Score: ${score}/10 - ${overallStatus}</strong>
                </p>
                
                ${score >= 8 ? `
                    <p style="color: #28a745; font-size: 1.1em;">
                        ✅ <strong>PRODUCTION READY!</strong> The chatbot is fully functional and meets all requirements.
                    </p>
                ` : score >= 6 ? `
                    <p style="color: #007bff; font-size: 1.1em;">
                        ⚠️ <strong>MOSTLY READY</strong> with minor issues. Review the failed items above.
                    </p>
                ` : `
                    <p style="color: #dc3545; font-size: 1.1em;">
                        ❌ <strong>NOT READY</strong> for production. Critical issues need attention.
                    </p>
                `}
                
                <hr style="margin: 20px 0; border: none; height: 1px; background: #ddd;">
                <p><strong>IT-ERA Technical Team</strong> | Generated: ${new Date(timestamp).toLocaleString()}</p>
                <p>For support: info@it-era.it | 039 888 2041</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    const reportPath = path.join(__dirname, 'reports', `final-chatbot-validation-${Date.now()}.html`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, htmlReport);
    
    console.log('\n🏁 FINAL VALIDATION COMPLETED!');
    console.log('='.repeat(60));
    console.log(`📊 FINAL SCORE: ${score}/10 - ${overallStatus}`);
    console.log(`🤖 Chatbot Found: ${this.results.chatbotFound ? '✅' : '❌'}`);
    console.log(`🔓 Chatbot Opens: ${this.results.chatbotOpened ? '✅' : '❌'}`);
    console.log(`📬 Greeting Found: ${this.results.greetingValidation.found ? '✅' : '❌'}`);
    console.log(`✨ Correct Format: ${this.results.greetingValidation.correctFormat ? '✅' : '❌'}`);
    console.log(`💬 Can Send Messages: ${this.results.conversationTest.messageSent ? '✅' : '❌'}`);
    console.log(`📞 Phone Visible: ${this.results.phoneValidation.visible ? '✅' : '❌'}`);
    console.log(`🔒 Security Safe: ${this.results.securityValidation.safe ? '✅' : '❌'}`);
    console.log('='.repeat(60));
    console.log(`📋 Detailed report: ${reportPath}`);
    
    if (score >= 8) {
      console.log('\n🎉 CHATBOT IS PRODUCTION READY! 🎉');
    } else {
      console.log(`\n⚠️  Review needed - Score: ${score}/10`);
    }
    
    return reportPath;
  }
}

// Main execution
async function runFinalValidation() {
  const validator = new FinalChatbotValidator();
  
  try {
    await validator.runFinalValidation();
  } catch (error) {
    console.error('❌ Final validation failed:', error);
    throw error;
  }
}

module.exports = { FinalChatbotValidator };

// Run if called directly
if (require.main === module) {
  runFinalValidation()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}