import assert from "node:assert/strict"
import { test } from "node:test"
import { localities } from "../data/localities.js"
import { projects } from "../data/projects.js"
import { carpetAreaFor, localityRates, projectsWithin } from "./budget-area.js"
import { matchesFilters } from "./filter-match.js"

test("rates cover only localities with listed projects, cheapest first", () => {
  const rates = localityRates(projects)
  const listed = new Set(projects.map((project) => project.locality))
  assert.deepEqual(new Set(rates.map((entry) => entry.id)), listed)
  assert.equal(rates.some((entry) => entry.id === "sg-highway"), false)
  for (let index = 1; index < rates.length; index++) {
    assert.ok(rates[index - 1].rate <= rates[index].rate)
  }
})

test("a rate is mid price over mid carpet area, averaged within the locality", () => {
  const sample = [
    { locality: "gota", priceMin: 4000000, priceMax: 6000000, carpetSqft: [800, 1200] },
    { locality: "gota", priceMin: 6000000, priceMax: 6000000, carpetSqft: [1000, 1000] },
  ]
  const [gota] = localityRates(sample)
  assert.equal(gota.id, "gota")
  assert.equal(gota.name, "Gota")
  assert.equal(gota.rate, (5000 + 6000) / 2)
})

test("carpet area is the budget over the rate", () => {
  assert.equal(carpetAreaFor(8000000, 6400), 1250)
})

// The card's "N projects in budget" must equal what the project list shows
// after clicking it. ₹52 L is exactly a Gota project's priceMin (the <= edge).
test("card counts equal the filtered project list at every budget", () => {
  const budgets = [3000000, 5200000, 8000000, 24000000, 50000000]
  for (const { id } of localities) {
    for (const max of budgets) {
      const listed = projects.filter((project) => matchesFilters(project, { area: id, max }))
      assert.equal(projectsWithin(projects, id, max).length, listed.length, `${id} at ${max}`)
    }
  }
  assert.equal(projectsWithin(projects, "gota", 5200000).length, 1)
})
