'use client';

import { useEffect, useRef } from 'react';
import {
  trackPropertyViewed,
  trackCategoryViewed,
  trackPropertyEngagement,
  trackCategoryEngagement,
} from '@/lib/analytics';
import { useActiveTimeTracker } from '@/lib/useActiveTimeTracker';

/**
 * Drop-in client component to place on property detail pages.
 * Handles:
 * 1. Initial property view tracking (with deduplication)
 * 2. Active foreground browsing time tracking for the property and its category
 */
export default function PropertyEngagementTracker({ property }) {
  const hasTrackedViewRef = useRef(false);

  useEffect(() => {
    if (!property || hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;

    // Track initial property view
    trackPropertyViewed(property, { source: 'detail_page' });

    // Track category association
    if (property.type) {
      trackCategoryViewed(property.type, { source: 'property_detail' });
    }
  }, [property]);

  // Active foreground engagement tracking
  useActiveTimeTracker({
    enabled: Boolean(property),
    inactivityThresholdMs: 30000, // 30s inactivity threshold
    heartbeatIntervalMs: 20000, // 20s heartbeat flush
    onFlush: (flushedSeconds, totalAccumulatedSeconds) => {
      if (!property) return;

      // Track property engagement time
      trackPropertyEngagement(property, flushedSeconds, totalAccumulatedSeconds);

      // Track corresponding category engagement time
      if (property.type) {
        trackCategoryEngagement(property.type, flushedSeconds, totalAccumulatedSeconds);
      }
    },
  });

  return null;
}
