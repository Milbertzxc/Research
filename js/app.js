/* ============================================================
   MPDO — Main Application Shell & SPA Router
   ============================================================ */

const App = (() => {

  let currentView  = '';
  let currentAppId = '';
  let sidebarCollapsed = false;

  /* ── Sidebar Config per Role ─────────────────────────── */
  const NAV_CONFIG = {
    applicant: [
      { group: 'Main', items: [
        { id: 'home',         icon: '<i data-lucide="layout-dashboard" style="width:18px;height:18px;"></i>', label: 'Dashboard' },
        { id: 'applications', icon: '<i data-lucide="folder" style="width:18px;height:18px;"></i>', label: 'My Applications' },
        { id: 'apply',        icon: '<i data-lucide="plus-circle" style="width:18px;height:18px;"></i>', label: 'Apply for Permit' },
        { id: 'notifications',icon: '<i data-lucide="bell" style="width:18px;height:18px;"></i>', label: 'Notifications', badge: true },
      ]},
      { group: 'Help', items: [
        { id: 'chatbot', icon: '<i data-lucide="message-square" style="width:18px;height:18px;"></i>', label: 'Ask MPDO Assistant' },
      ]}
    ],
    staff: [
      { group: 'Reviews', items: [
        { id: 'staff-home',  icon: '<i data-lucide="layout-dashboard" style="width:18px;height:18px;"></i>', label: 'Staff Dashboard' },
        { id: 'staff-queue', icon: '<i data-lucide="list-todo" style="width:18px;height:18px;"></i>', label: 'Application Queue' },
        { id: 'gis-map',     icon: '<i data-lucide="map" style="width:18px;height:18px;"></i>', label: 'GIS Map' },
        { id: 'reports',     icon: '<i data-lucide="pie-chart" style="width:18px;height:18px;"></i>', label: 'Reports & Analytics' },
        { id: 'notifications',icon: '<i data-lucide="bell" style="width:18px;height:18px;"></i>', label: 'Notifications', badge: true },
      ]}
    ],
    admin: [
      { group: 'Administration', items: [
        { id: 'admin-home',  icon: '<i data-lucide="layout-dashboard" style="width:18px;height:18px;"></i>', label: 'Admin Dashboard' },
        { id: 'admin-users', icon: '<i data-lucide="users" style="width:18px;height:18px;"></i>', label: 'User Management' },
        { id: 'admin-reqs',  icon: '<i data-lucide="file-check" style="width:18px;height:18px;"></i>', label: 'Requirements' },
        { id: 'admin-settings', icon: '<i data-lucide="settings" style="width:18px;height:18px;"></i>', label: 'System Settings' },
        { id: 'admin-logs',  icon: '<i data-lucide="scroll-text" style="width:18px;height:18px;"></i>', label: 'Audit Logs' },
      ]},
      { group: 'Operations', items: [
        { id: 'staff-queue', icon: '<i data-lucide="list-todo" style="width:18px;height:18px;"></i>', label: 'Application Queue' },
        { id: 'gis-map',     icon: '<i data-lucide="map" style="width:18px;height:18px;"></i>', label: 'GIS Map' },
        { id: 'reports',     icon: '<i data-lucide="pie-chart" style="width:18px;height:18px;"></i>', label: 'Reports' },
        { id: 'notifications',icon: '<i data-lucide="bell" style="width:18px;height:18px;"></i>', label: 'Notifications', badge: true },
      ]}
    ]
  };

  /* ── Init ────────────────────────────────────────────── */
  async function init() {
    // DB is already initialized via DB.init() in the HTML before App.init()

    // Auth check
    if (!Auth.isAuthenticated()) {
      window.location.href = 'index.html';
      return;
    }

    const session = Auth.getSession();
    const user    = Auth.getCurrentUser();

    // Render shell
    renderShell(session, user);

    // Route to initial view
    const hash = window.location.hash.slice(1) || getDefaultView(session.role);
    navigate(hash);

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      navigate(window.location.hash.slice(1));
    });

    // Refresh notification badge
    Notifications.refreshBadge(session.userId);

    // Init chatbot
    Chatbot.init();

    // Hide page loader
    document.getElementById('page-loader')?.remove();
  }

  function getDefaultView(role) {
    return { admin: 'admin-home', staff: 'staff-home', applicant: 'home' }[role] || 'home';
  }

  /* ── Render Shell (Sidebar + Topbar) ─────────────────── */
  function renderShell(session, user) {
    const navGroups = NAV_CONFIG[session.role] || NAV_CONFIG.applicant;
    const navHtml   = navGroups.map(group => `
      <div class="nav-group-label">${group.group}</div>
      ${group.items.map(item => `
        <div class="nav-item" id="nav-${item.id}" data-view="${item.id}" onclick="App.navigate('${item.id}')">
          <span class="nav-item-icon">${item.icon}</span>
          <span class="nav-item-label">${item.label}</span>
          ${item.badge ? `<span class="nav-item-badge hidden" id="notif-badge">0</span>` : ''}
        </div>`).join('')}
    `).join('');

    document.getElementById('sidebar-nav').innerHTML = navHtml;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // User info in sidebar
    document.getElementById('sidebar-user-name').textContent = session.fullName;
    document.getElementById('sidebar-user-role').textContent = Utils.toTitleCase(session.role);
    document.getElementById('sidebar-avatar').textContent    = session.avatar || session.fullName?.slice(0,2).toUpperCase() || '?';
  }

  /* ── Navigate ────────────────────────────────────────── */
  function navigate(viewId) {
    if (!viewId) viewId = getDefaultView(Auth.getSession()?.role || 'applicant');

    // Handle parameterized routes: review-APP-001, track-APP-001
    let baseView = viewId;
    if (viewId.startsWith('review-'))  { currentAppId = viewId.replace('review-',''); baseView = 'staff-review'; }
    else if (viewId.startsWith('track-')) { currentAppId = viewId.replace('track-','');  baseView = 'app-detail'; }

    currentView = baseView;
    window.location.hash = viewId;

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navEl = document.getElementById(`nav-${baseView}`);
    if (navEl) navEl.classList.add('active');

    // Render content
    const content = document.getElementById('view-container');
    if (!content) return;
    content.innerHTML = '<div class="spinner-page"><div class="spinner spinner-lg"></div></div>';

    setTimeout(() => {
      content.innerHTML = '';
      renderView(baseView, content);
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 80);
  }

  /* ── View Renderer ───────────────────────────────────── */
  function renderView(view, container) {
    const session = Auth.getSession();
    const role    = session?.role;

    // Update topbar title
    const titles = {
      'home': 'Dashboard', 'applications': 'My Applications', 'apply': 'New Application',
      'app-detail': 'Application Details', 'notifications': 'Notifications',
      'chatbot': 'MPDO Assistant',
      'staff-home': 'Staff Dashboard', 'staff-queue': 'Application Queue', 'staff-review': 'Review Application',
      'gis-map': 'GIS Project Map', 'reports': 'Reports & Analytics',
      'admin-home': 'Admin Dashboard', 'admin-users': 'User Management',
      'admin-reqs': 'Requirements', 'admin-settings': 'System Settings', 'admin-logs': 'Audit Logs'
    };
    const topbarTitle = document.getElementById('topbar-title');
    if (topbarTitle) topbarTitle.textContent = titles[view] || 'MPDO System';

    const div = document.createElement('div');
    div.className = 'page-content page-enter';

    switch(view) {
      case 'home':         renderApplicantHome(div, session); break;
      case 'applications': renderMyApplications(div, session); break;
      case 'apply':        renderApplyForm(div, session); break;
      case 'app-detail':   renderAppDetail(div, session, currentAppId); break;
      case 'notifications':renderNotificationsPage(div, session); break;
      case 'chatbot':      renderChatbotPage(div); break;
      case 'staff-home':   renderStaffHome(div, session); break;
      case 'staff-queue':  renderStaffQueue(div, session); break;
      case 'staff-review': renderStaffReview(div, session, currentAppId); break;
      case 'gis-map':      renderGISMap(div, session); break;
      case 'reports':      Reports.renderReportsPage('view-container'); return;
      case 'admin-home':   renderAdminHome(div, session); break;
      case 'admin-users':  Admin.renderUserManagement('view-container'); return;
      case 'admin-reqs':   renderAdminRequirements(div); break;
      case 'admin-settings': Admin.renderSettingsPage('view-container'); return;
      case 'admin-logs':   renderAuditLogsPage(div); break;
      default:             div.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Page Not Found</div><button class="btn btn-primary mt-4" onclick="App.navigate('')">Go Home</button></div>`;
    }

    container.appendChild(div);
    // Trigger chart renders etc
    if (view === 'gis-map') setTimeout(() => initGISMap(), 100);
  }

  /* ── Applicant: Home Dashboard ───────────────────────── */
  function renderApplicantHome(div, session) {
    const apps  = DB.getApplicationsByApplicant(session.userId);
    const stats = {
      total:    apps.length,
      active:   apps.filter(a => !['Approved','Completed','Returned','Draft'].includes(a.status)).length,
      approved: apps.filter(a => a.status==='Approved'||a.status==='Completed').length,
      draft:    apps.filter(a => a.status==='Draft').length
    };

    div.innerHTML = `
    <div class="page-header">
      <h1>Welcome back, ${Utils.sanitize(session.fullName?.split(' ')[0])}! 👋</h1>
      <p>Track your building permit applications and manage your documents.</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-4 gap-6 mb-8">
      <div class="stat-card hover-lift" data-color="blue">
        <div class="stat-icon stat-icon-blue">📋</div>
        <div class="stat-info"><div class="stat-value">${stats.total}</div><div class="stat-label">Total Applications</div></div>
      </div>
      <div class="stat-card hover-lift" data-color="yellow">
        <div class="stat-icon stat-icon-yellow">⏳</div>
        <div class="stat-info"><div class="stat-value">${stats.active}</div><div class="stat-label">In Progress</div></div>
      </div>
      <div class="stat-card hover-lift" data-color="green">
        <div class="stat-icon stat-icon-green">✅</div>
        <div class="stat-info"><div class="stat-value">${stats.approved}</div><div class="stat-label">Approved</div></div>
      </div>
      <div class="stat-card hover-lift" data-color="purple">
        <div class="stat-icon stat-icon-purple">✏️</div>
        <div class="stat-info"><div class="stat-value">${stats.draft}</div><div class="stat-label">Draft</div></div>
      </div>
    </div>

    <!-- Quick Action -->
    ${stats.total === 0 ? `
    <div class="card card-glass text-center py-12 mb-8">
      <div style="font-size:3rem;margin-bottom:var(--sp-4)">🏗️</div>
      <h3 style="margin-bottom:var(--sp-2)">Ready to get started?</h3>
      <p class="mb-6">Submit your first building permit application online.</p>
      <button class="btn btn-primary btn-lg" onclick="App.navigate('apply')">Apply for a Building Permit</button>
    </div>` : ''}

    <!-- Recent Applications -->
    <div class="section-title">Recent Applications</div>
    ${apps.length === 0 ? `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No applications yet</div><div class="empty-desc">Click "Apply for Permit" to get started.</div><button class="btn btn-primary mt-4" onclick="App.navigate('apply')">Apply Now</button></div>` :
    `<div class="grid grid-auto gap-4">
      ${apps.slice(0,4).map(app => renderAppCard(app)).join('')}
    </div>
    ${apps.length > 4 ? `<div class="text-center mt-4"><button class="btn btn-ghost" onclick="App.navigate('applications')">View All Applications →</button></div>` : ''}`}`;
  }

  /* ── Applicant: My Applications ──────────────────────── */
  function renderMyApplications(div, session) {
    const apps = DB.getApplicationsByApplicant(session.userId);
    div.innerHTML = `
    <div class="page-header flex items-center justify-between">
      <div><h1>My Applications</h1><p>All your building permit applications.</p></div>
      <button class="btn btn-primary" onclick="App.navigate('apply')">+ New Application</button>
    </div>
    ${apps.length === 0 ? `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No applications</div><button class="btn btn-primary mt-4" onclick="App.navigate('apply')">Apply Now</button></div>` :
    `<div class="grid grid-auto gap-4">${apps.map(app => renderAppCard(app)).join('')}</div>`}`;
  }

  function renderAppCard(app) {
    const cfg = Utils.getStatusConfig(app.status);
    const progress = Workflow.getProgressPercent(app.status);
    return `
    <div class="app-card card-shimmer hover-lift" onclick="App.navigate('track-${app.id}')">
      <div class="app-card-header">
        <div>
          <div class="app-number">${app.applicationNumber}</div>
          <div class="app-name">${Utils.sanitize(app.projectName)}</div>
        </div>
        <span class="badge ${Utils.getStatusBadgeClass(app.status)}">${app.status}</span>
      </div>
      <div style="margin:var(--sp-3) 0">
        <div style="height:4px;background:var(--border);border-radius:999px;overflow:hidden">
          <div style="width:${progress}%;height:100%;background:linear-gradient(90deg,var(--primary),var(--secondary));border-radius:999px;transition:width .5s ease"></div>
        </div>
      </div>
      <div class="app-meta">
        <span>🏗️ ${Utils.sanitize(app.projectType)}</span>
        <span>📍 ${Utils.sanitize(app.barangay)}</span>
        <span>💰 ${Utils.formatCurrency(app.estimatedCost)}</span>
        <span>📅 ${app.submittedAt ? Utils.formatDate(app.submittedAt) : 'Not submitted'}</span>
      </div>
    </div>`;
  }

  /* ── Applicant: Application Detail / Tracking ────────── */
  function renderAppDetail(div, session, appId) {
    const data = DB.getApplicationWithHistory(appId);
    if (!data) { div.innerHTML = '<div class="empty-state"><div class="empty-title">Application not found</div></div>'; return; }
    if (session.role === 'applicant' && data.applicantId !== session.userId) {
      div.innerHTML = '<div class="empty-state"><div class="empty-title">Access denied</div></div>'; return;
    }

    const cfg      = Utils.getStatusConfig(data.status);
    const progress  = Workflow.getProgressPercent(data.status);
    const req       = AI.checkRequirements(appId);

    div.innerHTML = `
    <div class="flex items-center gap-4 mb-6">
      <button class="btn btn-ghost btn-sm" onclick="history.back()">← Back</button>
      <div>
        <div class="text-xs text-muted font-mono">${data.applicationNumber}</div>
        <h2 style="font-size:var(--text-2xl);font-weight:700">${Utils.sanitize(data.projectName)}</h2>
      </div>
      <span class="badge ${Utils.getStatusBadgeClass(data.status)} ml-auto">${cfg.icon} ${data.status}</span>
    </div>

    <!-- Progress Bar -->
    <div class="card mb-6">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-medium">Processing Progress</span>
        <span class="text-sm text-muted">${progress}%</span>
      </div>
      <div style="height:8px;background:var(--border);border-radius:999px;overflow:hidden;margin-bottom:var(--sp-4)">
        <div style="width:${progress}%;height:100%;background:linear-gradient(90deg,var(--primary),var(--secondary));border-radius:999px;transition:width .8s ease"></div>
      </div>
      <div class="flex justify-between text-xs text-muted">
        <span>Submitted</span><span>Validation</span><span>Review</span><span>Approval</span><span>Approved</span>
      </div>
    </div>

    <div class="grid grid-2 gap-6">
      <!-- Left Column -->
      <div>
        <!-- Project Info -->
        <div class="card mb-4">
          <div class="card-header"><div class="card-title">📋 Project Information</div></div>
          ${infoRow('Project Name', data.projectName)}
          ${infoRow('Project Type', data.projectType)}
          ${infoRow('Proposed Use', data.proposedUse)}
          ${infoRow('Classification', data.buildingClassification)}
          ${infoRow('Est. Cost', Utils.formatCurrency(data.estimatedCost))}
          ${infoRow('Floors', data.numberOfFloors)}
          ${infoRow('Description', data.constructionDescription, true)}
        </div>

        <!-- Location Info -->
        <div class="card mb-4">
          <div class="card-header"><div class="card-title">📍 Project Location</div></div>
          ${infoRow('Province', data.province)}
          ${infoRow('Municipality', data.municipality)}
          ${infoRow('Barangay', data.barangay)}
          ${infoRow('Street', data.street)}
          ${infoRow('Lot No.', data.lotNumber)}
          ${infoRow('Block No.', data.blockNumber)}
          ${infoRow('Tax Declaration', data.taxDeclaration)}
          ${infoRow('Coordinates', data.latitude ? `${data.latitude}, ${data.longitude}` : 'Not set')}
          ${data.latitude && data.longitude ? `<div id="mini-map" style="height:180px;border-radius:var(--radius-lg);margin-top:var(--sp-3);overflow:hidden"></div>` : ''}
        </div>

        <!-- Documents -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📄 Documents</div>
            <span class="badge ${req.completenessScore >= 70 ? 'badge-success' : 'badge-warning'}">${req.completenessScore}% Complete</span>
          </div>
          <div class="requirement-list">
            ${DB.findAll('requirements').map(r => {
              const doc = data.docs?.find(d => d.requirementId === r.id);
              const statusCls = doc ? (doc.status === 'Accepted' ? 'done' : 'pending') : 'missing';
              return `<div class="requirement-item ${statusCls}">
                <div class="req-check ${statusCls}">${doc ? (doc.status==='Accepted'?'✓':'⏳') : '✗'}</div>
                <div style="flex:1">
                  <div class="text-sm font-medium">${Utils.sanitize(r.name)} ${r.required?'<span class="required">*</span>':''}</div>
                  ${doc ? `<div class="text-xs text-muted">${Utils.sanitize(doc.fileName)} · <span class="badge ${Documents.getDocStatusBadge(doc.status)}">${doc.status}</span></div>` : '<div class="text-xs text-danger">Not uploaded</div>'}
                  ${doc?.remarks ? `<div class="text-xs text-warning mt-1">💬 ${Utils.sanitize(doc.remarks)}</div>` : ''}
                </div>
                ${data.status==='Additional Requirements' || data.status==='Draft' ? `<button class="btn btn-ghost btn-sm btn-icon" onclick="Documents.openUploadModal('${appId}','${r.id}','${Utils.sanitize(r.name).replace(/'/g,'&apos;')}')">📤</button>` : ''}
              </div>`;
            }).join('')}
          </div>
          ${data.status === 'Additional Requirements' || data.status === 'Draft' ? `
          <div class="mt-4">
            <div id="upload-modal" class="modal-backdrop hidden">
              <div class="modal modal-md">
                <div class="modal-header"><div class="modal-title" id="upload-modal-title">Upload Document</div><div class="modal-close" onclick="document.getElementById('upload-modal').classList.add('hidden')">×</div></div>
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
                  <button class="btn btn-primary" onclick="Documents.confirmUpload('${appId}','doc-list-container')">Upload</button>
                </div>
              </div>
            </div>
          </div>
          <script>Documents.initDropZone('${appId}','${session.userId}');<\/script>` : ''}
        </div>
      </div>

      <!-- Right Column -->
      <div>
        <!-- Remarks -->
        ${data.remarks?.length ? `
        <div class="card mb-4">
          <div class="card-header"><div class="card-title">💬 MPDO Remarks</div></div>
          ${data.remarks.map(r => {
            const staff = DB.getUserById(r.staffId);
            return `<div class="mb-3 p-3" style="background:var(--surface-2);border-radius:var(--radius-lg)">
              <div class="text-xs text-muted mb-1">${staff?.fullName||'MPDO Staff'} · ${Utils.formatDateTime(r.createdAt)}</div>
              <div class="text-sm">${Utils.sanitize(r.content)}</div>
            </div>`;
          }).join('')}
        </div>` : ''}

        <!-- Location Flags -->
        ${data.locationFlags?.length ? `
        <div class="card mb-4">
          <div class="card-header"><div class="card-title">⚠️ Location Flags</div></div>
          ${data.locationFlags.map(f => `<div class="alert alert-warning mb-2"><div class="alert-icon">⚠️</div><div class="alert-content">${Utils.sanitize(f)}</div></div>`).join('')}
        </div>` : ''}

        <!-- Action for Applicant -->
        ${data.status === 'Draft' ? `
        <div class="card mb-4">
          <div class="card-header"><div class="card-title">📤 Submit Application</div></div>
          <p class="text-sm mb-4">Review your application and submit when ready. Required documents must be uploaded.</p>
          <button class="btn btn-primary btn-full" onclick="App.submitApp('${appId}')">Submit Application</button>
        </div>` : ''}

        <!-- Status Timeline -->
        <div class="card">
          <div class="card-header"><div class="card-title">📅 Status History</div></div>
          <div id="timeline-container"></div>
        </div>
      </div>
    </div>`;

    // Render timeline
    setTimeout(() => {
      Workflow.renderTimeline(data.history, 'timeline-container');
      // Mini map
      if (data.latitude && data.longitude) {
        const miniMap = MapModule.initMap('mini-map', { centerLat: data.latitude, centerLng: data.longitude, zoom: 16 });
        L.marker([data.latitude, data.longitude]).addTo(miniMap);
      }
      // Init upload if needed
      if (data.status === 'Additional Requirements' || data.status === 'Draft') {
        Documents.initDropZone(appId, session.userId);
      }
    }, 200);
  }

  function infoRow(label, value, long = false) {
    if (!value && value !== 0) return '';
    return `<div class="flex ${long?'flex-col':'items-start'} gap-2 py-2 border-b" style="border-color:var(--border)">
      <span class="text-xs text-muted" style="min-width:140px">${label}</span>
      <span class="text-sm">${Utils.sanitize(String(value))}</span>
    </div>`;
  }

  /* ── Multi-Step Application Form ─────────────────────── */
  let formStep = 1;
  let formData = {};

  function renderApplyForm(div, session) {
    const drafts = DB.getApplicationsByApplicant(session.userId).filter(a => a.status === 'Draft');
    const user   = Auth.getCurrentUser();

    div.innerHTML = `
    <div class="page-header">
      <h1>Building Permit Application</h1>
      <p>Complete all steps to submit your application.</p>
    </div>

    <!-- Steps Indicator -->
    <div class="steps-bar mb-8" id="steps-bar">
      ${['Applicant Info','Project Info','Location','Documents','Review & Submit'].map((s,i) => `
        <div class="step-item ${formStep===i+1?'active':formStep>i+1?'completed':''}" id="step-item-${i+1}">
          <div class="step-circle">${formStep>i+1?'✓':i+1}</div>
          <div class="step-label">${s}</div>
        </div>`).join('')}
    </div>

    <div id="form-step-content"></div>
    <div class="flex items-center gap-4 mt-6">
      <button class="btn btn-ghost" id="btn-prev" onclick="App.prevStep()" ${formStep===1?'style="opacity:0;pointer-events:none"':''}>← Previous</button>
      <div class="flex-1"></div>
      <button class="btn btn-ghost btn-sm" onclick="App.saveDraft()">💾 Save Draft</button>
      <button class="btn btn-primary" id="btn-next" onclick="App.nextStep()">
        ${formStep===5 ? '🚀 Submit Application' : 'Next →'}
      </button>
    </div>`;

    formData._user = user;
    formData._appId = drafts.length ? drafts[0].id : null;
    formStep = 1;
    renderFormStep(session);
  }

  function renderFormStep(session) {
    const container = document.getElementById('form-step-content');
    if (!container) return;

    // Update step indicators
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`step-item-${i}`);
      if (!el) continue;
      el.className = `step-item ${formStep===i?'active':formStep>i?'completed':''}`;
      el.querySelector('.step-circle').innerHTML = formStep > i ? '✓' : String(i);
    }
    document.getElementById('btn-prev').style.opacity = formStep === 1 ? '0' : '1';
    document.getElementById('btn-prev').style.pointerEvents = formStep === 1 ? 'none' : 'auto';
    document.getElementById('btn-next').textContent = formStep === 5 ? '🚀 Submit Application' : 'Next →';

    const user = formData._user || {};

    const steps = {
      1: () => `
        <div class="card">
          <div class="card-header"><div class="card-title">👤 Applicant Information</div></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Full Name <span class="required">*</span></label><input type="text" id="f-fullname" class="form-control" value="${Utils.sanitize(formData.fullName||user.fullName||'')}" placeholder="Juan dela Cruz"></div>
            <div class="form-group"><label class="form-label">Email Address <span class="required">*</span></label><input type="email" id="f-email" class="form-control" value="${Utils.sanitize(formData.email||user.email||'')}" readonly></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Contact Number <span class="required">*</span></label><input type="text" id="f-phone" class="form-control" value="${Utils.sanitize(formData.phone||user.phone||'')}" placeholder="09171234567"></div>
            <div class="form-group"><label class="form-label">Applicant Type <span class="required">*</span></label>
              <select id="f-apptype" class="form-control">
                ${['Individual','Corporation','Partnership','Cooperative','Government Agency'].map(t => `<option ${(formData.applicantType||user.applicantType||'Individual')===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Complete Address <span class="required">*</span></label><input type="text" id="f-address" class="form-control" value="${Utils.sanitize(formData.address||user.address||'')}" placeholder="House No., Street, Barangay, Municipality, Province"></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Valid ID Type</label>
              <select id="f-idtype" class="form-control">
                ${["PhilSys ID","Driver's License","SSS ID","Passport","Voter's ID","PRC ID","Postal ID"].map(t=>`<option ${(formData.idType||user.idType||'')===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label class="form-label">ID Number</label><input type="text" id="f-idnum" class="form-control" value="${Utils.sanitize(formData.idNumber||user.idNumber||'')}" placeholder="ID number"></div>
          </div>
        </div>`,
      2: () => `
        <div class="card">
          <div class="card-header"><div class="card-title">🏗️ Project Information</div></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Project Name <span class="required">*</span></label><input type="text" id="f-projname" class="form-control" value="${Utils.sanitize(formData.projectName||'')}" placeholder="e.g. Santos Residence"></div>
            <div class="form-group"><label class="form-label">Project Type <span class="required">*</span></label>
              <select id="f-projtype" class="form-control">
                ${['Residential','Commercial','Industrial','Institutional','Accessory','Mixed-use'].map(t=>`<option ${(formData.projectType||'')===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Proposed Use/Occupancy <span class="required">*</span></label><input type="text" id="f-use" class="form-control" value="${Utils.sanitize(formData.proposedUse||'')}" placeholder="e.g. Single Family Dwelling"></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Building Classification <span class="required">*</span></label>
              <select id="f-class" class="form-control">
                ${['Group A - Residential','Group B - Commercial','Group C - Industrial','Group D - Institutional','Group E - Agricultural','Group F - Industrial','Group G - Storage'].map(t=>`<option ${(formData.buildingClassification||'')===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label class="form-label">Number of Floors <span class="required">*</span></label><input type="number" id="f-floors" class="form-control" min="1" max="50" value="${formData.numberOfFloors||1}"></div>
          </div>
          <div class="form-group"><label class="form-label">Estimated Project Cost (₱) <span class="required">*</span></label><input type="number" id="f-cost" class="form-control" min="1" value="${formData.estimatedCost||''}" placeholder="e.g. 2500000"></div>
          <div class="form-group"><label class="form-label">Construction Description <span class="required">*</span></label><textarea id="f-desc" class="form-control" rows="4" placeholder="Describe the proposed construction…">${Utils.sanitize(formData.constructionDescription||'')}</textarea></div>
        </div>`,
      3: () => `
        <div class="card">
          <div class="card-header"><div class="card-title">📍 Project Location</div></div>
          <div class="form-row-3 mb-4">
            <div class="form-group"><label class="form-label">Province <span class="required">*</span></label><input type="text" id="f-province" class="form-control" value="${Utils.sanitize(formData.province||DB.getSetting('province','Batangas'))}"></div>
            <div class="form-group"><label class="form-label">Municipality <span class="required">*</span></label><input type="text" id="f-municipality" class="form-control" value="${Utils.sanitize(formData.municipality||DB.getSetting('municipalityName','San Jose').replace('Municipality of ',''))}"></div>
            <div class="form-group"><label class="form-label">Barangay <span class="required">*</span></label>
              <select id="f-barangay" class="form-control">
                <option value="">-- Select Barangay --</option>
                ${DB.findAll('barangays').map(b=>`<option value="${b.name}" ${(formData.barangay||'')==b.name?'selected':''}>${b.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Street / Purok / Sitio</label><input type="text" id="f-street" class="form-control" value="${Utils.sanitize(formData.street||'')}" placeholder="Street name or purok"></div>
            <div class="form-group"><label class="form-label">Lot Number</label><input type="text" id="f-lot" class="form-control" value="${Utils.sanitize(formData.lotNumber||'')}" placeholder="Lot No."></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Block Number</label><input type="text" id="f-block" class="form-control" value="${Utils.sanitize(formData.blockNumber||'')}" placeholder="Block No."></div>
            <div class="form-group"><label class="form-label">Tax Declaration / Reference</label><input type="text" id="f-taxdecl" class="form-control" value="${Utils.sanitize(formData.taxDeclaration||'')}" placeholder="TD-SJ-YYYY-NNNN"></div>
          </div>
          
          <!-- Map Search -->
          <div class="form-group">
            <label class="form-label">🔍 Search Address on Map</label>
            <div class="input-group">
              <span class="input-icon">🔍</span>
              <input type="text" id="map-search" class="form-control" placeholder="Type address and press Enter to search…">
            </div>
            <div class="form-hint">Press Enter after typing to search. Then click or drag the pin to exact location.</div>
          </div>

          <!-- Interactive Map -->
          <div id="pin-map" style="height:360px;border-radius:var(--radius-xl);overflow:hidden;border:1px solid var(--border);margin-bottom:var(--sp-4)"></div>
          
          <div id="location-validation-msg"></div>

          <div class="form-row mt-3">
            <div class="form-group"><label class="form-label">Latitude <span class="required">*</span></label><input type="text" id="field-latitude" class="form-control" value="${formData.latitude||''}" placeholder="Click map to auto-fill" readonly></div>
            <div class="form-group"><label class="form-label">Longitude <span class="required">*</span></label><input type="text" id="field-longitude" class="form-control" value="${formData.longitude||''}" placeholder="Click map to auto-fill" readonly></div>
          </div>
          <div class="alert alert-info mt-2">
            <div class="alert-icon">ℹ️</div>
            <div class="alert-content">Click anywhere on the map to place a pin at your project location. The coordinates will be automatically recorded. MPDO staff will verify the location.</div>
          </div>
        </div>`,
      4: () => {
        const appId = formData._appId || 'TEMP-' + Date.now();
        return `
        <div class="card">
          <div class="card-header"><div class="card-title">📄 Document Upload</div></div>
          <p class="text-sm text-secondary mb-4">Upload all required documents. Accepted formats: PDF, JPG, PNG, DWG, XLSX, DOC. Max 50 MB per file.</p>
          ${DB.findAll('requirements').map(req => {
            const doc = formData._appId ? DB.findBy('documents','applicationId',formData._appId).find(d=>d.requirementId===req.id) : null;
            return `
            <div class="requirement-item ${doc?'done':''} mb-2">
              <div class="req-check ${doc?'done':'missing'}">${doc?'✓':'✗'}</div>
              <div style="flex:1">
                <div class="text-sm font-medium">${Utils.sanitize(req.name)} ${req.required?'<span style="color:var(--danger)">*</span>':''}</div>
                <div class="text-xs text-muted">${Utils.sanitize(req.description)}</div>
                ${doc ? `<div class="text-xs text-success mt-1">✅ ${Utils.sanitize(doc.fileName)}</div>` : ''}
              </div>
              <button class="btn btn-ghost btn-sm" onclick="App.uploadForReq('${req.id}','${Utils.sanitize(req.name).replace(/'/g,'&apos;')}')">
                ${doc ? '🔄 Replace' : '📤 Upload'}
              </button>
            </div>`;
          }).join('')}
          <div id="upload-modal" class="modal-backdrop hidden">
            <div class="modal modal-md">
              <div class="modal-header"><div class="modal-title" id="upload-modal-title">Upload Document</div><div class="modal-close" onclick="document.getElementById('upload-modal').classList.add('hidden')">×</div></div>
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
                <button class="btn btn-primary" id="upload-confirm-btn">Upload</button>
              </div>
            </div>
          </div>
        </div>`;
      },
      5: () => {
        const req = formData._appId ? AI.checkRequirements(formData._appId) : { completenessScore: 0, missingRequired: [] };
        return `
        <div class="card">
          <div class="card-header"><div class="card-title">✅ Review & Submit</div></div>
          <div class="grid grid-2 gap-4 mb-4">
            <div>
              <div class="text-xs text-muted mb-1">Applicant</div>
              <div class="font-medium">${Utils.sanitize(formData.fullName||session.fullName)}</div>
            </div>
            <div>
              <div class="text-xs text-muted mb-1">Project Name</div>
              <div class="font-medium">${Utils.sanitize(formData.projectName||'Not set')}</div>
            </div>
            <div>
              <div class="text-xs text-muted mb-1">Project Type</div>
              <div class="font-medium">${Utils.sanitize(formData.projectType||'Not set')}</div>
            </div>
            <div>
              <div class="text-xs text-muted mb-1">Location</div>
              <div class="font-medium">${Utils.sanitize([formData.street, formData.barangay, formData.municipality].filter(Boolean).join(', ')||'Not set')}</div>
            </div>
            <div>
              <div class="text-xs text-muted mb-1">Estimated Cost</div>
              <div class="font-medium">${formData.estimatedCost ? Utils.formatCurrency(formData.estimatedCost) : 'Not set'}</div>
            </div>
            <div>
              <div class="text-xs text-muted mb-1">Coordinates</div>
              <div class="font-medium">${formData.latitude ? `${parseFloat(formData.latitude).toFixed(5)}, ${parseFloat(formData.longitude).toFixed(5)}` : '⚠️ Not pinned'}</div>
            </div>
          </div>
          
          <!-- AI check -->
          <div class="ai-panel mb-4">
            <div class="ai-panel-header">🤖 AI Pre-submission Check</div>
            <div class="ai-confidence mb-2">
              <div class="confidence-bar"><div class="confidence-fill" style="width:${req.completenessScore}%"></div></div>
              <span>${req.completenessScore}% Complete</span>
            </div>
            ${req.missingRequired.length ? `
              <div class="text-xs text-warning">⚠️ Missing ${req.missingRequired.length} required document(s): ${req.missingRequired.map(r=>r.name).join(', ')}</div>` :
              '<div class="text-xs text-success">✅ All required documents appear to be uploaded</div>'}
            <div class="text-xs text-muted mt-2">You may still submit with missing optional documents. Required (*) documents must be submitted.</div>
          </div>

          ${!formData.latitude ? `<div class="alert alert-danger mb-4"><div class="alert-icon">❌</div><div class="alert-content"><div class="alert-title">Location Required</div>Please go back to Step 3 and pin your project location on the map.</div></div>` : ''}

          <div class="alert alert-info">
            <div class="alert-icon">ℹ️</div>
            <div class="alert-content">By submitting this application, you certify that all information provided is true and accurate. Falsification of information is punishable by law. The MPDO will process your application and notify you of any updates.</div>
          </div>
        </div>`;
      }
    };

    container.innerHTML = `<div class="animate-fade-up">${steps[formStep]()}</div>`;

    // Initialize map on step 3
    if (formStep === 3) {
      setTimeout(() => {
        MapModule.initPinDropMap('pin-map', {
          lat:  formData.latitude  || null,
          lng:  formData.longitude || null,
          onConfirm: (lat, lng) => { formData.latitude = lat; formData.longitude = lng; }
        });
      }, 150);
    }

    // Init upload on step 4
    if (formStep === 4) {
      setTimeout(() => Documents.initDropZone(formData._appId || '', session.userId), 100);
    }
  }

  function uploadForReq(reqId, reqName) {
    ensureAppExists();
    Documents.openUploadModal(formData._appId, reqId, reqName);
    document.getElementById('upload-confirm-btn').onclick = () => {
      Documents.confirmUpload(formData._appId, 'doc-step-container');
      // Re-render step
      renderFormStep(Auth.getSession());
    };
    Documents.initDropZone(formData._appId, Auth.getSession().userId);
  }

  function ensureAppExists() {
    if (formData._appId) return;
    const session = Auth.getSession();
    const app = DB.insert('applications', {
      id: Utils.generateId('APP'), applicationNumber: Utils.generateAppNumber(),
      applicantId: session.userId, status: 'Draft',
      createdAt: new Date().toISOString(), submittedAt: null,
      updatedAt: new Date().toISOString(), assignedTo: null, priorityScore: 0,
      projectName: formData.projectName || 'Untitled Project',
      projectType: formData.projectType || 'Residential',
      proposedUse: formData.proposedUse || '', buildingClassification: formData.buildingClassification || '',
      estimatedCost: parseInt(formData.estimatedCost)||0, numberOfFloors: parseInt(formData.numberOfFloors)||1,
      constructionDescription: formData.constructionDescription || '',
      province: formData.province || '', municipality: formData.municipality || '',
      barangay: formData.barangay || '', street: formData.street || '',
      lotNumber: formData.lotNumber || '', blockNumber: formData.blockNumber || '',
      taxDeclaration: formData.taxDeclaration || '',
      latitude: formData.latitude || null, longitude: formData.longitude || null,
      locationConfirmed: !!(formData.latitude && formData.longitude),
      locationValidated: false, locationFlags: [], aiAnalyzed: false
    });
    formData._appId = app.id;
    DB.insert('statusHistory', { id: Utils.generateId('SH'), applicationId: app.id, fromStatus: null, toStatus: 'Draft', userId: session.userId, timestamp: new Date().toISOString(), remarks: 'Application created' });
    Audit.log(session.userId, 'APP_CREATE', 'Application', app.id, `Application created: ${app.applicationNumber}`);
  }

  function collectStepData() {
    const session = Auth.getSession();
    if (formStep === 1) {
      formData.fullName     = document.getElementById('f-fullname')?.value.trim();
      formData.phone        = document.getElementById('f-phone')?.value.trim();
      formData.address      = document.getElementById('f-address')?.value.trim();
      formData.applicantType= document.getElementById('f-apptype')?.value;
      formData.idType       = document.getElementById('f-idtype')?.value;
      formData.idNumber     = document.getElementById('f-idnum')?.value.trim();
      formData.email        = session.email;
    } else if (formStep === 2) {
      formData.projectName           = document.getElementById('f-projname')?.value.trim();
      formData.projectType           = document.getElementById('f-projtype')?.value;
      formData.proposedUse           = document.getElementById('f-use')?.value.trim();
      formData.buildingClassification= document.getElementById('f-class')?.value;
      formData.numberOfFloors        = parseInt(document.getElementById('f-floors')?.value)||1;
      formData.estimatedCost         = parseInt(document.getElementById('f-cost')?.value)||0;
      formData.constructionDescription=document.getElementById('f-desc')?.value.trim();
    } else if (formStep === 3) {
      formData.province      = document.getElementById('f-province')?.value.trim();
      formData.municipality  = document.getElementById('f-municipality')?.value.trim();
      formData.barangay      = document.getElementById('f-barangay')?.value;
      formData.street        = document.getElementById('f-street')?.value.trim();
      formData.lotNumber     = document.getElementById('f-lot')?.value.trim();
      formData.blockNumber   = document.getElementById('f-block')?.value.trim();
      formData.taxDeclaration= document.getElementById('f-taxdecl')?.value.trim();
      const lat = document.getElementById('field-latitude')?.value;
      const lng = document.getElementById('field-longitude')?.value;
      if (lat && lng) { formData.latitude = parseFloat(lat); formData.longitude = parseFloat(lng); }
    }
  }

  function validateStep() {
    if (formStep === 1) {
      if (!formData.fullName) { Utils.toast('Full name is required', 'warning'); return false; }
      if (!formData.phone)    { Utils.toast('Contact number is required', 'warning'); return false; }
    }
    if (formStep === 2) {
      if (!formData.projectName)  { Utils.toast('Project name is required', 'warning'); return false; }
      if (!formData.proposedUse)  { Utils.toast('Proposed use is required', 'warning'); return false; }
      if (!formData.estimatedCost || formData.estimatedCost < 1) { Utils.toast('Please enter a valid estimated cost', 'warning'); return false; }
      if (!formData.constructionDescription) { Utils.toast('Construction description is required', 'warning'); return false; }
    }
    if (formStep === 3) {
      if (!formData.barangay)   { Utils.toast('Please select a barangay', 'warning'); return false; }
      if (!formData.province)   { Utils.toast('Province is required', 'warning'); return false; }
      if (!formData.latitude || !formData.longitude) { Utils.toast('Please pin your project location on the map', 'warning'); return false; }
    }
    if (formStep === 5) {
      if (!formData.latitude) { Utils.toast('Project location is required. Please go back to Step 3 and pin your location.', 'error'); return false; }
    }
    return true;
  }

  function nextStep() {
    collectStepData();
    if (!validateStep()) return;

    // Auto-save/create application draft when moving past step 2
    if (formStep >= 2) {
      ensureAppExists();
      saveCurrentFormData();
    }

    if (formStep === 5) {
      submitCurrentApp();
      return;
    }
    formStep++;
    renderFormStep(Auth.getSession());
  }

  function prevStep() {
    collectStepData();
    if (formStep > 1) { formStep--; renderFormStep(Auth.getSession()); }
  }

  function saveCurrentFormData() {
    if (!formData._appId) return;
    DB.update('applications', formData._appId, {
      projectName:            formData.projectName || '',
      projectType:            formData.projectType || 'Residential',
      proposedUse:            formData.proposedUse || '',
      buildingClassification: formData.buildingClassification || '',
      estimatedCost:          parseInt(formData.estimatedCost)||0,
      numberOfFloors:         parseInt(formData.numberOfFloors)||1,
      constructionDescription:formData.constructionDescription || '',
      province:               formData.province || '',
      municipality:           formData.municipality || '',
      barangay:               formData.barangay || '',
      street:                 formData.street || '',
      lotNumber:              formData.lotNumber || '',
      blockNumber:            formData.blockNumber || '',
      taxDeclaration:         formData.taxDeclaration || '',
      latitude:               formData.latitude || null,
      longitude:              formData.longitude || null,
      locationConfirmed:      !!(formData.latitude && formData.longitude),
      updatedAt:              new Date().toISOString()
    });
  }

  function saveDraft() {
    collectStepData();
    ensureAppExists();
    saveCurrentFormData();
    Utils.toast('Draft saved successfully', 'success');
  }

  function submitCurrentApp() {
    saveCurrentFormData();
    const result = Workflow.submitApplication(formData._appId, Auth.getSession().userId);
    if (!result.ok) { Utils.toast(result.error, 'error'); return; }
    AI.analyzeApplication(formData._appId);
    Utils.toast('🎉 Application submitted successfully!', 'success', 5000);
    formData = {};
    formStep = 1;
    setTimeout(() => navigate('applications'), 1500);
  }

  function submitApp(appId) {
    if (!confirm('Are you sure you want to submit this application? Please ensure all required documents are uploaded.')) return;
    const result = Workflow.submitApplication(appId, Auth.getSession().userId);
    if (!result.ok) { Utils.toast(result.error, 'error'); return; }
    Utils.toast('Application submitted!', 'success');
    navigate('app-detail');
    currentAppId = appId;
    navigate('track-' + appId);
  }

  /* ── Notifications Page ──────────────────────────────── */
  function renderNotificationsPage(div, session) {
    div.innerHTML = `
    <div class="page-header flex items-center justify-between">
      <div><h1>Notifications</h1><p>Stay updated on your application status.</p></div>
      <button class="btn btn-ghost btn-sm" onclick="Notifications.markAllRead('${session.userId}');App.navigate('notifications')">Mark All Read</button>
    </div>
    <div class="card">
      <div id="notif-list"></div>
    </div>`;
    Notifications.renderNotificationList(session.userId, 'notif-list');
    Notifications.markAllRead(session.userId);
    setTimeout(() => Notifications.refreshBadge(session.userId), 200);
  }

  /* ── Chatbot Page ────────────────────────────────────── */
  function renderChatbotPage(div) {
    div.innerHTML = `
    <div class="page-header"><h1>MPDO Assistant</h1><p>Get answers to your building permit questions.</p></div>
    <div class="card" style="height:calc(100vh - 240px);display:flex;flex-direction:column">
      <div id="chatbot-messages-page" class="chatbot-messages flex-1"></div>
      <div id="chatbot-suggestions-page" class="chat-suggestions"></div>
      <div class="chatbot-input-area">
        <input type="text" id="chatbot-input-page" class="form-control" placeholder="Ask me anything about building permits…">
        <button class="chatbot-send" onclick="sendPageChatMessage()">➤</button>
      </div>
    </div>`;
    // Init page chatbot
    const msgs = document.getElementById('chatbot-messages-page');
    if (msgs) {
      const div2 = document.createElement('div');
      div2.className = 'chat-msg bot';
      div2.innerHTML = "👋 Hello! I'm the <strong>MPDO Assistant</strong>. How can I help you today?";
      msgs.appendChild(div2);
      showPageSuggestions(['What are the requirements?', 'How do I apply?', 'Processing time', 'Contact MPDO']);
    }
    document.getElementById('chatbot-input-page')?.addEventListener('keypress', e => {
      if (e.key === 'Enter') sendPageChatMessage();
    });
  }

  /* ── Staff Dashboard ─────────────────────────────────── */
  function renderStaffHome(div, session) {
    const queue  = DB.getStaffQueue();
    const stats  = Reports.getStats();
    div.innerHTML = `
    <div class="page-header">
      <h1>Staff Dashboard</h1>
      <p>Welcome, ${Utils.sanitize(session.fullName)}. Monitor and process building permit applications.</p>
    </div>
    <div class="grid grid-4 gap-6 mb-8">
      <div class="stat-card" data-color="blue"><div class="stat-icon stat-icon-blue">📋</div><div class="stat-info"><div class="stat-value">${stats.total}</div><div class="stat-label">Total Applications</div></div></div>
      <div class="stat-card" data-color="yellow"><div class="stat-icon stat-icon-yellow">⏳</div><div class="stat-info"><div class="stat-value">${stats.pending}</div><div class="stat-label">Pending Review</div></div></div>
      <div class="stat-card" data-color="green"><div class="stat-icon stat-icon-green">✅</div><div class="stat-info"><div class="stat-value">${stats.approved}</div><div class="stat-label">Approved</div></div></div>
      <div class="stat-card" data-color="cyan"><div class="stat-icon stat-icon-cyan">⏱️</div><div class="stat-info"><div class="stat-value">${stats.avgDays||'—'}</div><div class="stat-label">Avg. Processing Days</div></div></div>
    </div>
    <div class="section-title">Priority Queue</div>
    <div class="table-container">
      <div class="table-responsive">
      <table class="data-table">
        <thead><tr><th>App #</th><th>Project</th><th>Type</th><th>Status</th><th>AI Priority</th><th>Days Waiting</th><th>Action</th></tr></thead>
        <tbody>
          ${queue.slice(0,8).map(app => `
          <tr>
            <td><span class="text-xs font-mono text-muted">${app.applicationNumber}</span></td>
            <td><div class="font-medium">${Utils.sanitize(app.projectName)}</div><div class="text-xs text-muted">${Utils.sanitize(app.barangay)}</div></td>
            <td><span class="badge badge-muted">${app.projectType}</span></td>
            <td><span class="badge ${Utils.getStatusBadgeClass(app.status)}">${app.status}</span></td>
            <td>
              <div class="flex items-center gap-2">
                <div style="width:50px;height:6px;background:var(--border);border-radius:999px;overflow:hidden">
                  <div style="width:${app.priorityScore}%;height:100%;background:${app.priorityScore>=70?'var(--danger)':app.priorityScore>=45?'var(--warning)':'var(--success)'};border-radius:999px"></div>
                </div>
                <span class="text-sm font-semibold">${app.priorityScore}</span>
                ${app.aiAnalyzed?'<span class="badge badge-ai text-xs">AI</span>':''}
              </div>
            </td>
            <td><span class="text-sm text-${Utils.daysAgo(app.submittedAt||app.createdAt)>14?'danger':'muted'}">${Utils.daysAgo(app.submittedAt||app.createdAt)}d</span></td>
            <td><button class="btn btn-primary btn-sm" onclick="App.navigate('review-${app.id}')">Review</button></td>
          </tr>`).join('')}
          ${!queue.length?'<tr><td colspan="7" class="text-center text-muted py-8">No applications in queue</td></tr>':''}
        </tbody>
      </table>
      </div>
    </div>`;
  }

  /* ── Staff Queue ─────────────────────────────────────── */
  function renderStaffQueue(div, session) {
    let apps = DB.getStaffQueue();
    div.innerHTML = `
    <div class="page-header flex items-center justify-between">
      <div><h1>Application Queue</h1><p>Review and process submitted applications. AI priority scores assist in ordering.</p></div>
      <button class="btn btn-ghost btn-sm" onclick="Reports.exportAllApplicationsCSV()">⬇ Export CSV</button>
    </div>
    <div class="alert alert-ai mb-4">
      <div class="alert-icon">🤖</div>
      <div class="alert-content">Priority scores are AI-generated recommendations. Authorized staff may reorder or override at any time.</div>
    </div>
    <div class="table-container">
      <div class="table-toolbar">
        <div class="search-box"><span class="search-icon">🔍</span><input type="text" id="queue-search" placeholder="Search applications…" oninput="App.filterQueue(this.value)"></div>
        <select class="form-control" style="width:180px;height:38px" id="status-filter" onchange="App.filterQueue(document.getElementById('queue-search').value)">
          <option value="">All Statuses</option>
          ${Workflow.STATUSES.filter(s=>s!=='Draft'&&s!=='Approved'&&s!=='Completed').map(s=>`<option>${s}</option>`).join('')}
        </select>
        <select class="form-control" style="width:160px;height:38px" id="type-filter" onchange="App.filterQueue(document.getElementById('queue-search').value)">
          <option value="">All Types</option>
          ${['Residential','Commercial','Industrial','Institutional','Accessory'].map(t=>`<option>${t}</option>`).join('')}
        </select>
      </div>
      <div class="table-responsive">
      <table class="data-table">
        <thead><tr><th>App #</th><th>Project Name</th><th>Type</th><th>Barangay</th><th>Status</th><th>AI Priority</th><th>Submitted</th><th>Actions</th></tr></thead>
        <tbody id="queue-tbody">
          ${renderQueueRows(apps)}
        </tbody>
      </table>
      </div>
    </div>`;
  }

  function renderQueueRows(apps) {
    if (!apps.length) return '<tr><td colspan="8" class="text-center text-muted py-8">No applications in queue</td></tr>';
    return apps.map(app => `
    <tr>
      <td><span class="text-xs font-mono text-muted">${app.applicationNumber}</span></td>
      <td>
        <div class="font-medium">${Utils.sanitize(app.projectName)}</div>
        <div class="text-xs text-muted">${Utils.sanitize(DB.getUserById(app.applicantId)?.fullName||'—')}</div>
      </td>
      <td><span class="badge badge-muted">${app.projectType}</span></td>
      <td><span class="text-sm">${Utils.sanitize(app.barangay||'—')}</span></td>
      <td><span class="badge ${Utils.getStatusBadgeClass(app.status)}">${app.status}</span></td>
      <td>
        <div class="flex items-center gap-2">
          <div style="width:50px;height:6px;background:var(--border);border-radius:999px;overflow:hidden">
            <div style="width:${app.priorityScore||0}%;height:100%;background:${(app.priorityScore||0)>=70?'var(--danger)':(app.priorityScore||0)>=45?'var(--warning)':'var(--success)'};border-radius:999px"></div>
          </div>
          <span class="text-sm font-semibold">${app.priorityScore||0}</span>
        </div>
      </td>
      <td><span class="text-xs text-muted">${Utils.formatDate(app.submittedAt)}</span></td>
      <td>
        <div class="flex gap-1">
          <button class="btn btn-primary btn-sm" onclick="App.navigate('review-${app.id}')">Review</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="AI.analyzeApplication('${app.id}');Utils.toast('AI analysis complete','success')" data-tooltip="Run AI Analysis">🤖</button>
        </div>
      </td>
    </tr>`).join('');
  }

  function filterQueue(search) {
    const status = document.getElementById('status-filter')?.value || '';
    const type   = document.getElementById('type-filter')?.value || '';
    let apps = DB.getStaffQueue();
    if (search) { const q = search.toLowerCase(); apps = apps.filter(a => (a.applicationNumber||'').toLowerCase().includes(q) || (a.projectName||'').toLowerCase().includes(q) || (a.barangay||'').toLowerCase().includes(q)); }
    if (status) apps = apps.filter(a => a.status === status);
    if (type)   apps = apps.filter(a => a.projectType === type);
    const tbody = document.getElementById('queue-tbody');
    if (tbody) tbody.innerHTML = renderQueueRows(apps);
  }

  /* ── Staff: Review Single Application ────────────────── */
  function renderStaffReview(div, session, appId) {
    const data = DB.getApplicationWithHistory(appId);
    if (!data) { div.innerHTML = '<div class="empty-state"><div class="empty-title">Application not found</div></div>'; return; }

    const applicant  = DB.getUserById(data.applicantId);
    const nextStatuses = Workflow.getNextStatuses(data.status, session.role);

    div.innerHTML = `
    <div class="flex items-center gap-4 mb-6">
      <button class="btn btn-ghost btn-sm" onclick="App.navigate('staff-queue')">← Queue</button>
      <div>
        <div class="text-xs text-muted font-mono">${data.applicationNumber}</div>
        <h2 style="font-size:var(--text-2xl);font-weight:700">${Utils.sanitize(data.projectName)}</h2>
      </div>
      <span class="badge ${Utils.getStatusBadgeClass(data.status)} ml-auto">${data.status}</span>
    </div>

    <div class="grid gap-6" style="grid-template-columns:1fr 360px">
      <!-- Main Content -->
      <div>
        <!-- Tabs -->
        <div class="tabs" id="review-tabs">
          <div class="tab-btn active" onclick="App.switchReviewTab('info',this)">📋 Application</div>
          <div class="tab-btn" onclick="App.switchReviewTab('docs',this)">📄 Documents</div>
          <div class="tab-btn" onclick="App.switchReviewTab('location',this)">📍 Location</div>
          <div class="tab-btn" onclick="App.switchReviewTab('history',this)">📅 History</div>
        </div>

        <!-- Tab: Application Info -->
        <div id="tab-info" class="tab-panel active">
          <div class="card mb-4">
            <div class="card-header"><div class="card-title">👤 Applicant Information</div></div>
            ${infoRow('Name', applicant?.fullName)} ${infoRow('Email', applicant?.email)}
            ${infoRow('Phone', applicant?.phone)} ${infoRow('Address', applicant?.address)}
            ${infoRow('Applicant Type', applicant?.applicantType)} ${infoRow('ID Type', applicant?.idType)}
          </div>
          <div class="card">
            <div class="card-header"><div class="card-title">🏗️ Project Details</div></div>
            ${infoRow('Project Name', data.projectName)} ${infoRow('Project Type', data.projectType)}
            ${infoRow('Proposed Use', data.proposedUse)} ${infoRow('Classification', data.buildingClassification)}
            ${infoRow('Floors', data.numberOfFloors)} ${infoRow('Est. Cost', Utils.formatCurrency(data.estimatedCost))}
            ${infoRow('Description', data.constructionDescription, true)}
          </div>
        </div>

        <!-- Tab: Documents -->
        <div id="tab-docs" class="tab-panel">
          <div id="staff-doc-review"></div>
        </div>

        <!-- Tab: Location -->
        <div id="tab-location" class="tab-panel">
          <div class="card mb-4">
            <div class="card-header"><div class="card-title">📍 Location Details</div>
              ${data.locationValidated ? '<span class="badge badge-success">✓ Verified</span>' : '<span class="badge badge-warning">Pending Verification</span>'}
            </div>
            ${infoRow('Province', data.province)} ${infoRow('Municipality', data.municipality)}
            ${infoRow('Barangay', data.barangay)} ${infoRow('Street', data.street)}
            ${infoRow('Lot No.', data.lotNumber)} ${infoRow('Block No.', data.blockNumber)}
            ${infoRow('Tax Declaration', data.taxDeclaration)}
            <div style="height:3px;background:var(--border);margin:var(--sp-3) 0"></div>
            ${infoRow('Latitude', data.latitude)} ${infoRow('Longitude', data.longitude)}
            ${data.locationFlags?.length ? data.locationFlags.map(f=>`<div class="alert alert-warning mt-2"><div class="alert-icon">⚠️</div><div class="alert-content">${Utils.sanitize(f)}</div></div>`).join('') : ''}
          </div>
          ${data.latitude && data.longitude ? `<div id="review-map" style="height:320px;border-radius:var(--radius-xl);overflow:hidden;border:1px solid var(--border)"></div>` : '<div class="empty-state"><div class="empty-icon">📍</div><div class="empty-title">No location data</div></div>'}
          ${data.latitude && data.longitude && !data.locationValidated ? `
          <div class="flex gap-3 mt-4">
            <button class="btn btn-success" onclick="App.verifyLocation('${appId}')">✓ Verify Location</button>
            <button class="btn btn-warning" onclick="App.flagLocation('${appId}')">⚠️ Flag for Review</button>
          </div>` : ''}
        </div>

        <!-- Tab: History -->
        <div id="tab-history" class="tab-panel">
          <div class="card">
            <div class="card-header"><div class="card-title">📅 Status History</div></div>
            <div id="review-timeline"></div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div>
        <!-- Status Update -->
        <div class="card mb-4">
          <div class="card-header"><div class="card-title">🔄 Update Status</div></div>
          ${nextStatuses.length ? `
          <div class="form-group">
            <label class="form-label">New Status</label>
            <select id="new-status" class="form-control">
              ${nextStatuses.map(s=>`<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Remarks / Notes</label>
            <textarea id="status-remarks" class="form-control" rows="3" placeholder="Add remarks for the applicant…"></textarea>
          </div>
          <button class="btn btn-primary btn-full" onclick="App.updateApplicationStatus('${appId}')">Update Status</button>` :
          `<div class="text-sm text-muted">No further status transitions available.</div>`}
        </div>

        <!-- AI Panel -->
        <div id="ai-panel-container" class="mb-4"></div>

        <!-- Applicant Info Quick View -->
        <div class="card">
          <div class="card-header"><div class="card-title">👤 Applicant</div></div>
          <div class="flex items-center gap-3 mb-3">
            <div class="sidebar-user-avatar">${applicant?.avatar||'?'}</div>
            <div><div class="font-medium">${Utils.sanitize(applicant?.fullName||'Unknown')}</div><div class="text-xs text-muted">${Utils.sanitize(applicant?.email||'')}</div></div>
          </div>
          <div class="text-xs text-muted">${Utils.sanitize(applicant?.phone||'')}</div>
        </div>
      </div>
    </div>`;

    // Deferred renders
    setTimeout(() => {
      Documents.renderStaffDocumentReview(appId, 'staff-doc-review');
      Workflow.renderTimeline(data.history, 'review-timeline');
      AI.renderAIPanel(appId, 'ai-panel-container');
      if (data.latitude && data.longitude) {
        const map2 = MapModule.initMap('review-map', { centerLat: data.latitude, centerLng: data.longitude, zoom: 16 });
        L.marker([data.latitude, data.longitude]).addTo(map2);
      }
    }, 200);
  }

  function switchReviewTab(tabName, el) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#review-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
    el.classList.add('active');
    if (tabName === 'location') setTimeout(() => MapModule.invalidateSize('review-map'), 100);
  }

  function updateApplicationStatus(appId) {
    const newStatus = document.getElementById('new-status')?.value;
    const remarks   = document.getElementById('status-remarks')?.value || '';
    if (!newStatus) return;
    const session = Auth.getSession();
    const result  = Workflow.updateStatus(appId, newStatus, session.userId, remarks);
    if (!result.ok) { Utils.toast(result.error, 'error'); return; }
    Utils.toast(`Status updated to: ${newStatus}`, 'success');
    // Re-render
    navigate('review-' + appId);
  }

  function verifyLocation(appId) {
    DB.update('applications', appId, { locationValidated: true, locationFlags: [] });
    Audit.log(Auth.getSession().userId, 'STATUS_UPDATE', 'Application', appId, 'Location verified on GIS');
    Utils.toast('Location verified successfully', 'success');
    navigate('review-' + appId);
  }

  function flagLocation(appId) {
    const reason = prompt('Enter reason for flagging location:');
    if (!reason) return;
    const app  = DB.findById('applications', appId);
    const flags = [...(app.locationFlags||[]), reason];
    DB.update('applications', appId, { locationFlags: flags, locationValidated: false });
    Audit.log(Auth.getSession().userId, 'STATUS_UPDATE', 'Application', appId, `Location flagged: ${reason}`);
    Utils.toast('Location flagged for review', 'warning');
    navigate('review-' + appId);
  }

  /* ── GIS Map Full View ───────────────────────────────── */
  let gisMap = null;
  function renderGISMap(div, session) {
    const apps = DB.findAll('applications').filter(a => a.latitude && a.longitude);
    div.innerHTML = `
    <div class="page-header flex items-center justify-between">
      <div><h1>GIS Project Location Map</h1><p>Interactive map of all submitted project locations.</p></div>
      <div class="flex gap-2">
        <select id="gis-status-filter" class="form-control" style="width:180px;height:38px" onchange="App.filterGISMap()">
          <option value="">All Statuses</option>
          ${Workflow.STATUSES.map(s=>`<option>${s}</option>`).join('')}
        </select>
        <select id="gis-type-filter" class="form-control" style="width:160px;height:38px" onchange="App.filterGISMap()">
          <option value="">All Types</option>
          ${['Residential','Commercial','Industrial','Institutional','Accessory'].map(t=>`<option>${t}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="map-container" style="height:calc(100vh - 240px)">
      <div id="main-gis-map" style="height:100%"></div>
    </div>
    <div class="mt-4">
      <div class="alert alert-info">
        <div class="alert-icon">ℹ️</div>
        <div class="alert-content">Map boundary shown is a sample reference boundary only — not an official government determination. Satellite and street map data from OpenStreetMap and Esri.</div>
      </div>
    </div>`;
    setTimeout(() => initGISMap(), 100);
  }

  function initGISMap() {
    const map = MapModule.initMap('main-gis-map');
    gisMap    = map;
    const apps = DB.findAll('applications').filter(a => a.latitude && a.longitude);
    MapModule.loadApplicationMarkers('main-gis-map', apps);
    MapModule.addHeatmapStyle('main-gis-map', apps);
  }

  function filterGISMap() {
    const status = document.getElementById('gis-status-filter')?.value || '';
    const type   = document.getElementById('gis-type-filter')?.value || '';
    let apps = DB.findAll('applications').filter(a => a.latitude && a.longitude);
    if (status) apps = apps.filter(a => a.status === status);
    if (type)   apps = apps.filter(a => a.projectType === type);
    MapModule.loadApplicationMarkers('main-gis-map', apps);
  }

  /* ── Admin: Requirements ─────────────────────────────── */
  function renderAdminRequirements(div) {
    const reqs = Admin.getRequirements();
    div.innerHTML = `
    <div class="page-header flex items-center justify-between">
      <div><h1>Document Requirements</h1><p>Configure required documents for building permit applications.</p></div>
      <button class="btn btn-primary btn-sm" onclick="App.showAddReqModal()">+ Add Requirement</button>
    </div>
    <div class="table-container">
      <div class="table-responsive">
      <table class="data-table">
        <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Required?</th><th>File Types</th><th>Max Size</th><th>Actions</th></tr></thead>
        <tbody>
          ${reqs.map(r => `<tr>
            <td><code>${r.code}</code></td>
            <td><div class="font-medium">${Utils.sanitize(r.name)}</div><div class="text-xs text-muted">${Utils.sanitize(r.description||'')}</div></td>
            <td><span class="badge badge-muted">${Utils.sanitize(r.category||'—')}</span></td>
            <td>${r.required ? '<span class="badge badge-danger">Required</span>' : '<span class="badge badge-muted">Optional</span>'}</td>
            <td><span class="text-xs text-muted">${(r.fileTypes||[]).join(', ').toUpperCase()}</span></td>
            <td><span class="text-xs text-muted">${r.maxSizeMB||10} MB</span></td>
            <td><button class="btn btn-danger btn-sm" onclick="if(confirm('Delete this requirement?')){Admin.deleteRequirement('${r.id}');App.navigate('admin-reqs')}">Delete</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
      </div>
    </div>
    <div id="add-req-modal" class="modal-backdrop hidden">
      <div class="modal modal-md">
        <div class="modal-header"><div class="modal-title">Add Requirement</div><div class="modal-close" onclick="document.getElementById('add-req-modal').classList.add('hidden')">×</div></div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Code (short) *</label><input type="text" id="r-code" class="form-control" placeholder="e.g. BRY"></div>
            <div class="form-group"><label class="form-label">Category</label><input type="text" id="r-cat" class="form-control" placeholder="e.g. Clearances"></div>
          </div>
          <div class="form-group"><label class="form-label">Requirement Name *</label><input type="text" id="r-name" class="form-control" placeholder="e.g. Barangay Clearance"></div>
          <div class="form-group"><label class="form-label">Description</label><textarea id="r-desc" class="form-control" rows="2" placeholder="Brief description…"></textarea></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Max File Size (MB)</label><input type="number" id="r-size" class="form-control" value="10" min="1" max="100"></div>
            <div class="form-group"><label class="form-label">Required?</label>
              <select id="r-req" class="form-control"><option value="1">Required</option><option value="0">Optional</option></select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="document.getElementById('add-req-modal').classList.add('hidden')">Cancel</button>
          <button class="btn btn-primary" onclick="App.confirmAddReq()">Add Requirement</button>
        </div>
      </div>
    </div>`;
  }

  function showAddReqModal() { document.getElementById('add-req-modal')?.classList.remove('hidden'); }

  function confirmAddReq() {
    const result = Admin.createRequirement({
      code:        document.getElementById('r-code')?.value,
      name:        document.getElementById('r-name')?.value,
      description: document.getElementById('r-desc')?.value,
      category:    document.getElementById('r-cat')?.value,
      maxSizeMB:   document.getElementById('r-size')?.value,
      required:    document.getElementById('r-req')?.value === '1',
      fileTypes:   ['pdf','jpg','png']
    });
    if (!result.ok) { Utils.toast(result.error, 'error'); return; }
    document.getElementById('add-req-modal')?.classList.add('hidden');
    Utils.toast('Requirement added', 'success');
    navigate('admin-reqs');
  }

  /* ── Admin: Audit Logs ───────────────────────────────── */
  function renderAuditLogsPage(div) {
    div.innerHTML = `
    <div class="page-header"><h1>Audit Logs</h1><p>System activity trail for accountability and traceability.</p></div>
    <div class="table-container">
      <div class="table-toolbar">
        <div class="search-box"><span class="search-icon">🔍</span><input type="text" placeholder="Search logs…" oninput="App.filterAuditLogs(this.value)"></div>
        <button class="btn btn-ghost btn-sm" onclick="Utils.downloadCSV(Audit.getLogs().map(l=>[l.timestamp,l.userName,l.actionLabel,l.entity,l.details]),'audit_logs.csv');Utils.toast('Logs exported','success')">⬇ Export</button>
      </div>
      <div id="audit-logs-container"></div>
    </div>`;
    const logs = Audit.getLogs({ limit: 100 });
    Audit.renderLogsTable(logs, 'audit-logs-container');
  }

  function filterAuditLogs(search) {
    const logs = Audit.getLogs({ search, limit: 100 });
    Audit.renderLogsTable(logs, 'audit-logs-container');
  }

  /* ── Admin Dashboard ─────────────────────────────────── */
  function renderAdminHome(div, session) {
    const stats = Reports.getStats();
    const users = DB.findAll('users');
    div.innerHTML = `
    <div class="page-header"><h1>Administrator Dashboard</h1><p>System overview and management.</p></div>
    <div class="grid grid-4 gap-6 mb-8">
      <div class="stat-card" data-color="blue"><div class="stat-icon stat-icon-blue">📋</div><div class="stat-info"><div class="stat-value">${stats.total}</div><div class="stat-label">Total Applications</div></div></div>
      <div class="stat-card" data-color="green"><div class="stat-icon stat-icon-green">✅</div><div class="stat-info"><div class="stat-value">${stats.approved}</div><div class="stat-label">Approved</div></div></div>
      <div class="stat-card" data-color="purple"><div class="stat-icon stat-icon-purple">👥</div><div class="stat-info"><div class="stat-value">${users.length}</div><div class="stat-label">Total Users</div></div></div>
      <div class="stat-card" data-color="cyan"><div class="stat-icon stat-icon-cyan">📄</div><div class="stat-info"><div class="stat-value">${stats.docs}</div><div class="stat-label">Documents</div></div></div>
    </div>
    <div class="grid grid-2 gap-6">
      <div class="card">
        <div class="card-header"><div class="card-title">Quick Actions</div></div>
        <div class="grid gap-3">
          <button class="btn btn-ghost w-full text-left" onclick="App.navigate('admin-users')">👥 Manage Users</button>
          <button class="btn btn-ghost w-full text-left" onclick="App.navigate('admin-reqs')">📋 Configure Requirements</button>
          <button class="btn btn-ghost w-full text-left" onclick="App.navigate('admin-settings')">⚙️ System Settings</button>
          <button class="btn btn-ghost w-full text-left" onclick="App.navigate('admin-logs')">📜 View Audit Logs</button>
          <button class="btn btn-ghost w-full text-left" onclick="App.navigate('reports')">📊 Reports & Analytics</button>
          <button class="btn btn-ghost w-full text-left" onclick="App.navigate('gis-map')">🗺️ GIS Map</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Recent Activity</div></div>
        <div>
          ${Audit.getLogs({ limit: 5 }).map(l => `
          <div class="flex items-start gap-3 py-2 border-b" style="border-color:var(--border)">
            <div class="text-xs text-muted" style="min-width:100px">${Utils.timeAgo(l.timestamp)}</div>
            <div>
              <div class="text-sm font-medium">${Utils.sanitize(l.actionLabel)}</div>
              <div class="text-xs text-muted">${Utils.sanitize(l.userName)} · ${Utils.sanitize(l.details||'')}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  /* ── Sidebar Toggle ──────────────────────────────────── */
  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    document.getElementById('app-sidebar')?.classList.toggle('collapsed', sidebarCollapsed);
    document.getElementById('main-content')?.classList.toggle('sidebar-collapsed', sidebarCollapsed);
    document.getElementById('app-topbar')?.classList.toggle('sidebar-collapsed', sidebarCollapsed);
  }

  /* ── Page chatbot helpers ────────────────────────────── */
  window.sendPageChatMessage = function() {
    const input = document.getElementById('chatbot-input-page');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    const msgs = document.getElementById('chatbot-messages-page');
    if (msgs) {
      const u = document.createElement('div'); u.className='chat-msg user'; u.textContent=msg; msgs.appendChild(u);
      const typing = document.createElement('div'); typing.className='chat-msg bot'; typing.innerHTML='<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>'; msgs.appendChild(typing);
      msgs.scrollTop = msgs.scrollHeight;
      setTimeout(() => {
        typing.remove();
        const { response, suggestions } = Chatbot.processMessage(msg);
        const b = document.createElement('div'); b.className='chat-msg bot'; b.innerHTML=response.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>'); msgs.appendChild(b);
        msgs.scrollTop = msgs.scrollHeight;
        showPageSuggestions(suggestions);
      }, 800);
    }
  };

  function showPageSuggestions(suggs) {
    const el = document.getElementById('chatbot-suggestions-page');
    if (!el || !suggs?.length) return;
    el.innerHTML = suggs.map(s=>`<button class="suggestion-chip" onclick="document.getElementById('chatbot-input-page').value='${s.replace(/'/g,'')}';sendPageChatMessage()">${Utils.sanitize(s)}</button>`).join('');
  }

  return {
    init, navigate,
    toggleSidebar,
    // Form
    nextStep, prevStep, saveDraft, uploadForReq, submitApp,
    // Staff
    updateApplicationStatus, switchReviewTab, filterQueue,
    verifyLocation, flagLocation,
    // GIS
    filterGISMap,
    // Admin
    showAddReqModal, confirmAddReq, filterAuditLogs
  };
})();

window.App = App;
