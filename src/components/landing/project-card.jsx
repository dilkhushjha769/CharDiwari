import { BadgeCheck } from "lucide-react"
import Link from "next/link"
import { localityName } from "@/data/localities"
import { formatPriceRange, formatRange, formatNumber } from "@/lib/format"
import { projectHref } from "@/lib/project-url"
import { EnquireButton } from "./enquiry"
import { ProjectArt } from "./project-art"

// Styled like an architect's drawing sheet: sheet number, dimension line and a
// title block. The information is the same as a plain listing card.
export function ProjectCard({ project, sheet }) {
  const area = localityName(project.locality)
  const price = formatPriceRange(project.priceMin, project.priceMax)
  const carpet = `${formatNumber(project.carpetSqft[0])}–${formatNumber(project.carpetSqft[1])} sq ft`

  return (
    <article className="relative flex h-full flex-col rounded-2xl border border-border bg-card p-2.5 transition-[border-color] duration-150 ease-out-strong has-[a[data-card-link]:hover]:border-primary/40">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/70">
        <ProjectArt seed={project.id} />
        <span className="absolute top-3 left-3 rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
          {project.status === "ready" ? "Ready to move" : `Possession ${project.possession}`}
        </span>
        {sheet ? (
          <span className="absolute top-3.5 right-3 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Sheet {String(sheet).padStart(2, "0")}
          </span>
        ) : null}
      </div>

      <p className="flex items-center gap-2 px-2 pt-3 font-mono text-[11px] text-muted-foreground tabular-nums">
        <span className="h-2.5 w-px bg-muted-foreground/60" aria-hidden="true" />
        <span className="h-px flex-1 bg-muted-foreground/35" aria-hidden="true" />
        <span>
          {carpet}
          <span className="sr-only"> carpet area</span>
        </span>
        <span className="h-px flex-1 bg-muted-foreground/35" aria-hidden="true" />
        <span className="h-2.5 w-px bg-muted-foreground/60" aria-hidden="true" />
      </p>

      <div className="flex flex-1 flex-col gap-4 px-2 pt-3 pb-1.5">
        <div>
          {/* The name's link stretches over the whole card; Enquire sits above it. */}
          <h3 className="font-display text-[1.65rem] leading-tight font-normal">
            <Link
              href={projectHref(project)}
              data-card-link
              className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
            >
              {project.name}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground">
            {area} · {project.developer}
          </p>
        </div>

        <dl className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] divide-x divide-border rounded-lg border border-border">
          <div className="px-3 py-2">
            <dt className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Price</dt>
            <dd className="mt-0.5 text-base font-semibold whitespace-nowrap tabular-nums sm:text-lg">{price}</dd>
          </div>
          <div className="px-3 py-2">
            <dt className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              <span aria-hidden="true">Config.</span>
              <span className="sr-only">Configuration</span>
            </dt>
            <dd className="mt-0.5 text-base font-medium whitespace-nowrap sm:text-lg">{formatRange(project.bhk, "BHK")}</dd>
          </div>
        </dl>

        <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <BadgeCheck className="size-3.5 shrink-0 text-success" aria-hidden="true" />
          <span className="truncate">RERA {project.rera}</span>
        </p>

        <EnquireButton
          variant="outline"
          size="lg"
          className="relative z-10 mt-auto h-11 w-full"
          topic={`${project.name}, ${area}`}
          message={`I'd like to know more about ${project.name} (${price}).`}
        >
          Enquire
        </EnquireButton>
      </div>
    </article>
  )
}
