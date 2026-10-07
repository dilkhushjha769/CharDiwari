"use client"

import { ArrowRight } from "lucide-react"
import { parseAsInteger, useQueryStates } from "nuqs"
import { Button } from "@/components/ui/button"
import { affordability, MAX_EMI_SHARE_OF_INCOME } from "@/lib/calculators"
import { formatCompactINR, formatINR } from "@/lib/format"
import { replaceProjectFilters } from "@/lib/project-filters"
import { useScrollToSection } from "@/hooks/use-smooth-scroll"
import { EnquireButton } from "../enquiry"
import { CompactRupeeFlow } from "../flow-number"
import { limits, loanParsers, urlOptions } from "./params"
import { RangeField } from "./range-field"

export function AffordabilityCalculator() {
  const [state, setState] = useQueryStates(
    {
      ...loanParsers,
      income: parseAsInteger.withDefault(150000),
      emis: parseAsInteger.withDefault(0),
    },
    urlOptions
  )
  const { income, emis, rate, yrs, down } = state
  const scrollToSection = useScrollToSection()

  const result = affordability({
    income,
    existingEmis: emis,
    annualRatePct: rate,
    years: yrs,
    downPaymentPct: down,
  })
  const canBorrow = result.loan > 0

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="grid gap-7 rounded-2xl border border-border p-5 sm:p-6">
        <RangeField
          label="Monthly take-home income"
          value={income}
          onChange={(next) => setState({ income: next })}
          {...limits.income}
          scale="log"
          format={formatINR}
          formatEdge={formatCompactINR}
        />
        <RangeField
          label="Existing EMIs per month"
          value={emis}
          onChange={(next) => setState({ emis: next })}
          {...limits.emis}
          format={formatINR}
          formatEdge={formatCompactINR}
        />
        <RangeField
          label="Down payment"
          value={down}
          onChange={(next) => setState({ down: next })}
          {...limits.down}
          format={(value) => `${value}%`}
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
        {canBorrow ? (
          <div>
            <p className="text-sm text-muted-foreground">You can comfortably look at homes up to</p>
            <p className="mt-1 text-title font-semibold tabular-nums">
              <CompactRupeeFlow value={result.price} />
            </p>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              That&apos;s a {formatCompactINR(result.loan)} loan at{" "}
              <span className="font-medium text-foreground">{formatINR(result.emi)}</span> a month, keeping all
              your EMIs within {MAX_EMI_SHARE_OF_INCOME * 100}% of your take-home pay, plus{" "}
              {formatCompactINR(result.price - result.loan)} down payment.
            </p>
          </div>
        ) : (
          <div>
            <p className="font-medium">Your current EMIs already use about half your income.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Lenders usually stop there. Closing a smaller loan first, or adding a co-applicant, opens up
              more options. We can help you work out the best route.
            </p>
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-2">
          {canBorrow && (
            <Button
              size="lg"
              className="h-11 flex-1"
              onClick={() => {
                replaceProjectFilters({ max: Math.round(result.price) })
                scrollToSection("projects")
              }}
            >
              See homes in this budget
              <ArrowRight data-icon="inline-end" />
            </Button>
          )}
          <EnquireButton
            variant={canBorrow ? "outline" : "default"}
            size="lg"
            className="h-11"
            topic="Budget and home loan"
            message={`Take-home ${formatINR(income)} a month, existing EMIs ${formatINR(emis)}. What can I afford?`}
          >
            Talk to an expert
          </EnquireButton>
        </div>
      </div>
    </div>
  )
}
