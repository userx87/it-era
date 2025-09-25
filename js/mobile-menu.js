/**
 * =======================================================
 * MOBILE MENU FUNCTIONALITY - IT-ERA
 * Advanced mobile navigation with accessibility support
 * =======================================================
 */

class ITERAMobileMenu {
    constructor() {
        this.isInitialized = false;
        this.toggleButton = null;
        this.mobileNav = null;
        this.overlay = null;
        this.isOpen = false;
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.init();
    }

    init() {
        if (this.isInitialized) return;

        document.addEventListener('DOMContentLoaded', () => {
            this.createMobileMenuStructure();
            this.bindEvents();
            this.handleResize();
            this.isInitialized = true;

            console.log('✅ IT-ERA Mobile Menu initialized successfully');
        });
    }

    createMobileMenuStructure() {
        // Create mobile menu toggle button
        this.createToggleButton();

        // Create mobile navigation panel
        this.createMobileNavPanel();

        // Create overlay
        this.createOverlay();

        // Inject mobile menu CSS if not already loaded
        this.injectCSS();
    }

    createToggleButton() {
        // Check if already exists
        if (document.querySelector('.mobile-menu-toggle')) return;

        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'mobile-menu-toggle';
        this.toggleButton.innerHTML = '☰';
        this.toggleButton.setAttribute('aria-label', 'Apri menu di navigazione');
        this.toggleButton.setAttribute('aria-expanded', 'false');
        this.toggleButton.setAttribute('type', 'button');

        // Add to body
        document.body.appendChild(this.toggleButton);
    }

    createMobileNavPanel() {
        // Check if already exists
        if (document.querySelector('.mobile-nav')) return;

        this.mobileNav = document.createElement('nav');
        this.mobileNav.className = 'mobile-nav';
        this.mobileNav.setAttribute('aria-label', 'Menu di navigazione mobile');

        // Create navigation content
        const navContent = this.generateNavContent();
        this.mobileNav.innerHTML = navContent;

        // Add to body
        document.body.appendChild(this.mobileNav);
    }

    generateNavContent() {
        return `
            <div class="nav-menu" role="menu">
                <div class="nav-item" role="none">
                    <a href="/" class="nav-link" role="menuitem">
                        <span>🏠 Home</span>
                        <span>→</span>
                    </a>
                </div>
                <div class="nav-item" role="none">
                    <a href="#" class="nav-link nav-toggle" role="menuitem" data-submenu="servizi">
                        <span>🔧 Servizi IT</span>
                        <span>↓</span>
                    </a>
                    <div class="submenu" id="servizi-submenu">
                        <a href="/servizi-it/assistenza-informatica-aziende-milano.html" class="nav-link" role="menuitem">
                            💼 Assistenza Aziendale
                        </a>
                        <a href="/servizi-it/assistenza-informatica-privati-milano.html" class="nav-link" role="menuitem">
                            🏠 Assistenza Privati
                        </a>
                        <a href="/servizi-it/computer-non-si-accende-milano.html" class="nav-link" role="menuitem">
                            🚨 Emergenze IT
                        </a>
                        <a href="/servizi-it/sicurezza-informatica-consulenza-milano.html" class="nav-link" role="menuitem">
                            🔒 Sicurezza Informatica
                        </a>
                    </div>
                </div>
                <div class="nav-item" role="none">
                    <a href="#" class="nav-link nav-toggle" role="menuitem" data-submenu="settori">
                        <span>🏢 Settori</span>
                        <span>↓</span>
                    </a>
                    <div class="submenu" id="settori-submenu">
                        <a href="/settori/commercialisti.html" class="nav-link" role="menuitem">
                            📊 Commercialisti
                        </a>
                        <a href="/settori/studi-legali.html" class="nav-link" role="menuitem">
                            ⚖️ Studi Legali
                        </a>
                        <a href="/settori/studi-medici/" class="nav-link" role="menuitem">
                            🏥 Studi Medici
                        </a>
                        <a href="/settori/pmi-startup.html" class="nav-link" role="menuitem">
                            🚀 PMI & Startup
                        </a>
                        <a href="/settori/retail-gdo.html" class="nav-link" role="menuitem">
                            🛒 Retail & GDO
                        </a>
                    </div>
                </div>
                <div class="nav-item" role="none">
                    <a href="/contatti.html" class="nav-link" role="menuitem">
                        <span>📞 Contatti</span>
                        <span>→</span>
                    </a>
                </div>
                <div class="nav-item" role="none">
                    <a href="/risorse/faq/" class="nav-link" role="menuitem">
                        <span>❓ FAQ</span>
                        <span>→</span>
                    </a>
                </div>
            </div>
            <a href="tel:+390398882041" class="emergency-call" role="button">
                📞 EMERGENZA: 039 888 2041
            </a>
        `;
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'mobile-nav-overlay';
        document.body.appendChild(this.overlay);
    }

