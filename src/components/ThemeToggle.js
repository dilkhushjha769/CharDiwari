'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

// Flips between light and dark. The icon swaps with CSS (dark:hidden), so the
// server and the browser render identical markup and nothing mismatches on
// hydration. Instant on purpose: a theme switch shouldn't animate.
export default function ThemeToggle({ className = '' }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={`press flex w-10 h-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 hover:text-stone-950 hover:bg-stone-50 dark:hover:bg-stone-100 cursor-pointer focus-ring ${className}`}
    >
      <Sun className="w-4 h-4 hidden dark:block" />
      <Moon className="w-4 h-4 dark:hidden" />
    </button>
  );
}
