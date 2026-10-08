# 004 — Rotate one accordion chevron and remove the ~100ms open delay

- **Status**: DONE
- **Commit**: 86fdbf1
- **Severity**: MEDIUM (the delay) / LOW (the chevron)
- **Category**: Purpose & frequency, easing
- **Estimated scope**: 1 file, ~10 lines

## Problem

Three defects in `src/components/ui/accordion.jsx`, which the FAQ and the EMI calculator's details use:

1. Two icons swap instantly instead of one chevron turning:

   ```jsx
   /* accordion.jsx:47-48 — current */
   <ChevronDownIcon data-slot="accordion-trigger-icon" className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden" />
   <ChevronUpIcon data-slot="accordion-trigger-icon" className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline" />
   ```

2. The trigger uses `transition-all` (accordion.jsx:41).

3. The panel keyframe hides content on open:

   ```jsx
   /* accordion.jsx:62 — current */
   className="overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up"
   ```

   tw-animate's `accordion-down` animates `height: 0 → var(--radix-accordion-content-height, …, auto)`. Base UI doesn't set that variable, so it becomes `0 → auto`. That can't interpolate, so the content stays hidden for half of the 200ms before it appears.

The inner div (accordion.jsx:67) has `h-(--accordion-panel-height) … data-ending-style:h-0 data-starting-style:h-0`. Those data attributes belong to the Panel, not this div, so these classes do nothing.

## Target

- One chevron:
  `<ChevronDownIcon data-slot="accordion-trigger-icon" className="pointer-events-none shrink-0 transition-transform duration-200 ease-out-strong group-aria-expanded/accordion-trigger:rotate-180 motion-reduce:transition-none" />`
- Trigger: replace `transition-all` with `transition-[color,border-color,box-shadow] duration-150 ease-out-strong`.
- Panel: `overflow-hidden text-sm transition-opacity duration-150 ease-out-strong data-starting-style:opacity-0`. Height changes instantly (`CLAUDE.md`: no height animation). It fades in on open and disappears at once on close.
- Inner div: replace `h-(--accordion-panel-height) … data-ending-style:h-0 data-starting-style:h-0` with `h-auto`, keeping every other class.
- `ease-out-strong` = `--ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1)` in `src/app/globals.css`.

## Repo conventions to follow

- Base UI Accordion.Panel sets `data-starting-style` (confirmed in `node_modules/@base-ui/react/accordion/panel/AccordionPanelDataAttributes.d.ts`).
- The trigger already carries `group/accordion-trigger` (accordion.jsx:41), so `group-aria-expanded/accordion-trigger:` works.

## Steps

1. Remove `ChevronUpIcon` from the import and the JSX, and update `ChevronDownIcon` as above.
2. Change the trigger's `transition-all`.
3. Change the Panel's className.
4. Change the inner div's height classes.

## Boundaries

- Do NOT animate height.
- Do NOT change the FAQ or calculator markup.

## Verification

- **Mechanical**: lint, test and build pass.
- **Feel check**: open and close FAQ items quickly.
  - The answer appears immediately and fades in, with no blank beat.
  - The chevron turns smoothly.
  - Closing is instant.
  - With reduced motion, the chevron flips without turning.
- **Done when**:
  - 30ms after a click, the panel has height above 0 and opacity above 0;
  - the settled chevron is rotated 180°;
  - after close, the panel is gone at once.
