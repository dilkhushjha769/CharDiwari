import assert from "node:assert/strict"
import { test } from "node:test"
import {
  affordability,
  convertArea,
  loanSummary,
  maxLoanForEmi,
  monthlyEmi,
  repaymentSchedule,
} from "./calculators.js"

test("EMI matches the VitalSpace calculator example", () => {
  // ₹99 L at 8.5% for 21 years: their calculator shows ₹84,372 a month.
  const { emi, totalInterest, totalPayable } = loanSummary(9900000, 8.5, 21)
  assert.equal(Math.round(emi), 84372)
  assert.ok(Math.abs(totalPayable - 21261664) < 100)
  assert.ok(Math.abs(totalInterest - 11361664) < 100)
})

test("EMI handles zero interest and empty loans", () => {
  assert.equal(monthlyEmi(1200000, 0, 10), 10000)
  assert.equal(monthlyEmi(0, 8.5, 20), 0)
  assert.equal(monthlyEmi(1000000, 8.5, 0), 0)
})

test("schedule without extra payments clears the loan on time", () => {
  const { rows, months, totalInterest } = repaymentSchedule(9900000, 8.5, 21)
  assert.equal(months, 252)
  assert.equal(rows.length, 21)
  assert.ok(rows.at(-1).balance < 1)
  assert.ok(Math.abs(totalInterest - loanSummary(9900000, 8.5, 21).totalInterest) < 100)
})

test("extra yearly payments shorten the loan and cut interest", () => {
  const base = repaymentSchedule(5000000, 8.5, 20)
  const extra = repaymentSchedule(5000000, 8.5, 20, 100000)
  assert.ok(extra.months < base.months)
  assert.ok(extra.totalInterest < base.totalInterest)
  assert.ok(extra.rows.at(-1).balance < 1)
})

test("max loan is the inverse of the EMI formula", () => {
  const emi = monthlyEmi(4000000, 9, 20)
  assert.ok(Math.abs(maxLoanForEmi(emi, 9, 20) - 4000000) < 1)
})

test("affordability keeps all EMIs within half of income", () => {
  const result = affordability({
    income: 200000,
    existingEmis: 20000,
    annualRatePct: 8.5,
    years: 20,
    downPaymentPct: 20,
  })
  assert.equal(result.emi, 80000)
  assert.ok(Math.abs(result.price - result.loan / 0.8) < 1)
})

test("affordability is zero when existing EMIs use up the budget", () => {
  const result = affordability({
    income: 50000,
    existingEmis: 30000,
    annualRatePct: 8.5,
    years: 20,
    downPaymentPct: 20,
  })
  assert.equal(result.loan, 0)
  assert.equal(result.price, 0)
})

test("area conversions", () => {
  assert.equal(convertArea(1, "sqyd", "sqft"), 9)
  assert.equal(convertArea(1, "acre", "sqft"), 43560)
  assert.ok(Math.abs(convertArea(1, "sqm", "sqft") - 10.7639) < 0.0001)
  assert.ok(Math.abs(convertArea(1, "hectare", "acre") - 2.4711) < 0.0001)
})
