/**
 * IT-ERA Analytics Tracking
 * Advanced event tracking for user interactions
 */

class ITERAAnalytics {
    constructor() {
        this.isGALoaded = typeof gtag !== 'undefined';
        this.isFBLoaded = typeof fbq !== 'undefined';
        this.isGTMLoaded = typeof dataLayer !== 'undefined';
        
        this.init();
    }

    /**
     * Initialize analytics tracking
     */
    init() {
        console.log('🔍 IT-ERA Analytics initialized');
        
        // Track page load time
        this.trackPageLoadTime();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Track initial page view with enhanced data
        this.trackEnhancedPageView();
    }

    /**
     * Track enhanced page view with custom dimensions
     */
    trackEnhancedPageView() {
        const pageData = this.getPageData();
        
        if (this.isGALoaded) {
            gtag('event', 'page_view', {
                page_title: pageData.title,
                page_location: pageData.url,
                page_referrer: document.referrer,
                city_name: pageData.cityName,
                service_type: pageData.serviceType,
                user_type: this.getUserType()
            });
        }
        
        if (this.isGTMLoaded) {
            dataLayer.push({
                event: 'enhanced_page_view',
                page_data: pageData
            });
        }
    }

    /**
     * Track phone call clicks
     */
    trackPhoneCall(phoneNumber, source = 'unknown') {
        console.log('📞 Phone call tracked:', phoneNumber);
        
        if (this.isGALoaded) {
            gtag('event', 'phone_call', {
                phone_number: phoneNumber,
                source_page: window.location.pathname,
                source_element: source
            });
        }
        
        if (this.isFBLoaded) {
            fbq('track', 'Contact', {
                content_name: 'Phone Call',
                content_category: 'Contact'
            });
        }
        
        if (this.isGTMLoaded) {
            dataLayer.push({
                event: 'phone_call',
                phone_number: phoneNumber,
                source: source
            });
        }
    }

    /**
     * Track WhatsApp clicks
     */
    trackWhatsAppClick(message = '', source = 'floating_button') {
        console.log('💬 WhatsApp click tracked');
        
        if (this.isGALoaded) {
            gtag('event', 'whatsapp_click', {
                source_page: window.location.pathname,
                message_type: message ? 'custom' : 'default',
                source_element: source
            });
        }
        
        if (this.isFBLoaded) {
            fbq('track', 'Contact', {
                content_name: 'WhatsApp',
                content_category: 'Social Contact'
            });
        }
        
        if (this.isGTMLoaded) {
            dataLayer.push({
                event: 'whatsapp_click',
                message: message,
                source: source
            });
        }
    }

    /**
     * Track form submissions
     */
    trackFormSubmission(formName, formData = {}) {
        console.log('📝 Form submission tracked:', formName);
        
        if (this.isGALoaded) {
            gtag('event', 'form_submit', {
                form_name: formName,
                source_page: window.location.pathname,
                city: formData.city || this.getCurrentCity(),
                service_type: formData.service || 'general'
            });
        }
        
        if (this.isFBLoaded) {
            fbq('track', 'Lead', {
                content_name: formName,
                content_category: 'Contact Form'
            });
        }
        
        if (this.isGTMLoaded) {
            dataLayer.push({
                event: 'form_submission',
                form_name: formName,
                form_data: formData
            });
        }
    }

    /**
     * Track service inquiries
     */
    trackServiceInquiry(serviceName, city = '', urgency = 'normal') {
        console.log('🔧 Service inquiry tracked:', serviceName);
        
        if (this.isGALoaded) {
            gtag('event', 'service_inquiry', {
                service_name: serviceName,
                city: city || this.getCurrentCity(),
                urgency_level: urgency,
                source_page: window.location.pathname
            });
        }
        
        if (this.isFBLoaded) {
            fbq('track', 'InitiateCheckout', {
                content_name: serviceName,
                content_category: 'IT Service'
            });
        }
        
        if (this.isGTMLoaded) {
            dataLayer.push({
                event: 'service_inquiry',
                service: serviceName,
                city: city,
                urgency: urgency
            });
        }
    }

