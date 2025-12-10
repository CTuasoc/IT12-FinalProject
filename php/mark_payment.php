<?php
session_start();
header("Content-Type: application/json");

// Check authentication and authorization
if (!isset($_SESSION['user']) || $_SESSION['dept'] != 3) {
    echo json_encode(["success" => false, "message" => "Unauthorized access"]);
    http_response_code(401);
    exit;
}

include("config.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $customerID = intval($_POST['customerID'] ?? 0);
    $action = $_POST['action'] ?? '';
    $empID = intval($_SESSION['user']);
    $paymentDate = date('Y-m-d'); // Current date

    // Validation
    if ($customerID <= 0) {
        echo json_encode(["success" => false, "message" => "Invalid customer ID"]);
        exit;
    }

    if ($action === 'paid') {
        // Get customer's daily payment amount including doubled status
        $checkSql = "SELECT TotalAmount, PerDay, PerDayBase, IFNULL(AmountPaid, 0) AS AmountPaid, IFNULL(IsPaymentDoubled, 0) AS IsPaymentDoubled, IFNULL(DoubledPaymentAmount, 0) AS DoubledPaymentAmount FROM tblCustomerAcc WHERE CustomerID = ?";
        $checkStmt = $conn->prepare($checkSql);
        if (!$checkStmt) {
            echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
            exit;
        }
        
        $checkStmt->bind_param("i", $customerID);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows == 0) {
            echo json_encode(["success" => false, "message" => "Customer not found"]);
            exit;
        }
        
        $customerData = $checkResult->fetch_assoc();
        $totalAmount = floatval($customerData["TotalAmount"]);
        $dailyPayment = floatval($customerData["PerDay"]);
        // Determine the original/base payment. If PerDayBase exists use it;
        // otherwise leave it as 0 for now (we'll fallback to half of PerDay if needed).
        $rawPerDayBase = $customerData["PerDayBase"] ?? null;
        $basePayment = is_null($rawPerDayBase) ? 0.0 : floatval($rawPerDayBase);
        $currentAmountPaid = floatval($customerData["AmountPaid"]);
        $isDoubled = intval($customerData["IsPaymentDoubled"]);
        $doubledAmount = floatval($customerData["DoubledPaymentAmount"]);
        
        $newAmountPaid = $currentAmountPaid + $dailyPayment;
        
        // Check if payment exceeds total amount
        if ($newAmountPaid > $totalAmount) {
            echo json_encode(["success" => false, "message" => "Payment would exceed total loan amount"]);
            exit;
        }

        // Start transaction
        $conn->begin_transaction();

        try {
            // Insert payment record into payment history
            $insertSql = "INSERT INTO tblpaymenthistory (CustomerID, EmpID, Amount, PaymentDate) VALUES (?, ?, ?, ?)";
            $insertStmt = $conn->prepare($insertSql);
            if (!$insertStmt) {
                throw new Exception("Database error: " . $conn->error);
            }
            
            $insertStmt->bind_param("iids", $customerID, $empID, $dailyPayment, $paymentDate);
            
            if (!$insertStmt->execute()) {
                throw new Exception("Failed to record payment: " . $insertStmt->error);
            }

            // Check if payment was doubled and if full doubled amount is paid
            $newIsDoubled = $isDoubled;
            $newDoubledAmount = $doubledAmount;
            $resetMessage = "";
            
            if ($isDoubled && $doubledAmount > 0) {
                // Reduce the doubled payment amount
                $newDoubledAmount = $doubledAmount - $dailyPayment;
                
                // If doubled amount is fully paid, reset to normal
                if ($newDoubledAmount <= 0) {
                    $newIsDoubled = 0;
                    $newDoubledAmount = 0;
                    // If PerDayBase is missing (0) try to infer original as half of current PerDay
                    if ($basePayment <= 0 && $isDoubled) {
                        $basePayment = $dailyPayment / 2.0;
                    }
                    $resetMessage = " Doubled payment fulfilled. Daily payment reset to normal.";
                }
            }

            // Update customer's AmountPaid and doubled payment status
            $updateSql = "UPDATE tblCustomerAcc SET AmountPaid = ?, IsPaymentDoubled = ?, DoubledPaymentAmount = ?";
            
            // Reset PerDay if doubled payment is complete
            if ($resetMessage) {
                $updateSql .= ", PerDay = ?";
            }
            
            $updateSql .= " WHERE CustomerID = ?";
            
            $updateStmt = $conn->prepare($updateSql);
            if (!$updateStmt) {
                throw new Exception("Database error: " . $conn->error);
            }
            
            if ($resetMessage) {
                $updateStmt->bind_param("diddi", $newAmountPaid, $newIsDoubled, $newDoubledAmount, $basePayment, $customerID);
            } else {
                $updateStmt->bind_param("didi", $newAmountPaid, $newIsDoubled, $newDoubledAmount, $customerID);
            }
            
            if (!$updateStmt->execute()) {
                throw new Exception("Failed to update customer record: " . $updateStmt->error);
            }

            // Commit transaction
            $conn->commit();
            
            $message = "Payment recorded successfully! Term increased by 1." . $resetMessage;
            
            echo json_encode([
                "success" => true, 
                "message" => $message,
                "paymentID" => $conn->insert_id,
                "newAmount" => $newAmountPaid
            ]);
        } catch (Exception $e) {
            // Rollback transaction on error
            $conn->rollback();
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }

    } else if ($action === 'pass') {
        // PASS action - doubles the daily payment amount
        $checkSql = "SELECT PerDay, PerDayBase, IFNULL(IsPaymentDoubled, 0) AS IsPaymentDoubled FROM tblCustomerAcc WHERE CustomerID = ?";
        $checkStmt = $conn->prepare($checkSql);
        if (!$checkStmt) {
            echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
            exit;
        }
        
        $checkStmt->bind_param("i", $customerID);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows == 0) {
            echo json_encode(["success" => false, "message" => "Customer not found"]);
            exit;
        }
        
        $customerData = $checkResult->fetch_assoc();
        $currentPerDay = floatval($customerData["PerDay"]);
        $rawPerDayBase = $customerData["PerDayBase"] ?? null;
        $basePayment = is_null($rawPerDayBase) ? 0.0 : floatval($rawPerDayBase);
        $isDoubled = intval($customerData["IsPaymentDoubled"]);
        
        // Always allow doubling (no cap). Each PASS doubles the current PerDay.
        // Calculate new PerDay and increment the DoubledPaymentAmount by the increase.
        $newPerDay = $currentPerDay * 2;
        $delta = $newPerDay - $currentPerDay;

        // If PerDayBase is missing, set it to the currentPerDay (original base)
        $origBase = $basePayment;
        if ($origBase <= 0) {
            $origBase = $currentPerDay;
        }

        // New remaining doubled amount is previous remaining plus delta
        $newDoubledAmount = floatval($customerData["DoubledPaymentAmount"] ?? 0) + $delta;

        // Start transaction to persist changes
        $conn->begin_transaction();
        try {
            $updateSql = "UPDATE tblCustomerAcc SET PerDayBase = ?, PerDay = ?, IsPaymentDoubled = 1, DoubledPaymentAmount = ? WHERE CustomerID = ?";
            $updateStmt = $conn->prepare($updateSql);
            if (!$updateStmt) {
                throw new Exception("Database error: " . $conn->error);
            }

            $updateStmt->bind_param("dddi", $origBase, $newPerDay, $newDoubledAmount, $customerID);
            if (!$updateStmt->execute()) {
                throw new Exception("Failed to double payment: " . $updateStmt->error);
            }

            $conn->commit();
            echo json_encode([
                "success" => true,
                "message" => "Payment doubled! Daily payment is now ₱" . number_format($newPerDay, 2) . " until fully paid.",
                "PerDay" => $newPerDay,
                "DoubledPaymentAmount" => $newDoubledAmount
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }

    } else {
        echo json_encode(["success" => false, "message" => "Invalid action"]);
    }

    $conn->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}
?>
