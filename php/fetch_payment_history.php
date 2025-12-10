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

// Fetch all customers with their loan information
$sql = "SELECT 
            c.CustomerID,
            c.FirstName,
            c.LastName,
            c.BusinessName,
            c.LoanAmount,
            c.DueDate,
            c.TotalAmount,
            c.PerDay,
            COALESCE(SUM(ph.Amount), 0) AS AmountPaidFromHistory,
            COALESCE(COUNT(ph.PaymentID), 0) AS TermsCount
        FROM tblCustomerAcc c
        LEFT JOIN tblpaymenthistory ph ON c.CustomerID = ph.CustomerID
        GROUP BY c.CustomerID
        ORDER BY c.CustomerID DESC";

$result = $conn->query($sql);

$payments = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $customerName = $row["FirstName"] . " " . $row["LastName"];
        $dueDate = $row["DueDate"];
        $loanAmount = floatval($row["LoanAmount"]);

        // Calculate interest (difference between total amount and loan amount)
        $interest = floatval($row["TotalAmount"]) - $loanAmount;

        // Terms should reflect actual payment records count (increments only when PAID recorded)
        $terms = intval($row["TermsCount"]);

        // Prefer the amount summed from the payment history for accuracy
        $amountPaid = floatval($row["AmountPaidFromHistory"]);

        $payments[] = [
            "CustomerID" => $row["CustomerID"],
            "CustomerName" => $customerName,
            "BusinessName" => $row["BusinessName"],
            "DateOfLoan" => $dueDate,
            "Principal" => number_format($loanAmount, 2),
            "Interest" => number_format($interest, 2),
            "Terms" => $terms,
            "DailyPayment" => number_format(floatval($row["PerDay"]), 2),
            "LoanAmount" => $loanAmount,
            "TotalAmount" => floatval($row["TotalAmount"]),
            "AmountPaid" => $amountPaid,
            "Balance" => floatval($row["TotalAmount"]) - $amountPaid
        ];
    }
}

echo json_encode($payments);
$conn->close();
?>

