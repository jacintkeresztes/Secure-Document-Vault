 -- Users table
  CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Files table
  CREATE TABLE IF NOT EXISTS files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      filename VARCHAR(255) NOT NULL,
      original_filename VARCHAR(255) NOT NULL,
      file_size BIGINT NOT NULL,
      encryption_key TEXT NOT NULL,
      upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Sessions table (for authentication)
  CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(255) PRIMARY KEY,
      user_id INT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );