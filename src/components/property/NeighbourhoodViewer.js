'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { useLenis } from 'lenis/react';
import { Box, Expand, Map as MapIcon, MapPin, PersonStanding, Share2, X } from 'lucide-react';
import { MAP_ID, hasMapsKey, importMapsLibrary } from '@/lib/google-maps';
import { whatsappShareLink } from '@/lib/contact';

// Neighbourhood viewer for a property: photorealistic 3D, Street View and a
// map. Nothing loads from Google until the visitor asks (3D tiles are heavy
// and every load is billed). Each mode is created the first time it is opened
// and kept, so switching back never reloads it. Pins sit at the locality
// centre, never a specific building.

const EASE = 'ease-[cubic-bezier(0.16,1,0.3,1)]';
const MODES = [
  { id: '3d', label: '3D', icon: Box },
  { id: 'street', label: 'Street View', icon: PersonStanding },
  { id: 'map', label: 'Map', icon: MapIcon },
];
// Where the 3D camera settles, and where the fly-in starts.
const SETTLED = { range: 600, tilt: 65, heading: 20 };
const ABOVE = { range: 2000, tilt: 0, heading: 0 };

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ?view=3d&lat=…&lng=…&range=…&tilt=…&heading=… (or view=street&heading=…, view=map&zoom=…)
const subscribeToNothing = () => () => {};
const readSearch = () => window.location.search;
const readNoSearch = () => '';

function parseSharedView(search) {
  try {
    const params = new URLSearchParams(search);
    const mode = params.get('view');
    if (!MODES.some((m) => m.id === mode)) return null;
    const number = (key) => (params.has(key) && Number.isFinite(Number(params.get(key))) ? Number(params.get(key)) : undefined);
    return { mode, lat: number('lat'), lng: number('lng'), range: number('range'), tilt: number('tilt'), heading: number('heading'), zoom: number('zoom') };
  } catch {
    return null;
  }
}

