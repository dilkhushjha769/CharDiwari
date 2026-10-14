'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useLenis } from 'lenis/react';
import { Box, Compass, Crosshair, Expand, Globe, House, Map as MapIcon, MapPin, PersonStanding, Route, Share2, X } from 'lucide-react';
import { MAP_ID, hasMapsKey, importMapsLibrary, isGoogleMapsFailed, onGoogleMapsFailure } from '@/lib/google-maps';
import { whatsappShareLink } from '@/lib/contact';
import { NearbyIcon, nearbyColor, getNearbyIconSvg } from './nearby';
import NearbyPlacesPanel, { PLACE_CATEGORIES } from './NearbyPlacesPanel';
import { trackPropertyMapInteracted } from '@/lib/analytics';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Neighbourhood viewer for a property. Two engines, same frame and toolbar:
// - With a Google Maps key: photorealistic 3D, Satellite, Street Map and Street View.
// - Without one (or as auto-fallback in production): a free map with 3D buildings,
//   satellite imagery (ESRI World Imagery), and OpenStreetMap/OpenFreeMap street tiles.
//   One map instance; switching modes updates camera and style.
// Pins sit at the locality centre, never a specific building.

const EASE = 'ease-[cubic-bezier(0.16,1,0.3,1)]';
const MODES = [
  { id: '3d', label: '3D', icon: Box },
  { id: 'satellite', label: 'Satellite', icon: Globe },
  { id: 'map', label: 'Street Map', icon: MapIcon },
  { id: 'street', label: 'Street View', icon: PersonStanding },
];
// Where the 3D camera settles, and where the fly-in starts.
const SETTLED = { range: 600, tilt: 65, heading: 20 };
const ABOVE = { range: 2000, tilt: 0, heading: 0 };
// The same framings on the free map (zoom instead of range).
const OPEN_3D = { zoom: 15.5, pitch: 60, bearing: 20 };
const OPEN_FLAT = { zoom: 15, pitch: 0, bearing: 0 };
const OPEN_ABOVE = { zoom: 14, pitch: 0, bearing: 0 };
const ORBIT_MS = 30000;

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

