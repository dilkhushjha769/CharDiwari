"use client"

import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react"
import { cn } from "@/lib/utils"

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

// Main photo carousel (swipe, arrows) with a thumbnail row below that follows
// it. Each photo is captioned; the thumbnails jump straight to a photo.
export function ProjectGallery({ project, photos, sample = false }) {
  const [viewportRef, api] = useEmblaCarousel({ loop: true })
  const selected = useSelected(api)
  const thumbsRef = useRef(null)

  // Keep the current thumbnail in view inside its own row (never scrolls the page).
  useEffect(() => {
    const row = thumbsRef.current
    const thumb = row?.children[selected]
    if (!row || !thumb) return
    const left = thumb.offsetLeft - row.offsetLeft
    if (left < row.scrollLeft || left + thumb.offsetWidth > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: left - (row.clientWidth - thumb.offsetWidth) / 2, behavior: "smooth" })
    }
  }, [selected])

  return (
    <div>
      <div role="region" aria-roledescription="carousel" aria-label={`${project.name} photos`} className="relative">
        <div ref={viewportRef} className="overflow-hidden rounded-2xl border border-border bg-muted">
          <ul className="flex touch-pan-y">
            {photos.map((photo, index) => (
              <li
                key={photo.caption}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${photos.length}: ${photo.caption}`}
                className="relative aspect-[16/10] min-w-0 shrink-0 basis-full lg:aspect-[2/1]"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  placeholder="blur"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  sizes="(min-width: 1152px) 1152px, calc(100vw - 2rem)"
                  className="object-cover"
                />
                {/* A soft shade so the caption reads on any photo. */}
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-3 left-3 text-sm font-medium text-white">{photo.caption}</span>
              </li>
            ))}
          </ul>
        </div>
        {sample ? (
          <span className="absolute top-3 left-3 rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
            Sample photos · not of this project
          </span>
        ) : null}
        <span className="absolute right-3 bottom-3 rounded-full bg-background/90 px-2.5 py-1 font-mono text-[11px] tabular-nums backdrop-blur">
          {selected + 1} / {photos.length}
        </span>
        <button type="button" onClick={() => api?.scrollPrev()} aria-label="Previous photo" className={cn(arrowClass, "left-3")}>
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => api?.scrollNext()} aria-label="Next photo" className={cn(arrowClass, "right-3")}>
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div ref={thumbsRef} className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {photos.map((photo, index) => (
          <button
            key={photo.caption}
            type="button"
            onClick={() => api?.scrollTo(index)}
            aria-label={`Show photo ${index + 1}: ${photo.caption}`}
            aria-current={index === selected ? "true" : undefined}
            className={cn(
              "relative aspect-[3/2] w-20 shrink-0 overflow-hidden rounded-lg border-2 border-transparent opacity-60 outline-none transition-[transform,opacity] duration-150 ease-out-strong hover:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] sm:w-24",
              index === selected && "border-primary opacity-100"
            )}
          >
            <Image src={photo.src} alt="" fill sizes="96px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
