<?php
include("config.php");
header("Content-Type: application/json");

try {
    $sql = "
        SELECT 
            e.EmpID,
            CONCAT(e.FirstName, ' ', e.LastName) AS FullName,
            e.Email,
            e.DeptID,
            d.DeptName,
            lh.TimeIn,
            lh.TimeOut,
            CASE 
                WHEN lh.TimeIn IS NOT NULL AND (lh.TimeOut IS NULL OR lh.TimeOut = '') THEN 'Active'
                ELSE 'Inactive'
            END AS Status
        FROM tblEmployees e
        LEFT JOIN tblDepartment d ON e.DeptID = d.DeptID
        LEFT JOIN (
            SELECT EmpID, MAX(LogDate) AS LastLogDate
            FROM tblLoginHistory
            GROUP BY EmpID
        ) latest ON e.EmpID = latest.EmpID
        LEFT JOIN tblLoginHistory lh 
            ON e.EmpID = lh.EmpID AND lh.LogDate = latest.LastLogDate
        ORDER BY e.DeptID, e.LastName;
    ";

    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $employees = [];
    while ($row = $result->fetch_assoc()) {
        $employees[] = $row;
    }

    echo json_encode(["success" => true, "data" => $employees]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}