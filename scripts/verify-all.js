/**
 * Automated Verification Script
 * Validates:
 * 1. Health check endpoint (GET /health)
 * 2. Get usage records (GET /api/usage)
 * 3. Validation error on missing fields (POST /api/usage)
 * 4. Record new valid usage (POST /api/usage)
 * 5. Retrieve usage by ID (GET /api/usage/:id)
 * 6. Get subscribers with aggregations (GET /api/subscribers)
 * 7. Get subscriber summary (GET /api/subscribers/:id/summary)
 * 8. Trigger CSV snapshot (POST /api/snapshots/trigger)
 * 9. Get snapshot files list (GET /api/snapshots)
 */

const http = require('http');
const app = require('../src/app');

const PORT = 3999;
let server;

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('            COMPREHENSIVE BACKEND API TEST SUITE               ');
  console.log('================================================================\n');

  server = app.listen(PORT);
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /health returns 200 OK', async () => {
    const res = await makeRequest('/health');
    if (res.status !== 200 || res.body.status !== 'OK') throw new Error(`Status ${res.status}`);
  });

  // 2. Get initial usage records
  let initialCount = 0;
  await test('GET /api/usage returns 200 with initial seeded records', async () => {
    const res = await makeRequest('/api/usage');
    if (res.status !== 200 || !res.body.success || !Array.isArray(res.body.data)) {
      throw new Error(`Invalid response structure`);
    }
    initialCount = res.body.count;
    if (initialCount < 8) throw new Error(`Expected at least 8 records, got ${initialCount}`);
  });

  // 3. Validation rejection
  await test('POST /api/usage returns 400 Bad Request on invalid input', async () => {
    const res = await makeRequest('/api/usage', 'POST', {
      subscriberId: '', // invalid empty string
      callMinutes: -5,  // invalid negative
      smsCount: 'invalid' // invalid non-number
    });
    if (res.status !== 400 || res.body.success !== false || !Array.isArray(res.body.errors)) {
      throw new Error(`Expected 400 with errors array, got ${res.status}`);
    }
  });

  // 4. Record new valid usage
  let createdId = null;
  await test('POST /api/usage successfully records new subscriber usage', async () => {
    const res = await makeRequest('/api/usage', 'POST', {
      subscriberId: 'SUB01',
      callMinutes: 50,
      smsCount: 15,
      dataUsageMB: 2000,
      timestamp: '2025-08-02 09:00'
    });
    if (res.status !== 201 || !res.body.success || !res.body.data.id) {
      throw new Error(`Expected 201 Created with new record`);
    }
    createdId = res.body.data.id;
    if (res.body.data.subscriberId !== 'SUB01' || res.body.data.callMinutes !== 50) {
      throw new Error(`Field mismatch on created record`);
    }
  });

  // 5. Get usage by ID
  await test('GET /api/usage/:id retrieves the created record', async () => {
    const res = await makeRequest(`/api/usage/${createdId}`);
    if (res.status !== 200 || !res.body.success || res.body.data.id !== createdId) {
      throw new Error(`Expected record ${createdId}, got ${JSON.stringify(res.body)}`);
    }
  });

  // 6. Get usage with filter
  await test('GET /api/usage?subscriberId=SUB01 filters records correctly', async () => {
    const res = await makeRequest('/api/usage?subscriberId=SUB01');
    if (res.status !== 200 || !res.body.success) throw new Error('Filter failed');
    const allMatch = res.body.data.every(r => r.subscriberId === 'SUB01');
    if (!allMatch) throw new Error('Returned records with other subscriber IDs');
  });

  // 7. Get subscribers list with aggregations
  await test('GET /api/subscribers returns list with aggregate totals', async () => {
    const res = await makeRequest('/api/subscribers');
    if (res.status !== 200 || !res.body.success || !Array.isArray(res.body.data)) {
      throw new Error('Invalid subscribers list');
    }
    const sub01 = res.body.data.find(s => s.id === 'SUB01');
    if (!sub01 || sub01.totalDataUsageMB <= 0) {
      throw new Error('Aggregations missing or incorrect for SUB01');
    }
  });

  // 8. Get subscriber summary
  await test('GET /api/subscribers/SUB02/summary returns detailed breakdown', async () => {
    const res = await makeRequest('/api/subscribers/SUB02/summary');
    if (res.status !== 200 || !res.body.success || !res.body.data || res.body.data.subscriber.id !== 'SUB02') {
      throw new Error('Invalid subscriber summary');
    }
  });

  // 9. Trigger CSV Snapshot
  await test('POST /api/snapshots/trigger generates a new CSV file', async () => {
    const res = await makeRequest('/api/snapshots/trigger', 'POST');
    if (res.status !== 201 || !res.body.success || !res.body.data.filename) {
      throw new Error('Snapshot generation failed');
    }
  });

  // 10. List snapshots
  await test('GET /api/snapshots lists available snapshots', async () => {
    const res = await makeRequest('/api/snapshots');
    if (res.status !== 200 || !res.body.success || !Array.isArray(res.body.data)) {
      throw new Error('Failed to list snapshots');
    }
    if (res.body.count === 0) throw new Error('Expected at least 1 snapshot');
  });

  console.log('\n================================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
