import crypto from 'crypto';

const OTP_HASH_SECRET = process.env.OTP_SECRET || 'chardiwari-otp-hmac-salt-secret-key-2026';

// Global cache for dev preview so testing can grab OTP without exposing it to client-side code directly
const devOtpLog = new Map();

/**
 * Generates a cryptographically secure 6-digit numeric OTP
 */
export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Creates a secure HMAC hash of the OTP to store in the database
 */
export function hashOtp(otp) {
  return crypto.createHmac('sha256', OTP_HASH_SECRET).update(otp.trim()).digest('hex');
}

/**
 * Constant-time comparison between entered OTP and stored hash
 */
export function verifyOtpHash(enteredOtp, storedHash) {
  if (!enteredOtp || !storedHash) return false;
  const computedHash = hashOtp(enteredOtp);
  try {
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));
  } catch {
    return false;
  }
}

/**
 * Simulates sending an email with the OTP and logs it to terminal & dev cache
 */
export async function sendOtpEmail({ email, otp, type = 'signup' }) {
  const normalizedEmail = email.toLowerCase().trim();
  const subject =
    type === 'signup'
      ? 'Welcome to Dwarkesh - Verify Your Email'
      : 'Dwarkesh - Reset Your Password Verification Code';

  // Store in dev log for testing and dev tools
  devOtpLog.set(normalizedEmail, {
    otp,
    type,
    sentAt: Date.now(),
  });

  // Log clearly to server terminal
  console.log(`\n======================================================`);
  console.log(`📧 [Dwarkesh Mail Dispatcher]`);
  console.log(`To: ${normalizedEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`Your 6-Digit OTP Code: [ ${otp} ]`);
  console.log(`Expires in: 10 minutes`);
  console.log(`======================================================\n`);

  return {
    success: true,
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
  };
}

export function getDevOtp(email) {
  const record = devOtpLog.get(email.toLowerCase().trim());
  if (!record) return null;
  // Expire after 10 minutes
  if (Date.now() - record.sentAt > 10 * 60 * 1000) {
    devOtpLog.delete(email.toLowerCase().trim());
    return null;
  }
  return record.otp;
}
