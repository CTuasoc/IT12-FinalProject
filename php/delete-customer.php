<?php
session_start();
include("config.php");

// ---- 1. Check if admin is logged in ----
if (!isset($_SESSION['dept']) || $_SESSION['dept'] != 1) {
    echo json_encode(["success" => false, "message" => "Unauthorized access. Only admin can delete records."]);
    exit();
}

// ---- 2. Get variables ----
$id = $_POST['id'] ?? '';
$password = trim($_POST['password'] ?? '');

if (empty($id) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Missing customer ID or password."]);
    exit();
}

// ---- 3. Get admin info from session ----
// Adjust this line based on your session variable name:
$username = $_SESSION['user'] ?? $_SESSION['username'] ?? $_SESSION['UserName'] ?? null;

if (!$username) {
    echo json_encode(["success" => false, "message" => "Session missing username."]);
    exit();
}

// ---- 4. Verify admin password from tblemployees ----
$query = $conn->prepare("SELECT Password FROM tblemployees WHERE Username = ?");
$query->bind_param("s", $username);
$query->execute();
$result = $query->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Admin not found in database."]);
    exit();
}

$row = $result->fetch_assoc();
$dbPassword = trim($row['Password']); // password from DB

// ---- 5. Compare passwords ----
// If your passwords in DB are plain text (not hashed), compare directly
if ($password !== $dbPassword) {
    echo json_encode(["success" => false, "message" => "Incorrect password. Deletion canceled."]);
    exit();
}

// ---- 6. Proceed with deletion ----
$delete = $conn->prepare("DELETE FROM tblcustomeracc WHERE CustomerID = ?");
$delete->bind_param("i", $id);

if ($delete->execute()) {
    echo json_encode(["success" => true, "message" => "Customer record deleted successfully!"]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to delete record. Database error."]);
}

// ---- 7. Clean up ----
$delete->close();
$query->close();
$conn->close();
?>
