# IT-ERA Tracking & Attribution Strategy

## 📊 Executive Summary

This document defines the comprehensive tracking and attribution strategy for IT-ERA's digital ecosystem, covering 1,544+ localized pages across three main services in Lombardy.

### Key Metrics Goals
- **Conversion Rate**: Track form submissions, phone calls, and email contacts
- **Attribution**: Understand which channels drive the highest value customers
- **Geographic Performance**: Analyze city-level conversion rates across 257+ locations
- **Service Performance**: Compare Assistenza IT, Cloud Storage, and Sicurezza Informatica

---

## 🎯 Core Tracking Events

### 1. Form Submission Tracking
**Event**: `form_submit`

**Parameters**:
- `form_type`: "contact_form" | "quote_request" | "emergency_form"
- `service`: "assistenza_it" | "cloud_storage" | "sicurezza_informatica"
- `city`: City name from URL (Milano, Monza, etc.)
- `source`: Attribution source (utm_source or inferred)
- `page_path`: Current page URL
- `lead_score`: Auto-calculated based on form completeness

**Implementation**:
```javascript
gtag('event', 'form_submit', {
  event_category: 'Lead Generation',
  form_type: 'contact_form',
  service: 'assistenza_it',
  city: 'Milano',
  source: getAttributionSource(),
  page_path: window.location.pathname,
  lead_score: calculateLeadScore()
});
```

### 2. Phone Click Tracking
**Event**: `phone_click`

**Parameters**:
- `phone_number`: "039-888-2041"
- `click_location`: "header" | "cta_button" | "emergency_banner" | "footer"
- `service_context`: Current service page context
- `city`: Geographic context
- `urgency_level`: "normal" | "emergency" based on CTA

**Implementation**:
```javascript
gtag('event', 'phone_click', {
  event_category: 'Contact',
  phone_number: '039-888-2041',
  click_location: 'emergency_banner',
  service_context: 'sicurezza_informatica',
  city: getCurrentCity(),
  urgency_level: 'emergency'
});
```

### 3. Email Click Tracking
**Event**: `email_click`

**Parameters**:
- `email_address`: "info@it-era.it"
- `click_location`: Location of email link
- `service_context`: Current service
- `intent`: "info_request" | "support" | "sales"

### 4. WhatsApp Click Tracking
**Event**: `whatsapp_click`

**Parameters**:
- `click_location`: Where WhatsApp button was clicked
- `message_preset`: Pre-filled message type
- `service_context`: Service-related context

### 5. CTA Sticky Click Tracking
**Event**: `cta_sticky_click`

**Parameters**:
- `cta_type`: "call_now" | "get_quote" | "emergency" | "chat"
- `visibility_time`: How long CTA was visible before click
- `scroll_depth`: User scroll position when clicked

### 6. Resource Download Tracking
**Event**: `download_resource`

**Parameters**:
- `resource_type`: "whitepaper" | "case_study" | "price_list" | "guide"
- `resource_name`: Specific resource identifier
- `download_source`: Page where download initiated

### 7. Video Engagement Tracking
**Event**: `video_play`

**Parameters**:
- `video_title`: Name of video content
- `video_duration`: Total video length
- `play_source`: Where video was started
- `engagement_level`: Based on watch percentage

---

## 🔗 UTM Parameter Strategy

### Standard UTM Conventions

#### UTM Source (`utm_source`)
- `organic` - Organic search traffic
- `direct` - Direct website visits
- `referral` - External website referrals
- `social_linkedin` - LinkedIn traffic
- `social_facebook` - Facebook traffic
- `email_newsletter` - Email campaign traffic
- `google_ads` - Google Ads campaigns
- `facebook_ads` - Facebook advertising

#### UTM Medium (`utm_medium`)
- `website` - Standard website traffic
- `email` - Email marketing
- `social` - Social media posts
- `cpc` - Cost per click advertising
- `display` - Display advertising
- `video` - Video marketing

#### UTM Campaign (`utm_campaign`)
- Service-based: `assistenza-it-2025`, `cloud-storage-promo`, `cybersecurity-awareness`
- Geographic: `milano-launch`, `monza-expansion`, `brianza-focus`
- Seasonal: `q1-2025-promotion`, `back-to-work-2025`
- Event-based: `webinar-cybersecurity`, `tradeshow-smau`

