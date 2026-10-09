import { ImageOff, MapPin } from "lucide-react"
import Image from "next/image"
import render from "@/assets/rentals/rashmi-prime-render.webp"
import { ContactButtons, ListedBy, officeFacts, Rent } from "./office-facts"

// Option B: a full listing page. The tall render fills one side; the facts,
// rent and contact sit beside it, with the contact always within reach.
export function OfficeDetail({ office }) {
  return (
    <article className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-10">
      <div className="relative aspect-[1021/1320] overflow-hidden rounded-2xl border border-border md:sticky md:top-24 md:self-start">
        <Image
          src={render}
          alt={`${office.building} building, architect's render`}
          fill
          placeholder="blur"
          sizes="(min-width: 768px) 45vw, calc(100vw - 2rem)"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Office for rent</p>
          <h3 className="mt-3 font-display text-title font-normal">{office.building}</h3>
          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4" aria-hidden="true" />
            {office.location}, Ahmedabad
          </p>
        </div>

        <Rent office={office} />
        <ContactButtons office={office} />

        <dl className="divide-y divide-border rounded-2xl border border-border">
          {officeFacts(office).map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3">
              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dt className="w-28 shrink-0 text-sm text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        {office.interiorPhotos ? null : (
          <p className="flex gap-3 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
            <ImageOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Furniture work is in progress, so office photos aren&apos;t available yet. The picture is the
              building render. Ask for a site visit to see the space.
            </span>
          </p>
        )}

        <ListedBy office={office} />
      </div>
    </article>
  )
}
