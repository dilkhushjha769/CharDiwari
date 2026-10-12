'use client';

const VISITOR_STORAGE_KEY = 'dwarkesh_visitor_id';
const VISITOR_COOKIE_NAME = 'dwarkesh_vid';

/**
 * Generate a random first-party anonymous visitor ID
 */
function generateVisitorId() {
  const rand = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    : Math.random().toString(36).slice(2, 14);
  return `vid_${Date.now()}_${rand}`;
}

/**
 * Get or initialize persistent first-party anonymous visitor ID
 */
export function getVisitorId() {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check localStorage
    let vid = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (vid && vid.startsWith('vid_')) {
      return vid;
    }

    // 2. Check cookie fallback
    const match = document.cookie.match(new RegExp(`(^|;\\s*)${VISITOR_COOKIE_NAME}=([^;]+)`));
    if (match && match[2] && match[2].startsWith('vid_')) {
      localStorage.setItem(VISITOR_STORAGE_KEY, match[2]);
      return match[2];
    }

    // 3. Generate new first-party visitor ID
    vid = generateVisitorId();
    localStorage.setItem(VISITOR_STORAGE_KEY, vid);
    document.cookie = `${VISITOR_COOKIE_NAME}=${vid}; path=/; max-age=31536000; SameSite=Lax`;
    return vid;
  } catch (err) {
    return `vid_${Date.now()}_fallback`;
  }
}

/**
 * Rotate the visitor ID after successful migration to an authenticated account
 */
export function rotateVisitorId() {
  if (typeof window === 'undefined') return null;
  try {
    const newVid = generateVisitorId();
    localStorage.setItem(VISITOR_STORAGE_KEY, newVid);
    document.cookie = `${VISITOR_COOKIE_NAME}=${newVid}; path=/; max-age=31536000; SameSite=Lax`;
    return newVid;
  } catch (err) {
    return null;
  }
}

const VIEWS_STORAGE_KEY = 'dwarkesh_viewed_properties';
const SEARCHES_STORAGE_KEY = 'dwarkesh_recent_searches';
const CONTACTS_STORAGE_KEY = 'dwarkesh_contacted_properties';

export function getLocalViewedProperties() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VIEWS_STORAGE_KEY);
    const views = raw ? JSON.parse(raw) : [];

    // Automatically ensure all shortlisted/saved properties are also treated as viewed
    try {
      const savedRaw = localStorage.getItem('dwarkesh_saved_properties');
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        if (Array.isArray(saved) && saved.length > 0) {
          const viewedKeys = new Set(
            views.map((v) => String(v.id || v.slug || '').toLowerCase())
          );
          let modified = false;
          saved.forEach((s) => {
            const key = String(s.id || s.slug || '').toLowerCase();
            if (key && !viewedKeys.has(key)) {
              views.unshift({
                id: s.id,
                slug: s.slug,
                title: s.title || 'Dwarkesh Luxury Property',
                location: s.location || s.city || 'India',
                price: s.price || 'Price on Request',
                image: s.image || '',
                category: s.type || '',
                date: s.savedAt || new Date().toISOString(),
                createdAt: s.savedAt || new Date().toISOString(),
              });
              viewedKeys.add(key);
              modified = true;
            }
          });
          if (modified) {
            localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(views.slice(0, 30)));
          }
        }
      }
    } catch (_) {}

    return views;
  } catch {
    return [];
  }
}

