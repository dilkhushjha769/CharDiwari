// The city as plain data: where each block stands, how tall it is, which of the
// 8 project towers it is, and when it rises in the intro. No three.js here.

export const GRID = 9
export const SPACING = 2.6
export const FOOTPRINT = { min: 1.3, max: 2.1 } // always narrower than SPACING
export const RISE_SECONDS = 0.9
export const INTRO_SECONDS = 2.2

// One cell per project in `src/data/projects.js`, in the same order. Spread out
// so the brick accents read as separate homes, not one cluster.
export const TOWER_CELLS = [
  [5, 3],
  [2, 2],
  [3, 5],
  [6, 6],
  [1, 5],
  [4, 1],
  [7, 3],
  [5, 7],
]

const SITE_PLAN_START = 0.05 // footprints draw in first
const RISE_START = 0.35
const RIPPLE_SECONDS = INTRO_SECONDS - RISE_START - RISE_SECONDS

export function seededRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function planCity(seed = 7) {
  const random = seededRandom(seed)
  const half = ((GRID - 1) * SPACING) / 2
  const radius = Math.hypot(half, half)
  const buildings = []

  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      const tower = TOWER_CELLS.findIndex(([tx, tz]) => tx === x && tz === z)
      // Draw every value in the same order, so the city never shifts when the
      // tower cells change.
      const open = random() < 0.22
      const heightRoll = random()
      const width = FOOTPRINT.min + random() * (FOOTPRINT.max - FOOTPRINT.min)
      const depth = FOOTPRINT.min + random() * (FOOTPRINT.max - FOOTPRINT.min)
      if (open && tower === -1) continue // open plots and roads

      const cx = x * SPACING - half
      const cz = z * SPACING - half
      // Ripple outward from the centre of the city.
      const spread = Math.hypot(cx, cz) / radius
      buildings.push({
        x: cx,
        z: cz,
        width,
        depth,
        height: tower === -1 ? 1 + heightRoll ** 2.4 * 12 : 7 + heightRoll * 3.5,
        tower,
        siteDelay: SITE_PLAN_START + spread * 0.3,
        delay: RISE_START + spread * RIPPLE_SECONDS,
      })
    }
  }

  return { buildings, radius }
}
