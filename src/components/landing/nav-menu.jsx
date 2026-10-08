"use client"

import { NavigationMenu } from "@base-ui/react/navigation-menu"
import { ArrowRight, ChevronDown } from "lucide-react"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"
import { useScrollToSection } from "@/hooks/use-smooth-scroll"
import { replaceProjectFilters } from "@/lib/project-filters"
import { cn } from "@/lib/utils"
import { replaceCalculatorTab } from "./calculator/params"
import { useEnquiry } from "./enquiry"
import { menus } from "./nav-menu-data"

// The desktop header menu: Projects, Localities and Calculators open a
// full-width panel under the header; FAQ is a plain link. Every item is a real
// in-page link (it still jumps without JavaScript) that also applies its
// filter or opens its calculator tab.
//
// Motion: the panel drops in once (200ms, opacity + 6px) and leaves faster
// (150ms, opacity). Moving between menus while it's open only slides the
// content 12px the way you moved, so the bar feels instant after the first
// open. Reduced motion keeps the fades and drops the movement.

const sections = { projects: "projects", localities: "localities", calculators: "calculator", faq: "faq" }
const SLIDE = { type: "spring", duration: 0.35, bounce: 0 }

const triggerClass =
  "relative z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-2 text-sm text-muted-foreground outline-none transition-colors duration-150 ease-out-strong hover:bg-accent/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-accent data-popup-open:text-foreground data-[current=true]:text-foreground"

