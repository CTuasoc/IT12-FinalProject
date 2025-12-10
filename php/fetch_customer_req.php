<?php
header('Content-Type: application/json');
session_start();
include("config.php");

if (!isset($_SESSION['user']) || $_SESSION['dept'] != 2) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized', 'customers' => []]);
    exit();
}

$sql = "SELECT ApplicationID, FirstName, LastName, BusinessName, PhoneNumber, CustomerAddress AS Address, Status FROM tblrequirements WHERE Status != 'Archived' ORDER BY ApplicationID DESC";
$result = $conn->query($sql);

$customers = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $customers[] = $row;
    }
}

echo json_encode([
    'success' => true,
    'message' => '',
    'customers' => $customers
]);
