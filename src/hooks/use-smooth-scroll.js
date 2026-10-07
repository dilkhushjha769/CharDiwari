"use client"

import { useLenis } from "lenis/react"
import { useCallback, useEffect } from "react"

// The sticky header gap comes from `scroll-padding-top` on <html> (globals.css).
// Lenis and native scrolling both honour it, so no offset is needed here.
export function useScrollToSection() {
  const lenis = useLenis()

  return useCallback(
    (id) => {
      const target = document.getElementById(id)
      if (!target) return
      if (lenis) {
        lenis.scrollTo(target)
      } else {
        // Lenis is off when the visitor prefers reduced motion.
        target.scrollIntoView({ block: "start" })
      }
    },
    [lenis]
  )
}

// Pause smooth scrolling while a drawer or dialog owns the scroll.
export function usePauseSmoothScroll(paused) {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis || !paused) return
    lenis.stop()
    return () => lenis.start()
  }, [lenis, paused])
}
