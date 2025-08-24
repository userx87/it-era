<?php
/**
 * IT-ERA SEO Error Handler and Logger
 * 
 * Comprehensive error handling and logging system for SEO automation
 * Features:
 * - Structured logging with multiple levels
 * - Error recovery mechanisms
 * - Notification system integration
 * - Performance monitoring
 * - Log rotation and cleanup
 */

declare(strict_types=1);

class SEOErrorHandler
{
    private string $logDir;
    private array $config;
    private array $errorCounts = [];
    private int $maxRetries = 3;
    private int $retryDelay = 5; // seconds
    
    // Log levels
    public const LOG_EMERGENCY = 'EMERGENCY';
    public const LOG_ALERT = 'ALERT';
    public const LOG_CRITICAL = 'CRITICAL';
    public const LOG_ERROR = 'ERROR';
    public const LOG_WARNING = 'WARNING';
    public const LOG_NOTICE = 'NOTICE';
    public const LOG_INFO = 'INFO';
    public const LOG_DEBUG = 'DEBUG';
    
    private const LOG_LEVELS = [
        self::LOG_EMERGENCY => 0,
        self::LOG_ALERT => 1,
        self::LOG_CRITICAL => 2,
        self::LOG_ERROR => 3,
        self::LOG_WARNING => 4,
        self::LOG_NOTICE => 5,
        self::LOG_INFO => 6,
        self::LOG_DEBUG => 7
    ];
    
    public function __construct(string $logDir = '/var/log/it-era-seo', array $config = [])
    {
        $this->logDir = $logDir;
        $this->config = array_merge($this->getDefaultConfig(), $config);
        
        $this->ensureLogDirectory();
        $this->setupErrorHandlers();
        $this->setupShutdownHandler();
        
        $this->log('SEO Error Handler initialized', self::LOG_INFO, [
            'log_directory' => $this->logDir,
            'max_retries' => $this->maxRetries,
            'retry_delay' => $this->retryDelay
        ]);
    }
    
    /**
     * Main logging method with context and metadata
     */
    public function log(string $message, string $level = self::LOG_INFO, array $context = []): void
    {
        try {
            // Skip if log level is below configured minimum
            if (!$this->shouldLog($level)) {
                return;
            }
            
            // Prepare log entry
            $logEntry = $this->formatLogEntry($message, $level, $context);
            
            // Write to appropriate log files
            $this->writeLogEntry($logEntry, $level);
            
            // Handle critical errors
            if ($this->isCriticalLevel($level)) {
                $this->handleCriticalError($message, $level, $context);
            }
            
            // Track error counts for monitoring
            $this->trackErrorCount($level);
            
        } catch (Exception $e) {
            // Fallback logging to prevent infinite loops
            error_log("SEO Error Handler failed: " . $e->getMessage());
        }
    }
    
    /**
     * Execute operation with error handling and retry logic
     */
    public function executeWithRetry(callable $operation, string $operationName, array $context = []): mixed
    {
        $attempt = 0;
        $lastException = null;
        
        while ($attempt < $this->maxRetries) {
            try {
                $this->log("Executing: {$operationName} (attempt " . ($attempt + 1) . ")", self::LOG_DEBUG, $context);
                
                $startTime = microtime(true);
                $result = $operation();
                $executionTime = microtime(true) - $startTime;
                
                $this->log("Operation completed: {$operationName}", self::LOG_INFO, [
                    'execution_time' => round($executionTime, 4),
                    'attempt' => $attempt + 1,
                    ...$context
                ]);
                
                return $result;
                
            } catch (Exception $e) {
                $attempt++;
                $lastException = $e;
                
                $this->log("Operation failed: {$operationName}", self::LOG_WARNING, [
                    'error' => $e->getMessage(),
                    'attempt' => $attempt,
                    'max_attempts' => $this->maxRetries,
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    ...$context
                ]);
                
                // Wait before retry (except on last attempt)
                if ($attempt < $this->maxRetries) {
                    sleep($this->retryDelay);
                }
            }
        }
        
        // All retries exhausted
        $this->log("Operation permanently failed: {$operationName}", self::LOG_ERROR, [
            'error' => $lastException->getMessage(),
            'total_attempts' => $this->maxRetries,
            'trace' => $lastException->getTraceAsString(),
            ...$context
        ]);
        
        throw new Exception("Operation '{$operationName}' failed after {$this->maxRetries} attempts: " . $lastException->getMessage());
    }
    
