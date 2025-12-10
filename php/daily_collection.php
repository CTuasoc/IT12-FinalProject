<?php
session_start();
include("config.php");

// Check login and secretary department
if (!isset($_SESSION['user']) || $_SESSION['dept'] != 2) {
    header("Location: login.php");
    exit();
}

// Determine home page based on department
$homePage = "login.php"; // default
if ($_SESSION['dept'] == 1) {
    $homePage = "admin.php";
} else if ($_SESSION['dept'] == 2) {
    $homePage = "secretary.php";
} else if ($_SESSION['dept'] == 3) {
    $homePage = "collector.php";
}

// Fetch all daily collections (payments made by collectors)
// This will fetch all payments from the payment history
$sql = "SELECT 
    CONCAT(c.FirstName, ' ', c.LastName) as CustomerName,
    p.Amount as AmountCollected,
    p.PaymentDate as Date
FROM tblpaymenthistory p
INNER JOIN tblcustomeracc c ON p.CustomerID = c.CustomerID
ORDER BY p.PaymentDate DESC";

$result = $conn->query($sql);

// Load the shared HTML
$html = file_get_contents("../html/daily_collection.html");

// Replace placeholder with actual home page
$html = str_replace('{{HOME_PAGE}}', $homePage, $html);

// Build table rows with data
$tableRows = '';
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $customerName = htmlspecialchars($row['CustomerName']);
        $amount = number_format($row['AmountCollected'], 2);
        $date = $row['Date'];
        
        $tableRows .= "<tr>";
        $tableRows .= "<td>" . $customerName . "</td>";
        $tableRows .= "<td>₱" . $amount . "</td>";
        $tableRows .= "<td>" . $date . "</td>";
        $tableRows .= "</tr>";
    }
} else {
    $tableRows = "<tr><td colspan='3' style='text-align: center;'>No collections recorded</td></tr>";
}

// Replace the tbody content with actual data using regex for more flexibility
$html = preg_replace('/<tbody>\s*<\/tbody>/', '<tbody>' . $tableRows . '</tbody>', $html);

echo $html;
$conn->close();
?>
