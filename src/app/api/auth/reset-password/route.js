import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { resetPasswordSchema } from '@/lib/validation';
import { verifyResetToken } from '@/lib/session';
import { updateUserPassword, findUserByEmail } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, resetToken, password, confirmPassword } = body || {};

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or missing password reset token.' },
        { status: 400 }
      );
    }

    const payload = await verifyResetToken(resetToken);
    if (!payload || payload.email !== email?.toLowerCase().trim()) {
      return NextResponse.json(
        { error: 'Password reset token is invalid or expired. Please request a new OTP.' },
        { status: 401 }
      );
    }

    const parseResult = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid password.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'User account not found.' },
        { status: 404 }
      );
    }

    const newPasswordHash = await bcrypt.hash(password, 10);
    updateUserPassword(user.email, newPasswordHash);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
