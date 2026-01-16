<?php
// src/bootstrap.php

// Disable HTML errors
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Set default content type
header('Content-Type: application/json');

// Custom error handler to return JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) {
        return;
    }
    http_response_code(500);
    echo json_encode([
        "error" => "PHP Error",
        "message" => $errstr,
        "file" => basename($errfile),
        "line" => $errline
    ]);
    exit;
});

// Custom exception handler
set_exception_handler(function($e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Uncaught Exception",
        "message" => $e->getMessage(),
        "file" => basename($e->getFile()),
        "line" => $e->getLine(),
        "trace" => $e->getTraceAsString()
    ]);
    exit;
});

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// Load .env
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// CORS
$frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: $frontendUrl");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Validate required keys
$required = [
    'JWT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET'
];

foreach ($required as $key) {
    if (!isset($_ENV[$key]) || $_ENV[$key] === '') {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Server misconfiguration',
            'missing_env' => $key
        ]);
        exit;
    }
}
