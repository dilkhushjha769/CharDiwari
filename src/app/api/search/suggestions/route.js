import { NextResponse } from 'next/server';
import { searchPropertiesAutocomplete } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

let supabasePublicClient = null;
let supabaseUnavailableUntil = 0;
let rpcAvailable = true;

const serverQueryCache = new Map();
const SERVER_CACHE_TTL = 60 * 1000;

function getPublicSupabase() {
  if (Date.now() < supabaseUnavailableUntil) return null;
  if (supabasePublicClient) return supabasePublicClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key && url.startsWith('https://') && !url.includes('your-project-id')) {
    try {
      supabasePublicClient = createClient(url, key);
      return supabasePublicClient;
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') || '';
    const city = searchParams.get('city') || '';
    const mode = searchParams.get('mode') || '';
    const limitParam = parseInt(searchParams.get('limit') || '10', 10);
    const limit = Math.min(Math.max(limitParam || 10, 1), 20);

    // Validate and bound query length for safety
    if (rawQuery.length > 100) {
      return NextResponse.json(
        { query: '', total: 0, categories: [], error: 'Query exceeds maximum allowed length' },
        { status: 400 }
      );
    }

    const cleanQ = rawQuery.trim().replace(/[\x00-\x1F\x7F]/g, '');
    const cacheKey = `${cleanQ.toLowerCase()}|${city.toLowerCase()}|${mode.toLowerCase()}|${limit}`;

    // Instant in-memory server cache hit
    if (serverQueryCache.has(cacheKey)) {
      const cached = serverQueryCache.get(cacheKey);
      if (Date.now() < cached.expiresAt) {
        return NextResponse.json(cached.data, {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        });
      }
      serverQueryCache.delete(cacheKey);
    }

    // 1. Attempt Supabase Query or RPC if configured with real database tables
    try {
      const supabase = getPublicSupabase();

      if (supabase && cleanQ) {
        if (rpcAvailable) {
          // Attempt fast PostgreSQL stored RPC function if available
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            'search_properties_suggestions',
            {
              query_text: cleanQ,
              filter_city: city === 'All Cities' ? null : city,
              filter_mode: mode || null,
              result_limit: limit,
            }
          );

          if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
            return formatSupabaseResults(cleanQ, rpcData, 'supabase-rpc', cacheKey);
          }

          if (rpcError) {
            rpcAvailable = false;
          }
        }

        // Fallback to direct query on Supabase properties table
        const sanitizedQ = cleanQ.replace(/[%_]/g, '');
        const { data: supaProps, error: tableError } = await supabase
          .from('properties')
          .select('id, title, slug, location, locality, city, state, type, price, rent_price, beds, bhk, image, builder, mode')
          .eq('status', 'published')
          .eq('is_deleted', false)
          .or(
            `title.ilike.%${sanitizedQ}%,location.ilike.%${sanitizedQ}%,city.ilike.%${sanitizedQ}%,type.ilike.%${sanitizedQ}%,bhk.ilike.%${sanitizedQ}%,builder.ilike.%${sanitizedQ}%`
          )
          .limit(limit);

        if (tableError) {
          // If table does not exist or error occurs, trigger cooldown
          supabaseUnavailableUntil = Date.now() + 5 * 60 * 1000;
        } else if (Array.isArray(supaProps) && supaProps.length > 0) {
          return formatSupabaseResults(cleanQ, supaProps, 'supabase-table', cacheKey);
        }
      }
    } catch {
      // Supabase is either not configured or table does not exist; fall back seamlessly
    }

    // 2. Query High-Performance Local Database & In-Memory Engine
    const result = searchPropertiesAutocomplete({
      query: cleanQ,
      city,
      mode,
      limit,
    });

    const responsePayload = { ...result, source: 'database' };
    serverQueryCache.set(cacheKey, {
      data: responsePayload,
      expiresAt: Date.now() + SERVER_CACHE_TTL,
    });

    return NextResponse.json(
      responsePayload,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    if (error?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('Error during search suggestions:', error);
    return NextResponse.json(
      {
        query: '',
        total: 0,
        categories: [],
        error: 'Failed to process search suggestions',
      },
      { status: 500 }
    );
  }
}

