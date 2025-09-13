const puppeteer = require('puppeteer');

(async () => {
  console.log('🧭 TESTING NAVIGATION AND ROUTING SYSTEM');
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const results = {
    menuComponent: { score: 0, total: 0, details: {} },
    sectorRouting: { score: 0, total: 0, details: {} },
    crossBranch: { score: 0, total: 0, details: {} },
    componentLoader: { score: 0, total: 0, details: {} },
    overall: { score: 0, total: 0 }
  };
  
  try {
    // ===== TEST SEPARATED MENU COMPONENT =====
    console.log('\n🧩 TESTING SEPARATED MENU COMPONENT...');
    await page.goto('https://it-era.it/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Test if header component loads
    const headerLoaded = await page.$('#header-placeholder header, header').catch(() => null);
    results.menuComponent.details.headerLoaded = headerLoaded !== null;
    results.menuComponent.total++;
    if (headerLoaded) results.menuComponent.score++;
    console.log(`  Header Component Loaded: ${headerLoaded ? '✅' : '❌'}`);
    
    // Test navigation menu presence
    const navMenu = await page.$('nav, .nav, [role="navigation"]').catch(() => null);
    results.menuComponent.details.navMenu = navMenu !== null;
    results.menuComponent.total++;
    if (navMenu) results.menuComponent.score++;
    console.log(`  Navigation Menu Present: ${navMenu ? '✅' : '❌'}`);
    
    // Test Settori dropdown
    const settoriDropdown = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.some(link => link.textContent.toLowerCase().includes('settori'));
    }).catch(() => false);
    results.menuComponent.details.settoriDropdown = settoriDropdown;
    results.menuComponent.total++;
    if (settoriDropdown) results.menuComponent.score++;
    console.log(`  Settori Dropdown Present: ${settoriDropdown ? '✅' : '❌'}`);
    
    // Test mobile menu functionality
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileMenuButton = await page.$('#mobile-menu-button, .mobile-menu-toggle, [aria-label*="menu"]').catch(() => null);
    results.menuComponent.details.mobileMenu = mobileMenuButton !== null;
    results.menuComponent.total++;
    if (mobileMenuButton) results.menuComponent.score++;
    console.log(`  Mobile Menu Button: ${mobileMenuButton ? '✅' : '❌'}`);
    
    // Reset to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    
    // ===== TEST SECTOR PAGE ROUTING =====
    console.log('\n🏢 TESTING SECTOR PAGE ROUTING...');
    
    const sectorPages = [
      { name: 'PMI e Startup', url: 'https://it-era.it/settori/pmi-startup.html' },
      { name: 'Commercialisti', url: 'https://it-era.it/settori/commercialisti.html' },
      { name: 'Studi Legali', url: 'https://it-era.it/settori/studi-legali.html' },
      { name: 'Industria 4.0', url: 'https://it-era.it/settori/industria-40.html' },
      { name: 'Retail e GDO', url: 'https://it-era.it/settori/retail-gdo.html' },
      { name: 'Studi Medici', url: 'https://it-era.it/settori/studi-medici/' }
    ];
    
    for (const sector of sectorPages) {
      try {
        console.log(`  Testing ${sector.name}...`);
        const response = await page.goto(sector.url, { 
          waitUntil: 'networkidle2',
          timeout: 15000 
        });
        
        const statusCode = response.status();
        const isWorking = statusCode === 200;
        
        results.sectorRouting.details[sector.name] = {
          statusCode,
          isWorking,
          url: sector.url
        };
        results.sectorRouting.total++;
        if (isWorking) results.sectorRouting.score++;
        
        console.log(`    ${sector.name}: ${isWorking ? '✅' : '❌'} (${statusCode})`);
        
        if (isWorking) {
          // Test if page has proper content
          const hasTitle = await page.$('h1').catch(() => null);
          const hasContent = await page.evaluate(() => document.body.textContent.length > 1000).catch(() => false);
          console.log(`    Content Check: ${hasTitle && hasContent ? '✅' : '⚠️'}`);
        }
        
      } catch (error) {
        console.log(`    ${sector.name}: ❌ (Error: ${error.message})`);
        results.sectorRouting.details[sector.name] = {
          statusCode: 0,
          isWorking: false,
          error: error.message
        };
        results.sectorRouting.total++;
      }
    }
    
    // ===== TEST CROSS-BRANCH COMPATIBILITY =====
    console.log('\n🔀 TESTING CROSS-BRANCH COMPATIBILITY...');
    
    // Test main branch menu links to sector pages
    await page.goto('https://it-era.it/', { waitUntil: 'networkidle2' });
    
    const menuLinks = await page.$$eval('a[href*="/settori/"]', 
      links => links.map(link => ({
        text: link.textContent.trim(),
        href: link.href
      }))
    ).catch(() => []);
    
    results.crossBranch.details.menuLinksFound = menuLinks.length;
    results.crossBranch.total++;
    if (menuLinks.length >= 5) results.crossBranch.score++;
    console.log(`  Menu Links to Sectors: ${menuLinks.length >= 5 ? '✅' : '❌'} (${menuLinks.length} found)`);
    
    menuLinks.forEach(link => {
      console.log(`    "${link.text}" → ${link.href}`);
    });
    
    // Test navigation from sector page back to main
    if (results.sectorRouting.details['PMI e Startup']?.isWorking) {
      await page.goto('https://it-era.it/settori/pmi-startup.html', { waitUntil: 'networkidle2' });
      
      const backToMainLinks = await page.$$eval('a[href*="../"], a[href="/"], a[href="https://it-era.it/"]', 
        links => links.length
      ).catch(() => 0);
      
      results.crossBranch.details.backToMainLinks = backToMainLinks;
      results.crossBranch.total++;
      if (backToMainLinks >= 1) results.crossBranch.score++;
      console.log(`  Back to Main Navigation: ${backToMainLinks >= 1 ? '✅' : '❌'} (${backToMainLinks} links)`);
    }
    
    // ===== TEST COMPONENT LOADING SYSTEM =====
    console.log('\n⚡ TESTING COMPONENT LOADING SYSTEM...');
    
    // Test components-loader.js presence and functionality
    await page.goto('https://it-era.it/', { waitUntil: 'networkidle2' });
    
    const componentLoaderScript = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(script => script.src.includes('components-loader.js'));
    }).catch(() => false);
    
    results.componentLoader.details.scriptLoaded = componentLoaderScript;
    results.componentLoader.total++;
    if (componentLoaderScript) results.componentLoader.score++;
    console.log(`  Component Loader Script: ${componentLoaderScript ? '✅' : '❌'}`);
    
    // Test if header placeholder gets replaced
    const headerPlaceholder = await page.$('#header-placeholder').catch(() => null);
    const headerContent = headerPlaceholder ? await page.evaluate(el => el.innerHTML.length > 100, headerPlaceholder) : false;
    
    results.componentLoader.details.headerReplaced = headerContent;
    results.componentLoader.total++;
    if (headerContent) results.componentLoader.score++;
    console.log(`  Header Placeholder Replaced: ${headerContent ? '✅' : '❌'}`);
    
    // Test component loading on sector page
    if (results.sectorRouting.details['Commercialisti']?.isWorking) {
      await page.goto('https://it-era.it/settori/commercialisti.html', { waitUntil: 'networkidle2' });
      
      const sectorHeaderLoaded = await page.evaluate(() => {
        const headerPlaceholder = document.querySelector('#header-placeholder');
        return headerPlaceholder && headerPlaceholder.innerHTML.length > 100;
      }).catch(() => false);
      
      results.componentLoader.details.sectorHeaderLoaded = sectorHeaderLoaded;
      results.componentLoader.total++;
      if (sectorHeaderLoaded) results.componentLoader.score++;
      console.log(`  Sector Page Header Loading: ${sectorHeaderLoaded ? '✅' : '❌'}`);
    }
    
    // ===== CALCULATE OVERALL RESULTS =====
    results.overall.score = results.menuComponent.score + results.sectorRouting.score + 
                           results.crossBranch.score + results.componentLoader.score;
    results.overall.total = results.menuComponent.total + results.sectorRouting.total + 
                           results.crossBranch.total + results.componentLoader.total;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 NAVIGATION AND ROUTING TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n🧩 MENU COMPONENT: ${results.menuComponent.score}/${results.menuComponent.total} (${Math.round(results.menuComponent.score/results.menuComponent.total*100)}%)`);
    console.log(`🏢 SECTOR ROUTING: ${results.sectorRouting.score}/${results.sectorRouting.total} (${Math.round(results.sectorRouting.score/results.sectorRouting.total*100)}%)`);
    console.log(`🔀 CROSS-BRANCH: ${results.crossBranch.score}/${results.crossBranch.total} (${Math.round(results.crossBranch.score/results.crossBranch.total*100)}%)`);
    console.log(`⚡ COMPONENT LOADER: ${results.componentLoader.score}/${results.componentLoader.total} (${Math.round(results.componentLoader.score/results.componentLoader.total*100)}%)`);
    
    const overallPercentage = Math.round(results.overall.score/results.overall.total*100);
    console.log(`\n🎯 OVERALL NAVIGATION SCORE: ${results.overall.score}/${results.overall.total} (${overallPercentage}%)`);
    
    // Detailed sector routing results
    console.log('\n📋 DETAILED SECTOR ROUTING RESULTS:');
    Object.entries(results.sectorRouting.details).forEach(([sector, details]) => {
      if (details.isWorking) {
        console.log(`  ✅ ${sector}: Working (${details.statusCode})`);
      } else {
        console.log(`  ❌ ${sector}: Failed (${details.statusCode || 'Error'})`);
      }
    });
    
    // Recommendations
    console.log('\n🔧 RECOMMENDATIONS:');
    if (overallPercentage >= 90) {
      console.log('✅ EXCELLENT! Navigation system is fully functional!');
    } else if (overallPercentage >= 75) {
      console.log('✅ GOOD! Most navigation features working, minor issues to address.');
    } else if (overallPercentage >= 50) {
      console.log('⚠️ PARTIAL! Some navigation issues need attention.');
      
      if (results.sectorRouting.score < results.sectorRouting.total * 0.8) {
        console.log('  - Fix sector page routing issues');
      }
      if (results.componentLoader.score < results.componentLoader.total * 0.8) {
        console.log('  - Check component loading system');
      }
    } else {
      console.log('❌ CRITICAL! Major navigation issues need immediate attention.');
    }
    
    console.log('\n🚀 NEXT STEPS:');
    if (overallPercentage >= 75) {
      console.log('✅ Ready to proceed with sector-specific optimizations on branches');
    } else {
      console.log('⚠️ Fix navigation issues before proceeding with branch optimizations');
    }
    
  } catch (error) {
    console.error('❌ Error during navigation testing:', error.message);
  } finally {
    await browser.close();
  }
})();