    /**
     * Log SEO-specific operations
     */
    public function logSEOOperation(string $operation, string $status, array $data = []): void
    {
        $level = match ($status) {
            'success' => self::LOG_INFO,
            'warning' => self::LOG_WARNING,
            'error' => self::LOG_ERROR,
            'critical' => self::LOG_CRITICAL,
            default => self::LOG_INFO
        };
        
        $this->log("SEO Operation: {$operation}", $level, [
            'operation' => $operation,
            'status' => $status,
            'timestamp' => date('c'),
            'data' => $data
        ]);
    }
    
    /**
     * Log HTTP requests and responses
     */
    public function logHttpRequest(string $url, array $options, $response, float $executionTime): void
    {
        $statusCode = null;
        $responseSize = 0;
        $success = false;
        
        if (is_string($response)) {
            $success = true;
            $responseSize = strlen($response);
            $statusCode = 200; // Assume success if we got content
        } elseif ($response === false) {
            $success = false;
        }
        
        $level = $success ? self::LOG_INFO : self::LOG_WARNING;
        
        $this->log("HTTP Request: {$url}", $level, [
            'url' => $url,
            'method' => $options['method'] ?? 'GET',
            'status_code' => $statusCode,
            'response_size' => $responseSize,
            'execution_time' => round($executionTime, 4),
            'success' => $success,
            'user_agent' => $options['user_agent'] ?? null
        ]);
    }
    
    /**
     * Log performance metrics
     */
    public function logPerformanceMetrics(string $operation, array $metrics): void
    {
        $this->log("Performance Metrics: {$operation}", self::LOG_INFO, [
            'operation' => $operation,
            'metrics' => $metrics,
            'memory_usage' => memory_get_usage(true),
            'peak_memory' => memory_get_peak_usage(true),
            'execution_time' => $metrics['execution_time'] ?? null
        ]);
    }
    
    /**
     * Generate error report for specific time period
     */
    public function generateErrorReport(int $hours = 24): array
    {
        $report = [
            'period' => "{$hours} hours",
            'start_time' => date('c', time() - ($hours * 3600)),
            'end_time' => date('c'),
            'summary' => [],
            'details' => []
        ];
        
        try {
            // Analyze log files for the specified period
            $logFiles = glob($this->logDir . '/seo-*.log');
            $cutoffTime = time() - ($hours * 3600);
            
            foreach ($logFiles as $logFile) {
                if (filemtime($logFile) > $cutoffTime) {
                    $this->analyzeLogFile($logFile, $cutoffTime, $report);
                }
            }
            
            // Generate summary statistics
            $this->generateReportSummary($report);
            
        } catch (Exception $e) {
            $this->log("Error generating report: " . $e->getMessage(), self::LOG_ERROR);
            $report['error'] = $e->getMessage();
        }
        
        return $report;
    }
    
    /**
     * Clean up old log files
     */
    public function cleanupLogs(int $daysToKeep = 30): int
    {
        $deletedCount = 0;
        $cutoffTime = time() - ($daysToKeep * 24 * 60 * 60);
        
        try {
            $logFiles = glob($this->logDir . '/*.log');
            
            foreach ($logFiles as $logFile) {
                if (filemtime($logFile) < $cutoffTime) {
                    if (unlink($logFile)) {
                        $deletedCount++;
                        $this->log("Deleted old log file: " . basename($logFile), self::LOG_INFO);
                    }
                }
            }
            
        } catch (Exception $e) {
            $this->log("Log cleanup error: " . $e->getMessage(), self::LOG_ERROR);
        }
        
        return $deletedCount;
    }
    
    /**
     * Get system status and health metrics
     */
    public function getSystemStatus(): array
    {
        $status = [
            'timestamp' => date('c'),
            'log_directory' => $this->logDir,
            'disk_usage' => $this->getLogDirectorySize(),
            'error_counts' => $this->errorCounts,
            'memory_usage' => memory_get_usage(true),
            'peak_memory' => memory_get_peak_usage(true)
        ];
        
        // Add recent error summary
        try {
            $recentErrors = $this->generateErrorReport(1); // Last hour
            $status['recent_errors'] = $recentErrors['summary'];
        } catch (Exception $e) {
            $status['recent_errors'] = ['error' => 'Unable to generate recent errors summary'];
        }
        
        return $status;
    }
    
