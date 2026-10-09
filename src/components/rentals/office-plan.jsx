import { formatNumber } from "@/lib/format"
import { ContactButtons, ListedBy, officeFacts, Rent } from "./office-facts"

// Option C: no photos yet, so the listing leads with a blueprint drawing of
// what the space holds. The layout is illustrative (the real plan isn't known);
// only the area, cabin, workstation and washroom counts come from the listing.

// 31 x 24 ft is about 742 sq ft. Units in the drawing are feet.
const W = 31
const H = 24
const DESK = { w: 4, d: 2.5 }

const line = { vectorEffect: "non-scaling-stroke", strokeWidth: 1.5 }

function Plan({ office }) {
  const perRow = Math.ceil(office.workstations / 2)
  const desks = Array.from({ length: office.workstations }, (_, index) => ({
    x: 2.5 + (index % perRow) * DESK.w,
    y: index < perRow ? 9 : 9 + DESK.d,
    top: index < perRow,
  }))

  return (
    <svg
      viewBox={`-2.5 -2.5 ${W + 5} ${H + 5}`}
      role="img"
      aria-label={`Illustrative plan: about ${formatNumber(office.areaSqft)} sq ft with ${office.cabins} cabin, ${office.workstations} workstations and ${office.washrooms} washroom`}
      className="w-full"
    >
      {/* Outer walls, with a door gap on the bottom wall. */}
      <path d={`M 0 0 H ${W} V ${H} H 9 M 5 ${H} H 0 Z`} fill="none" className="stroke-foreground" {...line} strokeWidth={3} />
      <path d={`M 5 ${H} A 4 4 0 0 1 9 ${H - 4}`} fill="none" className="stroke-muted-foreground" {...line} strokeWidth={1} />

      {/* Cabin, top right. */}
      <rect x={W - 10} y={0} width={10} height={9} className="fill-primary/10 stroke-primary" {...line} />
      <rect x={W - 7} y={3} width={4} height={2} className="fill-none stroke-primary" {...line} strokeWidth={1} />
      <text x={W - 5} y={7.4} textAnchor="middle" fontSize={1.1} className="fill-primary font-mono">
        CABIN
      </text>

      {/* Washroom, bottom right. */}
      <rect x={W - 6} y={H - 6} width={6} height={6} className="fill-muted stroke-foreground/60" {...line} />
      <text x={W - 3} y={H - 2.6} textAnchor="middle" fontSize={1.1} className="fill-muted-foreground font-mono">
        WC
      </text>

      {/* Workstations: two back-to-back rows, a chair on each open side. */}
      {desks.map((desk, index) => (
        <g key={index}>
          <rect x={desk.x} y={desk.y} width={DESK.w} height={DESK.d} className="fill-background stroke-foreground/70" {...line} strokeWidth={1} />
          <circle cx={desk.x + DESK.w / 2} cy={desk.top ? desk.y - 1 : desk.y + DESK.d + 1} r={0.8} className="fill-none stroke-muted-foreground" {...line} strokeWidth={1} />
        </g>
      ))}
      <text x={2.5 + (perRow * DESK.w) / 2} y={18.5} textAnchor="middle" fontSize={1.1} className="fill-muted-foreground font-mono">
        {office.workstations} WORKSTATIONS
      </text>

      {/* Dimension lines. */}
      {/* vector-effect isn't inherited, so it goes on each path, not the group. */}
      <path
        d={`M 0 -1.4 H ${W / 2 - 3} M ${W / 2 + 3} -1.4 H ${W} M 0 -2 V -0.8 M ${W} -2 V -0.8`}
        fill="none"
        className="stroke-muted-foreground"
        {...line}
        strokeWidth={1}
      />
      <path
        d={`M ${W + 1.4} 0 V ${H} M ${W + 0.8} 0 H ${W + 2} M ${W + 0.8} ${H} H ${W + 2}`}
        fill="none"
        className="stroke-muted-foreground"
        {...line}
        strokeWidth={1}
      />
      <text x={W / 2} y={-1.05} textAnchor="middle" fontSize={0.9} className="fill-muted-foreground font-mono">
        ~{W} FT
      </text>
    </svg>
  )
}

export function OfficePlan({ office }) {
  return (
    <article className="grid gap-6 rounded-2xl border border-border bg-card p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-10 md:p-8">
      <div>
        <div className="bg-blueprint rounded-xl border border-border/70 p-3 md:p-5">
          <Plan office={office} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Illustrative layout, not the actual plan. Counts and area are from the listing.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Office for rent · {office.location}
          </p>
          <h3 className="mt-3 font-display text-title font-normal">{office.building}</h3>
        </div>
        <Rent office={office} />
        <ul className="flex flex-wrap gap-2">
          {officeFacts(office).map(({ icon: Icon, label, value }) => (
            <li key={label} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm">
              <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">{label}: </span>
              {value}
            </li>
          ))}
        </ul>
        <ContactButtons office={office} className="mt-auto" />
        <ListedBy office={office} />
      </div>
    </article>
  )
}
