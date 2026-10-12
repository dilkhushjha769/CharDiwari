'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  Search,
  X,
  MapPin,
  Building2,
  Home,
  Layers,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';

/**
 * Highlights parts of text matching the search query with subtle weight and underline
 */
function HighlightedText({ text, query }) {
  if (!text) return null;
  if (!query || !query.trim()) {
    return <span>{text}</span>;
  }

  const cleanQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokens = cleanQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return <span>{text}</span>;

  const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = String(text).split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        const isMatch = tokens.some(
          (t) => t.toLowerCase() === part.toLowerCase()
        );
        return isMatch ? (
          <span
            key={index}
            className="font-semibold text-stone-950 underline decoration-stone-300 decoration-1 underline-offset-2"
          >
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
}

export default function SearchAutocomplete({
  searchQuery = '',
  setSearchQuery,
  onSelectProperty,
  onSelectLocation,
  onSelectPropertyType,
  onSelectAttribute,
  onSearchSubmit,
  selectedCity = 'All Cities',
  searchMode = 'buy',
  filteredCount = 0,
  placeholder = 'Search by project, location, builder, or property type...',
  endpoint = '/api/search/suggestions',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const clientCacheRef = useRef(new Map());

  // Flatten suggestions across categories for keyboard arrow navigation
  const flatItems = useMemo(() => {
    const list = [];
    categories.forEach((cat) => {
      cat.items.forEach((item) => {
        list.push({ ...item, categoryId: cat.id, categoryLabel: cat.label });
      });
    });
    return list;
  }, [categories]);

  // Fetch suggestions from autocomplete API
  const fetchSuggestions = useCallback(
    async (query) => {
      const trimmed = (query || '').trim();
      const cacheKey = `${trimmed.toLowerCase()}|${selectedCity.toLowerCase()}|${searchMode.toLowerCase()}`;

      // Check client-side memory cache for instantaneous response
      if (clientCacheRef.current.has(cacheKey)) {
        const cached = clientCacheRef.current.get(cacheKey);
        setCategories(cached.categories || []);
        setIsLoading(false);
        setActiveIndex(-1);
        return;
      }

      // Abort previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const currentRequestId = ++requestIdRef.current;

      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          q: trimmed,
          city: selectedCity === 'All Cities' ? '' : selectedCity,
          mode: searchMode,
          limit: '10',
        });

        const res = await fetch(`${endpoint}?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        // Prevent race condition: ensure only the latest request updates state
        if (currentRequestId === requestIdRef.current) {
          const cats = data.categories || [];
          setCategories(cats);
          clientCacheRef.current.set(cacheKey, data);
          setActiveIndex(-1);
          setIsLoading(false);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch autocomplete suggestions:', err);
          if (currentRequestId === requestIdRef.current) {
            setCategories([]);
            setIsLoading(false);
          }
        }
      }
    },
    [selectedCity, searchMode, endpoint]
  );

  // Auto-scroll active option into view when navigating via arrow keys
  useEffect(() => {
    if (activeIndex >= 0 && flatItems[activeIndex]) {
      const activeElement = document.getElementById(
        `suggestion-option-${flatItems[activeIndex].id}`
      );
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, flatItems]);

  // Debounced query change effect (150ms debounce)
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, fetchSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleDocumentClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
    };
  }, []);

  const handleFocus = () => {
    setIsOpen(true);
    fetchSuggestions(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery('');
    setActiveIndex(-1);
    if (inputRef.current) inputRef.current.focus();
    fetchSuggestions('');
  };

  const handleSelectItem = (item) => {
    setIsOpen(false);
    setActiveIndex(-1);

    if (item.type === 'property') {
      if (onSelectProperty) {
        onSelectProperty(item);
      } else {
        setSearchQuery(item.title);
        if (onSearchSubmit) onSearchSubmit(item.title);
      }
      return;
    }

    if (item.type === 'location') {
      setSearchQuery(item.title);
      if (onSelectLocation) {
        onSelectLocation(item);
      } else if (onSearchSubmit) {
        onSearchSubmit(item.title);
      }
      return;
    }

    if (item.type === 'propertyType') {
      setSearchQuery(item.title);
      if (onSelectPropertyType) {
        onSelectPropertyType(item.title);
      } else if (onSearchSubmit) {
        onSearchSubmit(item.title);
      }
      return;
    }

    if (item.type === 'attribute') {
      setSearchQuery(item.title);
      if (onSelectAttribute) {
        onSelectAttribute(item);
      } else if (onSearchSubmit) {
        onSearchSubmit(item.title);
      }
      return;
    }

    setSearchQuery(item.title);
    if (onSearchSubmit) onSearchSubmit(item.title);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        fetchSuggestions(searchQuery);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatItems.length === 0) return;
      setActiveIndex((prev) => (prev + 1 < flatItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatItems.length === 0) return;
      setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < flatItems.length) {
        handleSelectItem(flatItems[activeIndex]);
      } else {
        setIsOpen(false);
        if (onSearchSubmit) onSearchSubmit(searchQuery);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center gap-2 sm:gap-2.5 px-1 sm:px-3 py-1 sm:py-0 relative min-w-0"
    >
      {/* Search Input Icon / Loading Spinner */}
      {isLoading ? (
        <Loader2 className="w-4 h-4 text-stone-500 animate-spin shrink-0" />
      ) : (
        <Search className="w-4 h-4 text-stone-400 shrink-0" />
      )}

      {/* Main Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onFocus={handleFocus}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-w-0 flex-1 text-xs sm:text-sm font-medium text-stone-900 bg-transparent outline-none placeholder:text-stone-400 py-1"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        role="combobox"
        aria-controls="autocomplete-dropdown"
        aria-activedescendant={
          isOpen && activeIndex >= 0 && flatItems[activeIndex]
            ? `suggestion-option-${flatItems[activeIndex].id}`
            : undefined
        }
      />

      {/* Clear Button */}
      {searchQuery && (
        <button
          type="button"
          onClick={handleClear}
          className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer shrink-0"
          aria-label="Clear search query"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Solid Black Search Action Button with dynamic matching count */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          if (onSearchSubmit) onSearchSubmit(searchQuery);
        }}
        className="w-8 h-8 sm:w-auto px-0 sm:px-4 py-0 sm:py-2 rounded-lg sm:rounded-full bg-stone-900 hover:bg-black text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] shrink-0"
        aria-label="Search"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search</span>
        {filteredCount > 0 && (
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-white/20 text-[11px] font-mono font-medium">
            {filteredCount}
          </span>
        )}
      </button>

      {/* Compact, Editorial Autocomplete Dropdown */}
      {isOpen && (
        <div
          id="autocomplete-dropdown"
          role="listbox"
          className="absolute left-0 right-0 sm:left-auto sm:right-0 md:left-0 md:right-auto w-full sm:w-[620px] md:w-[680px] top-full mt-2 max-h-[460px] overflow-y-auto overscroll-contain surface-raised bg-white rounded-xl border border-stone-200 shadow-xl shadow-stone-900/5 p-1.5 sm:p-2 z-50 animate-in fade-in duration-100 scrollbar-thin scrollbar-thumb-stone-200"
        >
          {categories.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {categories.map((category) => (
                <div key={category.id} className="pt-2 first:pt-0.5 pb-1">
                  {/* Compact Sentence-case Section Label */}
                  <div className="px-2.5 pb-1 text-[11px] font-medium text-stone-400">
                    {category.label}
                  </div>

                  {/* Suggestion Items */}
                  <div className="space-y-0.5">
                    {category.items.map((item) => {
                      const itemGlobalIndex = flatItems.findIndex((fi) => fi.id === item.id);
                      const isHighlighted = itemGlobalIndex === activeIndex;

                      return (
                        <button
                          key={item.id}
                          id={`suggestion-option-${item.id}`}
                          type="button"
                          role="option"
                          aria-selected={isHighlighted}
                          onMouseDown={(e) => {
                            e.preventDefault();
                          }}
                          onClick={() => handleSelectItem(item)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer group ${
                            isHighlighted
                              ? 'bg-stone-50 text-stone-950 ring-1 ring-stone-200/80'
                              : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-3">
                            {/* Property Thumbnail or Small Neutral Icon */}
                            {item.type === 'property' && item.image ? (
                              <div className="w-10 h-10 rounded-md overflow-hidden bg-stone-100 shrink-0 border border-stone-200/60 relative">
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  width={40}
                                  height={40}
                                  unoptimized
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : item.type === 'property' ? (
                              <Home className="w-4 h-4 text-stone-400 shrink-0 ml-0.5" />
                            ) : item.type === 'location' ? (
                              <MapPin className="w-4 h-4 text-stone-400 shrink-0 ml-0.5" />
                            ) : item.type === 'propertyType' ? (
                              <Building2 className="w-4 h-4 text-stone-400 shrink-0 ml-0.5" />
                            ) : (
                              <Layers className="w-4 h-4 text-stone-400 shrink-0 ml-0.5" />
                            )}

                            {/* Main Title & Subtitle */}
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] sm:text-sm font-medium text-stone-900 truncate">
                                <HighlightedText text={item.title} query={searchQuery} />
                              </div>
                              {item.subtitle && (
                                <div className="text-[12px] text-stone-500 truncate mt-0.5">
                                  {item.subtitle}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Meta (Price / Beds / Arrow) */}
                          <div className="flex items-center gap-2 shrink-0 text-right">
                            {item.price && (
                              <span className="text-[13px] font-semibold text-stone-900 font-mono">
                                {item.price}
                              </span>
                            )}
                            {item.type === 'property' && item.badge && (
                              <span className="text-[11px] text-stone-400 hidden sm:inline">
                                • {item.badge}
                              </span>
                            )}
                            <ArrowUpRight className="w-3.5 h-3.5 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Clean, Quiet Empty State
            <div className="py-7 px-4 text-center">
              <p className="text-xs sm:text-sm font-medium text-stone-700">
                No matching results
              </p>
              <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                {searchQuery.trim()
                  ? `No properties or locations match "${searchQuery}".`
                  : 'Search by city, project name, or property type.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