function formatSupabaseResults(query, rows, source, cacheKey) {
  const queryLower = (query || '').toLowerCase().trim();
  const locationMap = new Map();
  const typeMap = new Map();
  const attributeMap = new Map();
  const propertyList = [];

  for (const item of rows) {
    propertyList.push({
      id: `prop-${item.id}`,
      type: 'property',
      title: item.title,
      subtitle: `${item.locality || item.location}${item.builder ? ` • ${item.builder}` : ''}`,
      slug: item.slug,
      price: item.price,
      rentPrice: item.rent_price,
      propertyType: item.type,
      badge: item.bhk || item.beds || 'Verified',
      image: item.image || null,
      city: item.city,
      location: item.location,
      bhk: item.bhk,
      beds: item.beds,
      builder: item.builder,
      mode: item.mode,
    });

    // Only include city in locations if the query matches the city/location
    const cityMatches =
      item.city &&
      (item.city.toLowerCase().includes(queryLower) ||
        (item.location && item.location.toLowerCase().includes(queryLower)));

    if (cityMatches && !locationMap.has(item.city)) {
      locationMap.set(item.city, {
        id: `loc-city-${item.city.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'location',
        title: item.city,
        subtitle: item.state ? `${item.state}, India` : 'City in India',
        badge: 'City',
        city: item.city,
        location: item.city,
        count: 1,
      });
    }

    if (item.type && !typeMap.has(item.type)) {
      const typeMatches = item.type.toLowerCase().includes(queryLower);
      if (typeMatches) {
        typeMap.set(item.type, {
          id: `type-${item.type.toLowerCase().replace(/\s+/g, '-')}`,
          type: 'propertyType',
          title: item.type,
          subtitle: 'Verified Property Category',
          badge: 'Property Type',
          count: 1,
        });
      }
    }

    if (item.bhk && !attributeMap.has(item.bhk)) {
      const bhkMatches = item.bhk.toLowerCase().includes(queryLower);
      if (bhkMatches) {
        attributeMap.set(item.bhk, {
          id: `attr-bhk-${item.bhk.toLowerCase().replace(/\s+/g, '-')}`,
          type: 'attribute',
          attributeType: 'bhk',
          title: item.bhk,
          subtitle: 'Bedrooms Configuration',
          badge: 'BHK Plan',
          count: 1,
        });
      }
    }
  }

  // Determine relevance priority: if user searched a type, type goes first; if title, properties go first; if location, locations go first
  const isTypeQuery = Array.from(typeMap.values()).some((t) =>
    t.title.toLowerCase().startsWith(queryLower)
  );
  const isLocationQuery = Array.from(locationMap.values()).some((l) =>
    l.title.toLowerCase().startsWith(queryLower)
  );

  const candidateCategories = [
    {
      id: 'types',
      label: 'Property types',
      items: Array.from(typeMap.values()).slice(0, 3),
      priority: isTypeQuery ? 100 : 30,
    },
    {
      id: 'properties',
      label: 'Properties',
      items: propertyList.slice(0, 4),
      priority: 80,
    },
    {
      id: 'locations',
      label: 'Locations',
      items: Array.from(locationMap.values()).slice(0, 3),
      priority: isLocationQuery ? 95 : 20,
    },
    {
      id: 'attributes',
      label: 'Configurations',
      items: Array.from(attributeMap.values()).slice(0, 2),
      priority: 50,
    },
  ];

  const categories = candidateCategories
    .filter((c) => c.items.length > 0)
    .sort((a, b) => b.priority - a.priority)
    .map(({ priority, ...rest }) => rest);

  const total = categories.reduce((sum, c) => sum + c.items.length, 0);
  const payload = { query: queryLower, total, categories, source };

  if (cacheKey) {
    serverQueryCache.set(cacheKey, {
      data: payload,
      expiresAt: Date.now() + SERVER_CACHE_TTL,
    });
  }

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
