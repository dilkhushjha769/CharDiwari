"use client"

import { useEffect, useRef } from "react"
import { projects } from "@/data/projects"
import { matchesFilters, useProjectFilters } from "@/lib/project-filters"

// Decorative city model behind the hero: desktop only, loaded when the browser
// is idle, and a still frame for reduced motion. Its 8 project towers glow
// brick when they match the hero search, mirroring the "Show N projects" count.
// It only reads the filters. If it can't load, the hero is simply without it.

export function HeroSkyline() {
  const containerRef = useRef(null)
  const skylineRef = useRef(null)
  const [filters] = useProjectFilters()
  // A string, so the effect below only runs when the set of matches changes.
  const matchKey = projects.map((project) => (matchesFilters(project, filters) ? 1 : 0)).join(",")
  const matchesRef = useRef(matchKey)

  useEffect(() => {
    matchesRef.current = matchKey
    skylineRef.current?.setMatches(toFlags(matchKey))
  }, [matchKey])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !window.matchMedia("(min-width: 768px)").matches) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let cancelled = false

    async function start() {
      let createSkyline
      try {
        ;({ createSkyline } = await import("./skyline/scene"))
      } catch {
        return // Chunk failed to load (offline, deploy in flight): no skyline.
      }
      if (cancelled) return
      skylineRef.current = createSkyline(container, { reduceMotion, matches: toFlags(matchesRef.current) })
    }

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 2000 })
      : window.setTimeout(start, 500)

    return () => {
      cancelled = true
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
      skylineRef.current?.dispose()
      skylineRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[62%] opacity-0 transition-opacity duration-1000 ease-out-strong data-ready:opacity-100 md:block [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent_20%,black_52%),radial-gradient(ellipse_70%_65%_at_62%_48%,black_35%,transparent_75%)] [&>canvas]:size-full"
    />
  )
}

function toFlags(matchKey) {
  return matchKey.split(",").map((flag) => flag === "1")
}
