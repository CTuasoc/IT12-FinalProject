<?php
session_start();
include("../php/config.php");
include("../php/validation.php"); // Include the validation helper

if (!isset($_SESSION['user']) || $_SESSION['dept'] != 3) {
    header("Location: login.php");
    exit();
}

// Initialize variables for customer data
$customerData = [
    'firstname' => '',
    'lastname' => '',
    'businessname' => '',
    'address' => '',
    'phonenum' => '',
    'applicationid' => ''
];

// Check if application_id is provided in query parameter
if (isset($_GET['application_id'])) {
    $applicationId = intval($_GET['application_id']);
    
    // Fetch customer data from tblrequirements
    $stmt = $conn->prepare("
        SELECT ApplicationID, FirstName, LastName, BusinessName, CustomerAddress, PhoneNumber 
        FROM tblrequirements 
        WHERE ApplicationID = ?
    ");
    
    if ($stmt) {
        $stmt->bind_param("i", $applicationId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            $customerData['applicationid'] = $row['ApplicationID'];
            $customerData['firstname'] = sanitizeInput($row['FirstName']);
            $customerData['lastname'] = sanitizeInput($row['LastName']);
            $customerData['businessname'] = sanitizeInput($row['BusinessName']);
            $customerData['address'] = sanitizeInput($row['CustomerAddress']);
            $customerData['phonenum'] = sanitizeInput($row['PhoneNumber']);
        }
        
        $stmt->close();
    }
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $firstName   = sanitizeInput($_POST['firstname'] ?? '');
    $lastName    = sanitizeInput($_POST['lastname'] ?? '');
    $business    = sanitizeInput($_POST['businessname'] ?? '');
    $address     = sanitizeInput($_POST['address'] ?? '');
    $phone       = $_POST['phonenum'] ?? '';
    $loanAmount  = floatval($_POST['loanamount'] ?? 0);
    $dueDate     = $_POST['duedate'] ?? '';
    $totalAmount = floatval($_POST['totalamount'] ?? 0);
    $perDay      = floatval($_POST['perday'] ?? 0);
    $amountPaid  = 0.00;

    // Validate phone number
    $validatedPhone = validatePhoneNumber($phone);
    if (!$validatedPhone) {
        echo json_encode([
            "success" => false, 
            "message" => "Phone number must be exactly 11 digits and start with 09 (e.g., 09123456789)"
        ]);
        exit;
    }

    // Validate address
    if (!validateAddress($address)) {
        echo json_encode([
            "success" => false, 
            "message" => "Please enter a valid address (minimum 5 characters)"
        ]);
        exit;
    }

    // Format the date safely
    if (!empty($dueDate)) {
        $dueDate = date('Y-m-d', strtotime($dueDate));
    }

    if (empty($firstName) || empty($lastName) || empty($business) || $loanAmount <= 0 || empty($dueDate)) {
        echo json_encode(["success" => false, "message" => "Missing required fields"]);
        exit;
    }

    $stmt = $conn->prepare("
        INSERT INTO tblCustomerAcc 
        (FirstName, LastName, BusinessName, Address, PhoneNum, LoanAmount, AmountPaid, DueDate, TotalAmount, PerDay) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
        exit;
    }

    $stmt->bind_param(
        "sssssdssdd",
        $firstName,
        $lastName,
        $business,
        $address,
        $validatedPhone,
        $loanAmount,
        $amountPaid,
        $dueDate,
        $totalAmount,
        $perDay
    );

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Customer added successfully!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Insert failed: " . $stmt->error]);
    }

    $stmt->close();
    $conn->close();
} else {
    // Render the HTML with customer data
    $html = file_get_contents("../html/add.html");
    
    // Pass customer data to JavaScript
    echo "<script>window.customerData = " . json_encode($customerData) . ";</script>";
    echo $html;
}
?>