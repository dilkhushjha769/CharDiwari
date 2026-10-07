import { NextResponse } from 'next/server';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  
  // Check for session cookies (custom session cookie or Supabase auth token)
  const allCookies = request.cookies.getAll();
  const hasSupabaseSession = allCookies.some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token') && Boolean(c.value));
  const hasLegacyToken = request.cookies.has('chardiwari_session') && Boolean(request.cookies.get('chardiwari_session')?.value);
  const isAuthenticated = hasSupabaseSession || hasLegacyToken;

  // Protect /dashboard routes: redirect unauthenticated users to /auth
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const authUrl = new URL('/auth', request.url);
      authUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(authUrl);
    }
  }

  // Prevent authenticated users from visiting /auth if already logged in
  if (pathname === '/auth') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth'],
};
