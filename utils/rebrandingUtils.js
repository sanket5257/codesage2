const { scanDirectoryForResonance, getScanSummary } = require('./fileScanner');
const { batchReplace, cleanupBackups } = require('./textReplacer');

/**
 * Main rebranding utility that combines scanning and replacement functionality
 */

/**
 * Performs a complete rebranding operation
 * @param {string} rootPath - Root directory to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Complete operation result
 */
async function performCompleteRebranding(rootPath = '.', options = {}) {
  const result = {
    scanResults: null,
    replacementResults: null,
    summary: null,
    success: false,
    error: null
  };
  
  try {
    console.log('Starting rebranding process...');
    
    // Step 1: Scan for files containing "Resonance"
    console.log('Scanning for files containing "Resonance"...');
    const scanResults = await scanDirectoryForResonance(rootPath);
    result.scanResults = scanResults;
    
    if (scanResults.length === 0) {
      console.log('No files containing "Resonance" found.');
      result.success = true;
      return result;
    }
    
    console.log(`Found ${scanResults.length} files containing "Resonance"`);
    
    // Step 2: Prepare file list for replacement
    const fileList = scanResults.map(scanResult => ({
      path: scanResult.filePath,
      context: determineFileContext(scanResult)
    }));
    
    // Step 3: Perform batch replacement
    console.log('Performing text replacements...');
    const replacementResults = await batchReplace(fileList, {
      createBackup: options.createBackup !== false,
      autoRollback: options.autoRollback !== false
    });
    result.replacementResults = replacementResults;
    
    // Step 4: Generate summary
    result.summary = {
      scan: getScanSummary(scanResults),
      replacement: {
        totalFiles: replacementResults.totalFiles,
        successCount: replacementResults.successCount,
        failureCount: replacementResults.failureCount,
        totalReplacements: replacementResults.summary.totalReplacements
      }
    };
    
    result.success = replacementResults.failureCount === 0;
    
    console.log(`Rebranding completed. Success: ${result.success}`);
    console.log(`Files processed: ${replacementResults.successCount}/${replacementResults.totalFiles}`);
    console.log(`Total replacements made: ${replacementResults.summary.totalReplacements}`);
    
  } catch (error) {
    result.error = error.message;
    console.error('Rebranding failed:', error.message);
  }
  
  return result;
}

/**
 * Determines the appropriate context for a file based on its scan results
 * @param {Object} scanResult - Result from file scanning
 * @returns {string} Context type
 */
function determineFileContext(scanResult) {
  const { filePath, contexts } = scanResult;
  const fileExt = require('path').extname(filePath);
  
  // JSON files are typically config
  if (fileExt === '.json') {
    return 'config';
  }
  
  // If multiple contexts, prioritize metadata > config > content > general
  if (contexts.includes('metadata')) {
    return 'metadata';
  }
  
  if (contexts.includes('config')) {
    return 'config';
  }
  
  if (contexts.includes('content')) {
    return 'content';
  }
  
  return 'general';
}

/**
 * Performs a dry run to show what would be changed without making actual changes
 * @param {string} rootPath - Root directory to analyze
 * @returns {Promise<Object>} Dry run results
 */
async function performDryRun(rootPath = '.') {
  console.log('Performing dry run analysis...');
  
  const scanResults = await scanDirectoryForResonance(rootPath);
  const summary = getScanSummary(scanResults);
  
  const dryRunResult = {
    filesFound: scanResults.length,
    totalMatches: summary.totalMatches,
    fileTypes: summary.fileTypes,
    contexts: summary.contexts,
    fileDetails: scanResults.map(result => ({
      path: result.filePath,
      matches: result.totalMatches,
      contexts: result.contexts,
      sampleMatches: result.matches.slice(0, 3) // Show first 3 matches as examples
    }))
  };
  
  console.log(`Dry run completed:`);
  console.log(`- Files to process: ${dryRunResult.filesFound}`);
  console.log(`- Total matches: ${dryRunResult.totalMatches}`);
  console.log(`- File types: ${Object.keys(dryRunResult.fileTypes).join(', ')}`);
  console.log(`- Contexts: ${Object.keys(dryRunResult.contexts).join(', ')}`);
  
  return dryRunResult;
}

module.exports = {
  performCompleteRebranding,
  performDryRun,
  determineFileContext
};