function haversineMetres(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// One nearby place on the free map: its colour and icon, the road distance,
// and its name while in focus (hover, keyboard or tap). It grows in when its
// route arrives.
function NearbyPin({ pin, focused, onFocusChange }) {
  return (
    <button
      type="button"
      data-shown={pin.shown}
      aria-label={`${pin.name}, ${pin.km} km by road`}
      aria-pressed={focused}
      onPointerEnter={() => onFocusChange(pin.id)}
      onPointerLeave={() => onFocusChange(null)}
      onFocus={() => onFocusChange(pin.id)}
      onBlur={() => onFocusChange(null)}
      onClick={() => onFocusChange(pin.id)}
      className={`relative flex cursor-pointer items-center gap-1.5 rounded-full focus-ring transition-[opacity,scale] duration-200 ${EASE} before:absolute before:-inset-2 before:content-[''] data-[shown=false]:pointer-events-none data-[shown=false]:scale-90 data-[shown=false]:opacity-0 motion-reduce:data-[shown=false]:scale-100`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-md ring-2 ring-white" style={{ background: pin.color }}>
        <NearbyIcon type={pin.type} className="h-3.5 w-3.5" />
      </span>
      <span
        className={`max-w-[13rem] truncate rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-stone-800 shadow-sm tabular-nums ${
          focused ? '' : 'group-data-[compact=true]/pin:invisible'
        }`}
      >
        {focused ? `${pin.name} · ${pin.km} km` : `${pin.km} km`}
      </span>
    </button>
  );
}

export default function NeighbourhoodViewer({
  property,
  detail,
  selectedPlaceName = null,
  hoveredPlaceName = null,
  onSelectPlace,
  onHoverPlace,
}) {
  const [coords, setCoords] = useState(detail.coordinates ?? property.coordinates ?? null);
  const [geocoding, setGeocoding] = useState(!detail.coordinates && !property.coordinates);
  const [geocodeFailed, setGeocodeFailed] = useState(false);
  const approximate = detail.locationPrecision === 'approximate';
  const startMode = detail.viewerDefault === 'map' ? 'map' : '3d';
  const [engine, setEngine] = useState(() => (hasMapsKey && !isGoogleMapsFailed() ? 'google' : 'open'));
  // The free map has no Street View 360 panorama, so its toolbar shows 3D, Satellite, and Street Map.
  const modes = engine === 'google' ? MODES : MODES.filter((m) => m.id !== 'street');

  // Auto-switch to Open engine if Google Maps fails at any point
  useEffect(() => {
    return onGoogleMapsFailure(() => {
      console.warn('[NeighbourhoodViewer] Switching to Open engine due to Google Maps failure.');
      setEngine('open');
    });
  }, []);

  // Dynamic Street View coverage and imagery state
  const [streetCheckStatus, setStreetCheckStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'unavailable' | 'error'
  const [streetPanoData, setStreetPanoData]       = useState(null);
  const [isNearbyStreetView, setIsNearbyStreetView] = useState(false);
  const [streetDistance, setStreetDistance]       = useState(null);
  const [streetLocationName, setStreetLocationName] = useState('');
  const [streetDate, setStreetDate]               = useState(null);
  const [streetLoading, setStreetLoading]         = useState(false);
  const [streetMissing, setStreetMissing]         = useState(false);

  const streetDisabled = engine !== 'google' || streetCheckStatus !== 'available' || streetMissing;

  const [phase, setPhase] = useState('idle'); // idle | loading | ready | error
  const [mode, setMode] = useState(startMode);
  const [created, setCreated] = useState({}); // which modes exist
  const [expanded, setExpanded] = useState(false);
  const [nearby, setNearby] = useState('off'); // off | loading | on | error (free map only)
  const [pins, setPins] = useState([]);
  const [focusedPlace, setFocusedPlace] = useState(null);
  const [homeElement, setHomeElement] = useState(null);
  // A shared link only changes the button label until the visitor clicks.
  const shared = parseSharedView(useSyncExternalStore(subscribeToNothing, readSearch, readNoSearch));

  // ── Google Places nearby (google engine only) ────────────────────────────
  const [activeCategory, setActiveCategory]   = useState(null);
  const [focusedPlaceId, setFocusedPlaceId]   = useState(null);
  const googlePlaceMarkers                    = useRef([]); // AdvancedMarkerElement[] or Marker3DElement[]
  const currentPlacesRef                      = useRef([]);
  const currentCatRef                         = useRef(null);

  const nearbyMarkersRef = useRef({});
  const infoWindowRef    = useRef(null);
  const selectedPlaceRef = useRef(selectedPlaceName);
  useEffect(() => {
    selectedPlaceRef.current = selectedPlaceName;
  }, [selectedPlaceName]);

  const layers = useRef({});
  const instances = useRef({});
  const stopOrbit = useRef(null); // free map: ends the fly-in / orbit
  const mapLib = useRef(null); // free map: the loaded @/lib/maplibre module
  const nearbyRun = useRef({ routes: null, markers: [], home: null, before: null, cancel: null, declutter: null });
  const googleConnectingLines = useRef([]);
  const mapLibreLandmarkMarkers = useRef([]);
  const shellRef = useRef(null);
  const expandButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const lenis = useLenis();

  // If coordinates are missing, geocode the address automatically with multi-tier clean queries and city fallback
  useEffect(() => {
    if (coords) return;
    let active = true;
    async function geocodeAddress() {
      setGeocoding(true);
      const rawLocation = property.location || '';
      const cleanLoc = rawLocation
        .replace(/^(luxury|premium|modern|spacious|stunning|ultra|exclusive)\s+/i, '')
        .trim();
      const city = property.city || '';

      const candidates = [
        cleanLoc && city ? `${cleanLoc}, ${city}` : null,
        cleanLoc ? `${cleanLoc}, India` : null,
        rawLocation ? `${rawLocation}, India` : null,
        property.title && rawLocation ? `${property.title}, ${rawLocation}` : null,
        city ? `${city}, India` : null,
      ].filter(Boolean);

      for (const query of candidates) {
        if (!active) return;
        try {
          if (hasMapsKey && !isGoogleMapsFailed()) {
            const { Geocoder } = await importMapsLibrary('geocoding');
            const geocoder = new Geocoder();
            const res = await geocoder.geocode({ address: query });
            const loc = res.results?.[0]?.geometry?.location;
            if (loc && active) {
              setCoords({ lat: loc.lat(), lng: loc.lng() });
              setGeocoding(false);
              return;
            }
          }
        } catch {}

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'CharDiwari/1.0' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.[0] && active) {
              setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
              setGeocoding(false);
              return;
            }
          }
        } catch {}
      }

      if (active) {
        const fallbackCityCoords = {
          gurgaon: { lat: 28.4595, lng: 77.0266 },
          gurugram: { lat: 28.4595, lng: 77.0266 },
          delhi: { lat: 28.6139, lng: 77.209 },
          noida: { lat: 28.5355, lng: 77.391 },
          mumbai: { lat: 19.076, lng: 72.8777 },
          alibaug: { lat: 18.6414, lng: 72.8722 },
          kasauli: { lat: 30.9013, lng: 76.9649 },
          goa: { lat: 15.2993, lng: 74.124 },
          bangalore: { lat: 12.9716, lng: 77.5946 },
          bengaluru: { lat: 12.9716, lng: 77.5946 },
        };
        const cityKey = (city || rawLocation).toLowerCase();
        const matched = Object.entries(fallbackCityCoords).find(([k]) => cityKey.includes(k));
        if (matched) {
          setCoords(matched[1]);
          setGeocoding(false);
          return;
        }
        setGeocoding(false);
        setGeocodeFailed(true);
      }
    }
    geocodeAddress();
    return () => {
      active = false;
    };
  }, [coords, property.city, property.location, property.title]);

  const center = useCallback(
    (lat = coords?.lat ?? 0, lng = coords?.lng ?? 0) => ({ lat, lng, altitude: 0 }),
    [coords]
  );

  // Progressive radii check: 50m -> 150m -> 300m -> 1000m using StreetViewService
  const checkStreetViewCoverage = useCallback(async (location) => {
    if (!hasMapsKey || !location?.lat || !location?.lng) return;
    setStreetCheckStatus('checking');
    try {
      const { StreetViewService, StreetViewSource } = await importMapsLibrary('streetView');
      const service = new StreetViewService();
      const radii = [50, 150, 300, 1000];

      const queryPano = (r, source) =>
        new Promise((resolve) => {
          try {
            service.getPanorama(
              {
                location: { lat: location.lat, lng: location.lng },
                radius: r,
                sources: source ? [source] : undefined,
                preference: 'nearest',
              },
              (data, status) => {
                if (status === 'OK' && data?.location?.pano) {
                  resolve(data);
                } else {
                  resolve(null);
                }
              }
            );
          } catch {
            resolve(null);
          }
        });

      let found = null;
      // 1. Progressively query outdoor street view
      for (const r of radii) {
        const data = await queryPano(r, StreetViewSource.OUTDOOR);
        if (data) {
          found = data;
          break;
        }
      }

      // 2. Fallback to default source up to 1000m
      if (!found) {
        found = await queryPano(1000, null);
      }

      if (found) {
        const panoLat = typeof found.location.latLng.lat === 'function' ? found.location.latLng.lat() : found.location.latLng.lat;
        const panoLng = typeof found.location.latLng.lng === 'function' ? found.location.latLng.lng() : found.location.latLng.lng;
        const dist = Math.round(haversineMetres(location.lat, location.lng, panoLat, panoLng));

        setStreetPanoData(found);
        setStreetDistance(dist);
        setIsNearbyStreetView(dist > 45 || approximate);
        setStreetLocationName(found.location.description || found.location.shortDescription || '');
        setStreetDate(formatImageDate(found.imageDate));
        setStreetCheckStatus('available');
      } else {
        setStreetPanoData(null);
        setStreetCheckStatus('unavailable');
      }
    } catch (err) {
      console.warn('Street View coverage check error:', err);
      setStreetCheckStatus('error');
    }
  }, [approximate]);

  useEffect(() => {
    if (coords && engine === 'google') {
      const timer = setTimeout(() => {
        checkStreetViewCoverage(coords);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [coords, engine, checkStreetViewCoverage]);

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

      // Add 3D markers for all nearby places
      const nearbyPlaces = detail.nearby ?? [];
      nearbyPlaces.forEach((place) => {
        if (!place.lat || !place.lng) return;
        const m3d = new Marker3DElement({
          position: { lat: place.lat, lng: place.lng, altitude: 0 },
          label: `${place.name} (${place.km} km)`,
        });
        m3d.addEventListener('gmp-click', () => {
          map.flyCameraTo({
            endCamera: {
              center: { lat: place.lat, lng: place.lng, altitude: 0 },
              range: 500,
              tilt: 60,
              heading: 25,
            },
            durationMillis: 1800,
          });
          onSelectPlace?.(place.name);
        });
        map.append(m3d);
      });

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
    [approximate, center, coords, detail.nearby, onSelectPlace, property.title]
  );

  const createStreet = useCallback(
    async (view) => {
      const { StreetViewPanorama } = await importMapsLibrary('streetView');
      if (!streetPanoData?.location?.pano) {
        setStreetMissing(true);
        throw new Error('no-street');
      }
      setStreetLoading(true);
      try {
        const heading = view?.heading ?? streetPanoData.links?.[0]?.heading ?? 0;
        const panorama = new StreetViewPanorama(layers.current.street, {
          pano: streetPanoData.location.pano,
          pov: { heading, pitch: 5 },
          addressControl: false,
          fullscreenControl: false,
          motionTracking: false,
          motionTrackingControl: false,
          zoomControl: true,
          enableCloseButton: false,
        });

        // Ensure we only mark Street View as loaded when valid panorama data displays
        await new Promise((resolve, reject) => {
          let done = false;
          const timer = setTimeout(() => {
            if (!done) {
              done = true;
              setStreetLoading(false);
              resolve();
            }
          }, 3500);

          panorama.addListener('status_changed', () => {
            const status = panorama.getStatus();
            if (status === 'OK' && !done) {
              done = true;
              clearTimeout(timer);
              setStreetLoading(false);
              resolve();
            } else if (status && status !== 'OK' && !done) {
              done = true;
              clearTimeout(timer);
              setStreetLoading(false);
              reject(new Error(status));
            }
          });

          panorama.addListener('pano_changed', () => {
            if (!done) {
              done = true;
              clearTimeout(timer);
              setStreetLoading(false);
              resolve();
            }
          });
        });

        instances.current.street = panorama;
        setStreetDate(formatImageDate(streetPanoData.imageDate));
      } catch (err) {
        setStreetLoading(false);
        setStreetMissing(true);
        throw err;
      }
    },
    [streetPanoData]
  );

  const createMap = useCallback(
    async (view, initialType = 'roadmap') => {
      const [{ Map, Circle, InfoWindow }, { AdvancedMarkerElement, PinElement }] = await Promise.all([
        importMapsLibrary('maps'),
        importMapsLibrary('marker'),
      ]);
      const map = new Map(layers.current.map, {
        center: { lat: view?.lat ?? coords.lat, lng: view?.lng ?? coords.lng },
        zoom: view?.zoom ?? 16,
        mapId: MAP_ID,
        mapTypeId: initialType === 'satellite' ? 'hybrid' : 'roadmap',
        gestureHandling: 'cooperative',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      });

      // Distinct Red Property Pin anchored to property coordinates
      const propertyPin = new PinElement({
        background: '#dc2626', // Vibrant Red
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        scale: 1.25,
      });

      new AdvancedMarkerElement({
        map,
        position: { lat: coords.lat, lng: coords.lng },
        title: approximate ? `${property.title} (approximate area)` : property.title,
        content: propertyPin.element,
      });

      if (approximate && Circle) {
        new Circle({
          strokeColor: '#dc2626',
          strokeOpacity: 0.6,
          strokeWeight: 1.5,
          fillColor: '#dc2626',
          fillOpacity: 0.12,
          map,
          center: { lat: coords.lat, lng: coords.lng },
          radius: 350,
        });
      }

      // Shared InfoWindow for nearby place popups
      const infoWindow = new InfoWindow();
      infoWindowRef.current = infoWindow;

      // Clean up any previously registered markers
      Object.values(nearbyMarkersRef.current).forEach(({ marker }) => {
        if (marker) marker.map = null;
      });
      nearbyMarkersRef.current = {};

      // Clear any existing Google dashed connecting lines
      googleConnectingLines.current.forEach((l) => l.setMap?.(null));
      googleConnectingLines.current = [];

      const nearbyPlaces = detail.nearby ?? [];
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: coords.lat, lng: coords.lng });
      let hasNearbyCoords = false;

      // Render each nearby place with its category color label & dashed connecting line
      nearbyPlaces.forEach((place, index) => {
        let lat = Number(place.lat);
        let lng = Number(place.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
          const angle = (index * (360 / Math.max(nearbyPlaces.length, 1)) * Math.PI) / 180;
          const distKm = Number(place.km) || index + 1.2;
          lat = coords.lat + (distKm / 111) * Math.cos(angle);
          lng = coords.lng + (distKm / (111 * Math.cos((coords.lat * Math.PI) / 180))) * Math.sin(angle);
          place._resolvedLat = lat;
          place._resolvedLng = lng;
        } else {
          place._resolvedLat = lat;
          place._resolvedLng = lng;
        }

        hasNearbyCoords = true;
        bounds.extend({ lat, lng });

        // Add dashed connecting line from main property to landmark
        if (window.google?.maps?.Polyline) {
          const polyline = new window.google.maps.Polyline({
            path: [
              { lat: coords.lat, lng: coords.lng },
              { lat, lng },
            ],
            geodesic: true,
            strokeColor: initialType === 'satellite' ? '#ffffff' : '#0f172a',
            strokeOpacity: 0,
            strokeWeight: 2,
            icons: [
              {
                icon: {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: initialType === 'satellite' ? 0.9 : 0.7,
                  scale: 2.5,
                  strokeColor: initialType === 'satellite' ? '#ffffff' : '#0f172a',
                },
                offset: '0',
                repeat: '10px',
              },
            ],
            map,
          });
          googleConnectingLines.current.push(polyline);
        }

        const color = nearbyColor(place.type);
        const iconSvg = getNearbyIconSvg(place.type);

        const pill = document.createElement('div');
        pill.className = 'nearby-place-pill';
        pill.setAttribute('data-place', place.name);
        pill.style.cssText = `
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px 4px 5px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(8px);
          border-radius: 9999px;
          border: 1.5px solid ${color};
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          transform: translateZ(0);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
          white-space: nowrap;
          pointer-events: auto;
        `;

        pill.innerHTML = `
          <span style="display: flex; width: 22px; height: 22px; border-radius: 9999px; background: ${color}; color: #ffffff; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 4px ${color}66;">
            ${iconSvg}
          </span>
          <span style="display: flex; flex-direction: column; align-items: flex-start; line-height: 1.15; padding-right: 2px;">
            <span style="font-size: 11px; font-weight: 700; color: #1c1917; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${escapeHtml(place.name)}
            </span>
            <span style="font-size: 9.5px; font-weight: 600; color: ${color};">
              ${place.km} km by road
            </span>
          </span>
        `;

        const marker = new AdvancedMarkerElement({
          map,
          position: { lat, lng },
          title: `${place.name} (${place.km} km)`,
          content: pill,
        });

        pill.addEventListener('mouseenter', () => {
          pill.style.transform = 'scale(1.08)';
          pill.style.boxShadow = `0 6px 18px rgba(0,0,0,0.22), 0 0 0 2px ${color}`;
          pill.style.zIndex = '50';
          onHoverPlace?.(place.name);
        });

        pill.addEventListener('mouseleave', () => {
          if (selectedPlaceRef.current !== place.name) {
            pill.style.transform = 'scale(1)';
            pill.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.08)';
            pill.style.zIndex = '10';
          }
          onHoverPlace?.(null);
        });

        const showInfo = () => {
          map.panTo({ lat, lng });
          if (map.getZoom() < 14) map.setZoom(14);
          infoWindow.setContent(`
            <div style="font-family: inherit; padding: 4px 2px; max-width: 240px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="display: flex; width: 22px; height: 22px; border-radius: 9999px; background: ${color}; color: #ffffff; align-items: center; justify-content: center; flex-shrink: 0;">
                  ${iconSvg}
                </span>
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${color};">
                  ${escapeHtml(place.type)}
                </span>
              </div>
              <h4 style="font-size: 13.5px; font-weight: 700; color: #1c1917; margin: 0 0 4px 0; line-height: 1.3;">
                ${escapeHtml(place.name)}
              </h4>
              <p style="font-size: 11.5px; color: #78716c; margin: 0 0 10px 0;">
                <strong style="color: #1c1917;">${place.km} km by road</strong> from ${escapeHtml(property.title)}
              </p>
              <a href="https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=${lat},${lng}"
                 target="_blank" rel="noopener noreferrer"
                 style="display: inline-flex; align-items: center; gap: 4px; padding: 5px 11px; border-radius: 9999px; background: #1c1917; color: #ffffff; font-size: 11px; font-weight: 600; text-decoration: none;">
                Get Directions &rarr;
              </a>
            </div>
          `);
          infoWindow.open({ anchor: marker, map });
          onSelectPlace?.(place.name);
        };

        marker.addListener('gmp-click', showInfo);

        nearbyMarkersRef.current[place.name] = {
          marker,
          container: pill,
          place,
          showInfo,
        };
      });

      // Fit bounds so the property and all nearby places fit comfortably in the frame
      if (hasNearbyCoords && !view) {
        map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
        window.google.maps.event.addListenerOnce(map, 'idle', () => {
          if (map.getZoom() > 15) {
            map.setZoom(15);
          }
        });
      }

      instances.current.map = map;
    },
    [approximate, coords, detail.nearby, onHoverPlace, onSelectPlace, property.title]
  );

  const renderOpenConnectingLines = useCallback((map, currentCoords, placesList) => {
    if (!map || !currentCoords || !placesList?.length) return;
    const propLat = Number(currentCoords.lat);
    const propLng = Number(currentCoords.lng);
    const lineFeatures = [];

    placesList.forEach((place, index) => {
      let lat = Number(place.lat);
      let lng = Number(place.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
        const angle = (index * (360 / Math.max(placesList.length, 1)) * Math.PI) / 180;
        const distKm = Number(place.km) || index + 1.2;
        const latOffset = (distKm / 111) * Math.cos(angle);
        const lngOffset = (distKm / (111 * Math.cos((propLat * Math.PI) / 180))) * Math.sin(angle);
        lat = propLat + latOffset;
        lng = propLng + lngOffset;
      }
      lineFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [propLng, propLat],
            [lng, lat],
          ],
        },
        properties: { name: place.name, km: place.km },
      });
    });

    try {
      const existingSource = map.getSource('open-connecting-lines');
      if (existingSource) {
        existingSource.setData({ type: 'FeatureCollection', features: lineFeatures });
      } else {
        map.addSource('open-connecting-lines', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: lineFeatures },
        });
        map.addLayer({
          id: 'open-connecting-lines-layer',
          type: 'line',
          source: 'open-connecting-lines',
          paint: {
            'line-color': map._currentStyleName === 'satellite' ? '#ffffff' : '#0f172a',
            'line-width': 1.8,
            'line-dasharray': [2.5, 2.5],
            'line-opacity': 0.8,
          },
        });
      }
    } catch (e) {
      console.warn('[NeighbourhoodViewer] Could not add connecting lines layer:', e);
    }
  }, []);

  const renderOpenLandmarks = useCallback((map, maplibregl, currentCoords, placesList) => {
    if (!map || !maplibregl || !currentCoords || !placesList?.length) return;
    mapLibreLandmarkMarkers.current.forEach((m) => {
      try { m.remove(); } catch {}
    });
    mapLibreLandmarkMarkers.current = [];

    const propLat = Number(currentCoords.lat);
    const propLng = Number(currentCoords.lng);

    placesList.forEach((place, index) => {
      let lat = Number(place.lat);
      let lng = Number(place.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
        const angle = (index * (360 / Math.max(placesList.length, 1)) * Math.PI) / 180;
        const distKm = Number(place.km) || index + 1.2;
        const latOffset = (distKm / 111) * Math.cos(angle);
        const lngOffset = (distKm / (111 * Math.cos((propLat * Math.PI) / 180))) * Math.sin(angle);
        lat = propLat + latOffset;
        lng = propLng + lngOffset;
      }

      const color = nearbyColor(place.type);
      const iconSvg = getNearbyIconSvg(place.type);

      const el = document.createElement('div');
      el.className = 'open-nearby-marker cursor-pointer transition-transform hover:scale-105 select-none';
      el.style.transform = 'translate(-50%, -100%)';
      el.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="
            background: #ffffff;
            color: #0f172a;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 4px 14px rgba(0,0,0,0.2);
            border: 1.5px solid ${color};
            white-space: nowrap;
            margin-bottom: 2px;
            display: flex;
            align-items: center;
            gap: 6px;
          ">
            <span style="color: ${color}; display: flex; align-items: center;">${iconSvg}</span>
            <span>${escapeHtml(place.name)}</span>
            <span style="background: #eff6ff; color: ${color}; padding: 1px 6px; border-radius: 8px; font-size: 10px; font-weight: 800;">
              ${place.km ? `${place.km} km` : ''}
            </span>
          </div>
          <div style="width: 14px; height: 14px; background: ${color}; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectPlace?.(place.name);
        map.flyTo({ center: [lng, lat], zoom: 14.5, duration: 600 });
      });

      el.addEventListener('mouseenter', () => {
        onHoverPlace?.(place.name);
      });
      el.addEventListener('mouseleave', () => {
        onHoverPlace?.(null);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);

      mapLibreLandmarkMarkers.current.push(marker);
    });
  }, [onHoverPlace, onSelectPlace]);

  const createOpen = useCallback(
    async (first, view) => {
      const lib = await import('@/lib/maplibre');
      const { default: maplibregl, loadSiteStyle, getSatelliteStyle, showApproximateArea } = lib;
      mapLib.current = lib;
      const isSat = first === 'satellite';
      const style = isSat ? getSatelliteStyle() : await loadSiteStyle();
      const framing = first === 'map' ? OPEN_FLAT : isSat ? { zoom: 15.5, pitch: 0, bearing: 0 } : OPEN_3D;
      const camera = {
        center: [view?.lng ?? coords.lng, view?.lat ?? coords.lat],
        zoom: view?.zoom ?? framing.zoom,
        pitch: view?.tilt ?? framing.pitch,
        bearing: view?.heading ?? framing.bearing,
      };
      const animate = !view && first === '3d' && !prefersReducedMotion();
      const host = layers.current.open;
      if (!host) return;
      const mount = document.createElement('div');
      mount.style.width = '100%';
      mount.style.height = '100%';
      host.replaceChildren(mount);
      const map = new maplibregl.Map({
        container: mount,
        style,
        ...camera,
        ...(animate ? OPEN_ABOVE : {}),
        maxPitch: 70,
        cooperativeGestures: true,
        attributionControl: { compact: true },
      });
      map._currentStyleName = isSat ? 'satellite' : 'street';
      // Zoom and compass buttons: the only way to zoom without a wheel or pinch.
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

      // An exact address gets a pin; an approximate one gets a shaded area once the style is in.
      if (!approximate) {
        const pin = document.createElement('div');
        pin.className = 'h-5 w-5 rounded-full border-4 border-white bg-stone-900 shadow-[0_2px_8px_rgba(0,0,0,0.35)]';
        pin.setAttribute('role', 'img');
        pin.setAttribute('aria-label', property.title);
        new maplibregl.Marker({ element: pin }).setLngLat([coords.lng, coords.lat]).addTo(map);
      }

      try {
        await new Promise((resolve, reject) => {
          map.once('load', resolve);
          // Tile hiccups after the style is up are retried by the map; only a failed start counts.
          map.on('error', (event) => {
            if (!map.loaded()) reject(event.error);
          });
        });
      } catch (error) {
        map.remove();
        throw error;
      }
      if (approximate) showApproximateArea(map, coords);
      instances.current.open = map;

      // Render nearby landmark markers and dashed connecting lines
      renderOpenConnectingLines(map, coords, detail.nearby);
      renderOpenLandmarks(map, maplibregl, coords, detail.nearby);

      if (animate) {
        // Fly in once, then one slow orbit. Any input stops it for good.
        let stopped = false;
        let frame = 0;
        const stop = () => {
          if (stopped) return;
          stopped = true;
          cancelAnimationFrame(frame);
          map.stop();
        };
        stopOrbit.current = stop;
        ['pointerdown', 'wheel', 'keydown', 'touchstart'].forEach((type) =>
          host.addEventListener(type, stop, { once: true, passive: true })
        );
        map.once('moveend', () => {
          if (stopped) return;
          const from = map.getBearing();
          const start = performance.now();
          const turn = (now) => {
            if (stopped) return;
            const progress = Math.min((now - start) / ORBIT_MS, 1);
            map.setBearing(from + 360 * progress);
            if (progress < 1) frame = requestAnimationFrame(turn);
          };
          frame = requestAnimationFrame(turn);
        });
        map.flyTo({ ...camera, duration: 2500, essential: true });
      }
    },
    [approximate, coords, detail.nearby, property.title, renderOpenConnectingLines, renderOpenLandmarks]
  );

  const frameOpen = useCallback(
    (next) => {
      const map = instances.current.open;
      const lib = mapLib.current;
      if (!map || !lib) return;
      stopOrbit.current?.();
      const duration = prefersReducedMotion() ? 0 : 500;

      // Switch between Satellite and Vector/Street styles if needed
      if (next === 'satellite' && map._currentStyleName !== 'satellite') {
        map._currentStyleName = 'satellite';
        map.setStyle(lib.getSatelliteStyle());
        map.once('style.load', () => {
          if (approximate) lib.showApproximateArea(map, coords);
          if (nearbyRun.current.routes) lib.addNearbyLayers(map, coords, nearbyRun.current.routes);
          renderOpenConnectingLines(map, coords, detail.nearby);
          renderOpenLandmarks(map, lib.default, coords, detail.nearby);
        });
      } else if ((next === 'map' || next === '3d') && map._currentStyleName === 'satellite') {
        map._currentStyleName = 'street';
        lib.loadSiteStyle().then((streetStyle) => {
          map.setStyle(streetStyle);
          map.once('style.load', () => {
            if (approximate) lib.showApproximateArea(map, coords);
            if (nearbyRun.current.routes) lib.addNearbyLayers(map, coords, nearbyRun.current.routes);
            renderOpenConnectingLines(map, coords, detail.nearby);
            renderOpenLandmarks(map, lib.default, coords, detail.nearby);
          });
        });
      }

      if (nearbyRun.current.routes) {
        // Nearby places on screen: keep the overview, only tilt it.
        const pitch = (next === 'map' || next === 'satellite') ? 0 : 55;
        const bearing = (next === 'map' || next === 'satellite') ? 0 : 20;
        map.easeTo({ pitch, bearing, duration });
        return;
      }

      if (next === 'satellite') {
        // Satellite mode MUST stay strictly flat and North-up (no tilt or rotation)
        map.resetNorthPitch?.({ duration: 250 });
        map.easeTo({ center: [coords.lng, coords.lat], zoom: 15.5, pitch: 0, bearing: 0, duration });
        return;
      }
      if (next === 'map') {
        map.resetNorthPitch?.({ duration: 250 });
        map.easeTo({ center: [coords.lng, coords.lat], zoom: 15, pitch: 0, bearing: 0, duration });
        return;
      }
      if (next === '3d') {
        map.easeTo({ center: [coords.lng, coords.lat], ...OPEN_3D, duration });
        return;
      }
    },
    [approximate, coords, detail.nearby, renderOpenConnectingLines, renderOpenLandmarks]
  );

  const ensureMode = useCallback(
    async (next, view, requestedEngine = engine) => {
      if (requestedEngine === 'open') {
        if (instances.current.open) {
          frameOpen(next);
          return true;
        }
        try {
          await createOpen(next, view);
          setCreated((cur) => ({ ...cur, open: true }));
          return true;
        } catch (err) {
          console.warn('[NeighbourhoodViewer] Open map creation failed:', err);
          return false;
        }
      }

      // Google Maps: satellite and map share the 2D map instance
      if (next === 'satellite' || next === 'map') {
        if (instances.current.map) {
          instances.current.map.setMapTypeId(next === 'satellite' ? 'hybrid' : 'roadmap');
          return true;
        }
        try {
          await createMap(view, next);
          setCreated((current) => ({ ...current, map: true }));
          return true;
        } catch (err) {
          console.warn('[NeighbourhoodViewer] Google Map creation failed:', err);
          return false;
        }
      }

      if (instances.current[next]) return true;
      const creators = { '3d': create3D, street: createStreet };
      try {
        await creators[next](view);
        setCreated((current) => ({ ...current, [next]: true }));
        return true;
      } catch (err) {
        console.warn(`[NeighbourhoodViewer] Google ${next} creation failed:`, err);
        return false;
      }
    },
    [create3D, createMap, createOpen, createStreet, engine, frameOpen]
  );

  // ── Nearby places (free map): road routes fan out from the area like a web ──
  const places = detail.nearby ?? [];

  async function showNearby() {
    trackPropertyMapInteracted(property, 'nearby_places');
    const map = instances.current.open;
    const lib = mapLib.current;
    if (!map || !lib) return;
    setNearby('loading');
    try {
      // Saved by scripts/nearby-routes.mjs; fetched only now.
      const response = await fetch(`/routes/${property.slug}.json`);
      if (!response.ok) throw new Error(`Routes failed to load (${response.status})`);
      const saved = (await response.json()).routes ?? [];
      if (!saved.length) throw new Error('No routes');
      // Nearest first, so the web grows outward.
      const routes = [...saved].sort((a, b) => a.km - b.km).map((route, id) => ({ ...route, id, color: nearbyColor(route.type) }));
      stopOrbit.current?.();
      const animate = !prefersReducedMotion();
      lib.addNearbyLayers(map, coords, routes);
      lib.collapseAttribution(map);
      // The centre of the web: where the property is.
      const homeEl = document.createElement('div');
      const home = new lib.default.Marker({ element: homeEl }).setLngLat([coords.lng, coords.lat]).addTo(map);
      const markers = routes.map((route) => {
        const element = document.createElement('div');
        element.className = 'group/pin';
        // anchor left + offset: the icon's centre (not the label) sits on the place.
        const marker = new lib.default.Marker({ element, anchor: 'left', offset: [-14, 0] })
          .setLngLat(route.coordinates[route.coordinates.length - 1])
          .addTo(map);
        return { id: route.id, element, marker };
      });
      // Labels that would overlap an icon or a nearer place's label step aside (icon stays,
      // focus still shows it). Re-run whenever the map settles or pins appear.
      const declutter = () => {
        markers.forEach(({ element }) => delete element.dataset.compact);
        const taken = [homeEl, ...markers.map(({ element }) => element.querySelector('button > span'))]
          .filter(Boolean)
          .map((node) => node.getBoundingClientRect());
        const overlaps = (box) => taken.some((other) => box.left < other.right + 4 && box.right + 4 > other.left && box.top < other.bottom + 4 && box.bottom + 4 > other.top);
        markers.forEach(({ element }) => {
          const label = element.querySelector('button > span:last-child');
          if (!label) return;
          const box = label.getBoundingClientRect();
          if (overlaps(box)) element.dataset.compact = 'true';
          else taken.push(box);
        });
      };
      map.on('moveend', declutter);
      nearbyRun.current = { routes, markers, home, before: mode, cancel: null, declutter };
      setHomeElement(homeEl);
      setPins(markers.map(({ id, element }) => {
        const route = routes[id];
        return { id, element, name: route.name, type: route.type, km: route.km, color: route.color, shown: false };
      }));
      setMode('map');
      lib.fitNearby(map, coords, routes, animate ? 900 : 0);
      nearbyRun.current.cancel = lib.drawNearbyRoutes(map, routes, {
        animate,
        delay: animate ? 300 : 0,
        onArrive: (id) => setPins((current) => current.map((pin) => (pin.id === id ? { ...pin, shown: true } : pin))),
      });
      setNearby('on');
    } catch {
      clearNearby();
      setNearby('error');
    }
  }

  // Removes the routes and pins; returns the mode that was showing before.
  function clearNearby() {
    const run = nearbyRun.current;
    run.cancel?.();
    run.markers.forEach(({ marker }) => marker.remove());
    run.home?.remove();
    const map = instances.current.open;
    if (map && run.declutter) map.off('moveend', run.declutter);
    if (map && mapLib.current) mapLib.current.removeNearbyLayers(map);
    nearbyRun.current = { routes: null, markers: [], home: null, before: null, cancel: null, declutter: null };
    setPins([]);
    setHomeElement(null);
    setFocusedPlace(null);
    return run.before;
  }

  function hideNearby() {
    const before = clearNearby() ?? mode;
    setNearby('off');
    setMode(before);
    frameOpen(before);
  }

  // ── Google Places marker management ──────────────────────────────────────
  function clearGooglePlaceMarkers() {
    googlePlaceMarkers.current.forEach((m) => {
      if (m?.remove) {
        try { m.remove(); } catch {}
      }
      if (m && m.map !== undefined) {
        m.map = null;
      }
    });
    googlePlaceMarkers.current = [];
  }

  // Focus: scale up the selected marker; fly camera to destination in 3D or 2D
  const handlePlaceFocus = useCallback(
    (id) => {
      setFocusedPlaceId(id);
      if (!coords) return;
      if (!id) {
        if (mode === '3d' && instances.current['3d']) {
          instances.current['3d'].flyCameraTo({
            endCamera: {
              center: { lat: coords.lat, lng: coords.lng, altitude: 0 },
              range: SETTLED.range,
              tilt: SETTLED.tilt,
              heading: SETTLED.heading,
            },
            durationMillis: 1800,
          });
        } else if (mode === 'map' && instances.current.map) {
          instances.current.map.panTo({ lat: coords.lat, lng: coords.lng });
          instances.current.map.setZoom(16);
        }
        return;
      }
      const place = currentPlacesRef.current.find((p) => p.id === id);
      if (!place) return;

      if (mode === '3d' && instances.current['3d']) {
        instances.current['3d'].flyCameraTo({
          endCamera: {
            center: { lat: place.location.lat, lng: place.location.lng, altitude: 0 },
            range: 450,
            tilt: 60,
            heading: 25,
          },
          durationMillis: 1800,
        });
      } else if ((mode === 'map' || mode === 'satellite') && instances.current.map) {
        instances.current.map.panTo(place.location);
        instances.current.map.setZoom(17);
      }
    },
    [coords, mode, setFocusedPlaceId]
  );

  const renderGoogleMarkers = useCallback(
    async (places, category, targetMode) => {
      clearGooglePlaceMarkers();
      if (!places?.length || !category) return;
      const activeMode = targetMode || mode;

      const catConfig = PLACE_CATEGORIES.find((c) => c.id === category);
      const color     = catConfig?.color ?? '#57534e';

      if (activeMode === '3d' && instances.current['3d']) {
        try {
          const { Marker3DElement } = await importMapsLibrary('maps3d');
          const newMarkers = places.map((place) => {
            const m3d = new Marker3DElement({
              position: { lat: place.location.lat, lng: place.location.lng, altitude: 0 },
              label: `${place.name} (${place.distanceKm} km)`,
            });
            m3d._placeId = place.id;
            m3d.addEventListener('gmp-click', () => handlePlaceFocus(place.id));
            instances.current['3d'].append(m3d);
            return m3d;
          });
          googlePlaceMarkers.current = newMarkers;
        } catch (err) {
          console.warn('Marker3D error:', err);
        }
      } else if ((activeMode === 'map' || activeMode === 'satellite') && instances.current.map) {
        try {
          const { AdvancedMarkerElement, PinElement } = await importMapsLibrary('marker');
          const newMarkers = places.map((place) => {
            const pin = new PinElement({
              background:  color,
              borderColor: 'white',
              glyphColor:  'white',
              scale:       0.9,
            });
            const marker = new AdvancedMarkerElement({
              map:      instances.current.map,
              position: place.location,
              title:    `${place.name} (${place.distanceKm} km)`,
              content:  pin.element,
            });
            marker._placeId = place.id;
            marker.addListener('gmp-click', () => handlePlaceFocus(place.id));
            return marker;
          });
          googlePlaceMarkers.current = newMarkers;
        } catch (err) {
          console.warn('AdvancedMarker error:', err);
        }
      }
    },
    [handlePlaceFocus, mode]
  );

  // Called by NearbyPlacesPanel when a new category's results arrive.
  const handlePlacesLoaded = useCallback(
    (places, category) => {
      currentPlacesRef.current = places;
      currentCatRef.current    = category;
      renderGoogleMarkers(places, category, mode);
    },
    [mode, renderGoogleMarkers]
  );

  const explore = useCallback(async () => {
    setPhase('loading');
    const view = shared;
    let curEngine = engine;

    if (curEngine === 'google') {
      const first = view?.mode === 'street' && streetDisabled ? startMode : view?.mode ?? startMode;
      setMode(first);
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));

      let ok = await ensureMode(first, view, 'google');
      if (ok) {
        setPhase('ready');
        return;
      }

      // 3D or Street View unavailable on Google, try Google 2D Map
      if (first !== 'map' && first !== 'satellite') {
        ok = await ensureMode('map', view, 'google');
        if (ok) {
          setMode('map');
          setPhase('ready');
          return;
        }
      }

      // If Google Maps failed on Vercel:
      console.warn('[NeighbourhoodViewer] Google Maps failed in production. Auto-switching to OpenStreetMap / MapLibre.');
      setEngine('open');
      curEngine = 'open';
    }

    const openFirst = view?.mode === 'street' ? 'map' : view?.mode ?? (startMode === '3d' ? '3d' : 'map');
    setMode(openFirst);
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));

    const openOk = await ensureMode(openFirst, view, 'open');
    if (openOk) {
      setPhase('ready');
      return;
    }

    if (openFirst !== 'map') {
      const flatOk = await ensureMode('map', view, 'open');
      if (flatOk) {
        setMode('map');
        setPhase('ready');
        return;
      }
    }

    setPhase('error');
  }, [engine, ensureMode, shared, startMode, streetDisabled]);

  async function switchTo(next) {
    if (next === mode) return;
    if (next === 'street' && streetDisabled) return;
    trackPropertyMapInteracted(property, next);

    if (engine === 'open') {
      setMode(next);
      frameOpen(next);
      return;
    }

    // Google engine: instant switch between satellite and street map
    if ((next === 'satellite' || next === 'map') && instances.current.map) {
      setMode(next);
      instances.current.map.setMapTypeId(next === 'satellite' ? 'hybrid' : 'roadmap');
      if (currentCatRef.current && currentPlacesRef.current.length) {
        renderGoogleMarkers(currentPlacesRef.current, currentCatRef.current, next);
      }
      return;
    }

    const ok = await ensureMode(next, null, 'google');
    if (ok) {
      setMode(next);
      if (currentCatRef.current && currentPlacesRef.current.length) {
        renderGoogleMarkers(currentPlacesRef.current, currentCatRef.current, next);
      }
    } else {
      console.warn(`[NeighbourhoodViewer] Switching to Google ${next} failed. Auto-switching to Open engine.`);
      setEngine('open');
      const fallbackMode = next === 'street' ? 'map' : next;
      const openOk = await ensureMode(fallbackMode, null, 'open');
      if (openOk) {
        setMode(fallbackMode);
      }
    }
  }

  // Gestures: inline the map only moves with two fingers / Ctrl-scroll; expanded it takes everything.
  useEffect(() => {
    const handling = expanded ? 'GREEDY' : 'COOPERATIVE';
    if (instances.current['3d']) instances.current['3d'].gestureHandling = handling;
    instances.current.map?.setOptions({ gestureHandling: handling.toLowerCase() });
    const open = instances.current.open;
    if (open && expanded) open.cooperativeGestures.disable();
    else if (open) open.cooperativeGestures.enable();
  }, [expanded, created]);

  // A place in focus: its route stands out and its pin sits above the others.
  useEffect(() => {
    const map = instances.current.open;
    if (!map || nearby !== 'on') return;
    mapLib.current?.highlightNearby(map, focusedPlace);
    nearbyRun.current.markers.forEach(({ id, element }) => {
      element.style.zIndex = id === focusedPlace ? '2' : '';
    });
  }, [focusedPlace, nearby]);

  // Pins just appeared or changed: re-check which labels fit.
  useEffect(() => {
    nearbyRun.current.declutter?.();
  }, [pins]);

  // Google Places: highlight the focused marker.
  useEffect(() => {
    googlePlaceMarkers.current.forEach((m) => {
      const isFocused = m._placeId === focusedPlaceId;
      if (m.content) {
        m.content.style.transform = isFocused ? 'scale(1.25)' : '';
        m.content.style.zIndex    = isFocused ? '10' : '';
        m.content.style.transition = 'transform 150ms ease';
      }
    });
  }, [focusedPlaceId]);

  // When active category is cleared, remove all Google Place markers.
  useEffect(() => {
    if (!activeCategory) {
      currentCatRef.current = null;
      currentPlacesRef.current = [];
      clearGooglePlaceMarkers();
    }
  }, [activeCategory]);

  // Synchronize selection from nearby places list with map markers
  useEffect(() => {
    if (!selectedPlaceName) return;
    if (phase === 'idle') {
      const timer = setTimeout(() => {
        explore();
      }, 0);
      return () => clearTimeout(timer);
    }
    const item = nearbyMarkersRef.current[selectedPlaceName];
    if (item && instances.current.map) {
      item.showInfo();
    }
    Object.values(nearbyMarkersRef.current).forEach(({ container, place }) => {
      const isSel = place.name === selectedPlaceName;
      const cColor = nearbyColor(place.type);
      container.style.transform = isSel ? 'scale(1.15)' : 'scale(1)';
      container.style.boxShadow = isSel
        ? `0 8px 24px rgba(0,0,0,0.28), 0 0 0 3px ${cColor}`
        : '0 4px 14px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.08)';
      container.style.zIndex = isSel ? '100' : '10';
    });
  }, [selectedPlaceName, phase, explore]);

  // Synchronize hover state between nearby places list and map markers
  useEffect(() => {
    Object.values(nearbyMarkersRef.current).forEach(({ container, place }) => {
      const isSelected = place.name === selectedPlaceName;
      const isHovered = place.name === hoveredPlaceName;
      const cColor = nearbyColor(place.type);
      if (isSelected) {
        container.style.transform = 'scale(1.15)';
        container.style.boxShadow = `0 8px 24px rgba(0,0,0,0.28), 0 0 0 3px ${cColor}`;
        container.style.zIndex = '100';
      } else if (isHovered) {
        container.style.transform = 'scale(1.08)';
        container.style.boxShadow = `0 6px 18px rgba(0,0,0,0.22), 0 0 0 2px ${cColor}`;
        container.style.zIndex = '50';
      } else {
        container.style.transform = 'scale(1)';
        container.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.08)';
        container.style.zIndex = '10';
      }
    });
  }, [hoveredPlaceName, selectedPlaceName]);

  // The free map holds a WebGL context; release it when the page goes.
  useEffect(() => {
    const live = instances.current;
    const run = nearbyRun;
    return () => {
      stopOrbit.current?.();
      run.current.cancel?.();
      live.open?.remove();
    };
  }, []);

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

  const handleRecenter = useCallback(() => {
    if (!coords) return;
    stopOrbit.current?.();

    if (engine === 'open' && instances.current.open) {
      const map = instances.current.open;
      if (mode === 'satellite') {
        map.resetNorthPitch?.({ duration: 300 });
        map.flyTo({ center: [coords.lng, coords.lat], zoom: 15.5, pitch: 0, bearing: 0, duration: 800 });
      } else if (mode === 'map') {
        map.resetNorthPitch?.({ duration: 300 });
        map.flyTo({ center: [coords.lng, coords.lat], zoom: 15, pitch: 0, bearing: 0, duration: 800 });
      } else {
        map.flyTo({ center: [coords.lng, coords.lat], ...OPEN_3D, duration: 800 });
      }
      return;
    }

    if (engine === 'google') {
      if (mode === '3d' && instances.current['3d']) {
        instances.current['3d'].flyCameraTo({
          endCamera: { center: coords, ...SETTLED },
          durationMillis: 800,
        });
        return;
      }
      if ((mode === 'map' || mode === 'satellite') && instances.current.map) {
        const map = instances.current.map;
        map.panTo(coords);
        map.setZoom(15);
        if (typeof map.setHeading === 'function') map.setHeading(0);
        if (typeof map.setTilt === 'function') map.setTilt(0);
        return;
      }
      if (mode === 'street' && instances.current.street) {
        instances.current.street.setPosition(coords);
        return;
      }
    }
  }, [coords, engine, mode]);

  const handleResetNorth = useCallback(() => {
    stopOrbit.current?.();
    if (engine === 'open' && instances.current.open) {
      instances.current.open.resetNorthPitch?.({ duration: 300 });
      instances.current.open.easeTo({ bearing: 0, pitch: 0, duration: 300 });
    } else if (engine === 'google' && instances.current.map) {
      if (typeof instances.current.map.setHeading === 'function') instances.current.map.setHeading(0);
      if (typeof instances.current.map.setTilt === 'function') instances.current.map.setTilt(0);
    }
  }, [engine]);

  function share() {
    const url = new URL(window.location.href);
    ['view', 'lat', 'lng', 'range', 'tilt', 'heading', 'zoom'].forEach((key) => url.searchParams.delete(key));
    url.searchParams.set('view', mode);
    const round = (n, digits = 5) => String(Math.round(n * 10 ** digits) / 10 ** digits);
    // When listing hides exact location (approximate privacy setting), do not expose precise coordinates in URL
    if (!approximate) {
      if (engine === 'open' && instances.current.open) {
        const map = instances.current.open;
        const c = map.getCenter();
        url.searchParams.set('lat', round(c.lat));
        url.searchParams.set('lng', round(c.lng));
        url.searchParams.set('zoom', round(map.getZoom(), 1));
        url.searchParams.set('tilt', round(map.getPitch(), 1));
        url.searchParams.set('heading', round(map.getBearing(), 1));
      } else if (mode === '3d' && instances.current['3d']) {
        const map = instances.current['3d'];
        url.searchParams.set('lat', round(map.center.lat));
        url.searchParams.set('lng', round(map.center.lng));
        url.searchParams.set('range', round(map.range, 0));
        url.searchParams.set('tilt', round(map.tilt, 1));
        url.searchParams.set('heading', round(map.heading, 1));
      } else if ((mode === 'map' || mode === 'satellite') && instances.current.map) {
        const c = instances.current.map.getCenter();
        url.searchParams.set('lat', round(c.lat()));
        url.searchParams.set('lng', round(c.lng));
        url.searchParams.set('zoom', round(instances.current.map.getZoom(), 1));
      }
    }
    if (mode === 'street' && instances.current.street) {
      url.searchParams.set('heading', round(instances.current.street.getPov().heading, 1));
    }
    const label = modes[modeIndex].label;
    window.open(whatsappShareLink(`Take a look around ${property.title}, ${property.location} (${label} view): ${url}`), '_blank', 'noopener');
  }

  function onTabKey(event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const enabled = modes.filter((m) => m.id !== 'street' || !streetDisabled);
    const index = enabled.findIndex((m) => m.id === mode);
    const next = enabled[(index + (event.key === 'ArrowRight' ? 1 : enabled.length - 1)) % enabled.length];
    switchTo(next.id);
    document.getElementById(`viewer-tab-${property.slug}-${next.id}`)?.focus();
  }

  if (!coords) {
    if (geocodeFailed) {
      return (
        <div className="rounded-3xl border border-stone-200/90 bg-stone-50 p-8 text-center">
          <MapPin className="mx-auto h-8 w-8 text-stone-400 mb-2" />
          <p className="text-sm font-semibold text-stone-800">Map location not available</p>
          <p className="text-xs text-stone-500 mt-1">Precise coordinates could not be determined for this address.</p>
        </div>
      );
    }
    return (
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-3xl border border-stone-200/90 bg-stone-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="h-8 w-36 rounded-full bg-stone-200 motion-safe:animate-pulse" />
          <p className="text-xs text-stone-500">Locating neighbourhood…</p>
        </div>
      </div>
    );
  }

  const frame = 'relative w-full overflow-hidden rounded-3xl border border-stone-200/90 bg-stone-100 dark:bg-stone-50 aspect-[4/3] sm:aspect-[16/9]';

  const exploreLabel = shared ? 'Open the shared view' : startMode === '3d' ? 'Explore in 3D' : 'Explore the area';
  const layerIds = ['3d', 'map', 'street', 'open'];
  const visibleLayer = engine === 'google' ? (mode === 'satellite' ? 'map' : mode) : 'open';
  const modeIndex = Math.max(0, modes.findIndex((m) => m.id === mode));

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
        aria-label={`${modes[modeIndex].label} view of ${property.title}`}
        data-lenis-prevent
        className={expanded ? 'relative flex-1 overflow-hidden rounded-2xl border border-stone-200/90 bg-stone-100' : frame}
      >
        {/* One layer per Google mode (only the active one is visible), or the single free map.
            light-scope: the map, its pin and controls keep their light colours in dark mode. */}
        {layerIds.map((id) => (
          <div
            key={id}
            ref={(element) => {
              layers.current[id] = element;
            }}
            aria-hidden={visibleLayer !== id}
            className={`light-scope absolute inset-0 transition-[opacity,filter] duration-200 ${EASE} motion-reduce:transition-none ${
              visibleLayer === id && phase !== 'idle' ? 'opacity-100' : 'pointer-events-none opacity-0 blur-[2px]'
            }`}
          />
        ))}

        {/* Preview: the listing photo; no map has loaded yet. */}
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

        {/* Chips sit top-left, clear of the map's zoom controls and its attribution at the bottom. */}
        <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-wrap gap-2 max-w-[calc(100%-120px)] sm:max-w-md">
          {approximate ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-stone-900 shadow-sm backdrop-blur dark:bg-stone-50/95">
              <MapPin className="w-3 h-3 text-red-600" />
              Approximate location
            </span>
          ) : null}
          {mode === 'street' && phase === 'ready' && !streetLoading && (
            <>
              {isNearbyStreetView ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/95 text-white px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur">
                  Nearby street view {streetDistance ? `(~${streetDistance}m)` : ''}
                </span>
              ) : null}
              {streetLocationName ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-900/85 text-white px-2.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur max-w-[180px] sm:max-w-xs truncate" title={streetLocationName}>
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{streetLocationName}</span>
                </span>
              ) : null}
              {streetDate ? (
                <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-stone-900 shadow-sm backdrop-blur dark:bg-stone-50/95">
                  Street photo from {streetDate}
                </span>
              ) : null}
            </>
          )}
        </div>

        {/* When Street View is active, provide a clear way to return to 3D or regular map directly in the view */}
        {mode === 'street' && phase === 'ready' && !streetLoading && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => switchTo('3d')}
              className="press inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-900 shadow-md backdrop-blur hover:bg-white focus-ring dark:bg-stone-900/90 dark:text-white"
              title="Return to 3D neighbourhood view"
            >
              <Box className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
              <span className="hidden sm:inline">Return to</span> 3D
            </button>
            <button
              type="button"
              onClick={() => switchTo('map')}
              className="press inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-900 shadow-md backdrop-blur hover:bg-white focus-ring dark:bg-stone-900/90 dark:text-white"
              title="Return to property map"
            >
              <MapIcon className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
              <span className="hidden sm:inline">Return to</span> Map
            </button>
          </div>
        )}

        {/* Street View Loading State: Do not show successful view until panorama has loaded */}
        {mode === 'street' && streetLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-stone-950/60 backdrop-blur-sm text-white">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span className="mt-2.5 text-xs font-medium text-white/90">Loading 360° Street View…</span>
          </div>
        )}

        {/* Floating Controls: Recenter and Align to North */}
        {phase === 'ready' && mode !== 'street' && (
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={handleRecenter}
              title="Recenter map to property"
              aria-label="Recenter map to property"
              className="press inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-900 shadow-lg backdrop-blur hover:bg-white focus-ring border border-stone-200/80 transition-all dark:bg-stone-900/90 dark:text-white dark:border-stone-700"
            >
              <Crosshair className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
              <span>Recenter</span>
            </button>
            <button
              type="button"
              onClick={handleResetNorth}
              title="Align map to North"
              aria-label="Align map to North"
              className="press inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-stone-900 shadow-lg backdrop-blur hover:bg-white focus-ring border border-stone-200/80 transition-all dark:bg-stone-900/90 dark:text-white dark:border-stone-700"
            >
              <Compass className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
              <span className="hidden sm:inline">North</span>
            </button>
          </div>
        )}
      </div>

      {/* Nearby pins live inside MapLibre's markers; React renders their content. */}
      {homeElement
        ? createPortal(
            <span
              role="img"
              aria-label={`${property.title}${approximate ? ', approximate area' : ''}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg ring-[3px] ring-white"
            >
              <House className="h-4 w-4" />
            </span>,
            homeElement
          )
        : null}
      {pins.map((pin) =>
        createPortal(
          <NearbyPin pin={pin} focused={focusedPlace === pin.id} onFocusChange={setFocusedPlace} />,
          pin.element,
          String(pin.id)
        )
      )}

      {/* Toolbar: outside the stage, so it never covers Google's attribution. */}
      {phase === 'ready' ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            role="tablist"
            aria-label="View"
            onKeyDown={onTabKey}
            className="relative grid rounded-full border border-stone-200 bg-stone-100/80 p-1 dark:bg-stone-100"
            style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0, 1fr))` }}
          >
            <span
              aria-hidden="true"
              className={`absolute top-1 bottom-1 left-1 rounded-full bg-white shadow-sm dark:bg-stone-300 transition-transform duration-200 ${EASE} motion-reduce:transition-none`}
              style={{ width: `calc((100% - 0.5rem) / ${modes.length})`, transform: `translateX(${modeIndex * 100}%)` }}
            />
            {modes.map((m) => {
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
                  title={
                    disabled
                      ? streetCheckStatus === 'checking'
                        ? 'Checking Street View availability…'
                        : "Street View isn't available around this property"
                      : isNearbyStreetView
                      ? `Nearby Street View (${streetDistance ? `~${streetDistance}m` : 'nearby'})`
                      : undefined
                  }
                  onClick={() => switchTo(m.id)}
                  className="relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-stone-600 aria-selected:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40 transition-colors focus-ring"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">{m.label}</span>
                  {m.id === 'street' && !disabled && isNearbyStreetView && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Nearby street view" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {engine === 'open' && places.length ? (
              <button
                type="button"
                onClick={nearby === 'on' ? hideNearby : showNearby}
                aria-pressed={nearby === 'on'}
                disabled={nearby === 'loading'}
                className="press inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-900 hover:bg-stone-50 dark:bg-stone-50 dark:hover:bg-stone-100 transition-colors focus-ring disabled:opacity-60 aria-pressed:border-stone-900 aria-pressed:bg-stone-900 aria-pressed:text-white aria-pressed:hover:bg-black dark:aria-pressed:bg-stone-900 dark:aria-pressed:hover:bg-stone-800"
              >
                <Route className="w-3.5 h-3.5" />
                Nearby places
              </button>
            ) : null}
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
      <p aria-live="polite" className="sr-only">
        {nearby === 'on' ? `Showing road routes to ${pins.length} nearby places.` : ''}
      </p>
      {nearby === 'error' ? (
        <p className="text-xs text-red-600">Couldn&apos;t load the nearby places. Please try again.</p>
      ) : null}
      {engine === 'google' && streetDisabled && phase === 'ready' ? (
        <p className="text-xs text-stone-500">
          {streetCheckStatus === 'checking'
            ? 'Checking 360° Street View coverage…'
            : "Street View imagery isn't available within 1 km of this property."}
        </p>
      ) : null}
      {engine === 'google' && !streetDisabled && isNearbyStreetView && mode === 'street' && phase === 'ready' ? (
        <p className="text-xs text-amber-700 dark:text-amber-600">
          Viewing nearest outdoor Street View (~{streetDistance}m from property{streetLocationName ? ` near ${streetLocationName}` : ''}).
        </p>
      ) : null}

      {/* ── Google Places nearby panel ─────────────────────────────────────
          Only renders after the viewer is ready and a Google key is present.
          Shown below the toolbar so it never covers the map or attribution. */}
      {engine === 'google' && phase === 'ready' ? (
        <NearbyPlacesPanel
          coords={coords}
          activeCategory={activeCategory}
          onCategoryChange={(cat) => {
            setActiveCategory(cat);
            setFocusedPlaceId(null);
            // Switch to map mode so markers are visible (3D mode uses a
            // different layer; markers appear on the 2D map layer).
            if (cat && mode === 'street') switchTo('map');
          }}
          focusedPlaceId={focusedPlaceId}
          onPlaceFocus={handlePlaceFocus}
          onPlacesLoaded={handlePlacesLoaded}
        />
      ) : null}
    </div>
  );
}
