import { localities } from "../data/localities.js"
import { projects } from "../data/projects.js"
import { formatCompactINR } from "./format.js"

// Turns a typed search like "3 bhk thaltej under 1.2 cr" into project filters.
// Pure and deterministic: no network, no AI. Words it doesn't understand are
// ignored, and anything ambiguous is left out rather than guessed.

const UNITS = {
  cr: 1e7, crs: 1e7, crore: 1e7, crores: 1e7,
  l: 1e5, lac: 1e5, lacs: 1e5, lakh: 1e5, lakhs: 1e5, lk: 1e5, lkh: 1e5,
}
const BHK_WORDS = new Set(["bhk", "bed", "beds", "bedroom", "bedrooms", "rk"])
const MAX_BEFORE = new Set(["under", "below", "upto", "within", "max", "maximum", "lessthan", "budget"])
const MIN_BEFORE = new Set(["above", "over", "morethan", "min", "minimum", "from", "starting"])
const MAX_AFTER = new Set(["tak", "max", "maximum"])
const MIN_AFTER = new Set(["plus", "above", "onwards", "seupar", "sezyada"])
const RANGE_JOINERS = new Set(["to", "-", "se", "and"])

// Statuses, longest phrase first. Short aliases only ever match whole tokens.
const STATUS_PHRASES = [
  { words: ["ready", "to", "move"], status: "ready" },
  { words: ["possession", "now"], status: "ready" },
  { words: ["under", "construction"], status: "under-construction" },
  { words: ["new", "launch"], status: "new-launch" },
  { words: ["ready"], status: "ready" },
  { words: ["rtm"], status: "ready" },
  { words: ["uc"], status: "under-construction" },
  { words: ["upcoming"], status: "under-construction" },
]
const STATUS_LABELS = {
  ready: "Ready to move",
  "under-construction": "Under construction",
  "new-launch": "New launch",
}
const STATUSES_IN_DATA = new Set(projects.map((project) => project.status))

const LOCALITY_ALIASES = { sbr: "sindhu-bhavan-road", sgh: "sg-highway" }

// Words that say nothing about the filters, including common Hinglish fillers.
const FILLERS = new Set([
  "in", "at", "near", "for", "a", "an", "the", "with", "of", "and", "or", "i", "want", "need", "looking",
  "show", "me", "mein", "mai", "main", "ka", "ki", "ke", "chahiye", "wala", "wale", "wali",
  "flat", "flats", "apartment", "apartments", "home", "homes", "house", "houses", "property", "properties",
  "between", "budget", "price", "rs", "inr", "rupees", "only", "please", "best", "good", "cheap", "nice",
  "under", "below", "above", "from", "upto", "within",
])

// Project-name words too common to identify a project on their own.
const GENERIC_PROJECT_WORDS = new Set([
  "heights", "park", "greens", "residency", "skyline", "crest", "the", "towers", "tower", "homes",
  "city", "elan", "enclave", "apartments", "residences",
])

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/₹|\brs\.?(?=\s*\d)/g, " ")
    .replace(/(\d),(?=\d)/g, "$1") // 75,00,000 -> 7500000
    .replace(/([a-z])-([a-z])/g, "$1 $2") // sindhu-bhavan-road
    .replace(/[–—-]/g, " - ")
    .replace(/([a-z0-9])\s*\+/g, "$1 plus") // "1 cr+" means from 1 Cr
    .replace(/(\d)([a-z])/g, "$1 $2") // 3bhk, 80l, 1.2cr
    .replace(/[^a-z0-9.\s-]/g, " ")
    .replace(/\bup to\b/g, "upto")
    .replace(/\bless than\b/g, "lessthan")
    .replace(/\bmore than\b/g, "morethan")
    .replace(/\bse (upar|uper|zyada|jyada)\b/g, "seupar")
    .split(/\s+/)
    .filter(Boolean)
}

const isNumber = (token) => /^\d+(\.\d+)?$/.test(token ?? "")

// Optimal string alignment distance (Damerau-Levenshtein with adjacent swaps).
function editDistance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) rows[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1)
      }
    }
  }
  return rows[a.length][b.length]
}

const allowedTypos = (word) => (word.length >= 8 ? 2 : 1)

// The single closest target within the typo allowance, or null when there is
// none or when two targets are equally close (never guess between them).
export function fuzzyMatch(token, targets) {
  let best = Infinity
  let matches = []
  for (const target of targets) {
    const distance = editDistance(token, target.word)
    if (distance > allowedTypos(target.word)) continue
    if (distance < best) [best, matches] = [distance, [target]]
    else if (distance === best) matches.push(target)
  }
  return matches.length === 1 ? matches[0] : null
}

// Name phrases to match exactly, longest first.
const localityPhrases = localities
  .map((locality) => ({ words: normalize(locality.name), id: locality.id }))
  .sort((a, b) => b.words.length - a.words.length)

const projectPhrases = projects
  .flatMap((project) => {
    const words = normalize(project.name)
    const withoutThe = words[0] === "the" ? [{ words: words.slice(1), id: project.id }] : []
    return [{ words, id: project.id }, ...withoutThe]
  })
  .sort((a, b) => b.words.length - a.words.length)

// Words that identify exactly one project ("aaranya", "meridian").
const projectKeywords = new Map()
for (const project of projects) {
  for (const word of normalize(project.name)) {
    if (word.length >= 5 && !GENERIC_PROJECT_WORDS.has(word)) projectKeywords.set(word, project.id)
  }
}

// Fuzzy targets: single-word locality names and project keywords.
const fuzzyTargets = [
  ...localityPhrases.filter((phrase) => phrase.words.length === 1).map((phrase) => ({ word: phrase.words[0], key: "area", id: phrase.id })),
  ...[...projectKeywords].map(([word, id]) => ({ word, key: "project", id })),
]

