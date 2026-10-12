'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Reusable Active Time Tracker Hook
 *
 * Measurement Methodology:
 * 1. Foreground Visibility: Measures time ONLY when document.visibilityState === 'visible'.
 * 2. Activity Heartbeat: Monitors user input (mouse, scroll, keydown, touch). If no input
 *    occurs within `inactivityThresholdMs` (default 30s), tracking pauses until user returns.
 * 3. Aggregated Heartbeats: Flushes time in intervals (default 20s) to safeguard against tab closure.
 * 4. Safe Flush on Exit: Automatically flushes remaining active time on route change, unmount,
 *    and pagehide/beforeunload.
 * 5. Double-Counting Prevention: Unsent time is reset to zero upon every flush; cumulative
 *    total is reported alongside delta duration.
 *
 * Limitations:
 * - Extremely still readers who do not scroll, tap, or move the cursor for >30s will pause the timer
 *   until next interaction. This is by design to prevent false "runaway" timers when users walk away.
 */
export function useActiveTimeTracker({
  onFlush,
  inactivityThresholdMs = 30000,
  heartbeatIntervalMs = 20000,
  minFlushThresholdSeconds = 2,
  enabled = true,
}) {
  const onFlushRef = useRef(onFlush);
  onFlushRef.current = onFlush;

  const unsentSecondsRef = useRef(0);
  const totalAccumulatedRef = useRef(0);
  const lastActiveTimestampRef = useRef(Date.now());
  const lastTickTimestampRef = useRef(Date.now());
  const isUserActiveRef = useRef(true);

  // Flush accumulated unsent active seconds
  const flush = useCallback(() => {
    const unsent = unsentSecondsRef.current;
    if (unsent >= minFlushThresholdSeconds) {
      const total = totalAccumulatedRef.current;
      unsentSecondsRef.current = 0;
      if (typeof onFlushRef.current === 'function') {
        try {
          onFlushRef.current(unsent, total);
        } catch (err) {
          console.warn('[ActiveTimeTracker] Error in flush handler:', err);
        }
      }
    }
  }, [minFlushThresholdSeconds]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    lastTickTimestampRef.current = Date.now();
    lastActiveTimestampRef.current = Date.now();
    isUserActiveRef.current = document.visibilityState === 'visible';

    // Activity detector (throttled)
    let lastActivityLogTime = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityLogTime < 500) return; // Throttle event listener calls
      lastActivityLogTime = now;
      lastActiveTimestampRef.current = now;

      if (!isUserActiveRef.current && document.visibilityState === 'visible') {
        // User woke up from inactivity
        isUserActiveRef.current = true;
        lastTickTimestampRef.current = now;
      }
    };

    // Tab visibility detector
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden: pause and flush
        isUserActiveRef.current = false;
        flush();
      } else {
        // Tab visible: resume
        isUserActiveRef.current = true;
        lastActiveTimestampRef.current = Date.now();
        lastTickTimestampRef.current = Date.now();
      }
    };

    // Page unload / route exit
    const handlePageExit = () => {
      flush();
    };

    // Core 1-second accumulation tick
    const tickInterval = setInterval(() => {
      const now = Date.now();
      const elapsedSinceTick = (now - lastTickTimestampRef.current) / 1000;
      lastTickTimestampRef.current = now;

      // Check if user has timed out due to inactivity
      const idleTime = now - lastActiveTimestampRef.current;
      if (idleTime > inactivityThresholdMs) {
        isUserActiveRef.current = false;
      }

      // If foreground and active, accumulate time
      if (isUserActiveRef.current && document.visibilityState === 'visible') {
        // Clamp slice to avoid large leaps (e.g. after computer sleep)
        const validSlice = Math.min(elapsedSinceTick, 3);
        unsentSecondsRef.current += validSlice;
        totalAccumulatedRef.current += validSlice;

        // Heartbeat periodic flush
        if (unsentSecondsRef.current >= heartbeatIntervalMs / 1000) {
          flush();
        }
      }
    }, 1000);

    // Register passive interaction listeners
    const options = { passive: true };
    window.addEventListener('mousemove', handleUserActivity, options);
    window.addEventListener('mousedown', handleUserActivity, options);
    window.addEventListener('keydown', handleUserActivity, options);
    window.addEventListener('scroll', handleUserActivity, options);
    window.addEventListener('touchstart', handleUserActivity, options);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handlePageExit);
    window.addEventListener('pagehide', handlePageExit);

    return () => {
      clearInterval(tickInterval);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handlePageExit);
      window.removeEventListener('pagehide', handlePageExit);

      // Final unmount flush
      flush();
    };
  }, [enabled, inactivityThresholdMs, heartbeatIntervalMs, flush]);

  return {
    flush,
  };
}
