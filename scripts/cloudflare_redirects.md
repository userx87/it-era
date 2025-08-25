# Cloudflare Pages Redirect Configuration
## IT-ERA Production Domain Setup

### CRITICAL: Domain Redirect Rules

These redirect rules must be implemented in Cloudflare Pages to properly route traffic from the staging domain (it-era.it) to the production domain (it-era.it).

---

## Method 1: _redirects File (RECOMMENDED)

Update `/web/_redirects` file with domain redirect:

```bash
# Add at the TOP of _redirects file (before any other rules)
https://it-era.it/* https://it-era.it/:splat 301!

# Existing rules continue below...
/ /index.html 200
/assistenza-it-lecco /pages/assistenza-it-lecco.html 200
# ... rest of existing redirects
```

### Critical Notes:
- `301!` = Force permanent redirect (overrides other rules)
- `:splat` = Captures and forwards the full path
- Must be FIRST rule in file

---

## Method 2: Cloudflare Dashboard Configuration

### Page Rules Setup (Alternative)
1. Login to Cloudflare Dashboard
2. Select IT-ERA domain
3. Go to **Page Rules**
4. Create new rule:

```
URL Pattern: it-era.it/*
Setting: Forwarding URL
Status Code: 301 - Permanent Redirect
Destination URL: https://it-era.it/$1
```

---

## Method 3: Cloudflare Workers (Advanced)

For more complex routing, deploy this Worker script:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Redirect staging domain to production
  if (url.hostname === 'it-era.it') {
    const newUrl = `https://it-era.it${url.pathname}${url.search}`
    return Response.redirect(newUrl, 301)
  }
  
  // Continue with normal request
  return fetch(request)
}
```

---

## Cloudflare Pages Specific Configuration

### Project Settings
1. **Custom Domain**: Ensure `it-era.it` is added as custom domain
2. **CNAME Record**: Point `it-era.it` → `it-era.it`
3. **SSL/TLS**: Full (strict) mode recommended

### DNS Configuration Required
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

---

## Deployment Steps

### Step 1: Update _redirects File
```bash
# Navigate to project
cd /web/

# Backup current redirects
cp _redirects _redirects.backup

# Add redirect rule at top
sed -i '1i\https://it-era.it/* https://it-era.it/:splat 301!' _redirects
```

### Step 2: Deploy to Cloudflare Pages
```bash
# Commit changes
git add web/_redirects
git commit -m "Add domain redirect rule: pages.dev → it-era.it"
git push origin production

# Cloudflare Pages will auto-deploy
```

### Step 3: Verify Redirect
```bash
# Test redirect works
curl -I https://it-era.it/
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://it-era.it/

# Test page redirect  
curl -I https://it-era.it/assistenza-it-milano
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://it-era.it/assistenza-it-milano
```

---

## Canonical URL Fix Script

After redirect rules are active, update canonical URLs:

```bash
# Run canonical fix script
cd /scripts/
python3 fix_canonical_urls.py --domain "it-era.it" --path "../web/"
```

---

## Testing Checklist

### Before Deployment ⚠️
- [ ] Backup current _redirects file
- [ ] Verify DNS settings point correctly
- [ ] Confirm custom domain added in Cloudflare Pages

### After Deployment ✅
- [ ] Test homepage redirect: it-era.it → it-era.it
- [ ] Test page redirect: it-era.it/assistenza-it-milano → it-era.it/assistenza-it-milano
- [ ] Verify canonical URLs updated to it-era.it
- [ ] Check sitemap.xml references correct domain
- [ ] Test mobile and desktop access

### SEO Impact Monitoring 📊
- [ ] Submit updated sitemap to Google Search Console
- [ ] Monitor crawl errors for 48 hours
- [ ] Check indexing status of corrected pages
- [ ] Verify no duplicate content warnings

---

## Timeline

| Task | Duration | Status |
|------|----------|---------|
| Update _redirects file | 5 minutes | 🔄 In Progress |
| Deploy to Cloudflare Pages | 10 minutes | ⏳ Pending |
| Test redirects | 10 minutes | ⏳ Pending |
| Fix canonical URLs | 30 minutes | ⏳ Pending |
| Update sitemap | 15 minutes | ⏳ Pending |

**Total Estimated Time**: 1 hour 10 minutes

---

## Emergency Rollback Plan

If redirects cause issues:

```bash
# Restore original _redirects
cd /web/
cp _redirects.backup _redirects
git add _redirects
git commit -m "ROLLBACK: Restore original redirects"
git push origin production
```

---

*Configuration prepared by IT-ERA TECH_SEO_ENGINEER*
*Priority: CRITICAL - Deploy within 2 hours*