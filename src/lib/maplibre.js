// MapLibre GL with its stylesheet, in one module so both arrive together in a
// chunk that is only fetched when a visitor opens the neighbourhood viewer
// (import('@/lib/maplibre')). Used when no Google Maps key is set: free
// OpenStreetMap tiles from OpenFreeMap, no key and no billing.
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// "Liberty" is OpenFreeMap's style with 3D building shapes.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Liberty, warmed up: clear blue water, green parks, golden main roads and
// cream buildings that deepen with height. First matching rule wins; layers
// that match nothing keep their own colours.
const LAND = '#f6f2ea';
const PALETTE = [
  [/^background$/, { 'background-color': LAND }],
  [/^water$/, { 'fill-color': '#9fcbea' }],
  [/^waterway_(tunnel|river|other)$/, { 'line-color': '#86bbe0' }],
  [/^(park|landcover_grass|landuse_pitch|landuse_track)$/, { 'fill-color': '#c9e4b4' }],
  [/^landuse_cemetery$/, { 'fill-color': '#d5e3c4' }],
  [/^park_outline$/, { 'line-color': 'rgba(0, 0, 0, 0)' }],
  [/^landcover_wood$/, { 'fill-color': 'rgba(155, 201, 128, 0.55)' }],
  [/^landcover_sand$/, { 'fill-color': '#f5e9c4' }],
  [/^landuse_hospital$/, { 'fill-color': '#fbe0e3' }],
  [/^landuse_school$/, { 'fill-color': '#fcefc7' }],
  [/^aeroway_fill$/, { 'fill-color': '#e8e4f0' }],
  [/_(motorway|motorway_link|link|trunk_primary|secondary_tertiary)_casing$/, { 'line-color': '#e8b26a' }],
  [/_casing$/, { 'line-color': '#ddd5ca' }],
  [/^(road|bridge|tunnel)_(motorway|motorway_link)$/, { 'line-color': '#fcc979' }],
  [/^(road|bridge|tunnel)_(link|trunk_primary|secondary_tertiary)$/, { 'line-color': '#fde7a8' }],
  [/^building$/, { 'fill-color': '#ece2d4' }],
  [
    /^building-3d$/,
    { 'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 0], 0, '#efe6d8', 40, '#e2cfb6', 120, '#d1b593'] },
  ],
  [/^(water_name|waterway_line_label)/, { 'text-color': '#2f6690', 'text-halo-color': 'rgba(255, 255, 255, 0.8)' }],
  [/^(poi_|highway-name|airport|label_other)/, { 'text-color': '#57534e', 'text-halo-color': LAND }],
  [/^label_/, { 'text-color': '#1c1917', 'text-halo-color': LAND }],
];

// Reliable global ESRI World Imagery satellite raster tiles with boundary/place labels
export const SATELLITE_STYLE = {
  version: 8,
  sources: {
    'satellite-tiles': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Esri, Maxar, Earthstar Geographics',
    },
    'satellite-labels': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'satellite-tiles-layer',
      type: 'raster',
      source: 'satellite-tiles',
      minzoom: 0,
      maxzoom: 22,
    },
    {
      id: 'satellite-labels-layer',
      type: 'raster',
      source: 'satellite-labels',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

export const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

export function getSatelliteStyle() {
  return SATELLITE_STYLE;
}

export function getOsmRasterStyle() {
  return OSM_RASTER_STYLE;
}

let cachedStreetStyle = null;

// Fetches the style and recolours it before the map draws anything, so the
// original colours never flash. Falls back to OSM raster style if OpenFreeMap is blocked or down.
export async function loadSiteStyle() {
  if (cachedStreetStyle) return cachedStreetStyle;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(STYLE_URL, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`Map style failed to load (${response.status})`);
    const style = await response.json();
    for (const layer of style.layers) {
      const rule = PALETTE.find(([pattern]) => pattern.test(layer.id));
      if (!rule) continue;
      for (const [property, value] of Object.entries(rule[1])) {
        // Only recolour properties the layer actually paints (a line has no fill-color).
        if (property.split('-')[0] === (layer.type === 'fill-extrusion' ? 'fill' : layer.type === 'symbol' ? 'text' : layer.type)) {
          layer.paint = { ...layer.paint, [property]: value };
        }
      }
    }
    cachedStreetStyle = style;
    return style;
  } catch (err) {
    console.warn('[MapLibre] OpenFreeMap liberty style failed or timed out, using OSM fallback:', err);
    return OSM_RASTER_STYLE;
  }
}

// A circle of `metres` around a point, as a closed ring of [lng, lat].
function circleRing({ lat, lng }, metres, steps = 64) {
  const dLat = metres / 111320;
  const dLng = metres / (111320 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = (i / steps) * 2 * Math.PI;
    return [lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)];
  });
}

