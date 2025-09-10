#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Pagine da completare
const PAGES_TO_COMPLETE = [
    '_site/contatti.html',
    '_site/settori/pmi-startup.html',
    '_site/settori/studi-medici.html',
    '_site/settori/commercialisti.html',
    '_site/settori/studi-legali.html',
    '_site/settori/industria-40.html',
    '_site/settori/retail-gdo.html'
];

// Footer moderno
const MODERN_FOOTER = `    <!-- Modern Footer -->
    <footer class="bg-neutral-900 text-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <!-- Main Footer Content -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <!-- Company Info -->
          <div class="lg:col-span-2">
            <div class="flex items-center space-x-4 mb-8">
              <div class="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-3xl flex items-center justify-center">
                <span class="text-white font-bold text-2xl">IT</span>
              </div>
              <div>
                <h3 class="text-2xl font-bold">IT-ERA</h3>
                <p class="text-neutral-400">Assistenza IT Professionale</p>
              </div>
            </div>
            <p class="text-neutral-300 mb-8 leading-relaxed text-lg max-w-md">
              Assistenza informatica professionale per aziende in Lombardia. Soluzioni IT innovative e supporto 24/7 per far crescere il tuo business.
            </p>
            
            <!-- Emergency Contact -->
            <div class="p-6 bg-danger-900/30 border border-danger-800/50 rounded-2xl backdrop-blur-sm">
              <div class="flex items-center mb-3">
                <div class="w-3 h-3 bg-danger-500 rounded-full mr-3 animate-pulse"></div>
                <span class="text-danger-400 font-semibold">Emergenza IT</span>
              </div>
              <a href="tel:+390398882041" class="text-white font-bold text-xl hover:text-danger-200 transition-colors">
                📞 039 888 2041
              </a>
              <p class="text-neutral-400 text-sm mt-1">Disponibile 24/7</p>
            </div>
          </div>
          
          <!-- Services -->
          <div>
            <h4 class="text-xl font-bold text-white mb-6">Servizi</h4>
            <ul class="space-y-4">
              <li><a href="/it-era/servizi.html" class="text-neutral-300 hover:text-brand-400 transition-colors duration-200 flex items-center group">
                <div class="w-2 h-2 bg-brand-500 rounded-full mr-3 group-hover:scale-125 transition-transform"></div>
                Assistenza IT
              </a></li>
              <li><a href="/it-era/servizi.html" class="text-neutral-300 hover:text-brand-400 transition-colors duration-200 flex items-center group">
                <div class="w-2 h-2 bg-brand-500 rounded-full mr-3 group-hover:scale-125 transition-transform"></div>
                Sicurezza Informatica
              </a></li>
              <li><a href="/it-era/servizi.html" class="text-neutral-300 hover:text-brand-400 transition-colors duration-200 flex items-center group">
                <div class="w-2 h-2 bg-brand-500 rounded-full mr-3 group-hover:scale-125 transition-transform"></div>
                Cloud Computing
              </a></li>
              <li><a href="/it-era/servizi.html" class="text-neutral-300 hover:text-brand-400 transition-colors duration-200 flex items-center group">
                <div class="w-2 h-2 bg-brand-500 rounded-full mr-3 group-hover:scale-125 transition-transform"></div>
                Consulenza IT
              </a></li>
            </ul>
          </div>

          <!-- Contact Info -->
          <div>
            <h4 class="text-xl font-bold text-white mb-6">Contatti</h4>
            <ul class="space-y-6">
              <li>
                <div class="flex items-center mb-2">
                  <div class="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center mr-4">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                    </svg>
                  </div>
                  <div>
                    <a href="tel:+390398882041" class="text-white font-semibold hover:text-brand-400 transition-colors text-lg">039 888 2041</a>
                    <p class="text-neutral-400 text-sm">Chiamata gratuita</p>
                  </div>
                </div>
              </li>
              <li>
                <div class="flex items-center mb-2">
                  <div class="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center mr-4">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <a href="mailto:info@it-era.it" class="text-white font-semibold hover:text-brand-400 transition-colors">info@it-era.it</a>
                    <p class="text-neutral-400 text-sm">Risposta in 24h</p>
                  </div>
                </div>
              </li>
              <li>
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center mr-4">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <span class="text-white font-semibold">Vimercate, Lombardia</span>
                    <p class="text-neutral-400 text-sm">Servizio in tutta la regione</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Bottom Footer -->
        <div class="border-t border-gray-800 mt-12 pt-8">
          <div class="flex flex-col md:flex-row justify-between items-center">
            <div class="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; 2025 IT-ERA. Tutti i diritti riservati. | P.IVA: 12345678901
            </div>
            <div class="flex space-x-6 text-sm">
              <a href="/it-era/privacy.html" class="text-gray-400 hover:text-white transition-colors duration-200">Privacy Policy</a>
              <a href="/it-era/cookie.html" class="text-gray-400 hover:text-white transition-colors duration-200">Cookie Policy</a>
              <a href="/it-era/termini.html" class="text-gray-400 hover:text-white transition-colors duration-200">Termini di Servizio</a>
            </div>
          </div>
        </div>
      </div>
    </footer>`;

