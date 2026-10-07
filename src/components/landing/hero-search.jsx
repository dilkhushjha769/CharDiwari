"use client"

import { Command } from "cmdk"
import { ArrowRight, Building2, MapPin, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { localities, localityName } from "@/data/localities"
import { projects } from "@/data/projects"
import { formatPriceRange } from "@/lib/format"
import {
  bhkOptions,
  budgetOptions,
  clearedFilters,
  matchesFilters,
  useProjectFilters,
} from "@/lib/project-filters"
import { cn } from "@/lib/utils"
import { usePauseSmoothScroll, useScrollToSection } from "@/hooks/use-smooth-scroll"
import { CountFlow } from "./flow-number"

const bhkItems = [{ value: null, label: "Any BHK" }, ...bhkOptions]
const budgetItems = [{ value: null, label: "Any budget" }, ...budgetOptions]

const searchBoxClass =
  "flex h-14 w-full max-w-xl items-center gap-3 rounded-2xl border border-border bg-background px-4 text-left shadow-sm"
const chipClass = "h-10 rounded-full bg-background px-4 data-[size=default]:h-10"

export function HeroSearch() {
  const [filters, setFilters] = useProjectFilters()
  const [open, setOpen] = useState(false)
  const scrollToSection = useScrollToSection()
  usePauseSmoothScroll(open)

  const matchCount = projects.filter((project) => matchesFilters(project, filters)).length

  useEffect(() => {
    function onKeyDown(event) {
      const typing = event.target.closest?.("input, textarea, [contenteditable='true']")
      const shortcut = (event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)
      if (!shortcut) return
      event.preventDefault()
      setOpen((isOpen) => !isOpen)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  function choose(nextFilters) {
    setFilters({ ...clearedFilters, ...nextFilters })
    setOpen(false)
    // Wait one frame for the dialog to release its scroll lock.
    requestAnimationFrame(() => scrollToSection("projects"))
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={() => setOpen(true)} className={cn(searchBoxClass, "group transition-[box-shadow,border-color,scale] duration-150 ease-out-strong hover:border-foreground/20 active:scale-[0.99]")}>
        <Search className="size-5 text-muted-foreground" aria-hidden="true" />
        <span className="flex-1 truncate text-muted-foreground">Search an area or project</span>
        <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 font-mono text-xs text-muted-foreground sm:inline">
          /
        </kbd>
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          items={bhkItems}
          value={filters.bhk}
          onValueChange={(bhk) => setFilters({ bhk, project: null })}
        >
          <SelectTrigger className={chipClass} aria-label="Bedrooms">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {bhkItems.map((item) => (
              <SelectItem key={item.label} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={budgetItems}
          value={filters.max}
          onValueChange={(max) => setFilters({ max, project: null })}
        >
          <SelectTrigger className={chipClass} aria-label="Budget">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {budgetItems.map((item) => (
              <SelectItem key={item.label} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          aria-pressed={filters.ready}
          onClick={() => setFilters({ ready: !filters.ready || null, project: null })}
          className={cn(
            "h-10 rounded-full border px-4 text-sm transition-[background-color,color,border-color,scale] duration-150 ease-out-strong active:scale-[0.97]",
            filters.ready
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:border-foreground/20"
          )}
        >
          Ready to move
        </button>

        <Button
          className="h-10 rounded-full px-4"
          onClick={() => scrollToSection("projects")}
        >
          {matchCount === 0 ? (
            "No matches yet"
          ) : (
            <>
              Show <CountFlow value={matchCount} /> {matchCount === 1 ? "project" : "projects"}
            </>
          )}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Search areas and projects"
        overlayClassName="fixed inset-0 z-50 bg-overlay"
        contentClassName="fixed top-[12vh] left-1/2 z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Command.Input
            autoFocus
            placeholder="Try Thaltej, Gota or a project name"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Command.List className="max-h-[min(380px,55vh)] overflow-y-auto overscroll-contain p-2">
          <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
            No matches. Try another area, or ask us. We cover all of Ahmedabad.
          </Command.Empty>
          <Command.Group heading="Areas" className={groupClass}>
            {localities.map((locality) => (
              <Command.Item
                key={locality.id}
                value={`area ${locality.name}`}
                keywords={[locality.note]}
                onSelect={() => choose({ area: locality.id })}
                className={itemClass}
              >
                <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="flex-1">{locality.name}</span>
                <span className="text-xs text-muted-foreground">{locality.projects} projects</span>
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group heading="Projects" className={groupClass}>
            {projects.map((project) => (
              <Command.Item
                key={project.id}
                value={`project ${project.name}`}
                keywords={[localityName(project.locality), project.developer]}
                onSelect={() => choose({ project: project.id })}
                className={itemClass}
              >
                <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="flex-1">
                  {project.name}
                  <span className="text-muted-foreground"> · {localityName(project.locality)}</span>
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatPriceRange(project.priceMin, project.priceMax)}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </div>
  )
}

const groupClass =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
const itemClass =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm data-[selected=true]:bg-accent"

// Static stand-in rendered on the server until the URL filters are readable.
export function HeroSearchFallback() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className={searchBoxClass}>
        <Search className="size-5 text-muted-foreground" />
        <span className="flex-1 text-muted-foreground">Search an area or project</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Any BHK", "Any budget", "Ready to move"].map((label) => (
          <span key={label} className="inline-flex h-10 items-center rounded-full border border-input bg-background px-4 text-sm">
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
