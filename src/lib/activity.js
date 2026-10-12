import fs from 'fs';
import path from 'path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initialize server-side Supabase client
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder')) {
    return null;
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) return { properties: [], users: [], userActivity: [] };
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.userActivity) data.userActivity = [];
    return data;
  } catch (err) {
    return { properties: [], users: [], userActivity: [] };
  }
}

function writeDb(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmpFile = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('[Activity] Error writing to DB file:', err);
  }
}

/**
 * Verify authentication and return authenticated user ID from request
 */
export async function getAuthenticatedUserId(request) {
  if (!request) return null;

  // 1. Try Supabase SSR Auth
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch (_) {}

  // 2. Try Authorization Bearer Header (Supabase token or app JWT)
  try {
    const authHeader = request.headers?.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // Verify with Supabase client
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user?.id) return user.id;
        } catch (_) {}
      }
      // Verify with app JWT
      const payload = await verifySessionToken(token);
      if (payload?.userId) return payload.userId;
    }
  } catch (_) {}

  // 3. Try App Session Token Cookie
  try {
    const token = request.cookies?.get(COOKIE_NAME)?.value;
    if (token) {
      const payload = await verifySessionToken(token);
      if (payload?.userId) return payload.userId;
    }
  } catch (_) {}

  // 4. Try x-user-id header if present
  try {
    const headerUserId = request.headers?.get('x-user-id');
    if (headerUserId && (headerUserId.startsWith('usr_') || /^[0-9a-f-]{36}$/i.test(headerUserId))) {
      return headerUserId;
    }
  } catch (_) {}

  return null;
}

/**
 * Record an activity (view, search, shortlist, contact)
 * Idempotently updates timestamps on repeated actions without duplicate rows.
 */
