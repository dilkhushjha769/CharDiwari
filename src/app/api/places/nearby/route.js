// Server-side proxy for Google Places Nearby Search (Places API v1 — the "New"
// Places API). Keeping the key server-side means it never reaches the browser,
// and lets us apply a tighter referrer restriction on the Google Cloud Console
// (restrict this server key to your domain; the Maps JS key can stay browser-
// restricted).
//
// Cost: $0.032 per Nearby Search request (New API, June 2025 pricing).
// One category per call × up to 6 categories ≈ $0.19 per property page open
// at most. sessionStorage caching means returning tabs cost $0.
//
// Route: GET /api/places/nearby?lat=…&lng=…&type=school&radius=3000
// Returns: { places: [ { id, name, address, types, location, distanceKm } ] }

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Maps our UI category IDs to Google Places "includedTypes" values.
// See: https://developers.google.com/maps/documentation/places/web-service/place-types
const TYPE_MAP = {
  school:    ['school', 'primary_school', 'secondary_school', 'university'],
  hospital:  ['hospital', 'pharmacy', 'doctor'],
  park:      ['park', 'national_park', 'playground'],
  restaurant:['restaurant', 'cafe', 'food_court'],
  transit:   ['transit_station', 'bus_station', 'subway_station', 'train_station', 'light_rail_station'],
  shopping:  ['shopping_mall', 'supermarket', 'convenience_store'],
};

const DEFAULT_RADIUS = 3000; // metres
const MAX_RADIUS     = 10000;
const MAX_RESULTS    = 10;   // per category

// Haversine straight-line distance in km.
function haversineKm(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request) {
  if (!PLACES_KEY) {
    return Response.json({ error: 'Google Places API key not configured.' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const lat    = parseFloat(searchParams.get('lat')    ?? '');
  const lng    = parseFloat(searchParams.get('lng')    ?? '');
  const type   = searchParams.get('type')              ?? '';
  const radius = Math.min(
    parseInt(searchParams.get('radius') ?? String(DEFAULT_RADIUS), 10),
    MAX_RADIUS
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !TYPE_MAP[type]) {
    return Response.json(
      { error: 'Invalid parameters. Provide lat, lng and a valid type.' },
      { status: 400 }
    );
  }

  try {
    // Places API (New) — Nearby Search
    // Docs: https://developers.google.com/maps/documentation/places/web-service/nearby-search
    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type':     'application/json',
        'X-Goog-Api-Key':   PLACES_KEY,
        // Only request the fields we actually display — minimises cost tier.
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.types,places.location,' +
          'places.formattedAddress,places.rating,places.userRatingCount,' +
          'places.regularOpeningHours',
      },
      body: JSON.stringify({
        locationRestriction: {
          circle: { center: { latitude: lat, longitude: lng }, radius },
        },
        includedTypes: TYPE_MAP[type],
        maxResultCount: MAX_RESULTS,
        languageCode: 'en',
        regionCode:   'IN',
      }),
      // Next.js fetch: no caching here — we cache on the response headers side
      // so the CDN / browser handles it.
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[places/nearby] Google API error', res.status, body);
      return Response.json({ error: 'Places API request failed.' }, { status: 502 });
    }

    const data      = await res.json();
    const rawPlaces = data.places ?? [];

    const places = rawPlaces
      .filter((p) => p.location?.latitude != null)
      .map((p) => ({
        id:          p.id,
        name:        p.displayName?.text ?? 'Unnamed place',
        address:     p.formattedAddress  ?? '',
        types:       p.types             ?? [],
        location:    { lat: p.location.latitude, lng: p.location.longitude },
        distanceKm:  Math.round(haversineKm(lat, lng, p.location.latitude, p.location.longitude) * 10) / 10,
        rating:      p.rating            ?? null,
        ratingCount: p.userRatingCount   ?? null,
        isOpen:      p.regularOpeningHours?.openNow ?? null,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // Cache for 4 hours; places don't change frequently.
    return Response.json(
      { places, category: type },
      { headers: { 'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=3600' } }
    );
  } catch (error) {
    console.error('[places/nearby] Unexpected error:', error);
    return Response.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