    /**
     * Setup PHP error and exception handlers
     */
    private function setupErrorHandlers(): void
    {
        // Set custom error handler
        set_error_handler([$this, 'handlePHPError']);
        
        // Set custom exception handler
        set_exception_handler([$this, 'handlePHPException']);
    }
    
    /**
     * Setup shutdown handler to catch fatal errors
     */
    private function setupShutdownHandler(): void
    {
        register_shutdown_function([$this, 'handleShutdown']);
    }
    
    /**
     * Handle PHP errors
     */
    public function handlePHPError(int $severity, string $message, string $file, int $line): bool
    {
        // Convert PHP error level to our log level
        $level = match ($severity) {
            E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE => self::LOG_CRITICAL,
            E_WARNING, E_CORE_WARNING, E_COMPILE_WARNING, E_USER_WARNING => self::LOG_WARNING,
            E_NOTICE, E_USER_NOTICE => self::LOG_NOTICE,
            E_STRICT, E_DEPRECATED, E_USER_DEPRECATED => self::LOG_INFO,
            default => self::LOG_ERROR
        };
        
        $this->log("PHP Error: {$message}", $level, [
            'severity' => $severity,
            'file' => $file,
            'line' => $line,
            'error_type' => $this->getErrorTypeName($severity)
        ]);
        
        // Don't execute PHP's internal error handler
        return true;
    }
    
    /**
     * Handle uncaught exceptions
     */
    public function handlePHPException(Throwable $exception): void
    {
        $this->log("Uncaught Exception: " . $exception->getMessage(), self::LOG_CRITICAL, [
            'type' => get_class($exception),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString()
        ]);
    }
    