// Chatbot moderno
const MODERN_CHATBOT = `    
    <!-- Modern Chatbot Widget -->
    <div id="chatbot-widget" class="fixed bottom-8 right-8 z-50">
      <!-- Chatbot Button -->
      <button id="chatbot-button" class="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group transform hover:scale-105">
        <svg class="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
        <!-- Notification Badge -->
        <div class="absolute -top-2 -right-2 w-6 h-6 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse font-bold">!</div>
      </button>
      
      <!-- Chatbot Popup -->
      <div id="chatbot-popup" class="absolute bottom-20 right-0 w-96 bg-white rounded-3xl shadow-2xl border border-neutral-200 hidden transform transition-all duration-300 scale-95 opacity-0">
        <!-- Header -->
        <div class="p-6 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-t-3xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-3 h-3 bg-success-400 rounded-full animate-pulse"></div>
              <div>
                <h3 class="font-bold">Assistenza IT-ERA</h3>
                <p class="text-sm text-brand-100">Online ora</p>
              </div>
            </div>
            <button id="chatbot-close" class="text-white hover:text-brand-200 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Content -->
        <div class="p-6">
          <!-- Welcome Message -->
          <div class="mb-6">
            <div class="bg-neutral-100 rounded-2xl p-4 mb-4">
              <p class="text-neutral-700 text-sm">👋 Ciao! Sono l'assistente virtuale di IT-ERA.</p>
              <p class="text-neutral-700 text-sm mt-1">Come posso aiutarti oggi?</p>
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div class="space-y-3">
            <a href="tel:+390398882041" class="block w-full bg-danger-500 hover:bg-danger-600 text-white text-center py-4 px-6 rounded-2xl font-semibold transition-colors duration-200 transform hover:scale-105">
              🚨 Emergenza IT - Chiama Ora
            </a>
            <a href="/it-era/contatti.html" class="block w-full bg-brand-500 hover:bg-brand-600 text-white text-center py-4 px-6 rounded-2xl font-semibold transition-colors duration-200 transform hover:scale-105">
              💬 Richiedi Preventivo Gratuito
            </a>
            <a href="/it-era/servizi.html" class="block w-full bg-neutral-600 hover:bg-neutral-700 text-white text-center py-4 px-6 rounded-2xl font-semibold transition-colors duration-200 transform hover:scale-105">
              📋 Scopri Tutti i Servizi
            </a>
          </div>
          
          <!-- Trust Badge -->
          <div class="mt-6 text-center">
            <div class="inline-flex items-center px-4 py-2 bg-success-100 text-success-700 rounded-full text-sm font-medium">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              Risposta garantita in 2 ore
            </div>
          </div>
        </div>
      </div>
    </div>`;

// JavaScript moderno
const MODERN_JAVASCRIPT = `
    <!-- Modern JavaScript -->
    <script>
    // Modern IT-ERA Website Interactions
    document.addEventListener('DOMContentLoaded', function() {
        // Mobile Menu Toggle
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', function() {
                const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
                
                // Toggle menu visibility
                mobileMenu.classList.toggle('hidden');
                
                // Update aria-expanded
                mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
                
                // Toggle icon with smooth animation
                const icon = mobileMenuButton.querySelector('svg');
                if (mobileMenu.classList.contains('hidden')) {
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
                } else {
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
                }
            });
        }
        
        // Modern Chatbot Functionality
        const chatbotButton = document.getElementById('chatbot-button');
        const chatbotPopup = document.getElementById('chatbot-popup');
        const chatbotClose = document.getElementById('chatbot-close');
        
        if (chatbotButton && chatbotPopup) {
            chatbotButton.addEventListener('click', function() {
                const isHidden = chatbotPopup.classList.contains('hidden');
                
                if (isHidden) {
                    chatbotPopup.classList.remove('hidden');
                    setTimeout(() => {
                        chatbotPopup.classList.remove('scale-95', 'opacity-0');
                        chatbotPopup.classList.add('scale-100', 'opacity-100');
                    }, 10);
                } else {
                    chatbotPopup.classList.add('scale-95', 'opacity-0');
                    chatbotPopup.classList.remove('scale-100', 'opacity-100');
                    setTimeout(() => {
                        chatbotPopup.classList.add('hidden');
                    }, 300);
                }
            });
        }
        
        if (chatbotClose && chatbotPopup) {
            chatbotClose.addEventListener('click', function() {
                chatbotPopup.classList.add('scale-95', 'opacity-0');
                chatbotPopup.classList.remove('scale-100', 'opacity-100');
                setTimeout(() => {
                    chatbotPopup.classList.add('hidden');
                }, 300);
            });
        }
        
        // Close chatbot when clicking outside
        document.addEventListener('click', function(event) {
            const chatbotWidget = document.getElementById('chatbot-widget');
            if (chatbotWidget && !chatbotWidget.contains(event.target)) {
                if (chatbotPopup && !chatbotPopup.classList.contains('hidden')) {
                    chatbotPopup.classList.add('scale-95', 'opacity-0');
                    chatbotPopup.classList.remove('scale-100', 'opacity-100');
                    setTimeout(() => {
                        chatbotPopup.classList.add('hidden');
                    }, 300);
                }
            }
        });

        console.log('🎨 IT-ERA Modern Design System loaded successfully!');
    });
    </script>`;