    bindEvents() {
        if (!this.toggleButton || !this.mobileNav) return;

        // Toggle button click
        this.toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMenu();
        });

        // Overlay click to close
        this.overlay?.addEventListener('click', () => {
            this.closeMenu();
        });

        // Submenu toggles
        const submenuToggles = this.mobileNav.querySelectorAll('.nav-toggle');
        submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSubmenu(toggle);
            });
        });

        // Keyboard navigation
        this.mobileNav.addEventListener('keydown', (e) => {
            this.handleKeyNavigation(e);
        });

        // Touch gestures
        this.mobileNav.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        });

        this.mobileNav.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e);
        });

        // Resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Close menu on navigation
        const navLinks = this.mobileNav.querySelectorAll('a[href]:not(.nav-toggle)');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Close menu after a short delay to allow navigation
                setTimeout(() => this.closeMenu(), 100);
            });
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.isOpen = true;
        this.mobileNav.classList.add('active');
        this.overlay.classList.add('active');
        this.toggleButton.innerHTML = '✕';
        this.toggleButton.setAttribute('aria-expanded', 'true');
        this.toggleButton.setAttribute('aria-label', 'Chiudi menu di navigazione');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Focus management
        const firstFocusable = this.mobileNav.querySelector('a, button');
        if (firstFocusable) {
            firstFocusable.focus();
        }

        // Analytics tracking
        this.trackEvent('mobile_menu_opened');
    }

    closeMenu() {
        this.isOpen = false;
        this.mobileNav.classList.remove('active');
        this.overlay.classList.remove('active');
        this.toggleButton.innerHTML = '☰';
        this.toggleButton.setAttribute('aria-expanded', 'false');
        this.toggleButton.setAttribute('aria-label', 'Apri menu di navigazione');

        // Restore body scroll
        document.body.style.overflow = '';

        // Close all submenus
        const submenus = this.mobileNav.querySelectorAll('.submenu');
        submenus.forEach(submenu => {
            submenu.classList.remove('active');
        });

        // Return focus to toggle button
        this.toggleButton.focus();

        // Analytics tracking
        this.trackEvent('mobile_menu_closed');
    }

    toggleSubmenu(toggleElement) {
        const submenuId = toggleElement.getAttribute('data-submenu') + '-submenu';
        const submenu = document.getElementById(submenuId);

        if (!submenu) return;

        const isActive = submenu.classList.contains('active');

        // Close all other submenus
        const allSubmenus = this.mobileNav.querySelectorAll('.submenu');
        allSubmenus.forEach(menu => {
            if (menu !== submenu) {
                menu.classList.remove('active');
            }
        });

        // Toggle current submenu
        if (isActive) {
            submenu.classList.remove('active');
            toggleElement.querySelector('span:last-child').textContent = '↓';
        } else {
            submenu.classList.add('active');
            toggleElement.querySelector('span:last-child').textContent = '↑';
        }

        // Analytics tracking
        this.trackEvent('mobile_submenu_toggled', {
            submenu: submenuId,
            opened: !isActive
        });
    }

    handleKeyNavigation(e) {
        const focusableElements = this.mobileNav.querySelectorAll(
            'a, button, [tabindex]:not([tabindex="-1"])'
        );
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % focusableElements.length;
                focusableElements[nextIndex].focus();
                break;
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
                focusableElements[prevIndex].focus();
                break;
            case 'Home':
                e.preventDefault();
                focusableElements[0].focus();
                break;
            case 'End':
                e.preventDefault();
                focusableElements[focusableElements.length - 1].focus();
                break;
        }
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) return;

        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        const deltaX = this.touchStartX - touchEndX;
        const deltaY = this.touchStartY - touchEndY;

        // Swipe left to close menu
        if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
            this.closeMenu();
        }
    }

    handleResize() {
        // Close mobile menu if screen becomes desktop size
        if (window.innerWidth > 768 && this.isOpen) {
            this.closeMenu();
        }
    }

    injectCSS() {
        // Check if mobile CSS is already loaded
        if (document.querySelector('link[href*="mobile-menu.css"]') ||
            document.querySelector('style[data-mobile-menu]')) {
            return;
        }

        // Try to load external CSS file first
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = '/css/mobile-menu.css';

        // If external CSS fails to load, inject critical CSS inline
        cssLink.onerror = () => {
            this.injectInlineCSS();
        };

        document.head.appendChild(cssLink);
    }

    injectInlineCSS() {
        const style = document.createElement('style');
        style.setAttribute('data-mobile-menu', 'true');
        style.textContent = `
            @media (max-width: 768px) {
                .mobile-menu-toggle {
                    display: block !important;
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    background: #ffffff;
                    border: 2px solid #007bff;
                    border-radius: 12px;
                    padding: 12px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    color: #007bff;
                }
                .desktop-nav, .hidden.md\\:flex { display: none !important; }
                .mobile-nav {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100vh;
                    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                    z-index: 9998;
                    padding: 80px 20px 20px;
                    overflow-y: auto;
                }
                .mobile-nav.active { display: block !important; }
                .mobile-nav .nav-link {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 0;
                    color: #343a40;
                    font-size: 18px;
                    font-weight: 500;
                    text-decoration: none;
                    border-bottom: 1px solid #e9ecef;
                }
                .emergency-call {
                    background: linear-gradient(135deg, #dc3545, #c82333);
                    color: white !important;
                    padding: 16px;
                    border-radius: 12px;
                    text-align: center;
                    font-weight: bold;
                    margin-top: 20px;
                    text-decoration: none;
                }
                .mobile-nav-overlay {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 9997;
                }
                .mobile-nav-overlay.active { display: block; }
                .submenu { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
                .submenu.active { max-height: 300px; padding: 10px 0; }
            }
        `;

        document.head.appendChild(style);
    }

    trackEvent(eventName, data = {}) {
        // Analytics tracking
        if (typeof window.ITERAAnalytics !== 'undefined') {
            window.ITERAAnalytics.trackEvent(eventName, {
                component: 'mobile_menu',
                ...data
            });
        }

        // Console logging for development
        console.log(`📱 Mobile Menu Event: ${eventName}`, data);
    }

    // Public methods
    destroy() {
        if (!this.isInitialized) return;

        this.toggleButton?.remove();
        this.mobileNav?.remove();
        this.overlay?.remove();

        // Remove inline styles
        const inlineStyle = document.querySelector('style[data-mobile-menu]');
        inlineStyle?.remove();

        this.isInitialized = false;
        console.log('🗑️ IT-ERA Mobile Menu destroyed');
    }

    refresh() {
        this.destroy();
        this.init();
    }
}

// Auto-initialize when script loads
const iteraMobileMenu = new ITERAMobileMenu();

// Expose to global scope for external access
window.ITERAMobileMenu = iteraMobileMenu;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERAMobileMenu;
}