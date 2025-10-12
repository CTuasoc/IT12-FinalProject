<?php
session_start();
include("config.php");

// Check if user is logged in
if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit();
}

// Pass whether the user is admin (dept == 1)
$isAdmin = ($_SESSION['dept'] == 1);

// Load the shared HTML
readfile("../html/check_rec.html");

// Pass admin info to JavaScript
echo "<script>const isAdmin = " . ($isAdmin ? 'true' : 'false') . ";</script>";
?>
