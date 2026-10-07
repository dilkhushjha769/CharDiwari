import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      otps: [],
      rateLimits: {},
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

function readDb() {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB, resetting structure:', err);
    return { users: [], otps: [], rateLimits: {} };
  }
}

function writeDb(data) {
  ensureDbFile();
  const tmpFile = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

// User operations
export function findUserByEmail(email) {
  if (!email) return null;
  const db = readDb();
  const normalized = email.toLowerCase().trim();
  return db.users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function findUserById(id) {
  if (!id) return null;
  const db = readDb();
  return db.users.find((u) => u.id === id) || null;
}

export function createUser({ email, name, passwordHash = null, provider = 'credentials', avatarUrl = null }) {
  const db = readDb();
  const normalized = email.toLowerCase().trim();

  const existing = db.users.find((u) => u.email.toLowerCase() === normalized);
  if (existing) {
    throw new Error('User already exists');
  }

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    email: normalized,
    name: name?.trim() || normalized.split('@')[0],
    passwordHash,
    provider,
    avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || normalized)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDb(db);
  return newUser;
}

export function updateUser(id, updates) {
  const db = readDb();
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  db.users[index] = {
    ...db.users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeDb(db);
  return db.users[index];
}

export function updateUserPassword(email, newPasswordHash) {
  const db = readDb();
  const normalized = email.toLowerCase().trim();
  const index = db.users.findIndex((u) => u.email.toLowerCase() === normalized);
  if (index === -1) return null;

  db.users[index].passwordHash = newPasswordHash;
  db.users[index].updatedAt = new Date().toISOString();
  writeDb(db);
  return db.users[index];
}

// OTP Operations
export function saveOtp({ email, type, otpHash, tempSignupData = null, expiresAt }) {
  const db = readDb();
  const normalized = email.toLowerCase().trim();

  // Remove existing OTP for this email & type
  db.otps = db.otps.filter((o) => !(o.email.toLowerCase() === normalized && o.type === type));

  const otpRecord = {
    id: `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalized,
    type, // 'signup' | 'reset'
    otpHash,
    tempSignupData,
    attempts: 0,
    maxAttempts: 5,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  db.otps.push(otpRecord);
  writeDb(db);
  return otpRecord;
}

export function getOtp(email, type) {
  const db = readDb();
  const normalized = email.toLowerCase().trim();
  return db.otps.find((o) => o.email.toLowerCase() === normalized && o.type === type) || null;
}

export function incrementOtpAttempt(email, type) {
  const db = readDb();
  const normalized = email.toLowerCase().trim();
  const record = db.otps.find((o) => o.email.toLowerCase() === normalized && o.type === type);
  if (!record) return null;

  record.attempts = (record.attempts || 0) + 1;
  writeDb(db);
  return record;
}

export function deleteOtp(email, type) {
  const db = readDb();
  const normalized = email.toLowerCase().trim();
  db.otps = db.otps.filter((o) => !(o.email.toLowerCase() === normalized && o.type === type));
  writeDb(db);
}

// Rate Limiting Persistence
export function getRateLimitRecord(key) {
  const db = readDb();
  return db.rateLimits?.[key] || null;
}

export function setRateLimitRecord(key, record) {
  const db = readDb();
  if (!db.rateLimits) db.rateLimits = {};
  db.rateLimits[key] = record;
  writeDb(db);
}

export function clearRateLimitRecord(key) {
  const db = readDb();
  if (db.rateLimits && db.rateLimits[key]) {
    delete db.rateLimits[key];
    writeDb(db);
  }
}
