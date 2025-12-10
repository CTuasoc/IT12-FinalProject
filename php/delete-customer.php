<?php
session_start();
include("config.php");

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ---- 1. Check if collector is logged in ----
if (!isset($_SESSION['user'])) {
    echo json_encode([
        "success" => false, 
        "message" => "You must be logged in to delete records."
    ]);
    exit();
}

// ---- 2. Get variables ----
$id = $_POST['id'] ?? '';
$password = trim($_POST['password'] ?? '');

if (empty($id) || empty($password)) {
    echo json_encode([
        "success" => false, 
        "message" => "Missing customer ID or password."
    ]);
    exit();
}

// Validate CustomerID is numeric
if (!is_numeric($id)) {
    echo json_encode([
        "success" => false, 
        "message" => "Invalid customer ID."
    ]);
    exit();
}

$id = intval($id);

// ---- 3. Get collector info from session ----
// $_SESSION['user'] contains EmpID (from login.php)
$empID = $_SESSION['user'];

// ---- 4. Verify collector password with bcrypt ----
// Get employee by EmpID
$query = $conn->prepare("SELECT PASSWORD FROM tblemployees WHERE EmpID = ?");
if (!$query) {
    echo json_encode([
        "success" => false, 
        "message" => "Database error: " . $conn->error
    ]);
    exit();
}

$query->bind_param("i", $empID);
$query->execute();
$result = $query->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false, 
        "message" => "User not found in database."
    ]);
    $query->close();
    exit();
}

$row = $result->fetch_assoc();
$hashedPassword = $row['PASSWORD'];

// ---- 5. Compare passwords with bcrypt ----
if (!password_verify($password, $hashedPassword)) {
    echo json_encode([
        "success" => false, 
        "message" => "Incorrect password. Deletion canceled."
    ]);
    $query->close();
    exit();
}

$query->close();

// ---- 6. Check if customer exists ----
$checkCustomer = $conn->prepare("SELECT FirstName, LastName FROM tblcustomeracc WHERE CustomerID = ?");
if (!$checkCustomer) {
    echo json_encode([
        "success" => false, 
        "message" => "Database error: " . $conn->error
    ]);
    exit();
}

$checkCustomer->bind_param("i", $id);
$checkCustomer->execute();
$customerResult = $checkCustomer->get_result();

if ($customerResult->num_rows === 0) {
    echo json_encode([
        "success" => false, 
        "message" => "Customer not found."
    ]);
    $checkCustomer->close();
    exit();
}

$customerData = $customerResult->fetch_assoc();
$customerName = $customerData['FirstName'] . ' ' . $customerData['LastName'];
$checkCustomer->close();

// ---- 7. Start transaction for data integrity ----
$conn->begin_transaction();

try {
    // Step 1: Delete payment history for this customer
    $deletePayments = $conn->prepare("DELETE FROM tblpaymenthistory WHERE CustomerID = ?");
    if (!$deletePayments) {
        throw new Exception("Prepare payments failed: " . $conn->error);
    }
    $deletePayments->bind_param("i", $id);
    $paymentResult = $deletePayments->execute();
    
    if (!$paymentResult) {
        throw new Exception("Delete payments failed: " . $deletePayments->error);
    }
    $deletePayments->close();
    
    // Step 2: Delete the customer record
    $deleteCustomer = $conn->prepare("DELETE FROM tblcustomeracc WHERE CustomerID = ?");
    if (!$deleteCustomer) {
        throw new Exception("Prepare customer failed: " . $conn->error);
    }
    $deleteCustomer->bind_param("i", $id);
    $customerResult = $deleteCustomer->execute();
    
    if (!$customerResult) {
        throw new Exception("Delete customer failed: " . $deleteCustomer->error);
    }
    
    $rowsAffected = $deleteCustomer->affected_rows;
    $deleteCustomer->close();
    
    if ($rowsAffected > 0) {
        // Commit transaction
        $conn->commit();
        
        // Optional: Log the deletion activity
        try {
            $logStmt = $conn->prepare("INSERT INTO tblloginhistory (EmpID, LogDate, TimeIn) VALUES (?, CURDATE(), CURTIME())");
            if ($logStmt) {
                $logStmt->bind_param("i", $empID);
                $logStmt->execute();
                $logStmt->close();
            }
        } catch (Exception $logError) {
            // Log error but don't fail the deletion
            error_log("Failed to log deletion: " . $logError->getMessage());
        }
        
        echo json_encode([
            "success" => true, 
            "message" => "Customer record have been deleted successfully!"
        ]);
    } else {
        $conn->rollback();
        echo json_encode([
            "success" => false, 
            "message" => "Failed to delete customer record."
        ]);
    }
    
} catch (Exception $e) {
    // Rollback on any error
    $conn->rollback();
    
    echo json_encode([
        "success" => false, 
        "message" => "Database error occurred: " . $e->getMessage()
    ]);
}

// ---- 8. Clean up ----
$conn->close();
?>