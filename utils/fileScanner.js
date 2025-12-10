const fs = require('fs');
const path = require('path');

/**
 * File scanning utilities for theme rebranding
 * Provides functions to recursively scan directories for files containing "Resonance"
 */

// Supported file types for scanning
const SUPPORTED_FILE_TYPES = ['.js', '.jsx', '.json', '.css', '.md'];

// Context patterns for different types of content
const CONTEXT_PATTERNS = {
  metadata: /(?:title|description|name|author)[\s]*[:=][\s]*['""][^'"]*Resonance[^'"]*['"]/gi,
  content: /(?:text|content|message|testimonial)[\s]*[:=][\s]*['""][^'"]*Resonance[^'"]*['"]/gi,
  config: /(?:name|projectName|appName)[\s]*[:=][\s]*['""][^'"]*resonance[^'"]*['"]/gi,
  general: /Resonance/gi
};

/**
 * Recursively scans a directory for files containing "Resonance"
 * @param {string} dirPath - Directory path to scan
 * @param {Array<string>} fileTypes - File extensions to include (default: SUPPORTED_FILE_TYPES)
 * @param {Array<string>} excludeDirs - Directory names to exclude (default: ['node_modules', '.git', '.next'])
 * @returns {Promise<Array<Object>>} Array of file scan results
 */
async function scanDirectoryForResonance(dirPath, fileTypes = SUPPORTED_FILE_TYPES, excludeDirs = ['node_modules', '.git', '.next']) {
  const results = [];
  
  try {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        // Skip excluded directories
        if (excludeDirs.includes(item.name)) {
          continue;
        }
        
        // Recursively scan subdirectories
        const subResults = await scanDirectoryForResonance(fullPath, fileTypes, excludeDirs);
        results.push(...subResults);
      } else if (item.isFile()) {
        // Check if file type is supported
        const fileExt = path.extname(item.name);
        if (fileTypes.includes(fileExt)) {
          const scanResult = await scanFileForResonance(fullPath);
          if (scanResult.matches.length > 0) {
            results.push(scanResult);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
  
  return results;
}

/**
 * Scans a single file for "Resonance" references
 * @param {string} filePath - Path to the file to scan
 * @returns {Promise<Object>} Scan result object
 */
async function scanFileForResonance(filePath) {
  const result = {
    filePath,
    fileType: path.extname(filePath),
    matches: [],
    totalMatches: 0,
    contexts: []
  };
  
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, lineIndex) => {
      // Check for general Resonance matches
      const generalMatches = [...line.matchAll(CONTEXT_PATTERNS.general)];
      
      generalMatches.forEach(match => {
        const matchInfo = {
          line: lineIndex + 1,
          column: match.index + 1,
          text: match[0],
          context: determineContext(line, match[0]),
          lineContent: line.trim()
        };
        
        result.matches.push(matchInfo);
      });
    });
    
    result.totalMatches = result.matches.length;
    result.contexts = [...new Set(result.matches.map(m => m.context))];
    
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    result.error = error.message;
  }
  
  return result;
}

/**
 * Determines the context of a "Resonance" match based on the line content
 * @param {string} line - The line containing the match
 * @param {string} match - The matched text
 * @returns {string} Context type (metadata, content, config, or general)
 */
function determineContext(line, match) {
  const lowerLine = line.toLowerCase();
  
  // Check for metadata context
  if (CONTEXT_PATTERNS.metadata.test(line)) {
    return 'metadata';
  }
  
  // Check for content context
  if (CONTEXT_PATTERNS.content.test(line)) {
    return 'content';
  }
  
  // Check for config context
  if (CONTEXT_PATTERNS.config.test(line)) {
    return 'config';
  }
  
  // Check for common metadata fields
  if (lowerLine.includes('title') || lowerLine.includes('description') || lowerLine.includes('name')) {
    return 'metadata';
  }
  
  // Check for JSON property patterns
  if (lowerLine.includes('"name"') || lowerLine.includes("'name'")) {
    return 'config';
  }
  
  return 'general';
}

/**
 * Filters scan results by context type
 * @param {Array<Object>} scanResults - Results from scanDirectoryForResonance
 * @param {string} contextType - Context type to filter by
 * @returns {Array<Object>} Filtered results
 */
function filterByContext(scanResults, contextType) {
  return scanResults.filter(result => 
    result.contexts.includes(contextType)
  );
}

/**
 * Gets a summary of all scan results
 * @param {Array<Object>} scanResults - Results from scanDirectoryForResonance
 * @returns {Object} Summary statistics
 */
function getScanSummary(scanResults) {
  const summary = {
    totalFiles: scanResults.length,
    totalMatches: scanResults.reduce((sum, result) => sum + result.totalMatches, 0),
    fileTypes: {},
    contexts: {}
  };
  
  scanResults.forEach(result => {
    // Count by file type
    const fileType = result.fileType;
    summary.fileTypes[fileType] = (summary.fileTypes[fileType] || 0) + 1;
    
    // Count by context
    result.contexts.forEach(context => {
      summary.contexts[context] = (summary.contexts[context] || 0) + result.matches.filter(m => m.context === context).length;
    });
  });
  
  return summary;
}

module.exports = {
  scanDirectoryForResonance,
  scanFileForResonance,
  determineContext,
  filterByContext,
  getScanSummary,
  SUPPORTED_FILE_TYPES,
  CONTEXT_PATTERNS
};