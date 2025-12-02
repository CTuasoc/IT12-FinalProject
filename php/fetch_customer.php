<?php
header("Content-Type: application/json");

if (!isset($_GET["id"])) {
    echo json_encode(["error" => "No ID provided"]);
    exit;
}

include("config.php");

$id = intval($_GET["id"]);
$sql = "SELECT 
            CustomerID, 
            FirstName, 
            LastName, 
            BusinessName, 
            Address, 
            PhoneNum, 
            LoanAmount, 
            IFNULL(AmountPaid, 0) AS AmountPaid, 
            DueDate, 
            TotalAmount, 
            PerDay 
        FROM tblCustomerAcc 
        WHERE CustomerID = $id";

$result = $conn->query($sql);

if ($row = $result->fetch_assoc()) {
    $loanAmount  = floatval($row["LoanAmount"]);
    $totalAmount = floatval($row["TotalAmount"]);
    $amountPaid  = floatval($row["AmountPaid"]);

    // Ensure AmountPaid = 0 if no payments
    if ($amountPaid <= 0) {
        $amountPaid = 0;
    }

    // Compute balance safely
    $balance = $totalAmount - $amountPaid;

    // Format all numeric values
    $row["LoanAmount"]  = number_format($loanAmount, 2);
    $row["TotalAmount"] = number_format($totalAmount, 2);
    $row["AmountPaid"]  = number_format($amountPaid, 2);
    $row["Balance"]     = number_format(max($balance, 0), 2);

    echo json_encode($row);
} else {
    echo json_encode(["error" => "Customer not found"]);
}

$conn->close();
?>
