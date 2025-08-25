# IT-ERA TROUBLESHOOTING GUIDE
**Comprehensive Issue Resolution & Support Manual**

---

## 🆘 EMERGENCY CONTACTS

### Critical System Failures
- **24/7 Emergency Line**: 039 888 2041
- **CTO Direct**: extension 101
- **Operations Manager**: extension 102
- **Cloudflare Status**: status.cloudflare.com
- **Emergency Email**: emergency@it-era.it

### Escalation Matrix
```
Level 1: Website/Chatbot Issues → Technical Support
Level 2: System Outage → CTO + Operations Manager  
Level 3: Security Incident → CTO + Legal + External Security Team
Level 4: Complete Service Failure → CEO + All Department Heads
```

---

## 🔍 QUICK DIAGNOSIS CHECKLIST

### System Status Check (First 2 Minutes)
1. **Check Cloudflare Status**: Visit status.cloudflare.com
2. **Test Main Website**: Load it-era.bulltech.it
3. **Test Chatbot**: Click chat widget on any page
4. **Check Teams Notifications**: Verify recent alerts
5. **Review Error Logs**: Check admin dashboard

### Severity Classification
- **P1 - Critical**: Complete system down, revenue impact
- **P2 - High**: Major functionality impaired, user impact  
- **P3 - Medium**: Minor issues, workarounds available
- **P4 - Low**: Cosmetic issues, no functional impact

---

## 🌐 WEBSITE ISSUES

### Website Won't Load (P1 - Critical)

#### Symptoms
- Main website (it-era.bulltech.it) returns errors
- Pages time out or show "Service Unavailable"
- All or most pages affected globally

#### Immediate Actions (Within 5 Minutes)
1. **Check Cloudflare Status**
   ```bash
   # Visit status.cloudflare.com
   # Check "Cloudflare Pages" service status
   ```

2. **Test from Multiple Locations**
   ```bash
   # Use downforeveryoneorjustme.com/it-era.bulltech.it
   # Test from mobile network vs office network
   # Ask remote team members to test
   ```

3. **Check DNS Resolution**
   ```bash
   nslookup it-era.bulltech.it
   # Should return Cloudflare IPs
   # If no response, DNS issue
   ```

#### Resolution Steps
```bash
# If DNS issue
1. Contact domain registrar immediately
2. Check DNS settings in Cloudflare dashboard
3. Verify nameserver configuration

# If Cloudflare issue  
1. Check Cloudflare status page
2. Review Cloudflare dashboard for alerts
3. Contact Cloudflare support if widespread outage

# If pages deployment issue
1. wrangler pages publish web --project-name=it-era
2. Check deployment status in dashboard
3. Rollback to previous version if needed
```

#### Prevention
- Monitor DNS TTL settings (keep at 300 seconds max)
- Set up external uptime monitoring (UptimeRobot, Pingdom)
- Maintain backup DNS provider

### Slow Website Performance (P2 - High)

#### Symptoms
- Pages load >3 seconds consistently  
- Poor Core Web Vitals scores
- User complaints about performance

#### Diagnostic Steps
1. **Performance Testing**
   ```bash
   # Run PageSpeed Insights
   pagespeed.web.dev/report?url=https://it-era.bulltech.it
   
   # Check GTmetrix  
   gtmetrix.com/reports/it-era.bulltech.it/
   
   # Test with WebPageTest
   webpagetest.org
   ```

2. **Check CDN Performance**
   ```bash
   # Test from multiple global locations
   # Check cache hit rates in Cloudflare Analytics
   # Review bandwidth usage patterns
   ```

#### Common Causes & Solutions
```javascript
// Large image files
Solution: Implement WebP conversion, image compression

// Unoptimized CSS/JS
Solution: Minify assets, remove unused code

// Poor caching configuration
Solution: Review Cloudflare Page Rules, set proper TTL

// Database query issues (if using D1)
Solution: Optimize queries, implement caching layer

// Third-party scripts
Solution: Audit and remove unnecessary external scripts
```

### Individual Page Errors (P3 - Medium)

#### Symptoms  
- Specific pages return 404 or 500 errors
- Some pages load, others don't
- Random page failures

