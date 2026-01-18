@echo off
echo ============================================
echo Starting MySQL via XAMPP
echo ============================================
echo.

REM Check if XAMPP is installed
if not exist "C:\xampp\mysql_start.bat" (
    echo ERROR: XAMPP not found at C:\xampp
    echo Please install XAMPP or update the path in this script
    pause
    exit /b 1
)

echo Starting MySQL...
cd /d C:\xampp
call mysql_start.bat

echo.
echo ============================================
echo MySQL should now be starting...
echo Check XAMPP Control Panel to verify
echo ============================================
pause
