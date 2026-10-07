import { MessageCircle, Phone } from "lucide-react"
import { site, whatsappLink } from "@/config/site"
import { ActionBarShell } from "./action-bar-shell"
import { EnquireButton } from "./enquiry"

const secondaryClass =
  "flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-medium transition-transform duration-150 ease-out-strong active:scale-[0.97]"

// Thumb-reachable actions on phones. Hidden from md up, where the header has them.
export function MobileActionBar() {
  return (
    <ActionBarShell>
      <div className="flex gap-2">
        <a href={`tel:${site.phone.href}`} className={secondaryClass}>
          <Phone className="size-4" aria-hidden="true" />
          Call
        </a>
        <a
          href={whatsappLink(`Hi ${site.name}, I'm looking for a home.`)}
          target="_blank"
          rel="noreferrer"
          className={secondaryClass}
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          WhatsApp
        </a>
        <EnquireButton size="lg" className="h-12 flex-[1.4] rounded-xl text-sm" topic="Help finding a home">
          Enquire
        </EnquireButton>
      </div>
    </ActionBarShell>
  )
}
