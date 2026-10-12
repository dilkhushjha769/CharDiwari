import { SignJWT, jwtVerify } from 'jose';

const SESSION_SECRET = process.env.SESSION_SECRET || 'dwarkesh-ultra-secure-jwt-secret-key-2026-production';
const encodedSecret = new TextEncoder().encode(SESSION_SECRET);

export const COOKIE_NAME = 'dwarkesh_session';

export async function createSessionToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    provider: user.provider,
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedSecret);
}

export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function createResetToken(email) {
  return await new SignJWT({ email, purpose: 'password_reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(encodedSecret);
}

export async function verifyResetToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ['HS256'],
    });
    if (payload.purpose !== 'password_reset') return null;
    return payload;
  } catch (error) {
    return null;
  }
}

export function setSessionCookie(response, token) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  });
  return response;
}

export function clearSessionCookie(response) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  response.cookies.set('chardiwari_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

// ====================================================================
// Admin Session Helpers
// ====================================================================
export const ADMIN_COOKIE_NAME = 'dwarkesh_admin_token';

export async function createAdminSessionToken(adminUser) {
  const payload = {
    adminId: adminUser.id || 'admin_root',
    email: adminUser.email,
    name: adminUser.name || 'Administrator',
    role: adminUser.role || 'superadmin',
    isAdmin: true,
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // 24 hours admin validity
    .sign(encodedSecret);
}

export async function verifyAdminSessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ['HS256'],
    });
    if (!payload.isAdmin) return null;
    return payload;
  } catch (error) {
    return null;
  }
}

export function setAdminSessionCookie(response, token) {
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });
  return response;
}

export function clearAdminSessionCookie(response) {
  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  response.cookies.set('chardiwari_admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

