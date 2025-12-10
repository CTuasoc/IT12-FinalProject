/*
SQLyog Community v13.3.0 (64 bit)
MySQL - 10.4.32-MariaDB : Database - dblending
*********************************************************************
*/

 /*!40101 SET NAMES utf8 */;

 /*!40101 SET SQL_MODE=''*/;

 /*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;

 /*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;

 /*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

 /*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `dblending` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `dblending`;

/*Table structure for table `tblcustomeracc` */

DROP TABLE IF EXISTS `tblcustomeracc`;

CREATE TABLE `tblcustomeracc` (
  `CustomerID` int(11) NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(50) NOT NULL,
  `LastName` varchar(50) NOT NULL,
  `BusinessName` varchar(100) DEFAULT NULL,
  `Address` varchar(150) DEFAULT NULL,
  `PhoneNum` varchar(20) DEFAULT NULL,
  `LoanDate` date DEFAULT NULL,
  `LoanAmount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `AmountPaid` decimal(12,2) NOT NULL DEFAULT 0.00,
  `DueDate` date DEFAULT NULL,
  `TotalAmount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `PerDay` decimal(10,2) NOT NULL DEFAULT 0.00,
  `PerDayBase` decimal(10,2) DEFAULT NULL,
  `IsPaymentDoubled` TINYINT(1) NOT NULL DEFAULT 0,
  `DoubledPaymentAmount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `Terms` INT NOT NULL DEFAULT 0,
  `Status` ENUM('active','closed','defaulted') NOT NULL DEFAULT 'active',
  `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CustomerID`),
  KEY `idx_status` (`Status`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `tblcustomeracc` */

INSERT INTO `tblcustomeracc`
(`CustomerID`,`FirstName`,`LastName`,`BusinessName`,`Address`,`PhoneNum`,`LoanDate`,`LoanAmount`,`AmountPaid`,`DueDate`,`TotalAmount`,`PerDay`,`PerDayBase`)
VALUES 
(1,'Mari','Jose','ChristmasStore','MaynilaTunga','09875643121','2025-12-11',99999999.99,0.00,'2120-12-25',99999999.99,24154.62,NULL);

/*Table structure for table `tbldepartment` */

DROP TABLE IF EXISTS `tbldepartment`;

CREATE TABLE `tbldepartment` (
  `DeptID` int(11) NOT NULL AUTO_INCREMENT,
  `DeptName` varchar(50) NOT NULL,
  PRIMARY KEY (`DeptID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `tbldepartment` */

INSERT INTO `tbldepartment`(`DeptID`,`DeptName`) VALUES 
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

INSERT INTO `tblemployees`
(`EmpID`,`FirstName`,`LastName`,`Email`,`PASSWORD`,`DeptID`) VALUES 
(1,'johnny','Doejali','admin@gmail.com','admin123',1),
(6,'Miss','Ssim','TestCollector@gmail.com','test123',3),
(7,'Jane','Doejali','janedai@gmail.com','jane123',1);

/*Table structure for table `tblloginhistory` */

DROP TABLE IF EXISTS `tblloginhistory`;

CREATE TABLE `tblloginhistory` (
  `LogID` int(11) NOT NULL AUTO_INCREMENT,
  `EmpID` int(11) DEFAULT NULL,
  `LogDate` date DEFAULT NULL,
  `TimeIn` time DEFAULT NULL,
  `TimeOut` time DEFAULT NULL,
  PRIMARY KEY (`LogID`),
  KEY `EmpID` (`EmpID`),
  CONSTRAINT `tblloginhistory_ibfk_1` FOREIGN KEY (`EmpID`) REFERENCES `tblemployees` (`EmpID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `tblpaymenthistory` */

DROP TABLE IF EXISTS `tblpaymenthistory`;

CREATE TABLE `tblpaymenthistory` (
  `PaymentID` int(11) NOT NULL AUTO_INCREMENT,
  `CustomerID` int(11) NOT NULL,
  `EmpID` int(11) DEFAULT NULL,
  `Amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `PaymentDate` date NOT NULL,
  `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`PaymentID`),
  KEY `CustomerID` (`CustomerID`),
  KEY `EmpID` (`EmpID`),
  CONSTRAINT `tblpaymenthistory_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `tblcustomeracc` (`CustomerID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tblpaymenthistory_ibfk_2` FOREIGN KEY (`EmpID`) REFERENCES `tblemployees` (`EmpID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `tblrequirements`;

CREATE TABLE `tblrequirements` (
  `ApplicationID` int(100) NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(50) NOT NULL,
  `LastName` varchar(50) NOT NULL,
  `BusinessName` varchar(100) NOT NULL,
  `PhoneNumber` varchar(20) NOT NULL,
  `CustomerAddress` varchar(150) NOT NULL,
  `Status` varchar(20) NOT NULL DEFAULT 'Pending',
  PRIMARY KEY (`ApplicationID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `tblnotifications`;

CREATE TABLE `tblnotifications` (
  `notif_id` INT NOT NULL AUTO_INCREMENT,
  `notif_msg` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'info',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `meta` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notif_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


 /*!40101 SET SQL_MODE=@OLD_SQL_MODE */;

 /*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;

 /*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;

 /*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-06-10 12:00:00