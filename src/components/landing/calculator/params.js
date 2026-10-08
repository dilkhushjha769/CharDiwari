"use client"

import { parseAsFloat, parseAsInteger, throttle } from "nuqs"

// Loan assumptions shared by the EMI and affordability tabs.
export const loanParsers = {
  rate: parseAsFloat.withDefault(8.5),
  yrs: parseAsInteger.withDefault(20),
  down: parseAsInteger.withDefault(20),
}

export const urlOptions = {
  history: "replace",
  scroll: false,
  limitUrlUpdates: throttle(300),
}

// Switches the calculator tab from outside it (the header menu), keeping every
// other param. Next.js syncs replaceState into useSearchParams, so the tabs
// (nuqs, "?calc=") follow without a navigation.
export function replaceCalculatorTab(tab) {
  const params = new URLSearchParams(window.location.search)
  if (tab === "emi") params.delete("calc")
  else params.set("calc", tab)
  const query = params.toString()
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname)
}

export const limits = {
  price: { min: 1000000, max: 100000000, step: 50000 },
  down: { min: 10, max: 50, step: 1 },
  rate: { min: 6, max: 14, step: 0.05 },
  yrs: { min: 5, max: 30, step: 1 },
  extra: { min: 0, max: 1000000, step: 10000 },
  income: { min: 20000, max: 1000000, step: 1000 },
  emis: { min: 0, max: 300000, step: 1000 },
}
