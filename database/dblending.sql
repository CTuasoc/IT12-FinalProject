/*
SQLyog Community v13.3.1 (64 bit)
MySQL - 10.4.32-MariaDB : Database - dblending
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`dblending` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `dblending`;

/*Table structure for table `tblcustomeracc` */

DROP TABLE IF EXISTS `tblcustomeracc`;

CREATE TABLE `tblcustomeracc` (
  `CustomerID` int(11) NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(50) NOT NULL,
  `LastName` varchar(50) NOT NULL,
  `BusinessName` varchar(100) DEFAULT NULL,
  `Address` varchar(150) DEFAULT NULL,
  `PhoneNum` varchar(11) NOT NULL,
  `LoanDate` date DEFAULT NULL,
  `LoanAmount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `AmountPaid` decimal(12,2) NOT NULL DEFAULT 0.00,
  `DueDate` date DEFAULT NULL,
  `TotalAmount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `PerDay` decimal(10,2) NOT NULL DEFAULT 0.00,
  `PerDayBase` decimal(10,2) DEFAULT NULL,
  `IsPaymentDoubled` tinyint(1) NOT NULL DEFAULT 0,
  `DoubledPaymentAmount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `Terms` int(11) NOT NULL DEFAULT 0,
  `Status` enum('active','closed','defaulted') NOT NULL DEFAULT 'active',
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`CustomerID`),
  KEY `idx_status` (`Status`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `tblcustomeracc` */

/*Table structure for table `tbldepartment` */

DROP TABLE IF EXISTS `tbldepartment`;

CREATE TABLE `tbldepartment` (
  `DeptID` int(11) NOT NULL AUTO_INCREMENT,
  `DeptName` varchar(50) NOT NULL,
  PRIMARY KEY (`DeptID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `tbldepartment` */

insert  into `tbldepartment`(`DeptID`,`DeptName`) values 
(1,'Admin'),
(2,'Secretary'),
(3,'Collector');

/*Table structure for table `tblemployees` */

DROP TABLE IF EXISTS `tblemployees`;

CREATE TABLE `tblemployees` (
  `EmpID` int(11) NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(50) NOT NULL,
  `LastName` varchar(50) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `PASSWORD` varchar(255) NOT NULL,
  `DeptID` int(11) DEFAULT NULL,
  PRIMARY KEY (`EmpID`),
  UNIQUE KEY `Email` (`Email`),
  KEY `DeptID` (`DeptID`),
  CONSTRAINT `tblemployees_ibfk_1` FOREIGN KEY (`DeptID`) REFERENCES `tbldepartment` (`DeptID`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `tblemployees` */

insert  into `tblemployees`(`EmpID`,`FirstName`,`LastName`,`Email`,`PASSWORD`,`DeptID`) values 
(1,'Admin','Account','admin@gmail.com','admin123',1),
(6,'Collector','Account','collector@gmail.com','$2y$10$lMbOy6J4mtP.MfLNba.t4OBzDBBYg2pHDLFeKhFEJ67zneA9.HxKe',3),
(7,'Secretary','Account','secretary@gmail.com','secretary123',2);

/*Table structure for table `tblpaymenthistory` */

DROP TABLE IF EXISTS `tblpaymenthistory`;

CREATE TABLE `tblpaymenthistory` (
  `PaymentID` int(11) NOT NULL AUTO_INCREMENT,
  `CustomerID` int(11) NOT NULL,
  `EmpID` int(11) DEFAULT NULL,
  `Amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `PaymentDate` date NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`PaymentID`),
  KEY `CustomerID` (`CustomerID`),
  KEY `EmpID` (`EmpID`),
  CONSTRAINT `tblpaymenthistory_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `tblcustomeracc` (`CustomerID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tblpaymenthistory_ibfk_2` FOREIGN KEY (`EmpID`) REFERENCES `tblemployees` (`EmpID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `tblpaymenthistory` */

/* Trigger structure for table `tblcustomeracc` */

DELIMITER $$

/*!50003 DROP TRIGGER*//*!50032 IF EXISTS */ /*!50003 `validate_phone_before_insert` */$$

/*!50003 CREATE */ /*!50017 DEFINER = 'root'@'localhost' */ /*!50003 TRIGGER `validate_phone_before_insert` BEFORE INSERT ON `tblcustomeracc` FOR EACH ROW 
BEGIN
    -- Clean the phone number (remove non-digits)
    SET NEW.PhoneNum = REGEXP_REPLACE(NEW.PhoneNum, '[^0-9]', '');
    
    -- Validate length
    IF LENGTH(NEW.PhoneNum) != 11 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Phone number must be exactly 11 digits';
    END IF;
    
    -- Optional: Validate format (starts with 09 for Philippines)
    IF NOT NEW.PhoneNum REGEXP '^09[0-9]{9}$' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Phone number must start with 09 and contain only digits (e.g., 09123456789)';
    END IF;
END */$$


DELIMITER ;

/* Trigger structure for table `tblcustomeracc` */

DELIMITER $$

/*!50003 DROP TRIGGER*//*!50032 IF EXISTS */ /*!50003 `validate_phone_before_update` */$$

/*!50003 CREATE */ /*!50017 DEFINER = 'root'@'localhost' */ /*!50003 TRIGGER `validate_phone_before_update` BEFORE UPDATE ON `tblcustomeracc` FOR EACH ROW 
BEGIN
    -- Only validate if PhoneNum is being changed
    IF NEW.PhoneNum IS NOT NULL AND NEW.PhoneNum <> OLD.PhoneNum THEN
        -- Clean the phone number
        SET NEW.PhoneNum = REGEXP_REPLACE(NEW.PhoneNum, '[^0-9]', '');
        
        -- Validate length
        IF LENGTH(NEW.PhoneNum) != 11 THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Phone number must be exactly 11 digits';
        END IF;
        
        -- Optional: Validate format
        IF NOT NEW.PhoneNum REGEXP '^09[0-9]{9}$' THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Phone number must start with 09 and contain only digits';
        END IF;
    END IF;
END */$$


DELIMITER ;

/* Procedure structure for procedure `ProcessPayment` */

/*!50003 DROP PROCEDURE IF EXISTS  `ProcessPayment` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `ProcessPayment`(
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
    
END */$$
DELIMITER ;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
