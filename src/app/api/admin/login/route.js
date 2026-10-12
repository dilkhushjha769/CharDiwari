import { NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin';
import { createAdminSessionToken, setAdminSessionCookie } from '@/lib/session';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const authResult = await authenticateAdmin(email, password);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Invalid credentials' }, { status: 401 });
    }

    const token = await createAdminSessionToken(authResult.user);
    const response = NextResponse.json({
      success: true,
      user: authResult.user,
      message: 'Admin authorization granted.',
    });

    setAdminSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Server error during authentication.' }, { status: 500 });
  }
}
