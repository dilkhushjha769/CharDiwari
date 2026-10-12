'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GraduationCap, Hospital, MapPin, Plane, Route,
  ShoppingBag, TrainFront, Trees, UtensilsCrossed,
  Star, Clock, ChevronRight, RefreshCw,
} from 'lucide-react';

// ── Category config ───────────────────────────────────────────────────────────
// One entry per nearby-place category shown in the panel and on the map.
// color must match what we pass to the map marker.

export const PLACE_CATEGORIES = [
  { id: 'school',     label: 'Schools',     icon: GraduationCap, color: '#d97706', radius: 3000 },
  { id: 'hospital',   label: 'Hospitals',   icon: Hospital,       color: '#e11d48', radius: 5000 },
  { id: 'park',       label: 'Parks',        icon: Trees,          color: '#16a34a', radius: 2000 },
  { id: 'restaurant', label: 'Restaurants', icon: UtensilsCrossed,color: '#ea580c', radius: 1500 },
  { id: 'transit',    label: 'Transit',     icon: TrainFront,     color: '#0284c7', radius: 5000 },
  { id: 'shopping',   label: 'Shopping',    icon: ShoppingBag,    color: '#7c3aed', radius: 4000 },
];

// Cache keyed by `${lat},${lng},${category}` so revisiting costs nothing.
const cache = new Map();
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 h — matches server Cache-Control

function cacheKey(lat, lng, cat) {
  return `${lat.toFixed(5)},${lng.toFixed(5)},${cat}`;
}

async function fetchPlaces(lat, lng, category) {
  const key = cacheKey(lat, lng, category);
  const hit  = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.data;

  const catConfig = PLACE_CATEGORIES.find((c) => c.id === category);
  const radius    = catConfig?.radius ?? 3000;
  const url       = `/api/places/nearby?lat=${lat}&lng=${lng}&type=${category}&radius=${radius}`;
  const res       = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  cache.set(key, { data, ts: Date.now() });
  return data;
}

// ── Star rating display ────────────────────────────────────────────────────────
function Stars({ rating }) {
  if (!rating) return null;
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="flex items-center gap-0.5 text-amber-500" aria-label={`${rating} stars`}>
      {Array.from({ length: full  }, (_, i) => <Star key={`f${i}`} className="w-2.5 h-2.5 fill-current" />)}
      {half && <Star key="h" className="w-2.5 h-2.5 fill-current opacity-50" />}
      {Array.from({ length: empty }, (_, i) => <Star key={`e${i}`} className="w-2.5 h-2.5 text-stone-300" />)}
      <span className="ml-1 text-[10px] font-semibold text-stone-500">{rating.toFixed(1)}</span>
    </span>
  );
}

