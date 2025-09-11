<?php
/**
 * Microsoft 365 Quote Form Processor
 * Handles form submission, validation, and email sending
 */

// Start session for CSRF protection
session_start();

// Enable error reporting for debugging (disable in production)
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set content type to JSON
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

// Include email configuration
require_once __DIR__ . '/../api/email-config.php';

// CORS headers (if needed for AJAX)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Log function for debugging and tracking
function logActivity($message, $level = 'INFO') {
    $logFile = __DIR__ . '/../logs/microsoft365-form.log';
    $logDir = dirname($logFile);
    
    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $logMessage = "[{$timestamp}] [{$level}] [IP: {$ip}] {$message}" . PHP_EOL;
    
    file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
}

// Response function
function sendResponse($success, $message, $data = null) {
    $response = [
        'success' => $success,
        'message' => $message,
        'timestamp' => date('c')
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

// Rate limiting
function checkRateLimit($ip) {
    $rateLimitFile = __DIR__ . '/../logs/rate-limit-' . md5($ip) . '.json';
    $maxRequests = 5; // Max 5 requests
    $timeWindow = 300; // 5 minutes
    
    $now = time();
    $requests = [];
    
    if (file_exists($rateLimitFile)) {
        $data = json_decode(file_get_contents($rateLimitFile), true);
        $requests = $data['requests'] ?? [];
    }
    
    // Remove old requests
    $requests = array_filter($requests, function($timestamp) use ($now, $timeWindow) {
        return ($now - $timestamp) < $timeWindow;
    });
    
    if (count($requests) >= $maxRequests) {
        return false;
    }
    
    // Add current request
    $requests[] = $now;
    file_put_contents($rateLimitFile, json_encode(['requests' => $requests]));
    
    return true;
}

// Input sanitization
function sanitizeInput($input, $type = 'string') {
    if ($input === null || $input === '') {
        return '';
    }
    
    switch ($type) {
        case 'email':
            return filter_var(trim($input), FILTER_SANITIZE_EMAIL);
        case 'phone':
            return preg_replace('/[^+\d\s\-\(\)]/', '', trim($input));
        case 'html':
            return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
        case 'int':
            return (int) $input;
        default:
            return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }
}

// Validation functions
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function validatePhone($phone) {
    if (empty($phone)) return true; // Optional field
    return preg_match('/^[+]?[\d\s\-\(\)]{6,20}$/', $phone);
}

function validateName($name) {
    return !empty($name) && strlen($name) >= 2 && strlen($name) <= 100;
}

// Main processing
try {
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        logActivity('Invalid request method: ' . $_SERVER['REQUEST_METHOD'], 'WARNING');
        sendResponse(false, 'Metodo di richiesta non valido');
    }
    
    // Rate limiting
    $clientIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!checkRateLimit($clientIP)) {
        logActivity('Rate limit exceeded for IP: ' . $clientIP, 'WARNING');
        sendResponse(false, 'Troppe richieste. Riprova tra qualche minuto.');
    }
    
    // CSRF protection (if using sessions)
    if (isset($_SESSION['csrf_token']) && isset($_POST['csrf_token'])) {
        if (!hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
            logActivity('CSRF token mismatch', 'WARNING');
            sendResponse(false, 'Token di sicurezza non valido');
        }
    }
    
    // Collect and sanitize form data
    $formData = [
        'nome' => sanitizeInput($_POST['nome'] ?? ''),
        'azienda' => sanitizeInput($_POST['azienda'] ?? ''),
        'email' => sanitizeInput($_POST['email'] ?? '', 'email'),
        'telefono' => sanitizeInput($_POST['telefono'] ?? '', 'phone'),
        'utenti' => sanitizeInput($_POST['utenti'] ?? '', 'int'),
        'piano_interesse' => sanitizeInput($_POST['piano_interesse'] ?? ''),
        'messaggio' => sanitizeInput($_POST['messaggio'] ?? ''),
        'city' => sanitizeInput($_POST['city'] ?? 'Milano'),
        'source_page' => sanitizeInput($_POST['source_page'] ?? 'Microsoft 365 Milano'),
        'user_agent' => sanitizeInput($_SERVER['HTTP_USER_AGENT'] ?? ''),
        'ip_address' => $clientIP,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Validation
    $errors = [];
    
    if (!validateName($formData['nome'])) {
        $errors[] = 'Nome non valido (minimo 2 caratteri)';
    }
    
    if (!validateEmail($formData['email'])) {
        $errors[] = 'Email non valida';
    }
    
    if (!validatePhone($formData['telefono'])) {
        $errors[] = 'Numero di telefono non valido';
    }
    
    if (empty($formData['utenti']) || $formData['utenti'] < 1) {
        $errors[] = 'Numero di utenti non valido';
    }
    
    if (empty($formData['piano_interesse'])) {
        $errors[] = 'Piano di interesse non selezionato';
    }
    
    // Honeypot check (anti-spam)
    if (!empty($_POST['website'])) {
        logActivity('Honeypot triggered for email: ' . $formData['email'], 'WARNING');
        sendResponse(false, 'Richiesta non valida');
    }
    
    if (!empty($errors)) {
        logActivity('Validation errors: ' . implode(', ', $errors));
        sendResponse(false, 'Errori di validazione: ' . implode(', ', $errors));
    }
    
    // Log successful form submission
    logActivity("Form submitted: {$formData['nome']} ({$formData['email']}) - {$formData['utenti']} utenti");
    
    // Send emails
    $emailConfig = new EmailConfig();
    
    // Send notification email to IT-ERA
    $notificationSent = $emailConfig->sendNotificationEmail($formData);
    
    // Send auto-response to customer
    $autoResponseSent = $emailConfig->sendAutoResponse($formData);
    
    // Save to database/file (optional)
    $saved = saveQuoteRequest($formData);
    
    if ($notificationSent && $autoResponseSent) {
        logActivity("Emails sent successfully for: {$formData['email']}");
        sendResponse(true, 'Richiesta inviata con successo! Riceverai presto una risposta personalizzata.', [
            'notification_sent' => $notificationSent,
            'auto_response_sent' => $autoResponseSent,
            'saved' => $saved
        ]);
    } else {
        logActivity("Email sending failed for: {$formData['email']}", 'ERROR');
        sendResponse(false, 'Si è verificato un errore nell\'invio. Riprova o contattaci direttamente.');
    }
    
} catch (Exception $e) {
    logActivity('Exception: ' . $e->getMessage(), 'ERROR');
    sendResponse(false, 'Si è verificato un errore interno. Riprova più tardi.');
}

// Save quote request to file
function saveQuoteRequest($data) {
    try {
        $quotesDir = __DIR__ . '/../data/quotes';
        if (!file_exists($quotesDir)) {
            mkdir($quotesDir, 0755, true);
        }
        
        $filename = $quotesDir . '/quote-' . date('Y-m-d-H-i-s') . '-' . uniqid() . '.json';
        $result = file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        
        return $result !== false;
    } catch (Exception $e) {
        logActivity('Failed to save quote: ' . $e->getMessage(), 'ERROR');
        return false;
    }
}

// Generate CSRF token for next request
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
?>