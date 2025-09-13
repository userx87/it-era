/**
 * IT-ERA ADVANCED ANALYTICS SYSTEM
 * Comprehensive tracking, A/B testing, and conversion optimization
 */

class AdvancedAnalytics {
    constructor() {
        this.config = {
            ga4MeasurementId: 'G-XXXXXXXXXX', // Replace with actual GA4 ID
            gtmId: 'GTM-XXXXXXX', // Replace with actual GTM ID
            hotjarId: 'XXXXXXX', // Replace with actual Hotjar ID
            enableHeatmaps: true,
            enableRecordings: true,
            enableABTesting: true,
            conversionGoals: {
                'contact_form': { value: 50, currency: 'EUR' },
                'phone_call': { value: 75, currency: 'EUR' },
                'demo_request': { value: 100, currency: 'EUR' },
                'consultation_booking': { value: 150, currency: 'EUR' },
                'lead_magnet_download': { value: 25, currency: 'EUR' }
            }
        };
        
        this.sessionData = {
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: 0,
            events: [],
            conversions: [],
            abTestVariants: {}
        };
        
        this.userProfile = this.loadUserProfile();
        this.init();
    }

    init() {
        this.initializeGA4();
        this.initializeGTM();
        this.initializeHotjar();
        this.setupEventTracking();
        this.setupConversionTracking();
        this.setupABTesting();
        this.trackPageView();
        
        console.log('📊 Advanced Analytics System initialized');
    }

    initializeGA4() {
        // Load GA4 script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.ga4MeasurementId}`;
        document.head.appendChild(script);
        
        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        
        gtag('js', new Date());
        gtag('config', this.config.ga4MeasurementId, {
            // Enhanced ecommerce and user engagement
            send_page_view: false, // We'll send manually
            custom_map: {
                'custom_parameter_1': 'lead_score',
                'custom_parameter_2': 'user_segment',
                'custom_parameter_3': 'page_category'
            }
        });
        
        // Set user properties
        gtag('config', this.config.ga4MeasurementId, {
            user_properties: {
                user_segment: this.getUserSegment(),
                first_visit_date: this.userProfile.firstVisit,
                total_sessions: this.userProfile.totalSessions
            }
        });
    }

