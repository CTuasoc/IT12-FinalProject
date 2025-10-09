<?php
include("config.php");
header("Content-Type: application/json");

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        throw new Exception("Invalid request");
    }

    $firstname = trim($_POST["firstname"]);
    $lastname = trim($_POST["lastname"]);
    $email = trim($_POST["email"]);
    $password = trim($_POST["password"]);
    $deptid = intval($_POST["deptid"]);

    if (!$firstname || !$lastname || !$email || !$password || !$deptid) {
        throw new Exception("All fields are required");
    }

    // (Optional) check duplicate email
    $check = $conn->prepare("SELECT EmpID FROM tblEmployees WHERE Email=?");
    $check->bind_param("s", $email);
    $check->execute();
    $check->store_result();
    if ($check->num_rows > 0) {
        throw new Exception("Email already exists");
    }

    // Insert
    $stmt = $conn->prepare("INSERT INTO tblEmployees (FirstName, LastName, Email, PASSWORD, DeptID) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssi", $firstname, $lastname, $email, $password, $deptid);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        throw new Exception("Database insert failed: " . $stmt->error);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
