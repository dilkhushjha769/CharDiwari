import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code       = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type       = searchParams.get('type') || 'signup';
  const rawNext    = searchParams.get('next');
  const next       = (rawNext && rawNext !== '/dashboard' && rawNext !== '/auth') ? rawNext : '/';
  // Supabase sometimes returns ?error= & ?error_description= directly
  const oauthError = searchParams.get('error');
  const oauthDesc  = searchParams.get('error_description');

  // Surface Supabase OAuth errors back to the auth page
  if (oauthError) {
    const msg = oauthDesc
      ? encodeURIComponent(oauthDesc.replaceAll('+', ' '))
      : encodeURIComponent(oauthError);
    return NextResponse.redirect(`${origin}/auth?error=${msg}`);
  }

  // 1. If PKCE authorization code is present (OAuth / PKCE flow)
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.set('chardiwari_session', 'true', {
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
        sameSite: 'lax',
      });
      return response;
    }
    const msg = encodeURIComponent(error.message || 'Authentication failed');
    return NextResponse.redirect(`${origin}/auth?error=${msg}`);
  }

  // 2. If token_hash is present (Supabase email confirmation link)
  if (token_hash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.set('chardiwari_session', 'true', {
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
        sameSite: 'lax',
      });
      return response;
    }
    const msg = encodeURIComponent(error.message || 'Verification link expired or invalid');
    return NextResponse.redirect(`${origin}/auth?error=${msg}`);
  }

  // 3. Implicit hash fragment flow (#access_token=...&refresh_token=...):
  // The server cannot see hash fragments. Serve a client HTML script to parse the hash,
  // set session cookie, and redirect to the dashboard without kicking the user out.
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Signing In • Dwarkesh</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      max-width: 420px;
      width: 100%;
      text-align: center;
      padding: 2.5rem 2rem;
      border-radius: 1.5rem;
      border: 1px solid #e4e4e7;
      box-shadow: 0 20px 50px rgba(0,0,0,0.06);
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #f4f4f5;
      border-top-color: #000;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: #000; }
    p { font-size: 0.875rem; color: #71717a; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h1>Signing In</h1>
    <p>Confirming your session, please wait...</p>
  </div>
  <script>
    (function() {
      var nextPath = ${JSON.stringify(next)};
      var hash = window.location.hash || '';

      if (hash && (hash.indexOf('access_token=') !== -1 || hash.indexOf('refresh_token=') !== -1)) {
        var params = new URLSearchParams(hash.substring(1));
        var accessToken = params.get('access_token');
        var expiresIn = params.get('expires_in') || '604800';
        if (accessToken) {
          document.cookie = 'chardiwari_session=true; path=/; max-age=' + expiresIn + '; SameSite=Lax';
        }
        setTimeout(function() {
          window.location.replace(nextPath);
        }, 300);
        return;
      }

      // Check if session cookie or storage exists
      var hasCookie = document.cookie.indexOf('chardiwari_session') !== -1 || document.cookie.indexOf('-auth-token') !== -1;
      if (hasCookie) {
        window.location.replace(nextPath);
        return;
      }

      // Allow brief moment for client-side SDK detection, then redirect
      setTimeout(function() {
        document.cookie = 'chardiwari_session=true; path=/; max-age=604800; SameSite=Lax';
        window.location.replace(nextPath);
      }, 500);
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
