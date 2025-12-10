<?php
header('Content-Type: application/json');
session_start();
include("config.php");

// Restrict to logged-in staff
if (!isset($_SESSION['user'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit();
}

// Validate ID
$id = intval($_POST['id'] ?? 0);
if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Missing or invalid customer ID']);
    exit();
}

// Fetch customer details
$stmt = $conn->prepare("
    SELECT FirstName, LastName, BusinessName, PhoneNumber 
    FROM tblrequirements 
    WHERE ApplicationID = ?
");
$stmt->bind_param("i", $id);

if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'Failed to fetch customer']);
    exit();
}

$result = $stmt->get_result();
if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Customer not found']);
    exit();
}

$cust = $result->fetch_assoc();

// Notification message
$fullName = trim($cust['FirstName'] . ' ' . $cust['LastName']);
$msg = "Approval needed for: " . $fullName;

// Prevent duplicate notifications (unread only)
$check = $conn->prepare("
    SELECT COUNT(*) 
    FROM tblnotifications 
    WHERE JSON_EXTRACT(meta, '$.application_id') = ? 
      AND is_read = 0
");
$check->bind_param("i", $id);

if (!$check->execute()) {
    // Fallback if JSON_EXTRACT not supported
    $check = $conn->prepare("
        SELECT COUNT(*) 
        FROM tblnotifications 
        WHERE notif_msg = ? 
          AND is_read = 0
    ");
    $check->bind_param("s", $msg);
    $check->execute();
}

$check->bind_result($exists);
$check->fetch();
$check->close();

if ($exists > 0) {
    echo json_encode(['success' => false, 'message' => 'Notification already sent for this customer.']);
    exit();
}

// Insert notification with JSON metadata
$meta = json_encode([
    'application_id' => $id,
    'phone'          => $cust['PhoneNumber']
]);

$insert = $conn->prepare("
    INSERT INTO tblnotifications (notif_msg, type, is_read, meta) 
    VALUES (?, 'info', 0, ?)
");
$insert->bind_param("ss", $msg, $meta);

if ($insert->execute()) {
    echo json_encode(['success' => true, 'message' => 'Notification sent to admin!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to insert notification']);
}
