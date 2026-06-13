@echo off
title Hearth ^& Harvest - Local Server
cd /d "%~dp0"

echo ============================================
echo  Hearth ^& Harvest - Local Server (ngrok)
echo ============================================
echo.
echo Starting local server on port 8000...
start "H&H Python Server" /min python -m http.server 8000
timeout /t 2 >nul

echo.
echo Starting ngrok tunnel...
echo.
echo The ngrok dashboard will open in a new window.
echo Look for the "Forwarding" URL — it looks like:
echo    https://abc-12-34-56-78.ngrok-free.app
echo.
echo Send your friend that URL with /farm-prototype-v6.html on the end.
echo Example: https://abc-12-34-56-78.ngrok-free.app/farm-prototype-v6.html
echo Same URL stays alive as long as this window is open. Close to stop.
echo ============================================
echo.

ngrok http 8000

echo.
echo Tunnel stopped. Press any key to exit.
pause >nul