#### Investigation Process
1. **Identify Pattern**
   ```bash
   # Check which pages are affected
   # Look for common characteristics
   # Review deployment logs
   ```

2. **Check File Structure**
   ```bash
   # Verify files exist in web/ directory
   # Check file permissions and naming
   # Look for case sensitivity issues
   ```

3. **Review Recent Changes**
   ```bash
   git log --oneline --since="24 hours ago"
   # Check if recent deployments broke specific pages
   # Compare working vs broken page structure
   ```

#### Common Fixes
```bash
# Redeploy specific pages
wrangler pages deploy web --project-name=it-era

# Check for file naming issues  
find web/ -name "*.html" -exec echo {} \;

# Verify page template integrity
grep -r "{{CITY}}" templates/
```

---

## 🤖 CHATBOT ISSUES

### Chatbot Widget Not Loading (P2 - High)

#### Symptoms
- Chat icon doesn't appear on pages
- Widget visible but clicking does nothing  
- JavaScript errors in browser console

#### Immediate Diagnosis
1. **Check Browser Console**
   ```javascript
   // Open Developer Tools (F12)
   // Look for JavaScript errors
   // Check Network tab for failed requests
   ```

2. **Test Widget Initialization**  
   ```javascript
   // In browser console, check if widget loaded
   console.log(window.ITERAChatWidget);
   
   // Try manual initialization
   if (window.ITERAChatWidget) {
     window.ITERAChatWidget.init();
   }
   ```

#### Common Causes & Solutions
```javascript
// API endpoint configuration issue
Problem: Widget trying to connect to wrong URL
Solution: Check widget endpoint configuration in chat-widget.js

// JavaScript conflicts  
Problem: Other scripts interfering with widget
Solution: Load widget after other scripts, check for conflicts

// CSP or CORS issues
Problem: Security policies blocking widget
Solution: Update Content Security Policy headers

// Network connectivity  
Problem: Client network blocking chatbot domain
Solution: Provide alternative contact methods
```

#### Resolution Steps
```bash
# 1. Check worker deployment status
wrangler deployments list --name=it-era-chatbot

# 2. Test API endpoint directly
curl -X POST https://it-era-chatbot.bulltech.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"action":"start","message":"test"}'

# 3. Redeploy if needed
wrangler deploy --name=it-era-chatbot

# 4. Check KV storage access
wrangler kv:namespace list
```

### Chatbot Not Responding (P1 - Critical)

#### Symptoms
- Widget loads but messages don't get responses
- Messages sent but no reply received
- Timeout errors in chat interface

#### Emergency Response Protocol
```bash
# 1. Immediate failsafe (within 2 minutes)
# Add temporary notice to website:
"Our AI assistant is temporarily unavailable. 
Please call 039 888 2041 or email info@it-era.it 
for immediate assistance."

# 2. Check system status
wrangler tail --name=it-era-chatbot --format=pretty

# 3. Test worker health  
curl https://it-era-chatbot.bulltech.workers.dev/health
```

#### Diagnostic Steps
1. **Check Worker Logs**
   ```bash
   wrangler tail --name=it-era-chatbot --format=pretty
   # Look for error patterns
   # Check for timeout issues
   # Monitor memory usage
   ```

2. **Test AI Integration**
   ```bash
   # Check if AI provider is accessible
   curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
        https://openrouter.ai/api/v1/chat/completions
   
   # Verify API key and quotas
   ```

3. **Check KV Storage**
   ```bash
   # Test session storage
   wrangler kv:key get "test-session" --namespace-id=CHAT_SESSIONS
   
   # Check storage limits
   wrangler kv:namespace list
   ```

#### Resolution Priority
```javascript
// 1. Restore basic functionality (Rule-based responses)
Update worker to use fallback mode only

// 2. Fix AI integration
Check API keys, quotas, network connectivity  

// 3. Restore full functionality
Test end-to-end conversation flow

// 4. Monitor recovery
Watch logs for 30 minutes post-fix
```

### Teams Integration Not Working (P3 - Medium)

#### Symptoms
- Chatbot escalates but no Teams notifications
- Teams messages malformed or incomplete
- Notifications delayed significantly

