<?php
/**
 * IT-ERA Google Analytics 4 Daily Integration Script
 * 
 * Automated PHP script for daily execution via cron job
 * Checks all HTML pages and adds GA4 tracking code if not present
 * 
 * Usage: php cron-ga4-integrator.php
 * Cron example: 0 2 * * * /usr/bin/php /path/to/cron-ga4-integrator.php
 * 
 * @author IT-ERA Development Team
 * @version 1.0
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

class GA4Integrator {
    
    // Configuration
    private $baseDir = '/Users/andreapanzeri/progetti/IT-ERA';
    private $logFile = '/Users/andreapanzeri/progetti/IT-ERA/logs/ga4-integration.log';
    private $processedFiles = 0;
    private $updatedFiles = 0;
    private $errorFiles = 0;
    
    // GA4 Tracking Code Template
    private $ga4Code = '
<!-- Google Analytics 4 - IT-ERA -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-T5VWN9EH21"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  gtag("config", "G-T5VWN9EH21", {
    page_title: document.title,
    page_location: window.location.href,
    custom_map: {
      "custom_parameter_1": "service_type",
      "custom_parameter_2": "city_name"
    }
  });
  
  // IT-ERA Enhanced Events
  gtag("event", "page_view", {
    event_category: "engagement",
    event_label: window.location.pathname,
    service_type: document.querySelector("h1") ? document.querySelector("h1").textContent.includes("Assistenza") ? "assistenza-it" : 
                  document.querySelector("h1").textContent.includes("Sicurezza") ? "sicurezza-informatica" :
                  document.querySelector("h1").textContent.includes("Cloud") ? "cloud-storage" : "general" : "general"
  });
</script>
<!-- End Google Analytics 4 -->';
    
    // GTM Code Template
    private $gtmHeadCode = '
<!-- Google Tag Manager - IT-ERA -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({"gtm.start":
new Date().getTime(),event:"gtm.js"});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!="dataLayer"?"&l="+l:"";j.async=true;j.src=
"https://www.googletagmanager.com/gtm.js?id="+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,"script","dataLayer","GTM-KPF3JZT");</script>
<!-- End Google Tag Manager -->';
    
    private $gtmBodyCode = '
<!-- Google Tag Manager (noscript) - IT-ERA -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KPF3JZT"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->';
    
    public function __construct() {
        $this->log("🚀 Starting GA4 Integration Script - " . date('Y-m-d H:i:s'));
    }
    
    /**
     * Main execution method
     */
    public function execute() {
        try {
            $this->log("📁 Scanning directory: " . $this->baseDir);
            
            // Find all HTML files
            $htmlFiles = $this->findHtmlFiles();
            
            $this->log("📊 Found " . count($htmlFiles) . " HTML files to process");
            
            // Process each file
            foreach ($htmlFiles as $filePath) {
                $this->processFile($filePath);
            }
            
            $this->generateReport();
            
        } catch (Exception $e) {
            $this->log("❌ Fatal error: " . $e->getMessage());
            exit(1);
        }
    }
    
    /**
     * Find all HTML files in the project
     */
    private function findHtmlFiles() {
        $files = [];
        
        // Main web directory
        $webDir = $this->baseDir . '/web';
        if (is_dir($webDir)) {
            $files = array_merge($files, $this->scanDirectory($webDir, '*.html'));
        }
        
        // Pages directory
        $pagesDir = $this->baseDir . '/web/pages';
        if (is_dir($pagesDir)) {
            $files = array_merge($files, $this->scanDirectory($pagesDir, '*.html'));
        }
        
        // Generated pages directory
        $generatedDir = $this->baseDir . '/web/pages-generated';
        if (is_dir($generatedDir)) {
            $files = array_merge($files, $this->scanDirectory($generatedDir, '*.html'));
        }
        
        // Templates directory
        $templatesDir = $this->baseDir . '/templates';
        if (is_dir($templatesDir)) {
            $files = array_merge($files, $this->scanDirectory($templatesDir, '*.html'));
        }
        
        return array_unique($files);
    }
    
    /**
     * Recursively scan directory for HTML files
     */
    private function scanDirectory($dir, $pattern) {
        $files = [];
        
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir),
            RecursiveIteratorIterator::LEAVES_ONLY
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile() && fnmatch($pattern, $file->getFilename())) {
                $files[] = $file->getRealPath();
            }
        }
        
        return $files;
    }
    
    /**
     * Process individual HTML file
     */
    private function processFile($filePath) {
        $this->processedFiles++;
        
        try {
            // Skip backup and test files
            if (strpos($filePath, '/backup/') !== false || 
                strpos($filePath, '/tests/') !== false ||
                strpos($filePath, 'test-') !== false) {
                return;
            }
            
            // Read file content
            $content = file_get_contents($filePath);
            if ($content === false) {
                throw new Exception("Cannot read file: " . $filePath);
            }
            
            $originalContent = $content;
            $updated = false;
            
            // Check if GA4 tracking is already present
            if (strpos($content, 'gtag') === false && strpos($content, 'G-') === false) {
                $content = $this->addGA4Tracking($content);
                $updated = true;
            }
            
            // Check if GTM is already present
            if (strpos($content, 'GTM-') === false) {
                $content = $this->addGTMTracking($content);
                $updated = true;
            }
            
            // Write back if updated
            if ($updated && $content !== $originalContent) {
                if (file_put_contents($filePath, $content)) {
                    $this->updatedFiles++;
                    $this->log("✅ Updated: " . basename($filePath));
                } else {
                    throw new Exception("Cannot write file: " . $filePath);
                }
            }
            
        } catch (Exception $e) {
            $this->errorFiles++;
            $this->log("❌ Error processing " . basename($filePath) . ": " . $e->getMessage());
        }
        
        // Progress indicator
        if ($this->processedFiles % 100 === 0) {
            $this->log("📊 Processed " . $this->processedFiles . " files...");
        }
    }
    
    /**
     * Add GA4 tracking code to HTML
     */
    private function addGA4Tracking($content) {
        // Insert before closing </head> tag
        if (strpos($content, '</head>') !== false) {
            $content = str_replace('</head>', $this->ga4Code . "\n</head>", $content);
        } else {
            // If no head tag, insert after <html> or at beginning
            if (strpos($content, '<html') !== false) {
                $content = preg_replace('/(<html[^>]*>)/i', '$1' . $this->ga4Code, $content);
            } else {
                $content = $this->ga4Code . "\n" . $content;
            }
        }
        
        return $content;
    }
    
    /**
     * Add GTM tracking code to HTML
     */
    private function addGTMTracking($content) {
        // Insert GTM head code before closing </head> tag
        if (strpos($content, '</head>') !== false) {
            $content = str_replace('</head>', $this->gtmHeadCode . "\n</head>", $content);
        }
        
        // Insert GTM body code after opening <body> tag
        if (strpos($content, '<body') !== false) {
            $content = preg_replace('/(<body[^>]*>)/i', '$1' . $this->gtmBodyCode, $content);
        }
        
        return $content;
    }
    
    /**
     * Generate final report
     */
    private function generateReport() {
        $this->log("\n🎉 GA4 Integration Complete!");
        $this->log("📊 Files processed: " . $this->processedFiles);
        $this->log("✅ Files updated: " . $this->updatedFiles);
        $this->log("❌ Errors: " . $this->errorFiles);
        $this->log("📈 Success rate: " . round(($this->processedFiles - $this->errorFiles) / $this->processedFiles * 100, 2) . "%");
        
        // Create summary file
        $summaryFile = $this->baseDir . '/logs/ga4-integration-summary.json';
        $summary = [
            'timestamp' => date('c'),
            'processed_files' => $this->processedFiles,
            'updated_files' => $this->updatedFiles,
            'error_files' => $this->errorFiles,
            'success_rate' => round(($this->processedFiles - $this->errorFiles) / $this->processedFiles * 100, 2)
        ];
        
        file_put_contents($summaryFile, json_encode($summary, JSON_PRETTY_PRINT));
        $this->log("📄 Summary saved to: " . $summaryFile);
    }
    
    /**
     * Log message to file and console
     */
    private function log($message) {
        $logMessage = "[" . date('Y-m-d H:i:s') . "] " . $message . "\n";
        
        // Create logs directory if doesn't exist
        $logsDir = dirname($this->logFile);
        if (!is_dir($logsDir)) {
            mkdir($logsDir, 0755, true);
        }
        
        // Write to log file
        file_put_contents($this->logFile, $logMessage, FILE_APPEND | LOCK_EX);
        
        // Output to console
        echo $logMessage;
    }
}

// Execute the script
try {
    $integrator = new GA4Integrator();
    $integrator->execute();
    exit(0);
} catch (Exception $e) {
    echo "💥 Script failed: " . $e->getMessage() . "\n";
    exit(1);
}

?>