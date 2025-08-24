<?php
/**
 * IT-ERA SEO Monitoring Dashboard
 * Monitor SEO health, page performance, and generate reports
 * 
 * Usage: php seo-monitor.php [--check-all] [--performance] [--links] [--report]
 */

class SEOMonitor {
    private $config;
    private $baseDir;
    private $verbose;
    private $userAgent;
    
    public function __construct($verbose = false) {
        $this->baseDir = dirname(__DIR__);
        $this->config = require __DIR__ . '/seo-config.php';
        $this->verbose = $verbose;
        $this->userAgent = $this->config['monitoring']['user_agent'];
    }
    
    /**
     * Run comprehensive SEO monitoring
     */
    public function runFullCheck() {
        $this->log("Starting comprehensive SEO monitoring...");
        
        $report = [
            'timestamp' => date('c'),
            'site_url' => $this->config['site']['url'],
            'performance' => $this->checkPerformance(),
            'meta_tags' => $this->validateMetaTags(),
            'broken_links' => $this->checkBrokenLinks(),
            'sitemap_status' => $this->validateSitemap(),
            'schema_markup' => $this->validateSchemaMarkup(),
            'mobile_friendly' => $this->checkMobileFriendly(),
            'ssl_status' => $this->checkSSL(),
            'recommendations' => []
        ];
        
        // Generate recommendations based on findings
        $report['recommendations'] = $this->generateRecommendations($report);
        
        // Calculate overall health score
        $report['health_score'] = $this->calculateHealthScore($report);
        
        $this->saveReport($report);
        
        return $report;
    }
    
    /**
     * Check page load performance
     */
    public function checkPerformance($sampleSize = 10) {
        $this->log("Checking page load performance...");
        
        $results = [
            'tested_pages' => 0,
            'average_load_time' => 0,
            'slow_pages' => [],
            'fast_pages' => [],
            'errors' => []
        ];
        
        // Get sample of pages to test
        $pages = $this->getSamplePages($sampleSize);
        
        $totalTime = 0;
        $successfulTests = 0;
        
        foreach ($pages as $page) {
            try {
                $startTime = microtime(true);
                
                $context = stream_context_create([
                    'http' => [
                        'method' => 'GET',
                        'header' => "User-Agent: {$this->userAgent}\r\n",
                        'timeout' => $this->config['monitoring']['timeout']
                    ]
                ]);
                
                $content = file_get_contents($page['url'], false, $context);
                
                if ($content !== false) {
                    $loadTime = microtime(true) - $startTime;
                    $totalTime += $loadTime;
                    $successfulTests++;
                    
                    $pageResult = [
                        'url' => $page['url'],
                        'load_time' => round($loadTime, 3),
                        'size' => strlen($content)
                    ];
                    
                    if ($loadTime > 3.0) {
                        $results['slow_pages'][] = $pageResult;
                    } elseif ($loadTime < 1.0) {
                        $results['fast_pages'][] = $pageResult;
                    }
                    
                    if ($this->verbose) {
                        echo "✓ {$page['url']} - {$loadTime}s\n";
                    }
                    
                } else {
                    $results['errors'][] = [
                        'url' => $page['url'],
                        'error' => 'Failed to load page'
                    ];
                    
                    if ($this->verbose) {
                        echo "✗ {$page['url']} - Failed to load\n";
                    }
                }
                
            } catch (Exception $e) {
                $results['errors'][] = [
                    'url' => $page['url'],
                    'error' => $e->getMessage()
                ];
            }
        }
        
        $results['tested_pages'] = count($pages);
        $results['average_load_time'] = $successfulTests > 0 ? round($totalTime / $successfulTests, 3) : 0;
        
        $this->log("Performance check completed. Average load time: {$results['average_load_time']}s");
        
        return $results;
    }
    
