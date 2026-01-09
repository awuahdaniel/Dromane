<?php

function startGithubOAuth() {
    $host = $_SERVER['HTTP_HOST'];
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    
    $query = http_build_query([
        'client_id' => env('GITHUB_CLIENT_ID'),
        'redirect_uri' => "$protocol://$host/auth/github/callback",
        'scope' => 'user:email',
        'allow_signup' => 'true'
    ]);

    header("Location: https://github.com/login/oauth/authorize?$query");
    exit;
}

function handleGithubCallback() {
    if (!isset($_GET['code'])) {
        die('Authorization code missing');
    }

    // Exchange code for token
    $ch = curl_init('https://github.com/login/oauth/access_token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'code' => $_GET['code'],
        'client_id' => env('GITHUB_CLIENT_ID'),
        'client_secret' => env('GITHUB_CLIENT_SECRET'),
        'redirect_uri' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . "://" . $_SERVER['HTTP_HOST'] . "/auth/github/callback"
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json'
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $token = json_decode($response, true);

    if (!isset($token['access_token'])) {
        die('GitHub token exchange failed: ' . ($token['error_description'] ?? 'Unknown error'));
    }

    $accessToken = $token['access_token'];

    // Fetch user profile
    $ch = curl_init('https://api.github.com/user');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer {$accessToken}",
        "User-Agent: Dromane-AI"
    ]);
    $profileResponse = curl_exec($ch);
    curl_close($ch);
    
    $profile = json_decode($profileResponse, true);

    // Fetch email if private
    $email = $profile['email'] ?? null;
    if (empty($email)) {
        $ch = curl_init('https://api.github.com/user/emails');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer {$accessToken}",
            "User-Agent: Dromane-AI"
        ]);
        $emailsResponse = curl_exec($ch);
        curl_close($ch);
        $emails = json_decode($emailsResponse, true);
        
        if (is_array($emails)) {
            foreach ($emails as $e) {
                if ($e['primary'] && $e['verified']) {
                    $email = $e['email'];
                    break;
                }
            }
        }
    }

    if (empty($email)) {
        die('Failed to fetch GitHub email');
    }

    $userId = $profile['id'];

    // Issue JWT
    $jwt = createJWT($userId, $email);

    // Send back to React
    $reactUrl = env('FRONTEND_URL');
    header("Location: $reactUrl/auth/callback?token=$jwt&provider=github");
    exit;
}
