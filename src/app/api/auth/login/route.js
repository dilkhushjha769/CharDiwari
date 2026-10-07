import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@/lib/validation';
import { findUserByEmail } from '@/lib/db';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { createSessionToken, setSessionCookie } from '@/lib/session';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'local';
    const body = await request.json();

    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid email or password.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, password } = parseResult.data;
    const rateLimitKey = `login:${email}`;

    // Check rate limit on email
    const rateCheck = checkRateLimit(rateLimitKey, 5, 900, 900);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait and try again later.' },
        { status: 429 }
      );
    }

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }

    if (user.provider === 'google' && !user.passwordHash) {
      return NextResponse.json(
        { error: 'This account was created with Google. Please click "Continue with Google".' },
        { status: 400 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash || '');
    if (!isValidPassword) {
      const remaining = rateCheck.remaining;
      const warning = remaining <= 2 && remaining > 0 ? ` (${remaining} attempts remaining)` : '';
      return NextResponse.json(
        { error: `Incorrect password. Please try again.${warning}` },
        { status: 401 }
      );
    }

    // Success - reset failed login count
    resetRateLimit(rateLimitKey);

    // Create session
    const token = await createSessionToken(user);
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
      },
    });

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
