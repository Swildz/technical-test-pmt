// Frontend Logic for Subscriber Usage Portal

const API_BASE = '/api';

// DOM Elements
const timeEl = document.getElementById('currentTime');
const alertBox = document.getElementById('alertBox');
const recordForm = document.getElementById('recordForm');
const subscriberIdInput = document.getElementById('subscriberId');
const usageTableBody = document.getElementById('usageTableBody');
const subscribersTableBody = document.getElementById('subscribersTableBody');
const filterSubInput = document.getElementById('filterSubscriberId');
const refreshDataBtn = document.getElementById('refreshDataBtn');
const triggerSnapshotBtn = document.getElementById('triggerSnapshotBtn');
const refreshSnapshotsBtn = document.getElementById('refreshSnapshotsBtn');
const snapshotsList = document.getElementById('snapshotsList');

// KPI elements
const totalSubscribersEl = document.getElementById('totalSubscribers');
const totalDataMBEl = document.getElementById('totalDataMB');
const totalCallsEl = document.getElementById('totalCalls');
const totalSmsEl = document.getElementById('totalSms');

// Helper to select quick subscriber
window.selectSub = function(subId) {
  subscriberIdInput.value = subId;
  subscriberIdInput.focus();
};

// Clock updater (WIB UTC+7)
function updateClock() {
  const options = {
    timeZone: 'Asia/Jakarta',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  timeEl.textContent = new Intl.DateTimeFormat('en-GB', options).format(new Date()) + ' WIB';
}
setInterval(updateClock, 1000);
updateClock();

// Alert banner
function showAlert(message, type = 'success') {
  alertBox.className = `alert-box ${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove('hidden');
  setTimeout(() => {
    alertBox.classList.add('hidden');
  }, 4500);
}

// Fetch all usage records
async function loadUsage(filterSub = '') {
  try {
    const url = filterSub ? `${API_BASE}/usage?subscriberId=${encodeURIComponent(filterSub)}` : `${API_BASE}/usage`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.success) throw new Error(json.message);

    renderUsageTable(json.data);
    updateKPIsFromRecords(json.data);
  } catch (err) {
    usageTableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:var(--danger)">Error loading usage data: ${err.message}</td></tr>`;
  }
}

// Render usage rows
function renderUsageTable(records) {
  if (!records || records.length === 0) {
    usageTableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:var(--text-secondary); padding: 2rem;">No usage records found.</td></tr>`;
    return;
  }

  usageTableBody.innerHTML = records.map(r => `
    <tr>
      <td><strong>${r.id}</strong></td>
      <td><span class="tag">${r.subscriberId}</span></td>
      <td>${Number(r.callMinutes).toLocaleString()} min</td>
      <td>${Number(r.smsCount).toLocaleString()}</td>
      <td><strong>${Number(r.dataUsageMB).toLocaleString()} MB</strong></td>
      <td><small style="color:var(--text-secondary)">${r.timestamp}</small></td>
    </tr>
  `).join('');
}

// Fetch subscribers summary
async function loadSubscribers() {
  try {
    const res = await fetch(`${API_BASE}/subscribers`);
    const json = await res.json();

    if (!json.success) throw new Error(json.message);

    renderSubscribersTable(json.data);
    totalSubscribersEl.textContent = json.count || 0;
  } catch (err) {
    subscribersTableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:var(--danger)">Error loading subscribers: ${err.message}</td></tr>`;
  }
}

