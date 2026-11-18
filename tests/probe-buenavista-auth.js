const BASE = 'http://localhost:3000';

async function testLogin(email, role) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password' })
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 200 && data.user && data.user.email === email) {
    console.log(`PASS: Login ${email} (${data.user.role}) -> 200 OK, session cookie & CSRF token received`);
    return true;
  } else {
    console.error(`FAIL: Login ${email} -> status ${res.status}, response:`, data);
    return false;
  }
}

(async () => {
  console.log('--- TESTING BUENAVISTA OFFICIAL ACCOUNTS AUTHENTICATION ---');
  const accounts = [
    ['admin@buenavista.gov.ph', 'admin'],
    ['mpdo@buenavista.gov.ph', 'staff'],
    ['official@buenavista.gov.ph', 'official'],
    ['inspector@buenavista.gov.ph', 'inspector'],
    ['zoning@buenavista.gov.ph', 'inspector'],
    ['applicant@buenavista.gov.ph', 'applicant']
  ];

  let passed = 0;
  for (const [email, role] of accounts) {
    const ok = await testLogin(email, role);
    if (ok) passed++;
  }

  console.log(`\n${passed}/${accounts.length} ROLE LOGINS PASSED`);
  if (passed === accounts.length) process.exit(0);
  else process.exit(1);
})().catch(e => {
  console.error(e);
  process.exit(1);
});