function findPhrase(tokens, used, words) {
  for (let i = 0; i + words.length <= tokens.length; i++) {
    if (words.every((word, k) => !used[i + k] && tokens[i + k] === word)) return i
  }
  return -1
}

function markUsed(used, start, length) {
  for (let k = 0; k < length; k++) used[start + k] = true
}

function amountAt(tokens, i) {
  const number = Number(tokens[i])
  const multiplier = UNITS[tokens[i + 1]]
  if (multiplier) return { value: Math.round(number * multiplier), number, end: i + 2, unit: multiplier }
  // A bare figure is rupees only when it's clearly a price (₹75,00,000).
  return { value: number >= 100000 ? number : null, number, end: i + 1, unit: null }
}

export function parseQuery(text) {
  const tokens = normalize(text ?? "")
  const used = tokens.map(() => false)
  const filters = {}

  // 1. Status phrases (before "under" can be read as a budget word).
  for (const { words, status } of STATUS_PHRASES) {
    const start = findPhrase(tokens, used, words)
    if (start === -1) continue
    markUsed(used, start, words.length)
    if (!filters.status && STATUSES_IN_DATA.has(status)) filters.status = status
  }

  // 2. Bedrooms: a number followed by bhk/bed/bedroom.
  for (let i = 0; i < tokens.length - 1; i++) {
    if (used[i] || !isNumber(tokens[i]) || !BHK_WORDS.has(tokens[i + 1])) continue
    const bhk = Math.round(Number(tokens[i]))
    if (bhk >= 1 && !filters.bhk) filters.bhk = Math.min(bhk, 5)
    markUsed(used, i, 2)
  }

  // 3. Budget: ranges, qualified amounts, then bare amounts with a unit.
  for (let i = 0; i < tokens.length; i++) {
    if (used[i] || !isNumber(tokens[i])) continue
    const first = amountAt(tokens, i)
    const joiner = tokens[first.end]
    if (RANGE_JOINERS.has(joiner) && isNumber(tokens[first.end + 1])) {
      const second = amountAt(tokens, first.end + 1)
      const low = first.value ?? (second.unit ? Math.round(first.number * second.unit) : null)
      if (low !== null && second.value !== null) {
        filters.min = Math.min(low, second.value)
        filters.max = Math.max(low, second.value)
        let end = second.end
        if (MAX_AFTER.has(tokens[end])) end++
        markUsed(used, i, end - i)
        if (tokens[i - 1] === "between") used[i - 1] = true
        i = end - 1
        continue
      }
    }
    if (first.value === null) continue // "3", "2 bath": not a price
    const before = used[i - 1] ? null : tokens[i - 1]
    const after = tokens[first.end]
    let key = "max"
    if (MIN_BEFORE.has(before) || MIN_AFTER.has(after)) key = "min"
    if (MAX_BEFORE.has(before) || MAX_AFTER.has(after)) key = "max"
    if (filters[key] === undefined) filters[key] = first.value
    markUsed(used, i, first.end - i)
    if (MAX_BEFORE.has(before) || MIN_BEFORE.has(before)) used[i - 1] = true
    if (MAX_AFTER.has(after) || MIN_AFTER.has(after)) used[first.end] = true
    i = first.end - 1
  }

  // 4. Exact names: localities and projects, longest phrase first.
  for (const { words, id } of localityPhrases) {
    const start = findPhrase(tokens, used, words)
    if (start === -1) continue
    markUsed(used, start, words.length)
    filters.area ??= id
  }
  for (const { words, id } of projectPhrases) {
    const start = findPhrase(tokens, used, words)
    if (start === -1) continue
    markUsed(used, start, words.length)
    filters.project ??= id
  }

  // 5. Aliases (whole tokens only), then exact project keywords.
  tokens.forEach((token, i) => {
    if (used[i]) return
    if (LOCALITY_ALIASES[token]) {
      filters.area ??= LOCALITY_ALIASES[token]
      used[i] = true
    } else if (projectKeywords.has(token)) {
      filters.project ??= projectKeywords.get(token)
      used[i] = true
    }
  })

  // 6. Fuzzy, for typos. A token equally close to two places is left alone.
  tokens.forEach((token, i) => {
    if (used[i] || token.length < 5 || FILLERS.has(token) || isNumber(token)) return
    const match = fuzzyMatch(token, fuzzyTargets)
    if (!match) return
    if (filters[match.key] === undefined) filters[match.key] = match.id
    used[i] = true
  })

  return { filters, parts: describe(filters), hasFilters: Object.keys(filters).length > 0 }
}

// Human labels for each parsed filter, in reading order.
export function describe(filters) {
  const parts = []
  if (filters.bhk) parts.push({ key: "bhk", label: filters.bhk >= 5 ? "5+ BHK" : `${filters.bhk} BHK` })
  if (filters.project) parts.push({ key: "project", label: projects.find((p) => p.id === filters.project)?.name })
  if (filters.area) parts.push({ key: "area", label: localities.find((l) => l.id === filters.area)?.name })
  if (filters.min && filters.max) {
    parts.push({ key: "budget", label: `${formatCompactINR(filters.min)} – ${formatCompactINR(filters.max)}` })
  } else if (filters.max) {
    parts.push({ key: "budget", label: `under ${formatCompactINR(filters.max)}` })
  } else if (filters.min) {
    parts.push({ key: "budget", label: `from ${formatCompactINR(filters.min)}` })
  }
  if (filters.status) parts.push({ key: "status", label: STATUS_LABELS[filters.status] })
  return parts
}
