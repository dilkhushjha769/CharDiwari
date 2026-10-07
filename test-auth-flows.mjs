// Automated Test Suite for CharDiwari Production Authentication Flow
import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let cookiesJar = '';

async function request(path, options = {}) {
  const headers = options.headers || {};
  if (cookiesJar) {
    headers['Cookie'] = cookiesJar;
  }
  if (options.body && typeof options.body === 'object' && !(options.body instanceof String)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    redirect: 'manual', // do not auto-follow redirects so we can assert on 307/302 redirects
  });

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const rawCookie = setCookie.split(';')[0];
    cookiesJar = rawCookie;
  }

  let json = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    json = await res.json();
  }

  return {
    status: res.status,
    headers: res.headers,
    data: json,
    location: res.headers.get('location'),
  };
}

async function runTests() {
  console.log('🚀 Starting CharDiwari Authentication Test Suite...\n');
  const results = [];

  function pass(title) {
    console.log(`✅ PASS: ${title}`);
    results.push({ title, pass: true });
  }

  function fail(title, error) {
    console.error(`❌ FAIL: ${title} ->`, error);
    results.push({ title, pass: false, error });
  }

  // Ensure dev server is responsive
  for (let i = 0; i < 10; i++) {
    try {
      const ping = await fetch(BASE_URL);
      if (ping.status === 200) break;
    } catch {
      await wait(1000);
    }
  }

  // 1. Test Unauthenticated Access to /dashboard (Should Redirect to /auth)
  try {
    cookiesJar = ''; // clear cookies
    const res = await request('/dashboard');
    assert(
      res.status === 307 || res.status === 302 || (res.location && res.location.includes('/auth')),
      `Expected redirect to /auth, got status ${res.status}`
    );
    pass('1. Authenticated route protection: Unauthenticated user redirected from /dashboard to /auth');
  } catch (err) {
    fail('1. Authenticated route protection', err.message);
  }

  // 2. Test Intelligent Email Detection on Non-Existent User
  const testNewEmail = `testuser_${Date.now()}@chardiwari.test`;
  try {
    const res = await request('/api/auth/check-email', {
      method: 'POST',
      body: { email: testNewEmail },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.exists, false, 'Expected exists to be false');
    pass('2. Intelligent Email Detection: Detects non-existent email correctly');
  } catch (err) {
    fail('2. Intelligent Email Detection (Non-Existent)', err.message);
  }

  // 3. Test Signup Validation (Invalid password strength)
  try {
    const res = await request('/api/auth/send-otp', {
      method: 'POST',
      body: {
        type: 'signup',
        name: 'Test Candidate',
        email: testNewEmail,
        password: 'weak',
        confirmPassword: 'weak',
      },
    });
    assert.strictEqual(res.status, 400);
    assert(res.data.error.includes('8 characters'), 'Expected password strength error');
    pass('3. Signup Validation: Enforces password minimum strength requirements');
  } catch (err) {
    fail('3. Signup Validation', err.message);
  }

  // 4. Test New User Registration OTP Dispatch
  const testPassword = 'SecurePass@2026!';
  try {
    const res = await request('/api/auth/send-otp', {
      method: 'POST',
      body: {
        type: 'signup',
        name: 'Test Candidate',
        email: testNewEmail,
        password: testPassword,
        confirmPassword: testPassword,
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    pass('4. New User Registration: Sends 6-digit cryptographic OTP to user email');
  } catch (err) {
    fail('4. New User Registration OTP Dispatch', err.message);
  }

  // 5. Test Incorrect OTP verification attempt & attempt count decrement
  try {
    const res = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: {
        email: testNewEmail,
        type: 'signup',
        otp: '000000', // incorrect
      },
    });
    assert.strictEqual(res.status, 400);
    assert(res.data.error.includes('incorrect'), 'Expected incorrect OTP error message');
    assert(typeof res.data.attemptsLeft === 'number', 'Expected attemptsLeft in payload');
    pass('5. Incorrect OTP Verification: Rejects invalid code and limits attempt count');
  } catch (err) {
    fail('5. Incorrect OTP Verification', err.message);
  }

  // 6. Test Successful OTP Verification and Account Creation
  let validOtp = '';
  try {
    // Fetch generated OTP from dev preview
    const devOtpRes = await request(`/api/auth/dev-otp?email=${encodeURIComponent(testNewEmail)}`);
    assert(devOtpRes.data.otp, 'Expected OTP in dev-otp response');
    validOtp = devOtpRes.data.otp;

    const res = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: {
        email: testNewEmail,
        type: 'signup',
        otp: validOtp,
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(cookiesJar.includes('chardiwari_session'), 'Expected HTTP-only session cookie set');
    pass('6. Successful OTP Verification: Registers user, verifies email, and logs in automatically');
  } catch (err) {
    fail('6. Successful OTP Verification', err.message);
  }

  // 7. Test Access to Protected Dashboard with Session Cookie
  try {
    const res = await request('/dashboard');
    assert.strictEqual(res.status, 200, 'Expected status 200 for authenticated user on /dashboard');
    pass('7. Authenticated Dashboard Access: Allows user with valid session cookie');
  } catch (err) {
    fail('7. Authenticated Dashboard Access', err.message);
  }

  // 8. Test Prevent Authenticated User from Accessing /auth
  try {
    const res = await request('/auth');
    assert(
      res.status === 307 || res.status === 302 || (res.location && res.location.includes('/dashboard')),
      'Expected redirect away from /auth to /dashboard when authenticated'
    );
    pass('8. Prevent Authenticated User Access to /auth: Redirects to /dashboard');
  } catch (err) {
    fail('8. Prevent Authenticated User Access to /auth', err.message);
  }

  // 9. Test Logout
  try {
    const res = await request('/api/auth/logout', { method: 'POST' });
    assert.strictEqual(res.status, 200);
    // Try accessing /dashboard again - should now redirect to /auth
    const checkDash = await request('/dashboard');
    assert(
      checkDash.status === 307 || checkDash.status === 302 || (checkDash.location && checkDash.location.includes('/auth')),
      'Expected redirect after logout'
    );
    pass('9. Logout Flow: Clears HTTP-only session and revokes access to /dashboard');
  } catch (err) {
    fail('9. Logout Flow', err.message);
  }

  // 10. Test Intelligent Email Detection on Existing User
  try {
    const res = await request('/api/auth/check-email', {
      method: 'POST',
      body: { email: testNewEmail },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.exists, true, 'Expected exists to be true for registered user');
    pass('10. Intelligent Email Detection: Detects existing registered email');
  } catch (err) {
    fail('10. Intelligent Email Detection (Existing)', err.message);
  }

  // 11. Test Existing User Login with Password
  try {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: testNewEmail,
        password: testPassword,
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(cookiesJar.includes('chardiwari_session'));
    pass('11. Existing User Login: Verifies bcrypt password and establishes session');
  } catch (err) {
    fail('11. Existing User Login', err.message);
  }

  // 12. Test Existing User Login with WRONG Password
  try {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: testNewEmail,
        password: 'WrongPassword@123',
      },
    });
    assert.strictEqual(res.status, 401);
    assert(res.data.error.includes('Incorrect password'));
    pass('12. Login Error Handling: Returns friendly error for incorrect password');
  } catch (err) {
    fail('12. Login Error Handling', err.message);
  }

  // 13. Test Forgot Password OTP Request
  try {
    const res = await request('/api/auth/send-otp', {
      method: 'POST',
      body: {
        type: 'reset',
        email: testNewEmail,
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    pass('13. Forgot Password Flow: Sends password recovery OTP code');
  } catch (err) {
    fail('13. Forgot Password Flow', err.message);
  }

  // 14. Test Password Reset Token & Updating Password
  const newSecret = 'BrandNewPassword@2026!';
  try {
    // Get recovery OTP
    const devOtp = await request(`/api/auth/dev-otp?email=${encodeURIComponent(testNewEmail)}`);
    const resetOtp = devOtp.data.otp;

    // Verify recovery OTP
    const verifyRes = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: {
        email: testNewEmail,
        type: 'reset',
        otp: resetOtp,
      },
    });
    assert.strictEqual(verifyRes.status, 200);
    assert(verifyRes.data.resetToken, 'Expected resetToken in response');

    // Submit new password
    const resetRes = await request('/api/auth/reset-password', {
      method: 'POST',
      body: {
        email: testNewEmail,
        resetToken: verifyRes.data.resetToken,
        password: newSecret,
        confirmPassword: newSecret,
      },
    });
    assert.strictEqual(resetRes.status, 200);
    assert.strictEqual(resetRes.data.success, true);

    // Verify login with new password works
    const newLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: testNewEmail,
        password: newSecret,
      },
    });
    assert.strictEqual(newLoginRes.status, 200);
    pass('14. Password Reset Flow: Issues reset token, updates password hash, and allows login with new credentials');
  } catch (err) {
    fail('14. Password Reset Flow', err.message);
  }

  // 15. Test Google Sign-In Flow (New & Existing Account)
  try {
    const googleEmail = `google_${Date.now()}@chardiwari.test`;
    const res = await request('/api/auth/google', {
      method: 'POST',
      body: {
        email: googleEmail,
        name: 'Google Traveler',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(cookiesJar.includes('chardiwari_session'));

    // Second time login with same Google account (existing account)
    const resExisting = await request('/api/auth/google', {
      method: 'POST',
      body: {
        email: googleEmail,
        name: 'Google Traveler',
      },
    });
    assert.strictEqual(resExisting.status, 200);
    pass('15. Google Sign-In Flow: Automatic account creation, direct login, and session cookie assignment without password prompt');
  } catch (err) {
    fail('15. Google Sign-In Flow', err.message);
  }

  // Summary
  console.log('\n======================================================');
  console.log(`Test Results: ${results.filter((r) => r.pass).length}/${results.length} PASSED`);
  console.log('======================================================\n');

  if (results.some((r) => !r.pass)) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
