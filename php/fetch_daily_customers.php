<?php
// Turn off error display
error_reporting(0);
ini_set('display_errors', 0);

session_start();
header("Content-Type: application/json");

if (!isset($_SESSION['user']) || $_SESSION['dept'] != 3) {
    echo json_encode(["error" => "Unauthorized access", "success" => false]);
    exit;
}

include("config.php");

// Check connection
if ($conn->connect_error) {
    echo json_encode(["error" => "Database connection failed", "success" => false]);
    exit;
}

try {
    // Get today's date
    $today = date('Y-m-d');

    // Get all customers - REMOVED Status field from SQL
    $sql = "SELECT 
                CustomerID,
                CONCAT(FirstName, ' ', LastName) as CustomerName,
                FirstName,
                LastName,
                BusinessName,
                IFNULL(LoanAmount, 0) as LoanAmount,
                IFNULL(AmountPaid, 0) as AmountPaid,
                IFNULL(TotalAmount, 0) as TotalAmount,
                IFNULL(PerDay, 0) as DailyPayment,
                (IFNULL(TotalAmount, 0) - IFNULL(AmountPaid, 0)) as RemainingBalance,
                CASE WHEN EXISTS (
                    SELECT 1 FROM tblpaymenthistory ph 
                    WHERE ph.CustomerID = tblcustomeracc.CustomerID 
                    AND DATE(ph.PaymentDate) = ?
                ) THEN 1 ELSE 0 END as PaidToday
            FROM tblcustomeracc
            WHERE IFNULL(AmountPaid, 0) < IFNULL(TotalAmount, 1)
            ORDER BY FirstName, LastName";

    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("s", $today);
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    
    if (!$result) {
        throw new Exception("Get result failed: " . $stmt->error);
    }

    $customers = [];
    while ($row = $result->fetch_assoc()) {
        // Convert to appropriate types
        $row['LoanAmount'] = floatval($row['LoanAmount']);
        $row['AmountPaid'] = floatval($row['AmountPaid']);
        $row['TotalAmount'] = floatval($row['TotalAmount']);
        $row['DailyPayment'] = floatval($row['DailyPayment']);
        $row['RemainingBalance'] = floatval($row['RemainingBalance']);
        $row['PaidToday'] = (bool)$row['PaidToday'];
        
        // Calculate if loan is fully paid
        $row['IsFullyPaid'] = $row['RemainingBalance'] <= 0.01; // Using small tolerance
        
        // Calculate if loan has any payments made
        $row['HasPayments'] = $row['AmountPaid'] > 0;
        
        $customers[] = $row;
    }

    echo json_encode($customers);
    
} catch (Exception $e) {
    // Log the error for debugging
    error_log("fetch_daily_customers error: " . $e->getMessage());
    
    // Return a clean error response
    echo json_encode([
        "error" => "Failed to load customers: " . $e->getMessage(),
        "success" => false,
        "customers" => []
    ]);
} finally {
    if (isset($stmt) && $stmt instanceof mysqli_stmt) {
        $stmt->close();
    }
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
?>