#### Investigation Steps
1. **Test Webhook URL**
   ```bash
   # Test Teams webhook directly
   curl -X POST $TEAMS_WEBHOOK_URL \
     -H "Content-Type: application/json" \
     -d '{"text": "Test notification from IT-ERA chatbot"}'
   ```

2. **Check Webhook Configuration**
   ```javascript
   // Verify webhook URL in wrangler.toml
   grep -A 5 "TEAMS_WEBHOOK_URL" api/wrangler-chatbot.toml
   
   // Check URL format and validity
   // Ensure no extra spaces or characters
   ```

3. **Review Message Format**
   ```javascript
   // Check Teams card JSON structure
   // Verify all required fields present
   // Test with simplified message format
   ```

#### Common Solutions
```bash
# 1. Regenerate Teams webhook URL
# Go to Teams → Connectors → Incoming Webhook → Configure

# 2. Update configuration
wrangler secret put TEAMS_WEBHOOK_URL --name=it-era-chatbot

# 3. Test with simple message
# Use basic text instead of complex cards if issues persist

# 4. Check Teams channel permissions
# Ensure webhook has posting permissions in target channel
```

---

## 🔐 SECURITY INCIDENTS

### Suspected Security Breach (P1 - Critical)

#### Immediate Response (First 15 Minutes)
```bash
# 1. Document everything - DO NOT investigate yet
echo "$(date): Security incident reported" >> incident.log

# 2. Isolate affected systems
# If chatbot compromised: wrangler deployments rollback

# 3. Notify security team
# CTO + Legal team immediately
# External security consultant if needed

# 4. Preserve evidence
# Do not modify logs or system state
# Take screenshots of any anomalous behavior
```

#### Investigation Protocol
1. **Initial Assessment** (Minutes 15-30)
   - Identify scope of potential breach
   - Check for data exfiltration indicators  
   - Review recent system access logs
   - Assess customer data exposure risk

2. **Containment** (Minutes 30-60)
   - Block suspicious IP addresses
   - Rotate API keys and secrets
   - Enable additional logging and monitoring
   - Prepare communication for affected customers

3. **Evidence Collection** (Hours 1-4)
   - Export all relevant logs
   - Document timeline of events
   - Identify attack vectors used
   - Assess data integrity

#### Security Checklist
```bash
# Check for common indicators
grep -i "injection\|script\|eval\|exec" /var/log/chatbot.log
grep -A 10 -B 10 "401\|403\|429" access.log

# Review recent configuration changes  
git log --since="7 days ago" --grep="secret\|key\|token"

# Check for unusual traffic patterns
wrangler analytics query --sort-by=requests --limit=100

# Verify SSL/TLS configuration
openssl s_client -connect it-era.bulltech.it:443
```

### DDoS or High Traffic Attack (P2 - High)

#### Symptoms
- Extremely high traffic volume suddenly
- Response times degrading rapidly  
- Error rates increasing significantly
- Cloudflare showing attack mitigation

#### Immediate Response
```bash
# 1. Enable Cloudflare DDoS protection  
# Go to Security → DDoS → Enable "I'm Under Attack" mode

# 2. Check traffic patterns
# Review Cloudflare Analytics for suspicious patterns
# Look for traffic from specific countries/IPs

# 3. Implement rate limiting
# Increase rate limiting rules in chatbot worker
# Block suspicious IP ranges if identified

# 4. Scale resources if needed
# Cloudflare Workers auto-scale, but monitor quotas
```

#### Mitigation Steps
1. **Traffic Analysis**
   ```bash
   # Check top requesting IPs
   # Look for unusual user agents  
   # Identify attack patterns (specific endpoints, etc.)
   ```

2. **Progressive Response**
   ```bash
   # Level 1: Enable browser challenge
   # Level 2: Block specific countries if attack originated there
   # Level 3: Enable "I'm Under Attack" mode
   # Level 4: Contact Cloudflare support for emergency assistance
   ```

### Data Privacy Incident (P1 - Critical)

#### Scenarios
- Personal data accidentally exposed
- Chatbot reveals sensitive information
- GDPR compliance violation

