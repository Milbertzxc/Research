// Phase 2 verification probe — run: node tests/probe-phase2.js
// Exits non-zero on first FAILED expectation so results are unambiguous.
const BASE = 'http://localhost:3000';
let jar = '';

async function req(method, url, body, csrf) {
  const headers = { 'Content-Type': 'application/json' };
  if (csrf) headers['X-CSRF-Token'] = csrf;
  if (jar) headers['Cookie'] = jar;
  const res = await fetch(BASE + url, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) jar = setCookie.split(';')[0];
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, data };
}

let pass = 0;
function expect(name, cond, extra = '') {
  if (cond) { pass++; console.log(`PASS ${name}`); }
  else { console.error(`FAIL ${name} ${extra}`); process.exitCode = 1; throw new Error('stop'); }
}

(async () => {
  // 1. Unauthenticated table read blocked
  let r = await req('GET', '/api/users');
  expect('unauth GET /api/users -> 401', r.status === 401, `got ${r.status}`);

  // 2. Public settings still reachable (login page needs it)
  r = await req('GET', '/api/settings/all');
  expect('public GET /api/settings/all -> 200', r.status === 200, `got ${r.status}`);

  // 3. Unauthenticated write blocked
  r = await req('POST', '/api/applications', { projectName: 'x' });
  expect('unauth POST /api/applications -> 401', r.status === 401, `got ${r.status}`);

  // 4. Internal tables hidden
  r = await req('GET', '/api/sessions');
  expect('GET /api/sessions -> 404', r.status === 404, `got ${r.status}`);

  // 5. Public registration creates applicant only
  const email = `probe${Date.now()}@example.com`;
  r = await req('POST', '/api/auth/register', {
    fullName: 'Probe User', email, phone: '09171234567',
    address: '123 Test St, Buenavista, Agusan del Norte',
    password: 'probePass1', confirmPassword: 'probePass1',
  });
  expect('POST /api/auth/register -> 201 applicant', r.status === 201 && r.data.user?.role === 'applicant', `got ${r.status} ${JSON.stringify(r.data)}`);
  expect('register returns csrf + no passwordHash', !!r.data.csrfToken && !('passwordHash' in r.data.user));
  const csrf = r.data.csrfToken;
  const selfId = r.data.user.id;

  // 6. Authenticated applicant sees only self in users (hashes stripped)
  r = await req('GET', '/api/users');
  const usersOk = r.status === 200 && Array.isArray(r.data) && r.data.length === 1
    && r.data[0].id === selfId && !('passwordHash' in r.data[0]);
  expect('applicant GET /api/users -> self only, no hashes', usersOk, `got ${r.status} ${JSON.stringify(r.data)?.slice(0, 200)}`);

  // 7. Role escalation blocked
  r = await req('PUT', `/api/users/${selfId}`, { role: 'admin' }, csrf);
  expect('applicant role escalation -> 403', r.status === 403, `got ${r.status}`);

  // 8. CSRF enforced on writes
  r = await req('PUT', `/api/users/${selfId}`, { fullName: 'Probe Renamed' }, null);
  expect('PUT without CSRF token -> 403', r.status === 403, `got ${r.status}`);

  // 9. Wrong password rejected (no backdoor)
  jar = '';
  r = await req('POST', '/api/auth/login', { email, password: 'wrongpass99' });
  expect('login wrong password -> 401', r.status === 401, `got ${r.status}`);

  // 10. Correct password works (bcrypt)
  r = await req('POST', '/api/auth/login', { email, password: 'probePass1' });
  expect('login correct password -> 200 + csrf', r.status === 200 && !!r.data.csrfToken, `got ${r.status}`);

  // 11. Seed demo login works after orphan-hash reset
  jar = '';
  r = await req('POST', '/api/auth/login', { email: 'pedro@example.com', password: 'password' });
  expect('seed applicant login (password) -> 200', r.status === 200, `got ${r.status} ${JSON.stringify(r.data)?.slice(0, 160)}`);

  // 12. Legacy SHA-256 account migrates to bcrypt on login (none in seed; covered by unit path)
  console.log(`\nALL ${pass} CHECKS PASSED`);
})().catch((e) => { if (!process.exitCode) { console.error('PROBE ERROR', e.message); process.exitCode = 1; } });
