#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Pagine settori da modernizzare
const SETTORI_PAGES = [
    '_site/settori/pmi-startup.html',
    '_site/settori/studi-medici.html',
    '_site/settori/commercialisti.html',
    '_site/settori/studi-legali.html',
    '_site/settori/industria-40.html',
    '_site/settori/retail-gdo.html'
];

// Header moderno per pagine settori
const MODERN_SETTORI_HEADER = `<header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
  <nav class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="flex items-center justify-between h-20">
      <!-- Logo -->
      <div class="flex items-center space-x-4">
        <div class="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center">
          <span class="text-white font-bold text-xl">IT</span>
        </div>
        <div class="hidden sm:block">
          <h1 class="text-2xl font-bold text-neutral-900">IT-ERA</h1>
          <p class="text-sm text-neutral-600 -mt-1">Assistenza IT Professionale</p>
        </div>
      </div>
      
      <!-- Desktop Navigation -->
      <div class="hidden lg:flex items-center space-x-8">
        <a href="/it-era/" class="text-neutral-700 hover:text-brand-600 transition-colors">Home</a>
        <a href="/it-era/servizi.html" class="text-neutral-700 hover:text-brand-600 transition-colors">Servizi</a>
        <a href="/it-era/contatti.html" class="text-neutral-700 hover:text-brand-600 transition-colors">Contatti</a>
        <div class="relative group">
          <button class="text-brand-600 font-semibold flex items-center space-x-1">
            <span>Settori</span>
            <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <!-- Modern Dropdown -->
          <div class="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
            <div class="p-2">
              <a href="/it-era/settori/pmi-startup.html" class="block px-4 py-3 text-neutral-700 hover:bg-brand-50 hover:text-brand-600 rounded-xl transition-colors">PMI e Startup</a>
              <a href="/it-era/settori/studi-medici.html" class="block px-4 py-3 text-neutral-700 hover:bg-brand-50 hover:text-brand-600 rounded-xl transition-colors">Studi Medici</a>
              <a href="/it-era/settori/commercialisti.html" class="block px-4 py-3 text-neutral-700 hover:bg-brand-50 hover:text-brand-600 rounded-xl transition-colors">Commercialisti</a>
              <a href="/it-era/settori/studi-legali.html" class="block px-4 py-3 text-neutral-700 hover:bg-brand-50 hover:text-brand-600 rounded-xl transition-colors">Studi Legali</a>
              <a href="/it-era/settori/industria-40.html" class="block px-4 py-3 text-neutral-700 hover:bg-brand-50 hover:text-brand-600 rounded-xl transition-colors">Industria 4.0</a>
              <a href="/it-era/settori/retail-gdo.html" class="block px-4 py-3 text-neutral-700 hover:bg-brand-50 hover:text-brand-600 rounded-xl transition-colors">Retail e GDO</a>
            </div>
          </div>
        </div>
      </div>
      
      <!-- CTA Section -->
      <div class="hidden lg:flex items-center space-x-4">
        <a href="tel:+390398882041" class="flex items-center space-x-2 text-brand-600 hover:text-brand-700 font-semibold">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
          </svg>
          <span>039 888 2041</span>
        </a>
        <a href="/it-era/contatti.html" class="btn-primary btn-sm">
          Contattaci
        </a>
      </div>
      
      <!-- Mobile Menu Button -->
      <div class="lg:hidden">
        <button id="mobile-menu-button" class="p-2 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors" aria-label="Menu">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Mobile Menu -->
    <div id="mobile-menu" class="lg:hidden hidden border-t border-neutral-200 bg-white/95 backdrop-blur-xl">
      <div class="p-4 space-y-2">
        <a href="/it-era/" class="block px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors">Home</a>
        <a href="/it-era/servizi.html" class="block px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors">Servizi</a>
        <a href="/it-era/contatti.html" class="block px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors">Contatti</a>
        
        <div class="pt-2">
          <p class="px-4 py-2 text-xs font-semibold text-brand-600 uppercase tracking-wider">Settori</p>
          <a href="/it-era/settori/pmi-startup.html" class="block px-6 py-2 text-neutral-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">PMI e Startup</a>
          <a href="/it-era/settori/studi-medici.html" class="block px-6 py-2 text-neutral-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">Studi Medici</a>
          <a href="/it-era/settori/commercialisti.html" class="block px-6 py-2 text-neutral-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">Commercialisti</a>
          <a href="/it-era/settori/studi-legali.html" class="block px-6 py-2 text-neutral-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">Studi Legali</a>
          <a href="/it-era/settori/industria-40.html" class="block px-6 py-2 text-neutral-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">Industria 4.0</a>
          <a href="/it-era/settori/retail-gdo.html" class="block px-6 py-2 text-neutral-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">Retail e GDO</a>
        </div>
        
        <div class="pt-4 border-t border-neutral-200">
          <a href="tel:+390398882041" class="block px-4 py-3 text-brand-600 font-semibold hover:bg-brand-50 rounded-xl transition-colors">
            📞 039 888 2041
          </a>
          <a href="/it-era/contatti.html" class="block mt-2 btn-primary w-full text-center">
            Contattaci Ora
          </a>
        </div>
      </div>
    </div>
  </nav>
</header>`;

