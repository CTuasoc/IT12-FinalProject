<?php
session_start();
include("config.php"); // database connection

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Match input names from your form
    $email = $_POST['username']; 
    $password = $_POST['password'];

    // Prepare and execute query
    $sql = "SELECT EmpID, FirstName, LastName, DeptID, PASSWORD FROM tblEmployees WHERE Email=?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        // Plain text password check (temporary, should hash later)
        if ($password === $row['PASSWORD']) {
            $_SESSION['user'] = $row['EmpID'];
            $_SESSION['dept'] = $row['DeptID'];

            // Get department name
            $dept_sql = "SELECT DeptName FROM tblDepartment WHERE DeptID=?";
            $dept_stmt = $conn->prepare($dept_sql);
            $dept_stmt->bind_param("i", $row['DeptID']);
            $dept_stmt->execute();
            $dept_res = $dept_stmt->get_result();
            $dept = $dept_res->fetch_assoc();

            if ($dept['DeptName'] === "Admin") {
                header("Location: admin.php");
                exit();
            } else {
                header("Location: teller_dashboard.php");
                exit();
            }
        } else {
            $error = "Invalid username or password";
        }
    } else {
        $error = "Invalid username or password";
    }
}

// Include login HTML
include("../html/login.html");
?>