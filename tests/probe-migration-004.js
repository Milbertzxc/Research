// tests/probe-migration-004.js — Verify migration 004 and central database workflow tables
const mysql = require('mysql2/promise');

async function main() {
    console.log("Connecting to MySQL mpdo_db...");
    const conn = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'mpdo_db',
        multipleStatements: true
    });

    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '..', 'migrations', '004_central_database_workflow.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Applying migration 004...");
    await conn.query(sql);

    // Record in schema_migrations
    await conn.query("INSERT IGNORE INTO schema_migrations (version, appliedAt) VALUES ('004_central_database_workflow', NOW())");

    console.log("Verifying tables...");
    const [lcs] = await conn.query("SELECT id, applicant, project, status, lat, lng FROM locational_clearances");
    console.log(`✓ locational_clearances: ${lcs.length} records`);
    console.log("  Sample:", lcs[0]);

    const [bps] = await conn.query("SELECT id, applicant, project, status, lcRef FROM building_permits");
    console.log(`✓ building_permits: ${bps.length} records`);
    console.log("  Sample:", bps[0]);

    const [insps] = await conn.query("SELECT id, project, ref, status, inspector FROM inspections");
    console.log(`✓ inspections: ${insps.length} records`);
    console.log("  Sample:", insps[0]);

    const [pays] = await conn.query("SELECT id, `or`, ref, amount FROM payments");
    console.log(`✓ payments: ${pays.length} records`);
    console.log("  Sample:", pays[0]);

    await conn.end();
    console.log("\nALL CENTRAL DATABASE TABLES VERIFIED SUCCESSFULLY!");
}

main().catch(err => {
    console.error("Migration 004 verification failed:", err);
    process.exit(1);
});

