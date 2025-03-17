@echo off
echo OpenAI Agents SDK Visualizer

REM Install dependencies if needed
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)

REM Start the development server
echo Starting Agent Visualizer...
call npm run dev
