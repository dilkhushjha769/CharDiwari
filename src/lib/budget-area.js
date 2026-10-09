import { localities } from "../data/localities.js"
import { matchesFilters } from "./filter-match.js"

// What a budget buys in each locality, as carpet area. Estimates only: the rate
// is the average of each listed project's mid price over its mid carpet area,
// before GST, stamp duty, registration and other charges.

export const budgetLimits = { min: 3000000, max: 50000000, step: 100000 }

const middle = (low, high) => (low + high) / 2

// ₹ per sq ft of carpet area for each locality with listed projects, cheapest
// first. The order doesn't depend on the budget, so cards never reorder.
export function localityRates(projects) {
  return localities
    .flatMap((locality) => {
      const listed = projects.filter((project) => project.locality === locality.id)
      if (listed.length === 0) return []
      const total = listed.reduce(
        (sum, project) =>
          sum + middle(project.priceMin, project.priceMax) / middle(...project.carpetSqft),
        0
      )
      return [{ id: locality.id, name: locality.name, rate: total / listed.length }]
    })
    .sort((a, b) => a.rate - b.rate)
}

export function carpetAreaFor(budget, rate) {
  return budget / rate
}

// The same rule as the project list's budget filter, so a card's count always
// matches what clicking it shows.
export function projectsWithin(projects, locality, budget) {
  return projects.filter((project) => matchesFilters(project, { area: locality, max: budget }))
}
