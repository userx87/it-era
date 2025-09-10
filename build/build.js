#!/usr/bin/env node

/**
 * IT-ERA Build System
 * Comprehensive build pipeline for production-ready website
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Simple color functions as fallback
const colors = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`
};

class ITERABuildSystem {
    constructor() {
        this.projectRoot = process.cwd();
        this.srcDir = path.join(this.projectRoot, 'src');
        this.publicDir = path.join(this.projectRoot, 'public');
        this.buildDir = path.join(this.projectRoot, 'build');
        this.distDir = path.join(this.projectRoot, 'dist');
        
        this.config = {
            minifyCSS: process.env.NODE_ENV === 'production',
            minifyJS: process.env.NODE_ENV === 'production',
            optimizeImages: process.env.NODE_ENV === 'production',
            generateSourceMaps: process.env.NODE_ENV !== 'production'
        };
        
        this.stats = {
            startTime: Date.now(),
            filesProcessed: 0,
            errors: 0,
            warnings: 0
        };
    }
    
    async build() {
        console.log(colors.blue('\n🚀 IT-ERA Build System Starting...\n'));
        
        try {
            await this.setupDirectories();
            await this.createDesignSystem();
            await this.buildComponents();
            await this.processAssets();
            await this.generatePages();
            await this.optimizeOutput();
            await this.generateReport();
            
            console.log(colors.green('\n✅ Build completed successfully!\n'));
        } catch (error) {
            console.error(colors.red('\n❌ Build failed:'), error.message);
            process.exit(1);
        }
    }
    
    async setupDirectories() {
        console.log(colors.blue('📁 Setting up directory structure...'));
        
        const directories = [
            'src/components/layout',
            'src/components/content',
            'src/components/forms',
            'src/components/widgets',
            'src/styles/core',
            'src/styles/components',
            'src/styles/pages',
            'src/scripts/core',
            'src/scripts/components',
            'src/scripts/pages',
            'src/assets/images',
            'src/assets/icons',
            'src/assets/fonts',
            'src/pages/templates',
            'src/pages/content',
            'src/pages/data',
            'public/css',
            'public/js',
            'public/images',
            'public/fonts',
            'dist/css',
            'dist/js',
            'dist/images'
        ];
        
        for (const dir of directories) {
            await fs.ensureDir(path.join(this.projectRoot, dir));
        }
        
        console.log(colors.green('✅ Directory structure created'));
    }
    
    async createDesignSystem() {
        console.log(colors.blue('🎨 Creating design system...'));
        
        // Create CSS variables
        const cssVariables = `
/* IT-ERA Design System Variables */
:root {
  /* Colors */
  --primary-blue: #0d6efd;
  --primary-dark: #0a58ca;
  --primary-light: #6ea8fe;
  --secondary-gray: #6c757d;
  --secondary-light: #f8f9fa;
  --secondary-dark: #212529;
  --accent-green: #20c997;
  --accent-orange: #fd7e14;
  --accent-red: #dc3545;
  
  /* Claude Flow Colors (compatibility) */
  --claude-primary: #2c3e50;
  --claude-secondary: #3498db;
  --claude-success: #27ae60;
  
  /* Typography */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-secondary: 'Roboto', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;
  
  /* Breakpoints */
  --bp-sm: 576px;
  --bp-md: 768px;
  --bp-lg: 992px;
  --bp-xl: 1200px;
  --bp-xxl: 1400px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  /* Border Radius */
  --radius-sm: 0.125rem;
  --radius: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 300ms ease-in-out;
  --transition-slow: 500ms ease-in-out;
}
`;
        
        await fs.writeFile(
            path.join(this.srcDir, 'styles/core/_variables.css'),
            cssVariables
        );
        
        // Create base reset
        const cssReset = `
/* IT-ERA CSS Reset */
*, *::before, *::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

html, body {
  height: 100%;
}

body {
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  font-family: var(--font-primary);
  color: var(--secondary-dark);
  background-color: var(--secondary-light);
}

img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

input, button, textarea, select {
  font: inherit;
}

