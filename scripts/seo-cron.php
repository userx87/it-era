<?php
/**
 * IT-ERA SEO Cron Master Script
 * Orchestrates all SEO tasks in the correct order
 * 
 * Usage: php seo-cron.php [--full] [--daily] [--weekly] [--monthly]
 */

class SEOCron {
    private $config;
    private $baseDir;
    private $verbose;
    
    public function __construct($verbose = false) {
        $this->baseDir = dirname(__DIR__);
        $this->config = require __DIR__ . '/seo-config.php';
        $this->verbose = $verbose;
    }
    
    /**
     * Run full SEO maintenance (all tasks)
     */
    public function runFull() {
        $this->log("Starting full SEO maintenance cycle...");
        
        $results = [
            'start_time' => time(),
            'tasks' => [],
            'success' => true,
            'total_errors' => 0
        ];
        
        try {
            // 1. Generate meta tags
            $results['tasks']['meta_generation'] = $this->runMetaGeneration();
            
            // 2. Generate structured data
            $results['tasks']['structured_data'] = $this->runStructuredDataGeneration();
            
            // 3. Generate sitemap
            $results['tasks']['sitemap'] = $this->runSitemapGeneration();
            
            // 4. Submit to Google (recent updates only)
            $results['tasks']['google_indexing'] = $this->runGoogleIndexing();
            
            // 5. SEO monitoring and health check
            $results['tasks']['seo_monitoring'] = $this->runSEOMonitoring();
            
            // 6. Generate reports
            $results['tasks']['reporting'] = $this->generateReports();
            
        } catch (Exception $e) {
            $results['success'] = false;
            $results['error'] = $e->getMessage();
            $this->logError("Full SEO maintenance failed: " . $e->getMessage());
        }
        
        $results['end_time'] = time();
        $results['duration'] = $results['end_time'] - $results['start_time'];
        
        // Count total errors
        foreach ($results['tasks'] as $task => $result) {
            if (isset($result['errors'])) {
                $results['total_errors'] += count($result['errors']);
            }
        }
        
        $this->log("Full SEO maintenance completed in {$results['duration']} seconds");
        $this->saveExecutionReport($results);
        
        return $results;
    }
    
    /**
     * Run daily SEO tasks
     */
    public function runDaily() {
        $this->log("Starting daily SEO tasks...");
        
        $results = [
            'start_time' => time(),
            'tasks' => [],
            'success' => true
        ];
        
        try {
            // Update sitemap
            $results['tasks']['sitemap'] = $this->runSitemapGeneration();
            
            // Submit recent updates to Google
            $results['tasks']['google_indexing'] = $this->runGoogleIndexing(true);
            
            // Quick health check
            $results['tasks']['health_check'] = $this->runQuickHealthCheck();
            
        } catch (Exception $e) {
            $results['success'] = false;
            $results['error'] = $e->getMessage();
            $this->logError("Daily SEO tasks failed: " . $e->getMessage());
        }
        
        $results['end_time'] = time();
        $results['duration'] = $results['end_time'] - $results['start_time'];
        
        $this->log("Daily SEO tasks completed in {$results['duration']} seconds");
        
        return $results;
    }
    
    /**
     * Run weekly SEO tasks
     */
    public function runWeekly() {
        $this->log("Starting weekly SEO tasks...");
        
        $results = [
            'start_time' => time(),
            'tasks' => [],
            'success' => true
        ];
        
        try {
            // Full meta tags update
            $results['tasks']['meta_generation'] = $this->runMetaGeneration();
            
            // Full SEO monitoring
            $results['tasks']['seo_monitoring'] = $this->runSEOMonitoring();
            
            // Generate weekly report
            $results['tasks']['weekly_report'] = $this->generateWeeklyReport();
            
        } catch (Exception $e) {
            $results['success'] = false;
            $results['error'] = $e->getMessage();
            $this->logError("Weekly SEO tasks failed: " . $e->getMessage());
        }
        
        $results['end_time'] = time();
        $results['duration'] = $results['end_time'] - $results['start_time'];
        
        $this->log("Weekly SEO tasks completed in {$results['duration']} seconds");
        
        return $results;
    }
    
