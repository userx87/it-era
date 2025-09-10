# IT-ERA Coding Standards & Conventions

## 📋 Overview

This document establishes consistent coding standards, naming conventions, and best practices for the IT-ERA website template system. Following these standards ensures maintainable, scalable, and professional code across all pages and components.

## 🗂️ File Structure & Organization

### Directory Structure
```
templates/
├── design-system/           # Design system documentation and assets
│   ├── README.md           # Design system overview
│   ├── colors.css          # Color variables and utilities
│   ├── typography.css      # Typography system
│   ├── components.css      # Reusable component styles
│   └── coding-standards.md # This document
├── css/                    # Page-specific stylesheets
│   ├── assistenza-informatica.css
│   ├── sicurezza-informatica.css
│   └── [service-name].css
├── js/                     # Page-specific JavaScript
│   ├── assistenza-informatica.js
│   ├── sicurezza-informatica.js
│   └── [service-name].js
├── components/             # Reusable HTML components
│   ├── navigation-modern.html
│   ├── footer.html
│   ├── forms/
│   │   ├── contact-form.html
│   │   └── quote-form.html
│   └── widgets/
│       ├── chat-widget.html
│       └── analytics.html
├── examples/               # Example implementations
│   └── milano-assistenza-informatica.html
└── [service-name].html    # Main service pages
```

## 📝 Naming Conventions

### File Names
- **HTML files**: `kebab-case.html` (e.g., `assistenza-informatica.html`)
- **CSS files**: `kebab-case.css` (e.g., `assistenza-informatica.css`)
- **JavaScript files**: `kebab-case.js` (e.g., `assistenza-informatica.js`)
- **Component files**: `kebab-case.html` (e.g., `navigation-modern.html`)

### CSS Classes
- **Component classes**: `kebab-case` (e.g., `.pricing-card`, `.hero-section`)
- **Utility classes**: Follow Tailwind conventions (e.g., `.text-center`, `.bg-primary`)
- **State classes**: `is-` or `has-` prefix (e.g., `.is-active`, `.has-error`)
- **JavaScript hooks**: `js-` prefix (e.g., `.js-mobile-menu`, `.js-form-submit`)

