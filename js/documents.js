/* ============================================================
   MPDO — Document Management Module
   ============================================================ */

const Documents = (() => {

  const ALLOWED_TYPES = {
    pdf:  { mime: 'application/pdf',                icon: '📄', label: 'PDF' },
    jpg:  { mime: 'image/jpeg',                    icon: '🖼️', label: 'JPEG' },
    jpeg: { mime: 'image/jpeg',                    icon: '🖼️', label: 'JPEG' },
    png:  { mime: 'image/png',                     icon: '🖼️', label: 'PNG' },
    dwg:  { mime: 'image/vnd.dwg',                 icon: '📐', label: 'DWG' },
    xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', icon: '📊', label: 'Excel' },
    doc:  { mime: 'application/msword',             icon: '📝', label: 'Word' },
    docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', icon: '📝', label: 'Word' },
  };

  const DOC_STATUSES = ['Submitted','Under Review','Accepted','Needs Revision','Missing','Expired','Rejected'];

  function getFileIcon(filename) {
    const ext = (filename||'').split('.').pop().toLowerCase();
    return ALLOWED_TYPES[ext]?.icon || '📎';
  }

  function validateFile(file) {
    const ext     = file.name.split('.').pop().toLowerCase();
    const maxSize = DB.getSetting('maxFileSizeMB', 50) * 1024 * 1024;
    const allowed = DB.getSetting('allowedFileTypes', Object.keys(ALLOWED_TYPES));

    if (!allowed.includes(ext)) {
      return { ok: false, error: `File type ".${ext}" is not allowed. Accepted types: ${allowed.join(', ').toUpperCase()}` };
    }
    if (file.size > maxSize) {
      return { ok: false, error: `File "${file.name}" exceeds the maximum size of ${DB.getSetting('maxFileSizeMB', 50)} MB.` };
    }
    if (file.size === 0) {
      return { ok: false, error: `File "${file.name}" appears to be empty.` };
    }
    return { ok: true };
  }

  /* ── Upload Document (simulated — stores metadata only) ── */
  function uploadDocument(file, applicationId, requirementId, userId) {
    const validation = validateFile(file);
    if (!validation.ok) return { ok: false, error: validation.error };

    // Check for duplicate
    const existing = DB.findBy('documents','applicationId', applicationId)
      .filter(d => d.requirementId === requirementId && d.fileName === file.name);
    if (existing.length) {
      // Update existing
      const updated = DB.update('documents', existing[0].id, {
        fileName:   file.name,
        fileType:   file.name.split('.').pop().toLowerCase(),
        fileSize:   file.size,
        uploadedAt: new Date().toISOString(),
        status:     'Submitted',
        uploadedBy: userId,
        reviewedBy: null,
        reviewedAt: null,
        remarks:    ''
      });
      Audit.log(userId, 'DOC_UPLOAD', 'Document', existing[0].id, `Document re-uploaded: ${file.name}`);
      return { ok: true, document: updated, isUpdate: true };
    }

    // AI classification
    const aiClass = AI.classifyDocument(file.name, file.name.split('.').pop().toLowerCase());

    const doc = DB.insert('documents', {
      id:            Utils.generateId('DOC'),
      applicationId,
      requirementId,
      fileName:      file.name,
      fileType:      file.name.split('.').pop().toLowerCase(),
      fileSize:      file.size,
      uploadedAt:    new Date().toISOString(),
      status:        'Submitted',
      uploadedBy:    userId,
      reviewedBy:    null,
      reviewedAt:    null,
      remarks:       '',
      aiClassification: aiClass.detectedType,
      aiConfidence:     aiClass.confidence
    });

    Audit.log(userId, 'DOC_UPLOAD', 'Document', doc.id, `Document uploaded: ${file.name} → AI: ${aiClass.detectedType} (${aiClass.confidence}%)`);
    return { ok: true, document: doc, isUpdate: false, aiClassification: aiClass };
  }

  /* ── Update Document Status (staff action) ────────────── */
  function updateDocumentStatus(docId, newStatus, staffId, remarks = '') {
    const doc = DB.findById('documents', docId);
    if (!doc) return { ok: false, error: 'Document not found.' };
    if (!DOC_STATUSES.includes(newStatus)) return { ok: false, error: 'Invalid document status.' };

    DB.update('documents', docId, {
      status:     newStatus,
      reviewedBy: staffId,
      reviewedAt: new Date().toISOString(),
      remarks:    remarks
    });

    Audit.log(staffId, 'DOC_UPDATE', 'Document', docId, `Status → ${newStatus}${remarks ? '. Remarks: '+remarks : ''}`);

    // Notify applicant if revision needed
    if (newStatus === 'Needs Revision' || newStatus === 'Rejected') {
      const app = DB.findById('applications', doc.applicationId);
      if (app) {
        Notifications.send(app.applicantId, 'doc_revision',
          'Document Revision Required',
          `Document "${doc.fileName}" requires revision. ${remarks}`,
          doc.applicationId
        );
      }
    }

    return { ok: true };
  }

  /* ── Render Document Upload Area ──────────────────────── */
  function renderUploadArea(applicationId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const requirements = DB.findAll('requirements');
    const uploadedDocs = DB.findBy('documents','applicationId', applicationId);
    const session      = Auth.getSession();

    container.innerHTML = `
      <div class="doc-status-grid mb-6">
        ${requirements.map(req => {
          const doc = uploadedDocs.find(d => d.requirementId === req.id);
          const statusClass = doc ? (doc.status === 'Accepted' ? 'accepted' : doc.status === 'Needs Revision' ? 'needs-revision' : 'submitted') : 'missing';
          const icon = doc ? getFileIcon(doc.fileName) : '📋';
          return `
          <div class="doc-status-item ${statusClass}">
            <span style="font-size:1.3rem">${icon}</span>
            <div style="flex:1;min-width:0">
              <div class="font-medium text-sm truncate">${Utils.sanitize(req.name)}</div>
              <div class="text-xs text-muted">${req.required ? '⭐ Required' : 'Optional'}</div>
              ${doc ? `<div class="text-xs mt-1"><span class="badge ${getDocStatusBadge(doc.status)}">${doc.status}</span></div>` : '<div class="text-xs mt-1 text-danger">Not uploaded</div>'}
            </div>
            <button class="btn btn-ghost btn-sm btn-icon" onclick="Documents.openUploadModal('${applicationId}','${req.id}','${Utils.sanitize(req.name)}')">
              ${doc ? '🔄' : '📤'}
            </button>
          </div>`;
        }).join('')}
      </div>
      
      <div id="upload-modal" class="modal-backdrop hidden">
        <div class="modal modal-md">
          <div class="modal-header">
            <div class="modal-title" id="upload-modal-title">Upload Document</div>
            <div class="modal-close" onclick="document.getElementById('upload-modal').classList.add('hidden')">×</div>
          </div>
          <div class="modal-body">
            <div id="upload-drop-zone" class="file-drop-zone" onclick="document.getElementById('upload-file-input').click()">
              <input type="file" id="upload-file-input" style="display:none" accept=".pdf,.jpg,.jpeg,.png,.dwg,.xlsx,.doc,.docx">
              <div class="file-drop-icon">📤</div>
              <div class="file-drop-text">Click to browse or <strong>drag & drop</strong></div>
              <div class="text-xs text-muted mt-2">PDF, JPG, PNG, DWG, XLSX, DOC — Max 50 MB</div>
            </div>
            <div id="upload-file-preview" class="file-list"></div>
            <div id="upload-ai-result" class="mt-3 hidden"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="document.getElementById('upload-modal').classList.add('hidden')">Cancel</button>
            <button class="btn btn-primary" id="upload-confirm-btn" onclick="Documents.confirmUpload('${applicationId}','${containerId}')">Upload Document</button>
          </div>
        </div>
      </div>`;

    initDropZone(applicationId, session?.userId);
  }

  let _currentReqId = null;
  let _pendingFile  = null;

  function openUploadModal(applicationId, requirementId, reqName) {
    _currentReqId = requirementId;
    _pendingFile  = null;
    const modal  = document.getElementById('upload-modal');
    const title  = document.getElementById('upload-modal-title');
    const preview= document.getElementById('upload-file-preview');
    const aiRes  = document.getElementById('upload-ai-result');
    if (!modal) return;
    if (title)   title.textContent = `Upload: ${reqName}`;
    if (preview) preview.innerHTML = '';
    if (aiRes)   { aiRes.innerHTML = ''; aiRes.classList.add('hidden'); }
    modal.classList.remove('hidden');
  }

  function initDropZone(applicationId, userId) {
    const dz    = document.getElementById('upload-drop-zone');
    const input = document.getElementById('upload-file-input');
    if (!dz || !input) return;

    input.addEventListener('change', e => handleFile(e.target.files[0]));

    dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('drag-over');
      handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
      if (!file) return;
      const v = validateFile(file);
      if (!v.ok) { Utils.toast(v.error, 'error'); return; }

      _pendingFile = file;

      const preview = document.getElementById('upload-file-preview');
      if (preview) {
        preview.innerHTML = `
          <div class="file-item">
            <span class="file-item-icon">${getFileIcon(file.name)}</span>
            <div class="file-item-info">
              <div class="file-item-name">${Utils.sanitize(file.name)}</div>
              <div class="file-item-size">${Utils.formatFileSize(file.size)}</div>
            </div>
            <span class="badge badge-success">Ready</span>
          </div>`;
      }

      // Show AI classification
      const aiClass = AI.classifyDocument(file.name, file.name.split('.').pop().toLowerCase());
      const aiRes   = document.getElementById('upload-ai-result');
      if (aiRes) {
        aiRes.innerHTML = `
          <div class="alert alert-ai">
            <div class="alert-icon">🤖</div>
            <div class="alert-content">
              <div class="alert-title">AI Document Classification</div>
              <div class="text-sm">Detected: <strong>${Utils.sanitize(aiClass.detectedType)}</strong> — Confidence: ${aiClass.confidence}% (${aiClass.confidenceLabel})</div>
              <div class="text-xs mt-1 text-muted">AI classification is for reference only. Staff will verify the document.</div>
            </div>
          </div>`;
        aiRes.classList.remove('hidden');
      }
    }
  }

  function confirmUpload(applicationId, containerId) {
    if (!_pendingFile) { Utils.toast('Please select a file first.', 'warning'); return; }
    if (!_currentReqId) { Utils.toast('No requirement selected.', 'error'); return; }

    const session = Auth.getSession();
    const result  = uploadDocument(_pendingFile, applicationId, _currentReqId, session.userId);

    if (!result.ok) { Utils.toast(result.error, 'error'); return; }

    document.getElementById('upload-modal')?.classList.add('hidden');
    Utils.toast(`✅ Document uploaded successfully${result.aiClassification ? ` — AI detected: ${result.aiClassification.detectedType}` : ''}`, 'success');
    renderUploadArea(applicationId, containerId);
    _pendingFile  = null;
    _currentReqId = null;
  }

  function getDocStatusBadge(status) {
    const map = {
      'Accepted':       'badge-success',
      'Submitted':      'badge-info',
      'Under Review':   'badge-warning',
      'Needs Revision': 'badge-danger',
      'Missing':        'badge-danger',
      'Expired':        'badge-warning',
      'Rejected':       'badge-danger',
    };
    return map[status] || 'badge-muted';
  }

  /* ── Render Staff Document Review ─────────────────────── */
  function renderStaffDocumentReview(applicationId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const docs         = DB.findBy('documents','applicationId', applicationId);
    const requirements = DB.findAll('requirements');
    const session      = Auth.getSession();

    if (!docs.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📄</div><div class="empty-title">No documents uploaded</div></div>';
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
      <table class="data-table">
        <thead><tr>
          <th>Document</th><th>Requirement</th><th>AI Classification</th><th>Size</th><th>Uploaded</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${docs.map(doc => {
            const req = requirements.find(r => r.id === doc.requirementId);
            return `<tr>
              <td>
                <div class="flex items-center gap-2">
                  <span>${getFileIcon(doc.fileName)}</span>
                  <div>
                    <div class="font-medium text-sm">${Utils.sanitize(doc.fileName)}</div>
                    ${doc.remarks ? `<div class="text-xs text-danger mt-1">${Utils.sanitize(doc.remarks)}</div>` : ''}
                  </div>
                </div>
              </td>
              <td><span class="text-sm text-secondary">${req ? Utils.sanitize(req.name) : '—'}</span></td>
              <td>
                ${doc.aiClassification ? `<span class="badge badge-ai">${Utils.sanitize(doc.aiClassification)}</span><div class="text-xs text-muted mt-1">${doc.aiConfidence||0}% confidence</div>` : '<span class="text-muted">—</span>'}
              </td>
              <td><span class="text-sm text-muted">${Utils.formatFileSize(doc.fileSize)}</span></td>
              <td><span class="text-xs text-muted">${Utils.formatDateTime(doc.uploadedAt)}</span></td>
              <td><span class="badge ${getDocStatusBadge(doc.status)}">${doc.status}</span></td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-success btn-sm" onclick="Documents.quickReview('${doc.id}','Accepted','','${applicationId}','${containerId}')">✓</button>
                  <button class="btn btn-warning btn-sm" onclick="Documents.showReviewModal('${doc.id}','Needs Revision','${applicationId}','${containerId}')">✏️</button>
                  <button class="btn btn-danger btn-sm" onclick="Documents.showReviewModal('${doc.id}','Rejected','${applicationId}','${containerId}')">✗</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      </div>
      <div id="doc-review-modal" class="modal-backdrop hidden">
        <div class="modal modal-md">
          <div class="modal-header">
            <div class="modal-title" id="doc-review-modal-title">Document Review</div>
            <div class="modal-close" onclick="document.getElementById('doc-review-modal').classList.add('hidden')">×</div>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Remarks / Reason</label>
              <textarea id="doc-review-remarks" class="form-control" rows="3" placeholder="Enter reason or instructions for the applicant…"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="document.getElementById('doc-review-modal').classList.add('hidden')">Cancel</button>
            <button class="btn btn-primary" id="doc-review-confirm">Confirm</button>
          </div>
        </div>
      </div>`;
  }

  function quickReview(docId, status, remarks, applicationId, containerId) {
    const session = Auth.getSession();
    const result  = updateDocumentStatus(docId, status, session.userId, remarks);
    if (result.ok) {
      Utils.toast(`Document marked as ${status}`, 'success');
      renderStaffDocumentReview(applicationId, containerId);
    } else {
      Utils.toast(result.error, 'error');
    }
  }

  let _reviewDocId = null, _reviewStatus = null, _reviewAppId = null, _reviewContainerId = null;

  function showReviewModal(docId, status, appId, containerId) {
    _reviewDocId = docId; _reviewStatus = status;
    _reviewAppId = appId; _reviewContainerId = containerId;
    const modal = document.getElementById('doc-review-modal');
    const title = document.getElementById('doc-review-modal-title');
    const btn   = document.getElementById('doc-review-confirm');
    if (!modal) return;
    if (title) title.textContent = `Mark Document as: ${status}`;
    if (btn) btn.onclick = () => confirmDocReview();
    document.getElementById('doc-review-remarks').value = '';
    modal.classList.remove('hidden');
  }

  function confirmDocReview() {
    const remarks = document.getElementById('doc-review-remarks')?.value || '';
    if ((_reviewStatus === 'Needs Revision' || _reviewStatus === 'Rejected') && !remarks.trim()) {
      Utils.toast('Please provide a reason for revision/rejection.', 'warning');
      return;
    }
    const session = Auth.getSession();
    const result  = updateDocumentStatus(_reviewDocId, _reviewStatus, session.userId, remarks);
    if (result.ok) {
      document.getElementById('doc-review-modal')?.classList.add('hidden');
      Utils.toast(`Document marked as ${_reviewStatus}`, 'success');
      renderStaffDocumentReview(_reviewAppId, _reviewContainerId);
    } else {
      Utils.toast(result.error, 'error');
    }
  }

  return {
    validateFile, uploadDocument, updateDocumentStatus,
    renderUploadArea, renderStaffDocumentReview,
    openUploadModal, confirmUpload, initDropZone,
    quickReview, showReviewModal, confirmDocReview,
    getFileIcon, getDocStatusBadge, DOC_STATUSES
  };
})();

window.Documents = Documents;
