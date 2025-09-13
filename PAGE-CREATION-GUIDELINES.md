# IT-ERA Page Creation Guidelines

## 📋 Complete Standardized Rules for Creating New Pages

**Version:** 2.0  
**Last Updated:** September 13, 2025  
**Status:** ✅ Production Ready  

---

## 🗂️ 1. File Naming Conventions

### **Directory Structure Standards**
```
IT-ERA/
├── index.html                    # Homepage (root level)
├── servizi.html                  # Core pages (root level)
├── contatti.html                 # Core pages (root level)
├── settori/                      # Sector-specific pages
│   ├── commercialisti.html       # kebab-case naming
│   ├── studi-medici.html         # kebab-case naming
│   └── pmi-startup.html          # kebab-case naming
├── landing/                      # Landing pages
│   ├── assistenza-emergenza.html # kebab-case naming
│   └── cloud-migration.html      # kebab-case naming
├── servizi/                      # Service detail pages
│   ├── index.html                # Service overview
│   ├── assistenza-tecnica/       # Subdirectory structure
│   └── cloud-computing/          # Subdirectory structure
├── zone/                         # Geographic pages
│   └── milano/                   # City-specific pages
└── blog/                         # Blog articles
    └── template-article.html     # Blog template
```

### **File Naming Rules**
- ✅ **Use kebab-case**: `assistenza-informatica.html`
- ✅ **Italian language**: Use Italian terms for URLs
- ✅ **SEO-friendly**: Include target keywords
- ✅ **Consistent extensions**: Always use `.html`
- ❌ **Avoid**: spaces, underscores, special characters
- ❌ **Avoid**: English terms in URLs (except technical terms)

