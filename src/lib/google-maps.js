// Loads the Google Maps JavaScript API once, on demand (never on page load),
// and hands out its libraries. Equivalent to Google's "dynamic library import"
// bootstrap, written out readably: one async script with loading=async, then
// google.maps.importLibrary(). With no key set, nothing is ever requested.

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCdmEoOmIcuMfwe7EP0Xi3KEBHHqAIQyFs';

// Advanced markers need a Map ID; Google's DEMO_MAP_ID works until one is set.
export const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

export const hasMapsKey = Boolean(API_KEY);

let googleMapsFailed = false;
const failureCallbacks = new Set();

export function isGoogleMapsFailed() {
  return googleMapsFailed;
}

export function markGoogleMapsFailed() {
  if (googleMapsFailed) return;
  googleMapsFailed = true;
  failureCallbacks.forEach((cb) => {
    try {
      cb();
    } catch {}
  });
}

export function onGoogleMapsFailure(cb) {
  if (googleMapsFailed) {
    try {
      cb();
    } catch {}
    return () => {};
  }
  failureCallbacks.add(cb);
  return () => failureCallbacks.delete(cb);
}

// Intercept Google Maps auth failure (RefererNotAllowedMapError, ApiNotActivatedMapError, etc.)
if (typeof window !== 'undefined') {
  const prevAuth = window.gm_authFailure;
  window.gm_authFailure = () => {
    console.warn('[Google Maps] gm_authFailure detected (referrer restrictions, quota, or billing). Auto-fallback activated.');
    markGoogleMapsFailed();
    if (typeof prevAuth === 'function') {
      try {
        prevAuth();
      } catch {}
    }
  };
}

let loading = null;

function bootstrap() {
  if (googleMapsFailed) return Promise.reject(new Error('Google Maps unavailable.'));
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const callback = '__dwarkeshMapsReady';
      let timeoutId = null;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        delete window[callback];
      };

      window[callback] = () => {
        cleanup();
        resolve();
      };

      timeoutId = setTimeout(() => {
        cleanup();
        loading = null;
        markGoogleMapsFailed();
        reject(new Error('Google Maps script load timed out.'));
      }, 7000);

      const params = new URLSearchParams({
        key: API_KEY,
        v: 'weekly',
        language: 'en',
        region: 'IN',
        loading: 'async',
        callback,
      });
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      script.async = true;
      script.onerror = () => {
        cleanup();
        loading = null;
        markGoogleMapsFailed();
        reject(new Error('Google Maps script failed to load.'));
      };
      document.head.append(script);
    });
  }
  return loading;
}

// importMapsLibrary('maps3d') → { Map3DElement, Marker3DElement, MapMode, … }
export async function importMapsLibrary(name) {
  if (googleMapsFailed) throw new Error('Google Maps is unavailable.');
  if (!hasMapsKey) throw new Error('No Google Maps API key set.');
  try {
    await bootstrap();
    if (!window.google?.maps?.importLibrary) {
      throw new Error('Google Maps importLibrary method unavailable.');
    }
    return await window.google.maps.importLibrary(name);
  } catch (err) {
    markGoogleMapsFailed();
    throw err;
  }
}