p, h1, h2, h3, h4, h5, h6 {
  overflow-wrap: break-word;
}

#root, #__next {
  isolation: isolate;
}

/* Focus styles */
:focus-visible {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Utility classes */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 768px) {
  .container {
    padding: 0 var(--space-6);
  }
}

/* Responsive utilities */
.hidden { display: none; }
.block { display: block; }
.inline-block { display: inline-block; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }

.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.font-normal { font-weight: 400; }

.text-xs { font-size: var(--text-xs); }
.text-sm { font-size: var(--text-sm); }
.text-base { font-size: var(--text-base); }
.text-lg { font-size: var(--text-lg); }
.text-xl { font-size: var(--text-xl); }
.text-2xl { font-size: var(--text-2xl); }
.text-3xl { font-size: var(--text-3xl); }
.text-4xl { font-size: var(--text-4xl); }

.mb-1 { margin-bottom: var(--space-1); }
.mb-2 { margin-bottom: var(--space-2); }
.mb-3 { margin-bottom: var(--space-3); }
.mb-4 { margin-bottom: var(--space-4); }
.mb-6 { margin-bottom: var(--space-6); }
.mb-8 { margin-bottom: var(--space-8); }

.mt-1 { margin-top: var(--space-1); }
.mt-2 { margin-top: var(--space-2); }
.mt-3 { margin-top: var(--space-3); }
.mt-4 { margin-top: var(--space-4); }
.mt-6 { margin-top: var(--space-6); }
.mt-8 { margin-top: var(--space-8); }

.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }

.rounded { border-radius: var(--radius); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-xl { border-radius: var(--radius-xl); }
.rounded-full { border-radius: var(--radius-full); }

.shadow { box-shadow: var(--shadow); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-xl { box-shadow: var(--shadow-xl); }

.transition { transition: all var(--transition-normal); }
.transition-fast { transition: all var(--transition-fast); }
.transition-slow { transition: all var(--transition-slow); }
`;
        
        await fs.writeFile(
            path.join(this.srcDir, 'styles/core/_reset.css'),
            cssReset
        );
        
        console.log(colors.green('✅ Design system created'));
    }
    
    async buildComponents() {
        console.log(colors.blue('🧩 Building components...'));
        
        // Create header component
        await this.createHeaderComponent();
        await this.createNavigationComponent();
        await this.createFooterComponent();
        
        console.log(colors.green('✅ Components built'));
    }
    
    async createHeaderComponent() {
        const headerHTML = `
<!-- IT-ERA Header Component -->
<header class="itera-header" role="banner">
  <div class="container">
    <div class="header-content">
      <div class="header-brand">
        <a href="/" class="brand-link">
          <img src="/images/logo-it-era.svg" alt="IT-ERA" class="brand-logo">
          <span class="brand-text">IT-ERA</span>
        </a>
      </div>
      
      <nav class="header-nav" role="navigation" aria-label="Main navigation">
        <ul class="nav-list">
          <li class="nav-item">
            <a href="/assistenza-informatica.html" class="nav-link">Assistenza IT</a>
          </li>
          <li class="nav-item dropdown">
            <a href="/cybersecurity.html" class="nav-link dropdown-toggle">Cybersecurity</a>
            <ul class="dropdown-menu">
              <li><a href="/firewall-watchguard.html" class="dropdown-link">Firewall WatchGuard</a></li>
              <li><a href="/antivirus-business.html" class="dropdown-link">Antivirus Business</a></li>
            </ul>
          </li>
          <li class="nav-item">
            <a href="/cloud-storage.html" class="nav-link">Cloud Storage</a>
          </li>
          <li class="nav-item">
            <a href="/backup-disaster-recovery.html" class="nav-link">Backup & DR</a>
          </li>
          <li class="nav-item nav-item--special">
            <a href="/claude-flow/dashboard.html" class="nav-link nav-link--claude">
              <i class="fas fa-robot"></i> Claude Flow
            </a>
          </li>
        </ul>
      </nav>
      
      <div class="header-actions">
        <a href="/contatti.html" class="btn btn-primary">Contattaci</a>
        <button class="mobile-menu-toggle" aria-label="Toggle mobile menu" aria-expanded="false">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
      </div>
    </div>
  </div>
</header>
`;
        
        const headerCSS = `
/* IT-ERA Header Component */
.itera-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: var(--transition-normal);
}

.itera-header.is-scrolled {
  box-shadow: var(--shadow-md);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0;
}

.header-brand {
  flex-shrink: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--secondary-dark);
  font-weight: 700;
  font-size: var(--text-xl);
}

