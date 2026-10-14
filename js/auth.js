/* ============================================================
   MPDO — Authentication & Session Management
   ============================================================ */

const Auth = (() => {
  const SESSION_KEY = 'mpdo_session';
  const CSRF_KEY = 'mpdo_csrf';
  const API_BASE = 'http://localhost:3000/api';
  const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours (display only; server is authoritative)

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

  function setSession(user, remember = false, csrfToken = '') {
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
    // Display copy only — authorization is enforced server-side per request.
    if (csrfToken) {
      try {
        sessionStorage.setItem(CSRF_KEY, csrfToken);
        if (remember) localStorage.setItem(CSRF_KEY, csrfToken);
      } catch {}
    }
    return session;
  }

  function getCsrfToken() {
    try {
      return sessionStorage.getItem(CSRF_KEY) || localStorage.getItem(CSRF_KEY) || '';
    } catch { return ''; }
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    try {
      sessionStorage.removeItem(CSRF_KEY);
      localStorage.removeItem(CSRF_KEY);
    } catch {}
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

  /* ── Login (server-verified; no client-side hash comparison) ─── */
  async function login(email, password, remember = false) {
    if (!email || !password) return { ok: false, error: 'Email and password are required.' };
    let res;
    try {
      res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password })
      });
    } catch {
      return { ok: false, error: 'Cannot reach the server. Is it running on port 3000?' };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Login failed.' };

    // Session cookie is httpOnly (set by server); this is a display copy.
    const session = setSession(data.user, remember, data.csrfToken);
    try { await DB.init(); } catch (e) { console.error(e); }
    return { ok: true, session, user: data.user };
  }

  /* ── Register (server creates APPLICANT accounts only) ───────── */
  async function register(data) {
    const { fullName, email, phone, address, password, confirmPassword, applicantType, idType, idNumber, idFile } = data;

    // Validation
    if (!fullName || fullName.trim().length < 3) return { ok: false, error: 'Full name must be at least 3 characters.' };
    if (!Utils.validateEmail(email)) return { ok: false, error: 'Please enter a valid email address.' };
    if (!Utils.validatePhone(phone))  return { ok: false, error: 'Please enter a valid Philippine mobile number (e.g., 09171234567).' };
    if (!address || address.trim().length < 5) return { ok: false, error: 'Please provide a complete address.' };
    if (!password || password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
    if (password !== confirmPassword) return { ok: false, error: 'Passwords do not match.' };

    let res;
    try {
      res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          address: address.trim(),
          applicantType: applicantType || 'Individual',
          idType: idType || 'PhilSys National ID',
          idNumber: idNumber ? idNumber.trim() : '',
          password,
          confirmPassword,
          idFile: idFile || null
        })
      });
    } catch {
      return { ok: false, error: 'Cannot reach the server. Is it running on port 3000?' };
    }
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: out.error || 'Registration failed.' };

    const session = setSession(out.user, false, out.csrfToken);
    try { await DB.init(); } catch (e) { console.error(e); }
    return { ok: true, session, user: out.user };
  }

  /* ── Real-time Email Availability Check ────────────── */
  async function checkEmailAvailable(email) {
    if (!email || !Utils.validateEmail(email)) return { available: false, valid: false };
    try {
      const res = await fetch(`${API_BASE}/auth/check-email?email=${encodeURIComponent(email)}`);
      return await res.json();
    } catch {
      return { available: true };
    }
  }

  /* ── Logout ───────────────────────────────────────── */
  function logout() {
    try {
      fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include', keepalive: true })
        .catch(() => {});
    } catch {}
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

  /* ── Change Password (server-verified; sessions invalidated) ─── */
  async function changePassword(userId, currentPwd, newPwd, confirmPwd) {
    if (newPwd.length < 8) return { ok: false, error: 'New password must be at least 8 characters.' };
    if (newPwd !== confirmPwd) return { ok: false, error: 'New passwords do not match.' };

    let res;
    try {
      res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd, confirmPassword: confirmPwd })
      });
    } catch {
      return { ok: false, error: 'Cannot reach the server.' };
    }
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: out.error || 'Password change failed.' };
    void userId;
    clearSession();
    window.location.href = 'index.html';
    return { ok: true };
  }

  return {
    getSession, setSession, clearSession, getCsrfToken,
    isAuthenticated, hasRole, getCurrentUser,
    requireAuth, requireRole,
    login, register, logout,
    updateProfile, changePassword,
    checkEmailAvailable
  };
})();

window.Auth = Auth;
