<?php
include("config.php");

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $empid = $_POST['empid'];
    $firstname = $_POST['firstname'];
    $lastname = $_POST['lastname'];
    $email = $_POST['email'];
    $deptid = $_POST['deptid'];

    $sql = "UPDATE tblemployees SET FirstName=?, LastName=?, Email=?, DeptID=? WHERE EmpID=?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssii", $firstname, $lastname, $email, $deptid, $empid);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Update failed"]);
    }
}
?>
