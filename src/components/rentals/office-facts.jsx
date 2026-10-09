import { Armchair, Bath, CalendarDays, MessageCircle, Monitor, Phone, Ruler } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { formatINR, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

// Shared by the three listing prototypes, so they differ only in layout.

export function rentPerSqft(office) {
  return Math.round(office.rentMonthly / office.areaSqft)
}

export function officeFacts(office) {
  return [
    { icon: Ruler, label: "Area", value: `${formatNumber(office.areaSqft)} sq ft` },
    { icon: Armchair, label: "Furnishing", value: office.furnishing },
    { icon: Monitor, label: "Seating", value: `${office.cabins} cabin + ${office.workstations} workstations` },
    { icon: Bath, label: "Washroom", value: office.washrooms === 1 ? "1 washroom" : `${office.washrooms} washrooms` },
    { icon: CalendarDays, label: "Possession", value: office.possession },
  ]
}

export function Rent({ office, className }) {
  return (
    <p className={cn("tabular-nums", className)}>
      <span className="font-display text-title font-normal">{formatINR(office.rentMonthly)}</span>
      <span className="text-muted-foreground">/month</span>
      <span className="mt-1 block text-sm text-muted-foreground">
        + {office.rentExtras} · about {formatINR(rentPerSqft(office))}/sq ft
      </span>
    </p>
  )
}

function contactLinks(office) {
  const number = `91${office.listedBy.phone}`
  const message = `Hi ${office.listedBy.person}, I'm interested in the ${office.areaSqft} sq ft office at ${office.building}, ${office.location}.`
  return {
    call: `tel:+${number}`,
    whatsapp: `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
  }
}

export function ContactButtons({ office, className }) {
  const links = contactLinks(office)
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <a href={links.call} className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full px-5")}>
        <Phone data-icon="inline-start" aria-hidden="true" />
        Call {office.listedBy.person.split(" ")[0]}
      </a>
      <a
        href={links.whatsapp}
        target="_blank"
        rel="noreferrer"
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-full px-5")}
      >
        <MessageCircle data-icon="inline-start" aria-hidden="true" />
        WhatsApp
      </a>
    </div>
  )
}

export function ListedBy({ office, className }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Listed by {office.listedBy.agency} · {office.listedBy.person} ·{" "}
      <span className="tabular-nums">+91 {office.listedBy.phone.replace(/(\d{5})(\d{5})/, "$1 $2")}</span>
    </p>
  )
}