const firstSymbolLayer = (map) => map.getStyle().layers.find((layer) => layer.type === 'symbol')?.id;

// An approximate location is a soft circle, not a pin: honest about the
// precision, and the locality name underneath stays readable. Drawn under the
// buildings and labels.
export function showApproximateArea(map, center, metres = 350) {
  map.addSource('approximate-area', {
    type: 'geojson',
    data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [circleRing(center, metres)] } },
  });
  const layers = map.getStyle().layers;
  const below = layers.find((layer) => layer.id === 'building')?.id ?? firstSymbolLayer(map);
  map.addLayer({ id: 'approximate-area-fill', type: 'fill', source: 'approximate-area', paint: { 'fill-color': '#1c1917', 'fill-opacity': 0.07 } }, below);
  map.addLayer(
    {
      id: 'approximate-area-edge',
      type: 'line',
      source: 'approximate-area',
      paint: { 'line-color': '#44403c', 'line-opacity': 0.55, 'line-width': 1.5, 'line-dasharray': [3, 2] },
    },
    below
  );
}

// ── Nearby places: road routes fanning out from the area, like a web ──────

const NEARBY_LAYERS = ['nearby-ring-labels', 'nearby-routes', 'nearby-routes-casing', 'nearby-rings'];
const NEARBY_SOURCES = ['nearby-routes', 'nearby-rings'];
const RING_STEPS_KM = [0.5, 1, 2, 5, 10, 20, 50, 100];

// Distance rings for the web: up to four round distances inside the farthest place.
function ringFeatures(center, farthestKm) {
  const steps = RING_STEPS_KM.filter((km) => km <= farthestKm * 1.05).slice(-4);
  return steps.flatMap((km) => {
    const ring = circleRing(center, km * 1000, 96);
    const label = km < 1 ? `${km * 1000} m` : `${km} km`;
    return [
      { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: ring } },
      // Label at the top of the ring.
      { type: 'Feature', properties: { label }, geometry: { type: 'Point', coordinates: ring[16] } },
    ];
  });
}

export function addNearbyLayers(map, center, routes) {
  const beforeLabels = firstSymbolLayer(map);
  const farthest = Math.max(...routes.map((route) => route.km));
  map.addSource('nearby-rings', { type: 'geojson', data: { type: 'FeatureCollection', features: ringFeatures(center, farthest) } });
  map.addSource('nearby-routes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer(
    {
      id: 'nearby-rings',
      type: 'line',
      source: 'nearby-rings',
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: { 'line-color': '#78716c', 'line-opacity': 0.45, 'line-width': 1, 'line-dasharray': [2, 3] },
    },
    beforeLabels
  );
  map.addLayer(
    {
      id: 'nearby-routes-casing',
      type: 'line',
      source: 'nearby-routes',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.9 },
    },
    beforeLabels
  );
  map.addLayer(
    {
      id: 'nearby-routes',
      type: 'line',
      source: 'nearby-routes',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-opacity': 0.95 },
    },
    beforeLabels
  );
  map.addLayer({
    id: 'nearby-ring-labels',
    type: 'symbol',
    source: 'nearby-rings',
    filter: ['==', ['geometry-type'], 'Point'],
    layout: { 'text-field': ['get', 'label'], 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-anchor': 'bottom', 'text-offset': [0, -0.3] },
    paint: { 'text-color': '#57534e', 'text-halo-color': LAND, 'text-halo-width': 1.5 },
  });
}

