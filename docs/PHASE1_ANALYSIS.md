# Phase 1 — Repository & Requirements Analysis
Project: Web-Based Building Permit Processing System with GIS-Based Project Location Mapping
Client: MPDO, Municipality of Buenavista, Agusan del Norte
Date: 2026-10-14 | Analyst: principal-engineer agent | Session dir: CAPSTONE (empty) | Codebase: ../MPDO

## 1. Manuscript status (blocking note)
`final-gamay.docx` was searched for in CAPSTONE, MPDO, Desktop, Documents, and
OneDrive (`*.docx` sweep 2026-10-14). It was NOT found — only an unrelated
`ED TOUR DOCUMENTATION.docx` exists. Nothing below quotes the manuscript; the
Master Prompt (§2–§27) is used as the authority, and every zoning/fee/legal
value is treated as CONFIGURABLE SAMPLE DATA until the manuscript is supplied.
Action for owner: drop `final-gamay.docx` into the MPDO folder and request a
re-trace of ERD figures, form labels, and fee tables.

## 2. Current stack (keep — do NOT rewrite to React)
- Frontend: vanilla JS SPA (13 modules in `js/`), `dashboard.html` shell +
  `index.html` login, Leaflet 1.9.4 + OSM/Esri tiles, Chart.js, Lucide icons.
- Backend: Node.js + Express 5 (`server.js`, 146 lines) + `server/db.js`
  (MySQL pool, auto-create `mpdo_db`, 11 tables, seed data).
- DB: MySQL 8 via XAMPP (`mysql2/promise`); `sqlite3` listed in
  `package.json` but unused. Browser copy in `js/db.js` is a read cache only.
- Launch: `serve.ps1` → `node server.js` (:3000). Git repo present, branch
  `main`, 2 commits, 1 modified file (`css/components.css`).
- Locale currently seeded: **San Jose, Batangas (13.92, 121.09)** — must be
  retargeted to **Buenavista, Agusan del Norte (~9.7740, 125.5764)**.

## 3. Requirements traceability matrix (extract → status)
| # | Requirement (Master Prompt) | Current state | Gap → Phase |
|---|-----------------------------|---------------|-------------|
| R1 | 5 roles, own dashboards (§5) | 3 roles: applicant/staff/admin; 16 views real | Add Building Official, Inspector roles + queues → P4/P5 |
| R2 | Server auth: Argon2id/bcrypt, HTTP-only session, CSRF, rate-limit (§5) | SHA-256 single-round, global salt (`js/utils.js:102`); session = forgeable browser JSON (`js/auth.js`); demo backdoor `password==="password"`; API has ZERO auth (`server.js:34–119`) | Security hardening → P2 (highest risk) |
| R3 | LC multi-step wizard, 3 classifications, conditional docs (§7) | Single 4-step building-permit wizard; no LC entity; `projectType` ≠ classification | New `locationalClearances` flow + gate → P3 |
| R4 | GIS pin/drag/manual coords, popups, layers, legend (§9) | Real Leaflet map; drag+search+popups+layers+legend work; bbox check only, no point-in-polygon; manual fields readonly | Retarget center, zoning table, PIP check, manual entry → P3 |
| R5 | BP only after approved LC (§10) | NO gate exists (verified) | Backend+frontend enforcement → P5 |
| R6 | MPDO review queue + decision audit (§8) | Real queue/review/timeline/remarks; history logged | Split LC vs BP queues, require reject remarks → P4 |
| R7 | Official / Inspector portals (§12–13) | Missing: no assignment, scheduling, checklist, fee, issuance | New modules → P5 |
| R8 | Fees assessed + manual payment recording, no gateway (§15) | Missing (only `estimatedCost` display) | `feeAssessments`+`payments` tables → P6 |
| R9 | In-app + email/SMS notifications, dev outbox (§16) | In-app real; email/SMS absent | Outbox + provider hooks → P6 |
| R10 | Printable PDFs w/ SAMPLE watermark (§17) | Missing (CSV export only) | Server PDF endpoints → P6 |
| R11 | Admin: users, zones, reqs config, settings, logs, backup (§18) | Users/reqs/settings/logs real; zones + backup missing | `gisZones` admin + backup docs → P6 |
| R12 | Normalized MySQL, migrations, seeds (§19) | 11 tables working, no migration runner, no FKs | Migration scripts + FKs + new tables → P2 |
| R13 | OWASP controls, audit, Data Privacy Act notes (§20) | Audit log real but client-forgeable; no helmet/CSRF/limits | Hardening pass + docs → P2/P7 |
| R14 | Unit/integration/e2e/security/GIS tests (§22) | `npm test` = stub (`echo error && exit 1`) | Test harness + suites → P7 |

