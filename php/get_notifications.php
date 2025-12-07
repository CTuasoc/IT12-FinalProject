<?php
// get_notifications.php
header('Content-Type: application/json');
session_start();
include("config.php"); // Ensure this path is correct and sets up $conn

// --- 1. Authorization Check ---
if (!isset($_SESSION['user']) || $_SESSION['dept'] != 1) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access. Must be logged in as an Admin.'
    ]);
    exit();
}

// --- 2. Determine Scope (Unread vs. All) ---
$all = isset($_GET['all']) && $_GET['all'] == '1';

// --- 3. Construct SQL Query ---
if ($all) {
    // For the "View All" modal: Fetch ALL notifications
    $sql = "SELECT notif_id, notif_msg, type, is_read, meta, created_at FROM tblnotifications ORDER BY created_at DESC";
} else {
    // Default for the dashboard widget: Fetch only UNREAD notifications
    $sql = "SELECT notif_id, notif_msg, type, is_read, meta, created_at FROM tblnotifications WHERE is_read = 0 ORDER BY created_at DESC";
}

// --- 4. Execute Query and Fetch Results ---
$res = $conn->query($sql);
$notifs = [];
if ($res) {
    while ($row = $res->fetch_assoc()) {
        // Decode meta JSON if it exists
        if (!empty($row['meta'])) {
            $row['meta'] = json_decode($row['meta'], true); // true for associative array
        } else {
            $row['meta'] = null;
        }
        $notifs[] = $row;
    }
    $res->free();
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database query failed: ' . $conn->error
    ]);
    exit();
}

$conn->close();

// --- 5. Return JSON Response ---
echo json_encode([
    'success' => true,
    'notifications' => $notifs
]);
?>