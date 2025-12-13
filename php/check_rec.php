<?php
session_start();
include("config.php");

// Check if user is logged in
if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit();
}

// Get user ID and admin status from session
$userID = $_SESSION['user'];
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

// Conditionally include the delete button HTML
$deleteButtonHtml = $isAdmin ? 
    '<button class="delete-btn" id="deleteBtn">Delete Customer</button>' : 
    '<!-- Delete button hidden for non-admin users -->';

// Replace a placeholder in the HTML with the conditional button
$html = str_replace('<!-- DELETE_BUTTON_PLACEHOLDER -->', $deleteButtonHtml, $html);

echo $html;

// Pass admin status to JavaScript
echo "<script>";
echo "const isAdmin = " . ($isAdmin ? 'true' : 'false') . ";";
echo "</script>";
?>