    /**
     * Handle script shutdown (catch fatal errors)
     */
    public function handleShutdown(): void
    {
        $error = error_get_last();
        
        if ($error && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE])) {
            $this->log("Fatal Error: " . $error['message'], self::LOG_EMERGENCY, [
                'type' => $error['type'],
                'file' => $error['file'],
                'line' => $error['line'],
                'error_type' => $this->getErrorTypeName($error['type'])
            ]);
        }
        
        // Log shutdown metrics
        $this->log("Script shutdown", self::LOG_DEBUG, [
            'peak_memory' => memory_get_peak_usage(true),
            'execution_time' => microtime(true) - ($_SERVER['REQUEST_TIME_FLOAT'] ?? 0)
        ]);
    }
    
    /**
     * Check if we should log at this level
     */
    private function shouldLog(string $level): bool
    {
        $configuredLevel = $this->config['min_log_level'] ?? self::LOG_INFO;
        
        return (self::LOG_LEVELS[$level] ?? 7) <= (self::LOG_LEVELS[$configuredLevel] ?? 6);
    }
    
    /**
     * Format log entry with structured data
     */
    private function formatLogEntry(string $message, string $level, array $context): array
    {
        return [
            'timestamp' => date('c'),
            'level' => $level,
            'message' => $message,
            'context' => $context,
            'process_id' => getmypid(),
            'memory_usage' => memory_get_usage(),
            'request_id' => $this->getRequestId()
        ];
    }
    
    /**
     * Write log entry to appropriate files
     */
    private function writeLogEntry(array $logEntry, string $level): void
    {
        $logLine = $this->formatLogLine($logEntry);
        
        // Write to main log file
        $mainLogFile = $this->logDir . '/seo-main.log';
        file_put_contents($mainLogFile, $logLine . "\n", FILE_APPEND | LOCK_EX);
        
        // Write to level-specific log file for errors and above
        if ($this->isCriticalLevel($level)) {
            $errorLogFile = $this->logDir . '/seo-errors.log';
            file_put_contents($errorLogFile, $logLine . "\n", FILE_APPEND | LOCK_EX);
        }
        
        // Write structured JSON log for analysis
        if ($this->config['json_logging'] ?? false) {
            $jsonLogFile = $this->logDir . '/seo-structured.log';
            file_put_contents($jsonLogFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
        }
    }
    
    /**
     * Format log entry as human-readable line
     */
    private function formatLogLine(array $logEntry): string
    {
        $contextStr = '';
        if (!empty($logEntry['context'])) {
            $contextStr = ' | ' . json_encode($logEntry['context'], JSON_UNESCAPED_SLASHES);
        }
        
        return sprintf(
            "[%s] [%s] [PID:%d] %s%s",
            $logEntry['timestamp'],
            $logEntry['level'],
            $logEntry['process_id'],
            $logEntry['message'],
            $contextStr
        );
    }
    
    /**
     * Handle critical errors with notifications
     */
    private function handleCriticalError(string $message, string $level, array $context): void
    {
        // Prepare notification data
        $notificationData = [
            'title' => "IT-ERA SEO Critical Error - {$level}",
            'message' => $message,
            'level' => $level,
            'timestamp' => date('c'),
            'context' => $context,
            'server' => gethostname(),
            'script' => $_SERVER['SCRIPT_NAME'] ?? 'unknown'
        ];
        
        // Send notification
        $this->sendErrorNotification($notificationData);
    }
    
    /**
     * Send error notification via configured channels
     */
    private function sendErrorNotification(array $data): void
    {
        try {
            // Save notification to file for external processing
            $notificationFile = $this->logDir . '/error-notifications.json';
            file_put_contents($notificationFile, json_encode($data) . "\n", FILE_APPEND | LOCK_EX);
            
            // Try to send webhook notification if configured
            if (!empty($this->config['webhook_url'])) {
                $this->sendWebhookNotification($data);
            }
            
        } catch (Exception $e) {
            // Fallback to system log
            error_log("Failed to send error notification: " . $e->getMessage());
        }
    }
    
    /**
     * Send webhook notification
     */
    private function sendWebhookNotification(array $data): void
    {
        $payload = json_encode($data);
        
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => [
                    'Content-Type: application/json',
                    'User-Agent: IT-ERA-SEO-ErrorHandler/1.0'
                ],
                'content' => $payload,
                'timeout' => 10
            ]
        ]);
        
        @file_get_contents($this->config['webhook_url'], false, $context);
    }
    
    /**
     * Track error counts for monitoring
     */
    private function trackErrorCount(string $level): void
    {
        $key = date('Y-m-d-H') . '-' . $level;
        $this->errorCounts[$key] = ($this->errorCounts[$key] ?? 0) + 1;
        
        // Keep only last 24 hours of data
        $cutoff = date('Y-m-d-H', time() - (24 * 3600));
        foreach ($this->errorCounts as $k => $v) {
            if ($k < $cutoff) {
                unset($this->errorCounts[$k]);
            }
        }
    }
    
    /**
     * Check if level is critical
     */
    private function isCriticalLevel(string $level): bool
    {
        return in_array($level, [
            self::LOG_EMERGENCY,
            self::LOG_ALERT,
            self::LOG_CRITICAL,
            self::LOG_ERROR
        ]);
    }
    
    /**
     * Analyze log file for error report
     */
    private function analyzeLogFile(string $logFile, int $cutoffTime, array &$report): void
    {
        $handle = fopen($logFile, 'r');
        if (!$handle) return;
        
        while (($line = fgets($handle)) !== false) {
            // Parse log line to extract timestamp and level
            if (preg_match('/\[([^\]]+)\] \[([^\]]+)\]/', $line, $matches)) {
                $timestamp = $matches[1];
                $level = $matches[2];
                
                if (strtotime($timestamp) > $cutoffTime) {
                    $report['details'][] = trim($line);
                    $report['summary'][$level] = ($report['summary'][$level] ?? 0) + 1;
                }
            }
        }
        
        fclose($handle);
    }
    
    /**
     * Generate report summary statistics
     */
    private function generateReportSummary(array &$report): void
    {
        $totalErrors = array_sum($report['summary']);
        $criticalCount = ($report['summary'][self::LOG_CRITICAL] ?? 0) + 
                        ($report['summary'][self::LOG_EMERGENCY] ?? 0);
        
        $report['statistics'] = [
            'total_log_entries' => $totalErrors,
            'critical_errors' => $criticalCount,
            'warnings' => $report['summary'][self::LOG_WARNING] ?? 0,
            'info_messages' => $report['summary'][self::LOG_INFO] ?? 0,
            'health_status' => $criticalCount > 0 ? 'critical' : ($totalErrors > 10 ? 'warning' : 'healthy')
        ];
    }
    
    /**
     * Get error type name from PHP error code
     */
    private function getErrorTypeName(int $errorType): string
    {
        $errorTypes = [
            E_ERROR => 'E_ERROR',
            E_WARNING => 'E_WARNING',
            E_PARSE => 'E_PARSE',
            E_NOTICE => 'E_NOTICE',
            E_CORE_ERROR => 'E_CORE_ERROR',
            E_CORE_WARNING => 'E_CORE_WARNING',
            E_COMPILE_ERROR => 'E_COMPILE_ERROR',
            E_COMPILE_WARNING => 'E_COMPILE_WARNING',
            E_USER_ERROR => 'E_USER_ERROR',
            E_USER_WARNING => 'E_USER_WARNING',
            E_USER_NOTICE => 'E_USER_NOTICE',
            E_STRICT => 'E_STRICT',
            E_RECOVERABLE_ERROR => 'E_RECOVERABLE_ERROR',
            E_DEPRECATED => 'E_DEPRECATED',
            E_USER_DEPRECATED => 'E_USER_DEPRECATED'
        ];
        
        return $errorTypes[$errorType] ?? 'UNKNOWN';
    }
    
    /**
     * Get or generate request ID for tracking
     */
    private function getRequestId(): string
    {
        static $requestId = null;
        
        if ($requestId === null) {
            $requestId = uniqid('req_', true);
        }
        
        return $requestId;
    }
    
    /**
     * Get log directory size in bytes
     */
    private function getLogDirectorySize(): int
    {
        $size = 0;
        $files = glob($this->logDir . '/*');
        
        foreach ($files as $file) {
            if (is_file($file)) {
                $size += filesize($file);
            }
        }
        
        return $size;
    }
    
    /**
     * Ensure log directory exists
     */
    private function ensureLogDirectory(): void
    {
        if (!is_dir($this->logDir)) {
            mkdir($this->logDir, 0755, true);
        }
    }
    
    /**
     * Get default configuration
     */
    private function getDefaultConfig(): array
    {
        return [
            'min_log_level' => self::LOG_INFO,
            'json_logging' => false,
            'webhook_url' => null,
            'max_log_file_size' => 10 * 1024 * 1024, // 10MB
            'max_log_files' => 10,
            'notification_throttle' => 300 // 5 minutes
        ];
    }
}

