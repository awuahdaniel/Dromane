<?php
/**
 * Google OAuth - Step 1: Redirect to Google
 */

require_once __DIR__ . '/config.php';

$clientId = env('GOOGLE_CLIENT_ID');
$redirectUri = 'http://localhost:8000/oauth_google_callback.php';

if (empty($clientId)) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'GOOGLE_CLIENT_ID not configured in .env']);
    exit;
}

$params = http_build_query([
    'client_id' => $clientId,
    'redirect_uri' => $redirectUri,
    'response_type' => 'code',
    'scope' => 'openid email profile',
    'access_type' => 'offline',
    'prompt' => 'select_account'
]);

$googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth?{$params}";

header("Location: {$googleAuthUrl}");
exit;
?>
