<?php
session_start();
include("config.php");

// Check login and admin
if (!isset($_SESSION['user']) || $_SESSION['dept'] != 3) {
    header("Location: login.php");
    exit();
}

// Get today's date
$today = date('Y-m-d');

// Get logged-in collector's EmpID from session - FIXED: It's stored in $_SESSION['user']
$emp_id = $_SESSION['user'] ?? 0;

// Query to get today's total collection for this collector
$daily_collection = 0.00;

if ($emp_id > 0) {
    $query = "SELECT COALESCE(SUM(Amount), 0) as daily_total 
              FROM tblpaymenthistory 
              WHERE EmpID = ? 
              AND PaymentDate = ?";
    
    if ($stmt = $conn->prepare($query)) {
        $stmt->bind_param("is", $emp_id, $today);
        $stmt->execute();
        $stmt->bind_result($daily_collection);
        $stmt->fetch();
        $stmt->close();
    }
}

// Format the amount with PHP number format
$formatted_collection = number_format($daily_collection, 2);

// If logged in properly, show the admin page
include("../html/collector.html");
?>