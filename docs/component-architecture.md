# IT-ERA Unified Component Architecture

## Architecture Overview

The new architecture implements a modular, reusable component system that maintains Claude Flow integration while providing consistent user experience across all 1,069 pages.

## Component Hierarchy

```
IT-ERA Components/
├── Core Layout Components/
│   ├── Header/
│   │   ├── header-main.html
│   │   ├── header-mobile.html
│   │   └── header-styles.css
│   ├── Navigation/
│   │   ├── nav-primary.html
│   │   ├── nav-mobile.html
│   │   ├── nav-breadcrumbs.html
│   │   └── nav-styles.css
│   └── Footer/
│       ├── footer-main.html
│       ├── footer-mobile.html
│       └── footer-styles.css
├── Content Components/
│   ├── Hero Sections/
│   ├── Service Cards/
│   ├── Testimonials/
│   └── Call-to-Action/
├── Form Components/
│   ├── Contact Forms/
│   ├── Quote Forms/
│   └── Newsletter Forms/
├── Widget Components/
│   ├── Chat Widget/ (✅ Existing)
│   ├── Analytics/ (✅ Existing)
│   └── Social Media/
└── AI Components/
    ├── Claude Flow Dashboard/ (✅ Existing)
    ├── Smart Chatbot/ (✅ Existing)
    └── AI Integration/ (✅ Existing)
```

## Design System Specifications

### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-blue: #0d6efd;
  --primary-dark: #0a58ca;
  --primary-light: #6ea8fe;
  
  /* Secondary Colors */
  --secondary-gray: #6c757d;
  --secondary-light: #f8f9fa;
  --secondary-dark: #212529;
  
  /* Accent Colors */
  --accent-green: #20c997;
  --accent-orange: #fd7e14;
  --accent-red: #dc3545;
  
  /* Claude Flow Colors (maintain compatibility) */
  --claude-primary: #2c3e50;
  --claude-secondary: #3498db;
  --claude-success: #27ae60;
}
```

### Typography System
```css
:root {
  /* Font Families */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-secondary: 'Roboto', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Spacing System
```css
:root {
  /* Spacing Scale */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### Responsive Breakpoints
```css
:root {
  /* Breakpoints */
  --bp-sm: 576px;
  --bp-md: 768px;
  --bp-lg: 992px;
  --bp-xl: 1200px;
  --bp-xxl: 1400px;
}

/* Media Query Mixins */
@media (min-width: var(--bp-sm)) { /* Small devices */ }
@media (min-width: var(--bp-md)) { /* Medium devices */ }
@media (min-width: var(--bp-lg)) { /* Large devices */ }
@media (min-width: var(--bp-xl)) { /* Extra large devices */ }
@media (min-width: var(--bp-xxl)) { /* Extra extra large devices */ }
```

## Component Specifications

### 1. Header Component
```html
<!-- templates/components/layout/header-main.html -->
<header class="itera-header" role="banner">
  <div class="container">
    <div class="header-content">
      <div class="header-brand">
        <a href="/" class="brand-link">
          <img src="/images/logo-it-era.svg" alt="IT-ERA" class="brand-logo">
          <span class="brand-text">IT-ERA</span>
        </a>
      </div>
      
      <nav class="header-nav" role="navigation">
        <!-- Primary navigation will be injected here -->
      </nav>
      
      <div class="header-actions">
        <a href="/contatti" class="btn btn-primary">Contattaci</a>
        <button class="mobile-menu-toggle" aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  </div>
</header>
```

### 2. Navigation Component
```html
<!-- templates/components/layout/nav-primary.html -->
<nav class="itera-nav" role="navigation" aria-label="Main navigation">
  <ul class="nav-list">
    <li class="nav-item">
      <a href="/assistenza-informatica" class="nav-link">Assistenza IT</a>
    </li>
    <li class="nav-item dropdown">
      <a href="/cybersecurity" class="nav-link dropdown-toggle">Cybersecurity</a>
      <ul class="dropdown-menu">
        <li><a href="/firewall-watchguard" class="dropdown-link">Firewall WatchGuard</a></li>
        <li><a href="/antivirus-business" class="dropdown-link">Antivirus Business</a></li>
      </ul>
    </li>
    <li class="nav-item">
      <a href="/cloud-storage" class="nav-link">Cloud Storage</a>
    </li>
    <li class="nav-item">
      <a href="/backup-disaster-recovery" class="nav-link">Backup & DR</a>
    </li>
    <li class="nav-item">
      <a href="/claude-flow/dashboard.html" class="nav-link nav-link--special">
        <i class="fas fa-robot"></i> Claude Flow
      </a>
    </li>
  </ul>
</nav>
```

### 3. Footer Component
```html
<!-- templates/components/layout/footer-main.html -->
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
        </div>
      </div>
      
      <div class="footer-section">
        <h3 class="footer-title">Servizi</h3>
        <ul class="footer-links">
          <li><a href="/assistenza-informatica">Assistenza IT</a></li>
          <li><a href="/cybersecurity">Cybersecurity</a></li>
          <li><a href="/cloud-storage">Cloud Storage</a></li>
          <li><a href="/backup-disaster-recovery">Backup & DR</a></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h3 class="footer-title">Aree Servite</h3>
        <ul class="footer-links">
          <li><a href="/assistenza-it-milano">Milano</a></li>
          <li><a href="/assistenza-it-bergamo">Bergamo</a></li>
          <li><a href="/assistenza-it-brescia">Brescia</a></li>
          <li><a href="/assistenza-it-varese">Varese</a></li>
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
          <li><a href="/privacy-policy">Privacy Policy</a></li>
          <li><a href="/terms-of-service">Termini di Servizio</a></li>
        </ul>
      </div>
    </div>
  </div>
</footer>
```

## CSS Architecture

### File Organization
```
public/css/
├── core/
│   ├── reset.css          # CSS reset/normalize
│   ├── variables.css      # CSS custom properties
│   ├── typography.css     # Font and text styles
│   └── utilities.css      # Utility classes
├── components/
│   ├── header.css         # Header component styles
│   ├── navigation.css     # Navigation styles
│   ├── footer.css         # Footer styles
│   ├── forms.css          # Form components
│   ├── buttons.css        # Button styles
│   └── cards.css          # Card components
├── pages/
│   ├── homepage.css       # Homepage specific styles
│   ├── services.css       # Service pages styles
│   └── contact.css        # Contact page styles
├── vendor/
│   └── bootstrap.min.css  # Third-party CSS
└── main.css              # Main stylesheet (imports all)
```

### CSS Naming Convention (BEM)
```css
/* Block */
.itera-header { }

/* Element */
.itera-header__brand { }
.itera-header__nav { }
.itera-header__actions { }

/* Modifier */
.itera-header--transparent { }
.itera-header--sticky { }

/* State */
.itera-header.is-scrolled { }
.itera-header.is-mobile-open { }
```

## JavaScript Architecture

### Module Organization
```
public/js/
├── core/
│   ├── app.js             # Main application
│   ├── utils.js           # Utility functions
│   └── config.js          # Configuration
├── components/
│   ├── header.js          # Header functionality
│   ├── navigation.js      # Navigation behavior
│   ├── forms.js           # Form handling
│   └── modal.js           # Modal components
├── pages/
│   ├── homepage.js        # Homepage specific JS
│   └── contact.js         # Contact page JS
├── vendor/
│   ├── bootstrap.min.js   # Third-party JS
│   └── jquery.min.js      # jQuery (if needed)
├── ai/
│   ├── smart-chatbot.js   # ✅ Existing
│   ├── ai-config.js       # ✅ Existing
│   └── claude-flow.js     # ✅ Existing
└── main.js               # Main entry point
```

### Module Loading Strategy
```javascript
// main.js - Main entry point
import { App } from './core/app.js';
import { Header } from './components/header.js';
import { Navigation } from './components/navigation.js';
import { Forms } from './components/forms.js';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  
  // Initialize components
  new Header();
  new Navigation();
  new Forms();
  
  // Initialize page-specific functionality
  app.initPage();
});
```

## Integration with Claude Flow

### Maintaining Compatibility
1. **Preserve Existing APIs**: All Claude Flow APIs remain unchanged
2. **Dashboard Integration**: Claude Flow dashboard maintains its styling
3. **Navigation Integration**: Add Claude Flow link to main navigation
4. **Chat Integration**: Maintain existing chat widget functionality

### Enhanced Integration
```javascript
// Enhanced navigation with Claude Flow awareness
class Navigation {
  constructor() {
    this.initClaudeFlowIntegration();
  }
  
