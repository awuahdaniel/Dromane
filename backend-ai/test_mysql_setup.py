import os
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error

load_dotenv()

def test_mysql_connection():
    """Test MySQL connection and create database if needed"""
    print("=" * 60)
    print("MySQL Connection Test")
    print("=" * 60)
    
    db_host = os.getenv("DB_HOST", "localhost")
    db_user = os.getenv("DB_USER", "root")
    db_pass = os.getenv("DB_PASS", "")
    db_name = os.getenv("DB_NAME", "dromane_db")
    db_port = os.getenv("DB_PORT", "3306")
    
    print(f"\nConnection Details:")
    print(f"  Host: {db_host}")
    print(f"  Port: {db_port}")
    print(f"  User: {db_user}")
    print(f"  Database: {db_name}")
    print(f"  Password: {'(set)' if db_pass else '(empty)'}")
    
    # First, try to connect without specifying database
    try:
        print("\n[1/3] Connecting to MySQL server...")
        connection = mysql.connector.connect(
            host=db_host,
            user=db_user,
            password=db_pass,
            port=int(db_port)
        )
        print("✅ Successfully connected to MySQL server!")
        
        cursor = connection.cursor()
        
        # Create database if it doesn't exist
        print(f"\n[2/3] Creating database '{db_name}' if not exists...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"✅ Database '{db_name}' is ready!")
        
        # Switch to the database
        cursor.execute(f"USE {db_name}")
        
        # Create users table
        print("\n[3/3] Creating tables...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                profile_picture VARCHAR(500),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_users_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        # Create pdf_cache table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pdf_cache (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                filename VARCHAR(255) NOT NULL,
                content LONGTEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_pdf_cache_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        # Create research_sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS research_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                primary_topic VARCHAR(255) DEFAULT 'General Research',
                is_active BOOLEAN DEFAULT TRUE,
                session_summary TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_sessions_user (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        # Create research_entries table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS research_entries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                query TEXT NOT NULL,
                response LONGTEXT,
                extracted_facts LONGTEXT,
                sources_used INT DEFAULT 0,
                query_embedding TEXT, 
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_entries_session (session_id),
                FOREIGN KEY (session_id) REFERENCES research_sessions(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        connection.commit()
        print("✅ All tables created successfully!")
        
        # Show tables
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"\nTables in '{db_name}':")
        for table in tables:
            print(f"  - {table[0]}")
        
        cursor.close()
        connection.close()
        
        print("\n" + "=" * 60)
        print("✅ MySQL is ready! You can now start the backend server.")
        print("=" * 60)
        return True
        
    except Error as e:
        print(f"\n❌ MySQL Error: {e}")
        print("\nTroubleshooting:")
        print("  1. Make sure MySQL server is running (XAMPP/WAMP/MySQL service)")
        print("  2. Check your .env file for correct credentials")
        print("  3. Verify MySQL is listening on port 3306")
        print("  4. If using XAMPP, start MySQL from the control panel")
        return False

if __name__ == "__main__":
    test_mysql_connection()
