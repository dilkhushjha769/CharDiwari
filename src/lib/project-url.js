import { projectDetails } from "../data/project-details.js"
import { projects } from "../data/projects.js"

// The live site's URL pattern, kept so old links keep working.
export const CITY = "ahmedabad"

export function projectHref(project) {
  return `/${CITY}/${project.locality}/${project.id}`
}

// Only the exact locality + project pair resolves; anything else is a 404.
export function findProject(locality, slug) {
  return projects.find((project) => project.id === slug && project.locality === locality) ?? null
}

export function projectDetail(project) {
  return projectDetails[project.id] ?? {}
}

// Same locality first, then the closest in price, never the project itself.
export function similarProjects(project, count = 3) {
  const middle = (item) => (item.priceMin + item.priceMax) / 2
  return projects
    .filter((item) => item.id !== project.id)
    .map((item) => ({
      item,
      sameArea: item.locality === project.locality ? 0 : 1,
      gap: Math.abs(middle(item) - middle(project)),
    }))
    .sort((a, b) => a.sameArea - b.sameArea || a.gap - b.gap)
    .slice(0, count)
    .map(({ item }) => item)
}
