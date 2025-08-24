#!/usr/bin/env node
/**
 * Test completo area admin IT-ERA Blog
 * Testa tutte le funzioni e identifica cosa manca
 */

const puppeteer = require('puppeteer');

async function testAdminPanel() {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Imposta viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('🚀 TESTING IT-ERA BLOG ADMIN PANEL');
  console.log('=' .repeat(50));
  
  const report = {
    working: [],
    missing: [],
    errors: [],
    suggestions: []
  };
  
  try {
    // 1. ACCESSO ALLA PAGINA ADMIN
    console.log('\n📍 1. Testing Admin Page Access...');
    await page.goto('https://it-era.pages.dev/admin/', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    const title = await page.evaluate(() => document.title);
    console.log('✅ Page loaded:', title);
    report.working.push('Page loads correctly');
    
    // 2. TESTING LOGIN MODAL
    console.log('\n🔐 2. Testing Login Modal...');
    const loginModal = await page.evaluate(() => {
      return document.querySelector('#loginModal') !== null;
    });
    
    if (loginModal) {
      console.log('✅ Login modal found');
      report.working.push('Login modal present');
    } else {
      console.log('❌ Login modal missing');
      report.missing.push('Login modal not found');
    }
    
    // 3. TESTING LOGIN FUNCTIONALITY
    console.log('\n👤 3. Testing Login Process...');
    try {
      // Wait for and fill login form
      await page.waitForSelector('#loginEmail', { timeout: 5000 });
      await page.type('#loginEmail', 'admin@it-era.it');
      await page.type('#loginPassword', 'admin123!');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for potential redirect or modal close
      await page.waitForTimeout(3000);
      
      const loginSuccessful = await page.evaluate(() => {
        const modal = document.querySelector('#loginModal');
        return modal && !modal.classList.contains('show');
      });
      
      if (loginSuccessful) {
        console.log('✅ Login successful');
        report.working.push('Login functionality works');
      } else {
        console.log('❌ Login failed - API not connected');
        report.errors.push('Login API not responding');
      }
    } catch (error) {
      console.log('❌ Login error:', error.message);
      report.errors.push(`Login error: ${error.message}`);
    }
    
    // 4. TESTING NAVIGATION SIDEBAR
    console.log('\n📋 4. Testing Navigation Sidebar...');
    const navItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.sidebar .nav-link'));
      return items.map(item => ({
        text: item.textContent.trim(),
        onclick: item.getAttribute('onclick')
      }));
    });
    
    console.log('📋 Navigation items found:');
    navItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.text} ${item.onclick ? '✅' : '❌'}`);
      if (item.onclick) {
        report.working.push(`Navigation: ${item.text}`);
      } else {
        report.missing.push(`Missing onclick for: ${item.text}`);
      }
    });
    
    // 5. TESTING MAIN CONTENT AREA
    console.log('\n📄 5. Testing Main Content Area...');
    const mainContent = await page.evaluate(() => {
      const content = document.querySelector('#mainContent');
      return {
        exists: content !== null,
        hasContent: content && content.children.length > 0,
        innerHTML: content ? content.innerHTML.substring(0, 200) + '...' : null
      };
    });
    
    if (mainContent.exists) {
      console.log('✅ Main content area found');
      report.working.push('Main content area present');
    } else {
      console.log('❌ Main content area missing');
      report.missing.push('Main content area not found');
    }
    
    // 6. TESTING SPECIFIC ADMIN FUNCTIONS
    console.log('\n🔧 6. Testing Admin Functions...');
    
    const adminFunctions = [
      { name: 'Dashboard', func: 'loadDashboard', selector: null },
      { name: 'Posts Management', func: 'loadPosts', selector: null },
      { name: 'Categories', func: 'loadCategories', selector: null },
      { name: 'Tags', func: 'loadTags', selector: null },
      { name: 'Media Manager', func: 'loadMedia', selector: null },
      { name: 'Analytics', func: 'loadAnalytics', selector: null },
      { name: 'Calendar', func: 'loadCalendar', selector: null },
      { name: 'Webhooks', func: 'loadWebhooks', selector: null },
      { name: 'Users Management', func: 'loadUsers', selector: null },
      { name: 'Settings', func: 'loadSettings', selector: null }
    ];
    
    for (const func of adminFunctions) {
      const functionExists = await page.evaluate((funcName) => {
        return typeof window[funcName] === 'function';
      }, func.func);
      
      if (functionExists) {
        console.log(`   ✅ ${func.name} function exists`);
        report.working.push(`Function: ${func.name}`);
      } else {
        console.log(`   ❌ ${func.name} function missing`);
        report.missing.push(`Missing function: ${func.name}`);
      }
    }
    
    // 7. TESTING API CONFIGURATION
    console.log('\n🌐 7. Testing API Configuration...');
    const apiConfig = await page.evaluate(() => {
      return {
        configExists: typeof window.CONFIG !== 'undefined',
        baseURL: window.CONFIG ? window.CONFIG.API_BASE_URL : null,
        adminURL: window.CONFIG ? window.CONFIG.ADMIN_API_BASE_URL : null
      };
    });
    
    if (apiConfig.configExists) {
      console.log('✅ Config object exists');
      console.log(`   API Base URL: ${apiConfig.baseURL}`);
      console.log(`   Admin API URL: ${apiConfig.adminURL}`);
      report.working.push('API configuration present');
    } else {
      console.log('❌ Config object missing');
      report.missing.push('API configuration missing');
    }
    
    // 8. TESTING EXTERNAL DEPENDENCIES
    console.log('\n📦 8. Testing External Dependencies...');
    const dependencies = await page.evaluate(() => {
      return {
        bootstrap: typeof window.bootstrap !== 'undefined',
        ckeditor: typeof window.ClassicEditor !== 'undefined',
        chartjs: typeof window.Chart !== 'undefined',
        jquery: typeof window.$ !== 'undefined'
      };
    });
    
    Object.entries(dependencies).forEach(([dep, exists]) => {
      if (exists) {
        console.log(`   ✅ ${dep} loaded`);
        report.working.push(`Dependency: ${dep}`);
      } else {
        console.log(`   ❌ ${dep} missing`);
        report.missing.push(`Missing dependency: ${dep}`);
      }
    });
    
    // 9. TESTING API ENDPOINTS
    console.log('\n🔌 9. Testing API Endpoints...');
    try {
      const healthCheck = await fetch('https://it-era-blog-api.bulltech.workers.dev/health');
      if (healthCheck.ok) {
        console.log('✅ API endpoint responsive');
        report.working.push('API endpoint accessible');
      } else {
        console.log('❌ API endpoint not responding');
        report.errors.push('API endpoint not responding');
      }
    } catch (error) {
      console.log('❌ API endpoint error:', error.message);
      report.errors.push(`API error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    report.errors.push(`General error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // GENERATE REPORT
  console.log('\n' + '='.repeat(60));
  console.log('📊 ADMIN PANEL TEST REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n✅ WORKING FEATURES (${report.working.length}):`);
  report.working.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item}`);
  });
  
  console.log(`\n❌ MISSING FEATURES (${report.missing.length}):`);
  report.missing.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item}`);
  });
  
  console.log(`\n🚨 ERRORS (${report.errors.length}):`);
  report.errors.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item}`);
  });
  
  // AGENT ASSIGNMENTS
  console.log('\n' + '='.repeat(60));
  console.log('🤖 AGENT ASSIGNMENTS FOR MISSING FEATURES');
  console.log('='.repeat(60));
  
  const agentAssignments = [
    {
      agent: 'backend-dev',
      tasks: [
        'Implement missing API endpoints for admin functions',
        'Fix login authentication system',
        'Create database connection and queries',
        'Implement user session management'
      ]
    },
    {
      agent: 'coder', 
      tasks: [
        'Implement missing JavaScript functions (loadDashboard, loadPosts, etc.)',
        'Add missing onclick handlers for navigation',
        'Fix API configuration loading',
        'Implement admin UI components'
      ]
    },
    {
      agent: 'reviewer',
      tasks: [
        'Review security implementation',
        'Check authentication flow',
        'Validate admin panel permissions',
        'Review API security headers'
      ]
    },
    {
      agent: 'tester',
      tasks: [
        'Create comprehensive admin panel tests',
        'Test all CRUD operations',
        'Validate user roles and permissions',
        'Test API endpoint responses'
      ]
    }
  ];
  
  agentAssignments.forEach(assignment => {
    console.log(`\n🎯 AGENT: ${assignment.agent.toUpperCase()}`);
    assignment.tasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task}`);
    });
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 PRIORITY IMPLEMENTATION ORDER:');
  console.log('='.repeat(60));
  console.log('1. 🔧 Backend API implementation (backend-dev)');
  console.log('2. 🎨 Frontend functionality (coder)'); 
  console.log('3. 🔒 Security review (reviewer)');
  console.log('4. 🧪 Complete testing (tester)');
  
  const completionPercentage = Math.round((report.working.length / (report.working.length + report.missing.length + report.errors.length)) * 100);
  console.log(`\n🏆 ADMIN PANEL COMPLETION: ${completionPercentage}%`);
  
  return report;
}

// Run the test
if (require.main === module) {
  testAdminPanel().then(() => {
    console.log('\n✅ Admin panel testing completed!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = testAdminPanel;