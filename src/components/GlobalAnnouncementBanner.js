'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Sparkles, X, ShieldAlert } from 'lucide-react';

export default function GlobalAnnouncementBanner() {
  const [settings, setSettings] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        // Silently continue
      }
    }
    loadSettings();
  }, []);

  if (!settings || dismissed) return null;

  const isMaintenance = settings.website_access === 'maintenance';
  const hasAnnouncement = Boolean(settings.announcement_banner?.trim());

  if (!isMaintenance && !hasAnnouncement) return null;

  return (
    <div
      role="alert"
      className={`relative z-50 text-xs px-4 py-2 transition flex items-center justify-between gap-3 ${
        isMaintenance
          ? 'bg-amber-500 text-stone-950 font-semibold'
          : 'bg-stone-900 text-stone-200 border-b border-stone-800'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-1 text-center">
        {isMaintenance ? (
          <>
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              <strong>Platform Notice:</strong> {settings.maintenance_message || 'Scheduled platform upgrades in progress.'}
            </span>
            <Link
              href="/admin"
              className="underline hover:text-black font-bold ml-2 hidden sm:inline"
            >
              Admin Access &rarr;
            </Link>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{settings.announcement_banner}</span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-current opacity-70 hover:opacity-100 p-0.5 rounded cursor-pointer shrink-0"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
