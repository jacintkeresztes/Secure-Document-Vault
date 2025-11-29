-- ================================================
-- Secure Document Vault - Database Schema
-- ================================================
-- MySQL 8.0+
-- Character Set: utf8mb4 (full Unicode support)
-- Collation: utf8mb4_unicode_ci

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS vault_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE vault_db;

-- ================================================
-- USERS TABLE
-- ================================================
-- Stores user authentication information
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- User credentials
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL COMMENT 'Argon2id hash',
    password_salt BINARY(16) NOT NULL COMMENT '128-bit random salt',
    
    -- Account metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Failed login tracking (for rate limiting)
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_active (is_active)
) ENGINE=InnoDB COMMENT='User accounts with Argon2id password hashing';

-- ================================================
-- FILES TABLE
-- ================================================
-- Stores encrypted files with cryptographic metadata
CREATE TABLE IF NOT EXISTS files (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Ownership
    user_id INT UNSIGNED NOT NULL,
    
    -- File metadata
    filename VARCHAR(255) NOT NULL,
    original_size BIGINT NOT NULL COMMENT 'Size in bytes before encryption',
    mime_type VARCHAR(127),
    
    -- Encrypted file data
    ciphertext LONGBLOB NOT NULL COMMENT 'AES-256-GCM encrypted file',
    
    -- Cryptographic components
    encrypted_dek BLOB NOT NULL COMMENT 'Data Encryption Key encrypted with KEK',
    dek_iv BINARY(12) NOT NULL COMMENT 'IV for DEK encryption (96 bits)',
    file_iv BINARY(12) NOT NULL COMMENT 'IV for file encryption (96 bits)',
    auth_tag BINARY(16) NOT NULL COMMENT 'GCM authentication tag (128 bits)',
    
    -- Integrity verification
    file_hash BINARY(64) NOT NULL COMMENT 'SHA-512 hash of original plaintext',
    
    -- Timestamps
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP NULL,
    
    -- Soft delete (for audit trail)
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_files (user_id, deleted_at),
    INDEX idx_uploaded (uploaded_at)
) ENGINE=InnoDB COMMENT='Encrypted files with per-file DEKs';

-- ================================================
-- AUDIT_LOG TABLE
-- ================================================
-- Track all cryptographic operations for security monitoring
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Actor
    user_id INT UNSIGNED,
    
    -- Action details
    action_type ENUM(
        'USER_REGISTER',
        'USER_LOGIN',
        'USER_LOGOUT',
        'FILE_UPLOAD',
        'FILE_DOWNLOAD',
        'FILE_DELETE',
        'KEY_ROTATION',
        'FAILED_LOGIN',
        'UNAUTHORIZED_ACCESS'
    ) NOT NULL,
    
    -- Target resource
    resource_type ENUM('USER', 'FILE', 'KEY') NOT NULL,
    resource_id INT UNSIGNED,
    
    -- Context
    ip_address VARCHAR(45) COMMENT 'IPv4 or IPv6',
    user_agent VARCHAR(255),
    
    -- Result
    status ENUM('SUCCESS', 'FAILURE', 'ERROR') NOT NULL,
    error_message TEXT,
    
    -- Timestamp
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_audit (user_id, timestamp),
    INDEX idx_action (action_type, timestamp),
    INDEX idx_resource (resource_type, resource_id)
) ENGINE=InnoDB COMMENT='Security audit trail';

-- ================================================
-- SESSION_TOKENS TABLE (Optional)
-- ================================================
-- Track active JWT tokens for revocation capability
CREATE TABLE IF NOT EXISTS session_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    user_id INT UNSIGNED NOT NULL,
    
    -- Token identifier (use jti claim from JWT)
    token_id VARCHAR(64) NOT NULL UNIQUE,
    
    -- Token metadata
    issued_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    
    -- Revocation
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    revoke_reason VARCHAR(255),
    
    -- Client info
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_tokens (user_id, revoked),
    INDEX idx_expiry (expires_at)
) ENGINE=InnoDB COMMENT='JWT session tracking for revocation';

