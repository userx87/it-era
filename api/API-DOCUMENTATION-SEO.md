# 🚀 IT-ERA Blog API - Documentazione Completa SEO

## 📍 **Endpoint API**
**Base URL**: `https://it-era-blog-api.bulltech.workers.dev`

---

## 🔍 **Campi SEO Supportati**

### ✅ **Campi Obbligatori**
- `title` - Titolo articolo principale
- `slug` - URL slug (es: "vpn-aziendale-guida-completa")
- `content` - Contenuto HTML dell'articolo

### 🎯 **Campi SEO Essenziali**
- `seo_title` - **SEO Title ottimizzato** (max 60 caratteri)
- `meta_description` - **Meta Description** per SERP (max 160 caratteri)  
- `focus_keyword` - **Focus Keyword principale** per ottimizzazione SEO

### 📝 **Campi Opzionali**
- `excerpt` - Riassunto breve articolo
- `author` - Autore (default: "IT-ERA Team")
- `category` - Categoria articolo
- `tags` - Array di tag
- `featured_image` - URL immagine in evidenza

---

## 🌐 **Endpoints Disponibili**

### 1️⃣ **Health Check**
```bash
curl https://it-era-blog-api.bulltech.workers.dev/health
```

**Response:**
```json
{
  "status": "OK",
  "service": "IT-ERA Blog API",
  "timestamp": "2025-08-24T16:37:16.926Z",
  "version": "1.0.0"
}
```

### 2️⃣ **Creare Articolo (POST)**
```bash
curl -X POST https://it-era-blog-api.bulltech.workers.dev/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Titolo Principale Articolo",
    "seo_title": "SEO Title Ottimizzato Max 60 Char | IT-ERA",
    "slug": "url-slug-articolo-seo-friendly",
    "content": "<h2>Contenuto HTML</h2><p>Testo articolo con <strong>parole chiave</strong>...</p>",
    "excerpt": "Riassunto breve e accattivante dell articolo",
    "meta_description": "Meta description per Google SERP, max 160 caratteri con focus keyword",
    "focus_keyword": "parola chiave principale",
    "author": "IT-ERA Expert Team",
    "category": "Categoria Articolo",
    "tags": ["tag1", "tag2", "focus-keyword"],
    "featured_image": "/images/blog/nome-immagine.jpg"
  }'
```

### 3️⃣ **Lista Articoli (GET)**
```bash
curl https://it-era-blog-api.bulltech.workers.dev/api/posts
```

---

## ✅ **Response API Completa**

### **Successo (201 Created):**
```json
{
  "success": true,
  "message": "Articolo creato con successo",
  "article": {
    "title": "Titolo Principale",
    "seo_title": "SEO Title Ottimizzato",
    "slug": "url-slug-seo",
    "url": "https://it-era.it/blog/url-slug-seo.html",
    "published_date": "2025-08-24",
    "category": "Categoria",
    "tags": ["tag1", "tag2"],
    "author": "IT-ERA Team",
    "focus_keyword": "keyword principale",
    "meta_description": "Meta description ottimizzata",
    "status": "published"
  },
  "seo": {
    "title_length": 45,
    "description_length": 148,
    "focus_keyword": "keyword principale",
    "warnings": []
  },
  "html_preview": "<!DOCTYPE html>..."
}
```

### **Errore Validazione (400):**
```json
{
  "success": false,
  "error": "Missing required fields",
  "required": ["title", "slug", "content"],
  "optional_seo": ["seo_title", "meta_description", "focus_keyword"],
  "received": ["title", "content"]
}
```

---

## 🔧 **SEO Features Integrate**

### **HTML Generato Include:**

✅ **Meta Tags SEO**
- `<title>` ottimizzato con seo_title
- `<meta name="description">` con meta_description
- `<meta name="keywords">` con focus_keyword + tags
- `<meta name="focus-keyword">` custom per tracking
- `<link rel="canonical">` URL canonico

✅ **Open Graph**  
- og:title, og:description, og:image
- og:type="article", og:site_name
- og:url canonico

✅ **Twitter Cards**
- twitter:card, twitter:title
- twitter:description, twitter:image

✅ **Article Meta**
- article:author, article:published_time
- article:section (categoria)
- article:tag (per ogni tag)

✅ **Structured Data (JSON-LD)**
```json
{
  "@context": "https://schema.org",
  "@type": "Article", 
  "headline": "SEO Title",
  "alternativeHeadline": "Title normale",
  "description": "Meta description",
  "keywords": "focus_keyword, tag1, tag2",
  "about": "focus_keyword",
  "wordCount": 847,
  "inLanguage": "it-IT"
}
```

---

## ⚠️ **Validazioni SEO Automatiche**

L'API esegue controlli automatici e restituisce warning:

- ❌ `seo_title mancante` → Usa title normale
- ❌ `meta_description mancante` → Usa excerpt o title
- ❌ `focus_keyword mancante` → SEO non ottimizzato
- ❌ `seo_title troppo lungo` → Max 60 caratteri
- ❌ `meta_description troppo lunga` → Max 160 caratteri

---

## 🎯 **Esempi Pratici n8n**

### **Esempio 1: Articolo SEO Completo**
```json
{
  "title": "Firewall Next Generation: Guida 2024",
  "seo_title": "Firewall Next Gen 2024: Sicurezza Avanzata PMI | IT-ERA",
  "slug": "firewall-next-generation-guida-2024",
  "focus_keyword": "firewall next generation",
  "meta_description": "Firewall Next Generation 2024: caratteristiche avanzate, configurazione per PMI e confronto soluzioni. Guida completa IT-ERA per sicurezza aziendale.",
  "category": "Sicurezza",
  "tags": ["firewall", "sicurezza", "next generation", "UTM", "threat protection"]
}
```

### **Esempio 2: Articolo Cloud**
```json
{
  "title": "Microsoft 365 vs Google Workspace: Confronto",
  "seo_title": "Microsoft 365 vs Google Workspace 2024 | Confronto IT-ERA", 
  "slug": "microsoft-365-vs-google-workspace-confronto",
  "focus_keyword": "Microsoft 365 vs Google Workspace",
  "meta_description": "Microsoft 365 vs Google Workspace: confronto dettagliato 2024 con prezzi, funzionalità e raccomandazioni per PMI. Analisi completa IT-ERA.",
  "category": "Cloud",
  "tags": ["Microsoft 365", "Google Workspace", "cloud", "produttività", "confronto"]
}
```

---

## 📊 **Metriche SEO Tracciate**

La response include sezione `seo` con:
- **title_length**: Lunghezza SEO title
- **description_length**: Lunghezza meta description  
- **focus_keyword**: Keyword tracciata
- **warnings**: Array warning SEO automatici

---

## 🚀 **Deploy e Testing**

**API Live**: ✅ `https://it-era-blog-api.bulltech.workers.dev`
**Admin Panel**: 📍 `/api/blog/public/admin/index.html`
**Test Health**: `curl https://it-era-blog-api.bulltech.workers.dev/health`

---

## 📝 **Note Implementazione n8n**

1. **Webhook URL**: Usa endpoint POST `/api/posts`
2. **Headers**: `Content-Type: application/json`  
3. **Focus Keyword**: Sempre includere per SEO ottimale
4. **SEO Title**: Max 60 caratteri, include keyword
5. **Meta Description**: Max 160 caratteri, call-to-action
6. **Slug**: Minuscolo, separato da trattini, include keyword

L'API è **production-ready** e ottimizzata per SEO! 🎉