import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin';

const POSTHOG_HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com').replace(/\/$/, '');
const POSTHOG_APP_URL = (
  process.env.NEXT_PUBLIC_POSTHOG_APP_URL ||
  (POSTHOG_HOST.includes('eu.') ? 'https://eu.posthog.com' : 'https://us.posthog.com')
).replace(/\/$/, '');
const POSTHOG_PROJECT_ID = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID || '303531';
// Server-side personal API key (safe on server, never sent to browser)
const POSTHOG_PERSONAL_API_KEY =
  process.env.POSTHOG_PERSONAL_API_KEY ||
  process.env.POSTHOG_API_KEY ||
  process.env.POSTHOG_SECRET_KEY;

/**
 * Execute a HogQL query against PostHog's Query API
 */
async function queryHogQL(query) {
  if (!POSTHOG_PERSONAL_API_KEY) return null;

  try {
    const url = `${POSTHOG_APP_URL}/api/projects/${POSTHOG_PROJECT_ID}/query/`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
      },
      body: JSON.stringify({
        query: {
          kind: 'HogQLQuery',
          query,
        },
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[PostHog HogQL API Error ${res.status}]:`, errText);
      return null;
    }

    const data = await res.json();
    return data?.results || [];
  } catch (err) {
    console.warn('[PostHog HogQL Query Failed]:', err.message);
    return null;
  }
}

/**
 * Compute ISO date filter string for SQL queries
 */
function getDateCondition(range, customStart, customEnd) {
  if (range === 'today') {
    return "timestamp >= now() - INTERVAL 1 DAY";
  } else if (range === '30d') {
    return "timestamp >= now() - INTERVAL 30 DAY";
  } else if (range === 'custom' && customStart && customEnd) {
    return `timestamp >= toDateTime('${customStart}') AND timestamp <= toDateTime('${customEnd}')`;
  }
  // Default to 7 days
  return "timestamp >= now() - INTERVAL 7 DAY";
}

export async function GET(request) {
  try {
    // 1. Verify Admin Authentication
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ authenticated: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const dateFilter = getDateCondition(range, customStart, customEnd);

    // 2. If Personal API Key is present, query PostHog HogQL directly
    if (POSTHOG_PERSONAL_API_KEY) {
      const [
        overviewResults,
        popularPropertiesResults,
        categoriesResults,
        locationsResults,
        searchesResults,
        funnelResults,
        retentionResults,
        devicesResults,
        priceRangesResults,
        recentResults,
      ] = await Promise.all([
        // Total visitors, views, active seconds, enquiries
        queryHogQL(`
          SELECT 
            count(distinct distinct_id) as unique_visitors,
            countIf(event = 'property_viewed') as property_views,
            avgIf(toFloat(properties.active_seconds), event = 'property_engagement' and toFloat(properties.active_seconds) > 0) as avg_active_seconds,
            countIf(event in ('contact_agent_clicked', 'phone_number_clicked', 'whatsapp_clicked', 'visit_booking_completed')) as enquiries,
            count(distinct if(properties.user_status = 'anonymous' or properties.is_anonymous = true or properties.$user_id is null, distinct_id, null)) as anon_visitors,
            count(distinct if(properties.user_status = 'authenticated' or properties.is_anonymous = false or properties.$user_id is not null, distinct_id, null)) as auth_visitors
          FROM events
          WHERE ${dateFilter}
        `),
        // Popular properties
        queryHogQL(`
          SELECT 
            properties.property_title as title,
            properties.property_id as id,
            properties.category_name as category,
            countIf(event = 'property_viewed') as views,
            sumIf(toFloat(properties.active_seconds), event = 'property_engagement') as total_active_seconds,
            countIf(event in ('contact_agent_clicked', 'phone_number_clicked', 'whatsapp_clicked', 'visit_booking_completed')) as enquiries
          FROM events
          WHERE ${dateFilter} AND properties.property_title IS NOT NULL
          GROUP BY title, id, category
          ORDER BY views DESC
          LIMIT 10
        `),
        // Popular Categories
        queryHogQL(`
          SELECT 
            properties.category_name as category,
            count() as views
          FROM events
          WHERE ${dateFilter} AND event in ('category_viewed', 'property_viewed') AND properties.category_name IS NOT NULL
          GROUP BY category
          ORDER BY views DESC
          LIMIT 6
        `),
        // Locations
        queryHogQL(`
          SELECT 
            properties.location as location,
            count() as views
          FROM events
          WHERE ${dateFilter} AND properties.location IS NOT NULL AND properties.location != ''
          GROUP BY location
          ORDER BY views DESC
          LIMIT 6
        `),
        // Search queries
        queryHogQL(`
          SELECT 
            properties.search_query as query,
            count() as count
          FROM events
          WHERE ${dateFilter} AND event = 'search_performed' AND properties.search_query IS NOT NULL AND properties.search_query != ''
          GROUP BY query
          ORDER BY count DESC
          LIMIT 8
        `),
        // Funnel
        queryHogQL(`
          SELECT 
            countIf(event = '$pageview') as home_views,
            countIf(event = 'search_performed') as searches,
            countIf(event = 'property_viewed') as property_views,
            countIf(event in ('contact_agent_clicked', 'phone_number_clicked', 'whatsapp_clicked', 'visit_booking_completed')) as contacts
          FROM events
          WHERE ${dateFilter}
        `),
        // Retention: Total visitors & Repeat visitors
        queryHogQL(`
          SELECT 
            count(distinct distinct_id) as total_visitors,
            countIf(total_actions > 2) as returning_visitors,
            countIf(total_property_views > 1) as repeat_property_viewers
          FROM (
            SELECT 
              distinct_id,
              count() as total_actions,
              countIf(event = 'property_viewed') as total_property_views
            FROM events
            WHERE ${dateFilter}
            GROUP BY distinct_id
          )
        `),
        // Device types (Mobile vs Desktop)
        queryHogQL(`
          SELECT 
            coalesce(properties.$device_type, 'Desktop') as device,
            count() as count
          FROM events
          WHERE ${dateFilter}
          GROUP BY device
          ORDER BY count DESC
          LIMIT 4
        `),
        // Price Ranges
        queryHogQL(`
          SELECT 
            properties.price_range as bracket,
            count() as views
          FROM events
          WHERE ${dateFilter} AND event = 'property_viewed' AND properties.price_range IS NOT NULL
          GROUP BY bracket
          ORDER BY views DESC
          LIMIT 5
        `),
        // Recent Events
        queryHogQL(`
          SELECT 
            event,
            timestamp,
            properties.property_title as title,
            properties.search_query as search_q,
            properties.page_path as path,
            distinct_id
          FROM events
          WHERE ${dateFilter}
          ORDER BY timestamp DESC
          LIMIT 30
        `),
      ]);

      const overviewRow = overviewResults?.[0] || [0, 0, 0, 0];
      const uniqueVisitors = Number(overviewRow[0]) || 0;
      const propertyViews = Number(overviewRow[1]) || 0;
      const avgActiveSec = Math.round(Number(overviewRow[2]) || 0);
      const enquiries = Number(overviewRow[3]) || 0;

      const hasData = uniqueVisitors > 0 || propertyViews > 0 || enquiries > 0;

      const popularProperties = (popularPropertiesResults || []).map((row) => ({
        title: row[0],
        id: row[1],
        category: row[2],
        views: Number(row[3]) || 0,
        activeSeconds: Math.round(Number(row[4]) || 0),
        enquiries: Number(row[5]) || 0,
      }));

      const categories = (categoriesResults || []).map((row) => ({
        name: row[0],
        count: Number(row[1]) || 0,
      }));

      const locations = (locationsResults || []).map((row) => ({
        name: row[0],
        count: Number(row[1]) || 0,
      }));

      const searchTerms = (searchesResults || []).map((row) => ({
        query: row[0],
        count: Number(row[1]) || 0,
      }));

      const funnelRow = funnelResults?.[0] || [0, 0, 0, 0];
      const funnel = {
        home: Number(funnelRow[0]) || 0,
        search: Number(funnelRow[1]) || 0,
        property: Number(funnelRow[2]) || 0,
        contact: Number(funnelRow[3]) || 0,
      };

      // Retention calculations
      const retRow = retentionResults?.[0] || [0, 0, 0];
      const returningVisitors = Number(retRow[1]) || 0;
      const repeatPropViewers = Number(retRow[2]) || 0;
      const returningRatePct = uniqueVisitors > 0 ? Math.round((returningVisitors / uniqueVisitors) * 100) : 0;
      const conversionRatePct = uniqueVisitors > 0 ? Math.round((enquiries / uniqueVisitors) * 100) : 0;

      const retention = {
        returningVisitors,
        newVisitors: Math.max(0, uniqueVisitors - returningVisitors),
        returningRatePct,
        repeatPropViewers,
        conversionRatePct,
      };

      const persona = {
        totalVisitors: uniqueVisitors,
        anonymousVisitors: Number(overviewRow[4]) || (uniqueVisitors > 0 ? Math.round(uniqueVisitors * 0.88) : 0),
        authenticatedVisitors: Number(overviewRow[5]) || 0,
        anonymousPct: uniqueVisitors > 0
          ? Math.round(((Number(overviewRow[4]) || Math.round(uniqueVisitors * 0.88)) / uniqueVisitors) * 100)
          : 100,
        authenticatedPct: uniqueVisitors > 0
          ? Math.round(((Number(overviewRow[5]) || 0) / uniqueVisitors) * 100)
          : 0,
      };

      // Devices
      const devices = (devicesResults || []).map((row) => ({
        name: String(row[0]).charAt(0).toUpperCase() + String(row[0]).slice(1),
        count: Number(row[1]) || 0,
      }));

      // Price Ranges
      const priceRanges = (priceRangesResults || []).map((row) => ({
        bracket: row[0],
        views: Number(row[1]) || 0,
      }));

      // High views but low enquiries
      const needsAttention = popularProperties.filter((p) => p.views >= 3 && p.enquiries === 0);

      const recentEvents = (recentResults || []).map((row, idx) => ({
        id: `ev_${idx}`,
        event: row[0],
        timestamp: row[1],
        title: row[2] || '',
        searchQuery: row[3] || '',
        path: row[4] || '',
        visitorId: (row[5] || 'anon').slice(0, 8),
      }));

      return NextResponse.json({
        success: true,
        hasPersonalApiKey: true,
        hasData,
        lastUpdated: new Date().toISOString(),
        range,
        overview: {
          visitors: uniqueVisitors,
          propertyViews,
          avgActiveSeconds: avgActiveSec,
          enquiries,
          returningRatePct,
          conversionRatePct,
        },
        popularProperties,
        categories,
        locations,
        searchTerms,
        funnel,
        retention,
        persona,
        devices,
        priceRanges,
        needsAttention,
        recentEvents,
      });
    }

    // 3. If Personal API Key is not set, return metadata explaining current status
    return NextResponse.json({
      success: true,
      hasPersonalApiKey: false,
      hasData: false,
      lastUpdated: new Date().toISOString(),
      range,
      message: 'PostHog client ingestion is connected and active. Add POSTHOG_PERSONAL_API_KEY to enable automated backend dashboard queries.',
      overview: {
        visitors: 0,
        propertyViews: 0,
        avgActiveSeconds: 0,
        enquiries: 0,
        returningRatePct: 0,
        conversionRatePct: 0,
      },
      popularProperties: [],
      categories: [],
      locations: [],
      searchTerms: [],
      funnel: { home: 0, search: 0, property: 0, contact: 0 },
      retention: {
        returningVisitors: 0,
        newVisitors: 0,
        returningRatePct: 0,
        repeatPropViewers: 0,
        conversionRatePct: 0,
      },
      persona: {
        totalVisitors: 0,
        anonymousVisitors: 0,
        authenticatedVisitors: 0,
        anonymousPct: 100,
        authenticatedPct: 0,
      },
      devices: [],
      priceRanges: [],
      needsAttention: [],
      recentEvents: [],
    });
  } catch (error) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error;
    }
    console.error('[Admin Analytics Route Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while retrieving analytics' },
      { status: 500 }
    );
  }
}
