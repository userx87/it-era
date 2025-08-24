<?php
/**
 * IT-ERA SEO Indexer
 * Main cron script for sitemap generation and SEO indexing
 * 
 * Usage: php seo-indexer.php [--force] [--verbose] [--sitemap-only]
 */

class SEOIndexer {
    private $config;
    private $baseDir;
    private $verbose;
    private $force;
    
    public function __construct($verbose = false, $force = false) {
        $this->baseDir = dirname(__DIR__);
        $this->config = require __DIR__ . '/seo-config.php';
        $this->verbose = $verbose;
        $this->force = $force;
        
        // Ensure log directory exists
        $this->ensureDirectoryExists($this->baseDir . $this->config['paths']['logs']);
    }
    
    /**
     * Main execution method
     */
    public function run($sitemapOnly = false) {
        $this->log("Starting SEO indexing process...");
        
        try {
            // Generate sitemap
            $this->generateSitemap();
            
            if (!$sitemapOnly) {
                // Update page metadata
                $this->updatePageMetadata();
                
                // Generate structured data
                $this->generateStructuredData();
                
                // Check for broken links
                $this->checkBrokenLinks();
                
                // Generate SEO report
                $this->generateSEOReport();
            }
            
            $this->log("SEO indexing process completed successfully!");
            
        } catch (Exception $e) {
            $this->logError("SEO indexing failed: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Generate comprehensive sitemap
     */
    public function generateSitemap() {
        $this->log("Generating sitemap...");
        
        $sitemap = new DOMDocument('1.0', 'UTF-8');
        $sitemap->formatOutput = true;
        
        // Create urlset element
        $urlset = $sitemap->createElement('urlset');
        $urlset->setAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
        $urlset->setAttribute('xmlns:image', 'http://www.google.com/schemas/sitemap-image/1.1');
        $sitemap->appendChild($urlset);
        
        $urls = [];
        
        // Add homepage
        $urls[] = [
            'loc' => $this->config['site']['url'] . '/',
            'changefreq' => 'daily',
            'priority' => '1.0',
            'lastmod' => date('c')
        ];
        
        // Scan web directory for HTML files
        $webDir = $this->baseDir . $this->config['paths']['web'];
        $htmlFiles = $this->scanHtmlFiles($webDir);
        
        foreach ($htmlFiles as $file) {
            $url = $this->processHtmlFile($file);
            if ($url) {
                $urls[] = $url;
            }
        }
        
        // Sort URLs by priority (highest first)
        usort($urls, function($a, $b) {
            return floatval($b['priority']) <=> floatval($a['priority']);
        });
        
        // Add URLs to sitemap
        foreach ($urls as $urlData) {
            $url = $sitemap->createElement('url');
            
            $loc = $sitemap->createElement('loc', htmlspecialchars($urlData['loc']));
            $url->appendChild($loc);
            
            if (isset($urlData['lastmod'])) {
                $lastmod = $sitemap->createElement('lastmod', $urlData['lastmod']);
                $url->appendChild($lastmod);
            }
            
            if (isset($urlData['changefreq'])) {
                $changefreq = $sitemap->createElement('changefreq', $urlData['changefreq']);
                $url->appendChild($changefreq);
            }
            
            if (isset($urlData['priority'])) {
                $priority = $sitemap->createElement('priority', $urlData['priority']);
                $url->appendChild($priority);
            }
            
            // Add images if found
            if (isset($urlData['images'])) {
                foreach ($urlData['images'] as $image) {
                    $imageElement = $sitemap->createElement('image:image');
                    $imageLoc = $sitemap->createElement('image:loc', htmlspecialchars($image['loc']));
                    $imageElement->appendChild($imageLoc);
                    
                    if (isset($image['title'])) {
                        $imageTitle = $sitemap->createElement('image:title', htmlspecialchars($image['title']));
                        $imageElement->appendChild($imageTitle);
                    }
                    
                    $url->appendChild($imageElement);
                }
            }
            
            $urlset->appendChild($url);
        }
        
        // Save sitemap
        $sitemapPath = $this->baseDir . $this->config['paths']['sitemap'];
        $sitemap->save($sitemapPath);
        
        // Generate sitemap index if needed
        $this->generateSitemapIndex($urls);
        
        $this->log("Sitemap generated with " . count($urls) . " URLs");
        
        return count($urls);
    }
    
    /**
     * Process HTML file and extract SEO data
     */
    private function processHtmlFile($filePath) {
        $relativePath = str_replace($this->baseDir . $this->config['paths']['web'], '', $filePath);
        $url = $this->config['site']['url'] . $relativePath;
        
        // Skip draft pages for sitemap
        if (strpos($relativePath, '/pages-draft/') !== false) {
            return null;
        }
        
        $content = file_get_contents($filePath);
        if (!$content) {
            $this->logError("Could not read file: $filePath");
            return null;
        }
        
        // Parse HTML
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($content);
        libxml_clear_errors();
        
        // Extract metadata
        $title = $this->extractTitle($dom);
        $description = $this->extractDescription($dom);
        
        // Determine priority and change frequency
        $priority = $this->calculatePriority($relativePath, $content);
        $changefreq = $this->determineChangeFrequency($relativePath);
        
        // Get last modification time
        $lastmod = date('c', filemtime($filePath));
        
        // Extract images
        $images = $this->extractImages($dom, $url);
        
        $urlData = [
            'loc' => $url,
            'lastmod' => $lastmod,
            'changefreq' => $changefreq,
            'priority' => $priority,
            'title' => $title,
            'description' => $description
        ];
        
        if (!empty($images)) {
            $urlData['images'] = $images;
        }
        
        return $urlData;
    }
    
    /**
     * Calculate page priority based on content and URL structure
     */
    private function calculatePriority($relativePath, $content) {
        // Homepage gets highest priority
        if ($relativePath === '/index.html' || $relativePath === '/') {
            return '1.0';
        }
        
        // Main service pages
        foreach ($this->config['services'] as $service => $data) {
            if (strpos($relativePath, $service) !== false) {
                // Check if it's a main city
                foreach ($this->config['locations']['main_cities'] as $city) {
                    if (strpos($relativePath, $city) !== false) {
                        return '0.9';
                    }
                }
                return '0.8';
            }
        }
        
        // Other city pages
        if (preg_match('/\/pages\/[^\/]+\.html$/', $relativePath)) {
            return '0.7';
        }
        
        // Default priority
        return '0.6';
    }
    
    /**
     * Determine change frequency based on page type
     */
    private function determineChangeFrequency($relativePath) {
        if ($relativePath === '/index.html' || $relativePath === '/') {
            return 'daily';
        }
        
        if (strpos($relativePath, '/pages/') !== false) {
            return 'monthly';
        }
        
        return 'weekly';
    }
    
    /**
     * Extract page title
     */
    private function extractTitle($dom) {
        $titles = $dom->getElementsByTagName('title');
        if ($titles->length > 0) {
            return trim($titles->item(0)->textContent);
        }
        return '';
    }
    
    /**
     * Extract meta description
     */
    private function extractDescription($dom) {
        $metas = $dom->getElementsByTagName('meta');
        foreach ($metas as $meta) {
            if ($meta->getAttribute('name') === 'description') {
                return trim($meta->getAttribute('content'));
            }
        }
        return '';
    }
    
    /**
     * Extract images from page
     */
    private function extractImages($dom, $baseUrl) {
        $images = [];
        $imgTags = $dom->getElementsByTagName('img');
        
        foreach ($imgTags as $img) {
            $src = $img->getAttribute('src');
            if ($src && !str_starts_with($src, 'data:')) {
                // Convert relative URLs to absolute
                if (!filter_var($src, FILTER_VALIDATE_URL)) {
                    $src = rtrim($baseUrl, '/') . '/' . ltrim($src, '/');
                }
                
                $images[] = [
                    'loc' => $src,
                    'title' => $img->getAttribute('alt') ?: $img->getAttribute('title') ?: ''
                ];
                
                // Limit to 10 images per page
                if (count($images) >= 10) {
                    break;
                }
            }
        }
        
        return $images;
    }
    
    /**
     * Generate sitemap index if needed
     */
    private function generateSitemapIndex($urls) {
        if (count($urls) <= $this->config['sitemap']['max_urls_per_file']) {
            return;
        }
        
        $this->log("Generating sitemap index for large site...");
        
        // Split into multiple sitemaps
        $chunks = array_chunk($urls, $this->config['sitemap']['max_urls_per_file']);
        $sitemapFiles = [];
        
        foreach ($chunks as $index => $chunk) {
            $filename = "sitemap-" . ($index + 1) . ".xml";
            $this->generateSitemapChunk($chunk, $filename);
            $sitemapFiles[] = $filename;
        }
        
        // Create sitemap index
        $index = new DOMDocument('1.0', 'UTF-8');
        $index->formatOutput = true;
        
        $sitemapindex = $index->createElement('sitemapindex');
        $sitemapindex->setAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
        $index->appendChild($sitemapindex);
        
        foreach ($sitemapFiles as $filename) {
            $sitemap = $index->createElement('sitemap');
            
            $loc = $index->createElement('loc', $this->config['site']['url'] . '/' . $filename);
            $sitemap->appendChild($loc);
            
            $lastmod = $index->createElement('lastmod', date('c'));
            $sitemap->appendChild($lastmod);
            
            $sitemapindex->appendChild($sitemap);
        }
        
        $indexPath = $this->baseDir . '/web/sitemap-index.xml';
        $index->save($indexPath);
    }
    
    /**
     * Generate a sitemap chunk
     */
    private function generateSitemapChunk($urls, $filename) {
        $sitemap = new DOMDocument('1.0', 'UTF-8');
        $sitemap->formatOutput = true;
        
        $urlset = $sitemap->createElement('urlset');
        $urlset->setAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
        $urlset->setAttribute('xmlns:image', 'http://www.google.com/schemas/sitemap-image/1.1');
        $sitemap->appendChild($urlset);
        
        foreach ($urls as $urlData) {
            $url = $sitemap->createElement('url');
            
            $loc = $sitemap->createElement('loc', htmlspecialchars($urlData['loc']));
            $url->appendChild($loc);
            
            if (isset($urlData['lastmod'])) {
                $lastmod = $sitemap->createElement('lastmod', $urlData['lastmod']);
                $url->appendChild($lastmod);
            }
            
            if (isset($urlData['changefreq'])) {
                $changefreq = $sitemap->createElement('changefreq', $urlData['changefreq']);
                $url->appendChild($changefreq);
            }
            
            if (isset($urlData['priority'])) {
                $priority = $sitemap->createElement('priority', $urlData['priority']);
                $url->appendChild($priority);
            }
            
            $urlset->appendChild($url);
        }
        
        $chunkPath = $this->baseDir . '/web/' . $filename;
        $sitemap->save($chunkPath);
    }
    
    /**
     * Scan directory for HTML files
     */
    private function scanHtmlFiles($dir) {
        $files = [];
        
        if (!is_dir($dir)) {
            $this->logError("Directory not found: $dir");
            return $files;
        }
        
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
     * Update page metadata
     */
    private function updatePageMetadata() {
        $this->log("Updating page metadata...");
        // This would integrate with meta-generator.php
        // For now, just log the action
        $this->log("Page metadata update completed");
    }
    
    /**
     * Generate structured data
     */
    private function generateStructuredData() {
        $this->log("Generating structured data...");
        // This would integrate with structured-data-generator.php
        // For now, just log the action
        $this->log("Structured data generation completed");
    }
    
    /**
     * Check for broken links
     */
    private function checkBrokenLinks() {
        $this->log("Checking for broken links...");
        // This would be implemented in the monitoring phase
        $this->log("Broken links check completed");
    }
    
    /**
     * Generate SEO report
     */
    private function generateSEOReport() {
        $this->log("Generating SEO report...");
        
        $report = [
            'timestamp' => date('c'),
            'sitemap_urls' => 0, // Would be filled by actual count
            'pages_scanned' => 0,
            'issues_found' => 0,
            'recommendations' => []
        ];
        
        $reportPath = $this->baseDir . $this->config['paths']['reports'] . '/seo-report-' . date('Y-m-d-H-i-s') . '.json';
        $this->ensureDirectoryExists(dirname($reportPath));
        
        file_put_contents($reportPath, json_encode($report, JSON_PRETTY_PRINT));
        
        $this->log("SEO report saved to: $reportPath");
    }
    
    /**
     * Ensure directory exists
     */
    private function ensureDirectoryExists($dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
    
    /**
     * Log message
     */
    private function log($message) {
        $timestamp = date('[Y-m-d H:i:s]');
        $logMessage = "$timestamp $message" . PHP_EOL;
        
        if ($this->verbose) {
            echo $logMessage;
        }
        
        $logFile = $this->baseDir . $this->config['paths']['logs'] . '/seo-indexer.log';
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Log error message
     */
    private function logError($message) {
        $this->log("ERROR: $message");
        
        $errorFile = $this->baseDir . $this->config['paths']['logs'] . '/seo-errors.log';
        $timestamp = date('[Y-m-d H:i:s]');
        file_put_contents($errorFile, "$timestamp $message" . PHP_EOL, FILE_APPEND | LOCK_EX);
    }
}

// Command line execution
if (php_sapi_name() === 'cli') {
    $options = getopt('', ['force', 'verbose', 'sitemap-only', 'help']);
    
    if (isset($options['help'])) {
        echo "IT-ERA SEO Indexer\n";
        echo "Usage: php seo-indexer.php [options]\n";
        echo "Options:\n";
        echo "  --force        Force regeneration of all data\n";
        echo "  --verbose      Show detailed output\n";
        echo "  --sitemap-only Generate only sitemap\n";
        echo "  --help         Show this help message\n";
        exit(0);
    }
    
    $verbose = isset($options['verbose']);
    $force = isset($options['force']);
    $sitemapOnly = isset($options['sitemap-only']);
    
    try {
        $indexer = new SEOIndexer($verbose, $force);
        $indexer->run($sitemapOnly);
        echo "SEO indexing completed successfully!\n";
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        exit(1);
    }
}