@echo off
title Bhoomi Intel - All Servers

echo ==========================================
echo        BHOOMI INTEL STARTING...
echo ==========================================

cd /d "%~dp0"

echo.
echo Starting FastAPI...
start "FastAPI" /b cmd /c "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Starting Login Portal...
start "Login" /b cmd /c "cd /d "%~dp0login" && npm run dev -- --host 0.0.0.0 --port 5173"

echo Starting Officer Portal...
start "Officer Portal" /b cmd /c "cd /d "%~dp0officer-portal" && npm run dev -- --host 0.0.0.0 --port 5174"

echo Starting Citizen Portal...
start "Citizen Portal" /b cmd /c "cd /d "%~dp0citizen-portal" && npm run dev -- --host 0.0.0.0 --port 5175"

echo Starting GIS Map...
start "GIS Map" /b cmd /c "cd /d "%~dp0" && python -m http.server 5500"

echo.
echo Waiting for servers...
timeout /t 7 /nobreak >nul

echo.
echo Opening portals...

start "" "http://localhost:5173/"
start "" "http://localhost:5174/"
start "" "http://localhost:5175/"
start "" "http://localhost:5500/"

echo.
echo ==========================================
echo       BHOOMI INTEL IS RUNNING
echo ==========================================
echo.
echo Login Portal   : http://localhost:5173/
echo Officer Portal : http://localhost:5174/
echo Citizen Portal : http://localhost:5175/
echo GIS Map        : http://localhost:5500/
echo FastAPI        : http://localhost:8000/
echo.
echo DO NOT CLOSE THIS WINDOW.
echo Press CTRL+C to stop the servers.
echo.

cmd /k