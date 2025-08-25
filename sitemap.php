<?php
/**
 * IT-ERA SITEMAP GUARDIAN - Dynamic Sitemap Generator with 404 Pruning
 * HIVESTORM Implementation - Enterprise SEO Infrastructure
 * 
 * Usage: 
 *   Web: https://it-era.it/sitemap.php
 *   CLI: php sitemap.php --mode=full --prune=1 --verbose
 */

class SitemapGuardian {
    private $config;
    private $baseDir;
    private $verbose;
    private $logFile;
    
    public function __construct($verbose = false) {
        $this->baseDir = __DIR__;
        $this->verbose = $verbose;
        $this->logFile = $this->baseDir . '/logs/sitemap-guardian-' . date('Y-m-d') . '.log';
        
        // Ensure logs directory exists
        $this->ensureDirectoryExists(dirname($this->logFile));
        
        // Load configuration
        $this->loadConfig();
    }
    
    /**
     * Main execution method
     */
    public function generate($mode = 'full', $prune = true) {
        $this->log("Starting Sitemap Guardian - Mode: $mode, Prune: " . ($prune ? 'enabled' : 'disabled'));
        
        try {
            $urls = [];
            
            if ($mode === 'full') {
                $urls = $this->scanWebDirectory();
            } else {
                $urls = $this->loadExistingSitemap();
            }
            
            if ($prune) {
                $urls = $this->pruneDeadUrls($urls);
            }
            
            $this->generateSitemapXml($urls);
            
            $this->log("Sitemap generation completed successfully. Total URLs: " . count($urls));
            
            return [
                'success' => true,
                'url_count' => count($urls),
                'generated_at' => date('c'),
                'mode' => $mode,
                'pruning_enabled' => $prune
            ];
            
        } catch (Exception $e) {
            $this->logError("Sitemap generation failed: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Scan web directory for HTML files
     */
    private function scanWebDirectory() {
        $this->log("Scanning web directory for HTML files...");
        
        $urls = [];
        $webDir = $this->baseDir . '/web';
        
        if (!is_dir($webDir)) {
            throw new Exception("Web directory not found: $webDir");
        }
        
        // Add homepage
        $urls[] = [
            'loc' => 'https://it-era.it/',
            'lastmod' => date('c', filemtime($webDir . '/index.html')),
            'changefreq' => 'daily',
            'priority' => '1.0'
        ];
        
        // Scan directories
        $directories = [
            '/pages' => ['changefreq' => 'monthly', 'priority' => '0.8'],
            '/pages-generated' => ['changefreq' => 'monthly', 'priority' => '0.6'],
            '/blog' => ['changefreq' => 'weekly', 'priority' => '0.7']
        ];
        
        foreach ($directories as $dir => $defaults) {
            $fullDir = $webDir . $dir;
            if (is_dir($fullDir)) {
                $files = $this->scanHtmlFiles($fullDir);
                foreach ($files as $file) {
                    $relativePath = str_replace($webDir, '', $file);
                    $url = $this->createUrlEntry($relativePath, $file, $defaults);
                    if ($url) {
                        $urls[] = $url;
                    }
                }
            }
        }
        
        $this->log("Scanned " . count($urls) . " URLs from web directory");
        return $urls;
    }
    
    /**
     * Create URL entry with metadata
     */
    private function createUrlEntry($relativePath, $filePath, $defaults) {
        // Skip draft pages
        if (strpos($relativePath, '/pages-draft/') !== false) {
            return null;
        }
        
        // Normalize URL: remove .html extension for Cloudflare Pages compatibility
        $normalizedPath = $relativePath;
        if (strpos($relativePath, '/pages-generated/') !== false && str_ends_with($relativePath, '.html')) {
            $normalizedPath = substr($relativePath, 0, -5); // Remove .html
        }
        
        $url = 'https://it-era.it' . $normalizedPath;
        
        return [
            'loc' => $url,
            'lastmod' => date('c', filemtime($filePath)),
            'changefreq' => $defaults['changefreq'],
            'priority' => $defaults['priority']
        ];
    }
    
    /**
     * PRUNE 404 MODULE - Remove dead URLs
     */
    private function pruneDeadUrls($urls) {
        $this->log("Starting 404 pruning process for " . count($urls) . " URLs...");
        
        $validUrls = [];
        $removedUrls = [];
        $whitelistPaths = ['/sitemap.xml', '/robots.txt', '/', '/pages/contatti.html'];
        
        // Process in batches to respect rate limits
        $batches = array_chunk($urls, 20);
        
        foreach ($batches as $batch) {
            $curlHandles = [];
            $multiHandle = curl_multi_init();
            
            // Initialize batch requests
            foreach ($batch as $index => $urlData) {
                $url = $urlData['loc'];
                
                // Skip whitelisted URLs
                $urlPath = parse_url($url, PHP_URL_PATH);
                if (in_array($urlPath, $whitelistPaths)) {
                    $validUrls[] = $urlData;
                    continue;
                }
                
                $ch = curl_init();
                curl_setopt_array($ch, [
                    CURLOPT_URL => $url,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_NOBODY => true, // HEAD request
                    CURLOPT_TIMEOUT => 10,
                    CURLOPT_USERAGENT => 'IT-ERA Sitemap Guardian/1.0',
                    CURLOPT_FOLLOWLOCATION => true,
                    CURLOPT_MAXREDIRS => 3
                ]);
                
                curl_multi_add_handle($multiHandle, $ch);
                $curlHandles[$index] = $ch;
            }
            
            // Execute batch requests
            $running = null;
            do {
                curl_multi_exec($multiHandle, $running);
                curl_multi_select($multiHandle);
            } while ($running > 0);
            
            // Process results
            foreach ($curlHandles as $index => $ch) {
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $urlData = $batch[$index];
                
                if ($httpCode >= 200 && $httpCode < 400) {
                    $validUrls[] = $urlData;
                } else {
                    $removedUrls[] = [
                        'url' => $urlData['loc'],
                        'status' => $httpCode,
                        'reason' => $httpCode == 404 ? 'Not Found' : 'HTTP Error',
                        'timestamp' => date('c')
                    ];
                }
                
                curl_multi_remove_handle($multiHandle, $ch);
                curl_close($ch);
            }
            
            curl_multi_close($multiHandle);
            
            // Rate limiting
            sleep(1);
        }
        
        // Log removed URLs
        if (!empty($removedUrls)) {
            $this->logRemovedUrls($removedUrls);
        }
        
        $this->log("Pruning complete. Valid: " . count($validUrls) . ", Removed: " . count($removedUrls));
        
        return $validUrls;
    }
    
    /**
     * Generate sitemap XML with atomic write
     */
    private function generateSitemapXml($urls) {
        $this->log("Generating sitemap XML...");
        
        $sitemap = new DOMDocument('1.0', 'UTF-8');
        $sitemap->formatOutput = true;
        
        $urlset = $sitemap->createElement('urlset');
        $urlset->setAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
        $sitemap->appendChild($urlset);
        
        // Sort URLs by priority
        usort($urls, function($a, $b) {
            return floatval($b['priority']) <=> floatval($a['priority']);
        });
        
        // Add URLs to sitemap
        foreach ($urls as $urlData) {
            $url = $sitemap->createElement('url');
            
            $loc = $sitemap->createElement('loc', htmlspecialchars($urlData['loc']));
            $url->appendChild($loc);
            
            $lastmod = $sitemap->createElement('lastmod', $urlData['lastmod']);
            $url->appendChild($lastmod);
            
            $changefreq = $sitemap->createElement('changefreq', $urlData['changefreq']);
            $url->appendChild($changefreq);
            
            $priority = $sitemap->createElement('priority', $urlData['priority']);
            $url->appendChild($priority);
            
            $urlset->appendChild($url);
        }
        
        // Atomic write
        $tempFile = $this->baseDir . '/web/sitemap.tmp.xml';
        $finalFile = $this->baseDir . '/web/sitemap.xml';
        
        if (!$sitemap->save($tempFile)) {
            throw new Exception("Failed to write temporary sitemap file");
        }
        
        // Validate XML
        if (!$this->validateSitemapXml($tempFile)) {
            unlink($tempFile);
            throw new Exception("Generated sitemap failed validation");
        }
        
        // Atomic rename
        if (!rename($tempFile, $finalFile)) {
            throw new Exception("Failed to move sitemap to final location");
        }
        
        $this->log("Sitemap XML generated successfully: $finalFile");
    }
    
    /**
     * Log removed URLs
     */
    private function logRemovedUrls($removedUrls) {
        $logFile = $this->baseDir . '/logs/sitemap-removed-' . date('Ymd') . '.txt';
        $this->ensureDirectoryExists(dirname($logFile));
        
        $logContent = "# IT-ERA Sitemap Guardian - Removed URLs Log\n";
        $logContent .= "# Generated: " . date('c') . "\n";
        $logContent .= "# Total removed: " . count($removedUrls) . "\n\n";
        
        foreach ($removedUrls as $removed) {
            $logContent .= sprintf(
                "%s\t%d\t%s\t%s\n",
                $removed['timestamp'],
                $removed['status'],
                $removed['reason'],
                $removed['url']
            );
        }
        
        file_put_contents($logFile, $logContent, FILE_APPEND | LOCK_EX);
        $this->log("Logged " . count($removedUrls) . " removed URLs to: $logFile");
    }
    
    /**
     * Validate sitemap XML
     */
    private function validateSitemapXml($file) {
        if (!file_exists($file)) {
            return false;
        }
        
        $xml = new DOMDocument();
        libxml_use_internal_errors(true);
        
        if (!$xml->load($file)) {
            $this->logError("XML parsing failed: " . implode(', ', libxml_get_errors()));
            return false;
        }
        
        // Basic validation
        $urlNodes = $xml->getElementsByTagName('url');
        if ($urlNodes->length === 0) {
            $this->logError("No URL nodes found in sitemap");
            return false;
        }
        
        // Check for valid URLs (sample first 10 for performance)
        $count = min(10, $urlNodes->length);
        for ($i = 0; $i < $count; $i++) {
            $urlNode = $urlNodes->item($i);
            $locNode = $urlNode->getElementsByTagName('loc')->item(0);
            if (!$locNode || !filter_var($locNode->textContent, FILTER_VALIDATE_URL)) {
                $this->logError("Invalid URL found: " . ($locNode ? $locNode->textContent : 'missing loc tag'));
                return false;
            }
        }
        
        $this->log("Sitemap XML validation passed - " . $urlNodes->length . " URLs validated");
        return true;
    }
    
    /**
     * Scan for HTML files
     */
    private function scanHtmlFiles($dir) {
        $files = [];
        
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'html') {
                $files[] = $file->getPathname();
            }
        }
        
        return $files;
    }
    
    /**
     * Load existing sitemap for quick mode
     */
    private function loadExistingSitemap() {
        $sitemapFile = $this->baseDir . '/web/sitemap.xml';
        
        if (!file_exists($sitemapFile)) {
            throw new Exception("Existing sitemap not found for quick mode");
        }
        
        $xml = new DOMDocument();
        $xml->load($sitemapFile);
        
        $urls = [];
        $urlNodes = $xml->getElementsByTagName('url');
        
        foreach ($urlNodes as $urlNode) {
            $loc = $urlNode->getElementsByTagName('loc')->item(0)->textContent;
            $lastmod = $urlNode->getElementsByTagName('lastmod')->item(0)?->textContent ?? date('c');
            $changefreq = $urlNode->getElementsByTagName('changefreq')->item(0)?->textContent ?? 'monthly';
            $priority = $urlNode->getElementsByTagName('priority')->item(0)?->textContent ?? '0.5';
            
            $urls[] = [
                'loc' => $loc,
                'lastmod' => $lastmod,
                'changefreq' => $changefreq,
                'priority' => $priority
            ];
        }
        
        return $urls;
    }
    
    /**
     * Load configuration
     */
    private function loadConfig() {
        $this->config = [
            'site_url' => 'https://it-era.it',
            'max_urls_per_file' => 50000,
            'batch_size' => 20,
            'timeout' => 10,
            'user_agent' => 'IT-ERA Sitemap Guardian/1.0'
        ];
    }
    
    /**
     * Utility methods
     */
    private function ensureDirectoryExists($dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
    
    private function log($message) {
        $timestamp = date('[Y-m-d H:i:s]');
        $logMessage = "$timestamp $message" . PHP_EOL;
        
        if ($this->verbose) {
            echo $logMessage;
        }
        
        file_put_contents($this->logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
    
    private function logError($message) {
        $this->log("ERROR: $message");
        error_log("Sitemap Guardian Error: $message");
    }
}

// Web and CLI execution
if (php_sapi_name() === 'cli') {
    // CLI mode
    $options = getopt('', ['mode:', 'prune:', 'verbose', 'help']);
    
    if (isset($options['help'])) {
        echo "IT-ERA Sitemap Guardian\n";
        echo "Usage: php sitemap.php [options]\n";
        echo "Options:\n";
        echo "  --mode=full|quick   Generation mode (default: full)\n";
        echo "  --prune=1|0        Enable 404 pruning (default: 1)\n";
        echo "  --verbose          Show detailed output\n";
        echo "  --help             Show this help\n";
        exit(0);
    }
    
    $mode = $options['mode'] ?? 'full';
    $prune = isset($options['prune']) ? (bool)$options['prune'] : true;
    $verbose = isset($options['verbose']);
    
    try {
        $guardian = new SitemapGuardian($verbose);
        $result = $guardian->generate($mode, $prune);
        
        echo "✅ Sitemap generated successfully!\n";
        echo "📊 URLs: {$result['url_count']}\n";
        echo "🕒 Generated: {$result['generated_at']}\n";
        
    } catch (Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
        exit(1);
    }
    
} else {
    // Web mode
    header('Content-Type: application/xml; charset=utf-8');
    
    try {
        $guardian = new SitemapGuardian(false);
        $guardian->generate('quick', false); // No pruning in web mode for performance
        
        // Serve the generated sitemap
        $sitemapFile = __DIR__ . '/web/sitemap.xml';
        if (file_exists($sitemapFile)) {
            readfile($sitemapFile);
        } else {
            http_response_code(500);
            echo '<?xml version="1.0"?><error>Sitemap generation failed</error>';
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo '<?xml version="1.0"?><error>' . htmlspecialchars($e->getMessage()) . '</error>';
    }
}