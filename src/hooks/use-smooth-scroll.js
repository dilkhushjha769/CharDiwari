"use client"

import { useLenis } from "lenis/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect } from "react"

// The sticky header gap comes from `scroll-padding-top` on <html> (globals.css).
// Lenis and native scrolling both honour it, so no offset is needed here.
// Off the home page (a project page), the section lives on the home page: go
// there, carrying the query (filters, calculator tab) set just before.
export function useScrollToSection() {
  const lenis = useLenis()
  const router = useRouter()

  return useCallback(
    (id) => {
      const target = document.getElementById(id)
      if (!target) {
        if (window.location.pathname !== "/") router.push(`/${window.location.search}#${id}`)
        return
      }
      if (lenis) {
        lenis.scrollTo(target)
      } else {
        // Lenis is off when the visitor prefers reduced motion.
        target.scrollIntoView({ block: "start" })
      }
    },
    [lenis, router]
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
