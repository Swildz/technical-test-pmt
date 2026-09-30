const fs = require('fs');
const path = require('path');
const store = require('../data/inMemoryStore');

const SNAPSHOTS_DIR = path.resolve(__dirname, '../../snapshots');

/**
 * Ensure snapshots directory exists
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Format a Date object to Indonesian Western Time (WIB, UTC+7) parts
 */
function getWibDateParts(date = new Date()) {
  // WIB is UTC+7
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const wibTime = new Date(utc + (7 * 3600000));

  const year = wibTime.getFullYear();
  const month = String(wibTime.getMonth() + 1).padStart(2, '0');
  const day = String(wibTime.getDate()).padStart(2, '0');
  const hours = String(wibTime.getHours()).padStart(2, '0');
  const minutes = String(wibTime.getMinutes()).padStart(2, '0');
  const seconds = String(wibTime.getSeconds()).padStart(2, '0');

  return { year, month, day, hours, minutes, seconds, dateStr: `${year}-${month}-${day}`, timeStr: `${hours}-${minutes}-${seconds}` };
}

/**
 * Generate CSV filename based on WIB timestamp
 * Naming convention: usage_snapshot_YYYY-MM-DD_HH-mm-ss_WIB.csv
 */
function generateSnapshotFilename(date = new Date()) {
  const parts = getWibDateParts(date);
  return `usage_snapshot_${parts.dateStr}_${parts.timeStr}_WIB.csv`;
}

/**
 * Escape CSV fields according to RFC 4180
 */
function escapeCsvValue(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert usage records to CSV string
 */
function recordsToCsv(records) {
  const headers = ['id', 'subscriberId', 'callMinutes', 'smsCount', 'dataUsageMB', 'timestamp'];
  const headerRow = headers.join(',');
  const rows = records.map(r => [
    escapeCsvValue(r.id),
    escapeCsvValue(r.subscriberId),
    escapeCsvValue(r.callMinutes),
    escapeCsvValue(r.smsCount),
    escapeCsvValue(r.dataUsageMB),
    escapeCsvValue(r.timestamp)
  ].join(','));

  return [headerRow, ...rows].join('\n');
}

/**
 * Generate and save snapshot to CSV
 */
function generateUsageSnapshot() {
  ensureDirectoryExists(SNAPSHOTS_DIR);

  const records = store.getRawUsageRecords();
  const filename = generateSnapshotFilename();
  const filePath = path.join(SNAPSHOTS_DIR, filename);

  const csvContent = recordsToCsv(records);
  fs.writeFileSync(filePath, csvContent, 'utf-8');

  console.log(`[SNAPSHOT] Created: ${filename} with ${records.length} records (${Buffer.byteLength(csvContent)} bytes)`);

  return {
    filename,
    filePath,
    recordCount: records.length,
    generatedAtWIB: new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }) + ' WIB'
  };
}

/**
 * Clean up snapshots older than retentionDays (default: 30 days)
 */
function cleanupOldSnapshots(retentionDays = 30) {
  ensureDirectoryExists(SNAPSHOTS_DIR);

  const files = fs.readdirSync(SNAPSHOTS_DIR).filter(f => f.endsWith('.csv'));
  const now = Date.now();
  const cutoffTime = now - (retentionDays * 24 * 60 * 60 * 1000);

  const deletedFiles = [];
  const keptFiles = [];

  files.forEach(file => {
    const filePath = path.join(SNAPSHOTS_DIR, file);
    const stats = fs.statSync(filePath);

    // Also parse filename date if matches pattern
    let fileTime = stats.mtimeMs;
    const match = file.match(/usage_snapshot_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})_WIB\.csv/);
    if (match) {
      const [, y, m, d, hh, mm, ss] = match;
      const parsed = new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}+07:00`).getTime();
      if (!isNaN(parsed)) {
        fileTime = parsed;
      }
    }

    const ageInDays = Math.floor((now - fileTime) / (1000 * 60 * 60 * 24));

    if (fileTime < cutoffTime) {
      fs.unlinkSync(filePath);
      deletedFiles.push({ filename: file, ageInDays, deletedAt: new Date().toISOString() });
      console.log(`[CLEANUP] Deleted: ${file} (Age: ${ageInDays} days)`);
    } else {
      keptFiles.push({ filename: file, ageInDays });
    }
  });

  return {
    retentionDays,
    cutoffDate: new Date(cutoffTime).toISOString(),
    totalFound: files.length,
    totalDeleted: deletedFiles.length,
    totalKept: keptFiles.length,
    deletedFiles,
    keptFiles
  };
}

module.exports = {
  SNAPSHOTS_DIR,
  generateUsageSnapshot,
  cleanupOldSnapshots,
  recordsToCsv,
  generateSnapshotFilename
};
