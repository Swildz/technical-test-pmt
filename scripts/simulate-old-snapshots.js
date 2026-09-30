/**
 * Script: simulate-old-snapshots.js
 * Generates test CSV snapshot files with simulated modification dates:
 * - 45 days old (should be cleaned up)
 * - 35 days old (should be cleaned up)
 * - 10 days old (should be kept)
 * - 2 days old (should be kept)
 */

const fs = require('fs');
const path = require('path');
const { SNAPSHOTS_DIR, recordsToCsv } = require('../src/services/snapshotService');
const store = require('../src/data/inMemoryStore');

if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

const sampleCsv = recordsToCsv(store.getRawUsageRecords());

const testFiles = [
  { daysAgo: 45, label: '45_days_old' },
  { daysAgo: 35, label: '35_days_old' },
  { daysAgo: 10, label: '10_days_old' },
  { daysAgo: 2,  label: '2_days_old' }
];

console.log('>>> Simulating test snapshot files for cleanup verification...\n');

testFiles.forEach(item => {
  const targetDate = new Date(Date.now() - (item.daysAgo * 24 * 60 * 60 * 1000));
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const filename = `usage_snapshot_${year}-${month}-${day}_12-00-00_WIB.csv`;
  const filePath = path.join(SNAPSHOTS_DIR, filename);

  fs.writeFileSync(filePath, sampleCsv, 'utf-8');
  // Update utimes so file system reflects simulated age
  fs.utimesSync(filePath, targetDate, targetDate);

  console.log(`[CREATED] ${filename} (Simulated: ${item.daysAgo} days ago)`);
});

console.log('\n[SUCCESS] Simulated test files created in ./snapshots directory.');
console.log('Run `npm run cleanup:snapshots` to verify deletion of snapshots older than 30 days.\n');
