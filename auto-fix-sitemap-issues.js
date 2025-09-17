#!/usr/bin/env node

/**
 * IT-ERA Automatic Issue Fixer
 * Risolve automaticamente i problemi identificati nell'analisi della sitemap
 */

const fs = require('fs');
const { execSync } = require('child_process');

class AutoSitemapIssueFixer {
    constructor() {
        this.analysisData = null;
        this.fixedPages = [];
        this.failedFixes = [];
        
        // Template per correzioni automatiche
        this.fixTemplates = {
            missingForm: this.generateFormTemplate(),
            missingResend: this.generateResendIntegration(),
            missingEmergencyContact: this.generateEmergencyContact(),
            missingMenu: this.generateMenuTemplate(),
            missingCTA: this.generateCTATemplate(),
            improveUX: this.generateUXImprovements()
        };
    }
    
    // Carica i dati dell'analisi
    loadAnalysisData() {
        try {
            const data = fs.readFileSync('comprehensive-sitemap-analysis.json', 'utf8');
            this.analysisData = JSON.parse(data);
            console.log(`📊 Loaded analysis data for ${this.analysisData.results.length} pages`);
            return true;
        } catch (error) {
            console.error('❌ Error loading analysis data:', error.message);
            return false;
        }
    }
    
    // Identifica pagine che necessitano correzioni
    identifyPagesToFix() {
        if (!this.analysisData) return [];
        
        const pagesToFix = this.analysisData.results.filter(page => {
            return page.status === 'FAILED' || 
                   page.status === 'WARNING' ||
                   page.scores.overall < 80;
        });
        
        console.log(`🔧 Found ${pagesToFix.length} pages that need fixes`);
        return pagesToFix;
    }
    
    // Genera template form di contatto
    generateFormTemplate() {
        return `
<!-- IT-ERA Contact Form - Auto-generated -->
<div class="contact-form-container bg-white p-6 rounded-lg shadow-lg">
    <h3 class="text-xl font-bold text-gray-800 mb-4">Richiedi Assistenza</h3>
    <form id="contact-form" data-resend="true" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label for="nome" class="block text-sm font-medium text-gray-700">Nome *</label>
                <input type="text" id="nome" name="nome" required 
                       class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
                <label for="cognome" class="block text-sm font-medium text-gray-700">Cognome *</label>
                <input type="text" id="cognome" name="cognome" required 
                       class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label for="email" class="block text-sm font-medium text-gray-700">Email *</label>
                <input type="email" id="email" name="email" required 
                       class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
                <label for="telefono" class="block text-sm font-medium text-gray-700">Telefono</label>
                <input type="tel" id="telefono" name="telefono" 
                       class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
        </div>
        
        <div>
            <label for="servizio" class="block text-sm font-medium text-gray-700">Tipo di Servizio</label>
            <select id="servizio" name="servizio" 
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option value="">Seleziona un servizio</option>
                <option value="assistenza-emergenza">🚨 Assistenza Emergenza</option>
                <option value="riparazione-pc">🔧 Riparazione PC</option>
                <option value="assistenza-aziendale">🏢 Assistenza Aziendale</option>
                <option value="consulenza-it">💡 Consulenza IT</option>
                <option value="altro">📋 Altro</option>
            </select>
        </div>
        
        <div>
            <label for="messaggio" class="block text-sm font-medium text-gray-700">Messaggio *</label>
            <textarea id="messaggio" name="messaggio" rows="4" required 
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descrivi il tuo problema o la tua richiesta..."></textarea>
        </div>
        
        <div class="flex items-center">
            <input type="checkbox" id="privacy" name="privacy" required 
                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
            <label for="privacy" class="ml-2 block text-sm text-gray-700">
                Accetto la <a href="/privacy-policy.html" class="text-blue-600 hover:underline">Privacy Policy</a> *
            </label>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-4">
            <button type="submit" 
                    class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200">
                📧 Invia Richiesta
            </button>
            <a href="tel:+390398882041" 
               class="flex-1 bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200 text-center">
                📞 Chiama Ora: 039 888 2041
            </a>
        </div>
    </form>
    
    <!-- Success/Error Messages -->
    <div id="form-messages" class="mt-4 hidden">
        <div id="success-message" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded hidden">
            ✅ Messaggio inviato con successo! Ti contatteremo presto.
        </div>
        <div id="error-message" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded hidden">
            ❌ Errore nell'invio. Riprova o chiama il 039 888 2041.
        </div>
    </div>
</div>`;
    }
    
