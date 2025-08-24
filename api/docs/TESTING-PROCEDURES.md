# IT-ERA AI Chatbot Testing Procedures

## Standard Testing Protocols
**Version**: 1.0  
**Date**: 2025-08-24  
**Maintained by**: Testing Team  

---

## 📋 Overview

This document outlines the standard testing procedures for the IT-ERA AI chatbot system, ensuring consistent quality validation across development, staging, and production environments.

---

## 🔄 Testing Workflow

### 1. Pre-Development Testing
**When**: Before code changes  
**Duration**: 10-15 minutes  
**Purpose**: Establish baseline functionality

```bash
# Quick health check
./tests/ai/run-ai-tests.sh --parallel --env development

# Verify baseline metrics
curl http://localhost:8788/health
```

**Exit Criteria**:
- All existing tests pass
- Response times within normal range
- No critical errors in logs

### 2. Feature Development Testing  
**When**: During feature development  
**Duration**: 20-30 minutes  
**Purpose**: Validate new functionality

```bash
# Run relevant test suites
node tests/ai/comprehensive-ai-chatbot-tests.js  # Core functionality
node tests/ai/italian-conversation-tests.js     # Language features
node tests/ai/failover-fallback-tests.js        # Resilience features

# Performance validation
node tests/ai/performance-benchmark-tests.js
```

**Exit Criteria**:
- New functionality tests pass
- Existing functionality unaffected  
- Performance metrics maintained
- Italian conversation quality preserved

### 3. Integration Testing
**When**: Before merging to main branch  
**Duration**: 45-60 minutes  
**Purpose**: Comprehensive system validation

```bash
# Full test suite with reporting
./tests/ai/run-ai-tests.sh --verbose

# Generate comprehensive reports
open tests/reports/comprehensive-test-report-*.html
```

**Exit Criteria**:
- 95% or higher overall success rate
- All critical scenarios pass
- Performance benchmarks met
- No regression in existing features

### 4. Pre-Production Testing
**When**: Before production deployment  
**Duration**: 60-90 minutes  
**Purpose**: Final validation for production readiness

```bash
# Staging environment testing
./tests/ai/run-ai-tests.sh --env staging --api-endpoint https://staging-api.it-era.it

# Load testing
./tests/ai/run-ai-tests.sh --parallel --stress-test

# Security validation
./tests/ai/run-security-tests.sh
```

**Exit Criteria**:
- All tests pass on staging environment
- Load testing validates scalability
- Security requirements met
- Rollback procedures tested

---

## 🎯 Test Categories & Procedures

### Category 1: Functional Testing

#### AI Integration Tests
**Frequency**: Every commit  
**Execution Time**: 15-20 minutes  

```bash
# Core AI functionality
node tests/ai/comprehensive-ai-chatbot-tests.js
```

**Test Coverage**:
- ✅ OpenRouter API integration
- ✅ Intent recognition accuracy  
- ✅ Response quality validation
- ✅ Cost control mechanisms
- ✅ Lead qualification logic
- ✅ Teams notification system

**Success Criteria**:
```
AI Response Rate: ≥95%
Intent Recognition: ≥90%
Cost Control: Active and functioning  
Teams Integration: 100% notification delivery
Response Relevance: ≥90%
```

#### Italian Conversation Tests
**Frequency**: Every language-related change  
**Execution Time**: 10-15 minutes

```bash
# Natural language processing
node tests/ai/italian-conversation-tests.js
```

**Test Coverage**:
- ✅ Natural Italian conversation flow
- ✅ Regional context (Lombardia/Brianza)
- ✅ Business terminology accuracy
- ✅ Cultural sensitivity validation
- ✅ Multi-turn context awareness

**Success Criteria**:
```
Language Accuracy: ≥90%
Cultural Sensitivity: ≥90%
Context Continuity: ≥90%
Regional Awareness: ≥85%
Business Tone: Appropriate and professional
```

### Category 2: Resilience Testing

#### Failover & Fallback Tests
**Frequency**: Weekly or before major releases  
**Execution Time**: 20-25 minutes

```bash
# System resilience validation
node tests/ai/failover-fallback-tests.js
```

**Test Coverage**:
- ✅ AI service timeouts (8s limit)
- ✅ Network connectivity issues
- ✅ API error handling (500, 429, 401)
- ✅ Graceful degradation scenarios
- ✅ Recovery time validation

