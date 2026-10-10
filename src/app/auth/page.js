'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Mail, ExternalLink, CheckCircle2 } from 'lucide-react';
import { getSupabaseClient, getSupabaseConfig } from '@/lib/supabase/client';

// ─── Country Codes ─────────────────────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { code: 'US', dial: '+1',  flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'AE', dial: '+971',flag: '🇦🇪', name: 'UAE' },
  { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: 'CA', dial: '+1',  flag: '🇨🇦', name: 'Canada' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan' },
];

// ─── Password strength helper ──────────────────────────────────────────────────
function getStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^a-zA-Z0-9]/.test(pwd)) s++;
  return s;
}
const strengthLabel  = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

// ─── OTP Box Component ─────────────────────────────────────────────────────────
function OtpBoxes({ digits, setDigits, onComplete, shaking }) {
  const refs = useRef([]);

  const handleChange = (i, val) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length > 1) {
      // paste handling
      const arr = clean.slice(0, 6).split('');
      const next = [...digits];
      arr.forEach((c, idx) => { next[idx] = c; });
      setDigits(next);
      const focusIdx = Math.min(arr.length, 5);
      refs.current[focusIdx]?.focus();
      if (arr.length === 6) onComplete(arr.join(''));
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
    if (clean && i === 5) {
      const full = next.join('');
      if (full.length === 6) onComplete(full);
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const arr = text.split('');
    const next = [...digits];
    arr.forEach((c, i) => { next[i] = c; });
    setDigits(next);
    refs.current[Math.min(arr.length, 5)]?.focus();
    if (arr.length === 6) onComplete(text);
  };

  return (
    <div className={`flex gap-3 justify-center ${shaking ? 'animate-shake' : ''}`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className={`w-11 h-12 text-center text-lg font-semibold rounded-xl border-2 outline-none transition-all duration-150 light-input
            ${d ? 'border-black bg-white text-black shadow-sm animate-otp-bounce'
                : 'border-zinc-200 bg-zinc-50 text-black focus:border-black focus:bg-white'}`}
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ─── Development Logger (Zero sensitive data logged) ──────────────────────────
const devLog = (message, meta) => {
  if (process.env.NODE_ENV !== 'production') {
    if (meta) {
      console.log(`[Dwarkesh Auth] ${message}`, meta);
    } else {
      console.log(`[Dwarkesh Auth] ${message}`);
    }
  }
};

// ─── Cooldown Storage Helpers (Persisted in sessionStorage) ───────────────────
const COOLDOWN_KEY_PREFIX = 'cd_auth_cooldown_';

const getRemainingCooldown = (actionKey) => {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = sessionStorage.getItem(`${COOLDOWN_KEY_PREFIX}${actionKey}`);
    if (!raw) return 0;
    const expiresAt = parseInt(raw, 10);
    const now = Date.now();
    if (expiresAt > now) {
      return Math.ceil((expiresAt - now) / 1000);
    }
    sessionStorage.removeItem(`${COOLDOWN_KEY_PREFIX}${actionKey}`);
  } catch {}
  return 0;
};

const setCooldown = (actionKey, seconds) => {
  if (typeof window === 'undefined') return;
  try {
    const expiresAt = Date.now() + seconds * 1000;
    sessionStorage.setItem(`${COOLDOWN_KEY_PREFIX}${actionKey}`, expiresAt.toString());
  } catch {}
};

// ─── Rate Limit Detection & Duration Extraction ──────────────────────────────
const isRateLimitError = (error) => {
  if (!error) return false;
  return (
    error.status === 429 ||
    error.code === 'over_email_send_rate_limit' ||
    error.code === 'over_sms_send_rate_limit' ||
    error.code === 'rate_limit' ||
    /too many requests|rate limit|security purposes/i.test(error.message || '')
  );
};

const parseRetryAfterSeconds = (error, defaultSeconds = 60) => {
  if (!error) return defaultSeconds;
  if (typeof error.retry_after === 'number' && error.retry_after > 0) {
    return Math.ceil(error.retry_after);
  }
  const msg = error.message || '';
  const match = msg.match(/(?:after|in|wait)\s+(\d+)\s*(?:seconds?|s)?/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return defaultSeconds;
};

// ─── Main Auth Content ─────────────────────────────────────────────────────────
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get('redirect');
  const redirectPath = (redirectParam && redirectParam !== '/dashboard' && redirectParam !== '/auth') ? redirectParam : '/';
  const urlError    = searchParams?.get('error') || '';

  // ── Screens: 'HOME' | 'EMAIL_PASS' | 'PHONE' | 'OTP' | 'SIGNUP' | 'FORGOT' | 'EMAIL_SENT'
  const [screen, setScreen] = useState('HOME');
  // HOME tab: 'email' | 'phone' (default to email)
  const [homeTab, setHomeTab] = useState('email');

  // Fields
  const [email,          setEmail]          = useState('');
  const [phone,          setPhone]          = useState('');
  const [countryIdx,     setCountryIdx]     = useState(0);
  const [showCountries,  setShowCountries]  = useState(false);
  const [password,       setPassword]       = useState('');
  const [showPassword,   setShowPassword]   = useState(false);
  const [confirmPwd,     setConfirmPwd]     = useState('');
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [fullName,       setFullName]       = useState('');
  const [otpDigits,      setOtpDigits]      = useState(['','','','','','']);
  const [otpContext,     setOtpContext]      = useState('signup'); // 'signup'|'phone'|'reset'
  const [countdown,      setCountdown]      = useState(0);

  // Status
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(urlError);
  const [success,        setSuccess]        = useState('');
  const [otpShaking,     setOtpShaking]     = useState(false);

  // Wrapped setError that also records the email address that caused the error
  const setErrorWithEmail = (msg) => {
    lastErrorEmailRef.current = email;
    setError(msg);
  };

  // Synchronous in-flight request guard to eliminate race conditions & double-clicks
  const isBusyRef = useRef(false);
  // Track which email was used when the current error was set, so we can clear
  // stale rate-limit messages the instant the user edits the email field.
  const lastErrorEmailRef = useRef('');

  // Wrapper: update email and clear any error tied to the old email value
  const handleEmailChange = (newVal) => {
    setEmail(newVal);
    if (error && newVal.trim() !== lastErrorEmailRef.current.trim()) {
      setError('');
      setSuccess('');
    }
  };

  // 1-second interval to keep UI cooldown indicators perfectly in sync with storage
  const [, setCooldownTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCooldownTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Supabase config
  const [supaConf] = useState(() => getSupabaseConfig());

  const country = COUNTRY_CODES[countryIdx];
  const strength = getStrength(password);

  // Cooldown values computed for current render
  const signupCooldown = getRemainingCooldown('signup');
  const phoneCooldown  = getRemainingCooldown('phone');
  const forgotCooldown = getRemainingCooldown('forgot');
  const signinCooldown = getRemainingCooldown('signin');
  const resendCooldown = getRemainingCooldown(otpContext === 'phone' ? 'phone' : 'resend');
  const canResend = countdown <= 0 && resendCooldown <= 0;

  // Listen for Supabase session
  useEffect(() => {
    const { client } = getSupabaseClient();
    if (!client) return;
    client.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (typeof document !== 'undefined') {
          document.cookie = 'chardiwari_session=true; path=/; max-age=604800; SameSite=Lax';
        }
        router.push(redirectPath);
      }
    });
    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        if (typeof document !== 'undefined') {
          document.cookie = 'chardiwari_session=true; path=/; max-age=604800; SameSite=Lax';
        }
        router.push(redirectPath);
      }
    });
    return () => sub?.subscription?.unsubscribe();
  }, [router, redirectPath]);

  // OTP countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => {
      setCountdown(c => c - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const clearMessages = () => { setError(''); setSuccess(''); };

  const go = (s) => { clearMessages(); setScreen(s); };

  // ── helpers
  const needsConfig = () => {
    if (!supaConf.isConfigured) {
      setError('Service is temporarily unavailable. Please try again later.');
      return true;
    }
    return false;
  };

  const startOtp = (ctx, seconds = 60) => {
    setOtpDigits(['','','','','','']);
    setOtpContext(ctx);
    setCountdown(seconds);
    clearMessages();
    setScreen('OTP');
  };

  // ── Google OAuth
  const handleGoogle = async () => {
    if (isBusyRef.current) {
      devLog('Auth request blocked: request in progress', { action: 'oauth' });
      return;
    }
    if (needsConfig()) return;

    isBusyRef.current = true;
    setLoading(true);
    clearMessages();
    devLog('Auth request started: oauth');

    try {
      const { client } = getSupabaseClient();
      const { error: e } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirectPath}` },
      });
      if (e) {
        if (isRateLimitError(e)) {
          const waitSec = parseRetryAfterSeconds(e, 60);
          devLog('Auth request blocked: rate limit', { action: 'oauth', waitSec });
          setError(`Too many requests. Please wait ${waitSec} seconds before trying again.`);
        } else {
          setError(e.message);
        }
      }
    } finally {
      isBusyRef.current = false;
      setLoading(false);
    }
  };

  // ── Phone: send OTP
  const handlePhoneContinue = async (e) => {
    e.preventDefault();
    if (isBusyRef.current) {
      devLog('Auth request blocked: request in progress', { action: 'phone_otp' });
      return;
    }
    const rem = getRemainingCooldown('phone');
    if (rem > 0) {
      devLog('Auth request blocked: cooldown', { action: 'phone_otp', remaining: rem });
      setError(`Too many requests. Please wait ${rem} seconds before requesting another SMS code.`);
      return;
    }
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }
    if (needsConfig()) return;

    isBusyRef.current = true;
    setLoading(true);
    clearMessages();
    devLog('Auth request started: phone_otp');

    try {
      const { client } = getSupabaseClient();
      const fullPhone = `${country.dial}${phone.replace(/\s/g,'')}`;
      const { error: e2 } = await client.auth.signInWithOtp({ phone: fullPhone });
      if (e2) {
        if (isRateLimitError(e2)) {
          const waitSec = parseRetryAfterSeconds(e2, 60);
          setCooldown('phone', waitSec);
          devLog('Auth request blocked: rate limit', { action: 'phone_otp', waitSec });
          setError(`Too many requests. Please wait ${waitSec} seconds before trying again.`);
          return;
        }
        setError(e2.message);
        return;
      }
      setCooldown('phone', 60);
      devLog('Auth request completed: phone_otp');
      startOtp('phone', 60);
    } finally {
      isBusyRef.current = false;
      setLoading(false);
    }
  };

  // ── Helper to remember registered emails locally ───────────────────────────
  const recordRegisteredEmail = (regEmail) => {
    try {
      if (typeof window !== 'undefined' && regEmail) {
        const key = 'chardiwari_registered_emails';
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        const norm = regEmail.toLowerCase().trim();
        if (!list.includes(norm)) {
          list.push(norm);
          localStorage.setItem(key, JSON.stringify(list));
        }
      }
    } catch {}
  };

  // ── Email continue: instant navigation without triggering any auth API calls
  const handleEmailContinue = (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    clearMessages();
    go('EMAIL_PASS');
  };

  // ── Email+Password sign in
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (isBusyRef.current) {
      devLog('Auth request blocked: request in progress', { action: 'signin' });
      return;
    }
    const rem = getRemainingCooldown('signin');
    if (rem > 0) {
      devLog('Auth request blocked: cooldown', { action: 'signin', remaining: rem });
      setError(`Too many requests. Please wait ${rem} seconds before trying again.`);
      return;
    }
    if (!password) { setError('Enter your password.'); return; }
    if (needsConfig()) return;

    isBusyRef.current = true;
    setLoading(true);
    clearMessages();
    devLog('Auth request started: signin');

    try {
      const { client } = getSupabaseClient();
      const cleanEmail = email.trim();
      const { error: e2 } = await client.auth.signInWithPassword({ email: cleanEmail, password });

      if (e2) {
        if (isRateLimitError(e2)) {
          const waitSec = parseRetryAfterSeconds(e2, 60);
          setCooldown('signin', waitSec);
          devLog('Auth request blocked: rate limit', { action: 'signin', waitSec });
          setErrorWithEmail(`Too many requests. Please wait ${waitSec} seconds before trying again.`);
          return;
        }

        if (
          e2.code === 'invalid_credentials' ||
          e2.message?.toLowerCase().includes('invalid login credentials') ||
          e2.message?.toLowerCase().includes('invalid credentials')
        ) {
          setErrorWithEmail('Email is not registered or incorrect password. Please sign up to create an account.');
          return;
        }

        setErrorWithEmail(e2.message);
        return;
      }

      if (typeof document !== 'undefined') {
        document.cookie = 'chardiwari_session=true; path=/; max-age=604800; SameSite=Lax';
      }
      recordRegisteredEmail(cleanEmail);
      devLog('Auth request completed: signin');
      setSuccess('Welcome back! Logging in...');
      setTimeout(() => router.push(redirectPath), 500);
    } finally {
      isBusyRef.current = false;
      setLoading(false);
    }
  };

  // ── Sign up: send email verification / create account
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (isBusyRef.current) {
      devLog('Auth request blocked: request in progress', { action: 'signup' });
      return;
    }
    const rem = getRemainingCooldown('signup');
    if (rem > 0) {
      devLog('Auth request blocked: cooldown', { action: 'signup', remaining: rem });
      setError(`Too many requests. Please wait ${rem} seconds before trying again.`);
      return;
    }
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!email.includes('@')) { setError('Enter a valid email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPwd) { setError('Passwords do not match.'); return; }
    if (needsConfig()) return;

    isBusyRef.current = true;
    setLoading(true);
    clearMessages();
    devLog('Auth request started: signup');

    try {
      const { client } = getSupabaseClient();
      const cleanEmail = email.trim();
      const { data, error: e2 } = await client.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectPath}`,
        },
      });

      if (e2) {
        if (isRateLimitError(e2)) {
          const waitSec = parseRetryAfterSeconds(e2, 60);
          setCooldown('signup', waitSec);
          devLog('Auth request blocked: rate limit', { action: 'signup', waitSec });
          setErrorWithEmail(`Too many requests. Please wait ${waitSec} seconds before trying again.`);
          return;
        }
        setErrorWithEmail(e2.message);
        return;
      }

      // Check if user already exists (identities array is empty in Supabase when enumeration protection is active)
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        devLog('Auth request completed: signup (existing user detected)');
        setErrorWithEmail('An account with this email already exists. Please sign in instead.');
        return;
      }

      recordRegisteredEmail(cleanEmail);
      // Cooldown enforced on successful signup action
      setCooldown('signup', 60);

      if (data?.session) {
        devLog('Auth request completed: signup (session established)');
        if (typeof document !== 'undefined') {
          document.cookie = 'chardiwari_session=true; path=/; max-age=604800; SameSite=Lax';
        }
        setSuccess('Account created! Welcome to Dwarkesh...');
        setTimeout(() => router.push(redirectPath), 600);
      } else {
        devLog('Auth request completed: signup (verification email sent)');
        setCooldown('resend', 60);
        setCountdown(60);
        clearMessages();
        setScreen('EMAIL_SENT');
      }
    } finally {
      isBusyRef.current = false;
      setLoading(false);
    }
  };

  // ── Resend email confirmation link
  const handleResendEmailLink = async () => {
    if (isBusyRef.current) return;
    const rem = getRemainingCooldown('resend');
    if (rem > 0) {
      setError(`Please wait ${rem} seconds before requesting another email.`);
      return;
    }
    isBusyRef.current = true;
    setLoading(true);
    clearMessages();
    try {
      const { client } = getSupabaseClient();
      const cleanEmail = email.trim();
      const { error: e2 } = await client.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectPath}`,
        },
      });
      if (e2) {
        if (isRateLimitError(e2)) {
          const waitSec = parseRetryAfterSeconds(e2, 60);
          setCooldown('resend', waitSec);
          setCountdown(waitSec);
          setError(`Too many requests. Please wait ${waitSec} seconds before requesting another email.`);
          return;
        }
        setError(e2.message);
        return;
      }
      setCooldown('resend', 60);
      setCountdown(60);
      setSuccess(`A new confirmation link was sent to ${cleanEmail}.`);
    } finally {
      isBusyRef.current = false;
      setLoading(false);
    }
  };

  // ── Forgot password
  const handleForgot = async (e) => {
    e.preventDefault();
    if (isBusyRef.current) {
      devLog('Auth request blocked: request in progress', { action: 'forgot_password' });
      return;
    }
    const rem = getRemainingCooldown('forgot');
    if (rem > 0) {
      devLog('Auth request blocked: cooldown', { action: 'forgot_password', remaining: rem });
      setError(`Too many requests. Please wait ${rem} seconds before requesting another link.`);
      return;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail.includes('@')) { setError('Enter a valid email address.'); return; }
    if (needsConfig()) return;

    isBusyRef.current = true;
    setLoading(true);
    clearMessages();
    devLog('Auth request started: forgot_password');

    try {
      const { client } = getSupabaseClient();
      const { error: e2 } = await client.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectPath}`,
      });

      if (e2) {
        if (isRateLimitError(e2)) {
          const waitSec = parseRetryAfterSeconds(e2, 60);
          setCooldown('forgot', waitSec);
          devLog('Auth request blocked: rate limit', { action: 'forgot_password', waitSec });
          setErrorWithEmail(`Too many requests. Please wait ${waitSec} seconds before trying again.`);
          return;
        }
        setErrorWithEmail(e2.message);
        return;
      }

      setCooldown('forgot', 60);
      devLog('Auth request completed: forgot_password');
      setSuccess(`Recovery link sent to ${cleanEmail}. Check your inbox.`);
    } finally {
      isBusyRef.current = false;
      setLoading(false);
    }
  };

  // ── Verify OTP
  const handleVerifyOtp = async (code) => {
    if (code.length !== 6) return;
    if (isBusyRef.current) {
      devLog('Auth request blocked: request in progress', { action: 'verify_otp' });
      return;
    }

    isBusyRef.current = true;
    setLoading(true);
    clearMessages();
    devLog('Auth request started: verify_otp');

    try {
      const { client } = getSupabaseClient();
      let result;
      if (otpContext === 'phone') {
        const fullPhone = `${country.dial}${phone.replace(/\s/g,'')}`;
        result = await client.auth.verifyOtp({ phone: fullPhone, token: code, type: 'sms' });
      } else {
        result = await client.auth.verifyOtp({ email: email.trim(), token: code, type: 'signup' });
      }

      if (result.error) {
        if (isRateLimitError(result.error)) {
          const waitSec = parseRetryAfterSeconds(result.error, 60);
          devLog('Auth request blocked: rate limit', { action: 'verify_otp', waitSec });
          setError(`Too many requests. Please wait ${waitSec} seconds before trying again.`);
        } else {
          setError(result.error.message);
        }
        setOtpShaking(true);
        setTimeout(() => setOtpShaking(false), 400);
        return;
      }

      recordRegisteredEmail(email.trim());
      devLog('Auth request completed: verify_otp');
      setSuccess('Verified! Logging in...');
      setTimeout(() => router.push(redirectPath), 700);
    } finally {
      isBusyRef.current = false;
      setLoading(false);
    }
  };

  // ── Resend OTP
  const handleResend = async () => {
    if (isBusyRef.current) {
      devLog('Auth request blocked: request in progress', { action: 'resend_otp' });
      return;
    }
    const cooldownKey = otpContext === 'phone' ? 'phone' : 'resend';
    const rem = getRemainingCooldown(cooldownKey);
    if (rem > 0) {
      devLog('Auth request blocked: cooldown', { action: 'resend_otp', remaining: rem });
      setError(`Too many requests. Please wait ${rem} seconds before requesting another code.`);
      return;
    }
    if (!canResend) return;

    isBusyRef.current = true;
    setLoading(true);
    clearMessages();
    devLog('Auth request started: resend_otp');

    try {
      const { client } = getSupabaseClient();
      let res;
      if (otpContext === 'phone') {
        const fullPhone = `${country.dial}${phone.replace(/\s/g,'')}`;
        res = await client.auth.signInWithOtp({ phone: fullPhone });
      } else {
        res = await client.auth.resend({ email: email.trim(), type: 'signup' });
      }

      if (res?.error) {
        if (isRateLimitError(res.error)) {
          const waitSec = parseRetryAfterSeconds(res.error, 60);
          setCooldown(cooldownKey, waitSec);
          setCountdown(waitSec);
          setCanResend(false);
          devLog('Auth request blocked: rate limit', { action: 'resend_otp', waitSec });
          setError(`Too many requests. Please wait ${waitSec} seconds before requesting another code.`);
          return;
        }
        setError(res.error.message);
        return;
      }

      devLog('Auth request completed: resend_otp');
      setCooldown(cooldownKey, 60);
      setCountdown(60);
      setOtpDigits(['','','','','','']);
      setSuccess('New code sent.');
    } finally {
      isBusyRef.current = false;
      setLoading(false);
    }
  };

  const inputBase = "w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-black placeholder-zinc-400 text-[15px] outline-none transition-all duration-150 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] light-input";

  return (
    <div className="min-h-screen bg-white bg-grid-light flex flex-col selection:bg-black selection:text-white">
      {/* Top bar */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/dwarkesh-logo-transparent.png"
              alt="Dwarkesh Real Estate Group"
              className="h-8 w-auto max-w-[50px] object-contain transition-transform group-hover:scale-105 drop-shadow-xs"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold tracking-[0.14em] text-black text-sm uppercase leading-none">
                Dwarkesh
              </span>
              <span className="text-[9px] font-semibold tracking-[0.20em] text-zinc-500 uppercase font-sans mt-0.5">
                Real Estate Group
              </span>
            </div>
          </Link>

          <div className="flex items-center">
            <Link href="/" className="text-xs font-mono text-zinc-500 hover:text-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition">
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </Link>
          </div>
        </div>
      </header>

      {/* Center card */}
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-[420px]">

          {/* ──── SCREEN: HOME ──── */}
          {screen === 'HOME' && (
            <div className="auth-panel rounded-3xl border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-8 animate-fade-in-up">
              {/* Title */}
              <div className="mb-7 text-center">
                <h1 className="text-[28px] font-bold tracking-tight text-black mb-1">
                  Sign in to Dwarkesh
                </h1>
                <p className="text-sm text-zinc-500 font-light">
                  Find &amp; manage your dream home
                </p>
              </div>

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-black text-[15px] font-medium transition-all duration-150 hover:shadow-sm mb-5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-zinc-100" />
                <span className="text-xs text-zinc-400 font-medium">or</span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>

              {/* Email / Phone Tabs (Email default) */}
              <div className="flex rounded-xl border border-zinc-200 overflow-hidden mb-4">
                <button
                  type="button"
                  onClick={() => { setHomeTab('email'); clearMessages(); }}
                  className={`flex-1 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                    homeTab === 'email'
                      ? 'bg-black text-white'
                      : 'bg-white text-zinc-500 hover:text-black'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => { setHomeTab('phone'); clearMessages(); }}
                  className={`flex-1 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                    homeTab === 'phone'
                      ? 'bg-black text-white'
                      : 'bg-white text-zinc-500 hover:text-black'
                  }`}
                >
                  Phone number
                </button>
              </div>

              {/* Phone input */}
              {homeTab === 'phone' && (
                <form onSubmit={handlePhoneContinue} className="space-y-3 animate-slide-in">
                  <div className="flex gap-2">
                    {/* Country selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountries(!showCountries)}
                        className="flex items-center gap-1.5 h-full px-3 rounded-xl border border-zinc-200 bg-white text-black text-sm font-medium hover:border-black transition min-w-[80px] justify-center whitespace-nowrap"
                      >
                        <span className="text-base">{country.flag}</span>
                        <span>{country.dial}</span>
                        <span className="text-zinc-400 text-xs">▾</span>
                      </button>
                      {showCountries && (
                        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden min-w-[220px]">
                          {COUNTRY_CODES.map((c, i) => (
                            <button
                              key={c.code + c.dial}
                              type="button"
                              onClick={() => { setCountryIdx(i); setShowCountries(false); }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-zinc-50 transition ${i === countryIdx ? 'font-semibold text-black' : 'text-zinc-700'}`}
                            >
                              <span className="text-base">{c.flag}</span>
                              <span className="flex-1">{c.name}</span>
                              <span className="text-zinc-400 font-mono">{c.dial}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Phone number"
                      className={inputBase + ' light-input'}
                      autoComplete="tel"
                      required
                    />
                  </div>
                  <button type="button" className="text-sm text-zinc-500 hover:text-black underline underline-offset-2 transition">
                    Lost access to phone number
                  </button>
                  {error && <p className="text-[13px] text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading || !phone.trim() || phoneCooldown > 0}
                    className="w-full py-3 rounded-xl bg-black text-white text-[15px] font-semibold transition-all hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : phoneCooldown > 0 ? `Wait (${phoneCooldown}s)` : 'Continue'}
                  </button>
                </form>
              )}

              {/* Email input */}
              {homeTab === 'email' && (
                <form onSubmit={handleEmailContinue} className="space-y-3 animate-slide-in">
                  <input
                    type="email"
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    placeholder="Type your email"
                    className={inputBase}
                    autoComplete="email"
                    required
                  />
                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-600 animate-shake flex flex-col gap-1.5 text-left">
                      <p>{error}</p>
                      {error.toLowerCase().includes('not registered') && (
                        <button
                          type="button"
                          onClick={() => { clearMessages(); go('SIGNUP'); }}
                          className="text-xs text-black font-semibold underline underline-offset-2 text-left hover:opacity-80 transition cursor-pointer"
                        >
                          Sign up with this email instead →
                        </button>
                      )}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full py-3 rounded-xl bg-black text-white text-[15px] font-semibold transition-all hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Continue with email'}
                  </button>
                </form>
              )}

              {/* Footer */}
              <p className="text-center text-sm text-zinc-500 mt-6">
                Don&apos;t have an account?{' '}
                <button onClick={() => go('SIGNUP')} className="text-black font-semibold hover:underline underline-offset-2">
                  Sign up
                </button>
              </p>
            </div>
          )}

          {/* ──── SCREEN: EMAIL + PASSWORD (Sign in) ──── */}
          {screen === 'EMAIL_PASS' && (
            <div className="auth-panel rounded-3xl border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-8 animate-fade-in-up">
              <button onClick={() => { setHomeTab('email'); go('HOME'); }} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-black transition mb-6">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <h1 className="text-[26px] font-bold tracking-tight text-black mb-1">Welcome back</h1>
              <p className="text-sm text-zinc-500 mb-6">Signed in as <span className="font-medium text-black">{email}</span></p>

              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-600 animate-shake flex flex-col gap-1.5 text-left">
                  <p>{error}</p>
                  {error.toLowerCase().includes('not registered') && (
                    <button
                      type="button"
                      onClick={() => { clearMessages(); go('SIGNUP'); }}
                      className="text-xs text-black font-semibold underline underline-offset-2 text-left hover:opacity-80 transition cursor-pointer"
                    >
                      Sign up with this email instead →
                    </button>
                  )}
                </div>
              )}
              {success && <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-[13px] text-green-700">{success}</div>}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={inputBase + ' pr-12'}
                    autoComplete="current-password"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition text-xs font-medium"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={() => go('FORGOT')} className="text-sm text-zinc-500 hover:text-black underline underline-offset-2 transition">
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || signinCooldown > 0}
                  className="w-full py-3 rounded-xl bg-black text-white text-[15px] font-semibold transition-all hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : signinCooldown > 0 ? `Wait (${signinCooldown}s)` : 'Sign in'}
                </button>
              </form>

              <p className="text-center text-sm text-zinc-500 mt-6">
                New here?{' '}
                <button onClick={() => go('SIGNUP')} className="text-black font-semibold hover:underline underline-offset-2">
                  Create account
                </button>
              </p>
            </div>
          )}

          {/* ──── SCREEN: SIGN UP ──── */}
          {screen === 'SIGNUP' && (
            <div className="auth-panel rounded-3xl border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-8 animate-fade-in-up">
              <button onClick={() => { setHomeTab('email'); go('HOME'); }} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-black transition mb-6">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <h1 className="text-[26px] font-bold tracking-tight text-black mb-1">Create your account</h1>
              <p className="text-sm text-zinc-500 mb-6">Join Dwarkesh today.</p>

              {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">{error}</div>}
              {success && <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-[13px] text-green-700">{success}</div>}

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-black text-[15px] font-medium transition mb-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-zinc-100" />
                <span className="text-xs text-zinc-400 font-medium">or</span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>

              <form onSubmit={handleSignUp} className="space-y-3">
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Full name"
                  className={inputBase}
                  autoComplete="name"
                  required
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  placeholder="Email address"
                  className={inputBase}
                  autoComplete="email"
                  required
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Create password"
                    className={inputBase + ' pr-12'}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition text-xs font-medium"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    placeholder="Confirm password"
                    className={inputBase + ' pr-12'}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition text-xs font-medium"
                  >
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
                {/* Password strength bar shown at last */}
                {password && (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(n => (
                        <div key={n} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{ backgroundColor: strength >= n ? strengthColors[strength] : '#e5e7eb' }} />
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span style={{ color: strengthColors[strength] }} className="font-medium">
                        {strengthLabel[strength]} password
                      </span>
                      {confirmPwd && password !== confirmPwd && (
                        <span className="text-red-500 font-medium">Passwords do not match</span>
                      )}
                      {confirmPwd && password === confirmPwd && (
                        <span className="text-emerald-600 font-medium">Passwords match ✓</span>
                      )}
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || signupCooldown > 0}
                  className="w-full py-3 rounded-xl bg-black text-white text-[15px] font-semibold transition-all hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : signupCooldown > 0 ? `Wait (${signupCooldown}s)` : 'Create account'}
                </button>
              </form>

              <p className="text-center text-sm text-zinc-500 mt-5">
                Already have an account?{' '}
                <button onClick={() => { setHomeTab('email'); go('HOME'); }} className="text-black font-semibold hover:underline underline-offset-2 cursor-pointer">
                  Sign in
                </button>
              </p>
              <p className="text-center text-[11px] text-zinc-400 mt-3">
                By creating an account you agree to our{' '}
                <span className="underline underline-offset-2 cursor-pointer hover:text-black">Terms</span>
                {' '}&amp;{' '}
                <span className="underline underline-offset-2 cursor-pointer hover:text-black">Privacy Policy</span>.
              </p>
            </div>
          )}

          {/* ──── SCREEN: EMAIL SENT (VERIFICATION LINK) ──── */}
          {screen === 'EMAIL_SENT' && (
            <div className="auth-panel rounded-3xl border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-8 text-center animate-fade-in-up">
              {/* Header Icon */}
              <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Mail className="w-8 h-8" />
              </div>

              <h1 className="text-[26px] font-bold text-black tracking-tight mb-2">
                Check your inbox
              </h1>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                We sent a verification link to:<br />
                <span className="font-semibold text-black break-all">{email}</span>
              </p>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-left mb-6 text-xs text-zinc-600 space-y-1.5">
                <p className="font-semibold text-black flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Click the link to activate your account
                </p>
                <p className="text-zinc-500">
                  Clicking the confirmation link will activate your account and log you in.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600 animate-shake">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-[13px] text-green-700">
                  {success}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                {/* Open Gmail Button */}
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-black text-white text-[15px] font-semibold transition-all hover:bg-zinc-800 flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Open Gmail</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
                </a>

                {/* Verified Button */}
                <button
                  type="button"
                  onClick={async () => {
                    const { client } = getSupabaseClient();
                    if (client) {
                      const { data: { session } } = await client.auth.getSession();
                      if (session) {
                        if (typeof document !== 'undefined') {
                          document.cookie = 'chardiwari_session=true; path=/; max-age=604800; SameSite=Lax';
                        }
                        setSuccess('Verified! Logging in...');
                        setTimeout(() => router.push(redirectPath), 500);
                        return;
                      }
                    }
                    setError('Account not yet confirmed. Please click the link in your email.');
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-black text-sm font-medium transition cursor-pointer"
                >
                  I&apos;ve verified my email →
                </button>
              </div>

              {/* Resend Link */}
              <p className="text-sm text-zinc-500">
                Didn&apos;t get the email?{' '}
                {canResend && resendCooldown <= 0 ? (
                  <button
                    type="button"
                    onClick={handleResendEmailLink}
                    disabled={loading}
                    className="text-black font-semibold hover:underline underline-offset-2 disabled:opacity-50 cursor-pointer"
                  >
                    Resend confirmation link
                  </button>
                ) : (
                  <span className="text-zinc-400">
                    Resend in <span className="font-mono font-semibold text-black">{Math.max(countdown, resendCooldown)}s</span>
                  </span>
                )}
              </p>

              <button
                type="button"
                onClick={() => go('SIGNUP')}
                className="mt-6 flex items-center gap-1.5 text-sm text-zinc-400 hover:text-black transition mx-auto cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Wrong email? Change email
              </button>
            </div>
          )}

          {/* ──── SCREEN: OTP VERIFICATION ──── */}
          {screen === 'OTP' && (
            <div className="auth-panel rounded-3xl border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-8 text-center animate-fade-in-up">
              <div className="mb-7">
                <h1 className="text-[28px] font-bold text-black tracking-tight mb-2">
                  {otpContext === 'phone' ? 'We texted you a code' : 'We emailed you a code'}
                </h1>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Enter the verification code sent to:<br />
                  <span className="font-semibold text-black">
                    {otpContext === 'phone'
                      ? `${country.flag} ${country.dial} ${phone}`
                      : email}
                  </span>
                </p>
              </div>

              {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600 animate-shake">{error}</div>}
              {success && <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-[13px] text-green-700">{success}</div>}

              <div className="mb-6">
                <OtpBoxes
                  digits={otpDigits}
                  setDigits={setOtpDigits}
                  onComplete={handleVerifyOtp}
                  shaking={otpShaking}
                />
                {loading && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-sm text-zinc-500">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                )}
              </div>

              {/* Resend */}
              <p className="text-sm text-zinc-500">
                Didn&apos;t get your code?{' '}
                {canResend && resendCooldown <= 0 ? (
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-black font-semibold hover:underline underline-offset-2 disabled:opacity-50 cursor-pointer"
                  >
                    Send a new code
                  </button>
                ) : (
                  <span className="text-zinc-400">
                    Resend in <span className="font-mono font-semibold text-black">{Math.max(countdown, resendCooldown)}s</span>
                  </span>
                )}
              </p>

              <button
                onClick={() => {
                  if (otpContext === 'phone') setHomeTab('phone');
                  go(otpContext === 'phone' ? 'HOME' : 'SIGNUP');
                }}
                className="mt-5 flex items-center gap-1 text-sm text-zinc-400 hover:text-black transition mx-auto cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change {otpContext === 'phone' ? 'phone number' : 'email'}
              </button>
            </div>
          )}

          {/* ──── SCREEN: FORGOT PASSWORD ──── */}
          {screen === 'FORGOT' && (
            <div className="auth-panel rounded-3xl border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-8 animate-fade-in-up">
              <button onClick={() => go('EMAIL_PASS')} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-black transition mb-6">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <h1 className="text-[26px] font-bold tracking-tight text-black mb-1">Reset your password</h1>
              <p className="text-sm text-zinc-500 mb-6">
                Enter your registered email and we&apos;ll send you a recovery link.
              </p>

              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-600 animate-shake flex flex-col gap-1.5 text-left">
                  <p>{error}</p>
                  {error.toLowerCase().includes('not registered') && (
                    <button
                      type="button"
                      onClick={() => { clearMessages(); go('SIGNUP'); }}
                      className="text-xs text-black font-semibold underline underline-offset-2 text-left hover:opacity-80 transition cursor-pointer"
                    >
                      Sign up with this email instead →
                    </button>
                  )}
                </div>
              )}
              {success && <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-[13px] text-green-700">{success}</div>}

              <form onSubmit={handleForgot} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  placeholder="Email address"
                  className={inputBase}
                  autoComplete="email"
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !email || forgotCooldown > 0}
                  className="w-full py-3 rounded-xl bg-black text-white text-[15px] font-semibold transition-all hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : forgotCooldown > 0 ? `Wait (${forgotCooldown}s)` : 'Send recovery link'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>



      {/* Bottom brand footer */}
      <footer className="py-6 text-center text-xs font-mono text-zinc-400 border-t border-zinc-200/60 bg-white">
        © 2026 Dwarkesh Real Estate Group • Verified Properties
      </footer>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center text-zinc-400 text-xs font-mono">
        Loading Dwarkesh...
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