-- ================================================
-- KEY_MANAGEMENT TABLE (Future enhancement)
-- ================================================
-- Track Key Encryption Key rotations
CREATE TABLE IF NOT EXISTS key_management (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Key identifier
    key_id VARCHAR(64) NOT NULL UNIQUE COMMENT 'KEK identifier',
    
    -- Key metadata
    algorithm VARCHAR(32) NOT NULL COMMENT 'e.g., AES-256-GCM',
    key_size INT NOT NULL COMMENT 'Key size in bits',
    
    -- Lifecycle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP NULL,
    deactivated_at TIMESTAMP NULL,
    destroyed_at TIMESTAMP NULL,
    
    -- Status
    status ENUM('PENDING', 'ACTIVE', 'ROTATED', 'REVOKED', 'DESTROYED') NOT NULL,
    
    -- Usage tracking
    files_encrypted INT DEFAULT 0,
    
    INDEX idx_status (status),
    INDEX idx_active (activated_at, deactivated_at)
) ENGINE=InnoDB COMMENT='KEK lifecycle management';

-- ================================================
-- INITIAL DATA
-- ================================================

-- Insert default KEK record (if using database-tracked KEKs)
INSERT INTO key_management (key_id, algorithm, key_size, activated_at, status)
VALUES (
    'kek-001',
    'AES-256-GCM',
    256,
    CURRENT_TIMESTAMP,
    'ACTIVE'
) ON DUPLICATE KEY UPDATE key_id=key_id;

-- ================================================
-- STORED PROCEDURES
-- ================================================

-- Procedure to clean up expired sessions
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS cleanup_expired_sessions()
BEGIN
    DELETE FROM session_tokens
    WHERE expires_at < NOW()
    AND revoked = FALSE;
    
    SELECT ROW_COUNT() as deleted_count;
END$$
DELIMITER ;

-- Procedure to get user file statistics
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS get_user_stats(IN p_user_id INT UNSIGNED)
BEGIN
    SELECT 
        COUNT(*) as total_files,
        SUM(original_size) as total_size_bytes,
        MAX(uploaded_at) as last_upload,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_files
    FROM files
    WHERE user_id = p_user_id;
END$$
DELIMITER ;

-- ================================================
-- VIEWS
-- ================================================

-- Active files view (excludes soft-deleted)
CREATE OR REPLACE VIEW active_files AS
SELECT 
    f.id,
    f.user_id,
    u.email as user_email,
    f.filename,
    f.original_size,
    f.mime_type,
    f.uploaded_at,
    f.last_accessed,
    OCTET_LENGTH(f.ciphertext) as encrypted_size
FROM files f
JOIN users u ON f.user_id = u.id
WHERE f.deleted_at IS NULL;

-- Recent audit log view
CREATE OR REPLACE VIEW recent_audit AS
SELECT 
    a.id,
    a.user_id,
    u.email as user_email,
    a.action_type,
    a.resource_type,
    a.status,
    a.ip_address,
    a.timestamp
FROM audit_log a
LEFT JOIN users u ON a.user_id = u.id
ORDER BY a.timestamp DESC
LIMIT 1000;

-- ================================================
-- TRIGGERS
-- ================================================

-- Log file uploads
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS after_file_insert
AFTER INSERT ON files
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, resource_type, resource_id, status)
    VALUES (NEW.user_id, 'FILE_UPLOAD', 'FILE', NEW.id, 'SUCCESS');
END$$
DELIMITER ;

-- Log file deletions
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS after_file_delete
AFTER UPDATE ON files
FOR EACH ROW
BEGIN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        INSERT INTO audit_log (user_id, action_type, resource_type, resource_id, status)
        VALUES (NEW.user_id, 'FILE_DELETE', 'FILE', NEW.id, 'SUCCESS');
    END IF;
END$$
DELIMITER ;

-- ================================================
-- SECURITY GRANTS
-- ================================================

-- Grant necessary permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON vault_db.* TO 'vault_user'@'%';
GRANT EXECUTE ON PROCEDURE vault_db.cleanup_expired_sessions TO 'vault_user'@'%';
GRANT EXECUTE ON PROCEDURE vault_db.get_user_stats TO 'vault_user'@'%';
FLUSH PRIVILEGES;

-- ================================================
-- VERIFICATION
-- ================================================

-- Show created tables
SHOW TABLES;

-- Show table structures
DESCRIBE users;
DESCRIBE files;
DESCRIBE audit_log;

-- Show indexes
SHOW INDEX FROM files;

SELECT 'Database initialization complete!' as status;