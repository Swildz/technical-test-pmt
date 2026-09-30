const app = require('./src/app');
const { initSnapshotCron } = require('./src/cron/snapshotCron');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`  Subscriber Usage API Service running on port ${PORT}`);
  console.log(`  API Base URL:     http://localhost:${PORT}/api`);
  console.log(`  Web Dashboard:    http://localhost:${PORT}`);
  console.log(`  Health Check:     http://localhost:${PORT}/health`);
  console.log('====================================================');

  // Initialize automated usage snapshot cron job (08:00, 12:00, 15:00 WIB)
  initSnapshotCron();
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down server...');
  server.close(() => {
    console.log('Server shut down cleanly.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nSIGTERM received, shutting down server...');
  server.close(() => {
    console.log('Server shut down cleanly.');
    process.exit(0);
  });
});
