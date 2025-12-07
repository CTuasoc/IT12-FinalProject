<?php
session_start();
include("config.php");

if(!isset($_SESSION['user']) || $_SESSION['dept'] != 2){
    header("Location: login.php");
    exit();
}

// Handle form submit
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $firstName = trim($_POST['first_name'] ?? '');
    $lastName = trim($_POST['last_name'] ?? '');
    $businessName = trim($_POST['business_name'] ?? '');
    $phoneNumber = trim($_POST['phone_number'] ?? '');
    $address = trim($_POST['address'] ?? '');

    if (!$firstName || !$lastName || !$businessName || !$phoneNumber || !$address) {
        echo json_encode(['success'=>false, 'message'=>'All fields are required']);
        exit();
    }

    $stmt = $conn->prepare("INSERT INTO tblrequirements (FirstName, LastName, BusinessName, PhoneNumber, CustomerAddress, Status) VALUES (?, ?, ?, ?, ?, 'Pending')");
    $stmt->bind_param("sssss", $firstName, $lastName, $businessName, $phoneNumber, $address);

    if ($stmt->execute()) {
        echo json_encode(['success'=>true,'message'=>'Customer added successfully']);
    } else {
        echo json_encode(['success'=>false,'message'=>'Database error']);
    }
    exit();
}

// Load customers for table
$sql = "SELECT ApplicationID, FirstName, LastName, BusinessName, PhoneNumber, CustomerAddress AS Address, Status FROM tblrequirements ORDER BY ApplicationID DESC";
$result = $conn->query($sql);

$customers = [];
while ($row = $result->fetch_assoc()) {
    $customers[] = $row;
}

// Include HTML template
include("../html/requirement.html");
?>
