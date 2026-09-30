const store = require('../data/inMemoryStore');
const fs = require('fs');
const path = require('path');

const usageController = {
  /**
   * POST /api/usage
   * Record new subscriber usage
   */
  recordUsage(req, res) {
    try {
      const { subscriberId, callMinutes, smsCount, dataUsageMB, timestamp } = req.body;
      const newRecord = store.addUsageRecord({
        subscriberId,
        callMinutes,
        smsCount,
        dataUsageMB,
        timestamp
      });

      return res.status(201).json({
        success: true,
        message: 'Subscriber usage recorded successfully.',
        data: newRecord
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to record subscriber usage.',
        error: error.message
      });
    }
  },

  /**
   * GET /api/usage
   * Retrieve recorded subscriber usage records (with optional filter & pagination)
   */
  getUsage(req, res) {
    try {
      const { subscriberId, startDate, endDate, page, limit } = req.query;
      const result = store.getAllUsageRecords({
        subscriberId,
        startDate,
        endDate,
        page,
        limit
      });

      return res.status(200).json({
        success: true,
        count: result.records.length,
        pagination: result.pagination,
        data: result.records
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve usage records.',
        error: error.message
      });
    }
  },

  /**
   * GET /api/usage/:id
   * Retrieve single usage record by id
   */
  getUsageById(req, res) {
    try {
      const { id } = req.params;
      const record = store.getUsageById(id);

      if (!record) {
        return res.status(404).json({
          success: false,
          message: `Usage record with ID "${id}" not found.`
        });
      }

      return res.status(200).json({
        success: true,
        data: record
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve usage record.',
        error: error.message
      });
    }
  },

  /**
   * GET /api/subscribers
   * Retrieve subscribers list with usage summaries
   */
  getSubscribers(req, res) {
    try {
      const subscribers = store.getSubscribers();
      return res.status(200).json({
        success: true,
        count: subscribers.length,
        data: subscribers
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve subscribers.',
        error: error.message
      });
    }
  },

  /**
   * GET /api/subscribers/:subscriberId/summary
   * Retrieve summary for a specific subscriber
   */
  getSubscriberSummary(req, res) {
    try {
      const { subscriberId } = req.params;
      const summary = store.getSubscriberSummary(subscriberId);
      return res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve subscriber summary.',
        error: error.message
      });
    }
  },

  /**
   * GET /api/snapshots
   * List existing snapshot files
   */
  getSnapshots(req, res) {
    try {
      const snapshotsDir = path.join(__dirname, '../../snapshots');
      if (!fs.existsSync(snapshotsDir)) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }

      const files = fs.readdirSync(snapshotsDir)
        .filter(f => f.endsWith('.csv'))
        .map(file => {
          const stats = fs.statSync(path.join(snapshotsDir, file));
          return {
            filename: file,
            sizeBytes: stats.size,
            createdAt: stats.mtime
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      return res.status(200).json({
        success: true,
        count: files.length,
        data: files
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to list snapshots.',
        error: error.message
      });
    }
  },

  /**
   * POST /api/snapshots/trigger
   * Manually trigger a snapshot export (useful for testing & frontend button)
   */
  triggerSnapshot(req, res) {
    try {
      const { generateUsageSnapshot } = require('../services/snapshotService');
      const result = generateUsageSnapshot();
      return res.status(201).json({
        success: true,
        message: 'Snapshot generated successfully.',
        data: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate snapshot.',
        error: error.message
      });
    }
  }
};

module.exports = usageController;
