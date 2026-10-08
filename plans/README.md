# Animation plans

Written by `improve-animations` from the animation sweep's rows 1–5 (row 6 was skipped). Each plan is self-contained, and each is implemented as its own commit, so it can be reverted on its own.

| # | Plan | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Slide the calculator tab indicator, fade in the panel](001-calculator-tab-indicator.md) | MEDIUM | DONE |
| 002 | ["Copy link" confirms in place](002-copy-link-morph.md) | LOW | DONE |
| 003 | [Secondary calculator figures roll](003-secondary-numbers-flow.md) | LOW | DONE |
| 004 | [Accordion: one rotating chevron, no open delay](004-accordion-chevron-and-open.md) | MEDIUM | TODO |
| 005 | [Lay the contact band's brick courses once](005-contact-bricks-laid.md) | LOW | TODO |

**Order:** 001 → 005. The plans are independent. 001 changes `ui/tabs.jsx` (used only by the calculator) and 004 changes `ui/accordion.jsx` (used by the FAQ and the calculator's details).
