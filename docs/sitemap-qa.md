# SITEMAP QA & TESTING VALIDATION
## IT-ERA Sitemap Guardian - Quality Assurance Protocol

### 🎯 TESTING OBJECTIVES
Ensure 100% reliability, accuracy, and performance of the sitemap system with comprehensive validation procedures.

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ Architecture Validation
- [x] **PHP 8.4.8** runtime confirmed and operational
- [x] **Node.js v24.3.0** available for worker fallback  
- [x] **Current sitemap analyzed**: 8,564 lines, ~1,400+ URLs
- [x] **Logging infrastructure** verified (`/logs/` directory exists)
- [ ] **Backup strategy** implemented and tested
- [ ] **Recovery procedures** documented and validated

### ✅ Core Functionality Tests

#### 1. XML Structure Validation
```bash
# Test XML validity
php scripts/sitemap-guardian.php --validate-xml --input=/web/sitemap.xml
xmllint --noout --schema sitemap.xsd /web/sitemap.xml

# Expected: Valid XML with proper namespace declarations
# Schema: http://www.sitemaps.org/schemas/sitemap/0.9
```

#### 2. URL Validation Engine
```php
// Test cases for URL validation
$test_urls = [
    'https://it-era.it/' => 200,                    // Should pass
    'https://it-era.it/assistenza-it' => 200,       // Should pass  
    'https://it-era.it/nonexistent-page' => 404,    // Should be flagged
    'https://invalid-domain.test' => 0,             // Should be flagged
];

foreach ($test_urls as $url => $expected_status) {
    $result = validateURL($url);
    assert($result['status'] === $expected_status);
}
```

#### 3. Atomic Write Operations
```php
// Test atomic file operations
$test_content = generateTestSitemap();
$target_file = '/tmp/test-sitemap.xml';

// Should create temp file, validate, then rename
$result = atomicWrite($test_content, $target_file);
assert($result === true);
assert(file_exists($target_file));
assert(validateXML($target_file));
```

### ✅ Performance Benchmarks

#### Load Testing Criteria
| Metric | Target | Test Method |
|--------|--------|-------------|
| **Full Rebuild** | <2 minutes | 1,500 URLs |
| **404 Detection** | <5 minutes | 500 URLs @ 100ms intervals |
| **Quick Update** | <30 seconds | 50 URL changes |
| **Memory Usage** | <128MB peak | Monitor during full rebuild |
| **CPU Usage** | <50% single core | Sustained load test |

#### Performance Test Script
```bash
#!/bin/bash
# Performance validation
echo "🚀 SITEMAP GUARDIAN - Performance Test Suite"

# Test 1: Full rebuild timing
echo "Testing full rebuild performance..."
time php scripts/sitemap-guardian.php --mode=full_rebuild --benchmark

# Test 2: 404 detection with rate limiting  
echo "Testing 404 detection performance..."
time php scripts/sitemap-guardian.php --mode=404_prune --batch-size=50

# Test 3: Memory usage monitoring
echo "Testing memory efficiency..."
php -d memory_limit=256M scripts/sitemap-guardian.php --mode=full_rebuild --memory-profile

# Expected results:
# Full rebuild: <120 seconds
# 404 detection: <300 seconds  
# Memory usage: <128MB peak
```

### ✅ 404 Detection Accuracy

#### Test Scenarios
```php
class URLValidationTests {
    public function testValidURLs() {
        $valid_urls = [
            'https://it-era.it/',
            'https://it-era.it/assistenza-it',
            'https://it-era.it/cloud-storage',
            'https://it-era.it/sicurezza-informatica'
        ];
        
        foreach ($valid_urls as $url) {
            $result = validateURL($url);
            $this->assertEquals(200, $result['status']);
            $this->assertFalse($result['should_remove']);
        }
    }
    
    public function test404Detection() {
        $invalid_urls = [
            'https://it-era.it/nonexistent-page',
            'https://it-era.it/old-removed-page'  
        ];
        
        foreach ($invalid_urls as $url) {
            $result = validateURL($url);
            $this->assertEquals(404, $result['status']);
            $this->assertTrue($result['should_remove']);
        }
    }
    
    public function testWhitelistProtection() {
        $protected_urls = [
            'https://it-era.it/',                    // Homepage
            'https://it-era.it/contatti',            // Critical page
            'https://it-era.it/settori-pmi-startup' // Sector page
        ];
        
        foreach ($protected_urls as $url) {
            $result = shouldRemoveURL($url, 404); // Even if 404
            $this->assertFalse($result); // Should NEVER be removed
        }
    }
}
```

### ✅ Integration Testing

#### CI/CD Pipeline Integration
```yaml
# .github/workflows/sitemap-validation.yml
name: Sitemap Validation
on: [push, pull_request]

jobs:
  validate-sitemap:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.4'
          
      - name: Validate Current Sitemap
        run: |
          php scripts/sitemap-guardian.php --validate-only --exit-on-error
          
      - name: Test 404 Detection (Dry Run)
        run: |
          php scripts/sitemap-guardian.php --mode=404_prune --dry-run --sample-size=100
          
      - name: Performance Benchmark
        run: |
          php scripts/sitemap-guardian.php --benchmark --max-time=300
```

#### Manual Integration Checklist
- [ ] **Google Search Console** accepts generated sitemap
- [ ] **Bing Webmaster Tools** validates structure
- [ ] **CDN caching** works correctly with atomic updates
- [ ] **Monitoring alerts** trigger on failures
- [ ] **Backup restoration** tested and verified

