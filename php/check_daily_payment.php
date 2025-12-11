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
    $checkDate = $_POST['checkDate'] ?? date('Y-m-d');

    try {
        // Check if payment exists for today
        $sql = "SELECT COUNT(*) as paymentCount 
                FROM tblpaymenthistory 
                WHERE CustomerID = ? 
                AND DATE(PaymentDate) = ?";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param("is", $customerID, $checkDate);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        if (!$result) {
            throw new Exception("Get result failed: " . $stmt->error);
        }
        
        $row = $result->fetch_assoc();
        $stmt->close();
        
        echo json_encode([
            "success" => true,
            "alreadyPaid" => $row['paymentCount'] > 0
        ]);
    } catch (Exception $e) {
        error_log("check_daily_payment error: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

if (isset($conn) && $conn instanceof mysqli) {
    $conn->close();
}
?>