<?php
// get_daily_collection.php
session_start();
include("config.php");

header('Content-Type: application/json');

// Check if user is logged in and is a collector
if (!isset($_SESSION['user']) || $_SESSION['dept'] != 3) {
    echo json_encode([
        'success' => false, 
        'error' => 'Unauthorized access. Please login.',
        'redirect' => 'login.php'
    ]);
    exit();
}

// Get employee ID from session (using 'user' key as in your login.php)
$emp_id = $_SESSION['user']; // Changed from 'user_id' to 'user'

if (!$emp_id) {
    echo json_encode([
        'success' => false, 
        'error' => 'Employee ID not found in session.'
    ]);
    exit();
}

try {
    $today = date('Y-m-d');
    
    // Query to get total collection for today for this collector
    $sql = "SELECT COALESCE(SUM(Amount), 0) as total_collection 
            FROM tblpaymenthistory 
            WHERE EmpID = ? 
            AND DATE(PaymentDate) = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("is", $emp_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $total_collection = 0;
    if ($row = $result->fetch_assoc()) {
        $total_collection = $row['total_collection'];
    }
    
    // Get additional info: number of transactions today
    $sql_count = "SELECT COUNT(*) as transaction_count 
                  FROM tblpaymenthistory 
                  WHERE EmpID = ? 
                  AND DATE(PaymentDate) = ?";
    
    $stmt_count = $conn->prepare($sql_count);
    $stmt_count->bind_param("is", $emp_id, $today);
    $stmt_count->execute();
    $result_count = $stmt_count->get_result();
    
    $transaction_count = 0;
    if ($row_count = $result_count->fetch_assoc()) {
        $transaction_count = $row_count['transaction_count'];
    }
    
    // Get today's date in a nice format
    $today_formatted = date('F j, Y');
    $current_time = date('h:i A');
    
    echo json_encode([
        'success' => true,
        'total_collection' => (float)$total_collection,
        'transaction_count' => (int)$transaction_count,
        'date' => $today,
        'date_formatted' => $today_formatted,
        'current_time' => $current_time,
        'emp_id' => $emp_id
    ]);
    
    $stmt->close();
    $stmt_count->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>