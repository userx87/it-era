<?php
/**
 * IT-ERA Google Indexing API Integration
 * Submit pages to Google for indexing using Google Indexing API
 * 
 * Usage: php google-indexing.php [--url=URL] [--batch] [--status]
 */

require_once 'vendor/autoload.php'; // Composer autoload for Google API client

class GoogleIndexing {
    private $config;
    private $baseDir;
    private $client;
    private $service;
    private $verbose;
    
    public function __construct($verbose = false) {
        $this->baseDir = dirname(__DIR__);
        $this->config = require __DIR__ . '/seo-config.php';
        $this->verbose = $verbose;
        
        $this->initializeGoogleClient();
    }
    
    /**
     * Initialize Google API client
     */
    private function initializeGoogleClient() {
        if (empty($this->config['google']['service_account_file'])) {
            throw new Exception('Google service account file not configured');
        }
        
        $serviceAccountPath = $this->baseDir . $this->config['google']['service_account_file'];
        
        if (!file_exists($serviceAccountPath)) {
            throw new Exception("Google service account file not found: $serviceAccountPath");
        }
        
        try {
            $this->client = new Google_Client();
            $this->client->setAuthConfig($serviceAccountPath);
            $this->client->addScope('https://www.googleapis.com/auth/indexing');
            
            $this->service = new Google_Service_Indexing($this->client);
            
        } catch (Exception $e) {
            throw new Exception("Failed to initialize Google client: " . $e->getMessage());
        }
    }
    
    /**
     * Submit single URL to Google for indexing
     */
    public function submitUrl($url, $type = 'URL_UPDATED') {
        $this->log("Submitting URL to Google: $url");
        
        try {
            $urlNotification = new Google_Service_Indexing_UrlNotification();
            $urlNotification->setUrl($url);
            $urlNotification->setType($type); // URL_UPDATED or URL_DELETED
            
            $response = $this->service->urlNotifications->publish($urlNotification);
            
            $this->logSubmission($url, $type, 'SUCCESS', $response);
            
            if ($this->verbose) {
                echo "Successfully submitted: $url\n";
                if (isset($response['notifyTime'])) {
                    echo "Notify time: " . $response['notifyTime'] . "\n";
                }
            }
            
            return $response;
            
        } catch (Google_Service_Exception $e) {
            $error = json_decode($e->getMessage(), true);
            $errorMsg = isset($error['error']['message']) ? $error['error']['message'] : $e->getMessage();
            
            $this->logSubmission($url, $type, 'ERROR', ['error' => $errorMsg]);
            
            if ($this->verbose) {
                echo "Error submitting $url: $errorMsg\n";
            }
            
            throw new Exception("Google API error: $errorMsg");
            
        } catch (Exception $e) {
            $this->logSubmission($url, $type, 'ERROR', ['error' => $e->getMessage()]);
            throw $e;
        }
    }
    
    /**
     * Get indexing status for a URL
     */
    public function getStatus($url) {
        $this->log("Getting status for URL: $url");
        
        try {
            $response = $this->service->urlNotifications->getMetadata([
                'url' => $url
            ]);
            
            if ($this->verbose) {
                echo "Status for $url:\n";
                echo "Latest update: " . ($response['latestUpdate']['notifyTime'] ?? 'Never') . "\n";
                echo "Latest type: " . ($response['latestUpdate']['type'] ?? 'Unknown') . "\n";
                echo "Latest remove: " . ($response['latestRemove']['notifyTime'] ?? 'Never') . "\n";
            }
            
            return $response;
            
        } catch (Google_Service_Exception $e) {
            $error = json_decode($e->getMessage(), true);
            $errorMsg = isset($error['error']['message']) ? $error['error']['message'] : $e->getMessage();
            
            if ($this->verbose) {
                echo "Error getting status for $url: $errorMsg\n";
            }
            
            throw new Exception("Google API error: $errorMsg");
            
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Submit multiple URLs in batch with rate limiting
     */
    public function submitBatch($urls, $delaySeconds = 1) {
        $this->log("Starting batch submission of " . count($urls) . " URLs");
        
        $results = [
            'success' => [],
            'errors' => [],
            'total' => count($urls)
        ];
        
        foreach ($urls as $i => $url) {
            try {
                $this->submitUrl($url);
                $results['success'][] = $url;
                
                if ($this->verbose) {
                    echo "Progress: " . ($i + 1) . "/" . count($urls) . " URLs processed\n";
                }
                
                // Rate limiting - avoid hitting API limits
                if ($i < count($urls) - 1) {
                    sleep($delaySeconds);
                }
                
            } catch (Exception $e) {
                $results['errors'][$url] = $e->getMessage();
                
                if ($this->verbose) {
                    echo "Failed to submit $url: " . $e->getMessage() . "\n";
                }
            }
        }
        
        $this->log("Batch submission completed. Success: " . count($results['success']) . ", Errors: " . count($results['errors']));
        
        return $results;
    }
    
    /**
     * Submit all pages from sitemap
     */
    public function submitFromSitemap() {
        $sitemapPath = $this->baseDir . $this->config['paths']['sitemap'];
        
        if (!file_exists($sitemapPath)) {
            throw new Exception("Sitemap not found: $sitemapPath");
        }
        
        $this->log("Loading URLs from sitemap: $sitemapPath");
        
        $sitemap = simplexml_load_file($sitemapPath);
        if (!$sitemap) {
            throw new Exception("Failed to parse sitemap XML");
        }
        
        $urls = [];
        foreach ($sitemap->url as $url) {
            $urls[] = (string)$url->loc;
        }
        
        if (empty($urls)) {
            throw new Exception("No URLs found in sitemap");
        }
        
        return $this->submitBatch($urls);
    }
    
    /**
     * Submit recent updates (pages modified in last N days)
     */
    public function submitRecentUpdates($days = 7) {
        $this->log("Finding pages updated in the last $days days");
        
        $webDir = $this->baseDir . $this->config['paths']['web'];
        $cutoffTime = time() - ($days * 24 * 60 * 60);
        $recentUrls = [];
        
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($webDir, RecursiveDirectoryIterator::SKIP_DOTS)
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile() && 
                $file->getExtension() === 'html' && 
                $file->getMTime() >= $cutoffTime) {
                
                $relativePath = str_replace($webDir, '', $file->getPathname());
                
                // Skip draft pages
                if (strpos($relativePath, '/pages-draft/') !== false) {
                    continue;
                }
                
                $url = $this->config['site']['url'] . $relativePath;
                $recentUrls[] = $url;
            }
        }
        
        if (empty($recentUrls)) {
            $this->log("No recent updates found");
            return ['success' => [], 'errors' => [], 'total' => 0];
        }
        
        $this->log("Found " . count($recentUrls) . " recently updated pages");
        
        return $this->submitBatch($recentUrls);
    }
    
