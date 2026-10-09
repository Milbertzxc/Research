/* ============================================================
   MPDO — Notification System
   ============================================================ */

const Notifications = (() => {

  const TYPES = {
    new_app:          { icon: '📨', label: 'New Application',       color: 'info' },
    status_change:    { icon: '🔄', label: 'Status Update',          color: 'primary' },
    doc_revision:     { icon: '📝', label: 'Document Revision',      color: 'warning' },
    additional_req:   { icon: '⚠️', label: 'Additional Requirements',color: 'danger' },
    approved:         { icon: '🎉', label: 'Approved',               color: 'success' },
    returned:         { icon: '↩️', label: 'Application Returned',   color: 'danger' },
    ai_flag:          { icon: '🤖', label: 'AI Flag',                color: 'secondary' },
    system:           { icon: '⚙️', label: 'System',                 color: 'muted' },
    reminder:         { icon: '🔔', label: 'Reminder',               color: 'warning' },
  };

  function send(userId, type, title, message, applicationId = null) {
    const notif = DB.insert('notifications', {
      id:            Utils.generateId('NTF'),
      userId,
      applicationId,
      type,
      title,
      message,
      isRead:        false,
      createdAt:     new Date().toISOString()
    });

    // Update UI badge if visible
    refreshBadge(userId);

    // Show toast if current user
    const session = Auth.getSession();
    if (session && session.userId === userId) {
      const cfg = TYPES[type] || TYPES.system;
      Utils.toast(`${cfg.icon} ${title}: ${message}`, cfg.color === 'danger' ? 'error' : cfg.color === 'success' ? 'success' : 'info', 5000);
    }

    Audit.log('system', 'NOTIF_SEND', 'Notification', notif.id, `Sent to user ${userId}: ${title}`);
    return notif;
  }

  function sendStatusChange(applicantId, appNumber, projectName, newStatus, remarks = '') {
    const statusMessages = {
      'Submitted':               `Your application ${appNumber} has been successfully submitted.`,
      'Initial Validation':      `Your application ${appNumber} (${projectName}) is now under initial validation.`,
      'Document Review':         `Your application ${appNumber} has moved to Document Review stage.`,
      'Location Review':         `Your application ${appNumber} is now under location/GIS review.`,
      'MPDO Review':             `Your application ${appNumber} has been endorsed for MPDO review.`,
      'Additional Requirements': `Additional requirements have been requested for ${appNumber}. ${remarks}`,
      'For Approval':            `Your application ${appNumber} has been endorsed for approval!`,
      'Approved':                `🎉 Your application ${appNumber} (${projectName}) has been APPROVED! Visit the MPDO office to claim your permit.`,
      'Returned':                `Your application ${appNumber} has been returned. ${remarks}`,
    };
    const title   = `Status Update: ${newStatus}`;
    const message = statusMessages[newStatus] || `Your application ${appNumber} status changed to ${newStatus}.`;
    const type    = newStatus === 'Approved' ? 'approved' : newStatus === 'Additional Requirements' ? 'additional_req' : newStatus === 'Returned' ? 'returned' : 'status_change';
    return send(applicantId, type, title, message, null);
  }

  function getForUser(userId) {
    return DB.getNotificationsForUser(userId);
  }

  function markRead(notifId) {
    DB.update('notifications', notifId, { isRead: true });
    const session = Auth.getSession();
    if (session) refreshBadge(session.userId);
  }

  function markAllRead(userId) {
    const notifs = DB.findBy('notifications', 'userId', userId).filter(n => !n.isRead);
    notifs.forEach(n => DB.update('notifications', n.id, { isRead: true }));
    refreshBadge(userId);
  }

  function getUnreadCount(userId) { return DB.getUnreadCount(userId); }

  function refreshBadge(userId) {
    const count = getUnreadCount(userId);
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  function renderNotificationList(userId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const notifs = getForUser(userId);
    if (!notifs.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-title">No notifications yet</div><div class="empty-desc">You'll be notified here when your application status changes.</div></div>`;
      return;
    }
    container.innerHTML = notifs.map(n => {
      const cfg = TYPES[n.type] || TYPES.system;
      return `
      <div class="notification-item ${n.isRead ? '' : 'unread'}" data-id="${n.id}" onclick="Notifications.markRead('${n.id}'); this.classList.remove('unread')">
        ${!n.isRead ? '' : ''}
        <div class="notification-icon" style="background:var(--${cfg.color === 'primary' ? 'primary' : cfg.color}-bg)">${cfg.icon}</div>
        <div class="notification-content">
          <div class="notification-title">${Utils.sanitize(n.title)}</div>
          <div class="text-secondary text-sm mt-1">${Utils.sanitize(n.message)}</div>
          <div class="notification-time">${Utils.timeAgo(n.createdAt)}</div>
        </div>
      </div>`;
    }).join('');
  }

  return {
    send, sendStatusChange,
    getForUser, markRead, markAllRead,
    getUnreadCount, refreshBadge,
    renderNotificationList,
    TYPES
  };
})();

window.Notifications = Notifications;
