# IT-ERA Design System Documentation

## 🎨 Overview

The IT-ERA Design System ensures consistent visual identity, user experience, and code quality across all digital touchpoints. This system is built for scalability, accessibility, and maintainability.

## 🎯 Design Principles

### 1. **Professional Trust**
- Clean, modern aesthetics that inspire confidence
- Consistent use of corporate colors and typography
- Professional imagery and iconography

### 2. **Accessibility First**
- WCAG 2.1 AA compliance
- High contrast ratios (minimum 4.5:1)
- Keyboard navigation support
- Screen reader compatibility

### 3. **Performance Optimized**
- Mobile-first responsive design
- Optimized loading times
- Progressive enhancement
- Efficient CSS and JavaScript

### 4. **User-Centric**
- Clear information hierarchy
- Intuitive navigation patterns
- Prominent call-to-actions
- Emergency contact visibility

## 🎨 Color Palette

### Primary Colors
```css
:root {
    --primary: #1e40af;        /* IT-ERA Blue - Main brand color */
    --primary-light: #3b82f6;  /* Lighter blue for hover states */
    --primary-dark: #1e3a8a;   /* Darker blue for depth */
}
```

### Secondary Colors
```css
:root {
    --secondary: #059669;      /* Success green */
    --accent: #dc2626;         /* Emergency red */
    --warning: #f59e0b;        /* Warning amber */
    --success: #10b981;        /* Confirmation green */
}
```

### Neutral Colors
```css
:root {
    --gray-900: #111827;       /* Primary text */
    --gray-800: #1f2937;       /* Secondary text */
    --gray-700: #374151;       /* Tertiary text */
    --gray-600: #4b5563;       /* Muted text */
    --gray-500: #6b7280;       /* Placeholder text */
    --gray-400: #9ca3af;       /* Disabled text */
    --gray-300: #d1d5db;       /* Borders */
    --gray-200: #e5e7eb;       /* Light borders */
    --gray-100: #f3f4f6;       /* Background */
    --gray-50: #f9fafb;        /* Light background */
    --white: #ffffff;          /* Pure white */
}
```

### Accent Colors
```css
:root {
    --yellow: #fbbf24;         /* Highlight color */
    --blue-light: #60a5fa;     /* Info blue */
    --green-light: #34d399;    /* Success light */
    --red-light: #f87171;      /* Error light */
}
```

## 📝 Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Font Weights
- **Light**: 300 - For large headings and subtle text
- **Regular**: 400 - Body text and standard content
- **Medium**: 500 - Subheadings and emphasis
- **Semibold**: 600 - Important labels and buttons
- **Bold**: 700 - Section headings
- **Extrabold**: 800 - Major headings
- **Black**: 900 - Hero titles and impact text

### Typography Scale
```css
/* Headings */
.text-6xl { font-size: 3.75rem; line-height: 1; }      /* Hero titles */
.text-5xl { font-size: 3rem; line-height: 1; }         /* Page titles */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; } /* Section titles */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; } /* Subsection titles */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }    /* Card titles */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; } /* Large text */

/* Body text */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; } /* Large body */
.text-base { font-size: 1rem; line-height: 1.5rem; }    /* Standard body */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; } /* Small text */
.text-xs { font-size: 0.75rem; line-height: 1rem; }     /* Captions */
```

## 🔲 Spacing System

### Spacing Scale
```css
:root {
    --spacing-xs: 0.25rem;     /* 4px */
    --spacing-sm: 0.5rem;      /* 8px */
    --spacing-md: 1rem;        /* 16px */
    --spacing-lg: 1.5rem;      /* 24px */
    --spacing-xl: 3rem;        /* 48px */
    --spacing-xxl: 4.5rem;     /* 72px */
}
```

### Usage Guidelines
- **xs (4px)**: Icon spacing, fine adjustments
- **sm (8px)**: Element spacing, small gaps
- **md (16px)**: Standard spacing, paragraph margins
- **lg (24px)**: Section spacing, card padding
- **xl (48px)**: Large section spacing
- **xxl (72px)**: Major section separation

## 🎯 Component Guidelines

### Buttons

#### Primary Button
```css
.btn-primary {
    background: var(--accent);
    color: var(--white);
    padding: 1rem 2rem;
    border-radius: 9999px;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);
}

.btn-primary:hover {
    background: var(--accent-light);
    transform: translateY(-2px);
    box-shadow: 0 15px 35px rgba(220, 38, 38, 0.4);
}
```

