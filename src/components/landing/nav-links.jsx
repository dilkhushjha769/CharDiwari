"use client"

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

const SLIDE = { type: "spring", duration: 0.35, bounce: 0 }
const HOVER_SLIDE = { type: "spring", duration: 0.3, bounce: 0 }
const INSTANT = { duration: 0 }

// Desktop nav. A brick underline marks the section in view (scroll-spy), and a
// soft pill follows the mouse between links. The pill is mouse-only: touch and
// keyboard focus never show it, so focus keeps its own ring.
export function NavLinks({ links }) {
  const [active, setActive] = useState(null)
  const [hovered, setHovered] = useState(null)
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)")
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const sections = links.map((link) => document.getElementById(link.href.slice(1))).filter(Boolean)
    const inBand = new Map()
    // The band is a thin strip just above the middle of the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) inBand.set(entry.target.id, entry.isIntersecting)
        const current = sections.find((section) => inBand.get(section.id))
        setActive(current ? `#${current.id}` : null)
      },
      { rootMargin: "-45% 0px -50% 0px" }
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [links])

  return (
    <nav aria-label="Main" className="hidden md:block" onPointerLeave={() => setHovered(null)}>
      <LayoutGroup id="nav">
        <ul className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = active === link.href
            return (
              <li key={link.href} className="relative">
                <a
                  href={link.href}
                  aria-current={isActive ? "location" : undefined}
                  onPointerEnter={(event) => {
                    if (finePointer && event.pointerType === "mouse") setHovered(link.href)
                  }}
                  className="relative z-10 block rounded-full px-3 py-2 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=location]:text-foreground"
                >
                  {link.label}
                </a>
                <AnimatePresence>
                  {hovered === link.href && (
                    <motion.span
                      layoutId="nav-hover"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-accent/60"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      transition={reduceMotion ? INSTANT : HOVER_SLIDE}
                    />
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-0.5 z-10 h-0.5 rounded-full bg-primary"
                    transition={reduceMotion ? INSTANT : SLIDE}
                  />
                )}
              </li>
            )
          })}
        </ul>
      </LayoutGroup>
    </nav>
  )
}
