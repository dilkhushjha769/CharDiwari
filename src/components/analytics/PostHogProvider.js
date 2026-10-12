'use client';

import React, { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog, getPostHog, identifyUser, resetUser } from '@/lib/posthog';
import { getSupabaseClient } from '@/lib/supabase/client';
import { triggerActivityMigration } from '@/lib/visitor';

/**
 * Inner Pageview & SPA navigation tracker.
 * Wrapped in Suspense because Next.js useSearchParams() requires Suspense in App Router.
 */
function PostHogPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrlRef = useRef('');

  useEffect(() => {
    const ph = getPostHog();
    if (!ph || typeof ph.capture !== 'function') return;

    const queryString = searchParams?.toString();
    const currentUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Avoid duplicate pageviews for identical URLs
    if (lastTrackedUrlRef.current === currentUrl) return;
    lastTrackedUrlRef.current = currentUrl;

    // Redact sensitive query parameters if any (tokens, codes, secrets)
    const sanitizedSearch = new URLSearchParams(queryString || '');
    sanitizedSearch.delete('code');
    sanitizedSearch.delete('token');
    sanitizedSearch.delete('access_token');
    sanitizedSearch.delete('refresh_token');
    sanitizedSearch.delete('secret');

    const cleanPath = sanitizedSearch.toString()
      ? `${pathname}?${sanitizedSearch.toString()}`
      : pathname;

    ph.capture('$pageview', {
      $current_url: typeof window !== 'undefined' ? `${window.location.origin}${cleanPath}` : cleanPath,
      page_path: pathname,
    });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Master PostHog Analytics Provider for Dwarkesh / CharDiwari.
 */
export default function PostHogProvider({ children }) {
  useEffect(() => {
    // 1. Initialize PostHog singleton
    initPostHog();

    // 2. Synchronize Supabase authentication state with PostHog identity & migrate anonymous activity
    try {
      const { client } = getSupabaseClient();
      if (client?.auth) {
        // Initial session check
        client.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            identifyUser(session.user.id, {
              created_at: session.user.created_at,
              auth_provider: session.user.app_metadata?.provider || 'supabase',
              role: session.user.user_metadata?.role || 'client',
            });
            // Migrate any existing anonymous activity to authenticated user
            triggerActivityMigration().catch(() => {});
          }
        }).catch(() => {});

        // Listen for login / logout events
        const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            identifyUser(session.user.id, {
              created_at: session.user.created_at,
              auth_provider: session.user.app_metadata?.provider || 'supabase',
              role: session.user.user_metadata?.role || 'client',
            });
            // Migrate anonymous activity upon sign in
            triggerActivityMigration().catch(() => {});
          } else if (event === 'SIGNED_OUT') {
            resetUser();
          }
        });

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      }
    } catch (err) {
      console.warn('[PostHogProvider] Auth sync initialization bypassed safely:', err);
    }
  }, []);


  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageViewTracker />
      </Suspense>
      {children}
    </>
  );
}
