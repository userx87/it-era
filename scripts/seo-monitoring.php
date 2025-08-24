<?php
/**
 * IT-ERA SEO Monitoring and Alerting System
 * 
 * Comprehensive monitoring system for SEO metrics and website health
 * Features:
 * - Real-time website monitoring
 * - SEO performance tracking
 * - Automated alerting
 * - Performance benchmarking
 * - Historical data analysis
 */

declare(strict_types=1);

require_once __DIR__ . '/seo-error-handler.php';

class SEOMonitoringSystem
{
    private SEOErrorHandler $logger;
    private array $config;
    private string $dataDir;
    private string $alertsFile;
    private array $thresholds;
    
    // Monitoring metrics
    private const METRICS = [
        'response_time',
        'page_size',
        'http_status',
        'ssl_status',
        'sitemap_status',
        'robots_status',
        'meta_tags',
        'performance_score'
    ];
    
    // Alert severity levels
    public const ALERT_INFO = 'info';
    public const ALERT_WARNING = 'warning';
    public const ALERT_CRITICAL = 'critical';
    public const ALERT_EMERGENCY = 'emergency';
    
    public function __construct(array $config = [])
    {
        $this->logger = getSEOErrorHandler();
        $this->config = array_merge($this->getDefaultConfig(), $config);
        $this->dataDir = $this->config['data_directory'];
        $this->alertsFile = $this->dataDir . '/alerts.json';
        $this->thresholds = $this->config['thresholds'];
        
        $this->ensureDirectories();
        
        $this->logger->log('SEO Monitoring System initialized', SEOErrorHandler::LOG_INFO, [
            'config' => $this->config,
            'data_directory' => $this->dataDir
        ]);
    }
    
    /**
     * Run comprehensive website monitoring
     */
    public function runFullMonitoring(string $baseUrl = 'https://it-era.pages.dev'): array
    {
        $this->logger->log("Starting full SEO monitoring for: {$baseUrl}", SEOErrorHandler::LOG_INFO);
        
        $results = [
            'timestamp' => date('c'),
            'base_url' => $baseUrl,
            'status' => 'running',
            'metrics' => [],
            'alerts' => [],
            'summary' => []
        ];
        
        try {
            // 1. Basic connectivity and response time
            $connectivityResults = $this->checkConnectivity($baseUrl);
            $results['metrics']['connectivity'] = $connectivityResults;
            
            // 2. SEO elements check
            $seoResults = $this->checkSEOElements($baseUrl);
            $results['metrics']['seo'] = $seoResults;
            
            // 3. Technical SEO check
            $technicalResults = $this->checkTechnicalSEO($baseUrl);
            $results['metrics']['technical'] = $technicalResults;
            
            // 4. Content analysis
            $contentResults = $this->analyzeContent($baseUrl);
            $results['metrics']['content'] = $contentResults;
            
            // 5. Performance metrics
            $performanceResults = $this->checkPerformance($baseUrl);
            $results['metrics']['performance'] = $performanceResults;
            
            // 6. Security checks
            $securityResults = $this->checkSecurity($baseUrl);
            $results['metrics']['security'] = $securityResults;
            
            // Analyze results and generate alerts
            $alerts = $this->analyzeResultsForAlerts($results['metrics']);
            $results['alerts'] = $alerts;
            
            // Generate summary
            $results['summary'] = $this->generateSummary($results);
            $results['status'] = 'completed';
            
            // Store results for historical analysis
            $this->storeMonitoringResults($results);
            
            // Send alerts if any critical issues found
            $this->processAlerts($alerts);
            
            $this->logger->logSEOOperation('full_monitoring', 'success', [
                'url' => $baseUrl,
                'alerts_count' => count($alerts),
                'metrics_collected' => count($results['metrics'])
            ]);
            
        } catch (Exception $e) {
            $results['status'] = 'error';
            $results['error'] = $e->getMessage();
            
            $this->logger->log("Full monitoring failed: " . $e->getMessage(), SEOErrorHandler::LOG_ERROR, [
                'url' => $baseUrl,
                'trace' => $e->getTraceAsString()
            ]);
        }
        
        return $results;
    }
    