.brand-logo {
  height: 40px;
  width: auto;
  margin-right: var(--space-3);
}

.brand-text {
  color: var(--primary-blue);
}

.header-nav {
  display: none;
}

@media (min-width: 992px) {
  .header-nav {
    display: block;
  }
}

.nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: var(--space-6);
}

.nav-item {
  position: relative;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  text-decoration: none;
  color: var(--secondary-dark);
  font-weight: 500;
  border-radius: var(--radius);
  transition: var(--transition-fast);
}

.nav-link:hover {
  color: var(--primary-blue);
  background-color: var(--secondary-light);
}

.nav-link--claude {
  background: linear-gradient(135deg, var(--claude-primary), var(--claude-secondary));
  color: white;
  font-weight: 600;
}

.nav-link--claude:hover {
  background: linear-gradient(135deg, var(--claude-secondary), var(--claude-primary));
  color: white;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 200px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: var(--transition-fast);
  list-style: none;
  margin: 0;
  padding: var(--space-2);
  z-index: 1001;
}

.dropdown:hover .dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-link {
  display: block;
  padding: var(--space-2) var(--space-3);
  text-decoration: none;
  color: var(--secondary-dark);
  border-radius: var(--radius);
  transition: var(--transition-fast);
}

.dropdown-link:hover {
  background-color: var(--secondary-light);
  color: var(--primary-blue);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-primary {
  background-color: var(--primary-blue);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  color: white;
}

.mobile-menu-toggle {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

@media (min-width: 992px) {
  .mobile-menu-toggle {
    display: none;
  }
}

.hamburger-line {
  width: 24px;
  height: 2px;
  background-color: var(--secondary-dark);
  margin: 2px 0;
  transition: var(--transition-fast);
}

.mobile-menu-toggle[aria-expanded="true"] .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.mobile-menu-toggle[aria-expanded="true"] .hamburger-line:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle[aria-expanded="true"] .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

/* Mobile Navigation */
@media (max-width: 991px) {
  .header-nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #e5e7eb;
    box-shadow: var(--shadow-lg);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: var(--transition-normal);
  }
  
  .header-nav.is-open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  
  .nav-list {
    flex-direction: column;
    gap: 0;
    padding: var(--space-4);
  }
  
  .nav-link {
    padding: var(--space-4);
    border-bottom: 1px solid #f3f4f6;
  }
  
  .dropdown-menu {
    position: static;
    opacity: 1;
    visibility: visible;
    transform: none;
    box-shadow: none;
    border: none;
    background: #f8f9fa;
    margin-top: var(--space-2);
  }
}
`;
        
        await fs.writeFile(
            path.join(this.srcDir, 'components/layout/header.html'),
            headerHTML
        );
        
        await fs.writeFile(
            path.join(this.srcDir, 'styles/components/_header.css'),
            headerCSS
        );
    }
    
    async createNavigationComponent() {
        // Navigation component is integrated into header
        console.log(colors.gray('  Navigation integrated into header'));
    }
    
    async createFooterComponent() {
        const footerHTML = `
<!-- IT-ERA Footer Component -->
<footer class="itera-footer" role="contentinfo">
  <div class="container">
    <div class="footer-content">
      <div class="footer-section footer-brand">
        <img src="/images/logo-it-era-white.svg" alt="IT-ERA" class="footer-logo">
        <p class="footer-description">
          Assistenza IT professionale in Lombardia. 
          Supporto tecnico 24/7 per la tua azienda.
        </p>
        <div class="footer-contact">
          <p><i class="fas fa-phone"></i> 039 888 2041</p>
          <p><i class="fas fa-envelope"></i> info@it-era.it</p>
          <p><i class="fas fa-map-marker-alt"></i> Viale Risorgimento 32, Vimercate MB</p>
        </div>
      </div>
      
      <div class="footer-section">
        <h3 class="footer-title">Servizi</h3>
        <ul class="footer-links">
          <li><a href="/assistenza-informatica.html">Assistenza IT</a></li>
          <li><a href="/cybersecurity.html">Cybersecurity</a></li>
          <li><a href="/cloud-storage.html">Cloud Storage</a></li>
          <li><a href="/backup-disaster-recovery.html">Backup & DR</a></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h3 class="footer-title">Aree Servite</h3>
        <ul class="footer-links">
          <li><a href="/pages-generated/assistenza-it-milano.html">Milano</a></li>
          <li><a href="/pages-generated/assistenza-it-bergamo.html">Bergamo</a></li>
          <li><a href="/pages-generated/assistenza-it-brescia.html">Brescia</a></li>
          <li><a href="/pages-generated/assistenza-it-varese.html">Varese</a></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h3 class="footer-title">AI & Automazione</h3>
        <ul class="footer-links">
          <li><a href="/claude-flow/dashboard.html">Claude Flow Dashboard</a></li>
          <li><a href="#" onclick="toggleChat()">Chat AI</a></li>
        </ul>
      </div>
    </div>
    
    <div class="footer-bottom">
      <div class="footer-legal">
        <p>&copy; 2024 IT-ERA. Tutti i diritti riservati.</p>
        <ul class="legal-links">
          <li><a href="/privacy-policy.html">Privacy Policy</a></li>
          <li><a href="/terms-of-service.html">Termini di Servizio</a></li>
        </ul>
      </div>
    </div>
  </div>
</footer>
`;
        
        const footerCSS = `
/* IT-ERA Footer Component */
.itera-footer {
  background: var(--secondary-dark);
  color: white;
  margin-top: auto;
}

.footer-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  padding: var(--space-12) 0 var(--space-8);
}

