import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """
    Establishes a connection to the PostgreSQL database (Supabase).
    Returns:
        psycopg2.extensions.connection: The database connection object.
    Raises:
        psycopg2.Error: If the connection fails.
    """
    try:
        connection = psycopg2.connect(
            host=os.getenv("DB_HOST", "db.hbqnolnqcgjkuqzhukal.supabase.co"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASS", ""),
            database=os.getenv("DB_NAME", "postgres"),
            port=int(os.getenv("DB_PORT", 5432)),
            sslmode="require"
        )
        return connection
    except psycopg2.Error as err:
        print(f"Error connecting to PostgreSQL: {err}")
        raise
