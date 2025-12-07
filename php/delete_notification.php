<?php
header('Content-Type: application/json');
session_start();
include("config.php");

// Check if user is logged in and is admin
if (!isset($_SESSION['user']) || $_SESSION['dept'] != 1) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

// Get the notification ID from POST data
$notificationId = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);

if (!$notificationId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid notification ID']);
    exit;
}

try {
    // Prepare and execute the delete query
    $stmt = $conn->prepare("DELETE FROM tblnotifications WHERE notif_id = ?");
    $stmt->bind_param("i", $notificationId);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Notification deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Notification not found or already deleted']);
    }
    
    $stmt->close();
} catch (Exception $e) {
    error_log("Error deleting notification: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error deleting notification']);
}

$conn->close();
?>