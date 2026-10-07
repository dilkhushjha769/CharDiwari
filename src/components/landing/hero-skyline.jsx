"use client"

import { useEffect, useRef } from "react"
import { readThemeColor, watchTheme } from "./skyline-colors"

// Decorative wireframe skyline behind the hero. Desktop only, loaded when the
// browser is idle, paused off-screen, and a still frame for reduced motion.

const GRID = 9
const SPACING = 2.6
const ORBIT_SPEED = 0.035 // radians per second
const HIGHLIGHT = { x: 5, z: 3 } // the "your home" tower

function seededRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Line segments for the 12 edges of a box, appended to `out`.
function pushBoxEdges(out, cx, cz, width, depth, height) {
  const x0 = cx - width / 2, x1 = cx + width / 2
  const z0 = cz - depth / 2, z1 = cz + depth / 2
  const corners = [
    [x0, z0], [x1, z0], [x1, z1], [x0, z1],
  ]
  for (let i = 0; i < 4; i++) {
    const [ax, az] = corners[i]
    const [bx, bz] = corners[(i + 1) % 4]
    out.push(ax, 0, az, bx, 0, bz) // base
    out.push(ax, height, az, bx, height, bz) // roof
    out.push(ax, 0, az, ax, height, az) // vertical edge
  }
}

function buildCity(THREE) {
  const random = seededRandom(7)
  const city = []
  const home = []
  const half = ((GRID - 1) * SPACING) / 2

  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      const isHome = x === HIGHLIGHT.x && z === HIGHLIGHT.z
      if (!isHome && random() < 0.22) continue // open plots and roads
      const height = isHome ? 9 : 1 + random() ** 2.4 * 12
      const width = 1.3 + random() * 0.8
      const depth = 1.3 + random() * 0.8
      pushBoxEdges(isHome ? home : city, x * SPACING - half, z * SPACING - half, width, depth, height)
    }
  }

  const toGeometry = (positions) => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    return geometry
  }
  return { city: toGeometry(city), home: toGeometry(home) }
}

export function HeroSkyline() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !window.matchMedia("(min-width: 768px)").matches) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let cleanup = () => {}
    let cancelled = false

    async function start() {
      const THREE = await import("three")
      if (cancelled) return

      let renderer
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" })
      } catch {
        return // No WebGL: the hero simply has no skyline.
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      container.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200)
      const { city, home } = buildCity(THREE)
      const cityMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.16 })
      const homeMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.7 })
      scene.add(new THREE.LineSegments(city, cityMaterial))
      scene.add(new THREE.LineSegments(home, homeMaterial))

      const pointer = { x: 0, y: 0 }
      const view = { x: 0, y: 0 }
      let angle = 0.6
      let last = performance.now()
      let frame = 0
      let visible = true

      function resize() {
        const { width, height } = container.getBoundingClientRect()
        if (!width || !height) return
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }

      function render(now) {
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now
        if (!reduceMotion) {
          angle += dt * ORBIT_SPEED
          // Ease toward the pointer so the drift feels like it has weight.
          const follow = 1 - Math.exp(-dt * 2.5)
          view.x += (pointer.x - view.x) * follow
          view.y += (pointer.y - view.y) * follow
          homeMaterial.opacity = 0.5 + Math.sin(now / 1400) * 0.2
        }
        const orbit = angle + view.x * 0.18
        camera.position.set(Math.sin(orbit) * 36, 17 + view.y * 2, Math.cos(orbit) * 36)
        camera.lookAt(0, 3.5, 0)
        renderer.render(scene, camera)
      }

      function loop(now) {
        render(now)
        frame = visible && !reduceMotion ? requestAnimationFrame(loop) : 0
      }

      function setVisible(next) {
        visible = next
        if (visible && !frame && !reduceMotion) {
          last = performance.now()
          frame = requestAnimationFrame(loop)
        }
      }

      function onPointerMove(event) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1
        pointer.y = (event.clientY / window.innerHeight) * 2 - 1
      }

      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(container)
      const intersectionObserver = new IntersectionObserver(([entry]) =>
        setVisible(entry.isIntersecting && !document.hidden)
      )
      intersectionObserver.observe(container)
      const onVisibilityChange = () => setVisible(!document.hidden)
      document.addEventListener("visibilitychange", onVisibilityChange)
      if (!reduceMotion) window.addEventListener("pointermove", onPointerMove, { passive: true })

      // Ink lines and a brick "home" tower, taken from the theme tokens.
      function applyThemeColors() {
        const ink = readThemeColor("--foreground")
        const brick = readThemeColor("--primary")
        cityMaterial.color.setHex(ink)
        homeMaterial.color.setHex(brick)
        container.dataset.palette = `${ink.toString(16)}/${brick.toString(16)}`
        if (!frame) render(performance.now()) // the loop is paused: show the change now
      }
      const stopWatchingTheme = watchTheme(applyThemeColors)

      resize()
      applyThemeColors()
      container.dataset.ready = "true"
      if (!reduceMotion) frame = requestAnimationFrame(loop)

      cleanup = () => {
        stopWatchingTheme()
        cancelAnimationFrame(frame)
        resizeObserver.disconnect()
        intersectionObserver.disconnect()
        document.removeEventListener("visibilitychange", onVisibilityChange)
        window.removeEventListener("pointermove", onPointerMove)
        city.dispose()
        home.dispose()
        cityMaterial.dispose()
        homeMaterial.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    }

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 2000 })
      : window.setTimeout(start, 500)

    return () => {
      cancelled = true
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
      cleanup()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[62%] opacity-0 transition-opacity duration-1000 ease-out-strong data-ready:opacity-100 md:block [mask-image:radial-gradient(ellipse_70%_65%_at_62%_48%,black_35%,transparent_75%)] [&>canvas]:size-full"
    />
  )
}
