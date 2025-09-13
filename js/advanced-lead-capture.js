/**
 * IT-ERA ADVANCED LEAD CAPTURE SYSTEM
 * Progressive profiling, exit intent, and lead magnets
 */

class AdvancedLeadCapture {
    constructor() {
        this.config = {
            exitIntentEnabled: true,
            progressiveProfilingEnabled: true,
            leadMagnetsEnabled: true,
            cookieExpiry: 30, // days
            exitIntentDelay: 3000, // ms
            scrollThreshold: 70 // percentage
        };
        
        this.userProfile = this.loadUserProfile();
        this.sessionData = {
            pageViews: 0,
            timeOnSite: Date.now(),
            interactions: [],
            leadScore: 0
        };
        
        this.leadMagnets = {
            'cybersecurity': {
                title: 'Guida Sicurezza Informatica PMI',
                description: 'Checklist completa per proteggere la tua azienda',
                file: '/downloads/guida-sicurezza-pmi.pdf',
                sectors: ['all']
            },
            'cloud-migration': {
                title: 'Roadmap Migrazione Cloud',
                description: 'Piano step-by-step per migrare al cloud',
                file: '/downloads/roadmap-cloud-migration.pdf',
                sectors: ['pmi', 'commercialisti', 'studi-legali']
            },
            'gdpr-compliance': {
                title: 'Kit Conformità GDPR',
                description: 'Modelli e procedure per la conformità',
                file: '/downloads/kit-gdpr-compliance.pdf',
                sectors: ['commercialisti', 'studi-legali']
            },
            'industria-40': {
                title: 'Guida Industria 4.0',
                description: 'Incentivi e tecnologie per la digitalizzazione',
                file: '/downloads/guida-industria-40.pdf',
                sectors: ['industria', 'pmi']
            }
        };
        
        this.init();
    }

    init() {
        this.trackPageView();
        this.setupEventListeners();
        this.initializeProgressiveProfiling();
        
        if (this.config.exitIntentEnabled) {
            this.setupExitIntent();
        }
        
        if (this.config.leadMagnetsEnabled) {
            this.setupLeadMagnets();
        }
        
        console.log('🎯 Advanced Lead Capture System initialized');
    }

    trackPageView() {
        this.sessionData.pageViews++;
        this.updateLeadScore(5); // Base score for page view
        
        // Track specific page types
        const path = window.location.pathname;
        if (path.includes('/landing/')) {
            this.updateLeadScore(15); // Higher score for landing pages
        }
        if (path.includes('/servizi')) {
            this.updateLeadScore(10); // Interest in services
        }
        
        this.saveSessionData();
    }

