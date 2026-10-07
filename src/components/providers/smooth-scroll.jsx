"use client"

import { ReactLenis } from "lenis/react"
import { useSyncExternalStore } from "react"

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

function subscribe(onChange) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

// Drawers (vaul) and command lists (cmdk) scroll natively inside themselves.
function preventSmoothing(node) {
  return node.hasAttribute("data-vaul-drawer") || node.hasAttribute("cmdk-list")
}

export function SmoothScroll() {
  // Server snapshot is `true` so Lenis only ever starts in the browser.
  const reducedMotion = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true
  )

  if (reducedMotion) return null

  return (
    <ReactLenis
      root
      options={{ autoRaf: true, lerp: 0.1, anchors: true, prevent: preventSmoothing }}
    />
  )
}
