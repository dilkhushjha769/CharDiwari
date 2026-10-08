# 002 — "Copy link" confirms in place

- **Status**: DONE
- **Commit**: 86fdbf1
- **Severity**: LOW
- **Category**: Missed opportunities (feedback)
- **Estimated scope**: 1 file, ~40 lines

## Problem

On success, "Copy link" in the EMI calculator confirms only with a toast at the bottom of the screen, far from where the user clicked.

```jsx
/* src/components/landing/calculator/emi-calculator.jsx:64-70 — current */
async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success("Link copied", { description: "Anyone with it sees these exact numbers." })
  } catch {
    toast.error("Couldn't copy the link", { description: "Copy it from the address bar instead." })
  }
}
```

```jsx
/* emi-calculator.jsx:172-175 — current */
<Button variant="outline" size="lg" className="h-11" onClick={copyLink}>
  <Link2 data-icon="inline-start" />
  Copy link
</Button>
```

## Target

- `copied` state is set on success and cleared after **1600ms**. A ref holds the timer: a repeat click restarts it, and unmount clears it.
- Icon crossfade with motion (`motion/react`):
  `<AnimatePresence mode="popLayout" initial={false}>` around a `motion.span` keyed `copied ? "check" : "link"`, containing `Check` or `Link2`:
  - `initial={{ opacity: 0, filter: "blur(2px)", transform: "scale(0.9)" }}`
  - `animate={{ opacity: 1, filter: "blur(0px)", transform: "scale(1)" }}`
  - `exit={{ opacity: 0, filter: "blur(2px)", transform: "scale(0.9)" }}`
  - `transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}`, which is `--ease-out-strong`.

  The 2px blur is allowed by `CLAUDE.md` section 10 (small elements, crossfades).
- Label: "Copy link" and "Copied" stacked in one grid cell (`inline-grid [&>*]:col-start-1 [&>*]:row-start-1`). The inactive one is `opacity-0`, both use `transition-opacity duration-150 ease-out-strong`, and both are `aria-hidden`. The button keeps the wider label's width, so it never shifts.
- The button has a fixed `aria-label="Copy link"`, so its accessible name never changes.
- A `<span className="sr-only" aria-live="polite">` is rendered **empty on mount** and holds "Link copied" while `copied` is true.
- Remove the success toast and keep the error toast exactly as it is.

## Repo conventions to follow

- The same `AnimatePresence` + `motion.span` + blur pattern as the rotating hint in `src/components/landing/hero-search.jsx` (the `<span aria-hidden="true" className="relative ...">` holding `AnimatePresence mode="popLayout"`).
- `MotionConfig reducedMotion="user"` wraps the app (`src/components/providers/theme-provider.jsx`), so under reduced motion the scale drops automatically.

## Steps

1. Import `Check` from `lucide-react`, `AnimatePresence` and `motion` from `motion/react`, and `useEffect` and `useRef` from `react`.
2. Add the `copied` state, a `timer` ref, and an effect whose cleanup clears the timer.
3. In `copyLink`, on success: `setCopied(true)`, clear any existing timer, and set a new one for `setCopied(false)` after 1600ms. Remove the `toast.success` line.
4. Replace the button's children with the icon crossfade and the stacked labels. Add `aria-label="Copy link"` to the `<Button>`.
5. Render the empty live region next to the button, inside the same flex row.

## Boundaries

- Do NOT change the URL that gets copied or the error path.
- Do NOT change the button's size or variant.
- Do NOT add dependencies.

## Verification

- **Mechanical**: lint, test and build pass.
- **Feel check**: click Copy link.
  - The link icon turns into a tick with no jump, and "Copied" shows.
  - After about 1.6s it settles back.
  - Clicking again while it says "Copied" keeps it there for another 1.6s.
  - At 10% playback the swap reads as one morph, not two icons.
- **Done when**:
  - the accessible name is "Copy link" in both states;
  - the live region says "Link copied" after a click;
  - the button width changes by under 0.5px;
  - no success toast appears.
