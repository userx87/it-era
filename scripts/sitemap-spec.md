# SITEMAP GUARDIAN - Technical Specification
## IT-ERA Robust Sitemap System v2.0

### 🎯 MISSION
Create enterprise-grade sitemap system with 404 pruning, atomic updates, and comprehensive logging.

## 🏗️ ARCHITECTURE DECISION

### Runtime Analysis
- ✅ **PHP 8.4.8** (primary runtime) 
- ✅ **Node.js v24.3.0** (fallback/worker integration)
- ✅ **Python 3.x** (legacy generators exist)

### Selected Architecture: **HYBRID PHP+Node**
```
┌─────────────────────────────────────────┐
│              SITEMAP GUARDIAN            │
├─────────────────────────────────────────┤
│  PHP Engine (Primary)                   │
│  ├─ Atomic XML generation               │
│  ├─ 404 pruning with HTTP checks        │
│  ├─ XSD validation                      │
│  └─ Rate-limited URL testing            │
├─────────────────────────────────────────┤
│  Node.js Worker (Secondary)             │
│  ├─ Concurrent URL validation           │
│  ├─ CI/CD integration                   │
│  └─ Performance monitoring              │
├─────────────────────────────────────────┤
│  Logging System                         │
│  ├─ /logs/sitemap-removed-YYYYMMDD.txt  │
│  ├─ /logs/sitemap-audit-YYYYMMDD.json   │
│  └─ /logs/sitemap-performance.log       │
└─────────────────────────────────────────┘
```

## 📊 CURRENT STATE ANALYSIS

### Sitemap Statistics
- **File**: `/web/sitemap.xml` (8,564 lines, ~1,400+ URLs)
- **Base URL**: `https://it-era.it`
- **Structure**: Valid XML with proper schema
- **Pages**: Mix of main pages + location-specific variants
  - Main: assistenza-it.html, cloud-storage.html, etc.
  - Location: assistenza-it-lecco, assistenza-it-bergamo, etc.

### Existing Generators (Legacy)
1. `generate_complete_sitemap.py` - Python generator
2. `update_sitemap.py` - Municipality page updater  
3. `generate_complete_hivestorm_sitemap.py` - Enhanced version

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Core PHP Engine
```php
<?php
class SitemapGuardian {
    const MODES = [
        'FULL_REBUILD',    // Complete regeneration
        'QUICK_UPDATE',    // Incremental changes only
        '404_PRUNE',       // URL validation only
        'INDEX_MODE'       // Split large sitemaps
    ];
    
    private $config = [
        'max_urls_per_file' => 50000,
        'timeout_seconds' => 10,
        'rate_limit_ms' => 100,
        'batch_size' => 50,
        'whitelist_patterns' => ['/^https:\/\/it-era\.it\/$/', '/\/assistenza-it/', '/\/cloud-storage/', '/\/sicurezza-informatica/']
    ];
}
```

### Phase 2: 404 Detection & Pruning
```php
class URLValidator {
    public function validateBatch(array $urls): array {
        // Multi-curl implementation for performance
        // Rate limiting to avoid server overload
        // Detailed logging with response codes
        // Whitelist protection for critical paths
    }
    
    private function logRemovedURL(string $url, int $statusCode, string $reason): void {
        // Log to /logs/sitemap-removed-YYYYMMDD.txt
        // Format: [TIMESTAMP] URL STATUS_CODE REASON
    }
}
```

### Phase 3: Atomic File Operations
```php
class AtomicWriter {
    public function safeWrite(string $content, string $targetPath): bool {
        $tempFile = $targetPath . '.tmp.' . uniqid();
        // Write to temp file
        // Validate XML structure
        // Atomic rename (POSIX compliant)
        // Backup previous version
    }
}
```

## 📋 TECHNICAL SPECIFICATIONS

### File Structure
```
/scripts/
├── sitemap-guardian.php          # Main engine
├── sitemap-validator.php         # URL validation
├── sitemap-config.php            # Configuration
└── sitemap-atomic-writer.php     # Safe file operations

/logs/
├── sitemap-removed-YYYYMMDD.txt  # Pruned URLs log
├── sitemap-audit-YYYYMMDD.json   # Performance metrics
├── sitemap-performance.log       # Runtime statistics
└── sitemap-backup/               # XML backups

/web/
├── sitemap.xml                   # Primary sitemap
├── sitemap-index.xml             # Large sitemap index (if needed)
└── sitemaps/                     # Chunked sitemaps (if >50k URLs)
```

### Configuration Matrix
| Setting | Value | Purpose |
|---------|-------|---------|
| `MAX_URLS_PER_FILE` | 50,000 | Google limit compliance |
| `HTTP_TIMEOUT` | 10s | Balance speed vs accuracy |
| `RATE_LIMIT` | 100ms | Server protection |
| `BATCH_SIZE` | 50 | Optimal curl_multi performance |
| `BACKUP_RETENTION` | 30 days | Recovery capability |

