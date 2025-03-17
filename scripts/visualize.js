#!/usr/bin/env node

/**
 * Command-line script to visualize a specific file or directory
 */
const fs = require('fs');
const path = require('path');

// Get command line argument
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Error: Please provide a path to a Python file or directory');
  console.log('Usage: node scripts/visualize.js /path/to/file.py');
  console.log('   or: node scripts/visualize.js /path/to/directory');
  process.exit(1);
}

const targetPath = args[0];

// Create temporary storage file to hold the file data
const TEMP_STORAGE_PATH = path.join(__dirname, '..', 'public', 'temp-data.json');

/**
 * Load a Python file from the filesystem
 */
function loadPythonFile(filePath) {
  try {
    // Check if file exists and has .py extension
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    if (!filePath.toLowerCase().endsWith('.py')) {
      throw new Error(`File is not a Python file: ${filePath}`);
    }
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    const name = path.basename(filePath);
    
    return { name, content };
  } catch (error) {
    console.error(`Error loading file ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Load all Python files from a directory
 */
function loadPythonFilesFromDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    
    // Get all .py files in the directory (non-recursive)
    let pythonFiles = [];
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      if (file.toLowerCase().endsWith('.py') && fs.statSync(filePath).isFile()) {
        const content = fs.readFileSync(filePath, 'utf8');
        pythonFiles.push({ name: file, content });
      }
    });
    
    return pythonFiles;
  } catch (error) {
    console.error(`Error loading files from directory ${dirPath}: ${error.message}`);
    return [];
  }
}

try {
  let files = [];
  
  if (fs.existsSync(targetPath)) {
    if (fs.statSync(targetPath).isDirectory()) {
      console.log(`Loading Python files from directory: ${targetPath}`);
      files = loadPythonFilesFromDirectory(targetPath);
      console.log(`Loaded ${files.length} Python files`);
    } else {
      console.log(`Loading Python file: ${targetPath}`);
      const fileData = loadPythonFile(targetPath);
      if (fileData) {
        files = [fileData];
        console.log(`Loaded file: ${path.basename(targetPath)}`);
      }
    }
  } else {
    console.error(`Error: Path does not exist: ${targetPath}`);
    process.exit(1);
  }
  
  if (files.length === 0) {
    console.error(`Error: No valid Python files found at ${targetPath}`);
    process.exit(1);
  }
  
  // Store the files in temporary storage
  fs.writeFileSync(TEMP_STORAGE_PATH, JSON.stringify(files, null, 2));
  
  console.log('Data prepared. Please open http://localhost:3000/local-file to view the visualization.');
  console.log('If the server is not running, start it with: npm run dev');
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
