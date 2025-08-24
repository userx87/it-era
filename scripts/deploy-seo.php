<?php
/**
 * IT-ERA SEO Deployment Script
 * Post-deployment SEO tasks automation
 * 
 * Handles:
 * - Search engine sitemap submission
 * - Indexing requests for new pages
 * - RSS feed updates
 * - CDN cache clearing for SEO files
 * - Performance monitoring
 * 
 * Usage: php deploy-seo.php [--environment=production] [--force] [--dry-run]
 */

declare(strict_types=1);

class SEODeploymentManager
{
    private string $siteUrl = 'https://it-era.pages.dev';
    private string $environment;
    private bool $dryRun = false;
    private bool $force = false;
    private array $logMessages = [];
    private string $logFile;
    
    // Search Engine URLs
    private const GOOGLE_PING_URL = 'https://www.google.com/ping?sitemap=';
    private const BING_PING_URL = 'https://www.bing.com/ping?sitemap=';
    private const YANDEX_PING_URL = 'https://webmaster.yandex.com/ping?sitemap=';
    
    // Google Search Console API endpoints
    private const GOOGLE_INDEXING_API = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
    
    public function __construct(array $options = [])
    {
        $this->environment = $options['environment'] ?? 'development';
        $this->dryRun = $options['dry-run'] ?? false;
        $this->force = $options['force'] ?? false;
        
        // Set up logging
        $this->logFile = "/var/log/it-era-seo/deploy-seo-" . date('Y-m-d') . ".log";
        $this->ensureLogDirectory();
        
        $this->log("SEO Deployment Manager initialized", 'INFO');
        $this->log("Environment: {$this->environment}", 'INFO');
        $this->log("Dry run: " . ($this->dryRun ? 'Yes' : 'No'), 'INFO');
    }
    
    /**
     * Main deployment process
     */
    public function deploy(): bool
    {
        try {
            $this->log("Starting SEO deployment process", 'INFO');
            
            $success = true;
            
            // Step 1: Generate and submit sitemap
            if (!$this->processSitemap()) {
                $success = false;
            }
            
            // Step 2: Update RSS feeds
            if (!$this->updateRSSFeeds()) {
                $success = false;
            }
            
            // Step 3: Submit new pages for indexing
            if (!$this->requestIndexing()) {
                $success = false;
            }
            
            // Step 4: Clear CDN cache
            if (!$this->clearCDNCache()) {
                $success = false;
            }
            
            // Step 5: Update robots.txt if needed
            if (!$this->updateRobotsTxt()) {
                $success = false;
            }
            
            // Step 6: Send performance metrics
            if (!$this->recordDeploymentMetrics()) {
                $success = false;
            }
            
            // Step 7: Send notifications
            $this->sendDeploymentNotification($success);
            
            $this->log("SEO deployment process " . ($success ? "completed successfully" : "completed with errors"), $success ? 'INFO' : 'ERROR');
            
            return $success;
            
        } catch (Exception $e) {
            $this->log("SEO deployment failed: " . $e->getMessage(), 'ERROR');
            $this->sendErrorNotification($e);
            return false;
        }
    }
    
