<?php

function env($key) {
    if (!isset($_ENV[$key])) {
        throw new Exception("Env variable $key not found");
    }
    return $_ENV[$key];
}
