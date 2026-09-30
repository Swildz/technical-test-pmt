/**
 * Script: run-sql-demo.js
 * Demonstrates and verifies the results of all Q3 SQL queries
 * using relational logic matching the SQL specifications.
 */

// Initial data as specified in Q3
let subscribers = [
  { id: 'SUB01', name: 'Amir', plan: 'Basic', activationDate: '2023-01-12' },
  { id: 'SUB02', name: 'Sari', plan: 'Premium', activationDate: '2022-05-03' },
  { id: 'SUB03', name: 'Budi', plan: 'Basic', activationDate: '2024-09-20' },
  { id: 'SUB04', name: 'Dewi', plan: 'Family', activationDate: '2021-02-15' },
  { id: 'SUB05', name: 'Rian', plan: 'Premium', activationDate: '2023-08-08' },
  { id: 'SUB06', name: 'Nia', plan: 'Basic', activationDate: '2024-11-30' }
];

const usage = [
  { subscriberId: 'SUB01', callMinutes: 40, smsCount: 10, dataUsageMB: 1500, timestamp: '2025-08-01 08:00' },
  { subscriberId: 'SUB01', callMinutes: 35, smsCount: 8,  dataUsageMB: 1200, timestamp: '2025-08-01 12:00' },
  { subscriberId: 'SUB02', callMinutes: 90, smsCount: 20, dataUsageMB: 6000, timestamp: '2025-08-01 08:00' },
  { subscriberId: 'SUB02', callMinutes: 85, smsCount: 18, dataUsageMB: 5800, timestamp: '2025-08-01 12:00' },
  { subscriberId: 'SUB03', callMinutes: 20, smsCount: 5,  dataUsageMB: 500,  timestamp: '2025-08-01 08:00' },
  { subscriberId: 'SUB04', callMinutes: 150, smsCount: 30, dataUsageMB: 9000, timestamp: '2025-08-01 08:00' },
  { subscriberId: 'SUB05', callMinutes: 70, smsCount: 15, dataUsageMB: 5000, timestamp: '2025-08-01 08:00' },
  { subscriberId: 'SUB06', callMinutes: 25, smsCount: 6,  dataUsageMB: 700,  timestamp: '2025-08-01 08:00' }
];

console.log('================================================================');
console.log('            Q3: SUBSCRIBER & USAGE SQL DEMONSTRATION           ');
console.log('================================================================\n');

// 1. Insert Fajar
console.log('--- 1. INSERT NEW SUBSCRIBER "FAJAR" ---');
console.log(`SQL:
INSERT INTO subscribers (id, name, plan, activation_date)
VALUES ('SUB07', 'Fajar', 'Basic', '2024-01-24');\n`);

const newSub = { id: 'SUB07', name: 'Fajar', plan: 'Basic', activationDate: '2024-01-24' };
subscribers.push(newSub);
console.log('Resulting subscribers row:');
console.table([newSub]);

// 2. Update Fajar to Premium
console.log('\n--- 2. UPDATE FAJAR PLAN TO PREMIUM ---');
console.log(`SQL:
UPDATE subscribers
SET plan = 'Premium'
WHERE name = 'Fajar';\n`);

const fajar = subscribers.find(s => s.name === 'Fajar');
if (fajar) fajar.plan = 'Premium';
console.log('Updated row:');
console.table([fajar]);

// 3. Calculate total data usage for Premium-plan subscribers
console.log('\n--- 3. TOTAL DATA USAGE FOR PREMIUM-PLAN SUBSCRIBERS ---');
console.log(`SQL:
SELECT SUM(u.dataUsageMB) AS total_premium_data_usage_mb
FROM usage u
JOIN subscribers s ON u.subscriberId = s.id
WHERE s.plan = 'Premium';\n`);

const premiumSubIds = new Set(subscribers.filter(s => s.plan === 'Premium').map(s => s.id));
const totalPremiumMB = usage
  .filter(u => premiumSubIds.has(u.subscriberId))
  .reduce((sum, u) => sum + u.dataUsageMB, 0);

console.table([{ total_premium_data_usage_mb: totalPremiumMB }]);
console.log(`Explanation: Sari (SUB02: 6000 + 5800 = 11,800 MB) + Rian (SUB05: 5000 MB) = ${totalPremiumMB} MB.`);

// 4. Sort and display top 3 subscribers by total data usage
console.log('\n--- 4. TOP 3 SUBSCRIBERS BY TOTAL DATA USAGE ---');
console.log(`SQL:
SELECT 
    s.id AS subscriberId,
    s.name,
    s.plan,
    SUM(u.dataUsageMB) AS total_data_usage_mb
FROM subscribers s
JOIN usage u ON s.id = u.subscriberId
GROUP BY s.id, s.name, s.plan
ORDER BY total_data_usage_mb DESC
LIMIT 3;\n`);

const usageBySub = {};
usage.forEach(u => {
  usageBySub[u.subscriberId] = (usageBySub[u.subscriberId] || 0) + u.dataUsageMB;
});

const top3 = subscribers
  .filter(s => usageBySub[s.id] !== undefined)
  .map(s => ({
    subscriberId: s.id,
    name: s.name,
    plan: s.plan,
    total_data_usage_mb: usageBySub[s.id]
  }))
  .sort((a, b) => b.total_data_usage_mb - a.total_data_usage_mb)
  .slice(0, 3);

console.table(top3);

// 5. Subquery to find subscribers whose avg call minutes <= 30
console.log('\n--- 5. SUBQUERY: AVG CALL MINUTES PER SNAPSHOT <= 30 ---');
console.log(`SQL:
SELECT s.id, s.name, s.plan, s.activation_date
FROM subscribers s
WHERE s.id IN (
    SELECT u.subscriberId
    FROM usage u
    GROUP BY u.subscriberId
    HAVING AVG(u.callMinutes) <= 30
);\n`);

// Subquery execution simulation:
// Inner query: GROUP BY subscriberId HAVING AVG(callMinutes) <= 30
const callsBySub = {};
usage.forEach(u => {
  if (!callsBySub[u.subscriberId]) callsBySub[u.subscriberId] = [];
  callsBySub[u.subscriberId].push(u.callMinutes);
});

const qualifyingSubIds = Object.keys(callsBySub).filter(id => {
  const avg = callsBySub[id].reduce((a, b) => a + b, 0) / callsBySub[id].length;
  return avg <= 30;
});

const subqueryResult = subscribers
  .filter(s => qualifyingSubIds.includes(s.id))
  .map(s => {
    const avg = callsBySub[s.id].reduce((a, b) => a + b, 0) / callsBySub[s.id].length;
    return {
      id: s.id,
      name: s.name,
      plan: s.plan,
      activation_date: s.activationDate,
      avgCallMinutes: avg
    };
  });

console.table(subqueryResult);
console.log('Explanation:');
console.log('- SUB03 (Budi): avg call minutes = 20 / 1 = 20.0 (<= 30) -> MATCH');
console.log('- SUB06 (Nia):  avg call minutes = 25 / 1 = 25.0 (<= 30) -> MATCH');
console.log('- SUB01 (Amir): avg call minutes = (40 + 35) / 2 = 37.5 (> 30) -> EXCLUDED');
console.log('- SUB02 (Sari): avg call minutes = (90 + 85) / 2 = 87.5 (> 30) -> EXCLUDED');
console.log('- SUB04 (Dewi): avg call minutes = 150.0 (> 30) -> EXCLUDED');
console.log('- SUB05 (Rian): avg call minutes = 70.0 (> 30) -> EXCLUDED\n');
