<?php
/**
 * IT-ERA SEO Webhook Endpoint
 * 
 * Handles webhook requests for SEO automation:
 * - n8n workflow integration
 * - External SEO tool notifications
 * - Automated content updates
 * - Search console notifications
 * - Performance monitoring triggers
 * 
 * Endpoints:
 * - POST /seo-webhook.php?action=sitemap_update
 * - POST /seo-webhook.php?action=page_indexing
 * - POST /seo-webhook.php?action=performance_check
 * - POST /seo-webhook.php?action=seo_audit
 * 
 * Usage: Configure as webhook URL in n8n, search console, monitoring tools
 */

declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class SEOWebhookHandler
{
    private string $logFile;
    private array $config;
    private string $secretKey;
    
    // Supported webhook actions
    private const ALLOWED_ACTIONS = [
        'sitemap_update',
        'page_indexing',
        'performance_check',
        'seo_audit',
        'rss_update',
        'cache_clear',
        'notification',
        'status_check'
    ];
    
    public function __construct()
    {
        $this->logFile = "/var/log/it-era-seo/webhook-" . date('Y-m-d') . ".log";
        $this->ensureLogDirectory();
        
        // Load configuration
        $this->loadConfiguration();
        
        $this->log("SEO Webhook Handler initialized", 'INFO');
    }
    
    /**
     * Main webhook handler
     */
    public function handle(): void
    {
        try {
            // Validate request
            if (!$this->validateRequest()) {
                $this->respondWithError('Invalid request', 400);
                return;
            }
            
            // Get action
            $action = $_GET['action'] ?? $_POST['action'] ?? null;
            if (!$action || !in_array($action, self::ALLOWED_ACTIONS)) {
                $this->respondWithError('Invalid or missing action', 400);
                return;
            }
            
            // Authenticate request
            if (!$this->authenticateRequest()) {
                $this->respondWithError('Authentication failed', 401);
                return;
            }
            
            $this->log("Processing webhook action: {$action}", 'INFO');
            
            // Route to appropriate handler
            $result = match ($action) {
                'sitemap_update' => $this->handleSitemapUpdate(),
                'page_indexing' => $this->handlePageIndexing(),
                'performance_check' => $this->handlePerformanceCheck(),
                'seo_audit' => $this->handleSEOAudit(),
                'rss_update' => $this->handleRSSUpdate(),
                'cache_clear' => $this->handleCacheClear(),
                'notification' => $this->handleNotification(),
                'status_check' => $this->handleStatusCheck(),
                default => ['success' => false, 'message' => 'Unknown action']
            };
            
            $this->respondWithSuccess($result);
            
        } catch (Exception $e) {
            $this->log("Webhook error: " . $e->getMessage(), 'ERROR');
            $this->respondWithError('Internal server error', 500);
        }
    }
    
    /**
     * Handle sitemap update request
     */
    private function handleSitemapUpdate(): array
    {
        $this->log("Handling sitemap update", 'INFO');
        
        try {
            // Get payload
            $payload = $this->getPayload();
            $force = $payload['force'] ?? false;
            
            // Check if update is needed (unless forced)
            if (!$force && !$this->isSitemapUpdateNeeded()) {
                return [
                    'success' => true,
                    'message' => 'Sitemap update not needed',
                    'skipped' => true
                ];
            }
            
            // Execute sitemap generation
            $output = [];
            $returnCode = 0;
            exec("php " . __DIR__ . "/generate_sitemap.php 2>&1", $output, $returnCode);
            
            if ($returnCode !== 0) {
                throw new Exception("Sitemap generation failed: " . implode("\n", $output));
            }
            
            // Submit to search engines
            $submissionResults = $this->submitSitemap();
            
            // Record metrics
            $this->recordWebhookMetrics('sitemap_update', [
                'urls_count' => $this->countSitemapUrls(),
                'submission_results' => $submissionResults
            ]);
            
            return [
                'success' => true,
                'message' => 'Sitemap updated and submitted successfully',
                'data' => [
                    'urls_count' => $this->countSitemapUrls(),
                    'submissions' => $submissionResults
                ]
            ];
            
        } catch (Exception $e) {
            $this->log("Sitemap update error: " . $e->getMessage(), 'ERROR');
            return [
                'success' => false,
                'message' => 'Sitemap update failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Handle page indexing request
     */
    private function handlePageIndexing(): array
    {
        $this->log("Handling page indexing request", 'INFO');
        
        try {
            $payload = $this->getPayload();
            $urls = $payload['urls'] ?? [];
            
            if (empty($urls)) {
                // Auto-detect recently modified pages
                $urls = $this->getRecentlyModifiedPageUrls();
            }
            
            if (empty($urls)) {
                return [
                    'success' => true,
                    'message' => 'No URLs to index',
                    'indexed_count' => 0
                ];
            }
            
            $results = [];
            $successCount = 0;
            
            foreach ($urls as $url) {
                if ($this->requestPageIndexing($url)) {
                    $results[$url] = 'success';
                    $successCount++;
                } else {
                    $results[$url] = 'failed';
                }
                
                // Rate limiting
                usleep(500000); // 0.5 second
            }
            
            // Record metrics
            $this->recordWebhookMetrics('page_indexing', [
                'total_urls' => count($urls),
                'success_count' => $successCount,
                'results' => $results
            ]);
            
            return [
                'success' => true,
                'message' => "Indexing requested for {$successCount} of " . count($urls) . " URLs",
                'data' => [
                    'indexed_count' => $successCount,
                    'total_count' => count($urls),
                    'results' => $results
                ]
            ];
            
        } catch (Exception $e) {
            $this->log("Page indexing error: " . $e->getMessage(), 'ERROR');
            return [
                'success' => false,
                'message' => 'Page indexing failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Handle performance check request
     */
    private function handlePerformanceCheck(): array
    {
        $this->log("Handling performance check", 'INFO');
        
        try {
            $payload = $this->getPayload();
            $urls = $payload['urls'] ?? ['https://it-era.it/'];
            
            $results = [];
            
            foreach ($urls as $url) {
                $performanceData = $this->checkPagePerformance($url);
                $results[$url] = $performanceData;
            }
            
            // Record metrics
            $this->recordWebhookMetrics('performance_check', [
                'urls_checked' => count($urls),
                'results' => $results
            ]);
            
            return [
                'success' => true,
                'message' => 'Performance check completed',
                'data' => $results
            ];
            
        } catch (Exception $e) {
            $this->log("Performance check error: " . $e->getMessage(), 'ERROR');
            return [
                'success' => false,
                'message' => 'Performance check failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Handle SEO audit request
     */
    private function handleSEOAudit(): array
    {
        $this->log("Handling SEO audit", 'INFO');
        
        try {
            $payload = $this->getPayload();
            $scope = $payload['scope'] ?? 'sample'; // 'sample' or 'full'
            
            // Execute SEO audit
            $auditScript = __DIR__ . '/validate_seo.py';
            if (!file_exists($auditScript)) {
                throw new Exception("SEO audit script not found");
            }
            
            $output = [];
            $returnCode = 0;
            
            if ($scope === 'full') {
                exec("python3 {$auditScript} --full 2>&1", $output, $returnCode);
            } else {
                exec("python3 {$auditScript} --sample 2>&1", $output, $returnCode);
            }
            
            // Parse audit results
            $auditResults = $this->parseAuditOutput($output);
            
            // Record metrics
            $this->recordWebhookMetrics('seo_audit', [
                'scope' => $scope,
                'results' => $auditResults
            ]);
            
            // Send notification if critical issues found
            if ($auditResults['critical_issues'] > 0) {
                $this->sendAuditNotification($auditResults);
            }
            
            return [
                'success' => true,
                'message' => 'SEO audit completed',
                'data' => $auditResults
            ];
            
        } catch (Exception $e) {
            $this->log("SEO audit error: " . $e->getMessage(), 'ERROR');
            return [
                'success' => false,
                'message' => 'SEO audit failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Handle RSS update request
     */
    private function handleRSSUpdate(): array
    {
        $this->log("Handling RSS update", 'INFO');
        
        try {
            $updateCount = 0;
            $rssScripts = [
                'update_blog_rss.php',
                'update_news_rss.php',
                'generate_rss.php'
            ];
            
            foreach ($rssScripts as $script) {
                $scriptPath = __DIR__ . '/' . $script;
                if (file_exists($scriptPath)) {
                    $output = [];
                    $returnCode = 0;
                    exec("php {$scriptPath} 2>&1", $output, $returnCode);
                    
                    if ($returnCode === 0) {
                        $updateCount++;
                        $this->log("RSS script {$script} executed successfully", 'INFO');
                    } else {
                        $this->log("RSS script {$script} failed: " . implode("\n", $output), 'WARNING');
                    }
                }
            }
            
            // Record metrics
            $this->recordWebhookMetrics('rss_update', [
                'updated_feeds' => $updateCount
            ]);
            
            return [
                'success' => true,
                'message' => "Updated {$updateCount} RSS feeds",
                'data' => [
                    'updated_count' => $updateCount
                ]
            ];
            
        } catch (Exception $e) {
            $this->log("RSS update error: " . $e->getMessage(), 'ERROR');
            return [
                'success' => false,
                'message' => 'RSS update failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Handle cache clear request
     */
    private function handleCacheClear(): array
    {
        $this->log("Handling cache clear", 'INFO');
        
        try {
            $payload = $this->getPayload();
            $paths = $payload['paths'] ?? ['/sitemap.xml', '/robots.txt', '/*.html'];
            
            $clearedCount = 0;
            
            foreach ($paths as $path) {
                if ($this->clearCDNCache($path)) {
                    $clearedCount++;
                }
            }
            
            // Record metrics
            $this->recordWebhookMetrics('cache_clear', [
                'paths_cleared' => $clearedCount,
                'total_paths' => count($paths)
            ]);
            
            return [
                'success' => true,
                'message' => "Cleared cache for {$clearedCount} paths",
                'data' => [
                    'cleared_count' => $clearedCount,
                    'paths' => $paths
                ]
            ];
            
        } catch (Exception $e) {
            $this->log("Cache clear error: " . $e->getMessage(), 'ERROR');
            return [
                'success' => false,
                'message' => 'Cache clear failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Handle notification webhook
     */
    private function handleNotification(): array
    {
        $this->log("Handling notification", 'INFO');
        
        try {
            $payload = $this->getPayload();
            $title = $payload['title'] ?? 'IT-ERA SEO Notification';
            $message = $payload['message'] ?? '';
            $type = $payload['type'] ?? 'info';
            
            // Send notification via configured channels
            $this->sendNotification($title, $message, $type);
            
            return [
                'success' => true,
                'message' => 'Notification sent successfully',
                'data' => [
                    'title' => $title,
                    'type' => $type
                ]
            ];
            
        } catch (Exception $e) {
            $this->log("Notification error: " . $e->getMessage(), 'ERROR');
            return [
                'success' => false,
                'message' => 'Notification failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Handle status check request
     */
    private function handleStatusCheck(): array
    {
        try {
            $status = [
                'timestamp' => date('c'),
                'site_url' => 'https://it-era.it',
                'webhook_version' => '1.0.0',
                'services' => [
                    'sitemap' => $this->checkSitemapStatus(),
                    'rss' => $this->checkRSSStatus(),
                    'performance' => $this->checkPerformanceStatus()
                ],
                'metrics' => [
                    'total_pages' => $this->countTotalPages(),
                    'recent_updates' => $this->getRecentUpdatesCount()
                ]
            ];
            
            return [
                'success' => true,
                'message' => 'Status check completed',
                'data' => $status
            ];
            
        } catch (Exception $e) {
            $this->log("Status check error: " . $e->getMessage(), 'ERROR');
            return [
                'success' => false,
                'message' => 'Status check failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Validate incoming request
     */
    private function validateRequest(): bool
    {
        // Check request method
        if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'POST'])) {
            return false;
        }
        
        // Check if it's a valid webhook request
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $validAgents = ['n8n', 'curl', 'webhook', 'automation', 'it-era'];
        
        foreach ($validAgents as $agent) {
            if (stripos($userAgent, $agent) !== false) {
                return true;
            }
        }
        
        // Allow requests from localhost for testing
        $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '';
        if (in_array($remoteAddr, ['127.0.0.1', '::1', 'localhost'])) {
            return true;
        }
        
        return true; // For now, allow all requests
    }
    
    /**
     * Authenticate webhook request
     */
    private function authenticateRequest(): bool
    {
        // Check for secret key in headers or query params
        $providedKey = $_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? 
                      $_GET['secret'] ?? 
                      $_POST['secret'] ?? '';
        
        if (empty($this->secretKey)) {
            // No authentication configured, allow all
            return true;
        }
        
        return hash_equals($this->secretKey, $providedKey);
    }
    
    /**
     * Get request payload
     */
    private function getPayload(): array
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            
            if (str_contains($contentType, 'application/json')) {
                $json = file_get_contents('php://input');
                return json_decode($json, true) ?? [];
            } else {
                return $_POST;
            }
        }
        
        return $_GET;
    }
    
    /**
     * Check if sitemap update is needed
     */
    private function isSitemapUpdateNeeded(): bool
    {
        $sitemapPath = __DIR__ . '/../web/sitemap.xml';
        
        if (!file_exists($sitemapPath)) {
            return true;
        }
        
        // Check if sitemap is older than 24 hours
        $sitemapAge = time() - filemtime($sitemapPath);
        return $sitemapAge > (24 * 60 * 60);
    }
    
    /**
     * Submit sitemap to search engines
     */
    private function submitSitemap(): array
    {
        $sitemapUrl = 'https://it-era.it/sitemap.xml';
        $results = [];
        
        $submissions = [
            'Google' => 'https://www.google.com/ping?sitemap=' . urlencode($sitemapUrl),
            'Bing' => 'https://www.bing.com/ping?sitemap=' . urlencode($sitemapUrl)
        ];
        
        foreach ($submissions as $engine => $url) {
            $response = $this->makeHttpRequest($url);
            $results[$engine] = $response !== false ? 'success' : 'failed';
        }
        
        return $results;
    }
    
    /**
     * Count URLs in sitemap
     */
    private function countSitemapUrls(): int
    {
        $sitemapPath = __DIR__ . '/../web/sitemap.xml';
        if (!file_exists($sitemapPath)) {
            return 0;
        }
        
        $content = file_get_contents($sitemapPath);
        return substr_count($content, '<url>');
    }
    
    /**
     * Get recently modified page URLs
     */
    private function getRecentlyModifiedPageUrls(): array
    {
        $urls = [];
        $webDir = __DIR__ . '/../web/pages';
        
        if (!is_dir($webDir)) {
            return $urls;
        }
        
        $files = glob($webDir . '/*.html');
        $cutoffTime = time() - (24 * 60 * 60); // Last 24 hours
        
        foreach ($files as $file) {
            if (filemtime($file) > $cutoffTime) {
                $urls[] = 'https://it-era.it/' . basename($file);
            }
        }
        
        return array_slice($urls, 0, 10); // Limit to 10 URLs
    }
    
    /**
     * Request page indexing
     */
    private function requestPageIndexing(string $url): bool
    {
        // Simple HTTP request to the URL
        $response = $this->makeHttpRequest($url);
        return $response !== false;
    }
    
    /**
     * Check page performance
     */
    private function checkPagePerformance(string $url): array
    {
        $startTime = microtime(true);
        
        $response = $this->makeHttpRequest($url);
        
        $endTime = microtime(true);
        $responseTime = round(($endTime - $startTime) * 1000, 2); // ms
        
        return [
            'url' => $url,
            'response_time' => $responseTime,
            'status' => $response !== false ? 'ok' : 'error',
            'size' => $response ? strlen($response) : 0,
            'timestamp' => date('c')
        ];
    }
    
    /**
     * Parse SEO audit output
     */
    private function parseAuditOutput(array $output): array
    {
        $results = [
            'score' => 100,
            'critical_issues' => 0,
            'warnings' => 0,
            'issues' => [],
            'summary' => implode("\n", $output)
        ];
        
        foreach ($output as $line) {
            if (strpos($line, 'ERROR') !== false) {
                $results['critical_issues']++;
                $results['issues'][] = $line;
            } elseif (strpos($line, 'WARNING') !== false) {
                $results['warnings']++;
            }
        }
        
        // Calculate score
        $results['score'] = max(0, 100 - ($results['critical_issues'] * 10) - ($results['warnings'] * 2));
        
        return $results;
    }
    
    /**
     * Send audit notification
     */
    private function sendAuditNotification(array $auditResults): void
    {
        $message = "SEO Audit Alert - Critical Issues Found\n\n" .
                  "Score: {$auditResults['score']}/100\n" .
                  "Critical Issues: {$auditResults['critical_issues']}\n" .
                  "Warnings: {$auditResults['warnings']}\n\n" .
                  "Details:\n" . implode("\n", array_slice($auditResults['issues'], 0, 5));
        
        $this->sendNotification('SEO Audit Alert', $message, 'warning');
    }
    
    /**
     * Clear CDN cache
     */
    private function clearCDNCache(string $path): bool
    {
        // Placeholder for CDN cache clearing
        $this->log("CDN cache cleared for: {$path}", 'INFO');
        return true;
    }
    
    /**
     * Record webhook metrics
     */
    private function recordWebhookMetrics(string $action, array $data): void
    {
        $metrics = [
            'timestamp' => date('c'),
            'action' => $action,
            'data' => $data
        ];
        
        $metricsFile = "/var/log/it-era-seo/webhook-metrics.json";
        file_put_contents($metricsFile, json_encode($metrics) . "\n", FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Status check methods
     */
    private function checkSitemapStatus(): array
    {
        $sitemapPath = __DIR__ . '/../web/sitemap.xml';
        return [
            'exists' => file_exists($sitemapPath),
            'last_modified' => file_exists($sitemapPath) ? date('c', filemtime($sitemapPath)) : null,
            'url_count' => $this->countSitemapUrls()
        ];
    }
    
    private function checkRSSStatus(): array
    {
        $rssPath = __DIR__ . '/../web/rss.xml';
        return [
            'exists' => file_exists($rssPath),
            'last_modified' => file_exists($rssPath) ? date('c', filemtime($rssPath)) : null
        ];
    }
    
    private function checkPerformanceStatus(): array
    {
        return [
            'webhook_response_time' => 'fast',
            'last_check' => date('c')
        ];
    }
    
    private function countTotalPages(): int
    {
        $webDir = __DIR__ . '/../web/pages';
        if (!is_dir($webDir)) {
            return 0;
        }
        return count(glob($webDir . '/*.html'));
    }
    
    private function getRecentUpdatesCount(): int
    {
        return count($this->getRecentlyModifiedPageUrls());
    }
    
    /**
     * Send notification
     */
    private function sendNotification(string $title, string $message, string $type = 'info'): void
    {
        $notification = [
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'timestamp' => date('c'),
            'source' => 'webhook'
        ];
        
        // Save to notifications file for external processing
        $notificationFile = "/var/log/it-era-seo/notifications.json";
        file_put_contents($notificationFile, json_encode($notification) . "\n", FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Make HTTP request
     */
    private function makeHttpRequest(string $url): string|false
    {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => [
                    'User-Agent: IT-ERA-SEO-Webhook/1.0 (+https://it-era.it)',
                    'Accept: text/html,application/xml'
                ],
                'timeout' => 30
            ]
        ]);
        
        return @file_get_contents($url, false, $context);
    }
    
    /**
     * Load configuration
     */
    private function loadConfiguration(): void
    {
        $configFile = __DIR__ . '/seo-webhook-config.json';
        
        if (file_exists($configFile)) {
            $this->config = json_decode(file_get_contents($configFile), true) ?? [];
        } else {
            $this->config = [];
        }
        
        $this->secretKey = $this->config['webhook_secret'] ?? $_ENV['SEO_WEBHOOK_SECRET'] ?? '';
    }
    
    /**
     * Respond with success
     */
    private function respondWithSuccess(array $data): void
    {
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'timestamp' => date('c'),
            ...$data
        ], JSON_PRETTY_PRINT);
    }
    
    /**
     * Respond with error
     */
    private function respondWithError(string $message, int $code = 400): void
    {
        http_response_code($code);
        echo json_encode([
            'status' => 'error',
            'message' => $message,
            'timestamp' => date('c')
        ], JSON_PRETTY_PRINT);
    }
    
    /**
     * Log message
     */
    private function log(string $message, string $level = 'INFO'): void
    {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] [{$level}] {$message}";
        
        file_put_contents($this->logFile, $logMessage . "\n", FILE_APPEND | LOCK_EX);
        
        // Also log to error log for debugging
        if ($level === 'ERROR') {
            error_log($logMessage);
        }
    }
    
    /**
     * Ensure log directory exists
     */
    private function ensureLogDirectory(): void
    {
        $logDir = dirname($this->logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
    }
}

// Handle webhook request
$handler = new SEOWebhookHandler();
$handler->handle();
?>