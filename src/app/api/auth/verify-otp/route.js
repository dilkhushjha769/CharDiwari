import { NextResponse } from 'next/server';
import { otpSchema, emailSchema } from '@/lib/validation';
import { getOtp, incrementOtpAttempt, deleteOtp, createUser, findUserByEmail } from '@/lib/db';
import { verifyOtpHash } from '@/lib/mail';
import { createSessionToken, createResetToken, setSessionCookie } from '@/lib/session';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, type = 'signup', otp } = body || {};

    const emailCheck = emailSchema.safeParse(email);
    if (!emailCheck.success) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const otpCheck = otpSchema.safeParse(otp);
    if (!otpCheck.success) {
      return NextResponse.json(
        { error: 'The verification code must be 6 digits.' },
        { status: 400 }
      );
    }

    const normalizedEmail = emailCheck.data;
    const otpRecord = getOtp(normalizedEmail, type);

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'No active verification code found. Please request a new one.' },
        { status: 404 }
      );
    }

    // Check expiration
    if (Date.now() > otpRecord.expiresAt) {
      deleteOtp(normalizedEmail, type);
      return NextResponse.json(
        { error: 'This code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check max attempts
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      deleteOtp(normalizedEmail, type);
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new verification code.' },
        { status: 429 }
      );
    }

    // Verify cryptographic hash
    const isValid = verifyOtpHash(otpCheck.data, otpRecord.otpHash);

    if (!isValid) {
      const updatedRecord = incrementOtpAttempt(normalizedEmail, type);
      const attemptsLeft = otpRecord.maxAttempts - (updatedRecord?.attempts || 1);

      if (attemptsLeft <= 0) {
        deleteOtp(normalizedEmail, type);
        return NextResponse.json(
          { error: 'Too many failed attempts. This code is now invalid. Please request a new one.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `The verification code is incorrect. (${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining)`,
          attemptsLeft,
        },
        { status: 400 }
      );
    }

    // OTP is valid! Remove it so it cannot be re-used
    deleteOtp(normalizedEmail, type);

    if (type === 'signup') {
      const temp = otpRecord.tempSignupData;
      if (!temp || !temp.passwordHash) {
        return NextResponse.json(
          { error: 'Registration session expired. Please start registration again.' },
          { status: 400 }
        );
      }

      // Check if user was somehow created meanwhile
      let user = findUserByEmail(normalizedEmail);
      if (!user) {
        user = createUser({
          email: normalizedEmail,
          name: temp.name,
          passwordHash: temp.passwordHash,
          provider: 'credentials',
        });
      }

      // Create session and set cookie
      const token = await createSessionToken(user);
      const response = NextResponse.json({
        success: true,
        message: 'Email verified successfully. Creating account...',
        redirectTo: '/',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
      });

      setSessionCookie(response, token);
      return response;
    }

    if (type === 'reset') {
      // Create short-lived reset token for password reset form
      const resetToken = await createResetToken(normalizedEmail);
      return NextResponse.json({
        success: true,
        message: 'Verification successful.',
        resetToken,
        email: normalizedEmail,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
