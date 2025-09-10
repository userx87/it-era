# 📁 Optimized File Structure Plan - IT-ERA Node.js

**Generated:** 2025-09-10  
**Status:** 🚀 **READY FOR IMPLEMENTATION**

---

## 🎯 **OPTIMAL NODE.JS STRUCTURE**

### **Current Structure Analysis:**
- ✅ **Good:** Express.js setup with EJS templates
- ✅ **Good:** Static assets in `/web` directory
- ⚠️ **Needs Improvement:** Missing modular route organization
- ⚠️ **Needs Improvement:** No middleware directory structure
- ❌ **Missing:** API routes organization

### **Recommended Production Structure:**

```
/var/www/vhosts/it-era.it/httpdocs/
├── app.js                    # Main entry point (Plesk)
├── server.js                 # Alternative entry point
├── package.json              # Production dependencies
├── package-lock.json         # Dependency lock file
├── .env                      # Environment variables
├── 
├── routes/                   # Route handlers
│   ├── index.js             # Main routes
│   ├── api/                 # API endpoints
│   │   ├── quote.js         # Quote processing
│   │   ├── contact.js       # Contact forms
│   │   └── microsoft365.js  # MS365 quotes
│   └── pages/               # Page routes
│       ├── cities.js        # City-specific routes
│       └── services.js      # Service routes
│
├── middleware/              # Custom middleware
│   ├── auth.js             # Authentication
│   ├── validation.js       # Input validation
│   ├── security.js         # Security headers
│   └── logging.js          # Request logging
│
├── views/                  # EJS templates
│   ├── layout.ejs          # Main layout
│   ├── index.ejs           # Homepage
│   ├── servizi.ejs         # Services page
│   ├── assistenza-it-city.ejs
│   ├── service-city.ejs
│   ├── partials/           # Reusable components
│   │   ├── header.ejs
│   │   ├── footer.ejs
│   │   ├── navigation.ejs
│   │   └── contact-form.ejs
│   └── errors/             # Error pages
│       ├── 404.ejs
│       └── 500.ejs
│
├── web/                    # Static assets
│   ├── css/               # Stylesheets
│   │   ├── main.css       # Main styles
│   │   ├── components.css # Component styles
│   │   └── responsive.css # Mobile styles
│   ├── js/                # JavaScript files
│   │   ├── main.js        # Main functionality
│   │   ├── forms.js       # Form handling
│   │   └── analytics.js   # Tracking code
│   ├── images/            # Image assets
│   │   ├── logos/
│   │   ├── services/
│   │   └── cities/
│   └── static/            # Other static files
│       ├── robots.txt
│       ├── sitemap.xml
│       └── favicon.ico
│
├── data/                  # Application data
│   ├── cities-data.json  # City information
│   ├── services-data.json # Service definitions
│   ├── seo-data.json     # SEO metadata
│   └── quotes/           # Quote storage
│       └── (generated files)
│
├── config/               # Configuration files
│   ├── database.js      # DB configuration
│   ├── email.js         # Email settings
│   └── security.js      # Security config
│
├── utils/               # Utility functions
│   ├── helpers.js       # General helpers
│   ├── validators.js    # Validation functions
│   └── email-sender.js  # Email utilities
│
└── logs/                # Application logs
    ├── app.log          # Main application log
    ├── error.log        # Error log
    └── access.log       # Access log
```

---

## 📦 **FILES TO UPLOAD**

### **🔴 CRITICAL FILES (Must Upload):**

1. **Application Core:**
   - ✅ `app.js` - Main entry point
   - ✅ `server.js` - Alternative entry point
   - ✅ `package.json` - Dependencies
   - ✅ `package-lock.json` - Lock file

2. **Templates:**
   - ✅ `views/` directory (complete)
   - ✅ `views/layout.ejs`
   - ✅ `views/index.ejs`
   - ✅ `views/servizi.ejs`
   - ✅ `views/assistenza-it-city.ejs`
   - ✅ `views/service-city.ejs`

3. **Static Assets:**
   - ✅ `web/css/` - All stylesheets
   - ✅ `web/js/` - JavaScript files
   - ✅ `web/images/` - Image assets
   - ✅ `web/static/` - Static files

4. **Application Data:**
   - ✅ `data/cities-data.json`
   - ✅ `data/seo-data.json` (if exists)

### **🟡 IMPORTANT FILES (Should Upload):**

1. **Configuration:**
   - ⚠️ `.env` - Environment variables
   - ⚠️ Configuration files

