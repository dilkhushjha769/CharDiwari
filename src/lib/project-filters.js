"use client"

import { parseAsBoolean, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"
import { useCallback } from "react"
import { projects } from "@/data/projects"

export const statusOptions = [
  { value: "ready", label: "Ready to move" },
  { value: "under-construction", label: "Under construction" },
  { value: "new-launch", label: "New launch" },
]

// Only the statuses some project actually has are offered as tabs.
export const availableStatusOptions = statusOptions.filter((option) =>
  projects.some((project) => project.status === option.value)
)

// Filters live in the URL so a search can be shared or bookmarked.
const parsers = {
  area: parseAsString,
  project: parseAsString,
  bhk: parseAsInteger,
  min: parseAsInteger,
  max: parseAsInteger,
  status: parseAsStringLiteral(statusOptions.map((option) => option.value)),
  // Older links used ?ready=true; it still works and reads as status=ready.
  ready: parseAsBoolean.withDefault(false),
}

export function useProjectFilters() {
  const [filters, setFilters] = useQueryStates(parsers, { history: "replace", scroll: false })
  // Every change writes the status under its own key, carrying an old
  // ?ready=true over, so the alias disappears from the URL without losing it.
  const setProjectFilters = useCallback(
    (next) =>
      setFilters((previous) => {
        const values = typeof next === "function" ? next(previous) : next
        const status = "status" in values ? values.status : currentStatus(previous)
        return { ...values, status, ready: null }
      }),
    [setFilters]
  )
  return [filters, setProjectFilters]
}

// The status in effect, including the old ?ready=true alias.
export function currentStatus(filters) {
  return filters.status ?? (filters.ready ? "ready" : null)
}

export const bhkOptions = [
  { value: 2, label: "2 BHK" },
  { value: 3, label: "3 BHK" },
  { value: 4, label: "4 BHK" },
  { value: 5, label: "5+ BHK" },
]

export const budgetOptions = [
  { value: 7500000, label: "Under ₹75 L" },
  { value: 15000000, label: "Under ₹1.5 Cr" },
  { value: 30000000, label: "Under ₹3 Cr" },
  { value: 50000000, label: "Under ₹5 Cr" },
]

export function matchesFilters(project, filters) {
  if (filters.project) return project.id === filters.project
  if (filters.area && project.locality !== filters.area) return false
  if (filters.bhk) {
    const fits = filters.bhk >= 5
      ? project.bhk.some((bhk) => bhk >= 5)
      : project.bhk.includes(filters.bhk)
    if (!fits) return false
  }
  if (filters.max && project.priceMin > filters.max) return false
  if (filters.min && project.priceMax < filters.min) return false
  const status = currentStatus(filters)
  if (status && project.status !== status) return false
  return true
}

export function hasActiveFilters(filters) {
  return Boolean(
    filters.area || filters.project || filters.bhk || filters.min || filters.max || currentStatus(filters)
  )
}

export const clearedFilters = { area: null, project: null, bhk: null, min: null, max: null, status: null, ready: null }

// Replaces only the project filters in the URL, keeping other params (like the
// calculator's). Next.js syncs this into useSearchParams, so components that
// only need to *set* filters don't have to read them (and need no Suspense).
export function replaceProjectFilters(next) {
  const params = new URLSearchParams(window.location.search)
  for (const key of Object.keys(clearedFilters)) params.delete(key)
  for (const [key, value] of Object.entries(next)) {
    if (value !== null && value !== undefined) params.set(key, String(value))
  }
  const query = params.toString()
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname)
}
