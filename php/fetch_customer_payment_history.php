<?php
header("Content-Type: application/json");

if (!isset($_GET["customerID"])) {
    echo json_encode(["error" => "No Customer ID provided"]);
    exit;
}

include("config.php");

$customerID = intval($_GET["customerID"]);

// Fetch payment history for a specific customer
$sql = "SELECT 
            ph.PaymentID,
            ph.CustomerID,
            ph.Amount,
            ph.PaymentDate,
            ph.EmpID,
            c.FirstName,
            c.LastName,
            c.BusinessName,
            e.FirstName AS EmpFirstName,
            e.LastName AS EmpLastName
        FROM tblpaymenthistory ph
        LEFT JOIN tblCustomerAcc c ON ph.CustomerID = c.CustomerID
        LEFT JOIN tblemployees e ON ph.EmpID = e.EmpID
        WHERE ph.CustomerID = ?
        ORDER BY ph.PaymentDate DESC, ph.PaymentID DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $customerID);
$stmt->execute();
$result = $stmt->get_result();

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
            "EmpID" => $row["EmpID"] ?? "N/A",
            "EmpName" => ($row["EmpFirstName"] && $row["EmpLastName"]) 
                ? $row["EmpFirstName"] . " " . $row["EmpLastName"] 
                : "N/A"
        ];
    }
}

echo json_encode($payments);
$stmt->close();
$conn->close();
?>

