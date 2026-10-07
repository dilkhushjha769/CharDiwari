import { NextResponse } from 'next/server';
import { findUserByEmail, createUser, updateUser } from '@/lib/db';
import { createSessionToken, setSessionCookie } from '@/lib/session';

export async function POST(request) {
  try {
    const body = await request.json();
    let email = body?.email?.toLowerCase().trim();
    let name = body?.name?.trim();
    let avatarUrl = body?.avatarUrl;

    // If a Google ID token / JWT was sent from Google One Tap or OAuth:
    if (body?.credential) {
      try {
        const parts = body.credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          if (payload.email) {
            email = payload.email.toLowerCase().trim();
            name = payload.name || name;
            avatarUrl = payload.picture || avatarUrl;
          }
        }
      } catch (e) {
        console.warn('Could not parse Google ID token, falling back to body fields', e);
      }
    }

    if (!email) {
      // Default fallback for demo / test Google account if user clicked quick Google test
      email = 'google.user@example.com';
      name = 'Google User';
      avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face';
    }

    let user = findUserByEmail(email);

    if (!user) {
      // Create new Google user automatically without requiring password
      user = createUser({
        email,
        name: name || email.split('@')[0],
        provider: 'google',
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
      });
    } else {
      // Existing user: ensure avatar or provider info is fresh
      if (avatarUrl && !user.avatarUrl) {
        user = updateUser(user.id, { avatarUrl });
      }
    }

    const token = await createSessionToken(user);
    const response = NextResponse.json({
      success: true,
      message: 'Google authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
      },
      redirectTo: '/dashboard',
    });

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error('Google Sign-In error:', error);
    return NextResponse.json(
      { error: 'Google authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}
