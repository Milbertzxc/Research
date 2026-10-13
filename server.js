require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { rateLimit } = require('express-rate-limit');
const path = require('path');
const db = require('./server/db');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

/* ── Security headers (CSP left permissive — see note) ─────────────── */
// NOTE: contentSecurityPolicy is OFF because the vanilla-JS frontend relies on
// inline <script> blocks and CDN scripts (Leaflet/Chart.js/Lucide). Enabling
// CSP without nonces would break the app. Tightening CSP is tracked for P7.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
// Same-origin SPA + API: reflect no wildcard origin; allow credentialed
// same-origin fetches. Cross-origin deployments must set CORS_ORIGIN.
const corsOrigin = process.env.CORS_ORIGIN || null;
app.use((req, res, next) => {
    if (corsOrigin) {
        res.setHeader('Access-Control-Allow-Origin', corsOrigin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        if (req.method === 'OPTIONS') return res.sendStatus(204);
    }
    next();
});

app.use(express.static(path.join(__dirname)));

/* ── Rate limiting ─────────────────────────────────────────────────── */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 60,
    standardHeaders: 'draft-7', legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please wait and try again.' },
});
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 2000,
    standardHeaders: 'draft-7', legacyHeaders: false,
});
app.use('/api/', apiLimiter);

/* ── Helpers ───────────────────────────────────────────────────────── */
const SID_COOKIE = 'mpdo_sid';

function sanitizeUser(u) {
    if (!u) return null;
    const { passwordHash, ...rest } = u;
    return rest;
}

function publicUser(u) { return sanitizeUser(u); }

async function serverAudit(userId, action, entity, entityId, details, ip) {
    try {
        await db.runAction(
            `INSERT INTO auditLogs (id, userId, action, entity, entityId, details, timestamp, ip)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [`AUD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
             userId, action, entity, entityId, details, ip || null]);
    } catch (e) { console.error('audit write failed:', e.message); }
}

function setSessionCookie(res, sid) {
    res.cookie(SID_COOKIE, sid, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.COOKIE_SECURE === 'true' || isProd,
        maxAge: db.SESSION_TTL_MS,
        path: '/',
    });
}

async function attachSession(req, _res, next) {
    req.session = await db.getSessionById(req.cookies[SID_COOKIE]);
    req.user = null;
    if (req.session) {
        const rows = await db.runQuery('SELECT * FROM users WHERE id = ?', [req.session.userId]);
        if (rows.length > 0 && rows[0].status === 'active') req.user = rows[0];
        else { req.session = null; } // user deleted/deactivated → treat as anonymous
    }
    next();
}
app.use(attachSession);

function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    next();
}

function csrfCheck(req, res, next) {
    const token = req.get('X-CSRF-Token');
    if (!req.session || !token || token !== req.session.csrfToken) {
        return res.status(403).json({ error: 'Invalid or missing CSRF token.' });
    }
    next();
}

function validEmail(e) { return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }
function validPhone(p) { return typeof p === 'string' && /^(09|\+639)\d{9}$/.test(p.replace(/\s/g, '')); }

/* ── Auth endpoints (public: register/login; authenticated: me/logout) ─ */
app.get('/api/settings/all', async (req, res) => {
    try {
        const rows = await db.runQuery(`SELECT * FROM settings`);
        const settingsObj = {};
        rows.forEach(r => settingsObj[r.key] = r.value);
        res.json(settingsObj);
    } catch (err) {
        res.status(500).json({ error: 'Unable to load settings.' });
    }
});