function formatImageDate(value) {
  // Street View image dates come as "YYYY-MM".
  const [year, month] = String(value || '').split('-').map(Number);
  if (!year || !month) return null;
  return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export default function NeighbourhoodViewer({ property, detail }) {
  const coords = detail.coordinates;
  const approximate = detail.locationPrecision === 'approximate';
  const startMode = detail.viewerDefault === 'map' ? 'map' : '3d';
  const streetAllowed = Boolean(detail.streetView);

  const [phase, setPhase] = useState('idle'); // idle | loading | ready | error
  const [mode, setMode] = useState(startMode);
  const [created, setCreated] = useState({}); // which modes exist
  const [expanded, setExpanded] = useState(false);
  const [streetDate, setStreetDate] = useState(null);
  const [streetMissing, setStreetMissing] = useState(false);
  // A shared link only changes the button label until the visitor clicks.
  const shared = parseSharedView(useSyncExternalStore(subscribeToNothing, readSearch, readNoSearch));

  const layers = useRef({});
  const instances = useRef({});
  const shellRef = useRef(null);
  const expandButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const lenis = useLenis();

  const center = useCallback(
    (lat = coords.lat, lng = coords.lng) => ({ lat, lng, altitude: 0 }),
    [coords]
  );

  const create3D = useCallback(
    async (view) => {
      const { Map3DElement, Marker3DElement, MapMode } = await importMapsLibrary('maps3d');
      const camera = {
        center: center(view?.lat ?? coords.lat, view?.lng ?? coords.lng),
        range: view?.range ?? SETTLED.range,
        tilt: view?.tilt ?? SETTLED.tilt,
        heading: view?.heading ?? SETTLED.heading,
      };
      const animate = !view && !prefersReducedMotion();
      const map = new Map3DElement({
        center: camera.center,
        ...(animate ? ABOVE : { range: camera.range, tilt: camera.tilt, heading: camera.heading }),
        mode: MapMode?.HYBRID ?? 'HYBRID',
        gestureHandling: 'COOPERATIVE',
      });
      map.style.width = '100%';
      map.style.height = '100%';
      map.append(new Marker3DElement({ position: { lat: coords.lat, lng: coords.lng }, label: approximate ? `${property.title} (area)` : property.title }));
      layers.current['3d'].append(map);
      instances.current['3d'] = map;

      if (animate) {
        // Fly in once, then one slow orbit (FlyAround). Any input stops it for good.
        let stopped = false;
        const stop = () => {
          if (stopped) return;
          stopped = true;
          map.stopCameraAnimation();
        };
        ['pointerdown', 'wheel', 'keydown', 'touchstart'].forEach((type) =>
          layers.current['3d'].addEventListener(type, stop, { once: true, passive: true })
        );
        let phaseOfFlight = 'fly-in';
        map.addEventListener('gmp-animationend', () => {
          if (stopped || phaseOfFlight !== 'fly-in') return;
          phaseOfFlight = 'orbit';
          map.flyCameraAround({ camera, durationMillis: 30000, repeatCount: 1 });
        });
        const startWhenSteady = (event) => {
          if (!event.isSteady) return;
          map.removeEventListener('gmp-steadychange', startWhenSteady);
          if (!stopped) map.flyCameraTo({ endCamera: camera, durationMillis: 2500 });
        };
        map.addEventListener('gmp-steadychange', startWhenSteady);
      }
    },
    [approximate, center, coords, property.title]
  );

  const createStreet = useCallback(
    async (view) => {
      const { StreetViewService, StreetViewPanorama, StreetViewSource } = await importMapsLibrary('streetView');
      try {
        const { data } = await new StreetViewService().getPanorama({
          location: { lat: coords.lat, lng: coords.lng },
          radius: 150,
          sources: [StreetViewSource.OUTDOOR],
        });
        // With only an approximate location, face along the street rather than at a building.
        const heading = view?.heading ?? data.links?.[0]?.heading ?? 0;
        instances.current.street = new StreetViewPanorama(layers.current.street, {
          pano: data.location.pano,
          pov: { heading, pitch: 5 },
          addressControl: false,
          fullscreenControl: false,
          motionTracking: false,
          motionTrackingControl: false,
        });
        setStreetDate(formatImageDate(data.imageDate));
      } catch {
        setStreetMissing(true);
        throw new Error('no-street');
      }
    },
    [coords]
  );

  const createMap = useCallback(
    async (view) => {
      const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([importMapsLibrary('maps'), importMapsLibrary('marker')]);
      const map = new Map(layers.current.map, {
        center: { lat: view?.lat ?? coords.lat, lng: view?.lng ?? coords.lng },
        zoom: view?.zoom ?? 16,
        mapId: MAP_ID,
        gestureHandling: 'cooperative',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      });
      new AdvancedMarkerElement({ map, position: { lat: coords.lat, lng: coords.lng }, title: property.title });
      instances.current.map = map;
    },
    [coords, property.title]
  );

  const ensureMode = useCallback(
    async (next, view) => {
      if (instances.current[next]) return true;
      const creators = { '3d': create3D, street: createStreet, map: createMap };
      try {
        await creators[next](view);
        setCreated((current) => ({ ...current, [next]: true }));
        return true;
      } catch {
        return false;
      }
    },
    [create3D, createMap, createStreet]
  );

  async function explore() {
    setPhase('loading');
    const view = shared;
    const first = view?.mode === 'street' && !streetAllowed ? startMode : view?.mode ?? startMode;
    // Render the layers first so the creators have somewhere to mount.
    setMode(first);
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    const ok = await ensureMode(first, view);
    if (ok) {
      setPhase('ready');
      return;
    }
    // 3D or Street View unavailable here: fall back to the map.
    if (first !== 'map' && (await ensureMode('map'))) {
      setMode('map');
      setPhase('ready');
      return;
    }
    setPhase('error');
  }

  async function switchTo(next) {
    if (next === mode) return;
    if (next === 'street' && (!streetAllowed || streetMissing)) return;
    const ok = await ensureMode(next);
    if (ok) setMode(next);
  }

  // Gestures: inline the map only moves with two fingers / Ctrl-scroll; expanded it takes everything.
  useEffect(() => {
    const handling = expanded ? 'GREEDY' : 'COOPERATIVE';
    if (instances.current['3d']) instances.current['3d'].gestureHandling = handling;
    instances.current.map?.setOptions({ gestureHandling: handling.toLowerCase() });
  }, [expanded, created]);

  // Expanded: pause smooth scrolling, close on Escape, keep focus inside, restore it after.
  useEffect(() => {
    if (!expanded) return undefined;
    lenis?.stop();
    closeButtonRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setExpanded(false);
        return;
      }
      if (event.key !== 'Tab' || !shellRef.current) return;
      const focusable = [...shellRef.current.querySelectorAll('button:not([disabled]), a[href]')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const expandButton = expandButtonRef.current;
    return () => {
      document.removeEventListener('keydown', onKey);
      lenis?.start();
      expandButton?.focus();
    };
  }, [expanded, lenis]);

  function share() {
    const url = new URL(window.location.href);
    ['view', 'lat', 'lng', 'range', 'tilt', 'heading', 'zoom'].forEach((key) => url.searchParams.delete(key));
    url.searchParams.set('view', mode);
    const round = (n, digits = 5) => String(Math.round(n * 10 ** digits) / 10 ** digits);
    if (mode === '3d' && instances.current['3d']) {
      const map = instances.current['3d'];
      url.searchParams.set('lat', round(map.center.lat));
      url.searchParams.set('lng', round(map.center.lng));
      url.searchParams.set('range', round(map.range, 0));
      url.searchParams.set('tilt', round(map.tilt, 1));
      url.searchParams.set('heading', round(map.heading, 1));
    } else if (mode === 'street' && instances.current.street) {
      url.searchParams.set('heading', round(instances.current.street.getPov().heading, 1));
    } else if (mode === 'map' && instances.current.map) {
      const c = instances.current.map.getCenter();
      url.searchParams.set('lat', round(c.lat()));
      url.searchParams.set('lng', round(c.lng()));
      url.searchParams.set('zoom', round(instances.current.map.getZoom(), 1));
    }
    const label = MODES.find((m) => m.id === mode).label;
    window.open(whatsappShareLink(`Take a look around ${property.title}, ${property.location} (${label} view): ${url}`), '_blank', 'noopener');
  }

  function onTabKey(event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const enabled = MODES.filter((m) => m.id !== 'street' || (streetAllowed && !streetMissing));
    const index = enabled.findIndex((m) => m.id === mode);
    const next = enabled[(index + (event.key === 'ArrowRight' ? 1 : enabled.length - 1)) % enabled.length];
    switchTo(next.id);
    document.getElementById(`viewer-tab-${property.slug}-${next.id}`)?.focus();
  }

  if (!coords) return null;

  const frame = 'relative w-full overflow-hidden rounded-3xl border border-stone-200/90 bg-stone-100 dark:bg-stone-50 aspect-[4/3] sm:aspect-[16/9]';

  // ── No key: a calm card, same footprint (directions are just below it) ───
  if (!hasMapsKey) {
    return (
      <div className={`${frame} flex flex-col items-center justify-center gap-3 p-6 text-center bg-grid-light`}>
        <span className="flex w-11 h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-600">
          <MapIcon className="w-5 h-5" />
        </span>
        <p className="font-serif text-xl text-stone-900">Map preview unavailable</p>
        <p className="max-w-sm text-sm text-stone-500 text-pretty">
          The 3D view and Street View of {property.location} will appear here.
        </p>
      </div>
    );
  }

  const exploreLabel = shared ? 'Open the shared view' : startMode === '3d' ? 'Explore in 3D' : 'Explore the area';
  const streetDisabled = !streetAllowed || streetMissing;

  return (
    <div
      ref={shellRef}
      className={
        expanded
          ? 'fixed inset-0 z-[60] flex flex-col gap-3 bg-white p-3 sm:p-5 animate-viewer-in'
          : 'flex flex-col gap-3'
      }
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded ? 'true' : undefined}
      aria-label={expanded ? `${property.title}: neighbourhood view` : undefined}
    >
      {/* Stage. data-lenis-prevent: the wheel zooms the map instead of scrolling the page. */}
      <div
        role="region"
        aria-label={`${MODES.find((m) => m.id === mode).label} view of ${property.title}`}
        data-lenis-prevent
        className={expanded ? 'relative flex-1 overflow-hidden rounded-2xl border border-stone-200/90 bg-stone-100' : frame}
      >
        {/* The three layers; only the active one is visible. */}
        {MODES.map((m) => (
          <div
            key={m.id}
            ref={(element) => {
              layers.current[m.id] = element;
            }}
            aria-hidden={mode !== m.id}
            className={`absolute inset-0 transition-[opacity,filter] duration-200 ${EASE} motion-reduce:transition-none ${
              mode === m.id && phase !== 'idle' ? 'opacity-100' : 'pointer-events-none opacity-0 blur-[2px]'
            }`}
          />
        ))}

        {/* Preview: the listing photo; nothing from Google has loaded yet. */}
        {phase !== 'ready' ? (
          <div className="light-scope absolute inset-0">
            <Image src={property.image} alt="" fill sizes="(min-width: 1024px) 760px, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-stone-950/45" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
              {phase === 'loading' ? (
                <div aria-live="polite" className="flex flex-col items-center gap-3">
                  <span className="h-10 w-44 rounded-full bg-white/25 motion-safe:animate-pulse" />
                  <span className="text-xs font-medium text-white/80">Loading the neighbourhood…</span>
                </div>
              ) : phase === 'error' ? (
                <p className="max-w-xs text-sm font-medium text-white">The map couldn&apos;t load. Check your connection and try again.</p>
              ) : (
                <>
                  <p className="font-serif text-2xl sm:text-3xl text-white text-balance drop-shadow">See the neighbourhood</p>
                  <button
                    type="button"
                    onClick={explore}
                    className="press inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-900 shadow-lg hover:bg-stone-100 focus-ring"
                  >
                    <Box className="w-4 h-4" />
                    {exploreLabel}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}

        {/* Chips sit top-left so Google's logo and terms (bottom) stay visible. */}
        <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-2">
          {approximate ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-stone-900 shadow-sm dark:bg-stone-50/95">
              <MapPin className="w-3 h-3" />
              Approximate location
            </span>
          ) : null}
          {mode === 'street' && streetDate && phase === 'ready' ? (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-stone-900 shadow-sm dark:bg-stone-50/95">
              Street photo from {streetDate}
            </span>
          ) : null}
        </div>
      </div>

      {/* Toolbar: outside the stage, so it never covers Google's attribution. */}
      {phase === 'ready' ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="tablist" aria-label="View" onKeyDown={onTabKey} className="relative grid grid-cols-3 rounded-full border border-stone-200 bg-stone-100/80 p-1 dark:bg-stone-100">
            <span
              aria-hidden="true"
              className={`absolute top-1 bottom-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-white shadow-sm dark:bg-stone-300 transition-transform duration-200 ${EASE} motion-reduce:transition-none`}
              style={{ transform: `translateX(${MODES.findIndex((m) => m.id === mode) * 100}%)` }}
            />
            {MODES.map((m) => {
              const disabled = m.id === 'street' && streetDisabled;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  id={`viewer-tab-${property.slug}-${m.id}`}
                  type="button"
                  role="tab"
                  aria-selected={mode === m.id}
                  tabIndex={mode === m.id ? 0 : -1}
                  disabled={disabled}
                  title={disabled ? "Street View isn't available here yet" : undefined}
                  onClick={() => switchTo(m.id)}
                  className="relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-stone-600 aria-selected:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40 transition-colors focus-ring"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">{m.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={share}
              className="press inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-900 hover:bg-stone-50 dark:bg-stone-50 dark:hover:bg-stone-100 transition-colors focus-ring"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share on WhatsApp
            </button>
            {expanded ? (
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Close full screen"
                className="press flex w-9 h-9 items-center justify-center rounded-full bg-stone-900 text-white hover:bg-black focus-ring"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                ref={expandButtonRef}
                type="button"
                onClick={() => setExpanded(true)}
                aria-label="Expand to full screen"
                className="press flex w-9 h-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-900 hover:bg-stone-50 dark:bg-stone-50 dark:hover:bg-stone-100 focus-ring"
              >
                <Expand className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : null}
      {streetDisabled && phase === 'ready' ? (
        <p className="text-xs text-stone-500">Street View isn&apos;t available here yet.</p>
      ) : null}
    </div>
  );
}
