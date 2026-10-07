import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { site } from "@/config/site"
import { cn } from "@/lib/utils"
import { EnquireButton } from "./enquiry"
import { ThemeToggle } from "@/components/providers/theme-toggle"
import { HeaderShell } from "./header-shell"
import { MobileMenu } from "./mobile-menu"
import { NavLinks } from "./nav-links"

export const navLinks = [
  { href: "#projects", label: "Projects" },
  { href: "#localities", label: "Localities" },
  { href: "#calculator", label: "EMI calculator" },
  { href: "#faq", label: "FAQ" },
]

// A tall brick tower beside a shorter ink one: the skyline in miniature.
function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <rect x="3.5" y="7.5" width="6" height="11" rx="0.5" fill="none" className="stroke-foreground" strokeWidth="1.25" />
      <rect x="10.5" y="1.5" width="6" height="17" rx="0.5" className="fill-primary" />
    </svg>
  )
}

export function Logo({ className }) {
  return (
    <a
      href="#top"
      aria-label={`${site.name} home`}
      className={cn(
        "inline-flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <LogoMark className="size-5 shrink-0" />
      <span className="font-display text-[1.6rem] leading-none tracking-tight">
        Vital<span className="italic">Space</span>
      </span>
    </a>
  )
}

export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr]">
        <Logo className="justify-self-start" />
        <NavLinks links={navLinks} />
        <div className="flex items-center gap-1 justify-self-end md:gap-2">
          <ThemeToggle className="hidden md:inline-flex" />
          <div className="hidden items-center gap-1 md:flex">
            <Button
              variant="ghost"
              size="icon-lg"
              className="rounded-full xl:hidden"
              aria-label={`Call ${site.phone.display}`}
              render={<a href={`tel:${site.phone.href}`} />}
              nativeButton={false}
            >
              <Phone />
            </Button>
            <Button
              variant="ghost"
              className="hidden h-9 rounded-full px-3 xl:inline-flex"
              render={<a href={`tel:${site.phone.href}`} />}
              nativeButton={false}
            >
              <Phone data-icon="inline-start" />
              {site.phone.display}
            </Button>
            <EnquireButton className="h-9 rounded-full px-4">Talk to an expert</EnquireButton>
          </div>
          <MobileMenu links={navLinks} />
        </div>
      </div>
    </HeaderShell>
  )
}
