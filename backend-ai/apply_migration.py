import os
import mysql.connector
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASS", ""),
            database=os.getenv("DB_NAME", "dromane_db")
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Error connecting to MySQL: {err}")
        return None

def run_migration():
    print("Connecting to database...")
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database.")
        return

    cursor = conn.cursor()
    
    migration_file = "migrations/001_research_context.sql"
    print(f"Reading migration file: {migration_file}...")
    
    try:
        with open(migration_file, 'r') as f:
            sql_script = f.read()
        
        # Split by statements
        statements = sql_script.split(';')
        
        for statement in statements:
            if statement.strip():
                print(f"Executing: {statement.strip()[:50]}...")
                cursor.execute(statement)
        
        conn.commit()
        print("Migration applied successfully!")
        
    except FileNotFoundError:
        print(f"Error: Migration file '{migration_file}' not found.")
    except mysql.connector.Error as err:
        print(f"Database error: {err}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
