# 001 — Slide the calculator tab indicator and fade in the new panel

- **Status**: DONE
- **Commit**: 86fdbf1
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens / Missed opportunities
- **Estimated scope**: 2 files, ~20 lines

## Problem

The calculator tabs (EMI / Affordability / Area converter) paint the active chip on the trigger itself, so switching tabs makes the white chip jump. The hero status tabs and the nav already slide, so the calculator is the odd one out. The newly chosen panel also appears with no transition.

```jsx
/* src/components/ui/tabs.jsx:65 — current (TabsTrigger) */
"data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
```

```jsx
/* src/components/ui/tabs.jsx:81 — current (TabsContent) */
className={cn("flex-1 text-sm outline-none", className)}
```

`ui/tabs.jsx` is used only by `src/components/landing/calculator/calculator.jsx`.

## Target

- Base UI's own `Tabs.Indicator` (from `@base-ui/react/tabs`) sets `--active-tab-left/-top/-width/-height` on itself. Position a chip from those variables and transition **only `translate`**. The triggers are `flex-1`, so they're all the same width and nothing else moves.
- Indicator classes:
  `absolute left-0 top-(--active-tab-top) h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) rounded-lg bg-background shadow-sm dark:border dark:border-input dark:bg-input/30 transition-[translate] duration-250 ease-out-strong motion-reduce:transition-none`
  and the prop `renderBeforeHydration`.
- `ease-out-strong` is the existing token in `src/app/globals.css`: `--ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);`
- Panel: `animate-in fade-in-0 duration-150 ease-out-strong`, opacity only, entry only. These come from tw-animate-css, already imported in `globals.css`.

## Repo conventions to follow

- Easing tokens: `src/app/globals.css` lines 22–24. Never write a raw cubic-bezier in classes; use `ease-out-strong`.
- The sliding pattern already used: `src/components/landing/status-tabs.jsx` (spring 0.3s, no bounce). Here CSS does the same job, because Base UI provides the variables.

## Steps

1. In `tabsListVariants` (tabs.jsx:26), add `relative` to the base classes.
2. In `TabsTrigger` (tabs.jsx:63–65):
   - change `transition-all` to `transition-colors duration-150`;
   - add `relative z-10`;
   - remove `group-data-[variant=default]/tabs-list:data-active:shadow-sm`, `data-active:bg-background`, `dark:data-active:border-input` and `dark:data-active:bg-input/30`;
   - keep `data-active:text-foreground` and `dark:data-active:text-foreground`.
3. Add and export `TabsIndicator({ className, ...props })`, rendering `<TabsPrimitive.Indicator data-slot="tabs-indicator" renderBeforeHydration className={cn(<indicator classes>, className)} {...props} />`.
4. In `TabsContent`, append `animate-in fade-in-0 duration-150 ease-out-strong` to the classes.
5. In `calculator.jsx`, import `TabsIndicator` and render `<TabsIndicator />` as the last child of `<TabsList>`.

## Boundaries

- Do NOT change the `?calc=` URL handling, tab values or labels.
- Do NOT animate width, height or left. Only `translate`.
- Do NOT add dependencies.
- If the code doesn't match the excerpts above, STOP and report.

## Verification

- **Mechanical**: `npm run lint`, `npm test` and `npm run build` pass. `drive.mjs` still passes "affordability tab in URL".
- **Feel check**: click EMI, then Affordability, then Area converter.
  - The chip glides and never changes width.
  - Clicking fast retargets smoothly; it never restarts from the first tab.
  - At 10% playback, the new panel fades in and nothing moves sideways.
  - With `prefers-reduced-motion`, the chip moves instantly and the panel still fades.
- **Done when**: the indicator's box matches the active tab within 1px after a switch, and the computed `transition-property` is `translate`.
