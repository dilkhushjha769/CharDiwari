// Builds the road routes for the "Nearby places" view on each property page.
//
//   node scripts/nearby-routes.mjs              writes public/routes/<slug>.json
//   node scripts/nearby-routes.mjs --update-km  also sets each place's km in
//                                               src/data/property-details.js to
//                                               the road distance, so the list
//                                               and the map agree
//
// Routes come from the public OSRM server (OpenStreetMap roads, no key). It is
// meant for light use, so this runs by hand when the data changes, one request
// a second, and the site only ever reads the saved files.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { propertyDetails } from '../src/data/property-details.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'routes');
const dataFile = path.join(root, 'src', 'data', 'property-details.js');
const updateKm = process.argv.includes('--update-km');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Douglas–Peucker on [lng, lat] pairs: drops points that sit within `tolerance` degrees
// (about 5 m) of the line, which keeps road shapes and cuts file size several times over.
function simplify(points, tolerance = 0.00005) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const dx = bx - ax;
  const dy = by - ay;
  const length = Math.hypot(dx, dy) || 1;
  let farthest = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const distance = Math.abs(dy * points[i][0] - dx * points[i][1] + bx * ay - by * ax) / length;
    if (distance > farthest) {
      farthest = distance;
      index = i;
    }
  }
  if (farthest <= tolerance) return [points[0], points[points.length - 1]];
  return [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)];
}

const round = ([lng, lat]) => [Number(lng.toFixed(5)), Number(lat.toFixed(5))];

fs.mkdirSync(outDir, { recursive: true });
let data = fs.readFileSync(dataFile, 'utf8');

for (const [slug, detail] of Object.entries(propertyDetails)) {
  const origin = detail.coordinates;
  if (!origin || !detail.nearby?.length) continue;
  const routes = [];
  for (const place of detail.nearby) {
    if (place.lat == null || place.lng == null) continue;
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${place.lng},${place.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url, { headers: { 'User-Agent': 'dwarkesh-nearby-routes/1.0' } });
    const json = await response.json();
    await wait(1000);
    const route = json.routes?.[0];
    if (json.code !== 'Ok' || !route) {
      console.warn(`  ${slug}: no route to ${place.name} (${json.code})`);
      continue;
    }
    const km = Math.round(route.distance / 100) / 10;
    routes.push({ name: place.name, type: place.type, km, coordinates: simplify(route.geometry.coordinates).map(round) });
    console.log(`${slug.padEnd(24)} ${place.name.slice(0, 44).padEnd(44)} ${String(place.km).padStart(5)} → ${String(km).padStart(5)} km`);
    if (updateKm) {
      const escaped = place.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "\\\\'");
      data = data.replace(new RegExp(`(name: '${escaped}', km: )[0-9.]+`), `$1${km}`);
    }
  }
  fs.writeFileSync(path.join(outDir, `${slug}.json`), `${JSON.stringify({ source: 'OSRM, OpenStreetMap contributors', routes })}\n`);
}

if (updateKm) fs.writeFileSync(dataFile, data);
