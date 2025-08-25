# IT-ERA Cloudflare Production Configuration Guide

**HIVESTORM Task #2: Cloudflare Redirect Rules Configuration**

## 🎯 CRITICAL PRODUCTION SETTINGS

### Phase 1: DNS Configuration

#### 1.1 CNAME Records Setup
```bash
# Root domain CNAME (Priority: CRITICAL)
Type: CNAME
Name: @ (or it-era.it)
Content: it-era.it
TTL: Auto (1 minute)
Proxy: ✅ Enabled (Orange Cloud)

# WWW subdomain CNAME
Type: CNAME  
Name: www
Content: it-era.it
TTL: Auto (1 minute)
Proxy: ✅ Enabled (Orange Cloud)
```

#### 1.2 Email Records (Google Workspace)
```bash
# MX Record
Type: MX
Name: @
Mail server: aspmx.l.google.com
Priority: 1
TTL: 1 hour

# SPF Record
Type: TXT
Name: @
Content: v=spf1 include:_spf.google.com ~all
TTL: 1 hour
```

### Phase 2: Page Rules Configuration

#### Rule #1: Cloudflare Pages Redirect (Priority 1)
```
URL Pattern: it-era.it/*
Setting: Forwarding URL
Status Code: 301 (Permanent Redirect)
Destination URL: https://it-era.it/$1
```

#### Rule #2: WWW Canonical Redirect (Priority 2)  
```
URL Pattern: www.it-era.it/*
Setting: Forwarding URL
Status Code: 301 (Permanent Redirect)
Destination URL: https://it-era.it/$1
```

#### Rule #3: HTTPS Enforcement (Priority 3)
```
URL Pattern: http://it-era.it/*
Setting: Always Use HTTPS
Status: On
```

### Phase 3: SSL/TLS Configuration

#### 3.1 SSL/TLS Encryption Mode
```
Setting: Full (strict)
Description: End-to-end encryption with certificate verification
```

#### 3.2 SSL/TLS Settings
```json
{
  "always_use_https": true,
  "automatic_https_rewrites": true,
  "minimum_tls_version": "1.2",
  "tls_1_3": true,
  "opportunistic_encryption": true,
  "certificate_transparency_monitoring": true
}
```

#### 3.3 HSTS Configuration
```
Enable HSTS: ✅ On
Max Age: 31536000 (1 year)
Include Subdomains: ✅ On  
Preload: ✅ On
No-Sniff Header: ✅ On
```

### Phase 4: Performance Optimization

#### 4.1 Caching Settings
```json
{
  "cache_level": "aggressive",
  "browser_cache_ttl": 31536000,
  "edge_cache_ttl": 7776000,
  "development_mode": false
}
```

#### 4.2 Auto Minify
```
Minify CSS: ✅ On
Minify HTML: ✅ On  
Minify JS: ✅ On
```

#### 4.3 Compression & Optimization
```
Brotli: ✅ On
Early Hints: ✅ On
HTTP/2: ✅ On
HTTP/3 (QUIC): ✅ On
Polish (Image Optimization): ✅ On
```

#### 4.4 Speed Settings
```json
{
  "rocket_loader": false,
  "mirage": true,
  "polish": "lossless",
  "webp": true,
  "tiered_cache": true
}
```

### Phase 5: Security Configuration

#### 5.1 Security Level
```
Security Level: Medium
DDoS Protection: ✅ On
Bot Fight Mode: ✅ On
```

#### 5.2 Security Headers
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
```

## 🚀 DEPLOYMENT PROCEDURE

### Step-by-Step Implementation

#### Step 1: Backup Current Configuration
```bash
# Export current DNS records
curl -X GET "https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" > backup_dns.json
```

#### Step 2: Configure DNS Records
1. Login to Cloudflare Dashboard
2. Select `it-era.it` zone
3. Go to **DNS > Records**
4. Add/Modify CNAME records as specified above
5. Ensure **Proxy status** is enabled (Orange Cloud)

#### Step 3: Create Page Rules
1. Go to **Rules > Page Rules**
2. Create 3 rules in exact order specified above
3. **CRITICAL**: Use exact URL patterns and settings
4. Save and deploy each rule

#### Step 4: Configure SSL/TLS
1. Go to **SSL/TLS > Overview**
2. Set encryption mode to **Full (strict)**
3. Go to **SSL/TLS > Edge Certificates**
4. Enable all recommended settings
5. Configure HSTS in **SSL/TLS > Edge Certificates**

#### Step 5: Optimize Performance
1. Go to **Speed > Optimization**
2. Enable Auto Minify for CSS, HTML, JS
3. Go to **Caching > Configuration**
4. Set cache level to **Aggressive**
5. Configure browser cache TTL

### Step 6: Validation Testing
```bash
# Run validation script
./scripts/deployment/cloudflare-validation.sh