export async function recordActivity({
  userId = null,
  visitorId,
  activityType,
  property = null,
  propertyId = null,
  propertySlug = '',
  propertyTitle = '',
  propertyLocation = '',
  propertyPrice = '',
  propertyImage = '',
  categoryName = '',
  searchQuery = '',
  searchFilters = {},
  contactMethod = '',
  metadata = {},
}) {
  if (!visitorId || !activityType) {
    return { success: false, error: 'visitorId and activityType are required' };
  }

  // Extract property fields from property object if supplied
  const pId = property?.id ?? propertyId ?? null;
  const pSlug = property?.slug ?? propertySlug ?? '';
  const pTitle = property?.title ?? propertyTitle ?? '';
  const pLocation = property?.location ?? propertyLocation ?? '';
  const pPrice = property?.price ?? propertyPrice ?? '';
  const pImage = property?.image ?? propertyImage ?? '';
  const catName = property?.type ?? property?.category ?? categoryName ?? '';

  const nowIso = new Date().toISOString();
  const supabase = getSupabase();

  // 1. Database Persistence via Supabase
  if (supabase) {
    try {
      if (activityType === 'search') {
        const cleanQuery = (searchQuery || '').trim();
        if (cleanQuery) {
          // Check for existing search record by this user/visitor
          let queryBuilder = supabase
            .from('user_activity')
            .select('id, created_at')
            .eq('activity_type', 'search')
            .ilike('search_query', cleanQuery);

          if (userId) {
            queryBuilder = queryBuilder.eq('user_id', userId);
          } else {
            queryBuilder = queryBuilder.eq('visitor_id', visitorId).is('user_id', null);
          }

          const { data: existing } = await queryBuilder.maybeSingle();

          if (existing) {
            // Update timestamp
            await supabase
              .from('user_activity')
              .update({
                updated_at: nowIso,
                search_filters: searchFilters || {},
                metadata: metadata || {},
              })
              .eq('id', existing.id);
          } else {
            // Insert new search
            await supabase.from('user_activity').insert({
              user_id: userId,
              visitor_id: visitorId,
              activity_type: 'search',
              search_query: cleanQuery,
              search_filters: searchFilters || {},
              metadata: metadata || {},
              created_at: nowIso,
              updated_at: nowIso,
            });
          }
        }
      } else if (pId !== null || pSlug) {
        // Property action: view, shortlist, contact
        let queryBuilder = supabase
          .from('user_activity')
          .select('id, created_at')
          .eq('activity_type', activityType);

        if (pId !== null) {
          queryBuilder = queryBuilder.eq('property_id', pId);
        } else {
          queryBuilder = queryBuilder.eq('property_slug', pSlug);
        }

        if (userId) {
          queryBuilder = queryBuilder.eq('user_id', userId);
        } else {
          queryBuilder = queryBuilder.eq('visitor_id', visitorId).is('user_id', null);
        }

        const { data: existing } = await queryBuilder.maybeSingle();

        if (existing) {
          // Update updated_at timestamp while preserving original created_at
          await supabase
            .from('user_activity')
            .update({
              updated_at: nowIso,
              property_title: pTitle || undefined,
              property_location: pLocation || undefined,
              property_price: pPrice || undefined,
              property_image: pImage || undefined,
              contact_method: contactMethod || undefined,
              metadata: metadata || {},
            })
            .eq('id', existing.id);
        } else {
          // Insert new activity
          await supabase.from('user_activity').insert({
            user_id: userId,
            visitor_id: visitorId,
            activity_type: activityType,
            property_id: pId ? Number(pId) : null,
            property_slug: pSlug,
            property_title: pTitle,
            property_location: pLocation,
            property_price: pPrice,
            property_image: pImage,
            category_name: catName,
            contact_method: contactMethod,
            metadata: metadata || {},
            created_at: nowIso,
            updated_at: nowIso,
          });
        }
      }
    } catch (err) {
      console.warn('[Activity] Supabase record error (falling back to local store):', err.message);
    }
  }

  // 2. Local File Database Persistence (Automatic fallback & offline support)
  try {
    const db = readDb();
    if (!db.userActivity) db.userActivity = [];

    if (activityType === 'search') {
      const cleanQuery = (searchQuery || '').trim();
      if (cleanQuery) {
        const existingIdx = db.userActivity.findIndex((item) => {
          const matchQuery = (item.search_query || '').toLowerCase() === cleanQuery.toLowerCase();
          const matchUser = userId ? item.user_id === userId : item.visitor_id === visitorId && !item.user_id;
          return item.activity_type === 'search' && matchQuery && matchUser;
        });

        if (existingIdx >= 0) {
          db.userActivity[existingIdx].updated_at = nowIso;
          db.userActivity[existingIdx].search_filters = searchFilters || {};
        } else {
          db.userActivity.unshift({
            id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            user_id: userId,
            visitor_id: visitorId,
            activity_type: 'search',
            search_query: cleanQuery,
            search_filters: searchFilters || {},
            metadata: metadata || {},
            created_at: nowIso,
            updated_at: nowIso,
          });
        }
        writeDb(db);
      }
    } else {
      const existingIdx = db.userActivity.findIndex((item) => {
        const matchProp = pId ? String(item.property_id) === String(pId) : item.property_slug === pSlug;
        const matchUser = userId ? item.user_id === userId : item.visitor_id === visitorId && !item.user_id;
        return item.activity_type === activityType && matchProp && matchUser;
      });

      if (existingIdx >= 0) {
        db.userActivity[existingIdx].updated_at = nowIso;
        if (pTitle) db.userActivity[existingIdx].property_title = pTitle;
        if (pImage) db.userActivity[existingIdx].property_image = pImage;
        if (contactMethod) db.userActivity[existingIdx].contact_method = contactMethod;
      } else {
        db.userActivity.unshift({
          id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          user_id: userId,
          visitor_id: visitorId,
          activity_type: activityType,
          property_id: pId ? Number(pId) : null,
          property_slug: pSlug,
          property_title: pTitle,
          property_location: pLocation,
          property_price: pPrice,
          property_image: pImage,
          category_name: catName,
          contact_method: contactMethod,
          metadata: metadata || {},
          created_at: nowIso,
          updated_at: nowIso,
        });
      }
      writeDb(db);
    }
  } catch (err) {
    console.error('[Activity] Local record error:', err);
  }

  return { success: true };
}

/**
 * Remove an activity record (e.g. un-shortlist property or clear search)
 */