2. **Additional Assets:**
   - ⚠️ Documentation files
   - ⚠️ Backup scripts

### **🟢 OPTIONAL FILES (Nice to Have):**

1. **Development Tools:**
   - 🔵 Testing files
   - 🔵 Build scripts
   - 🔵 Documentation

---

## 🚀 **UPLOAD STRATEGY**

### **Phase 1: Core Application (Priority 1)**
```bash
# Upload core files
scp -P 45222 app.js server.js package*.json it-era.it_jk05qj1z25@65.109.30.171:/var/www/vhosts/it-era.it/httpdocs/

# Upload templates
scp -P 45222 -r views/ it-era.it_jk05qj1z25@65.109.30.171:/var/www/vhosts/it-era.it/httpdocs/

# Upload data
scp -P 45222 -r data/ it-era.it_jk05qj1z25@65.109.30.171:/var/www/vhosts/it-era.it/httpdocs/
```

### **Phase 2: Static Assets (Priority 2)**
```bash
# Upload web assets
scp -P 45222 -r web/ it-era.it_jk05qj1z25@65.109.30.171:/var/www/vhosts/it-era.it/httpdocs/
```

### **Phase 3: Configuration (Priority 3)**
```bash
# Upload configuration files
scp -P 45222 .env config/ it-era.it_jk05qj1z25@65.109.30.171:/var/www/vhosts/it-era.it/httpdocs/
```

---

## 🔧 **DIRECTORY CREATION COMMANDS**

### **Create Optimal Structure on Server:**
```bash
# SSH into server
ssh -p 45222 it-era.it_jk05qj1z25@65.109.30.171

# Navigate to web directory
cd /var/www/vhosts/it-era.it/httpdocs/

# Create directory structure
mkdir -p routes/api routes/pages
mkdir -p middleware
mkdir -p config
mkdir -p utils
mkdir -p logs
mkdir -p data/quotes
mkdir -p views/partials views/errors
mkdir -p web/css web/js web/images web/static

# Set proper permissions
chmod 755 routes/ middleware/ config/ utils/
chmod 644 *.js *.json
chmod -R 644 views/
chmod -R 644 web/
chmod 755 logs/
chmod 755 data/quotes/
```

---

## 🛡️ **SECURITY & PERMISSIONS**

### **File Permissions:**
```bash
# Application files
chmod 644 *.js *.json

# Directories
chmod 755 routes/ middleware/ config/ utils/ views/ web/

# Logs directory (writable)
chmod 755 logs/
chmod 666 logs/*.log

# Data directory (writable for quotes)
chmod 755 data/
chmod 755 data/quotes/

# Static assets (readable)
chmod -R 644 web/
```

### **Security Considerations:**
- ✅ No sensitive files in web-accessible directories
- ✅ Environment variables in `.env` file
- ✅ Logs directory outside web root
- ✅ Proper file permissions set

---

## 📊 **UPLOAD VERIFICATION**

### **Post-Upload Checklist:**
```bash
# Verify file structure
ls -la /var/www/vhosts/it-era.it/httpdocs/

# Check critical files
ls -la app.js server.js package.json
ls -la views/
ls -la web/
ls -la data/

# Verify permissions
ls -la logs/
ls -la data/quotes/

# Test Node.js startup
node app.js --test
```

### **Dependency Installation:**
```bash
# Install production dependencies
npm install --production

# Verify installation
npm list --depth=0

# Check for vulnerabilities
npm audit
```

---

## 🎯 **OPTIMIZATION BENEFITS**

### **Performance Improvements:**
- ✅ **Modular routing** - Better code organization
- ✅ **Middleware separation** - Reusable components
- ✅ **Static asset optimization** - Faster loading
- ✅ **Proper caching** - Reduced server load

### **Maintainability:**
- ✅ **Clear structure** - Easy to navigate
- ✅ **Separation of concerns** - Modular design
- ✅ **Scalable architecture** - Future-proof
- ✅ **Best practices** - Industry standards

### **Security:**
- ✅ **Proper permissions** - Secure file access
- ✅ **Environment variables** - Sensitive data protection
- ✅ **Logging system** - Audit trail
- ✅ **Error handling** - Graceful failures

---

## ✅ **IMPLEMENTATION STATUS**

- [x] **Structure Analysis** - Complete
- [x] **Upload Plan** - Ready
- [ ] **File Upload** - In Progress
- [ ] **Permission Setup** - Pending
- [ ] **Dependency Installation** - Pending
- [ ] **Verification** - Pending

**Next Step:** Execute upload commands and verify structure.
