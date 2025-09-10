# 🎨 IT-ERA DESIGN SYSTEM 2.0

## 🏢 **BRAND IDENTITY**

### **🎯 Brand Positioning:**
"Il partner tecnologico che trasforma le sfide IT in opportunità di crescita"

### **💡 Brand Values:**
- **Innovazione** - Soluzioni all'avanguardia
- **Affidabilità** - Supporto 24/7 garantito  
- **Competenza** - Expertise certificata
- **Vicinanza** - Presenza locale Lombardia

## 🎨 **COLOR PALETTE**

### **🔵 Primary Colors:**
```css
--it-blue-900: #0A1628    /* Deep Tech Blue */
--it-blue-800: #1E3A8A    /* Professional Blue */
--it-blue-600: #2563EB    /* Primary Blue */
--it-blue-400: #60A5FA    /* Light Blue */
--it-blue-100: #DBEAFE    /* Subtle Blue */
```

### **🟢 Secondary Colors:**
```css
--it-green-600: #059669   /* Success Green */
--it-green-400: #34D399   /* Accent Green */
--it-orange-500: #F59E0B  /* Warning Orange */
--it-red-500: #EF4444     /* Error Red */
```

### **⚫ Neutral Colors:**
```css
--it-gray-900: #111827    /* Dark Text */
--it-gray-700: #374151    /* Medium Text */
--it-gray-500: #6B7280    /* Light Text */
--it-gray-300: #D1D5DB    /* Border */
--it-gray-100: #F3F4F6    /* Background */
--it-white: #FFFFFF       /* Pure White */
```

## 📝 **TYPOGRAPHY**

### **🔤 Font Stack:**
```css
/* Primary Font - Headings */
font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;

/* Secondary Font - Body */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace Font - Code */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### **📏 Type Scale:**
```css
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */
```

## 🎭 **VISUAL ELEMENTS**

### **🔲 Spacing System:**
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-24: 6rem;     /* 96px */
```

### **🔘 Border Radius:**
```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;  /* Circle */
```

### **🌟 Shadows:**
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

## 🎬 **ANIMATIONS**

### **⚡ Transitions:**
```css
--transition-fast: 150ms ease-in-out;
--transition-base: 300ms ease-in-out;
--transition-slow: 500ms ease-in-out;
```

### **🎪 Keyframes:**
```css
/* Fade In Up */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Bounce */
@keyframes bounce {
  0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
  40%, 43% { transform: translateY(-30px); }
  70% { transform: translateY(-15px); }
}
```

## 🧩 **COMPONENT PATTERNS**

### **🔘 Buttons:**
- **Primary:** Blue gradient con hover effect
- **Secondary:** Outline blu con fill hover
- **Ghost:** Trasparente con hover background
- **Danger:** Rosso per azioni distruttive

### **📋 Cards:**
- **Elevation:** Shadow progressive
- **Hover:** Lift effect con shadow increase
- **Border:** Subtle border radius
- **Content:** Padding consistente

### **📱 Navigation:**
- **Desktop:** Horizontal con dropdown
- **Mobile:** Hamburger menu slide-in
- **Active:** Indicator blu
- **Hover:** Smooth color transition

## 🎯 **ICONOGRAPHY**

### **📦 Icon Library:**
- **Heroicons** - Interface icons
- **Lucide** - Feature icons  
- **Phosphor** - Brand icons
- **Custom IT-ERA** - Logo variations

### **📏 Icon Sizes:**
```css
--icon-xs: 16px;
--icon-sm: 20px;
--icon-md: 24px;
--icon-lg: 32px;
--icon-xl: 48px;
```

## 📱 **RESPONSIVE BREAKPOINTS**

```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Medium devices */
--breakpoint-lg: 1024px;  /* Large devices */
--breakpoint-xl: 1280px;  /* Extra large */
--breakpoint-2xl: 1536px; /* 2X Extra large */
```

## 🎨 **DESIGN TOKENS**

### **🎭 Theme Modes:**
```css
/* Light Mode (Default) */
[data-theme="light"] {
  --bg-primary: var(--it-white);
  --bg-secondary: var(--it-gray-100);
  --text-primary: var(--it-gray-900);
  --text-secondary: var(--it-gray-700);
}

/* Dark Mode */
[data-theme="dark"] {
  --bg-primary: var(--it-gray-900);
  --bg-secondary: var(--it-gray-800);
  --text-primary: var(--it-white);
  --text-secondary: var(--it-gray-300);
}
```

## 🏆 **BRAND APPLICATIONS**

### **📧 Email Signatures:**
- Logo IT-ERA + contact info
- Brand colors consistency
- Professional layout

### **📄 Documents:**
- Letterhead template
- Proposal template
- Invoice template

### **🎯 Marketing Materials:**
- Business cards
- Brochures
- Social media templates
