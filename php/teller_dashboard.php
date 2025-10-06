<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit();
}

// Include the dashboard HTML
include("../html/teller_dashboard.html");
?>
