// Pure maths behind the landing page calculators. No UI, no formatting.

function monthlyRate(annualRatePct) {
  return annualRatePct / 12 / 100
}

export function monthlyEmi(principal, annualRatePct, years) {
  const months = Math.round(years * 12)
  if (principal <= 0 || months <= 0) return 0
  const r = monthlyRate(annualRatePct)
  if (r === 0) return principal / months
  const growth = (1 + r) ** months
  return (principal * r * growth) / (growth - 1)
}

export function loanSummary(principal, annualRatePct, years) {
  const emi = monthlyEmi(principal, annualRatePct, years)
  const totalPayable = emi * Math.round(years * 12)
  return {
    emi,
    totalPayable,
    totalInterest: Math.max(0, totalPayable - principal),
  }
}

// Pays the loan month by month at a fixed EMI. `extraPerYear` is an optional
// lump sum paid at the end of every 12th month, which shortens the tenure.
export function repaymentSchedule(principal, annualRatePct, years, extraPerYear = 0) {
  const emi = monthlyEmi(principal, annualRatePct, years)
  const r = monthlyRate(annualRatePct)
  const maxMonths = Math.round(years * 12)
  const rows = []
  let balance = principal
  let month = 0
  let totalInterest = 0
  let row = { year: 1, principal: 0, interest: 0, balance }

  while (balance > 0.5 && month < maxMonths) {
    month += 1
    const interest = balance * r
    let principalPaid = Math.min(emi - interest, balance)
    if (month % 12 === 0 && extraPerYear > 0) {
      principalPaid = Math.min(principalPaid + extraPerYear, balance)
    }
    balance -= principalPaid
    totalInterest += interest
    row.principal += principalPaid
    row.interest += interest
    row.balance = Math.max(0, balance)

    if (month % 12 === 0 || balance <= 0.5) {
      rows.push(row)
      row = { year: row.year + 1, principal: 0, interest: 0, balance }
    }
  }

  return { rows, months: month, totalInterest }
}

// Lenders generally cap all EMIs at about half of monthly income (FOIR).
export const MAX_EMI_SHARE_OF_INCOME = 0.5

export function maxLoanForEmi(emi, annualRatePct, years) {
  const months = Math.round(years * 12)
  if (emi <= 0 || months <= 0) return 0
  const r = monthlyRate(annualRatePct)
  if (r === 0) return emi * months
  const growth = (1 + r) ** months
  return (emi * (growth - 1)) / (r * growth)
}

export function affordability({ income, existingEmis, annualRatePct, years, downPaymentPct }) {
  const emi = Math.max(0, income * MAX_EMI_SHARE_OF_INCOME - existingEmis)
  const loan = maxLoanForEmi(emi, annualRatePct, years)
  const price = downPaymentPct >= 100 ? 0 : loan / (1 - downPaymentPct / 100)
  return { emi, loan, price }
}

// Each unit's size in square feet. 1 sq m is exactly 1 / 0.09290304 sq ft.
const SQFT_PER_SQM = 1 / 0.09290304

export const areaUnits = [
  { id: "sqft", label: "Square feet", short: "sq ft", sqft: 1 },
  { id: "sqyd", label: "Square yards (gaj)", short: "sq yd", sqft: 9 },
  { id: "sqm", label: "Square metres", short: "sq m", sqft: SQFT_PER_SQM },
  { id: "acre", label: "Acres", short: "acre", sqft: 43560 },
  { id: "hectare", label: "Hectares", short: "ha", sqft: 10000 * SQFT_PER_SQM },
]

export function convertArea(value, fromId, toId) {
  const from = areaUnits.find((unit) => unit.id === fromId)
  const to = areaUnits.find((unit) => unit.id === toId)
  if (!from || !to) return NaN
  return (value * from.sqft) / to.sqft
}
