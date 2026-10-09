/* ============================================================
   MPDO — Admin Functions Module
   ============================================================ */

const Admin = (() => {

  /* ── User Management ──────────────────────────────────── */
  function getUsers(filters = {}) {
    let users = DB.findAll('users');
    if (filters.role)   users = users.filter(u => u.role === filters.role);
    if (filters.status) users = users.filter(u => u.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      users = users.filter(u =>
        (u.fullName||'').toLowerCase().includes(q) ||
        (u.email||'').toLowerCase().includes(q)
      );
    }
    return users.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async function createUser(data) {
    const { fullName, email, phone, role, designation, password } = data;
    if (!fullName || !email || !role || !password)
      return { ok: false, error: 'Full name, email, role, and password are required.' };
    if (!Utils.validateEmail(email))
      return { ok: false, error: 'Invalid email address.' };
    if (DB.findOne('users','email', email.toLowerCase()))
      return { ok: false, error: 'Email already in use.' };

    const hash     = await Utils.hashPassword(password);
    const initials = fullName.trim().split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const user     = DB.insert('users', {
      id:           Utils.generateId('USR'),
      role, fullName: fullName.trim(),
      email:        email.toLowerCase().trim(),
      phone:        phone||'', address: '',
      passwordHash: hash, status: 'active',
      createdAt:    new Date().toISOString(), lastLogin: null,
      avatar:       initials, designation: designation||''
    });
    Audit.log(Auth.getSession()?.userId||'admin', 'USER_CREATE', 'User', user.id, `Created ${role}: ${fullName}`);
    return { ok: true, user };
  }

  function updateUser(userId, data) {
    const allowed = ['fullName','phone','address','designation','role','status'];
    const changes = {};
    allowed.forEach(k => { if (data[k] !== undefined) changes[k] = data[k]; });
    const updated = DB.update('users', userId, changes);
    Audit.log(Auth.getSession()?.userId||'admin', 'USER_UPDATE', 'User', userId, `Updated user: ${JSON.stringify(changes)}`);
    return { ok: !!updated, user: updated };
  }

  function deactivateUser(userId) {
    const session = Auth.getSession();
    if (session && session.userId === userId)
      return { ok: false, error: 'You cannot deactivate your own account.' };
    DB.update('users', userId, { status: 'inactive' });
    Audit.log(session?.userId||'admin', 'USER_DEACTIVATE', 'User', userId, 'User account deactivated');
    return { ok: true };
  }

  function activateUser(userId) {
    DB.update('users', userId, { status: 'active' });
    Audit.log(Auth.getSession()?.userId||'admin', 'USER_UPDATE', 'User', userId, 'User account activated');
    return { ok: true };
  }

  /* ── Requirement Management ───────────────────────────── */
  function getRequirements() { return DB.findAll('requirements'); }

  function createRequirement(data) {
    const req = DB.insert('requirements', {
      id:          Utils.generateId('REQ'),
      code:        (data.code||'').toUpperCase().trim(),
      name:        data.name,
      description: data.description||'',
      required:    !!data.required,
      fileTypes:   data.fileTypes || ['pdf','jpg','png'],
      maxSizeMB:   parseInt(data.maxSizeMB)||10,
      category:    data.category||'General',
      createdAt:   new Date().toISOString()
    });
    Audit.log(Auth.getSession()?.userId, 'REQ_UPDATE', 'Requirement', req.id, `Requirement created: ${req.name}`);
    return { ok: true, requirement: req };
  }

  function updateRequirement(reqId, data) {
    const updated = DB.update('requirements', reqId, {
      name:        data.name,
      description: data.description,
      required:    !!data.required,
      fileTypes:   data.fileTypes,
      maxSizeMB:   parseInt(data.maxSizeMB)||10,
      category:    data.category
    });
    Audit.log(Auth.getSession()?.userId, 'REQ_UPDATE', 'Requirement', reqId, `Requirement updated: ${data.name}`);
    return { ok: true, requirement: updated };
  }

  function deleteRequirement(reqId) {
    DB.remove('requirements', reqId);
    Audit.log(Auth.getSession()?.userId, 'REQ_UPDATE', 'Requirement', reqId, 'Requirement deleted');
    return { ok: true };
  }

  /* ── System Settings ──────────────────────────────────── */
  function getSettings() { return DB._getObj ? {} : getAllSettings(); }

  function getAllSettings() {
    const keys = [
      'municipalityName','province','region','mapCenterLat','mapCenterLng',
      'mapDefaultZoom','allowedFileTypes','maxFileSizeMB','enableAI',
      'enableChatbot','emailNotifications','officeAddress','officePhone','officeEmail'
    ];
    const settings = {};
    keys.forEach(k => { settings[k] = DB.getSetting(k); });
    return settings;
  }

  function updateSettings(data) {
    Object.entries(data).forEach(([k,v]) => DB.setSetting(k, v));
    Audit.log(Auth.getSession()?.userId, 'SETTINGS_UPDATE', 'Settings', 'global', `Settings updated: ${Object.keys(data).join(', ')}`);
    return { ok: true };
  }

  /* ── Render Pages ─────────────────────────────────────── */
  function renderUserManagement(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const users = getUsers();

    container.innerHTML = `
    <div class="page-header">
      <h1>User Management</h1>
      <p>Manage applicant and staff accounts.</p>
    </div>
    <div class="table-container mb-6">
      <div class="table-toolbar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Search users…" id="user-search" oninput="Admin.filterUsers(this.value,'${containerId}')">
        </div>
        <select class="form-control" style="width:140px;height:38px" id="role-filter" onchange="Admin.filterUsers(document.getElementById('user-search').value,'${containerId}')">
          <option value="">All Roles</option>
          <option value="applicant">Applicants</option>
          <option value="staff">Staff</option>
          <option value="admin">Admins</option>
        </select>
        <div class="flex-1"></div>
        <button class="btn btn-primary btn-sm" onclick="Admin.showCreateUserModal('${containerId}')">+ Add User</button>
      </div>
      <div class="table-responsive">
      <table class="data-table">
        <thead><tr><th>User</th><th>Role</th><th>Email</th><th>Phone</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
        <tbody id="user-table-body">
          ${renderUserRows(users)}
        </tbody>
      </table>
      </div>
    </div>
    ${renderCreateUserModal(containerId)}`;
  }

  function renderUserRows(users) {
    if (!users.length) return `<tr><td colspan="7" class="text-center text-muted py-8">No users found</td></tr>`;
    const ROLE_BADGE = { admin:'badge-danger', staff:'badge-primary', applicant:'badge-muted' };
    return users.map(u => `
    <tr>
      <td>
        <div class="flex items-center gap-3">
          <div class="sidebar-user-avatar" style="width:32px;height:32px;font-size:12px">${u.avatar}</div>
          <div>
            <div class="font-medium">${Utils.sanitize(u.fullName)}</div>
            <div class="text-xs text-muted">${Utils.sanitize(u.designation||'')}</div>
          </div>
        </div>
      </td>
      <td><span class="badge ${ROLE_BADGE[u.role]||'badge-muted'}">${u.role}</span></td>
      <td><span class="text-sm text-secondary">${Utils.sanitize(u.email)}</span></td>
      <td><span class="text-sm text-secondary">${Utils.sanitize(u.phone||'—')}</span></td>
      <td><span class="badge ${u.status==='active'?'badge-success':'badge-danger'}">${u.status}</span></td>
      <td><span class="text-xs text-muted">${u.lastLogin ? Utils.timeAgo(u.lastLogin) : 'Never'}</span></td>
      <td>
        <div class="flex gap-1">
          ${u.status==='active'
            ? `<button class="btn btn-danger btn-sm" onclick="Admin.deactivateUser('${u.id}')">Deactivate</button>`
            : `<button class="btn btn-success btn-sm" onclick="Admin.activateUser('${u.id}')">Activate</button>`}
        </div>
      </td>
    </tr>`).join('');
  }

  function filterUsers(search, containerId) {
    const roleFilter = document.getElementById('role-filter')?.value || '';
    const users = getUsers({ search, role: roleFilter || undefined });
    const tbody = document.getElementById('user-table-body');
    if (tbody) tbody.innerHTML = renderUserRows(users);
  }

  function renderCreateUserModal(containerId) {
    return `
    <div id="create-user-modal" class="modal-backdrop hidden">
      <div class="modal modal-md">
        <div class="modal-header">
          <div class="modal-title">Add New User</div>
          <div class="modal-close" onclick="document.getElementById('create-user-modal').classList.add('hidden')">×</div>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Full Name <span class="required">*</span></label><input type="text" id="nu-name" class="form-control" placeholder="Juan dela Cruz"></div>
            <div class="form-group"><label class="form-label">Email <span class="required">*</span></label><input type="email" id="nu-email" class="form-control" placeholder="juan@mpdo.gov.ph"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Phone</label><input type="text" id="nu-phone" class="form-control" placeholder="09171234567"></div>
            <div class="form-group"><label class="form-label">Role <span class="required">*</span></label>
              <select id="nu-role" class="form-control"><option value="applicant">Applicant</option><option value="staff">Staff</option><option value="admin">Admin</option></select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Designation/Position</label><input type="text" id="nu-designation" class="form-control" placeholder="e.g. Building Inspector"></div>
          <div class="form-group"><label class="form-label">Password <span class="required">*</span></label><input type="password" id="nu-password" class="form-control" placeholder="Minimum 8 characters"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="document.getElementById('create-user-modal').classList.add('hidden')">Cancel</button>
          <button class="btn btn-primary" onclick="Admin.confirmCreateUser('${containerId}')">Create User</button>
        </div>
      </div>
    </div>`;
  }

  function showCreateUserModal() {
    document.getElementById('create-user-modal')?.classList.remove('hidden');
  }

  async function confirmCreateUser(containerId) {
    const result = await createUser({
      fullName:    document.getElementById('nu-name')?.value,
      email:       document.getElementById('nu-email')?.value,
      phone:       document.getElementById('nu-phone')?.value,
      role:        document.getElementById('nu-role')?.value,
      designation: document.getElementById('nu-designation')?.value,
      password:    document.getElementById('nu-password')?.value,
    });
    if (!result.ok) { Utils.toast(result.error, 'error'); return; }
    document.getElementById('create-user-modal')?.classList.add('hidden');
    Utils.toast(`User ${result.user.fullName} created successfully`, 'success');
    renderUserManagement(containerId);
  }

  function renderSettingsPage(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const s = getAllSettings();

    container.innerHTML = `
    <div class="page-header">
      <h1>System Settings</h1>
      <p>Configure system-wide settings for the MPDO building permit system.</p>
    </div>
    <div class="grid grid-2 gap-6">
      <div class="card">
        <div class="card-header"><div class="card-title">🏛️ Office Information</div></div>
        <div class="form-group"><label class="form-label">Municipality Name</label><input type="text" id="s-munname" class="form-control" value="${Utils.sanitize(s.municipalityName||'')}"></div>
        <div class="form-group"><label class="form-label">Province</label><input type="text" id="s-province" class="form-control" value="${Utils.sanitize(s.province||'')}"></div>
        <div class="form-group"><label class="form-label">Office Address</label><input type="text" id="s-address" class="form-control" value="${Utils.sanitize(s.officeAddress||'')}"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Phone</label><input type="text" id="s-phone" class="form-control" value="${Utils.sanitize(s.officePhone||'')}"></div>
          <div class="form-group"><label class="form-label">Email</label><input type="email" id="s-email" class="form-control" value="${Utils.sanitize(s.officeEmail||'')}"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">🗺️ Map Settings</div></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Map Center Latitude</label><input type="number" id="s-lat" class="form-control" step="0.0001" value="${s.mapCenterLat||13.92}"></div>
          <div class="form-group"><label class="form-label">Map Center Longitude</label><input type="number" id="s-lng" class="form-control" step="0.0001" value="${s.mapCenterLng||121.09}"></div>
        </div>
        <div class="form-group"><label class="form-label">Default Zoom Level (1–19)</label><input type="number" id="s-zoom" class="form-control" min="1" max="19" value="${s.mapDefaultZoom||13}"></div>
        <div class="form-group"><label class="form-label">Max File Size (MB)</label><input type="number" id="s-maxfile" class="form-control" min="1" max="100" value="${s.maxFileSizeMB||50}"></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">🤖 AI & Features</div></div>
        <div class="form-group">
          <label class="flex items-center gap-3">
            <input type="checkbox" id="s-ai" ${s.enableAI?'checked':''} style="width:16px;height:16px">
            <span class="form-label" style="margin:0">Enable AI-assisted document analysis</span>
          </label>
        </div>
        <div class="form-group">
          <label class="flex items-center gap-3">
            <input type="checkbox" id="s-chatbot" ${s.enableChatbot?'checked':''} style="width:16px;height:16px">
            <span class="form-label" style="margin:0">Enable MPDO Chatbot</span>
          </label>
        </div>
        <div class="form-group">
          <label class="flex items-center gap-3">
            <input type="checkbox" id="s-email" ${s.emailNotifications?'checked':''} style="width:16px;height:16px">
            <span class="form-label" style="margin:0">Enable Email Notifications</span>
          </label>
        </div>
        <div class="alert alert-ai mt-4">
          <div class="alert-icon">🤖</div>
          <div class="alert-content">AI features are assistive tools only. All AI outputs require authorized personnel review before any official action is taken.</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">📊 System Information</div></div>
        <div class="grid gap-3">
          ${[
            ['Total Applications', DB.findAll('applications').length],
            ['Total Users', DB.findAll('users').length],
            ['Total Documents', DB.findAll('documents').length],
            ['System Version', s.systemVersion||'1.0.0'],
          ].map(([label,val]) => `
            <div class="flex items-center justify-between py-2 border-b" style="border-color:var(--border)">
              <span class="text-sm text-muted">${label}</span>
              <span class="font-semibold">${val}</span>
            </div>`).join('')}
        </div>
        <button class="btn btn-danger btn-sm mt-4 w-full" onclick="Admin.confirmResetData()">⚠️ Reset to Demo Data</button>
      </div>
    </div>
    <div class="mt-6">
      <button class="btn btn-primary btn-lg" onclick="Admin.saveSettings()">💾 Save All Settings</button>
    </div>`;
  }

  function saveSettings() {
    const data = {
      municipalityName:    document.getElementById('s-munname')?.value,
      province:            document.getElementById('s-province')?.value,
      officeAddress:       document.getElementById('s-address')?.value,
      officePhone:         document.getElementById('s-phone')?.value,
      officeEmail:         document.getElementById('s-email')?.value,
      mapCenterLat:        parseFloat(document.getElementById('s-lat')?.value)||13.92,
      mapCenterLng:        parseFloat(document.getElementById('s-lng')?.value)||121.09,
      mapDefaultZoom:      parseInt(document.getElementById('s-zoom')?.value)||13,
      maxFileSizeMB:       parseInt(document.getElementById('s-maxfile')?.value)||50,
      enableAI:            document.getElementById('s-ai')?.checked,
      enableChatbot:       document.getElementById('s-chatbot')?.checked,
      emailNotifications:  document.getElementById('s-email-notif')?.checked,
    };
    updateSettings(data);
    Utils.toast('Settings saved successfully', 'success');
  }

  function confirmResetData() {
    if (confirm('⚠️ This will RESET all data to the original demo dataset. All changes will be lost. Are you sure?')) {
      localStorage.removeItem('mpdo_seeded');
      Object.keys(localStorage).filter(k => k.startsWith('mpdo_')).forEach(k => localStorage.removeItem(k));
      Utils.toast('Data reset. Reloading…', 'info', 1500);
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  return {
    getUsers, createUser, updateUser, deactivateUser, activateUser,
    getRequirements, createRequirement, updateRequirement, deleteRequirement,
    getAllSettings, updateSettings,
    renderUserManagement, filterUsers, showCreateUserModal, confirmCreateUser,
    renderSettingsPage, saveSettings, confirmResetData
  };
})();

window.Admin = Admin;
