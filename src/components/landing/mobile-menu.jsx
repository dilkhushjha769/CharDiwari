"use client"

import { Menu } from "lucide-react"
import { useState } from "react"
import { Drawer } from "vaul"
import { Button } from "@/components/ui/button"
import { site } from "@/config/site"
import { usePauseSmoothScroll, useScrollToSection } from "@/hooks/use-smooth-scroll"
import { focusPanel } from "./enquiry"

// vaul's close transition. It restores the page scroll when it finishes.
const DRAWER_CLOSE_MS = 500

export function MobileMenu({ links }) {
  const [open, setOpen] = useState(false)
  const scrollToSection = useScrollToSection()
  usePauseSmoothScroll(open)

  function goTo(event, sectionId) {
    // Keep Lenis's own anchor handling out of it; we scroll once the drawer is gone.
    event.preventDefault()
    event.stopPropagation()
    setOpen(false)
    window.setTimeout(() => requestAnimationFrame(() => scrollToSection(sectionId)), DRAWER_CLOSE_MS)
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger
        className="-mr-2 inline-flex size-10 items-center justify-center rounded-lg transition-transform duration-150 ease-out-strong active:scale-[0.97] md:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <Drawer.Content
          onOpenAutoFocus={focusPanel}
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-background px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none">
          <Drawer.Handle className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-muted" />
          <Drawer.Title className="sr-only">Menu</Drawer.Title>
          <Drawer.Description className="sr-only">Jump to a section of the page</Drawer.Description>
          <nav aria-label="Mobile">
            <ul className="divide-y divide-border">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(event) => goTo(event, link.href.slice(1))}
                    className="flex py-4 text-lg font-medium active:opacity-60"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Button
            variant="outline"
            size="lg"
            className="mt-4 h-12 text-base"
            render={<a href={`tel:${site.phone.href}`} />}
            nativeButton={false}
          >
            Call {site.phone.display}
          </Button>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
