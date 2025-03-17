import { useState } from 'react';

const FileUploader = ({ onFileProcessed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };

  const processFiles = async (newFiles) => {
    setError(null);
    
    // Filter for Python files only
    const pythonFiles = newFiles.filter(file => file.name.endsWith('.py'));
    
    if (pythonFiles.length === 0) {
      setError('Please upload Python (.py) files only');
      return;
    }
    
    setFiles(prev => [...prev, ...pythonFiles]);
    
    // Process files and pass the results up
    const fileContents = await Promise.all(
      pythonFiles.map(async (file) => {
        const text = await file.text();
        return { name: file.name, content: text };
      })
    );
    
    // Call the parent callback with processed files
    onFileProcessed(fileContents);
  };

  return (
    <div className="w-full mb-6">
      <div 
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".py"
          className="hidden"
          onChange={handleFileSelect}
        />
        <svg 
          className="mx-auto h-12 w-12 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop Python files here, or click to select files
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Only .py files containing OpenAI Agents SDK code
        </p>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700">Uploaded Files:</h3>
          <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
