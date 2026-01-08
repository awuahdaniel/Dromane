<?php
/**
 * GitHub OAuth - Step 2: Handle Callback
 * Exchanges code for token, fetches user info, creates/finds user, issues JWT
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/jwt_helper.php';

$frontendUrl = 'http://localhost:5173';
$redirectUri = 'http://localhost:8000/oauth_github_callback.php';

// ============================================
// CHECK FOR AUTHORIZATION CODE
// ============================================

if (!isset($_GET['code'])) {
    $error = $_GET['error_description'] ?? $_GET['error'] ?? 'No authorization code received';
    header("Location: {$frontendUrl}/login?error=" . urlencode($error));
    exit;
}

$code = $_GET['code'];
$clientId = env('GITHUB_CLIENT_ID');
$clientSecret = env('GITHUB_CLIENT_SECRET');

if (empty($clientId) || empty($clientSecret)) {
    header("Location: {$frontendUrl}/login?error=" . urlencode('GitHub OAuth not configured'));
    exit;
}

// ============================================
// EXCHANGE CODE FOR ACCESS TOKEN
// ============================================

$tokenUrl = 'https://github.com/login/oauth/access_token';
$tokenData = [
    'code' => $code,
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'redirect_uri' => $redirectUri
];

$ch = curl_init($tokenUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/x-www-form-urlencoded'
]);
$response = curl_exec($ch);
curl_close($ch);

$tokenResult = json_decode($response, true);

if (!isset($tokenResult['access_token'])) {
    $error = $tokenResult['error_description'] ?? 'Failed to get access token from GitHub';
    error_log("GitHub token error: " . json_encode($tokenResult));
    header("Location: {$frontendUrl}/login?error=" . urlencode($error));
    exit;
}

$accessToken = $tokenResult['access_token'];

// ============================================
// FETCH USER INFO FROM GITHUB
// ============================================

$userInfoUrl = 'https://api.github.com/user';
$ch = curl_init($userInfoUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer {$accessToken}",
    "User-Agent: Dromane-AI",
    "Accept: application/vnd.github.v3+json"
]);
$userResponse = curl_exec($ch);
curl_close($ch);

$githubUser = json_decode($userResponse, true);

// ============================================
// FETCH EMAIL (may be private on GitHub)
// ============================================

$email = $githubUser['email'] ?? null;

if (empty($email)) {
    // Fetch email from /user/emails endpoint
    $emailUrl = 'https://api.github.com/user/emails';
    $ch = curl_init($emailUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer {$accessToken}",
        "User-Agent: Dromane-AI",
        "Accept: application/vnd.github.v3+json"
    ]);
    $emailResponse = curl_exec($ch);
    curl_close($ch);
    
    $emails = json_decode($emailResponse, true);
    
    if (is_array($emails)) {
        foreach ($emails as $e) {
            if (!empty($e['primary']) && !empty($e['verified'])) {
                $email = $e['email'];
                break;
            }
        }
        // Fallback to first email
        if (empty($email) && !empty($emails[0]['email'])) {
            $email = $emails[0]['email'];
        }
    }
}

if (empty($email)) {
    error_log("GitHub: Could not get email. User data: " . json_encode($githubUser));
    header("Location: {$frontendUrl}/login?error=" . urlencode('Could not get email from GitHub. Make sure your GitHub email is public or verified.'));
    exit;
}

$name = $githubUser['name'] ?? $githubUser['login'] ?? 'GitHub User';
$githubId = $githubUser['id'];

error_log("GitHub OAuth success for: {$email}");

// ============================================
// CREATE OR FIND USER IN DATABASE
// ============================================

try {
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        // Create new user
        $randomPassword = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$name, $email, $randomPassword]);
        $userId = $pdo->lastInsertId();
        $user = ["id" => $userId, "name" => $name, "email" => $email];
        error_log("Created new user via GitHub OAuth: {$email}");
    } else {
        error_log("Found existing user via GitHub OAuth: {$email}");
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
    
    header("Location: {$frontendUrl}/auth/callback?token={$jwt}&provider=github");
    exit;

} catch (PDOException $e) {
    error_log("Database error in GitHub OAuth: " . $e->getMessage());
    header("Location: {$frontendUrl}/login?error=" . urlencode('Database error: ' . $e->getMessage()));
    exit;
}
?>
