import { Suspense } from "react"
import { BudgetScale, BudgetScaleFallback } from "./budget-scale"
import { SectionHeading } from "./section-heading"

export function BudgetScaleSection() {
  return (
    // One hairline inside the content column, so the hero flows straight in
    // instead of stepping into a new band. "00" is the set's cover sheet.
    <section id="budget" className="border-b border-border">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="border-t border-border/70 py-12 md:py-16">
          <SectionHeading
            index="00"
            label="Budget to scale"
            title="What your budget buys"
            text="The carpet area your budget gets in each locality, drawn to scale. Tap one to see its projects."
          />
          {/* Reads the budget from the URL, so it needs its own boundary. */}
          <Suspense fallback={<BudgetScaleFallback />}>
            <BudgetScale />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
