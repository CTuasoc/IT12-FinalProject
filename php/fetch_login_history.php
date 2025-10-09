<?php
include("config.php");

if (isset($_GET['empid']) && isset($_GET['month'])) {
    $empid = $_GET['empid'];
    $month = $_GET['month']; // format: YYYY-MM

    $sql = "SELECT LogDate, TimeIn, TimeOut 
            FROM tblLoginHistory 
            WHERE EmpID = ? 
            AND DATE_FORMAT(LogDate, '%Y-%m') = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("is", $empid, $month);
    $stmt->execute();
    $result = $stmt->get_result();

    $history = [];
    while ($row = $result->fetch_assoc()) {
        $history[] = $row;
    }

    echo json_encode(["success" => true, "data" => $history]);
} else {
    echo json_encode(["success" => false, "message" => "Missing parameters"]);
}
?>
