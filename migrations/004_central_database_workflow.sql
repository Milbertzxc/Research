-- 004_central_database_workflow.sql — Central Database for Locational Clearance, Building Permits, Inspections & Payments
-- Connects the complete workflow to MySQL

CREATE TABLE IF NOT EXISTS locational_clearances (
    id VARCHAR(100) PRIMARY KEY,
    applicant VARCHAR(255) NOT NULL,
    applicantEmail VARCHAR(255),
    project VARCHAR(255) NOT NULL,
    classification VARCHAR(100) DEFAULT 'Standard Project',
    barangay VARCHAR(100),
    landUse VARCHAR(100),
    zoneId VARCHAR(50),
    lat DOUBLE,
    lng DOUBLE,
    zoning VARCHAR(50) DEFAULT 'Pending',
    status VARCHAR(50) DEFAULT 'Submitted',
    updated VARCHAR(100),
    progress INT DEFAULT 20,
    docs LONGTEXT,
    timeline LONGTEXT,
    remarks TEXT,
    paymentStatus VARCHAR(50) DEFAULT 'Pending',
    orNumber VARCHAR(100),
    paymentAmount DOUBLE DEFAULT 0,
    meta LONGTEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS building_permits (
    id VARCHAR(100) PRIMARY KEY,
    applicant VARCHAR(255) NOT NULL,
    applicantEmail VARCHAR(255),
    project VARCHAR(255) NOT NULL,
    projectType VARCHAR(100),
    barangay VARCHAR(100),
    lcRef VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Submitted',
    scope VARCHAR(150),
    updated VARCHAR(100),
    progress INT DEFAULT 20,
    subforms LONGTEXT,
    docs LONGTEXT,
    divisions LONGTEXT,
    timeline LONGTEXT,
    paymentStatus VARCHAR(50) DEFAULT 'Pending',
    orNumber VARCHAR(100),
    paymentAmount DOUBLE DEFAULT 0,
    issued TINYINT(1) DEFAULT 0,
    permitNo VARCHAR(100),
    remarks TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspections (
    id VARCHAR(100) PRIMARY KEY,
    project VARCHAR(255) NOT NULL,
    ref VARCHAR(100),
    barangay VARCHAR(100),
    zoneId VARCHAR(50),
    date VARCHAR(50),
    time VARCHAR(50),
    type VARCHAR(50) DEFAULT 'Zoning',
    status VARCHAR(50) DEFAULT 'Scheduled',
    verdict VARCHAR(50),
    inspector VARCHAR(255),
    checklist LONGTEXT,
    findings TEXT,
    recommendations TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(100) PRIMARY KEY,
    `or` VARCHAR(100) NOT NULL,
    ref VARCHAR(100) NOT NULL,
    amount DOUBLE NOT NULL,
    at VARCHAR(100),
    payer VARCHAR(255),
    recordedBy VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial Locational Clearance records if empty
INSERT IGNORE INTO locational_clearances (id, applicant, applicantEmail, project, classification, barangay, landUse, zoneId, lat, lng, zoning, status, updated, progress, docs, timeline, remarks, paymentStatus, orNumber, paymentAmount) VALUES
('LC-2026-0101', 'Juan Dela Cruz', 'applicant@buenavista.gov.ph', 'Dela Cruz Residence', 'Standard Project', 'Poblacion 2', 'Residential', 'pob2', 8.9785, 125.4110, 'Compliant', 'Under Review', 'Oct 12, 2026', 60,
 '[{"name":"Tax Declaration","status":"Uploaded"},{"name":"Barangay Certificate","status":"Uploaded"},{"name":"Proof of Ownership","status":"Uploaded"},{"name":"Geotagged Photos","status":"Uploaded"}]',
 '[{"title":"Submitted","sub":"Oct 01, 2026 · received","done":true},{"title":"Document Review","sub":"Oct 05, 2026","done":true},{"title":"GIS/Zoning Verification","sub":"In progress","current":true},{"title":"Approved","sub":"Pending"}]',
 '', 'Pending', '', 2372.00),
('LC-2026-0098', 'Juan Dela Cruz', 'applicant@buenavista.gov.ph', 'Coastal Fish Port Shed', 'Special Project', 'Brgy. Matabao (Coastal)', 'Fisheries / Tourism', 'coastal', 8.8800, 125.3750, 'Compliant', 'Approved', 'Oct 08, 2026', 100,
 '[{"name":"Tax Declaration","status":"Uploaded"},{"name":"Barangay Certificate","status":"Uploaded"},{"name":"Fire Safety Certificate","status":"Uploaded"},{"name":"ANECO Clearance","status":"Uploaded"},{"name":"Proof of Ownership","status":"Uploaded"},{"name":"Geotagged Photos","status":"Uploaded"},{"name":"Building Plans","status":"Uploaded"},{"name":"Sketch / Vicinity Map","status":"Uploaded"}]',
 '[{"title":"Submitted","sub":"Sep 20, 2026","done":true},{"title":"Document Review","sub":"Sep 25, 2026","done":true},{"title":"GIS/Zoning Verification","sub":"Oct 02, 2026","done":true},{"title":"Approved","sub":"Oct 08, 2026 · clearance issued","done":true}]',
 'All requirements satisfied.', 'Paid', 'OR-04190', 2372.00),
('LC-2026-0104', 'Ligaya Fernandez', 'ligaya@example.com', 'Bakery & Store', 'Standard Project', 'Poblacion 1', 'Commercial', 'pob1', 8.9772, 125.4085, 'Non-Compliant', 'Pending', 'Oct 11, 2026', 30,
 '[{"name":"Tax Declaration","status":"Uploaded"}]',
 '[{"title":"Submitted","sub":"Oct 11, 2026","done":true},{"title":"Document Review","sub":"Pending","current":true}]',
 '', 'Pending', '', 2372.00),
('LC-2026-0109', 'Coastal Coop', 'coop@example.com', 'Cold Storage', 'Special Project', 'Bay Area', 'Industrial', 'bay', 8.9900, 125.4000, 'Non-Compliant', 'Revision Required', 'Oct 09, 2026', 45,
 '[{"name":"Tax Declaration","status":"Uploaded"},{"name":"Barangay Certificate","status":"Uploaded"},{"name":"Proof of Ownership","status":"Uploaded"}]',
 '[{"title":"Submitted","sub":"Oct 01, 2026","done":true},{"title":"Document Review","sub":"Returned for revision","current":true}]',
 'Zoning conflict with Bay Area easement overlay.', 'Pending', '', 2372.00);

-- Seed initial Building Permit records if empty
INSERT IGNORE INTO building_permits (id, applicant, applicantEmail, project, projectType, barangay, lcRef, status, scope, updated, progress, subforms, docs, divisions, timeline, paymentStatus, orNumber, paymentAmount, issued, permitNo, remarks) VALUES
('BP-2026-0455', 'Juan Dela Cruz', 'applicant@buenavista.gov.ph', 'Dela Cruz Sari-Sari Store', '2-storey residential/commercial', 'Poblacion 1', 'LC-2026-0098', 'Revision Required', 'New Construction — Commercial', 'Oct 10, 2026', 40,
 '{"Unified Form":{"status":"Completed"},"Electrical":{"status":"Returned","note":"Load computation mismatch"},"Architectural":{"status":"Completed"},"Plumbing":{"status":"Pending"}}',
 '[{"name":"Tax Declaration","status":"Uploaded"},{"name":"Barangay Certificate","status":"Uploaded"},{"name":"Fire Safety Certificate","status":"Uploaded"}]',
 '{"Line and Grade":{"status":"Completed","at":"Oct 10, 2026 09:15"},"Architectural":{"status":"Completed","at":"Oct 10, 2026 11:40"},"Structural":{"status":"In Progress","at":"Oct 11, 2026 08:30"},"Electrical":{"status":"Queued"},"Plumbing":{"status":"Queued"}}',
 '[{"title":"Submitted","sub":"Oct 01, 2026","done":true},{"title":"Document Review","sub":"Oct 05, 2026","done":true},{"title":"Building Official Review","sub":"Oct 10, 2026","done":true},{"title":"Revision Required","sub":"Electrical sub-form returned","current":true},{"title":"Inspection","sub":"Pending"},{"title":"Final Approval / Issuance","sub":"Pending"}]',
 'Pending', '', 2372.00, 0, NULL, 'Correct Electrical load computation and resubmit.'),
('BP-2026-0448', 'Ramon Aquino', 'ramon@example.com', 'Aquino Storage', 'Standard', 'Brgy. Coastal', 'LC-2026-0098', 'Approved', 'Addition — Storage', 'Oct 11, 2026', 90,
 '{"Unified Form":{"status":"Completed"},"Electrical":{"status":"Completed"},"Plumbing":{"status":"Completed"}}',
 '[{"name":"Tax Declaration","status":"Uploaded"},{"name":"Barangay Certificate","status":"Uploaded"},{"name":"Fire Safety Certificate","status":"Uploaded"}]',
 '{"Line and Grade":{"status":"Completed","at":"Oct 11, 2026 10:00"},"Architectural":{"status":"Completed"},"Structural":{"status":"Completed"},"Electrical":{"status":"Completed"},"Plumbing":{"status":"Completed"}}',
 '[{"title":"Submitted","sub":"Sep 28, 2026","done":true},{"title":"Document Review","sub":"Oct 02, 2026","done":true},{"title":"Inspection","sub":"Oct 11, 2026 · Passed","done":true},{"title":"Final Approval","sub":"Ready for issuance","current":true}]',
 'Paid', 'OR-04217', 2372.00, 0, NULL, ''),
('BP-2026-0451', 'Ligaya Fernandez', 'ligaya@example.com', 'Fernandez Bakery', '2-storey commercial', 'Poblacion 1', 'LC-2026-0098', 'Under Review', 'Renovation — Food Establishment', 'Oct 12, 2026', 55,
 '{"Unified Form":{"status":"Completed"},"Plumbing":{"status":"Completed"},"Architectural":{"status":"Completed"}}',
 '[{"name":"Tax Declaration","status":"Uploaded"},{"name":"Barangay Certificate","status":"Uploaded"},{"name":"Fire Safety Certificate","status":"Uploaded"},{"name":"Proof of Ownership","status":"Uploaded"}]',
 '{"Line and Grade":{"status":"Completed","at":"Oct 12, 2026 09:00"},"Architectural":{"status":"In Progress"},"Structural":{"status":"Queued"},"Electrical":{"status":"Queued"},"Plumbing":{"status":"Queued"}}',
 '[{"title":"Submitted","sub":"Oct 08, 2026","done":true},{"title":"Document Review","sub":"In progress","current":true}]',
 'Pending', '', 2372.00, 0, NULL, '');

-- Seed initial Inspections records if empty
INSERT IGNORE INTO inspections (id, project, ref, barangay, zoneId, date, time, type, status, verdict, inspector, checklist, findings) VALUES
('INSP-301', 'Dela Cruz Residence', 'LC-2026-0101', 'Poblacion 2', 'pob2', '2026-10-14', '09:00', 'Zoning', 'Scheduled', '', 'Pedro Villanueva', '{}', ''),
('INSP-302', 'Fernandez Bakery', 'BP-2026-0451', 'Poblacion 1', 'pob1', '2026-10-14', '13:30', 'Building', 'Pending', '', 'Pedro Villanueva', '{}', ''),
('INSP-299', 'Aquino Storage', 'BP-2026-0448', 'Brgy. Coastal', 'coastal', '2026-10-11', '10:00', 'Building', 'Completed', 'Passed', 'Pedro Villanueva', '{"Site Location Verified":true,"Land Use Conformity":true,"Building Plans Available":true}', 'All items conform to approved plans.'),
('INSP-297', 'Bay Cold Storage', 'LC-2026-0109', 'Bay Area', 'bay', '2026-10-09', '14:00', 'Zoning', 'Completed', 'Failed', 'Pedro Villanueva', '{"Site Location Verified":true,"Land Use Conformity":false,"Building Plans Available":true}', 'Encroachment on easement observed.');

-- Seed initial Payments records if empty
INSERT IGNORE INTO payments (id, `or`, ref, amount, at, payer, recordedBy) VALUES
('PAY-BV-001', 'OR-04217', 'BP-2026-0448', 2372.00, 'Oct 11, 2026', 'Ramon Aquino', 'Engr. Jose Reyes');

