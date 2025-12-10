<?php
header('Content-Type: application/json');
session_start();
include("config.php");

if (!isset($_SESSION['user']) || $_SESSION['dept'] != 2) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit();
}

$id = intval($_POST['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid ID']);
    exit();
}

$stmt = $conn->prepare("DELETE FROM tblrequirements WHERE ApplicationID = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Customer permanently deleted']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database delete failed: ' . $stmt->error]);
}
