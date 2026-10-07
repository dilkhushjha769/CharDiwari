"use client"

import { X } from "lucide-react"
import { localityName } from "@/data/localities"
import { projects } from "@/data/projects"
import {
  bhkOptions,
  budgetOptions,
  clearedFilters,
  hasActiveFilters,
  matchesFilters,
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
  if (filters.max) {
    const preset = budgetOptions.find((option) => option.value === filters.max)
    chips.push({ key: "max", label: preset?.label ?? `Under ${formatCompactINR(filters.max)}` })
  }
  if (filters.ready) chips.push({ key: "ready", label: "Ready to move" })
  return chips
}

export function FeaturedProjects() {
  const [filters, setFilters] = useProjectFilters()
  const matches = projects.filter((project) => matchesFilters(project, filters))
  const filtered = hasActiveFilters(filters)

  return (
    <>
      {filtered && (
        <div className="mb-6 flex flex-wrap items-center gap-2" aria-live="polite">
          <span className="mr-1 text-sm text-muted-foreground">
            <CountFlow value={matches.length} /> of {projects.length} projects
          </span>
          {activeChips(filters).map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilters({ [chip.key]: null })}
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