# Manual validation URLs
curl -I https://it-era.it/
curl -I https://www.it-era.it/
curl -I http://it-era.it/
```

## ⚡ CRITICAL SUCCESS METRICS

### Redirect Validation Checklist
- [ ] `it-era.it/*` → `https://it-era.it/$1` (301)
- [ ] `www.it-era.it/*` → `https://it-era.it/$1` (301)  
- [ ] `http://it-era.it/*` → `https://it-era.it/$1` (301)
- [ ] SSL Certificate valid and trusted
- [ ] HSTS headers present
- [ ] Security headers configured
- [ ] Cache headers optimized
- [ ] Page load time < 2 seconds

### Key Test Pages
```bash
# Priority test URLs
https://it-era.it/
https://it-era.it/assistenza-it-milano.html
https://it-era.it/cloud-storage-bergamo.html  
https://it-era.it/sicurezza-informatica-monza.html
https://it-era.it/assistenza-it-como.html
```

## 🔧 TROUBLESHOOTING

### Common Issues & Solutions

#### Issue: 502 Bad Gateway
**Cause**: SSL/TLS encryption mode mismatch
**Solution**: Change SSL mode to "Flexible" temporarily, then back to "Full (strict)"

#### Issue: Redirect Loop
**Cause**: Conflicting page rules
**Solution**: Check rule priority and URL patterns

#### Issue: DNS Not Propagating
**Cause**: TTL settings or caching
**Solution**: 
```bash
# Clear DNS cache
sudo dscacheutil -flushcache
# Check propagation
dig it-era.it @8.8.8.8
```

#### Issue: Performance Degradation
**Cause**: Over-aggressive caching or minification
**Solution**: Temporarily disable Rocket Loader and test

## 📊 MONITORING & VALIDATION

### External Validation Tools
- **SSL Labs**: https://www.ssllabs.com/ssltest/analyze.html?d=it-era.it
- **Security Headers**: https://securityheaders.com/?q=https%3A%2F%2Fit-era.it  
- **GTmetrix**: https://gtmetrix.com/?url=https%3A%2F%2Fit-era.it
- **PageSpeed**: https://pagespeed.web.dev/?url=https%3A%2F%2Fit-era.it

### Cloudflare Analytics Monitoring
- **Traffic**: Monitor redirect success rate
- **Security**: Track blocked requests
- **Performance**: Cache hit ratio should be >95%
- **Availability**: Uptime should be 99.9%+

## 🎯 POST-DEPLOYMENT TASKS

### Immediate (0-24 hours)
- [ ] Monitor redirect functionality
- [ ] Check SSL certificate status
- [ ] Verify DNS propagation globally
- [ ] Test critical user journeys
- [ ] Monitor Core Web Vitals

### Short-term (1-7 days)  
- [ ] Submit updated sitemap to Google
- [ ] Monitor search console for crawl errors
- [ ] Verify HSTS preload submission
- [ ] Check email deliverability
- [ ] Performance optimization fine-tuning

### Long-term (1-4 weeks)
- [ ] SEO ranking impact analysis
- [ ] User behavior analytics review
- [ ] Performance metrics comparison
- [ ] Security posture assessment
- [ ] Cost optimization review

---

## ⚠️ PRODUCTION DEPLOYMENT NOTES

**CRITICAL**: This configuration affects 5,646+ pages and must be executed with zero downtime.

**ROLLBACK PLAN**: Keep backup of current DNS settings. Page rules can be disabled instantly if issues arise.

**COMMUNICATION**: Notify stakeholders 24h before deployment. Monitor for 72h post-deployment.

**SUCCESS CRITERIA**: 
- Zero 404 errors on critical pages
- SSL score A+ on SSL Labs  
- Page load time improvement >20%
- Search console shows no crawl errors after 48h