"use client"

import { useSyncExternalStore } from "react"

function subscribe(onChange) {
  window.addEventListener("scroll", onChange, { passive: true })
  return () => window.removeEventListener("scroll", onChange)
}

const getScrolled = () => window.scrollY > 8
const getServerScrolled = () => false

// Transparent over the hero; the border and frosted background fade in once
// the page scrolls, when the bar is needed to keep the links legible. While a
// menu panel is open the bar is solid, so it joins the panel below it.
export function HeaderShell({ children }) {
  const scrolled = useSyncExternalStore(subscribe, getScrolled, getServerScrolled)

  return (
    <header
      data-scrolled={scrolled}
      className="sticky top-0 z-40 border-b border-transparent transition-[background-color,border-color,backdrop-filter] duration-200 ease-out-strong data-[scrolled=true]:border-border/60 data-[scrolled=true]:bg-background/80 data-[scrolled=true]:backdrop-blur-md has-data-popup-open:border-border/60 has-data-popup-open:bg-background"
    >
      {children}
    </header>
  )
}
