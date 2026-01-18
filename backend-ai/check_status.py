import os
import sys

print("=" * 70)
print("🔍 DROMANE AI - SYSTEM STATUS CHECK")
print("=" * 70)

# Check 1: MySQL Connector
print("\n[1/5] Checking MySQL Connector...")
try:
    import mysql.connector
    print("✅ mysql-connector-python is installed")
except ImportError:
    print("❌ mysql-connector-python NOT installed")
    print("   Run: pip install mysql-connector-python")
    sys.exit(1)

# Check 2: Environment Variables
print("\n[2/5] Checking Environment Variables...")
from dotenv import load_dotenv
load_dotenv()

required_vars = ["DB_HOST", "DB_USER", "DB_NAME", "JWT_SECRET", "GROQ_API_KEY", "SERPER_API_KEY"]
missing = []
for var in required_vars:
    value = os.getenv(var)
    if value:
        if var in ["JWT_SECRET", "GROQ_API_KEY", "SERPER_API_KEY"]:
            print(f"✅ {var}: {'*' * 10} (hidden)")
        else:
            print(f"✅ {var}: {value}")
    else:
        print(f"❌ {var}: NOT SET")
        missing.append(var)

if missing:
    print(f"\n⚠️  Missing variables: {', '.join(missing)}")
    print("   Check your .env file!")

# Check 3: MySQL Connection
print("\n[3/5] Checking MySQL Connection...")
try:
    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASS", ""),
        port=int(os.getenv("DB_PORT", "3306"))
    )
    print("✅ MySQL server is reachable")
    connection.close()
except Exception as e:
    print(f"❌ Cannot connect to MySQL: {e}")
    print("   Make sure MySQL is running (XAMPP Control Panel)")
    sys.exit(1)

# Check 4: Database Exists
print("\n[4/5] Checking Database...")
try:
    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASS", ""),
        database=os.getenv("DB_NAME", "dromane_db"),
        port=int(os.getenv("DB_PORT", "3306"))
    )
    cursor = connection.cursor()
    cursor.execute("SHOW TABLES")
    tables = [table[0] for table in cursor.fetchall()]
    
    if tables:
        print(f"✅ Database '{os.getenv('DB_NAME')}' exists with {len(tables)} tables:")
        for table in tables:
            print(f"   - {table}")
    else:
        print(f"⚠️  Database exists but no tables found")
        print("   Run: python test_mysql_setup.py")
    
    cursor.close()
    connection.close()
except Exception as e:
    print(f"❌ Database not found: {e}")
    print("   Run: python test_mysql_setup.py")

# Check 5: Required Python Packages
print("\n[5/5] Checking Python Dependencies...")
required_packages = [
    "fastapi",
    "uvicorn",
    "python-dotenv",
    "python-jose",
    "passlib",
    "groq",
    "requests",
    "beautifulsoup4",
    "newspaper3k"
]

missing_packages = []
for package in required_packages:
    try:
        __import__(package.replace("-", "_"))
        print(f"✅ {package}")
    except ImportError:
        print(f"❌ {package}")
        missing_packages.append(package)

if missing_packages:
    print(f"\n⚠️  Missing packages: {', '.join(missing_packages)}")
    print("   Run: pip install -r requirements.txt")

# Final Summary
print("\n" + "=" * 70)
if not missing and not missing_packages:
    print("✅ ALL CHECKS PASSED! You're ready to start the backend.")
    print("\nTo start the server, run:")
    print("   python main.py")
    print("\nOr with uvicorn:")
    print("   uvicorn main:app --reload --host 0.0.0.0 --port 8001")
else:
    print("⚠️  SOME CHECKS FAILED - Please fix the issues above")
print("=" * 70)
