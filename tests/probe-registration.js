// Comprehensive Registration Verification Probe — tests/probe-registration.js
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
  return { status: res.status, data, headers: res.headers };
}

let pass = 0;
function expect(name, cond, extra = '') {
  if (cond) { pass++; console.log(`PASS: ${name}`); }
  else { console.error(`FAIL: ${name} ${extra}`); process.exitCode = 1; throw new Error(`Assertion failed: ${name} ${extra}`); }
}

(async () => {
  console.log('--- STARTING REGISTRATION TEST SUITE ---');

  // 1. Email check endpoint: available for unused email
  const testEmail = `testapplicant_${Date.now()}@example.com`;
  let r = await req('GET', `/api/auth/check-email?email=${encodeURIComponent(testEmail)}`);
  expect('Email check returns available for new email', r.status === 200 && r.data.available === true);

  // 2. Email check endpoint: unavailable for existing seed user
  r = await req('GET', `/api/auth/check-email?email=pedro@example.com`);
  expect('Email check returns unavailable for existing email', r.status === 200 && r.data.available === false);

  // 3. Validation: Missing full name rejected
  r = await req('POST', '/api/auth/register', {
    fullName: '', email: testEmail, phone: '09171234567', address: '123 Test St, Buenavista',
    password: 'Password123!', confirmPassword: 'Password123!'
  });
  expect('Missing fullName rejected -> 400', r.status === 400);

  // 4. Validation: Invalid email format rejected
  r = await req('POST', '/api/auth/register', {
    fullName: 'Juan dela Cruz', email: 'notanemail', phone: '09171234567', address: '123 Test St, Buenavista',
    password: 'Password123!', confirmPassword: 'Password123!'
  });
  expect('Invalid email format rejected -> 400', r.status === 400);

  // 5. Validation: Invalid phone rejected
  r = await req('POST', '/api/auth/register', {
    fullName: 'Juan dela Cruz', email: testEmail, phone: '12345', address: '123 Test St, Buenavista',
    password: 'Password123!', confirmPassword: 'Password123!'
  });
  expect('Invalid phone number rejected -> 400', r.status === 400);

  // 6. Validation: Short address rejected
  r = await req('POST', '/api/auth/register', {
    fullName: 'Juan dela Cruz', email: testEmail, phone: '09171234567', address: 'No',
    password: 'Password123!', confirmPassword: 'Password123!'
  });
  expect('Short address rejected -> 400', r.status === 400);

  // 7. Validation: Short password rejected
  r = await req('POST', '/api/auth/register', {
    fullName: 'Juan dela Cruz', email: testEmail, phone: '09171234567', address: '123 Test St, Buenavista',
    password: 'pass', confirmPassword: 'pass'
  });
  expect('Short password rejected -> 400', r.status === 400);

  // 8. Validation: Password mismatch rejected
  r = await req('POST', '/api/auth/register', {
    fullName: 'Juan dela Cruz', email: testEmail, phone: '09171234567', address: '123 Test St, Buenavista',
    password: 'Password123!', confirmPassword: 'DifferentPassword123!'
  });
  expect('Password mismatch rejected -> 400', r.status === 400);

  // 9. Validation: Corrupt/Fake file content rejected by magic byte inspection
  r = await req('POST', '/api/auth/register', {
    fullName: 'Juan dela Cruz', email: testEmail, phone: '09171234567', address: '123 Test St, Buenavista',
    password: 'Password123!', confirmPassword: 'Password123!',
    idFile: {
      name: 'fake.pdf',
      type: 'application/pdf',
      size: 50,
      data: Buffer.from('NOT_A_REAL_PDF_HEADER').toString('base64')
    }
  });
  expect('Corrupted PDF header rejected by magic byte validator -> 400', r.status === 400);

  // 10. Valid registration with verified PDF valid ID upload
  // Valid minimal PDF header %PDF-1.4
  const samplePdf = Buffer.from('%PDF-1.4 sample pdf binary data for applicant identity verification test');
  r = await req('POST', '/api/auth/register', {
    fullName: 'Maria Santos',
    email: testEmail,
    phone: '09181234567',
    address: 'Poblacion 2, Buenavista, Agusan del Norte',
    applicantType: 'Individual',
    idType: 'PhilSys National ID',
    idNumber: '1234-5678-9012-3456',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    idFile: {
      name: 'philsys_national_id.pdf',
      type: 'application/pdf',
      size: samplePdf.length,
      data: samplePdf.toString('base64')
    }
  });
  expect('Valid registration with PDF ID succeeds -> 201', r.status === 201 && r.data.user?.role === 'applicant');
  expect('Registration returns CSRF token and no passwordHash', !!r.data.csrfToken && !('passwordHash' in r.data.user));
  const newUserId = r.data.user.id;
  const applicantCsrf = r.data.csrfToken;

  // 11. Role is strictly applicant (no privilege escalation)
  expect('Registered role is applicant', r.data.user.role === 'applicant');

  // 12. Duplicate email registration rejected
  r = await req('POST', '/api/auth/register', {
    fullName: 'Maria Clone', email: testEmail, phone: '09181234567', address: 'Poblacion 2, Buenavista',
    password: 'Password123!', confirmPassword: 'Password123!'
  });
  expect('Duplicate email registration returns 409 Conflict', r.status === 409);

  // 13. Direct public static URL to /storage is BLOCKED (403 Forbidden)
  const directStorageRes = await fetch(`${BASE}/storage/uploads/ids/test.pdf`);
  expect('Public static access to /storage blocked -> 403', directStorageRes.status === 403);

  // 14. Authorized valid-id retrieval: Applicant can retrieve own uploaded ID
  r = await req('GET', `/api/users/${newUserId}/valid-id`);
  expect('Applicant can retrieve own valid ID -> 200', r.status === 200);

  // 15. Unauthenticated user CANNOT access valid ID
  jar = '';
  r = await req('GET', `/api/users/${newUserId}/valid-id`);
  expect('Unauthenticated request for valid ID blocked -> 401', r.status === 401);

  // 16. Another applicant cannot access someone else\'s valid ID
  // Register another applicant
  const otherEmail = `other_${Date.now()}@example.com`;
  r = await req('POST', '/api/auth/register', {
    fullName: 'Other Applicant', email: otherEmail, phone: '09191234567',
    address: 'Barangay 5, Buenavista', password: 'Password123!', confirmPassword: 'Password123!'
  });
  expect('Second applicant registration -> 201', r.status === 201);
  // Try accessing first applicant's ID with second applicant session
  r = await req('GET', `/api/users/${newUserId}/valid-id`);
  expect('Accessing another applicant ID is blocked -> 403', r.status === 403);

  // 17. Authorized staff CAN access applicant\'s valid ID for verification
  jar = '';
  r = await req('POST', '/api/auth/login', { email: 'staff@mpdo.gov.ph', password: 'password' });
  expect('Staff login -> 200', r.status === 200);
  r = await req('GET', `/api/users/${newUserId}/valid-id`);
  expect('Staff can access applicant valid ID for verification -> 200', r.status === 200);

  console.log(`\n========================================`);
  console.log(` ALL ${pass} REGISTRATION TESTS PASSED!`);
  console.log(`========================================`);
})().catch(err => {
  console.error('PROBE ERROR:', err.message);
  process.exitCode = 1;
});
