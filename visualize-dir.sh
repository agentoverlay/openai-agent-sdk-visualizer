#!/bin/bash

# Check if path argument is provided
if [ $# -eq 0 ]; then
  echo "Error: Please provide a path to a directory containing Python files"
  echo "Usage: ./visualize-dir.sh /path/to/directory"
  exit 1
fi

TARGET_DIR="$1"

# Validate directory exists
if [ ! -d "$TARGET_DIR" ]; then
  echo "Error: Directory '$TARGET_DIR' does not exist"
  exit 1
fi

# Create public directory if it doesn't exist
mkdir -p public

# Find all Python files in the directory
PYTHON_FILES=$(find "$TARGET_DIR" -name "*.py" | tr '\n' ' ')

if [ -z "$PYTHON_FILES" ]; then
  echo "No Python files found in directory '$TARGET_DIR'"
  exit 1
fi

echo "Found the following Python files:"
find "$TARGET_DIR" -name "*.py" | while read -r file; do
  echo "  - $(basename "$file")"
done

echo "Processing files..."

# Run the visualizer script
node scripts/visualize.js "$TARGET_DIR"

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "Starting the development server..."
  npm run dev &
  
  # Wait for server to start
  echo "Waiting for server to start..."
  for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null; then
      break
    fi
    sleep 1
    echo -n "."
  done
  echo ""
fi

echo "Opening visualization in browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  open http://localhost:3000/local-file
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  xdg-open http://localhost:3000/local-file
else
  start http://localhost:3000/local-file
fi

echo "Visualization is running at: http://localhost:3000/local-file"