    /**
     * Validate meta tags presence and quality
     */
    public function validateMetaTags($sampleSize = 20) {
        $this->log("Validating meta tags...");
        
        $results = [
            'tested_pages' => 0,
            'missing_title' => [],
            'missing_description' => [],
            'long_title' => [],
            'short_description' => [],
            'duplicate_titles' => [],
            'duplicate_descriptions' => []
        ];
        
        $pages = $this->getSamplePages($sampleSize);
        $seenTitles = [];
        $seenDescriptions = [];
        
        foreach ($pages as $page) {
            try {
                $content = $this->fetchPageContent($page['url']);
                if (!$content) continue;
                
                $dom = new DOMDocument();
                libxml_use_internal_errors(true);
                $dom->loadHTML($content);
                libxml_clear_errors();
                
                // Check title
                $titles = $dom->getElementsByTagName('title');
                if ($titles->length === 0) {
                    $results['missing_title'][] = $page['url'];
                } else {
                    $title = trim($titles->item(0)->textContent);
                    if (strlen($title) > 60) {
                        $results['long_title'][] = [
                            'url' => $page['url'],
                            'title' => $title,
                            'length' => strlen($title)
                        ];
                    }
                    
                    if (isset($seenTitles[$title])) {
                        $results['duplicate_titles'][] = [
                            'title' => $title,
                            'urls' => [$seenTitles[$title], $page['url']]
                        ];
                    } else {
                        $seenTitles[$title] = $page['url'];
                    }
                }
                
                // Check meta description
                $description = $this->extractMetaDescription($dom);
                if (empty($description)) {
                    $results['missing_description'][] = $page['url'];
                } else {
                    if (strlen($description) < 120) {
                        $results['short_description'][] = [
                            'url' => $page['url'],
                            'description' => $description,
                            'length' => strlen($description)
                        ];
                    }
                    
                    if (isset($seenDescriptions[$description])) {
                        $results['duplicate_descriptions'][] = [
                            'description' => $description,
                            'urls' => [$seenDescriptions[$description], $page['url']]
                        ];
                    } else {
                        $seenDescriptions[$description] = $page['url'];
                    }
                }
                
                $results['tested_pages']++;
                
                if ($this->verbose) {
                    echo "✓ Meta tags checked for {$page['url']}\n";
                }
                
            } catch (Exception $e) {
                if ($this->verbose) {
                    echo "✗ Error checking {$page['url']}: " . $e->getMessage() . "\n";
                }
            }
        }
        
        $this->log("Meta tags validation completed. Tested {$results['tested_pages']} pages");
        
        return $results;
    }
    
    /**
     * Check for broken links
     */
    public function checkBrokenLinks($sampleSize = 15) {
        $this->log("Checking for broken links...");
        
        $results = [
            'tested_pages' => 0,
            'broken_internal_links' => [],
            'broken_external_links' => [],
            'slow_external_links' => [],
            'total_links_checked' => 0
        ];
        
        $pages = $this->getSamplePages($sampleSize);
        
        foreach ($pages as $page) {
            try {
                $content = $this->fetchPageContent($page['url']);
                if (!$content) continue;
                
                $dom = new DOMDocument();
                libxml_use_internal_errors(true);
                $dom->loadHTML($content);
                libxml_clear_errors();
                
                $links = $dom->getElementsByTagName('a');
                
                foreach ($links as $link) {
                    $href = $link->getAttribute('href');
                    if (empty($href) || str_starts_with($href, '#') || str_starts_with($href, 'mailto:') || str_starts_with($href, 'tel:')) {
                        continue;
                    }
                    
                    // Convert relative URLs to absolute
                    if (!filter_var($href, FILTER_VALIDATE_URL)) {
                        $href = $this->resolveUrl($page['url'], $href);
                    }
                    
                    $results['total_links_checked']++;
                    
                    $linkStatus = $this->checkLinkStatus($href);
                    
                    if ($linkStatus['status'] === 'broken') {
                        if ($this->isInternalLink($href)) {
                            $results['broken_internal_links'][] = [
                                'source_page' => $page['url'],
                                'broken_link' => $href,
                                'error' => $linkStatus['error']
                            ];
                        } else {
                            $results['broken_external_links'][] = [
                                'source_page' => $page['url'],
                                'broken_link' => $href,
                                'error' => $linkStatus['error']
                            ];
                        }
                    } elseif ($linkStatus['response_time'] > 5.0 && !$this->isInternalLink($href)) {
                        $results['slow_external_links'][] = [
                            'source_page' => $page['url'],
                            'slow_link' => $href,
                            'response_time' => $linkStatus['response_time']
                        ];
                    }
                    
                    // Rate limiting for external links
                    if (!$this->isInternalLink($href)) {
                        usleep(500000); // 0.5 second delay
                    }
                }
                
                $results['tested_pages']++;
                
                if ($this->verbose) {
                    echo "✓ Links checked for {$page['url']}\n";
                }
                
            } catch (Exception $e) {
                if ($this->verbose) {
                    echo "✗ Error checking links on {$page['url']}: " . $e->getMessage() . "\n";
                }
            }
        }
        
        $this->log("Broken links check completed. Checked {$results['total_links_checked']} links");
        
        return $results;
    }
    
