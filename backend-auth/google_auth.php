<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';
require_once 'jwt_helper.php';

// This is a bridge for Google Auth. 
// In a production app, we would use google-auth-library-php to verify the ID Token.
// For this MVP demonstration, we receive the Google ID and user info from the frontend
// after the user has successfully signed in via the Google Identity Services.

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->google_id) || !isset($data->email)) {
    http_response_code(400);
    echo json_encode(["error" => "Incomplete Google user data"]);
    exit;
}

try {
    // Check if user exists with this Google ID or Email
    $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE email = ?");
    $stmt->execute([$data->email]);
    $user = $stmt->fetch();

    if (!$user) {
        // Create new user for this Google account
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
        // We use a dummy password hash as they login via Google
        $stmt->execute([$data->name, $data->email, password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT)]);
        $userId = $pdo->lastInsertId();
        $user = ["id" => $userId, "name" => $data->name, "email" => $data->email];
    }

    // Generate our system JWT for the authenticated user
    $payload = [
        "iat" => time(),
        "exp" => time() + (60 * 60 * 24), // 24 hours
        "aud" => "dromane.ai",
        "data" => [
            "id" => $user['id'],
            "name" => $user['name'],
            "email" => $user['email']
        ]
    ];

    $jwt = generate_jwt($payload);

    echo json_encode([
        "message" => "Google login successful",
        "token" => $jwt,
        "user" => [
            "id" => $user['id'],
            "name" => $user['name'],
            "email" => $user['email']
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>
