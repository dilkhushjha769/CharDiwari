'use client';

import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
// Default to official PostHog EU ingestion endpoint
const POSTHOG_HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com').replace(/\/$/, '');
// Web App UI domain (eu.posthog.com vs us.posthog.com)
const POSTHOG_APP_URL = (
  process.env.NEXT_PUBLIC_POSTHOG_APP_URL ||
  (POSTHOG_HOST.includes('eu.') ? 'https://eu.posthog.com' : 'https://us.posthog.com')
).replace(/\/$/, '');
// User's PostHog project ID (from wizard report: 303531)
const POSTHOG_PROJECT_ID = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID || '303531';

let isInitialized = false;
let currentAuthenticatedUserId = null;

/**
 * Returns exact, verified links to the PostHog Cloud web application.
 */
export function getPostHogAppLinks() {
  const app = POSTHOG_APP_URL;
  const pid = POSTHOG_PROJECT_ID;
  return {
    appUrl: app,
    projectId: pid,
    replayUrl: `${app}/project/${pid}/replay`,
    eventsUrl: `${app}/project/${pid}/activity/events`,
    insightsUrl: `${app}/project/${pid}/insights`,
    dashboardsUrl: `${app}/project/${pid}/dashboards`,
  };
}

/**
 * Retrieves the rolling buffer of recent events captured in this browser.
 */
export function getRecentLocalEvents() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('dwarkesh_recent_analytics');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/**
 * Stores an event to the local rolling buffer for instant live inspection in Admin.
 */
function recordLocalEvent(eventRecord) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRecentLocalEvents();
    const updated = [eventRecord, ...existing].slice(0, 60);
    localStorage.setItem('dwarkesh_recent_analytics', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('dwarkesh_analytics_updated', { detail: eventRecord }));
  } catch (_) {}
}

/**
 * Initializes PostHog on the client side with robust anonymous visitor tracking.
 * - Persistence: first-party localStorage + cookies to persist anonymous distinct IDs across sessions
 * - person_profiles: 'identified_only' ensures anonymous browsing does not create expensive dummy profiles
 * - property_denylist & masking: protects visitor privacy, avoids storing passwords or sensitive form inputs
 */
export function initPostHog() {
  if (typeof window === 'undefined') return null;

  if (isInitialized) {
    return posthog;
  }

  if (!POSTHOG_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.info(
        'ℹ️ [PostHog] NEXT_PUBLIC_POSTHOG_KEY is not defined. Operating in safe dummy mode.'
      );
    }
    return null;
  }

  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      ui_host: POSTHOG_APP_URL,
      // Pageview tracking is handled explicitly by our Next.js App Router tracker
      capture_pageview: false,
      capture_pageleave: true,
      // Enable session recording with sensitive input masking
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector:
          '[data-private], input, textarea, select, [type="password"], [type="tel"], [type="email"]',
      },
      // Privacy controls: capture anonymous events without creating billing-heavy dummy person profiles
      person_profiles: 'identified_only',
      // Enable autocapture for click & interaction coverage
      autocapture: true,
      // First-party persistence preserves anonymous identity across visits without third-party cookies
      persistence: 'localStorage+cookie',
      persistence_name: 'dwarkesh_ph',
      cross_subdomain_cookie: false,
      secure_cookie: typeof window !== 'undefined' && window.location.protocol === 'https:',
      // Automatically strip sensitive fields before sending
      property_denylist: [
        '$ip',
        'password',
        'token',
        'access_token',
        'refresh_token',
        'secret',
        'auth_token',
        'credit_card',
        'pin',
        'user_phone',
      ],
      loaded: (ph) => {
        isInitialized = true;
        // Default super properties for anonymous visitors
        ph.register({
          app_name: 'Dwarkesh CharDiwari Real Estate',
          platform: 'web',
          is_anonymous: true,
          user_status: 'anonymous',
        });
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `✅ [PostHog] Initialized on ${POSTHOG_HOST}. Anonymous Distinct ID:`,
            ph?.get_distinct_id?.()
          );
        }
      },
    });

    isInitialized = true;
    return posthog;
  } catch (err) {
    console.warn('[PostHog] Initialization failed safely:', err);
    return null;
  }
}