**Success Criteria**:
```
Fallback Activation: ≤5%
Recovery Time: ≤2 seconds
User Experience Impact: Minimal
Service Continuity: 100%
Error Handling: Graceful with informative messages
```

### Category 3: Performance Testing

#### Benchmark Testing
**Frequency**: Weekly or after performance changes  
**Execution Time**: 30-40 minutes

```bash
# Performance and scalability
node tests/ai/performance-benchmark-tests.js
```

**Test Coverage**:
- ✅ Response time optimization
- ✅ Concurrent user handling  
- ✅ Memory usage patterns
- ✅ Cache efficiency
- ✅ Load scenario simulation

**Success Criteria**:
```
Response Time: <10 seconds (normal), <2 seconds (fallback)
Concurrent Users: Handle 20+ users simultaneously
Memory Usage: Stable without leaks
Cache Hit Rate: >20%
Throughput: >10 requests/second under load
```

---

## 📊 Test Data Management

### Test Data Requirements

#### Sample User Inputs (Italian)
```javascript
// Business Inquiries
"Ho bisogno di assistenza IT per la mia azienda di 20 persone a Monza"
"Siamo una media impresa con 30 dipendenti, cerchiamo un partner IT affidabile"
"Vorrei un preventivo per firewall WatchGuard"

// Emergency Scenarios  
"Il server è down da questa mattina, è urgente!"
"Sistema bloccato, non riusciamo a lavorare"
"Problema grave con la rete aziendale"

// Regional Context
"Siamo a Vimercate, venite anche qui?"
"La nostra sede è a Monza, fate interventi?"
"Siamo a Milano, coprite anche quella zona?"

// Technical Requests
"Che tipo di firewall consigliate per 25 dipendenti?"
"Servizi di backup per aziende"
"Consulenza per trasformazione digitale"
```

#### Expected Company Data
```javascript
// IT-ERA Information (must be accurate)
{
  company: "IT-ERA", 
  phone: "039 888 2041",
  location: "Viale Risorgimento, 32, Vimercate",
  specialization: "Partner WatchGuard certificati",
  coverage: "Provincia di Monza e Brianza, Milano Est"
}
```

### Test Environment Setup

#### Development Environment
```bash
# Local development setup
export NODE_ENV=development
export CHATBOT_API_ENDPOINT=http://localhost:8788/api/chat
export VERBOSE=true

# Start local worker
wrangler dev --port 8788

# Run tests
./tests/ai/run-ai-tests.sh
```

#### Staging Environment  
```bash
# Staging configuration
export NODE_ENV=staging
export CHATBOT_API_ENDPOINT=https://staging-chatbot.it-era.it/api/chat
export OPENAI_API_KEY=${STAGING_OPENAI_KEY}
export TEAMS_WEBHOOK_URL=${STAGING_TEAMS_WEBHOOK}

# Run full test suite
./tests/ai/run-ai-tests.sh --env staging
```

#### Production Environment
```bash
# Production validation (limited scope)
export NODE_ENV=production
export CHATBOT_API_ENDPOINT=https://chatbot.it-era.it/api/chat

# Run non-disruptive tests only
./tests/ai/run-ai-tests.sh --env production --safe-mode
```

---

## 🚨 Error Handling Procedures

### Test Failure Response

#### Immediate Actions
1. **Stop Deployment**: Halt any pending releases
2. **Isolate Issue**: Identify failing test categories  
3. **Check Logs**: Review detailed error logs
4. **Verify Environment**: Confirm test environment setup
5. **Document Issue**: Record failure details and context

#### Investigation Process
```bash
# 1. Re-run failed test with verbose output
node tests/ai/[failed-test].js 2>&1 | tee debug.log

# 2. Check system health
curl http://localhost:8788/health

# 3. Verify API keys and configurations
echo $OPENAI_API_KEY | head -c 10  # Check key exists

# 4. Test individual components
curl -X POST http://localhost:8788/api/chat \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'
```

#### Resolution Steps
1. **Root Cause Analysis**: Identify underlying issue
2. **Fix Implementation**: Apply necessary corrections
3. **Verification Testing**: Re-run failed tests
4. **Regression Testing**: Ensure no new issues introduced
5. **Documentation Update**: Update procedures if needed

### Common Failure Scenarios

#### AI Service Unavailable
**Symptoms**: AI integration tests fail with network errors
**Resolution**:
```bash
# Check API connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Verify fallback mechanisms
grep -r "fallback" tests/ai/
```

