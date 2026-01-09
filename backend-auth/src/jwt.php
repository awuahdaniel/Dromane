<?php
use Firebase\JWT\JWT;

function createJWT($userId, $email) {
    $payload = [
        'sub' => $userId,
        'email' => $email,
        'iat' => time(),
        'exp' => time() + (int) env('JWT_EXPIRY')
    ];

    return JWT::encode($payload, env('JWT_SECRET'), 'HS256');
}

function validateJWT() {
    $headers = apache_request_headers();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

    if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(["error" => "No token provided"]);
        exit;
    }

    try {
        $decoded = JWT::decode($matches[1], new Firebase\JWT\Key(env('JWT_SECRET'), 'HS256'));
        return $decoded;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(["error" => "Invalid token"]);
        exit;
    }
}
