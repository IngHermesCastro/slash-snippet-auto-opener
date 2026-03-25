@echo off
REM Quick start setup for Windows

echo.
echo 🚀 Slash Snippet Extension - Setup Script
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js version: %NODE_VERSION%

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm version: %NPM_VERSION%

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✓ Dependencies installed

REM Build the extension
echo.
echo 🔨 Building extension...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✓ Build successful!

REM Success
echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Open: chrome://extensions/
echo 2. Enable: Developer mode (toggle in top right)
echo 3. Click: Load unpacked
echo 4. Select: This project folder
echo.
echo For development:
echo   npm run dev       # Watch and rebuild on changes
echo   npm run build     # One-time build
echo   npm run type-check # Check TypeScript types
echo.
echo Happy coding! 🎉
echo.
pause
