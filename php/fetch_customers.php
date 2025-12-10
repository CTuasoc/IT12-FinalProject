<?php
header("Content-Type: application/json");

// Check session and authentication
session_start();
if (!isset($_SESSION['user']) || $_SESSION['dept'] != 3) {
    echo json_encode(["error" => "Unauthorized access"]);
    http_response_code(401);
    exit;
}

$conn = new mysqli("localhost", "root", "", "dbLending");
if ($conn->connect_error) {
    echo json_encode(["error" => "DB connection failed"]);
    exit;
}

// Fetch all customers with their balance information
$sql = "SELECT 
            CustomerID, 
            FirstName, 
            LastName, 
            BusinessName,
            LoanAmount,
            TotalAmount,
            IFNULL(AmountPaid, 0) AS AmountPaid,
            DueDate
        FROM tblCustomerAcc
        ORDER BY CustomerID ASC";

$result = $conn->query($sql);

$customers = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $totalAmount = floatval($row["TotalAmount"]);
        $amountPaid = floatval($row["AmountPaid"]);
        $balance = $totalAmount - $amountPaid;
        
        $customers[] = [
            "CustomerID" => $row["CustomerID"],
            "FirstName" => $row["FirstName"],
            "LastName" => $row["LastName"],
            "BusinessName" => $row["BusinessName"],
            "TotalAmount" => number_format($totalAmount, 2),
            "AmountPaid" => number_format($amountPaid, 2),
            "Balance" => number_format(max($balance, 0), 2),
            "DueDate" => $row["DueDate"]
        ];
    }
}

echo json_encode($customers);
$conn->close();
?>