function useActiveSection() {
  const [active, setActive] = useState(null)
  useEffect(() => {
    const elements = Object.values(sections).map((id) => document.getElementById(id)).filter(Boolean)
    const inBand = new Map()
    // A thin strip just above the middle of the viewport decides the section.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) inBand.set(entry.target.id, entry.isIntersecting)
        setActive(elements.find((element) => inBand.get(element.id))?.id ?? null)
      },
      { rootMargin: "-45% 0px -50% 0px" }
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
  return active
}

export function NavMenu() {
  const active = useActiveSection()
  const reduceMotion = useReducedMotion()
  const scrollToSection = useScrollToSection()
  const openEnquiry = useEnquiry()

  // Apply the item's filter or tab, then scroll once the panel has closed.
  function go(event, { filters, calc, section, enquiry }) {
    if (enquiry) {
      openEnquiry({ topic: enquiry })
      return
    }
    event.preventDefault()
    if (filters) replaceProjectFilters(filters)
    if (calc) replaceCalculatorTab(calc)
    requestAnimationFrame(() => scrollToSection(section))
  }

  const underline = (value) =>
    active === sections[value] && (
      <motion.span
        layoutId="nav-active"
        aria-hidden="true"
        className="absolute inset-x-2.5 -bottom-0.5 z-10 h-0.5 rounded-full bg-primary"
        transition={reduceMotion ? { duration: 0 } : SLIDE}
      />
    )

  return (
    <NavigationMenu.Root aria-label="Main" className="hidden md:block" closeDelay={120}>
      <LayoutGroup id="nav">
        <NavigationMenu.List className="flex items-center gap-1">
          {menus.map((menu) => (
            <NavigationMenu.Item key={menu.value} value={menu.value} className="relative">
              <NavigationMenu.Trigger className={cn(triggerClass, "group")} data-current={active === sections[menu.value]}>
                {menu.label}
                <ChevronDown
                  aria-hidden="true"
                  className="size-3.5 opacity-60 transition-transform duration-200 ease-out-strong group-data-popup-open:rotate-180 motion-reduce:transition-none"
                />
              </NavigationMenu.Trigger>
              {underline(menu.value)}
              <NavigationMenu.Content className="w-full transition-[opacity,translate] duration-200 ease-out-strong data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-150 motion-safe:data-starting-style:data-[activation-direction=left]:-translate-x-3 motion-safe:data-starting-style:data-[activation-direction=right]:translate-x-3 motion-safe:data-ending-style:data-[activation-direction=left]:translate-x-3 motion-safe:data-ending-style:data-[activation-direction=right]:-translate-x-3">
                <MenuPanel menu={menu} onGo={go} />
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          ))}
          <NavigationMenu.Item className="relative">
            <NavigationMenu.Link href="#faq" className={triggerClass} data-current={active === sections.faq}>
              FAQ
            </NavigationMenu.Link>
            {underline("faq")}
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </LayoutGroup>

      <NavigationMenu.Portal>
        <NavigationMenu.Backdrop className="fixed inset-0 z-30 bg-overlay/40 transition-opacity duration-200 ease-out-strong data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-150" />
        <NavigationMenu.Positioner
          anchor={() => document.querySelector("header")}
          side="bottom"
          align="start"
          sideOffset={0}
          positionMethod="fixed"
          collisionPadding={0}
          className="z-40 w-(--anchor-width)"
        >
          <NavigationMenu.Popup className="relative origin-top overflow-hidden border-b border-border bg-background shadow-lg transition-[opacity,translate] duration-200 ease-out-strong data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-150 motion-safe:data-starting-style:-translate-y-1.5">
            <NavigationMenu.Viewport className="relative" />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  )
}

function MenuPanel({ menu, onGo }) {
  const { footer } = menu
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="grid gap-x-12 gap-y-8 pt-8 pb-6 md:grid-cols-2">
        {menu.columns.map((column, index) => (
          <div key={column.label}>
            {/* Same voice as the section headings: a brick index and a mono label. */}
            <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <span className="text-primary">{String(index + 1).padStart(2, "0")}</span>
              <span aria-hidden="true" className="h-px w-4 bg-border" />
              {column.label}
            </p>
            <ul className="mt-3 grid gap-0.5">
              {column.items.map((item) => (
                <li key={item.key}>
                  <MenuItem item={item} onGo={onGo} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border py-4 text-sm">
        <p className="text-muted-foreground">{footer.note}</p>
        <NavigationMenu.Link
          href={`#${footer.link.section}`}
          closeOnClick
          onClick={(event) => onGo(event, footer.link)}
          className="group/footer inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {footer.link.label}
          <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-150 ease-out-strong group-hover/footer:translate-x-0.5" />
        </NavigationMenu.Link>
      </div>
    </div>
  )
}

function MenuItem({ item, onGo }) {
  const Icon = item.icon
  const content = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors duration-150 ease-out-strong group-hover/item:border-primary/40 group-hover/item:text-primary group-focus-visible/item:border-primary/40 group-focus-visible/item:text-primary">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-foreground">{item.title}</span>
          {item.meta ? <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">{item.meta}</span> : null}
        </span>
        <span className="mt-0.5 block text-sm text-pretty text-muted-foreground">{item.description}</span>
      </span>
    </>
  )
  const className =
    "group/item -mx-2.5 flex w-[calc(100%+1.25rem)] items-start gap-3.5 rounded-xl p-2.5 text-left outline-none transition-colors duration-150 ease-out-strong hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:ring-3 focus-visible:ring-ring/50"

  // WhatsApp leaves the site, so it opens in a new tab.
  if (item.external) {
    return (
      <NavigationMenu.Link href={item.external} target="_blank" rel="noreferrer" closeOnClick className={className}>
        {content}
      </NavigationMenu.Link>
    )
  }
  // The enquiry item opens the drawer, so it's a button, not a link.
  if (item.enquiry) {
    return (
      <NavigationMenu.Link render={<button type="button" />} closeOnClick onClick={(event) => onGo(event, item)} className={className}>
        {content}
      </NavigationMenu.Link>
    )
  }
  return (
    <NavigationMenu.Link href={`#${item.section}`} closeOnClick onClick={(event) => onGo(event, item)} className={className}>
      {content}
    </NavigationMenu.Link>
  )
}
