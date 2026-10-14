'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Briefcase, Car } from 'lucide-react';
import { hasMapsKey, importMapsLibrary, isGoogleMapsFailed, onGoogleMapsFailure } from '@/lib/google-maps';

// "How long is my commute, really?" Traffic-aware drive times from the
// visitor's office at a weekday rush hour and on a Sunday, beside the
// builder's claim when there is one. The office stays in the URL and this
// browser only; nothing is sent to our server, and Google is only called when
// the visitor asks.

const STORAGE_KEY = 'dwarkesh_office';
const IST_OFFSET = 330 * 60 * 1000;
const WEEK = 7 * 24 * 60 * 60 * 1000;

// Next occurrence of weekday (0 = Sunday) at hh:mm India time, always in the future.
function nextInIndia(weekday, hour, minute) {
  const now = Date.now();
  const india = new Date(now + IST_OFFSET);
  const days = (weekday - india.getUTCDay() + 7) % 7;
  let at = Date.UTC(india.getUTCFullYear(), india.getUTCMonth(), india.getUTCDate() + days, hour, minute) - IST_OFFSET;
  if (at <= now) at += WEEK;
  return new Date(at);
}

const SLOTS = [
  { id: 'weekday', label: 'Monday, 9:00 AM', when: () => nextInIndia(1, 9, 0) },
  { id: 'weekend', label: 'Sunday, 3:00 PM', when: () => nextInIndia(0, 15, 0) },
];

const subscribeToNothing = () => () => {};
function readSavedOffice() {
  try {
    return new URLSearchParams(window.location.search).get('office') || window.localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function rememberOffice(label) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('office', label);
    window.history.replaceState(window.history.state, '', url);
    window.localStorage.setItem(STORAGE_KEY, label);
  } catch {
    // Private mode or blocked storage: the result still shows.
  }
}

export default function CommuteCheck({ detail }) {
  const coords = detail.coordinates;
  const savedOffice = useSyncExternalStore(subscribeToNothing, readSavedOffice, () => '');
  const [status, setStatus] = useState('idle'); // idle | searching | loading | done | error
  const [result, setResult] = useState(null);
  const inputHost = useRef(null);

  const [available, setAvailable] = useState(() => hasMapsKey && !isGoogleMapsFailed());

  useEffect(() => {
    return onGoogleMapsFailure(() => setAvailable(false));
  }, []);

  if (!available || !coords) return null;

  async function compute(origin, label) {
    setStatus('loading');
    try {
      const { Route } = await importMapsLibrary('routes');
      const times = await Promise.all(
        SLOTS.map(async (slot) => {
          const { routes } = await Route.computeRoutes({
            origin,
            destination: { lat: coords.lat, lng: coords.lng },
            travelMode: 'DRIVING',
            routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
            departureTime: slot.when(),
            fields: ['durationMillis', 'distanceMeters'],
          });
          const route = routes?.[0];
          if (!route?.durationMillis) throw new Error('no-route');
          return { ...slot, minutes: Math.round(route.durationMillis / 60000), km: Math.round((route.distanceMeters ?? 0) / 100) / 10 };
        })
      );
      const claim = (detail.commuteClaims ?? []).find((c) => label.toLowerCase().includes(c.to.toLowerCase()));
      setResult({ label, times, claim });
      setStatus('done');
      rememberOffice(label);
    } catch {
      setStatus('error');
    }
  }

  async function startSearch() {
    setStatus('searching');
    try {
      const { PlaceAutocompleteElement } = await importMapsLibrary('places');
      const input = new PlaceAutocompleteElement({ includedRegionCodes: ['in'] });
      input.setAttribute('placeholder', 'Where do you work?');
      input.style.width = '100%';
      input.addEventListener('gmp-select', async ({ placePrediction }) => {
        const place = placePrediction.toPlace();
        await place.fetchFields({ fields: ['location', 'formattedAddress', 'displayName'] });
        compute(place.location, place.formattedAddress || place.displayName || 'your office');
      });
      inputHost.current.replaceChildren(input);
      input.focus();
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-sm dark:bg-stone-50 dark:border-stone-300">
      <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase text-stone-500">
        <Car className="w-3.5 h-3.5" />
        Commute check
      </p>
      <p className="mt-2 text-sm text-stone-700 text-pretty">
        See the real drive time from your office at rush hour, not just the brochure number.
      </p>

      <div ref={inputHost} className={status === 'searching' || status === 'loading' || status === 'done' ? 'mt-4' : 'hidden'} />

      {status === 'idle' || status === 'error' ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startSearch}
            className="press inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-black focus-ring"
          >
            <Briefcase className="w-3.5 h-3.5" />
            Check my commute
          </button>
          {savedOffice ? (
            <button
              type="button"
              onClick={() => compute(savedOffice, savedOffice)}
              className="press inline-flex max-w-full items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-900 hover:bg-stone-50 dark:bg-stone-100 dark:hover:bg-stone-200 transition-colors focus-ring"
            >
              <span className="truncate">From {savedOffice}</span>
            </button>
          ) : null}
        </div>
      ) : null}

      <div aria-live="polite">
        {status === 'loading' ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {SLOTS.map((slot) => (
              <div key={slot.id} className="h-[4.5rem] rounded-2xl bg-stone-100 motion-safe:animate-pulse" />
            ))}
          </div>
        ) : null}
        {status === 'error' ? (
          <p className="mt-3 text-xs text-red-600">Couldn&apos;t get drive times right now. Please try again.</p>
        ) : null}
        {status === 'done' && result ? (
          <div className="mt-4 animate-[fadeOnly_150ms_ease]">
            <p className="text-xs text-stone-500 truncate">From {result.label}</p>
            <dl className="mt-2 grid grid-cols-2 gap-3">
              {result.times.map((slot) => (
                <div key={slot.id} className="rounded-2xl border border-stone-200/90 bg-stone-50 p-3 dark:bg-stone-100">
                  <dt className="font-mono text-[10px] tracking-[0.14em] uppercase text-stone-500">{slot.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-stone-900 tabular-nums">
                    {slot.minutes} <span className="text-sm font-medium text-stone-500">min</span>
                  </dd>
                  <dd className="text-xs text-stone-500 tabular-nums">{slot.km} km by car</dd>
                </div>
              ))}
            </dl>
            {result.claim ? (
              <p className="mt-3 text-sm text-stone-700">
                Builder says <span className="font-semibold tabular-nums">{result.claim.minutes} min</span> to {result.claim.to}.
              </p>
            ) : null}
            <p className="mt-3 text-[11px] text-stone-500">Google estimate for the next {SLOTS.map((s) => s.label).join(' and ')}. Actual time varies.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
