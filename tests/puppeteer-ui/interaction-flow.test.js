const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

describe('Interaction Flow Testing', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    page.on('console', msg => console.log('FLOW LOG:', msg.text()));
    page.on('response', response => {
      if (response.url().includes('chat')) {
        console.log('FLOW API:', response.status(), response.url());
      }
    });
  });
  
  afterAll(async () => {
    if (browser) await browser.close();
  });
  
  describe('Complete User Journey Testing', () => {
    test('should complete high-value lead journey successfully', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const journeySteps = [];
      
      // Step 1: Landing on test page
      journeySteps.push({
        step: 'landing',
        timestamp: Date.now(),
        screenshot: await global.takeScreenshot(page, 'journey-step-1-landing')
      });
      
      // Step 2: Click high-value lead scenario
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('chat')) {
          request.respond({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: 'Perfetto! Vedo che siete una PMI strutturata con esigenze importanti. Per 50 dipendenti consiglio una soluzione WatchGuard M470 con backup Veeam per 5TB. Il preventivo indicativo è di €8.500 tutto incluso. Posso organizzare un sopralluogo gratuito presso la vostra sede a Monza?',
              metadata: {
                processingMode: 'swarm',
                agentsUsed: ['lead-qualifier', 'technical-advisor', 'sales-assistant'],
                responseTime: 1200
              },
              leadScore: 92,
              cost: 0.035,
              options: ['Prenota sopralluogo gratuito', 'Dettagli tecnici WatchGuard M470', 'Preventivo backup Veeam', 'Assistenza 24/7']
            })
          });
        } else {
          request.continue();
        }
      });
      
      await page.click('button[onclick*="high-value-lead"]');
      journeySteps.push({
        step: 'scenario-selected',
        timestamp: Date.now(),
        screenshot: await global.takeScreenshot(page, 'journey-step-2-scenario')
      });
      
      // Step 3: Send message
      await page.click('#sendButton');
      await page.waitForSelector('.message.bot:last-child', { timeout: 10000 });
      
      journeySteps.push({
        step: 'message-sent',
        timestamp: Date.now(),
        screenshot: await global.takeScreenshot(page, 'journey-step-3-response')
      });
      
      // Step 4: Verify response quality and lead score
      const responseData = await page.evaluate(() => {
        const lastBotMessage = document.querySelector('.message.bot:last-child');
        const leadScore = document.getElementById('leadScore').textContent;
        const responseTime = document.getElementById('responseTime').textContent;
        
        return {
          messageText: lastBotMessage?.textContent || '',
          leadScore: parseInt(leadScore) || 0,
          responseTime: parseInt(responseTime) || 0,
          hasOptions: !!document.querySelector('.options-container')
        };
      });
      
      // Verify high-value lead criteria
      expect(responseData.leadScore).toBeGreaterThanOrEqual(85); // High-value threshold
      expect(responseData.responseTime).toBeLessThan(global.TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME);
      expect(responseData.messageText).toContain('WatchGuard');
      expect(responseData.messageText).toContain('Veeam');
      expect(responseData.messageText).toContain('sopralluogo');
      expect(responseData.hasOptions).toBe(true);
      
      // Step 5: Interact with option button
      await page.click('.option-button:first-child');
      journeySteps.push({
        step: 'option-selected',
        timestamp: Date.now(),
        screenshot: await global.takeScreenshot(page, 'journey-step-4-option')
      });
      
      // Calculate journey time
      const journeyTime = journeySteps[journeySteps.length - 1].timestamp - journeySteps[0].timestamp;
      expect(journeyTime).toBeLessThan(30000); // Complete journey under 30 seconds
      
      // Save journey data
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'high-value-lead-journey.json'), {
        steps: journeySteps,
        totalTime: journeyTime,
        finalMetrics: responseData
      });
    });
    
    test('should handle urgent support workflow correctly', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Mock urgent support response
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('chat')) {
          request.respond({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: '🚨 URGENZA RICONOSCIUTA: Server down richiede intervento immediato. Ho escalato la richiesta al nostro team tecnico con priorità MASSIMA. Riceverete una chiamata entro 15 minuti al numero registrato. Nel frattempo, NON spegnete il server e mantenetelo acceso. Caso #IT2024-URG-001 creato.',
              metadata: {
                processingMode: 'swarm',
                agentsUsed: ['support-specialist', 'orchestrator', 'memory-keeper'],
                responseTime: 800,
                escalated: true,
                priority: 'CRITICAL'
              },
              leadScore: 95,
              cost: 0.028,
              options: ['Chiamata immediata richiesta', 'Informazioni server hardware', 'Cronologia problemi simili']
            })
          });
        } else {
          request.continue();
        }
      });
      
      // Trigger urgent support scenario
      await page.click('button[onclick*="urgent-support"]');
      await page.click('#sendButton');
      
      await page.waitForSelector('.message.bot:last-child', { timeout: 10000 });
      
      // Verify urgent response characteristics
      const urgentResponse = await page.evaluate(() => {
        const message = document.querySelector('.message.bot:last-child').textContent;
        const leadScore = parseInt(document.getElementById('leadScore').textContent);
        const responseTime = parseInt(document.getElementById('responseTime').textContent);
        
        return {
          messageText: message,
          leadScore,
          responseTime,
          hasUrgencyIndicators: message.includes('🚨') && message.includes('URGENZA'),
          hasEscalation: message.includes('escalato') || message.includes('team tecnico'),
          hasCaseNumber: /caso|case|#/i.test(message),
          hasTimeframe: /\d+\s*minuti/i.test(message)
        };
      });
      
      expect(urgentResponse.leadScore).toBeGreaterThanOrEqual(90);
      expect(urgentResponse.responseTime).toBeLessThan(1000); // Faster for urgent
      expect(urgentResponse.hasUrgencyIndicators).toBe(true);
      expect(urgentResponse.hasEscalation).toBe(true);
      expect(urgentResponse.hasCaseNumber).toBe(true);
      expect(urgentResponse.hasTimeframe).toBe(true);
      
      await global.takeScreenshot(page, 'urgent-support-workflow');
    });
    
    test('should handle pricing inquiry flow', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Mock pricing response
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('chat')) {
          request.respond({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: 'Per 20 PC, il nostro contratto di assistenza annuale include: ✅ Supporto remoto illimitato ✅ Interventi on-site ✅ Aggiornamenti software ✅ Monitoraggio proattivo. Investimento: da €1.200/anno (€5/PC/mese). Include assistenza telefonica e Teams. Posso organizzare una demo gratuita del nostro sistema di monitoraggio?',
              metadata: {
                processingMode: 'swarm',
                agentsUsed: ['sales-assistant', 'technical-advisor'],
                responseTime: 1100
              },
              leadScore: 68,
              cost: 0.041,
              options: ['Demo sistema monitoraggio', 'Preventivo dettagliato PDF', 'Confronto piani assistenza', 'Referenze clienti simili']
            })
          });
        } else {
          request.continue();
        }
      });
      
      await page.click('button[onclick*="pricing"]');
      await page.click('#sendButton');
      
      await page.waitForSelector('.message.bot:last-child');
      
      const pricingResponse = await page.evaluate(() => {
        const message = document.querySelector('.message.bot:last-child').textContent;
        return {
          messageText: message,
          hasPricing: /€\d+|euro|\d+\/|prezzo|costo/i.test(message),
          hasIncludes: message.includes('✅') || message.includes('include'),
          hasValueProposition: /demo|gratuita|preventivo/i.test(message),
          hasCallToAction: /organizzare|posso|vuoi/i.test(message)
        };
      });
      
      expect(pricingResponse.hasPricing).toBe(true);
      expect(pricingResponse.hasIncludes).toBe(true);
      expect(pricingResponse.hasValueProposition).toBe(true);
      expect(pricingResponse.hasCallToAction).toBe(true);
      
      await global.takeScreenshot(page, 'pricing-inquiry-flow');
    });
  });
  
  describe('Form Validation and Error Handling', () => {
    test('should validate empty messages', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Try to send empty message
      await page.click('#sendButton');
      
      // Should not create new message
      const messageCount = await page.$$eval('.message.user', msgs => msgs.length);
      expect(messageCount).toBe(0);
      
      await global.takeScreenshot(page, 'empty-message-validation');
    });
    
    test('should handle very long messages', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const longMessage = 'A'.repeat(5000);
      await page.type('#chatInput', longMessage);
      
      const inputValue = await page.$eval('#chatInput', el => el.value);
      
      // Input should be truncated or handled appropriately
      expect(inputValue.length).toBeLessThanOrEqual(5000);
      
      await global.takeScreenshot(page, 'long-message-handling');
    });
    
    test('should handle special characters and HTML', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const specialMessage = '<script>alert("xss")</script> & special chars: àèì€$';
      await page.type('#chatInput', specialMessage);
      
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('chat')) {
          const body = JSON.parse(request.postData());
          expect(body.message).toBe(specialMessage);
          
          request.respond({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: 'Messaggio ricevuto e processato in sicurezza.'
            })
          });
        } else {
          request.continue();
        }
      });
      
      await page.click('#sendButton');
      await page.waitForSelector('.message.user:last-child');
      
      // Check that HTML is properly escaped
      const userMessage = await page.$eval('.message.user:last-child', el => el.textContent);
      expect(userMessage).toContain('<script>');
      expect(userMessage).not.toMatch(/<script.*>/);
      
      await global.takeScreenshot(page, 'special-characters-handling');
    });
  });
  
  describe('Loading States and Progress Indicators', () => {
    test('should show loading states during message processing', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Mock slow API response
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('chat')) {
          setTimeout(() => {
            request.respond({
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                response: 'Delayed response for loading test'
              })
            });
          }, 3000);
        } else {
          request.continue();
        }
      });
      
      await page.type('#chatInput', 'Test loading state');
      await page.click('#sendButton');
      
      // Check loading spinner appears
      await page.waitForSelector('.loading', { timeout: 2000 });
      const loadingSpinner = await page.$('.loading');
      expect(loadingSpinner).toBeTruthy();
      
      // Check button is disabled
      const buttonDisabled = await page.$eval('#sendButton', el => el.disabled);
      expect(buttonDisabled).toBe(true);
      
      await global.takeScreenshot(page, 'loading-state-active');
      
      // Wait for response
      await page.waitForSelector('.message.bot:last-child', { timeout: 5000 });
      
      // Check loading state is cleared
      const loadingGone = await page.$('.loading');
      expect(loadingGone).toBeFalsy();
      
      const buttonEnabled = await page.$eval('#sendButton', el => el.disabled);
      expect(buttonEnabled).toBe(false);
      
      await global.takeScreenshot(page, 'loading-state-complete');
    });
  });
  
  describe('Message History and Persistence', () => {
    test('should maintain message history throughout session', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const testMessages = [
        'Primo messaggio di test',
        'Secondo messaggio con dettagli',
        'Terzo messaggio finale'
      ];
      
      // Mock responses
      await page.setRequestInterception(true);
      let messageCount = 0;
      page.on('request', request => {
        if (request.url().includes('chat')) {
          messageCount++;
          request.respond({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: `Risposta automatica numero ${messageCount}`
            })
          });
        } else {
          request.continue();
        }
      });
      
      // Send multiple messages
      for (const message of testMessages) {
        await page.type('#chatInput', message);
        await page.click('#sendButton');
        await page.waitForTimeout(1000);
      }
      
      // Verify all messages are preserved
      const allMessages = await page.$$eval('.message', msgs => 
        msgs.map(msg => ({
          text: msg.textContent,
          isUser: msg.classList.contains('user'),
          isBot: msg.classList.contains('bot')
        }))
      );
      
      const userMessages = allMessages.filter(msg => msg.isUser);
      const botMessages = allMessages.filter(msg => msg.isBot);
      
      expect(userMessages.length).toBe(3);
      expect(botMessages.length).toBeGreaterThanOrEqual(4); // Including initial message
      
      // Verify message order
      for (let i = 0; i < testMessages.length; i++) {
        expect(userMessages[i].text).toContain(testMessages[i]);
      }
      
      await global.takeScreenshot(page, 'message-history-preservation');
    });
    
    test('should scroll to new messages automatically', async () => {
      await page.goto(global.TEST_CONFIG.TEST_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Add many messages to test scrolling
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('chat')) {
          request.respond({
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: 'Risposta di test per verifica scrolling automatico'
            })
          });
        } else {
          request.continue();
        }
      });
      
      // Send multiple messages
      for (let i = 0; i < 5; i++) {
        await page.type('#chatInput', `Messaggio numero ${i + 1}`);
        await page.click('#sendButton');
        await page.waitForTimeout(500);
      }
      
      // Check if container scrolled to bottom
      const scrollInfo = await page.evaluate(() => {
        const container = document.getElementById('chatMessages');
        return {
          scrollTop: container.scrollTop,
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight,
          isAtBottom: Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 10
        };
      });
      
      expect(scrollInfo.isAtBottom).toBe(true);
      
      await global.takeScreenshot(page, 'auto-scroll-verification');
    });
  });
});