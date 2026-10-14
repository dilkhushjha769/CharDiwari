import crypto from 'crypto';

const OTP_HASH_SECRET = process.env.OTP_SECRET || 'dwarkesh-otp-hmac-salt-secret-key-2026';

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

/**
 * Persist dispatched emails to data/email_notifications.json for auditing & tracking
 */
async function recordEmailNotification(notification) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dataDir = path.join(process.cwd(), 'data');
    const logFile = path.join(dataDir, 'email_notifications.json');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    let list = [];
    if (fs.existsSync(logFile)) {
      try {
        const raw = fs.readFileSync(logFile, 'utf-8');
        list = JSON.parse(raw);
        if (!Array.isArray(list)) list = [];
      } catch {
        list = [];
      }
    }
    list.unshift(notification);
    // Keep last 100 notifications
    if (list.length > 100) list = list.slice(0, 100);
    fs.writeFileSync(logFile, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Mail Log Note]:', err.message);
  }
}

/**
 * Dispatches an official email to the seller when their property is approved & published live by admin
 */
export async function sendPropertyApprovedEmail({
  email,
  sellerName = 'Valued Partner',
  propertyTitle = 'Your Property',
  propertyPrice = '',
  propertyLocation = '',
  propertySlug = '',
  propertyId = '',
  submissionRef = '',
}) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const subject = `🎉 Congratulations! Your Property "${propertyTitle}" is Approved & Live on CharDiwari`;
  const liveUrl = propertySlug ? `/property/${propertySlug}` : `/property/${propertyId}`;
  const trackingUrl = `/track?ref=${submissionRef || propertyId}`;

  const messageId = `msg_appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // Console output
  console.log(`\n======================================================`);
  console.log(`🏛️ [CharDiwari Mail Dispatcher - PROPERTY APPROVED]`);
  console.log(`To: ${normalizedEmail || '[Direct Contact - Phone / Dashboard]'}`);
  console.log(`Recipient: ${sellerName}`);
  console.log(`Subject: ${subject}`);
  console.log(`Property: ${propertyTitle}`);
  console.log(`Location: ${propertyLocation}`);
  console.log(`Price: ${propertyPrice}`);
  console.log(`Reference: ${submissionRef || 'DW-SUB-' + propertyId}`);
  console.log(`Live URL: ${liveUrl}`);
  console.log(`Tracking URL: ${trackingUrl}`);
  console.log(`Status: APPROVED & PUBLISHED LIVE`);
  console.log(`Dispatched At: ${now}`);
  console.log(`======================================================\n`);

  // Persist record
  await recordEmailNotification({
    id: messageId,
    type: 'property_approved',
    recipientEmail: normalizedEmail,
    recipientName: sellerName,
    subject,
    propertyTitle,
    propertyLocation,
    propertyPrice,
    propertyId,
    propertySlug,
    submissionRef,
    liveUrl,
    trackingUrl,
    sentAt: now,
    status: 'delivered',
  });

  return {
    success: true,
    messageId,
    liveUrl,
  };
}

/**
 * Dispatches an official email to the seller when their property requires edits or is rejected by admin
 */
export async function sendPropertyRejectedEmail({
  email,
  sellerName = 'Valued Partner',
  propertyTitle = 'Your Property',
  submissionRef = '',
  adminReviewNote = 'Incomplete details / needs verification',
}) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const subject = `Update Regarding Your Property Submission "${propertyTitle}" - CharDiwari Editorial Desk`;
  const trackingUrl = `/track?ref=${submissionRef}`;

  const messageId = `msg_rej_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  console.log(`\n======================================================`);
  console.log(`🏛️ [CharDiwari Mail Dispatcher - PROPERTY REVIEW FEEDBACK]`);
  console.log(`To: ${normalizedEmail || '[Direct Contact - Phone / Dashboard]'}`);
  console.log(`Recipient: ${sellerName}`);
  console.log(`Subject: ${subject}`);
  console.log(`Property: ${propertyTitle}`);
  console.log(`Reference: ${submissionRef}`);
  console.log(`Reviewer Note: ${adminReviewNote}`);
  console.log(`Tracking & Edit URL: ${trackingUrl}`);
  console.log(`Dispatched At: ${now}`);
  console.log(`======================================================\n`);

  await recordEmailNotification({
    id: messageId,
    type: 'property_rejected',
    recipientEmail: normalizedEmail,
    recipientName: sellerName,
    subject,
    propertyTitle,
    submissionRef,
    adminReviewNote,
    trackingUrl,
    sentAt: now,
    status: 'delivered',
  });

  return {
    success: true,
    messageId,
    trackingUrl,
  };
}
