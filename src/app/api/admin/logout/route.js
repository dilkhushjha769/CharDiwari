import { NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/lib/session';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Admin session terminated.',
  });
  clearAdminSessionCookie(response);
  return response;
}
