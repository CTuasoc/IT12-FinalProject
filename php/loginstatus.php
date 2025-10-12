<?php
session_start();
include("config.php");

// Check login and admin
if (!isset($_SESSION['user']) || $_SESSION['dept'] != 1) {
    header("Location: login.php");
    exit();
}

// If logged in properly, show the admin page
include("../html/loginstatus.html");
?>