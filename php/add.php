<?php
session_start();
include("../php/config.php");

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
            $customerData['firstname'] = $row['FirstName'];
            $customerData['lastname'] = $row['LastName'];
            $customerData['businessname'] = $row['BusinessName'];
            $customerData['address'] = $row['CustomerAddress'];
            $customerData['phonenum'] = $row['PhoneNumber'];
        }
        
        $stmt->close();
    }
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $firstName   = $_POST['firstname'] ?? '';
    $lastName    = $_POST['lastname'] ?? '';
    $business    = $_POST['businessname'] ?? '';
    $address     = $_POST['address'] ?? '';
    $phone       = $_POST['phonenum'] ?? '';
    $loanAmount  = floatval($_POST['loanamount'] ?? 0);
    $dueDate     = $_POST['duedate'] ?? '';
    $totalAmount = floatval($_POST['totalamount'] ?? 0);
    $perDay      = floatval($_POST['perday'] ?? 0);
    $amountPaid  = 0.00;

    // Format the date safely
    if (!empty($dueDate)) {
        $dueDate = date('Y-m-d', strtotime($dueDate)); // ensure correct MySQL format
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

    // ✅ Correct bind types — notice 'DueDate' is bound as 's'
    $stmt->bind_param(
        "sssssdssdd",
        $firstName,
        $lastName,
        $business,
        $address,
        $phone,
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
    
    // Replace placeholders with actual customer data
    $html = str_replace('value=""', 'value="' . htmlspecialchars($customerData['firstname']) . '"', $html);
    $html = str_replace('placeholder="Input First Name"', 'placeholder="Input First Name" value="' . htmlspecialchars($customerData['firstname']) . '"', $html);
    $html = str_replace('placeholder="Input Last Name"', 'placeholder="Input Last Name" value="' . htmlspecialchars($customerData['lastname']) . '"', $html);
    $html = str_replace('placeholder="Input Business Name"', 'placeholder="Input Business Name" value="' . htmlspecialchars($customerData['businessname']) . '"', $html);
    $html = str_replace('placeholder="Input Phone Num"', 'placeholder="Input Phone Num" value="' . htmlspecialchars($customerData['phonenum']) . '"', $html);
    $html = str_replace('placeholder="Input Address"', 'placeholder="Input Address" value="' . htmlspecialchars($customerData['address']) . '"', $html);
    
    // Pass customer data to JavaScript
    echo "<script>window.customerData = " . json_encode($customerData) . ";</script>";
    echo $html;
}
?>