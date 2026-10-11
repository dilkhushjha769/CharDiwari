// MapLibre GL with its stylesheet, in one module so both arrive together in a
// chunk that is only fetched when a visitor opens the neighbourhood viewer
// (import('@/lib/maplibre')). Used when no Google Maps key is set: free
// OpenStreetMap tiles from OpenFreeMap, no key and no billing.
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// "Liberty" is OpenFreeMap's style with 3D building shapes.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Liberty's bright blues and oranges, recoloured to the site's stone palette.
// First matching rule wins; layers that match nothing keep their colours.
const LAND = '#f3f1ee';
const PALETTE = [
  [/^background$/, { 'background-color': LAND }],
  [/^water$/, { 'fill-color': '#cdd9e0' }],
  [/^waterway_(tunnel|river|other)$/, { 'line-color': '#b9c9d2' }],
  [/^(park|landcover_grass|landuse_pitch|landuse_track|landuse_cemetery)$/, { 'fill-color': '#dfe5d6' }],
  [/^park_outline$/, { 'line-color': 'rgba(0, 0, 0, 0)' }],
  [/^landcover_wood$/, { 'fill-color': 'rgba(206, 217, 196, 0.6)' }],
  [/^landuse_(hospital|school)$/, { 'fill-color': '#ece8e3' }],
  [/^aeroway_fill$/, { 'fill-color': '#e9e6e1' }],
  [/_casing$/, { 'line-color': '#d9d4ce' }],
  [/^(road|bridge|tunnel)_(motorway|motorway_link|link|trunk_primary|secondary_tertiary)$/, { 'line-color': '#ffffff' }],
  [/^building$/, { 'fill-color': '#e7e3de' }],
  [/^building-3d$/, { 'fill-extrusion-color': '#e9e5e0' }],
  [/^(water_name|waterway_line_label)/, { 'text-color': '#5f7481', 'text-halo-color': 'rgba(255, 255, 255, 0.8)' }],
  [/^(poi_|highway-name|airport|label_other)/, { 'text-color': '#57534e', 'text-halo-color': LAND }],
  [/^label_/, { 'text-color': '#292524', 'text-halo-color': LAND }],
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
