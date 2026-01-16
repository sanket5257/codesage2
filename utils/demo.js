const { performDryRun, performCompleteRebranding } = require('./rebrandingUtils');
const { createFullProjectBackup, listAvailableBackups } = require('./backupStrategy');

/**
 * Demo script showing how to use the rebranding utilities
 */

async function runDemo() {
  console.log('=== Rebranding Utilities Demo ===\n');
  
  try {
    // Step 1: Perform a dry run to see what would be changed
    console.log('1. Performing dry run analysis...');
    const dryRunResult = await performDryRun('.');
    
    console.log('\nDry Run Results:');
    console.log(`- Files containing "Resonance": ${dryRunResult.filesFound}`);
    console.log(`- Total matches found: ${dryRunResult.totalMatches}`);
    console.log(`- File types affected: ${Object.keys(dryRunResult.fileTypes).join(', ')}`);
    console.log(`- Contexts found: ${Object.keys(dryRunResult.contexts).join(', ')}`);
    
    if (dryRunResult.filesFound > 0) {
      console.log('\nSample files that would be modified:');
      dryRunResult.fileDetails.slice(0, 5).forEach(file => {
        console.log(`  - ${file.path} (${file.matches} matches)`);
      });
    }
    
    // Step 2: Show backup functionality
    console.log('\n2. Backup functionality demo...');
    const backups = await listAvailableBackups();
    console.log(`Current backups available: ${backups.length}`);
    
    if (backups.length > 0) {
      console.log('Recent backups:');
      backups.slice(0, 3).forEach(backup => {
        console.log(`  - ${backup.name} (created: ${backup.created.toISOString()})`);
      });
    }
    
    // Step 3: Show what a full rebranding would do (without actually doing it)
    console.log('\n3. Full rebranding simulation...');
    console.log('A full rebranding would:');
    console.log('  - Create a timestamped backup of the entire project');
    console.log('  - Replace all instances of "Resonance" with "Evoleotion"');
    console.log('  - Replace "resonance-next" with "evoleotion-next" in package.json');
    console.log('  - Update metadata, content, and configuration files');
    console.log('  - Validate JSON syntax after replacements');
    console.log('  - Provide rollback capability if any errors occur');
    
    console.log('\n=== Demo completed successfully ===');
    
  } catch (error) {
    console.error('Demo failed:', error.message);
  }
}

// Uncomment the line below to run the demo
// runDemo();

module.exports = { runDemo };