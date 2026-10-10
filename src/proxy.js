import { NextResponse } from 'next/server';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  
  // Check for session cookies (custom session cookie or Supabase auth token)
  const allCookies = request.cookies.getAll();
  const hasSupabaseSession = allCookies.some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token') && Boolean(c.value));
  const hasLegacyToken = request.cookies.has('chardiwari_session') && Boolean(request.cookies.get('chardiwari_session')?.value);
  const isAuthenticated = hasSupabaseSession || hasLegacyToken;

  // Redirect /dashboard to /profile
  if (pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // Protect /profile routes: redirect unauthenticated users to /auth with redirect param
  if (pathname.startsWith('/profile')) {
    if (!isAuthenticated) {
      const authUrl = new URL('/auth', request.url);
      authUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(authUrl);
    }
  }

  // Prevent authenticated users from visiting /auth: return them to where they came from or home
  if (pathname === '/auth') {
    if (isAuthenticated) {
      const redirect = request.nextUrl.searchParams.get('redirect');
      const target = (redirect && redirect !== '/dashboard' && redirect !== '/auth') ? redirect : '/';
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/dashboard/:path*', '/auth'],
};
