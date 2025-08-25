# IT-ERA Contact Module - Complete Implementation Guide

## 🚀 Overview

This is a complete contact form system for IT-ERA with:
- Cloudflare Workers serverless backend
- Resend.com email integration
- Universal form component
- Advanced tracking and analytics
- GDPR compliance

## 📋 Table of Contents

1. [Quick Setup](#quick-setup)
2. [Cloudflare Workers Configuration](#cloudflare-workers-configuration)
3. [Resend.com Setup](#resendcom-setup)
4. [Form Integration](#form-integration)
5. [Analytics Setup](#analytics-setup)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## 🏁 Quick Setup

### Prerequisites
- Cloudflare account with Workers plan
- Resend.com account with API key
- Access to IT-ERA website files

### Environment Variables Required
```bash
RESEND_API_KEY=re_xyz...        # Your Resend API key
OWNER_EMAIL=andrea@bulltech.it  # Owner notification email
FROM_EMAIL=noreply@it-era.it    # From address for emails
```

## ⚙️ Cloudflare Workers Configuration

### 1. Create New Worker

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create new worker
wrangler generate it-era-contact
cd it-era-contact
```

### 2. Configure wrangler.toml

```toml
name = "it-era-contact"
main = "src/contact.js"
compatibility_date = "2024-01-01"

[env.production]
name = "it-era-contact"
route = "it-era.it/api/contact"

[[env.production.kv_namespaces]]
binding = "CONTACT_LOG"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-id"

[vars]
OWNER_EMAIL = "andrea@bulltech.it"
FROM_EMAIL = "noreply@it-era.it"

[[env.production.vars]]
RESEND_API_KEY = "your-resend-api-key"
```

### 3. Deploy Worker

```bash
# Deploy to production
wrangler publish --env production

# Set secrets
wrangler secret put RESEND_API_KEY --env production
```

## 📧 Resend.com Setup

### 1. Account Setup
1. Create account at [resend.com](https://resend.com)
2. Verify your domain (it-era.it)
3. Create API key with full permissions

### 2. DNS Configuration
Add these DNS records to your domain:

```dns
TXT _dmarc.it-era.it "v=DMARC1; p=quarantine; rua=mailto:dmarc@it-era.it"
TXT it-era.it "v=spf1 include:spf.resend.com ~all"
CNAME resend._domainkey.it-era.it resend._domainkey.resend.com
```

### 3. Verify Domain
```bash
# Check domain verification status
curl -X GET 'https://api.resend.com/domains' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

## 🔧 Form Integration

### 1. Include Form Component

Add to any page:

```html
<!-- Include contact form -->
<div id="contact-form-container"></div>

<script>
// Load contact form component
fetch('/components/contact-form.html')
  .then(response => response.text())
  .then(html => {
    document.getElementById('contact-form-container').innerHTML = html;
  });
</script>
```

### 2. Alternative: Direct Include

```html
<!-- Direct include (for static sites) -->
<!--#include virtual="/components/contact-form.html" -->
```

### 3. Custom Styling

Override default styles:

```css
/* Custom form styles */
.it-contact-form {
  background: your-custom-color;
  /* Override default styles */
}

.it-contact-form h3 {
  color: your-brand-color;
}
```

## 📊 Analytics Setup

### 1. Google Analytics 4

```html
<!-- Add to <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>

<!-- Include tracking events -->
<script src="/snippets/tracking-events.js"></script>
```

### 2. Facebook Pixel

```html
<!-- Add to <head> -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');

fbq('init', 'FB_PIXEL_ID');
fbq('track', 'PageView');
</script>
```

### 3. Configure Tracking IDs

Edit `/snippets/tracking-events.js`:

```javascript
const TRACKING_CONFIG = {
  gtag_id: 'GA_MEASUREMENT_ID',      // Replace with your GA4 ID
  facebook_pixel_id: 'FB_PIXEL_ID',  // Replace with your Pixel ID
  hotjar_id: 'HOTJAR_ID',           // Replace with your Hotjar ID
  debug: false                      // Set to true for testing
};
```

## 🧪 Testing

### 1. Local Testing

```bash
# Test Cloudflare Worker locally
wrangler dev

# Test form submission
curl -X POST http://localhost:8787/api/contact \
  -d "name=Test User" \
  -d "email=test@example.com" \
  -d "message=Test message" \
  -d "privacy_accepted=on"
```

### 2. Form Validation Testing

Test these scenarios:
- ✅ Valid submission
- ❌ Missing required fields
- ❌ Invalid email format
- ❌ Missing privacy acceptance
- ❌ Message too short

### 3. Email Testing

1. Submit test form
2. Check owner receives notification
3. Check customer receives confirmation
4. Verify ticket ID format
5. Test email deliverability

### 4. Analytics Testing

1. Enable debug mode in tracking-events.js
2. Submit form and check console logs
3. Verify events in GA4 Real-time reports
4. Check Facebook Pixel Helper extension

## 🚀 Deployment

### 1. Production Checklist

- [ ] Cloudflare Worker deployed
- [ ] Environment variables set
- [ ] KV namespace configured
- [ ] Domain verified on Resend
- [ ] DNS records added
- [ ] Form component integrated
- [ ] Analytics configured
- [ ] Testing completed

### 2. Deploy Worker

```bash
# Deploy to production
wrangler publish --env production

# Verify deployment
curl -X POST https://it-era.it/api/contact \
  -d "name=Deploy Test" \
  -d "email=test@it-era.it" \
  -d "message=Testing deployment" \
  -d "privacy_accepted=on"
```

### 3. Update Website Pages

Add form to key pages:
- Homepage
- Contact page
- Service pages (assistenza-it, sicurezza-informatica, cloud-storage)
- Landing pages

## 🐛 Troubleshooting

### Common Issues

#### 1. "Method not allowed" Error
```bash
# Check if Worker is receiving requests
wrangler tail --env production
```

#### 2. Email Not Sending
```javascript
// Check Resend API key and domain verification
console.log('Resend API Key:', env.RESEND_API_KEY?.substring(0, 10) + '...');
```

#### 3. CORS Issues
```javascript
// Verify CORS headers in Worker response
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}
```

#### 4. Form Not Submitting
```javascript
// Check form action URL
<form action="/api/contact" method="POST">

// Verify JavaScript is loaded
console.log('Form handler loaded:', typeof ITEraTracking);
```

### Debug Mode

Enable debug logging:

```javascript
// In contact.js Worker
console.log('Form data received:', data);
console.log('Validation errors:', validationErrors);
console.log('Email results:', { ownerResult, customerResult });

// In tracking-events.js
const TRACKING_CONFIG = {
  debug: true,
  enable_console_logs: true
};
```

### Monitoring

#### 1. Cloudflare Analytics
- Check Worker metrics in Cloudflare dashboard
- Monitor error rates and response times
- Set up alerts for failures

#### 2. Email Deliverability
```bash
# Check email reputation
curl -X GET 'https://api.resend.com/domains/it-era.it' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

#### 3. Form Analytics
- Monitor conversion rates
- Track abandonment points
- Analyze user behavior patterns

## 📋 Configuration Files Summary

### Required Files
1. `/api/contact.js` - Cloudflare Worker
2. `/components/contact-form.html` - Universal form component
3. `/snippets/tracking-events.js` - Analytics tracking
4. `/docs/contact-implementation.md` - This documentation

### Environment Variables
```bash
RESEND_API_KEY=re_xyz...
OWNER_EMAIL=andrea@bulltech.it
FROM_EMAIL=noreply@it-era.it
```

### DNS Records
```dns
TXT _dmarc.it-era.it "v=DMARC1; p=quarantine; rua=mailto:dmarc@it-era.it"
TXT it-era.it "v=spf1 include:spf.resend.com ~all"
CNAME resend._domainkey.it-era.it resend._domainkey.resend.com
```

## 🎯 Expected Results

### Performance Metrics
- **Form Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Email Delivery**: < 30 seconds
- **Conversion Rate**: 15-25% (industry average)

### Email Deliverability
- **Delivery Rate**: > 99%
- **Open Rate**: 60-80% (transactional emails)
- **Spam Score**: < 1.0

### Analytics Events
- `page_view` - Page loaded
- `contact_form_view` - Form visible
- `form_start` - User started form
- `form_submit_attempt` - Form submitted
- `form_submit_success` - Form submitted successfully
- `form_submit_error` - Form submission failed

---

## 📞 Support

For issues with this implementation:
1. Check troubleshooting section
2. Review Cloudflare Worker logs: `wrangler tail`
3. Verify Resend API status: [status.resend.com](https://status.resend.com)
4. Contact IT-ERA: andrea@bulltech.it

---

*Last updated: 2024-01-25*