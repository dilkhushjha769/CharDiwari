import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { emailSchema, signupSchema } from '@/lib/validation';
import { findUserByEmail, saveOtp, getOtp } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateOtp, hashOtp, sendOtpEmail } from '@/lib/mail';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'local';
    const body = await request.json();
    const type = body?.type === 'reset' ? 'reset' : 'signup';

    let validatedEmail = '';
    let tempSignupData = null;

    if (type === 'signup') {
      const parseResult = signupSchema.safeParse(body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0]?.message || 'Invalid registration details.';
        return NextResponse.json({ error: firstError }, { status: 400 });
      }

      const { email, name, password } = parseResult.data;
      validatedEmail = email;

      const existingUser = findUserByEmail(email);
      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in.' },
          { status: 409 }
        );
      }

      // Hash password temporarily so plaintext password is never held in DB or sessions
      const passwordHash = await bcrypt.hash(password, 10);
      tempSignupData = {
        name,
        passwordHash,
      };
    } else {
      // type === 'reset'
      const parseResult = emailSchema.safeParse(body?.email);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: 'Please enter a valid email address.' },
          { status: 400 }
        );
      }

      validatedEmail = parseResult.data;
      const user = findUserByEmail(validatedEmail);
      if (!user) {
        return NextResponse.json(
          { error: 'No account found with this email address.' },
          { status: 404 }
        );
      }
    }

    // Cooldown rate limit (minimum 30 seconds between requests)
    const cooldownKey = `otp_cooldown:${validatedEmail}:${type}`;
    const cooldownCheck = checkRateLimit(cooldownKey, 1, 30, 30);
    if (!cooldownCheck.allowed) {
      return NextResponse.json(
        { error: 'Please wait 30 seconds before requesting another code.' },
        { status: 429 }
      );
    }

    // Hourly rate limit (max 5 OTP requests per hour)
    const hourlyKey = `otp_hourly:${validatedEmail}:${type}`;
    const hourlyCheck = checkRateLimit(hourlyKey, 5, 3600, 3600);
    if (!hourlyCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many verification code requests. Please wait and try again later.' },
        { status: 429 }
      );
    }

    // Generate secure 6-digit OTP
    const rawOtp = generateOtp();
    const otpHash = hashOtp(rawOtp);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save hash in database
    saveOtp({
      email: validatedEmail,
      type,
      otpHash,
      tempSignupData,
      expiresAt,
    });

    // Send email (logs to terminal and dev preview cache)
    await sendOtpEmail({
      email: validatedEmail,
      otp: rawOtp,
      type,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully.',
      cooldownSeconds: 30,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