/**
 * Returns the PostHog instance if initialized.
 */
export function getPostHog() {
  if (typeof window === 'undefined') return null;
  if (!isInitialized) {
    return initPostHog();
  }
  return posthog;
}

/**
 * Returns the persistent anonymous distinct ID of the current visitor.
 */
export function getAnonymousDistinctId() {
  if (typeof window === 'undefined') return null;
  const ph = getPostHog();
  return ph?.get_distinct_id?.() || null;
}

/**
 * Checks if the current visitor is browsing anonymously (not logged in).
 */
export function isUserAnonymous() {
  return !currentAuthenticatedUserId;
}

/**
 * Safely captures a custom PostHog event without crashing on failure.
 * Automatically tags events with anonymous status, persistent distinct ID, and clean path.
 */
export function captureEvent(eventName, properties = {}) {
  try {
    const ph = getPostHog();
    const isAnon = !currentAuthenticatedUserId;
    const anonId = ph?.get_distinct_id?.() || 'anon';

    // Attach non-sensitive environment metadata
    const cleanProps = {
      ...properties,
      is_anonymous: isAnon,
      user_status: isAnon ? 'anonymous' : 'authenticated',
      page_path: typeof window !== 'undefined' ? window.location.pathname : '',
      $current_url: typeof window !== 'undefined' ? window.location.href : '',
    };

    // 1. Dispatch to PostHog
    if (ph && typeof ph.capture === 'function') {
      ph.capture(eventName, cleanProps);
    }

    // 2. Record locally for zero-latency Admin inspection
    const record = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      event: eventName,
      timestamp: new Date().toISOString(),
      properties: cleanProps,
      visitorId: anonId ? anonId.slice(0, 8) : 'anon',
    };
    recordLocalEvent(record);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 [PostHog Capture: ${eventName}]`, cleanProps);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[PostHog] Failed to capture ${eventName}:`, error);
    }
  }
}

/**
 * Identifies a signed-in user without transmitting sensitive credentials.
 * PostHog automatically merges prior anonymous events with this user's profile.
 */
export function identifyUser(userId, traits = {}) {
  try {
    const ph = getPostHog();
    if (!ph || typeof ph.identify !== 'function') return;
    if (!userId) return;

    currentAuthenticatedUserId = String(userId);

    // Update global super properties for all subsequent events
    if (typeof ph.register === 'function') {
      ph.register({
        is_anonymous: false,
        user_status: 'authenticated',
      });
    }

    // Sanitize traits: never send passwords, access tokens, or phone numbers directly
    const safeTraits = {
      role: traits.role || 'client',
      created_at: traits.created_at || traits.createdAt,
      auth_provider: traits.auth_provider || 'supabase',
      ...(traits.name ? { name: traits.name } : {}),
    };

    ph.identify(String(userId), safeTraits);

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 [PostHog] User identified: ${userId}`, safeTraits);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PostHog] Failed to identify user:', error);
    }
  }
}

/**
 * Resets user session identity on logout.
 * Generates a brand new anonymous distinct ID and resets user properties.
 * Prevents merging future anonymous browsing or another user's activity.
 */
export function resetUser() {
  try {
    const ph = getPostHog();
    if (!ph || typeof ph.reset !== 'function') return;

    currentAuthenticatedUserId = null;
    ph.reset(); // Generates fresh anonymous distinct ID & clears identified traits

    if (typeof ph.register === 'function') {
      ph.register({
        is_anonymous: true,
        user_status: 'anonymous',
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔓 [PostHog] User signed out: session reset to fresh anonymous identity.');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PostHog] Failed to reset user:', error);
    }
  }
}

export { posthog };
export default posthog;
