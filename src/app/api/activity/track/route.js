import { NextResponse } from 'next/server';
import { getAuthenticatedUserId, recordActivity, removeActivity } from '@/lib/activity';

// Simple in-memory rate limiting map (IP/visitorId -> timestamp array)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 120; // 120 requests per minute

function isRateLimited(key) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);

  if (validTimestamps.length >= MAX_REQUESTS) {
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);

  // Periodically clean up stale entries if map gets large
  if (rateLimitMap.size > 5000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.every((t) => now - t >= RATE_LIMIT_WINDOW)) {
        rateLimitMap.delete(k);
      }
    }
  }

  return false;
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const {
      visitorId,
      activityType,
      property,
      propertyId,
      propertySlug,
      propertyTitle,
      propertyLocation,
      propertyPrice,
      propertyImage,
      categoryName,
      searchQuery,
      searchFilters,
      contactMethod,
      metadata,
    } = body || {};

    if (!visitorId || typeof visitorId !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing visitorId' }, { status: 400 });
    }

    const ALLOWED_TYPES = ['view', 'search', 'shortlist', 'contact'];
    if (!activityType || !ALLOWED_TYPES.includes(activityType)) {
      return NextResponse.json({ error: 'Invalid activityType' }, { status: 400 });
    }

    // Verify user ID on the server (do not trust client)
    const userId = await getAuthenticatedUserId(request);

    const result = await recordActivity({
      userId,
      visitorId,
      activityType,
      property,
      propertyId,
      propertySlug,
      propertyTitle,
      propertyLocation,
      propertyPrice,
      propertyImage,
      categoryName,
      searchQuery,
      searchFilters,
      contactMethod,
      metadata,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[API Activity Track] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { visitorId, activityType, propertyId, searchQuery } = body || {};

    if (!visitorId) {
      return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 });
    }

    const userId = await getAuthenticatedUserId(request);

    const result = await removeActivity({
      userId,
      visitorId,
      activityType,
      propertyId,
      searchQuery,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[API Activity Delete] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
