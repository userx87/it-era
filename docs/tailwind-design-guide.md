# 🎨 IT-ERA Tailwind Design Guide

## 📋 **DESIGN SYSTEM PROFESSIONALE**

### 🎨 **COLORI BRAND IT-ERA**
```css
/* Colori Primari */
--color-primary: #1e40af;     /* blue-800 */
--color-secondary: #3b82f6;   /* blue-500 */
--color-accent: #06b6d4;      /* cyan-500 */
--color-success: #10b981;     /* emerald-500 */

/* Colori Neutri */
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-600: #4b5563;
--color-gray-900: #111827;
```

### 📝 **TYPOGRAPHY SCALE**
```css
/* Font Families */
font-sans: Inter, system-ui, sans-serif
font-mono: 'JetBrains Mono', monospace

/* Text Sizes */
text-xs: 0.75rem     /* 12px */
text-sm: 0.875rem    /* 14px */
text-base: 1rem      /* 16px */
text-lg: 1.125rem    /* 18px */
text-xl: 1.25rem     /* 20px */
text-2xl: 1.5rem     /* 24px */
text-3xl: 1.875rem   /* 30px */
text-4xl: 2.25rem    /* 36px */
text-5xl: 3rem       /* 48px */
```

### 📐 **SPACING SYSTEM**
```css
/* Spacing Scale (rem) */
0: 0
1: 0.25rem    /* 4px */
2: 0.5rem     /* 8px */
3: 0.75rem    /* 12px */
4: 1rem       /* 16px */
6: 1.5rem     /* 24px */
8: 2rem       /* 32px */
12: 3rem      /* 48px */
16: 4rem      /* 64px */
20: 5rem      /* 80px */
24: 6rem      /* 96px */
```

### 🎯 **COMPONENTI STANDARD IT-ERA**

#### **1. HERO SECTION**
```html
<section class="bg-gradient-to-br from-blue-800 to-blue-500 text-white py-20">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center">
      <h1 class="text-4xl lg:text-6xl font-bold mb-6">
        Titolo Principale
        <span class="text-yellow-300">Evidenziato</span>
      </h1>
      <p class="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
        Sottotitolo descrittivo professionale
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="tel:+390398882041" class="btn-primary">
          📞 Chiama Ora
        </a>
        <a href="#contact" class="btn-secondary">
          💼 Preventivo Gratuito
        </a>
      </div>
    </div>
  </div>
</section>
```

#### **2. BUTTONS**
```html
<!-- Primary Button -->
<a class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
  Azione Primaria
</a>

<!-- Secondary Button -->
<a class="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-800 transition-all duration-300">
  Azione Secondaria
</a>
```

#### **3. CARDS**
```html
<div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
  <div class="w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-500 rounded-lg flex items-center justify-center mb-4">
    <i class="fas fa-icon text-white"></i>
  </div>
  <h3 class="text-xl font-semibold text-gray-900 mb-3">Titolo Card</h3>
  <p class="text-gray-600 mb-4">Descrizione del servizio o contenuto</p>
  <ul class="space-y-2">
    <li class="flex items-center text-sm text-gray-700">
      <i class="fas fa-check text-emerald-500 mr-2"></i>
      Beneficio 1
    </li>
  </ul>
</div>
```

#### **4. FORM PROFESSIONALE**
```html
<form class="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Campo Richiesto *
      </label>
      <input type="text" required 
             class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
    </div>
  </div>
  
  <button type="submit" 
          class="w-full mt-6 bg-gradient-to-r from-blue-800 to-blue-500 text-white font-semibold py-4 px-6 rounded-lg hover:shadow-lg transition-all duration-300">
    Invia Richiesta
  </button>
</form>
```

### 📱 **RESPONSIVE BREAKPOINTS**
```css
/* Mobile First Approach */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large */
2xl: 1536px /* 2X Extra large */
```

### 🎭 **UTILITY CLASSES COMUNI**

#### **Layout**
```css
/* Container */
max-w-7xl mx-auto px-6 lg:px-8

/* Grid */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8

/* Flex */
flex flex-col sm:flex-row items-center justify-between gap-4
```

#### **Typography**
```css
/* Headings */
text-3xl lg:text-4xl font-bold text-gray-900 mb-4

/* Body Text */
text-lg text-gray-600 leading-relaxed

/* Links */
text-blue-600 hover:text-blue-800 font-medium transition-colors
```

#### **Effects**
```css
/* Shadows */
shadow-lg hover:shadow-xl

/* Transitions */
transition-all duration-300

/* Transforms */
hover:-translate-y-2 hover:scale-105
```

### 🎨 **SEZIONI TIPO**

#### **Services Grid**
```html
<section class="py-16 bg-gray-50">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
        I Nostri Servizi
      </h2>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Soluzioni complete per la tua azienda
      </p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- Service Cards Here -->
    </div>
  </div>
</section>
```

#### **Contact Section**
```html
<section class="py-16 bg-blue-800 text-white">
  <div class="max-w-4xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-8">
      <h2 class="text-3xl lg:text-4xl font-bold mb-4">
        Richiedi Preventivo Gratuito
      </h2>
      <p class="text-xl text-blue-100">
        Compila il form per ricevere una consulenza personalizzata
      </p>
    </div>
    
    <!-- Form Here -->
  </div>
</section>
```

### ⚡ **PERFORMANCE TIPS**

1. **Usa classi utility invece di CSS custom**
2. **Mantieni consistenza con il design system**
3. **Usa hover states per interattività**
4. **Implementa mobile-first responsive**
5. **Ottimizza con purge CSS in produzione**

### 🎯 **TEMPLATE BASE**
```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagina IT-ERA</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="/css/tailwind-config.js"></script>
  <link rel="stylesheet" href="/css/it-era-tailwind.css">
  <link rel="stylesheet" href="/css/it-era-enhanced.css">
  
  <!-- Font Awesome -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-white font-sans">
  <!-- Header Placeholder -->
  <div id="header-placeholder"></div>
  
  <!-- Main Content -->
  <main>
    <!-- Content Here -->
  </main>
  
  <!-- Footer Placeholder -->
  <div id="footer-placeholder"></div>
  
  <!-- Scripts -->
  <script src="/js/components-loader.js"></script>
  <script src="/js/resend-integration.js"></script>
</body>
</html>
```

**🚀 QUESTA È LA GUIDA UFFICIALE PER CREARE PAGINE IT-ERA PROFESSIONALI!**
