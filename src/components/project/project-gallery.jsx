"use client"

import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useSyncExternalStore } from "react"
import { ProjectArt } from "@/components/landing/project-art"
import { cn } from "@/lib/utils"

// Placeholder drawings until real renders arrive: three different elevations,
// so the gallery behaves like it will with photos.
const SLIDES = 3

function useSelected(api) {
  const subscribe = useCallback(
    (onChange) => {
      if (!api) return () => {}
      api.on("select", onChange).on("reInit", onChange)
      return () => api.off("select", onChange).off("reInit", onChange)
    },
    [api]
  )
  return useSyncExternalStore(subscribe, () => (api ? api.selectedScrollSnap() : 0), () => 0)
}

const arrowClass =
  "absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border/70 bg-background/90 backdrop-blur outline-none transition-transform duration-150 ease-out-strong hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] md:grid"

export function ProjectGallery({ project }) {
  const [viewportRef, api] = useEmblaCarousel({ loop: true })
  const selected = useSelected(api)

  return (
    <div role="region" aria-roledescription="carousel" aria-label={`${project.name} pictures`} className="relative">
      <div ref={viewportRef} className="overflow-hidden rounded-2xl border border-border">
        <ul className="flex touch-pan-y">
          {Array.from({ length: SLIDES }, (_, index) => (
            <li
              key={index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${SLIDES}`}
              className="relative aspect-[16/10] min-w-0 shrink-0 basis-full lg:aspect-[2/1]"
            >
              <ProjectArt seed={index === 0 ? project.id : `${project.id}-${index}`} />
            </li>
          ))}
        </ul>
      </div>
      <span className="absolute top-3 left-3 rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
        Illustration · photos coming soon
      </span>
      <span className="absolute right-3 bottom-3 rounded-full bg-background/90 px-2.5 py-1 font-mono text-[11px] tabular-nums backdrop-blur">
        {selected + 1} / {SLIDES}
      </span>
      <button type="button" onClick={() => api?.scrollPrev()} aria-label="Previous picture" className={cn(arrowClass, "left-3")}>
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => api?.scrollNext()} aria-label="Next picture" className={cn(arrowClass, "right-3")}>
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
    </div>
  )
}
