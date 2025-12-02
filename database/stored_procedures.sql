-- Drop procedure if it exists
DROP PROCEDURE IF EXISTS ProcessPayment;

-- Set delimiter
DELIMITER //

-- Create the procedure with the label at the start
CREATE PROCEDURE ProcessPayment(
    IN p_CustomerID INT,
    IN p_Amount DECIMAL(10,2),
    IN p_EmpID INT,
    OUT p_PaymentID INT,
    OUT p_Success BOOLEAN,
    OUT p_Message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_TotalAmount DECIMAL(10,2);
    DECLARE v_CurrentAmountPaid DECIMAL(10,2) DEFAULT 0;
    DECLARE v_NewAmountPaid DECIMAL(10,2);
    DECLARE v_CustomerExists BOOLEAN DEFAULT FALSE;
    DECLARE v_NextPaymentID INT;
    
    -- Error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_Success = FALSE;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, 
                                   @errno = MYSQL_ERRNO, 
                                   @text = MESSAGE_TEXT;
        SET p_Message = CONCAT('Database error: ', @errno, ' (', @sqlstate, '): ', @text);
    END;
    
    -- Check if customer exists and get current amounts
    SELECT 
        COUNT(*),
        COALESCE(TotalAmount, 0),
        COALESCE(AmountPaid, 0)
    INTO 
        v_CustomerExists,
        v_TotalAmount,
        v_CurrentAmountPaid
    FROM tblCustomerAcc 
    WHERE CustomerID = p_CustomerID
    LOCK IN SHARE MODE;
    
    -- Validate customer and amount
    IF v_CustomerExists = 0 THEN
        SET p_Success = FALSE;
        SET p_Message = 'Customer not found';
        LEAVE proc_label;
    END IF;
    
    -- Calculate new amount paid
    SET v_NewAmountPaid = v_CurrentAmountPaid + p_Amount;
    
    -- Validate payment amount
    IF p_Amount <= 0 THEN
        SET p_Success = FALSE;
        SET p_Message = 'Payment amount must be greater than zero';
        LEAVE proc_label;
    END IF;
    
    IF v_NewAmountPaid > v_TotalAmount THEN
        SET p_Success = FALSE;
        SET p_Message = 'Payment amount exceeds total loan amount';
        LEAVE proc_label;
    END IF;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Manually calculate the next PaymentID for a consistent, gapless sequence
    SELECT COALESCE(MAX(PaymentID), 0) + 1 INTO v_NextPaymentID FROM tblpaymenthistory;

    -- Insert payment record with the manually calculated ID
    INSERT INTO tblpaymenthistory (PaymentID, CustomerID, EmpID, Amount, PaymentDate)
    VALUES (v_NextPaymentID, p_CustomerID, p_EmpID, p_Amount, CURDATE());

    -- Set the output PaymentID
    SET p_PaymentID = v_NextPaymentID;
    
    -- Update customer's amount paid
    UPDATE tblCustomerAcc 
    SET AmountPaid = v_NewAmountPaid 
    WHERE CustomerID = p_CustomerID;
    
    -- Commit transaction
    COMMIT;
    
    -- Set success response
    SET p_Success = TRUE;
    SET p_Message = 'Payment processed successfully';
    
END //

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_customer_id ON tblCustomerAcc(CustomerID);
CREATE INDEX IF NOT EXISTS idx_payment_customer_id ON tblpaymenthistory(CustomerID);
CREATE INDEX IF NOT EXISTS idx_payment_date ON tblpaymenthistory(PaymentDate);

-- Reset delimiter
DELIMITER ;