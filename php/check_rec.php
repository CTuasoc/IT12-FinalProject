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

// Determine home page based on department
$homePage = "login.php"; // default
if ($_SESSION['dept'] == 1) {
    $homePage = "admin.php";
} else if ($_SESSION['dept'] == 2) {
    $homePage = "secretary.php";
} else if ($_SESSION['dept'] == 3) {
    $homePage = "collector.php";
}

// Load the shared HTML
$html = file_get_contents("../html/check_rec.html");

// Replace placeholder with actual home page
$html = str_replace('{{HOME_PAGE}}', $homePage, $html);

echo $html;

// Pass admin info to JavaScript
echo "<script>const isAdmin = " . ($isAdmin ? 'true' : 'false') . ";</script>";
?>
