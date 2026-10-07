import { ArrowUpRight, BadgeCheck } from "lucide-react"
import { site } from "@/config/site"

export function TrustStrip() {
  return (
    // Same paper as the hero, with one hairline rule inside the content column,
    // so the hero flows into the stats instead of stepping into a new band.
    <section aria-label="Why people trust us" className="border-b border-border">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="border-t border-border/70 py-8">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
            {site.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <dt className="order-2 text-sm text-muted-foreground">{stat.label}</dt>
                <dd className="order-1 font-display text-title font-normal tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <BadgeCheck className="size-4 text-success" aria-hidden="true" />
            <span>RERA registered agent</span>
            <span className="font-mono break-all">{site.rera.number}</span>
            <a
              href={site.rera.portal}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-foreground underline-offset-4 hover:underline"
            >
              Verify on GujRERA
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
