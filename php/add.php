<?php
header("Content-Type: application/json");
include("../php/config.php");

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
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}
?>