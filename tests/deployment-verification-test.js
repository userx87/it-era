/**
 * Deployment Verification Test
 * Compares local files vs production deployment to identify deployment issues
 */

const fs = require('fs').promises;
const puppeteer = require('puppeteer');
const path = require('path');

describe('Deployment Verification', () => {
  let browser, page;
  const PRODUCTION_URL = 'https://it-era.pages.dev/';
  const LOCAL_INDEX_PATH = path.join(__dirname, '../web/index.html');

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) await browser.close();
  });

  test('Compare Local vs Production HTML', async () => {
    console.log('🔍 Comparing local vs production HTML...');
    
    // Read local index.html
    const localHTML = await fs.readFile(LOCAL_INDEX_PATH, 'utf8');
    
    // Get production HTML
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle2' });
    const productionHTML = await page.content();
    
    // Analyze chatbot presence
    const localAnalysis = {
      hasChatbotContainer: localHTML.includes('it-era-chatbot-container'),
      hasChatbotButton: localHTML.includes('it-era-chatbot-button'),
      hasChatbotStyles: localHTML.includes('it-era-chatbot-styles'),
      hasChatbotScript: localHTML.includes('it-era-chatbot'),
      hasAPIEndpoint: localHTML.includes('it-era-chatbot-prod.bulltech.workers.dev'),
      totalLength: localHTML.length
    };
    
    const productionAnalysis = {
      hasChatbotContainer: productionHTML.includes('it-era-chatbot-container'),
      hasChatbotButton: productionHTML.includes('it-era-chatbot-button'),
      hasChatbotStyles: productionHTML.includes('it-era-chatbot-styles'),
      hasChatbotScript: productionHTML.includes('it-era-chatbot'),
      hasAPIEndpoint: productionHTML.includes('it-era-chatbot-prod.bulltech.workers.dev'),
      totalLength: productionHTML.length
    };
    
    console.log('📄 Local Analysis:', localAnalysis);
    console.log('🌐 Production Analysis:', productionAnalysis);
    
    // Create comparison report
    const comparisonReport = {
      timestamp: new Date().toISOString(),
      local: localAnalysis,
      production: productionAnalysis,
      differences: {
        chatbotMissing: localAnalysis.hasChatbotContainer && !productionAnalysis.hasChatbotContainer,
        sizeDifference: Math.abs(localAnalysis.totalLength - productionAnalysis.totalLength),
        percentageDifference: Math.abs(1 - (productionAnalysis.totalLength / localAnalysis.totalLength)) * 100
      }
    };
    
    await fs.writeFile(
      path.join(__dirname, 'debug-output/deployment-comparison.json'),
      JSON.stringify(comparisonReport, null, 2)
    );
    
    console.log('📊 Comparison Results:');
    console.log(`- Chatbot missing in production: ${comparisonReport.differences.chatbotMissing}`);
    console.log(`- Size difference: ${comparisonReport.differences.sizeDifference} characters`);
    console.log(`- Percentage difference: ${comparisonReport.differences.percentageDifference.toFixed(1)}%`);
    
    // The test should fail if chatbot is missing in production
    expect(comparisonReport.differences.chatbotMissing).toBe(false);
  });

  test('Verify Cloudflare Worker Endpoint', async () => {
    console.log('🔍 Testing Cloudflare Worker endpoint...');
    
    const workerURL = 'https://it-era-chatbot-prod.bulltech.workers.dev/api/chat';
    
    try {
      const response = await fetch(workerURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'init',
          pageUrl: PRODUCTION_URL
        })
      });
      
      const data = await response.json();
      
      console.log('✅ Worker Response:', {
        status: response.status,
        success: data.success || false,
        hasResponse: !!data.response
      });
      
      expect(response.status).toBeLessThan(500); // Should not be server error
      
    } catch (error) {
      console.log('❌ Worker Error:', error.message);
      throw error;
    }
  });

  test('Git Status Check', async () => {
    console.log('🔍 Checking git status for deployment issues...');
    
    const { execSync } = require('child_process');
    
    try {
      // Check current branch
      const currentBranch = execSync('git branch --show-current', { 
        cwd: path.join(__dirname, '..'), 
        encoding: 'utf8' 
      }).trim();
      
      // Check if there are uncommitted changes
      const status = execSync('git status --porcelain', { 
        cwd: path.join(__dirname, '..'), 
        encoding: 'utf8' 
      });
      
      // Check last commit
      const lastCommit = execSync('git log -1 --pretty=format:"%h %s"', { 
        cwd: path.join(__dirname, '..'), 
        encoding: 'utf8' 
      });
      
      const gitAnalysis = {
        currentBranch,
        hasUncommittedChanges: status.length > 0,
        uncommittedFiles: status.split('\n').filter(line => line.trim()).length,
        lastCommit
      };
      
      console.log('📋 Git Analysis:', gitAnalysis);
      
      if (gitAnalysis.hasUncommittedChanges) {
        console.log('⚠️ Warning: Uncommitted changes detected. These may not be in production.');
        console.log('📝 Uncommitted files count:', gitAnalysis.uncommittedFiles);
      }
      
      // Save git analysis
      await fs.writeFile(
        path.join(__dirname, 'debug-output/git-analysis.json'),
        JSON.stringify(gitAnalysis, null, 2)
      );
      
    } catch (error) {
      console.log('❌ Git analysis failed:', error.message);
    }
  });

  test('Generate Deployment Action Plan', async () => {
    console.log('📋 Generating deployment action plan...');
    
    const actionPlan = {
      issue: "Chatbot integration exists locally but is missing from production",
      rootCause: "Local changes not deployed to Cloudflare Pages",
      priority: "HIGH",
      
      immediateActions: [
        {
          step: 1,
          action: "Commit all local changes",
          command: "git add . && git commit -m 'Add chatbot integration to production'",
          description: "Ensure all chatbot files are committed to git"
        },
        {
          step: 2, 
          action: "Push to production branch",
          command: "git push origin production",
          description: "Deploy changes to Cloudflare Pages"
        },
        {
          step: 3,
          action: "Verify deployment",
          command: "Wait 2-3 minutes and test https://it-era.pages.dev/",
          description: "Check that chatbot appears on production site"
        }
      ],
      
      verification: [
        "Visit https://it-era.pages.dev/",
        "Look for chatbot button in bottom-right corner", 
        "Click chatbot to test functionality",
        "Verify API calls to Cloudflare Worker"
      ],
      
      rollback: [
        "If issues occur, revert commit: git revert HEAD",
        "Push revert: git push origin production"
      ]
    };
    
    // Save action plan
    await fs.writeFile(
      path.join(__dirname, 'debug-output/deployment-action-plan.json'),
      JSON.stringify(actionPlan, null, 2)
    );
    
    console.log('✅ Action plan generated!');
    console.log('📁 Check debug-output/deployment-action-plan.json for detailed steps');
    
    // Print immediate actions
    console.log('\n🚀 IMMEDIATE ACTIONS NEEDED:');
    actionPlan.immediateActions.forEach(action => {
      console.log(`${action.step}. ${action.action}`);
      console.log(`   Command: ${action.command}`);
      console.log(`   ${action.description}\n`);
    });
  });
});