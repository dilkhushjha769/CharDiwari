"use client"

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { Toaster } from "sonner"

// next-themes sets the `dark` class before first paint, so there's no flash.
// Transitions are disabled during a switch so nothing animates mid-change.
export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}

export function ThemedToaster(props) {
  const { resolvedTheme } = useTheme()
  return <Toaster theme={resolvedTheme === "dark" ? "dark" : "light"} {...props} />
}
