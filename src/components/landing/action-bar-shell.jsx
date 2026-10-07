"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"

function subscribe(onChange) {
  window.addEventListener("scroll", onChange, { passive: true })
  window.addEventListener("resize", onChange)
  return () => {
    window.removeEventListener("scroll", onChange)
    window.removeEventListener("resize", onChange)
  }
}

// True while the hero (and its own "Show N projects" action) is on screen.
function getOnHero() {
  const hero = document.getElementById("top")
  return hero ? hero.getBoundingClientRect().bottom > 120 : false
}

// The phone action bar stays out of the way while the hero's own action is in
// view, so there's one brick button per screen. It slides up once the hero
// leaves. The first state after hydration applies without a transition, so a
// page opened mid-way (/#faq) shows the bar straight away.
export function ActionBarShell({ children }) {
  const onHero = useSyncExternalStore(subscribe, getOnHero, () => true)
  const barRef = useRef(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (barRef.current) barRef.current.dataset.animate = "true"
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      ref={barRef}
      inert={onHero}
      data-hidden={onHero}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-md data-[animate=true]:transition-transform data-[animate=true]:duration-300 data-[animate=true]:ease-drawer data-[hidden=true]:translate-y-full motion-reduce:transition-none md:hidden"
    >
      {children}
    </div>
  )
}
