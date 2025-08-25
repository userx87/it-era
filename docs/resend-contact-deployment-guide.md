# IT-ERA Resend Contact Form - Deployment Guide

## 🚀 Complete Resend.com Contact Form Integration

This implementation replaces SendGrid with Resend.com for professional email delivery across all IT-ERA landing pages and service pages.

### ✅ What's Been Created

1. **Resend API Worker** (`/api/src/email/resend-contact-worker.js`)
   - Professional email templates with IT-ERA branding
   - Automatic ticket ID generation
   - Comprehensive error handling
   - CORS support for all domains
   - Analytics and conversion tracking

2. **Universal Contact Form** (`/components/contact-form-universal.html`)
   - Responsive design optimized for conversions
   - Real-time field validation
   - Service auto-detection from page URL
   - City pre-population from page context
   - Emergency contact prominently displayed
   - Trust signals and professional styling

3. **Thank You Page** (`/components/thank-you-page.html`)
   - Dynamic content based on form submission
   - Ticket information display
   - Next steps guidance
   - Emergency contact options

4. **Deployment Scripts**
   - `scripts/deploy_resend_contact.sh` - Cloudflare Workers deployment
   - `scripts/integrate_contact_forms.py` - Batch integration across all pages

## 🎯 Key Features

### Email Delivery
- **Customer Confirmation**: Professional branded email with ticket ID
- **Internal Notification**: Detailed submission info for IT-ERA team
- **Copy Email**: Optional customer copy of their request
- **Emergency Handling**: Special routing for urgent requests

### Form Features
- **Smart Validation**: Real-time validation with helpful error messages
- **Service Detection**: Automatically detects service from page URL
- **City Population**: Pre-fills city field from page context
- **Conversion Optimized**: Emergency CTA, trust signals, benefits display
- **Mobile Responsive**: Optimized for all screen sizes

### Analytics & Tracking
- Google Analytics 4 events
- Form interaction tracking
- Conversion measurement
- Error monitoring

## 📋 Required Configuration

### 1. Resend API Key
You'll need a Resend.com API key:
1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Verify your sending domain (`it-era.it`)

### 2. Contact Information (Already Configured)
- **Phone**: 039 888 2041
- **Email**: info@it-era.it
- **Address**: Viale Risorgimento 32, Vimercate MB
- **P.IVA**: 10524040966

## 🚀 Deployment Steps

### Step 1: Deploy the Resend Worker
```bash
# Make deployment script executable
chmod +x scripts/deploy_resend_contact.sh

# Run deployment (will prompt for Resend API key)
./scripts/deploy_resend_contact.sh
```

### Step 2: Integrate Forms into All Pages
```bash
# Run the Python integration script
python3 scripts/integrate_contact_forms.py
```

This script will:
- Process 1,544+ landing pages automatically
- Add contact forms to all city and service pages
- Create backups of original files
- Configure page-specific settings
- Track integration statistics

### Step 3: Update DNS (Optional)
For custom domain (api.it-era.it):
```
CNAME api it-era-resend.bulltech.workers.dev
```

## 📧 Email Templates

### Customer Confirmation Email
- Professional IT-ERA branding
- Ticket ID and service information
- Next steps guidance
- Emergency contact information
- Estimated response time

### Internal Notification Email
- Complete customer information
- Request details and priority
- Technical information (IP, User Agent)
- Quick action buttons (call, email)
- Urgency indicators

## 🎯 Conversion Optimization Features

1. **Emergency Contact**: Prominent 24/7 support number
2. **Trust Signals**: Response time guarantees, certified team
3. **Benefits Display**: Free consultation, 4h response, expert team
4. **Progressive Enhancement**: Works without JavaScript
5. **Accessibility**: Screen reader friendly, keyboard navigation
6. **SEO Optimized**: Proper form structure and labeling

## 📊 Analytics Events Tracked

- `form_view` - When form comes into viewport
- `form_field_focus` - When user focuses on form fields
- `form_submit_attempt` - When user attempts to submit
- `form_submit_success` - Successful submission
- `form_submit_error` - Submission errors
- `emergency_call` - Emergency phone number clicks

## 🔧 Customization Options

### Service Types Supported
- Assistenza IT Generale
- Sicurezza Informatica
- Cloud Storage e Backup
- Firewall e Protezione Rete
- VoIP e Telefonia
- Backup Automatico
- Consulenza IT Strategica
- Migrazione al Cloud
- Supporto Microsoft 365

### Priority Levels
- **Normale**: 4 ore lavorative di risposta
- **Urgente**: 15 minuti di risposta, notifica speciale

## 🎨 Styling and Branding

The forms use IT-ERA's brand colors:
- **Primary Blue**: #0056cc
- **Secondary Green**: #00b336
- **Danger Red**: #dc3545

Responsive design with:
- Mobile-first approach
- Touch-friendly buttons
- Accessible contrast ratios
- Professional shadows and animations

## 🛡️ Security Features

- CORS protection
- Input validation and sanitization
- Rate limiting (via Cloudflare)
- Privacy compliance (GDPR ready)
- Secure API key handling

## 📱 Pages Updated

The integration script will update:

### City Landing Pages (767 pages)
- `/web/pages-draft/assistenza-it-*.html`
- `/web/pages-draft/cloud-storage-*.html`
- `/web/pages-draft/sicurezza-informatica-*.html`

### Production Pages
- `/web/pages/assistenza-it-*.html`
- `/web/pages/cloud-storage-*.html`
- `/web/pages/sicurezza-informatica-*.html`

### Main Service Pages
- Assistenza IT, Sicurezza Informatica, Cloud Storage
- Backup Automatico, Firewall, VoIP
- All sector-specific pages

## 🎉 Success Metrics

After deployment, you can expect:
- **Increased Conversions**: Professional forms with trust signals
- **Better User Experience**: Real-time validation and clear feedback
- **Improved Response Time**: Automated ticket system
- **Enhanced Tracking**: Detailed analytics and conversion data
- **Professional Image**: Branded emails and consistent experience

## 🚨 Testing

### Test the API Endpoint
```bash
curl -X POST https://it-era-resend.bulltech.workers.dev/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Test User",
    "email": "test@example.com",
    "messaggio": "Test message",
    "servizio": "Assistenza IT",
    "privacy": true
  }'
```

### Test Form Integration
1. Check a few updated pages for form presence
2. Submit test forms to verify email delivery
3. Confirm ticket IDs are generated
4. Verify emergency contact functionality

## 📞 Support

If you need assistance:
- **Emergency**: 039 888 2041
- **Email**: info@it-era.it
- **Documentation**: This guide
- **Logs**: `wrangler tail --config wrangler-resend.toml`

---

**🎯 Ready to Deploy!**

This complete implementation provides professional contact form handling with conversion optimization, comprehensive email delivery, and seamless integration across all 1,544+ IT-ERA pages.