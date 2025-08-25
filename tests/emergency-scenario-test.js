const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

/**
 * EMERGENCY SCENARIO TESTING
 * Tests specific emergency conversation flows and phone number validation
 */

class EmergencyScenarioTester {
  constructor() {
    this.emergencyScenarios = [
      {
        name: 'medical_emergency',
        trigger: 'Ho un\'emergenza medica, ho bisogno di assistenza immediata',
        expectedResponse: /emergenza|urgente|immediata|039.*888.*2041/i,
        priority: 'CRITICAL'
      },
      {
        name: 'security_breach',
        trigger: 'Siamo stati hackerati! Emergenza sicurezza informatica!',
        expectedResponse: /sicurezza|emergenza|urgente|039.*888.*2041/i,
        priority: 'CRITICAL'
      },
      {
        name: 'system_down',
        trigger: 'Tutti i nostri sistemi sono offline, emergenza IT',
        expectedResponse: /sistemi|offline|emergenza|039.*888.*2041/i,
        priority: 'HIGH'
      },
      {
        name: 'data_loss',
        trigger: 'Abbiamo perso tutti i dati, serve aiuto urgente',
        expectedResponse: /dati|backup|urgente|039.*888.*2041/i,
        priority: 'CRITICAL'
      },
      {
        name: 'network_failure',
        trigger: 'La rete aziendale è completamente down',
        expectedResponse: /rete|network|down|039.*888.*2041/i,
        priority: 'HIGH'
      }
    ];
    
    this.results = {
      scenarios: {},
      phoneValidation: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        phoneNumberDisplayed: 0
      }
    };
  }

  async runEmergencyTests() {
    console.log('🚨 Starting Emergency Scenario Testing...');
    
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      for (const url of ['https://www.it-era.it', 'https://it-era.pages.dev']) {
        console.log(`\n🌐 Testing emergency scenarios on ${url}`);
        
        for (const scenario of this.emergencyScenarios) {
          await this.testEmergencyScenario(browser, url, scenario);
        }
        
        // Test phone number validation
        await this.testPhoneNumberValidation(browser, url);
      }
      
      await this.generateEmergencyReport();
      
    } finally {
      await browser.close();
    }
  }

  async testEmergencyScenario(browser, url, scenario) {
    const page = await browser.newPage();
    const testId = `${url.includes('it-era.it') ? 'prod' : 'staging'}_${scenario.name}`;
    
    console.log(`\n🧪 Testing ${scenario.name} (${scenario.priority})...`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for and open chatbot
      await page.waitForSelector('#chatbot-widget, [class*="chat"]', { timeout: 10000 });
      const chatTrigger = await page.$('#chatbot-widget .chat-toggle, .chat-button, [class*="chat-toggle"]');
      
      if (!chatTrigger) {
        throw new Error('Chatbot trigger not found');
      }
      
      await chatTrigger.click();
      await page.waitForTimeout(3000);
      
      // Send emergency message
      const messageInput = await page.$('input[type="text"], textarea, [class*="input"]');
      if (!messageInput) {
        throw new Error('Message input not found');
      }
      
      await messageInput.type(scenario.trigger);
      
      const sendButton = await page.$('button[type="submit"], [class*="send"]');
      if (sendButton) {
        await sendButton.click();
        await page.waitForTimeout(5000); // Wait longer for emergency response
      }
      
      // Check for emergency response
      const responseFound = await page.evaluate((expectedPattern) => {
        const messages = document.querySelectorAll('[class*="message"], [class*="chat-message"]');
        const allText = Array.from(messages).map(msg => msg.textContent || msg.innerText).join(' ');
        const regex = new RegExp(expectedPattern.source, expectedPattern.flags);
        return regex.test(allText);
      }, scenario.expectedResponse);
      
      // Check for phone number display
      const phoneDisplayed = await page.evaluate(() => {
        const bodyText = document.body.textContent || document.body.innerText;
        return bodyText.includes('039 888 2041') || bodyText.includes('039-888-2041') || bodyText.includes('039.888.2041');
      });
      
      // Screenshot
      const screenshotPath = path.join(__dirname, 'screenshots', 'emergency-tests', `${testId}.png`);
      await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      this.results.scenarios[testId] = {
        scenario: scenario.name,
        priority: scenario.priority,
        trigger: scenario.trigger,
        responseFound: responseFound,
        phoneDisplayed: phoneDisplayed,
        status: responseFound && phoneDisplayed ? 'PASS' : 'FAIL',
        screenshot: screenshotPath
      };
      
      if (responseFound && phoneDisplayed) {
        console.log('✅ Emergency scenario handled correctly');
        this.results.summary.passed++;
        if (phoneDisplayed) this.results.summary.phoneNumberDisplayed++;
      } else {
        console.log('❌ Emergency scenario failed');
        console.log(`   Response found: ${responseFound}`);
        console.log(`   Phone displayed: ${phoneDisplayed}`);
        this.results.summary.failed++;
      }
      
      this.results.summary.total++;
      
    } catch (error) {
      console.error(`❌ Emergency scenario ${scenario.name} failed:`, error.message);
      
      this.results.scenarios[testId] = {
        scenario: scenario.name,
        priority: scenario.priority,
        status: 'ERROR',
        error: error.message
      };
      
      this.results.summary.failed++;
      this.results.summary.total++;
    } finally {
      await page.close();
    }
  }

  async testPhoneNumberValidation(browser, url) {
    const page = await browser.newPage();
    console.log(`\n📞 Testing phone number validation on ${url}...`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Check for phone number in various locations
      const phoneValidation = await page.evaluate(() => {
        const results = {
          inHeader: false,
          inFooter: false,
          inContact: false,
          inChatbot: false,
          format: null
        };
        
        const bodyText = document.body.textContent || document.body.innerText;
        const phonePattern = /(039[\s\-\.]?888[\s\-\.]?2041)/g;
        const matches = bodyText.match(phonePattern);
        
        if (matches) {
          results.format = matches[0];
          
          // Check header
          const header = document.querySelector('header, .header, nav');
          if (header && phonePattern.test(header.textContent || header.innerText)) {
            results.inHeader = true;
          }
          
          // Check footer
          const footer = document.querySelector('footer, .footer');
          if (footer && phonePattern.test(footer.textContent || footer.innerText)) {
            results.inFooter = true;
          }
          
          // Check contact sections
          const contactSections = document.querySelectorAll('[class*="contact"], [id*="contact"]');
          for (let section of contactSections) {
            if (phonePattern.test(section.textContent || section.innerText)) {
              results.inContact = true;
              break;
            }
          }
          
          // Check chatbot area
          const chatAreas = document.querySelectorAll('[class*="chat"], [id*="chat"]');
          for (let area of chatAreas) {
            if (phonePattern.test(area.textContent || area.innerText)) {
              results.inChatbot = true;
              break;
            }
          }
        }
        
        return results;
      });
      
      const urlKey = url.includes('it-era.it') ? 'production' : 'staging';
      this.results.phoneValidation[urlKey] = phoneValidation;
      
      console.log(`📞 Phone validation results for ${urlKey}:`);
      console.log(`   Format found: ${phoneValidation.format || 'NOT FOUND'}`);
      console.log(`   In header: ${phoneValidation.inHeader}`);
      console.log(`   In footer: ${phoneValidation.inFooter}`);
      console.log(`   In contact: ${phoneValidation.inContact}`);
      console.log(`   In chatbot: ${phoneValidation.inChatbot}`);
      
    } catch (error) {
      console.error(`❌ Phone validation failed for ${url}:`, error.message);
    } finally {
      await page.close();
    }
  }

  async generateEmergencyReport() {
    const timestamp = new Date().toISOString();
    const reportData = {
      timestamp,
      summary: this.results.summary,
      scenarios: this.results.scenarios,
      phoneValidation: this.results.phoneValidation,
      emergencyScenarios: this.emergencyScenarios
    };
    
    // Generate HTML report
    const htmlReport = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>IT-ERA Emergency Scenario Test Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .header { background: #dc3545; color: white; padding: 20px; border-radius: 8px; }
            .critical { background: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin: 10px 0; }
            .pass { background: #d4edda; border-left: 5px solid #28a745; }
            .fail { background: #f8d7da; border-left: 5px solid #dc3545; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .scenario { margin: 15px 0; padding: 15px; background: white; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; background: white; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🚨 IT-ERA Emergency Scenario Test Report</h1>
            <p>Generated: ${timestamp}</p>
        </div>
        
        <div class="critical">
            <h2>⚠️ CRITICAL VALIDATION</h2>
            <p>This report validates emergency response capabilities and phone number accessibility.</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <h3>${reportData.summary.total}</h3>
                <p>Total Scenarios</p>
            </div>
            <div class="stat-card pass">
                <h3>${reportData.summary.passed}</h3>
                <p>Passed</p>
            </div>
            <div class="stat-card fail">
                <h3>${reportData.summary.failed}</h3>
                <p>Failed</p>
            </div>
            <div class="stat-card">
                <h3>${reportData.summary.phoneNumberDisplayed}</h3>
                <p>Phone Displayed</p>
            </div>
        </div>

        <h2>📞 Phone Number Validation</h2>
        <table>
            <tr>
                <th>Environment</th>
                <th>Format Found</th>
                <th>Header</th>
                <th>Footer</th>
                <th>Contact</th>
                <th>Chatbot</th>
            </tr>
            ${Object.entries(reportData.phoneValidation).map(([env, validation]) => `
                <tr>
                    <td>${env}</td>
                    <td>${validation.format || 'NOT FOUND'}</td>
                    <td>${validation.inHeader ? '✅' : '❌'}</td>
                    <td>${validation.inFooter ? '✅' : '❌'}</td>
                    <td>${validation.inContact ? '✅' : '❌'}</td>
                    <td>${validation.inChatbot ? '✅' : '❌'}</td>
                </tr>
            `).join('')}
        </table>

        <h2>🚨 Emergency Scenario Results</h2>
        ${Object.entries(reportData.scenarios).map(([testId, result]) => `
            <div class="scenario ${result.status === 'PASS' ? 'pass' : 'fail'}">
                <h3>${result.scenario} (${result.priority})</h3>
                <p><strong>Status:</strong> ${result.status}</p>
                <p><strong>Trigger:</strong> ${result.trigger}</p>
                <p><strong>Response Found:</strong> ${result.responseFound ? '✅' : '❌'}</p>
                <p><strong>Phone Displayed:</strong> ${result.phoneDisplayed ? '✅' : '❌'}</p>
                ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
            </div>
        `).join('')}
        
        <h2>🔧 Emergency Scenarios Tested</h2>
        <ul>
            ${reportData.emergencyScenarios.map(scenario => 
                `<li><strong>${scenario.name}</strong> (${scenario.priority}): ${scenario.trigger}</li>`
            ).join('')}
        </ul>
    </body>
    </html>
    `;
    
    // Save report
    const reportPath = path.join(__dirname, 'reports', `emergency-scenario-test-${Date.now()}.html`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, htmlReport);
    
    console.log(`\n📋 Emergency test report saved: ${reportPath}`);
    
    return reportData;
  }
}

module.exports = { EmergencyScenarioTester };

// Run if called directly
if (require.main === module) {
  const tester = new EmergencyScenarioTester();
  tester.runEmergencyTests()
    .then(() => console.log('🎯 Emergency testing completed!'))
    .catch(error => {
      console.error('❌ Emergency testing failed:', error);
      process.exit(1);
    });
}