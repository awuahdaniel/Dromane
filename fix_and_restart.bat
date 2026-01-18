@echo off
echo ===================================================
echo   RESTARTING DROMANE SYSTEM - FIXING DRIVERS
echo ===================================================
echo.
echo 1. Stopping old background processes...
taskkill /F /IM php.exe /T >nul 2>&1
taskkill /F /IM uvicorn.exe /T >nul 2>&1

echo.
echo 2. Ensuring Drivers are Loaded...
echo.

:: Restart normal start script
call start_servers.bat