    /**
     * Generate indexing quota report
     */
    public function generateQuotaReport() {
        $this->log("Generating quota usage report");
        
        $logFile = $this->baseDir . $this->config['paths']['logs'] . '/google-indexing.log';
        
        if (!file_exists($logFile)) {
            return [
                'daily_submissions' => 0,
                'monthly_submissions' => 0,
                'quota_remaining' => 200, // Default daily quota
                'recommendations' => []
            ];
        }
        
        $logs = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $today = date('Y-m-d');
        $thisMonth = date('Y-m');
        
        $dailyCount = 0;
        $monthlyCount = 0;
        
        foreach ($logs as $line) {
            if (strpos($line, 'SUBMISSION') !== false && strpos($line, 'SUCCESS') !== false) {
                if (strpos($line, $today) !== false) {
                    $dailyCount++;
                }
                if (strpos($line, $thisMonth) !== false) {
                    $monthlyCount++;
                }
            }
        }
        
        $report = [
            'daily_submissions' => $dailyCount,
            'monthly_submissions' => $monthlyCount,
            'quota_remaining' => max(0, 200 - $dailyCount), // Google's daily limit
            'recommendations' => []
        ];
        
        if ($dailyCount >= 180) {
            $report['recommendations'][] = 'Approaching daily quota limit. Consider spreading submissions across time.';
        }
        
        if ($monthlyCount >= 5000) {
            $report['recommendations'][] = 'High monthly usage detected. Monitor quota carefully.';
        }
        
        return $report;
    }
    
    /**
     * Log submission attempt
     */
    private function logSubmission($url, $type, $status, $response) {
        $logEntry = [
            'timestamp' => date('c'),
            'url' => $url,
            'type' => $type,
            'status' => $status,
            'response' => $response
        ];
        
        $logFile = $this->baseDir . $this->config['paths']['logs'] . '/google-indexing.log';
        $this->ensureDirectoryExists(dirname($logFile));
        
        $logLine = sprintf(
            "[%s] SUBMISSION %s %s %s: %s\n",
            $logEntry['timestamp'],
            $status,
            $type,
            $url,
            json_encode($response)
        );
        
        file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
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
        
        $logFile = $this->baseDir . $this->config['paths']['logs'] . '/google-indexing.log';
        $this->ensureDirectoryExists(dirname($logFile));
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
}

// Command line execution
if (php_sapi_name() === 'cli') {
    $options = getopt('', ['url:', 'batch', 'sitemap', 'recent:', 'status:', 'quota', 'verbose', 'help']);
    
    if (isset($options['help'])) {
        echo "IT-ERA Google Indexing API Integration\n";
        echo "Usage: php google-indexing.php [options]\n";
        echo "Options:\n";
        echo "  --url=URL      Submit single URL\n";
        echo "  --batch        Submit URLs from file (one per line)\n";
        echo "  --sitemap      Submit all URLs from sitemap\n";
        echo "  --recent=DAYS  Submit pages updated in last N days (default: 7)\n";
        echo "  --status=URL   Get indexing status for URL\n";
        echo "  --quota        Show quota usage report\n";
        echo "  --verbose      Show detailed output\n";
        echo "  --help         Show this help message\n";
        exit(0);
    }
    
    $verbose = isset($options['verbose']);
    
    try {
        $indexing = new GoogleIndexing($verbose);
        
        if (isset($options['url'])) {
            $result = $indexing->submitUrl($options['url']);
            echo "URL submitted successfully\n";
            
        } elseif (isset($options['status'])) {
            $status = $indexing->getStatus($options['status']);
            echo json_encode($status, JSON_PRETTY_PRINT) . "\n";
            
        } elseif (isset($options['sitemap'])) {
            $results = $indexing->submitFromSitemap();
            echo "Batch submission completed:\n";
            echo "Success: " . count($results['success']) . "\n";
            echo "Errors: " . count($results['errors']) . "\n";
            
        } elseif (isset($options['recent'])) {
            $days = is_numeric($options['recent']) ? (int)$options['recent'] : 7;
            $results = $indexing->submitRecentUpdates($days);
            echo "Recent updates submission completed:\n";
            echo "Success: " . count($results['success']) . "\n";
            echo "Errors: " . count($results['errors']) . "\n";
            
        } elseif (isset($options['quota'])) {
            $report = $indexing->generateQuotaReport();
            echo "Quota Usage Report:\n";
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