    /**
     * Track scroll depth
     */
    trackScrollDepth() {
        let maxScroll = 0;
        const milestones = [25, 50, 75, 90, 100];
        const tracked = new Set();
        
        const trackScroll = () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                milestones.forEach(milestone => {
                    if (scrollPercent >= milestone && !tracked.has(milestone)) {
                        tracked.add(milestone);
                        
                        if (this.isGALoaded) {
                            gtag('event', 'scroll', {
                                scroll_depth: milestone,
                                page_location: window.location.pathname
                            });
                        }
                        
                        if (this.isGTMLoaded) {
                            dataLayer.push({
                                event: 'scroll_depth',
                                scroll_percentage: milestone
                            });
                        }
                    }
                });
            }
        };
        
        window.addEventListener('scroll', trackScroll, { passive: true });
    }

    /**
     * Track page load time
     */
    trackPageLoadTime() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                
                if (this.isGALoaded) {
                    gtag('event', 'timing_complete', {
                        name: 'load',
                        value: loadTime
                    });
                }
                
                if (this.isGTMLoaded) {
                    dataLayer.push({
                        event: 'page_load_time',
                        load_time: loadTime
                    });
                }
                
                console.log('⚡ Page load time:', loadTime + 'ms');
            }, 0);
        });
    }

    /**
     * Set up event listeners for automatic tracking
     */
    setupEventListeners() {
        // Track phone number clicks
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a[href^="tel:"]');
            if (target) {
                const phoneNumber = target.href.replace('tel:', '');
                this.trackPhoneCall(phoneNumber, 'link_click');
            }
        });
        
        // Track WhatsApp clicks
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a[href*="wa.me"], a[href*="whatsapp.com"]');
            if (target) {
                this.trackWhatsAppClick('', 'link_click');
            }
        });
        
        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                const formName = form.name || form.id || 'unnamed_form';
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                this.trackFormSubmission(formName, data);
            }
        });
        
        // Track scroll depth
        this.trackScrollDepth();
    }

    /**
     * Get current page data
     */
    getPageData() {
        const path = window.location.pathname;
        const cityMatch = path.match(/assistenza-it-([a-z]+)/);
        const serviceMatch = path.match(/([a-z-]+)-[a-z]+$/);
        
        return {
            title: document.title,
            url: window.location.href,
            path: path,
            cityName: cityMatch ? cityMatch[1] : null,
            serviceType: serviceMatch ? serviceMatch[1] : this.getServiceFromPath(path)
        };
    }

    /**
     * Get service type from path
     */
    getServiceFromPath(path) {
        if (path.includes('/servizi')) return 'services_page';
        if (path.includes('/contatti')) return 'contact_page';
        if (path.includes('/assistenza-it-')) return 'city_page';
        if (path === '/') return 'homepage';
        return 'other';
    }

    /**
     * Get current city from URL
     */
    getCurrentCity() {
        const cityMatch = window.location.pathname.match(/assistenza-it-([a-z]+)/);
        return cityMatch ? cityMatch[1] : '';
    }

    /**
     * Determine user type based on behavior
     */
    getUserType() {
        // Simple heuristic - can be enhanced
        const referrer = document.referrer;
        if (referrer.includes('google.com')) return 'search_user';
        if (referrer.includes('facebook.com')) return 'social_user';
        if (referrer === '') return 'direct_user';
        return 'referral_user';
    }
}

// Initialize analytics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.iteraAnalytics = new ITERAAnalytics();
});

// Export for manual tracking
window.trackPhoneCall = (phone, source) => window.iteraAnalytics?.trackPhoneCall(phone, source);
window.trackWhatsApp = (message, source) => window.iteraAnalytics?.trackWhatsAppClick(message, source);
window.trackServiceInquiry = (service, city, urgency) => window.iteraAnalytics?.trackServiceInquiry(service, city, urgency);
