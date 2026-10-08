"use client"

import NumberFlow from "@number-flow/react"

// Digits roll to the new value instead of jumping, and the width never jitters.
// Reduced motion is respected by NumberFlow itself.
const timing = { duration: 300, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }

const rupees = { style: "currency", currency: "INR", maximumFractionDigits: 0 }

// ₹84,372
export function RupeeFlow({ value, className }) {
  return (
    <NumberFlow
      value={Math.round(value)}
      locales="en-IN"
      format={rupees}
      transformTiming={timing}
      spinTiming={timing}
      className={className}
    />
  )
}

// ₹1.08 Cr · ₹21.53 L. Same output as formatCompactINR, but animated.
export function CompactRupeeFlow({ value, className }) {
  const unit = value >= 1e7 ? { divisor: 1e7, suffix: " Cr" } : value >= 1e5 ? { divisor: 1e5, suffix: " L" } : null
  if (!unit) return <RupeeFlow value={value} className={className} />

  return (
    <NumberFlow
      value={value / unit.divisor}
      locales="en-IN"
      format={{ maximumFractionDigits: 2 }}
      prefix="₹"
      suffix={unit.suffix}
      transformTiming={timing}
      spinTiming={timing}
      className={className}
    />
  )
}

export function CountFlow({ value, className }) {
  return <NumberFlow value={value} transformTiming={timing} spinTiming={timing} className={className} />
}

// 1,800 · 0.0929. Same rounding as the area converter's text: four decimals
// below 1, otherwise two. Pass finite values only.
export function AreaFlow({ value, className }) {
  const digits = value !== 0 && Math.abs(value) < 1 ? 4 : 2
  return (
    <NumberFlow
      value={value}
      locales="en-IN"
      format={{ maximumFractionDigits: digits }}
      transformTiming={timing}
      spinTiming={timing}
      className={className}
    />
  )
}
