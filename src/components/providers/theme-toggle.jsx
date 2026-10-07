"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

// The label never depends on the theme and the icons swap via CSS `dark:`,
// so server and client markup always match (no hydration mismatch).
export function ThemeToggle({ className }) {
  const { setTheme } = useTheme()

  return (
    <button
      type="button"
      aria-label="Toggle colour theme"
      title="Toggle colour theme"
      onClick={() => {
        const isDark = document.documentElement.classList.contains("dark")
        setTheme(isDark ? "light" : "dark")
      }}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition-[color,background-color,scale] duration-150 ease-out-strong hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]",
        className
      )}
    >
      <Sun className="size-[18px] dark:hidden" aria-hidden="true" />
      <Moon className="hidden size-[18px] dark:block" aria-hidden="true" />
    </button>
  )
}