#### Italian Language Issues
**Symptoms**: Italian conversation tests fail
**Resolution**:
```bash
# Check language configuration
grep -r "italian\|italiano" src/
grep -r "language.*italian" tests/
```

#### Performance Degradation
**Symptoms**: Response times exceed targets
**Resolution**:
```bash
# Profile performance
node --prof tests/ai/performance-benchmark-tests.js
node --prof-process isolate-*.log > performance-profile.txt
```

---

## 📈 Quality Metrics & KPIs

### Daily Metrics
```
✅ Test Pass Rate: Target ≥95%
✅ AI Success Rate: Target ≥95% 
✅ Response Time: Target <10s average
✅ Fallback Rate: Target ≤5%
✅ Cost per Session: Target ≤$0.10
```

### Weekly Metrics  
```
✅ Feature Coverage: All new features tested
✅ Regression Rate: Target <2%
✅ Performance Trends: Stable or improving
✅ User Experience Score: Target ≥90%
✅ Italian Language Quality: Target ≥90%
```

### Monthly Metrics
```
✅ Overall System Health: Target ≥95%
✅ Customer Satisfaction: Based on feedback
✅ Cost Optimization: Budget adherence
✅ Scalability Validation: Load testing results
✅ Security Assessment: Vulnerability testing
```

---

## 🔧 Maintenance Procedures

### Weekly Maintenance
**Schedule**: Every Monday morning  
**Duration**: 30-45 minutes

```bash
# 1. Update test data
./scripts/update-test-data.sh

# 2. Run full test suite
./tests/ai/run-ai-tests.sh --comprehensive

# 3. Review performance trends
./scripts/generate-performance-report.sh

# 4. Update documentation
git add docs/ tests/
git commit -m "Weekly test maintenance and updates"
```

### Monthly Maintenance
**Schedule**: First Monday of each month  
**Duration**: 2-3 hours

```bash
# 1. Comprehensive system review
./tests/ai/run-ai-tests.sh --full-analysis

# 2. Performance optimization
./scripts/optimize-performance.sh

# 3. Security validation
./tests/security/run-security-tests.sh

# 4. Documentation review and update
./scripts/update-documentation.sh
```

### Quarterly Maintenance
**Schedule**: Quarterly release cycle  
**Duration**: 1 full day

- Complete test suite review and optimization
- New test scenario development
- Performance baseline updates  
- Security protocol review
- Documentation comprehensive update

---

## 📚 Training & Knowledge Sharing

### New Team Member Onboarding
1. **Testing Overview**: 2-hour training session
2. **Hands-on Practice**: Run test suites with supervision
3. **Scenario Understanding**: Review critical test cases
4. **Failure Response**: Practice troubleshooting procedures
5. **Documentation Review**: Study procedures and guidelines

### Continuous Learning
- Monthly testing best practices meetings
- Quarterly training updates  
- Annual testing strategy review
- Knowledge sharing sessions on new technologies

---

## 📋 Checklist Templates

### Daily Testing Checklist
```
□ Environment health check completed
□ Critical path tests executed  
□ Performance metrics within targets
□ No critical errors in logs
□ AI services responding normally
□ Fallback mechanisms validated
□ Italian language quality confirmed
```

### Pre-Release Checklist
```  
□ Full test suite passed (≥95% success rate)
□ Performance benchmarks met
□ Security validation completed
□ Italian conversation quality verified
□ WatchGuard expertise properly highlighted
□ Teams integration functioning
□ Rollback procedures tested
□ Documentation updated
□ Stakeholders notified
```

### Post-Release Checklist
```
□ Production monitoring active
□ Test suite execution on production
□ Performance metrics baseline updated
□ User feedback monitoring enabled  
□ Error tracking configured
□ Support team notified of changes
□ Documentation published
```

---

## 📞 Contact & Escalation

### Testing Team Contacts
- **Primary Contact**: Testing Specialist
- **Secondary Contact**: Development Lead  
- **Escalation Contact**: Technical Director

### Escalation Procedures
1. **Level 1**: Test failures affecting single feature
2. **Level 2**: Multiple test failures or performance issues
3. **Level 3**: System-wide failures or security concerns
4. **Level 4**: Production outage or critical business impact

### Communication Channels
- **Slack**: #testing-alerts (automated notifications)
- **Email**: testing-team@it-era.it (manual reports)
- **Phone**: Emergency escalation only

---

*This document is part of the IT-ERA AI chatbot testing framework. For technical implementation details, see the test suite code and generated reports.*