// ── Single place card ─────────────────────────────────────────────────────────
function PlaceRow({ place, color, focused, onFocus }) {
  return (
    <button
      type="button"
      onClick={() => onFocus(focused ? null : place.id)}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors duration-100 ${
        focused ? 'bg-stone-50' : 'hover:bg-stone-50/70'
      }`}
    >
      {/* Colour dot */}
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-2 ring-white shadow-sm"
        style={{ background: color }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-stone-900">{place.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Stars rating={place.rating} />
          {place.isOpen != null && (
            <span className={`flex items-center gap-0.5 text-[10px] font-medium ${place.isOpen ? 'text-emerald-600' : 'text-rose-500'}`}>
              <Clock className="w-2.5 h-2.5" />
              {place.isOpen ? 'Open now' : 'Closed'}
            </span>
          )}
        </div>
      </div>
      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-stone-500">
        {place.distanceKm} km
      </span>
    </button>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────
// Props:
//   coords        { lat, lng }   property coordinates
//   activeCategory  string | null  currently selected category id
//   onCategoryChange  (id | null) => void
//   focusedPlaceId  string | null
//   onPlaceFocus    (id | null) => void
//   onPlacesLoaded  (places, category) => void   notify parent to put markers on map

export default function NearbyPlacesPanel({
  coords,
  activeCategory,
  onCategoryChange,
  focusedPlaceId,
  onPlaceFocus,
  onPlacesLoaded,
}) {
  const [status, setStatus]   = useState('idle');   // idle | loading | done | error
  const [places, setPlaces]         = useState([]);
  const [retryCount, setRetryCount] = useState(0);

  // Load whenever activeCategory or retryCount changes
  useEffect(() => {
    if (!activeCategory) return;
    let ignore = false;

    Promise.resolve().then(() => {
      if (!ignore) {
        setStatus('loading');
        setPlaces([]);
        onPlaceFocus(null);
      }
    });

    fetchPlaces(coords.lat, coords.lng, activeCategory)
      .then((data) => {
        if (ignore) return;
        setPlaces(data.places ?? []);
        setStatus(data.places?.length ? 'done' : 'empty');
        onPlacesLoaded?.(data.places ?? [], activeCategory);
      })
      .catch((err) => {
        if (ignore) return;
        console.error('[NearbyPlacesPanel]', err);
        setStatus('error');
      });

    return () => {
      ignore = true;
    };
  }, [activeCategory, coords.lat, coords.lng, onPlaceFocus, onPlacesLoaded, retryCount]);

  const activeCat = PLACE_CATEGORIES.find((c) => c.id === activeCategory);
  const displayStatus = !activeCategory ? 'idle' : status;
  const displayPlaces = !activeCategory ? [] : places;

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Route className="h-3.5 w-3.5 text-stone-500" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-500">Nearby Places</p>
        </div>
        {activeCategory && (
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className="text-[10px] font-semibold text-stone-400 hover:text-stone-700 transition-colors focus-ring rounded"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category filter row */}
      <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-2">
        {PLACE_CATEGORIES.map((cat) => {
          const Icon    = cat.icon;
          const active  = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(active ? null : cat.id)}
              aria-pressed={active}
              className={`press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 focus-ring ${
                active
                  ? 'text-white shadow-sm'
                  : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
              }`}
              style={active ? { background: cat.color, borderColor: cat.color } : {}}
            >
              <Icon className="h-3 w-3" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Results area */}
      <div className="min-h-[160px] flex-1" aria-live="polite">
        {displayStatus === 'idle' && (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <MapPin className="h-6 w-6 text-stone-300" />
            <p className="text-xs text-stone-400">
              Pick a category above to see what&apos;s nearby
            </p>
          </div>
        )}

        {displayStatus === 'loading' && (
          <div className="flex flex-col gap-px pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-5 w-5 rounded-full bg-stone-100 motion-safe:animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-stone-100 motion-safe:animate-pulse" />
                  <div className="h-2.5 w-1/2 rounded bg-stone-100 motion-safe:animate-pulse" />
                </div>
                <div className="h-2.5 w-8 rounded bg-stone-100 motion-safe:animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {displayStatus === 'done' && (
          <ul className="divide-y divide-stone-100">
            {displayPlaces.map((place) => (
              <li key={place.id}>
                <PlaceRow
                  place={place}
                  color={activeCat?.color ?? '#57534e'}
                  focused={focusedPlaceId === place.id}
                  onFocus={onPlaceFocus}
                />
              </li>
            ))}
          </ul>
        )}

        {displayStatus === 'empty' && (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <p className="text-xs text-stone-500">
              No {activeCat?.label.toLowerCase() ?? 'places'} found within {(activeCat?.radius ?? 3000) / 1000} km.
            </p>
            <button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-50 transition-colors focus-ring"
            >
              <RefreshCw className="h-3 w-3" />
              Try again
            </button>
          </div>
        )}

        {displayStatus === 'error' && (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <p className="text-xs text-rose-600">Couldn&apos;t load nearby places. Check your connection.</p>
            <button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-50 transition-colors focus-ring"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Footer attribution */}
      {(displayStatus === 'done' || displayStatus === 'empty') && (
        <div className="border-t border-stone-100 px-4 py-2">
          <p className="text-[9px] text-stone-400">Powered by Google Places · Distances are straight-line</p>
        </div>
      )}
    </div>
  );
}
