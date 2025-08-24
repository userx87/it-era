const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

describe('Admin Panel Testing', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    page.on('console', msg => console.log('ADMIN PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('ADMIN PAGE ERROR:', error.message));
  });
  
  afterAll(async () => {
    if (browser) await browser.close();
  });
  
  describe('Admin Panel Structure and Loading', () => {
    test('should load admin panel correctly', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      const pageTitle = await page.title();
      expect(pageTitle).toContain('IT-ERA Chatbot Admin');
      
      // Check main structure
      const structure = await page.evaluate(() => {
        return {
          header: !!document.querySelector('.header'),
          container: !!document.querySelector('.container'),
          tabs: !!document.querySelector('.tabs'),
          tabsCount: document.querySelectorAll('.tab').length,
          activeTab: document.querySelector('.tab.active')?.textContent
        };
      });
      
      expect(structure.header).toBe(true);
      expect(structure.container).toBe(true);
      expect(structure.tabs).toBe(true);
      expect(structure.tabsCount).toBeGreaterThanOrEqual(6);
      expect(structure.activeTab).toContain('Dashboard');
      
      await global.takeScreenshot(page, 'admin-panel-loaded');
    });
    
    test('should display correct dashboard metrics', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const dashboardMetrics = await page.evaluate(() => {
        const metrics = {};
        
        // Swarm status
        metrics.swarmMode = document.querySelector('.metric-value')?.textContent;
        
        // Get all metric values
        const metricElements = document.querySelectorAll('.metric');
        metrics.details = Array.from(metricElements).map(metric => ({
          label: metric.querySelector('.metric-label')?.textContent,
          value: metric.querySelector('.metric-value')?.textContent
        }));
        
        return metrics;
      });
      
      expect(dashboardMetrics.details).toBeDefined();
      expect(dashboardMetrics.details.length).toBeGreaterThan(0);
      
      // Check for key metrics mentioned in PSD
      const hasSwarmStatus = dashboardMetrics.details.some(m => 
        m.label?.includes('Modalità') && m.value?.includes('Swarm')
      );
      expect(hasSwarmStatus).toBe(true);
      
      await global.takeScreenshot(page, 'admin-dashboard-metrics');
    });
  });
  
  describe('Tab Switching Functionality', () => {
    test('should switch between all tabs correctly', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { waitUntil: 'networkidle0' });
      
      const tabNames = ['dashboard', 'config', 'rules', 'conversations', 'prompts', 'deploy'];
      const results = [];
      
      for (const tabName of tabNames) {
        // Click tab
        await page.click(`button[onclick*="${tabName}"]`);
        await page.waitForTimeout(300);
        
        // Check if tab is active and content is visible
        const tabState = await page.evaluate((name) => {
          const tab = document.querySelector(`button[onclick*="${name}"]`);
          const content = document.getElementById(name);
          return {
            tabActive: tab?.classList.contains('active'),
            contentVisible: content?.classList.contains('active'),
            contentExists: !!content
          };
        }, tabName);
        
        expect(tabState.tabActive).toBe(true);
        expect(tabState.contentVisible).toBe(true);
        expect(tabState.contentExists).toBe(true);
        
        results.push({ tab: tabName, ...tabState });
        await global.takeScreenshot(page, `tab-${tabName}-active`);
      }
      
      await fs.writeJson(path.join(global.TEST_CONFIG.REPORTS_DIR, 'tab-switching-results.json'), results);
    });
  });
  
  describe('Configuration Management', () => {
    test('should handle AI model configuration', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { waitUntil: 'networkidle0' });
      
      // Switch to config tab
      await page.click('button[onclick*="config"]');
      
      // Test AI model selection
      const aiModelSelect = '#aiModel';
      await page.waitForSelector(aiModelSelect);
      
      // Get available options
      const modelOptions = await page.$$eval(`${aiModelSelect} option`, options => 
        options.map(option => ({
          value: option.value,
          text: option.textContent,
          selected: option.selected
        }))
      );
      
      expect(modelOptions.length).toBeGreaterThanOrEqual(4);
      
      // Check if DeepSeek is default (as per PSD requirements)
      const defaultModel = modelOptions.find(opt => opt.selected);
      expect(defaultModel?.value).toContain('deepseek');
      
      // Test model switching
      await page.select(aiModelSelect, 'anthropic/claude-3.5-sonnet');
      const newSelection = await page.$eval(aiModelSelect, el => el.value);
      expect(newSelection).toBe('anthropic/claude-3.5-sonnet');
      
      await global.takeScreenshot(page, 'ai-model-configuration');
    });
    
    test('should handle swarm configuration settings', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { waitUntil: 'networkidle0' });
      await page.click('button[onclick*="config"]');
      
      // Test swarm enable/disable toggle
      const swarmToggle = '#swarmEnabled';
      await page.waitForSelector(swarmToggle);
      
      const initialState = await page.$eval(swarmToggle, el => el.checked);
      
      // Toggle swarm
      await page.click(swarmToggle);
      const newState = await page.$eval(swarmToggle, el => el.checked);
      expect(newState).toBe(!initialState);
      
      // Test percentage slider
      const percentageSlider = '#swarmPercentage';
      await page.evaluate(() => {
        document.getElementById('swarmPercentage').value = 75;
        document.getElementById('swarmPercentage').dispatchEvent(new Event('input'));
      });
      
      const sliderValue = await page.$eval(percentageSlider, el => el.value);
      const displayValue = await page.$eval('#swarmPercentageValue', el => el.textContent);
      
      expect(sliderValue).toBe('75');
      expect(displayValue).toBe('75%');
      
      await global.takeScreenshot(page, 'swarm-configuration');
    });
    
    test('should save configurations', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { waitUntil: 'networkidle0' });
      await page.click('button[onclick*="config"]');
      
      // Mock successful save
      await page.evaluate(() => {
        window.showAlert = jest.fn();
      });
      
      // Test AI config save
      await page.click('button[onclick="saveAIConfig()"]');
      
      // Check if save function was called (mock success alert)
      await page.waitForTimeout(500);
      
      await global.takeScreenshot(page, 'configuration-save-test');
    });
  });
  
  describe('Business Rules Management', () => {
    test('should display and manage blocked patterns', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { waitUntil: 'networkidle0' });
      await page.click('button[onclick*="rules"]');
      
      // Check existing blocked patterns
      const blockedPatterns = await page.$$eval('.blocked-pattern code', patterns => 
        patterns.map(pattern => pattern.textContent)
      );
      
      expect(blockedPatterns.length).toBeGreaterThan(0);
      
      // Verify pattern types match PSD requirements
      const hasConfigPattern = blockedPatterns.some(p => p.includes('configuro'));
      const hasPasswordPattern = blockedPatterns.some(p => p.includes('password'));
      const hasDIYPattern = blockedPatterns.some(p => p.includes('fai'));
      
      expect(hasConfigPattern).toBe(true);
      expect(hasPasswordPattern).toBe(true);
      expect(hasDIYPattern).toBe(true);
      
      await global.takeScreenshot(page, 'blocked-patterns-display');
    });
    
    test('should add new blocked patterns', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { waitUntil: 'networkidle0' });
      await page.click('button[onclick*="rules"]');
      
      const initialPatternCount = await page.$$eval('.blocked-pattern', patterns => patterns.length);
      
      // Add new pattern
      const newPattern = '/test[\s-]?pattern/i';
      await page.type('#newPattern', newPattern);
      await page.click('button[onclick="addPattern()"]');
      
      await page.waitForTimeout(500);
      
      const finalPatternCount = await page.$$eval('.blocked-pattern', patterns => patterns.length);
      expect(finalPatternCount).toBe(initialPatternCount + 1);
      
      // Verify the new pattern was added
      const patterns = await page.$$eval('.blocked-pattern code', codes => 
        codes.map(code => code.textContent)
      );
      expect(patterns).toContain(newPattern);
      
      await global.takeScreenshot(page, 'pattern-addition-test');
    });
    
    test('should manage standard responses', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { waitUntil: 'networkidle0' });
      await page.click('button[onclick*="rules"]');
      
      // Check response textareas
      const responses = await page.evaluate(() => ({
        config: document.getElementById('configResponse')?.value,
        credentials: document.getElementById('credentialsResponse')?.value,
        diy: document.getElementById('diyResponse')?.value
      }));
      
      expect(responses.config).toContain('tecnici certificati');
      expect(responses.credentials).toContain('039 888 2041');
      expect(responses.diy).toContain('esperti');
      
      // Test editing response
      const newResponse = 'Test updated response for configuration requests.';
      await page.evaluate(() => document.getElementById('configResponse').value = '');
      await page.type('#configResponse', newResponse);
      
      const updatedResponse = await page.$eval('#configResponse', el => el.value);
      expect(updatedResponse).toBe(newResponse);
      
      await global.takeScreenshot(page, 'standard-responses-management');
    });
  });
  
  describe('Real-time Metrics and Monitoring', () => {
    test('should display live conversation data', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { waitUntil: 'networkidle0' });
      await page.click('button[onclick*="conversations"]');
      
      // Check conversation list
      const conversations = await page.$$eval('.conversation-item', items => 
        items.map(item => ({
          score: item.querySelector('.score')?.textContent,
          time: item.querySelector('.time')?.textContent,
          message: item.querySelector('.message')?.textContent
        }))
      );
      
      expect(conversations.length).toBeGreaterThan(0);
      
      // Verify lead scores are properly displayed
      const scores = conversations.map(c => parseInt(c.score)).filter(s => !isNaN(s));
      expect(scores.every(score => score >= 0 && score <= 100)).toBe(true);
      
      await global.takeScreenshot(page, 'conversation-monitoring');
    });
    
    test('should show performance statistics', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { waitUntil: 'networkidle0' });
      await page.click('button[onclick*="conversations"]');
      
      const stats = await page.evaluate(() => {
        const metrics = document.querySelectorAll('.card:nth-child(2) .metric');
        return Array.from(metrics).map(metric => ({
          label: metric.querySelector('.metric-label')?.textContent,
          value: metric.querySelector('.metric-value')?.textContent
        }));
      });
      
      expect(stats.length).toBeGreaterThan(0);
      
      // Check for key performance metrics
      const hasConversationCount = stats.some(s => s.label?.includes('Conversazioni'));
      const hasSessionTime = stats.some(s => s.label?.includes('Tempo Medio'));
      const hasConversionRate = stats.some(s => s.label?.includes('Conversione'));
      
      expect(hasConversationCount).toBe(true);
      expect(hasSessionTime).toBe(true);
      expect(hasConversionRate).toBe(true);
      
      await global.takeScreenshot(page, 'performance-statistics');
    });
  });
  
  describe('Deploy and Management Functions', () => {
    test('should handle deploy interface', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { waitUntil: 'networkidle0' });
      await page.click('button[onclick*="deploy"]');
      
      // Check deploy environment selection
      const envSelect = '#deployEnv';
      await page.waitForSelector(envSelect);
      
      const envOptions = await page.$$eval(`${envSelect} option`, options => 
        options.map(opt => ({ value: opt.value, text: opt.textContent }))
      );
      
      expect(envOptions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ value: 'staging' }),
          expect.objectContaining({ value: 'production' })
        ])
      );
      
      // Test deploy log display
      const deployLog = await page.$eval('#deployLog', el => el.textContent);
      expect(deployLog).toContain('Deploy su staging completato');
      
      await global.takeScreenshot(page, 'deploy-interface');
    });
    
    test('should handle emergency swarm disable', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { waitUntil: 'networkidle0' });
      await page.click('button[onclick*="deploy"]');
      
      // Mock confirm dialog
      await page.evaluateOnNewDocument(() => {
        window.confirm = () => true;
      });
      
      await page.click('button[onclick="disableSwarm()"]');
      
      // Check if swarm was disabled
      await page.click('button[onclick*="config"]');
      await page.waitForTimeout(500);
      
      const swarmEnabled = await page.$eval('#swarmEnabled', el => el.checked);
      const swarmPercentage = await page.$eval('#swarmPercentage', el => el.value);
      
      expect(swarmEnabled).toBe(false);
      expect(swarmPercentage).toBe('0');
      
      await global.takeScreenshot(page, 'emergency-swarm-disable');
    });
  });
  
  describe('System Integration and Export/Import', () => {
    test('should export configuration', async () => {
      await page.goto(global.TEST_CONFIG.ADMIN_PAGE_URL, { waitUntil: 'networkidle0' });
      await page.click('button[onclick*="deploy"]');
      
      // Test export functionality (mock download)
      await page.evaluateOnNewDocument(() => {
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
          const element = originalCreateElement.call(this, tagName);
          if (tagName === 'a' && element.download) {
            element.click = function() {
              console.log('Download triggered:', this.download);
            };
          }
          return element;
        };
      });
      
      await page.click('button[onclick="exportConfig()"]');
      await page.waitForTimeout(500);
      
      await global.takeScreenshot(page, 'config-export-test');
    });
  });
});