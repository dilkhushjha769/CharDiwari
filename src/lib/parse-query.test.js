import assert from "node:assert/strict"
import { test } from "node:test"
import { fuzzyMatch, parseQuery } from "./parse-query.js"

const filtersOf = (text) => parseQuery(text).filters

// ---- Phrasings ----
const cases = [
  ["3 bhk gota mein 1 cr tak", { bhk: 3, area: "gota", max: 1e7 }],
  ["3 bhk thaltej under 1.2 cr", { bhk: 3, area: "thaltej", max: 12000000 }],
  ["2bhk below 80L", { bhk: 2, max: 8000000 }],
  ["between 60 lac and 1 crore", { min: 6000000, max: 1e7 }],
  ["60 to 80 lakh", { min: 6000000, max: 8000000 }],
  ["60 lakh se 1 cr tak", { min: 6000000, max: 1e7 }],
  ["ready to move in zundal", { status: "ready", area: "zundal" }],
  ["4 bed sbr above 5 cr", { bhk: 4, area: "sindhu-bhavan-road", min: 5e7 }],
  ["aaranya", { project: "aaranya-heights" }],
  ["The Meridian", { project: "the-meridian" }],
  ["under construction bodakdev", { status: "under-construction", area: "bodakdev" }],
  ["₹75,00,000", { max: 7500000 }],
  ["Rs 1.5 Cr 3BHK", { bhk: 3, max: 15000000 }],
  ["flats in thaltez", { area: "thaltej" }], // typo
  ["jagatpr 2 bhk", { area: "jagatpur", bhk: 2 }], // typo
  ["SG Highway 4 bhk upto 3 cr", { area: "sg-highway", bhk: 4, max: 3e7 }],
  ["1 cr+ in ambli", { min: 1e7, area: "ambli" }],
  ["uc gota", { status: "under-construction", area: "gota" }],
  ["rtm 3 bhk", { status: "ready", bhk: 3 }],
  ["6 bhk", { bhk: 5 }], // 5+ is the largest option
]

for (const [text, expected] of cases) {
  test(`parses "${text}"`, () => {
    assert.deepEqual(filtersOf(text), expected)
  })
}

// ---- Budget words need a number after them ----
test('"3 bhk from thaltej" sets the area only, no minimum', () => {
  assert.deepEqual(filtersOf("3 bhk from thaltej"), { bhk: 3, area: "thaltej" })
})

test('"flats from 60 lakh" sets a minimum only', () => {
  assert.deepEqual(filtersOf("flats from 60 lakh"), { min: 6000000 })
})

test('"under construction" is a status, not a budget', () => {
  assert.equal(filtersOf("under construction").max, undefined)
})

// ---- Short aliases only as whole tokens ----
test("short aliases never match inside other words", () => {
  assert.deepEqual(filtersOf("sbrx"), {})
  assert.deepEqual(filtersOf("lucknow"), {}) // contains "uc"
  assert.deepEqual(filtersOf("startman"), {}) // contains "rtm"
})

// ---- Priority and ambiguity ----
test("an exact name beats a fuzzy match", () => {
  assert.deepEqual(filtersOf("gota"), { area: "gota" })
})

test("a token equally close to two places matches neither", () => {
  const targets = [
    { word: "gotri", key: "area", id: "gotri" },
    { word: "gotra", key: "area", id: "gotra" },
  ]
  assert.equal(fuzzyMatch("gotrx", targets), null)
  assert.deepEqual(fuzzyMatch("gotrii", targets), targets[0])
})

test("labels describe each part in reading order", () => {
  assert.deepEqual(
    parseQuery("3 bhk thaltej under 1.2 cr ready").parts.map((part) => part.label),
    ["3 BHK", "Thaltej", "under ₹1.2 Cr", "Ready to move"] // formatCompactINR keeps "1.2 Cr" together
  )
})

// ---- Nothing should match ----
for (const text of ["hello", "best flats near metro", "123", "cheap house please", "under", ""]) {
  test(`"${text}" yields no filters`, () => {
    const result = parseQuery(text)
    assert.deepEqual(result.filters, {})
    assert.equal(result.hasFilters, false)
  })
}

test("a status no project has is ignored", () => {
  assert.deepEqual(filtersOf("new launch in gota"), { area: "gota" })
})
