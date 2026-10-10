import assert from "node:assert/strict"
import { test } from "node:test"
import { localities } from "../data/localities.js"
import { projectDetails } from "../data/project-details.js"
import { projects } from "../data/projects.js"
import { findProject, projectHref, similarProjects } from "./project-url.js"
import { projectDetailSchema, projectSchema } from "./schemas/project.js"

test("every project and its details match the schemas", () => {
  for (const project of projects) {
    assert.doesNotThrow(() => projectSchema.parse(project), project.id)
    assert.doesNotThrow(() => projectDetailSchema.parse(projectDetails[project.id] ?? {}), project.id)
  }
})

test("every project's locality exists and its id is unique", () => {
  const ids = new Set(localities.map((locality) => locality.id))
  for (const project of projects) assert.ok(ids.has(project.locality), project.id)
  assert.equal(new Set(projects.map((project) => project.id)).size, projects.length)
})

test("details exist only for known projects", () => {
  const ids = new Set(projects.map((project) => project.id))
  for (const id of Object.keys(projectDetails)) assert.ok(ids.has(id), id)
})

test("projectHref and findProject round-trip, and only the exact pair resolves", () => {
  for (const project of projects) {
    const [, city, locality, slug] = projectHref(project).split("/")
    assert.equal(city, "ahmedabad")
    assert.equal(findProject(locality, slug), project)
  }
  const [first] = projects
  const otherLocality = projects.find((project) => project.locality !== first.locality).locality
  assert.equal(findProject(otherLocality, first.id), null)
  assert.equal(findProject(first.locality, "no-such-project"), null)
})

test("similar projects never include the project and prefer its locality", () => {
  for (const project of projects) {
    const similar = similarProjects(project, 3)
    assert.equal(similar.length, 3)
    assert.ok(!similar.includes(project))
    const sameArea = projects.filter((item) => item !== project && item.locality === project.locality)
    for (const item of sameArea) assert.ok(similar.includes(item), `${project.id} misses ${item.id}`)
  }
})