export function removeNearbyLayers(map) {
  NEARBY_LAYERS.forEach((id) => map.getLayer(id) && map.removeLayer(id));
  NEARBY_SOURCES.forEach((id) => map.getSource(id) && map.removeSource(id));
}

// Frame the area and every place, flat and north-up so the web reads clearly.
export function fitNearby(map, center, routes, duration) {
  const bounds = new maplibregl.LngLatBounds([center.lng, center.lat], [center.lng, center.lat]);
  routes.forEach((route) => route.coordinates.forEach((point) => bounds.extend(point)));
  map.fitBounds(bounds, { padding: { top: 72, bottom: 48, left: 48, right: 72 }, pitch: 0, bearing: 0, maxZoom: 15, duration });
}

// Folds the compact attribution down to its (i) button, exactly as MapLibre does after a
// visitor's first drag; on a phone-sized map it would otherwise cover the pins.
export function collapseAttribution(map) {
  map.getContainer().querySelector('.maplibregl-ctrl-attrib.maplibregl-compact')?.classList.remove('maplibregl-compact-show');
}

// One place in focus: its route stays bright and thick, the rest step back.
export function highlightNearby(map, id) {
  if (!map.getLayer('nearby-routes')) return;
  const focused = (on, off) => (id == null ? on : ['case', ['==', ['get', 'id'], id], on, off]);
  map.setPaintProperty('nearby-routes', 'line-opacity', focused(0.95, 0.25));
  map.setPaintProperty('nearby-routes', 'line-width', id == null ? 4 : ['case', ['==', ['get', 'id'], id], 6, 3]);
  map.setPaintProperty('nearby-routes-casing', 'line-opacity', focused(0.9, 0.35));
}

// The first `share` (0–1) of a route, measured along the road.
function routeShare({ coordinates, lengths, total }, share) {
  if (share >= 1) return coordinates;
  const target = total * share;
  let i = 1;
  while (i < lengths.length - 1 && lengths[i] < target) i++;
  const [ax, ay] = coordinates[i - 1];
  const [bx, by] = coordinates[i];
  const f = (target - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
  return [...coordinates.slice(0, i), [ax + (bx - ax) * f, ay + (by - ay) * f]];
}

// Draws every route outward from the area, nearest first, a beat apart. Calls
// onArrive(id) as each one reaches its place. Returns a function that stops it.
export function drawNearbyRoutes(map, routes, { animate, delay = 0, onArrive }) {
  const source = map.getSource('nearby-routes');
  const prepared = routes.map((route) => {
    const cos = Math.cos((route.coordinates[0][1] * Math.PI) / 180);
    const lengths = [0];
    for (let i = 1; i < route.coordinates.length; i++) {
      const [ax, ay] = route.coordinates[i - 1];
      const [bx, by] = route.coordinates[i];
      lengths.push(lengths[i - 1] + Math.hypot((bx - ax) * cos, by - ay));
    }
    return { ...route, lengths, total: lengths[lengths.length - 1] };
  });
  const render = (shares) =>
    source.setData({
      type: 'FeatureCollection',
      features: prepared
        .map((route, i) =>
          shares[i] > 0
            ? { type: 'Feature', properties: { id: route.id, color: route.color }, geometry: { type: 'LineString', coordinates: routeShare(route, shares[i]) } }
            : null
        )
        .filter(Boolean),
    });

  if (!animate) {
    render(prepared.map(() => 1));
    prepared.forEach((route) => onArrive(route.id));
    return () => {};
  }

  const STAGGER = 110;
  const DRAW = 900;
  const easeOut = (t) => 1 - (1 - t) ** 3;
  const arrived = new Set();
  let frame = 0;
  const start = performance.now() + delay;
  const tick = (now) => {
    const shares = prepared.map((route, i) => {
      const t = Math.min(Math.max((now - start - i * STAGGER) / DRAW, 0), 1);
      if (t === 1 && !arrived.has(route.id)) {
        arrived.add(route.id);
        onArrive(route.id);
      }
      return easeOut(t);
    });
    render(shares);
    if (arrived.size < prepared.length) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

export default maplibregl;