#### Immediate Actions
```bash
# 1. Stop data collection (within 5 minutes)
# Temporarily disable chatbot if it's the source

# 2. Assess scope (within 30 minutes)  
# How much data? How many people affected?
# What type of data? PII, financial, health?

# 3. Legal notification (within 2 hours)
# Internal legal team immediately
# Prepare GDPR breach notification if EU citizens affected
# Consider external legal counsel

# 4. Customer notification (within 24-72 hours)
# Required by GDPR if high risk to individuals
# Prepare clear, honest communication
```

#### Documentation Requirements
```markdown
# Incident Report Template
Date/Time: [When detected]
Discovery Method: [How was it found]
Data Types Affected: [PII, financial, etc.]
Number of Records: [Estimated count]
Root Cause: [Technical failure, human error, etc.]
Immediate Actions: [What was done to stop it]
Affected Individuals: [How many, which categories]
Remediation Plan: [Steps to prevent recurrence]
```

---

## ⚡ PERFORMANCE ISSUES

### Slow Response Times (P2 - High)

#### Performance Targets
- Website pages: <2 seconds
- Chatbot simple responses: <2 seconds
- Chatbot AI responses: <8 seconds
- API health check: <500ms

#### Diagnostic Tools
```bash
# 1. Real User Monitoring
# Check Cloudflare Analytics → Performance
# Look for Core Web Vitals trends

# 2. Synthetic Testing  
curl -w "@curl-format.txt" https://it-era.bulltech.it/
# Where curl-format.txt contains:
# time_namelookup:  %{time_namelookup}\n
# time_connect:     %{time_connect}\n  
# time_appconnect:  %{time_appconnect}\n
# time_pretransfer: %{time_pretransfer}\n
# time_redirect:    %{time_redirect}\n
# time_starttransfer: %{time_starttransfer}\n
# time_total:       %{time_total}\n

# 3. Check Worker Performance
wrangler tail --name=it-era-chatbot --format=pretty | grep -i "duration"
```

#### Common Performance Fixes
```javascript
// 1. Optimize AI response time
- Reduce AI prompt complexity
- Implement response caching for common queries
- Set aggressive timeouts (8s max)

// 2. Improve website speed
- Enable Cloudflare Page Rules for static assets
- Optimize images (WebP, compression)
- Minify CSS/JS files

// 3. Database query optimization
- Add indexes to frequently queried fields
- Implement query result caching
- Use connection pooling

// 4. CDN optimization
- Set appropriate cache headers
- Use Cloudflare Argo for dynamic content
- Enable Mirage for image optimization
```

### Memory or Resource Issues (P3 - Medium)

#### Worker Resource Limits
- Memory: 128MB per request
- CPU Time: 50ms per request (paid plans: 30 seconds)
- Subrequests: 50 per request
- KV operations: 1000 per request

#### Monitoring Commands
```bash
# Check current resource usage
wrangler tail --name=it-era-chatbot --format=pretty | grep -E "(memory|cpu|exceeded)"

# Monitor KV usage
wrangler kv:namespace list | grep -E "(CHAT_SESSIONS|SHARED_CONFIG)"

# Check request patterns
wrangler analytics query --sort-by=requests --since=24h
```

#### Resource Optimization
```javascript
// Memory optimization
- Minimize variable scope
- Clean up large objects after use  
- Use streaming for large responses
- Implement efficient data structures

// CPU optimization
- Cache expensive calculations
- Use Web Workers for heavy processing
- Implement request debouncing
- Optimize regular expressions

// KV storage optimization  
- Set appropriate TTL values
- Clean up expired sessions
- Use batch operations where possible
- Implement data compression
```

---

## 🔧 INTEGRATION ISSUES  

### API Integration Failures

#### OpenRouter API Issues
```bash
# Test API connectivity
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     -H "Content-Type: application/json" \
     https://openrouter.ai/api/v1/models

# Check account balance
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     https://openrouter.ai/api/v1/account/balance

# Common error codes:
# 401: Invalid API key
# 429: Rate limit exceeded
# 503: Service unavailable
```

