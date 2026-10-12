'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useSavedProperties } from '@/lib/useSavedProperties';

export default function SavePropertyButton({
  property,
  className = '',
  iconSize = 'w-4 h-4',
  variant = 'circular', // 'circular' | 'pill'
}) {
  const { isSaved, toggleSave } = useSavedProperties();
  const saved = isSaved(property);
  const [animating, setAnimating] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    toggleSave(property);
    setTimeout(() => setAnimating(false), 300);
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer font-medium text-xs shadow-xs active:scale-95 ${
          saved
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700 hover:text-stone-900'
        } ${className}`}
        aria-label={saved ? 'Remove from shortlist' : 'Save property to shortlist'}
      >
        <Heart
          className={`${iconSize} transition-transform ${
            animating ? 'scale-125' : ''
          } ${saved ? 'text-rose-600 fill-rose-600' : 'text-stone-500'}`}
        />
        <span>{saved ? 'Saved to Shortlist' : 'Save Property'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-9 h-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-md hover:bg-white cursor-pointer active:scale-90 focus-ring z-10 ${
        saved ? 'ring-2 ring-rose-500/20' : ''
      } ${className}`}
      aria-label={saved ? 'Remove from saved' : 'Save property'}
      title={saved ? 'Remove from saved properties' : 'Save to shortlist'}
    >
      <Heart
        className={`${iconSize} transition-all duration-200 ${
          animating ? 'scale-125' : ''
        } ${
          saved
            ? 'text-rose-600 fill-rose-600 drop-shadow-xs'
            : 'text-stone-700 hover:text-rose-600'
        }`}
      />
    </button>
  );
}
