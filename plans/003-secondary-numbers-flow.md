# 003 — Secondary calculator figures roll like the headline number

- **Status**: DONE
- **Commit**: 86fdbf1
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 3 files, ~25 lines

## Problem

The EMI figure rolls with NumberFlow, but the Principal, Interest and Total payable values beside it, and every Area converter result, jump as plain text. `CLAUDE.md` section 10 says: "Numbers that change (price, counts, badges) use number-flow."

```jsx
/* src/components/landing/calculator/emi-calculator.jsx:150, 154, 158 — current */
<dd className="font-medium tabular-nums">{formatCompactINR(loan)}</dd>
<dd className="font-medium tabular-nums">{formatCompactINR(totalInterest)}</dd>
<dd className="font-semibold tabular-nums">{formatCompactINR(totalPayable)}</dd>
```

```jsx
/* src/components/landing/calculator/area-converter.jsx:77-79 — current */
<dd className="font-semibold tabular-nums">
  {formatArea(convertArea(size, unit, item.id))}{" "}
  <span className="text-sm font-normal text-muted-foreground">{item.short}</span>
```

`formatArea` (area-converter.jsx:13) uses 4 decimal places for values between 0 and 1, otherwise 2; `en-IN`; and `"–"` for non-finite values.

## Target

- EMI legend: `<CompactRupeeFlow value={loan} />` and so on. `CompactRupeeFlow` already exists in `src/components/landing/flow-number.jsx`, with the same output as `formatCompactINR` and the shared timing `{ duration: 300, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }`.
- A new `AreaFlow({ value, className })` in `flow-number.jsx`: `NumberFlow` with `locales="en-IN"`, `format={{ maximumFractionDigits: value !== 0 && Math.abs(value) < 1 ? 4 : 2 }}`, and the same `transformTiming` and `spinTiming`. The caller keeps `"–"` for non-finite values.
- Unchanged: the affordability sentence (numbers inside prose stay plain) and the donut's SVG label.

## Repo conventions to follow

- `RupeeFlow` and `CompactRupeeFlow` in `flow-number.jsx` share one `timing` constant; reuse it.

## Steps

1. `flow-number.jsx`: add and export `AreaFlow` next to `CountFlow`.
2. `emi-calculator.jsx`: import `CompactRupeeFlow` alongside `RupeeFlow` and swap the three `<dd>` contents. Keep `formatCompactINR`, which the enquiry message still uses.
3. `area-converter.jsx`: import `AreaFlow`. Render `Number.isFinite(v) ? <AreaFlow value={v} /> : "–"`, where `v = convertArea(size, unit, item.id)`. Keep the unit span.

## Boundaries

- Do NOT change any calculation or formatting rule.
- If a browser test reads these numbers as text, switch it to the accessible name with **the same expected values**. Never loosen an assertion.

## Verification

- **Mechanical**: lint, test and build pass. `drive.mjs` still finds "200 sq yd = 1,800 sq ft" and EMI ₹86,782.
- **Feel check**: drag the rate slider. Principal stays put, while Interest and Total roll with the EMI and never jitter in width (they're `tabular-nums`).
- **Done when**: the accessible names of the legend values equal their `formatCompactINR` strings after a change.