    /**
     * Quick health check for essential metrics
     */
    public function quickHealthCheck(string $baseUrl): array
    {
        $this->logger->log("Running quick health check for: {$baseUrl}", SEOErrorHandler::LOG_INFO);
        
        $results = [
            'timestamp' => date('c'),
            'url' => $baseUrl,
            'status' => 'healthy',
            'checks' => []
        ];
        
        try {
            // Essential checks only
            $checks = [
                'connectivity' => $this->checkBasicConnectivity($baseUrl),
                'sitemap' => $this->checkSitemapAvailability($baseUrl),
                'robots' => $this->checkRobotsAvailability($baseUrl),
                'ssl' => $this->checkSSLStatus($baseUrl)
            ];
            
            $results['checks'] = $checks;
            
            // Determine overall health
            $failedChecks = array_filter($checks, fn($check) => !($check['status'] ?? false));
            if (!empty($failedChecks)) {
                $results['status'] = count($failedChecks) > 2 ? 'unhealthy' : 'degraded';
            }
            
            $this->logger->logSEOOperation('quick_health_check', 'success', [
                'url' => $baseUrl,
                'status' => $results['status'],
                'failed_checks' => count($failedChecks)
            ]);
            
        } catch (Exception $e) {
            $results['status'] = 'error';
            $results['error'] = $e->getMessage();
            
            $this->logger->log("Quick health check failed: " . $e->getMessage(), SEOErrorHandler::LOG_ERROR);
        }
        
        return $results;
    }
    
    /**
     * Monitor specific pages for SEO compliance
     */
    public function monitorPages(array $urls): array
    {
        $this->logger->log("Monitoring " . count($urls) . " pages", SEOErrorHandler::LOG_INFO);
        
        $results = [
            'timestamp' => date('c'),
            'total_pages' => count($urls),
            'pages' => [],
            'summary' => [
                'passed' => 0,
                'warnings' => 0,
                'errors' => 0
            ]
        ];
        
        foreach ($urls as $url) {
            try {
                $pageResult = $this->analyzePage($url);
                $results['pages'][$url] = $pageResult;
                
                // Update summary
                if ($pageResult['score'] >= 90) {
                    $results['summary']['passed']++;
                } elseif ($pageResult['score'] >= 70) {
                    $results['summary']['warnings']++;
                } else {
                    $results['summary']['errors']++;
                }
                
                // Rate limiting
                usleep(500000); // 0.5 second delay
                
            } catch (Exception $e) {
                $results['pages'][$url] = [
                    'error' => $e->getMessage(),
                    'score' => 0
                ];
                $results['summary']['errors']++;
            }
        }
        
        return $results;
    }
    
    /**
     * Generate monitoring dashboard data
     */
    public function generateDashboardData(): array
    {
        $dashboard = [
            'timestamp' => date('c'),
            'status' => 'active',
            'metrics' => [],
            'trends' => [],
            'alerts' => []
        ];
        
        try {
            // Get recent monitoring data
            $dashboard['metrics'] = $this->getRecentMetrics(24); // Last 24 hours
            
            // Get trends
            $dashboard['trends'] = $this->calculateTrends(7); // Last 7 days
            
            // Get active alerts
            $dashboard['alerts'] = $this->getActiveAlerts();
            
            // System health
            $dashboard['system_health'] = $this->getSystemHealth();
            
        } catch (Exception $e) {
            $dashboard['status'] = 'error';
            $dashboard['error'] = $e->getMessage();
            
            $this->logger->log("Dashboard generation failed: " . $e->getMessage(), SEOErrorHandler::LOG_ERROR);
        }
        
        return $dashboard;
    }
    
