"use client"

import { X } from "lucide-react"
import { localityName } from "@/data/localities"
import { projects } from "@/data/projects"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import {
  bhkOptions,
  budgetOptions,
  clearedFilters,
  currentStatus,
  hasActiveFilters,
  matchesFilters,
  statusOptions,
  useProjectFilters,
} from "@/lib/project-filters"
import { formatCompactINR } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { EnquireButton } from "./enquiry"
import { CountFlow } from "./flow-number"
import { ProjectCarousel } from "./project-carousel"

function activeChips(filters) {
  const chips = []
  if (filters.project) {
    const project = projects.find((item) => item.id === filters.project)
    chips.push({ key: "project", label: project?.name ?? "Selected project" })
  }
  if (filters.area) chips.push({ key: "area", label: localityName(filters.area) })
  if (filters.bhk) {
    chips.push({ key: "bhk", label: bhkOptions.find((option) => option.value === filters.bhk)?.label ?? `${filters.bhk} BHK` })
  }
  if (filters.min && filters.max) {
    chips.push({ key: ["min", "max"], label: `${formatCompactINR(filters.min)} – ${formatCompactINR(filters.max)}` })
  } else if (filters.max) {
    const preset = budgetOptions.find((option) => option.value === filters.max)
    chips.push({ key: "max", label: preset?.label ?? `Under ${formatCompactINR(filters.max)}` })
  } else if (filters.min) {
    chips.push({ key: "min", label: `From ${formatCompactINR(filters.min)}` })
  }
  const status = currentStatus(filters)
  if (status) {
    chips.push({ key: "status", label: statusOptions.find((option) => option.value === status)?.label ?? status })
  }
  return chips
}

// Removing a chip clears every param it stands for.
const clearing = (key) => Object.fromEntries([key].flat().map((name) => [name, null]))

export function FeaturedProjects() {
  const [filters, setFilters] = useProjectFilters()
  const matches = projects.filter((project) => matchesFilters(project, filters))
  const filtered = hasActiveFilters(filters)
  // Chips slide in and out as filters change (a list add/remove, so AutoAnimate).
  const [chipsRef] = useAutoAnimate({ duration: 180 })

  return (
    <>
      {filtered && (
        <div ref={chipsRef} className="mb-6 flex flex-wrap items-center gap-2" aria-live="polite">
          <span className="mr-1 text-sm text-muted-foreground">
            <CountFlow value={matches.length} /> of {projects.length} projects
          </span>
          {activeChips(filters).map((chip) => (
            <button
              key={[chip.key].flat().join("-")}
              type="button"
              onClick={() => setFilters(clearing(chip.key))}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted pr-2.5 pl-3 text-sm transition-[background-color,scale] duration-150 ease-out-strong hover:bg-accent active:scale-[0.97]"
              aria-label={`Remove filter: ${chip.label}`}
            >
              {chip.label}
              <X className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFilters(clearedFilters)}
            className="px-2 text-sm font-medium underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {matches.length > 0 ? (
        <ProjectCarousel projects={matches} />
      ) : (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-border p-8">
          <div>
            <p className="font-medium">Nothing listed here matches yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Many projects never make it online. Tell us what you need and we&apos;ll check what&apos;s
              available, including resale and upcoming launches.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <EnquireButton
              topic="Help finding a home"
              message={activeChips(filters).map((chip) => chip.label).join(", ")}
            >
              Ask an expert
            </EnquireButton>
            <Button variant="ghost" onClick={() => setFilters(clearedFilters)}>
              Clear filters
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

// Server-rendered list shown until the URL filters are readable on the client.
export function FeaturedProjectsFallback() {
  return <ProjectCarousel projects={projects} />
}
