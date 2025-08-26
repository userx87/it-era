# URL Removal Priority List - IT-ERA

**CRITICAL: Do NOT remove URLs from sitemap yet - this is a deployment issue, not broken URLs**

## Analysis Summary
- **Issue Type:** Server configuration/deployment problem
- **Root Cause:** URL rewriting not configured + files have .html extensions
- **Solution:** Fix deployment, not sitemap removal

## URLs That Should Be Removed (Only if deployment can't be fixed)

### High Priority Removal (Non-existent files)
1. `https://it-era.it/sitemap.php` - File doesn't exist, returns 404

### URLs to Fix (Not Remove) - Current Status: 404 but files exist
**⚠️ DO NOT REMOVE - THESE ARE DEPLOYMENT ISSUES**

**Main Service Pages (14 URLs):**
- https://it-era.it/assistenza-it (file exists: assistenza-it.html)
- https://it-era.it/contatti (file exists: contatti.html) 
- https://it-era.it/cloud-storage (file exists: cloud-storage.html)
- https://it-era.it/backup-automatico (file exists: backup-automatico.html)
- https://it-era.it/sicurezza-informatica (file exists: sicurezza-informatica.html)
- https://it-era.it/voip-telefonia (file exists: voip-telefonia.html)
- https://it-era.it/firewall-watchguard (file exists: firewall-watchguard.html)
- https://it-era.it/perche-it-era (file exists: perche-it-era.html)
- https://it-era.it/settori-commercialisti (file exists: settori-commercialisti.html)
- https://it-era.it/settori-industria (file exists: settori-industria.html)
- https://it-era.it/settori-pmi-startup (file exists: settori-pmi-startup.html)
- https://it-era.it/settori-retail (file exists: settori-retail.html)
- https://it-era.it/settori-studi-legali (file exists: settori-studi-legali.html)
- https://it-era.it/settori-studi-medici (file exists: settori-studi-medici.html)

**City Landing Pages (~1,400+ URLs):**
All return 404 but corresponding .html files exist in pages-generated/

## Recommended Actions

### Option 1: Fix Server Configuration (RECOMMENDED)
```apache
# Add to .htaccess or server config
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^([^.]+)$ $1.html [NC,L]
```

### Option 2: Update Sitemap URLs (Alternative)
Update all 1,427 URLs in sitemap.xml to include .html extensions:
- `https://it-era.it/assistenza-it` → `https://it-era.it/assistenza-it.html`
- Apply to all URLs except root

### Option 3: Deploy Missing Files (If needed)
Ensure all files in pages-generated/ are deployed to production server.

## URLs to Actually Remove

### Confirmed Non-Existent (Remove from sitemap)
1. Any reference to `sitemap.php`

### Test These URLs for Removal
**⚠️ Only remove if files truly don't exist after deployment fix:**
- Any URLs that still return 404 after server configuration fix
- Any URLs without corresponding HTML files

## SITEMAP_GUARDIAN Action Plan

1. **Immediate:** Remove only sitemap.php references
2. **After deployment fix:** Re-test all URLs
3. **Then:** Remove only URLs that still return 404 with no corresponding files
4. **Monitor:** Set up ongoing 404 detection

**STATUS: Waiting for deployment/server configuration fix before any major sitemap changes.**