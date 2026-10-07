import { NextResponse } from 'next/server';
import { getDevOtp } from '@/lib/mail';


export async function GET(request) {
  // Only expose in development or test environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Email query parameter required' }, { status: 400 });
  }

  const otp = getDevOtp(email);
  return NextResponse.json({
    email,
    otp: otp || null,
    found: !!otp,
  });
}
