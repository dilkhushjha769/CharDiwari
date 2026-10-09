import Image from "next/image"
import render from "@/assets/rentals/rashmi-prime-render.webp"
import { ContactButtons, ListedBy, officeFacts, Rent } from "./office-facts"

// Option A: a compact card in the same drawing-sheet style as the project
// cards, so rentals can sit in a grid next to sale listings.
export function OfficeCard({ office }) {
  return (
    <article className="flex max-w-sm flex-col rounded-2xl border border-border bg-card p-2.5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/70">
        <Image
          src={render}
          alt={`${office.building} building, architect's render`}
          fill
          placeholder="blur"
          sizes="(min-width: 640px) 24rem, calc(100vw - 2rem)"
          className="object-cover object-top"
        />
        <span className="absolute top-3 left-3 rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
          For rent · Office
        </span>
        <span className="absolute right-3 bottom-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur">
          Building render · office photos soon
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-2 pt-3 pb-1.5">
        <div>
          <h3 className="font-display text-[1.65rem] leading-tight font-normal">{office.building}</h3>
          <p className="text-sm text-muted-foreground">{office.location}</p>
        </div>
        <Rent office={office} />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {officeFacts(office).map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{fact.label}</dt>
              <dd className="font-medium text-pretty">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <ContactButtons office={office} className="mt-auto" />
        <ListedBy office={office} />
      </div>
    </article>
  )
}
