import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """
    Establishes a connection to the MySQL database.
    Returns:
        mysql.connector.connection.MySQLConnection: The database connection object.
    Raises:
        mysql.connector.Error: If the connection fails.
    """
    db_host = os.getenv("DB_HOST", "localhost")
    db_user = os.getenv("DB_USER", "root")
    db_pass = os.getenv("DB_PASS", "")
    db_name = os.getenv("DB_NAME", "dromane_db")
    db_port = os.getenv("DB_PORT", "3306")

    if not db_host or not db_user:
        print("Error: DB_HOST or DB_USER not found in environment variables.")
        raise ValueError("Missing database configuration in .env")

    try:
        connection = mysql.connector.connect(
            host=db_host,
            user=db_user,
            password=db_pass,
            database=db_name,
            port=int(db_port)
        )
        return connection
    except Error as err:
        print(f"Error connecting to MySQL: {err}")
        raise