export async function removeActivity({
  userId = null,
  visitorId,
  activityType,
  propertyId = null,
  searchQuery = null,
}) {
  const supabase = getSupabase();

  if (supabase) {
    try {
      let query = supabase.from('user_activity').delete().eq('activity_type', activityType);
      if (propertyId !== null) {
        query = query.eq('property_id', Number(propertyId));
      }
      if (searchQuery) {
        query = query.ilike('search_query', searchQuery.trim());
      }
      if (userId) {
        query = query.eq('user_id', userId);
      } else if (visitorId) {
        query = query.eq('visitor_id', visitorId).is('user_id', null);
      }
      await query;
    } catch (_) {}
  }

  try {
    const db = readDb();
    if (db.userActivity) {
      db.userActivity = db.userActivity.filter((item) => {
        if (item.activity_type !== activityType) return true;
        const matchUser = userId ? item.user_id === userId : item.visitor_id === visitorId && !item.user_id;
        if (!matchUser) return true;

        if (propertyId !== null && String(item.property_id) === String(propertyId)) {
          return false;
        }
        if (searchQuery && (item.search_query || '').toLowerCase() === searchQuery.toLowerCase()) {
          return false;
        }
        return true;
      });
      writeDb(db);
    }
  } catch (_) {}

  return { success: true };
}

/**
 * Securely migrates anonymous visitor activity to the authenticated user account.
 * - Idempotent: repeated calls merge cleanly without duplicate records
 * - Preserves original activity timestamps
 */
export async function migrateVisitorActivity(userId, visitorId) {
  if (!userId || !visitorId) {
    return { success: false, migratedCount: 0 };
  }

  let migratedCount = 0;
  const supabase = getSupabase();

  // 1. Supabase Migration
  if (supabase) {
    try {
      // Find eligible anonymous records
      const { data: anonRecords } = await supabase
        .from('user_activity')
        .select('*')
        .eq('visitor_id', visitorId)
        .is('user_id', null);

      if (anonRecords && anonRecords.length > 0) {
        for (const item of anonRecords) {
          // Check if this user already has this activity
          let existingQuery = supabase
            .from('user_activity')
            .select('id, created_at')
            .eq('user_id', userId)
            .eq('activity_type', item.activity_type);

          if (item.property_id) {
            existingQuery = existingQuery.eq('property_id', item.property_id);
          } else if (item.search_query) {
            existingQuery = existingQuery.ilike('search_query', item.search_query.trim());
          }

          const { data: existing } = await existingQuery.maybeSingle();

          if (existing) {
            // User already has this activity: delete redundant anonymous row to prevent duplicate cards
            await supabase.from('user_activity').delete().eq('id', item.id);
          } else {
            // Associate anonymous record with authenticated user account while preserving original created_at
            await supabase
              .from('user_activity')
              .update({
                user_id: userId,
              })
              .eq('id', item.id);
            migratedCount++;
          }
        }
      }
    } catch (err) {
      console.warn('[Activity] Supabase migration warning:', err.message);
    }
  }

  // 2. Local Database Migration (Ensures offline & dev tests succeed)
  try {
    const db = readDb();
    if (db.userActivity && db.userActivity.length > 0) {
      const anonItems = db.userActivity.filter(
        (item) => item.visitor_id === visitorId && (!item.user_id || item.user_id === null)
      );

      for (const item of anonItems) {
        const alreadyExists = db.userActivity.some((userItem) => {
          if (userItem.user_id !== userId || userItem.activity_type !== item.activity_type) {
            return false;
          }
          if (item.property_id && String(userItem.property_id) === String(item.property_id)) {
            return true;
          }
          if (
            item.search_query &&
            (userItem.search_query || '').toLowerCase() === (item.search_query || '').toLowerCase()
          ) {
            return true;
          }
          return false;
        });

        if (alreadyExists) {
          // Remove duplicate anonymous record
          db.userActivity = db.userActivity.filter((x) => x.id !== item.id);
        } else {
          // Migrate ownership to user
          item.user_id = userId;
          migratedCount++;
        }
      }

      writeDb(db);
    }
  } catch (err) {
    console.error('[Activity] Local migration error:', err);
  }

  return { success: true, migratedCount };
}

