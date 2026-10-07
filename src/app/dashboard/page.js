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
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

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
              name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
              provider: session.user.app_metadata?.provider || 'supabase',
              createdAt: session.user.created_at,
            });
            setLoading(false);
            return;
          }
        } catch {
          // fallback to next api
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

      // If neither, redirect to auth
      router.push('/auth');
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
        document.cookie = 'chardiwari_session=; path=/; max-age=0; SameSite=Lax';
      }
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      router.push('/auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white text-black font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-black" />
          <p className="text-zinc-500">Entering sanctuary portal...</p>
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
    <div className="min-h-screen bg-white text-black bg-grid-light flex flex-col selection:bg-black selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-3.5 h-3.5 border border-white grid grid-cols-2 p-0.5 gap-0.5">
                <div className="bg-white" />
                <div className="border border-white/50" />
                <div className="border border-white/50" />
                <div className="bg-white" />
              </div>
            </div>
            <span className="text-sm font-semibold tracking-widest uppercase text-black font-mono">
              CharDiwari
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-mono text-zinc-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="truncate max-w-[200px]">{user.email}</span>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              id="btn-dashboard-signout"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider bg-white hover:bg-zinc-100 text-black border border-zinc-200 transition cursor-pointer disabled:opacity-50"
            >
              {loggingOut ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        {/* User Greeting */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-zinc-200 bg-zinc-50 text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-4">
            <span>Verified Sanctuary Member</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-black mb-2">
            Welcome, {user.name}
          </h1>
          <p className="text-sm text-zinc-500 font-light">
            Your private architectural records, blueprints, and portfolio.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Card 1: Account & Credentials */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Account Credentials
                </h2>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between py-2 border-b border-zinc-50">
                  <span className="text-zinc-500">Email</span>
                  <span className="text-black font-medium truncate max-w-[220px]">{user.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-50">
                  <span className="text-zinc-500">Authentication</span>
                  <span className="text-black capitalize font-medium">{user.provider}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-50">
                  <span className="text-zinc-500">Member Since</span>
                  <span className="text-black font-medium">{joinDate}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-zinc-500">Session Status</span>
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100">
              <Link
                href="/"
                className="text-xs font-mono text-zinc-500 hover:text-black flex items-center gap-1.5 transition"
              >
                <span>Return to Public Gallery</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: Assigned Sanctuaries */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Active Holdings
                </h2>
                <Building2 className="w-4 h-4 text-zinc-400" />
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-black">The Courtyard House</h3>
                    <p className="text-[11px] font-mono text-zinc-500">Delhi NCR • 4,800 sq.ft</p>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Acquired
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-black">The Monolith Pavilion</h3>
                    <p className="text-[11px] font-mono text-zinc-500">Kasauli Hills • 6,200 sq.ft</p>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
                    Blueprint Review
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400">Blueprint Archive V2.4</span>
              <button
                onClick={() => alert('Consultation requested. Our architectural team will reach out via email.')}
                className="text-xs font-mono text-black font-medium hover:underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <span>Request Consultation</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Minimal Actions Bar */}
        <div className="rounded-2xl border border-zinc-200/80 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-black">Architectural Portfolio Dossier</h3>
              <p className="text-xs text-zinc-500 font-light">Download confidential high-resolution layouts and finishes specification.</p>
            </div>
          </div>
          <button
            onClick={() => alert('Architectural dossier downloaded.')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-black text-white text-xs font-mono uppercase tracking-wider hover:bg-zinc-800 transition whitespace-nowrap cursor-pointer"
          >
            Download PDF
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 py-6 bg-white text-xs font-mono text-zinc-400 text-center">
        © 2026 CharDiwari Homes • Private Architectural Sanctuary
      </footer>
    </div>
  );
}
