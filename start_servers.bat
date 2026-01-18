@echo off
echo ==========================================
echo      RESTARTING DROMANE SERVICES
echo ==========================================

echo 1. Killing old processes...
taskkill /F /FI "WINDOWTITLE eq PHP Backend (Auth)" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Python Backend (AI)" /T >nul 2>&1
taskkill /F /IM php.exe /T >nul 2>&1
taskkill /F /IM uvicorn.exe /T >nul 2>&1
timeout /t 2 >nul

echo 2. Starting PHP Backend (Fixing Drivers)...
start "PHP Backend (Auth)" cmd /k "cd backend-auth && php -S localhost:8000 router.php"

echo 3. Starting Python Backend (AI)...
start "Python Backend (AI)" cmd /k "cd backend-ai && uvicorn main:app --reload --port 8001"

echo 4. Starting Frontend...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo   ALL SYSTEMS GO!
echo   Please LOGOUT and LOGIN again.
echo ==========================================
pause
