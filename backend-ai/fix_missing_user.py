import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

def fix_missing_user():
    print("Fixing missing user ID 189372508...")
    
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASS", ""),
            database=os.getenv("DB_NAME", "dromane_db"),
            port=int(os.getenv("DB_PORT", "3306"))
        )
        cursor = connection.cursor()
        
        # Check if user exists
        user_id = 189372508
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if cursor.fetchone():
            print(f"User {user_id} already exists.")
        else:
            print(f"User {user_id} not found. Creating placeholder user...")
            # Insert placeholder user to satisfy foreign key
            cursor.execute("""
                INSERT INTO users (id, name, email, password_hash) 
                VALUES (%s, %s, %s, %s)
            """, (user_id, "Dev User", "dev@example.com", "placeholder_hash"))
            connection.commit()
            print(f"✅ Created user {user_id}. requests should work now!")
            
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_missing_user()
