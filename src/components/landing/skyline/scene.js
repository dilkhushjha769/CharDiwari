import { LineSegments, Mesh, MeshBasicMaterial, PerspectiveCamera, RingGeometry, Scene, WebGLRenderer } from "three"
import { readThemeColor, watchTheme } from "../skyline-colors"
import { buildGeometry } from "./geometry"
import { createMaterials, createUniforms } from "./materials"
import { INTRO_SECONDS, planCity, seededRandom } from "./plan"

// The hero's living city model. Progressive enhancement: every failure (no
// WebGL2, a shader error, a lost context, any throw) tears down quietly and
// returns null or removes the canvas, leaving the hero exactly as it is without it.

const ORBIT_SPEED = 0.035 // radians per second
const ORBIT_RADIUS = 46
const CAMERA_HEIGHT = 23
const VIEW_SHIFT = 1.25 // pushes the city right, away from the headline
const PING_SECONDS = 2.4
const PING_OPACITY = 0.35
const HIGHLIGHT_EASE = 0.1 // seconds; a change settles in about 400ms

export function createSkyline(container, { reduceMotion, matches }) {
  const canvas = document.createElement("canvas")
  // Ask for the context ourselves: three logs an error before throwing when it can't get one.
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" })
  if (!gl) return null

  const teardown = []
  let renderer = null
  let frame = 0
  let disposed = false

  function dispose() {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(frame)
    frame = 0
    for (const release of teardown.splice(0).reverse()) release()
    renderer?.dispose()
    canvas.remove()
    delete container.dataset.ready
  }

  try {
    let shaderFailed = false
    renderer = new WebGLRenderer({ canvas, context: gl, antialias: true, alpha: true })
    renderer.debug.onShaderError = () => {
      shaderFailed = true // replaces three's console.error; we just bow out
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

    const plan = planCity()
    const towers = []
    for (const building of plan.buildings) {
      if (building.tower !== -1) towers[building.tower] = building
    }

    const scene = new Scene()
    const camera = new PerspectiveCamera(32, 1, 0.1, 200)
    const uniforms = createUniforms()
    const materials = createMaterials(uniforms)
    const geometry = buildGeometry(plan, seededRandom(11))
    const ping = new Mesh(
      new RingGeometry(0.94, 1, 64).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    )
    teardown.push(() => {
      for (const part of [...Object.values(geometry), ...Object.values(materials), ping.geometry, ping.material]) part.dispose()
    })

    const facesMesh = new Mesh(geometry.faces, materials.faces)
    const windowsMesh = new Mesh(geometry.windows, materials.windows)
    const edgesLines = new LineSegments(geometry.edges, materials.edges)
    windowsMesh.renderOrder = 1
    edgesLines.renderOrder = 2
    ping.renderOrder = 3
    ping.position.y = 0.02
    ping.visible = false
    // The geometry is static: skip bounds checks and matrix updates every frame.
    for (const object of [facesMesh, windowsMesh, edgesLines, ping]) {
      object.frustumCulled = false
      object.matrixAutoUpdate = false
      object.updateMatrix()
    }
    scene.add(facesMesh, windowsMesh, edgesLines, ping)

    // ---- Search link: towers that match the filters glow brick ----
    const highlight = uniforms.uHighlight.value
    const target = new Array(8).fill(1)
    let matching = []
    let pingSlot = -1
    let pingTower = -1

    function setMatches(flags) {
      if (disposed) return
      for (let i = 0; i < target.length; i++) target[i] = flags?.[i] ? 1 : 0
      matching = target.flatMap((on, i) => (on ? [i] : []))
      container.dataset.highlight = target.join(",")
      if (!frame) {
        highlight.splice(0, highlight.length, ...target) // nothing animating: show it now
        render(performance.now())
      }
    }

    // ---- Camera and loop ----
    const pointer = { x: 0, y: 0 }
    const view = { x: 0, y: 0, scroll: 0 }
    const introStart = performance.now()
    let angle = 0.6
    let last = introStart
    let visible = true
    let heroHeight = 1

    function resize() {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      heroHeight = container.parentElement?.offsetHeight || height
      renderer.setSize(width, height, false)
      camera.aspect = (width * VIEW_SHIFT) / height
      camera.setViewOffset(width * VIEW_SHIFT, height, 0, 0, width, height)
    }

    function updatePing(seconds) {
      const since = seconds - INTRO_SECONDS
      if (reduceMotion || since < 0 || !matching.length) {
        ping.visible = false
        return
      }
      const slot = Math.floor(since / PING_SECONDS)
      if (slot !== pingSlot) {
        pingSlot = slot
        pingTower = matching[slot % matching.length]
      }
      // A tower that stopped matching mid-ring waits for the next slot.
      if (!target[pingTower]) {
        ping.visible = false
        return
      }
      const phase = (since % PING_SECONDS) / PING_SECONDS
      const tower = towers[pingTower]
      const start = Math.max(tower.width, tower.depth) * 0.75
      const scale = start + phase * 2.6
      ping.position.x = tower.x
      ping.position.z = tower.z
      ping.scale.set(scale, 1, scale)
      ping.updateMatrix()
      ping.material.opacity = PING_OPACITY * Math.min(phase / 0.1, 1) * (1 - phase) ** 2
      ping.visible = true
    }

    function render(now) {
      if (disposed) return
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const seconds = (now - introStart) / 1000
      if (!reduceMotion) {
        angle += dt * ORBIT_SPEED
        // Ease toward the pointer and the scroll position so the drift has weight.
        const follow = 1 - Math.exp(-dt * 2.5)
        view.x += (pointer.x - view.x) * follow
        view.y += (pointer.y - view.y) * follow
        const scrolled = Math.min(Math.max(window.scrollY / heroHeight, 0), 1)
        view.scroll += (scrolled - view.scroll) * follow
        const settle = 1 - Math.exp(-dt / HIGHLIGHT_EASE)
        for (let i = 0; i < highlight.length; i++) highlight[i] += (target[i] - highlight[i]) * settle
      }
      uniforms.uIntro.value = reduceMotion ? INTRO_SECONDS + 1 : seconds
      uniforms.uTime.value = reduceMotion ? 0 : seconds
      updatePing(seconds)

      const orbit = angle + view.x * 0.18
      camera.position.set(
        Math.sin(orbit) * ORBIT_RADIUS,
        CAMERA_HEIGHT + view.y * 2 + view.scroll * 6,
        Math.cos(orbit) * ORBIT_RADIUS
      )
      camera.lookAt(0, 2.5 - view.scroll * 2, 0)
      renderer.render(scene, camera)
      if (shaderFailed) dispose()
    }

    function loop(now) {
      frame = 0
      render(now)
      if (!disposed && visible && !reduceMotion) frame = requestAnimationFrame(loop)
    }

    function setVisible(next) {
      visible = next
      if (visible && !frame && !reduceMotion && !disposed) {
        last = performance.now()
        frame = requestAnimationFrame(loop)
      }
    }

    function onPointerMove(event) {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1
    }

    // ---- Theme: a pen drawing on the paper by day, a charcoal and chalk model by night ----
    function applyTheme() {
      const dark = document.documentElement.classList.contains("dark")
      const ink = readThemeColor("--foreground")
      const brick = readThemeColor("--primary")
      uniforms.uBase.value.setHex(readThemeColor("--card"))
      uniforms.uInk.value.setHex(ink)
      uniforms.uBrick.value.setHex(brick)
      uniforms.uWindow.value.setHex(readThemeColor("--window"))
      uniforms.uFog.value.setHex(readThemeColor("--background"))
      uniforms.uShadow.value.setHex(dark ? 0x000000 : ink)
      uniforms.uSideShade.value = dark ? 0.28 : 0.1
      uniforms.uRoofLift.value = dark ? 0.05 : 0
      uniforms.uBrickTint.value = dark ? 0.018 : 0.05
      uniforms.uInkMode.value = dark ? 0 : 1
      uniforms.uEdgeAlpha.value = dark ? 0.26 : 0.55
      uniforms.uUnlitAlpha.value = dark ? 0.05 : 0.1
      uniforms.uLitShare.value = dark ? 0.14 : 0 // no lit windows in the drawing
      ping.material.color.setHex(brick)
      container.dataset.palette = `${ink.toString(16)}/${brick.toString(16)}`
      if (!frame) render(performance.now()) // the loop is paused: show the change now
    }

    const onContextLost = () => dispose()
    canvas.addEventListener("webglcontextlost", onContextLost)
    teardown.push(() => canvas.removeEventListener("webglcontextlost", onContextLost))

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    teardown.push(() => resizeObserver.disconnect())
    const intersectionObserver = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && !document.hidden))
    intersectionObserver.observe(container)
    teardown.push(() => intersectionObserver.disconnect())
    const onVisibilityChange = () => setVisible(!document.hidden)
    document.addEventListener("visibilitychange", onVisibilityChange)
    teardown.push(() => document.removeEventListener("visibilitychange", onVisibilityChange))
    if (!reduceMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true })
      teardown.push(() => window.removeEventListener("pointermove", onPointerMove))
    }
    teardown.push(watchTheme(applyTheme))

    // First frame off-screen, so a broken shader never shows.
    resize()
    setMatches(matches)
    applyTheme()
    if (shaderFailed || disposed) {
      dispose()
      return null
    }

    container.appendChild(canvas)
    container.dataset.ready = "true"
    if (!reduceMotion) frame = requestAnimationFrame(loop)

    return { setMatches, dispose }
  } catch {
    dispose()
    return null
  }
}
