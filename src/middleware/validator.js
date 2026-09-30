/**
 * Input validation middleware for Subscriber Usage API
 */

function validateUsageRecord(req, res, next) {
  const { subscriberId, callMinutes, smsCount, dataUsageMB, timestamp } = req.body;
  const errors = [];

  // Validate subscriberId
  if (!subscriberId || typeof subscriberId !== 'string' || subscriberId.trim() === '') {
    errors.push('Field "subscriberId" is required and must be a non-empty string.');
  }

  // Validate callMinutes
  if (callMinutes === undefined || callMinutes === null || typeof callMinutes !== 'number' || isNaN(callMinutes) || callMinutes < 0) {
    errors.push('Field "callMinutes" is required and must be a non-negative number.');
  }

  // Validate smsCount
  if (smsCount === undefined || smsCount === null || typeof smsCount !== 'number' || isNaN(smsCount) || smsCount < 0 || !Number.isInteger(smsCount)) {
    errors.push('Field "smsCount" is required and must be a non-negative integer.');
  }

  // Validate dataUsageMB
  if (dataUsageMB === undefined || dataUsageMB === null || typeof dataUsageMB !== 'number' || isNaN(dataUsageMB) || dataUsageMB < 0) {
    errors.push('Field "dataUsageMB" is required and must be a non-negative number.');
  }

  // Validate timestamp if provided
  if (timestamp !== undefined && timestamp !== null) {
    const parsedDate = new Date(timestamp);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Field "timestamp", if provided, must be a valid date string (e.g. "2025-08-01 08:00" or ISO 8601 format).');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors
    });
  }

  next();
}

module.exports = {
  validateUsageRecord
};
