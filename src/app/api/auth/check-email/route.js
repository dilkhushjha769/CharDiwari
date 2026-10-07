import { NextResponse } from 'next/server';
import { emailSchema } from '@/lib/validation';
import { findUserByEmail } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'local';
    const rateCheck = checkRateLimit(`check_email:${ip}`, 30, 60, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.message }, { status: 429 });
    }

    const body = await request.json();
    const result = emailSchema.safeParse(body?.email);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const email = result.data;
    const user = findUserByEmail(email);

    return NextResponse.json({
      exists: !!user,
      email,
    });
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
