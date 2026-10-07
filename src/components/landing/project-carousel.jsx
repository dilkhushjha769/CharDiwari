"use client"

import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { ProjectCard } from "./project-card"

const NO_SCROLL = "false|false"

function useCarouselControls(api) {
  const subscribe = useCallback(
    (onChange) => {
      if (!api) return () => {}
      api.on("select", onChange).on("reInit", onChange)
      return () => api.off("select", onChange).off("reInit", onChange)
    },
    [api]
  )
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (api ? `${api.canScrollPrev()}|${api.canScrollNext()}` : NO_SCROLL),
    () => NO_SCROLL
  )
  const [canPrev, canNext] = snapshot.split("|").map((flag) => flag === "true")
  return { canPrev, canNext }
}

const FADE_MS = 200

// When the matching set changes: back to the first slide, and a short
// opacity + blur fade on the new cards. The height is held for the length of
// the fade so nothing below the carousel jumps. (Not AutoAnimate: embla owns
// these slides' positions.)
function useMatchTransition(api, frameRef, matchKey) {
  const lastHeight = useRef(0)
  const previousKey = useRef(matchKey)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const observer = new ResizeObserver(() => {
      if (!frame.style.minHeight) lastHeight.current = frame.offsetHeight
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [frameRef])

  // Before paint, so the held height and the reset show in the same frame.
  useLayoutEffect(() => {
    if (previousKey.current === matchKey) return
    previousKey.current = matchKey
    // Embla re-measures the new slides on a microtask; reset again after that.
    api?.scrollTo(0, true)
    const reset = requestAnimationFrame(() => api?.scrollTo(0, true))
    const frame = frameRef.current
    if (!frame || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => cancelAnimationFrame(reset)
    frame.style.minHeight = `${lastHeight.current}px`
    const fade = frame.animate(
      [
        { opacity: 0, filter: "blur(2px)" },
        { opacity: 1, filter: "blur(0px)" },
      ],
      { duration: FADE_MS, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
    )
    const release = () => {
      frame.style.minHeight = ""
      lastHeight.current = frame.offsetHeight
    }
    fade.onfinish = release
    fade.oncancel = release
    return () => {
      cancelAnimationFrame(reset)
      // The cancel event fires asynchronously; detach first so it can't unlock
      // the next transition's height, and release this one right away.
      fade.onfinish = null
      fade.oncancel = null
      fade.cancel()
      frame.style.minHeight = ""
    }
  }, [api, frameRef, matchKey])
}

export function ProjectCarousel({ projects }) {
  const [viewportRef, api] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" })
  const { canPrev, canNext } = useCarouselControls(api)
  const frameRef = useRef(null)
  useMatchTransition(api, frameRef, projects.map((project) => project.id).join(","))

  return (
    <div ref={frameRef}>
      <div ref={viewportRef} className="overflow-hidden" role="region" aria-roledescription="carousel" aria-label="Projects">
        <ul className="-ml-4 flex touch-pan-y">
          {projects.map((project, index) => (
            <li key={project.id} className="min-w-0 shrink-0 basis-[86%] pl-4 sm:basis-1/2 lg:basis-1/3">
              <ProjectCard project={project} sheet={index + 1} />
            </li>
          ))}
        </ul>
      </div>
      {(canPrev || canNext) && (
        <div className="mt-6 hidden justify-end gap-2 sm:flex">
          <Button variant="outline" size="icon-lg" className="rounded-full" onClick={() => api?.scrollPrev()} disabled={!canPrev} aria-label="Previous projects">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon-lg" className="rounded-full" onClick={() => api?.scrollNext()} disabled={!canNext} aria-label="Next projects">
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  )
}