## 4. Role–permission matrix (target; * = to build)
| Capability | Applicant | MPDO Personnel | Building Official* | Inspector* | Admin |
|---|---|---|---|---|---|
| Register/login, own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/edit own LC + BP drafts | LC✅*/BP✅ | — | — | — | view |
| Upload/replace own documents | ✅ | verify | verify | view assigned | view |
| Submit (LC; BP gated on LC-approved) | partial* | — | — | — | — |
| LC review: zone check, correct/approve | — | ✅* | — | — | ✅ |
| BP review, assign inspector, schedule | — | triage* | ✅* | — | ✅ |
| Submit inspection report (assigned only) | — | — | view | ✅* | view |
| BP approve/deny, assess fees, issue permit | — | — | ✅* | — | ✅ |
| Record manual payment | — | — | cashier* | — | ✅ |
| Manage users/roles/zones/reqs/settings | — | reqs view | — | — | ✅ |
| Read audit logs | own | ✅ | ✅ | own | ✅ |

## 5. Workflow (target state machines; current = single 11-status chain)
Locational Clearance: Draft → Submitted → Under Review → {For Correction →
Resubmitted → Under Review} → {Approved | Rejected} → Issued (clearance).
Building Permit (per project, requires LC=Approved): Draft → Submitted →
Under Review → {For Correction → Resubmitted} → Inspection Scheduled →
Under Inspection → {Approved → Issued | Rejected}. Every transition records
actor/timestamp/remarks/prev/new in `statusHistory`; invalid transitions
rejected server-side; critical changes in DB transactions.

## 6. Database proposal (current 11 → target 19 tables)
Keep: users, barangays, requirements, applications, documents, statusHistory,
aiResults, notifications, auditLogs, remarks, settings. Add: `roles` (seed 5),
`projects` (applicant-owned parent of LC+BP), `locationalClearances` (+LC docs
via `documents.applicationKind`), `buildingPermits` + `permitTypes` (10: main +
9 ancillary) + `buildingPermitTypes` (join), `gisZones` (GeoJSON polygons,
admin-managed), `inspections` (assignment, checklist JSON, photos, findings),
`feeAssessments` + `payments` (manual recording only), `issuedPermits`
(one-per-approval, unique key blocks duplicates), `notificationOutbox`
(provider receipts). Add FKs + indexes + a `migrations/` SQL runner; Buenavista
barangays + center (9.7740, 125.5764) replace San Jose seed behind a
`SEED_LOCALE=buenavista` flag. No destructive migration without owner approval.

## 7. Folder structure (target, additive to current layout)
`server/` (routes/, middleware/auth.js, validators/, pdf/, notify/) |
`migrations/` (numbered .sql) | `storage/uploads/` (private, gitignored) |
`docs/` (this file, matrix, setup, demo script) | `tests/` (unit/integration/e2e)
| keep `js/`, `css/`, `*.html`, `data/` (add `buenavista-boundary.geojson`
SAMPLE-marked). No framework swap; no file moved without approval.

## 8. Phased plan with entry/exit criteria
- P2 Foundation: migration runner + FKs + `.env` config; server sessions
  (bcrypt/Argon2, HTTP-only cookie, CSRF, rate-limit); lock `/api/*` by role.
  Exit: unauthenticated CRUD returns 401 (tested).
- P3 Applicant+LC+GIS: projects table, LC wizard (3 classifications,
  conditional docs), Buenavista retarget, zones table + PIP informational
  check, manual coordinate entry. Exit: draft→submit→resubmit e2e passes.
- P4 MPDO review: LC queue, zone verification panel, correction/approve with
  mandatory remarks, issuance. Exit: full LC lifecycle test passes.
- P5 BP+Official+Inspector: BP gated on LC-approved, 10 permit types,
  assignment/scheduling/checklist/reports, decisions + fee assessment +
  issuance (no duplicates). Exit: LC→BP→inspect→issue e2e passes.
- P6 Support: outbox+SMTP/SMS hooks, manual payments, PDFs (SAMPLE
  watermark), zone admin, backup procedure, reports on real data.
- P7 QA: suites (§22), OWASP pass, responsive check, README/setup/demo docs.

## 9. Ambiguities needing the manuscript (configurable until confirmed)
A1 ERD cardinalities + official table/field names. A2 Exact LC form sections,
declaration texts, notarization fields. A3 Conditional doc matrix per
classification/permit type. A4 Zoning polygons + classifications (none
fabricated; manual-review fallback meanwhile). A5 Official fee schedule
(none invented; admin-maintained table). A6 Certificate/permit layouts, seals,
signatories (SAMPLE watermark meanwhile). A7 Data-retention periods for the
Data Privacy Act (RA 10173) notice.

## 10. Phase 1 report
Implemented: repo/stack/locale/manuscript-gap analysis; traceability matrix
(R1–R14); role matrix; workflow + DB proposal; plan P2–P7. Files created:
`.env.example` (config template, no secrets), `docs/PHASE1_ANALYSIS.md` (this
file). Files modified: none. Migrations: none. Tests: verification commands in
§11 (server syntax check + endpoint-auth probe). Known limitations: manuscript
absent (all legal values provisional); API still open (P2 fixes); locale still
San Jose seed (P3 retargets); no new tests yet (P7). Next: P2 auth + migrations
after owner confirms build location (MPDO vs CAPSTONE) and supplies manuscript.
