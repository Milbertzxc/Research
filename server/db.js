const mysql = require('mysql2/promise');
const { spawn } = require('child_process');
const fs = require('fs');

// XAMPP MySQL defaults with environment variable overrides
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

const DB_NAME = process.env.DB_NAME || 'mpdo_db';

async function initDb() {
    try {
        console.log("Connecting to MySQL server...");
        
        let initConnection;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                initConnection = await mysql.createConnection(dbConfig);
                break;
            } catch (err) {
                if ((err.code === 'ECONNREFUSED' || err.errno === 2002 || err.errno === -4078) && attempt === 1) {
                    const xamppMysqlPath = 'C:\\xampp\\mysql\\bin\\mysqld.exe';
                    const xamppIniPath = 'C:\\xampp\\mysql\\bin\\my.ini';
                    if (fs.existsSync(xamppMysqlPath)) {
                        console.log("⚠️  MySQL service is not running. Auto-starting XAMPP MySQL server...");
                        const args = fs.existsSync(xamppIniPath) ? [`--defaults-file=${xamppIniPath}`] : [];
                        const mysqlProc = spawn(xamppMysqlPath, args, { detached: true, stdio: 'ignore' });
                        mysqlProc.unref();
                        await new Promise(r => setTimeout(r, 2500));
                        continue;
                    }
                }
                if (attempt === 3) throw err;
                await new Promise(r => setTimeout(r, 1500));
            }
        }

        await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
        await initConnection.end();

        // Now create a pool connected to our specific database
        pool = mysql.createPool({
            ...dbConfig,
            database: DB_NAME
        });

        console.log("Initializing tables...");
        
        // Create Settings table
        await pool.query(`CREATE TABLE IF NOT EXISTS settings (
            \`key\` VARCHAR(255) PRIMARY KEY,
            value TEXT
        )`);

        // Create Users table
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(100) PRIMARY KEY,
            role VARCHAR(50),
            fullName VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            passwordHash VARCHAR(255),
            status VARCHAR(50),
            createdAt DATETIME,
            lastLogin DATETIME,
            avatar VARCHAR(10),
            designation VARCHAR(255),
            applicantType VARCHAR(100),
            idType VARCHAR(100),
            idNumber VARCHAR(100)
        )`);

        // Create Barangays table
        await pool.query(`CREATE TABLE IF NOT EXISTS barangays (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(255),
            lat DOUBLE,
            lng DOUBLE
        )`);

        // Create Requirements table
        await pool.query(`CREATE TABLE IF NOT EXISTS requirements (
            id VARCHAR(50) PRIMARY KEY,
            code VARCHAR(50),
            name VARCHAR(255),
            description TEXT,
            required TINYINT(1),
            fileTypes VARCHAR(255),
            maxSizeMB INT,
            category VARCHAR(100)
        )`);

        // Create Applications table
        await pool.query(`CREATE TABLE IF NOT EXISTS applications (
            id VARCHAR(100) PRIMARY KEY,
            applicationNumber VARCHAR(100),
            applicantId VARCHAR(100),
            status VARCHAR(100),
            createdAt DATETIME,
            submittedAt DATETIME,
            updatedAt DATETIME,
            assignedTo VARCHAR(100),
            priorityScore INT,
            projectName VARCHAR(255),
            projectType VARCHAR(100),
            proposedUse VARCHAR(100),
            buildingClassification VARCHAR(100),
            estimatedCost DOUBLE,
            numberOfFloors INT,
            constructionDescription TEXT,
            province VARCHAR(100),
            municipality VARCHAR(100),
            barangay VARCHAR(100),
            street VARCHAR(255),
            lotNumber VARCHAR(100),
            blockNumber VARCHAR(100),
            taxDeclaration VARCHAR(100),
            latitude DOUBLE,
            longitude DOUBLE,
            locationConfirmed TINYINT(1),
            locationValidated TINYINT(1),
            locationFlags TEXT,
            aiAnalyzed TINYINT(1)
        )`);

        // Create Documents table
        await pool.query(`CREATE TABLE IF NOT EXISTS documents (
            id VARCHAR(100) PRIMARY KEY,
            applicationId VARCHAR(100),
            requirementId VARCHAR(50),
            fileName VARCHAR(255),
            fileType VARCHAR(50),
            fileSize INT,
            uploadedAt DATETIME,
            status VARCHAR(100),
            uploadedBy VARCHAR(100),
            reviewedBy VARCHAR(100),
            reviewedAt DATETIME,
            remarks TEXT
        )`);

        // Create StatusHistory table
        await pool.query(`CREATE TABLE IF NOT EXISTS statusHistory (
            id VARCHAR(100) PRIMARY KEY,
            applicationId VARCHAR(100),
            fromStatus VARCHAR(100),
            toStatus VARCHAR(100),
            userId VARCHAR(100),
            timestamp DATETIME,
            remarks TEXT
        )`);

        // Create AIResults table
        await pool.query(`CREATE TABLE IF NOT EXISTS aiResults (
            id VARCHAR(100) PRIMARY KEY,
            applicationId VARCHAR(100),
            analyzedAt DATETIME,
            completenessScore INT,
            priorityScore INT,
            missingDocs TEXT,
            flags TEXT,
            classifications TEXT,
            priorityReason TEXT,
            inconsistencies TEXT,
            overridden TINYINT(1)
        )`);

        // Create Notifications table
        await pool.query(`CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(100) PRIMARY KEY,
            userId VARCHAR(100),
            applicationId VARCHAR(100),
            type VARCHAR(100),
            title VARCHAR(255),
            message TEXT,
            isRead TINYINT(1),
            createdAt DATETIME
        )`);

        // Create AuditLogs table
        await pool.query(`CREATE TABLE IF NOT EXISTS auditLogs (
            id VARCHAR(100) PRIMARY KEY,
            userId VARCHAR(100),
            action VARCHAR(100),
            entity VARCHAR(100),
            entityId VARCHAR(100),
            details TEXT,
            timestamp DATETIME,
            ip VARCHAR(50)
        )`);

        // Create Remarks table
        await pool.query(`CREATE TABLE IF NOT EXISTS remarks (
            id VARCHAR(100) PRIMARY KEY,
            applicationId VARCHAR(100),
            staffId VARCHAR(100),
            content TEXT,
            type VARCHAR(100),
            createdAt DATETIME
        )`);

        await seedData();
        console.log("Database initialization complete.");

    } catch (err) {
        if (err.code === 'ECONNREFUSED' || err.errno === 2002) {
            console.error("\n=======================================================");
            console.error("  ❌ ERROR: Cannot connect to MySQL server!");
            console.error("=======================================================");
            console.error("  Reason: Target machine actively refused the connection.");
            console.error("  How to fix:");
            console.error("  1. Open XAMPP Control Panel");
            console.error("  2. Click 'Start' next to MySQL");
            console.error("  3. Make sure MySQL port is 3306");
            console.error("=======================================================\n");
        } else {
            console.error("Error initializing MySQL database:", err);
        }
        throw err;
    }
}

async function seedData() {
    const [rows] = await pool.query("SELECT COUNT(*) AS count FROM users");
    if (rows[0].count > 0) {
        console.log("MySQL database already seeded.");
        return;
    }

    console.log("Seeding MySQL database...");
    
    // Settings
    const settings = {
        municipalityName:  'Municipality of San Jose',
        province:          'Batangas',
        region:            'CALABARZON (Region IV-A)',
        mapCenterLat:      13.92,
        mapCenterLng:      121.09,
        mapDefaultZoom:    13,
        allowedFileTypes:  JSON.stringify(['pdf','jpg','jpeg','png','dwg','xlsx','doc','docx']),
        maxFileSizeMB:     50,
        enableAI:          'true',
        enableChatbot:     'true',
        emailNotifications:'false',
        systemVersion:     '1.0.0',
        officeAddress:     'MPDO Building, Municipal Hall Compound, San Jose, Batangas',
        officePhone:       '(043) 000-0000',
        officeEmail:       'mpdo@sanjose.gov.ph',
    };

    for (const [key, value] of Object.entries(settings)) {
        await pool.query(`INSERT INTO settings (\`key\`, value) VALUES (?, ?)`, [key, value.toString()]);
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format for MySQL DATETIME
    const demoHash = 'b6bcde04a9a36a7c4a5c5b8a4f95e9c2e8c8d0f5b1a3e2d1c0f7b4a9e8d5c6b7';

    // Users
    const usersData = [
        ['USR-ADMIN-001', 'admin', 'Maria Santos', 'admin@mpdo.gov.ph', '09171234567', 'Municipal Hall, San Jose, Batangas', demoHash, 'active', now, now, 'MS', 'System Administrator', null, null, null],
        ['USR-STAFF-001', 'staff', 'Juan dela Cruz', 'staff@mpdo.gov.ph', '09181234567', 'MPDO Office, San Jose, Batangas', demoHash, 'active', now, now, 'JC', 'Building Inspector', null, null, null],
        ['USR-STAFF-002', 'staff', 'Ana Reyes', 'ana.reyes@mpdo.gov.ph', '09191234567', 'MPDO Office, San Jose, Batangas', demoHash, 'active', now, null, 'AR', 'Document Processor', null, null, null],
        ['USR-APP-001', 'applicant', 'Pedro Villanueva', 'pedro@example.com', '09201234567', '123 Rizal St., Brgy. San Isidro, San Jose, Batangas', demoHash, 'active', now, now, 'PV', null, 'Individual', 'PhilSys ID', 'PSN-2024-001234'],
        ['USR-APP-002', 'applicant', 'Ligaya Fernandez', 'ligaya@example.com', '09211234567', '45 Mabini Ave., Brgy. Poblacion, San Jose, Batangas', demoHash, 'active', now, now, 'LF', null, 'Corporation', "Driver's License", 'DL-A01-2024-0567']
    ];

    for (const user of usersData) {
        await pool.query(`INSERT INTO users (id, role, fullName, email, phone, address, passwordHash, status, createdAt, lastLogin, avatar, designation, applicantType, idType, idNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, user);
    }

    // Barangays
    const barangays = [
        ['BRY-01','Poblacion',13.92,121.09],['BRY-02','San Isidro',13.94,121.11],
        ['BRY-03','San Jose',13.90,121.08],['BRY-04','San Antonio',13.88,121.10],
        ['BRY-05','San Miguel',13.93,121.13],['BRY-06','San Pedro',13.91,121.06],
        ['BRY-07','Sta. Cruz',13.95,121.12],['BRY-08','Sta. Maria',13.89,121.14],
        ['BRY-09','Sto. Niño',13.96,121.07],['BRY-10','Bagong Nayon',13.87,121.08],
        ['BRY-11','Banaba',13.93,121.15],['BRY-12','Bukal',13.86,121.12],
        ['BRY-13','Dagatan',13.97,121.10],['BRY-14','Labac',13.88,121.06],
        ['BRY-15','Mabato',13.91,121.16],['BRY-16','Malaya',13.94,121.05],
        ['BRY-17','Maligaya',13.86,121.10],['BRY-18','Pinagkawitan',13.98,121.08],
        ['BRY-19','Pinagtuintuinan',13.90,121.17],['BRY-20','Taliba',13.92,121.04],
    ];
    for (const b of barangays) {
        await pool.query(`INSERT INTO barangays (id, name, lat, lng) VALUES (?, ?, ?, ?)`, b);
    }

    // Requirements
    const requirements = [
        ['REQ-01','AF','Accomplished Application Form','Duly accomplished building permit application form',1,'pdf,jpg,png',10,'Forms'],
        ['REQ-02','BPLN','Building Plans','Complete set of building plans (architectural, structural, etc.)',1,'pdf,dwg',50,'Plans'],
        ['REQ-03','TCT','Title/TCT/OCT','Transfer Certificate of Title or Original Certificate of Title',1,'pdf,jpg,png',10,'Land Documents'],
        ['REQ-04','TD','Tax Declaration','Current tax declaration of the property',1,'pdf,jpg,png',10,'Land Documents'],
        ['REQ-05','BRY','Barangay Clearance','Barangay clearance for the proposed construction',1,'pdf,jpg,png',5,'Clearances'],
        ['REQ-06','ZON','Zoning Clearance','Zoning clearance from the MPDO',1,'pdf,jpg,png',5,'Clearances'],
        ['REQ-07','FS','Fire Safety Evaluation Clearance','FSEC from Bureau of Fire Protection',1,'pdf,jpg,png',5,'Clearances'],
        ['REQ-08','PRC','PRC License of Licensed Professional','Valid PRC license of architect/engineer',1,'pdf,jpg,png',5,'Professional'],
        ['REQ-09','SPC','Structural Computation','Signed and sealed structural analysis and design',0,'pdf',20,'Plans'],
        ['REQ-10','PID',"Owner's Valid ID","Valid government-issued ID of the property owner",1,'pdf,jpg,png',5,'Identification'],
        ['REQ-11','LOC','Location/Vicinity Map','Location map showing the site relative to landmarks',1,'pdf,jpg,png',10,'Plans'],
        ['REQ-12','SPEC','Bill of Materials / Specifications','Detailed bill of materials and technical specifications',0,'pdf,xlsx,doc,docx',20,'Plans'],
    ];
    for (const r of requirements) {
        await pool.query(`INSERT INTO requirements (id, code, name, description, \`required\`, fileTypes, maxSizeMB, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, r);
    }

    // Applications
    const applications = [
        ['APP-001','BP-202508-1042','USR-APP-001','Document Review','2025-08-01 08:30:00','2025-08-02 09:15:00','2025-08-05 10:00:00','USR-STAFF-001',78,'Villanueva Residence','Residential','Single Family Dwelling','Group A - Residential',2500000,2,'Two-storey residential house with reinforced concrete framing, concrete hollow blocks, and ceramic tile roofing.','Batangas','San Jose','San Isidro','123 Rizal Street','Lot 14','Block 3','TD-SJ-2024-0145',13.9402,121.1098,1,0,'[]',1],
        ['APP-002','BP-202508-1043','USR-APP-001','Submitted','2025-08-05 14:00:00','2025-08-05 15:30:00','2025-08-05 15:30:00',null,45,'Villanueva Commercial Building','Commercial','Mixed-use (Retail Ground Floor, Offices Above)','Group B - Commercial',8000000,4,'Four-storey commercial building with reinforced concrete structure.','Batangas','San Jose','Poblacion','National Highway','Lot 22','Block 1','TD-SJ-2024-0198',13.9220,121.0900,1,0,'[]',0],
        ['APP-003','BP-202507-1038','USR-APP-002','MPDO Review','2025-07-20 09:00:00','2025-07-21 10:00:00','2025-08-08 14:00:00','USR-STAFF-001',88,'Fernandez Warehouse','Industrial','Storage Warehouse','Group F - Industrial',5500000,1,'Single-storey pre-engineered steel warehouse with concrete perimeter wall.','Batangas','San Jose','Banaba','Industrial Road','Lot 5',null,'TD-SJ-2023-0872',13.9310,121.1490,1,1,'[]',1],
        ['APP-004','BP-202507-1035','USR-APP-002','Approved','2025-07-10 08:00:00','2025-07-11 09:00:00','2025-08-07 16:00:00','USR-STAFF-002',92,'Fernandez Residential Extension','Residential','Addition/Extension','Group A - Residential',850000,1,'One-storey extension to existing residential building.','Batangas','San Jose','Poblacion','45 Mabini Avenue','Lot 8','Block 2','TD-SJ-2022-0344',13.9250,121.0920,1,1,'[]',1],
        ['APP-005','BP-202508-1044','USR-APP-001','Draft','2025-08-12 11:00:00',null,'2025-08-12 11:00:00',null,0,'Villanueva Garage','Accessory','Carport/Garage','Group A - Residential Accessory',250000,1,'Single-storey carport with steel frame and corrugated roofing.','Batangas','San Jose','San Isidro','123 Rizal Street','Lot 14','Block 3','TD-SJ-2024-0145',null,null,0,0,'[]',0],
        ['APP-006','BP-202508-1041','USR-APP-002','Additional Requirements','2025-07-28 10:00:00','2025-07-29 09:00:00','2025-08-09 11:00:00','USR-STAFF-002',55,'Fernandez Bakery','Commercial','Food Establishment','Group B - Commercial',1200000,1,'Single-storey commercial bakery with production area.','Batangas','San Jose','San Miguel','Quezon Street','Lot 11',null,'TD-SJ-2023-0512',13.9300,121.1320,1,0,'["Barangay boundary mismatch detected"]',1],
    ];
    for (const a of applications) {
        await pool.query(`INSERT INTO applications (id, applicationNumber, applicantId, status, createdAt, submittedAt, updatedAt, assignedTo, priorityScore, projectName, projectType, proposedUse, buildingClassification, estimatedCost, numberOfFloors, constructionDescription, province, municipality, barangay, street, lotNumber, blockNumber, taxDeclaration, latitude, longitude, locationConfirmed, locationValidated, locationFlags, aiAnalyzed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, a);
    }

    // Documents
    const documents = [
        ['DOC-001','APP-001','REQ-01','application_form_signed.pdf','pdf',245000,'2025-08-02 09:00:00','Accepted','USR-APP-001','USR-STAFF-001','2025-08-05 10:00:00',''],
        ['DOC-002','APP-001','REQ-02','building_plans_full.pdf','pdf',8500000,'2025-08-02 09:05:00','Under Review','USR-APP-001',null,null,''],
        ['DOC-003','APP-001','REQ-03','TCT_certificate.jpg','jpg',1200000,'2025-08-02 09:10:00','Accepted','USR-APP-001','USR-STAFF-001','2025-08-05 10:05:00',''],
        ['DOC-004','APP-001','REQ-04','tax_declaration_2025.pdf','pdf',320000,'2025-08-02 09:15:00','Accepted','USR-APP-001','USR-STAFF-001','2025-08-05 10:10:00',''],
        ['DOC-005','APP-001','REQ-05','barangay_clearance.pdf','pdf',185000,'2025-08-02 09:20:00','Accepted','USR-APP-001','USR-STAFF-001','2025-08-05 10:15:00',''],
        ['DOC-006','APP-001','REQ-08','PRC_license_architect.jpg','jpg',890000,'2025-08-02 09:25:00','Needs Revision','USR-APP-001','USR-STAFF-001','2025-08-05 10:20:00','License appears to be expired. Please submit a renewed PRC license.'],
        ['DOC-007','APP-001','REQ-10','owners_id.jpg','jpg',650000,'2025-08-02 09:30:00','Accepted','USR-APP-001','USR-STAFF-001','2025-08-05 10:25:00',''],
        ['DOC-008','APP-001','REQ-11','location_map.jpg','jpg',420000,'2025-08-02 09:35:00','Accepted','USR-APP-001','USR-STAFF-001','2025-08-05 10:30:00',''],
        ['DOC-009','APP-003','REQ-01','application_form_warehouse.pdf','pdf',230000,'2025-07-21 10:00:00','Accepted','USR-APP-002','USR-STAFF-001',null,''],
        ['DOC-010','APP-003','REQ-02','warehouse_plans.pdf','pdf',15000000,'2025-07-21 10:05:00','Accepted','USR-APP-002','USR-STAFF-001',null,''],
        ['DOC-011','APP-004','REQ-01','application_form_ext.pdf','pdf',220000,'2025-07-11 09:00:00','Accepted','USR-APP-002','USR-STAFF-002','2025-08-07 14:00:00',''],
        ['DOC-012','APP-006','REQ-06','zoning_clearance_bakery.pdf','pdf',195000,'2025-07-29 09:00:00','Under Review','USR-APP-002',null,null,''],
    ];
    for (const d of documents) {
        await pool.query(`INSERT INTO documents (id, applicationId, requirementId, fileName, fileType, fileSize, uploadedAt, status, uploadedBy, reviewedBy, reviewedAt, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, d);
    }

    // Status History
    const statusHistory = [
        ['SH-001','APP-001',null,'Draft','USR-APP-001','2025-08-01 08:30:00','Application created'],
        ['SH-002','APP-001','Draft','Submitted','USR-APP-001','2025-08-02 09:15:00','Application submitted by applicant'],
        ['SH-003','APP-001','Submitted','Initial Validation','USR-STAFF-001','2025-08-03 08:00:00','Application received for initial review'],
        ['SH-004','APP-001','Initial Validation','Document Review','USR-STAFF-001','2025-08-05 10:00:00','Initial validation passed. Proceeding to document review.'],
        ['SH-005','APP-003',null,'Draft','USR-APP-002','2025-07-20 09:00:00','Application created'],
        ['SH-006','APP-003','Draft','Submitted','USR-APP-002','2025-07-21 10:00:00','Application submitted'],
        ['SH-007','APP-003','Submitted','Initial Validation','USR-STAFF-001','2025-07-22 08:00:00','Under initial review'],
        ['SH-008','APP-003','Initial Validation','Document Review','USR-STAFF-001','2025-07-25 09:00:00','Passed initial validation'],
        ['SH-009','APP-003','Document Review','Location Review','USR-STAFF-001','2025-07-30 10:00:00','Documents verified. Proceeding to location review.'],
        ['SH-010','APP-003','Location Review','MPDO Review','USR-STAFF-001','2025-08-08 14:00:00','Location verified on GIS. Endorsed for MPDO review.'],
        ['SH-011','APP-004',null,'Draft','USR-APP-002','2025-07-10 08:00:00',''],
        ['SH-012','APP-004','Draft','Submitted','USR-APP-002','2025-07-11 09:00:00',''],
        ['SH-013','APP-004','Submitted','Initial Validation','USR-STAFF-002','2025-07-12 08:00:00',''],
        ['SH-014','APP-004','Initial Validation','Document Review','USR-STAFF-002','2025-07-14 10:00:00',''],
        ['SH-015','APP-004','Document Review','Location Review','USR-STAFF-002','2025-07-20 11:00:00',''],
        ['SH-016','APP-004','Location Review','MPDO Review','USR-STAFF-002','2025-07-28 14:00:00',''],
        ['SH-017','APP-004','MPDO Review','For Approval','USR-STAFF-002','2025-08-05 09:00:00','All requirements complete. Endorsed for approval.'],
        ['SH-018','APP-004','For Approval','Approved','USR-ADMIN-001','2025-08-07 16:00:00','Building permit approved. Please proceed to payment and issuance.'],
        ['SH-019','APP-006',null,'Draft','USR-APP-002','2025-07-28 10:00:00',''],
        ['SH-020','APP-006','Draft','Submitted','USR-APP-002','2025-07-29 09:00:00',''],
        ['SH-021','APP-006','Submitted','Initial Validation','USR-STAFF-002','2025-07-30 10:00:00',''],
        ['SH-022','APP-006','Initial Validation','Document Review','USR-STAFF-002','2025-08-02 09:00:00',''],
        ['SH-023','APP-006','Document Review','Additional Requirements','USR-STAFF-002','2025-08-09 11:00:00','Missing: Fire Safety Evaluation Clearance. Location inconsistency detected (barangay mismatch). Please submit corrected documents.'],
    ];
    for (const sh of statusHistory) {
        await pool.query(`INSERT INTO statusHistory (id, applicationId, fromStatus, toStatus, userId, timestamp, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)`, sh);
    }

    // AI Results
    const aiResults = [
        ['AIR-001','APP-001','2025-08-03 08:05:00',72,78,'["REQ-06 - Zoning Clearance","REQ-07 - Fire Safety Evaluation Clearance","REQ-09 - Structural Computation"]','["PRC license (DOC-006) may be expired based on document date","Estimated cost vs. floor area may need verification"]','[{"docId":"DOC-001","detectedType":"Application Form","confidence":97},{"docId":"DOC-002","detectedType":"Architectural/Building Plans","confidence":89},{"docId":"DOC-003","detectedType":"Land Title (TCT)","confidence":94},{"docId":"DOC-006","detectedType":"Professional License","confidence":91}]','High completeness (72%), submitted 11 days ago, currently in Document Review stage.','["PRC license date discrepancy"]',0],
        ['AIR-002','APP-003','2025-07-22 08:10:00',85,88,'["REQ-07 - Fire Safety Evaluation Clearance","REQ-09 - Structural Computation"]','["Industrial building — fire clearance is critical","Verify structural engineer license"]','[{"docId":"DOC-009","detectedType":"Application Form","confidence":98},{"docId":"DOC-010","detectedType":"Architectural/Building Plans","confidence":92}]','High completeness (85%), long pending (24 days), in MPDO Review — high urgency.','[]',0],
        ['AIR-003','APP-006','2025-08-01 09:00:00',38,55,JSON.stringify(['REQ-03 - Title/TCT','REQ-04 - Tax Declaration','REQ-05 - Barangay Clearance','REQ-07 - Fire Safety Evaluation Clearance','REQ-08 - PRC License',"REQ-10 - Owner's Valid ID",'REQ-11 - Location Map']),JSON.stringify(['Barangay in form (San Miguel) does not match pinned map location','Missing critical documents — fire safety required for food establishments','Location coordinates fall outside expected barangay boundary']),JSON.stringify([{docId:'DOC-012',detectedType:'Zoning Clearance',confidence:88}]),'Low completeness (38%), multiple missing documents, location inconsistency detected.',JSON.stringify(['Barangay mismatch: form says San Miguel, coordinates suggest Sto. Niño area']),0],
    ];
    for (const ai of aiResults) {
        await pool.query(`INSERT INTO aiResults (id, applicationId, analyzedAt, completenessScore, priorityScore, missingDocs, flags, classifications, priorityReason, inconsistencies, overridden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ai);
    }

    // Notifications
    const notifications = [
        ['NTF-001','USR-APP-001','APP-001','status_change','Application Received','Your application BP-202508-1042 (Villanueva Residence) has been received and is under initial validation.',1,'2025-08-03 08:00:00'],
        ['NTF-002','USR-APP-001','APP-001','status_change','Now in Document Review','Your application BP-202508-1042 has moved to Document Review stage. Our staff will evaluate your uploaded documents.',1,'2025-08-05 10:00:00'],
        ['NTF-003','USR-APP-001','APP-001','doc_revision','Document Revision Required','Your uploaded PRC license (DOC-006) requires revision. Reason: License appears to be expired. Please upload a renewed copy.',0,'2025-08-05 10:20:00'],
        ['NTF-004','USR-APP-002','APP-004','approved','Building Permit Approved!','Congratulations! Your application BP-202507-1035 (Fernandez Residential Extension) has been approved. Please visit the MPDO office to claim your permit.',0,'2025-08-07 16:00:00'],
        ['NTF-005','USR-APP-002','APP-006','additional_req','Additional Requirements Needed','Your application BP-202508-1041 (Fernandez Bakery) requires additional documents and a location correction. Please check your application for details.',0,'2025-08-09 11:00:00'],
        ['NTF-006','USR-STAFF-001','APP-002','new_app','New Application for Review','Application BP-202508-1043 (Villanueva Commercial Building) has been submitted and is awaiting initial review.',0,'2025-08-05 15:30:00'],
    ];
    for (const n of notifications) {
        await pool.query(`INSERT INTO notifications (id, userId, applicationId, type, title, message, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, n);
    }

    // Audit Logs
    const auditLogs = [
        ['AUD-001','USR-APP-001','LOGIN','User','USR-APP-001','User logged in','2025-08-13 08:00:00','192.168.1.10'],
        ['AUD-002','USR-APP-001','APP_CREATE','Application','APP-001','Application created as Draft','2025-08-01 08:30:00','192.168.1.10'],
        ['AUD-003','USR-APP-001','APP_SUBMIT','Application','APP-001','Application submitted','2025-08-02 09:15:00','192.168.1.10'],
        ['AUD-004','USR-STAFF-001','STATUS_UPDATE','Application','APP-001','Status → Document Review','2025-08-05 10:00:00','192.168.1.25'],
        ['AUD-005','USR-STAFF-001','DOC_REVIEW','Document','DOC-006','Document marked Needs Revision','2025-08-05 10:20:00','192.168.1.25'],
        ['AUD-006','USR-ADMIN-001','STATUS_UPDATE','Application','APP-004','Application Approved','2025-08-07 16:00:00','192.168.1.5'],
        ['AUD-007','USR-APP-002','APP_SUBMIT','Application','APP-003','Application submitted','2025-07-21 10:00:00','192.168.1.18'],
        ['AUD-008','USR-STAFF-002','STATUS_UPDATE','Application','APP-006','Additional Requirements requested','2025-08-09 11:00:00','192.168.1.26'],
    ];
    for (const al of auditLogs) {
        await pool.query(`INSERT INTO auditLogs (id, userId, action, entity, entityId, details, timestamp, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, al);
    }

    // Remarks
    const remarks = [
        ['RMK-001','APP-001','USR-STAFF-001','Please upload a renewed PRC license. The currently submitted license appears to be expired.','revision_request','2025-08-05 10:20:00'],
        ['RMK-002','APP-003','USR-STAFF-001','All documents in order. Location verified on GIS map. Endorsing for MPDO review.','note','2025-08-08 14:00:00'],
        ['RMK-003','APP-006','USR-STAFF-002','Multiple issues found: (1) Missing fire safety clearance — required for food establishment; (2) Location on map does not match indicated barangay. Please correct and resubmit.','additional_requirements','2025-08-09 11:00:00'],
    ];
    for (const r of remarks) {
        await pool.query(`INSERT INTO remarks (id, applicationId, staffId, content, type, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, r);
    }

    console.log("Seeding complete.");
}

// Generic CRUD Operations
async function runQuery(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
}

async function runAction(sql, params = []) {
    const [result] = await pool.query(sql, params);
    return { insertId: result.insertId, affectedRows: result.affectedRows };
}

module.exports = {
    initDb,
    getPool: () => pool,
    runQuery,
    runAction
};
