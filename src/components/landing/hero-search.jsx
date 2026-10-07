"use client"

import { Command } from "cmdk"
import { ArrowRight, Building2, Check, MapPin, Search } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { localities, localityName } from "@/data/localities"
import { projects } from "@/data/projects"
import { formatCompactINR, formatPriceRange } from "@/lib/format"
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

// A value set from a shared link that isn't one of the presets still gets a
// readable label in the select (e.g. "Under ₹1.2 Cr").
function withCurrent(items, value, label) {
  if (value === null || value === undefined || items.some((item) => item.value === value)) return items
  return [...items, { value, label: label(value) }]
}

const HINTS = ["Search an area or project", "Try Thaltej", "Try Gota", "Try Aaranya Heights"]
const HINT_MS = 3000

// Cycles example searches in the hero. Paused while the palette is open or the
// tab is hidden; a fixed hint for people who prefer reduced motion.
function useRotatingHint(paused) {
  const [index, setIndex] = useState(0)
  const reduceMotion = useReducedMotion()
  useEffect(() => {
    if (paused || reduceMotion) return
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((current) => (current + 1) % HINTS.length)
    }, HINT_MS)
    return () => window.clearInterval(timer)
  }, [paused, reduceMotion])
  return reduceMotion ? HINTS[0] : HINTS[index]
}

// Below lg the capsule is a stacked card; from lg it's one rounded row.
const capsuleClass =
  "grid w-full grid-cols-2 gap-1.5 rounded-2xl border border-border bg-background p-1.5 shadow-sm lg:flex lg:h-16 lg:max-w-4xl lg:items-center lg:gap-1 lg:rounded-full lg:p-2"
const segmentClass =
  "h-12 rounded-xl text-sm outline-none transition-[background-color,color,scale] duration-150 ease-out-strong focus-visible:ring-3 focus-visible:ring-ring/50 lg:rounded-full"
const selectClass = cn(
  segmentClass,
  "w-full justify-between border-0 bg-muted/60 px-3.5 data-[size=default]:h-12 dark:bg-muted/60 lg:w-auto lg:bg-transparent lg:hover:bg-accent/60 dark:lg:bg-transparent"
)
const divider = <span aria-hidden="true" className="hidden h-6 w-px shrink-0 bg-border lg:block" />

export function HeroSearch() {
  const [filters, setFilters] = useProjectFilters()
  const [open, setOpen] = useState(false)
  const scrollToSection = useScrollToSection()
  const hint = useRotatingHint(open)
  usePauseSmoothScroll(open)

  const matchCount = projects.filter((project) => matchesFilters(project, filters)).length
  const bhkChoices = withCurrent(bhkItems, filters.bhk, (bhk) => `${bhk} BHK`)
  const budgetChoices = withCurrent(budgetItems, filters.max, (max) => `Under ${formatCompactINR(max)}`)

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
      <div className={capsuleClass}>
        <button
          type="button"
          aria-label="Search an area or project"
          onClick={() => setOpen(true)}
          className={cn(
            segmentClass,
            "col-span-2 flex items-center gap-3 px-3.5 text-left hover:bg-accent/60 active:scale-[0.99] lg:min-w-0 lg:flex-1 lg:px-4"
          )}
        >
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span aria-hidden="true" className="relative min-w-0 flex-1 overflow-hidden text-base text-muted-foreground">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={hint}
                className="block truncate"
                initial={{ opacity: 0, filter: "blur(2px)", transform: "translateY(4px)" }}
                animate={{ opacity: 1, filter: "blur(0px)", transform: "translateY(0px)" }}
                exit={{ opacity: 0, filter: "blur(2px)", transform: "translateY(-4px)" }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              >
                {hint}
              </motion.span>
            </AnimatePresence>
          </span>
          <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 font-mono text-xs text-muted-foreground sm:inline">
            /
          </kbd>
        </button>

        {divider}
        <Select
          items={bhkChoices}
          value={filters.bhk}
          onValueChange={(bhk) => setFilters({ bhk, project: null })}
        >
          <SelectTrigger className={cn(selectClass, "lg:min-w-[7.5rem]")} aria-label="Bedrooms">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {bhkChoices.map((item) => (
              <SelectItem key={item.label} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {divider}
        <Select
          items={budgetChoices}
          value={filters.max}
          onValueChange={(max) => setFilters({ max, project: null })}
        >
          <SelectTrigger className={cn(selectClass, "lg:min-w-[9.5rem]")} aria-label="Budget">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {budgetChoices.map((item) => (
              <SelectItem key={item.label} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="col-span-2 flex flex-wrap gap-1.5 lg:contents">
          {/* A toggle that looks like one: a tick box and a brick tint, never the
              solid brick reserved for the main action next to it. */}
          <button
            type="button"
            aria-pressed={filters.ready}
            onClick={() => setFilters({ ready: !filters.ready || null, project: null })}
            className={cn(
              segmentClass,
              "group inline-flex shrink-0 items-center gap-2 border border-transparent bg-muted/60 px-3.5 active:scale-[0.97] aria-pressed:border-primary/40 aria-pressed:bg-accent lg:bg-transparent lg:hover:bg-accent/60"
            )}
          >
            <span
              aria-hidden="true"
              className="flex size-4 items-center justify-center rounded-[5px] border border-input text-primary-foreground transition-colors duration-150 group-aria-pressed:border-primary group-aria-pressed:bg-primary"
            >
              <Check className="size-3 opacity-0 group-aria-pressed:opacity-100" strokeWidth={3} />
            </span>
            Ready to move
          </button>

          <Button
            className="h-12 min-w-[9.5rem] flex-1 rounded-full px-5 text-sm lg:ml-1 lg:min-w-[10.5rem] lg:flex-none"
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
// Same capsule and segment sizes as the real thing, so nothing shifts on swap.
export function HeroSearchFallback() {
  const placeholder = cn(segmentClass, "flex items-center bg-muted/60 px-3.5 lg:bg-transparent")
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className={capsuleClass}>
        <div className={cn(segmentClass, "col-span-2 flex items-center gap-3 px-3.5 lg:min-w-0 lg:flex-1 lg:px-4")}>
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-base text-muted-foreground">{HINTS[0]}</span>
        </div>
        {divider}
        <span className={cn(placeholder, "lg:min-w-[7.5rem]")}>Any BHK</span>
        {divider}
        <span className={cn(placeholder, "lg:min-w-[9.5rem]")}>Any budget</span>
        <div className="col-span-2 flex flex-wrap gap-1.5 lg:contents">
          <span className={cn(placeholder, "shrink-0 gap-2 border border-transparent")}>
            <span className="size-4 rounded-[5px] border border-input" />
            Ready to move
          </span>
          <span className="h-12 min-w-[9.5rem] flex-1 rounded-full bg-primary/90 lg:ml-1 lg:min-w-[10.5rem] lg:flex-none" />
        </div>
      </div>
    </div>
  )
}
