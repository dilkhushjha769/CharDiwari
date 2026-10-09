"use client"

import { useInView, useReducedMotion } from "motion/react"
import { parseAsInteger, useQueryStates } from "nuqs"
import { useEffect, useRef } from "react"
import { projects } from "@/data/projects"
import { useScrollToSection } from "@/hooks/use-smooth-scroll"
import { budgetLimits, carpetAreaFor, localityRates, projectsWithin } from "@/lib/budget-area"
import { formatCompactINR, formatINR, formatNumber } from "@/lib/format"
import { replaceProjectFilters } from "@/lib/project-filters"
import { urlOptions } from "./calculator/params"
import { RangeField } from "./calculator/range-field"
import { AreaFlow, CountFlow } from "./flow-number"

const DEFAULT_BUDGET = 8000000
const rates = localityRates(projects)

// Every drawing shares one scale: the full drawing is a square plot of the
// largest area on the slider (the top budget in the cheapest locality), so
// plans grow with the budget and compare fairly side by side.
const plotSideFt = Math.sqrt(carpetAreaFor(budgetLimits.max, rates[0].rate))
const GRID_FT = 10
const SCALE_BAR_FT = 20
const toPercent = (ft) => `${(ft / plotSideFt) * 100}%`

// Faint 10 ft squares behind each plan, to the same scale.
const plotGrid = {
  backgroundImage:
    "linear-gradient(to right, var(--grid) 1px, transparent 1px), linear-gradient(to bottom, var(--grid) 1px, transparent 1px)",
  backgroundSize: `${toPercent(GRID_FT)} ${toPercent(GRID_FT)}`,
  backgroundPosition: "left bottom",
}

const roundTo = (value, step) => Math.round(value / step) * step
const clampBudget = (value) => Math.min(budgetLimits.max, Math.max(budgetLimits.min, value))

// The plans draw in once, growing from their corner, the first time the grid
// is seen: it shows that a plan's size is the space the budget buys.
const ENTRANCE = { duration: 400, stagger: 40, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }

function usePlanEntrance(gridRef, enabled) {
  const reduceMotion = useReducedMotion()
  const inView = useInView(gridRef, { once: true, margin: "0px 0px -80px 0px" })
  const state = useRef("idle")

  // Only off-screen grids get an entrance; one already on screen when the page
  // loads stays drawn. data-pending hides the plans until it starts, since they
  // are in the page (fully drawn) before the grid is far enough in to trigger.
  useEffect(() => {
    const grid = gridRef.current
    if (!enabled || !grid) return
    if (grid.getBoundingClientRect().top < window.innerHeight) {
      state.current = "skip"
      return
    }
    state.current = "pending"
    grid.dataset.pending = ""
    return () => {
      delete grid.dataset.pending
    }
  }, [gridRef, enabled])

  useEffect(() => {
    const grid = gridRef.current
    if (!inView || !grid || state.current !== "pending") return
    state.current = "done"
    // Animates the <g> around each plan, never the <rect>: the rect's own
    // scale follows the slider, so dragging mid-entrance can't conflict.
    const plans = grid.querySelectorAll("[data-plan]")
    const animations = Array.from(plans, (plan, index) =>
      reduceMotion
        ? plan.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease", fill: "backwards" })
        : plan.animate(
            [
              { transform: "scale(0.6)", opacity: 0 },
              { transform: "scale(1)", opacity: 1 },
            ],
            { duration: ENTRANCE.duration, delay: index * ENTRANCE.stagger, easing: ENTRANCE.easing, fill: "backwards" }
          )
    )
    // Same task as the animations start, so no frame shows them drawn.
    delete grid.dataset.pending
    return () => animations.forEach((animation) => animation.cancel())
  }, [gridRef, inView, reduceMotion])
}

const autoFit = "grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3"
// auto-fill keeps empty tracks, so the scale bar's column is exactly as wide
// as a card's (7 cards always fill every track, so the two grids line up).
const autoFill = "grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-3"

