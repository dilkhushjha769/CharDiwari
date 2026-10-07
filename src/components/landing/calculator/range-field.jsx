"use client"

import { useId, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

const LOG_STEPS = 1000

function roundToStep(value, step) {
  const decimals = (String(step).split(".")[1] ?? "").length
  return Number((Math.round(value / step) * step).toFixed(decimals))
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

// A typed number plus a slider for the same value. `scale="log"` gives the
// slider finer control at the low end, useful for prices from ₹10 L to ₹10 Cr.
export function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  formatEdge = format,
  scale = "linear",
  hint,
}) {
  const id = useId()
  const [draft, setDraft] = useState(null)
  const isLog = scale === "log"

  const toPosition = (amount) =>
    isLog ? Math.round((LOG_STEPS * Math.log(amount / min)) / Math.log(max / min)) : amount
  const fromPosition = (position) =>
    clamp(roundToStep(isLog ? min * (max / min) ** (position / LOG_STEPS) : position, step), min, max)

  function commit(text) {
    const amount = parseFloat(text.replace(/[^\d.]/g, ""))
    if (Number.isFinite(amount)) onChange(clamp(roundToStep(amount, step), min, max))
    setDraft(null)
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <Input
          id={id}
          inputMode="decimal"
          value={draft ?? format(value)}
          onFocus={(event) => {
            setDraft(String(value))
            const input = event.currentTarget
            // Select after focus settles, but never re-focus a field that was already left.
            requestAnimationFrame(() => {
              if (document.activeElement === input) input.select()
            })
          }}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
            if (event.key === "Escape") {
              setDraft(null)
              event.currentTarget.blur()
            }
          }}
          className="h-10 w-40 text-right text-base font-medium tabular-nums"
        />
      </div>
      <Slider
        value={toPosition(value)}
        min={isLog ? 0 : min}
        max={isLog ? LOG_STEPS : max}
        step={isLog ? 1 : step}
        onValueChange={(position) => onChange(fromPosition(position))}
        getAriaLabel={() => label}
        getAriaValueText={(_, position) => format(fromPosition(position))}
      />
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{formatEdge(min)}</span>
        {hint ? <span className="text-foreground">{hint}</span> : null}
        <span>{formatEdge(max)}</span>
      </div>
    </div>
  )
}
