<?php

function handleDocuments() {
    // Enable CORS if not already handled by router/server config
    // (Assuming index.php or .htaccess handles basic CORS, but explicit headers help)
    
    $user = validateJWT();
    $userId = $user->sub;
    $pdo = db();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch documents for the user
        try {
            $stmt = $pdo->prepare("SELECT id, filename, file_path, upload_date FROM documents WHERE user_id = ? ORDER BY upload_date DESC");
            $stmt->execute([$userId]);
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
            return;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO documents (user_id, filename, file_path) VALUES (?, ?, ?)");
            $stmt->execute([$userId, $data->filename, $data->file_path]);
            echo json_encode(["message" => "Document record created", "id" => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
    } else {
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
    }
}
