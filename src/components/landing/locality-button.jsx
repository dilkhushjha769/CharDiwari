"use client"

import { replaceProjectFilters } from "@/lib/project-filters"
import { useScrollToSection } from "@/hooks/use-smooth-scroll"

export function LocalityButton({ id, children }) {
  const scrollToSection = useScrollToSection()

  return (
    <button
      type="button"
      onClick={() => {
        replaceProjectFilters({ area: id })
        scrollToSection("projects")
      }}
      className="block w-full rounded-2xl border border-border bg-card p-5 text-left transition-[border-color,box-shadow,scale] duration-150 ease-out-strong hover:border-primary/40 hover:shadow-sm active:scale-[0.98]"
    >
      {children}
    </button>
  )
}
