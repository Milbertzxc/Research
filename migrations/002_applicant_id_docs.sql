-- 002_applicant_id_docs.sql — Add applicant valid ID storage fields to users table (idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS validIdFileName VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS validIdFileType VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS validIdFileSize INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS validIdUploadedAt DATETIME;