#### UTM Content (`utm_content`)
- `header-cta` - Header call-to-action
- `hero-button` - Main hero button
- `pricing-card` - Pricing section CTA
- `sidebar-form` - Sidebar contact form
- `footer-link` - Footer navigation
- `emergency-banner` - Emergency contact banner

#### UTM Term (`utm_term`)
- Reserved for paid search keywords
- Geographic modifiers: `assistenza-it-milano`, `cybersecurity-monza`
- Service-specific: `supporto-tecnico`, `backup-cloud`, `penetration-test`

---

## 📍 Source Attribution System

### Automatic Source Detection

#### Direct Traffic Attribution
```javascript
// URL: www.it-era.it/assistenza-it-milano.html
const source = {
  type: 'direct',
  url_params: '?src=direct',
  attribution: 'Direct Navigation'
};
```

#### Organic Search Attribution
```javascript
// From Google search results
const source = {
  type: 'organic',
  url_params: '?src=organic-assistenza-it-milano',
  attribution: 'Google Organic Search',
  keyword: document.referrer // if available
};
```

#### Service Page Attribution
```javascript
// Navigation from service overview to city page
const source = {
  type: 'internal',
  url_params: '?src=service-assistenza-it',
  attribution: 'Internal Service Navigation',
  previous_page: document.referrer
};
```

#### Blog Attribution
```javascript
// From blog post to service page
const source = {
  type: 'content',
  url_params: '?src=blog-cybersecurity-tips-2025',
  attribution: 'Blog Content',
  content_type: 'educational'
};
```

### Attribution Priority (First-Click vs Last-Click)
1. **First-Click**: Track initial visitor source
2. **Last-Click**: Track final conversion source
3. **Multi-Touch**: Credit multiple touchpoints

---

## 📈 Google Analytics 4 Configuration

### Enhanced Ecommerce Setup

#### Custom Dimensions
1. **City**: Geographic location from URL
2. **Service**: Main service category
3. **Lead Score**: Calculated lead quality
4. **User Segment**: Business size/type
5. **Referral Source**: Detailed source attribution
6. **Page Template**: Template type (service/city/blog)
7. **Contact Method**: Preferred contact method
8. **Urgency Level**: Normal vs emergency requests
9. **Service Bundle**: Multi-service interest
10. **Geographic Region**: Lombardy sub-regions

#### Custom Metrics
1. **Form Completion Rate**: Percentage of started forms completed
2. **Time to Contact**: Time from landing to contact action
3. **Page Depth**: Average pages viewed per session
4. **Service Interest Score**: Calculated service affinity
5. **Geographic Coverage**: Cities served per session

### Goal Configuration

#### Primary Goals
1. **Contact Form Submission** (Conversion)
   - Priority: High
   - Value: €100 (average lead value)
   
2. **Phone Call Click** (Conversion)
   - Priority: High
   - Value: €150 (higher intent)
   
3. **Email Contact** (Conversion)
   - Priority: Medium
   - Value: €75

#### Secondary Goals
1. **Resource Download** (Engagement)
   - Priority: Medium
   - Value: €25

2. **Video View Complete** (Engagement)
   - Priority: Low
   - Value: €10

3. **Multi-Page Session** (Engagement)
   - Priority: Low
   - Value: €5

### Audience Segmentation

#### Geographic Segments
- **Milano Metro**: Milano, Monza, surrounding areas
- **Bergamo Zone**: Bergamo and province
- **Como/Lecco**: Northern Lombardy
- **Brianza**: Monza-Brianza specific

#### Service Interest Segments
- **IT Support Seekers**: Assistenza IT focused
- **Security Conscious**: Cybersecurity interested
- **Cloud Adopters**: Cloud storage focused
- **Multi-Service**: Interest in multiple services

#### Behavioral Segments
- **High Intent**: Multiple page views, form starts
- **Research Mode**: Long sessions, resource downloads
- **Emergency**: Direct to phone/contact
- **Price Sensitive**: Pricing page focused

---

## 🎛️ Google Tag Manager Configuration

### Container Structure

#### Tags
1. **GA4 Configuration Tag**
2. **Form Submission Tag**
3. **Phone Click Tag**
4. **Email Click Tag**
5. **WhatsApp Click Tag**
6. **Download Tracking Tag**
7. **Scroll Depth Tag**
8. **Video Tracking Tag**

