<?php
/**
 * Dromane.ai - Configuration & Bootstrap
 * Loads environment variables and establishes database connection
 */

// ============================================
// ENVIRONMENT LOADING
// ============================================

function loadEnv($path) {
    if (!file_exists($path)) {
        error_log("Warning: .env file not found at: $path");
        return false;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Skip lines without =
        if (strpos($line, '=') === false) {
            continue;
        }
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        // Remove quotes if present
        $value = trim($value, '"\'');
        
        if (!empty($name)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
    return true;
}

// Load from project root .env
$envLoaded = loadEnv(__DIR__ . '/../.env');

// Fallback: try loading from current directory
if (!$envLoaded) {
    loadEnv(__DIR__ . '/.env');
}

// ============================================
// HELPER FUNCTION
// ============================================

function env($key, $default = null) {
    $value = getenv($key);
    if ($value === false) {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? $default;
    }
    return $value;
}

// ============================================
// VALIDATE REQUIRED ENV VARIABLES
// ============================================

$required = ['JWT_SECRET', 'DB_HOST', 'DB_NAME', 'DB_USER'];
$missing = [];

foreach ($required as $key) {
    if (empty(env($key))) {
        $missing[] = $key;
    }
}

if (!empty($missing)) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'error' => 'Missing required environment variables: ' . implode(', ', $missing),
        'hint' => 'Check your .env file in the project root'
    ]);
    exit;
}

// ============================================
// DATABASE CONNECTION
// ============================================

$host = env('DB_HOST', 'localhost');
$db = env('DB_NAME', 'dromane_db');
$user = env('DB_USER', 'root');
$pass = env('DB_PASS', '');
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
        'hint' => 'Make sure MySQL is running in XAMPP'
    ]);
    exit;
}

// ============================================
// JWT CONFIGURATION
// ============================================

$jwt_secret = env('JWT_SECRET');
$jwt_expiry = (int) env('JWT_EXPIRY', 86400); // Default 24 hours

// Log loaded config for debugging (remove in production)
error_log("Config loaded: DB={$db}, JWT_SECRET length=" . strlen($jwt_secret));
?>
