const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

describe('Chatbot Interface Testing', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    // Enable console and network logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('response', response => {
      if (response.url().includes('chatbot')) {
        console.log('API RESPONSE:', response.status(), response.url());
      }
    });
  });
  
  afterAll(async () => {
    if (browser) await browser.close();
  });
  
  describe('Chat Input/Output Functionality', () => {
    test('should handle chat message input correctly', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      await page.setViewport(global.TEST_CONFIG.VIEWPORTS.DESKTOP);
      
      // Test input field
      const chatInput = '#chatInput';
      await page.waitForSelector(chatInput);
      
      const testMessage = 'Ciao, ho bisogno di aiuto con il firewall';
      await page.type(chatInput, testMessage);
      
      const inputValue = await page.$eval(chatInput, el => el.value);
      expect(inputValue).toBe(testMessage);
      
      // Test character limits and validation
      const longMessage = 'a'.repeat(1000);
      await page.evaluate(() => document.getElementById('chatInput').value = '');
      await page.type(chatInput, longMessage);
      
      const longInputValue = await page.$eval(chatInput, el => el.value);
      expect(longInputValue.length).toBeLessThanOrEqual(1000);
      
      await global.takeScreenshot(page, 'chat-input-functionality');
    });
    
    test('should send messages via button and enter key', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Test button click
      await page.type('#chatInput', 'Test message via button');
      
      // Mock the API response to avoid network dependency
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('chat')) {
          request.respond({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: 'Grazie per il messaggio! Come posso aiutarti oggi?',
              metadata: {
                processingMode: 'swarm',
                agentsUsed: ['orchestrator', 'lead-qualifier'],
                responseTime: 1200
              },
              leadScore: 65,
              cost: 0.035
            })
          });
        } else {
          request.continue();
        }
      });
      
      const initialMessageCount = await page.$$eval('.message', messages => messages.length);
      
      await page.click('#sendButton');
      
      // Wait for message to appear
      await page.waitForFunction(
        (count) => document.querySelectorAll('.message').length > count,
        {},
        initialMessageCount
      );
      
      const finalMessageCount = await page.$$eval('.message', messages => messages.length);
      expect(finalMessageCount).toBeGreaterThan(initialMessageCount);
      
      await global.takeScreenshot(page, 'message-sent-via-button');
      
      // Test Enter key
      await page.type('#chatInput', 'Test message via enter');
      await page.keyboard.press('Enter');
      
      await page.waitForTimeout(1000);
      await global.takeScreenshot(page, 'message-sent-via-enter');
    });
    
    test('should display bot responses with proper formatting', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Check initial bot message
      const initialMessage = await page.$eval('.message.bot', el => ({
        text: el.textContent,
        className: el.className,
        hasMetadata: !!el.querySelector('.message-meta')
      }));
      
      expect(initialMessage.className).toContain('bot');
      expect(initialMessage.text).toContain('Benvenuto');
      expect(initialMessage.hasMetadata).toBe(true);
      
      await global.takeScreenshot(page, 'bot-message-formatting');
    });
  });
  
  describe('Test Scenario Buttons', () => {
    test('should load and execute all test scenarios', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Get all test scenario buttons
      const testButtons = await page.$$eval('.test-button', buttons => 
        buttons.map((btn, index) => ({
          index,
          text: btn.textContent,
          onclick: btn.getAttribute('onclick')
        }))
      );
      
      expect(testButtons.length).toBeGreaterThanOrEqual(5);
      
      // Test each scenario button
      for (const button of testButtons) {
        if (button.onclick) {
          const scenarioType = button.onclick.match(/'([^']+)'/)?.[1];
          if (scenarioType) {
            // Click the button
            await page.click(`.test-button:nth-child(${button.index + 1})`);
            
            // Wait for input to be populated
            await page.waitForTimeout(500);
            
            const inputValue = await page.$eval('#chatInput', el => el.value);
            expect(inputValue.length).toBeGreaterThan(0);
            
            await global.takeScreenshot(page, `test-scenario-${scenarioType}`);
            
            // Clear input for next test
            await page.evaluate(() => document.getElementById('chatInput').value = '');
          }
        }
      }
    });
    
    test('should validate scenario content matches PSD requirements', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Test high-value lead scenario
      await page.click('button[onclick*="high-value-lead"]');
      const highValueMessage = await page.$eval('#chatInput', el => el.value);
      
      expect(highValueMessage).toContain('50 dipendenti');
      expect(highValueMessage).toContain('Monza');
      expect(highValueMessage).toContain('budget');
      
      // Test urgent support scenario  
      await page.click('button[onclick*="urgent-support"]');
      const urgentMessage = await page.$eval('#chatInput', el => el.value);
      
      expect(urgentMessage).toContain('server');
      expect(urgentMessage).toContain('urgente');
      
      await global.takeScreenshot(page, 'scenario-content-validation');
    });
  });
  
  describe('Status Indicators and Metrics', () => {
    test('should display swarm status correctly', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const statusElements = await page.evaluate(() => {
        return {
          mode: document.getElementById('modeStatus')?.textContent,
          agents: document.getElementById('agentCount')?.textContent,
          responseTime: document.getElementById('responseTime')?.textContent,
          leadScore: document.getElementById('leadScore')?.textContent,
          swarmIndicator: document.getElementById('swarmStatus')?.textContent
        };
      });
      
      expect(statusElements.mode).toBe('Swarm');
      expect(statusElements.agents).toContain('8 Active');
      expect(statusElements.swarmIndicator).toContain('SWARM ACTIVE');
      
      await global.takeScreenshot(page, 'status-indicators-display');
    });
    
    test('should update metrics in real-time', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Simulate sending a message and getting response
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('chat')) {
          request.respond({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: 'Test response',
              metadata: { processingMode: 'swarm', responseTime: 1400 },
              leadScore: 80,
              cost: 0.032
            })
          });
        } else {
          request.continue();
        }
      });
      
      await page.type('#chatInput', 'Test metrics update');
      await page.click('#sendButton');
      
      // Wait for metrics to update
      await page.waitForTimeout(2000);
      
      const updatedMetrics = await page.evaluate(() => ({
        queries: document.getElementById('totalQueries').textContent,
        avgTime: document.getElementById('avgTime').textContent,
        avgCost: document.getElementById('avgCost').textContent,
        responseTime: document.getElementById('responseTime').textContent,
        leadScore: document.getElementById('leadScore').textContent
      }));
      
      expect(updatedMetrics.queries).toBe('1');
      expect(updatedMetrics.responseTime).toContain('1400ms');
      expect(updatedMetrics.leadScore).toBe('80');
      
      // Verify metrics meet PSD requirements
      const responseTimeMs = parseInt(updatedMetrics.responseTime);
      const avgCost = parseFloat(updatedMetrics.avgCost.replace('€', ''));
      const leadScore = parseInt(updatedMetrics.leadScore);
      
      expect(responseTimeMs).toBeLessThan(global.TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME);
      expect(avgCost).toBeLessThan(global.TEST_CONFIG.PERFORMANCE_THRESHOLDS.COST_PER_QUERY);
      
      await global.takeScreenshot(page, 'metrics-realtime-update');
    });
  });
  
  describe('Options and Interactive Elements', () => {
    test('should display and handle option buttons correctly', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Mock API response with options
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('chat')) {
          request.respond({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: 'Ecco alcune opzioni:',
              options: ['Firewall WatchGuard', 'Backup Veeam', 'Assistenza remota', 'Preventivo personalizzato']
            })
          });
        } else {
          request.continue();
        }
      });
      
      await page.type('#chatInput', 'Che servizi offrite?');
      await page.click('#sendButton');
      
      // Wait for options to appear
      await page.waitForSelector('.options-container', { timeout: 10000 });
      
      const optionsCount = await page.$$eval('.option-button', buttons => buttons.length);
      expect(optionsCount).toBe(4);
      
      // Test option button interaction
      await page.click('.option-button:first-child');
      
      const newInputValue = await page.$eval('#chatInput', el => el.value);
      expect(newInputValue).toBe('Firewall WatchGuard');
      
      await global.takeScreenshot(page, 'option-buttons-interaction');
    });
    
    test('should maintain conversation history', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Send multiple messages
      const messages = ['Primo messaggio', 'Secondo messaggio', 'Terzo messaggio'];
      
      await page.setRequestInterception(true);
      let messageCount = 0;
      page.on('request', request => {
        if (request.url().includes('chat')) {
          messageCount++;
          request.respond({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: `Risposta al messaggio ${messageCount}`
            })
          });
        } else {
          request.continue();
        }
      });
      
      for (const message of messages) {
        await page.type('#chatInput', message);
        await page.click('#sendButton');
        await page.waitForTimeout(1000);
      }
      
      // Check conversation history
      const allMessages = await page.$$eval('.message', msgs => 
        msgs.map(msg => ({
          text: msg.textContent,
          isUser: msg.classList.contains('user'),
          isBot: msg.classList.contains('bot')
        }))
      );
      
      // Should have initial message + 3 user + 3 bot messages
      expect(allMessages.length).toBeGreaterThanOrEqual(7);
      
      const userMessages = allMessages.filter(msg => msg.isUser);
      expect(userMessages.length).toBe(3);
      
      await global.takeScreenshot(page, 'conversation-history-maintained');
    });
  });
  
  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Simulate network error
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('chat')) {
          request.abort('failed');
        } else {
          request.continue();
        }
      });
      
      await page.type('#chatInput', 'Test network error');
      await page.click('#sendButton');
      
      // Wait for error message
      await page.waitForTimeout(3000);
      
      const lastMessage = await page.$eval('.message:last-child', el => el.textContent);
      expect(lastMessage).toContain('Errore di connessione');
      
      await global.takeScreenshot(page, 'network-error-handling');
    });
    
    test('should prevent spam and handle rapid clicks', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      await page.type('#chatInput', 'Test rapid clicks');
      
      // Click send button multiple times rapidly
      for (let i = 0; i < 5; i++) {
        await page.click('#sendButton');
        await page.waitForTimeout(100);
      }
      
      // Should not send multiple messages
      const userMessages = await page.$$eval('.message.user', msgs => msgs.length);
      expect(userMessages).toBeLessThanOrEqual(2); // Initial + 1 sent message
      
      await global.takeScreenshot(page, 'spam-prevention-test');
    });
  });
});