### URL Priority Classification
```php
const PRIORITY_MAP = [
    // Homepage & main pages
    '/' => ['priority' => 1.0, 'freq' => 'daily'],
    '/assistenza-it' => ['priority' => 0.9, 'freq' => 'weekly'],
    '/cloud-storage' => ['priority' => 0.9, 'freq' => 'weekly'],
    '/sicurezza-informatica' => ['priority' => 0.9, 'freq' => 'weekly'],
    
    // Location pages
    '/assistenza-it-{city}' => ['priority' => 0.8, 'freq' => 'monthly'],
    '/cloud-storage-{city}' => ['priority' => 0.7, 'freq' => 'monthly'],
    '/sicurezza-informatica-{city}' => ['priority' => 0.7, 'freq' => 'monthly'],
    
    // Sector pages
    '/settori-*' => ['priority' => 0.6, 'freq' => 'monthly'],
    
    // Utility pages
    '/contatti' => ['priority' => 0.5, 'freq' => 'monthly']
];
```

## 🛡️ ERROR HANDLING & VALIDATION

### XSD Schema Validation
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Full sitemap.org XSD compliance -->
</xs:schema>
```

### Exit Codes
- `0` - Success
- `1` - Configuration error  
- `2` - Network/connectivity issues
- `3` - File system permissions
- `4` - XML validation failure
- `5` - Too many 404s detected (>10% threshold)

### Whitelist Protection
Critical paths that should NEVER be removed:
```php
const PROTECTED_PATTERNS = [
    '/^https:\/\/it-era\.it\/$/',           # Homepage
    '/\/assistenza-it$/',                   # Main service pages
    '/\/cloud-storage$/',
    '/\/sicurezza-informatica$/',
    '/\/contatti$/',
    '/\/settori-.*/',                       # All sector pages
];
```

## 📈 PERFORMANCE TARGETS

### Benchmarks
- **Full rebuild**: <2 minutes for 1,500 URLs
- **404 detection**: <5 minutes with rate limiting
- **Quick update**: <30 seconds for incremental changes
- **Memory usage**: <128MB peak
- **CPU usage**: <50% single core

### Scalability 
- Support up to **50,000 URLs** per sitemap
- Auto-split into index format beyond limit
- Concurrent validation with worker pools
- Graceful degradation on network issues

## 🔗 INTEGRATION POINTS

### CI/CD Hooks
```bash
# Pre-deploy validation
php scripts/sitemap-guardian.php --mode=validate --dry-run

# Post-deploy sitemap update
php scripts/sitemap-guardian.php --mode=quick_update --deploy-hook

# Scheduled 404 cleanup (cron)
0 2 * * * php scripts/sitemap-guardian.php --mode=404_prune --log-level=info
```

### Worker Integration
```javascript
// Cloudflare Worker endpoint for sitemap status
export default {
  async fetch(request) {
    // Return sitemap health metrics
    // Trigger regeneration if needed  
    // Serve cached sitemap for performance
  }
}
```

## 🧪 TESTING STRATEGY

### Unit Tests
- XML structure validation
- URL format verification  
- Priority assignment logic
- Atomic write operations

### Integration Tests
- End-to-end sitemap generation
- 404 detection accuracy
- Performance under load
- Recovery from failures

### Validation Checklist
- [ ] Google Search Console acceptance
- [ ] Bing Webmaster Tools validation
- [ ] W3C XML validation
- [ ] Schema.org compliance
- [ ] Load testing (1000+ concurrent requests)

## 📅 DEPLOYMENT TIMELINE

### Week 1: Foundation
- [x] Architecture analysis & spec creation
- [ ] Core PHP engine development  
- [ ] Atomic writer implementation
- [ ] Basic logging system

### Week 2: Validation & Pruning  
- [ ] HTTP validation engine
- [ ] 404 detection with batching
- [ ] Whitelist protection system
- [ ] Performance optimization

### Week 3: Integration & Testing
- [ ] Node.js worker fallback
- [ ] CI/CD integration hooks
- [ ] Comprehensive test suite
- [ ] Documentation & QA validation

### Week 4: Production Deployment
- [ ] Staged rollout with monitoring
- [ ] Performance tuning
- [ ] Backup/recovery procedures
- [ ] Team training & handover

## 🎯 SUCCESS METRICS

### Quality Indicators
- **0% false positives** in 404 detection
- **100% XML validity** maintained
- **<1% performance degradation** during updates
- **24/7 uptime** for sitemap availability

### Operational Benefits
- Automated 404 cleanup saving manual review
- Faster search engine discovery of new pages  
- Reduced server load from invalid URL crawling
- Complete audit trail for SEO compliance

---

**SITEMAP_GUARDIAN v2.0 - Enterprise-grade sitemap management for IT-ERA**
*Robust • Scalable • Battle-tested*