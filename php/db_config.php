<?php
/**
 * Enhanced Database Configuration with Connection Pooling
 */

class Database {
    private static $instance = null;
    private $connection;
    
    // Database configuration
    private $host = "localhost";
    private $username = "root";
    private $password = "";
    private $database = "dbLending";
    private $port = 3306;
    private $charset = "utf8mb4";
    
    // Connection pooling settings
    private $maxConnections = 10;
    private $connectionPool = [];
    
    private function __construct() {
        // Private constructor to prevent direct instantiation
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        // Try to get a connection from the pool
        if (!empty($this->connectionPool)) {
            return array_pop($this->connectionPool);
        }
        
        // If pool is empty, create a new connection if we haven't reached max connections
        if (count($this->connectionPool) < $this->maxConnections) {
            return $this->createNewConnection();
        }
        
        // If we've reached max connections, wait for a connection to become available
        // (in a real application, you might want to implement a proper queue or timeout)
        usleep(100000); // Wait 100ms
        return $this->getConnection();
    }
    
    public function releaseConnection($conn) {
        if ($conn && $conn->ping()) {
            $this->connectionPool[] = $conn;
            return true;
        }
        return false;
    }
    
    private function createNewConnection() {
        $conn = new mysqli(
            $this->host,
            $this->username,
            $this->password,
            $this->database,
            $this->port
        );
        
        if ($conn->connect_error) {
            error_log("Connection failed: " . $conn->connect_error);
            throw new Exception("Database connection failed: " . $conn->connect_error);
        }
        
        // Set charset
        $conn->set_charset($this->charset);
        
        // Set SQL mode if needed
        $conn->query("SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'");
        
        return $conn;
    }
    
    // Prevent cloning of the instance
    private function __clone() {}
    
    // Prevent unserializing of the instance
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

// Initialize the database connection pool
try {
    $db = Database::getInstance();
    $GLOBALS['db'] = $db;
} catch (Exception $e) {
    error_log("Database initialization failed: " . $e->getMessage());
    // Handle error appropriately
    die("Database connection error. Please try again later.");
}
?>
