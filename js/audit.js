/* ============================================================
   MPDO — Audit Trail Logger
   ============================================================ */

const Audit = (() => {

  const ACTIONS = {
    LOGIN:           'User Login',
    LOGOUT:          'User Logout',
    REGISTER:        'User Registered',
    PROFILE_UPDATE:  'Profile Updated',
    PASSWORD_CHANGE: 'Password Changed',
    APP_CREATE:      'Application Created',
    APP_SUBMIT:      'Application Submitted',
    APP_UPDATE:      'Application Updated',
    STATUS_UPDATE:   'Application Status Updated',
    DOC_UPLOAD:      'Document Uploaded',
    DOC_REVIEW:      'Document Reviewed',
    DOC_UPDATE:      'Document Status Changed',
    AI_ANALYSIS:     'AI Analysis Performed',
    AI_OVERRIDE:     'AI Recommendation Overridden',
    REMARK_ADD:      'Remark Added',
    NOTIF_SEND:      'Notification Sent',
    USER_CREATE:     'User Account Created',
    USER_UPDATE:     'User Account Updated',
    USER_DEACTIVATE: 'User Account Deactivated',
    REQ_UPDATE:      'Requirement Configuration Updated',
    SETTINGS_UPDATE: 'System Settings Updated',
    REPORT_GENERATED:'Report Generated',
  };

  function log(userId, action, entity, entityId, details = '', extra = {}) {
    const entry = {
      id:        Utils.generateId('AUD'),
      userId,
      userName:  getUserName(userId),
      action,
      actionLabel: ACTIONS[action] || action,
      entity,
      entityId,
      details,
      timestamp: new Date().toISOString(),
      ip:        'local',
      ...extra
    };
    DB.insert('auditLogs', entry);
    return entry;
  }

  function getUserName(userId) {
    const user = DB.findById('users', userId);
    return user ? user.fullName : 'System';
  }

  function getLogs(filters = {}) {
    let logs = DB.findAll('auditLogs')
      .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (filters.userId)     logs = logs.filter(l => l.userId === filters.userId);
    if (filters.action)     logs = logs.filter(l => l.action === filters.action);
    if (filters.entity)     logs = logs.filter(l => l.entity === filters.entity);
    if (filters.entityId)   logs = logs.filter(l => l.entityId === filters.entityId);
    if (filters.from)       logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.from));
    if (filters.to)         logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.to));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      logs = logs.filter(l =>
        (l.details||'').toLowerCase().includes(q) ||
        (l.userName||'').toLowerCase().includes(q) ||
        (l.actionLabel||'').toLowerCase().includes(q)
      );
    }

    if (filters.limit) logs = logs.slice(0, filters.limit);
    return logs;
  }

  function renderLogsTable(logs, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!logs.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No audit logs found</div></div>`;
      return;
    }
    container.innerHTML = `
    <div class="table-responsive">
    <table class="data-table">
      <thead><tr>
        <th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th>
      </tr></thead>
      <tbody>
        ${logs.map(l => `
        <tr>
          <td><span style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--text-muted)">${Utils.formatDateTime(l.timestamp)}</span></td>
          <td><span class="font-medium">${Utils.sanitize(l.userName||'System')}</span></td>
          <td><span class="badge badge-muted">${Utils.sanitize(l.actionLabel||l.action)}</span></td>
          <td><span class="text-secondary">${Utils.sanitize(l.entity||'')}</span></td>
          <td class="text-secondary text-sm">${Utils.sanitize(l.details||'')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>`;
  }

  return { log, getLogs, renderLogsTable, ACTIONS };
})();

window.Audit = Audit;