function LocalityPlan({ id, name, rate, budget, onSelect }) {
  const area = carpetAreaFor(budget, rate)
  const count = projectsWithin(projects, id, budget).length
  const shownArea = roundTo(area, 10)
  const inBudget = count === 0 ? "Nothing listed in budget yet" : `${count} ${count === 1 ? "project" : "projects"} in budget`

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(id, count > 0)}
        aria-label={`${name}: about ${formatNumber(shownArea)} sq ft carpet. ${inBudget}.`}
        className="flex h-full w-full flex-col rounded-2xl border border-border bg-card p-3 text-left outline-none transition-[border-color,box-shadow,scale] duration-150 ease-out-strong hover:border-primary/40 hover:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98]"
      >
        <span aria-hidden="true" className="relative block aspect-square rounded-md border border-border/60" style={plotGrid}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <g data-plan className="[transform-box:view-box] [transform-origin:0_100%] in-data-pending:opacity-0">
              {/* The stroke stays 1.5px however small the plan is drawn. */}
              <rect
                width="100"
                height="100"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                className="origin-bottom-left fill-primary/10 stroke-primary transition-transform duration-200 ease-out-strong [transform-box:fill-box] motion-reduce:transition-none"
                style={{ transform: `scale(${Math.sqrt(area) / plotSideFt})` }}
              />
            </g>
          </svg>
        </span>
        <span aria-hidden="true" className="mt-3 block font-display text-xl leading-tight">
          {name}
        </span>
        <span aria-hidden="true" className="mt-0.5 block text-sm font-medium tabular-nums">
          ~<AreaFlow value={shownArea} /> sq ft
        </span>
        <span aria-hidden="true" className="mt-1 block font-mono text-[11px] text-muted-foreground tabular-nums">
          {formatINR(roundTo(rate, 100))}/sq ft
        </span>
        <span aria-hidden="true" className="mt-auto block pt-1 text-xs text-muted-foreground">
          {inBudget}
        </span>
      </button>
    </li>
  )
}

function BudgetScaleView({ budget, onBudget, onSelect, animateEntrance = false }) {
  const gridRef = useRef(null)
  usePlanEntrance(gridRef, animateEntrance)

  return (
    <div>
      <div className="max-w-md">
        <RangeField
          label="Your budget"
          value={budget}
          onChange={onBudget}
          {...budgetLimits}
          scale="log"
          format={formatINR}
          formatEdge={formatCompactINR}
        />
      </div>

      <ul ref={gridRef} className={`${autoFit} mt-6`}>
        {rates.map((entry) => (
          <LocalityPlan key={entry.id} {...entry} budget={budget} onSelect={onSelect} />
        ))}
      </ul>

      {/* Always visible: the scale, and what these numbers are (and aren't). */}
      <div className={`${autoFill} mt-4 gap-y-2`}>
        <div aria-hidden="true" className="px-[calc(0.75rem+1px)]">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
            <span
              className="h-2 shrink-0 border-x border-b border-muted-foreground/70"
              style={{ width: toPercent(SCALE_BAR_FT) }}
            />
            {SCALE_BAR_FT} ft
          </div>
        </div>
        <p className="col-span-full text-xs text-pretty text-muted-foreground">
          Estimates from sample listings. Carpet area only; excludes GST, stamp duty, registration and
          other charges. Plans drawn to scale, grid squares are {GRID_FT} ft.
        </p>
      </div>
    </div>
  )
}

export function BudgetScale() {
  const [{ buys }, setState] = useQueryStates({ buys: parseAsInteger.withDefault(DEFAULT_BUDGET) }, urlOptions)
  const budget = clampBudget(buys)
  const scrollToSection = useScrollToSection()

  return (
    <BudgetScaleView
      animateEntrance
      budget={budget}
      onBudget={(next) => setState({ buys: next })}
      onSelect={(id, hasProjects) => {
        replaceProjectFilters({ area: id, max: hasProjects ? budget : null })
        scrollToSection("projects")
      }}
    />
  )
}

// Same markup at the default budget, so nothing shifts when the URL is read.
export function BudgetScaleFallback() {
  return (
    <div inert>
      <BudgetScaleView budget={DEFAULT_BUDGET} onBudget={() => {}} onSelect={() => {}} />
    </div>
  )
}
