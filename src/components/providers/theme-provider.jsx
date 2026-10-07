"use client"

import { MotionConfig } from "motion/react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { Toaster } from "sonner"

// next-themes sets the `dark` class before first paint, so there's no flash.
// Transitions are disabled during a switch so nothing animates mid-change.
// MotionConfig turns motion's transform and layout animations off for people
// who ask for reduced motion (opacity still fades).
export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextThemesProvider>
  )
}

export function ThemedToaster(props) {
  const { resolvedTheme } = useTheme()
  return <Toaster theme={resolvedTheme === "dark" ? "dark" : "light"} {...props} />
}
