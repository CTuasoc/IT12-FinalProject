<?php
// update_notification_status.php
header('Content-Type: application/json');
session_start(); // Start session to handle admin check if needed, though not strictly required for logic below

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
$action = isset($_POST['action']) ? $_POST['action'] : '';

if ($id <= 0 || !in_array($action, ['approve', 'deny'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid parameter']);
    exit;
}

// Connect to database
// **IMPORTANT: Update these credentials with your actual database details**
$host = "localhost";
$user = "root";
$pass = "";
$db = "dblending"; // <-- CHANGE THIS

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// 1. Mark the notification as read (is_read = 1)
$stmt_notif = $conn->prepare("UPDATE tblnotifications SET is_read = 1 WHERE notif_id = ?");
$stmt_notif->bind_param("i", $id);

if (!$stmt_notif->execute()) {
      echo json_encode(['success' => false, 'message' => 'Failed to mark notification as read']);
      $stmt_notif->close();
      $conn->close();
      exit;
}
$stmt_notif->close();


// 2. Determine the status and find the associated ApplicationID
$status = ($action === 'approve') ? 'approved' : 'denied';

$stmt_meta = $conn->prepare("SELECT JSON_EXTRACT(meta, '$.application_id') AS application_id FROM tblnotifications WHERE notif_id = ?");
$stmt_meta->bind_param("i", $id);
$stmt_meta->execute();
$result_meta = $stmt_meta->get_result();
$row_meta = $result_meta->fetch_assoc();
$application_id = intval($row_meta['application_id']);
$stmt_meta->close();

if ($application_id > 0) {
    // 3. Update the corresponding application record in tblrequirements
    $stmt_cust = $conn->prepare("UPDATE tblrequirements SET Status=? WHERE ApplicationID=?");
    $stmt_cust->bind_param("si", $status, $application_id);

    if ($stmt_cust->execute()) {
        echo json_encode(['success' => true, 'message' => ucfirst($action).' successfully for Application ID '.$application_id]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database update failed for application record']);
    }
    $stmt_cust->close();
} else {
    // Succeed even if no Application ID was found, because the notification was successfully marked read
      echo json_encode(['success' => true, 'message' => ucfirst($action).' successfully (Notification marked read, but no Application ID found to update)']);
}


$conn->close();
?>