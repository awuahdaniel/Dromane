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

// This is a bridge for GitHub Auth.
// Similar to the Google bridge, it receives user info after successful GitHub OAuth
// performed by the frontend (or a redirect flow).

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->github_id) || !isset($data->email)) {
    http_response_code(400);
    echo json_encode(["error" => "Incomplete GitHub user data"]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE email = ?");
    $stmt->execute([$data->email]);
    $user = $stmt->fetch();

    if (!$user) {
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$data->name, $data->email, password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT)]);
        $userId = $pdo->lastInsertId();
        $user = ["id" => $userId, "name" => $data->name, "email" => $data->email];
    }

    $payload = [
        "iat" => time(),
        "exp" => time() + (60 * 60 * 24),
        "aud" => "dromane.ai",
        "data" => [
            "id" => $user['id'],
            "name" => $user['name'],
            "email" => $user['email']
        ]
    ];

    $jwt = generate_jwt($payload);

    echo json_encode([
        "message" => "GitHub login successful",
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
