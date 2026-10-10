'use client';

import { useEffect, useState } from 'react';

// A full-width bar, sticky just under the navbar (64px + 1px border). The highlight follows the
// section crossing a line just below this bar, instantly: it's used all the
// time, so animating it would only make it feel slow.
export default function SectionNav({ sections, className = '' }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const elements = sections.map((section) => document.getElementById(section.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      // Px or %, never rem: IntersectionObserver rejects other units.
      { rootMargin: '-130px 0px -65% 0px' }
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="On this page"
      className={`sticky top-[65px] z-40 h-12 border-b border-stone-200/80 bg-white/95 backdrop-blur-md ${className}`}
    >
      <ul className="max-w-7xl mx-auto flex h-full items-center gap-1 overflow-x-auto px-4 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((section) => (
          <li key={section.id} className="shrink-0">
            <a
              href={`#${section.id}`}
              aria-current={active === section.id ? 'true' : undefined}
              className={`inline-flex h-9 items-center rounded-full px-3.5 text-xs font-semibold outline-none transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-stone-900 ${
                active === section.id ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
