const express = require('express');
const router = express.Router();
const usageController = require('../controllers/usageController');
const { validateUsageRecord } = require('../middleware/validator');

// Usage records endpoints
router.post('/usage', validateUsageRecord, usageController.recordUsage);
router.get('/usage', usageController.getUsage);
router.get('/usage/:id', usageController.getUsageById);

// Subscribers aggregations endpoints
router.get('/subscribers', usageController.getSubscribers);
router.get('/subscribers/:subscriberId/summary', usageController.getSubscriberSummary);

// Snapshot management endpoints
router.get('/snapshots', usageController.getSnapshots);
router.post('/snapshots/trigger', usageController.triggerSnapshot);

module.exports = router;
