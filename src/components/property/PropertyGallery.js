'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play, Video } from 'lucide-react';
import { parseVideoUrl } from '@/lib/video';

const press = 'transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]';

// Photo & video carousel built on native scroll-snap: real swipe momentum on phones,
// no carousel library. Arrows and thumbnails scroll the strip; the current
// slide is whichever item is mostly in view.
export default function PropertyGallery({ title, photos, videoUrl }) {
  const stripRef = useRef(null);
  const thumbsRef = useRef(null);
  const [current, setCurrent] = useState(0);

  const allItems = useMemo(() => {
    const list = [...(photos || [])];
    if (videoUrl) {
      const parsed = parseVideoUrl(videoUrl);
      list.unshift({
        isVideo: true,
        videoInfo: parsed,
        src: videoUrl,
        caption: parsed?.type === 'youtube' ? 'YouTube Video Tour' : 'Full Video Walkthrough',
        alt: `${title} video walkthrough`,
      });
    }
    return list;
  }, [photos, videoUrl, title]);

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
  }, [allItems]);

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
    if (!strip || !allItems.length) return;
    const count = allItems.length;
    const wrapped = ((index % count) + count) % count;
    strip.scrollTo({ left: wrapped * strip.clientWidth });
  }

  return (
    <div>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={`${title} photos`}
        className="light-scope relative rounded-3xl overflow-hidden border border-stone-200/90 bg-stone-100 dark:border-white/10 dark:bg-neutral-800 shadow-sm"
      >
        <ul
          ref={stripRef}
          tabIndex={0}
          aria-label="Media gallery, scroll sideways"
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden outline-none focus-visible:ring-[3px] focus-visible:ring-white focus-visible:ring-inset"
        >
          {allItems.map((item, index) => (
            <li
              key={item.isVideo ? 'video-slide' : `photo-slide-${index}`}
              data-index={index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${allItems.length}: ${item.caption}`}
              className="relative shrink-0 basis-full snap-start aspect-[4/3] sm:aspect-[16/10] lg:aspect-[2/1] bg-black flex items-center justify-center overflow-hidden"
            >
              {item.isVideo ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  {item.videoInfo?.type === 'youtube' ? (
                    <iframe
                      src={item.videoInfo.embedUrl}
                      title={item.alt || 'Video walkthrough'}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={item.src}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain bg-black"
                    />
                  )}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-md z-10 pointer-events-none">
                    <Video className="w-3.5 h-3.5" />
                    <span>{item.videoInfo?.type === 'youtube' ? 'YouTube Tour' : 'Video Tour'}</span>
                  </div>
                </div>
              ) : (
                <>
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    placeholder={typeof item.src === 'string' ? 'empty' : 'blur'}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    sizes="(min-width: 1280px) 1232px, calc(100vw - 2rem)"
                    className="object-cover"
                  />
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-stone-950/55 to-transparent pointer-events-none" />
                  <span className="absolute bottom-4 left-4 text-sm font-semibold text-white pointer-events-none">{item.caption}</span>
                  {item.representative ? (
                    <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-stone-900 shadow-sm pointer-events-none">
                      Representative photo
                    </span>
                  ) : null}
                </>
              )}
            </li>
          ))}
        </ul>

        <span className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-stone-900 tabular-nums shadow-sm pointer-events-none">
          {current + 1} / {allItems.length}
        </span>
        <button
          type="button"
          onClick={() => show(current - 1)}
          aria-label="Previous media"
          className={`absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex w-11 h-11 items-center justify-center rounded-full bg-white/95 backdrop-blur-md text-stone-900 shadow-md hover:bg-white cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${press}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => show(current + 1)}
          aria-label="Next media"
          className={`absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex w-11 h-11 items-center justify-center rounded-full bg-white/95 backdrop-blur-md text-stone-900 shadow-md hover:bg-white cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${press}`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div ref={thumbsRef} className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {allItems.map((item, index) => (
          <button
            key={item.isVideo ? 'video-thumb' : `photo-thumb-${index}`}
            type="button"
            onClick={() => show(index)}
            aria-label={`Show slide ${index + 1}: ${item.caption}`}
            aria-current={index === current ? 'true' : undefined}
            className={`relative shrink-0 w-20 sm:w-24 aspect-[3/2] rounded-xl overflow-hidden border-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 ring-offset-white ${press} ${
              index === current ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            {item.isVideo ? (
              <div className="w-full h-full bg-stone-900 relative flex flex-col items-center justify-center text-amber-400 overflow-hidden">
                {item.videoInfo?.thumbnailUrl ? (
                  <img
                    src={item.videoInfo.thumbnailUrl}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover opacity-60"
                  />
                ) : null}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                  <Play className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-[9px] font-bold mt-0.5 text-white">Video</span>
                </div>
              </div>
            ) : (
              <Image src={item.src} alt="" fill sizes="96px" className="object-cover" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