    initializeGTM() {
        // Load Google Tag Manager
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer',this.config.gtmId);
        
        // Add GTM noscript fallback
        const noscript = document.createElement('noscript');
        noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${this.config.gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
        document.body.insertBefore(noscript, document.body.firstChild);
    }

    initializeHotjar() {
        if (!this.config.enableHeatmaps) return;
        
        // Load Hotjar
        (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:this.config.hotjarId,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    }

    setupEventTracking() {
        // Form interactions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const formId = form.id || form.className || 'unknown_form';
            
            this.trackEvent('form_submit', {
                form_id: formId,
                form_location: window.location.pathname,
                user_segment: this.getUserSegment()
            });
            
            // Track as conversion if it's a lead form
            if (this.isLeadForm(form)) {
                this.trackConversion('contact_form', {
                    form_id: formId,
                    source: this.getTrafficSource()
                });
            }
        });

        // CTA clicks
        document.addEventListener('click', (e) => {
            const element = e.target.closest('a, button');
            if (!element) return;
            
            const href = element.href || '';
            const text = element.textContent.trim();
            const classes = element.className;
            
            // Track phone calls
            if (href.startsWith('tel:')) {
                this.trackEvent('phone_call_click', {
                    phone_number: href.replace('tel:', ''),
                    button_text: text,
                    page_location: window.location.pathname
                });
                
                this.trackConversion('phone_call', {
                    source: this.getTrafficSource(),
                    button_location: this.getElementLocation(element)
                });
            }
            
            // Track email clicks
            if (href.startsWith('mailto:')) {
                this.trackEvent('email_click', {
                    email: href.replace('mailto:', ''),
                    button_text: text
                });
            }
            
            // Track CTA buttons
            if (classes.includes('cta') || classes.includes('btn-primary') || text.toLowerCase().includes('contatt')) {
                this.trackEvent('cta_click', {
                    button_text: text,
                    button_location: this.getElementLocation(element),
                    destination: href
                });
            }
            
            // Track landing page CTAs
            if (window.location.pathname.includes('/landing/')) {
                this.trackEvent('landing_page_cta', {
                    landing_page: window.location.pathname,
                    cta_text: text,
                    cta_type: this.getCTAType(element)
                });
            }
        });

        // Scroll depth tracking
        this.setupScrollTracking();
        
        // Time on page tracking
        this.setupTimeTracking();
        
        // File downloads
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                const href = link.href;
                const fileExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip'];
                
                if (fileExtensions.some(ext => href.toLowerCase().includes(ext))) {
                    this.trackEvent('file_download', {
                        file_url: href,
                        file_name: href.split('/').pop(),
                        download_source: window.location.pathname
                    });
                    
                    this.trackConversion('lead_magnet_download', {
                        file_name: href.split('/').pop(),
                        source: this.getTrafficSource()
                    });
                }
            }
        });
    }

    setupScrollTracking() {
        let scrollDepths = [25, 50, 75, 90];
        let trackedDepths = [];
        
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            scrollDepths.forEach(depth => {
                if (scrollPercent >= depth && !trackedDepths.includes(depth)) {
                    trackedDepths.push(depth);
                    this.trackEvent('scroll_depth', {
                        scroll_depth: depth,
                        page_location: window.location.pathname
                    });
                }
            });
        });
    }

    setupTimeTracking() {
        const timeThresholds = [30, 60, 120, 300]; // seconds
        let trackedTimes = [];
        
        timeThresholds.forEach(threshold => {
            setTimeout(() => {
                if (!trackedTimes.includes(threshold)) {
                    trackedTimes.push(threshold);
                    this.trackEvent('time_on_page', {
                        time_threshold: threshold,
                        page_location: window.location.pathname,
                        user_segment: this.getUserSegment()
                    });
                }
            }, threshold * 1000);
        });
    }

    setupConversionTracking() {
        // Enhanced ecommerce for GA4
        this.trackEvent('page_view', {
            page_title: document.title,
            page_location: window.location.href,
            page_category: this.getPageCategory(),
            user_segment: this.getUserSegment()
        });
    }

    setupABTesting() {
        if (!this.config.enableABTesting) return;
        
        const tests = {
            'hero_cta_text': {
                variants: ['Richiedi Preventivo', 'Contattaci Ora', 'Inizia Subito'],
                selector: '.hero-cta',
                metric: 'cta_click'
            },
            'pricing_display': {
                variants: ['show_prices', 'hide_prices'],
                selector: '.pricing-section',
                metric: 'contact_form'
            },
            'testimonial_position': {
                variants: ['top', 'bottom', 'sidebar'],
                selector: '.testimonials',
                metric: 'time_on_page'
            }
        };
        
        Object.entries(tests).forEach(([testName, config]) => {
            this.runABTest(testName, config);
        });
    }

    runABTest(testName, config) {
        // Check if user already has a variant assigned
        let variant = this.sessionData.abTestVariants[testName];
        
        if (!variant) {
            // Assign random variant
            variant = config.variants[Math.floor(Math.random() * config.variants.length)];
            this.sessionData.abTestVariants[testName] = variant;
            this.saveSessionData();
        }
        
        // Apply variant
        this.applyABTestVariant(testName, variant, config);
        
        // Track variant assignment
        this.trackEvent('ab_test_variant', {
            test_name: testName,
            variant: variant,
            user_segment: this.getUserSegment()
        });
    }

    applyABTestVariant(testName, variant, config) {
        const elements = document.querySelectorAll(config.selector);
        
        switch(testName) {
            case 'hero_cta_text':
                elements.forEach(el => {
                    if (el.textContent.includes('Contatt') || el.textContent.includes('Richiedi')) {
                        el.textContent = variant;
                    }
                });
                break;
                
            case 'pricing_display':
                elements.forEach(el => {
                    if (variant === 'hide_prices') {
                        const priceElements = el.querySelectorAll('.price, .pricing');
                        priceElements.forEach(price => price.style.display = 'none');
                    }
                });
                break;
                
            case 'testimonial_position':
                elements.forEach(el => {
                    el.classList.add(`testimonials-${variant}`);
                });
                break;
        }
    }

    trackEvent(eventName, parameters = {}) {
        // Add common parameters
        const eventData = {
            ...parameters,
            session_id: this.sessionData.sessionId,
            timestamp: Date.now(),
            user_id: this.userProfile.userId,
            page_referrer: document.referrer,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`
        };
        
        // Track with GA4
        if (window.gtag) {
            gtag('event', eventName, eventData);
        }
        
        // Track with GTM
        if (window.dataLayer) {
            window.dataLayer.push({
                event: eventName,
                ...eventData
            });
        }
        
        // Store in session
        this.sessionData.events.push({
            event: eventName,
            data: eventData,
            timestamp: Date.now()
        });
        
        this.saveSessionData();
        
        console.log('📊 Event tracked:', eventName, eventData);
    }

    trackConversion(conversionType, parameters = {}) {
        const conversionData = {
            conversion_type: conversionType,
            conversion_value: this.config.conversionGoals[conversionType]?.value || 0,
            currency: this.config.conversionGoals[conversionType]?.currency || 'EUR',
            ...parameters,
            timestamp: Date.now()
        };
        
        // Track with GA4 as conversion
        if (window.gtag) {
            gtag('event', 'conversion', {
                send_to: this.config.ga4MeasurementId,
                value: conversionData.conversion_value,
                currency: conversionData.currency,
                ...conversionData
            });
        }
        
        // Store conversion
        this.sessionData.conversions.push(conversionData);
        this.userProfile.totalConversions++;
        this.userProfile.conversionHistory.push(conversionData);
        
        this.saveUserProfile();
        this.saveSessionData();
        
        console.log('🎯 Conversion tracked:', conversionType, conversionData);
    }

    trackPageView() {
        this.sessionData.pageViews++;
        this.userProfile.totalPageViews++;
        
        const pageData = {
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname,
            page_category: this.getPageCategory(),
            user_segment: this.getUserSegment(),
            session_number: this.userProfile.totalSessions,
            page_view_number: this.sessionData.pageViews
        };
        
        // Send to GA4
        if (window.gtag) {
            gtag('event', 'page_view', pageData);
        }
        
        this.saveUserProfile();
        this.saveSessionData();
    }

    // Utility methods
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getUserSegment() {
        const path = window.location.pathname;
        if (path.includes('commercialisti')) return 'commercialisti';
        if (path.includes('studi-legali')) return 'studi_legali';
        if (path.includes('industria')) return 'industria';
        if (path.includes('retail')) return 'retail';
        if (path.includes('pmi')) return 'pmi';
        return 'general';
    }

    getPageCategory() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'homepage';
        if (path.includes('/servizi')) return 'services';
        if (path.includes('/landing/')) return 'landing_page';
        if (path.includes('/blog/')) return 'blog';
        if (path.includes('/contatti')) return 'contact';
        if (path.includes('/settori/')) return 'sector_page';
        return 'other';
    }

    getTrafficSource() {
        const referrer = document.referrer;
        const utm_source = new URLSearchParams(window.location.search).get('utm_source');
        
        if (utm_source) return utm_source;
        if (referrer.includes('google')) return 'google';
        if (referrer.includes('facebook')) return 'facebook';
        if (referrer.includes('linkedin')) return 'linkedin';
        if (referrer === '') return 'direct';
        return 'referral';
    }

    isLeadForm(form) {
        const formId = form.id.toLowerCase();
        const formClass = form.className.toLowerCase();
        
        return formId.includes('contact') || 
               formId.includes('consultation') || 
               formId.includes('demo') || 
               formClass.includes('lead-form');
    }

    getElementLocation(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            section: this.getPageSection(element)
        };
    }

    getPageSection(element) {
        const sections = ['header', 'hero', 'services', 'testimonials', 'footer'];
        
        for (let section of sections) {
            if (element.closest(`.${section}`) || element.closest(`#${section}`)) {
                return section;
            }
        }
        
        return 'unknown';
    }

    getCTAType(element) {
        const text = element.textContent.toLowerCase();
        const href = element.href || '';
        
        if (href.startsWith('tel:')) return 'phone';
        if (href.startsWith('mailto:')) return 'email';
        if (text.includes('demo')) return 'demo';
        if (text.includes('preventivo')) return 'quote';
        if (text.includes('contatt')) return 'contact';
        if (text.includes('scarica')) return 'download';
        
        return 'other';
    }

    loadUserProfile() {
        const stored = localStorage.getItem('userAnalyticsProfile');
        if (stored) {
            return JSON.parse(stored);
        }
        
        return {
            userId: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            firstVisit: Date.now(),
            totalSessions: 1,
            totalPageViews: 0,
            totalConversions: 0,
            conversionHistory: [],
            lastVisit: Date.now()
        };
    }

    saveUserProfile() {
        this.userProfile.lastVisit = Date.now();
        localStorage.setItem('userAnalyticsProfile', JSON.stringify(this.userProfile));
    }

    saveSessionData() {
        sessionStorage.setItem('sessionAnalyticsData', JSON.stringify(this.sessionData));
    }

    // Public API for manual tracking
    track(eventName, parameters = {}) {
        this.trackEvent(eventName, parameters);
    }

    conversion(type, parameters = {}) {
        this.trackConversion(type, parameters);
    }

    identify(userId, properties = {}) {
        this.userProfile.userId = userId;
        this.userProfile.properties = { ...this.userProfile.properties, ...properties };
        this.saveUserProfile();
        
        if (window.gtag) {
            gtag('config', this.config.ga4MeasurementId, {
                user_id: userId,
                user_properties: properties
            });
        }
    }
}

// Initialize analytics when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.analytics = new AdvancedAnalytics();
    
    // Global tracking functions for easy use
    window.trackEvent = function(eventName, parameters) {
        if (window.analytics) {
            window.analytics.track(eventName, parameters);
        }
    };
    
    window.trackConversion = function(type, parameters) {
        if (window.analytics) {
            window.analytics.conversion(type, parameters);
        }
    };
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedAnalytics;
}
