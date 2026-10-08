"use client"

import { useAutoAnimate } from "@formkit/auto-animate/react"
import { Command, defaultFilter } from "cmdk"
import { ArrowRight, Building2, CornerDownLeft, MapPin, Search, SlidersHorizontal } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { localities, localityName } from "@/data/localities"
import { projects } from "@/data/projects"
import { formatCompactINR, formatPriceRange } from "@/lib/format"
import { parseQuery } from "@/lib/parse-query"
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
import { StatusTabs, StatusTabsFallback } from "./status-tabs"

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

// The palette's placeholder shows what can be typed. A plain text swap, no
// animation: the palette is keyboard-driven and opened often.
const PALETTE_EXAMPLES = ["3 BHK in Thaltej under 1.2 Cr", "Ready to move in Gota", "2 BHK under 80 L"]

function usePaletteExample(active) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % PALETTE_EXAMPLES.length), HINT_MS)
    return () => window.clearInterval(timer)
  }, [active])
  return PALETTE_EXAMPLES[index]
}

// The pinned "Apply" item always passes cmdk's filter and ranks first; every
// other item keeps cmdk's own matching.
const APPLY_VALUE = "__apply-parsed-filters"
const paletteFilter = (value, search, keywords) =>
  value === APPLY_VALUE ? 1 : defaultFilter(value, search, keywords)

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
  const [open, setOpenState] = useState(false)
  const [search, setSearch] = useState("")
  const scrollToSection = useScrollToSection()
  const hint = useRotatingHint(open)
  const example = usePaletteExample(open && search === "")
  const parsed = useMemo(() => parseQuery(search), [search])
  const [partsRef] = useAutoAnimate({ duration: 150 })
  usePauseSmoothScroll(open)

  // The typed text is cleared whenever the palette closes, as before.
  function setOpen(next) {
    setOpenState(next)
    if (!next) setSearch("")
  }

  const matchCount = projects.filter((project) => matchesFilters(project, filters)).length
  const bhkChoices = withCurrent(bhkItems, filters.bhk, (bhk) => `${bhk} BHK`)
  const budgetChoices = withCurrent(budgetItems, filters.max, (max) => `Under ${formatCompactINR(max)}`)

  useEffect(() => {
    function onKeyDown(event) {
      const typing = event.target.closest?.("input, textarea, [contenteditable='true']")
      const shortcut = (event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)
      if (!shortcut) return
      event.preventDefault()
      setOpenState(!open)
      if (open) setSearch("")
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  function choose(nextFilters) {
    setFilters({ ...clearedFilters, ...nextFilters })
    setOpen(false)
    // Wait one frame for the dialog to release its scroll lock.
    requestAnimationFrame(() => scrollToSection("projects"))
  }

  return (
    <div className="flex flex-col gap-3">
      <StatusTabs />
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

        <Button
          className="col-span-2 h-12 rounded-full px-5 text-sm lg:ml-1 lg:min-w-[10.5rem]"
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
        filter={paletteFilter}
        overlayClassName="fixed inset-0 z-50 bg-overlay"
        contentClassName="fixed top-[12vh] left-1/2 z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Command.Input
            autoFocus
            value={search}
            onValueChange={setSearch}
            placeholder={`Try “${example}”`}
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Command.List className="max-h-[min(380px,55vh)] overflow-y-auto overscroll-contain p-2">
          {/* cmdk counts only its own matches, so hide "No matches" while the
              pinned Apply item is offering the parsed search. */}
          {!parsed.hasFilters && (
            <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
              No matches. Try another area, or ask us. We cover all of Ahmedabad.
            </Command.Empty>
          )}
          {parsed.hasFilters && (
            // Understood the typed search: apply all of it at once.
            <Command.Group heading="Your search" className={groupClass} forceMount>
              <Command.Item
                value={APPLY_VALUE}
                forceMount
                onSelect={() => choose(parsed.filters)}
                className={cn(itemClass, "items-start")}
              >
                <SlidersHorizontal className="mt-0.5 size-4 text-primary" aria-hidden="true" />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="font-medium">
                    Apply<span className="sr-only">: {parsed.parts.map((part) => part.label).join(", ")}</span>
                  </span>
                  <ul ref={partsRef} aria-hidden="true" className="flex flex-wrap gap-1">
                    {parsed.parts.map((part) => (
                      <li key={part.key} className="rounded-full bg-background px-2 py-0.5 text-xs ring-1 ring-border">
                        {part.label}
                      </li>
                    ))}
                  </ul>
                </span>
                <CornerDownLeft className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
              </Command.Item>
            </Command.Group>
          )}
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
    <div className="flex flex-col gap-3" aria-hidden="true">
      <StatusTabsFallback />
      <div className={capsuleClass}>
        <div className={cn(segmentClass, "col-span-2 flex items-center gap-3 px-3.5 lg:min-w-0 lg:flex-1 lg:px-4")}>
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-base text-muted-foreground">{HINTS[0]}</span>
        </div>
        {divider}
        <span className={cn(placeholder, "lg:min-w-[7.5rem]")}>Any BHK</span>
        {divider}
        <span className={cn(placeholder, "lg:min-w-[9.5rem]")}>Any budget</span>
        <span className="col-span-2 h-12 rounded-full bg-primary/90 lg:ml-1 lg:min-w-[10.5rem]" />
      </div>
    </div>
  )
}
