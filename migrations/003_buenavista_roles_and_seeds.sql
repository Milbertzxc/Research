-- 003_buenavista_roles_and_seeds.sql — Retarget municipality to Buenavista, Agusan del Norte
-- Expand roles, seed accounts, and official barangays with real coordinates

INSERT IGNORE INTO roles (id, name, description) VALUES
    ('zoning_inspector', 'Zoning Inspector', 'Evaluates land-use conformity, site inspections, and zoning reports'),
    ('building_inspector', 'Building Inspector', 'Performs structural, architectural, electrical, plumbing, and mechanical inspections');

-- Seed official portal accounts (password is 'password' for all seed accounts)
INSERT IGNORE INTO users (id, role, fullName, email, phone, address, passwordHash, status, createdAt, lastLogin, avatar, designation, applicantType, idType, idNumber) VALUES
    ('USR-BV-ADMIN', 'admin', 'Ana Admin', 'admin@buenavista.gov.ph', '09171234501', 'Municipal Hall Compound, Buenavista, Agusan del Norte', '$2b$10$GJ82reV70RWl.UUep2rggufUy/dpgPy69hPMDtZvR6tK0QArfV/RO', 'active', NOW(), NOW(), 'AA', 'System Administrator', NULL, NULL, NULL),
    ('USR-BV-MPDO', 'staff', 'Maria Santos', 'mpdo@buenavista.gov.ph', '09171234502', 'MPDO Office, Municipal Hall, Buenavista, Agusan del Norte', '$2b$10$GJ82reV70RWl.UUep2rggufUy/dpgPy69hPMDtZvR6tK0QArfV/RO', 'active', NOW(), NOW(), 'MS', 'Planning & Development Officer', NULL, NULL, NULL),
    ('USR-BV-INSP', 'inspector', 'Pedro Villanueva', 'inspector@buenavista.gov.ph', '09171234503', 'OBO Office, Municipal Hall, Buenavista, Agusan del Norte', '$2b$10$GJ82reV70RWl.UUep2rggufUy/dpgPy69hPMDtZvR6tK0QArfV/RO', 'active', NOW(), NOW(), 'PV', 'Lead Building & Zoning Inspector', NULL, NULL, NULL),
    ('USR-BV-ZONING', 'inspector', 'Zoning Inspector Officer', 'zoning@buenavista.gov.ph', '09171234504', 'MPDO Zoning Division, Buenavista, Agusan del Norte', '$2b$10$GJ82reV70RWl.UUep2rggufUy/dpgPy69hPMDtZvR6tK0QArfV/RO', 'active', NOW(), NOW(), 'ZI', 'Zoning Compliance Officer', NULL, NULL, NULL),
    ('USR-BV-OFFICIAL', 'official', 'Engr. Jose Reyes', 'official@buenavista.gov.ph', '09171234505', 'Office of the Building Official, Buenavista, Agusan del Norte', '$2b$10$GJ82reV70RWl.UUep2rggufUy/dpgPy69hPMDtZvR6tK0QArfV/RO', 'active', NOW(), NOW(), 'JR', 'Municipal Building Official', NULL, NULL, NULL),
    ('USR-BV-APP', 'applicant', 'Juan Dela Cruz', 'applicant@buenavista.gov.ph', '09171234506', 'Poblacion 2, Buenavista, Agusan del Norte', '$2b$10$GJ82reV70RWl.UUep2rggufUy/dpgPy69hPMDtZvR6tK0QArfV/RO', 'active', NOW(), NOW(), 'JD', NULL, 'Individual', 'PhilSys ID', 'PSN-8501-123456');

-- Seed Buenavista, Agusan del Norte Barangays
INSERT IGNORE INTO barangays (id, name, lat, lng) VALUES
    ('BV-BRY-01', 'Poblacion 1', 8.9772, 125.4085),
    ('BV-BRY-02', 'Poblacion 2', 8.9785, 125.4110),
    ('BV-BRY-03', 'Poblacion 3', 8.9750, 125.4060),
    ('BV-BRY-04', 'Poblacion 4', 8.9790, 125.4050),
    ('BV-BRY-05', 'Poblacion 5', 8.9740, 125.4120),
    ('BV-BRY-06', 'Poblacion 6', 8.9810, 125.4090),
    ('BV-BRY-07', 'Poblacion 7', 8.9720, 125.4070),
    ('BV-BRY-08', 'Poblacion 8', 8.9830, 125.4100),
    ('BV-BRY-09', 'Poblacion 9', 8.9700, 125.4050),
    ('BV-BRY-10', 'Poblacion 10', 8.9850, 125.4120),
    ('BV-BRY-11', 'Abilan', 8.9600, 125.3900),
    ('BV-BRY-12', 'Agong-ong', 8.9500, 125.4200),
    ('BV-BRY-13', 'Alubihid', 8.9400, 125.3800),
    ('BV-BRY-14', 'Guinabsan', 8.9300, 125.4100),
    ('BV-BRY-15', 'Macalang', 8.9200, 125.3950),
    ('BV-BRY-16', 'Malapong', 8.9100, 125.4300),
    ('BV-BRY-17', 'Malpoc', 8.9000, 125.3850),
    ('BV-BRY-18', 'Manapa', 8.8900, 125.4150),
    ('BV-BRY-19', 'Matabao', 8.8800, 125.3750),
    ('BV-BRY-20', 'Rizal', 8.8700, 125.4000),
    ('BV-BRY-21', 'Sacol', 8.8600, 125.4250),
    ('BV-BRY-22', 'Sangay', 8.8500, 125.3700),
    ('BV-BRY-23', 'Simbalan', 8.8400, 125.4050),
    ('BV-BRY-24', 'Talo-ao', 8.8300, 125.4350);

-- Update municipal settings to Buenavista, Agusan del Norte
INSERT INTO settings (`key`, value) VALUES
    ('municipalityName', 'Municipality of Buenavista'),
    ('province', 'Agusan del Norte'),
    ('region', 'Caraga (Region XIII)'),
    ('mapCenterLat', '8.9772'),
    ('mapCenterLng', '125.4085'),
    ('mapDefaultZoom', '13'),
    ('officeAddress', 'MPDO Building, Municipal Hall Compound, Buenavista, Agusan del Norte'),
    ('officePhone', '(085) 343-4000'),
    ('officeEmail', 'mpdo@buenavista.gov.ph')
ON DUPLICATE KEY UPDATE value = VALUES(value);

