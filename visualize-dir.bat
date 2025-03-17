@echo off
echo OpenAI Agents SDK Visualizer - Directory Mode

REM Check if path argument is provided
if "%~1"=="" (
  echo Error: Please provide a path to a directory containing Python files
  echo Usage: visualize-dir.bat C:\path\to\directory
  exit /b 1
)

set TARGET_DIR=%~1

REM Validate directory exists
if not exist "%TARGET_DIR%" (
  echo Error: Directory '%TARGET_DIR%' does not exist
  exit /b 1
)

REM Create public directory if it doesn't exist
if not exist "public" mkdir public

REM Find all Python files in the directory
echo Found the following Python files:
dir /b /s "%TARGET_DIR%\*.py" 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo No Python files found in directory '%TARGET_DIR%'
  exit /b 1
)

echo Processing files...

REM Run the visualizer script
node scripts/visualize.js "%TARGET_DIR%"

REM Start the development server in background
echo Starting the development server...
start /B npm run dev

REM Wait a moment for the server to start
echo Waiting for server to start...
timeout /t 10 > nul

echo Opening visualization in browser...
start http://localhost:3000/local-file

echo Visualization is running at: http://localhost:3000/local-file
