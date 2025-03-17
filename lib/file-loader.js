/**
 * Utility for loading files from the filesystem
 */
const fs = require('fs');
const path = require('path');

/**
 * Load a Python file from the filesystem
 * @param {string} filePath - Path to the Python file
 * @returns {Object} - Object containing the file name and content
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
    throw new Error(`Error loading file ${filePath}: ${error.message}`);
  }
}

/**
 * Load all Python files from a directory
 * @param {string} dirPath - Path to the directory
 * @returns {Array} - Array of objects containing file names and contents
 */
function loadPythonFilesFromDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    
    const files = fs.readdirSync(dirPath)
      .filter(file => file.toLowerCase().endsWith('.py'))
      .map(file => {
        const filePath = path.join(dirPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        return { name: file, content };
      });
    
    return files;
  } catch (error) {
    throw new Error(`Error loading files from directory ${dirPath}: ${error.message}`);
  }
}

module.exports = {
  loadPythonFile,
  loadPythonFilesFromDirectory
};