  initClaudeFlowIntegration() {
    // Add Claude Flow status indicator
    this.addClaudeFlowStatus();
    
    // Enable workflow triggers from navigation
    this.enableWorkflowTriggers();
  }
  
  addClaudeFlowStatus() {
    const claudeFlowLink = document.querySelector('[href*="claude-flow"]');
    if (claudeFlowLink) {
      // Add status indicator
      this.fetchClaudeFlowStatus().then(status => {
        claudeFlowLink.classList.add(status.healthy ? 'status-online' : 'status-offline');
      });
    }
  }
}
```

## Implementation Strategy

### Phase 1: Core Components (Week 1)
1. Create design system CSS variables
2. Build header component
3. Build navigation component
4. Build footer component
5. Create base page template

### Phase 2: Content Components (Week 2)
1. Create service card components
2. Build hero section components
3. Create call-to-action components
4. Build testimonial components

### Phase 3: Integration & Testing (Week 3)
1. Integrate components into existing pages
2. Test Claude Flow compatibility
3. Validate responsive behavior
4. Performance optimization

## Success Metrics

### Component Reusability
- **Target**: 95% component reuse across pages
- **Current**: 0% (inline components)

### Consistency Score
- **Target**: 100% consistent styling
- **Current**: ~30% consistency

### Maintenance Efficiency
- **Target**: Single component update affects all pages
- **Current**: Manual updates required per page

### Performance Impact
- **Target**: <10% performance impact from new architecture
- **Measurement**: Lighthouse scores before/after
