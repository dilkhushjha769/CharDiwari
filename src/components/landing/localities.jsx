import { localities } from "@/data/localities"
import { LocalityButton } from "./locality-button"
import { SectionHeading } from "./section-heading"

export function Localities() {
  return (
    <section id="localities" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="02"
          label="Localities"
          title="Explore by locality"
          text="Every area has its own pace and price. Start with one you know."
        />
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {localities.map((locality) => (
            <li key={locality.id}>
              <LocalityButton id={locality.id}>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-2xl leading-tight font-normal">{locality.name}</span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {locality.projects} projects
                  </span>
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{locality.note}</span>
              </LocalityButton>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
