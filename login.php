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
        $stored_password = $row['PASSWORD'];
        
        // --- FIXED: Secure password check with backward compatibility ---
        // Check if password is already hashed (starts with $2y$)
        if (strpos($stored_password, '$2y$') === 0) {
            // New hashed password check
            $password_valid = password_verify($password, $stored_password);
        } else {
            // Old plain text check - then upgrade to hash
            $password_valid = ($password === $stored_password);
            
            if ($password_valid) {
                // Upgrade old password to hash
                $hashed_password = password_hash($password, PASSWORD_BCRYPT);
                $update_sql = "UPDATE tblEmployees SET PASSWORD=? WHERE EmpID=?";
                $update_stmt = $conn->prepare($update_sql);
                $update_stmt->bind_param("si", $hashed_password, $row['EmpID']);
                $update_stmt->execute();
            }
        }

        if ($password_valid) {
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
            } else if ($dept['DeptName'] === "Secretary") {
                header("Location: secretary.php");
                exit();
            } else {
                header("Location: collector.php");
                exit();
            }
        } else {
            // Password failed
            $error = "Invalid username or password";
        }
    } else {
        // User not found
        $error = "Invalid username or password";
    }
}

// Include login HTML
include("../html/login.html");
?>