    setupEventListeners() {
        // Scroll tracking
        let scrollTracked = false;
        window.addEventListener('scroll', () => {
            if (!scrollTracked) {
                const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
                if (scrollPercent > this.config.scrollThreshold) {
                    this.updateLeadScore(10);
                    this.trackInteraction('deep_scroll');
                    scrollTracked = true;
                }
            }
        });

        // Form interactions
        document.addEventListener('focus', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.updateLeadScore(5);
                this.trackInteraction('form_focus');
            }
        }, true);

        // CTA clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href*="contatti"], button[type="submit"], .cta-button')) {
                this.updateLeadScore(20);
                this.trackInteraction('cta_click');
            }
        });

        // Time on page tracking
        setInterval(() => {
            this.updateLeadScore(1);
        }, 30000); // Every 30 seconds
    }

    setupExitIntent() {
        let exitIntentShown = false;
        
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY <= 0 && !exitIntentShown && this.shouldShowExitIntent()) {
                this.showExitIntentPopup();
                exitIntentShown = true;
            }
        });

        // Mobile exit intent (scroll to top)
        if (this.isMobile()) {
            let lastScrollY = window.scrollY;
            window.addEventListener('scroll', () => {
                if (window.scrollY < lastScrollY && window.scrollY < 100 && !exitIntentShown && this.shouldShowExitIntent()) {
                    this.showExitIntentPopup();
                    exitIntentShown = true;
                }
                lastScrollY = window.scrollY;
            });
        }
    }

    shouldShowExitIntent() {
        // Don't show if already converted
        if (this.userProfile.converted) return false;
        
        // Don't show if recently shown
        const lastShown = localStorage.getItem('exitIntentLastShown');
        if (lastShown && Date.now() - parseInt(lastShown) < 24 * 60 * 60 * 1000) {
            return false;
        }
        
        // Show based on engagement
        return this.sessionData.leadScore > 30 || this.sessionData.pageViews > 2;
    }

    showExitIntentPopup() {
        const sector = this.detectSector();
        const popup = this.createExitIntentPopup(sector);
        document.body.appendChild(popup);
        
        localStorage.setItem('exitIntentLastShown', Date.now().toString());
        this.trackInteraction('exit_intent_shown');
        
        // Track with analytics
        if (typeof trackEvent === 'function') {
            trackEvent('Lead Capture', 'Exit Intent Shown', sector);
        }
    }

    createExitIntentPopup(sector) {
        const popup = document.createElement('div');
        popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 exit-intent-popup';
        
        const offers = {
            'commercialisti': {
                title: 'Aspetta! Offerta Speciale per Commercialisti',
                subtitle: 'Ricevi GRATIS la Guida GDPR + Consulenza Personalizzata',
                cta: 'Scarica Guida GDPR Gratuita',
                leadMagnet: 'gdpr-compliance'
            },
            'studi-legali': {
                title: 'Non Perdere Questa Opportunità!',
                subtitle: 'Audit Sicurezza Gratuito + Kit Conformità GDPR',
                cta: 'Richiedi Audit Gratuito',
                leadMagnet: 'gdpr-compliance'
            },
            'industria': {
                title: 'Incentivi Industria 4.0 in Scadenza!',
                subtitle: 'Guida Completa + Consulenza per Accedere ai Fondi',
                cta: 'Scarica Guida Industria 4.0',
                leadMagnet: 'industria-40'
            },
            'default': {
                title: 'Prima di Andare... Ricevi la Nostra Guida Gratuita!',
                subtitle: 'Checklist Sicurezza Informatica per PMI',
                cta: 'Scarica Guida Gratuita',
                leadMagnet: 'cybersecurity'
            }
        };
        
        const offer = offers[sector] || offers.default;
        
        popup.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-md mx-4 relative animate-bounce-in">
                <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl" onclick="this.closest('.exit-intent-popup').remove()">
                    ×
                </button>
                
                <div class="text-center">
                    <div class="text-4xl mb-4">🎁</div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">${offer.title}</h3>
                    <p class="text-gray-600 mb-6">${offer.subtitle}</p>
                    
                    <form class="space-y-4" onsubmit="window.leadCapture.handleExitIntentForm(event, '${offer.leadMagnet}')">
                        <input type="email" placeholder="La tua email aziendale" required 
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <button type="submit" class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                            ${offer.cta}
                        </button>
                    </form>
                    
                    <p class="text-xs text-gray-500 mt-4">
                        Nessuno spam. Puoi annullare l'iscrizione in qualsiasi momento.
                    </p>
                </div>
            </div>
        `;
        
        return popup;
    }

    handleExitIntentForm(event, leadMagnetId) {
        event.preventDefault();
        const email = event.target.querySelector('input[type="email"]').value;
        
        this.captureEmail(email, leadMagnetId, 'exit_intent');
        
        // Show success message
        const popup = event.target.closest('.exit-intent-popup');
        popup.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-md mx-4 relative">
                <div class="text-center">
                    <div class="text-4xl mb-4">✅</div>
                    <h3 class="text-2xl font-bold text-green-600 mb-4">Perfetto!</h3>
                    <p class="text-gray-600 mb-6">
                        Ti abbiamo inviato la guida via email. Controlla anche la cartella spam.
                    </p>
                    <button onclick="this.closest('.exit-intent-popup').remove()" 
                            class="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors">
                        Chiudi
                    </button>
                </div>
            </div>
        `;
        
        // Auto-close after 3 seconds
        setTimeout(() => {
            popup.remove();
        }, 3000);
    }

    initializeProgressiveProfiling() {
        // Enhance existing forms with progressive profiling
        const forms = document.querySelectorAll('form[id*="contact"], form[id*="consultation"]');
        
        forms.forEach(form => {
            this.enhanceFormWithProgression(form);
        });
    }

    enhanceFormWithProgression(form) {
        const existingFields = form.querySelectorAll('input, select, textarea');
        let currentStep = 1;
        const totalSteps = Math.ceil(existingFields.length / 3);
        
        if (totalSteps <= 1) return; // No need for progression on simple forms
        
        // Create step indicator
        const stepIndicator = document.createElement('div');
        stepIndicator.className = 'progressive-form-steps mb-6';
        stepIndicator.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <span class="text-sm text-gray-600">Passo <span class="step-current">1</span> di ${totalSteps}</span>
                <span class="text-sm text-gray-600"><span class="step-progress">33</span>% completato</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 33%"></div>
            </div>
        `;
        
        form.insertBefore(stepIndicator, form.firstChild);
        
        // Group fields into steps
        this.createFormSteps(form, existingFields, totalSteps);
        
        // Add navigation buttons
        this.addFormNavigation(form, totalSteps);
    }

    createFormSteps(form, fields, totalSteps) {
        const fieldsPerStep = Math.ceil(fields.length / totalSteps);
        
        for (let step = 1; step <= totalSteps; step++) {
            const stepDiv = document.createElement('div');
            stepDiv.className = `form-step ${step === 1 ? 'active' : 'hidden'}`;
            stepDiv.setAttribute('data-step', step);
            
            const startIndex = (step - 1) * fieldsPerStep;
            const endIndex = Math.min(startIndex + fieldsPerStep, fields.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                const fieldContainer = fields[i].closest('.grid > div') || fields[i].parentElement;
                stepDiv.appendChild(fieldContainer);
            }
            
            form.appendChild(stepDiv);
        }
    }

    addFormNavigation(form, totalSteps) {
        const navigation = document.createElement('div');
        navigation.className = 'form-navigation flex justify-between mt-6';
        navigation.innerHTML = `
            <button type="button" class="prev-step bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-400 transition-colors" disabled>
                ← Precedente
            </button>
            <button type="button" class="next-step bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                Successivo →
            </button>
            <button type="submit" class="submit-step bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors hidden">
                Invia Richiesta
            </button>
        `;
        
        form.appendChild(navigation);
        
        // Add event listeners
        this.setupFormNavigation(form, totalSteps);
    }

    setupFormNavigation(form, totalSteps) {
        const prevBtn = form.querySelector('.prev-step');
        const nextBtn = form.querySelector('.next-step');
        const submitBtn = form.querySelector('.submit-step');
        let currentStep = 1;
        
        nextBtn.addEventListener('click', () => {
            if (this.validateCurrentStep(form, currentStep)) {
                currentStep++;
                this.updateFormStep(form, currentStep, totalSteps);
                this.updateLeadScore(10); // Score for form progression
            }
        });
        
        prevBtn.addEventListener('click', () => {
            currentStep--;
            this.updateFormStep(form, currentStep, totalSteps);
        });
    }

    validateCurrentStep(form, step) {
        const currentStepDiv = form.querySelector(`[data-step="${step}"]`);
        const requiredFields = currentStepDiv.querySelectorAll('[required]');
        
        for (let field of requiredFields) {
            if (!field.value.trim()) {
                field.focus();
                field.classList.add('border-red-500');
                return false;
            }
            field.classList.remove('border-red-500');
        }
        
        return true;
    }

    updateFormStep(form, currentStep, totalSteps) {
        // Hide all steps
        form.querySelectorAll('.form-step').forEach(step => {
            step.classList.add('hidden');
            step.classList.remove('active');
        });
        
        // Show current step
        const currentStepDiv = form.querySelector(`[data-step="${currentStep}"]`);
        currentStepDiv.classList.remove('hidden');
        currentStepDiv.classList.add('active');
        
        // Update progress
        const progress = (currentStep / totalSteps) * 100;
        form.querySelector('.step-current').textContent = currentStep;
        form.querySelector('.step-progress').textContent = Math.round(progress);
        form.querySelector('.bg-blue-600').style.width = `${progress}%`;
        
        // Update buttons
        const prevBtn = form.querySelector('.prev-step');
        const nextBtn = form.querySelector('.next-step');
        const submitBtn = form.querySelector('.submit-step');
        
        prevBtn.disabled = currentStep === 1;
        
        if (currentStep === totalSteps) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }
    }

    setupLeadMagnets() {
        // Add lead magnet CTAs to relevant pages
        const sector = this.detectSector();
        const relevantMagnets = Object.entries(this.leadMagnets)
            .filter(([id, magnet]) => magnet.sectors.includes('all') || magnet.sectors.includes(sector));
        
        if (relevantMagnets.length > 0) {
            this.addLeadMagnetWidget(relevantMagnets[0]);
        }
    }

    addLeadMagnetWidget([magnetId, magnet]) {
        // Don't show if already downloaded
        if (this.userProfile.downloadedMagnets.includes(magnetId)) return;
        
        const widget = document.createElement('div');
        widget.className = 'fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm z-40 lead-magnet-widget';
        widget.innerHTML = `
            <div class="flex items-start">
                <div class="text-2xl mr-3">📄</div>
                <div class="flex-1">
                    <h4 class="font-bold text-gray-900 mb-1">${magnet.title}</h4>
                    <p class="text-sm text-gray-600 mb-3">${magnet.description}</p>
                    <button onclick="window.leadCapture.showLeadMagnetForm('${magnetId}')" 
                            class="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 transition-colors w-full">
                        Scarica Gratis
                    </button>
                </div>
                <button onclick="this.closest('.lead-magnet-widget').remove()" 
                        class="text-gray-400 hover:text-gray-600 ml-2">×</button>
            </div>
        `;
        
        document.body.appendChild(widget);
        
        // Auto-show after delay
        setTimeout(() => {
            widget.style.transform = 'translateX(0)';
        }, 5000);
    }

    showLeadMagnetForm(magnetId) {
        const magnet = this.leadMagnets[magnetId];
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-md mx-4 relative">
                <button onclick="this.closest('.fixed').remove()" 
                        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">×</button>
                
                <div class="text-center">
                    <div class="text-4xl mb-4">📄</div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">${magnet.title}</h3>
                    <p class="text-gray-600 mb-6">${magnet.description}</p>
                    
                    <form onsubmit="window.leadCapture.handleLeadMagnetForm(event, '${magnetId}')" class="space-y-4">
                        <input type="email" placeholder="La tua email aziendale" required 
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <input type="text" placeholder="Nome azienda" 
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <button type="submit" class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                            Scarica ${magnet.title}
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    handleLeadMagnetForm(event, magnetId) {
        event.preventDefault();
        const email = event.target.querySelector('input[type="email"]').value;
        const company = event.target.querySelector('input[type="text"]').value;
        
        this.captureEmail(email, magnetId, 'lead_magnet', { company });
        
        // Trigger download
        const magnet = this.leadMagnets[magnetId];
        this.triggerDownload(magnet.file, magnet.title);
        
        // Close modal
        event.target.closest('.fixed').remove();
        
        // Remove widget if present
        const widget = document.querySelector('.lead-magnet-widget');
        if (widget) widget.remove();
    }

    captureEmail(email, source, type, additionalData = {}) {
        const leadData = {
            email,
            source,
            type,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            leadScore: this.sessionData.leadScore,
            sector: this.detectSector(),
            ...additionalData
        };
        
        // Update user profile
        this.userProfile.email = email;
        this.userProfile.leadSources.push(source);
        if (type === 'lead_magnet') {
            this.userProfile.downloadedMagnets.push(source);
        }
        this.saveUserProfile();
        
        // Track with analytics
        if (typeof trackEvent === 'function') {
            trackEvent('Lead Generation', 'Email Captured', `${type}_${source}`);
        }
        
        // Send to backend (in production)
        console.log('Lead captured:', leadData);
        
        this.updateLeadScore(50); // High score for email capture
    }

    triggerDownload(file, filename) {
        const link = document.createElement('a');
        link.href = file;
        link.download = filename;
        link.click();
    }

    detectSector() {
        const path = window.location.pathname;
        const content = document.body.textContent.toLowerCase();
        
        if (path.includes('commercialisti') || content.includes('commercialista')) return 'commercialisti';
        if (path.includes('studi-legali') || content.includes('studio legale')) return 'studi-legali';
        if (path.includes('industria') || content.includes('manifatturiero')) return 'industria';
        if (path.includes('retail') || content.includes('gdo')) return 'retail';
        if (path.includes('pmi') || content.includes('startup')) return 'pmi';
        
        return 'default';
    }

    updateLeadScore(points) {
        this.sessionData.leadScore += points;
        this.saveSessionData();
    }

    trackInteraction(type) {
        this.sessionData.interactions.push({
            type,
            timestamp: Date.now(),
            page: window.location.pathname
        });
        this.saveSessionData();
    }

    loadUserProfile() {
        const stored = localStorage.getItem('userProfile');
        return stored ? JSON.parse(stored) : {
            email: null,
            leadSources: [],
            downloadedMagnets: [],
            converted: false,
            firstVisit: Date.now()
        };
    }

    saveUserProfile() {
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
    }

    saveSessionData() {
        sessionStorage.setItem('sessionData', JSON.stringify(this.sessionData));
    }

    isMobile() {
        return window.innerWidth <= 768;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.leadCapture = new AdvancedLeadCapture();
});

// CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes bounce-in {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
    }
    
    .animate-bounce-in {
        animation: bounce-in 0.6s ease-out;
    }
    
    .lead-magnet-widget {
        transform: translateX(100%);
        transition: transform 0.3s ease-out;
    }
    
    .form-step.hidden {
        display: none;
    }
    
    .form-step.active {
        display: block;
    }
`;
document.head.appendChild(style);
