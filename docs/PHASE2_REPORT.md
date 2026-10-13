# Phase 2 Report — Foundation: auth, sessions, RBAC, migrations
Date: 2026-10-14 | Scope: Master Prompt Phase 2 (security-first subset)

## Implemented
- **Server sessions (bcrypt):** `sessions` table + opaque 256-bit cookie
  (`mpdo_sid`, httpOnly, SameSite=Lax, 8h). Passwords hashed with bcrypt
  (cost 10). Legacy SHA-256 hashes verify as fallback and auto-upgrade to
  bcrypt on next successful login. Seed/demo accounts (orphan hash matching
  no password) reset to bcrypt(`password`), DEMO ONLY — change after setup.
- **Backdoor removed:** universal `password === "password"` bypass deleted
  from `js/auth.js`; server rejects wrong passwords with 401 (probe-verified).
- **Auth endpoints:** `POST /api/auth/register` (applicant role forced),
  `/login` (rate-limited), `/logout`, `GET /api/auth/me`,
  `POST /api/auth/change-password` (invalidates all sessions).
- **RBAC on generic CRUD:** allowlisted tables; `sessions`/`schema_migrations`
  hidden (404); `passwordHash` stripped from every user response; applicants
  see/edit only own rows (draft-only edits, no self role/status/hash change,
  server-forced `applicantId`/`uploadedBy`/`userId` attribution); config tables
  admin-only; deletes restricted (applicant: own drafts; else admin).
- **CSRF:** per-session token required (`X-CSRF-Token`) on all mutating API
  calls except login/register. Frontend stores it in sessionStorage and sends
  it via centralized `DB.apiFetch` with `credentials: include`.
- **Hardening:** helmet headers (CSP documented OFF until P7 — inline
  scripts/CDN would break), 2 MB JSON cap, auth + API rate limiters,
  generic error messages (no schema leaks), server-side auth audit rows.
- **Migrations:** `migrations/001_phase2_foundation.sql` + runner in
  `server/db.js` (ledger `schema_migrations`, transactional, idempotent);
  8 read indexes via `ensureIndex()` (MySQL has no `CREATE INDEX IF NOT EXISTS`).
- **Config:** `.env.example` extended (NODE_ENV, COOKIE_SECURE, CORS_ORIGIN,
  DB_*, MAP_*, SMTP/SMS outbox placeholders). `dotenv` loaded server-side.

## Files created / modified
- Created: `migrations/001_phase2_foundation.sql`, `tests/probe-phase2.js`,
  `docs/PHASE2_REPORT.md`; `.env.example` extended (Phase 1).
- Modified: `server.js` (rewritten: auth + RBAC, fail-fast listen after DB
  ready), `server/db.js` (migrations, bcrypt, sessions), `js/auth.js`
  (server-backed login/register/logout/change-password + CSRF store),
  `js/db.js` (credentialed apiFetch, 401 bounce, CSRF header).
- Deps added: bcryptjs, helmet, express-rate-limit, cookie-parser, dotenv.
- Unmodified: all other `js/*`, `*.html`, `css/*`, `data/*`, seed content.

## Tests executed (all passing, live MySQL via XAMPP)
`node tests/probe-phase2.js` — **12/12 PASS**: unauth GET/POST → 401,
public settings → 200, hidden `sessions` → 404, register → 201 applicant-only
+ csrf + no hash leak, applicant users-list → self only, role escalation →
403, missing CSRF → 403, wrong password → 401, bcrypt login → 200, seed demo
login → 200. `node --check` clean on all touched files. Cleanup script
additionally verified admin login, admin list-all, and 4 admin deletes (200);
probe accounts removed afterward.

## Bug found & fixed during verification
Sessions created but instantly deleted: MySQL runs on local (UTC+8) time while
`expiresAt` was computed from JS UTC, so `expiresAt < NOW()` was true at
insert and the cleanup wiped fresh rows (table observed EMPTY). Fix: MySQL
computes `createdAt`/expiry from its own `NOW()` and evaluates expiry in SQL
(`expiresAt > NOW()`); no JS-side date parsing. Re-verified 200 round-trip.

## Known limitations / next (Phase 3)
- Browser click-through (login page → dashboard render) not executed here —
  API contract matches the updated frontend calls; verify in a browser.
- `change-password` UI wiring: endpoint ready; check a settings/profile caller
  exists (Phase 3 UI pass).
- Workflow transitions still via generic CRUD with draft-only guard;
  dedicated LC/BP state-machine endpoints come in Phase 4/5.
- CSP remains permissive (P7); `npm test` stub still unreplaced (P7 suite).
- Server left RUNNING on :3000 for your use.
