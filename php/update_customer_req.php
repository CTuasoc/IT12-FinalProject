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
$firstName = trim($_POST['first_name'] ?? '');
$lastName = trim($_POST['last_name'] ?? '');
$businessName = trim($_POST['business_name'] ?? '');
$phoneNumber = trim($_POST['phone_number'] ?? '');
$address = trim($_POST['address'] ?? '');
$status = trim($_POST['status'] ?? '');

if (!$id || !$firstName || !$lastName || !$businessName || !$phoneNumber || !$address || !$status) {
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit();
}

$stmt = $conn->prepare("
    UPDATE tblrequirements 
    SET FirstName = ?, LastName = ?, BusinessName = ?, PhoneNumber = ?, CustomerAddress = ?, Status = ?
    WHERE ApplicationID = ?
");

$stmt->bind_param("ssssssi", $firstName, $lastName, $businessName, $phoneNumber, $address, $status, $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Customer updated successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
}
