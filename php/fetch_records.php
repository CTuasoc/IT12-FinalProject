<?php
session_start();
header("Content-Type: application/json");

include("config.php");

// Get filter parameters
$search = $_GET['search'] ?? '';
$status = $_GET['status'] ?? 'all';
$nameType = $_GET['nameType'] ?? 'both';
$sort = $_GET['sort'] ?? 'name_asc';
// Optional: specific collection date to check per-day payments
$paymentDate = $_GET['paymentDate'] ?? '';

// Build base query
$sql = "SELECT 
            CustomerID, 
            FirstName, 
            LastName,
            BusinessName,
            PhoneNum,
            LoanAmount, 
            TotalAmount, 
            IFNULL(AmountPaid, 0) AS AmountPaid,
            DueDate,
            PerDay
        FROM tblCustomerAcc 
        WHERE 1=1";

// Add search filter
if (!empty($search)) {
    $search = $conn->real_escape_string($search);
    
    if ($nameType === 'first') {
        $sql .= " AND FirstName LIKE '%$search%'";
    } else if ($nameType === 'last') {
        $sql .= " AND LastName LIKE '%$search%'";
    } else {
        $sql .= " AND (FirstName LIKE '%$search%' OR LastName LIKE '%$search%' OR BusinessName LIKE '%$search%')";
    }
}

// Add status filter
if ($status === 'paid') {
    $sql .= " HAVING AmountPaid >= TotalAmount";
} else if ($status === 'unpaid') {
    $sql .= " HAVING AmountPaid < TotalAmount";
} else if ($status === 'overdue') {
    $sql .= " HAVING AmountPaid < TotalAmount AND DueDate < CURDATE()";
}

// Add sorting
switch ($sort) {
    case 'name_desc':
        $sql .= " ORDER BY LastName DESC, FirstName DESC";
        break;
    case 'balance_high':
        $sql .= " ORDER BY (TotalAmount - AmountPaid) DESC";
        break;
    case 'balance_low':
        $sql .= " ORDER BY (TotalAmount - AmountPaid) ASC";
        break;
    case 'newest':
        $sql .= " ORDER BY CustomerID DESC";
        break;
    case 'oldest':
        $sql .= " ORDER BY CustomerID ASC";
        break;
    default: // name_asc
        $sql .= " ORDER BY LastName ASC, FirstName ASC";
        break;
}

$result = $conn->query($sql);

$customers = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $loanAmount = floatval($row["LoanAmount"]);
        $totalAmount = floatval($row["TotalAmount"]);
        $amountPaid = floatval($row["AmountPaid"]);
        $perDay = isset($row["PerDay"]) ? floatval($row["PerDay"]) : 0;
        
        // Calculate balance
        $balance = $totalAmount - $amountPaid;
        
        // Check if overdue
        $dueDate = new DateTime($row["DueDate"]);
        $today = new DateTime();
        $isOverdue = $dueDate < $today && $balance > 0;
        
        // Base customer data
        $customers[] = [
            "CustomerID" => (int)$row["CustomerID"],
            "FirstName" => $row["FirstName"],
            "LastName" => $row["LastName"],
            "BusinessName" => $row["BusinessName"],
            "PhoneNum" => $row["PhoneNum"],
            "LoanAmount" => number_format($loanAmount, 2),
            "Balance" => number_format(max($balance, 0), 2),
            "DueDate" => $row["DueDate"],
            "AmountPaid" => number_format($amountPaid, 2),
            "TotalAmount" => number_format($totalAmount, 2),
            "PerDay" => number_format($perDay, 2),
            "IsOverdue" => $isOverdue,
            "IsPaid" => $balance <= 0,
            // Defaults for per-day collection status; may be overridden below
            "PaidOnDate" => false,
            "AmountPaidOnDate" => number_format(0, 2)
        ];
    }
}

// If a specific payment date is provided, compute per-customer payments on that date
if (!empty($paymentDate) && !empty($customers)) {
    $date = $conn->real_escape_string($paymentDate);

    // Use the logged-in employee (collector) if available
    $empID = isset($_SESSION['user']) ? (int)$_SESSION['user'] : null;

    $sqlPaid = "SELECT CustomerID, SUM(Amount) AS AmountOnDate
                FROM tblpaymenthistory
                WHERE PaymentDate = '$date'";

    if ($empID) {
        $sqlPaid .= " AND EmpID = $empID";
    }

    $sqlPaid .= " GROUP BY CustomerID";

    $paidMap = [];
    $paidResult = $conn->query($sqlPaid);
    if ($paidResult && $paidResult->num_rows > 0) {
        while ($row = $paidResult->fetch_assoc()) {
            $cid = (int)$row['CustomerID'];
            $paidMap[$cid] = floatval($row['AmountOnDate']);
        }
    }

    // Update customers array with per-day payment info
    foreach ($customers as &$cust) {
        $cid = (int)$cust['CustomerID'];
        if (isset($paidMap[$cid])) {
            $amountOnDate = $paidMap[$cid];
            $cust['PaidOnDate'] = true;
            $cust['AmountPaidOnDate'] = number_format($amountOnDate, 2);
        }
    }
    unset($cust);
}

echo json_encode($customers);
$conn->close();
?>