### **Directory Organization**
- **Root Level**: Core pages (index, servizi, contatti)
- **settori/**: Industry-specific pages
- **landing/**: Marketing landing pages
- **servizi/**: Detailed service pages
- **zone/**: Geographic/city pages
- **blog/**: Content marketing articles

---

## 🏗️ 2. Required HTML Structure Template

### **Complete HTML5 Template**
```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- REQUIRED: Page Title (30-60 characters) -->
    <title>{{PAGE_TITLE}} - IT-ERA | {{CATEGORY}}</title>
    
    <!-- REQUIRED: Meta Description (120-160 characters) -->
    <meta name="description" content="{{META_DESCRIPTION}}">
    
    <!-- REQUIRED: Keywords (5-10 relevant keywords) -->
    <meta name="keywords" content="{{KEYWORDS}}, IT-ERA, assistenza informatica, Lombardia">
    
    <!-- REQUIRED: Open Graph Meta Tags -->
    <meta property="og:title" content="{{PAGE_TITLE}} - IT-ERA">
    <meta property="og:description" content="{{META_DESCRIPTION}}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://it-era.it/{{PAGE_URL}}">
    <meta property="og:image" content="https://it-era.it/images/og-{{PAGE_SLUG}}.jpg">
    <meta property="og:site_name" content="IT-ERA">
    <meta property="og:locale" content="it_IT">
    
    <!-- REQUIRED: Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{PAGE_TITLE}} - IT-ERA">
    <meta name="twitter:description" content="{{META_DESCRIPTION}}">
    <meta name="twitter:image" content="https://it-era.it/images/og-{{PAGE_SLUG}}.jpg">
    
    <!-- REQUIRED: Canonical URL -->
    <link rel="canonical" href="https://it-era.it/{{PAGE_URL}}">
    
    <!-- REQUIRED: Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    
    <!-- REQUIRED: CSS Includes -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/css/tailwind-config.js"></script>
    <link rel="stylesheet" href="/css/it-era-tailwind.css">
    
    <!-- REQUIRED: Components CSS -->
    <link rel="stylesheet" href="/css/components-separated.css">
    
    <!-- REQUIRED: Components Loader -->
    <script src="/js/components-loader.js"></script>
    
    <!-- REQUIRED: Analytics -->
    <script src="/js/analytics-tracking.js"></script>
    
    <!-- REQUIRED: Structured Data (Schema.org) -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "{{SCHEMA_TYPE}}",
        "name": "{{PAGE_TITLE}}",
        "description": "{{META_DESCRIPTION}}",
        "provider": {
            "@type": "LocalBusiness",
            "name": "IT-ERA",
            "url": "https://it-era.it/",
            "telephone": "+39-039-888-2041",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Vimercate",
                "addressRegion": "Lombardia",
                "addressCountry": "IT"
            }
        },
        "areaServed": {"@type": "State", "name": "Lombardia"}
    }
    </script>
</head>
<body>
    <!-- REQUIRED: Skip Link for Accessibility -->
    <a href="#main-content" class="skip-link">
        Skip to main content
    </a>

    <!-- REQUIRED: Header Component Placeholder -->
    <div id="header-placeholder">
        <!-- Loading fallback -->
        <div class="h-20 bg-white border-b border-neutral-200 flex items-center justify-center">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span class="text-white font-bold text-sm">IT</span>
                </div>
                <div class="text-neutral-500">Loading navigation...</div>
            </div>
        </div>
    </div>

    <!-- REQUIRED: Main Content with Semantic HTML -->
    <main id="main-content" role="main">
        <div class="pt-20">
            <!-- REQUIRED: H1 Tag (only one per page) -->
            <h1 class="text-4xl font-bold text-center mb-12">{{PAGE_TITLE}}</h1>
            
            <!-- Page content goes here -->
            {{CONTENT}}
        </div>
    </main>

    <!-- REQUIRED: Footer Component Placeholder -->
    <div id="footer-placeholder">
        <!-- Loading fallback -->
        <footer class="bg-neutral-900 text-white py-8">
            <div class="max-w-7xl mx-auto px-6 lg:px-8 text-center">
                <p class="text-neutral-400">Footer loading...</p>
            </div>
        </footer>
    </div>

    <!-- REQUIRED: Chatbot Component Placeholder -->
    <div id="chatbot-placeholder">
        <!-- Chatbot will be loaded dynamically -->
    </div>

    <!-- REQUIRED: Page-specific JavaScript -->
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Page-specific functionality here
        console.log('✅ {{PAGE_NAME}} loaded successfully');
    });
    </script>
</body>
</html>
```

---

## 🧭 3. Navigation Integration Requirements

### **Component System Integration**
- ✅ **REQUIRED**: Use `#header-placeholder` for navigation
- ✅ **REQUIRED**: Include `components-loader.js` script
- ✅ **REQUIRED**: Include `components-separated.css` stylesheet
- ✅ **REQUIRED**: Provide loading fallback in placeholder

### **Breadcrumb Implementation**
```html
<!-- Add after header placeholder for non-root pages -->
<nav aria-label="Breadcrumb" class="bg-neutral-50 py-3">
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <ol class="flex items-center space-x-2 text-sm">
            <li><a href="/" class="text-neutral-600 hover:text-brand-600">Home</a></li>
            <li class="text-neutral-400">/</li>
            <li><a href="/{{PARENT_URL}}" class="text-neutral-600 hover:text-brand-600">{{PARENT_NAME}}</a></li>
            <li class="text-neutral-400">/</li>
            <li class="text-neutral-900 font-medium" aria-current="page">{{CURRENT_PAGE}}</li>
        </ol>
    </div>
</nav>
```

### **Mobile Navigation Requirements**
- ✅ Mobile menu handled by components system
- ✅ Touch-friendly navigation elements
- ✅ Proper ARIA labels for accessibility
- ✅ Keyboard navigation support

---

## 🎨 4. CSS/JS Inclusion Standards

### **Required CSS Files (in order)**
```html
<!-- 1. Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- 2. Tailwind Configuration -->
<script src="/css/tailwind-config.js"></script>

<!-- 3. IT-ERA Custom Styles -->
<link rel="stylesheet" href="/css/it-era-tailwind.css">

<!-- 4. Components Styles -->
<link rel="stylesheet" href="/css/components-separated.css">
```

### **Required JavaScript Files (in order)**
```html
<!-- 1. Components Loader (in head) -->
<script src="/js/components-loader.js"></script>

<!-- 2. Analytics Tracking (in head) -->
<script src="/js/analytics-tracking.js"></script>

<!-- 3. Page-specific JS (before closing body) -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Page initialization code
});
</script>
```

### **Performance Optimization**
- ✅ Use CDN for external libraries
- ✅ Minimize custom CSS/JS
- ✅ Implement lazy loading for images
- ✅ Use modern JavaScript (ES6+)
- ✅ Optimize for Core Web Vitals

---

## 🔍 5. SEO Optimization Checklist

### **Meta Tags Requirements**
- ✅ **Title**: 30-60 characters, include "IT-ERA"
- ✅ **Description**: 120-160 characters, compelling copy
- ✅ **Keywords**: 5-10 relevant terms + "IT-ERA, Lombardia"
- ✅ **Canonical URL**: Always include
- ✅ **Open Graph**: Complete implementation
- ✅ **Twitter Cards**: Summary with large image

### **Content Optimization**
- ✅ **H1 Tag**: One per page, descriptive
- ✅ **H2-H6**: Proper hierarchy
- ✅ **Alt Text**: All images must have descriptive alt attributes
- ✅ **Internal Links**: Link to relevant pages
- ✅ **Keywords**: Natural integration in content

### **Structured Data Requirements**
```json
{
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Page Title",
    "description": "Page description",
    "provider": {
        "@type": "LocalBusiness",
        "name": "IT-ERA",
        "telephone": "+39-039-888-2041",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Vimercate",
            "addressRegion": "Lombardia",
            "addressCountry": "IT"
        }
    }
}
```

### **Local SEO Requirements**
- ✅ Include Lombardy region keywords
- ✅ Mention specific cities (Milano, Bergamo, etc.)
- ✅ Include contact information (039 888 2041)
- ✅ Use LocalBusiness schema markup

---

## 🧩 6. Component System Usage Rules

### **Required Placeholders**
```html
<!-- Header (REQUIRED) -->
<div id="header-placeholder">
    <!-- Loading fallback required -->
</div>

<!-- Footer (REQUIRED) -->
<div id="footer-placeholder">
    <!-- Loading fallback required -->
</div>

<!-- Chatbot (REQUIRED) -->
<div id="chatbot-placeholder">
    <!-- No fallback needed -->
</div>
```

### **ITERAComponents Integration**
- ✅ Components load automatically via `components-loader.js`
- ✅ Path resolution handles subdirectories automatically
- ✅ Mobile menu functionality included
- ✅ Chatbot functionality included

### **Custom Components**
```javascript
// Register custom components if needed
componentLoader.registerComponent('custom-component', {
    selector: '#custom-placeholder',
    templatePath: 'components/custom.html',
    cssPath: 'css/custom.css',
    jsPath: 'js/custom.js'
});
```

---

## ✅ 7. Pre-Deployment Testing Requirements

### **HTML Validation**
```bash
# Validate HTML structure
htmlhint --config .htmlhintrc your-page.html

# Check for required elements
grep -q "<title>" your-page.html
grep -q 'name="description"' your-page.html
grep -q 'rel="canonical"' your-page.html
```

### **SEO Validation**
```bash
# Run SEO checker
python seo_validator.py your-page.html

# Check Lighthouse scores
lighthouse your-page.html --output json
```

### **Accessibility Testing**
- ✅ **WCAG 2.1 AA Compliance**: Use axe-core or similar
- ✅ **Keyboard Navigation**: Tab through all interactive elements
- ✅ **Screen Reader**: Test with NVDA or similar
- ✅ **Color Contrast**: Minimum 4.5:1 ratio

### **Cross-Browser Testing**
- ✅ **Chrome**: Latest version
- ✅ **Firefox**: Latest version
- ✅ **Safari**: Latest version
- ✅ **Edge**: Latest version

### **Mobile Responsiveness**
- ✅ **375px**: Mobile portrait
- ✅ **768px**: Tablet portrait
- ✅ **1024px**: Tablet landscape
- ✅ **1920px**: Desktop

### **Performance Testing**
- ✅ **Lighthouse Score**: >90 for all categories
- ✅ **Core Web Vitals**: Pass all metrics
- ✅ **Page Load Speed**: <3 seconds
- ✅ **Image Optimization**: WebP format preferred

---

## 📝 Quick Checklist for New Pages

### **Before Creating**
- [ ] Choose appropriate directory structure
- [ ] Define target keywords and meta description
- [ ] Plan content hierarchy (H1, H2, H3)
- [ ] Prepare optimized images with alt text

### **During Creation**
- [ ] Use the HTML template above
- [ ] Fill in all required meta tags
- [ ] Implement proper semantic HTML
- [ ] Add structured data markup
- [ ] Include component placeholders

### **Before Deployment**
- [ ] Validate HTML structure
- [ ] Test component loading
- [ ] Check mobile responsiveness
- [ ] Verify SEO elements
- [ ] Test accessibility features
- [ ] Run Lighthouse audit

### **After Deployment**
- [ ] Submit to Google Search Console
- [ ] Update sitemap.xml
- [ ] Monitor Core Web Vitals
- [ ] Check for 404 errors

---

**✅ Following these guidelines ensures consistent, professional, and SEO-optimized pages that integrate seamlessly with the IT-ERA website architecture.**
