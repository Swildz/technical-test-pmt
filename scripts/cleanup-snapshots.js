/**
 * Script: cleanup-snapshots.js
 * Q2 Requirement: Removes CSV snapshots older than 30 days (or specified days).
 *
 * Usage:
 *   node scripts/cleanup-snapshots.js
 *   node scripts/cleanup-snapshots.js 15   (custom retention days)
 */

const { cleanupOldSnapshots, SNAPSHOTS_DIR } = require('../src/services/snapshotService');

// Accept optional retention argument from CLI
const args = process.argv.slice(2);
const retentionDays = args[0] ? parseInt(args[0], 10) : 30;

if (isNaN(retentionDays) || retentionDays < 0) {
  console.error('[ERROR] Retention days must be a positive integer.');
  process.exit(1);
}

console.log('====================================================');
console.log(`  CSV Snapshot Cleanup Script (Q2)`);
console.log(`  Directory:      ${SNAPSHOTS_DIR}`);
console.log(`  Retention:      ${retentionDays} days`);
console.log('====================================================');

try {
  const result = cleanupOldSnapshots(retentionDays);

  console.log(`\nCleanup Results:`);
  console.log(`- Cutoff Date:   ${result.cutoffDate}`);
  console.log(`- Total Files:   ${result.totalFound}`);
  console.log(`- Files Kept:    ${result.totalKept}`);
  console.log(`- Files Deleted: ${result.totalDeleted}`);

  if (result.deletedFiles.length > 0) {
    console.log('\nDeleted Files Detail:');
    result.deletedFiles.forEach(f => {
      console.log(`  [X] ${f.filename} (Age: ${f.ageInDays} days)`);
    });
  } else {
    console.log('\nNo snapshot files older than 30 days found.');
  }

  console.log('\n[SUCCESS] Cleanup process completed cleanly.\n');
} catch (error) {
  console.error('[FATAL ERROR] Cleanup failed:', error);
  process.exit(1);
}
