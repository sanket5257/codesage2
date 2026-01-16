# Rebranding Utilities

This directory contains utilities for safely rebranding the Resonance theme to Evoleotion. The utilities provide comprehensive file scanning, text replacement, backup, and rollback functionality.

## Files Overview

### Core Utilities

- **`fileScanner.js`** - Recursively scans directories for files containing "Resonance"
- **`textReplacer.js`** - Context-aware text replacement engine with JSON validation
- **`rebrandingUtils.js`** - Main utility combining scanning and replacement functionality
- **`backupStrategy.js`** - Backup and restore functionality for safe operations

### Testing and Demo

- **`demo.js`** - Demonstration script showing how to use the utilities
- **`__tests__/setup.test.js`** - Test setup verification
- **`README.md`** - This documentation file

## Quick Start

### 1. Dry Run Analysis

Before making any changes, perform a dry run to see what would be modified:

```javascript
const { performDryRun } = require('./utils/rebrandingUtils');

async function analyze() {
  const result = await performDryRun('.');
  console.log(`Found ${result.filesFound} files with ${result.totalMatches} matches`);
}
```

### 2. Create Backup

Always create a backup before making changes:

```javascript
const { createFullProjectBackup } = require('./utils/backupStrategy');

async function backup() {
  const result = await createFullProjectBackup();
  console.log(`Backup created at: ${result.backupPath}`);
}
```

### 3. Perform Rebranding

Execute the complete rebranding process:

```javascript
const { performCompleteRebranding } = require('./utils/rebrandingUtils');

async function rebrand() {
  const result = await performCompleteRebranding('.', {
    createBackup: true,
    autoRollback: true
  });
  
  if (result.success) {
    console.log('Rebranding completed successfully!');
  } else {
    console.log('Rebranding failed:', result.error);
  }
}
```

## Features

### File Scanner (`fileScanner.js`)

- **Recursive directory scanning** with configurable file type filtering
- **Context detection** for different types of content (metadata, content, config)
- **Pattern matching** for various contexts where "Resonance" might appear
- **Exclusion support** for directories like `node_modules`, `.git`, `.next`

### Text Replacer (`textReplacer.js`)

- **Context-aware replacements** with different rules for different file types
- **JSON syntax validation** to ensure configuration files remain valid
- **Backup creation** for individual files before modification
- **Rollback functionality** if replacements fail
- **Batch processing** for multiple files

### Backup Strategy (`backupStrategy.js`)

- **Full project backups** with timestamped directories
- **Selective file restoration** from backups
- **Backup manifest** tracking for audit trails
- **Cleanup utilities** for managing old backups

## Configuration

### Supported File Types

By default, the scanner processes these file types:
- `.js` - JavaScript files
- `.jsx` - React components
- `.json` - Configuration files
- `.css` - Stylesheets
- `.md` - Markdown documentation

### Replacement Rules

The text replacer uses these default replacements:
- `Resonance` → `Evoleotion`
- `resonance` → `evoleotion`
- `RESONANCE` → `EVOLEOTION`
- `resonance-next` → `evoleotion-next`

### Context-Specific Rules

Different contexts have specialized replacement logic:

- **Metadata**: Preserves case, validates JSON, handles page titles
- **Content**: Preserves case, handles testimonials and descriptions
- **Config**: Lowercase preference, validates JSON, handles package names

## Testing

The utilities include property-based testing using fast-check:

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## Safety Features

1. **Automatic Backups**: Files are backed up before modification
2. **JSON Validation**: Configuration files are validated after changes
3. **Rollback Capability**: Failed operations can be automatically reverted
4. **Dry Run Mode**: Preview changes without making modifications
5. **Error Handling**: Comprehensive error reporting and recovery

## Usage Examples

### Run Demo

```javascript
const { runDemo } = require('./utils/demo');
runDemo();
```

### Custom Scanning

```javascript
const { scanDirectoryForResonance } = require('./utils/fileScanner');

const results = await scanDirectoryForResonance('./src', ['.js', '.jsx']);
console.log(`Found ${results.length} files to process`);
```

### Restore from Backup

```javascript
const { restoreFromBackup, listAvailableBackups } = require('./utils/backupStrategy');

const backups = await listAvailableBackups();
if (backups.length > 0) {
  await restoreFromBackup(backups[0].path);
}
```

## Requirements Validation

These utilities fulfill the following requirements from the specification:

- **Requirement 2.1**: Complete file scanning and branding replacement
- **Requirement 2.5**: Build process validation and error handling
- **Requirement 1.1-1.4**: Comprehensive text replacement across all file types
- **Requirement 3.1-3.5**: Content and metadata updates with context awareness

## Property-Based Testing

The utilities are designed to support property-based testing with the following properties:

1. **Complete branding replacement** across all source files
2. **Content branding consistency** in user-facing text
3. **Configuration file branding consistency** in package and config files
4. **CSS and style file branding consistency** in stylesheets

Each property test runs a minimum of 100 iterations to ensure reliability.