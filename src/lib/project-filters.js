"use client"

import { parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from "nuqs"

// Filters live in the URL so a search can be shared or bookmarked.
const parsers = {
  area: parseAsString,
  project: parseAsString,
  bhk: parseAsInteger,
  max: parseAsInteger,
  ready: parseAsBoolean.withDefault(false),
}

export function useProjectFilters() {
  return useQueryStates(parsers, { history: "replace", scroll: false })
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
  if (filters.ready && project.status !== "ready") return false
  return true
}

export function hasActiveFilters(filters) {
  return Boolean(filters.area || filters.project || filters.bhk || filters.max || filters.ready)
}

export const clearedFilters = { area: null, project: null, bhk: null, max: null, ready: null }

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
