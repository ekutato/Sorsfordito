@echo off
echo ============================================
echo   Node.js Automatikus Telepito
echo   (Penzugyi Sorsfordito projekthez)
echo ============================================
echo.

:: Check if Node.js is already installed
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Node.js mar telepitve van!
    node --version
    npm --version
    echo.
    echo Most futtasd: npm install
    echo Majd: npm run dev
    pause
    exit /b 0
)

echo [1/3] Node.js letoltese (v24.14.0 LTS)...
echo       Forras: https://nodejs.org/dist/v24.14.0/node-v24.14.0-x64.msi
echo.

:: Download Node.js MSI using PowerShell
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Write-Host 'Letoltes folyamatban... (kb. 30MB, varj turelemmel)'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v24.14.0/node-v24.14.0-x64.msi' -OutFile '%TEMP%\node-installer.msi' -UseBasicParsing; Write-Host 'Letoltes kesz!'}"

if not exist "%TEMP%\node-installer.msi" (
    echo [HIBA] A letoltes sikertelen!
    echo Kerjuk, toltsd le kezzel: https://nodejs.org/en/download
    echo Valaszd a "Windows Installer (.msi)" gombot.
    pause
    exit /b 1
)

echo.
echo [2/3] Node.js telepitese...
echo       (Adminisztratori jogokat kerhet - engedelyezd!)
echo.

:: Install Node.js silently
msiexec /i "%TEMP%\node-installer.msi" /qn /norestart

:: Wait for installation to finish
timeout /t 5 /nobreak >nul

:: Refresh PATH
set "PATH=%PATH%;C:\Program Files\nodejs"

echo.
echo [3/3] Ellenorzes...

:: Verify installation
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo.
    echo ============================================
    echo   [SIKER] Node.js sikeresen telepitve!
    echo ============================================
    echo.
    node --version
    npm --version
    echo.
    echo Kovetkezo lepes:
    echo   1. Nyiss egy UJ Command Prompt ablakot
    echo   2. cd C:\Users\zombo\Git4Claude\penzugyi-sorsfordito
    echo   3. npm install
    echo   4. npm run dev
    echo   5. Nyisd meg: http://localhost:3000
) else (
    echo.
    echo [INFO] A telepites valoszinuleg sikeres, de
    echo        ujra kell inditani a command prompt-ot.
    echo.
    echo Lepes:
    echo   1. Zard be EZT az ablakot
    echo   2. Nyiss egy UJ Command Prompt-ot
    echo   3. Ird be: node --version
    echo   4. Ha mukodik: cd C:\Users\zombo\Git4Claude\penzugyi-sorsfordito
    echo   5. npm install
    echo   6. npm run dev
)

echo.
:: Clean up
del "%TEMP%\node-installer.msi" 2>nul

pause
