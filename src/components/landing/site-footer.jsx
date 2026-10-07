import { cacheLife } from "next/cache"
import { site } from "@/config/site"
import { Logo, navLinks } from "./site-header"

async function CopyrightYear() {
  "use cache"
  cacheLife("days")
  return new Date().getFullYear()
}

export function SiteFooter() {
  const { address } = site

  return (
    <footer className="border-t border-border pb-24 md:pb-0">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="grid content-start gap-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            Verified homes and honest advice across Ahmedabad and Gandhinagar.
          </p>
          <address className="max-w-sm text-sm text-muted-foreground not-italic">
            {address.street}, {address.city}, {address.region} {address.postalCode}
          </address>
        </div>

        <nav aria-label="Footer" className="grid content-start gap-2 text-sm">
          <p className="font-medium">Explore</p>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="grid content-start gap-2 text-sm">
          <p className="font-medium">Contact</p>
          <a href={`tel:${site.phone.href}`} className="text-muted-foreground hover:text-foreground">
            {site.phone.display}
          </a>
          <a href={`mailto:${site.email}`} className="text-muted-foreground hover:text-foreground">
            {site.email}
          </a>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:px-6 md:flex-row md:justify-between">
          <p>
            © <CopyrightYear /> {site.legalName}
          </p>
          <p className="break-all">
            RERA:{" "}
            <a href={site.rera.portal} target="_blank" rel="noreferrer" className="font-mono hover:text-foreground">
              {site.rera.number}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
