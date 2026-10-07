import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { site } from "@/config/site"
import { EnquireButton } from "./enquiry"
import { ThemeToggle } from "@/components/providers/theme-toggle"
import { MobileMenu } from "./mobile-menu"

export const navLinks = [
  { href: "#projects", label: "Projects" },
  { href: "#localities", label: "Localities" },
  { href: "#calculator", label: "EMI calculator" },
  { href: "#faq", label: "FAQ" },
]

export function Logo() {
  return (
    <a href="#top" className="text-lg font-semibold tracking-tight" aria-label={`${site.name} home`}>
      Vital<span className="text-muted-foreground">Space</span>
    </a>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1 md:gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-2 md:flex">
            <Button
              variant="ghost"
              className="h-9 px-3"
              render={<a href={`tel:${site.phone.href}`} />}
              nativeButton={false}
            >
              <Phone data-icon="inline-start" />
              {site.phone.display}
            </Button>
            <EnquireButton className="h-9 px-4">Talk to an expert</EnquireButton>
          </div>
          <MobileMenu links={navLinks} />
        </div>
      </div>
    </header>
  )
}
