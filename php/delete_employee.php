<?php
include("config.php");

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $empid = $_POST['empid'];

    $sql = "DELETE FROM tblemployees WHERE EmpID=?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $empid);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Delete failed"]);
    }
}
?>