### JavaScript Variables & Functions
- **Variables**: `camelCase` (e.g., `formData`, `submitButton`)
- **Functions**: `camelCase` (e.g., `submitForm`, `showMessage`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_ENDPOINT`, `MAX_RETRIES`)
- **Classes**: `PascalCase` (e.g., `FormValidator`, `ApiClient`)

### HTML IDs
- **Unique identifiers**: `kebab-case` (e.g., `#preventivo-form`, `#mobile-menu`)
- **Form elements**: Descriptive names (e.g., `#contact-email`, `#quote-message`)

## 🎨 CSS Standards

### CSS Custom Properties
```css
/* Use semantic naming */
:root {
    --color-primary: #1e40af;
    --color-text-primary: #111827;
    --spacing-md: 1rem;
    --border-radius-lg: 0.75rem;
    --transition-base: 0.3s ease-in-out;
}
```

### Class Organization
```css
/* 1. Layout properties */
.component {
    display: flex;
    position: relative;
    width: 100%;
    
    /* 2. Box model */
    padding: 1rem;
    margin: 0 auto;
    border: 1px solid var(--border-primary);
    
    /* 3. Typography */
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    
    /* 4. Visual */
    background-color: var(--white);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-md);
    
    /* 5. Animation */
    transition: all var(--transition-base);
}
```

### Media Queries
```css
/* Mobile-first approach */
.component {
    /* Mobile styles (default) */
    padding: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
    .component {
        padding: 1.5rem;
    }
}

/* Desktop and up */
@media (min-width: 1024px) {
    .component {
        padding: 2rem;
    }
}
```

## 💻 JavaScript Standards

### Code Organization
```javascript
// 1. Constants and configuration
const API_ENDPOINT = 'https://api.example.com';
const MAX_RETRIES = 3;

// 2. Utility functions
function formatDate(date) {
    return new Intl.DateTimeFormat('it-IT').format(date);
}

// 3. Main functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialization code
    initializeComponents();
    bindEventListeners();
});

// 4. Event handlers
function handleFormSubmit(event) {
    event.preventDefault();
    // Handle form submission
}
```

### Error Handling
```javascript
async function submitForm(data) {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('Form submission error:', error);
        showErrorMessage('Si è verificato un errore. Riprova più tardi.');
        throw error;
    }
}
```

### Event Listeners
```javascript
// Use event delegation for dynamic content
document.addEventListener('click', function(event) {
    if (event.target.matches('.js-mobile-menu-toggle')) {
        toggleMobileMenu();
    }
    
    if (event.target.matches('.js-form-submit')) {
        handleFormSubmit(event);
    }
});
```

## 📄 HTML Standards

### Document Structure
```html
<!DOCTYPE html>
<html lang="it" itemscope itemtype="https://schema.org/LocalBusiness">
<head>
    <!-- Meta tags -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- SEO meta tags -->
    <title>Page Title | IT-ERA</title>
    <meta name="description" content="Page description">
    
    <!-- Critical CSS inline -->
    <style>/* Critical styles */</style>
    
    <!-- External stylesheets -->
    <link rel="stylesheet" href="/css/page-name.css">
</head>
<body>
    <!-- Skip link for accessibility -->
    <a href="#main-content" class="sr-only focus:not-sr-only">
        Vai al contenuto principale
    </a>
    
    <!-- Navigation -->
    <nav role="navigation" aria-label="Menu principale">
        <!-- Navigation content -->
    </nav>
    
    <!-- Main content -->
    <main id="main-content" role="main">
        <!-- Page content -->
    </main>
    
    <!-- Footer -->
    <footer role="contentinfo">
        <!-- Footer content -->
    </footer>
    
    <!-- JavaScript -->
    <script src="/js/page-name.js"></script>
</body>
</html>
```

### Semantic HTML
```html
<!-- Use semantic elements -->
<article class="blog-post">
    <header>
        <h1>Article Title</h1>
        <time datetime="2024-12-01">1 Dicembre 2024</time>
    </header>
    
    <section>
        <h2>Section Title</h2>
        <p>Content...</p>
    </section>
    
    <aside>
        <h3>Related Links</h3>
        <ul>
            <li><a href="#">Link 1</a></li>
        </ul>
    </aside>
</article>
```

### Form Structure
```html
<form id="contact-form" class="space-y-6" novalidate>
    <div class="form-group">
        <label for="contact-name" class="form-label">
            Nome *
        </label>
        <input 
            type="text" 
            id="contact-name" 
            name="nome" 
            class="form-input" 
            required 
            aria-describedby="name-error"
        >
        <div id="name-error" class="form-error hidden" role="alert">
            Il nome è obbligatorio
        </div>
    </div>
    
    <button type="submit" class="btn btn-primary">
        <i class="fas fa-paper-plane" aria-hidden="true"></i>
        Invia Messaggio
    </button>
</form>
```

## ♿ Accessibility Standards

### ARIA Labels
```html
<!-- Navigation -->
<nav role="navigation" aria-label="Menu principale">
    <button 
        aria-expanded="false" 
        aria-controls="mobile-menu"
        aria-label="Apri menu mobile"
    >
        Menu
    </button>
</nav>

<!-- Form validation -->
<input 
    type="email" 
    aria-invalid="false"
    aria-describedby="email-error"
>
<div id="email-error" role="alert" class="hidden">
    Inserisci un indirizzo email valido
</div>
```

### Focus Management
```css
/* Visible focus indicators */
button:focus,
a:focus,
input:focus {
    outline: 2px solid var(--primary) !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.25) !important;
}

/* Skip links */
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

.focus\:not-sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: inherit;
    margin: inherit;
    overflow: visible;
    clip: auto;
    white-space: normal;
}
```

## 🔧 Performance Standards

### CSS Optimization
- Use CSS custom properties for consistent values
- Minimize specificity conflicts
- Group related properties together
- Use efficient selectors (avoid deep nesting)

### JavaScript Optimization
- Use event delegation for dynamic content
- Debounce scroll and resize handlers
- Lazy load non-critical resources
- Minimize DOM queries

### Image Optimization
- Use appropriate formats (WebP, AVIF when supported)
- Include alt text for all images
- Implement lazy loading for below-the-fold images
- Provide multiple sizes for responsive images

## 📊 Analytics & Tracking

### Event Tracking
```javascript
// Consistent event tracking
function trackInteraction(action, label, value = null) {
    if (typeof gtag !== 'undefined') {
        const eventData = {
            event_category: 'engagement',
            event_label: label,
            page_location: window.location.href
        };
        
        if (value) {
            eventData.value = value;
        }
        
        gtag('event', action, eventData);
    }
}

// Usage examples
trackInteraction('phone_call', 'header-cta');
trackInteraction('form_submit', 'contact-form');
trackInteraction('scroll_depth', '50%');
```

## 🧪 Testing Standards

### Manual Testing Checklist
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness on various screen sizes
- [ ] Keyboard navigation functionality
- [ ] Screen reader compatibility
- [ ] Form validation and error handling
- [ ] Performance (page load under 3 seconds)
- [ ] Analytics tracking verification

### Code Quality
- Use consistent indentation (2 spaces)
- Add comments for complex logic
- Follow DRY (Don't Repeat Yourself) principles
- Validate HTML, CSS, and JavaScript
- Test with real content, not just Lorem Ipsum

## 📚 Documentation Requirements

### Component Documentation
Each component should include:
- Purpose and usage description
- Required and optional parameters
- Example implementation
- Browser support notes
- Accessibility considerations

### Code Comments
```javascript
/**
 * Submits contact form data to the API
 * @param {Object} formData - Form data object
 * @param {HTMLElement} submitBtn - Submit button element
 * @param {string} originalText - Original button text
 * @param {HTMLFormElement} form - Form element
 * @returns {Promise} - Promise resolving to API response
 */
async function submitForm(formData, submitBtn, originalText, form) {
    // Implementation
}
```

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Review Cycle**: Quarterly
