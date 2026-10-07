const LAKH = 1e5
const CRORE = 1e7

const indianNumber = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 })

// ₹84,372 · ₹99,00,000
export function formatINR(value) {
  return `₹${indianNumber.format(Math.round(value))}`
}

function trimDecimals(value) {
  return value.toFixed(2).replace(/\.?0+$/, "")
}

// Non-breaking space, so "₹21.53 L" never wraps between number and unit.
const NBSP = " "

// ₹84,372 · ₹99 L · ₹1.13 Cr
export function formatCompactINR(value) {
  if (value >= CRORE) return `₹${trimDecimals(value / CRORE)}${NBSP}Cr`
  if (value >= LAKH) return `₹${trimDecimals(value / LAKH)}${NBSP}L`
  return formatINR(value)
}

// ₹1.85 – 2.75 Cr · ₹46 – 79 L · ₹78 L – 1.2 Cr
export function formatPriceRange(min, max) {
  if (min >= CRORE) return `₹${trimDecimals(min / CRORE)} – ${trimDecimals(max / CRORE)}${NBSP}Cr`
  if (max < CRORE) return `₹${trimDecimals(min / LAKH)} – ${trimDecimals(max / LAKH)}${NBSP}L`
  return `${formatCompactINR(min)} – ${formatCompactINR(max).slice(1)}`
}

// 2 BHK · 2–3 BHK
export function formatRange(values, suffix) {
  const low = Math.min(...values)
  const high = Math.max(...values)
  return low === high ? `${low} ${suffix}` : `${low}–${high} ${suffix}`
}

export function formatNumber(value) {
  return indianNumber.format(value)
}
