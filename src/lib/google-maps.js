// Loads the Google Maps JavaScript API once, on demand (never on page load),
// and hands out its libraries. Equivalent to Google's "dynamic library import"
// bootstrap, written out readably: one async script with loading=async, then
// google.maps.importLibrary(). With no key set, nothing is ever requested.

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Advanced markers need a Map ID; Google's DEMO_MAP_ID works until one is set.
export const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

export const hasMapsKey = Boolean(API_KEY);

let loading = null;

function bootstrap() {
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const callback = '__dwarkeshMapsReady';
      window[callback] = () => {
        delete window[callback];
        resolve();
      };
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
        loading = null;
        reject(new Error('Google Maps could not load.'));
      };
      document.head.append(script);
    });
  }
  return loading;
}

// importMapsLibrary('maps3d') → { Map3DElement, Marker3DElement, MapMode, … }
export async function importMapsLibrary(name) {
  if (!hasMapsKey) throw new Error('No Google Maps API key set.');
  await bootstrap();
  return window.google.maps.importLibrary(name);
}
