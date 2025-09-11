/**
 * IT-ERA Main JavaScript
 * Enhanced user experience with modern interactions
 */

class ITERAApp {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
    }

    onDOMReady() {
        console.log('🚀 IT-ERA App initialized');

        // Initialize components
        this.initHeader();
        this.initNavigation();
        this.initScrollEffects();
        this.initForms();
        this.initClaudeFlowIntegration();
        this.initAnalytics();

        // Initialize page-specific functionality
        this.initPageSpecific();

        console.log('✅ All components initialized');
    }

    initHeader() {
        const header = document.querySelector('.itera-header');
        if (!header) return;

        // Sticky header with scroll effect
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > 100) {
                header.classList.add('is-scrolled');
            } else {
                header.classList.remove('is-scrolled');
            }

            // Hide header on scroll down, show on scroll up
            if (currentScrollY > lastScrollY && currentScrollY > 200) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }

            lastScrollY = currentScrollY;
        };

        // Throttle scroll events
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    initNavigation() {
        // Mobile menu toggle
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const headerNav = document.querySelector('.header-nav');

        if (mobileToggle && headerNav) {
            mobileToggle.addEventListener('click', () => {
                const isOpen = mobileToggle.getAttribute('aria-expanded') === 'true';

                mobileToggle.setAttribute('aria-expanded', !isOpen);
                headerNav.classList.toggle('is-open');

                // Prevent body scroll when menu is open
                document.body.style.overflow = isOpen ? '' : 'hidden';
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!headerNav.contains(e.target) && !mobileToggle.contains(e.target)) {
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    headerNav.classList.remove('is-open');
                    document.body.style.overflow = '';
                }
            });

            // Close mobile menu on window resize
            window.addEventListener('resize', () => {
                if (window.innerWidth >= 992) {
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    headerNav.classList.remove('is-open');
                    document.body.style.overflow = '';
                }
            });
        }

        // Active navigation highlighting
        this.highlightActiveNavigation();

        // Smooth scrolling for anchor links
        this.initSmoothScrolling();
    }

    highlightActiveNavigation() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (currentPath === href || currentPath.endsWith(href))) {
                link.classList.add('active');
            }
        });
    }

    initSmoothScrolling() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');

        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    e.preventDefault();

                    const headerHeight = document.querySelector('.itera-header')?.offsetHeight || 0;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    initScrollEffects() {
        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animateElements = document.querySelectorAll('.service-card, .hero-section, .contact-item');
        animateElements.forEach(el => {
            el.classList.add('animate-on-scroll');
            observer.observe(el);
        });

        // Add CSS for animations
        this.addScrollAnimationCSS();
    }

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', this.smoothScroll);
        });

        // Phone number click tracking
        document.querySelectorAll('a[href^="tel:"]').forEach(tel => {
            tel.addEventListener('click', () => {
                console.log('📞 Phone call initiated:', tel.href);
            });
        });
    }

    initializeComponents() {
        // Initialize any interactive components
        this.initDropdowns();
        this.initAnimations();
    }

    toggleMobileMenu(e) {
        e.preventDefault();
        const nav = document.querySelector('.nav');
        nav.classList.toggle('nav-open');
    }

    smoothScroll(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    initDropdowns() {
        document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
            dropdown.addEventListener('mouseenter', () => {
                dropdown.classList.add('dropdown-open');
            });
            
            dropdown.addEventListener('mouseleave', () => {
                dropdown.classList.remove('dropdown-open');
            });
        });
    }

    initAnimations() {
        // Intersection Observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        });

        document.querySelectorAll('.service-card, .city-card').forEach(el => {
            observer.observe(el);
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ITERAApp();
});

// Development utilities
if (window.location.hostname === 'localhost') {
    console.log('🔧 Development mode active');
    
    // Add development helpers
    window.ITERA_DEV = {
        reload: () => fetch('/dev/reload').then(r => r.json()).then(console.log),
        info: () => fetch('/dev/info').then(r => r.json()).then(console.log),
        health: () => fetch('/health').then(r => r.json()).then(console.log)
    };
    
    console.log('Available dev commands: ITERA_DEV.reload(), ITERA_DEV.info(), ITERA_DEV.health()');
}