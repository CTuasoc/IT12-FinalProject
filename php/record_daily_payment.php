<?php
// Turn off error display
error_reporting(0);
ini_set('display_errors', 0);

session_start();
header("Content-Type: application/json");

if (!isset($_SESSION['user']) || $_SESSION['dept'] != 3) {
    echo json_encode(["success" => false, "message" => "Unauthorized access"]);
    exit;
}

include("config.php");

// Check connection
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $customerID = intval($_POST['customerID'] ?? 0);
    $amount = floatval($_POST['amount'] ?? 0);
    $paymentDate = $_POST['paymentDate'] ?? date('Y-m-d');
    $empID = intval($_SESSION['user']);
    $isCustomAmount = isset($_POST['isCustomAmount']) && $_POST['isCustomAmount'] == '1';

    // Validation
    if ($customerID <= 0 || $amount <= 0) {
        echo json_encode(["success" => false, "message" => "Invalid customer ID or amount"]);
        exit;
    }

    try {
        // Check if already paid today
        $checkSql = "SELECT COUNT(*) as paymentCount 
                     FROM tblpaymenthistory 
                     WHERE CustomerID = ? 
                     AND DATE(PaymentDate) = ?";
        
        $checkStmt = $conn->prepare($checkSql);
        if (!$checkStmt) {
            throw new Exception("Check prepare failed: " . $conn->error);
        }
        
        $checkStmt->bind_param("is", $customerID, $paymentDate);
        
        if (!$checkStmt->execute()) {
            throw new Exception("Check execute failed: " . $checkStmt->error);
        }
        
        $checkResult = $checkStmt->get_result();
        $checkRow = $checkResult->fetch_assoc();
        $checkStmt->close();
        
        if ($checkRow['paymentCount'] > 0) {
            echo json_encode(["success" => false, "message" => "Customer has already paid today"]);
            exit;
        }

        // Get customer current data from tblcustomeracc
        $customerSql = "SELECT 
                            FirstName,
                            LastName,
                            CONCAT(FirstName, ' ', LastName) as CustomerName,
                            TotalAmount, 
                            IFNULL(AmountPaid, 0) as AmountPaid,
                            PerDay as DailyPayment
                        FROM tblcustomeracc 
                        WHERE CustomerID = ?";
        
        $customerStmt = $conn->prepare($customerSql);
        if (!$customerStmt) {
            throw new Exception("Customer prepare failed: " . $conn->error);
        }
        
        $customerStmt->bind_param("i", $customerID);
        
        if (!$customerStmt->execute()) {
            throw new Exception("Customer execute failed: " . $customerStmt->error);
        }
        
        $customerResult = $customerStmt->get_result();
        
        if ($customerResult->num_rows == 0) {
            $customerStmt->close();
            echo json_encode(["success" => false, "message" => "Customer not found"]);
            exit;
        }
        
        $customerData = $customerResult->fetch_assoc();
        $customerStmt->close();
        
        $totalAmount = floatval($customerData['TotalAmount']);
        $currentAmountPaid = floatval($customerData['AmountPaid']);
        $customerName = $customerData['CustomerName'];
        $dailyPayment = floatval($customerData['DailyPayment']);
        $newAmountPaid = $currentAmountPaid + $amount;
        
        // Check if payment exceeds total amount
        if ($newAmountPaid > $totalAmount) {
            echo json_encode([
                "success" => false, 
                "message" => "Payment amount exceeds total loan amount. Maximum payment allowed: ₱" . number_format($totalAmount - $currentAmountPaid, 2)
            ]);
            exit;
        }

        // Start transaction
        $conn->begin_transaction();

        try {
            // Insert payment into payment history
            $insertSql = "INSERT INTO tblpaymenthistory (CustomerID, EmpID, Amount, PaymentDate) 
                          VALUES (?, ?, ?, ?)";
            $insertStmt = $conn->prepare($insertSql);
            
            if (!$insertStmt) {
                throw new Exception("Insert prepare failed: " . $conn->error);
            }
            
            $insertStmt->bind_param("iids", $customerID, $empID, $amount, $paymentDate);
            
            if (!$insertStmt->execute()) {
                throw new Exception("Failed to record payment: " . $insertStmt->error);
            }
            
            $paymentID = $conn->insert_id;
            $insertStmt->close();

            // Update customer's AmountPaid in tblcustomeracc - REMOVED UpdatedAt
            $updateSql = "UPDATE tblcustomeracc SET AmountPaid = ? WHERE CustomerID = ?";
            $updateStmt = $conn->prepare($updateSql);
            
            if (!$updateStmt) {
                throw new Exception("Update prepare failed: " . $conn->error);
            }
            
            $updateStmt->bind_param("di", $newAmountPaid, $customerID);
            
            if (!$updateStmt->execute()) {
                throw new Exception("Failed to update customer record: " . $updateStmt->error);
            }
            
            $updateStmt->close();

            // Check if loan is now fully paid
            $isFullyPaid = $newAmountPaid >= $totalAmount;

            // Commit transaction
            $conn->commit();
            
            echo json_encode([
                "success" => true, 
                "message" => "Payment recorded successfully!",
                "paymentID" => $paymentID,
                "newBalance" => $totalAmount - $newAmountPaid,
                "customerName" => $customerName,
                "isFullyPaid" => $isFullyPaid,
                "dailyPayment" => $dailyPayment
            ]);
        } catch (Exception $e) {
            // Rollback transaction on error
            $conn->rollback();
            throw $e;
        }
    } catch (Exception $e) {
        error_log("record_daily_payment error: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

if (isset($conn) && $conn instanceof mysqli) {
    $conn->close();
}
?>