/* ============================================================
   MPDO — In-Memory Data Layer (Synced with MySQL Backend)
   ============================================================ */

const DB = (() => {
  const API_BASE = 'http://localhost:3000/api';
  let store = {};
  let settingsStore = {};

  const tables = [
    'users', 'barangays', 'requirements', 'applications',
    'documents', 'statusHistory', 'aiResults', 'notifications',
    'auditLogs', 'remarks'
  ];

  /* ── Initialization ────────────────────────────────────── */
  async function init() {
    console.log('[DB] Fetching data from MySQL backend...');
    try {
      // Fetch settings
      const setRes = await fetch(`${API_BASE}/settings/all`);
      settingsStore = await setRes.json();

      // Fetch all tables
      for (const table of tables) {
        const res = await fetch(`${API_BASE}/${table}`);
        let rows = await res.json();
        
        // Post-process: parse JSON strings from MySQL TEXT columns
        rows = rows.map(row => {
          const parsed = { ...row };
          for (const [key, val] of Object.entries(parsed)) {
            if (typeof val === 'string' && val.length > 0) {
              // Try to parse JSON arrays/objects stored as TEXT
              if ((val.startsWith('[') && val.endsWith(']')) || 
                  (val.startsWith('{') && val.endsWith('}'))) {
                try { parsed[key] = JSON.parse(val); } catch(e) { /* keep as string */ }
              }
            }
            // Coerce MySQL TINYINT(1) booleans (0/1) for known boolean fields
            if (['required','locationConfirmed','locationValidated','aiAnalyzed','isRead','overridden'].includes(key)) {
              parsed[key] = !!val;
            }
          }
          return parsed;
        });
        
        store[table] = rows;
      }
      console.log('[DB] Sync complete. Tables loaded:', Object.keys(store).join(', '));
    } catch (err) {
      console.error('[DB] Failed to initialize DB:', err);
    }
  }

  /* ── Low-level storage ────────────────────────────────── */
  function _get(table) {
    return store[table] || [];
  }

  function _set(table, data) {
    store[table] = data;
  }

  /* ── Generic CRUD ─────────────────────────────────────── */
  function findAll(table) { return _get(table); }

  function findBy(table, field, value) {
    return _get(table).filter(r => r[field] === value);
  }

  function findOne(table, field, value) {
    return _get(table).find(r => r[field] === value) || null;
  }

  function findById(table, id) { return findOne(table, 'id', id); }

  function insert(table, record) {
    const rows = _get(table);
    rows.push(record);
    _set(table, rows);
    
    // Sync to backend asynchronously
    fetch(`${API_BASE}/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    }).catch(console.error);

    return record;
  }

  function update(table, id, changes) {
    const rows = _get(table);
    const idx  = rows.findIndex(r => r.id === id);
    if (idx === -1) return null;
    
    // In SQL, updatedAt is often handled automatically or needs to be a valid date
    // We'll update the local object
    const newRecord = { ...rows[idx], ...changes, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') };
    rows[idx] = newRecord;
    _set(table, rows);

    // Sync to backend asynchronously
    fetch(`${API_BASE}/${table}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    }).catch(console.error);

    return newRecord;
  }

  function remove(table, id) {
    const rows = _get(table).filter(r => r.id !== id);
    _set(table, rows);

    fetch(`${API_BASE}/${table}/${id}`, {
      method: 'DELETE'
    }).catch(console.error);
  }

  function query(table, fn) {
    return _get(table).filter(fn);
  }

  function count(table, fn) {
    const rows = _get(table);
    return fn ? rows.filter(fn).length : rows.length;
  }

  /* ── Settings ─────────────────────────────────────────── */
  function getSetting(key, def = null) {
    let val = settingsStore[key] !== undefined ? settingsStore[key] : def;
    if (typeof val === 'string') {
      if (val === 'true') return true;
      if (val === 'false') return false;
      if (!isNaN(val) && val.trim() !== '') return Number(val);
      if ((val.startsWith('[') && val.endsWith(']')) || (val.startsWith('{') && val.endsWith('}'))) {
        try { return JSON.parse(val); } catch(e) {}
      }
    }
    return val;
  }
  
  function setSetting(key, value) {
    settingsStore[key] = value;
    
    fetch(`${API_BASE}/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: value.toString() })
    }).catch(console.error);
  }

  /* ── Seed Data ────────────────────────────────────────── */
  function isSeeded() { 
    // Backend handles seeding in this version
    return true; 
  }

  async function seed() {
    // Backend handles seeding on server start
    return Promise.resolve();
  }

  /* ── Specialized Queries ──────────────────────────── */
  function getApplicationsByApplicant(userId) {
    return findBy('applications', 'applicantId', userId)
      .sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  function getApplicationWithHistory(appId) {
    const app     = findById('applications', appId);
    if (!app) return null;
    const history = findBy('statusHistory','applicationId', appId)
      .sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
    const docs    = findBy('documents','applicationId', appId);
    const remarks = findBy('remarks','applicationId', appId);
    const aiRes   = findOne('aiResults','applicationId', appId);
    return { ...app, history, docs, remarks, aiResult: aiRes };
  }

  function getDocumentsByApplication(appId) {
    return findBy('documents','applicationId', appId);
  }

  function getStaffQueue() {
    return findAll('applications')
      .filter(a => a.status !== 'Draft' && a.status !== 'Approved' && a.status !== 'Completed' && a.status !== 'Returned')
      .sort((a,b) => b.priorityScore - a.priorityScore);
  }

  function getUserById(id) { return findById('users', id); }

  function getNotificationsForUser(userId) {
    return findBy('notifications','userId', userId)
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function getUnreadCount(userId) {
    return count('notifications', n => n.userId === userId && (!n.isRead || n.isRead === 0 || n.isRead === '0'));
  }

  return {
    // Core CRUD
    init, findAll, findBy, findOne, findById, insert, update, remove, query, count,
    // Settings
    getSetting, setSetting,
    // Seed
    seed, isSeeded,
    // Specialized
    getApplicationsByApplicant, getApplicationWithHistory,
    getDocumentsByApplication, getStaffQueue,
    getUserById, getNotificationsForUser, getUnreadCount
  };
})();

window.DB = DB;
