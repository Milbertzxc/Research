-- 001_phase2_foundation.sql — Phase 2 auth + integrity foundation (idempotent).
-- Applied by server/db.js migration runner; tracked in schema_migrations.
-- No existing tables are altered destructively. No seed data is deleted.

-- Migration ledger
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    appliedAt DATETIME NOT NULL
);

-- Server-side sessions (opaque token stored as id; cookie holds the id)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(64) PRIMARY KEY,
    userId VARCHAR(100) NOT NULL,
    csrfToken VARCHAR(64) NOT NULL,
    createdAt DATETIME NOT NULL,
    expiresAt DATETIME NOT NULL,
    ip VARCHAR(50),
    INDEX idx_sessions_user (userId),
    INDEX idx_sessions_exp (expiresAt)
);

-- Canonical roles (user.role validated against this list)
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);
INSERT IGNORE INTO roles (id, name, description) VALUES
    ('applicant', 'Applicant', 'Public registrant; owns own projects and applications'),
    ('staff', 'MPDO Personnel', 'Reviews locational clearances and triages applications'),
    ('official', 'Building Official / Permit Officer', 'Decides building permits, assesses fees, issues permits'),
    ('inspector', 'Building Inspector', 'Executes assigned inspections and files reports'),
    ('admin', 'System Administrator', 'Manages users, config, zones, audit, maintenance');

-- Read-performance + FK-support indexes are created by the db.js migration
-- runner (MySQL has no CREATE INDEX IF NOT EXISTS); see ensureIndex() there.
-- Indexed: users(email), applications(applicantId,status),
-- documents(applicationId), statusHistory(applicationId),
-- notifications(userId), auditLogs(userId), remarks(applicationId).
