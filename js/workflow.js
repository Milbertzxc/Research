/* ============================================================
   MPDO — Application Workflow Manager
   ============================================================ */

const Workflow = (() => {

  const STATUSES = [
    'Draft', 'Submitted', 'Initial Validation', 'Document Review',
    'Location Review', 'MPDO Review', 'Additional Requirements',
    'For Approval', 'Approved', 'Returned', 'Completed'
  ];

  /* Allowed transitions: { from: [to,...] } */
  const TRANSITIONS = {
    'Draft':                   ['Submitted'],
    'Submitted':               ['Initial Validation', 'Returned'],
    'Initial Validation':      ['Document Review', 'Additional Requirements', 'Returned'],
    'Document Review':         ['Location Review', 'Additional Requirements', 'Returned'],
    'Location Review':         ['MPDO Review', 'Additional Requirements', 'Returned'],
    'MPDO Review':             ['For Approval', 'Additional Requirements', 'Returned'],
    'Additional Requirements': ['Document Review', 'Initial Validation', 'Returned'],
    'For Approval':            ['Approved', 'Returned'],
    'Approved':                ['Completed'],
    'Returned':                [],
    'Completed':               [],
  };

  /* Role permissions for status transitions */
  const ROLE_PERMISSIONS = {
    applicant: ['Submitted'],          // can only submit draft
    staff:     ['Initial Validation', 'Document Review', 'Location Review',
                'MPDO Review', 'Additional Requirements', 'For Approval', 'Returned'],
    admin:     [...STATUSES]           // all statuses
  };

  function getNextStatuses(currentStatus, userRole = 'staff') {
    const allowed   = TRANSITIONS[currentStatus] || [];
    const rolePerms = ROLE_PERMISSIONS[userRole] || [];
    return allowed.filter(s => rolePerms.includes(s));
  }

  function canTransition(fromStatus, toStatus, userRole) {
    return getNextStatuses(fromStatus, userRole).includes(toStatus);
  }

  function getStageNumber(status) {
    const STAGES = [
      'Draft','Submitted','Initial Validation','Document Review',
      'Location Review','MPDO Review','For Approval','Approved/Completed'
    ];
    const terminal = ['Approved','Completed','Returned'];
    if (terminal.includes(status)) return status === 'Returned' ? -1 : STAGES.length - 1;
    return STAGES.indexOf(status);
  }

  function getStageWeight(status) {
    const weights = {
      'Draft': 0, 'Submitted': 10, 'Initial Validation': 20,
      'Document Review': 40, 'Location Review': 55, 'MPDO Review': 75,
      'Additional Requirements': 25, 'For Approval': 90,
      'Approved': 100, 'Completed': 100, 'Returned': 0
    };
    return weights[status] || 0;
  }

  function updateStatus(applicationId, newStatus, userId, remarks = '') {
    const app = DB.findById('applications', applicationId);
    if (!app) return { ok: false, error: 'Application not found.' };

    const session   = Auth.getSession();
    const userRole  = session ? session.role : 'staff';

    if (!canTransition(app.status, newStatus, userRole)) {
      return { ok: false, error: `Cannot transition from "${app.status}" to "${newStatus}" with your current role.` };
    }

    const fromStatus = app.status;

    // Update application
    DB.update('applications', applicationId, {
      status:    newStatus,
      updatedAt: new Date().toISOString()
    });

    // Record history
    DB.insert('statusHistory', {
      id:            Utils.generateId('SH'),
      applicationId,
      fromStatus,
      toStatus:      newStatus,
      userId,
      timestamp:     new Date().toISOString(),
      remarks:       remarks || ''
    });

    // Remark
    if (remarks) {
      DB.insert('remarks', {
        id:            Utils.generateId('RMK'),
        applicationId,
        staffId:       userId,
        content:       remarks,
        type:          newStatus === 'Additional Requirements' ? 'additional_requirements' : newStatus === 'Returned' ? 'returned' : 'note',
        createdAt:     new Date().toISOString()
      });
    }

    // Notify applicant
    const applicant = DB.getUserById(app.applicantId);
    if (applicant) {
      Notifications.sendStatusChange(app.applicantId, app.applicationNumber, app.projectName, newStatus, remarks);
    }

    // Audit
    Audit.log(userId, 'STATUS_UPDATE', 'Application', applicationId,
      `Status changed: ${fromStatus} → ${newStatus}${remarks ? '. Remarks: ' + remarks : ''}`);

    return { ok: true, fromStatus, toStatus: newStatus };
  }

  function submitApplication(applicationId, userId) {
    const app = DB.findById('applications', applicationId);
    if (!app) return { ok: false, error: 'Application not found.' };
    if (app.status !== 'Draft') return { ok: false, error: 'Only draft applications can be submitted.' };

    // Basic location check
    if (!app.locationConfirmed || !app.latitude || !app.longitude) {
      return { ok: false, error: 'Please pin your project location on the map before submitting.' };
    }

    // Required fields check
    const required = ['projectName','projectType','proposedUse','estimatedCost','barangay','province','municipality'];
    for (const f of required) {
      if (!app[f]) return { ok: false, error: `Missing required field: ${Utils.toTitleCase(f.replace(/([A-Z])/g,' $1'))}` };
    }

    // Check required documents
    const requirements   = DB.findAll('requirements').filter(r => r.required);
    const uploadedReqIds = DB.findBy('documents','applicationId', applicationId).map(d => d.requirementId);
    const missing        = requirements.filter(r => !uploadedReqIds.includes(r.id));

    DB.update('applications', applicationId, {
      status:      'Submitted',
      submittedAt: new Date().toISOString(),
      updatedAt:   new Date().toISOString()
    });

    DB.insert('statusHistory', {
      id: Utils.generateId('SH'), applicationId,
      fromStatus: 'Draft', toStatus: 'Submitted', userId,
      timestamp: new Date().toISOString(),
      remarks: missing.length ? `Submitted with ${missing.length} missing optional/required document(s)` : 'Application submitted with all required documents'
    });

    Audit.log(userId, 'APP_SUBMIT', 'Application', applicationId, `Application submitted: ${app.applicationNumber}`);

    // Notify applicant
    Notifications.send(userId, 'status_change', 'Application Submitted Successfully',
      `Your application ${app.applicationNumber} has been submitted. You will be notified of status updates.`, applicationId);

    // Notify all staff
    const staffUsers = DB.findBy('users','role','staff').concat(DB.findBy('users','role','admin'));
    staffUsers.forEach(s => {
      Notifications.send(s.id, 'new_app', 'New Application Submitted',
        `Application ${app.applicationNumber} (${app.projectName}) has been submitted by ${DB.getUserById(userId)?.fullName || 'an applicant'}.`, applicationId);
    });

    return { ok: true };
  }

  function getProgressPercent(status) {
    return getStageWeight(status);
  }

  function renderTimeline(history, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!history || !history.length) {
      container.innerHTML = '<div class="text-muted text-sm">No history yet.</div>';
      return;
    }

    const items = [...history].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

    container.innerHTML = `<div class="timeline">${items.map((h, i) => {
      const isLatest = i === 0;
      const cfg = Utils.getStatusConfig(h.toStatus);
      const dotClass = isLatest ? 'active' : (h.toStatus === 'Approved' || h.toStatus === 'Completed') ? 'success' : (h.toStatus === 'Returned' || h.toStatus === 'Additional Requirements') ? 'danger' : '';
      const user = DB.getUserById(h.userId);
      return `
      <div class="timeline-item ${dotClass}">
        <div class="timeline-dot">${cfg.icon}</div>
        <div class="timeline-content">
          <div class="timeline-date">${Utils.formatDateTime(h.timestamp)}${user ? ' · ' + user.fullName : ''}</div>
          <div class="timeline-title">${h.toStatus}</div>
          ${h.remarks ? `<div class="timeline-desc">${Utils.sanitize(h.remarks)}</div>` : ''}
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  return {
    STATUSES, TRANSITIONS, ROLE_PERMISSIONS,
    getNextStatuses, canTransition, getStageNumber, getStageWeight,
    updateStatus, submitApplication, getProgressPercent,
    renderTimeline
  };
})();

window.Workflow = Workflow;
