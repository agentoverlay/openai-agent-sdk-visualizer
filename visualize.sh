#!/bin/bash

# Check if path argument is provided
if [ $# -eq 0 ]; then
  echo "Error: Please provide a path to a Python file or directory"
  echo "Usage: ./visualize.sh /path/to/file.py"
  echo "   or: ./visualize.sh /path/to/directory"
  exit 1
fi

# Get absolute path
TARGET_PATH=$(realpath "$1")

# Create temp directory if it doesn't exist
mkdir -p public

# Run the visualizer script
node scripts/visualize.js "$TARGET_PATH"

# Start the server if it's not already running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "Starting the development server..."
  npm run dev &
  # Wait for the server to start
  sleep 5
fi

# Open the browser (works on macOS, Linux, and Windows)
if [[ "$OSTYPE" == "darwin"* ]]; then
  open http://localhost:3000/local-file
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  xdg-open http://localhost:3000/local-file
else
  start http://localhost:3000/local-file
fi
