// The filter rules themselves, kept free of React and nuqs so the budget cards
// and the tests use exactly the same rule as the project list.

// The status in effect, including the old ?ready=true alias.
export function currentStatus(filters) {
  return filters.status ?? (filters.ready ? "ready" : null)
}

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