// Analytics per pagine settori
const SETTORI_ANALYTICS = `    <!-- ============================================
         ANALYTICS & TRACKING (HEAD SECTION)
         ============================================ -->
    
    <!-- Google Tag Manager (Place immediately after opening <head> tag) -->
    <!-- 
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
    -->
    
    <!-- Google Analytics 4 (Alternative to GTM) -->
    <!-- 
    <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'GA_MEASUREMENT_ID', {
        'page_title': 'IT-ERA Settori',
        'page_location': window.location.href,
        'content_group1': 'Settori'
      });
    </script>
    -->
    
    <!-- Modern CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/it-era/css/tailwind-config.js"></script>
    <link rel="stylesheet" href="/it-era/css/it-era-tailwind.css">`;

class SettoriModernizer {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            modernizedPages: [],
            errors: [],
            summary: {
                totalPages: SETTORI_PAGES.length,
                successfulModernizations: 0,
                failedModernizations: 0
            }
        };
    }

    // Legge un file
    readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Cannot read file ${filePath}: ${error.message}`);
        }
    }

    // Scrive un file
    writeFile(filePath, content) {
        try {
            fs.writeFileSync(filePath, content, 'utf8');
        } catch (error) {
            throw new Error(`Cannot write file ${filePath}: ${error.message}`);
        }
    }

    // Modernizza una singola pagina settore
    modernizePage(filePath) {
        console.log(`🎨 Modernizing: ${filePath}`);
        
        try {
            let content = this.readFile(filePath);
            let updated = false;

            // 1. Aggiorna CSS nel HEAD se presente
            if (content.includes('<link rel="stylesheet" href="/it-era/css/styles.css">')) {
                content = content.replace(
                    /<link rel="stylesheet" href="\/it-era\/css\/styles\.css">/,
                    SETTORI_ANALYTICS
                );
                updated = true;
                console.log('  ✅ Updated CSS and Analytics in HEAD');
            }

            // 2. Aggiorna header se presente
            const headerRegex = /<header[^>]*>[\s\S]*?<\/header>/;
            if (headerRegex.test(content)) {
                content = content.replace(headerRegex, MODERN_SETTORI_HEADER);
                updated = true;
                console.log('  ✅ Updated header with modern design');
            }

            // 3. Aggiorna body tag per GTM noscript
            content = content.replace(
                /<body[^>]*>/,
                `<body>
    <!-- Google Tag Manager (noscript) -->
    <!-- 
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    -->
    
    <!-- Skip to main content -->
    <a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>`
            );

            // 4. Aggiunge padding-top per header fisso
            content = content.replace(
                /<main[^>]*>/,
                '<main class="pt-20">'
            );

            if (updated) {
                this.writeFile(filePath, content);
                this.results.modernizedPages.push({
                    path: filePath,
                    success: true,
                    changes: ['CSS/Analytics', 'Header', 'Body tag', 'Main padding']
                });
                this.results.summary.successfulModernizations++;
                console.log(`  ✅ Successfully modernized ${filePath}`);
            } else {
                console.log(`  ⚠️  No modernization needed for ${filePath}`);
            }

        } catch (error) {
            console.log(`  ❌ Failed to modernize ${filePath}: ${error.message}`);
            this.results.errors.push({
                path: filePath,
                error: error.message
            });
            this.results.summary.failedModernizations++;
        }
    }

    // Modernizza tutte le pagine settori
    modernizeAllPages() {
        console.log('🎨 MODERNIZING SETTORI PAGES');
        console.log('=============================\n');

        SETTORI_PAGES.forEach(pagePath => {
            if (fs.existsSync(pagePath)) {
                this.modernizePage(pagePath);
            } else {
                console.log(`  ⚠️  File not found: ${pagePath}`);
                this.results.errors.push({
                    path: pagePath,
                    error: 'File not found'
                });
                this.results.summary.failedModernizations++;
            }
            console.log('');
        });

        this.printSummary();
    }

    // Stampa riassunto finale
    printSummary() {
        console.log('🏆 SETTORI MODERNIZATION SUMMARY');
        console.log('=================================');
        console.log(`🎯 Total Pages: ${this.results.summary.totalPages}`);
        console.log(`✅ Successful Modernizations: ${this.results.summary.successfulModernizations}`);
        console.log(`❌ Failed Modernizations: ${this.results.summary.failedModernizations}`);

        if (this.results.modernizedPages.length > 0) {
            console.log('\n📄 SUCCESSFULLY MODERNIZED PAGES:');
            this.results.modernizedPages.forEach(page => {
                console.log(`  ✅ ${page.path}`);
                console.log(`     Changes: ${page.changes.join(', ')}`);
            });
        }

        if (this.results.errors.length > 0) {
            console.log('\n⚠️  ERRORS:');
            this.results.errors.forEach(error => {
                console.log(`  ❌ ${error.path}: ${error.error}`);
            });
        }

        const successRate = Math.round((this.results.summary.successfulModernizations / this.results.summary.totalPages) * 100);
        
        if (successRate >= 90) {
            console.log('\n🎉 EXCELLENT! Settori pages modernized successfully.');
        } else if (successRate >= 70) {
            console.log('\n✅ GOOD! Most settori pages modernized with some issues.');
        } else {
            console.log('\n⚠️  NEEDS ATTENTION! Several settori pages failed to modernize.');
        }

        console.log(`\n🌐 Modernization completed at: ${this.results.timestamp}`);
    }
}

// Esegui la modernizzazione delle pagine settori
const modernizer = new SettoriModernizer();
modernizer.modernizeAllPages();