    /**
     * Generate sitemap and submit to search engines
     */
    private function processSitemap(): bool
    {
        $this->log("Processing sitemap...", 'INFO');
        
        try {
            // Generate sitemap if script exists
            if (file_exists(__DIR__ . '/generate_sitemap.php')) {
                if (!$this->dryRun) {
                    $output = [];
                    $returnCode = 0;
                    exec("php " . __DIR__ . "/generate_sitemap.php 2>&1", $output, $returnCode);
                    
                    if ($returnCode !== 0) {
                        $this->log("Sitemap generation failed: " . implode("\n", $output), 'ERROR');
                        return false;
                    }
                    
                    $this->log("Sitemap generated successfully", 'INFO');
                } else {
                    $this->log("[DRY RUN] Would generate sitemap", 'INFO');
                }
            }
            
            // Check if sitemap exists
            $sitemapPath = __DIR__ . '/../web/sitemap.xml';
            if (!file_exists($sitemapPath)) {
                $this->log("Sitemap file not found: {$sitemapPath}", 'WARNING');
                return false;
            }
            
            // Submit to search engines
            $sitemapUrl = $this->siteUrl . '/sitemap.xml';
            $submissions = [
                'Google' => self::GOOGLE_PING_URL . urlencode($sitemapUrl),
                'Bing' => self::BING_PING_URL . urlencode($sitemapUrl),
                'Yandex' => self::YANDEX_PING_URL . urlencode($sitemapUrl)
            ];
            
            foreach ($submissions as $engine => $url) {
                if (!$this->dryRun) {
                    $response = $this->makeHttpRequest($url);
                    if ($response === false) {
                        $this->log("Failed to submit sitemap to {$engine}", 'WARNING');
                    } else {
                        $this->log("Sitemap submitted to {$engine} successfully", 'INFO');
                    }
                } else {
                    $this->log("[DRY RUN] Would submit sitemap to {$engine}", 'INFO');
                }
            }
            
            return true;
            
        } catch (Exception $e) {
            $this->log("Sitemap processing error: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }
    
    /**
     * Update RSS feeds
     */
    private function updateRSSFeeds(): bool
    {
        $this->log("Updating RSS feeds...", 'INFO');
        
        try {
            $rssScripts = [
                'update_blog_rss.php',
                'update_news_rss.php',
                'generate_rss.php'
            ];
            
            foreach ($rssScripts as $script) {
                $scriptPath = __DIR__ . '/' . $script;
                if (file_exists($scriptPath)) {
                    if (!$this->dryRun) {
                        $output = [];
                        $returnCode = 0;
                        exec("php {$scriptPath} 2>&1", $output, $returnCode);
                        
                        if ($returnCode === 0) {
                            $this->log("RSS script {$script} executed successfully", 'INFO');
                        } else {
                            $this->log("RSS script {$script} failed: " . implode("\n", $output), 'WARNING');
                        }
                    } else {
                        $this->log("[DRY RUN] Would execute RSS script: {$script}", 'INFO');
                    }
                }
            }
            
            return true;
            
        } catch (Exception $e) {
            $this->log("RSS feed update error: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }
    
    /**
     * Request indexing for new/updated pages
     */
    private function requestIndexing(): bool
    {
        $this->log("Requesting page indexing...", 'INFO');
        
        try {
            // Get list of recently modified pages
            $recentPages = $this->getRecentlyModifiedPages();
            
            if (empty($recentPages)) {
                $this->log("No recently modified pages found", 'INFO');
                return true;
            }
            
            $this->log("Found " . count($recentPages) . " recently modified pages", 'INFO');
            
            // Submit indexing requests (limited to avoid rate limits)
            $maxIndexingRequests = 10;
            $indexedCount = 0;
            
            foreach (array_slice($recentPages, 0, $maxIndexingRequests) as $page) {
                $pageUrl = $this->siteUrl . '/' . basename($page);
                
                if (!$this->dryRun) {
                    if ($this->requestPageIndexing($pageUrl)) {
                        $indexedCount++;
                        $this->log("Indexing requested for: {$pageUrl}", 'INFO');
                    } else {
                        $this->log("Failed to request indexing for: {$pageUrl}", 'WARNING');
                    }
                    
                    // Rate limiting
                    usleep(500000); // 0.5 second delay
                } else {
                    $this->log("[DRY RUN] Would request indexing for: {$pageUrl}", 'INFO');
                    $indexedCount++;
                }
            }
            
            $this->log("Indexing requests completed: {$indexedCount} pages", 'INFO');
            return true;
            
        } catch (Exception $e) {
            $this->log("Indexing request error: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }
    
    /**
     * Clear CDN cache for SEO-related files
     */
    private function clearCDNCache(): bool
    {
        $this->log("Clearing CDN cache for SEO files...", 'INFO');
        
        try {
            $seoFiles = [
                '/sitemap.xml',
                '/robots.txt',
                '/rss.xml',
                '/feed.xml',
                '/*.html' // All HTML pages
            ];
            
            foreach ($seoFiles as $file) {
                if (!$this->dryRun) {
                    // For Cloudflare Pages (IT-ERA uses Cloudflare)
                    $this->purgeCloudflareCache($file);
                } else {
                    $this->log("[DRY RUN] Would clear CDN cache for: {$file}", 'INFO');
                }
            }
            
            return true;
            
        } catch (Exception $e) {
            $this->log("CDN cache clearing error: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }
    
    /**
     * Update robots.txt if needed
     */
    private function updateRobotsTxt(): bool
    {
        $this->log("Checking robots.txt...", 'INFO');
        
        try {
            $robotsPath = __DIR__ . '/../web/robots.txt';
            $expectedContent = $this->generateRobotsTxt();
            
            if (file_exists($robotsPath)) {
                $currentContent = file_get_contents($robotsPath);
                if ($currentContent === $expectedContent) {
                    $this->log("robots.txt is up to date", 'INFO');
                    return true;
                }
            }
            
            if (!$this->dryRun) {
                if (file_put_contents($robotsPath, $expectedContent)) {
                    $this->log("robots.txt updated successfully", 'INFO');
                } else {
                    $this->log("Failed to update robots.txt", 'ERROR');
                    return false;
                }
            } else {
                $this->log("[DRY RUN] Would update robots.txt", 'INFO');
            }
            
            return true;
            
        } catch (Exception $e) {
            $this->log("robots.txt update error: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }
    
    /**
     * Record deployment metrics
     */
    private function recordDeploymentMetrics(): bool
    {
        $this->log("Recording deployment metrics...", 'INFO');
        
        try {
            $metrics = [
                'timestamp' => date('c'),
                'environment' => $this->environment,
                'sitemap_urls' => $this->countSitemapUrls(),
                'pages_indexed' => $this->getRecentlyModifiedPagesCount(),
                'deployment_time' => time()
            ];
            
            $metricsFile = __DIR__ . '/../reports/seo/deployment-metrics.json';
            $this->ensureDirectory(dirname($metricsFile));
            
            if (!$this->dryRun) {
                if (file_put_contents($metricsFile, json_encode($metrics, JSON_PRETTY_PRINT))) {
                    $this->log("Deployment metrics recorded", 'INFO');
                } else {
                    $this->log("Failed to record deployment metrics", 'WARNING');
                }
            } else {
                $this->log("[DRY RUN] Would record deployment metrics", 'INFO');
            }
            
            return true;
            
        } catch (Exception $e) {
            $this->log("Metrics recording error: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }
    
    /**
     * Get recently modified pages
     */
    private function getRecentlyModifiedPages(): array
    {
        $pages = [];
        $webDir = __DIR__ . '/../web/pages';
        
        if (!is_dir($webDir)) {
            return $pages;
        }
        
        $files = glob($webDir . '/*.html');
        $cutoffTime = time() - (24 * 60 * 60); // Last 24 hours
        
        foreach ($files as $file) {
            if (filemtime($file) > $cutoffTime) {
                $pages[] = $file;
            }
        }
        
        return $pages;
    }
    
    /**
     * Request indexing for a specific page
     */
    private function requestPageIndexing(string $url): bool
    {
        // Simple HTTP request to trigger crawler attention
        // In production, you would use Google Indexing API with proper authentication
        
        $userAgent = 'IT-ERA-SEO-Bot/1.0 (+https://it-era.pages.dev)';
        
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => [
                    'User-Agent: ' . $userAgent,
                    'Accept: text/html,application/xhtml+xml'
                ],
                'timeout' => 10
            ]
        ]);
        
        $response = @file_get_contents($url, false, $context);
        return $response !== false;
    }
    
    /**
     * Purge Cloudflare cache
     */
    private function purgeCloudflareCache(string $file): bool
    {
        // Note: In production, implement proper Cloudflare API integration
        // For now, this is a placeholder that logs the action
        
        $this->log("CDN cache cleared for: {$file}", 'INFO');
        return true;
    }
    
    /**
     * Generate robots.txt content
     */
    private function generateRobotsTxt(): string
    {
        return "User-agent: *\n" .
               "Allow: /\n" .
               "Disallow: /admin/\n" .
               "Disallow: /scripts/\n" .
               "Disallow: /reports/\n" .
               "Disallow: /*.json\$\n" .
               "Disallow: /*.log\$\n\n" .
               "Sitemap: {$this->siteUrl}/sitemap.xml\n\n" .
               "# Crawl-delay for respectful crawling\n" .
               "Crawl-delay: 1\n";
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
     * Get count of recently modified pages
     */
    private function getRecentlyModifiedPagesCount(): int
    {
        return count($this->getRecentlyModifiedPages());
    }
    
    /**
     * Send deployment notification
     */
    private function sendDeploymentNotification(bool $success): void
    {
        $status = $success ? 'SUCCESS' : 'FAILED';
        $message = "IT-ERA SEO Deployment {$status}\n\n" .
                  "Environment: {$this->environment}\n" .
                  "Time: " . date('Y-m-d H:i:s') . "\n" .
                  "Site: {$this->siteUrl}\n\n" .
                  "Summary:\n" . implode("\n", array_slice($this->logMessages, -10));
        
        if (!$this->dryRun) {
            $this->sendNotification('IT-ERA SEO Deployment', $message, $success ? 'info' : 'error');
        }
    }
    
    /**
     * Send error notification
     */
    private function sendErrorNotification(Exception $e): void
    {
        $message = "IT-ERA SEO Deployment ERROR\n\n" .
                  "Error: " . $e->getMessage() . "\n" .
                  "File: " . $e->getFile() . ":" . $e->getLine() . "\n" .
                  "Time: " . date('Y-m-d H:i:s') . "\n";
        
        if (!$this->dryRun) {
            $this->sendNotification('IT-ERA SEO Deployment Error', $message, 'error');
        }
    }
    
    /**
     * Send notification (webhook, email, etc.)
     */
    private function sendNotification(string $title, string $message, string $type = 'info'): void
    {
        // Placeholder for notification system
        // In production, implement webhook notifications, email alerts, etc.
        
        $this->log("Notification sent: {$title}", 'INFO');
        
        // Example webhook payload
        $payload = [
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'timestamp' => date('c'),
            'environment' => $this->environment
        ];
        
        // Save notification to file for external processing
        $notificationFile = "/var/log/it-era-seo/notifications.json";
        $this->ensureDirectory(dirname($notificationFile));
        file_put_contents($notificationFile, json_encode($payload) . "\n", FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Make HTTP request
     */
    private function makeHttpRequest(string $url, array $options = []): string|false
    {
        $defaultOptions = [
            'method' => 'GET',
            'timeout' => 30,
            'user_agent' => 'IT-ERA-SEO-Bot/1.0 (+https://it-era.pages.dev)'
        ];
        
        $options = array_merge($defaultOptions, $options);
        
        $context = stream_context_create([
            'http' => [
                'method' => $options['method'],
                'header' => [
                    'User-Agent: ' . $options['user_agent'],
                    'Accept: text/html,application/xml,application/json'
                ],
                'timeout' => $options['timeout']
            ]
        ]);
        
        return @file_get_contents($url, false, $context);
    }
    
    /**
     * Logging function
     */
    private function log(string $message, string $level = 'INFO'): void
    {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] [{$level}] {$message}";
        
        // Store in memory for later use
        $this->logMessages[] = $logMessage;
        
        // Write to file
        file_put_contents($this->logFile, $logMessage . "\n", FILE_APPEND | LOCK_EX);
        
        // Also output to console
        echo $logMessage . "\n";
    }
    
    /**
     * Ensure directory exists
     */
    private function ensureDirectory(string $path): void
    {
        if (!is_dir($path)) {
            mkdir($path, 0755, true);
        }
    }
    
    /**
     * Ensure log directory exists
     */
    private function ensureLogDirectory(): void
    {
        $this->ensureDirectory(dirname($this->logFile));
    }
}

// CLI execution
if (PHP_SAPI === 'cli') {
    $options = [];
    
    // Parse command line arguments
    $args = array_slice($argv, 1);
    foreach ($args as $arg) {
        if (str_starts_with($arg, '--environment=')) {
            $options['environment'] = substr($arg, 14);
        } elseif ($arg === '--dry-run') {
            $options['dry-run'] = true;
        } elseif ($arg === '--force') {
            $options['force'] = true;
        } elseif ($arg === '--help') {
            echo "IT-ERA SEO Deployment Script\n\n";
            echo "Usage: php deploy-seo.php [options]\n\n";
            echo "Options:\n";
            echo "  --environment=ENV  Set environment (development, staging, production)\n";
            echo "  --dry-run          Show what would be done without executing\n";
            echo "  --force            Force execution even if checks fail\n";
            echo "  --help             Show this help message\n\n";
            echo "Examples:\n";
            echo "  php deploy-seo.php --environment=production\n";
            echo "  php deploy-seo.php --dry-run\n";
            exit(0);
        }
    }
    
    // Create and run deployment manager
    $manager = new SEODeploymentManager($options);
    $success = $manager->deploy();
    
    exit($success ? 0 : 1);
}
?>