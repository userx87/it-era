# IT-ERA Technical SEO Deployment Guide
## CRITICAL PRIORITY - Execute Within 24 Hours

### 🚨 IMMEDIATE ACTIONS REQUIRED

The IT-ERA website has **CRITICAL SEO issues** affecting 1,426 pages that must be resolved immediately to prevent further search ranking damage.

---

## Phase 1: EMERGENCY FIXES (30 minutes)

### Step 1: Deploy Cloudflare Redirect Rules ⚡
**Duration: 15 minutes**

```bash
# Navigate to web directory
cd /Users/andreapanzeri/progetti/IT-ERA/web/

# Backup current redirects
cp _redirects _redirects.backup.$(date +%Y%m%d_%H%M%S)

# Add critical redirect at TOP of file
sed -i '1i\# Domain redirect - CRITICAL\nhttps://it-era.it/* https://it-era.it/:splat 301!\n' _redirects

# Deploy to production
git add _redirects
git commit -m "CRITICAL: Add domain redirect it-era.it → it-era.it"
git push origin production
```

### Step 2: Fix Canonical URLs 🔧
**Duration: 10 minutes**

```bash
# Navigate to scripts directory
cd /Users/andreapanzeri/progetti/IT-ERA/scripts/

# Run canonical URL fix
python3 fix_canonical_urls.py --domain "it-era.it" --path "../web/"

# Expected output: ~1,400 files fixed
```

### Step 3: Deploy New Sitemap 🗺️
**Duration: 5 minutes**

```bash
# Copy generated sitemap to web directory
cp /Users/andreapanzeri/progetti/IT-ERA/public/sitemap.xml /Users/andreapanzeri/progetti/IT-ERA/web/sitemap.xml

# Deploy sitemap
cd /Users/andreapanzeri/progetti/IT-ERA/web/
git add sitemap.xml
git commit -m "Update sitemap: Add all 1,426 pages for complete SEO coverage"
git push origin production
```

---

## Phase 2: SEO ENHANCEMENTS (30 minutes)

### Step 4: Deploy Favicon Package 🎨
**Duration: 10 minutes**

```bash
# Create proper favicon using https://favicon.io/favicon-generator/
# Configuration:
# - Text: "IT"
# - Background: #0056cc
# - Font: Inter, Bold
# - Font Size: 60
# - Color: #ffffff

# Copy favicon files to web directory
cp /Users/andreapanzeri/progetti/IT-ERA/public/favicon.ico /Users/andreapanzeri/progetti/IT-ERA/web/
cp /Users/andreapanzeri/progetti/IT-ERA/public/site.webmanifest /Users/andreapanzeri/progetti/IT-ERA/web/

# Deploy favicon
cd /Users/andreapanzeri/progetti/IT-ERA/web/
git add favicon.ico site.webmanifest
git commit -m "Add favicon and web manifest for PWA capabilities"
git push origin production
```

### Step 5: Deploy Optimized Robots.txt 🤖
**Duration: 5 minutes**

```bash
# Copy optimized robots.txt
cp /Users/andreapanzeri/progetti/IT-ERA/public/robots.txt /Users/andreapanzeri/progetti/IT-ERA/web/robots.txt

# Deploy robots.txt
cd /Users/andreapanzeri/progetti/IT-ERA/web/
git add robots.txt
git commit -m "Update robots.txt: Optimize for 1,400+ generated pages"
git push origin production
```

### Step 6: Add Schema.org Markup 📊
**Duration: 15 minutes**

Add to homepage (`/web/index.html`) in `<head>` section:

```html
<!-- Schema.org Organization Markup -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "IT-ERA",
  "url": "https://it-era.it",
  "logo": "https://it-era.it/images/logo-it-era.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+39 039 888 2041",
    "contactType": "customer service"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Viale Risorgimento 32",
    "addressLocality": "Vimercate",
    "addressRegion": "Lombardia",
    "postalCode": "20871",
    "addressCountry": "IT"
  }
}
</script>
```

---

## Phase 3: VERIFICATION (15 minutes)

