<?php
/**
 * GitHub OAuth - Step 1: Redirect to GitHub
 */

require_once __DIR__ . '/config.php';

$clientId = env('GITHUB_CLIENT_ID');
$redirectUri = 'http://localhost:8000/oauth_github_callback.php';

if (empty($clientId)) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'GITHUB_CLIENT_ID not configured in .env']);
    exit;
}

$params = http_build_query([
    'client_id' => $clientId,
    'redirect_uri' => $redirectUri,
    'scope' => 'user:email',
    'allow_signup' => 'true'
]);

$githubAuthUrl = "https://github.com/login/oauth/authorize?{$params}";

header("Location: {$githubAuthUrl}");
exit;
?>
