// tests/probe-central-database-sync.js — Tests workflow endpoints and MySQL persistence
const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed, raw: body });
                } catch {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
        req.end();
    });
}

async function main() {
    console.log("Testing Central Database Workflow Endpoints (port 3000)...");

    // 1. GET /api/workflow/state
    console.log("\n1. Testing GET /api/workflow/state...");
    const stateRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/workflow/state',
        method: 'GET'
    });

    if (stateRes.status !== 200 || !stateRes.data) {
        throw new Error(`Failed GET /api/workflow/state: ${stateRes.status} ${stateRes.raw}`);
    }
    console.log(`✓ Workflow state returned:`);
    console.log(`  - LC Applications: ${stateRes.data.lcApplications?.length}`);
    console.log(`  - BP Applications: ${stateRes.data.bpApplications?.length}`);
    console.log(`  - Inspections:     ${stateRes.data.inspections?.length}`);
    console.log(`  - Payments:        ${stateRes.data.payments?.length}`);

    // 2. POST /api/workflow/lc (Locational Clearance)
    console.log("\n2. Testing POST /api/workflow/lc (Creating LC in MySQL)...");
    const testLcId = `LC-TEST-${Date.now().toString(36).toUpperCase()}`;
    const lcRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/workflow/lc',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        id: testLcId,
        applicant: 'Juan Dela Cruz',
        applicantEmail: 'applicant@buenavista.gov.ph',
        project: 'Buenavista Eco-Lodge Project',
        classification: 'Standard Project',
        barangay: 'Poblacion 2',
        landUse: 'Commercial',
        zoneId: 'pob2',
        lat: 8.9785,
        lng: 125.4110,
        zoning: 'Compliant',
        status: 'Submitted',
        progress: 20,
        docs: [{ name: 'Tax Declaration', status: 'Uploaded' }],
        timeline: [{ title: 'Submitted', sub: 'Just now', done: true }],
        payment: { status: 'Pending', or: '', amount: 2372 }
    });

    if (lcRes.status !== 200 || !lcRes.data?.success) {
        throw new Error(`Failed POST /api/workflow/lc: ${lcRes.status} ${lcRes.raw}`);
    }
    console.log(`✓ Locational Clearance saved to MySQL: ${testLcId}`);

    // 3. POST /api/workflow/bp (Building Permit)
    console.log("\n3. Testing POST /api/workflow/bp (Creating BP in MySQL)...");
    const testBpId = `BP-TEST-${Date.now().toString(36).toUpperCase()}`;
    const bpRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/workflow/bp',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        id: testBpId,
        applicant: 'Juan Dela Cruz',
        applicantEmail: 'applicant@buenavista.gov.ph',
        project: 'Eco-Lodge Main Building',
        projectType: 'Commercial',
        barangay: 'Poblacion 2',
        lcRef: testLcId,
        status: 'Submitted',
        scope: 'New Construction',
        progress: 25,
        subforms: { 'Unified Form': { status: 'Completed' } },
        docs: [{ name: 'Building Plans', status: 'Uploaded' }],
        payment: { status: 'Pending', or: '', amount: 2372 }
    });

    if (bpRes.status !== 200 || !bpRes.data?.success) {
        throw new Error(`Failed POST /api/workflow/bp: ${bpRes.status} ${bpRes.raw}`);
    }
    console.log(`✓ Building Permit saved to MySQL: ${testBpId}`);

    // 4. POST /api/workflow/inspection
    console.log("\n4. Testing POST /api/workflow/inspection...");
    const testInspId = `INSP-TEST-${Date.now().toString(36).toUpperCase()}`;
    const inspRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/workflow/inspection',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        id: testInspId,
        project: 'Eco-Lodge Main Building',
        ref: testBpId,
        barangay: 'Poblacion 2',
        zoneId: 'pob2',
        date: '2026-11-15',
        time: '10:00',
        type: 'Building',
        status: 'Completed',
        verdict: 'Passed',
        inspector: 'Pedro Villanueva',
        checklist: { 'Setbacks Verified': true, 'Excavation Depth': true },
        findings: 'All structural specifications verified compliant.'
    });

    if (inspRes.status !== 200 || !inspRes.data?.success) {
        throw new Error(`Failed POST /api/workflow/inspection: ${inspRes.status} ${inspRes.raw}`);
    }
    console.log(`✓ Inspection report saved to MySQL: ${testInspId}`);

    // 5. POST /api/workflow/payment
    console.log("\n5. Testing POST /api/workflow/payment...");
    const payRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/workflow/payment',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        or: 'OR-998877',
        ref: testBpId,
        amount: 2372.00,
        payer: 'Juan Dela Cruz',
        recordedBy: 'Engr. Jose Reyes'
    });

    if (payRes.status !== 200 || !payRes.data?.success) {
        throw new Error(`Failed POST /api/workflow/payment: ${payRes.status} ${payRes.raw}`);
    }
    console.log(`✓ Official payment recorded and linked to ${testBpId}`);

    // 6. Verify persistence by querying state again
    console.log("\n6. Verifying updated records in state...");
    const verifyRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/workflow/state',
        method: 'GET'
    });

    const foundLc = verifyRes.data.lcApplications.find(a => a.id === testLcId);
    const foundBp = verifyRes.data.bpApplications.find(a => a.id === testBpId);
    const foundInsp = verifyRes.data.inspections.find(i => i.id === testInspId);
    const foundPay = verifyRes.data.payments.find(p => p.ref === testBpId);

    if (!foundLc) throw new Error("Saved LC was not found in database state!");
    if (!foundBp) throw new Error("Saved BP was not found in database state!");
    if (!foundInsp) throw new Error("Saved Inspection was not found in database state!");
    if (!foundPay) throw new Error("Saved Payment was not found in database state!");
    if (foundBp.payment.status !== 'Paid') throw new Error("BP payment status was not updated to Paid!");

    console.log("✓ Verified LC in MySQL:", foundLc.id, foundLc.project, foundLc.status);
    console.log("✓ Verified BP in MySQL:", foundBp.id, foundBp.project, foundBp.status, "Payment:", foundBp.payment.status, foundBp.payment.or);
    console.log("✓ Verified Inspection in MySQL:", foundInsp.id, foundInsp.verdict);
    console.log("✓ Verified Payment in MySQL:", foundPay.or, foundPay.amount);

    console.log("\n=======================================================");
    console.log("  🎉 ALL CENTRAL DATABASE INTEGRATION TESTS PASSED!");
    console.log("=======================================================\n");
}

main().catch(err => {
    console.error("Central database test failed:", err);
    process.exit(1);
});

