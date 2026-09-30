/**
 * In-Memory Data Store for Subscriber Usage
 * Pre-seeded with reference data from the technical test specification.
 */

// Subscribers reference table
const initialSubscribers = [
  { id: 'SUB01', name: 'Amir', plan: 'Basic', activationDate: '2023-01-12' },
  { id: 'SUB02', name: 'Sari', plan: 'Premium', activationDate: '2022-05-03' },
  { id: 'SUB03', name: 'Budi', plan: 'Basic', activationDate: '2024-09-20' },
  { id: 'SUB04', name: 'Dewi', plan: 'Family', activationDate: '2021-02-15' },
  { id: 'SUB05', name: 'Rian', plan: 'Premium', activationDate: '2023-08-08' },
  { id: 'SUB06', name: 'Nia', plan: 'Basic', activationDate: '2024-11-30' }
];

// Initial usage records from Q3
const initialUsageRecords = [
  { id: 'REC-001', subscriberId: 'SUB01', callMinutes: 40, smsCount: 10, dataUsageMB: 1500, timestamp: '2025-08-01 08:00' },
  { id: 'REC-002', subscriberId: 'SUB01', callMinutes: 35, smsCount: 8,  dataUsageMB: 1200, timestamp: '2025-08-01 12:00' },
  { id: 'REC-003', subscriberId: 'SUB02', callMinutes: 90, smsCount: 20, dataUsageMB: 6000, timestamp: '2025-08-01 08:00' },
  { id: 'REC-004', subscriberId: 'SUB02', callMinutes: 85, smsCount: 18, dataUsageMB: 5800, timestamp: '2025-08-01 12:00' },
  { id: 'REC-005', subscriberId: 'SUB03', callMinutes: 20, smsCount: 5,  dataUsageMB: 500,  timestamp: '2025-08-01 08:00' },
  { id: 'REC-006', subscriberId: 'SUB04', callMinutes: 150, smsCount: 30, dataUsageMB: 9000, timestamp: '2025-08-01 08:00' },
  { id: 'REC-007', subscriberId: 'SUB05', callMinutes: 70, smsCount: 15, dataUsageMB: 5000, timestamp: '2025-08-01 08:00' },
  { id: 'REC-008', subscriberId: 'SUB06', callMinutes: 25, smsCount: 6,  dataUsageMB: 700,  timestamp: '2025-08-01 08:00' }
];

let subscribers = [...initialSubscribers];
let usageRecords = [...initialUsageRecords];
let nextId = 9;

function generateId() {
  const padded = String(nextId++).padStart(3, '0');
  return `REC-${padded}`;
}

const store = {
  /**
   * Add a new usage record
   */
  addUsageRecord(record) {
    const newRecord = {
      id: record.id || generateId(),
      subscriberId: String(record.subscriberId).trim().toUpperCase(),
      callMinutes: Number(record.callMinutes),
      smsCount: Number(record.smsCount),
      dataUsageMB: Number(record.dataUsageMB),
      timestamp: record.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    usageRecords.push(newRecord);
    return newRecord;
  },

  /**
   * Get all usage records with optional filtering & pagination
   */
  getAllUsageRecords(filters = {}) {
    let result = [...usageRecords];

    if (filters.subscriberId) {
      const subId = String(filters.subscriberId).trim().toUpperCase();
      result = result.filter(r => r.subscriberId === subId);
    }

    if (filters.startDate) {
      result = result.filter(r => r.timestamp >= filters.startDate);
    }

    if (filters.endDate) {
      result = result.filter(r => r.timestamp <= filters.endDate);
    }

    // Sort descending by timestamp
    result.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));

    const total = result.length;

    // Optional pagination
    if (filters.page && filters.limit) {
      const page = Math.max(1, parseInt(filters.page, 10) || 1);
      const limit = Math.max(1, parseInt(filters.limit, 10) || 10);
      const startIndex = (page - 1) * limit;
      result = result.slice(startIndex, startIndex + limit);

      return {
        records: result,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    }

    return { records: result, pagination: { total, page: 1, limit: total, totalPages: 1 } };
  },

  /**
   * Find a usage record by its ID
   */
  getUsageById(id) {
    return usageRecords.find(r => r.id === id) || null;
  },

  /**
   * Get subscribers with usage aggregations
   */
  getSubscribers() {
    return subscribers.map(sub => {
      const records = usageRecords.filter(r => r.subscriberId === sub.id);
      const totalCallMinutes = records.reduce((sum, r) => sum + r.callMinutes, 0);
      const totalSmsCount = records.reduce((sum, r) => sum + r.smsCount, 0);
      const totalDataUsageMB = records.reduce((sum, r) => sum + r.dataUsageMB, 0);

      return {
        ...sub,
        snapshotCount: records.length,
        totalCallMinutes,
        totalSmsCount,
        totalDataUsageMB,
        avgCallMinutes: records.length ? Number((totalCallMinutes / records.length).toFixed(2)) : 0
      };
    });
  },

  /**
   * Get summary for a specific subscriber
   */
  getSubscriberSummary(subscriberId) {
    const subId = String(subscriberId).trim().toUpperCase();
    const subscriber = subscribers.find(s => s.id === subId) || { id: subId, name: 'Unknown', plan: 'Unknown' };
    const records = usageRecords.filter(r => r.subscriberId === subId);

    const totalCallMinutes = records.reduce((sum, r) => sum + r.callMinutes, 0);
    const totalSmsCount = records.reduce((sum, r) => sum + r.smsCount, 0);
    const totalDataUsageMB = records.reduce((sum, r) => sum + r.dataUsageMB, 0);

    return {
      subscriber,
      snapshotCount: records.length,
      totalCallMinutes,
      totalSmsCount,
      totalDataUsageMB,
      avgCallMinutes: records.length ? Number((totalCallMinutes / records.length).toFixed(2)) : 0,
      records
    };
  },

  /**
   * Raw access for snapshot exports
   */
  getRawUsageRecords() {
    return [...usageRecords];
  },

  /**
   * Reset to initial state (useful for tests)
   */
  resetStore() {
    subscribers = [...initialSubscribers];
    usageRecords = [...initialUsageRecords];
    nextId = 9;
  }
};

module.exports = store;
