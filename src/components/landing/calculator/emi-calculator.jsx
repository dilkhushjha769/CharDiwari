"use client"

import { Link2 } from "lucide-react"
import { parseAsInteger, useQueryStates } from "nuqs"
import { toast } from "sonner"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { purchaseCosts } from "@/config/site"
import { localityName } from "@/data/localities"
import { projects } from "@/data/projects"
import { loanSummary, repaymentSchedule } from "@/lib/calculators"
import { formatCompactINR, formatINR } from "@/lib/format"
import { EnquireButton } from "../enquiry"
import { RupeeFlow } from "../flow-number"
import { Donut, LegendDot } from "./donut"
import { limits, loanParsers, urlOptions } from "./params"
import { RangeField } from "./range-field"

const projectItems = [
  { value: null, label: "Choose a project (optional)" },
  ...projects.map((project) => ({
    value: project.id,
    label: `${project.name}, ${localityName(project.locality)} · from ${formatCompactINR(project.priceMin)}`,
  })),
]

function formatDuration(months) {
  const years = Math.floor(months / 12)
  const rest = months % 12
  return [years && `${years} yr`, rest && `${rest} mo`].filter(Boolean).join(" ") || "0 mo"
}

export function EmiCalculator() {
  const [state, setState] = useQueryStates(
    {
      ...loanParsers,
      price: parseAsInteger.withDefault(12500000),
      extra: parseAsInteger.withDefault(0),
    },
    urlOptions
  )
  const { price, down, rate, yrs, extra } = state

  const downPayment = (price * down) / 100
  const loan = price - downPayment
  const { emi, totalInterest, totalPayable } = loanSummary(loan, rate, yrs)
  const interestShare = totalPayable > 0 ? Math.round((totalInterest / totalPayable) * 100) : 0
  const selectedProject = projects.find((project) => project.priceMin === price)?.id ?? null

  const withExtra = repaymentSchedule(loan, rate, yrs, extra)
  const monthsSaved = yrs * 12 - withExtra.months
  const interestSaved = totalInterest - withExtra.totalInterest

  const stampDuty = price * purchaseCosts.stampDuty
  const registration = price * purchaseCosts.registration

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied", { description: "Anyone with it sees these exact numbers." })
    } catch {
      toast.error("Couldn't copy the link", { description: "Copy it from the address bar instead." })
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="grid gap-7 rounded-2xl border border-border p-5 sm:p-6">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Start from a project</Label>
            <Select
              items={projectItems}
              value={selectedProject}
              onValueChange={(id) => {
                const project = projects.find((item) => item.id === id)
                if (project) setState({ price: project.priceMin })
              }}
            >
              <SelectTrigger className="h-11 w-full data-[size=default]:h-11" aria-label="Start from a project">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectItems.map((item) => (
                  <SelectItem key={item.label} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <RangeField
            label="Property price"
            value={price}
            onChange={(next) => setState({ price: next })}
            {...limits.price}
            scale="log"
            format={formatINR}
            formatEdge={formatCompactINR}
          />
          <RangeField
            label="Down payment"
            value={down}
            onChange={(next) => setState({ down: next })}
            {...limits.down}
            format={(value) => `${value}%`}
            hint={`${formatCompactINR(downPayment)} upfront`}
          />
          <RangeField
            label="Interest rate"
            value={rate}
            onChange={(next) => setState({ rate: next })}
            {...limits.rate}
            format={(value) => `${value}%`}
          />
          <RangeField
            label="Loan tenure"
            value={yrs}
            onChange={(next) => setState({ yrs: next })}
            {...limits.yrs}
            format={(value) => `${value} yrs`}
          />
        </div>

        <div className="flex flex-col gap-6 rounded-2xl bg-muted/50 p-5 sm:p-6" aria-live="polite">
          <div>
            <p className="text-sm text-muted-foreground">Monthly EMI</p>
            <p className="mt-1 text-title font-semibold tabular-nums">
              <RupeeFlow value={emi} />
            </p>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              On a {formatCompactINR(loan)} loan over {yrs} years,{" "}
              <span className="font-medium text-foreground">{interestShare}%</span> of what you pay back
              is interest.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <Donut principal={loan} interest={totalInterest} />
            <dl className="grid flex-1 gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2"><LegendDot className="bg-primary" />Principal</dt>
                <dd className="font-medium tabular-nums">{formatCompactINR(loan)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2"><LegendDot className="bg-chart-1" />Interest</dt>
                <dd className="font-medium tabular-nums">{formatCompactINR(totalInterest)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <dt>Total payable</dt>
                <dd className="font-semibold tabular-nums">{formatCompactINR(totalPayable)}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-auto flex flex-wrap gap-2">
            <EnquireButton
              size="lg"
              className="h-11 flex-1"
              topic="Home loan"
              message={`Property ${formatCompactINR(price)}, ${down}% down, ${rate}% for ${yrs} years. Estimated EMI ${formatINR(emi)}.`}
            >
              Talk to a loan expert
            </EnquireButton>
            <Button variant="outline" size="lg" className="h-11" onClick={copyLink}>
              <Link2 data-icon="inline-start" />
              Copy link
            </Button>
          </div>
        </div>
      </div>

      <Accordion multiple className="rounded-2xl border border-border px-5 sm:px-6">
        <AccordionItem value="extra">
          <AccordionTrigger className="py-4 text-base hover:no-underline">
            Pay a little extra each year
          </AccordionTrigger>
          <AccordionContent className="grid gap-4 pb-5">
            <RangeField
              label="Extra payment per year"
              value={extra}
              onChange={(next) => setState({ extra: next })}
              {...limits.extra}
              format={formatINR}
              formatEdge={formatCompactINR}
            />
            <p className="text-sm text-muted-foreground">
              {extra > 0 && monthsSaved > 0 ? (
                <>
                  You&apos;d be loan-free{" "}
                  <span className="font-medium text-foreground">{formatDuration(monthsSaved)} sooner</span> and
                  save <span className="font-medium text-foreground">{formatCompactINR(interestSaved)}</span> in
                  interest.
                </>
              ) : (
                "Even a small yearly top-up, like a bonus, can cut years off the loan. Try ₹1 L."
              )}
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="cost">
          <AccordionTrigger className="py-4 text-base hover:no-underline">
            Total cost to buy
          </AccordionTrigger>
          <AccordionContent className="pb-5">
            <dl className="grid max-w-md gap-2 text-sm tabular-nums">
              <CostRow label="Property price" value={price} />
              <CostRow label={`Stamp duty (${percent(purchaseCosts.stampDuty)})`} value={stampDuty} />
              <CostRow label={`Registration (${percent(purchaseCosts.registration)})`} value={registration} />
              <CostRow label="Total cost" value={price + stampDuty + registration} strong />
              <CostRow label="Cash you need upfront" value={downPayment + stampDuty + registration} strong />
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Indicative Gujarat rates. Stamp duty and registration aren&apos;t covered by the loan. Confirm
              final figures before you buy.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="schedule">
          <AccordionTrigger className="py-4 text-base hover:no-underline">
            Year-by-year breakdown
          </AccordionTrigger>
          <AccordionContent className="pb-5">
            <div className="max-h-80 overflow-auto overscroll-contain rounded-lg border border-border" data-lenis-prevent>
              <table className="w-full text-sm tabular-nums">
                <thead className="sticky top-0 bg-background text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Year</th>
                    <th className="px-3 py-2 text-right font-medium">Principal</th>
                    <th className="px-3 py-2 text-right font-medium">Interest</th>
                    <th className="px-3 py-2 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {withExtra.rows.map((row) => (
                    <tr key={row.year} className="border-t border-border">
                      <td className="px-3 py-2">{row.year}</td>
                      <td className="px-3 py-2 text-right">{formatCompactINR(row.principal)}</td>
                      <td className="px-3 py-2 text-right">{formatCompactINR(row.interest)}</td>
                      <td className="px-3 py-2 text-right">{formatCompactINR(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {extra > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">Includes your extra yearly payment.</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

// 0.049 → "4.9%" without floating point noise.
function percent(fraction) {
  return `${Number((fraction * 100).toFixed(2))}%`
}

function CostRow({ label, value, strong }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "border-t border-border pt-2 font-semibold" : ""}`}>
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd>{formatINR(value)}</dd>
    </div>
  )
}