class ModernDesignCompleter {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            completedPages: [],
            errors: [],
            summary: {
                totalPages: PAGES_TO_COMPLETE.length,
                successfulCompletions: 0,
                failedCompletions: 0
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

    // Completa una singola pagina
    completePage(filePath) {
        console.log(`📄 Completing: ${filePath}`);
        
        try {
            let content = this.readFile(filePath);
            let updated = false;

            // 1. Sostituisce footer vecchio con moderno
            const footerRegex = /<footer[\s\S]*?<\/footer>/;
            if (footerRegex.test(content)) {
                content = content.replace(footerRegex, MODERN_FOOTER);
                updated = true;
                console.log('  ✅ Updated footer with modern design');
            }

            // 2. Aggiunge chatbot e JavaScript prima di </body>
            if (content.includes('</body>')) {
                content = content.replace(
                    /\s*<\/body>/,
                    MODERN_CHATBOT + MODERN_JAVASCRIPT + '\n\n</body>'
                );
                updated = true;
                console.log('  ✅ Added modern chatbot and JavaScript');
            }

            if (updated) {
                this.writeFile(filePath, content);
                this.results.completedPages.push({
                    path: filePath,
                    success: true,
                    changes: ['Footer', 'Chatbot', 'JavaScript']
                });
                this.results.summary.successfulCompletions++;
                console.log(`  ✅ Successfully completed ${filePath}`);
            } else {
                console.log(`  ⚠️  No completions needed for ${filePath}`);
            }

        } catch (error) {
            console.log(`  ❌ Failed to complete ${filePath}: ${error.message}`);
            this.results.errors.push({
                path: filePath,
                error: error.message
            });
            this.results.summary.failedCompletions++;
        }
    }

    // Completa tutte le pagine
    completeAllPages() {
        console.log('🎨 COMPLETING MODERN DESIGN FOR ALL PAGES');
        console.log('==========================================\n');

        PAGES_TO_COMPLETE.forEach(pagePath => {
            if (fs.existsSync(pagePath)) {
                this.completePage(pagePath);
            } else {
                console.log(`  ⚠️  File not found: ${pagePath}`);
                this.results.errors.push({
                    path: pagePath,
                    error: 'File not found'
                });
                this.results.summary.failedCompletions++;
            }
            console.log('');
        });

        this.printSummary();
    }

    // Stampa riassunto finale
    printSummary() {
        console.log('🏆 MODERN DESIGN COMPLETION SUMMARY');
        console.log('===================================');
        console.log(`🎯 Total Pages: ${this.results.summary.totalPages}`);
        console.log(`✅ Successful Completions: ${this.results.summary.successfulCompletions}`);
        console.log(`❌ Failed Completions: ${this.results.summary.failedCompletions}`);

        if (this.results.completedPages.length > 0) {
            console.log('\n📄 SUCCESSFULLY COMPLETED PAGES:');
            this.results.completedPages.forEach(page => {
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

        const successRate = Math.round((this.results.summary.successfulCompletions / this.results.summary.totalPages) * 100);
        
        if (successRate >= 90) {
            console.log('\n🎉 EXCELLENT! Modern design completed successfully for all pages.');
        } else if (successRate >= 70) {
            console.log('\n✅ GOOD! Modern design completed for most pages with some issues.');
        } else {
            console.log('\n⚠️  NEEDS ATTENTION! Several pages failed to complete.');
        }

        console.log(`\n🌐 Completion finished at: ${this.results.timestamp}`);
    }
}

// Esegui il completamento del design moderno
const completer = new ModernDesignCompleter();
completer.completeAllPages();
