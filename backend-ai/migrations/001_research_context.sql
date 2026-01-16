-- Research sessions table
CREATE TABLE IF NOT EXISTS research_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    primary_topic VARCHAR(255) NOT NULL,
    session_summary TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Research entries table
CREATE TABLE IF NOT EXISTS research_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    extracted_facts TEXT DEFAULT NULL,
    query_embedding JSON DEFAULT NULL,
    sources_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES research_sessions(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