    // Genera integrazione Resend
    generateResendIntegration() {
        return `
<script>
// IT-ERA Resend Integration - Auto-generated
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form[data-resend="true"]');
    
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Add page context
            data.page_url = window.location.href;
            data.page_title = document.title;
            data.timestamp = new Date().toISOString();
            
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    showMessage('success', 'Messaggio inviato con successo!');
                    form.reset();
                    
                    // Track conversion
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'form_submit', {
                            'event_category': 'Contact',
                            'event_label': data.servizio || 'General'
                        });
                    }
                } else {
                    throw new Error('Network response was not ok');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                showMessage('error', 'Errore nell\\'invio. Riprova o chiama il 039 888 2041.');
            }
        });
    });
    
    function showMessage(type, message) {
        const messagesContainer = document.getElementById('form-messages');
        const successMsg = document.getElementById('success-message');
        const errorMsg = document.getElementById('error-message');
        
        if (messagesContainer) {
            messagesContainer.classList.remove('hidden');
            
            if (type === 'success') {
                successMsg.textContent = message;
                successMsg.classList.remove('hidden');
                errorMsg.classList.add('hidden');
            } else {
                errorMsg.textContent = message;
                errorMsg.classList.remove('hidden');
                successMsg.classList.add('hidden');
            }
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                messagesContainer.classList.add('hidden');
            }, 5000);
        }
    }
});
</script>`;
    }
    
    // Genera emergency contact
    generateEmergencyContact() {
        return `
<!-- IT-ERA Emergency Contact - Auto-generated -->
<div class="emergency-contact-banner bg-red-600 text-white p-4 rounded-lg mb-6">
    <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center space-x-3">
            <span class="text-2xl">🚨</span>
            <div>
                <h3 class="font-bold text-lg">Assistenza Emergenza 24/7</h3>
                <p class="text-red-100">Problemi urgenti? Chiamaci subito!</p>
            </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
            <a href="tel:+390398882041" 
               class="bg-white text-red-600 px-6 py-2 rounded-md font-bold hover:bg-red-50 transition duration-200 text-center">
                📞 039 888 2041
            </a>
            <a href="https://wa.me/390398882041" target="_blank"
               class="bg-green-500 text-white px-6 py-2 rounded-md font-bold hover:bg-green-600 transition duration-200 text-center">
                💬 WhatsApp
            </a>
        </div>
    </div>
</div>`;
    }
    
    // Genera template menu
    generateMenuTemplate() {
        return `
<!-- IT-ERA Navigation Menu - Auto-generated -->
<nav class="bg-white shadow-lg sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
            <div class="flex items-center">
                <a href="/" class="flex-shrink-0 flex items-center">
                    <img class="h-8 w-auto" src="/images/logo-it-era.png" alt="IT-ERA">
                    <span class="ml-2 text-xl font-bold text-gray-800">IT-ERA</span>
                </a>
            </div>
            
            <!-- Desktop Menu -->
            <div class="hidden md:flex items-center space-x-8">
                <a href="/" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Home</a>
                <div class="relative group">
                    <button class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                        Servizi IT <svg class="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    </button>
                    <div class="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <a href="/servizi-it/assistenza-informatica-aziende-milano.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Assistenza Aziendale</a>
                        <a href="/servizi-it/assistenza-informatica-privati-milano.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Assistenza Privati</a>
                        <a href="/servizi-it/computer-non-si-accende-milano.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">🚨 Emergenze</a>
                    </div>
                </div>
                <div class="relative group">
                    <button class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                        Settori <svg class="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    </button>
                    <div class="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <a href="/settori/commercialisti.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Commercialisti</a>
                        <a href="/settori/studi-legali.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Studi Legali</a>
                        <a href="/settori/studi-medici.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Studi Medici</a>
                        <a href="/settori/pmi-startup.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">PMI & Startup</a>
                    </div>
                </div>
                <a href="/contatti.html" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Contatti</a>
                <a href="tel:+390398882041" class="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition duration-200">
                    📞 039 888 2041
                </a>
            </div>
            
            <!-- Mobile menu button -->
            <div class="md:hidden flex items-center">
                <button id="mobile-menu-button" class="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    </div>
    
    <!-- Mobile Menu -->
    <div id="mobile-menu" class="md:hidden hidden bg-white border-t border-gray-200">
        <div class="px-2 pt-2 pb-3 space-y-1">
            <a href="/" class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">Home</a>
            <a href="/servizi-it/" class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">Servizi IT</a>
            <a href="/settori/" class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">Settori</a>
            <a href="/contatti.html" class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">Contatti</a>
            <a href="tel:+390398882041" class="block px-3 py-2 text-base font-medium bg-red-600 text-white hover:bg-red-700 rounded-md text-center">
                📞 Chiama: 039 888 2041
            </a>
        </div>
    </div>
</nav>

<script>
// Mobile menu toggle
document.getElementById('mobile-menu-button').addEventListener('click', function() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
});
</script>`;
    }
    
