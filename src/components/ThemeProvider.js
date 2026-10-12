'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

// Light / dark / system theme. next-themes sets the class on <html> before the
// page paints (no flash), follows the system setting by default, and remembers
// the visitor's choice. Switching is instant: no colour transition app-wide.
export default function ThemeProvider({ children }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
