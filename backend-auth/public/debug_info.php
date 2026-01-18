<?php
header('Content-Type: text/plain');
echo "INI: " . php_ini_loaded_file() . "\n";
echo "PDO drivers: " . implode(", ", pdo_drivers()) . "\n";
echo "Extensions: " . implode(", ", get_loaded_extensions());
