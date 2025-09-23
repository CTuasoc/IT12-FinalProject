<?php
session_start();
include("config.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];
    $password = $_POST['password'];

    $sql = "SELECT EmpID, FirstName, LastName, DeptID, Password FROM tblEmployees WHERE Email=?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        if ($password === $row['Password']) { // NOTE: plain text for now
            $_SESSION['user'] = $row['EmpID'];
            $_SESSION['dept'] = $row['DeptID'];

            // Check department name
            $dept_sql = "SELECT DeptName FROM tblDepartment WHERE DeptID=?";
            $dept_stmt = $conn->prepare($dept_sql);
            $dept_stmt->bind_param("i", $row['DeptID']);
            $dept_stmt->execute();
            $dept_res = $dept_stmt->get_result();
            $dept = $dept_res->fetch_assoc();

            if ($dept['DeptName'] == "Admin") {
                header("Location: admin.php");
                exit();
            } else {
                header("Location: teller_dashboard.php");
                exit();
            }
        }
    }
    $error = "Invalid email or password";
}
?>
<?php include("../html/login.html"); ?>