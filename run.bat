@echo off
title Templum Salutis - The Healing Temple
cd /d "%~dp0"
echo.
echo   Templum Salutis - The Healing Temple
echo   Regenerating client config from .env...
node scripts\gen-config.mjs
if errorlevel 1 (
  echo.
  echo   Something is missing. Copy .env.example to .env, fill it in, then run again.
  pause
  exit /b 1
)
echo   Starting local server on http://localhost:8123
echo   (Close this window to stop the server)
echo.
start "" http://localhost:8123
python -m http.server 8123
