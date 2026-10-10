import { MessageCircle, Phone } from "lucide-react"
import { EnquireButton } from "@/components/landing/enquiry"
import { site, whatsappLink } from "@/config/site"
import { formatPriceRange } from "@/lib/format"

const secondaryClass =
  "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium outline-none transition-[transform,background-color] duration-150 ease-out-strong hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]"

// Desktop only (phones get the bottom action bar). Sticks below the header and
// section nav, and has no motion: it's always there while reading.
export function EnquiryCard({ project, topic, message }) {
  return (
    <aside aria-label="Enquire" className="sticky top-[calc(var(--project-sticky)+1rem)] hidden rounded-2xl border border-border bg-card p-5 lg:block">
      <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Price</p>
      <p className="mt-1 font-display text-heading font-normal tabular-nums">
        {formatPriceRange(project.priceMin, project.priceMax)}
      </p>
      <EnquireButton size="lg" className="mt-5 h-11 w-full rounded-xl" topic={topic} message={message}>
        Enquire about {project.name}
      </EnquireButton>
      <div className="mt-2 flex gap-2">
        <a href={`tel:${site.phone.href}`} className={secondaryClass}>
          <Phone className="size-4" aria-hidden="true" />
          Call
        </a>
        <a href={whatsappLink(message)} target="_blank" rel="noreferrer" className={secondaryClass}>
          <MessageCircle className="size-4" aria-hidden="true" />
          WhatsApp
        </a>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Ask about current prices, floor plans or a site visit. We reply on WhatsApp.
      </p>
    </aside>
  )
}
