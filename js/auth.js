/* ============================================================
   MPDO — Authentication & Session Management
   ============================================================ */

const Auth = (() => {
  const SESSION_KEY = 'mpdo_session';
  const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours

  /* ── Session ──────────────────────────────────────── */
  function getSession() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || 'null');
      if (!s) return null;
      if (s.expires && new Date(s.expires) < new Date()) {
        clearSession();
        return null;
      }
      return s;
    } catch { return null; }
  }

  function setSession(user, remember = false) {
    const session = {
      userId:    user.id,
      role:      user.role,
      fullName:  user.fullName,
      email:     user.email,
      avatar:    user.avatar,
      expires:   new Date(Date.now() + SESSION_TTL).toISOString(),
      loginAt:   new Date().toISOString()
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  /* ── Auth Checks ──────────────────────────────────── */
  function isAuthenticated() { return !!getSession(); }

  function hasRole(...roles) {
    const s = getSession();
    return s && roles.includes(s.role);
  }

  function getCurrentUser() {
    const s = getSession();
    if (!s) return null;
    return DB.getUserById(s.userId);
  }

  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  function requireRole(...roles) {
    if (!requireAuth()) return false;
    if (!hasRole(...roles)) {
      Utils.toast('Access denied for your role.', 'error');
      return false;
    }
    return true;
  }

  /* ── Login ────────────────────────────────────────── */
  async function login(email, password, remember = false) {
    if (!email || !password) return { ok: false, error: 'Email and password are required.' };

    // For demo: accept "password" as universal demo password
    const isDemoPassword = password === 'password';
    let hash = null;
    if (!isDemoPassword) {
      hash = await Utils.hashPassword(password);
    }

    const user = DB.findOne('users', 'email', email.toLowerCase().trim());
    if (!user) return { ok: false, error: 'No account found with that email address.' };
    if (user.status !== 'active') return { ok: false, error: 'This account has been deactivated. Contact the administrator.' };

    // Verify password
    const validDemo = isDemoPassword; // all demo accounts accept "password"
    const validHash = hash && user.passwordHash === hash;
    if (!validDemo && !validHash) return { ok: false, error: 'Incorrect password. Please try again.' };

    // Update last login
    DB.update('users', user.id, { lastLogin: new Date().toISOString() });

    // Audit log
    Audit.log(user.id, 'LOGIN', 'User', user.id, 'User logged in successfully');

    const session = setSession(user, remember);
    return { ok: true, session, user };
  }

  /* ── Register ─────────────────────────────────────── */
  async function register(data) {
    const { fullName, email, phone, address, password, confirmPassword, applicantType, idType, idNumber } = data;

    // Validation
    if (!fullName || fullName.trim().length < 3) return { ok: false, error: 'Full name must be at least 3 characters.' };
    if (!Utils.validateEmail(email)) return { ok: false, error: 'Please enter a valid email address.' };
    if (!Utils.validatePhone(phone))  return { ok: false, error: 'Please enter a valid Philippine mobile number (e.g., 09171234567).' };
    if (!address || address.trim().length < 5) return { ok: false, error: 'Please provide a complete address.' };
    if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
    if (password !== confirmPassword) return { ok: false, error: 'Passwords do not match.' };

    // Check existing
    if (DB.findOne('users', 'email', email.toLowerCase().trim())) {
      return { ok: false, error: 'An account with this email already exists.' };
    }

    const passwordHash = await Utils.hashPassword(password);
    const initials = fullName.trim().split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();

    const user = DB.insert('users', {
      id:           Utils.generateId('USR'),
      role:         'applicant',
      fullName:     fullName.trim(),
      email:        email.toLowerCase().trim(),
      phone:        phone.trim(),
      address:      address.trim(),
      passwordHash,
      status:       'active',
      createdAt:    new Date().toISOString(),
      lastLogin:    null,
      avatar:       initials,
      designation:  null,
      applicantType: applicantType || 'Individual',
      idType:       idType || '',
      idNumber:     idNumber || ''
    });

    Audit.log(user.id, 'REGISTER', 'User', user.id, 'New applicant registered');
    const session = setSession(user, false);
    return { ok: true, session, user };
  }

  /* ── Logout ───────────────────────────────────────── */
  function logout() {
    const s = getSession();
    if (s) Audit.log(s.userId, 'LOGOUT', 'User', s.userId, 'User logged out');
    clearSession();
    window.location.href = 'index.html';
  }

  /* ── Update Profile ───────────────────────────────── */
  async function updateProfile(userId, data) {
    const { fullName, phone, address, applicantType, idType, idNumber } = data;
    if (!fullName || fullName.trim().length < 3) return { ok: false, error: 'Full name is too short.' };

    const updated = DB.update('users', userId, {
      fullName: fullName.trim(),
      phone: phone?.trim(),
      address: address?.trim(),
      applicantType, idType, idNumber
    });

    Audit.log(userId, 'PROFILE_UPDATE', 'User', userId, 'Profile updated');
    return { ok: true, user: updated };
  }

  /* ── Change Password ──────────────────────────────── */
  async function changePassword(userId, currentPwd, newPwd, confirmPwd) {
    if (newPwd.length < 8) return { ok: false, error: 'New password must be at least 8 characters.' };
    if (newPwd !== confirmPwd) return { ok: false, error: 'New passwords do not match.' };

    const user    = DB.getUserById(userId);
    const curHash = await Utils.hashPassword(currentPwd);
    const isDemo  = currentPwd === 'password';
    if (!isDemo && user.passwordHash !== curHash) return { ok: false, error: 'Current password is incorrect.' };

    const newHash = await Utils.hashPassword(newPwd);
    DB.update('users', userId, { passwordHash: newHash });
    Audit.log(userId, 'PASSWORD_CHANGE', 'User', userId, 'Password changed');
    return { ok: true };
  }

  return {
    getSession, setSession, clearSession,
    isAuthenticated, hasRole, getCurrentUser,
    requireAuth, requireRole,
    login, register, logout,
    updateProfile, changePassword
  };
})();

window.Auth = Auth;
