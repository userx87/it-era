/*!
 * IT-ERA Components Loader
 * Dynamic component loading system for separated components
 */

// ============================================
// COMPONENT LOADER SYSTEM
// ============================================

class ITERAComponentLoader {
    constructor() {
        this.components = new Map();
        this.loadedComponents = new Set();
        this.basePath = this.getBasePath();
        
        console.log('🧩 IT-ERA Component Loader initialized');
    }
    
    // Get base path for components
    getBasePath() {
        const currentPath = window.location.pathname;
        
        // If we're in a subdirectory, adjust the path
        if (currentPath.includes('/servizi/') || currentPath.includes('/settori/')) {
            return '../';
        }
        
        return './';
    }
    
    // Register a component
    registerComponent(name, config) {
        this.components.set(name, {
            selector: config.selector,
            templatePath: config.templatePath,
            cssPath: config.cssPath,
            jsPath: config.jsPath,
            dependencies: config.dependencies || []
        });
        
        console.log(`📦 Component registered: ${name}`);
    }
    
    // Load component HTML
    async loadComponentHTML(templatePath) {
        try {
            const response = await fetch(this.basePath + templatePath);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error('❌ Error loading component HTML:', error);
            return null;
        }
    }
    
    // Load component CSS
    loadComponentCSS(cssPath) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = this.basePath + cssPath;
            link.onload = () => {
                console.log(`🎨 CSS loaded: ${cssPath}`);
                resolve();
            };
            link.onerror = () => {
                console.error(`❌ Failed to load CSS: ${cssPath}`);
                reject();
            };
            document.head.appendChild(link);
        });
    }
    
    // Load component JavaScript
    loadComponentJS(jsPath) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.basePath + jsPath;
            script.onload = () => {
                console.log(`⚡ JavaScript loaded: ${jsPath}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`❌ Failed to load JavaScript: ${jsPath}`);
                reject();
            };
            document.head.appendChild(script);
        });
    }
    
    // Load a single component
    async loadComponent(name) {
        if (this.loadedComponents.has(name)) {
            console.log(`✅ Component already loaded: ${name}`);
            return true;
        }
        
        const config = this.components.get(name);
        if (!config) {
            console.error(`❌ Component not found: ${name}`);
            return false;
        }
        
        try {
            // Load dependencies first
            for (const dependency of config.dependencies) {
                await this.loadComponent(dependency);
            }
            
            // Load CSS if specified
            if (config.cssPath) {
                await this.loadComponentCSS(config.cssPath);
            }
            
            // Load HTML template
            if (config.templatePath && config.selector) {
                const html = await this.loadComponentHTML(config.templatePath);
                if (html) {
                    const targetElement = document.querySelector(config.selector);
                    if (targetElement) {
                        targetElement.innerHTML = html;
                        console.log(`🎯 Component rendered: ${name}`);
                    } else {
                        console.warn(`⚠️ Target element not found for component: ${name} (${config.selector})`);
                    }
                }
            }
            
            // Load JavaScript if specified
            if (config.jsPath) {
                await this.loadComponentJS(config.jsPath);
            }
            
            this.loadedComponents.add(name);
            console.log(`✅ Component loaded successfully: ${name}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error loading component ${name}:`, error);
            return false;
        }
    }
    
    // Load multiple components
    async loadComponents(componentNames) {
        const promises = componentNames.map(name => this.loadComponent(name));
        const results = await Promise.allSettled(promises);
        
        const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
        console.log(`📊 Loaded ${successful}/${componentNames.length} components successfully`);
        
        return results;
    }
    
    // Auto-detect and load components based on page
    async autoLoadComponents() {
        const currentPath = window.location.pathname;
        const componentsToLoad = ['header'];
        
        // Add page-specific components
        if (currentPath.includes('/contatti')) {
            componentsToLoad.push('contact-form');
        }
        
        if (currentPath.includes('/servizi')) {
            componentsToLoad.push('service-cards');
        }
        
        // Always load common components
        componentsToLoad.push('chatbot', 'footer');
        
        await this.loadComponents(componentsToLoad);
    }
    
    // Update navigation active state
    updateNavigationState() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            const href = link.getAttribute('href');
            if (href) {
                // Check if current page matches the link
                if (currentPath === href || 
                    (currentPath === '/' && href === '/') ||
                    (currentPath.includes('/servizi') && href.includes('/servizi')) ||
                    (currentPath.includes('/contatti') && href.includes('/contatti'))) {
                    link.classList.add('active');
                }
            }
        });
        
        console.log('🎯 Navigation state updated');
    }
}

// ============================================
// COMPONENT CONFIGURATIONS
// ============================================

// Initialize component loader
const componentLoader = new ITERAComponentLoader();

// Register components
componentLoader.registerComponent('header', {
    selector: '#header-placeholder',
    templatePath: 'components/header.html',
    cssPath: 'css/components-separated.css'
});

componentLoader.registerComponent('footer', {
    selector: '#footer-placeholder',
    templatePath: 'components/footer.html'
});

componentLoader.registerComponent('chatbot', {
    selector: '#chatbot-placeholder',
    templatePath: 'components/chatbot.html',
    jsPath: 'js/chatbot.js'
});

componentLoader.registerComponent('contact-form', {
    selector: '#contact-form-placeholder',
    templatePath: 'components/contact-form.html',
    jsPath: 'js/contact-form.js'
});

componentLoader.registerComponent('service-cards', {
    selector: '#service-cards-placeholder',
    templatePath: 'components/service-cards.html'
});

// ============================================
// MOBILE MENU FUNCTIONALITY
// ============================================

function initializeMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';

            // Toggle menu visibility
            mobileMenu.classList.toggle('hidden');

            // Update aria-expanded
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);

            // Toggle icon
            const icon = mobileMenuButton.querySelector('svg');
            if (mobileMenu.classList.contains('hidden')) {
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
            } else {
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
            }
        });
        
        console.log('📱 Mobile menu initialized');
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 IT-ERA Components System starting...');
    
    // Load components automatically
    await componentLoader.autoLoadComponents();
    
    // Initialize mobile menu after header is loaded
    setTimeout(() => {
        initializeMobileMenu();
        componentLoader.updateNavigationState();
    }, 100);
    
    console.log('✅ IT-ERA Components System ready');
});

// Make component loader available globally
window.ITERAComponents = componentLoader;
