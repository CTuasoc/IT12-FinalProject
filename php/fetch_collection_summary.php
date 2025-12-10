<?php
header("Content-Type: application/json");

include("config.php");

// Fetch customers with their collection summary (total payments made)
$sql = "SELECT 
            c.CustomerID,
            c.FirstName,
            c.LastName,
            c.BusinessName,
            c.TotalAmount,
            IFNULL(SUM(ph.Amount), 0) AS TotalCollected,
            COUNT(ph.PaymentID) AS PaymentCount,
            MAX(ph.PaymentDate) AS LastPaymentDate
        FROM tblCustomerAcc c
        LEFT JOIN tblpaymenthistory ph ON c.CustomerID = ph.CustomerID
        GROUP BY c.CustomerID, c.FirstName, c.LastName, c.BusinessName, c.TotalAmount
        HAVING COUNT(ph.PaymentID) > 0
        ORDER BY c.CustomerID ASC";

$result = $conn->query($sql);

$collections = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $collections[] = [
            "CustomerID" => $row["CustomerID"],
            "FirstName" => $row["FirstName"],
            "LastName" => $row["LastName"],
            "BusinessName" => $row["BusinessName"],
            "TotalAmount" => number_format(floatval($row["TotalAmount"]), 2),
            "TotalCollected" => number_format(floatval($row["TotalCollected"]), 2),
            "PaymentCount" => intval($row["PaymentCount"]),
            "LastPaymentDate" => $row["LastPaymentDate"] ?? "N/A"
        ];
    }
}

echo json_encode($collections);
$conn->close();
?>