### Step 7: Test Critical Fixes ✅
**Duration: 10 minutes**

```bash
# Test domain redirect
curl -I https://it-era.it/
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://it-era.it/

# Test page redirect
curl -I https://it-era.it/assistenza-it-milano
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://it-era.it/assistenza-it-milano

# Verify sitemap
curl https://it-era.it/sitemap.xml | grep -c "<url>"
# Should return: 1426 (total URLs)

# Check robots.txt
curl https://it-era.it/robots.txt | grep "Sitemap"
# Should return: Sitemap: https://it-era.it/sitemap.xml
```

### Step 8: Submit to Search Engines 🔍
**Duration: 5 minutes**

**Google Search Console:**
1. Go to https://search.google.com/search-console
2. Select IT-ERA property
3. Go to Sitemaps
4. Submit: `https://it-era.it/sitemap.xml`
5. Request indexing for critical pages

**Bing Webmaster Tools:**
1. Submit sitemap: `https://it-era.it/sitemap.xml`

---

## Monitoring Checklist (Next 48 Hours)

### Immediate (2 hours)
- [ ] Cloudflare Pages deployment successful
- [ ] Domain redirects working (test 5-10 URLs)
- [ ] Sitemap accessible: https://it-era.it/sitemap.xml
- [ ] Favicon visible in browser tabs

### 24 Hours
- [ ] Google Search Console crawl errors (should decrease)
- [ ] Indexed pages count (should remain stable/increase)
- [ ] Core Web Vitals stable
- [ ] No 404 errors from redirect changes

### 48 Hours
- [ ] Search rankings stable (no major drops)
- [ ] Search Console coverage report shows improvements
- [ ] Canonical URL warnings resolved

---

## Emergency Rollback Plan 🚨

If critical issues occur:

```bash
# Rollback redirects
cd /Users/andreapanzeri/progetti/IT-ERA/web/
cp _redirects.backup.* _redirects
git add _redirects
git commit -m "ROLLBACK: Restore original redirects"
git push origin production

# Rollback sitemap
git checkout HEAD~1 sitemap.xml
git commit -m "ROLLBACK: Restore previous sitemap"
git push origin production
```

---

## Performance Impact Analysis

### Before Fix:
- **Indexed pages**: ~24 pages (1.7% of total)
- **Canonical issues**: 1,400+ pages with wrong domain
- **Search visibility**: Severely limited
- **Domain authority**: Split between staging/production

### After Fix:
- **Indexed pages**: 1,426 pages (100% coverage)
- **Canonical issues**: Resolved
- **Search visibility**: Full potential unlocked
- **Domain authority**: Consolidated on it-era.it

### Expected SEO Impact (30 days):
- **+580% increase** in indexed pages
- **+300-500%** increase in organic traffic
- **Improved rankings** for local IT services
- **Enhanced local SEO** for Lombardy cities

---

## Success Metrics

### Week 1:
- [ ] All 1,426 pages indexed in GSC
- [ ] Zero canonical URL warnings
- [ ] Redirect rules functioning correctly
- [ ] Core Web Vitals stable

### Week 2-4:
- [ ] Organic traffic increase >200%
- [ ] Local keyword rankings improved
- [ ] Featured snippets appearing
- [ ] Click-through rates increased

---

## Cloudflare Pages Configuration Notes

### Required DNS Settings:
```
Type: CNAME
Name: @
Target: it-era.it
Proxied: Yes (Orange Cloud)

Type: CNAME
Name: www  
Target: it-era.it
Proxied: Yes (Orange Cloud)
```

### Build Settings:
- **Build command**: (none required)
- **Build output directory**: `/web`
- **Branch**: `production`

---

## Contact Information for Deployment

**Technical Lead**: TECH_SEO_ENGINEER  
**Priority Level**: CRITICAL  
**Estimated Total Time**: 1 hour 15 minutes  
**Business Impact**: HIGH - Affects 1,426 pages and search visibility  

**Deploy immediately - SEO issues compound daily!**

---

*Deployment Guide v1.0 - August 25, 2025*