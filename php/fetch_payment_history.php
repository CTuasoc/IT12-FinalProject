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

// Fetch payment history with customer information
$sql = "SELECT 
            ph.PaymentID,
            ph.CustomerID,
            ph.Amount,
            ph.PaymentDate,
            ph.EmpID,
            c.FirstName,
            c.LastName,
            c.BusinessName
        FROM tblpaymenthistory ph
        LEFT JOIN tblCustomerAcc c ON ph.CustomerID = c.CustomerID
        ORDER BY ph.PaymentID DESC";

$result = $conn->query($sql);

$payments = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $payments[] = [
            "PaymentID" => $row["PaymentID"],
            "CustomerID" => $row["CustomerID"],
            "FirstName" => $row["FirstName"] ?? "N/A",
            "LastName" => $row["LastName"] ?? "N/A",
            "BusinessName" => $row["BusinessName"] ?? "N/A",
            "Amount" => number_format(floatval($row["Amount"]), 2),
            "PaymentDate" => $row["PaymentDate"],
            "EmpID" => $row["EmpID"] ?? "N/A"
        ];
    }
}

echo json_encode($payments);
$conn->close();
?>