    /**
     * Validate sitemap
     */
    public function validateSitemap() {
        $this->log("Validating sitemap...");
        
        $sitemapUrl = $this->config['site']['url'] . '/sitemap.xml';
        
        $result = [
            'url' => $sitemapUrl,
            'accessible' => false,
            'valid_xml' => false,
            'url_count' => 0,
            'errors' => [],
            'last_modified' => null
        ];
        
        try {
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => "User-Agent: {$this->userAgent}\r\n",
                    'timeout' => $this->config['monitoring']['timeout']
                ]
            ]);
            
            $content = file_get_contents($sitemapUrl, false, $context);
            
            if ($content === false) {
                $result['errors'][] = 'Sitemap not accessible';
                return $result;
            }
            
            $result['accessible'] = true;
            
            // Parse XML
            $sitemap = simplexml_load_string($content);
            if ($sitemap === false) {
                $result['errors'][] = 'Invalid XML format';
                return $result;
            }
            
            $result['valid_xml'] = true;
            $result['url_count'] = count($sitemap->url);
            
            // Check for last modified date in HTTP headers
            if (isset($http_response_header)) {
                foreach ($http_response_header as $header) {
                    if (stripos($header, 'last-modified') !== false) {
                        $result['last_modified'] = trim(substr($header, strpos($header, ':') + 1));
                        break;
                    }
                }
            }
            
        } catch (Exception $e) {
            $result['errors'][] = $e->getMessage();
        }
        
        return $result;
    }
    
    /**
     * Validate Schema markup
     */
    public function validateSchemaMarkup($sampleSize = 5) {
        $this->log("Validating Schema markup...");
        
        $results = [
            'tested_pages' => 0,
            'pages_with_schema' => [],
            'pages_without_schema' => [],
            'schema_types_found' => []
        ];
        
        $pages = $this->getSamplePages($sampleSize);
        
        foreach ($pages as $page) {
            try {
                $content = $this->fetchPageContent($page['url']);
                if (!$content) continue;
                
                // Look for JSON-LD schema
                $jsonLdMatches = [];
                preg_match_all('/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/is', $content, $jsonLdMatches);
                
                if (!empty($jsonLdMatches[1])) {
                    $schemaTypes = [];
                    foreach ($jsonLdMatches[1] as $jsonLd) {
                        $schema = json_decode(trim($jsonLd), true);
                        if ($schema && isset($schema['@type'])) {
                            $schemaTypes[] = $schema['@type'];
                            $results['schema_types_found'][] = $schema['@type'];
                        }
                    }
                    
                    $results['pages_with_schema'][] = [
                        'url' => $page['url'],
                        'schema_types' => $schemaTypes
                    ];
                } else {
                    $results['pages_without_schema'][] = $page['url'];
                }
                
                $results['tested_pages']++;
                
            } catch (Exception $e) {
                if ($this->verbose) {
                    echo "✗ Error checking schema for {$page['url']}: " . $e->getMessage() . "\n";
                }
            }
        }
        
        $results['schema_types_found'] = array_unique($results['schema_types_found']);
        
        return $results;
    }
    
    /**
     * Check mobile-friendly status
     */
    public function checkMobileFriendly($sampleSize = 5) {
        $results = [
            'tested_pages' => 0,
            'mobile_friendly' => [],
            'mobile_issues' => []
        ];
        
        $pages = $this->getSamplePages($sampleSize);
        
        foreach ($pages as $page) {
            try {
                $content = $this->fetchPageContent($page['url']);
                if (!$content) continue;
                
                $dom = new DOMDocument();
                libxml_use_internal_errors(true);
                $dom->loadHTML($content);
                libxml_clear_errors();
                
                $issues = [];
                
                // Check for viewport meta tag
                $viewportFound = false;
                $metas = $dom->getElementsByTagName('meta');
                foreach ($metas as $meta) {
                    if ($meta->getAttribute('name') === 'viewport') {
                        $viewportFound = true;
                        break;
                    }
                }
                
                if (!$viewportFound) {
                    $issues[] = 'Missing viewport meta tag';
                }
                
                // Check for responsive CSS
                $responsiveFound = false;
                $links = $dom->getElementsByTagName('link');
                foreach ($links as $link) {
                    if ($link->getAttribute('rel') === 'stylesheet') {
                        $href = $link->getAttribute('href');
                        if (strpos($href, 'bootstrap') !== false || strpos($href, 'responsive') !== false) {
                            $responsiveFound = true;
                            break;
                        }
                    }
                }
                
                // Basic check for CSS media queries in content
                if (!$responsiveFound && (strpos($content, '@media') !== false || strpos($content, 'max-width') !== false)) {
                    $responsiveFound = true;
                }
                
                if (!$responsiveFound) {
                    $issues[] = 'No responsive CSS framework detected';
                }
                
                if (empty($issues)) {
                    $results['mobile_friendly'][] = $page['url'];
                } else {
                    $results['mobile_issues'][] = [
                        'url' => $page['url'],
                        'issues' => $issues
                    ];
                }
                
                $results['tested_pages']++;
                
            } catch (Exception $e) {
                // Skip errors for this check
            }
        }
        
        return $results;
    }
    
    /**
     * Check SSL status
     */
    public function checkSSL() {
        $url = $this->config['site']['url'];
        
        $result = [
            'site_url' => $url,
            'ssl_enabled' => false,
            'certificate_valid' => false,
            'certificate_info' => null,
            'errors' => []
        ];
        
        if (!str_starts_with($url, 'https://')) {
            $result['errors'][] = 'Site is not using HTTPS';
            return $result;
        }
        
        $result['ssl_enabled'] = true;
        
        // Parse URL to get hostname
        $parsedUrl = parse_url($url);
        $hostname = $parsedUrl['host'];
        
        try {
            $context = stream_context_create([
                'ssl' => [
                    'capture_peer_cert' => true,
                    'verify_peer' => false,
                    'verify_peer_name' => false
                ]
            ]);
            
            $stream = stream_socket_client("ssl://{$hostname}:443", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $context);
            
            if ($stream) {
                $cert = stream_context_get_params($stream);
                if (isset($cert['options']['ssl']['peer_certificate'])) {
                    $certInfo = openssl_x509_parse($cert['options']['ssl']['peer_certificate']);
                    
                    $result['certificate_valid'] = true;
                    $result['certificate_info'] = [
                        'subject' => $certInfo['subject']['CN'] ?? 'Unknown',
                        'issuer' => $certInfo['issuer']['CN'] ?? 'Unknown',
                        'valid_from' => date('Y-m-d', $certInfo['validFrom_time_t']),
                        'valid_to' => date('Y-m-d', $certInfo['validTo_time_t']),
                        'days_until_expiry' => ceil(($certInfo['validTo_time_t'] - time()) / 86400)
                    ];
                    
                    // Check if certificate is expiring soon
                    if ($result['certificate_info']['days_until_expiry'] < 30) {
                        $result['errors'][] = "SSL certificate expires in {$result['certificate_info']['days_until_expiry']} days";
                    }
                }
                
                fclose($stream);
            } else {
                $result['errors'][] = "Could not connect to SSL: $errstr";
            }
            
        } catch (Exception $e) {
            $result['errors'][] = "SSL check failed: " . $e->getMessage();
        }
        
        return $result;
    }
    
    /**
     * Generate recommendations based on monitoring results
     */
    private function generateRecommendations($report) {
        $recommendations = [];
        
        // Performance recommendations
        if ($report['performance']['average_load_time'] > 2.0) {
            $recommendations[] = [
                'category' => 'Performance',
                'priority' => 'High',
                'issue' => 'Slow page load times',
                'recommendation' => 'Optimize images, minify CSS/JS, enable compression, use CDN'
            ];
        }
        
        // Meta tags recommendations
        if (!empty($report['meta_tags']['missing_title'])) {
            $recommendations[] = [
                'category' => 'SEO',
                'priority' => 'Critical',
                'issue' => count($report['meta_tags']['missing_title']) . ' pages missing title tags',
                'recommendation' => 'Add unique, descriptive title tags to all pages'
            ];
        }
        
        if (!empty($report['meta_tags']['missing_description'])) {
            $recommendations[] = [
                'category' => 'SEO',
                'priority' => 'High',
                'issue' => count($report['meta_tags']['missing_description']) . ' pages missing meta descriptions',
                'recommendation' => 'Add compelling meta descriptions (120-160 characters)'
            ];
        }
        
        // Broken links recommendations
        if (!empty($report['broken_links']['broken_internal_links'])) {
            $recommendations[] = [
                'category' => 'Technical',
                'priority' => 'High',
                'issue' => count($report['broken_links']['broken_internal_links']) . ' broken internal links found',
                'recommendation' => 'Fix or remove broken internal links to improve user experience'
            ];
        }
        
        // Schema markup recommendations
        if (!empty($report['schema_markup']['pages_without_schema'])) {
            $recommendations[] = [
                'category' => 'SEO',
                'priority' => 'Medium',
                'issue' => count($report['schema_markup']['pages_without_schema']) . ' pages without Schema markup',
                'recommendation' => 'Add structured data markup to improve search visibility'
            ];
        }
        
        // Mobile-friendly recommendations
        if (!empty($report['mobile_friendly']['mobile_issues'])) {
            $recommendations[] = [
                'category' => 'Mobile',
                'priority' => 'High',
                'issue' => count($report['mobile_friendly']['mobile_issues']) . ' pages with mobile issues',
                'recommendation' => 'Fix mobile responsiveness issues for better mobile rankings'
            ];
        }
        
        // SSL recommendations
        if (!$report['ssl_status']['ssl_enabled']) {
            $recommendations[] = [
                'category' => 'Security',
                'priority' => 'Critical',
                'issue' => 'Site not using HTTPS',
                'recommendation' => 'Implement SSL certificate for security and SEO benefits'
            ];
        }
        
        return $recommendations;
    }
    
    /**
     * Calculate overall health score
     */
    private function calculateHealthScore($report) {
        $score = 100;
        
        // Performance penalties
        if ($report['performance']['average_load_time'] > 3.0) {
            $score -= 20;
        } elseif ($report['performance']['average_load_time'] > 2.0) {
            $score -= 10;
        }
        
        // Meta tags penalties
        $score -= min(30, count($report['meta_tags']['missing_title']) * 5);
        $score -= min(20, count($report['meta_tags']['missing_description']) * 3);
        
        // Broken links penalties
        $score -= min(25, count($report['broken_links']['broken_internal_links']) * 5);
        
        // SSL penalty
        if (!$report['ssl_status']['ssl_enabled']) {
            $score -= 15;
        }
        
        return max(0, $score);
    }
    
    /**
     * Helper methods
     */
    
    private function getSamplePages($limit) {
        $sitemapPath = $this->baseDir . $this->config['paths']['sitemap'];
        $pages = [];
        
        if (file_exists($sitemapPath)) {
            $sitemap = simplexml_load_file($sitemapPath);
            if ($sitemap) {
                $urls = [];
                foreach ($sitemap->url as $url) {
                    $urls[] = ['url' => (string)$url->loc];
                }
                
                // Get random sample
                shuffle($urls);
                $pages = array_slice($urls, 0, $limit);
            }
        }
        
        // Fallback if no sitemap
        if (empty($pages)) {
            $pages = [
                ['url' => $this->config['site']['url'] . '/'],
                ['url' => $this->config['site']['url'] . '/pages/assistenza-it-milano.html'],
                ['url' => $this->config['site']['url'] . '/pages/sicurezza-informatica-monza.html']
            ];
        }
        
        return $pages;
    }
    
    private function fetchPageContent($url) {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "User-Agent: {$this->userAgent}\r\n",
                'timeout' => $this->config['monitoring']['timeout']
            ]
        ]);
        
        return file_get_contents($url, false, $context);
    }
    
    private function extractMetaDescription($dom) {
        $metas = $dom->getElementsByTagName('meta');
        foreach ($metas as $meta) {
            if ($meta->getAttribute('name') === 'description') {
                return trim($meta->getAttribute('content'));
            }
        }
        return '';
    }
    
    private function checkLinkStatus($url) {
        try {
            $startTime = microtime(true);
            
            $context = stream_context_create([
                'http' => [
                    'method' => 'HEAD',
                    'header' => "User-Agent: {$this->userAgent}\r\n",
                    'timeout' => 10
                ]
            ]);
            
            $result = file_get_contents($url, false, $context);
            $responseTime = microtime(true) - $startTime;
            
            if ($result !== false) {
                return ['status' => 'ok', 'response_time' => $responseTime];
            } else {
                return ['status' => 'broken', 'error' => 'HTTP request failed', 'response_time' => $responseTime];
            }
            
        } catch (Exception $e) {
            return ['status' => 'broken', 'error' => $e->getMessage(), 'response_time' => 0];
        }
    }
    
    private function isInternalLink($url) {
        $siteHost = parse_url($this->config['site']['url'], PHP_URL_HOST);
        $urlHost = parse_url($url, PHP_URL_HOST);
        return $siteHost === $urlHost;
    }
    
    private function resolveUrl($base, $relative) {
        if (filter_var($relative, FILTER_VALIDATE_URL)) {
            return $relative;
        }
        
        $baseParts = parse_url($base);
        
        if ($relative[0] === '/') {
            return $baseParts['scheme'] . '://' . $baseParts['host'] . $relative;
        }
        
        $basePath = dirname($baseParts['path'] ?? '/');
        return $baseParts['scheme'] . '://' . $baseParts['host'] . rtrim($basePath, '/') . '/' . $relative;
    }
    
    private function saveReport($report) {
        $reportPath = $this->baseDir . $this->config['paths']['reports'] . '/seo-health-' . date('Y-m-d-H-i-s') . '.json';
        $this->ensureDirectoryExists(dirname($reportPath));
        
        file_put_contents($reportPath, json_encode($report, JSON_PRETTY_PRINT));
        
        $this->log("SEO health report saved to: $reportPath");
        
        // Also save latest report
        $latestPath = $this->baseDir . $this->config['paths']['reports'] . '/seo-health-latest.json';
        file_put_contents($latestPath, json_encode($report, JSON_PRETTY_PRINT));
    }
    
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
        
        $logFile = $this->baseDir . $this->config['paths']['logs'] . '/seo-monitor.log';
        $this->ensureDirectoryExists(dirname($logFile));
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
}

