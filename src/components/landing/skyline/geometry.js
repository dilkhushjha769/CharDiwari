import { BufferGeometry, Float32BufferAttribute } from "three"

// Three merged buffers for the whole city: solid faces, ink edges and facade
// windows. Each vertex carries its block's intro delay and tower index, so the
// shaders can raise and highlight blocks without touching the geometry again.

const FLOOR = 0.75
const WINDOW = { width: 0.16, height: 0.26, gap: 0.42 }
const WINDOW_LIFT = 0.02 // off the face, so it never z-fights

function createBuffers() {
  return { position: [], normal: [], aDelay: [], aSiteDelay: [], aTower: [], aSeed: [] }
}

function pushVertex(buffers, building, position, normal, seed = 0) {
  buffers.position.push(...position)
  if (normal) buffers.normal.push(...normal)
  buffers.aDelay.push(building.delay)
  buffers.aSiteDelay.push(building.siteDelay)
  buffers.aTower.push(building.tower)
  buffers.aSeed.push(seed)
}

// Two triangles from four corners, in counter-clockwise order.
function pushQuad(buffers, building, [a, b, c, d], normal, seed) {
  for (const corner of [a, b, c, a, c, d]) pushVertex(buffers, building, corner, normal, seed)
}

function bounds({ x, z, width, depth }) {
  return { x0: x - width / 2, x1: x + width / 2, z0: z - depth / 2, z1: z + depth / 2 }
}

// The four walls, each as a start corner, a direction along the wall and an outward normal.
function walls(building) {
  const { x0, x1, z0, z1 } = bounds(building)
  return [
    { start: [x0, z1], along: [1, 0], length: building.width, normal: [0, 0, 1] },
    { start: [x1, z1], along: [0, -1], length: building.depth, normal: [1, 0, 0] },
    { start: [x1, z0], along: [-1, 0], length: building.width, normal: [0, 0, -1] },
    { start: [x0, z0], along: [0, 1], length: building.depth, normal: [-1, 0, 0] },
  ]
}

function pushFaces(buffers, building) {
  const { height: h } = building
  for (const { start, along, length, normal } of walls(building)) {
    const [sx, sz] = start
    const ex = sx + along[0] * length
    const ez = sz + along[1] * length
    pushQuad(buffers, building, [[sx, 0, sz], [ex, 0, ez], [ex, h, ez], [sx, h, sz]], normal)
  }
  const { x0, x1, z0, z1 } = bounds(building)
  pushQuad(buffers, building, [[x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0]], [0, 1, 0])
}

function pushEdges(buffers, building) {
  const { x0, x1, z0, z1 } = bounds(building)
  const h = building.height
  const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]
  for (let i = 0; i < 4; i++) {
    const [ax, az] = corners[i]
    const [bx, bz] = corners[(i + 1) % 4]
    for (const point of [[ax, 0, az], [bx, 0, bz], [ax, h, az], [bx, h, bz], [ax, 0, az], [ax, h, az]]) {
      pushVertex(buffers, building, point)
    }
  }
}

function pushWindows(buffers, building, random) {
  const floors = Math.floor((building.height - 0.35) / FLOOR)
  for (const { start, along, length, normal } of walls(building)) {
    const columns = Math.floor((length - 0.3) / WINDOW.gap)
    if (columns < 1) continue
    const margin = (length - (columns - 1) * WINDOW.gap) / 2
    for (let floor = 0; floor < floors; floor++) {
      const y0 = floor * FLOOR + 0.3
      const y1 = y0 + WINDOW.height
      for (let column = 0; column < columns; column++) {
        const t = margin + column * WINDOW.gap
        const cx = start[0] + along[0] * t + normal[0] * WINDOW_LIFT
        const cz = start[1] + along[1] * t + normal[2] * WINDOW_LIFT
        const dx = (along[0] * WINDOW.width) / 2
        const dz = (along[1] * WINDOW.width) / 2
        pushQuad(
          buffers,
          building,
          [[cx - dx, y0, cz - dz], [cx + dx, y0, cz + dz], [cx + dx, y1, cz + dz], [cx - dx, y1, cz - dz]],
          null,
          random()
        )
      }
    }
  }
}

// A building's ground shadow for any sun direction: the footprint, the
// footprint moved along the shadow (aLift = 1), and each base edge swept
// between the two. The shader decides how far "lifted" corners move.
function pushShadow(shadow, building) {
  const { x0, x1, z0, z1 } = bounds(building)
  const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]
  const vertex = ([x, z], lift) => {
    shadow.position.push(x, 0, z)
    shadow.aLift.push(lift)
    shadow.aHeight.push(building.height)
    shadow.aDelay.push(building.delay)
  }
  const quad = (a, b, c, d) => [a, b, c, a, c, d].forEach(([corner, lift]) => vertex(corner, lift))
  const [a, b, c, d] = corners
  quad([a, 0], [b, 0], [c, 0], [d, 0])
  quad([a, 1], [b, 1], [c, 1], [d, 1])
  for (let i = 0; i < 4; i++) {
    const from = corners[i]
    const to = corners[(i + 1) % 4]
    quad([from, 0], [to, 0], [to, 1], [from, 1])
  }
}

function toGeometry(buffers, attributes) {
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new Float32BufferAttribute(buffers.position, 3))
  for (const name of attributes) {
    geometry.setAttribute(name, new Float32BufferAttribute(buffers[name], name === "normal" ? 3 : 1))
  }
  return geometry
}

export function buildGeometry(plan, random) {
  const faces = createBuffers()
  const edges = createBuffers()
  const windows = createBuffers()
  const shadow = { position: [], aLift: [], aHeight: [], aDelay: [] }
  for (const building of plan.buildings) {
    pushFaces(faces, building)
    pushEdges(edges, building)
    pushWindows(windows, building, random)
    pushShadow(shadow, building)
  }
  return {
    faces: toGeometry(faces, ["normal", "aDelay", "aTower"]),
    edges: toGeometry(edges, ["aDelay", "aSiteDelay", "aTower"]),
    windows: toGeometry(windows, ["aDelay", "aTower", "aSeed"]),
    shadows: toGeometry(shadow, ["aLift", "aHeight", "aDelay"]),
  }
}
