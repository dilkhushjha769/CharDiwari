"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

// Sticky under the header. Plain #anchors (Lenis smooths them); each section's
// scroll-margin clears the header and this bar. The highlight follows the
// section crossing a thin line just below the bar, with no animation: it's
// used all the time, so it should feel instant.
export function SectionNav({ sections, className }) {
  const [active, setActive] = useState(sections[0]?.id)

  useEffect(() => {
    const elements = sections.map((section) => document.getElementById(section.id)).filter(Boolean)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length) setActive(visible[0].target.id)
      },
      // Px or %, never rem: IntersectionObserver rejects other units. 128px clears the header + this bar.
      { rootMargin: "-128px 0px -70% 0px" }
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [sections])

  return (
    <nav
      aria-label="On this page"
      className={cn("sticky top-16 z-30 -mx-4 h-12 border-b border-border bg-background/90 backdrop-blur-md sm:-mx-6 lg:mx-0", className)}
    >
      <ul className="flex h-full items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 lg:px-0">
        {sections.map((section) => (
          <li key={section.id} className="shrink-0">
            <a
              href={`#${section.id}`}
              aria-current={active === section.id ? "true" : undefined}
              className={cn(
                "inline-flex h-9 items-center rounded-full px-3 text-sm text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] transition-transform duration-150 ease-out-strong",
                active === section.id && "bg-muted font-medium text-foreground"
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
