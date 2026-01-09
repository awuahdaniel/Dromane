<?php

require __DIR__ . '/../src/bootstrap.php';
require __DIR__ . '/../src/config.php';
require __DIR__ . '/../src/database.php';
require __DIR__ . '/../src/jwt.php';
require __DIR__ . '/../src/google.php';
require __DIR__ . '/../src/github.php';
require __DIR__ . '/../src/auth.php';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

switch ($path) {
    case '/login':
        loginUser();
        break;

    case '/register':
        registerUser();
        break;

    case '/auth/google':
        startGoogleOAuth();
        break;

    case '/auth/google/callback':
        handleGoogleCallback();
        break;

    case '/auth/github':
        startGithubOAuth();
        break;

    case '/auth/github/callback':
        handleGithubCallback();
        break;

    case '/profile/update':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            updateProfile();
        } else {
            http_response_code(405);
            echo json_encode(["error" => "Method not allowed"]);
        }
        break;

    case '/profile/password':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            changePassword();
        } else {
            http_response_code(405);
            echo json_encode(["error" => "Method not allowed"]);
        }
        break;

    default:
        http_response_code(404);
        echo 'Not Found: ' . $path;
}