#### Triggers
1. **Page View** - All pages
2. **Form Submit** - Contact forms
3. **Click - Phone Links** - tel: links
4. **Click - Email Links** - mailto: links
5. **Click - WhatsApp** - WhatsApp buttons
6. **Click - Downloads** - Resource downloads
7. **Scroll Depth** - 25%, 50%, 75%, 100%
8. **Video Interaction** - Play, pause, complete

#### Variables
1. **Service Type** - Extract from URL
2. **City Name** - Extract from URL
3. **UTM Parameters** - All UTM values
4. **Referrer Domain** - Clean referrer
5. **User Agent** - Device/browser info
6. **Page Category** - Template type
7. **Lead Score** - Calculated value

### Advanced Tracking Features

#### Heat Map Integration
```javascript
// Integration with Hotjar/FullStory
window.dataLayer.push({
  event: 'heatmap_session',
  session_id: 'hotjar_session_id',
  user_segment: getUserSegment()
});
```

#### A/B Testing Support
```javascript
// Integration with Optimize/VWO
window.dataLayer.push({
  event: 'experiment_view',
  experiment_id: 'contact_form_variant',
  variant: 'version_b'
});
```

---

## 🔍 Attribution Modeling

### Multi-Touch Attribution

#### Attribution Models
1. **First-Click**: 100% credit to first touchpoint
2. **Last-Click**: 100% credit to last touchpoint
3. **Linear**: Equal credit across all touchpoints
4. **Time-Decay**: More credit to recent touchpoints
5. **Position-Based**: 40% first, 40% last, 20% middle

#### Customer Journey Mapping
```javascript
// Track user journey across sessions
const journeyTracking = {
  first_visit: '2025-01-15',
  touchpoints: [
    { source: 'google_organic', page: '/sicurezza-informatica', date: '2025-01-15' },
    { source: 'direct', page: '/sicurezza-informatica-milano', date: '2025-01-16' },
    { source: 'email', page: '/contatti', date: '2025-01-17', converted: true }
  ],
  conversion_value: 150,
  attribution_model: 'time_decay'
};
```

---

## 📱 Mobile & Cross-Device Tracking

### Mobile-Specific Events
- `mobile_menu_toggle` - Mobile menu interactions
- `mobile_phone_tap` - Mobile phone number taps
- `mobile_form_abandon` - Mobile form abandonment
- `mobile_scroll_speed` - Mobile scrolling behavior

### Cross-Device Considerations
- User ID tracking for logged users
- Device fingerprinting (privacy-compliant)
- Cross-device conversion attribution

---

## 🚀 Implementation Roadmap

### Phase 1: Core Tracking (Week 1-2)
- [ ] Implement basic GA4 tracking
- [ ] Form submission tracking
- [ ] Phone click tracking
- [ ] UTM parameter detection

### Phase 2: Enhanced Analytics (Week 3-4)
- [ ] Custom dimensions setup
- [ ] Goal configuration
- [ ] Audience segmentation
- [ ] Basic attribution modeling

### Phase 3: Advanced Features (Week 5-6)
- [ ] GTM container optimization
- [ ] Cross-device tracking
- [ ] Heat map integration
- [ ] A/B testing setup

### Phase 4: Optimization (Week 7-8)
- [ ] Attribution model refinement
- [ ] Custom dashboard creation
- [ ] Automated reporting
- [ ] Performance monitoring

---

## 📊 Reporting & KPIs

### Weekly KPIs
- Lead generation by service/city
- Conversion rate by traffic source
- Cost per lead (paid channels)
- Average session duration

### Monthly KPIs
- Customer acquisition cost
- Lifetime value trends
- Geographic performance
- Service adoption rates

### Quarterly KPIs
- Attribution model effectiveness
- Channel ROI analysis
- Market penetration by city
- Competitive analysis

---

## 🔒 Privacy & Compliance

### GDPR Compliance
- Cookie consent implementation
- Data anonymization
- User right to deletion
- Privacy policy alignment

### Data Retention
- Raw data: 26 months
- Aggregated data: Indefinite
- User identifiers: 14 months
- Cross-device data: 26 months

---

## 🛠️ Technical Requirements

### Server-Side Tracking
- Google Analytics Measurement Protocol
- Facebook Conversions API
- Server-side GTM container

### Client-Side Tracking
- GA4 gtag implementation
- Enhanced ecommerce tracking
- Custom event tracking

### Data Quality
- Bot filtering
- Internal traffic exclusion
- Data validation rules
- Anomaly detection

---

*Document Version: 1.0*  
*Last Updated: January 2025*  
*Owner: IT-ERA Analytics Team*