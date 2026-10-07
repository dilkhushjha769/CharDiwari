import assert from "node:assert/strict"
import { test } from "node:test"
import { projects } from "../../../data/projects.js"
import { FOOTPRINT, INTRO_SECONDS, RISE_SECONDS, SPACING, TOWER_CELLS, planCity } from "./plan.js"

test("the plan is deterministic", () => {
  assert.deepEqual(planCity(), planCity())
})

test("there is exactly one tower per project", () => {
  const { buildings } = planCity()
  const towers = buildings.filter((building) => building.tower !== -1).map((building) => building.tower)
  assert.equal(TOWER_CELLS.length, projects.length)
  assert.deepEqual([...towers].sort((a, b) => a - b), projects.map((_, index) => index))
})

test("no two footprints overlap", () => {
  const { buildings } = planCity()
  assert.ok(FOOTPRINT.max < SPACING)
  for (let i = 0; i < buildings.length; i++) {
    for (let j = i + 1; j < buildings.length; j++) {
      const a = buildings[i]
      const b = buildings[j]
      const apartX = Math.abs(a.x - b.x) >= (a.width + b.width) / 2
      const apartZ = Math.abs(a.z - b.z) >= (a.depth + b.depth) / 2
      assert.ok(apartX || apartZ, `blocks ${i} and ${j} overlap`)
    }
  }
})

test("every block finishes rising within the intro", () => {
  for (const building of planCity().buildings) {
    assert.ok(building.siteDelay >= 0 && building.siteDelay < building.delay)
    assert.ok(building.delay + RISE_SECONDS <= INTRO_SECONDS + 1e-9)
  }
})

test("heights stay in range and project towers stand out", () => {
  for (const building of planCity().buildings) {
    assert.ok(building.height >= 1 && building.height <= 13)
    if (building.tower !== -1) assert.ok(building.height >= 7)
  }
})