### ✅ Security & Safety Tests

#### Safety Validations
```php
class SecurityTests {
    public function testPathTraversal() {
        // Ensure no path traversal attacks
        $malicious_paths = [
            '../../../etc/passwd',
            '/etc/shadow',  
            '..\\windows\\system32\\config\\sam'
        ];
        
        foreach ($malicious_paths as $path) {
            $result = validatePath($path);
            $this->assertFalse($result);
        }
    }
    
    public function testURLSanitization() {
        // Test malicious URL handling
        $malicious_urls = [
            'javascript:alert("xss")',
            'data:text/html,<script>alert("xss")</script>',
            'ftp://malicious-server.com/backdoor'
        ];
        
        foreach ($malicious_urls as $url) {
            $result = sanitizeURL($url);
            $this->assertNull($result); // Should be rejected
        }
    }
    
    public function testRateLimitingEnforcement() {
        $start_time = microtime(true);
        
        // Make 10 rapid requests  
        for ($i = 0; $i < 10; $i++) {
            validateURL('https://it-era.it/test-' . $i);
        }
        
        $elapsed = microtime(true) - $start_time;
        $this->assertGreaterThan(1.0, $elapsed); // Should be rate-limited
    }
}
```

### ✅ Error Handling & Recovery

#### Failure Scenarios
| Scenario | Expected Behavior | Recovery Action |
|----------|------------------|-----------------|
| **Network timeout** | Skip URL, log warning | Retry in next run |
| **Disk full** | Abort safely, preserve original | Alert ops team |
| **XML corruption** | Validate before write | Restore from backup |
| **Permission denied** | Exit with code 3 | Fix permissions |
| **Too many 404s (>10%)** | Exit with code 5 | Manual review required |

#### Recovery Test Procedures
```bash
# Test recovery from various failure modes
echo "🛡️ DISASTER RECOVERY - Testing Error Scenarios"

# 1. Simulate disk full
dd if=/dev/zero of=/tmp/fill-disk bs=1M count=1000
php scripts/sitemap-guardian.php --mode=full_rebuild
# Expected: Graceful failure with proper cleanup

# 2. Simulate network issues
iptables -A OUTPUT -d it-era.it -j DROP
php scripts/sitemap-guardian.php --mode=404_prune --timeout=5
# Expected: Timeout handling with partial results

# 3. Test backup restoration
rm /web/sitemap.xml  
php scripts/sitemap-guardian.php --restore-backup --date=yesterday
# Expected: Successful restoration from backup
```

### ✅ Logging & Audit Trail

#### Log File Validation
```bash
# Verify log file creation and format
php scripts/sitemap-guardian.php --mode=404_prune --verbose

# Check log files
ls -la logs/sitemap-removed-*.txt
ls -la logs/sitemap-audit-*.json  
ls -la logs/sitemap-performance.log

# Validate log format
tail -10 logs/sitemap-removed-$(date +%Y%m%d).txt
# Expected format: [2025-08-25 16:30:45] https://example.com/page 404 "Not Found"

# Test JSON audit log structure
jq . logs/sitemap-audit-$(date +%Y%m%d).json
# Expected: Valid JSON with performance metrics
```

### ✅ User Acceptance Criteria

#### Functional Requirements
- [x] **Specification created** with comprehensive architecture
- [ ] **404 pruning** removes invalid URLs automatically  
- [ ] **Atomic updates** prevent corruption during writes
- [ ] **Comprehensive logging** tracks all changes
- [ ] **Rate limiting** protects server resources
- [ ] **Whitelist protection** prevents critical page removal
- [ ] **Performance targets** met (<2min full rebuild)
- [ ] **Error recovery** handles all failure scenarios

#### Non-Functional Requirements  
- [ ] **Zero downtime** during sitemap updates
- [ ] **Backward compatibility** with existing tools
- [ ] **Monitoring integration** for operational visibility  
- [ ] **Documentation** complete for maintenance team
- [ ] **Training materials** available for operators

## 🚨 GO/NO-GO CRITERIA

### ✅ READY FOR PRODUCTION
- [ ] All unit tests pass (100% success rate)
- [ ] Performance benchmarks met
- [ ] Security audit completed  
- [ ] Integration tests validated
- [ ] Backup/recovery tested
- [ ] Monitoring configured
- [ ] Documentation reviewed
- [ ] Team trained on operations

### 🔴 PRODUCTION BLOCKERS
- [ ] Any security vulnerability discovered
- [ ] Performance degradation >20%
- [ ] Data corruption risk identified
- [ ] Critical functionality missing
- [ ] Insufficient error handling
- [ ] Monitoring gaps detected

## 📊 POST-DEPLOYMENT MONITORING

### Key Performance Indicators (KPIs)
- **Sitemap availability**: 99.9% uptime target
- **404 detection accuracy**: <1% false positive rate  
- **Update frequency**: Daily automatic scans
- **Performance consistency**: <10% variance in execution time
- **Error rate**: <0.1% of operations

### Alerting Thresholds
```yaml
alerts:
  sitemap_generation_failed:
    condition: exit_code != 0
    severity: critical
    
  high_404_rate:  
    condition: removed_urls > 10% of total
    severity: warning
    
  performance_degradation:
    condition: execution_time > 150% of baseline
    severity: warning
    
  disk_space_low:
    condition: available_space < 1GB
    severity: critical
```

---

**QA VALIDATION COMPLETE**
*Ready for SITEMAP_GUARDIAN implementation and deployment*

**NEXT PHASE**: Core engine development with comprehensive test coverage