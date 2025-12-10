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

$firstName = trim($_POST['first_name'] ?? '');
$lastName = trim($_POST['last_name'] ?? '');
$businessName = trim($_POST['business_name'] ?? '');
$phoneNumber = trim($_POST['phone_number'] ?? '');
$address = trim($_POST['address'] ?? '');

if (!$firstName || !$lastName || !$businessName || !$phoneNumber || !$address) {
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit();
}

$stmt = $conn->prepare("INSERT INTO tblrequirements (FirstName, LastName, BusinessName, PhoneNumber, CustomerAddress, Status) VALUES (?, ?, ?, ?, ?, 'Pending')");
$stmt->bind_param("sssss", $firstName, $lastName, $businessName, $phoneNumber, $address);

if ($stmt->execute()) {
    $id = $stmt->insert_id;
    echo json_encode([
        'success' => true,
        'message' => 'Customer added successfully!',
        'customer' => [
            'ApplicationID' => $id,
            'FirstName' => $firstName,
            'LastName' => $lastName,
            'BusinessName' => $businessName,
            'PhoneNumber' => $phoneNumber,
            'Address' => $address,
            'Status' => 'Pending'
        ]
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
}
