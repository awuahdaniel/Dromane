# 🚀 Quick Start Guide - Dromane AI Backend with MySQL

## ⚠️ IMPORTANT: Start MySQL First!

### Option 1: Using XAMPP Control Panel (Recommended)
1. Open **XAMPP Control Panel** (search for it in Windows Start menu)
2. Click **Start** next to **MySQL**
3. Wait for the status to turn green
4. Proceed to "Setup Database" below

### Option 2: Using the Batch Script
1. Double-click `start_mysql.bat` in this folder
2. Wait for MySQL to start
3. Proceed to "Setup Database" below

### Option 3: Manual Start
1. Navigate to `C:\xampp`
2. Run `mysql_start.bat`
3. Proceed to "Setup Database" below

---

## 📦 Setup Database

Once MySQL is running, execute:

```bash
python test_mysql_setup.py
```

This will:
- ✅ Connect to MySQL
- ✅ Create the `dromane_db` database
- ✅ Create all necessary tables (users, pdf_cache, research_context)
- ✅ Verify everything is working

---

## 🎯 Start the Backend Server

After database setup is complete:

```bash
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

The backend will be available at: **http://localhost:8001**

---

## 🔍 Verify Everything is Working

1. **Check Health Endpoint**:
   - Open browser: http://localhost:8001
   - Should see: `{"message": "Dromane AI Backend (Production)", "status": "Healthy"}`

2. **Check AI Health**:
   - Open browser: http://localhost:8001/health/ai
   - Should see: `{"status": "ok", "provider": "groq", ...}`

---

## 🐛 Troubleshooting

### MySQL Won't Start
- **Error**: "Port 3306 already in use"
  - Another MySQL instance is running
  - Stop other MySQL services or change port in `.env`

- **Error**: "MySQL service not found"
  - XAMPP MySQL not installed properly
  - Reinstall XAMPP

### Database Connection Failed
- **Error**: "Access denied for user 'root'"
  - Check `.env` file - update `DB_PASS` if you set a MySQL password
  - Default XAMPP password is empty

- **Error**: "Can't connect to MySQL server"
  - MySQL is not running - start it via XAMPP Control Panel
  - Check if port 3306 is correct in `.env`

### Backend Errors
- **Error**: "No module named 'mysql.connector'"
  ```bash
  pip install mysql-connector-python
  ```

- **Error**: "Table doesn't exist"
  ```bash
  python test_mysql_setup.py
  ```

---

## 📝 Current Configuration

Your `.env` file is configured with:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=dromane_db
```

**Note**: If you've set a MySQL root password, update `DB_PASS` in `.env`

---

## ✅ Complete Startup Checklist

- [ ] XAMPP installed
- [ ] MySQL started via XAMPP Control Panel
- [ ] Run `python test_mysql_setup.py` (creates database & tables)
- [ ] Run `python main.py` (starts backend server)
- [ ] Frontend running on http://localhost:5173
- [ ] Backend running on http://localhost:8001

---

## 🎉 You're Ready!

Once all steps are complete:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs
