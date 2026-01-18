# MySQL Setup Guide for Dromane AI Backend

## Prerequisites
1. **Install MySQL Server** (if not already installed)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP/WAMP/MAMP which includes MySQL

## Setup Steps

### 1. Start MySQL Server
- **XAMPP**: Start MySQL from the XAMPP Control Panel
- **Standalone MySQL**: Ensure the MySQL service is running

### 2. Create the Database
Open MySQL command line or phpMyAdmin and run:
```bash
mysql -u root -p < setup_mysql.sql
```

Or manually in MySQL:
```sql
source setup_mysql.sql;
```

### 3. Configure Environment Variables
Update your `.env` file with your MySQL credentials:

```env
# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_mysql_password_here
DB_NAME=dromane_db
```

**Important**: Replace `your_mysql_password_here` with your actual MySQL root password.

### 4. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 5. Test Database Connection
```bash
python test_db_prod.py
```

### 6. Run the Backend Server
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload --port 8001
```

## Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"
- Check your MySQL password in the `.env` file
- Ensure MySQL server is running

### Error: "Unknown database 'dromane_db'"
- Run the `setup_mysql.sql` script to create the database

### Error: "No module named 'mysql.connector'"
- Install the MySQL connector: `pip install mysql-connector-python`

### Error: "Can't connect to MySQL server"
- Ensure MySQL service is running
- Check if the port (3306) is correct
- Verify `DB_HOST` is set to `localhost`

## Default MySQL Credentials (XAMPP/WAMP)
- **Host**: localhost
- **Port**: 3306
- **User**: root
- **Password**: (empty by default)
- **Database**: dromane_db

## Security Notes
- Never commit your `.env` file with real passwords to version control
- Change the default MySQL root password for production
- Use a dedicated MySQL user with limited privileges for production
