import { Reveal } from "./reveal"

const steps = [
  {
    title: "Tell us what you need",
    text: "Budget, area, size, timeline. Two minutes on a call or WhatsApp is enough to start.",
  },
  {
    title: "Visit a short, honest shortlist",
    text: "We arrange site visits to the few homes that genuinely fit, and tell you the trade-offs of each.",
  },
  {
    title: "Close with confidence",
    text: "Price negotiation, home loan, legal checks and paperwork, handled with you until you get the keys.",
  },
]

export function HowItWorks() {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.title}>
          <Reveal delay={index * 0.06} className="h-full rounded-2xl border border-border p-6">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground tabular-nums">
              {index + 1}
            </span>
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{step.text}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  )
}
