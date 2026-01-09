<?php
// src/bootstrap.php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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
