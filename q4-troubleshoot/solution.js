/**
 * Q4: Troubleshoot & Explain
 *
 * This file demonstrates:
 * 1. The original buggy function and exactly how it fails.
 * 2. The fixed concise function.
 * 3. The production-ready defensive function.
 * 4. Comprehensive test cases verifying correctness and edge-cases.
 */

// -------------------------------------------------------------
// 1. The Original Buggy Code
// -------------------------------------------------------------
function buggyGetTotalUsageMB(records) {
  return records.reduce((total, record) => {
    total += record.dataUsageMB;
  });
}

// -------------------------------------------------------------
// 2. The Fixed Implementation (Concise & Standard)
// -------------------------------------------------------------
function getTotalUsageMB(records) {
  return records.reduce((total, record) => total + record.dataUsageMB, 0);
}

// -------------------------------------------------------------
// 3. Defensive Production-Ready Implementation
// -------------------------------------------------------------
function getTotalUsageMBDefensive(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return 0;
  }

  return records.reduce((total, record) => {
    const usage = Number(record && record.dataUsageMB);
    return total + (isNaN(usage) ? 0 : usage);
  }, 0);
}

// -------------------------------------------------------------
// Execution & Verification Suite
// -------------------------------------------------------------
console.log('================================================================');
console.log('          Q4: TROUBLESHOOT & EXPLAIN DEMONSTRATION             ');
console.log('================================================================\n');

const sampleRecords = [
  { subscriberId: 'SUB01', callMinutes: 40, smsCount: 10, dataUsageMB: 1500 },
  { subscriberId: 'SUB01', callMinutes: 35, smsCount: 8,  dataUsageMB: 1200 },
  { subscriberId: 'SUB02', callMinutes: 90, smsCount: 20, dataUsageMB: 6000 }
];

console.log('Test Dataset:');
console.log(sampleRecords);
console.log('\nExpected Total: 1500 + 1200 + 6000 = 8700 MB\n');

// 1. Run buggy version
console.log('--- 1. Testing Original Buggy Function ---');
const buggyResult = buggyGetTotalUsageMB(sampleRecords);
console.log(`Result of buggyGetTotalUsageMB(sampleRecords): ${buggyResult} (Type: ${typeof buggyResult})`);
console.log('Observation: Returns "undefined" instead of 8700 due to missing return and missing initial accumulator!\n');

// Empty array behavior test for buggy code
console.log('--- 2. Testing Buggy Function on Empty Array [] ---');
try {
  buggyGetTotalUsageMB([]);
} catch (err) {
  console.log(`Caught Expected Crash: "${err.message}"`);
  console.log('Observation: Calling reduce on empty array without initialValue throws TypeError and crashes runtime!\n');
}

// 2. Run fixed concise version
console.log('--- 3. Testing Fixed Function (Concise) ---');
const fixedResult = getTotalUsageMB(sampleRecords);
console.log(`Result of getTotalUsageMB(sampleRecords): ${fixedResult} (Expected: 8700) -> ${fixedResult === 8700 ? 'PASS [OK]' : 'FAIL'}`);
const emptyFixedResult = getTotalUsageMB([]);
console.log(`Result on empty array []: ${emptyFixedResult} (Expected: 0) -> ${emptyFixedResult === 0 ? 'PASS [OK]' : 'FAIL'}\n`);

// 3. Run defensive version
console.log('--- 4. Testing Defensive Production Function ---');
const tests = [
  { name: 'Standard records', input: sampleRecords, expected: 8700 },
  { name: 'Empty array []', input: [], expected: 0 },
  { name: 'Null input', input: null, expected: 0 },
  { name: 'Undefined input', input: undefined, expected: 0 },
  { name: 'Single record', input: [{ dataUsageMB: 2500 }], expected: 2500 },
  { name: 'Record with string number', input: [{ dataUsageMB: '1500' }, { dataUsageMB: 500 }], expected: 2000 },
  { name: 'Record with missing field', input: [{ dataUsageMB: 1000 }, { subscriberId: 'X' }], expected: 1000 }
];

tests.forEach((t, i) => {
  const res = getTotalUsageMBDefensive(t.input);
  const status = res === t.expected ? 'PASS [OK]' : 'FAIL';
  console.log(`  Test ${i + 1}: ${t.name.padEnd(28)} -> Result: ${String(res).padEnd(6)} | Expected: ${String(t.expected).padEnd(6)} | ${status}`);
});

console.log('\n================================================================');
console.log('Summary of Fixes Applied:');
console.log('1. Added initialValue `0` to Array.prototype.reduce().');
console.log('2. Returned accumulated sum `total + record.dataUsageMB`.');
console.log('3. Handled empty arrays and invalid input gracefully.');
console.log('================================================================\n');

module.exports = {
  buggyGetTotalUsageMB,
  getTotalUsageMB,
  getTotalUsageMBDefensive
};