/**
 * Retrieve user's complete activity feed with accurate unique counts
 */
export async function getUserActivityFeed(userId, visitorId) {
  let records = [];
  const supabase = getSupabase();

  if (supabase) {
    try {
      let query = supabase
        .from('user_activity')
        .select('*')
        .order('updated_at', { ascending: false });

      if (userId && visitorId) {
        query = query.or(`user_id.eq.${userId},visitor_id.eq.${visitorId}`);
      } else if (userId) {
        query = query.eq('user_id', userId);
      } else if (visitorId) {
        query = query.eq('visitor_id', visitorId).is('user_id', null);
      } else {
        return emptyActivityResponse();
      }

      const { data, error } = await query.limit(100);
      if (!error && Array.isArray(data)) {
        records = data;
      }
    } catch (err) {
      console.warn('[Activity] Supabase feed fetch fallback to local store:', err.message);
    }
  }

  // Fallback to local store if Supabase returns empty or table is pending
  if (records.length === 0) {
    try {
      const db = readDb();
      if (db.userActivity) {
        records = db.userActivity.filter((item) => {
          if (userId && item.user_id === userId) return true;
          if (visitorId && item.visitor_id === visitorId) return true;
          return false;
        });
        records.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
      }
    } catch (_) {}
  }

  // Group and deduplicate activity into categories
  const searchesMap = new Map();
  const viewedMap = new Map();
  const shortlistsMap = new Map();
  const contactsMap = new Map();

  for (const item of records) {
    if (item.activity_type === 'search') {
      const qKey = (item.search_query || '').trim().toLowerCase();
      if (qKey && !searchesMap.has(qKey)) {
        searchesMap.set(qKey, {
          id: item.id,
          query: item.search_query,
          filters: item.search_filters || {},
          date: item.updated_at || item.created_at,
          createdAt: item.created_at,
        });
      }
    } else if (item.activity_type === 'view') {
      const pKey = item.property_id || item.property_slug;
      if (pKey && !viewedMap.has(pKey)) {
        viewedMap.set(pKey, {
          id: item.property_id,
          slug: item.property_slug,
          title: item.property_title || 'Untitled Property',
          location: item.property_location,
          price: item.property_price,
          image: item.property_image,
          category: item.category_name,
          date: item.updated_at || item.created_at,
          createdAt: item.created_at,
        });
      }
    } else if (item.activity_type === 'shortlist') {
      const pKey = item.property_id || item.property_slug;
      if (pKey && !shortlistsMap.has(pKey)) {
        shortlistsMap.set(pKey, {
          id: item.property_id,
          slug: item.property_slug,
          title: item.property_title || 'Untitled Property',
          location: item.property_location,
          price: item.property_price,
          image: item.property_image,
          category: item.category_name,
          date: item.updated_at || item.created_at,
          createdAt: item.created_at,
        });
      }
    } else if (item.activity_type === 'contact') {
      const pKey = `${item.property_id || item.property_slug}_${item.contact_method}`;
      if (pKey && !contactsMap.has(pKey)) {
        contactsMap.set(pKey, {
          id: item.property_id,
          slug: item.property_slug,
          title: item.property_title || 'Untitled Property',
          location: item.property_location,
          price: item.property_price,
          image: item.property_image,
          method: item.contact_method || 'general',
          date: item.updated_at || item.created_at,
          createdAt: item.created_at,
        });
      }
    }
  }

  const searches = Array.from(searchesMap.values());
  const viewed = Array.from(viewedMap.values());
  const shortlisted = Array.from(shortlistsMap.values());
  const contacted = Array.from(contactsMap.values());

  return {
    success: true,
    counts: {
      searches: searches.length,
      viewed: viewed.length,
      shortlisted: shortlisted.length,
      contacted: contacted.length,
      total: searches.length + viewed.length + shortlisted.length + contacted.length,
    },
    searches,
    viewed,
    shortlisted,
    contacted,
  };
}

function emptyActivityResponse() {
  return {
    success: true,
    counts: { searches: 0, viewed: 0, shortlisted: 0, contacted: 0, total: 0 },
    searches: [],
    viewed: [],
    shortlisted: [],
    contacted: [],
  };
}