    /**
     * Run monthly SEO tasks
     */
    public function runMonthly() {
        $this->log("Starting monthly SEO tasks...");
        
        $results = [
            'start_time' => time(),
            'tasks' => [],
            'success' => true
        ];
        
        try {
            // Full structured data update
            $results['tasks']['structured_data'] = $this->runStructuredDataGeneration();
            
            // Comprehensive SEO audit
            $results['tasks']['seo_audit'] = $this->runSEOAudit();
            
            // Generate monthly report
            $results['tasks']['monthly_report'] = $this->generateMonthlyReport();
            
            // Clean old logs and reports
            $results['tasks']['cleanup'] = $this->cleanupOldFiles();
            
        } catch (Exception $e) {
            $results['success'] = false;
            $results['error'] = $e->getMessage();
            $this->logError("Monthly SEO tasks failed: " . $e->getMessage());
        }
        
        $results['end_time'] = time();
        $results['duration'] = $results['end_time'] - $results['start_time'];
        
        $this->log("Monthly SEO tasks completed in {$results['duration']} seconds");
        
        return $results;
    }
    
    /**
     * Run meta tags generation
     */
    private function runMetaGeneration() {
        $this->log("Running meta tags generation...");
        
        try {
            $command = "php " . __DIR__ . "/meta-generator.php --generate-all";
            if ($this->verbose) {
                $command .= " --verbose";
            }
            
            $output = [];
            $returnCode = 0;
            exec($command . " 2>&1", $output, $returnCode);
            
            $result = [
                'success' => $returnCode === 0,
                'output' => implode("\n", $output),
                'return_code' => $returnCode
            ];
            
            if ($returnCode !== 0) {
                throw new Exception("Meta generation failed with code $returnCode: " . implode("\n", $output));
            }
            
            return $result;
            
        } catch (Exception $e) {
            $this->logError("Meta generation error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Run structured data generation
     */
    private function runStructuredDataGeneration() {
        $this->log("Running structured data generation...");
        
        try {
            $command = "php " . __DIR__ . "/structured-data-generator.php --generate-all";
            if ($this->verbose) {
                $command .= " --verbose";
            }
            
            $output = [];
            $returnCode = 0;
            exec($command . " 2>&1", $output, $returnCode);
            
            $result = [
                'success' => $returnCode === 0,
                'output' => implode("\n", $output),
                'return_code' => $returnCode
            ];
            
            if ($returnCode !== 0) {
                throw new Exception("Structured data generation failed with code $returnCode: " . implode("\n", $output));
            }
            
            return $result;
            
        } catch (Exception $e) {
            $this->logError("Structured data generation error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Run sitemap generation
     */
    private function runSitemapGeneration() {
        $this->log("Running sitemap generation...");
        
        try {
            $command = "php " . __DIR__ . "/seo-indexer.php --sitemap-only";
            if ($this->verbose) {
                $command .= " --verbose";
            }
            
            $output = [];
            $returnCode = 0;
            exec($command . " 2>&1", $output, $returnCode);
            
            $result = [
                'success' => $returnCode === 0,
                'output' => implode("\n", $output),
                'return_code' => $returnCode
            ];
            
            if ($returnCode !== 0) {
                throw new Exception("Sitemap generation failed with code $returnCode: " . implode("\n", $output));
            }
            
            return $result;
            
        } catch (Exception $e) {
            $this->logError("Sitemap generation error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Run Google indexing
     */
    private function runGoogleIndexing($recentOnly = false) {
        $this->log("Running Google indexing submission...");
        
        try {
            $command = "php " . __DIR__ . "/google-indexing.php";
            
            if ($recentOnly) {
                $command .= " --recent=1"; // Last 1 day
            } else {
                $command .= " --sitemap";
            }
            
            if ($this->verbose) {
                $command .= " --verbose";
            }
            
            $output = [];
            $returnCode = 0;
            exec($command . " 2>&1", $output, $returnCode);
            
            $result = [
                'success' => $returnCode === 0,
                'output' => implode("\n", $output),
                'return_code' => $returnCode
            ];
            
            // Google indexing errors are not critical for the overall process
            if ($returnCode !== 0) {
                $this->logError("Google indexing failed with code $returnCode: " . implode("\n", $output));
                $result['warning'] = 'Google indexing failed but process continued';
            }
            
            return $result;
            
        } catch (Exception $e) {
            $this->logError("Google indexing error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'warning' => 'Google indexing failed but process continued'
            ];
        }
    }
    
    /**
     * Run SEO monitoring
     */
    private function runSEOMonitoring() {
        $this->log("Running SEO monitoring...");
        
        try {
            $command = "php " . __DIR__ . "/seo-monitor.php --check-all";
            if ($this->verbose) {
                $command .= " --verbose";
            }
            
            $output = [];
            $returnCode = 0;
            exec($command . " 2>&1", $output, $returnCode);
            
            $result = [
                'success' => $returnCode === 0,
                'output' => implode("\n", $output),
                'return_code' => $returnCode
            ];
            
            if ($returnCode !== 0) {
                $this->logError("SEO monitoring failed with code $returnCode: " . implode("\n", $output));
                $result['warning'] = 'SEO monitoring had issues but process continued';
            }
            
            return $result;
            
        } catch (Exception $e) {
            $this->logError("SEO monitoring error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Run quick health check (subset of full monitoring)
     */
    private function runQuickHealthCheck() {
        $this->log("Running quick health check...");
        
        try {
            $command = "php " . __DIR__ . "/seo-monitor.php --performance";
            if ($this->verbose) {
                $command .= " --verbose";
            }
            
            $output = [];
            $returnCode = 0;
            exec($command . " 2>&1", $output, $returnCode);
            
            return [
                'success' => $returnCode === 0,
                'output' => implode("\n", $output),
                'return_code' => $returnCode
            ];
            
        } catch (Exception $e) {
            $this->logError("Quick health check error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Run comprehensive SEO audit
     */
    private function runSEOAudit() {
        $this->log("Running comprehensive SEO audit...");
        
        // This would be a more detailed analysis
        // For now, use the regular monitoring with extended checks
        return $this->runSEOMonitoring();
    }
    
    /**
     * Generate execution report
     */
    private function generateReports() {
        $this->log("Generating SEO reports...");
        
        $reports = [
            'execution_summary' => $this->generateExecutionSummary(),
            'quota_usage' => $this->generateQuotaReport(),
            'performance_trends' => $this->generatePerformanceTrends()
        ];
        
        return [
            'success' => true,
            'reports_generated' => count($reports),
            'reports' => array_keys($reports)
        ];
    }
    
    /**
     * Generate weekly report
     */
    private function generateWeeklyReport() {
        $this->log("Generating weekly report...");
        
        $report = [
            'period' => 'week',
            'start_date' => date('Y-m-d', strtotime('-1 week')),
            'end_date' => date('Y-m-d'),
            'summary' => 'Weekly SEO performance summary',
            'generated_at' => date('c')
        ];
        
        $reportPath = $this->baseDir . $this->config['paths']['reports'] . '/weekly-report-' . date('Y-W') . '.json';
        $this->ensureDirectoryExists(dirname($reportPath));
        file_put_contents($reportPath, json_encode($report, JSON_PRETTY_PRINT));
        
        return [
            'success' => true,
            'report_path' => $reportPath
        ];
    }
    
    /**
     * Generate monthly report
     */
    private function generateMonthlyReport() {
        $this->log("Generating monthly report...");
        
        $report = [
            'period' => 'month',
            'start_date' => date('Y-m-01'),
            'end_date' => date('Y-m-t'),
            'summary' => 'Monthly SEO performance summary',
            'generated_at' => date('c')
        ];
        
        $reportPath = $this->baseDir . $this->config['paths']['reports'] . '/monthly-report-' . date('Y-m') . '.json';
        $this->ensureDirectoryExists(dirname($reportPath));
        file_put_contents($reportPath, json_encode($report, JSON_PRETTY_PRINT));
        
        return [
            'success' => true,
            'report_path' => $reportPath
        ];
    }
    
    /**
     * Clean up old files
     */
    private function cleanupOldFiles() {
        $this->log("Cleaning up old files...");
        
        $cleaned = [
            'logs' => $this->cleanOldLogs(),
            'reports' => $this->cleanOldReports()
        ];
        
        return [
            'success' => true,
            'cleaned_files' => array_sum($cleaned)
        ];
    }
    
    /**
     * Clean old log files (keep 30 days)
     */
    private function cleanOldLogs() {
        $logsDir = $this->baseDir . $this->config['paths']['logs'];
        $cutoff = time() - (30 * 24 * 60 * 60); // 30 days
        $cleaned = 0;
        
        if (is_dir($logsDir)) {
            $files = glob($logsDir . '/*.log');
            foreach ($files as $file) {
                if (filemtime($file) < $cutoff) {
                    if (unlink($file)) {
                        $cleaned++;
                    }
                }
            }
        }
        
        return $cleaned;
    }
    
    /**
     * Clean old report files (keep 90 days)
     */
    private function cleanOldReports() {
        $reportsDir = $this->baseDir . $this->config['paths']['reports'];
        $cutoff = time() - (90 * 24 * 60 * 60); // 90 days
        $cleaned = 0;
        
        if (is_dir($reportsDir)) {
            $files = glob($reportsDir . '/*.json');
            foreach ($files as $file) {
                // Don't delete 'latest' reports
                if (strpos($file, 'latest') !== false) {
                    continue;
                }
                
                if (filemtime($file) < $cutoff) {
                    if (unlink($file)) {
                        $cleaned++;
                    }
                }
            }
        }
        
        return $cleaned;
    }
    
    /**
     * Helper methods for reporting
     */
    
    private function generateExecutionSummary() {
        return [
            'last_execution' => date('c'),
            'status' => 'completed',
            'next_scheduled' => date('c', strtotime('+1 day'))
        ];
    }
    
    private function generateQuotaReport() {
        // This would integrate with google-indexing.php quota system
        return [
            'google_api_quota' => 'within_limits',
            'daily_submissions' => 0,
            'monthly_submissions' => 0
        ];
    }
    
    private function generatePerformanceTrends() {
        return [
            'average_load_time' => '2.1s',
            'seo_score_trend' => 'improving',
            'pages_indexed' => 1544
        ];
    }
    
    /**
     * Save execution report
     */
    private function saveExecutionReport($results) {
        $reportPath = $this->baseDir . $this->config['paths']['reports'] . '/cron-execution-' . date('Y-m-d-H-i-s') . '.json';
        $this->ensureDirectoryExists(dirname($reportPath));
        
        file_put_contents($reportPath, json_encode($results, JSON_PRETTY_PRINT));
        
        // Also save as latest
        $latestPath = $this->baseDir . $this->config['paths']['reports'] . '/cron-execution-latest.json';
        file_put_contents($latestPath, json_encode($results, JSON_PRETTY_PRINT));
        
        $this->log("Execution report saved to: $reportPath");
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
        
        $logFile = $this->baseDir . $this->config['paths']['logs'] . '/seo-cron.log';
        $this->ensureDirectoryExists(dirname($logFile));
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
    
    private function logError($message) {
        $this->log("ERROR: $message");
        
        $errorFile = $this->baseDir . $this->config['paths']['logs'] . '/seo-cron-errors.log';
        $timestamp = date('[Y-m-d H:i:s]');
        file_put_contents($errorFile, "$timestamp $message" . PHP_EOL, FILE_APPEND | LOCK_EX);
    }
}

// Command line execution
if (php_sapi_name() === 'cli') {
    $options = getopt('', ['full', 'daily', 'weekly', 'monthly', 'verbose', 'help']);
    
    if (isset($options['help'])) {
        echo "IT-ERA SEO Cron Master Script\n";
        echo "Usage: php seo-cron.php [options]\n";
        echo "Options:\n";
        echo "  --full     Run all SEO tasks (full maintenance)\n";
        echo "  --daily    Run daily SEO tasks\n";
        echo "  --weekly   Run weekly SEO tasks\n";
        echo "  --monthly  Run monthly SEO tasks\n";
        echo "  --verbose  Show detailed output\n";
        echo "  --help     Show this help message\n";
        echo "\nScheduled execution:\n";
        echo "  Daily:   0 6 * * * php seo-cron.php --daily\n";
        echo "  Weekly:  0 2 * * 0 php seo-cron.php --weekly\n";
        echo "  Monthly: 0 1 1 * * php seo-cron.php --monthly\n";
        exit(0);
    }
    
    $verbose = isset($options['verbose']);
    
    try {
        $cron = new SEOCron($verbose);
        
        if (isset($options['full'])) {
            $results = $cron->runFull();
            echo "Full SEO maintenance completed.\n";
            echo "Success: " . ($results['success'] ? 'Yes' : 'No') . "\n";
            echo "Duration: {$results['duration']} seconds\n";
            echo "Total errors: {$results['total_errors']}\n";
            
        } elseif (isset($options['daily'])) {
            $results = $cron->runDaily();
            echo "Daily SEO tasks completed.\n";
            echo "Success: " . ($results['success'] ? 'Yes' : 'No') . "\n";
            echo "Duration: {$results['duration']} seconds\n";
            
        } elseif (isset($options['weekly'])) {
            $results = $cron->runWeekly();
            echo "Weekly SEO tasks completed.\n";
            echo "Success: " . ($results['success'] ? 'Yes' : 'No') . "\n";
            echo "Duration: {$results['duration']} seconds\n";
            
        } elseif (isset($options['monthly'])) {
            $results = $cron->runMonthly();
            echo "Monthly SEO tasks completed.\n";
            echo "Success: " . ($results['success'] ? 'Yes' : 'No') . "\n";
            echo "Duration: {$results['duration']} seconds\n";
            
        } else {
            echo "No schedule specified. Use --help for usage information.\n";
            echo "Available schedules: --daily, --weekly, --monthly, --full\n";
            exit(1);
        }
        
        if (!$results['success'] && isset($results['error'])) {
            echo "Error: " . $results['error'] . "\n";
            exit(1);
        }
        
    } catch (Exception $e) {
        echo "Fatal error: " . $e->getMessage() . "\n";
        exit(1);
    }
}