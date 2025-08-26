# IT-ERA Contact System - Deployment Instructions

## 📋 Deployment Checklist

### 1. Cloudflare Worker Setup

```bash
# Navigate to contact system directory
cd api/contact-system/workers

# Install Wrangler CLI (if not already installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Set up Resend API key as secret
wrangler secret put RESEND_API_KEY
# Enter your Resend.com API key when prompted

# Create KV namespace for contact logs
wrangler kv:namespace create "CONTACT_LOGS" --preview false
wrangler kv:namespace create "CONTACT_LOGS" --preview true

# Update wrangler.toml with the KV namespace IDs returned above

# Deploy to production
wrangler publish --env production
```

### 2. Domain Configuration

Add these DNS records to Cloudflare:
- `A` record: `api` → Worker route
- CNAME: `www.api` → Worker route

Configure route in Cloudflare dashboard:
- Route: `it-era.it/api/contact`
- Worker: `it-era-contact-system`

### 3. Resend.com Setup

1. Create account at [resend.com](https://resend.com)
2. Add domain `it-era.it` to Resend
3. Configure DNS records as instructed by Resend
4. Generate API key and add to Cloudflare Worker secrets

### 4. Contact Form Integration

Deploy contact integration script to all 1,427 pages:

```bash
# Run integration script
python3 scripts/deploy-contact-forms.py
```

Or manually add to each template:
```html
<script src="/api/contact-system/components/contact-integration.js"></script>
```

### 5. Thank You Page Deployment

Upload `/web/grazie-contatto.html` to production:

```bash
# Copy to web directory
cp api/contact-system/components/grazie-contatto.html web/

# Update sitemap to include thank you page
```

## 🔧 Configuration

### Environment Variables

Set in Cloudflare Worker:
- `RESEND_API_KEY`: Your Resend.com API key
- `ENVIRONMENT`: "production" or "development"

### Email Routing

Emails are automatically routed based on service type:
- `info@it-era.it`: General inquiries
- `assistenza@it-era.it`: IT Support requests
- `sicurezza@it-era.it`: Security service requests
- `cloud@it-era.it`: Cloud storage requests

### Ticket ID Format

Format: `IT{YYYYMMDD}{6-CHAR-RANDOM}`
Example: `IT20241225ABC123`

## 🧪 Testing

### Test Contact Form

1. Navigate to any page on it-era.it
2. Scroll to contact form
3. Fill out form with test data
4. Submit and verify:
   - Success message appears
   - Ticket ID is generated
   - Confirmation email is received
   - Owner notification is sent

### Test Email Templates

Use Resend dashboard to preview email templates:
- Customer confirmation email
- Owner notification email

### Test Different Services

Test form on different service pages:
- `/assistenza-it-[city].html`
- `/sicurezza-informatica-[city].html`
- `/cloud-storage-[city].html`

Verify correct color themes and routing.

## 📊 Analytics Integration

### Google Analytics Events

Forms automatically track these events:
- `form_submit`: When form is successfully submitted
- `ticket_generated`: When ticket ID is created
- `conversion`: On thank you page

### Conversion Tracking

Add Google Ads or Facebook Pixel tracking:

```javascript
// Add to thank you page
gtag('event', 'conversion', {
    'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL'
});
```

## 🔒 Security Features

### Spam Protection
- Rate limiting (built into Cloudflare)
- Form validation (client and server-side)
- GDPR compliance notice

### Data Protection
- All form data encrypted in transit
- No sensitive data stored in KV
- GDPR-compliant data handling

## 🚨 Monitoring

### Error Monitoring

Check Cloudflare Worker logs for:
- Failed email sends
- Form validation errors
- API connection issues

### Performance Monitoring

Monitor these metrics:
- Form submission success rate
- Email delivery rate
- Response times
- Conversion rates

## 🔄 Maintenance

### Regular Tasks

1. **Weekly**: Review contact form submissions
2. **Monthly**: Check email delivery rates
3. **Quarterly**: Update contact templates
4. **Annually**: Review and update privacy policy

### Troubleshooting

Common issues:
1. **Emails not sending**: Check Resend API key and domain verification
2. **Forms not appearing**: Verify JavaScript integration
3. **Styling issues**: Check service-specific CSS classes

## 📞 Support Contacts

- **Technical Issues**: Check Cloudflare and Resend dashboards
- **Email Issues**: Contact Resend support
- **Domain Issues**: Check Cloudflare DNS settings

## 🚀 Production Deployment Commands

```bash
# Full deployment sequence
cd /Users/andreapanzeri/progetti/IT-ERA

# 1. Deploy Cloudflare Worker
cd api/contact-system/workers
wrangler publish --env production

# 2. Deploy thank you page
cp ../components/grazie-contatto.html ../../web/

# 3. Deploy contact integration to all pages
python3 scripts/deploy-contact-forms.py

# 4. Update sitemap
python3 scripts/update-sitemap.py

# 5. Test deployment
curl -X POST https://it-era.it/api/contact \
  -H "Content-Type: application/json" \
  -d '{"nome":"Test","email":"test@example.com","messaggio":"Test message"}'
```

## ✅ Post-Deployment Verification

1. Contact form appears on all pages ✓
2. Form submissions generate ticket IDs ✓
3. Confirmation emails are sent ✓
4. Owner notifications are received ✓
5. Thank you page displays correctly ✓
6. Analytics tracking is working ✓
7. Mobile responsiveness is verified ✓
8. All service themes apply correctly ✓

---

**Deployment Status**: Ready for production
**Estimated Deployment Time**: 30 minutes
**Dependencies**: Cloudflare account, Resend.com account, DNS access