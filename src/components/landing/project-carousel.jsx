"use client"

import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useSyncExternalStore } from "react"
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

export function ProjectCarousel({ projects }) {
  const [viewportRef, api] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" })
  const { canPrev, canNext } = useCarouselControls(api)

  return (
    <div>
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
