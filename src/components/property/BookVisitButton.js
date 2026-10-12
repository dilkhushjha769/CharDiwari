'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { whatsappLink } from '@/lib/contact';
import { trackVisitBookingStarted, trackVisitBookingCompleted } from '@/lib/analytics';

// Booking a visit goes through sign-in. Signed-in visitors (Supabase or the
// site's own session, the same two checks the navbar makes) go straight to
// WhatsApp with the request; everyone else signs in first and comes back here.
export default function BookVisitButton({ property, className = '' }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function signedIn() {
    try {
      const { client } = getSupabaseClient();
      const { data } = (await client?.auth.getSession()) ?? {};
      if (data?.session?.user) return true;
    } catch {
      // Not configured or unreachable: fall through to the site's own session.
    }
    const response = await fetch('/api/auth/me').catch(() => null);
    return Boolean(response?.ok);
  }

  async function book() {
    setChecking(true);
    trackVisitBookingStarted(property);
    try {
      const isAuth = await signedIn();
      if (isAuth) {
        trackVisitBookingCompleted(property, { channel: 'whatsapp' });
        const message = `Hi Dwarkesh, I'd like to book a free visit to ${property.title}, ${property.location}.`;
        window.open(whatsappLink(message), '_blank', 'noopener');
      } else {
        router.push(`/auth?redirect=${encodeURIComponent(`/property/${property.slug}`)}`);
      }
    } finally {
      setChecking(false);
    }
  }

  return (
    <button
      type="button"
      onClick={book}
      aria-busy={checking}
      className={`inline-flex items-center justify-center rounded-full bg-stone-900 text-white text-sm font-semibold cursor-pointer outline-none transition-[scale,background-color] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-black active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 ring-offset-white ${checking ? 'pointer-events-none' : ''} ${className}`}
    >
      {/* While the session check runs, the label dims and softens so the press clearly registered. */}
      <span
        className={`inline-flex items-center gap-2 transition-[opacity,filter] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:blur-none ${
          checking ? 'opacity-70 blur-[2px]' : ''
        }`}
      >
        <CalendarCheck className="w-4 h-4" />
        Book a free visit
      </span>
    </button>
  );
}
