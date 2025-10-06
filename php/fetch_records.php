<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "dbLending");
if ($conn->connect_error) {
    echo json_encode(["error" => "DB connection failed"]);
    exit;
}

$sql = "SELECT 
            CustomerID, 
            FirstName, 
            LastName, 
            LoanAmount, 
            TotalAmount, 
            IFNULL(AmountPaid, 0) AS AmountPaid 
        FROM tblCustomerAcc";

$result = $conn->query($sql);

$customers = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $loanAmount  = floatval($row["LoanAmount"]);
        $totalAmount = floatval($row["TotalAmount"]);
        $amountPaid  = floatval($row["AmountPaid"]);

        // If no payments made, AmountPaid = 0
        if ($amountPaid = 0) {
            $amountPaid = 0;
        }

        // Balance = TotalAmount - AmountPaid
        $balance = $totalAmount - $amountPaid;

        $customers[] = [
            "CustomerID"  => $row["CustomerID"],
            "FirstName"   => $row["FirstName"],
            "LastName"    => $row["LastName"],
            "LoanAmount"  => number_format($loanAmount, 2),
            "Balance"     => number_format(max($balance, 0), 2)
        ];
    }
}

echo json_encode($customers);
$conn->close();
?>
