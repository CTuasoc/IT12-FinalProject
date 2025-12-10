<?php
// clear_all_notifications.php
header('Content-Type: application/json');
session_start();
// Assuming config.php contains the database connection details
include("config.php"); 

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit();
}

// Authorization Check (Ensure only logged-in admin can clear)
// Adjust $_SESSION['dept'] == 1 if your admin department ID is different
if (!isset($_SESSION['user']) || $_SESSION['dept'] != 1) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit();
}

// SQL to mark ALL UNREAD notifications as read (is_read = 1)
$sql = "UPDATE tblnotifications SET is_read = 1 WHERE is_read = 0";

if ($conn->query($sql)) {
    $rows_cleared = $conn->affected_rows;
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'message' => "Successfully marked $rows_cleared notifications as read."
    ]);
} else {
    $conn->close();
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => "Database error: Failed to clear notifications."
    ]);
}
?>