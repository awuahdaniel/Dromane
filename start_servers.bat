@echo off
echo Starting Dromane AI Services...

:: Start PHP Backend (Port 8000)
start "PHP Backend (Auth)" cmd /k "cd backend-auth && php -S localhost:8000 router.php"

:: Start Python Backend (Port 8001)
start "Python Backend (AI)" cmd /k "cd backend-ai && uvicorn main:app --reload --port 8001"

:: Start Frontend (Port 5173)
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   ALL SERVERS STARTED!
echo ===================================================
echo.
echo   1. PHP Backend:    http://localhost:8000
echo   2. Python Backend: http://localhost:8001
echo   3. Frontend:       http://localhost:5173
echo.
echo   Don't close the black windows! Minimize them.
echo   You can now go to http://localhost:5173 in your browser.
echo ===================================================
pause