#### Resolution Steps
```javascript
// 1. Verify API credentials
Check wrangler secrets list --name=it-era-chatbot

// 2. Test with simplified request
Use basic completion endpoint with minimal parameters

// 3. Implement fallback chain
AI Provider 1 → AI Provider 2 → Rule-based responses

// 4. Monitor costs and limits
Set up alerts for daily spending limits
```

### KV Storage Issues

#### Common KV Problems
```bash
# Storage quota exceeded
wrangler kv:namespace get-metadata --namespace-id=CHAT_SESSIONS

# Key not found errors
wrangler kv:key list --namespace-id=CHAT_SESSIONS --limit=10

# Write failures
wrangler kv:key put "test-key" "test-value" --namespace-id=CHAT_SESSIONS
```

#### KV Troubleshooting
```javascript
// 1. Check storage limits
// Free tier: 1GB, 1000 write operations/day
// Paid: 1GB included, $0.50/GB thereafter

// 2. Implement cleanup procedures  
// Delete expired sessions automatically
// Compress stored data when possible

// 3. Error handling
// Graceful degradation when storage unavailable
// Fallback to in-memory storage for critical data

// 4. Monitoring
// Track storage usage trends
// Alert when approaching limits
```

---

## 📊 MONITORING & ALERTING

### System Health Monitoring

#### Key Metrics to Monitor
```javascript
// Availability metrics
Uptime: Target >99.9%
Response time: Target <2s average
Error rate: Target <0.1%

// Business metrics  
Conversations/day: Baseline 25, target 50+
Lead conversion: Target 15%
High-priority leads: Target 5+/day

// Technical metrics
Worker memory usage: <80% of limit
KV operations: <500/request
API costs: <€50/day
```

#### Setting Up Alerts
```bash
# Cloudflare alerts (via dashboard)
1. Go to Notifications → Create
2. Set thresholds for:
   - Workers CPU exceeded 
   - Error rate >1%
   - Traffic spike >200% normal

# External monitoring  
1. UptimeRobot for uptime monitoring
2. New Relic/DataDog for performance
3. Custom webhook alerts for business metrics
```

#### Daily Health Check Script
```bash
#!/bin/bash
# daily-health-check.sh

echo "IT-ERA System Health Check - $(date)"

# Test main website
if curl -f -s https://it-era.bulltech.it > /dev/null; then
    echo "✅ Website: Online"
else  
    echo "❌ Website: Offline"
fi

# Test chatbot API
if curl -f -s https://it-era-chatbot.bulltech.workers.dev/health > /dev/null; then
    echo "✅ Chatbot API: Online"
else
    echo "❌ Chatbot API: Offline"  
fi

# Check recent error rates
echo "Recent errors:"
wrangler tail --name=it-era-chatbot --format=json --once | grep -i error | wc -l
```

### Log Analysis

#### Important Log Patterns to Watch
```bash
# Error patterns
grep -E "(error|failed|timeout|exception)" logs/chatbot.log

# Security patterns  
grep -E "(injection|script|unauthorized|forbidden)" logs/access.log

# Performance patterns
grep -E "(slow|timeout|memory|cpu)" logs/performance.log

# Business patterns
grep -E "(escalation|high.priority|lead.score)" logs/business.log
```

#### Automated Log Analysis
```javascript
// Set up log parsing rules for:
- Failed authentication attempts (security)
- Repeated errors from same IP (potential attack)
- High response times (performance issues)
- AI fallback usage (quality issues)
- Escalation patterns (business insights)
```

---

## 📱 USER SUPPORT

### Common User Issues

#### "Chatbot Won't Work"
```markdown
Diagnosis Questions:
1. What device and browser are you using?
2. Do you see the chat icon on the page?
3. What happens when you click it?
4. Are you on a corporate network?
5. Do you have any browser extensions/ad blockers?

Quick Solutions:
- Try refreshing the page
- Disable ad blockers temporarily  
- Try a different browser
- Use incognito/private browsing mode
- Check if JavaScript is enabled
```

#### "Not Getting Responses" 
```markdown
Diagnosis Questions:
1. Do you see your messages in the chat?
2. Is there a "typing" indicator?
3. How long have you been waiting?
4. What did you ask about?

Quick Solutions:
- Wait 30 seconds (AI responses take time)
- Try asking a simpler question
- Refresh and start over
- Ask to speak with a human
```

