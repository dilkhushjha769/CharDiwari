import {
  Armchair,
  Baby,
  BadgeCheck,
  Building2,
  Bus,
  Camera,
  Dumbbell,
  Flower2,
  Footprints,
  GraduationCap,
  Hospital,
  Phone,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Train,
  TrainFront,
  Trophy,
  Users,
  Waves,
  Zap,
  Car,
  PartyPopper,
  ArrowUpRight,
  Check,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { site } from "@/config/site"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

// One section of the project page. min-w-0 lets wide content (the towers
// table) scroll inside its own box instead of widening the page on phones.
// scroll-mt clears the header and the
// sticky section nav (both heights are on the page wrapper as --project-sticky).
export function ProjectSection({ id, title, children, className }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("min-w-0 scroll-mt-(--project-sticky) border-t border-border pt-10 pb-2", className)}>
      <h2 id={`${id}-title`} className="font-display text-heading font-normal">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function Overview({ detail }) {
  return (
    <>
      {detail.description ? <p className="max-w-2xl text-lead text-pretty text-muted-foreground">{detail.description}</p> : null}
      {detail.highlights?.length ? (
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {detail.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              {highlight}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
}

// Scrolls sideways inside its own box on phones, never the page.
export function Towers({ towers, projectName }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border" tabIndex={0} role="region" aria-label="Towers table">
      <table className="w-full min-w-[32rem] text-left text-sm tabular-nums">
        <caption className="sr-only">Towers at {projectName}</caption>
        <thead className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          <tr className="border-b border-border">
            <th scope="col" className="px-4 py-3 font-normal">Tower</th>
            <th scope="col" className="px-4 py-3 font-normal">Homes</th>
            <th scope="col" className="px-4 py-3 font-normal">Per floor</th>
            <th scope="col" className="px-4 py-3 font-normal">Lifts</th>
            <th scope="col" className="px-4 py-3 font-normal">Height</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {towers.map((tower) => (
            <tr key={tower.name}>
              <th scope="row" className="px-4 py-3 font-medium">{tower.name}</th>
              <td className="px-4 py-3">{tower.bhk}</td>
              <td className="px-4 py-3">{tower.unitsPerFloor}</td>
              <td className="px-4 py-3">{tower.lifts}</td>
              <td className="px-4 py-3">{tower.floors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const amenityList = {
  gym: { label: "Gymnasium", icon: Dumbbell },
  pool: { label: "Swimming pool", icon: Waves },
  clubhouse: { label: "Clubhouse", icon: Building2 },
  spa: { label: "Spa", icon: Sparkles },
  garden: { label: "Garden", icon: Flower2 },
  "kids-play": { label: "Children's play area", icon: Baby },
  jogging: { label: "Jogging track", icon: Footprints },
  "indoor-games": { label: "Indoor games", icon: Trophy },
  banquet: { label: "Banquet hall", icon: PartyPopper },
  security: { label: "24×7 security", icon: ShieldCheck },
  "power-backup": { label: "Power backup", icon: Zap },
  parking: { label: "Covered parking", icon: Car },
  cctv: { label: "CCTV", icon: Camera },
  intercom: { label: "Intercom", icon: Phone },
  "senior-sitout": { label: "Senior citizen sit-out", icon: Armchair },
}

const SHOWN = 8

function AmenityGrid({ ids }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
      {ids.map((id) => {
        const amenity = amenityList[id] ?? { label: id, icon: Users }
        const Icon = amenity.icon
        return (
          <li key={id} className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm">
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            {amenity.label}
          </li>
        )
      })}
    </ul>
  )
}

export function Amenities({ amenities }) {
  const rest = amenities.slice(SHOWN)
  return (
    <>
      <AmenityGrid ids={amenities.slice(0, SHOWN)} />
      {rest.length ? (
        <Accordion>
          <AccordionItem value="more" className="border-none">
            <AccordionTrigger className="mt-2 w-auto justify-start gap-2 py-3 text-sm font-medium hover:no-underline">
              Show all {amenities.length} amenities
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <AmenityGrid ids={rest} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </>
  )
}

const nearbyIcons = { school: GraduationCap, hospital: Hospital, mall: ShoppingBag, metro: TrainFront, railway: Train, airport: Plane }

export function Location({ detail }) {
  const nearby = [...(detail.nearby ?? [])].sort((a, b) => a.km - b.km)
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div>
        <p className="font-medium">{detail.address}</p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.address)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Directions on Google Maps
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </a>
      </div>
      {nearby.length ? (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {nearby.map((place) => {
            const Icon = nearbyIcons[place.type] ?? Bus
            return (
              <li key={place.name} className="flex items-center gap-3 px-4 py-3 text-sm">
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="flex-1">{place.name}</span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{place.km} km</span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export function Rera({ project, detail }) {
  const facts = [
    detail.totalUnits && ["Total homes", formatNumber(detail.totalUnits)],
    detail.siteAreaSqyd && ["Site area", `${formatNumber(detail.siteAreaSqyd)} sq yd`],
    detail.launched && ["Launched", detail.launched],
  ].filter(Boolean)

  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <BadgeCheck className="size-4 text-success" aria-hidden="true" />
        RERA registered
      </p>
      <p className="mt-2 font-mono text-sm break-all">{project.rera}</p>
      <a
        href={site.rera.portal}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Verify on GujRERA
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </a>
      {facts.length ? (
        <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{label}</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  )
}

export function Disclaimer() {
  return (
    <p className="border-t border-border pt-6 text-xs text-pretty text-muted-foreground">
      Disclaimer: {site.legalName} is a RERA-registered agent and does not represent the developer. Prices, areas,
      plans and amenities are indicative, can change and must be confirmed with the developer and on the GujRERA
      portal before you book. Pictures are illustrations.
    </p>
  )
}
