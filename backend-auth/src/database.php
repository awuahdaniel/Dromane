<?php

function db() {
    static $pdo = null;

    if ($pdo === null) {
        $host = env('DB_HOST');
        $port = env('DB_PORT', '5432');
        $dbname = env('DB_NAME');
        $user = env('DB_USER');
        $pass = env('DB_PASS');

        $pdo = new PDO(
            "pgsql:host=$host;port=$port;dbname=$dbname",
            $user,
            $pass,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );
    }

    return $pdo;
}
