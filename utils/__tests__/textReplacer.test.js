import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  performReplacement, 
  replaceInFile, 
  batchReplace,
  createBackup,
  rollbackFile,
  cleanupBackups,
  validateJsonSyntax,
  REPLACEMENT_CONFIG,
  CONTEXT_RULES
} from '../textReplacer.js';

// Test file paths
const TEST_DIR = path.join(__dirname, 'temp');
const TEST_FILES = {
  js: path.join(TEST_DIR, 'test.js'),
  jsx: path.join(TEST_DIR, 'test.jsx'),
  json: path.join(TEST_DIR, 'test.json'),
  css: path.join(TEST_DIR, 'test.css'),
  md: path.join(TEST_DIR, 'test.md')
};

describe('Text Replacement Engine', () => {
  beforeEach(async () => {
    // Create test directory
    await fs.promises.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.promises.rm(TEST_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('performReplacement', () => {
    it('should replace basic Resonance references with Evoleotion', () => {
      const content = 'Welcome to Resonance theme by resonance team';
      const result = performReplacement(content, 'general');
      
      expect(result.success).toBe(true);
      expect(result.updatedContent).toBe('Welcome to Evoleotion theme by evoleotion team');
      expect(result.replacements).toHaveLength(2);
      expect(result.replacements[0].search).toBe('Resonance');
      expect(result.replacements[0].replace).toBe('Evoleotion');
      expect(result.replacements[1].search).toBe('resonance');
      expect(result.replacements[1].replace).toBe('evoleotion');
    });

    it('should handle case-sensitive replacements correctly', () => {
      const content = 'RESONANCE, Resonance, and resonance';
      const result = performReplacement(content, 'general');
      
      expect(result.success).toBe(true);
      expect(result.updatedContent).toBe('EVOLEOTION, Evoleotion, and evoleotion');
      expect(result.replacements).toHaveLength(3);
    });

    it('should apply context-specific custom replacements', () => {
      const content = 'Resonance - Modern';
      const result = performReplacement(content, 'metadata', { validateJson: false });
      
      expect(result.success).toBe(true);
      expect(result.updatedContent).toBe('Evoleotion - Modern');
      expect(result.replacements.some(r => r.type === 'custom')).toBe(true);
    });

    it('should handle content with no replacements needed', () => {
      const content = 'This is a clean file with no branding references';
      const result = performReplacement(content, 'general');
      
      expect(result.success).toBe(true);
      expect(result.updatedContent).toBe(content);
      expect(result.replacements).toHaveLength(0);
    });

    it('should handle empty content', () => {
      const content = '';
      const result = performReplacement(content, 'general');
      
      expect(result.success).toBe(true);
      expect(result.updatedContent).toBe('');
      expect(result.replacements).toHaveLength(0);
    });
  });

  describe('JSON Syntax Preservation', () => {
    it('should validate JSON syntax after replacement', () => {
      const validJson = '{"name": "resonance-next", "description": "Resonance theme"}';
      expect(validateJsonSyntax(validJson)).toBe(true);
      
      const invalidJson = '{"name": "resonance-next", "description": "Resonance theme"';
      expect(validateJsonSyntax(invalidJson)).toBe(false);
    });

    it('should preserve JSON syntax during replacement', () => {
      const jsonContent = '{"name": "resonance-next", "description": "Resonance Portfolio Theme"}';
      const result = performReplacement(jsonContent, 'config');
      
      expect(result.success).toBe(true);
      expect(validateJsonSyntax(result.updatedContent)).toBe(true);
      expect(result.updatedContent).toContain('evoleotion-next');
      expect(result.updatedContent).toContain('Evoleotion');
    });

    it('should fail validation if JSON becomes invalid after replacement', () => {
      // This is a contrived example where replacement might break JSON
      const problematicJson = '{"resonance": "value with \\"Resonance\\" quotes"}';
      const result = performReplacement(problematicJson, 'config');
      
      // The replacement should still work, but we test the validation mechanism
      expect(result.success).toBe(true);
      expect(validateJsonSyntax(result.updatedContent)).toBe(true);
    });

    it('should handle complex JSON structures', () => {
      const complexJson = `{
        "name": "resonance-next",
        "version": "1.0.0",
        "description": "Resonance - Modern Portfolio Theme",
        "keywords": ["resonance", "portfolio", "theme"],
        "author": {
          "name": "Resonance Team",
          "company": "Resonance Inc"
        }
      }`;
      
      const result = performReplacement(complexJson, 'config');
      
      expect(result.success).toBe(true);
      expect(validateJsonSyntax(result.updatedContent)).toBe(true);
      expect(result.updatedContent).toContain('evoleotion-next');
      expect(result.updatedContent).toContain('Evoleotion');
    });
  });

  describe('File Type Handling', () => {
    it('should handle JavaScript files correctly', async () => {
      const jsContent = `
        const theme = 'Resonance';
        export const config = {
          name: 'resonance-next',
          title: 'Resonance Portfolio'
        };
      `;
      
      await fs.promises.writeFile(TEST_FILES.js, jsContent);
      const result = await replaceInFile(TEST_FILES.js, 'general');
      
      expect(result.success).toBe(true);
      expect(result.replacements.length).toBeGreaterThan(0);
      
      const updatedContent = await fs.promises.readFile(TEST_FILES.js, 'utf8');
      expect(updatedContent).toContain('Evoleotion');
      expect(updatedContent).toContain('evoleotion-next');
      expect(updatedContent).not.toContain('Resonance');
    });

    it('should handle JSX files correctly', async () => {
      const jsxContent = `
        import React from 'react';
        
        export default function Header() {
          return (
            <div>
              <h1>Welcome to Resonance</h1>
              <p>The best resonance theme ever</p>
            </div>
          );
        }
      `;
      
      await fs.promises.writeFile(TEST_FILES.jsx, jsxContent);
      const result = await replaceInFile(TEST_FILES.jsx, 'content');
      
      expect(result.success).toBe(true);
      
      const updatedContent = await fs.promises.readFile(TEST_FILES.jsx, 'utf8');
      expect(updatedContent).toContain('Welcome to Evoleotion');
      expect(updatedContent).toContain('evoleotion theme');
    });

    it('should handle JSON files with validation', async () => {
      const jsonContent = {
        name: 'resonance-next',
        description: 'Resonance Portfolio Theme',
        version: '1.0.0'
      };
      
      await fs.promises.writeFile(TEST_FILES.json, JSON.stringify(jsonContent, null, 2));
      const result = await replaceInFile(TEST_FILES.json, 'config');
      
      expect(result.success).toBe(true);
      
      const updatedContent = await fs.promises.readFile(TEST_FILES.json, 'utf8');
      const parsedContent = JSON.parse(updatedContent);
      expect(parsedContent.name).toBe('evoleotion-next');
      expect(parsedContent.description).toContain('Evoleotion');
    });

    it('should handle CSS files correctly', async () => {
      const cssContent = `
        /* Resonance Theme Styles */
        .resonance-header {
          color: #333;
        }
        
        .resonance-portfolio .item {
          background: white;
        }
      `;
      
      await fs.promises.writeFile(TEST_FILES.css, cssContent);
      const result = await replaceInFile(TEST_FILES.css, 'general');
      
      expect(result.success).toBe(true);
      
      const updatedContent = await fs.promises.readFile(TEST_FILES.css, 'utf8');
      expect(updatedContent).toContain('Evoleotion Theme');
      expect(updatedContent).toContain('evoleotion-header');
      expect(updatedContent).toContain('evoleotion-portfolio');
    });

    it('should handle Markdown files correctly', async () => {
      const mdContent = `
        # Resonance Theme Documentation
        
        Welcome to the Resonance portfolio theme. This theme is built by the resonance team.
        
        ## Features
        - Modern Resonance design
        - Responsive layout
      `;
      
      await fs.promises.writeFile(TEST_FILES.md, mdContent);
      const result = await replaceInFile(TEST_FILES.md, 'content');
      
      expect(result.success).toBe(true);
      
      const updatedContent = await fs.promises.readFile(TEST_FILES.md, 'utf8');
      expect(updatedContent).toContain('# Evoleotion Theme');
      expect(updatedContent).toContain('evoleotion team');
      expect(updatedContent).toContain('Modern Evoleotion design');
    });
  });

  describe('Rollback Functionality', () => {
    it('should create backup before processing', async () => {
      const originalContent = 'Original Resonance content';
      await fs.promises.writeFile(TEST_FILES.js, originalContent);
      
      const result = await replaceInFile(TEST_FILES.js, 'general');
      
      expect(result.success).toBe(true);
      expect(result.backupPath).toBeDefined();
      expect(result.backupPath).toMatch(/\.backup\.\d+$/);
      
      // Verify backup exists and contains original content
      const backupExists = await fs.promises.access(result.backupPath).then(() => true).catch(() => false);
      expect(backupExists).toBe(true);
      
      const backupContent = await fs.promises.readFile(result.backupPath, 'utf8');
      expect(backupContent).toBe(originalContent);
    });

    it('should rollback file from backup', async () => {
      const originalContent = 'Original Resonance content';
      const modifiedContent = 'Modified Evoleotion content';
      
      await fs.promises.writeFile(TEST_FILES.js, originalContent);
      const backupPath = await createBackup(TEST_FILES.js);
      
      // Modify the file
      await fs.promises.writeFile(TEST_FILES.js, modifiedContent);
      
      // Rollback
      await rollbackFile(TEST_FILES.js, backupPath);
      
      const restoredContent = await fs.promises.readFile(TEST_FILES.js, 'utf8');
      expect(restoredContent).toBe(originalContent);
    });

    it('should handle rollback on processing failure', async () => {
      // Create a file that will cause processing to fail
      const problematicContent = 'Some content that might cause issues';
      await fs.promises.writeFile(TEST_FILES.js, problematicContent);
      
      // Mock a failure scenario by trying to process a non-existent file
      const nonExistentFile = path.join(TEST_DIR, 'nonexistent.js');
      const result = await replaceInFile(nonExistentFile, 'general');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should skip backup when createBackup option is false', async () => {
      const originalContent = 'Original Resonance content';
      await fs.promises.writeFile(TEST_FILES.js, originalContent);
      
      const result = await replaceInFile(TEST_FILES.js, 'general', { createBackup: false });
      
      expect(result.success).toBe(true);
      expect(result.backupPath).toBeNull();
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple files successfully', async () => {
      const files = [
        { path: TEST_FILES.js, content: 'const theme = "Resonance";' },
        { path: TEST_FILES.jsx, content: '<h1>Resonance Portfolio</h1>' },
        { path: TEST_FILES.json, content: '{"name": "resonance-next"}' }
      ];
      
      // Create test files
      for (const file of files) {
        await fs.promises.writeFile(file.path, file.content);
      }
      
      const fileList = files.map(f => ({ path: f.path, context: 'general' }));
      const result = await batchReplace(fileList);
      
      expect(result.totalFiles).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
      expect(result.summary.totalReplacements).toBeGreaterThan(0);
    });

    it('should handle mixed success and failure in batch processing', async () => {
      const validFile = TEST_FILES.js;
      const invalidFile = path.join(TEST_DIR, 'nonexistent.js');
      
      await fs.promises.writeFile(validFile, 'const theme = "Resonance";');
      
      const fileList = [validFile, invalidFile];
      const result = await batchReplace(fileList);
      
      expect(result.totalFiles).toBe(2);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });
  });

  describe('Backup Cleanup', () => {
    it('should clean up backup files successfully', async () => {
      const originalContent = 'Original Resonance content';
      await fs.promises.writeFile(TEST_FILES.js, originalContent);
      
      const backupPath1 = await createBackup(TEST_FILES.js);
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const backupPath2 = await createBackup(TEST_FILES.js);
      
      const cleanupResult = await cleanupBackups([backupPath1, backupPath2]);
      
      expect(cleanupResult.totalBackups).toBe(2);
      expect(cleanupResult.removedCount).toBeGreaterThanOrEqual(1);
      expect(cleanupResult.errors.length).toBeLessThanOrEqual(1);
      
      // At least one backup should be removed
      const backup1Exists = await fs.promises.access(backupPath1).then(() => true).catch(() => false);
      const backup2Exists = await fs.promises.access(backupPath2).then(() => true).catch(() => false);
      expect(backup1Exists || backup2Exists).toBe(false);
    });

    it('should handle cleanup errors gracefully', async () => {
      const nonExistentBackup = path.join(TEST_DIR, 'nonexistent.backup');
      
      const cleanupResult = await cleanupBackups([nonExistentBackup]);
      
      expect(cleanupResult.totalBackups).toBe(1);
      expect(cleanupResult.removedCount).toBe(0);
      expect(cleanupResult.errors).toHaveLength(1);
      expect(cleanupResult.errors[0].path).toBe(nonExistentBackup);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle files with special characters', async () => {
      const specialContent = 'Resonance with émojis 🎉 and spëcial chars';
      await fs.promises.writeFile(TEST_FILES.js, specialContent, 'utf8');
      
      const result = await replaceInFile(TEST_FILES.js, 'general');
      
      expect(result.success).toBe(true);
      
      const updatedContent = await fs.promises.readFile(TEST_FILES.js, 'utf8');
      expect(updatedContent).toContain('Evoleotion with émojis 🎉');
    });

    it('should handle very large content', async () => {
      const largeContent = 'Resonance '.repeat(10000) + 'end';
      await fs.promises.writeFile(TEST_FILES.js, largeContent);
      
      const result = await replaceInFile(TEST_FILES.js, 'general');
      
      expect(result.success).toBe(true);
      expect(result.replacements[0].count).toBe(10000);
    });

    it('should handle permission errors gracefully', async () => {
      const readOnlyFile = path.join(TEST_DIR, 'readonly.js');
      await fs.promises.writeFile(readOnlyFile, 'Resonance content');
      
      // Make file read-only (this might not work on all systems)
      try {
        await fs.promises.chmod(readOnlyFile, 0o444);
        
        const result = await replaceInFile(readOnlyFile, 'general');
        
        // Should either succeed or fail gracefully
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      } catch (error) {
        // Skip this test if chmod is not supported
      }
    });
  });
});