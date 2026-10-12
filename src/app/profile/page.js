'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useSavedProperties } from '@/lib/useSavedProperties';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const { savedProperties, removeSaved, clearAllSaved } = useSavedProperties();

  useEffect(() => {
    async function loadUser() {
      // 1. Try Supabase Client session
      const { client } = getSupabaseClient();
      if (client) {
        try {
          const { data: { session } } = await client.auth.getSession();
          if (session && session.user) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Member',
              avatarUrl: session.user.user_metadata?.avatar_url || null,
              provider: session.user.app_metadata?.provider || 'supabase',
              createdAt: session.user.created_at,
            });
            setLoading(false);
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
  }, [router]);

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

  if (loading) {
    return (
      // Skeleton in the shape of the page (header, profile card, two cards,
      // a strip), so it fills in rather than swapping from a spinner.
      <div className="min-h-screen bg-stone-50/40 dark:bg-white flex flex-col font-sans" aria-busy="true">
        <span className="sr-only" role="status">Loading your profile…</span>
        <div className="border-b border-stone-200/80 bg-white/90 h-16" />
        <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 motion-safe:animate-pulse">
          <div className="rounded-3xl border border-stone-200/80 dark:border-stone-300 bg-white dark:bg-stone-50 p-6 sm:p-8 mb-8 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-stone-100" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-48 max-w-full rounded bg-stone-100" />
              <div className="h-3.5 w-64 max-w-full rounded bg-stone-100" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {[0, 1].map((card) => (
              <div key={card} className="h-56 rounded-2xl border border-stone-200/80 dark:border-stone-300 bg-white dark:bg-stone-50 p-6 space-y-4">
                <div className="h-4 w-32 rounded bg-stone-100" />
                <div className="h-3 w-full rounded bg-stone-100" />
                <div className="h-3 w-5/6 rounded bg-stone-100" />
                <div className="h-3 w-2/3 rounded bg-stone-100" />
              </div>
            ))}
          </div>
          <div className="h-24 rounded-2xl border border-stone-200/80 dark:border-stone-300 bg-white dark:bg-stone-50" />
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
    <div className="min-h-screen bg-stone-50/40 dark:bg-white text-stone-900 flex flex-col font-sans selection:bg-stone-900 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group rounded-lg focus-ring">
            <img
              src="/dwarkesh-logo-transparent.png"
              alt="Dwarkesh Real Estate Group"
              className="h-8 w-auto max-w-[50px] object-contain transition-transform group-hover:scale-105 drop-shadow-xs"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold tracking-[0.14em] text-stone-900 text-sm uppercase leading-none">
                Dwarkesh
              </span>
              <span className="text-[9px] font-semibold tracking-[0.20em] text-stone-500 uppercase font-sans mt-0.5">
                Real Estate Group
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition focus-ring"
            >
              Browse Properties
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 transition cursor-pointer disabled:opacity-50 focus-ring"
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
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* User Greeting & Header Card */}
        <div className="bg-white dark:bg-stone-50 rounded-3xl border border-stone-200/80 dark:border-stone-300 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-serif text-2xl font-bold shadow-sm">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 font-normal text-balance">
                    {user.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified Member</span>
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  {user.email} • Member since {joinDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/#collection"
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm focus-ring"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Explore Homes</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Card 1: Account Credentials */}
          <div className="rounded-2xl border border-stone-200/80 dark:border-stone-300 bg-white dark:bg-stone-50 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Account Details
                </h2>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>Email Address</span>
                  </span>
                  <span className="text-stone-900 font-medium truncate max-w-[200px]">
                    {user.email}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>Display Name</span>
                  </span>
                  <span className="text-stone-900 font-medium">{user.name}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Member Since</span>
                  </span>
                  <span className="text-stone-900 font-medium">{joinDate}</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-stone-500 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Account Status</span>
                  </span>
                  <span className="text-emerald-700 font-semibold">Active & Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Saved Properties & Preferences */}
          <div className="rounded-2xl border border-stone-200/80 dark:border-stone-300 bg-white dark:bg-stone-50 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Shortlisted & Saved
                  </h2>
                  {savedProperties.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {savedProperties.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {savedProperties.length > 1 && (
                    <button
                      type="button"
                      onClick={clearAllSaved}
                      className="text-[11px] text-stone-400 hover:text-stone-700 transition cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                  <Heart className={`w-4 h-4 ${savedProperties.length > 0 ? 'text-rose-500 fill-rose-500' : 'text-stone-400'}`} />
                </div>
              </div>

              {savedProperties.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-stone-900 mb-1">
                    No saved properties yet
                  </p>
                  <p className="text-[11px] text-stone-500 max-w-xs mb-4 text-pretty">
                    Browse our curated collections of luxury villas and penthouses to save your favorites.
                  </p>
                  <Link
                    href="/#collection"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-900 transition focus-ring"
                  >
                    <span>Browse Collection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {savedProperties.map((prop) => (
                    <div
                      key={prop.id || prop.slug}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200/80 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50 transition group"
                    >
                      {prop.image ? (
                        <img
                          src={prop.image}
                          alt={prop.title}
                          className="w-14 h-14 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-stone-200 flex items-center justify-center shrink-0 text-stone-400">
                          <Building2 className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/property/${prop.slug || prop.id}`}
                          className="text-xs font-bold text-stone-900 hover:text-stone-700 truncate block transition-colors"
                        >
                          {prop.title}
                        </Link>
                        <p className="text-[11px] text-stone-500 flex items-center gap-1 truncate mt-0.5">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{prop.location || prop.city}</span>
                        </p>
                        <p className="text-xs font-semibold text-stone-900 font-serif mt-1">
                          {prop.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/property/${prop.slug || prop.id}`}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-white transition"
                          title="View property details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeSaved(prop.id || prop.slug)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-white transition cursor-pointer"
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
          </div>
        </div>

        {/* Free Consultation Callout */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-300 bg-white dark:bg-stone-50 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 text-balance">
              Need personal property advisory?
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 text-pretty">
              Connect directly with our senior relationship managers for free advisory.
            </p>
          </div>
          <a
            href="tel:+919876543210"
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap cursor-pointer focus-ring"
          >
            <Phone className="w-3.5 h-3.5 text-stone-700" />
            <span>Call +91 98765 43210</span>
          </a>
        </div>
      </main>
    </div>
  );
}
