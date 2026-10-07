import { cn } from "@/lib/utils"
import { Reveal } from "./reveal"

// Headings carry a drawing-sheet index, like "01 — Projects" on an architect's set.
export function SectionHeading({ index, label, title, text, as: Heading = "h2", className }) {
  return (
    <Reveal className={cn("mb-8", className)}>
      <p className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
        <span className="text-primary">{index}</span>
        <span aria-hidden="true"> — </span>
        <span className="sr-only">: </span>
        {label}
      </p>
      <Heading className="mt-3 font-display text-title font-normal text-balance">{title}</Heading>
      {text ? <p className="mt-3 max-w-xl text-pretty text-muted-foreground">{text}</p> : null}
    </Reveal>
  )
}