export function getLocalSearches() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SEARCHES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLocalContacted() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CONTACTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function removeLocalSearch(query) {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalSearches();
    const next = current.filter((item) => (item.query || '').toLowerCase() !== (query || '').toLowerCase());
    localStorage.setItem(SEARCHES_STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

/**
 * Helper to retrieve client-side Supabase auth credentials safely
 */
async function getClientAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  let userId = null;
  try {
    const { getSupabaseClient } = await import('@/lib/supabase/client');
    const { client } = getSupabaseClient();
    if (client?.auth) {
      const { data: { session } } = await client.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      if (session?.user?.id) {
        headers['x-user-id'] = session.user.id;
        userId = session.user.id;
      }
    }
  } catch (_) {}
  return { headers, userId };
}

/**
 * Send an activity record to the server for persistence and mirror to local storage
 */
export async function trackUserActivity(data) {
  if (typeof window === 'undefined') return;

  try {
    const visitorId = getVisitorId();
    if (!visitorId) return;

    // 1. Local storage mirroring for zero-latency reliable UI display
    try {
      const nowIso = new Date().toISOString();
      if (data.activityType === 'view' && (data.property || data.propertyTitle)) {
        const p = data.property || {};
        const pId = p.id ?? data.propertyId;
        const pSlug = p.slug ?? data.propertySlug;
        const current = getLocalViewedProperties();
        const filtered = current.filter((item) => {
          if (pId && item.id && String(item.id) === String(pId)) return false;
          if (pSlug && item.slug && item.slug === pSlug) return false;
          return true;
        });
        filtered.unshift({
          id: pId,
          slug: pSlug,
          title: p.title || data.propertyTitle || 'Luxury Property',
          location: p.location || data.propertyLocation || 'India',
          price: p.price || data.propertyPrice || 'Price on Request',
          image: p.image || (Array.isArray(p.images) ? p.images[0] : '') || data.propertyImage || '',
          category: p.type || data.categoryName || '',
          date: nowIso,
          createdAt: nowIso,
        });
        localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(filtered.slice(0, 30)));
      } else if (data.activityType === 'search' && data.searchQuery) {
        const cleanQuery = data.searchQuery.trim();
        if (cleanQuery) {
          const current = getLocalSearches();
          const filtered = current.filter((item) => (item.query || '').toLowerCase() !== cleanQuery.toLowerCase());
          filtered.unshift({
            id: `sch_${Date.now()}`,
            query: cleanQuery,
            filters: data.searchFilters || {},
            date: nowIso,
            createdAt: nowIso,
          });
          localStorage.setItem(SEARCHES_STORAGE_KEY, JSON.stringify(filtered.slice(0, 20)));
        }
      } else if (data.activityType === 'contact' && (data.property || data.propertyTitle)) {
        const p = data.property || {};
        const current = getLocalContacted();
        const method = data.contactMethod || 'whatsapp';
        const filtered = current.filter((item) => {
          const sameProp = (p.id && String(item.id) === String(p.id)) || (p.slug && item.slug === p.slug);
          return !(sameProp && item.method === method);
        });
        filtered.unshift({
          id: p.id ?? data.propertyId,
          slug: p.slug ?? data.propertySlug,
          title: p.title || data.propertyTitle || 'Luxury Property',
          location: p.location || data.propertyLocation || 'India',
          price: p.price || data.propertyPrice || 'Price on Request',
          image: p.image || (Array.isArray(p.images) ? p.images[0] : '') || data.propertyImage || '',
          method,
          date: nowIso,
          createdAt: nowIso,
        });
        localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(filtered.slice(0, 20)));
      }
    } catch (_) {}

    // 2. Dispatch to server API with full authentication headers
    const { headers, userId } = await getClientAuthHeaders();
    const payload = {
      visitorId,
      userId,
      ...data,
    };

    fetch('/api/activity/track', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch (err) {
    // Safe non-blocking failure
  }
}

let isMigrating = false;

/**
 * Triggers server-side migration of anonymous visitor activity to the authenticated user account.
 * Idempotent: safe against concurrent calls, multiple tabs, and retries.
 */
export async function triggerActivityMigration() {
  if (typeof window === 'undefined') return { success: false };
  if (isMigrating) return { success: false, busy: true };

  const visitorId = getVisitorId();
  if (!visitorId) return { success: false };

  isMigrating = true;
  try {
    const { headers, userId } = await getClientAuthHeaders();

    const res = await fetch('/api/activity/migrate', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        visitorId,
        userId,
        localItems: {
          views: getLocalViewedProperties(),
          searches: getLocalSearches(),
          contacts: getLocalContacted(),
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      // On successful migration, rotate anonymous visitor ID
      if (data?.success) {
        rotateVisitorId();
      }
      return data;
    }
    return { success: false };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    isMigrating = false;
  }
}


