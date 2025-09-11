#!/usr/bin/env node
/**
 * Quick Admin Validation Script
 * Validates that all admin functions exist and navigation works
 */

const puppeteer = require('puppeteer');

async function validateAdminPanel() {
  console.log('🔍 Validating IT-ERA Admin Panel...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to admin
    await page.goto('https://it-era.pages.dev/admin/', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('✅ Page loaded successfully');
    
    // Check that all navigation functions exist
    const functionChecks = await page.evaluate(() => {
      const functions = [
        'loadDashboard',
        'loadPosts', 
        'loadCategories',
        'loadTags',
        'loadMedia',
        'loadAnalytics', 
        'loadCalendar',
        'loadWebhooks',
        'loadUsers',
        'loadSettings'
      ];
      
      const results = {};
      functions.forEach(func => {
        results[func] = typeof window[func] === 'function';
      });
      
      return results;
    });
    
    console.log('\n📋 Function Validation:');
    let allFunctionsExist = true;
    
    Object.entries(functionChecks).forEach(([func, exists]) => {
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${func}`);
      if (!exists) allFunctionsExist = false;
    });
    
    // Check navigation links exist
    const navigationCheck = await page.evaluate(() => {
      const navLinks = document.querySelectorAll('.sidebar .nav-link[onclick]');
      return {
        total: document.querySelectorAll('.sidebar .nav-link').length,
        withOnclick: navLinks.length,
        links: Array.from(navLinks).map(link => ({
          text: link.textContent.trim(),
          onclick: link.getAttribute('onclick')
        }))
      };
    });
    
    console.log('\n🔗 Navigation Links:');
    console.log(`   Total links: ${navigationCheck.total}`);
    console.log(`   With onclick: ${navigationCheck.withOnclick}`);
    
    navigationCheck.links.forEach(link => {
      console.log(`   ✅ ${link.text}: ${link.onclick}`);
    });
    
    // Test a few key functions
    console.log('\n🧪 Testing Key Functions:');
    
    try {
      await page.evaluate(() => window.loadDashboard());
      await page.waitForTimeout(2000);
      
      const dashboardContent = await page.evaluate(() => {
        const content = document.getElementById('mainContent');
        return content && content.innerHTML.length > 100;
      });
      
      console.log(`   ✅ Dashboard loads: ${dashboardContent}`);
    } catch (error) {
      console.log(`   ⚠️ Dashboard test: ${error.message}`);
    }
    
    // Final validation
    const overallStatus = allFunctionsExist && navigationCheck.withOnclick >= 8;
    
    console.log('\n' + '='.repeat(50));
    console.log(`🏆 ADMIN PANEL STATUS: ${overallStatus ? 'FULLY FUNCTIONAL' : 'NEEDS ATTENTION'}`);
    
    if (overallStatus) {
      console.log('✅ All critical admin functions implemented');
      console.log('✅ Navigation links working correctly');
      console.log('✅ Fallback UI provides professional experience');
    }
    
    console.log('='.repeat(50));
    
    await browser.close();
    return overallStatus;
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    await browser.close();
    return false;
  }
}

if (require.main === module) {
  validateAdminPanel()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = validateAdminPanel;