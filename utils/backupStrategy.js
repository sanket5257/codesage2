const fs = require('fs');
const path = require('path');

/**
 * Backup strategy utilities for safe file operations during rebranding
 */

/**
 * Creates a timestamped backup directory
 * @param {string} baseDir - Base directory for backups (default: './backups')
 * @returns {Promise<string>} Path to the created backup directory
 */
async function createBackupDirectory(baseDir = './backups') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(baseDir, `rebranding-backup-${timestamp}`);
  
  try {
    await fs.promises.mkdir(backupDir, { recursive: true });
    return backupDir;
  } catch (error) {
    throw new Error(`Failed to create backup directory: ${error.message}`);
  }
}

/**
 * Creates a full project backup before starting rebranding
 * @param {string} sourceDir - Source directory to backup (default: '.')
 * @param {string} backupDir - Backup directory path
 * @param {Array<string>} excludeDirs - Directories to exclude from backup
 * @returns {Promise<Object>} Backup operation result
 */
async function createFullProjectBackup(sourceDir = '.', backupDir = null, excludeDirs = ['node_modules', '.git', '.next', 'backups']) {
  if (!backupDir) {
    backupDir = await createBackupDirectory();
  }
  
  const result = {
    backupPath: backupDir,
    filesBackedUp: 0,
    errors: [],
    success: false
  };
  
  try {
    await copyDirectoryRecursive(sourceDir, backupDir, excludeDirs, result);
    result.success = result.errors.length === 0;
    
    // Create backup manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      sourceDir: path.resolve(sourceDir),
      backupDir: path.resolve(backupDir),
      filesBackedUp: result.filesBackedUp,
      excludedDirs: excludeDirs,
      errors: result.errors
    };
    
    await fs.promises.writeFile(
      path.join(backupDir, 'backup-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
  } catch (error) {
    result.errors.push({
      type: 'backup_creation',
      message: error.message
    });
  }
  
  return result;
}

/**
 * Recursively copies a directory structure
 * @param {string} source - Source directory
 * @param {string} destination - Destination directory
 * @param {Array<string>} excludeDirs - Directories to exclude
 * @param {Object} result - Result object to update
 */
async function copyDirectoryRecursive(source, destination, excludeDirs, result) {
  try {
    const items = await fs.promises.readdir(source, { withFileTypes: true });
    
    // Ensure destination directory exists
    await fs.promises.mkdir(destination, { recursive: true });
    
    for (const item of items) {
      const sourcePath = path.join(source, item.name);
      const destPath = path.join(destination, item.name);
      
      if (item.isDirectory()) {
        // Skip excluded directories
        if (excludeDirs.includes(item.name)) {
          continue;
        }
        
        // Recursively copy subdirectory
        await copyDirectoryRecursive(sourcePath, destPath, excludeDirs, result);
      } else if (item.isFile()) {
        try {
          await fs.promises.copyFile(sourcePath, destPath);
          result.filesBackedUp++;
        } catch (error) {
          result.errors.push({
            type: 'file_copy',
            file: sourcePath,
            message: error.message
          });
        }
      }
    }
  } catch (error) {
    result.errors.push({
      type: 'directory_read',
      directory: source,
      message: error.message
    });
  }
}

/**
 * Restores files from a backup
 * @param {string} backupDir - Backup directory path
 * @param {string} targetDir - Target directory to restore to
 * @param {Array<string>} specificFiles - Specific files to restore (optional)
 * @returns {Promise<Object>} Restore operation result
 */
async function restoreFromBackup(backupDir, targetDir = '.', specificFiles = null) {
  const result = {
    filesRestored: 0,
    errors: [],
    success: false
  };
  
  try {
    // Check if backup manifest exists
    const manifestPath = path.join(backupDir, 'backup-manifest.json');
    let manifest = null;
    
    try {
      const manifestContent = await fs.promises.readFile(manifestPath, 'utf8');
      manifest = JSON.parse(manifestContent);
    } catch (error) {
      result.errors.push({
        type: 'manifest_read',
        message: 'Could not read backup manifest'
      });
    }
    
    if (specificFiles) {
      // Restore specific files only
      for (const file of specificFiles) {
        const sourcePath = path.join(backupDir, file);
        const destPath = path.join(targetDir, file);
        
        try {
          // Ensure destination directory exists
          await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
          await fs.promises.copyFile(sourcePath, destPath);
          result.filesRestored++;
        } catch (error) {
          result.errors.push({
            type: 'file_restore',
            file: file,
            message: error.message
          });
        }
      }
    } else {
      // Restore entire backup
      await copyDirectoryRecursive(backupDir, targetDir, ['backup-manifest.json'], result);
    }
    
    result.success = result.errors.length === 0;
    
  } catch (error) {
    result.errors.push({
      type: 'restore_operation',
      message: error.message
    });
  }
  
  return result;
}

/**
 * Lists available backups
 * @param {string} backupBaseDir - Base backup directory
 * @returns {Promise<Array<Object>>} List of available backups
 */
async function listAvailableBackups(backupBaseDir = './backups') {
  const backups = [];
  
  try {
    const items = await fs.promises.readdir(backupBaseDir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory() && item.name.startsWith('rebranding-backup-')) {
        const backupPath = path.join(backupBaseDir, item.name);
        const manifestPath = path.join(backupPath, 'backup-manifest.json');
        
        let manifest = null;
        try {
          const manifestContent = await fs.promises.readFile(manifestPath, 'utf8');
          manifest = JSON.parse(manifestContent);
        } catch (error) {
          // Manifest not found or invalid
        }
        
        const stats = await fs.promises.stat(backupPath);
        
        backups.push({
          name: item.name,
          path: backupPath,
          created: stats.birthtime,
          manifest: manifest
        });
      }
    }
    
    // Sort by creation date (newest first)
    backups.sort((a, b) => b.created - a.created);
    
  } catch (error) {
    console.error('Error listing backups:', error.message);
  }
  
  return backups;
}

/**
 * Cleans up old backups, keeping only the specified number
 * @param {number} keepCount - Number of backups to keep (default: 5)
 * @param {string} backupBaseDir - Base backup directory
 * @returns {Promise<Object>} Cleanup result
 */
async function cleanupOldBackups(keepCount = 5, backupBaseDir = './backups') {
  const result = {
    backupsRemoved: 0,
    errors: []
  };
  
  try {
    const backups = await listAvailableBackups(backupBaseDir);
    
    if (backups.length > keepCount) {
      const backupsToRemove = backups.slice(keepCount);
      
      for (const backup of backupsToRemove) {
        try {
          await fs.promises.rm(backup.path, { recursive: true, force: true });
          result.backupsRemoved++;
        } catch (error) {
          result.errors.push({
            backup: backup.name,
            message: error.message
          });
        }
      }
    }
  } catch (error) {
    result.errors.push({
      type: 'cleanup_operation',
      message: error.message
    });
  }
  
  return result;
}

module.exports = {
  createBackupDirectory,
  createFullProjectBackup,
  restoreFromBackup,
  listAvailableBackups,
  cleanupOldBackups
};