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

// Fetches the style and recolours it before the map draws anything, so the
// original colours never flash.
export async function loadSiteStyle() {
  const response = await fetch(STYLE_URL);
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
  return style;
}

// An approximate location is a soft circle, not a pin: honest about the
// precision, and the locality name underneath stays readable. Drawn under the
// buildings and labels.
export function showApproximateArea(map, { lat, lng }, metres = 350) {
  const steps = 64;
  const dLat = metres / 111320;
  const dLng = metres / (111320 * Math.cos((lat * Math.PI) / 180));
  const ring = Array.from({ length: steps + 1 }, (_, i) => {
    const angle = (i / steps) * 2 * Math.PI;
    return [lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)];
  });
  map.addSource('approximate-area', {
    type: 'geojson',
    data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } },
  });
  const layers = map.getStyle().layers;
  const below = (layers.find((layer) => layer.id === 'building') ?? layers.find((layer) => layer.type === 'symbol'))?.id;
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

export default maplibregl;
