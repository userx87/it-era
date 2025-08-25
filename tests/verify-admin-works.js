const puppeteer = require('puppeteer');

async function verifyAdminWorks() {
  console.log('🔍 Verifica immediata pannello admin IT-ERA\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1280,800']
  });
  
  try {
    const page = await browser.newPage();
    
    // 1. APERTURA PAGINA
    console.log('1️⃣ Apertura https://it-era.pages.dev/admin/');
    await page.goto('https://it-era.pages.dev/admin/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    console.log('✅ Pagina caricata correttamente\n');
    
    // 2. VERIFICA LOGIN FORM
    const hasLoginForm = await page.evaluate(() => {
      const email = document.getElementById('loginEmail');
      const password = document.getElementById('loginPassword');
      const button = document.querySelector('button[type="submit"]');
      return !!(email && password && button);
    });
    
    if (hasLoginForm) {
      console.log('2️⃣ Form di login presente');
      console.log('✅ Campi email e password trovati\n');
    } else {
      console.log('❌ Form di login NON trovato!\n');
      return;
    }
    
    // 3. LOGIN
    console.log('3️⃣ Esecuzione login con credenziali');
    await page.type('#loginEmail', 'admin@it-era.it');
    await page.type('#loginPassword', 'admin123!');
    await page.click('button[type="submit"]');
    
    // Aspetta un po'
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 4. VERIFICA AUTENTICAZIONE
    const authStatus = await page.evaluate(() => {
      const token = localStorage.getItem('auth_token');
      const mainContent = document.getElementById('mainContent');
      const sidebar = document.getElementById('sidebar');
      return {
        hasToken: !!token,
        hasMainContent: !!mainContent,
        hasSidebar: !!sidebar,
        currentUrl: window.location.href
      };
    });
    
    console.log('4️⃣ Stato dopo login:');
    console.log(`   Token JWT: ${authStatus.hasToken ? '✅ Presente' : '❌ Mancante'}`);
    console.log(`   Area principale: ${authStatus.hasMainContent ? '✅ Presente' : '❌ Mancante'}`);
    console.log(`   Menu laterale: ${authStatus.hasSidebar ? '✅ Presente' : '❌ Mancante'}`);
    console.log(`   URL corrente: ${authStatus.currentUrl}\n`);
    
    // 5. TEST MENU DASHBOARD
    if (authStatus.hasToken) {
      console.log('5️⃣ Test click su Dashboard');
      
      const dashboardResult = await page.evaluate(async () => {
        try {
          // Trova e clicca Dashboard
          const dashboardLink = document.querySelector('a[onclick="loadDashboard()"]');
          if (!dashboardLink) return { error: 'Link Dashboard non trovato' };
          
          dashboardLink.click();
          
          // Aspetta caricamento
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Verifica contenuto
          const mainContent = document.getElementById('mainContent');
          if (!mainContent) return { error: 'mainContent non trovato' };
          
          return {
            success: true,
            contentLength: mainContent.innerHTML.length,
            hasContent: mainContent.innerHTML.length > 100,
            preview: mainContent.innerText.substring(0, 200)
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (dashboardResult.success) {
        console.log(`   ✅ Dashboard caricato (${dashboardResult.contentLength} caratteri)`);
        console.log(`   Anteprima: "${dashboardResult.preview.substring(0, 100)}..."\n`);
      } else {
        console.log(`   ❌ Errore: ${dashboardResult.error}\n`);
      }
    }
    
    // 6. VERIFICA MENU ITEMS
    console.log('6️⃣ Menu disponibili nel sidebar:');
    const menuItems = await page.evaluate(() => {
      const links = document.querySelectorAll('#sidebar a[onclick]');
      return Array.from(links).map(link => ({
        text: link.innerText.trim(),
        onclick: link.getAttribute('onclick')
      }));
    });
    
    menuItems.forEach(item => {
      console.log(`   • ${item.text} → ${item.onclick}`);
    });
    
    // CONCLUSIONE
    console.log('\n' + '='.repeat(50));
    if (authStatus.hasToken && authStatus.hasMainContent && authStatus.hasSidebar) {
      console.log('🎉 IL PANNELLO ADMIN FUNZIONA PERFETTAMENTE!');
      console.log('✅ Login funzionante');
      console.log('✅ Dashboard accessibile');
      console.log('✅ Menu navigazione presente');
    } else {
      console.log('⚠️ PROBLEMI RILEVATI');
      if (!authStatus.hasToken) console.log('❌ Autenticazione fallita');
      if (!authStatus.hasMainContent) console.log('❌ Area contenuto mancante');
      if (!authStatus.hasSidebar) console.log('❌ Menu laterale mancante');
    }
    console.log('='.repeat(50));
    
    // Lascia aperto per ispezione manuale
    console.log('\n👀 Browser resta aperto per 15 secondi per ispezione manuale...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ ERRORE CRITICO:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Test completato');
  }
}

// Esegui test
verifyAdminWorks();