'use client';

import { useEffect, useRef } from 'react';

// Reveals its content once, the first time it scrolls into view (the motion
// itself is CSS in globals.css: [data-reveal]). Only content that starts below
// the fold is hidden first, so nothing on screen ever flashes; without
// JavaScript it simply shows.
export default function Reveal({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || element.getBoundingClientRect().top < window.innerHeight) return;

    element.dataset.reveal = 'pending';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.dataset.reveal = 'in';
        observer.disconnect();
      },
      { rootMargin: '0px 0px -80px 0px' }
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      delete element.dataset.reveal;
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
