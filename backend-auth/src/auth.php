<?php

function loginUser() {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->email) || !isset($data->password)) {
        http_response_code(400);
        echo json_encode(["error" => "Email and password are required"]);
        return;
    }

    $pdo = db();
    $stmt = $pdo->prepare("SELECT id, name, email, password_hash, profile_picture FROM users WHERE email = ?");
    $stmt->execute([$data->email]);
    $user = $stmt->fetch();

    if ($user && password_verify($data->password, $user['password_hash'])) {
        $jwt = createJWT($user['id'], $user['email']);
        
        echo json_encode([
            "message" => "Login successful",
            "token" => $jwt,
            "user" => [
                "id" => $user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "profile_picture" => $user['profile_picture']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "Invalid email or password"]);
    }
}

function registerUser() {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->name) || !isset($data->email) || !isset($data->password)) {
        http_response_code(400);
        echo json_encode(["error" => "Name, email and password are required"]);
        return;
    }

    $name = trim($data->name);
    $email = filter_var($data->email, FILTER_SANITIZE_EMAIL);
    $pdo = db();

    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "User already exists"]);
        return;
    }

    // Hash password
    $password_hash = password_hash($data->password, PASSWORD_BCRYPT);

    // Insert user
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
    if ($stmt->execute([$name, $email, $password_hash])) {
        http_response_code(201);
        echo json_encode(["message" => "User registered successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Registration failed"]);
    }
}

function updateProfile() {
    $user = validateJWT();
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->name) || !isset($data->email)) {
        http_response_code(400);
        echo json_encode(["error" => "Name and email are required"]);
        return;
    }

    $name = trim($data->name);
    $email = filter_var($data->email, FILTER_SANITIZE_EMAIL);
    $pdo = db();

    // Check if email is taken by another user
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $stmt->execute([$email, $user->sub]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Email already in use"]);
        return;
    }

    // Get current profile picture to maintain it in response
    $stmt = $pdo->prepare("SELECT profile_picture FROM users WHERE id = ?");
    $stmt->execute([$user->sub]);
    $currentUserRecord = $stmt->fetch();
    $profile_picture = $currentUserRecord ? $currentUserRecord['profile_picture'] : null;

    $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
    if ($stmt->execute([$name, $email, $user->sub])) {
        // Generate new token if email changed, or just return success with updated user info
        $newToken = createJWT($user->sub, $email);
        echo json_encode([
            "message" => "Profile updated successfully",
            "token" => $newToken,
            "user" => [
                "id" => $user->sub,
                "name" => $name,
                "email" => $email,
                "profile_picture" => $profile_picture
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update profile"]);
    }
}

function changePassword() {
    $user = validateJWT();
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->currentPassword) || !isset($data->newPassword)) {
        http_response_code(400);
        echo json_encode(["error" => "Current and new password required"]);
        return;
    }

    $pdo = db();
    
    // Verify current password
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$user->sub]);
    $currentUser = $stmt->fetch();

    if (!$currentUser || !password_verify($data->currentPassword, $currentUser['password_hash'])) {
        http_response_code(401);
        echo json_encode(["error" => "Incorrect current password"]);
        return;
    }

    $newHash = password_hash($data->newPassword, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    
    if ($stmt->execute([$newHash, $user->sub])) {
        echo json_encode(["message" => "Password changed successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update password"]);
    }
}

function uploadProfilePicture() {
    $user = validateJWT();
    
    if (!isset($_FILES['picture'])) {
        http_response_code(400);
        echo json_encode(["error" => "No file uploaded"]);
        return;
    }

    $file = $_FILES['picture'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(["error" => "Only JPG, PNG, GIF, and WebP are allowed"]);
        return;
    }

    if ($file['size'] > 2 * 1024 * 1024) { // 2MB limit
        http_response_code(400);
        echo json_encode(["error" => "File size must be less than 2MB"]);
        return;
    }

    $uploadDir = __DIR__ . '/../public/uploads/profiles/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = $user->sub . '_' . time() . '.' . $extension;
    $targetFile = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $targetFile)) {
        $pdo = db();
        
        // Delete old picture if it exists
        $stmt = $pdo->prepare("SELECT profile_picture FROM users WHERE id = ?");
        $stmt->execute([$user->sub]);
        $oldPic = $stmt->fetchColumn();
        if ($oldPic && file_exists(__DIR__ . '/../public/' . $oldPic)) {
            unlink(__DIR__ . '/../public/' . $oldPic);
        }

        $relativePath = 'uploads/profiles/' . $filename;
        $stmt = $pdo->prepare("UPDATE users SET profile_picture = ? WHERE id = ?");
        $stmt->execute([$relativePath, $user->sub]);

        // Get updated user data
        $stmt = $pdo->prepare("SELECT id, name, email, profile_picture FROM users WHERE id = ?");
        $stmt->execute([$user->sub]);
        $updatedUser = $stmt->fetch();

        echo json_encode([
            "message" => "Profile picture updated",
            "profile_picture" => $relativePath,
            "user" => $updatedUser
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to save file"]);
    }
}
