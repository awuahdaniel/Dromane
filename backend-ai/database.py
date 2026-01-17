import os
import mysql.connector
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
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            database=os.getenv("DB_NAME"),
            port=int(os.getenv("DB_PORT", 3306))
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Error connecting to MySQL: {err}")
        raise