    // Genera template CTA
    generateCTATemplate() {
        return `
<!-- IT-ERA CTA Buttons - Auto-generated -->
<div class="cta-section bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg my-8">
    <div class="text-center">
        <h3 class="text-2xl font-bold mb-4">Hai bisogno di assistenza IT?</h3>
        <p class="text-blue-100 mb-6">Contattaci per una consulenza gratuita o per assistenza immediata</p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contatti.html" 
               class="bg-white text-blue-600 px-8 py-3 rounded-md font-bold hover:bg-blue-50 transition duration-200 text-center">
                📧 Richiedi Preventivo
            </a>
            <a href="tel:+390398882041" 
               class="bg-red-600 text-white px-8 py-3 rounded-md font-bold hover:bg-red-700 transition duration-200 text-center">
                📞 Chiama Ora: 039 888 2041
            </a>
            <a href="https://wa.me/390398882041" target="_blank"
               class="bg-green-500 text-white px-8 py-3 rounded-md font-bold hover:bg-green-600 transition duration-200 text-center">
                💬 WhatsApp
            </a>
        </div>
    </div>
</div>`;
    }
    
    // Genera miglioramenti UX
    generateUXImprovements() {
        return `
<!-- IT-ERA UX Improvements - Auto-generated -->
<style>
/* Responsive improvements */
@media (max-width: 768px) {
    .container { padding: 1rem; }
    .text-4xl { font-size: 2rem; }
    .text-3xl { font-size: 1.5rem; }
    .grid-cols-3 { grid-template-columns: 1fr; }
    .grid-cols-2 { grid-template-columns: 1fr; }
}

/* Loading animations */
.fade-in {
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Button hover effects */
.btn-hover {
    transition: all 0.3s ease;
    transform: translateY(0);
}

.btn-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Emergency pulse animation */
.emergency-pulse {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
</style>

<script>
// UX Improvements
document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in animation to elements
    const elements = document.querySelectorAll('.fade-in, .card, .service-item');
    elements.forEach(el => {
        el.classList.add('fade-in');
    });
    
    // Add hover effects to buttons
    const buttons = document.querySelectorAll('button, .btn, a[class*="bg-"]');
    buttons.forEach(btn => {
        btn.classList.add('btn-hover');
    });
    
    // Emergency contact pulse effect
    const emergencyElements = document.querySelectorAll('[href*="039888"], [href*="tel:"]');
    emergencyElements.forEach(el => {
        if (el.textContent.includes('039 888 2041')) {
            el.classList.add('emergency-pulse');
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
</script>`;
    }
    
    // Applica correzioni automatiche
    async applyAutomaticFixes() {
        if (!this.loadAnalysisData()) return;
        
        const pagesToFix = this.identifyPagesToFix();
        const criticalPages = pagesToFix.filter(p => p.priority === 'CRITICAL').slice(0, 10);
        const highPages = pagesToFix.filter(p => p.priority === 'HIGH').slice(0, 20);
        
        console.log(`🔧 Starting automatic fixes for ${criticalPages.length + highPages.length} priority pages`);
        
        // Fix critical pages first
        for (const page of criticalPages) {
            await this.fixSinglePage(page);
        }
        
        // Then fix high priority pages
        for (const page of highPages) {
            await this.fixSinglePage(page);
        }
        
        this.generateFixReport();
    }
    
