'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ReactLenis, useLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';

// Lenis keeps its own scroll target across client-side page changes, so a new
// page could open at the old position. Start each new page at the top, except
// on back/forward (the browser restores the position) and for #section links.
function StartNewPagesAtTop() {
  const lenis = useLenis();
  const pathname = usePathname();
  const lastPathname = useRef(pathname);
  const historyNavigation = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      historyNavigation.current = true;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    // Only on an actual page change (not on mount, nor when Lenis first appears).
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    if (historyNavigation.current) {
      historyNavigation.current = false;
      return;
    }
    if (window.location.hash) return;
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [pathname, lenis]);

  return null;
}

// Site-wide smooth scrolling (Lenis). Touch keeps the phone's native scroll;
// "#section" links glide and respect each section's scroll-margin;
// dropdown lists and menus still scroll on their own (allowNestedScroll).
// For visitors who prefer reduced motion, Lenis turns smoothing off itself.
export default function SmoothScroll() {
  return (
    <ReactLenis root options={{ autoRaf: true, lerp: 0.1, anchors: true, allowNestedScroll: true }}>
      <StartNewPagesAtTop />
    </ReactLenis>
  );
}
