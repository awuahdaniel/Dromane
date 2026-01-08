<?php
/**
 * Google OAuth - Step 2: Handle Callback
 * Exchanges code for token, fetches user info, creates/finds user, issues JWT
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/jwt_helper.php';

$frontendUrl = 'http://localhost:5173';
$redirectUri = 'http://localhost:8000/oauth_google_callback.php';

// ============================================
// CHECK FOR AUTHORIZATION CODE
// ============================================

if (!isset($_GET['code'])) {
    $error = $_GET['error'] ?? 'No authorization code received';
    header("Location: {$frontendUrl}/login?error=" . urlencode($error));
    exit;
}

$code = $_GET['code'];
$clientId = env('GOOGLE_CLIENT_ID');
$clientSecret = env('GOOGLE_CLIENT_SECRET');

if (empty($clientId) || empty($clientSecret)) {
    header("Location: {$frontendUrl}/login?error=" . urlencode('Google OAuth not configured'));
    exit;
}

// ============================================
// EXCHANGE CODE FOR ACCESS TOKEN
// ============================================

$tokenUrl = 'https://oauth2.googleapis.com/token';
$tokenData = [
    'code' => $code,
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'redirect_uri' => $redirectUri,
    'grant_type' => 'authorization_code'
];

$ch = curl_init($tokenUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$tokenResult = json_decode($response, true);

if (!isset($tokenResult['access_token'])) {
    $error = $tokenResult['error_description'] ?? 'Failed to get access token';
    error_log("Google token error: " . json_encode($tokenResult));
    header("Location: {$frontendUrl}/login?error=" . urlencode($error));
    exit;
}

$accessToken = $tokenResult['access_token'];

// ============================================
// FETCH USER INFO FROM GOOGLE
// ============================================

$userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
$ch = curl_init($userInfoUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer {$accessToken}"]);
$userResponse = curl_exec($ch);
curl_close($ch);

$googleUser = json_decode($userResponse, true);

if (!isset($googleUser['email'])) {
    error_log("Google user info error: " . $userResponse);
    header("Location: {$frontendUrl}/login?error=" . urlencode('Failed to get user email from Google'));
    exit;
}

$email = $googleUser['email'];
$name = $googleUser['name'] ?? 'Google User';
$googleId = $googleUser['id'];

error_log("Google OAuth success for: {$email}");

// ============================================
// CREATE OR FIND USER IN DATABASE
// ============================================

try {
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        // Create new user (OAuth users don't need password)
        $randomPassword = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$name, $email, $randomPassword]);
        $userId = $pdo->lastInsertId();
        $user = ["id" => $userId, "name" => $name, "email" => $email];
        error_log("Created new user via Google OAuth: {$email}");
    } else {
        error_log("Found existing user via Google OAuth: {$email}");
    }

    // ============================================
    // GENERATE JWT
    // ============================================
    
    $payload = [
        "iat" => time(),
        "exp" => time() + (int) env('JWT_EXPIRY', 86400),
        "aud" => "dromane.ai",
        "data" => [
            "id" => $user['id'],
            "name" => $user['name'],
            "email" => $user['email']
        ]
    ];

    $jwt = generate_jwt($payload);
    
    // ============================================
    // REDIRECT TO FRONTEND WITH TOKEN
    // ============================================
    
    header("Location: {$frontendUrl}/auth/callback?token={$jwt}&provider=google");
    exit;

} catch (PDOException $e) {
    error_log("Database error in Google OAuth: " . $e->getMessage());
    header("Location: {$frontendUrl}/login?error=" . urlencode('Database error: ' . $e->getMessage()));
    exit;
}
?>
