const fs = require('fs');
const path = require('path');

/**
 * Text replacement engine for theme rebranding
 * Provides context-aware replacement logic with validation and rollback functionality
 */

/**
 * Replacement configuration for different contexts
 */
const REPLACEMENT_CONFIG = {
  'Resonance': 'CodeSage',
  'resonance': 'codesage',
  'RESONANCE': 'CODESAGE',
  'resonance-next': 'codesage-next'
};

/**
 * Context-aware replacement rules
 */
const CONTEXT_RULES = {
  metadata: {
    preserveCase: true,
    validateJson: true,
    customReplacements: {
      'Resonance - Modern': 'CodeSage - Modern',
      'Resonance Theme': 'CodeSage Theme',
      'Resonance Portfolio': 'CodeSage Portfolio'
    }
  },
  content: {
    preserveCase: true,
    validateJson: false,
    customReplacements: {
      'working with Resonance': 'working with CodeSage',
      'Resonance team': 'CodeSage team',
      'Resonance company': 'CodeSage company'
    }
  },
  config: {
    preserveCase: false,
    validateJson: true,
    customReplacements: {
      'resonance-next': 'codesage-next',
      '"name": "resonance-next"': '"name": "codesage-next"'
    }
  }
};

/**
 * Creates a backup of the original file before replacement
 * @param {string} filePath - Path to the file to backup
 * @returns {Promise<string>} Path to the backup file
 */