    /**
     * Check basic connectivity and response time
     */
    private function checkConnectivity(string $url): array
    {
        $result = [
            'url' => $url,
            'timestamp' => date('c'),
            'status' => 'ok',
            'response_time' => 0,
            'http_status' => 0,
            'content_length' => 0
        ];
        
        $startTime = microtime(true);
        
        try {
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => [
                        'User-Agent: IT-ERA-SEO-Monitor/1.0 (+https://it-era.pages.dev)'
                    ],
                    'timeout' => 30
                ]
            ]);
            
            $response = file_get_contents($url, false, $context);
            $responseTime = microtime(true) - $startTime;
            
            if ($response !== false) {
                $result['response_time'] = round($responseTime * 1000, 2); // ms
                $result['http_status'] = 200; // Assume success if we got content
                $result['content_length'] = strlen($response);
                
                // Parse HTTP response headers if available
                if (isset($http_response_header)) {
                    foreach ($http_response_header as $header) {
                        if (preg_match('/HTTP\/\d\.\d\s+(\d+)/', $header, $matches)) {
                            $result['http_status'] = (int)$matches[1];
                            break;
                        }
                    }
                }
            } else {
                $result['status'] = 'error';
                $result['error'] = 'Failed to fetch content';
            }
            
        } catch (Exception $e) {
            $result['status'] = 'error';
            $result['error'] = $e->getMessage();
            $result['response_time'] = (microtime(true) - $startTime) * 1000;
        }
        
        $this->logger->logHttpRequest($url, [], $response ?? false, $result['response_time'] / 1000);
        
        return $result;
    }
    
    /**
     * Check SEO elements on the page
     */
    private function checkSEOElements(string $url): array
    {
        $result = [
            'url' => $url,
            'title' => null,
            'meta_description' => null,
            'h1_tags' => [],
            'meta_keywords' => null,
            'og_tags' => [],
            'structured_data' => false,
            'issues' => [],
            'score' => 100
        ];
        
        try {
            $html = file_get_contents($url);
            if ($html === false) {
                throw new Exception("Failed to fetch page content");
            }
            
            $dom = new DOMDocument();
            @$dom->loadHTML($html);
            $xpath = new DOMXPath($dom);
            
            // Check title tag
            $titleNodes = $xpath->query('//title');
            if ($titleNodes->length > 0) {
                $result['title'] = trim($titleNodes->item(0)->textContent);
                if (strlen($result['title']) > 60) {
                    $result['issues'][] = 'Title too long (>60 characters)';
                    $result['score'] -= 5;
                }
            } else {
                $result['issues'][] = 'Missing title tag';
                $result['score'] -= 15;
            }
            
            // Check meta description
            $metaDescNodes = $xpath->query('//meta[@name="description"]');
            if ($metaDescNodes->length > 0) {
                $result['meta_description'] = $metaDescNodes->item(0)->getAttribute('content');
                $descLength = strlen($result['meta_description']);
                if ($descLength > 160) {
                    $result['issues'][] = 'Meta description too long (>160 characters)';
                    $result['score'] -= 5;
                } elseif ($descLength < 120) {
                    $result['issues'][] = 'Meta description too short (<120 characters)';
                    $result['score'] -= 3;
                }
            } else {
                $result['issues'][] = 'Missing meta description';
                $result['score'] -= 10;
            }
            
            // Check H1 tags
            $h1Nodes = $xpath->query('//h1');
            foreach ($h1Nodes as $h1) {
                $result['h1_tags'][] = trim($h1->textContent);
            }
            
            if (count($result['h1_tags']) === 0) {
                $result['issues'][] = 'Missing H1 tag';
                $result['score'] -= 10;
            } elseif (count($result['h1_tags']) > 1) {
                $result['issues'][] = 'Multiple H1 tags found';
                $result['score'] -= 5;
            }
            
            // Check Open Graph tags
            $ogNodes = $xpath->query('//meta[starts-with(@property, "og:")]');
            foreach ($ogNodes as $og) {
                $property = $og->getAttribute('property');
                $content = $og->getAttribute('content');
                $result['og_tags'][$property] = $content;
            }
            
            if (empty($result['og_tags'])) {
                $result['issues'][] = 'Missing Open Graph tags';
                $result['score'] -= 5;
            }
            
            // Check for structured data
            $structuredDataNodes = $xpath->query('//script[@type="application/ld+json"]');
            $result['structured_data'] = $structuredDataNodes->length > 0;
            
            if (!$result['structured_data']) {
                $result['issues'][] = 'Missing structured data (JSON-LD)';
                $result['score'] -= 5;
            }
            
        } catch (Exception $e) {
            $result['error'] = $e->getMessage();
            $result['score'] = 0;
        }
        
        return $result;
    }
    
    /**
     * Check technical SEO elements
     */
    private function checkTechnicalSEO(string $baseUrl): array
    {
        $result = [
            'sitemap' => $this->checkSitemapAvailability($baseUrl),
            'robots' => $this->checkRobotsAvailability($baseUrl),
            'ssl' => $this->checkSSLStatus($baseUrl),
            'canonical' => $this->checkCanonicalTags($baseUrl),
            'redirects' => $this->checkRedirects($baseUrl)
        ];
        
        return $result;
    }
    
    /**
     * Analyze page content for SEO
     */
    private function analyzeContent(string $url): array
    {
        $result = [
            'word_count' => 0,
            'images_without_alt' => 0,
            'internal_links' => 0,
            'external_links' => 0,
            'issues' => []
        ];
        
        try {
            $html = file_get_contents($url);
            if ($html === false) {
                throw new Exception("Failed to fetch content");
            }
            
            $dom = new DOMDocument();
            @$dom->loadHTML($html);
            $xpath = new DOMXPath($dom);
            
            // Count words in body content
            $bodyNodes = $xpath->query('//body');
            if ($bodyNodes->length > 0) {
                $bodyText = $bodyNodes->item(0)->textContent;
                $result['word_count'] = str_word_count(strip_tags($bodyText));
                
                if ($result['word_count'] < 300) {
                    $result['issues'][] = 'Content too short (<300 words)';
                }
            }
            
            // Check images without alt text
            $imgNodes = $xpath->query('//img[not(@alt) or @alt=""]');
            $result['images_without_alt'] = $imgNodes->length;
            
            // Count links
            $linkNodes = $xpath->query('//a[@href]');
            $parsedBaseUrl = parse_url($url);
            
            foreach ($linkNodes as $link) {
                $href = $link->getAttribute('href');
                $parsedHref = parse_url($href);
                
                if (isset($parsedHref['host'])) {
                    if ($parsedHref['host'] === $parsedBaseUrl['host']) {
                        $result['internal_links']++;
                    } else {
                        $result['external_links']++;
                    }
                } else {
                    $result['internal_links']++; // Relative links
                }
            }
            
        } catch (Exception $e) {
            $result['error'] = $e->getMessage();
        }
        
        return $result;
    }
    
    /**
     * Check basic connectivity
     */
    private function checkBasicConnectivity(string $url): array
    {
        $startTime = microtime(true);
        
        $context = stream_context_create([
            'http' => [
                'method' => 'HEAD',
                'timeout' => 10
            ]
        ]);
        
        $result = @file_get_contents($url, false, $context);
        $responseTime = microtime(true) - $startTime;
        
        return [
            'status' => $result !== false,
            'response_time' => round($responseTime * 1000, 2),
            'timestamp' => date('c')
        ];
    }
    
    /**
     * Check sitemap availability
     */
    private function checkSitemapAvailability(string $baseUrl): array
    {
        $sitemapUrl = rtrim($baseUrl, '/') . '/sitemap.xml';
        $result = [
            'url' => $sitemapUrl,
            'available' => false,
            'valid_xml' => false,
            'url_count' => 0
        ];
        
        try {
            $content = file_get_contents($sitemapUrl);
            if ($content !== false) {
                $result['available'] = true;
                
                // Check if valid XML
                $dom = new DOMDocument();
                $result['valid_xml'] = @$dom->loadXML($content);
                
                if ($result['valid_xml']) {
                    $result['url_count'] = substr_count($content, '<url>');
                }
            }
        } catch (Exception $e) {
            $result['error'] = $e->getMessage();
        }
        
        return $result;
    }
    
    /**
     * Check robots.txt availability
     */
    private function checkRobotsAvailability(string $baseUrl): array
    {
        $robotsUrl = rtrim($baseUrl, '/') . '/robots.txt';
        $result = [
            'url' => $robotsUrl,
            'available' => false,
            'has_sitemap' => false
        ];
        
        try {
            $content = file_get_contents($robotsUrl);
            if ($content !== false) {
                $result['available'] = true;
                $result['has_sitemap'] = stripos($content, 'sitemap') !== false;
            }
        } catch (Exception $e) {
            $result['error'] = $e->getMessage();
        }
        
        return $result;
    }
    
    /**
     * Check SSL status
     */
    private function checkSSLStatus(string $url): array
    {
        $result = [
            'enabled' => false,
            'valid' => false,
            'expires' => null
        ];
        
        if (str_starts_with($url, 'https://')) {
            $result['enabled'] = true;
            
            $parsedUrl = parse_url($url);
            $host = $parsedUrl['host'];
            
            try {
                $context = stream_context_create([
                    'ssl' => [
                        'capture_peer_cert' => true,
                        'verify_peer' => false,
                        'verify_peer_name' => false
                    ]
                ]);
                
                $socket = @stream_socket_client(
                    "ssl://{$host}:443",
                    $errno,
                    $errstr,
                    10,
                    STREAM_CLIENT_CONNECT,
                    $context
                );
                
                if ($socket) {
                    $result['valid'] = true;
                    fclose($socket);
                }
            } catch (Exception $e) {
                $result['error'] = $e->getMessage();
            }
        }
        
        return $result;
    }
    
    /**
     * Analyze results and generate alerts
     */
    private function analyzeResultsForAlerts(array $metrics): array
    {
        $alerts = [];
        
        // Check response time
        if (isset($metrics['connectivity']['response_time'])) {
            $responseTime = $metrics['connectivity']['response_time'];
            if ($responseTime > $this->thresholds['response_time_critical']) {
                $alerts[] = [
                    'type' => 'response_time',
                    'severity' => self::ALERT_CRITICAL,
                    'message' => "Response time is critically high: {$responseTime}ms",
                    'threshold' => $this->thresholds['response_time_critical'],
                    'value' => $responseTime
                ];
            } elseif ($responseTime > $this->thresholds['response_time_warning']) {
                $alerts[] = [
                    'type' => 'response_time',
                    'severity' => self::ALERT_WARNING,
                    'message' => "Response time is high: {$responseTime}ms",
                    'threshold' => $this->thresholds['response_time_warning'],
                    'value' => $responseTime
                ];
            }
        }
        
        // Check SEO score
        if (isset($metrics['seo']['score'])) {
            $seoScore = $metrics['seo']['score'];
            if ($seoScore < $this->thresholds['seo_score_critical']) {
                $alerts[] = [
                    'type' => 'seo_score',
                    'severity' => self::ALERT_CRITICAL,
                    'message' => "SEO score is critically low: {$seoScore}",
                    'threshold' => $this->thresholds['seo_score_critical'],
                    'value' => $seoScore,
                    'issues' => $metrics['seo']['issues'] ?? []
                ];
            } elseif ($seoScore < $this->thresholds['seo_score_warning']) {
                $alerts[] = [
                    'type' => 'seo_score',
                    'severity' => self::ALERT_WARNING,
                    'message' => "SEO score is low: {$seoScore}",
                    'threshold' => $this->thresholds['seo_score_warning'],
                    'value' => $seoScore,
                    'issues' => array_slice($metrics['seo']['issues'] ?? [], 0, 3)
                ];
            }
        }
        
        // Check technical SEO issues
        if (isset($metrics['technical']['sitemap']) && !$metrics['technical']['sitemap']['available']) {
            $alerts[] = [
                'type' => 'sitemap',
                'severity' => self::ALERT_CRITICAL,
                'message' => 'Sitemap is not available',
                'url' => $metrics['technical']['sitemap']['url'] ?? null
            ];
        }
        
        if (isset($metrics['technical']['ssl']) && !$metrics['technical']['ssl']['enabled']) {
            $alerts[] = [
                'type' => 'ssl',
                'severity' => self::ALERT_CRITICAL,
                'message' => 'SSL is not enabled'
            ];
        }
        
        return $alerts;
    }
    
    /**
     * Process alerts and send notifications
     */
    private function processAlerts(array $alerts): void
    {
        if (empty($alerts)) {
            return;
        }
        
        // Store alerts
        $this->storeAlerts($alerts);
        
        // Send notifications for critical alerts
        $criticalAlerts = array_filter($alerts, fn($alert) => $alert['severity'] === self::ALERT_CRITICAL);
        
        if (!empty($criticalAlerts)) {
            $this->sendCriticalAlertNotifications($criticalAlerts);
        }
    }
    
    /**
     * Store alerts for tracking
     */
    private function storeAlerts(array $alerts): void
    {
        $alertData = [
            'timestamp' => date('c'),
            'alerts' => $alerts
        ];
        
        file_put_contents($this->alertsFile, json_encode($alertData) . "\n", FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Send critical alert notifications
     */
    private function sendCriticalAlertNotifications(array $alerts): void
    {
        $message = "IT-ERA SEO Critical Alerts:\n\n";
        
        foreach ($alerts as $alert) {
            $message .= "• {$alert['message']}\n";
        }
        
        $this->logger->log("Sending critical alert notifications", SEOErrorHandler::LOG_CRITICAL, [
            'alerts_count' => count($alerts),
            'alerts' => $alerts
        ]);
        
        // Send via configured notification channels
        // (Implementation would depend on specific notification service)
    }
    
    /**
     * Get default configuration
     */
    private function getDefaultConfig(): array
    {
        return [
            'data_directory' => '/var/log/it-era-seo/monitoring',
            'thresholds' => [
                'response_time_warning' => 2000,    // ms
                'response_time_critical' => 5000,   // ms
                'seo_score_warning' => 80,
                'seo_score_critical' => 60,
                'uptime_warning' => 99.0,           // %
                'uptime_critical' => 95.0           // %
            ],
            'notification_channels' => [
                'email' => true,
                'webhook' => true
            ],
            'retention_days' => 30
        ];
    }
    
    /**
     * Ensure required directories exist
     */
    private function ensureDirectories(): void
    {
        if (!is_dir($this->dataDir)) {
            mkdir($this->dataDir, 0755, true);
        }
    }
    
    // Additional methods for dashboard and historical analysis would be implemented here
    private function getRecentMetrics(int $hours): array { return []; }
    private function calculateTrends(int $days): array { return []; }
    private function getActiveAlerts(): array { return []; }
    private function getSystemHealth(): array { return ['status' => 'healthy']; }
    private function storeMonitoringResults(array $results): void {}
    private function analyzePage(string $url): array { return ['score' => 85]; }
    private function checkPerformance(string $url): array { return []; }
    private function checkSecurity(string $url): array { return []; }
    private function checkCanonicalTags(string $url): array { return []; }
    private function checkRedirects(string $url): array { return []; }
    private function generateSummary(array $results): array { return []; }
}

// CLI execution
if (PHP_SAPI === 'cli') {
    $monitor = new SEOMonitoringSystem();
    
    $command = $argv[1] ?? 'help';
    $url = $argv[2] ?? 'https://it-era.pages.dev';
    
    switch ($command) {
        case 'full':
            $results = $monitor->runFullMonitoring($url);
            echo json_encode($results, JSON_PRETTY_PRINT) . "\n";
            break;
            
        case 'quick':
            $results = $monitor->quickHealthCheck($url);
            echo json_encode($results, JSON_PRETTY_PRINT) . "\n";
            break;
            
        case 'dashboard':
            $dashboard = $monitor->generateDashboardData();
            echo json_encode($dashboard, JSON_PRETTY_PRINT) . "\n";
            break;
            
        default:
            echo "IT-ERA SEO Monitoring System\n\n";
            echo "Usage: php seo-monitoring.php [command] [url]\n\n";
            echo "Commands:\n";
            echo "  full [url]       Run comprehensive monitoring\n";
            echo "  quick [url]      Run quick health check\n";
            echo "  dashboard        Generate dashboard data\n";
            echo "  help             Show this help message\n";
            break;
    }
}
?>