#### Secondary Button
```css
.btn-secondary {
    background: var(--white);
    color: var(--primary);
    border: 2px solid var(--primary);
    padding: 1rem 2rem;
    border-radius: 9999px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.btn-secondary:hover {
    background: var(--primary);
    color: var(--white);
}
```

### Cards

#### Standard Card
```css
.card {
    background: var(--white);
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
}

.card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}
```

#### Pricing Card
```css
.pricing-card {
    background: var(--white);
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border: 2px solid transparent;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.pricing-card.featured {
    border-color: var(--primary);
    transform: scale(1.05);
    position: relative;
}

.pricing-card.featured::before {
    content: 'PIÙ POPOLARE';
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--primary);
    color: var(--white);
    padding: 0.5rem 1.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
}
```

### Forms

#### Input Fields
```css
.form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid var(--gray-300);
    background: var(--white);
    color: var(--gray-900);
    transition: all 0.3s ease;
}

.form-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.25);
}

.form-input.error {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25);
}
```

#### Labels
```css
.form-label {
    display: block;
    font-weight: 500;
    color: var(--gray-700);
    margin-bottom: 0.5rem;
}
```

## 🎭 Animation Guidelines

### Transitions
```css
:root {
    --transition-fast: 0.15s ease-in-out;
    --transition-base: 0.3s ease-in-out;
    --transition-slow: 0.5s ease-in-out;
}
```

### Hover Effects
- **Buttons**: Scale(1.05) + shadow increase
- **Cards**: TranslateY(-8px) + shadow increase
- **Links**: Color transition + underline animation

### Loading States
```css
.loading-spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
```

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
/* xs: 0px - 639px (default) */
/* sm: 640px and up */
@media (min-width: 640px) { /* Tablet */ }

/* md: 768px and up */
@media (min-width: 768px) { /* Small desktop */ }

/* lg: 1024px and up */
@media (min-width: 1024px) { /* Desktop */ }

/* xl: 1280px and up */
@media (min-width: 1280px) { /* Large desktop */ }

/* 2xl: 1536px and up */
@media (min-width: 1536px) { /* Extra large desktop */ }
```

## 🎯 Layout Patterns

### Container
```css
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

@media (min-width: 640px) { 
    .container { padding: 0 1.5rem; } 
}

@media (min-width: 1024px) { 
    .container { padding: 0 2rem; } 
}
```

### Grid Systems
```css
/* Standard 3-column grid */
.grid-3 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

/* Responsive grid */
.grid-responsive {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
}

@media (min-width: 768px) {
    .grid-responsive {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 1024px) {
    .grid-responsive {
        grid-template-columns: repeat(3, 1fr);
    }
}
```

## ♿ Accessibility Standards

### Focus Management
```css
/* Focus indicators */
button:focus,
a:focus,
input:focus,
textarea:focus,
select:focus {
    outline: 2px solid var(--primary) !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.25) !important;
}
```

### Screen Reader Support
```css
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

### Color Contrast
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 contrast ratio

## 🔧 Implementation Guidelines

### CSS Architecture
1. **Critical CSS**: Inline above-the-fold styles
2. **Component CSS**: Modular, reusable styles
3. **Utility CSS**: Tailwind-based utility classes
4. **Custom CSS**: Brand-specific overrides

### JavaScript Patterns
1. **Progressive Enhancement**: Core functionality without JS
2. **Event Delegation**: Efficient event handling
3. **Error Handling**: Graceful degradation
4. **Performance**: Debounced scroll/resize handlers

### File Organization
```
templates/
├── design-system/
│   ├── README.md              # This documentation
│   ├── colors.css             # Color variables
│   ├── typography.css         # Font definitions
│   ├── components.css         # Component styles
│   └── utilities.css          # Utility classes
├── css/
│   └── [page-name].css        # Page-specific styles
├── js/
│   └── [page-name].js         # Page-specific scripts
└── components/
    ├── navigation.html        # Reusable navigation
    ├── footer.html            # Reusable footer
    └── forms.html             # Form components
```

## 📋 Quality Checklist

### Before Publishing
- [ ] Color contrast meets WCAG AA standards
- [ ] All interactive elements are keyboard accessible
- [ ] Forms have proper labels and error handling
- [ ] Images have descriptive alt text
- [ ] Page loads in under 3 seconds
- [ ] Mobile responsive on all breakpoints
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Analytics tracking implemented
- [ ] SEO meta tags optimized

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintained by**: IT-ERA Development Team
