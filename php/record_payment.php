<?php
session_start();
header("Content-Type: application/json");

if (!isset($_SESSION['user']) || $_SESSION['dept'] != 3) {
    echo json_encode(["success" => false, "message" => "Unauthorized access"]);
    exit;
}

include("config.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $customerID = intval($_POST['customerID'] ?? 0);
    $amount = floatval($_POST['amount'] ?? 0);
    $empID = intval($_SESSION['user']);
    $paymentDate = date('Y-m-d'); // Current date

    // Validation
    if ($customerID <= 0 || $amount <= 0) {
        echo json_encode(["success" => false, "message" => "Invalid customer ID or amount"]);
        exit;
    }

    // Check if customer exists and get current AmountPaid
    $checkSql = "SELECT TotalAmount, IFNULL(AmountPaid, 0) AS AmountPaid FROM tblCustomerAcc WHERE CustomerID = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("i", $customerID);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows == 0) {
        echo json_encode(["success" => false, "message" => "Customer not found"]);
        exit;
    }
    
    $customerData = $checkResult->fetch_assoc();
    $totalAmount = floatval($customerData["TotalAmount"]);
    $currentAmountPaid = floatval($customerData["AmountPaid"]);
    $newAmountPaid = $currentAmountPaid + $amount;
    
    // Check if payment exceeds total amount
    if ($newAmountPaid > $totalAmount) {
        echo json_encode(["success" => false, "message" => "Payment amount exceeds total loan amount"]);
        exit;
    }

    // Start transaction
    $conn->begin_transaction();

    try {
        // Insert payment into payment history
        $insertSql = "INSERT INTO tblpaymenthistory (CustomerID, EmpID, Amount, PaymentDate) VALUES (?, ?, ?, ?)";
        $insertStmt = $conn->prepare($insertSql);
        $insertStmt->bind_param("iids", $customerID, $empID, $amount, $paymentDate);
        
        if (!$insertStmt->execute()) {
            throw new Exception("Failed to record payment: " . $insertStmt->error);
        }

        // Update customer's AmountPaid
        $updateSql = "UPDATE tblCustomerAcc SET AmountPaid = ? WHERE CustomerID = ?";
        $updateStmt = $conn->prepare($updateSql);
        $updateStmt->bind_param("di", $newAmountPaid, $customerID);
        
        if (!$updateStmt->execute()) {
            throw new Exception("Failed to update customer record: " . $updateStmt->error);
        }

        // Commit transaction
        $conn->commit();
        
        echo json_encode([
            "success" => true, 
            "message" => "Payment recorded successfully!",
            "paymentID" => $conn->insert_id
        ]);
    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }

    $conn->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}
?>

