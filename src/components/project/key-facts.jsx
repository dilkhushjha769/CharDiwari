"use client"

import { useState } from "react"
import { AreaFlow } from "@/components/landing/flow-number"
import { convertArea } from "@/lib/calculators"
import { formatPriceRange, formatRange } from "@/lib/format"
import { cn } from "@/lib/utils"

// Carpet area is stored in sq ft; the toggle only changes how it's shown.
const units = [
  { id: "sqft", label: "sq ft" },
  { id: "sqyd", label: "sq yd" },
  { id: "sqm", label: "sq m" },
]

const round = (value, unit) => (unit === "sqft" ? Math.round(value / 10) * 10 : Math.round(value))

function Fact({ label, children, className }) {
  return (
    <div className={cn("bg-background px-4 py-3", className)}>
      <dt className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-base font-semibold tabular-nums sm:text-lg">{children}</dd>
    </div>
  )
}

export function KeyFacts({ project, detail }) {
  const [unit, setUnit] = useState("sqft")
  const [low, high] = project.carpetSqft.map((sqft) => round(convertArea(sqft, "sqft", unit), unit))

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {/* A 1px gap over the border colour draws the rules between cells. */}
      <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
        <Fact label="Price">{formatPriceRange(project.priceMin, project.priceMax)}</Fact>
        <Fact label="Configuration">{formatRange(project.bhk, "BHK")}</Fact>
        <Fact label={`Carpet area (${units.find((item) => item.id === unit).label})`}>
          <AreaFlow value={low} />–<AreaFlow value={high} />
        </Fact>
        <Fact label="Status">{project.status === "ready" ? "Ready to move" : "Under construction"}</Fact>
        <Fact label="Possession">{project.possession ?? "Immediate"}</Fact>
        <Fact label="Launched">{detail.launched ?? "—"}</Fact>
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2">
        <p className="text-xs text-muted-foreground">Carpet area, excluding walls and common areas.</p>
        <div role="group" aria-label="Area unit" className="flex shrink-0 rounded-full border border-border p-0.5">
          {units.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={unit === item.id}
              onClick={() => setUnit(item.id)}
              className="min-h-9 rounded-full px-2.5 text-xs font-medium text-muted-foreground outline-none transition-[transform,background-color,color] duration-150 ease-out-strong hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] aria-pressed:bg-foreground aria-pressed:text-background"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