@media (min-width: 768px) {
  .footer-content {
    grid-template-columns: 2fr 1fr 1fr 1fr;
  }
}

.footer-section {
  display: flex;
  flex-direction: column;
}

.footer-brand {
  max-width: 300px;
}

.footer-logo {
  height: 40px;
  width: auto;
  margin-bottom: var(--space-4);
}

.footer-description {
  color: #d1d5db;
  margin-bottom: var(--space-4);
  line-height: 1.6;
}

.footer-contact p {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-2);
  color: #d1d5db;
}

.footer-contact i {
  margin-right: var(--space-2);
  color: var(--primary-blue);
  width: 16px;
}

.footer-title {
  font-size: var(--text-lg);
  font-weight: 600;
  margin-bottom: var(--space-4);
  color: white;
}

.footer-links {
  list-style: none;
  margin: 0;
  padding: 0;
}

.footer-links li {
  margin-bottom: var(--space-2);
}

.footer-links a {
  color: #d1d5db;
  text-decoration: none;
  transition: var(--transition-fast);
}

.footer-links a:hover {
  color: var(--primary-blue);
}

.footer-bottom {
  border-top: 1px solid #374151;
  padding: var(--space-6) 0;
}

.footer-legal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
}

@media (min-width: 768px) {
  .footer-legal {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
}

.footer-legal p {
  color: #9ca3af;
  margin: 0;
}

.legal-links {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: var(--space-4);
}

.legal-links a {
  color: #9ca3af;
  text-decoration: none;
  font-size: var(--text-sm);
  transition: var(--transition-fast);
}

.legal-links a:hover {
  color: var(--primary-blue);
}
`;
        
        await fs.writeFile(
            path.join(this.srcDir, 'components/layout/footer.html'),
            footerHTML
        );
        
        await fs.writeFile(
            path.join(this.srcDir, 'styles/components/_footer.css'),
            footerCSS
        );
    }
    
    async processAssets() {
        console.log(colors.blue('📦 Processing assets...'));
        
        // Copy existing assets
        if (await fs.pathExists(path.join(this.publicDir, 'images'))) {
            await fs.copy(
                path.join(this.publicDir, 'images'),
                path.join(this.distDir, 'images')
            );
        }
        
        if (await fs.pathExists(path.join(this.publicDir, 'css'))) {
            await fs.copy(
                path.join(this.publicDir, 'css'),
                path.join(this.distDir, 'css')
            );
        }
        
        console.log(colors.green('✅ Assets processed'));
    }
    
    async generatePages() {
        console.log(colors.blue('📄 Generating pages...'));
        
        // Create base template
        await this.createBaseTemplate();
        
        console.log(colors.green('✅ Pages generated'));
    }
    
    async createBaseTemplate() {
        const baseTemplate = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{page.title}} | IT-ERA</title>
    <meta name="description" content="{{page.description}}">
    <meta name="keywords" content="{{page.keywords}}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="{{page.title}} | IT-ERA">
    <meta property="og:description" content="{{page.description}}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{page.url}}">
    <meta property="og:image" content="/images/og-image.jpg">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{page.title}} | IT-ERA">
    <meta name="twitter:description" content="{{page.description}}">
    <meta name="twitter:image" content="/images/og-image.jpg">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    
    <!-- CSS -->
    <link rel="stylesheet" href="/css/main.css">
    {{#if page.customCSS}}
    <link rel="stylesheet" href="/css/pages/{{page.customCSS}}.css">
    {{/if}}
    
    <!-- Preload critical resources -->
    <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
    
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'GA_MEASUREMENT_ID');
    </script>
</head>
<body class="{{page.bodyClass}}">
    <!-- Skip to main content -->
    <a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>
    
    <!-- Header -->
    {{> components/layout/header}}
    
    <!-- Main Content -->
    <main id="main-content" role="main">
        {{> content}}
    </main>
    
    <!-- Footer -->
    {{> components/layout/footer}}
    
    <!-- Claude Flow Integration -->
    {{> components/widgets/chat-widget}}
    
    <!-- JavaScript -->
    <script src="/js/main.js"></script>
    {{#if page.customJS}}
    <script src="/js/pages/{{page.customJS}}.js"></script>
    {{/if}}
    
    <!-- Claude Flow Scripts (if enabled) -->
    {{#if claudeFlow.enabled}}
    <script src="/claude-flow/claude-flow-dashboard.js"></script>
    {{/if}}
</body>
</html>
`;
        
        await fs.writeFile(
            path.join(this.srcDir, 'pages/templates/base.html'),
            baseTemplate
        );
    }
    
    async optimizeOutput() {
        console.log(colors.blue('⚡ Optimizing output...'));
        
        // Create main CSS file
        const mainCSS = `
@import 'core/_variables.css';
@import 'core/_reset.css';
@import 'components/_header.css';
@import 'components/_footer.css';
`;
        
        await fs.writeFile(
            path.join(this.srcDir, 'styles/main.css'),
            mainCSS
        );
        
        // Copy to public directory
        await fs.copy(
            path.join(this.srcDir, 'styles'),
            path.join(this.publicDir, 'css')
        );
        
        console.log(colors.green('✅ Output optimized'));
    }
    
    async generateReport() {
        const endTime = Date.now();
        const duration = endTime - this.stats.startTime;
        
        console.log(colors.blue('\n📊 Build Report:'));
        console.log(colors.gray(`Duration: ${duration}ms`));
        console.log(colors.gray(`Files processed: ${this.stats.filesProcessed}`));
        console.log(colors.gray(`Errors: ${this.stats.errors}`));
        console.log(colors.gray(`Warnings: ${this.stats.warnings}`));
    }
}

// Run build if called directly
if (require.main === module) {
    const builder = new ITERABuildSystem();
    builder.build().catch(console.error);
}

module.exports = ITERABuildSystem;
