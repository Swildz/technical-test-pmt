/**
 * Script: run-snapshot-now.js
 * Manually trigger usage snapshot generation immediately and save to CSV.
 */

const { generateUsageSnapshot } = require('../src/services/snapshotService');

console.log('>>> Triggering manual usage snapshot...');
try {
  const result = generateUsageSnapshot();
  console.log('\n[SUCCESS] Snapshot created successfully:');
  console.log(`- File:       ${result.filename}`);
  console.log(`- Full Path:  ${result.filePath}`);
  console.log(`- Records:    ${result.recordCount}`);
  console.log(`- Timestamp:  ${result.generatedAtWIB}\n`);
} catch (err) {
  console.error('[ERROR] Failed to generate snapshot:', err);
  process.exit(1);
}