// Render subscribers rows
function renderSubscribersTable(subscribers) {
  if (!subscribers || subscribers.length === 0) {
    subscribersTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No subscribers registered.</td></tr>`;
    return;
  }

  subscribersTableBody.innerHTML = subscribers.map(s => {
    const planClass = s.plan.toLowerCase() === 'premium' ? 'plan-premium' : (s.plan.toLowerCase() === 'family' ? 'plan-family' : 'plan-basic');
    return `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td>${s.name}</td>
        <td><span class="plan-badge ${planClass}">${s.plan}</span></td>
        <td>${s.snapshotCount}</td>
        <td><strong>${Number(s.totalDataUsageMB).toLocaleString()} MB</strong></td>
        <td>${s.avgCallMinutes} min</td>
      </tr>
    `;
  }).join('');
}

// Update KPI cards
function updateKPIsFromRecords(records) {
  let totalData = 0;
  let totalCalls = 0;
  let totalSms = 0;

  records.forEach(r => {
    totalData += Number(r.dataUsageMB) || 0;
    totalCalls += Number(r.callMinutes) || 0;
    totalSms += Number(r.smsCount) || 0;
  });

  totalDataMBEl.textContent = `${totalData.toLocaleString()} MB`;
  totalCallsEl.textContent = `${totalCalls.toLocaleString()} Min`;
  totalSmsEl.textContent = totalSms.toLocaleString();
}

// Fetch generated snapshots
async function loadSnapshots() {
  try {
    const res = await fetch(`${API_BASE}/snapshots`);
    const json = await res.json();

    if (!json.success) throw new Error(json.message);

    if (json.data.length === 0) {
      snapshotsList.innerHTML = `<div class="empty-state" style="padding:1rem;color:var(--text-secondary);text-align:center">No CSV snapshots generated yet. Click "Trigger CSV Snapshot" above to generate one.</div>`;
      return;
    }

    snapshotsList.innerHTML = json.data.map(f => `
      <div class="snapshot-item">
        <div>
          <span class="snapshot-name">📄 ${f.filename}</span>
          <div class="snapshot-meta">${(f.sizeBytes / 1024).toFixed(2)} KB • Created: ${new Date(f.createdAt).toLocaleString()}</div>
        </div>
        <span class="badge" style="background:#e0f2fe;color:#0284c7;font-weight:600;padding:0.25rem 0.6rem;border-radius:6px">CSV Valid</span>
      </div>
    `).join('');
  } catch (err) {
    snapshotsList.innerHTML = `<div style="color:var(--danger)">Failed to load snapshots list.</div>`;
  }
}

// Handle Form Submission
recordForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const subscriberId = document.getElementById('subscriberId').value.trim();
  const callMinutes = Number(document.getElementById('callMinutes').value);
  const smsCount = Number(document.getElementById('smsCount').value);
  const dataUsageMB = Number(document.getElementById('dataUsageMB').value);
  const timestamp = document.getElementById('timestamp').value.trim();

  const payload = {
    subscriberId,
    callMinutes,
    smsCount,
    dataUsageMB
  };

  if (timestamp) {
    payload.timestamp = timestamp;
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Recording...';

  try {
    const res = await fetch(`${API_BASE}/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      const errMsg = result.errors ? result.errors.join('; ') : (result.message || 'Failed to record usage');
      throw new Error(errMsg);
    }

    showAlert(`Usage for ${subscriberId} successfully recorded (ID: ${result.data.id})!`, 'success');
    recordForm.reset();

    // Refresh views
    loadUsage(filterSubInput.value.trim());
    loadSubscribers();
  } catch (err) {
    showAlert(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Usage Record';
  }
});

// Trigger Snapshot
triggerSnapshotBtn.addEventListener('click', async () => {
  triggerSnapshotBtn.disabled = true;
  triggerSnapshotBtn.textContent = 'Generating...';

  try {
    const res = await fetch(`${API_BASE}/snapshots/trigger`, { method: 'POST' });
    const json = await res.json();

    if (!json.success) throw new Error(json.message);

    showAlert(`Snapshot created: ${json.data.filename} (${json.data.recordCount} records)`, 'success');
    loadSnapshots();
  } catch (err) {
    showAlert(`Failed to create snapshot: ${err.message}`, 'error');
  } finally {
    triggerSnapshotBtn.disabled = false;
    triggerSnapshotBtn.textContent = '💾 Trigger CSV Snapshot';
  }
});

// Filter input listener
filterSubInput.addEventListener('input', (e) => {
  loadUsage(e.target.value.trim());
});

refreshDataBtn.addEventListener('click', () => {
  loadUsage(filterSubInput.value.trim());
  loadSubscribers();
});

refreshSnapshotsBtn.addEventListener('click', loadSnapshots);

// Initial Load
loadUsage();
loadSubscribers();
loadSnapshots();
