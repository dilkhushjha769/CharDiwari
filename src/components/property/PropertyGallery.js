'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const press = 'transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]';

// Photo carousel built on native scroll-snap: real swipe momentum on phones,
// no carousel library. Arrows and thumbnails scroll the strip; the current
// photo is whichever slide is mostly in view.
export default function PropertyGallery({ title, photos }) {
  const stripRef = useRef(null);
  const thumbsRef = useRef(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(Number(entry.target.dataset.index));
        }
      },
      { root: strip, threshold: 0.6 }
    );
    Array.from(strip.children).forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  // Keep the current thumbnail visible inside its own row (never scrolls the page).
  useEffect(() => {
    const row = thumbsRef.current;
    const thumb = row?.children[current];
    if (!row || !thumb) return;
    const left = thumb.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft || left + thumb.offsetWidth > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: left - (row.clientWidth - thumb.offsetWidth) / 2 });
    }
  }, [current]);

  function show(index) {
    const strip = stripRef.current;
    if (!strip) return;
    const wrapped = (index + photos.length) % photos.length;
    strip.scrollTo({ left: wrapped * strip.clientWidth });
  }

  return (
    <div>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={`${title} photos`}
        className="relative rounded-3xl overflow-hidden border border-stone-200/90 bg-stone-100 shadow-sm"
      >
        <ul
          ref={stripRef}
          tabIndex={0}
          aria-label="Photos, scroll sideways"
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-inset"
        >
          {photos.map((photo, index) => (
            <li
              key={photo.caption}
              data-index={index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${photos.length}: ${photo.caption}`}
              className="relative shrink-0 basis-full snap-start aspect-[4/3] sm:aspect-[16/10] lg:aspect-[2/1]"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                placeholder={typeof photo.src === 'string' ? 'empty' : 'blur'}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                sizes="(min-width: 1280px) 1232px, calc(100vw - 2rem)"
                className="object-cover"
              />
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-stone-950/55 to-transparent" />
              <span className="absolute bottom-4 left-4 text-sm font-semibold text-white">{photo.caption}</span>
              {photo.representative ? (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-stone-900 shadow-sm">
                  Representative photo
                </span>
              ) : null}
            </li>
          ))}
        </ul>

        <span className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-stone-900 tabular-nums shadow-sm">
          {current + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={() => show(current - 1)}
          aria-label="Previous photo"
          className={`absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex w-11 h-11 items-center justify-center rounded-full bg-white/95 backdrop-blur-md text-stone-900 shadow-md hover:bg-white cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${press}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => show(current + 1)}
          aria-label="Next photo"
          className={`absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex w-11 h-11 items-center justify-center rounded-full bg-white/95 backdrop-blur-md text-stone-900 shadow-md hover:bg-white cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${press}`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div ref={thumbsRef} className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {photos.map((photo, index) => (
          <button
            key={photo.caption}
            type="button"
            onClick={() => show(index)}
            aria-label={`Show photo ${index + 1}: ${photo.caption}`}
            aria-current={index === current ? 'true' : undefined}
            className={`relative shrink-0 w-20 sm:w-24 aspect-[3/2] rounded-xl overflow-hidden border-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 ${press} ${
              index === current ? 'border-stone-900' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Image src={photo.src} alt="" fill sizes="96px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
