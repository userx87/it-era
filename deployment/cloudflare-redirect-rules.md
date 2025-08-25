# HIVESTORM Task #2: Cloudflare Redirect Rules Configuration

## 🎯 Mission Objective
Configure server-side redirect rules in Cloudflare to seamlessly redirect all `it-era.it` traffic to the production domain `it-era.it` with proper SEO value transfer.

## 📋 Cloudflare Configuration Steps

### Step 1: Access Cloudflare Dashboard
1. Login to Cloudflare dashboard
2. Select the `it-era.it` domain
3. Navigate to "Rules" → "Page Rules"

### Step 2: Create Primary Redirect Rule
```javascript
// Page Rule Configuration
URL Pattern: it-era.it/*
Actions:
  - Forwarding URL: 301 - Permanent Redirect
  - Destination URL: https://it-era.it/$1
```

### Step 3: Create Specific Path Rules (if needed)
```javascript
// For pages directory specifically
URL Pattern: it-era.it/pages/*
Actions:
  - Forwarding URL: 301 - Permanent Redirect  
  - Destination URL: https://it-era.it/$1

// For assets and images
URL Pattern: it-era.it/images/*
Actions:
  - Forwarding URL: 301 - Permanent Redirect
  - Destination URL: https://it-era.it/images/$1
```

### Step 4: Root Domain Redirect
```javascript
// Root domain redirect
URL Pattern: it-era.it
Actions:
  - Forwarding URL: 301 - Permanent Redirect
  - Destination URL: https://it-era.it/
```

## 🔧 Alternative: Cloudflare Functions (Advanced)

If Page Rules are not sufficient, use Cloudflare Workers:

```javascript
// cloudflare-worker-redirect.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Check if this is a pages.dev request
  if (url.hostname === 'it-era.it') {
    // Clean up the path
    let newPath = url.pathname
    
    // Remove /pages/ prefix if present
    if (newPath.startsWith('/pages/')) {
      newPath = newPath.replace('/pages/', '/')
    }
    
    // Remove .html extension for clean URLs
    if (newPath.endsWith('.html')) {
      newPath = newPath.replace('.html', '')
    }
    
    // Construct new URL
    const redirectUrl = `https://it-era.it${newPath}${url.search}`
    
    // Return 301 permanent redirect
    return Response.redirect(redirectUrl, 301)
  }
  
  // For non-matching requests, fetch normally
  return fetch(request)
}
```

## ✅ Verification Checklist

### Test URLs to Verify:
1. `https://it-era.it` → `https://it-era.it/`
2. `https://it-era.it/pages/assistenza-it-milano.html` → `https://it-era.it/assistenza-it-milano`
3. `https://it-era.it/pages/cloud-storage-como.html` → `https://it-era.it/cloud-storage-como`
4. `https://it-era.it/images/logo.png` → `https://it-era.it/images/logo.png`

### Testing Commands:
```bash
# Test redirect with curl
curl -I https://it-era.it

# Expected response:
# HTTP/2 301
# location: https://it-era.it/

# Test with specific page
curl -I https://it-era.it/pages/assistenza-it-milano.html

# Expected response:  
# HTTP/2 301
# location: https://it-era.it/assistenza-it-milano
```

## 📊 Performance Monitoring

### Key Metrics to Track:
1. **Redirect Response Time**: Should be < 100ms
2. **SEO Impact**: Monitor search rankings for redirected pages
3. **Traffic Flow**: Ensure smooth transition from pages.dev to it-era.it
4. **Error Rate**: Watch for 4xx/5xx errors on redirected URLs

### Google Search Console:
- Submit new sitemap for it-era.it
- Monitor crawl errors and index status
- Set up redirect change notification

## 🚨 Important Considerations

### SEO Best Practices:
- Use 301 (permanent) redirects only
- Avoid redirect chains
- Update internal links to point directly to new domain
- Monitor Google Search Console for issues

### Performance:
- Cloudflare redirects are faster than origin redirects
- Consider caching redirect rules at edge locations
- Test redirect speed from multiple global locations

## 🎯 Success Criteria
- [ ] All pages.dev URLs redirect to it-era.it with 301 status
- [ ] Clean URLs implemented (no .html extensions)
- [ ] No broken redirects or redirect loops
- [ ] Search engines successfully crawl new URLs
- [ ] No significant drop in organic traffic during transition

## 📞 Support Information
- **Cloudflare Support**: Available for enterprise plans
- **Documentation**: https://developers.cloudflare.com/rules/page-rules/
- **Community**: https://community.cloudflare.com/

---
**Next Task**: Task #3 - DNS and SSL Configuration