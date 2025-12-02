<?php
session_start();
include("config.php");

// Check login and collector department
if (!isset($_SESSION['user']) || $_SESSION['dept'] != 3) {
    header("Location: login.php");
    exit();
}

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
$html = file_get_contents("../html/payments.html");

// Replace placeholder with actual home page
$html = str_replace('{{HOME_PAGE}}', $homePage, $html);

echo $html;
?>

