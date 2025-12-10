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
    // Debug logging (you can remove this after testing)
    error_log("Raw database values for CustomerID $id: " . print_r($row, true));
    
    // Get raw values without formatting first
    $loanAmount  = floatval($row["LoanAmount"]);
    $totalAmount = floatval($row["TotalAmount"]);
    $amountPaid  = floatval($row["AmountPaid"]);
    
    // Debug the raw float values
    error_log("Parsed float values - LoanAmount: $loanAmount, TotalAmount: $totalAmount, AmountPaid: $amountPaid");

    // Ensure AmountPaid = 0 if no payments
    if ($amountPaid <= 0) {
        $amountPaid = 0;
    }

    // Compute balance safely
    $balance = $totalAmount - $amountPaid;

    // Return both formatted AND raw values for debugging
    $response = [
        "CustomerID" => $row["CustomerID"],
        "FirstName" => $row["FirstName"],
        "LastName" => $row["LastName"],
        "BusinessName" => $row["BusinessName"],
        "Address" => $row["Address"],
        "PhoneNum" => $row["PhoneNum"],
        "LoanAmount" => $loanAmount,  // Return as number
        "TotalAmount" => $totalAmount, // Return as number
        "AmountPaid" => $amountPaid,  // Return as number
        "DueDate" => $row["DueDate"],
        "PerDay" => $row["PerDay"],
        "Balance" => max($balance, 0),
        // Also include formatted versions
        "LoanAmountFormatted" => number_format($loanAmount, 2),
        "TotalAmountFormatted" => number_format($totalAmount, 2),
        "AmountPaidFormatted" => number_format($amountPaid, 2),
        "BalanceFormatted" => number_format(max($balance, 0), 2)
    ];
    
    echo json_encode($response);
} else {
    echo json_encode(["error" => "Customer not found"]);
}

$conn->close();
?>