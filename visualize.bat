@echo off
echo OpenAI Agents SDK Visualizer

REM Check if path argument is provided
if "%~1"=="" (
  echo Error: Please provide a path to a Python file or directory
  echo Usage: visualize.bat C:\path\to\file.py
  echo    or: visualize.bat C:\path\to\directory
  exit /b 1
)

REM Create temp directory if it doesn't exist
if not exist "public" mkdir public

REM Run the visualizer script
node scripts/visualize.js "%~1"

REM Start the development server
start /B npm run dev

REM Wait a moment for the server to start
timeout /t 5 > nul

REM Open the browser
start http://localhost:3000/local-file
