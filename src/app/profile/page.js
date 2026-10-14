'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
  User,
  Heart,
  Home,
  Phone,
  Mail,
  Calendar,
  Trash2,
  MapPin,
  ExternalLink,
  Search,
  Eye,
  MessageCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useSavedProperties } from '@/lib/useSavedProperties';
import {
  getVisitorId,
  getLocalViewedProperties,
  getLocalSearches,
  getLocalContacted,
  removeLocalSearch,
} from '@/lib/visitor';

function WhatsAppIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Recently';
  }
}

const ITEMS_PER_PAGE = 6;

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const { savedProperties, removeSaved, clearAllSaved } = useSavedProperties();

  // Activity Feed State
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(null);
  const [activity, setActivity] = useState({
    counts: { searches: 0, viewed: 0, shortlisted: 0, contacted: 0, total: 0 },
    searches: [],
    viewed: [],
    shortlisted: [],
    contacted: [],
  });

  // Active Tab: 'searches' | 'viewed' | 'shortlisted' | 'contacted'
  const [activeTab, setActiveTab] = useState('shortlisted');
  const [page, setPage] = useState(1);

  // My Listed Properties & Real-Time Review Tracker
  const [myProperties, setMyProperties] = useState([]);
  const [myPropertiesLoading, setMyPropertiesLoading] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');
  const [trackError, setTrackError] = useState('');

  const fetchMyProperties = useCallback(async (customQuery = null) => {
    setMyPropertiesLoading(true);
    setTrackError('');
    try {
      let q = customQuery !== null ? customQuery : trackQuery;
      if (!q) {
        let stored = [];
        try {
          stored = JSON.parse(localStorage.getItem('my_property_submissions') || '[]');
        } catch (_) {}
        q = (user?.phone) || (user?.email) || (stored[0]?.phone) || (stored[0]?.ref) || '';
      }
      if (!q) {
        setMyProperties([]);
        return;
      }
      const res = await fetch(`/api/properties/track?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok) {
        setMyProperties(data.properties || []);
      } else {
        setTrackError(data.error || 'Failed to track properties.');
      }
    } catch (err) {
      setTrackError('Error connecting to property tracking service.');
    } finally {
      setMyPropertiesLoading(false);
    }
  }, [user, trackQuery]);

  // Fetch Activity Feed from Server & merge with client storage
  const fetchActivity = useCallback(async (activeUserId = null) => {
    setActivityLoading(true);
    setActivityError(null);
    try {
      const vid = getVisitorId();
      const params = new URLSearchParams();
      if (vid) params.set('visitorId', vid);
      if (activeUserId) params.set('userId', activeUserId);

      // Prepare request headers with auth tokens
      const headers = { 'Content-Type': 'application/json' };
      const { client } = getSupabaseClient();
      if (client?.auth) {
        try {
          const { data: { session } } = await client.auth.getSession();
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
          if (session?.user?.id) {
            headers['x-user-id'] = session.user.id;
            params.set('userId', session.user.id);
          }
        } catch (_) {}
      }

      const url = `/api/activity/list?${params.toString()}`;
      const res = await fetch(url, { headers, cache: 'no-store' });
      let serverData = { searches: [], viewed: [], shortlisted: [], contacted: [] };

      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          serverData = data;
        }
      }

      // Merge server records with client localStorage to guarantee zero data loss
      const localViews = getLocalViewedProperties();
      const localSearches = getLocalSearches();
      const localContacts = getLocalContacted();

      // 1. Deduplicate Shortlisted (merging savedProperties external store)
      const shortlistedMap = new Map();
      (serverData.shortlisted || []).forEach((s) => {
        const key = String(s.id || s.slug || '').toLowerCase();
        if (key) shortlistedMap.set(key, s);
      });
      (savedProperties || []).forEach((s) => {
        const key = String(s.id || s.slug || '').toLowerCase();
        if (key && !shortlistedMap.has(key)) {
          shortlistedMap.set(key, {
            id: s.id,
            slug: s.slug,
            title: s.title || 'Dwarkesh Luxury Property',
            location: s.location || s.city || 'India',
            price: s.price || 'Price on Request',
            image: s.image || '',
            category: s.type || '',
            date: s.savedAt || new Date().toISOString(),
          });
        }
      });
      const mergedShortlisted = Array.from(shortlistedMap.values());

      // 2. Deduplicate Views (including any properties user shortlisted or explored)
      const viewedMap = new Map();
      (serverData.viewed || []).forEach((v) => {
        const key = String(v.id || v.slug || '').toLowerCase();
        if (key) viewedMap.set(key, v);
      });
      localViews.forEach((v) => {
        const key = String(v.id || v.slug || '').toLowerCase();
        if (key && !viewedMap.has(key)) viewedMap.set(key, v);
      });
      // Any property that is shortlisted is by definition viewed/explored
      mergedShortlisted.forEach((s) => {
        const key = String(s.id || s.slug || '').toLowerCase();
        if (key && !viewedMap.has(key)) {
          viewedMap.set(key, {
            ...s,
            date: s.date || new Date().toISOString(),
          });
        }
      });
      const mergedViewed = Array.from(viewedMap.values());

      // 3. Deduplicate Searches
      const searchesMap = new Map();
      (serverData.searches || []).forEach((s) => {
        const key = (s.query || '').trim().toLowerCase();
        if (key) searchesMap.set(key, s);
      });
      localSearches.forEach((s) => {
        const key = (s.query || '').trim().toLowerCase();
        if (key && !searchesMap.has(key)) searchesMap.set(key, s);
      });

      // If user explored properties but has 0 explicit searches, provide their explored locations
      if (searchesMap.size === 0 && mergedShortlisted.length > 0) {
        const locationsSeen = new Set();
        mergedShortlisted.forEach((p) => {
          const loc = (p.location || '').split(',').pop()?.trim() || p.location;
          if (loc && !locationsSeen.has(loc.toLowerCase())) {
            locationsSeen.add(loc.toLowerCase());
            searchesMap.set(loc.toLowerCase(), {
              id: `sch_loc_${loc.toLowerCase().replace(/\s+/g, '_')}`,
              query: loc,
              filters: { city: loc },
              date: p.date || new Date().toISOString(),
              createdAt: p.date || new Date().toISOString(),
            });
          }
        });
      }
      const mergedSearches = Array.from(searchesMap.values());

      // 4. Deduplicate Contacted
      const contactsMap = new Map();
      (serverData.contacted || []).forEach((c) => {
        const key = `${c.id || c.slug}_${c.method}`.toLowerCase();
        if (key) contactsMap.set(key, c);
      });
      localContacts.forEach((c) => {
        const key = `${c.id || c.slug}_${c.method}`.toLowerCase();
        if (key && !contactsMap.has(key)) contactsMap.set(key, c);
      });
      const mergedContacted = Array.from(contactsMap.values());

      setActivity({
        counts: {
          searches: mergedSearches.length,
          viewed: mergedViewed.length,
          shortlisted: mergedShortlisted.length,
          contacted: mergedContacted.length,
          total: mergedSearches.length + mergedViewed.length + mergedShortlisted.length + mergedContacted.length,
        },
        searches: mergedSearches,
        viewed: mergedViewed,
        shortlisted: mergedShortlisted,
        contacted: mergedContacted,
      });
    } catch (err) {
      console.warn('[Profile] Failed to fetch activity feed:', err);
      setActivityError(err.message || 'Could not load activity feed');
    } finally {
      setActivityLoading(false);
    }
  }, [savedProperties]);

  useEffect(() => {
    async function loadUser() {
      // 1. Try Supabase Client session
      const { client } = getSupabaseClient();
      if (client) {
        try {
          const { data: { session } } = await client.auth.getSession();
          if (session && session.user) {
            const u = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Member',
              avatarUrl: session.user.user_metadata?.avatar_url || null,
              provider: session.user.app_metadata?.provider || 'supabase',
              createdAt: session.user.created_at,
            };
            setUser(u);
            setLoading(false);
            fetchActivity(u.id);
            return;
          }
        } catch {
          // fallback
        }
      }

      // 2. Try legacy/internal endpoint as fallback
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            setLoading(false);
            fetchActivity(data.user.id);
            fetchMyProperties(data.user.phone || data.user.email);
            return;
          }
        }
      } catch {
        // failed
      }

      // If neither, redirect to auth with return to profile
      router.push('/auth?redirect=/profile');
      setLoading(false);
    }

    loadUser();
  }, [router, fetchActivity]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { client } = getSupabaseClient();
      if (client) {
        await client.auth.signOut();
      }
      if (typeof document !== 'undefined') {
        document.cookie = 'dwarkesh_session=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'chardiwari_session=; path=/; max-age=0; SameSite=Lax';
      }
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      router.push('/');
    }
  };

  // Delete search item
  const handleDeleteSearch = async (query) => {
    removeLocalSearch(query);
    try {
      const vid = getVisitorId();
      await fetch('/api/activity/track', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: vid,
          activityType: 'search',
          searchQuery: query,
        }),
      });
      setActivity((prev) => {
        const nextSearches = prev.searches.filter((s) => (s.query || '').toLowerCase() !== (query || '').toLowerCase());
        return {
          ...prev,
          counts: { ...prev.counts, searches: nextSearches.length },
          searches: nextSearches,
        };
      });
    } catch (_) {}
  };

  // Remove shortlist item
  const handleRemoveShortlist = async (propId) => {
    removeSaved(propId);
    try {
      const vid = getVisitorId();
      await fetch('/api/activity/track', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: vid,
          activityType: 'shortlist',
          propertyId: propId,
        }),
      });
      setActivity((prev) => {
        const nextShortlisted = prev.shortlisted.filter((p) => String(p.id) !== String(propId) && p.slug !== propId);
        return {
          ...prev,
          counts: { ...prev.counts, shortlisted: nextShortlisted.length },
          shortlisted: nextShortlisted,
        };
      });
    } catch (_) {}
  };

  // Reset page when switching tabs
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setPage(1);
  };

  // Current tab items & pagination
  const currentTabItems = useMemo(() => {
    if (activeTab === 'searches') return activity.searches || [];
    if (activeTab === 'viewed') return activity.viewed || [];
    if (activeTab === 'shortlisted') return activity.shortlisted || [];
    if (activeTab === 'contacted') return activity.contacted || [];
    return [];
  }, [activeTab, activity]);

  const totalPages = Math.max(1, Math.ceil(currentTabItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return currentTabItems.slice(start, start + ITEMS_PER_PAGE);
  }, [currentTabItems, page]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50/40 flex flex-col font-sans" aria-busy="true">
        <span className="sr-only" role="status">Loading your profile…</span>
        <div className="border-b border-stone-200/80 bg-white/90 h-16" />
        <div className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-6 sm:py-10 motion-safe:animate-pulse">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-5 sm:p-8 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-stone-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 max-w-full rounded bg-stone-100" />
              <div className="h-3.5 w-56 max-w-full rounded bg-stone-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
            {[0, 1, 2, 3].map((card) => (
              <div key={card} className="h-24 sm:h-28 rounded-2xl border border-stone-200/80 bg-white p-3.5 space-y-2">
                <div className="h-3 w-16 rounded bg-stone-100" />
                <div className="h-6 w-12 rounded bg-stone-100" />
              </div>
            ))}
          </div>
          <div className="h-64 rounded-2xl border border-stone-200/80 bg-white" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <div className="min-h-screen bg-stone-50/40 text-stone-900 flex flex-col font-sans selection:bg-stone-900 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-xl sticky top-0 z-40 shadow-2xs">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group rounded-lg focus-ring">
            <img
              src="/dwarkesh-logo-transparent.png"
              alt="Dwarkesh Real Estate Group"
              className="h-7 sm:h-8 w-auto max-w-[46px] object-contain transition-transform group-hover:scale-105 drop-shadow-xs"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold tracking-[0.14em] text-stone-900 text-xs sm:text-sm uppercase leading-none">
                Dwarkesh
              </span>
              <span className="text-[8px] sm:text-[9px] font-semibold tracking-[0.20em] text-stone-500 uppercase font-sans mt-0.5">
                Real Estate Group
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/post-property"
              className="text-xs font-semibold text-white bg-stone-900 hover:bg-black px-3.5 py-1.5 rounded-xl transition focus-ring shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Property</span>
            </Link>

            <Link
              href="/"
              className="hidden sm:inline-block text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition focus-ring"
            >
              Browse Properties
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 transition cursor-pointer disabled:opacity-50 focus-ring shadow-xs"
            >
              {loggingOut ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5 text-stone-500" />
              )}
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* User Greeting & Header Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 p-4 sm:p-7 shadow-sm mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-stone-900 text-white flex items-center justify-center font-serif text-xl sm:text-2xl font-bold shadow-xs shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
                  <h1 className="text-xl sm:text-2xl font-serif text-stone-900 font-bold truncate">
                    {user.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-stone-500 truncate">
                  {user.email} • Joined {joinDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href="/post-property"
                className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs focus-ring"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Property (Free)</span>
              </Link>
              <Link
                href="/search"
                className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs focus-ring"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Explore Homes</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MY LISTED PROPERTIES & REAL-TIME STATUS TRACKER */}
        {/* ============================================================== */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 p-4 sm:p-7 shadow-sm mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-stone-100 gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-stone-900" />
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-900">
                  My Listed Properties &amp; Review Status
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                Track whether your posted properties are Under Review, Approved &amp; Live, or Rejected.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/post-property"
                className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post New Property</span>
              </Link>
            </div>
          </div>

          {/* Quick Track Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchMyProperties();
            }}
            className="flex gap-2 mb-4"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Track by phone number or DW-SUB-... reference"
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition font-mono"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="submit"
              disabled={myPropertiesLoading}
              className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              {myPropertiesLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Track Status'}
            </button>
          </form>

          {trackError && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{trackError}</span>
            </div>
          )}

          {/* Properties Grid or Empty State */}
          {myPropertiesLoading ? (
            <div className="p-6 text-center text-xs text-stone-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-stone-700" />
              <span>Fetching listing status...</span>
            </div>
          ) : myProperties.length === 0 ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-stone-50/70 border border-stone-200/80 text-center space-y-2">
              <Building2 className="w-8 h-8 text-stone-400 mx-auto" />
              <h3 className="text-xs sm:text-sm font-bold text-stone-800">
                No Listed Properties Found Yet
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                Have a residence, penthouse, or villa to sell or lease? Post it directly to our verified luxury audience.
              </p>
              <div className="pt-2">
                <Link
                  href="/post-property"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-black transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post Your Property (Free)</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {myProperties.map((p) => {
                const isPending = p.status === 'pending_review' || p.status === 'pending';
                const isPublished = p.status === 'published';
                const isRejected = p.status === 'rejected';

                return (
                  <div
                    key={p.id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2.5 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200 relative">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400 text-[10px]">
                                No photo
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono text-[10px] font-bold text-stone-400 block truncate">
                              {p.submission_ref}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                              {p.title}
                            </h4>
                            <span className="text-[11px] text-stone-500 truncate block">
                              {p.location || p.city} &bull; <strong className="text-stone-800">{p.price}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                            <RefreshCw className="w-2.5 h-2.5 text-amber-600 animate-spin" />
                            <span>Under Review</span>
                          </span>
                        )}
                        {isPublished && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Live</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1 shrink-0">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        {p.status_description}
                      </p>

                      {/* Rejection Note from Admin */}
                      {isRejected && p.admin_review_note && (
                        <div className="mt-2 p-2.5 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 text-xs space-y-1">
                          <div className="font-bold flex items-center gap-1 text-[11px] text-rose-950">
                            <AlertCircle className="w-3 h-3 text-rose-700" />
                            <span>Editorial Feedback:</span>
                          </div>
                          <p className="text-[11px] leading-relaxed">{p.admin_review_note}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                      <span className="text-stone-400">
                        {p.submitted_at ? formatDate(p.submitted_at) : 'Recent'}
                      </span>
                      {isPublished && p.live_url ? (
                        <Link
                          href={p.live_url}
                          target="_blank"
                          className="font-semibold text-stone-900 hover:underline flex items-center gap-1"
                        >
                          <span>View on Marketplace</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <Link
                          href="/post-property"
                          className="font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1"
                        >
                          <span>Post Another</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 4 CLICKABLE ACTIVITY METRIC CARDS (MOBILE OPTIMIZED) */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
          {/* Card 1: Recent Searches */}
          <button
            type="button"
            onClick={() => handleTabChange('searches')}
            className={`text-left p-3.5 sm:p-5 rounded-2xl border transition-all cursor-pointer group shadow-2xs relative overflow-hidden active:scale-[0.98] ${
              activeTab === 'searches'
                ? 'bg-stone-900 text-white border-stone-900 ring-2 ring-stone-900/10'
                : 'bg-white text-stone-900 border-stone-200/80 hover:border-stone-400 hover:bg-stone-50/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                activeTab === 'searches' ? 'text-stone-300' : 'text-stone-500'
              }`}>
                Searches
              </span>
              <Search className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                activeTab === 'searches' ? 'text-white' : 'text-stone-400'
              }`} />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums leading-tight">
              {activity.counts.searches || 0}
            </div>
            <p className={`text-[10px] sm:text-[11px] mt-0.5 truncate ${
              activeTab === 'searches' ? 'text-stone-300' : 'text-stone-400'
            }`}>
              Queries &amp; filters
            </p>
            {activeTab === 'searches' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0078db]" />
            )}
          </button>

          {/* Card 2: Viewed */}
          <button
            type="button"
            onClick={() => handleTabChange('viewed')}
            className={`text-left p-3.5 sm:p-5 rounded-2xl border transition-all cursor-pointer group shadow-2xs relative overflow-hidden active:scale-[0.98] ${
              activeTab === 'viewed'
                ? 'bg-stone-900 text-white border-stone-900 ring-2 ring-stone-900/10'
                : 'bg-white text-stone-900 border-stone-200/80 hover:border-stone-400 hover:bg-stone-50/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                activeTab === 'viewed' ? 'text-stone-300' : 'text-stone-500'
              }`}>
                Viewed
              </span>
              <Eye className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                activeTab === 'viewed' ? 'text-white' : 'text-stone-400'
              }`} />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums leading-tight">
              {activity.counts.viewed || 0}
            </div>
            <p className={`text-[10px] sm:text-[11px] mt-0.5 truncate ${
              activeTab === 'viewed' ? 'text-stone-300' : 'text-stone-400'
            }`}>
              Properties explored
            </p>
            {activeTab === 'viewed' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white" />
            )}
          </button>

          {/* Card 3: Shortlisted */}
          <button
            type="button"
            onClick={() => handleTabChange('shortlisted')}
            className={`text-left p-3.5 sm:p-5 rounded-2xl border transition-all cursor-pointer group shadow-2xs relative overflow-hidden active:scale-[0.98] ${
              activeTab === 'shortlisted'
                ? 'bg-stone-900 text-white border-stone-900 ring-2 ring-stone-900/10'
                : 'bg-white text-stone-900 border-stone-200/80 hover:border-stone-400 hover:bg-stone-50/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                activeTab === 'shortlisted' ? 'text-stone-300' : 'text-stone-500'
              }`}>
                Shortlisted
              </span>
              <Heart className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                activeTab === 'shortlisted' ? 'text-rose-400 fill-rose-400' : 'text-rose-500'
              }`} />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums leading-tight">
              {activity.counts.shortlisted || 0}
            </div>
            <p className={`text-[10px] sm:text-[11px] mt-0.5 truncate ${
              activeTab === 'shortlisted' ? 'text-stone-300' : 'text-stone-400'
            }`}>
              Saved portfolio
            </p>
            {activeTab === 'shortlisted' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
            )}
          </button>

          {/* Card 4: Contacted */}
          <button
            type="button"
            onClick={() => handleTabChange('contacted')}
            className={`text-left p-3.5 sm:p-5 rounded-2xl border transition-all cursor-pointer group shadow-2xs relative overflow-hidden active:scale-[0.98] ${
              activeTab === 'contacted'
                ? 'bg-stone-900 text-white border-stone-900 ring-2 ring-stone-900/10'
                : 'bg-white text-stone-900 border-stone-200/80 hover:border-stone-400 hover:bg-stone-50/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                activeTab === 'contacted' ? 'text-stone-300' : 'text-stone-500'
              }`}>
                Contacted
              </span>
              <Phone className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                activeTab === 'contacted' ? 'text-emerald-400' : 'text-emerald-600'
              }`} />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums leading-tight">
              {activity.counts.contacted || 0}
            </div>
            <p className={`text-[10px] sm:text-[11px] mt-0.5 truncate ${
              activeTab === 'contacted' ? 'text-stone-300' : 'text-stone-400'
            }`}>
              Inquiries initiated
            </p>
            {activeTab === 'contacted' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
            )}
          </button>
        </div>

        {/* ============================================================== */}
        {/* ACTIVITY DETAIL SECTION WITH MOBILE-PERFECT TAB BAR */}
        {/* ============================================================== */}
        <section
          id="activity-tabs-section"
          className="rounded-2xl sm:rounded-3xl border border-stone-200/80 bg-white p-3.5 sm:p-7 shadow-sm mb-6"
        >
          {/* Header Row with Title & Refresh Action */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 gap-2 mb-3 sm:mb-5">
            <div>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-700">
                Activity Portfolio
              </h2>
              <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5">
                Eligible activity preserved across sessions &amp; devices
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchActivity(user?.id)}
              disabled={activityLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 text-[11px] font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition cursor-pointer shrink-0"
              title="Refresh activity"
            >
              <RefreshCw className={`w-3 h-3 ${activityLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Feed</span>
            </button>
          </div>

          {/* Segmented 4-Tab Control: 100% Mobile Responsive, Never Clips, Never Breaks Lines */}
          <div className="grid grid-cols-4 gap-1 sm:gap-2 p-1 sm:p-1.5 bg-stone-100/90 rounded-2xl mb-4 sm:mb-6 border border-stone-200/50">
            <button
              type="button"
              onClick={() => handleTabChange('shortlisted')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'shortlisted'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'shortlisted' ? 'text-rose-400 fill-rose-400' : 'text-rose-500'}`} />
              <span className="sm:hidden text-[10px]">Saved</span>
              <span className="hidden sm:inline">Shortlisted</span>
              <span className={`inline-flex items-center justify-center min-w-[16px] h-4 sm:min-w-[18px] sm:h-[18px] px-1 rounded-full text-[9px] sm:text-[10px] font-mono font-bold ${
                activeTab === 'shortlisted' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-800'
              }`}>
                {activity.counts.shortlisted || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('viewed')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'viewed'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] sm:text-xs">Viewed</span>
              <span className={`inline-flex items-center justify-center min-w-[16px] h-4 sm:min-w-[18px] sm:h-[18px] px-1 rounded-full text-[9px] sm:text-[10px] font-mono font-bold ${
                activeTab === 'viewed' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-800'
              }`}>
                {activity.counts.viewed || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('searches')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'searches'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden text-[10px]">Search</span>
              <span className="hidden sm:inline">Searches</span>
              <span className={`inline-flex items-center justify-center min-w-[16px] h-4 sm:min-w-[18px] sm:h-[18px] px-1 rounded-full text-[9px] sm:text-[10px] font-mono font-bold ${
                activeTab === 'searches' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-800'
              }`}>
                {activity.counts.searches || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('contacted')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'contacted'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <Phone className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span className="sm:hidden text-[10px]">Contact</span>
              <span className="hidden sm:inline">Contacted</span>
              <span className={`inline-flex items-center justify-center min-w-[16px] h-4 sm:min-w-[18px] sm:h-[18px] px-1 rounded-full text-[9px] sm:text-[10px] font-mono font-bold ${
                activeTab === 'contacted' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-800'
              }`}>
                {activity.counts.contacted || 0}
              </span>
            </button>
          </div>

          {/* Activity Error Notice */}
          {activityError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <span>{activityError}</span>
              <button
                type="button"
                onClick={() => fetchActivity(user?.id)}
                className="font-bold underline hover:no-underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Activity Loading Skeleton */}
          {activityLoading && currentTabItems.length === 0 ? (
            <div className="space-y-3 py-6 motion-safe:animate-pulse">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-stone-100 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* TAB: SHORTLISTED */}
              {activeTab === 'shortlisted' && (
                <div>
                  {currentTabItems.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-2.5">
                        <Heart className="w-6 h-6 fill-rose-500" />
                      </div>
                      <h3 className="text-sm font-bold text-stone-800 mb-1">Your shortlist is empty</h3>
                      <p className="text-xs text-stone-500 max-w-sm mb-4">
                        Tap the heart icon on any villa or penthouse to save it to your private shortlist.
                      </p>
                      <Link
                        href="/#collection"
                        className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold transition"
                      >
                        Browse Homes
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {paginatedItems.map((prop) => (
                        <div
                          key={prop.id || prop.slug}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-stone-200/90 hover:border-stone-400 bg-stone-50/60 hover:bg-stone-50 transition group"
                        >
                          <Link
                            href={`/property/${prop.slug || prop.id}`}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200/80 relative block"
                          >
                            {prop.image ? (
                              <img
                                src={prop.image}
                                alt={prop.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Building2 className="w-6 h-6" />
                              </div>
                            )}
                          </Link>

                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/property/${prop.slug || prop.id}`}
                              className="text-xs sm:text-sm font-bold text-stone-900 hover:text-[#0078db] truncate block transition-colors leading-tight"
                            >
                              {prop.title}
                            </Link>
                            <p className="text-[11px] text-stone-500 flex items-center gap-1 truncate mt-0.5">
                              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate">{prop.location || 'India'}</span>
                            </p>
                            <p className="text-xs sm:text-sm font-bold text-stone-900 font-serif mt-1">
                              {prop.price || 'Price on Request'}
                            </p>
                          </div>

                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <Link
                              href={`/property/${prop.slug || prop.id}`}
                              className="p-2 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-white transition"
                              title="View details"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleRemoveShortlist(prop.id || prop.slug)}
                              className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-white transition cursor-pointer"
                              title="Remove from saved"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: VIEWED */}
              {activeTab === 'viewed' && (
                <div>
                  {currentTabItems.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mb-2.5">
                        <Eye className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-stone-800 mb-1">No viewed properties yet</h3>
                      <p className="text-xs text-stone-500 max-w-sm mb-4">
                        Properties you explore on the website will appear here automatically.
                      </p>
                      <Link
                        href="/#collection"
                        className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold transition"
                      >
                        Explore Collection
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {paginatedItems.map((prop) => (
                        <div
                          key={prop.id || prop.slug}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-stone-200/90 hover:border-stone-400 bg-stone-50/60 hover:bg-stone-50 transition group"
                        >
                          <Link
                            href={`/property/${prop.slug || prop.id}`}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200/80 relative block"
                          >
                            {prop.image ? (
                              <img
                                src={prop.image}
                                alt={prop.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Building2 className="w-6 h-6" />
                              </div>
                            )}
                          </Link>

                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/property/${prop.slug || prop.id}`}
                              className="text-xs sm:text-sm font-bold text-stone-900 hover:text-[#0078db] truncate block transition-colors leading-tight"
                            >
                              {prop.title}
                            </Link>
                            <p className="text-[11px] text-stone-500 flex items-center gap-1 truncate mt-0.5">
                              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate">{prop.location || 'India'}</span>
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs sm:text-sm font-bold text-stone-900 font-serif">
                                {prop.price || 'Price on Request'}
                              </span>
                              <span className="text-[10px] text-stone-400">
                                {formatDate(prop.date || prop.createdAt)}
                              </span>
                            </div>
                          </div>

                          <Link
                            href={`/property/${prop.slug || prop.id}`}
                            className="p-2 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-white transition shrink-0"
                            title="Open property"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: RECENT SEARCHES */}
              {activeTab === 'searches' && (
                <div>
                  {currentTabItems.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mb-2.5">
                        <Search className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-stone-800 mb-1">No recent searches</h3>
                      <p className="text-xs text-stone-500 max-w-sm mb-4">
                        Search queries and applied filters will be saved here for instant re-runs.
                      </p>
                      <Link
                        href="/search"
                        className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold transition"
                      >
                        Start Searching
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {paginatedItems.map((item) => (
                        <div
                          key={item.id || item.query}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 rounded-xl border border-stone-200/90 hover:border-stone-400 bg-stone-50/60 hover:bg-stone-50 transition gap-2.5"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                              <Search className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/search?q=${encodeURIComponent(item.query)}`}
                                className="text-xs sm:text-sm font-bold text-stone-900 hover:text-[#0078db] transition-colors truncate block"
                              >
                                &ldquo;{item.query}&rdquo;
                              </Link>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{formatDate(item.date || item.createdAt)}</span>
                                </span>
                                {item.filters?.city && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-200 text-stone-700 font-medium">
                                    {item.filters.city}
                                  </span>
                                )}
                                {item.filters?.type && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-200 text-stone-700 font-medium">
                                    {item.filters.type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <Link
                              href={`/search?q=${encodeURIComponent(item.query)}`}
                              className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
                            >
                              <span>Search Again</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteSearch(item.query)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-white transition cursor-pointer"
                              title="Remove search"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: CONTACTED */}
              {activeTab === 'contacted' && (
                <div>
                  {currentTabItems.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                        <Phone className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-stone-800 mb-1">No contact actions recorded</h3>
                      <p className="text-xs text-stone-500 max-w-sm mb-4">
                        When you reach out via Call or WhatsApp on any property, your inquiry trail appears here.
                      </p>
                      <Link
                        href="/#collection"
                        className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold transition"
                      >
                        Explore Properties
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {paginatedItems.map((item) => (
                        <div
                          key={item.id || `${item.slug}_${item.method}`}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-stone-200/90 hover:border-stone-400 bg-stone-50/60 hover:bg-stone-50 transition"
                        >
                          <Link
                            href={`/property/${item.slug || item.id}`}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200/80 relative block"
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Building2 className="w-5 h-5" />
                              </div>
                            )}
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              {item.method === 'whatsapp' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#25D366]/15 text-[#128C7E] font-bold text-[10px]">
                                  <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                                  <span>WhatsApp</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px]">
                                  <Phone className="w-3 h-3 fill-current text-blue-600" />
                                  <span>Call</span>
                                </span>
                              )}
                              <span className="text-[10px] text-stone-400">
                                {formatDate(item.date || item.createdAt)}
                              </span>
                            </div>

                            <Link
                              href={`/property/${item.slug || item.id}`}
                              className="text-xs sm:text-sm font-bold text-stone-900 hover:text-stone-700 truncate block leading-tight"
                            >
                              {item.title}
                            </Link>
                            <p className="text-[11px] text-stone-500 truncate mt-0.5">
                              {item.location || 'India'}
                            </p>
                          </div>

                          <Link
                            href={`/property/${item.slug || item.id}`}
                            className="p-2 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-white transition shrink-0"
                            title="Open property"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-100">
                  <p className="text-[11px] text-stone-500">
                    {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, currentTabItems.length)} of {currentTabItems.length}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-50 flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <span className="text-xs font-mono px-1">
                      {page}/{totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-50 flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Account Details & Advisory Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Card 1: Account Credentials */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Account Details
                </h2>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>Email</span>
                  </span>
                  <span className="text-stone-900 font-medium truncate max-w-[180px]">
                    {user.email}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>Name</span>
                  </span>
                  <span className="text-stone-900 font-medium">{user.name}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Member Since</span>
                  </span>
                  <span className="text-stone-900 font-medium">{joinDate}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-stone-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Status</span>
                  </span>
                  <span className="text-emerald-700 font-semibold">Active &amp; Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Property Advisory Help */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Personal Advisory
                </h2>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-stone-900 mb-1">
                Need guidance on your saved properties?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Connect directly with our senior luxury property consultants for priority site visits and bespoke negotiations.
              </p>
            </div>
            <a
              href="tel:+919876543210"
              className="mt-3 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call +91 98765 43210</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
