<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';
require_once 'jwt_helper.php';

// Get Authorization Header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$token = $matches[1];
$user_data = verify_jwt($token);

if (!$user_data) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid token"]);
    exit;
}

$user_id = $user_data['data']['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch documents for the user
    try {
        $stmt = $pdo->prepare("SELECT id, filename, file_path, upload_date FROM documents WHERE user_id = ? ORDER BY upload_date DESC");
        $stmt->execute([$user_id]);
        $documents = $stmt->fetchAll();
        echo json_encode($documents);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Add new document record
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->filename) || !isset($data->file_path)) {
        http_response_code(400);
        echo json_encode(["error" => "Filename and file_path are required"]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO documents (user_id, filename, file_path) VALUES (?, ?, ?)");
        $stmt->execute([$user_id, $data->filename, $data->file_path]);
        echo json_encode(["message" => "Document record created", "id" => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
?>