// Global instance for easy access
$seoErrorHandler = null;

/**
 * Get global SEO error handler instance
 */
function getSEOErrorHandler(): SEOErrorHandler
{
    global $seoErrorHandler;
    
    if ($seoErrorHandler === null) {
        $seoErrorHandler = new SEOErrorHandler();
    }
    
    return $seoErrorHandler;
}

/**
 * Convenience function for logging
 */
function seoLog(string $message, string $level = SEOErrorHandler::LOG_INFO, array $context = []): void
{
    getSEOErrorHandler()->log($message, $level, $context);
}

// Auto-initialize if running from command line
if (PHP_SAPI === 'cli' && basename($_SERVER['SCRIPT_NAME']) === 'seo-error-handler.php') {
    $handler = new SEOErrorHandler();
    
    $command = $argv[1] ?? 'help';
    
    switch ($command) {
        case 'status':
            echo json_encode($handler->getSystemStatus(), JSON_PRETTY_PRINT) . "\n";
            break;
            
        case 'cleanup':
            $days = (int)($argv[2] ?? 30);
            $deleted = $handler->cleanupLogs($days);
            echo "Deleted {$deleted} old log files (older than {$days} days)\n";
            break;
            
        case 'report':
            $hours = (int)($argv[2] ?? 24);
            $report = $handler->generateErrorReport($hours);
            echo json_encode($report, JSON_PRETTY_PRINT) . "\n";
            break;
            
        case 'test':
            $handler->log("Test log message", SEOErrorHandler::LOG_INFO, ['test' => true]);
            $handler->log("Test warning", SEOErrorHandler::LOG_WARNING, ['test' => true]);
            $handler->log("Test error", SEOErrorHandler::LOG_ERROR, ['test' => true]);
            echo "Test messages logged successfully\n";
            break;
            
        default:
            echo "IT-ERA SEO Error Handler\n\n";
            echo "Usage: php seo-error-handler.php [command] [options]\n\n";
            echo "Commands:\n";
            echo "  status              Show system status\n";
            echo "  cleanup [days]      Clean up old log files (default: 30 days)\n";
            echo "  report [hours]      Generate error report (default: 24 hours)\n";
            echo "  test                Log test messages\n";
            echo "  help                Show this help message\n";
            break;
    }
}
?>