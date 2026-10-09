"use client"

import useEmblaCarousel from "embla-carousel-react"
import { Pause, Play } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { cn } from "@/lib/utils"
import coupleWithKeys from "@/assets/hero/couple-with-keys.jpg"
import familyHouseFrame from "@/assets/hero/family-house-frame.jpg"

const photos = [
  { src: coupleWithKeys, alt: "A smiling couple holding a model house and the keys to their new home" },
  { src: familyHouseFrame, alt: "A family of four sitting on the floor inside a house-shaped frame" },
]

const AUTOPLAY_MS = 6000

function useSelectedIndex(api) {
  const subscribe = useCallback(
    (onChange) => {
      if (!api) return () => {}
      api.on("select", onChange).on("reInit", onChange)
      return () => api.off("select", onChange).off("reInit", onChange)
    },
    [api]
  )
  return useSyncExternalStore(
    subscribe,
    () => (api ? api.selectedScrollSnap() : 0),
    () => 0
  )
}

// Advances on a timer, but only while someone could see it: not when paused,
// not while focus is on the controls, not in a background tab, and not once
// the hero has scrolled away. Reduced motion never autoplays.
function useAutoplay(api, rootRef, controlsRef, paused) {
  useEffect(() => {
    const root = rootRef.current
    const controls = controlsRef.current
    if (!api || !root || !controls || paused) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let timer = 0
    let focused = false
    let visible = true
    const start = () => {
      window.clearTimeout(timer)
      if (focused || !visible || document.hidden) return
      timer = window.setTimeout(() => {
        if (api.canScrollNext()) api.scrollNext()
        else api.scrollTo(0)
      }, AUTOPLAY_MS)
    }
    const onFocusIn = () => {
      focused = true
      start()
    }
    const onFocusOut = (event) => {
      if (controls.contains(event.relatedTarget)) return
      focused = false
      start()
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      start()
    })

    api.on("select", start)
    controls.addEventListener("focusin", onFocusIn)
    controls.addEventListener("focusout", onFocusOut)
    document.addEventListener("visibilitychange", start)
    observer.observe(root)
    start()

    return () => {
      window.clearTimeout(timer)
      api.off("select", start)
      controls.removeEventListener("focusin", onFocusIn)
      controls.removeEventListener("focusout", onFocusOut)
      document.removeEventListener("visibilitychange", start)
      observer.disconnect()
    }
  }, [api, rootRef, controlsRef, paused])
}

// Photos behind the hero. Phones and tablets: a full-width band at the top
// (--hero-photo tall, set by the hero) that the copy starts in as it fades.
// Desktop: the right of the section, fading out towards the copy. The fade
// (.hero-backdrop-fade) stays put while the slides move under it. Not draggable, so it never
// fights text selection or the search; the pill bottom-right drives it.
export function HeroBackdrop() {
  const [viewportRef, api] = useEmblaCarousel({ loop: true, duration: 35, watchDrag: false })
  const rootRef = useRef(null)
  const controlsRef = useRef(null)
  const [paused, setPaused] = useState(false)
  const selected = useSelectedIndex(api)
  useAutoplay(api, rootRef, controlsRef, paused)

  const show = (index) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    api?.scrollTo(index, reduceMotion)
  }

  return (
    <div ref={rootRef} role="region" aria-roledescription="carousel" aria-label="Homebuyers" className="pointer-events-none absolute inset-0">
      <div
        ref={viewportRef}
        className="hero-backdrop-fade absolute inset-x-0 top-0 -z-10 h-[calc(4rem+var(--hero-photo))] overflow-hidden lg:inset-y-0 lg:left-[40%] lg:h-auto"
      >
        <ul className="flex h-full">
          {photos.map((photo, index) => (
            <li
              key={photo.src.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${photos.length}`}
              className="relative h-full min-w-0 shrink-0 basis-full"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                placeholder="blur"
                loading="eager"
                fetchPriority={index === 0 ? "high" : "auto"}
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto flex w-full max-w-6xl justify-end px-4 pb-3 sm:px-6 md:pb-6">
          <div
            ref={controlsRef}
            className="pointer-events-auto flex items-center rounded-full border border-border/70 bg-background/80 pl-1 backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              className="grid size-11 place-items-center rounded-full text-muted-foreground outline-none transition-[transform,color] duration-150 ease-out-strong hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.92] [&_svg]:size-4"
            >
              <Pause className={cn(paused && "hidden")} aria-hidden="true" />
              <Play className={cn(!paused && "hidden")} aria-hidden="true" />
            </button>
            {photos.map((photo, index) => (
              <button
                key={photo.src.src}
                type="button"
                onClick={() => show(index)}
                aria-label={`Show photo ${index + 1} of ${photos.length}`}
                aria-current={index === selected ? "true" : undefined}
                className="group grid size-11 place-items-center rounded-full outline-none transition-transform duration-150 ease-out-strong focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.92]"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 rounded-full bg-muted-foreground/40 transition-[transform,background-color] duration-300 ease-out-strong group-hover:bg-muted-foreground/70",
                    index === selected && "scale-[1.5] bg-primary group-hover:bg-primary"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
