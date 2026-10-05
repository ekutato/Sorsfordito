@echo off
echo ================================
echo Penzugyi Sorsfordito - Setup
echo ================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [HIBA] Node.js nincs telepitve!
    echo.
    echo Futtasd eloszor: install-nodejs.bat
    echo Vagy toltsd le innen: https://nodejs.org/en/download
    echo.
    pause
    exit /b 1
)

echo Node.js verzio:
node --version
echo npm verzio:
npm --version
echo.

echo [1/3] Fuggosegek telepitese...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [HIBA] npm install sikertelen!
    pause
    exit /b 1
)
echo.

echo [2/3] TypeScript ellenorzes...
call npx tsc --noEmit
echo.

echo [3/3] Dev szerver inditasa...
echo A jatek elerheto lesz: http://localhost:3000
echo (Ctrl+C a leallitashoz)
echo.
call npm run dev
