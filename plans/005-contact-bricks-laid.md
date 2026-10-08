# 005 — Lay the contact band's brick courses once

- **Status**: DONE
- **Commit**: 86fdbf1
- **Severity**: LOW
- **Category**: Missed opportunities (rare delight)
- **Estimated scope**: 2 files (1 new), ~40 lines

## Problem

The contact band at the end of the page has a faint running-bond brick pattern (a nod to the brick theme), but it's static:

```jsx
/* src/components/landing/contact-cta.jsx:12 — current */
<span aria-hidden="true" className="brick-courses pointer-events-none absolute inset-0 -z-10 bg-primary-foreground/[0.07]" />
```

`brick-courses` (globals.css) is a CSS mask, so only the brick lines of that span paint. The band itself is `bg-primary` (contact-cta.jsx:10).

## Target

When the band first scrolls into view, the courses are laid from the bottom up. This happens once per visit, with transform only.

- A new client component, `src/components/landing/brick-lay.jsx`, is rendered **inside** the masked span. Being inside the mask, it only paints where the brick lines are.
  - It's an overlay in the band's own colour, `bg-linear-to-t from-transparent to-primary`, with the colour stop at 16.7%. It's positioned `absolute inset-x-0 top-0 h-[120%]`, so the transparent soft edge lies **entirely below** the band and no brick shows before the reveal.
  - Motion (`motion/react`): `initial={{ transform: "translateY(0%)" }}`, `whileInView={{ transform: "translateY(-100%)" }}`, `viewport={{ once: true, margin: "0px 0px -80px 0px" }}`, `transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}`.
  - **No JavaScript means the bricks are visible:** the overlay renders nothing on the server. `useSyncExternalStore(subscribe, () => true, () => false)` marks the client.
  - If the band is already in view on mount (a direct `/#contact` load), the overlay isn't rendered, so there's no flash.
- Reduced motion: the app-wide `MotionConfig reducedMotion="user"` skips the transform, so the pattern is simply there.
- `CLAUDE.md` caps durations at "150–300ms for UI". This is a decorative, once-per-visit reveal, like `Reveal`'s 500ms fade, and 700ms was approved for it.

## Repo conventions to follow

- `viewport` options and easing: `src/components/landing/reveal.jsx`.
- Client-only rendering via `useSyncExternalStore`: `src/components/landing/header-shell.jsx`.

## Steps

1. Create `brick-lay.jsx`. It checks for the client, measures the band on mount via a ref, and returns `null` on the server or when already in view.
2. In `contact-cta.jsx`, render `<BrickLay />` as the only child of the brick span.

## Boundaries

- Transform only: no clip-path or opacity on the overlay.
- Do NOT change the band's layout, text or buttons.

## Verification

- **Mechanical**: lint, test and build pass.
- **Feel check**: scroll to the band.
  - The lines appear from the bottom up behind a soft edge; there's no hard wipe and no block of colour.
  - Scrolling away and back doesn't replay it.
  - At 10% playback, the edge never shows as a band.
- **Done when**:
  - in light and dark, a screenshot before the reveal shows no visible block (the overlay matches the band);
  - the overlay ends at `translateY(-100%)`;
  - with JavaScript disabled, the brick lines are visible;
  - with reduced motion, it's in its final state at once.
