"use client"

import { Radio } from "@base-ui/react/radio"
import { RadioGroup } from "@base-ui/react/radio-group"
import { motion, useReducedMotion } from "motion/react"
import { availableStatusOptions, currentStatus, useProjectFilters } from "@/lib/project-filters"
import { cn } from "@/lib/utils"

const ALL = "all"
const options = [{ value: ALL, label: "All" }, ...availableStatusOptions]

// Possession status as segmented tabs. It's a radio group for assistive tech:
// it filters the projects further down the page, it doesn't switch a panel.
export function StatusTabs() {
  const [filters, setFilters] = useProjectFilters()
  const value = currentStatus(filters) ?? ALL
  const reduceMotion = useReducedMotion()

  return (
    <RadioGroup
      aria-label="Possession status"
      value={value}
      onValueChange={(next) => setFilters({ status: next === ALL ? null : next, project: null })}
      className="inline-flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-full border border-border bg-background/80 p-1 backdrop-blur-sm [scrollbar-width:none]"
    >
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          className="relative inline-flex h-11 shrink-0 cursor-pointer items-center rounded-full px-3 text-sm whitespace-nowrap text-muted-foreground outline-none transition-[color,scale] duration-150 ease-out-strong hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] data-checked:text-foreground sm:h-9 sm:px-3.5"
        >
          {value === option.value && (
            <motion.span
              layoutId="status-tab"
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-accent ring-1 ring-primary/30"
              transition={reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0 }}
            />
          )}
          <span className="relative">{option.label}</span>
        </Radio.Root>
      ))}
    </RadioGroup>
  )
}

// Server stand-in with the same size, shown until the URL is readable.
export function StatusTabsFallback() {
  return (
    <div aria-hidden="true" className="inline-flex w-fit max-w-full gap-0.5 overflow-hidden rounded-full border border-border bg-background/80 p-1">
      {options.map((option, index) => (
        <span
          key={option.value}
          className={cn(
            "relative inline-flex h-11 shrink-0 items-center rounded-full px-3 text-sm whitespace-nowrap text-muted-foreground sm:h-9 sm:px-3.5",
            index === 0 && "bg-accent text-foreground ring-1 ring-primary/30"
          )}
        >
          {option.label}
        </span>
      ))}
    </div>
  )
}