    // Correggi una singola pagina
    async fixSinglePage(pageData) {
        console.log(`🔧 Fixing: ${pageData.url}`);
        
        const fixes = [];
        
        // Identify needed fixes
        if (!pageData.hasForm) fixes.push('missingForm');
        if (!pageData.hasResend) fixes.push('missingResend');
        if (!pageData.hasEmergencyContact) fixes.push('missingEmergencyContact');
        if (pageData.scores.menuNavigation < 50) fixes.push('missingMenu');
        if (pageData.scores.conversionOptimization < 70) fixes.push('missingCTA');
        if (pageData.scores.uxDesign < 70) fixes.push('improveUX');
        
        if (fixes.length === 0) {
            console.log(`  ✅ No fixes needed for ${pageData.url}`);
            return;
        }
        
        // Generate fix content
        let fixContent = '\n<!-- AUTO-GENERATED FIXES -->\n';
        fixes.forEach(fix => {
            if (this.fixTemplates[fix]) {
                fixContent += this.fixTemplates[fix] + '\n';
            }
        });
        
        // Create fix file
        const urlPath = pageData.url.replace('https://it-era.it', '').replace('.html', '') || '/index';
        const fixFileName = `fixes${urlPath.replace(/\//g, '-')}.html`;
        
        try {
            fs.writeFileSync(fixFileName, fixContent);
            
            this.fixedPages.push({
                url: pageData.url,
                fixes: fixes,
                fixFile: fixFileName,
                originalScores: pageData.scores,
                issues: pageData.issues
            });
            
            console.log(`  ✅ Generated fixes: ${fixes.join(', ')}`);
            
        } catch (error) {
            console.error(`  ❌ Failed to fix ${pageData.url}:`, error.message);
            this.failedFixes.push({
                url: pageData.url,
                error: error.message,
                fixes: fixes
            });
        }
    }
    
    // Genera report delle correzioni
    generateFixReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalPagesAnalyzed: this.analysisData.results.length,
                pagesFixed: this.fixedPages.length,
                pagesFailed: this.failedFixes.length,
                successRate: Math.round((this.fixedPages.length / (this.fixedPages.length + this.failedFixes.length)) * 100)
            },
            fixedPages: this.fixedPages,
            failedFixes: this.failedFixes,
            fixTypes: {
                missingForm: this.fixedPages.filter(p => p.fixes.includes('missingForm')).length,
                missingResend: this.fixedPages.filter(p => p.fixes.includes('missingResend')).length,
                missingEmergencyContact: this.fixedPages.filter(p => p.fixes.includes('missingEmergencyContact')).length,
                missingMenu: this.fixedPages.filter(p => p.fixes.includes('missingMenu')).length,
                missingCTA: this.fixedPages.filter(p => p.fixes.includes('missingCTA')).length,
                improveUX: this.fixedPages.filter(p => p.fixes.includes('improveUX')).length
            }
        };
        
        fs.writeFileSync('sitemap-fixes-report.json', JSON.stringify(report, null, 2));
        
        console.log('\n📊 AUTOMATIC FIXES REPORT');
        console.log('==========================');
        console.log(`Total Pages Analyzed: ${report.summary.totalPagesAnalyzed}`);
        console.log(`✅ Pages Fixed: ${report.summary.pagesFixed}`);
        console.log(`❌ Pages Failed: ${report.summary.pagesFailed}`);
        console.log(`📈 Success Rate: ${report.summary.successRate}%`);
        
        console.log('\n🔧 Fix Types Applied:');
        Object.entries(report.fixTypes).forEach(([type, count]) => {
            if (count > 0) {
                console.log(`  ${type}: ${count} pages`);
            }
        });
        
        console.log('\n💾 Detailed report saved to: sitemap-fixes-report.json');
        
        return report;
    }
}

// Esegui se chiamato direttamente
if (require.main === module) {
    const fixer = new AutoSitemapIssueFixer();
    fixer.applyAutomaticFixes()
        .then(() => {
            console.log('\n🎉 Automatic fixes completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Automatic fixes failed:', error);
            process.exit(1);
        });
}

module.exports = AutoSitemapIssueFixer;