// Command line execution
if (php_sapi_name() === 'cli') {
    $options = getopt('', ['check-all', 'performance', 'links', 'meta', 'report', 'verbose', 'help']);
    
    if (isset($options['help'])) {
        echo "IT-ERA SEO Monitoring Dashboard\n";
        echo "Usage: php seo-monitor.php [options]\n";
        echo "Options:\n";
        echo "  --check-all    Run complete SEO health check\n";
        echo "  --performance  Check page load performance only\n";
        echo "  --links        Check for broken links only\n";
        echo "  --meta         Validate meta tags only\n";
        echo "  --report       Generate health report\n";
        echo "  --verbose      Show detailed output\n";
        echo "  --help         Show this help message\n";
        exit(0);
    }
    
    $verbose = isset($options['verbose']);
    
    try {
        $monitor = new SEOMonitor($verbose);
        
        if (isset($options['check-all'])) {
            $report = $monitor->runFullCheck();
            echo "SEO Health Check Completed\n";
            echo "Health Score: {$report['health_score']}/100\n";
            echo "Recommendations: " . count($report['recommendations']) . "\n";
            
        } elseif (isset($options['performance'])) {
            $results = $monitor->checkPerformance();
            echo "Performance Check Results:\n";
            echo "Average Load Time: {$results['average_load_time']}s\n";
            echo "Slow Pages: " . count($results['slow_pages']) . "\n";
            
        } elseif (isset($options['links'])) {
            $results = $monitor->checkBrokenLinks();
            echo "Broken Links Check Results:\n";
            echo "Broken Internal Links: " . count($results['broken_internal_links']) . "\n";
            echo "Broken External Links: " . count($results['broken_external_links']) . "\n";
            
        } elseif (isset($options['meta'])) {
            $results = $monitor->validateMetaTags();
            echo "Meta Tags Validation Results:\n";
            echo "Missing Titles: " . count($results['missing_title']) . "\n";
            echo "Missing Descriptions: " . count($results['missing_description']) . "\n";
            
        } elseif (isset($options['report'])) {
            $report = $monitor->runFullCheck();
            echo "Full SEO health report generated\n";
            echo json_encode($report, JSON_PRETTY_PRINT) . "\n";
            
        } else {
            echo "No action specified. Use --help for usage information.\n";
            exit(1);
        }
        
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        exit(1);
    }
}