app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const { fullName, email, phone, address, applicantType, password, confirmPassword } = req.body || {};
        if (!fullName || fullName.trim().length < 3)
            return res.status(400).json({ error: 'Full name must be at least 3 characters.' });
        if (!validEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
        if (!validPhone(phone || ''))
            return res.status(400).json({ error: 'Please enter a valid Philippine mobile number (e.g., 09171234567).' });
        if (!address || address.trim().length < 5)
            return res.status(400).json({ error: 'Please provide a complete address.' });
        if (!password || password.length < 8)
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        if (password !== confirmPassword)
            return res.status(400).json({ error: 'Passwords do not match.' });

        const cleanEmail = email.toLowerCase().trim();
        const existing = await db.runQuery('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
        if (existing.length > 0)
            return res.status(409).json({ error: 'An account with this email already exists.' });

        // Public registration creates APPLICANT accounts only — role is forced.
        const id = `USR-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const initials = fullName.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await db.runAction(
            `INSERT INTO users (id, role, fullName, email, phone, address, passwordHash, status,
                                createdAt, lastLogin, avatar, designation, applicantType, idType, idNumber)
             VALUES (?, 'applicant', ?, ?, ?, ?, ?, 'active', ?, NULL, ?, NULL, ?, '', '')`,
            [id, fullName.trim(), cleanEmail, phone.trim(), address.trim(),
             db.hashPassword(password), now, initials, applicantType || 'Individual']);

        const sess = await db.createSession(id, req.ip);
        setSessionCookie(res, sess.id);
        await serverAudit(id, 'REGISTER', 'User', id, 'New applicant registered', req.ip);
        const [rows] = [await db.runQuery('SELECT * FROM users WHERE id = ?', [id])];
        res.status(201).json({ user: publicUser(rows[0]), csrfToken: sess.csrfToken });
    } catch (err) {
        console.error('register:', err.message);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required.' });
        const rows = await db.runQuery('SELECT * FROM users WHERE LOWER(email) = ?', [String(email).toLowerCase().trim()]);
        if (rows.length === 0) return res.status(401).json({ error: 'No account found with that email address.' });
        const user = rows[0];
        if (user.status !== 'active')
            return res.status(403).json({ error: 'This account has been deactivated. Contact the administrator.' });

        // No backdoor: the presented password must verify against the stored
        // hash (bcrypt, or legacy SHA-256 upgraded transparently on success).
        const { ok } = await db.verifyAndMaybeUpgrade(user.id, password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Incorrect password. Please try again.' });

        await db.runAction('UPDATE users SET lastLogin = NOW() WHERE id = ?', [user.id]);
        const sess = await db.createSession(user.id, req.ip);
        setSessionCookie(res, sess.id);
        await serverAudit(user.id, 'LOGIN', 'User', user.id, 'User logged in', req.ip);
        const fresh = await db.runQuery('SELECT * FROM users WHERE id = ?', [user.id]);
        res.json({ user: publicUser(fresh[0]), csrfToken: sess.csrfToken });
    } catch (err) {
        console.error('login:', err.message);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
    try {
        await serverAudit(req.user.id, 'LOGOUT', 'User', req.user.id, 'User logged out', req.ip);
        await db.deleteSession(req.session.id);
        res.clearCookie(SID_COOKIE, { path: '/' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Logout failed.' });
    }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ user: publicUser(req.user), csrfToken: req.session.csrfToken });
});

app.post('/api/auth/change-password', requireAuth, csrfCheck, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body || {};
        if (!newPassword || newPassword.length < 8)
            return res.status(400).json({ error: 'New password must be at least 8 characters.' });
        if (newPassword !== confirmPassword)
            return res.status(400).json({ error: 'New passwords do not match.' });
        const { ok } = await db.verifyAndMaybeUpgrade(req.user.id, currentPassword, req.user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Current password is incorrect.' });
        await db.runAction('UPDATE users SET passwordHash = ? WHERE id = ?',
            [db.hashPassword(newPassword), req.user.id]);
        // Invalidate all sessions (incl. current) — client re-authenticates.
        await db.deleteUserSessions(req.user.id);
        res.clearCookie(SID_COOKIE, { path: '/' });
        await serverAudit(req.user.id, 'PASSWORD_CHANGE', 'User', req.user.id, 'Password changed', req.ip);
        res.json({ success: true, message: 'Password changed. Please log in again.' });
    } catch (err) {
        res.status(500).json({ error: 'Password change failed.' });
    }
});

/* ── Authorized generic CRUD ───────────────────────────────────────── */
// Tables NEVER exposed through the generic API (auth internals).
const HIDDEN_TABLES = new Set(['sessions', 'schema_migrations']);
const ALLOWED_TABLES = new Set(['settings', 'users', 'barangays', 'requirements',
    'applications', 'documents', 'statusHistory', 'aiResults',
    'notifications', 'auditLogs', 'remarks', 'roles']);

function checkTable(req, res, next) {
    const t = req.params.table;
    if (!/^[a-zA-Z0-9_]+$/.test(t) || !ALLOWED_TABLES.has(t) || HIDDEN_TABLES.has(t))
        return res.status(404).json({ error: 'Not found' });
    next();
}

async function ownApplicationIds(userId) {
    const rows = await db.runQuery('SELECT id FROM applications WHERE applicantId = ?', [userId]);
    return new Set(rows.map(r => r.id));
}

// Row-level read filter: returns { rows } or { denied }.
async function filterRows(table, rows, user) {
    if (['admin', 'staff', 'official', 'inspector'].includes(user.role)) {
        if (table === 'notifications' && user.role !== 'admin') {
            // Non-admin staff see only notifications addressed to them.
            return { rows: rows.filter(r => r.userId === user.id) };
        }
        return { rows };
    }
    // Applicant: own records only.
    switch (table) {
        case 'users': return { rows: rows.filter(r => r.id === user.id) };
        case 'applications': return { rows: rows.filter(r => r.applicantId === user.id) };
        case 'barangays': case 'requirements': case 'settings': case 'roles':
            return { rows };
        default: {
            const own = await ownApplicationIds(user.id);
            return { rows: rows.filter(r => r.applicationId && own.has(r.applicationId)) };
        }
    }
}

async function canWrite(table, body, user, existing) {
    const privileged = ['admin', 'staff', 'official', 'inspector'].includes(user.role);
    if (user.role === 'admin') return { ok: true };
    switch (table) {
        case 'roles': case 'settings': case 'requirements': case 'barangays':
            return { ok: false, error: 'Only administrators can modify this data.' };
        case 'users': {
            if (user.role !== 'applicant') return { ok: false, error: 'Only administrators can manage accounts.' };
            if (existing && existing.id !== user.id) return { ok: false, error: 'You can only update your own profile.' };
            for (const f of ['role', 'status', 'passwordHash', 'designation'])
                if (body[f] !== undefined) return { ok: false, error: `Field "${f}" cannot be changed here.` };
            return { ok: true };
        }
        case 'applications': {
            if (privileged) return { ok: true };
            if (existing) {
                if (existing.applicantId !== user.id) return { ok: false, error: 'Not your application.' };
                if (existing.status !== 'Draft')
                    return { ok: false, error: 'Only draft applications can be edited.' };
                if (body.applicantId && body.applicantId !== user.id)
                    return { ok: false, error: 'Cannot transfer ownership.' };
                if (body.status && body.status !== 'Draft')
                    return { ok: false, error: 'Status changes go through the review workflow.' };
                return { ok: true };
            }
            return { ok: true }; // applicantId forced to self below
        }
        case 'documents': {
            if (privileged) return { ok: true };
            const own = await ownApplicationIds(user.id);
            const appId = (existing || body).applicationId;
            if (!appId || !own.has(appId)) return { ok: false, error: 'Not your application.' };
            if (existing && ['status', 'reviewedBy', 'reviewedAt', 'remarks'].some(f => body[f] !== undefined))
                return { ok: false, error: 'Only reviewers can set verification fields.' };
            return { ok: true };
        }
        case 'aiResults':
            return { ok: false, error: 'Only reviewers can record evaluation results.' };
        default: { // statusHistory, notifications, auditLogs, remarks
            if (privileged) return { ok: true };
            const own = await ownApplicationIds(user.id);
            if (table === 'notifications') {
                if (existing && existing.userId !== user.id) return { ok: false, error: 'Not your notification.' };
                if (!existing && body.userId && body.userId !== user.id)
                    return { ok: false, error: 'Cannot create notifications for others.' };
                return { ok: true };
            }
            const appId = (existing || body).applicationId;
            if (!appId || !own.has(appId)) return { ok: false, error: 'Not your application.' };
            return { ok: true };
        }
    }
}

function prepareValue(val) {
    if (val === undefined) return null;
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        return val.slice(0, 19).replace('T', ' ');
    }
    return val;
}

app.get('/api/:table', checkTable, requireAuth, async (req, res) => {
    try {
        const table = req.params.table;
        let rows = await db.runQuery(`SELECT * FROM ${table}`);
        if (table === 'users') rows = rows.map(sanitizeUser);
        const { rows: filtered } = await filterRows(table, rows, req.user);
        res.json(filtered);
    } catch (err) {
        res.status(500).json({ error: 'Unable to load records.' });
    }
});

app.get('/api/:table/:id', checkTable, requireAuth, async (req, res) => {
    try {
        const table = req.params.table;
        let rows = await db.runQuery(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        if (table === 'users') rows = rows.map(sanitizeUser);
        const { rows: filtered } = await filterRows(table, rows, req.user);
        if (filtered.length === 0) return res.status(403).json({ error: 'Access denied.' });
        res.json(filtered[0]);
    } catch (err) {
        res.status(500).json({ error: 'Unable to load record.' });
    }
});

app.post('/api/:table', checkTable, requireAuth, csrfCheck, async (req, res) => {
    try {
        const table = req.params.table;
        if (table === 'roles') return res.status(403).json({ error: 'Roles are system-defined.' });
        const body = { ...(req.body || {}) };

        // Server-forced attribution: clients cannot impersonate others.
        if (table === 'applications' && req.user.role === 'applicant') body.applicantId = req.user.id;
        if (table === 'documents' && req.user.role === 'applicant') body.uploadedBy = req.user.id;
        if ((table === 'statusHistory' || table === 'auditLogs') && req.user.role === 'applicant') body.userId = req.user.id;
        if (table === 'remarks' && req.user.role === 'applicant') body.staffId = req.user.id;
        if (table === 'users') return res.status(403).json({ error: 'Use account registration or an administrator.' });

        const gate = await canWrite(table, body, req.user, null);
        if (!gate.ok) return res.status(403).json({ error: gate.error });

        const keys = Object.keys(body);
        const values = Object.values(body).map(prepareValue);
        if (keys.length === 0) return res.status(400).json({ error: 'Empty body' });
        const placeholders = keys.map(() => '?').join(', ');
        const cols = keys.map(k => `\`${k}\``).join(', ');
        await db.runAction(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`, values);
        res.status(201).json({ success: true, message: 'Record created' });
    } catch (err) {
        console.error(`POST /api/${req.params.table}:`, err.message);
        res.status(500).json({ error: 'Unable to create record.' });
    }
});

app.put('/api/:table/:id', checkTable, requireAuth, csrfCheck, async (req, res) => {
    try {
        const table = req.params.table;
        const data = { ...req.body };
        delete data.id;
        if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Empty body' });

        let idColumn = 'id';
        if (table === 'settings') idColumn = '`key`';
        const existingRows = await db.runQuery(`SELECT * FROM ${table} WHERE ${idColumn} = ?`, [req.params.id]);
        if (existingRows.length === 0) return res.status(404).json({ error: 'Not found' });

        const gate = await canWrite(table, data, req.user,
            table === 'users' ? sanitizeUser(existingRows[0]) : existingRows[0]);
        if (!gate.ok) return res.status(403).json({ error: gate.error });

        const keys = Object.keys(data);
        const values = Object.values(data).map(prepareValue);
        const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
        values.push(req.params.id);
        const result = await db.runAction(`UPDATE ${table} SET ${setClause} WHERE ${idColumn} = ?`, values);
        if (result.affectedRows > 0) res.json({ success: true, message: 'Record updated' });
        else res.status(404).json({ error: 'Not found' });
    } catch (err) {
        console.error(`PUT /api/${req.params.table}/${req.params.id}:`, err.message);
        res.status(500).json({ error: 'Unable to update record.' });
    }
});

app.delete('/api/:table/:id', checkTable, requireAuth, csrfCheck, async (req, res) => {
    try {
        const table = req.params.table;
        let idColumn = 'id';
        if (table === 'settings') idColumn = '`key`';
        const existingRows = await db.runQuery(`SELECT * FROM ${table} WHERE ${idColumn} = ?`, [req.params.id]);
        if (existingRows.length === 0) return res.status(404).json({ error: 'Not found' });
        const existing = existingRows[0];

        if (req.user.role !== 'admin') {
            if (table === 'applications') {
                if (existing.applicantId !== req.user.id || existing.status !== 'Draft')
                    return res.status(403).json({ error: 'Only your draft applications can be deleted.' });
            } else if (table === 'documents') {
                const own = await ownApplicationIds(req.user.id);
                if (!own.has(existing.applicationId))
                    return res.status(403).json({ error: 'Not your document.' });
            } else {
                return res.status(403).json({ error: 'Only administrators can delete records.' });
            }
        }
        const result = await db.runAction(`DELETE FROM ${table} WHERE ${idColumn} = ?`, [req.params.id]);
        if (result.affectedRows > 0) res.json({ success: true, message: 'Record deleted' });
        else res.status(404).json({ error: 'Not found' });
    } catch (err) {
        res.status(500).json({ error: 'Unable to delete record.' });
    }
});

app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(__dirname, 'index.html'));
    }
    next();
});

db.initDb().then(() => {
    console.log("Database connected and ready.");
    app.listen(PORT, () => {
        console.log(`MPDO server running at http://localhost:${PORT}`);
        console.log(`Frontend: http://localhost:${PORT}/index.html`);
        console.log(`API:      http://localhost:${PORT}/api/`);
    });
}).catch(err => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
});
