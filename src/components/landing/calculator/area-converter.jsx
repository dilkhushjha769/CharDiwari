"use client"

import { parseAsFloat, parseAsStringLiteral, useQueryStates } from "nuqs"
import { useId, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { areaUnits, convertArea } from "@/lib/calculators"
import { AreaFlow } from "../flow-number"
import { urlOptions } from "./params"

const unitItems = areaUnits.map((unit) => ({ value: unit.id, label: unit.label }))

// Results roll like the EMI figure; an empty or invalid size shows a dash.
function AreaValue({ value }) {
  return Number.isFinite(value) ? <AreaFlow value={value} /> : "–"
}

export function AreaConverter() {
  const inputId = useId()
  const [draft, setDraft] = useState(null)
  const [{ size, unit }, setState] = useQueryStates(
    {
      size: parseAsFloat.withDefault(1000),
      unit: parseAsStringLiteral(areaUnits.map((item) => item.id)).withDefault("sqft"),
    },
    urlOptions
  )

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="grid content-start gap-4 rounded-2xl border border-border p-5 sm:p-6">
        <Label htmlFor={inputId} className="text-sm font-medium">
          Area to convert
        </Label>
        <div className="flex gap-2">
          <Input
            id={inputId}
            type="number"
            inputMode="decimal"
            min="0"
            value={draft ?? String(size)}
            onChange={(event) => {
              // Keep what's typed (even an empty field) and only store valid numbers.
              setDraft(event.target.value)
              const next = event.target.valueAsNumber
              if (Number.isFinite(next) && next >= 0) setState({ size: next })
            }}
            onBlur={() => setDraft(null)}
            className="h-11 flex-1 text-base tabular-nums"
          />
          <Select items={unitItems} value={unit} onValueChange={(next) => setState({ unit: next })}>
            <SelectTrigger className="h-11 w-48 data-[size=default]:h-11" aria-label="Unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Gaj is the local name for a square yard. Land units like vigha differ by district, so ask us for
          those.
        </p>
      </div>

      <dl className="grid content-start gap-1 rounded-2xl bg-muted/50 p-5 sm:p-6" aria-live="polite">
        {areaUnits
          .filter((item) => item.id !== unit)
          .map((item) => (
            <div key={item.id} className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-0">
              <dt className="text-sm text-muted-foreground">{item.label}</dt>
              <dd className="font-semibold tabular-nums">
                <AreaValue value={convertArea(size, unit, item.id)} />{" "}
                <span className="text-sm font-normal text-muted-foreground">{item.short}</span>
              </dd>
            </div>
          ))}
      </dl>
    </div>
  )
}
