/**
 * IT-ERA Universal Tracking Events
 * Comprehensive analytics tracking for all IT-ERA services
 * 
 * Services: Assistenza IT, Cloud Storage, Sicurezza Informatica
 * Coverage: 1,544+ localized pages across Lombardy
 * 
 * @version 1.0
 * @author IT-ERA Analytics Team
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        debug: false,
        trackingEnabled: true,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        leadScoreWeights: {
            formFields: 10,
            pageViews: 5,
            timeOnSite: 2,
            resourceDownload: 15,
            phoneClick: 25,
            emailClick: 15
        }
    };

    // Core Tracking Class
    class ITERATracker {
        constructor() {
            this.sessionData = this.initSession();
            this.pageData = this.extractPageData();
            this.userJourney = this.loadUserJourney();
            
            this.init();
        }

        init() {
            this.setupEventListeners();
            this.trackPageView();
            this.startSessionMonitoring();
            
            if (CONFIG.debug) {
                console.log('🔍 IT-ERA Tracker initialized', this.pageData);
            }
        }

        // =============================================
        // SESSION & USER MANAGEMENT
        // =============================================

        initSession() {
            const sessionId = this.getOrCreateSessionId();
            const userId = this.getOrCreateUserId();
            
            return {
                sessionId,
                userId,
                startTime: Date.now(),
                pageCount: parseInt(localStorage.getItem('itera_page_count') || '0') + 1,
                events: []
            };
        }

        getOrCreateSessionId() {
            let sessionId = sessionStorage.getItem('itera_session_id');
            if (!sessionId) {
                sessionId = 'itera_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem('itera_session_id', sessionId);
            }
            return sessionId;
        }

        getOrCreateUserId() {
            let userId = localStorage.getItem('itera_user_id');
            if (!userId) {
                userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('itera_user_id', userId);
            }
            return userId;
        }

        // =============================================
        // PAGE DATA EXTRACTION
        // =============================================

        extractPageData() {
            const pathname = window.location.pathname;
            const urlParams = new URLSearchParams(window.location.search);
            
            return {
                url: window.location.href,
                path: pathname,
                title: document.title,
                service: this.extractService(pathname),
                city: this.extractCity(pathname),
                template: this.extractTemplate(pathname),
                region: this.extractRegion(pathname),
                utm: this.extractUTMParams(urlParams),
                source: this.determineSource(),
                referrer: document.referrer,
                timestamp: Date.now()
            };
        }

        extractService(pathname) {
            if (pathname.includes('assistenza-it')) return 'assistenza_it';
            if (pathname.includes('cloud-storage')) return 'cloud_storage';
            if (pathname.includes('sicurezza-informatica')) return 'sicurezza_informatica';
            if (pathname.includes('contatti')) return 'contatti';
            return 'homepage';
        }

        extractCity(pathname) {
            // Extract city from URL patterns like /assistenza-it-milano.html
            const match = pathname.match(/-([\w-]+)\.html$/);
            if (match) {
                return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            return null;
        }

        extractTemplate(pathname) {
            if (pathname.includes('/pages/')) return 'city_service';
            if (pathname.includes('/blog/')) return 'blog';
            if (pathname === '/' || pathname === '/index.html') return 'homepage';
            return 'generic';
        }

        extractRegion(pathname) {
            const cityRegionMap = {
                'milano': 'Milano Metro',
                'monza': 'Monza-Brianza',
                'bergamo': 'Bergamo',
                'como': 'Como-Lecco',
                'lecco': 'Como-Lecco',
                'vimercate': 'Monza-Brianza'
            };

            const city = this.extractCity(pathname);
            if (city) {
                const cityKey = city.toLowerCase().replace(/\s+/g, '-');
                return cityRegionMap[cityKey] || 'Lombardia';
            }
            return 'Lombardia';
        }

        extractUTMParams(urlParams) {
            return {
                source: urlParams.get('utm_source'),
                medium: urlParams.get('utm_medium'),
                campaign: urlParams.get('utm_campaign'),
                content: urlParams.get('utm_content'),
                term: urlParams.get('utm_term')
            };
        }

        determineSource() {
            const urlParams = new URLSearchParams(window.location.search);
            const srcParam = urlParams.get('src');
            
            if (srcParam) return srcParam;
            if (this.pageData?.utm.source) return this.pageData.utm.source;
            
            // Referrer-based detection
            const referrer = document.referrer;
            if (!referrer) return 'direct';
            
            const referrerDomain = new URL(referrer).hostname;
            if (referrerDomain === window.location.hostname) return 'internal';
            if (referrerDomain.includes('google')) return 'organic_google';
            if (referrerDomain.includes('facebook')) return 'social_facebook';
            if (referrerDomain.includes('linkedin')) return 'social_linkedin';
            
            return 'referral_' + referrerDomain;
        }

        // =============================================
        // EVENT LISTENERS SETUP
        // =============================================

        setupEventListeners() {
            this.setupFormTracking();
            this.setupPhoneTracking();
            this.setupEmailTracking();
            this.setupWhatsAppTracking();
            this.setupCTATracking();
            this.setupDownloadTracking();
            this.setupScrollTracking();
            this.setupVideoTracking();
            this.setupChatbotTracking();
        }

        setupFormTracking() {
            // Track all forms on the page
            document.querySelectorAll('form').forEach(form => {
                // Form start tracking
                form.addEventListener('focusin', (e) => {
                    if (e.target.matches('input, textarea, select')) {
                        this.trackFormStart(form);
                    }
                }, { once: true });

                // Form submission tracking
                form.addEventListener('submit', (e) => {
                    this.trackFormSubmit(form, e);
                });

                // Form field interactions
                form.querySelectorAll('input, textarea, select').forEach(field => {
                    field.addEventListener('blur', () => {
                        this.trackFieldComplete(field, form);
                    });
                });
            });
        }

        setupPhoneTracking() {
            document.querySelectorAll('a[href^="tel:"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    this.trackPhoneClick(link, e);
                });
            });
        }

        setupEmailTracking() {
            document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    this.trackEmailClick(link, e);
                });
            });
        }

        setupWhatsAppTracking() {
            document.querySelectorAll('a[href*="whatsapp"], a[href*="wa.me"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    this.trackWhatsAppClick(link, e);
                });
            });
        }

        setupCTATracking() {
            // Track sticky CTAs and prominent buttons
            document.querySelectorAll('.btn-cyber, .btn-primary, .cta-sticky, [class*="cta"]').forEach(button => {
                button.addEventListener('click', (e) => {
                    this.trackCTAClick(button, e);
                });
            });
        }

        setupDownloadTracking() {
            document.querySelectorAll('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a[href*="download"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    this.trackDownload(link, e);
                });
            });
        }

        setupScrollTracking() {
            let maxScroll = 0;
            let scrollMilestones = [25, 50, 75, 90, 100];
            let triggeredMilestones = new Set();

            window.addEventListener('scroll', this.throttle(() => {
                const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
                maxScroll = Math.max(maxScroll, scrollPercent);

                scrollMilestones.forEach(milestone => {
                    if (scrollPercent >= milestone && !triggeredMilestones.has(milestone)) {
                        triggeredMilestones.add(milestone);
                        this.trackScrollDepth(milestone);
                    }
                });
            }, 500));
        }

        setupVideoTracking() {
            document.querySelectorAll('video').forEach(video => {
                video.addEventListener('play', () => this.trackVideoPlay(video));
                video.addEventListener('pause', () => this.trackVideoPause(video));
                video.addEventListener('ended', () => this.trackVideoComplete(video));
            });
        }

        setupChatbotTracking() {
            // Integration with existing chatbot
            if (window.ITERAChatbot) {
                const originalOpen = window.ITERAChatbot.open;
                window.ITERAChatbot.open = () => {
                    this.trackChatbotOpen();
                    originalOpen.call(window.ITERAChatbot);
                };
            }
        }

        // =============================================
        // TRACKING METHODS
        // =============================================

        trackPageView() {
            const pageViewData = {
                ...this.pageData,
                session_id: this.sessionData.sessionId,
                user_id: this.sessionData.userId,
                page_count: this.sessionData.pageCount,
                time_on_previous_page: this.getTimeOnPreviousPage(),
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                viewport_size: `${window.innerWidth}x${window.innerHeight}`,
                language: navigator.language
            };

            this.sendEvent('page_view', pageViewData);

            // Update page count
            localStorage.setItem('itera_page_count', this.sessionData.pageCount.toString());
            localStorage.setItem('itera_last_page_time', Date.now().toString());
        }

        trackFormStart(form) {
            const formData = this.extractFormData(form);
            
            this.sendEvent('form_start', {
                form_id: formData.id,
                form_type: formData.type,
                service: this.pageData.service,
                city: this.pageData.city,
                source: this.pageData.source,
                page_path: this.pageData.path
            });
        }

        trackFormSubmit(form, event) {
            const formData = this.extractFormData(form);
            const leadScore = this.calculateLeadScore(formData);
            
            this.sendEvent('form_submit', {
                form_id: formData.id,
                form_type: formData.type,
                service: this.pageData.service,
                city: this.pageData.city,
                source: this.pageData.source,
                page_path: this.pageData.path,
                fields_completed: formData.completedFields,
                total_fields: formData.totalFields,
                completion_rate: Math.round((formData.completedFields / formData.totalFields) * 100),
                lead_score: leadScore,
                form_data: this.sanitizeFormData(formData.data)
            });

            // Track conversion value
            this.trackConversion('form_submission', leadScore * 10);
        }

        trackPhoneClick(element, event) {
            const phoneNumber = element.href.replace('tel:', '');
            const clickLocation = this.getClickLocation(element);
            const urgencyLevel = this.determineUrgencyLevel(element);

            this.sendEvent('phone_click', {
                phone_number: phoneNumber,
                click_location: clickLocation,
                service_context: this.pageData.service,
                city: this.pageData.city,
                urgency_level: urgencyLevel,
                element_text: element.textContent.trim(),
                source: this.pageData.source
            });

            // High-value conversion
            this.trackConversion('phone_click', 150);
        }

        trackEmailClick(element, event) {
            const emailAddress = element.href.replace('mailto:', '');
            const clickLocation = this.getClickLocation(element);
            const intent = this.determineEmailIntent(element);

            this.sendEvent('email_click', {
                email_address: emailAddress,
                click_location: clickLocation,
                service_context: this.pageData.service,
                city: this.pageData.city,
                intent: intent,
                element_text: element.textContent.trim(),
                source: this.pageData.source
            });

            this.trackConversion('email_click', 75);
        }

        trackWhatsAppClick(element, event) {
            const clickLocation = this.getClickLocation(element);
            const messagePreset = this.extractWhatsAppMessage(element.href);

            this.sendEvent('whatsapp_click', {
                click_location: clickLocation,
                message_preset: messagePreset,
                service_context: this.pageData.service,
                city: this.pageData.city,
                source: this.pageData.source
            });

            this.trackConversion('whatsapp_click', 100);
        }

        trackCTAClick(element, event) {
            const ctaType = this.determineCTAType(element);
            const visibilityTime = this.getElementVisibilityTime(element);

            this.sendEvent('cta_sticky_click', {
                cta_type: ctaType,
                visibility_time: visibilityTime,
                scroll_depth: this.getCurrentScrollDepth(),
                element_text: element.textContent.trim(),
                service_context: this.pageData.service,
                city: this.pageData.city
            });
        }

        trackDownload(element, event) {
            const href = element.href;
            const filename = href.split('/').pop();
            const resourceType = this.determineResourceType(filename);

            this.sendEvent('download_resource', {
                resource_type: resourceType,
                resource_name: filename,
                download_url: href,
                download_source: this.pageData.path,
                service_context: this.pageData.service,
                city: this.pageData.city
            });

            this.trackConversion('resource_download', 25);
        }

        trackScrollDepth(depth) {
            this.sendEvent('scroll_depth', {
                depth_percentage: depth,
                service: this.pageData.service,
                city: this.pageData.city,
                page_path: this.pageData.path,
                time_to_depth: Date.now() - this.sessionData.startTime
            });
        }

        trackVideoPlay(video) {
            this.sendEvent('video_play', {
                video_title: this.getVideoTitle(video),
                video_duration: video.duration || 0,
                play_source: this.pageData.path,
                service_context: this.pageData.service
            });
        }

        trackVideoPause(video) {
            this.sendEvent('video_pause', {
                video_title: this.getVideoTitle(video),
                current_time: video.currentTime,
                completion_percentage: Math.round((video.currentTime / video.duration) * 100)
            });
        }

        trackVideoComplete(video) {
            this.sendEvent('video_complete', {
                video_title: this.getVideoTitle(video),
                video_duration: video.duration,
                service_context: this.pageData.service
            });

            this.trackConversion('video_complete', 10);
        }

        trackChatbotOpen() {
            this.sendEvent('chatbot_open', {
                page_path: this.pageData.path,
                service_context: this.pageData.service,
                city: this.pageData.city,
                time_on_page: Date.now() - this.sessionData.startTime
            });
        }

        // =============================================
        // HELPER METHODS
        // =============================================

        extractFormData(form) {
            const fields = form.querySelectorAll('input, textarea, select');
            const data = {};
            let completedFields = 0;

            fields.forEach(field => {
                if (field.type === 'hidden') return;
                
                const value = field.value.trim();
                data[field.name || field.id || 'unnamed'] = value;
                
                if (value) completedFields++;
            });

            return {
                id: form.id || 'unnamed_form',
                type: this.determineFormType(form),
                data: data,
                completedFields: completedFields,
                totalFields: fields.length - form.querySelectorAll('input[type="hidden"]').length
            };
        }

        determineFormType(form) {
            const formClass = form.className.toLowerCase();
            const formId = (form.id || '').toLowerCase();
            
            if (formClass.includes('contact') || formId.includes('contact')) return 'contact_form';
            if (formClass.includes('quote') || formId.includes('quote')) return 'quote_request';
            if (formClass.includes('emergency') || formId.includes('emergency')) return 'emergency_form';
            if (formClass.includes('newsletter') || formId.includes('newsletter')) return 'newsletter_signup';
            
            return 'generic_form';
        }

        calculateLeadScore(formData) {
            let score = 0;
            
            // Base score for form completion
            score += formData.completedFields * CONFIG.leadScoreWeights.formFields;
            
            // Additional scoring based on specific fields
            const data = formData.data;
            if (data.azienda && data.azienda.length > 2) score += 20; // Company name
            if (data.telefono && data.telefono.length > 5) score += 15; // Phone number
            if (data.dimensione && data.dimensione !== '') score += 10; // Company size
            if (data.settore && data.settore !== '') score += 10; // Industry sector
            if (data.messaggio && data.messaggio.length > 20) score += 15; // Detailed message
            
            // Page context scoring
            if (this.pageData.service === 'sicurezza_informatica') score += 10; // High-value service
            if (this.pageData.city) score += 5; // Geographic targeting
            
            // Session behavior scoring
            score += this.sessionData.pageCount * CONFIG.leadScoreWeights.pageViews;
            score += Math.min((Date.now() - this.sessionData.startTime) / 60000, 10) * CONFIG.leadScoreWeights.timeOnSite;
            
            return Math.min(100, Math.max(0, Math.round(score)));
        }

        sanitizeFormData(data) {
            const sanitized = {};
            
            // Only include non-sensitive data for analytics
            const allowedFields = ['azienda', 'comune', 'dimensione', 'settore', 'priorita', 'servizio_interesse'];
            
            Object.keys(data).forEach(key => {
                if (allowedFields.includes(key) && data[key]) {
                    sanitized[key] = data[key];
                }
            });
            
            return sanitized;
        }

        getClickLocation(element) {
            // Determine where the element is located on the page
            if (element.closest('header, nav')) return 'header';
            if (element.closest('footer')) return 'footer';
            if (element.closest('.hero, .hero-section')) return 'hero';
            if (element.closest('.pricing, .pricing-section')) return 'pricing';
            if (element.closest('.cta-sticky, .sticky')) return 'sticky_cta';
            if (element.closest('aside, .sidebar')) return 'sidebar';
            
            return 'content';
        }

        determineUrgencyLevel(element) {
            const text = element.textContent.toLowerCase();
            const classes = element.className.toLowerCase();
            
            if (text.includes('emergenza') || text.includes('urgente') || 
                classes.includes('emergency') || classes.includes('urgent')) {
                return 'emergency';
            }
            
            return 'normal';
        }

        determineEmailIntent(element) {
            const text = element.textContent.toLowerCase();
            
            if (text.includes('info') || text.includes('informazioni')) return 'info_request';
            if (text.includes('support') || text.includes('assistenza')) return 'support';
            if (text.includes('preventivo') || text.includes('vendite')) return 'sales';
            
            return 'general';
        }

        extractWhatsAppMessage(href) {
            const url = new URL(href);
            const text = url.searchParams.get('text') || '';
            
            if (text.includes('preventivo')) return 'quote_request';
            if (text.includes('assistenza')) return 'support_request';
            if (text.includes('emergenza')) return 'emergency';
            
            return 'general_inquiry';
        }

        determineCTAType(element) {
            const text = element.textContent.toLowerCase();
            const classes = element.className.toLowerCase();
            
            if (text.includes('chiama') || text.includes('telefona')) return 'call_now';
            if (text.includes('preventivo') || text.includes('quote')) return 'get_quote';
            if (text.includes('emergenza') || classes.includes('emergency')) return 'emergency';
            if (text.includes('chat') || classes.includes('chat')) return 'chat';
            
            return 'generic_cta';
        }

        determineResourceType(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            
            switch (ext) {
                case 'pdf':
                    if (filename.includes('whitepaper')) return 'whitepaper';
                    if (filename.includes('case') || filename.includes('studio')) return 'case_study';
                    if (filename.includes('price') || filename.includes('listino')) return 'price_list';
                    if (filename.includes('guida') || filename.includes('guide')) return 'guide';
                    return 'pdf_document';
                
                case 'doc':
                case 'docx':
                    return 'document';
                    
                default:
                    return 'file';
            }
        }

        getVideoTitle(video) {
            return video.title || 
                   video.getAttribute('data-title') || 
                   video.closest('[data-video-title]')?.getAttribute('data-video-title') || 
                   'Untitled Video';
        }

        getCurrentScrollDepth() {
            return Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        }

        getElementVisibilityTime(element) {
            // This would be implemented with Intersection Observer in a real scenario
            // For now, return estimated visibility
            return Date.now() - this.sessionData.startTime;
        }

        getTimeOnPreviousPage() {
            const lastPageTime = localStorage.getItem('itera_last_page_time');
            if (lastPageTime) {
                return Date.now() - parseInt(lastPageTime);
            }
            return 0;
        }

        // =============================================
        // CONVERSION TRACKING
        // =============================================

        trackConversion(type, value) {
            this.sendEvent('conversion', {
                conversion_type: type,
                conversion_value: value,
                service: this.pageData.service,
                city: this.pageData.city,
                source: this.pageData.source,
                session_id: this.sessionData.sessionId,
                user_id: this.sessionData.userId
            });

            // Enhanced ecommerce tracking for GA4
            if (typeof gtag !== 'undefined') {
                gtag('event', 'purchase', {
                    transaction_id: this.sessionData.sessionId + '_' + Date.now(),
                    value: value,
                    currency: 'EUR',
                    items: [{
                        item_id: type,
                        item_name: `${this.pageData.service} - ${type}`,
                        category: this.pageData.service,
                        quantity: 1,
                        price: value
                    }]
                });
            }
        }

        // =============================================
        // USER JOURNEY TRACKING
        // =============================================

        loadUserJourney() {
            const journey = localStorage.getItem('itera_user_journey');
            return journey ? JSON.parse(journey) : {
                first_visit: Date.now(),
                touchpoints: [],
                total_sessions: 0,
                total_pages: 0
            };
        }

        updateUserJourney() {
            this.userJourney.touchpoints.push({
                timestamp: Date.now(),
                page: this.pageData.path,
                service: this.pageData.service,
                city: this.pageData.city,
                source: this.pageData.source,
                session_id: this.sessionData.sessionId
            });

            // Keep only last 50 touchpoints
            if (this.userJourney.touchpoints.length > 50) {
                this.userJourney.touchpoints = this.userJourney.touchpoints.slice(-50);
            }

            this.userJourney.total_pages++;
            localStorage.setItem('itera_user_journey', JSON.stringify(this.userJourney));
        }

        // =============================================
        // DATA LAYER & ANALYTICS INTEGRATION
        // =============================================

        sendEvent(eventName, eventData) {
            if (!CONFIG.trackingEnabled) return;

            const fullEventData = {
                ...eventData,
                event_timestamp: Date.now(),
                page_data: this.pageData,
                session_data: {
                    session_id: this.sessionData.sessionId,
                    user_id: this.sessionData.userId,
                    page_count: this.sessionData.pageCount
                }
            };

            // Store event in session
            this.sessionData.events.push({
                name: eventName,
                data: fullEventData,
                timestamp: Date.now()
            });

            // Send to Google Analytics 4
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, {
                    event_category: this.getEventCategory(eventName),
                    event_label: eventData.service || 'unknown',
                    custom_map: fullEventData,
                    send_to: 'all'
                });
            }

            // Send to dataLayer for GTM
            if (window.dataLayer) {
                window.dataLayer.push({
                    event: 'itera_' + eventName,
                    eventData: fullEventData
                });
            }

            // Send to custom endpoint if configured
            this.sendToCustomEndpoint(eventName, fullEventData);

            if (CONFIG.debug) {
                console.log(`📊 Event: ${eventName}`, fullEventData);
            }

            // Update user journey
            this.updateUserJourney();
        }

        getEventCategory(eventName) {
            const categoryMap = {
                'page_view': 'Navigation',
                'form_submit': 'Lead Generation',
                'form_start': 'Engagement',
                'phone_click': 'Contact',
                'email_click': 'Contact',
                'whatsapp_click': 'Contact',
                'cta_sticky_click': 'Engagement',
                'download_resource': 'Content',
                'scroll_depth': 'Engagement',
                'video_play': 'Content',
                'chatbot_open': 'Engagement',
                'conversion': 'Conversion'
            };
            
            return categoryMap[eventName] || 'Other';
        }

        sendToCustomEndpoint(eventName, eventData) {
            // Send to custom analytics endpoint if configured
            const endpoint = window.ITERA_ANALYTICS_ENDPOINT;
            if (endpoint) {
                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        event: eventName,
                        data: eventData
                    })
                }).catch(error => {
                    if (CONFIG.debug) {
                        console.warn('Failed to send to custom endpoint:', error);
                    }
                });
            }
        }

        // =============================================
        // SESSION MONITORING
        // =============================================

        startSessionMonitoring() {
            // Track session end
            window.addEventListener('beforeunload', () => {
                this.trackSessionEnd();
            });

            // Track page visibility changes
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.trackPageHidden();
                } else {
                    this.trackPageVisible();
                }
            });

            // Periodic session heartbeat
            setInterval(() => {
                this.sendSessionHeartbeat();
            }, 60000); // Every minute
        }

        trackSessionEnd() {
            const sessionDuration = Date.now() - this.sessionData.startTime;
            
            this.sendEvent('session_end', {
                session_duration: sessionDuration,
                pages_viewed: this.sessionData.pageCount,
                events_triggered: this.sessionData.events.length,
                max_scroll_depth: this.getCurrentScrollDepth()
            });
        }

        trackPageHidden() {
            this.pageHiddenTime = Date.now();
        }

        trackPageVisible() {
            if (this.pageHiddenTime) {
                const hiddenDuration = Date.now() - this.pageHiddenTime;
                this.sendEvent('page_focus_regained', {
                    hidden_duration: hiddenDuration
                });
            }
        }

        sendSessionHeartbeat() {
            this.sendEvent('session_heartbeat', {
                time_on_page: Date.now() - this.sessionData.startTime,
                scroll_depth: this.getCurrentScrollDepth(),
                active_time: this.calculateActiveTime()
            });
        }

        calculateActiveTime() {
            // This would track actual user activity (mouse movements, clicks, etc.)
            // For now, return a simple approximation
            return Date.now() - this.sessionData.startTime;
        }

        // =============================================
        // UTILITIES
        // =============================================

        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }

        debounce(func, delay) {
            let timeoutId;
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(context, args), delay);
            };
        }
    }

    // =============================================
    // INITIALIZATION
    // =============================================

    // Initialize tracker when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ITERATracker = new ITERATracker();
        });
    } else {
        window.ITERATracker = new ITERATracker();
    }

    // Global API for external access
    window.ITERAAnalytics = {
        track: (eventName, eventData) => {
            if (window.ITERATracker) {
                window.ITERATracker.sendEvent(eventName, eventData);
            }
        },
        
        updateConfig: (newConfig) => {
            Object.assign(CONFIG, newConfig);
        },
        
        getSession: () => {
            return window.ITERATracker ? window.ITERATracker.sessionData : null;
        },
        
        getPageData: () => {
            return window.ITERATracker ? window.ITERATracker.pageData : null;
        }
    };

})();