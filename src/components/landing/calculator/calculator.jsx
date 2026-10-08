"use client"

import { parseAsStringLiteral, useQueryState } from "nuqs"
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AffordabilityCalculator } from "./affordability-calculator"
import { AreaConverter } from "./area-converter"
import { EmiCalculator } from "./emi-calculator"

const tabs = [
  { value: "emi", label: "EMI" },
  { value: "budget", label: "Affordability" },
  { value: "area", label: "Area converter" },
]

export function Calculator() {
  const [tab, setTab] = useQueryState(
    "calc",
    parseAsStringLiteral(tabs.map((item) => item.value))
      .withDefault("emi")
      .withOptions({ history: "replace", scroll: false })
  )

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-6">
      <TabsList className="h-11 w-full max-w-md rounded-xl p-1 group-data-horizontal/tabs:h-11">
        {tabs.map((item) => (
          <TabsTrigger key={item.value} value={item.value} className="rounded-lg text-sm">
            {item.label}
          </TabsTrigger>
        ))}
        <TabsIndicator />
      </TabsList>
      <TabsContent value="emi">
        <EmiCalculator />
      </TabsContent>
      <TabsContent value="budget">
        <AffordabilityCalculator />
      </TabsContent>
      <TabsContent value="area">
        <AreaConverter />
      </TabsContent>
    </Tabs>
  )
}

// Same footprint as the calculator, so nothing jumps when it loads.
export function CalculatorFallback() {
  return (
    <div aria-hidden="true" className="grid gap-6">
      <div className="h-11 w-full max-w-md rounded-xl bg-muted" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="h-[34rem] rounded-2xl border border-border" />
        <div className="h-[34rem] rounded-2xl bg-muted/50" />
      </div>
    </div>
  )
}