async function createBackup(filePath) {
  const backupPath = `${filePath}.backup.${Date.now()}`;
  
  try {
    await fs.promises.copyFile(filePath, backupPath);
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to create backup for ${filePath}: ${error.message}`);
  }
}

/**
 * Validates JSON syntax after replacement
 * @param {string} content - Content to validate
 * @returns {boolean} True if valid JSON, false otherwise
 */
function validateJsonSyntax(content) {
  try {
    JSON.parse(content);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Performs context-aware text replacement
 * @param {string} content - Original content
 * @param {string} context - Context type (metadata, content, config, general)
 * @param {Object} options - Replacement options
 * @returns {Object} Replacement result
 */
function performReplacement(content, context = 'general', options = {}) {
  const result = {
    originalContent: content,
    updatedContent: content,
    replacements: [],
    success: true,
    error: null
  };
  
  try {
    let updatedContent = content;
    const contextRules = CONTEXT_RULES[context] || {};
    
    // Apply custom replacements first if they exist for this context
    if (contextRules.customReplacements) {
      Object.entries(contextRules.customReplacements).forEach(([search, replace]) => {
        const regex = new RegExp(escapeRegExp(search), 'g');
        const matches = [...updatedContent.matchAll(regex)];
        
        if (matches.length > 0) {
          updatedContent = updatedContent.replace(regex, replace);
          result.replacements.push({
            type: 'custom',
            search,
            replace,
            count: matches.length
          });
        }
      });
    }
    
    // Apply standard replacements
    Object.entries(REPLACEMENT_CONFIG).forEach(([search, replace]) => {
      const regex = new RegExp(escapeRegExp(search), 'g');
      const matches = [...updatedContent.matchAll(regex)];
      
      if (matches.length > 0) {
        updatedContent = updatedContent.replace(regex, replace);
        result.replacements.push({
          type: 'standard',
          search,
          replace,
          count: matches.length
        });
      }
    });
    
    result.updatedContent = updatedContent;
    
    // Validate JSON if required
    if (contextRules.validateJson && options.validateJson !== false) {
      if (!validateJsonSyntax(updatedContent)) {
        result.success = false;
        result.error = 'JSON syntax validation failed after replacement';
        result.updatedContent = content; // Revert to original
      }
    }
    
  } catch (error) {
    result.success = false;
    result.error = error.message;
    result.updatedContent = content; // Revert to original
  }
  
  return result;
}

/**
 * Replaces text in a single file with backup and rollback functionality
 * @param {string} filePath - Path to the file to process
 * @param {string} context - Context type for replacement rules
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing result
 */
async function replaceInFile(filePath, context = 'general', options = {}) {
  const result = {
    filePath,
    success: false,
    backupPath: null,
    replacements: [],
    error: null
  };
  
  try {
    // Create backup first
    if (options.createBackup !== false) {
      result.backupPath = await createBackup(filePath);
    }
    
    // Read original content
    const originalContent = await fs.promises.readFile(filePath, 'utf8');
    
    // Determine validation requirements based on file type
    const fileExt = path.extname(filePath);
    const shouldValidateJson = fileExt === '.json';
    
    // Perform replacement
    const replacementResult = performReplacement(originalContent, context, {
      ...options,
      validateJson: shouldValidateJson
    });
    
    if (!replacementResult.success) {
      result.error = replacementResult.error;
      return result;
    }
    
    // Only write if there were actual changes
    if (replacementResult.updatedContent !== originalContent) {
      await fs.promises.writeFile(filePath, replacementResult.updatedContent, 'utf8');
      result.replacements = replacementResult.replacements;
    }
    
    result.success = true;
    
  } catch (error) {
    result.error = error.message;
    
    // Attempt rollback if backup exists
    if (result.backupPath && options.autoRollback !== false) {
      try {
        await rollbackFile(filePath, result.backupPath);
        result.error += ' (automatically rolled back)';
      } catch (rollbackError) {
        result.error += ` (rollback failed: ${rollbackError.message})`;
      }
    }
  }
  
  return result;
}

/**
 * Rolls back a file from its backup
 * @param {string} filePath - Original file path
 * @param {string} backupPath - Backup file path
 * @returns {Promise<void>}
 */
async function rollbackFile(filePath, backupPath) {
  try {
    await fs.promises.copyFile(backupPath, filePath);
  } catch (error) {
    throw new Error(`Failed to rollback ${filePath} from ${backupPath}: ${error.message}`);
  }
}

/**
 * Processes multiple files with batch replacement
 * @param {Array<Object>} fileList - Array of file objects with path and context
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Batch processing result
 */
async function batchReplace(fileList, options = {}) {
  const result = {
    totalFiles: fileList.length,
    successCount: 0,
    failureCount: 0,
    results: [],
    summary: {
      totalReplacements: 0,
      backupPaths: []
    }
  };
  
  for (const fileInfo of fileList) {
    const filePath = typeof fileInfo === 'string' ? fileInfo : fileInfo.path;
    const context = typeof fileInfo === 'object' ? fileInfo.context : 'general';
    
    try {
      const fileResult = await replaceInFile(filePath, context, options);
      result.results.push(fileResult);
      
      if (fileResult.success) {
        result.successCount++;
        result.summary.totalReplacements += fileResult.replacements.reduce((sum, r) => sum + r.count, 0);
        if (fileResult.backupPath) {
          result.summary.backupPaths.push(fileResult.backupPath);
        }
      } else {
        result.failureCount++;
      }
      
    } catch (error) {
      result.failureCount++;
      result.results.push({
        filePath,
        success: false,
        error: error.message,
        replacements: []
      });
    }
  }
  
  return result;
}

/**
 * Cleans up backup files
 * @param {Array<string>} backupPaths - Array of backup file paths to remove
 * @returns {Promise<Object>} Cleanup result
 */
async function cleanupBackups(backupPaths) {
  const result = {
    totalBackups: backupPaths.length,
    removedCount: 0,
    errors: []
  };
  
  for (const backupPath of backupPaths) {
    try {
      await fs.promises.unlink(backupPath);
      result.removedCount++;
    } catch (error) {
      result.errors.push({
        path: backupPath,
        error: error.message
      });
    }
  }
  
  return result;
}

/**
 * Escapes special regex characters in a string
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  performReplacement,
  replaceInFile,
  batchReplace,
  createBackup,
  rollbackFile,
  cleanupBackups,
  validateJsonSyntax,
  REPLACEMENT_CONFIG,
  CONTEXT_RULES
};