#### "Wrong Information Provided"
```markdown
Diagnosis Questions:  
1. What information was incorrect?
2. What did you ask specifically?
3. What should the correct answer be?

Actions:
- Escalate to human specialist immediately
- Document the incorrect response for AI training
- Provide correct information manually
- Follow up to ensure satisfaction
```

### Support Response Templates

#### Initial Response (Within 2 Hours)
```
Dear [Name],

Thank you for contacting IT-ERA regarding [issue]. I understand 
you're experiencing [specific problem] and I want to help resolve 
this quickly.

I've reviewed your case and [specific next steps]. I expect to 
have [resolution/update] for you by [timeframe].

In the meantime, if this is urgent, please call us directly at 
039 888 2041 for immediate assistance.

Best regards,
[Name] - IT-ERA Support Team
```

#### Resolution Follow-up
```
Dear [Name],

I wanted to follow up on the [issue] you reported. Based on our 
investigation, [explanation of what happened] and we've [actions taken].

To prevent this in the future, we're [preventive measures].

Is everything working correctly for you now? Please don't hesitate 
to reach out if you have any questions or concerns.

We appreciate your patience and feedback - it helps us improve 
our service for everyone.

Best regards,  
[Name] - IT-ERA Support Team
```

---

## 🔄 MAINTENANCE PROCEDURES

### Regular Maintenance Schedule

#### Daily (Automated)
- Health check monitoring
- Error log review  
- Performance metrics collection
- Backup validation

#### Weekly (Manual)
- Comprehensive system testing
- Security scan execution
- Performance optimization review
- Customer feedback analysis

#### Monthly (Planned)
- System update deployment
- Comprehensive security audit  
- Business metrics analysis
- Documentation updates

#### Quarterly (Strategic)
- Major feature deployment
- Infrastructure scaling review
- Disaster recovery testing
- Team training updates

### Maintenance Windows

#### Scheduled Maintenance
```
Preferred Window: Sundays 2:00-4:00 AM CET
Impact: Minimal (mostly development/staging)
Notification: 48 hours advance notice
Rollback Plan: Always prepared before changes

Emergency Maintenance:
Authority: CTO approval required  
Notification: Immediate via all channels
Documentation: Full post-incident review
```

#### Maintenance Checklist
```bash
# Pre-maintenance  
1. Backup current system state
2. Prepare rollback procedures
3. Notify team and stakeholders
4. Test changes in staging first

# During maintenance
1. Document all changes made
2. Test functionality after each change  
3. Monitor system performance
4. Keep communication channels open

# Post-maintenance
1. Verify all systems operational
2. Run comprehensive test suite
3. Monitor for 24 hours post-change
4. Update documentation as needed
```

---

## 📞 SUPPORT ESCALATION PROCEDURES

### Internal Escalation Levels

#### Level 1: Technical Support (Response: 2 hours)
- Basic functionality issues
- User guidance and training
- Simple configuration problems
- Standard troubleshooting

#### Level 2: Senior Technical (Response: 4 hours)  
- Complex integration issues
- Performance optimization needs
- Advanced configuration requirements
- Multi-system problems

#### Level 3: CTO/Architecture (Response: Same day)
- System design changes needed  
- Security incidents
- Major functionality failures
- Strategic technical decisions

#### Level 4: Executive (Response: Immediate)
- Complete system outages
- Data breach incidents  
- Legal/compliance issues
- Business-critical failures

### External Support Resources

#### Cloudflare Support
- **Enterprise Support**: 1-hour response for critical issues
- **Dashboard**: dash.cloudflare.com → Support
- **Status**: status.cloudflare.com
- **Documentation**: developers.cloudflare.com

#### Security Incident Response
- **Primary**: Internal security team
- **Backup**: External cybersecurity consultant
- **Legal**: Data privacy lawyer (GDPR compliance)
- **Forensics**: Digital forensics specialist (if needed)

---

*IT-ERA Troubleshooting Guide v2.0*  
*Last Updated: August 25, 2025*  
*Emergency Contact: 039 888 2041*  
*Next Review: September 25, 2025*