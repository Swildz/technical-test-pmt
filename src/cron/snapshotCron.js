const cron = require('node-cron');
const { generateUsageSnapshot } = require('../services/snapshotService');

let cronTask = null;

/**
 * Initialize the Snapshot Cron Job
 * Schedule: 08:00, 12:00, 15:00 WIB (Asia/Jakarta)
 * Cron expression: "0 8,12,15 * * *"
 */
function initSnapshotCron() {
  const cronExpression = '0 8,12,15 * * *';
  const timezone = 'Asia/Jakarta';

  cronTask = cron.schedule(
    cronExpression,
    () => {
      const nowWib = new Date().toLocaleString('en-US', { timeZone: timezone });
      console.log(`[CRON] Triggered scheduled usage snapshot at ${nowWib} WIB`);
      try {
        const result = generateUsageSnapshot();
        console.log(`[CRON] Snapshot saved successfully to ${result.filename}`);
      } catch (err) {
        console.error('[CRON ERROR] Failed to generate snapshot:', err);
      }
    },
    {
      scheduled: true,
      timezone: timezone
    }
  );

  console.log(`[CRON] Scheduled Usage Snapshot cron initialized: "${cronExpression}" in timezone "${timezone}" (08:00, 12:00, 15:00 WIB).`);
  return cronTask;
}

function stopSnapshotCron() {
  if (cronTask) {
    cronTask.stop();
    console.log('[CRON] Usage Snapshot cron stopped.');
  }
}

module.exports = {
  initSnapshotCron,
  stopSnapshotCron
};
