<?php

function startGoogleOAuth() {
    $host = $_SERVER['HTTP_HOST'];
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $baseUrl = "$protocol://$host";
    
    $query = http_build_query([
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'redirect_uri' => "$baseUrl/auth/google/callback",
        'response_type' => 'code',
        'scope' => 'openid email profile',
        'prompt' => 'select_account'
    ]);

    header("Location: https://accounts.google.com/o/oauth2/v2/auth?$query");
    exit;
}

function handleGoogleCallback() {
    if (!isset($_GET['code'])) {
        die('Authorization code missing');
    }

    // Exchange code for token
    $response = file_get_contents(
        'https://oauth2.googleapis.com/token',
        false,
        stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/x-www-form-urlencoded",
                'content' => http_build_query([
                    'code' => $_GET['code'],
                    'client_id' => env('GOOGLE_CLIENT_ID'),
                    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
                    'redirect_uri' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . "://" . $_SERVER['HTTP_HOST'] . "/auth/google/callback",
                    'grant_type' => 'authorization_code'
                ])
            ]
        ])
    );

    $token = json_decode($response, true);

    if (!isset($token['access_token'])) {
        die('Google token exchange failed');
    }

    // Fetch user profile
    $ch = curl_init('https://www.googleapis.com/oauth2/v2/userinfo?access_token=' . $token['access_token']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $profileResponse = curl_exec($ch);
    curl_close($ch);
    
    $profile = json_decode($profileResponse, true);

    if (!isset($profile['email'])) {
        die('Failed to fetch Google profile');
    }

    // Create or fetch user (simplified)
    $userId = $profile['id'];
    $email = $profile['email'];

    // Issue JWT
    $jwt = createJWT($userId, $email);

    // Send back to React
    $reactUrl = env('FRONTEND_URL');
    header("Location: $reactUrl/auth/callback?token=$jwt");
    exit;
}
