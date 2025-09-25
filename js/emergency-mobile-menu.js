/**
 * EMERGENCY MOBILE MENU HANDLER
 * This script ensures mobile menu works even if other scripts fail
 */
(function() {
    'use strict';

    function initEmergencyMobileMenu() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initEmergencyMobileMenu);
            return;
        }

        console.log('🚨 Emergency Mobile Menu: Initializing...');

        // Find or create mobile menu button
        let mobileMenuButton = document.querySelector('#mobile-menu-button') ||
                              document.querySelector('.mobile-menu-toggle') ||
                              document.querySelector('button[aria-label*="menu"]');

        // Find mobile menu panel
        let mobileMenu = document.querySelector('#mobile-menu') ||
                        document.querySelector('.mobile-nav');

        // If button doesn't exist, create emergency one
        if (!mobileMenuButton) {
            console.log('🚨 Emergency Mobile Menu: Creating emergency button');
            mobileMenuButton = document.createElement('button');
            mobileMenuButton.id = 'emergency-mobile-menu-button';
            mobileMenuButton.innerHTML = '☰';
            mobileMenuButton.setAttribute('aria-label', 'Emergency Mobile Menu');

            // Apply emergency styles
            Object.assign(mobileMenuButton.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                width: '44px',
                height: '44px',
                background: 'white',
                border: '2px solid #0066cc',
                borderRadius: '4px',
                fontSize: '24px',
                zIndex: '10001',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'none'
            });

            document.body.appendChild(mobileMenuButton);
        }

        // If mobile menu doesn't exist, create emergency one
        if (!mobileMenu) {
            console.log('🚨 Emergency Mobile Menu: Creating emergency menu');
            mobileMenu = document.createElement('div');
            mobileMenu.id = 'emergency-mobile-menu';

            // Get navigation links from desktop menu
            const desktopNav = document.querySelector('.hidden.md\\:flex ') ||
                              document.querySelector('nav') ||
                              document.querySelector('.desktop-nav');

            let navHTML = `
                <div style="padding: 80px 20px 20px; background: white; height: 100vh; overflow-y: auto;">
                    <div style="border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
                        <img src="/images/logo-it-era.png" alt="IT-ERA" style="height: 40px;">
                    </div>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        <li><a href="/" style="display: block; padding: 15px 0; text-decoration: none; color: #333; border-bottom: 1px solid #f0f0f0;">Home</a></li>
                        <li><a href="/servizi-it/" style="display: block; padding: 15px 0; text-decoration: none; color: #333; border-bottom: 1px solid #f0f0f0;">Servizi IT</a></li>
                        <li><a href="/settori/" style="display: block; padding: 15px 0; text-decoration: none; color: #333; border-bottom: 1px solid #f0f0f0;">Settori</a></li>
                        <li><a href="/contatti.html" style="display: block; padding: 15px 0; text-decoration: none; color: #333; border-bottom: 1px solid #f0f0f0;">Contatti</a></li>
                        <li><a href="tel:+390398882041" style="display: block; padding: 15px; background: #dc2626; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; text-align: center;">📞 Emergenza: 039 888 2041</a></li>
                    </ul>
                </div>
            `;

            mobileMenu.innerHTML = navHTML;

            // Apply emergency styles
            Object.assign(mobileMenu.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100vh',
                background: 'white',
                zIndex: '10000',
                display: 'none'
            });

            document.body.appendChild(mobileMenu);
        }

        // Mobile menu toggle function
        function toggleMobileMenu() {
            console.log('🚨 Emergency Mobile Menu: Toggling menu');
            const isVisible = mobileMenu.style.display !== 'none';

            if (isVisible) {
                mobileMenu.style.display = 'none';
                mobileMenu.classList.remove('active');
                mobileMenuButton.innerHTML = '☰';
                mobileMenuButton.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                mobileMenu.style.display = 'block';
                mobileMenu.classList.add('active');
                mobileMenuButton.innerHTML = '✕';
                mobileMenuButton.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        // Show button on mobile
        function checkMobile() {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                mobileMenuButton.style.display = 'flex';
                mobileMenuButton.style.alignItems = 'center';
                mobileMenuButton.style.justifyContent = 'center';
                console.log('🚨 Emergency Mobile Menu: Mobile detected, showing button');
            } else {
                mobileMenuButton.style.display = 'none';
                mobileMenu.style.display = 'none';
                document.body.style.overflow = '';
            }
        }

        // Event listeners
        mobileMenuButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileMenu();
        });

        // Close on overlay click
        mobileMenu.addEventListener('click', function(e) {
            if (e.target === mobileMenu) {
                toggleMobileMenu();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileMenu.style.display === 'block') {
                toggleMobileMenu();
            }
        });

        // Check on resize
        window.addEventListener('resize', checkMobile);

        // Initial check
        checkMobile();

        console.log('🚨 Emergency Mobile Menu: Initialized successfully');
    }

    // Initialize immediately
    initEmergencyMobileMenu();

})();