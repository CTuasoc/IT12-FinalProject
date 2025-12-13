<?php
// validation.php

function validatePhoneNumber($phone) {
    // Remove any spaces, dashes, or other characters
    $phone = preg_replace('/[^0-9]/', '', $phone);
    
    // Check if it's exactly 11 digits
    if (strlen($phone) !== 11) {
        return false;
    }
    
    // Check if it starts with 09 (common Philippine mobile format)
    // You can adjust this based on your country's format
    if (!preg_match('/^09/', $phone)) {
        return false;
    }
    
    return $phone;
}

function validateAddress($address) {
    // Basic address validation - ensure it's not empty and has minimum length
    $address = trim($address);
    
    if (empty($address)) {
        return false;
    }
    
    if (strlen($address) < 5) {
        return false;
    }
    
    // Optional: Add more specific address validation rules
    return $address;
}

function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}
?>