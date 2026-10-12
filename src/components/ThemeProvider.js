'use client';

import { useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// Locked permanently to light mode across the entire application.
export default function ThemeProvider({ children }) {
  useEffect(() => {
    try {
      localStorage.removeItem('theme');
    } catch (_) {}
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
