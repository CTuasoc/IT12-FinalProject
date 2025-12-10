<?php
/**
 * Optimized Payment Processing Script
 * Uses stored procedures and connection pooling for better performance
 */

// Set headers for JSON response
header("Content-Type: application/json");
header("Cache-Control: no-cache, must-revalidate");
header("X-Accel-Buffering: no"); // Disable buffering for nginx

// Start output buffering
ob_start();

// Start session and check authentication
session_start();
if (!isset($_SESSION['user']) || $_SESSION['dept'] != 3) {
    sendJsonResponse(false, 'Unauthorized access', 401);
    exit;
}

// Only process POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendJsonResponse(false, 'Invalid request method', 405);
    exit;
}

// Get and validate input
$customerID = filter_input(INPUT_POST, 'customerID', FILTER_VALIDATE_INT);
$amount = filter_input(INPUT_POST, 'amount', FILTER_VALIDATE_FLOAT);
$empID = (int)$_SESSION['user'];

// Input validation
if (!$customerID || $customerID <= 0) {
    sendJsonResponse(false, 'Invalid customer ID');
    exit;
}

if (!$amount || $amount <= 0) {
    sendJsonResponse(false, 'Invalid payment amount');
    exit;
}

// Include database configuration
require_once("config.php");

// Set MySQL to use buffered queries (faster for large result sets)
$conn->options(MYSQLI_OPT_INT_AND_FLOAT_NATIVE, 1);

// Process payment using stored procedure
try {
    // Prepare the call to the stored procedure
    $stmt = $conn->prepare("CALL ProcessPayment(?, ?, ?, @paymentID, @success, @message)");
    
    if (!$stmt) {
        throw new Exception("Database error: " . $conn->error);
    }
    
    // Bind parameters
    $stmt->bind_param("idi", $customerID, $amount, $empID);
    
    // Execute the stored procedure
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute payment: " . $stmt->error);
    }
    
    // Close the statement
    $stmt->close();
    
    // Get the output parameters
    $result = $conn->query("SELECT @paymentID AS paymentID, @success AS success, @message AS message");
    $row = $result->fetch_assoc();
    
    // Return the response
    if ($row['success']) {
        // Log successful payment (consider using a background job for this in production)
        error_log("Payment processed successfully - PaymentID: " . $row['paymentID']);
        
        // Return success response
        sendJsonResponse(
            true, 
            $row['message'],
            200,
            ['paymentID' => (int)$row['paymentID']]
        );
    } else {
        sendJsonResponse(false, $row['message'], 400);
    }
    
} catch (Exception $e) {
    // Log the error
    error_log("Payment processing error: " . $e->getMessage());
    
    // Return error response
    sendJsonResponse(false, 'An error occurred while processing your payment. Please try again.', 500);
    
} finally {
    // Close connection
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
    
    // Flush output buffer and end
    ob_end_flush();
    exit;
}

/**
 * Helper function to send JSON response
 */
function sendJsonResponse($success, $message, $statusCode = 200, $additionalData = []) {
    http_response_code($statusCode);
    
    $response = array_merge([
        'success' => $success,
        'message' => $message,
        'timestamp' => date('c')
    ], $additionalData);
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
?>
