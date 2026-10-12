'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Plus,
  Trash2,
  MapPin,
  Building2,
  Bed,
  Bath,
  Maximize2,
  ShieldCheck,
  Phone,
  MessageCircle,
  Eye,
  EyeOff,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { propertyDetail } from '@/data/property-details';
import { properties as allProperties } from '@/data/properties';

/**
 * Calculates estimated monthly EMI based on 8.5% p.a. for a 20-year loan on 80% property value.
 */
function calculateEstEMI(priceNum) {
  if (!priceNum || priceNum <= 0) return null;
  const loanLakhs = priceNum * 100 * 0.8;
  const principal = loanLakhs * 100000;
  const monthlyRate = 8.5 / 12 / 100;
  const tenureMonths = 240;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  if (emi >= 100000) {
    return `₹${(emi / 100000).toFixed(2)} Lakh/mo`;
  }
  return `₹${Math.round(emi).toLocaleString('en-IN')}/mo`;
}

/**
 * Calculates price per square foot
 */
function calculatePricePerSqft(priceNum, areaStr) {
  if (!priceNum || !areaStr) return null;
  const numArea = parseInt(String(areaStr).replace(/[^\d]/g, ''), 10);
  if (!numArea || numArea <= 0) return null;
  const priceRupees = priceNum * 10000000;
  const perSqft = Math.round(priceRupees / numArea);
  return `₹${perSqft.toLocaleString('en-IN')}/sq.ft`;
}

export default function PropertyCompareModal({
  isOpen,
  onClose,
  compareList = [],
  onRemoveProperty,
  onAddProperty,
  onClearAll,
  onSelectPropertyForEnquiry,
}) {
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const scrollContainerRef = useRef(null);

  // Close modal on Escape key and lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  // Smooth scroll to a specific property column on mobile
  const scrollToColumn = (index) => {
    if (!scrollContainerRef.current) return;
    // On mobile, each property column is approx 175px
    const colWidth = 175;
    scrollContainerRef.current.scrollTo({
      left: index * colWidth,
      behavior: 'smooth',
    });
  };

  // Available properties to add if slots are less than 3
  const availableToAdd = useMemo(() => {
    const selectedIds = new Set(compareList.map((p) => p.id));
    return allProperties.filter((p) => !selectedIds.has(p.id));
  }, [compareList]);

  // Load details (amenities, highlights, nearby) for each property in comparison
  const propertyDetailsMap = useMemo(() => {
    const map = {};
    compareList.forEach((prop) => {
      const slug =
        prop.slug ||
        prop.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      map[prop.id] = propertyDetail(slug);
    });
    return map;
  }, [compareList]);

  if (!isOpen) return null;

  // Comparison feature definitions
  const commonAmenities = [
    { key: 'pool', label: 'Private / Shared Pool' },
    { key: 'garden', label: 'Landscaped Garden' },
    { key: 'gym', label: 'Gym & Fitness Club' },
    { key: 'clubhouse', label: 'Clubhouse' },
    { key: 'security', label: '24/7 Gated Security' },
    { key: 'power-backup', label: '100% Power Backup' },
    { key: 'parking', label: 'Reserved Parking' },
    { key: 'cctv', label: 'CCTV Surveillance' },
  ];

  // Helper to check if a row differs across properties
  const isDifferent = (getter) => {
    if (compareList.length <= 1) return false;
    const firstVal = getter(compareList[0]);
    return compareList.some((p) => getter(p) !== firstVal);
  };

  // Total columns in the table (1 label col + properties + optional add slot)
  const totalColumns = 1 + compareList.length + (compareList.length < 3 ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 scrim bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-modal-title"
        className="relative surface-raised bg-white dark:bg-stone-50 rounded-t-2xl sm:rounded-3xl border-t sm:border border-stone-200/90 shadow-2xl w-full max-w-6xl h-[95dvh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-200 bg-stone-50/80 dark:bg-stone-100/60 sticky top-0 z-30 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <h2
                id="compare-modal-title"
                className="text-sm sm:text-lg font-serif font-bold text-stone-900 tracking-tight truncate"
              >
                Property Comparison
              </h2>
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-200 text-stone-700 shrink-0">
                {compareList.length} of 3
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Highlight Differences Switch */}
              <button
                type="button"
                onClick={() => setHighlightDifferences((prev) => !prev)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border transition cursor-pointer ${
                  highlightDifferences
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-300 shadow-xs'
                    : 'bg-white dark:bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
                title="Highlight attributes that differ between properties"
              >
                {highlightDifferences ? (
                  <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                )}
                <span>Diffs</span>
              </button>

              {/* Clear All */}
              {compareList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    onClose();
                  }}
                  className="text-[11px] sm:text-xs font-semibold text-stone-500 hover:text-rose-600 px-1.5 sm:px-2 py-1 rounded transition cursor-pointer"
                >
                  Clear
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1 sm:p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-200/70 transition cursor-pointer ml-1"
                aria-label="Close comparison modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Subtitle (Desktop only for compactness) */}
          <p className="text-xs text-stone-500 mt-1 hidden sm:block">
            Review prices, floor plans, amenities, and connectivity side-by-side
          </p>

          {/* Mobile Quick Navigation Strip (Jump to Property & Swipe hint) */}
          {compareList.length > 1 && (
            <div className="sm:hidden mt-2 pt-2 border-t border-stone-200/70 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
                Jump to:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto">
                {compareList.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => scrollToColumn(idx)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-stone-50 border border-stone-200 text-stone-700 shrink-0 max-w-[110px] truncate active:bg-stone-200 transition"
                  >
                    {idx + 1}. {p.title.replace(/^The\s+/i, '').split(' ')[0]}
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-medium text-stone-400 shrink-0">
                Swipe &rarr;
              </span>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-auto overscroll-x-contain p-2 sm:p-6 scroll-smooth"
        >
          {compareList.length === 0 ? (
            /* Empty State */
            <div className="py-16 text-center max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1">No Properties Selected</h3>
              <p className="text-xs text-stone-500 mb-4">
                Select up to 3 properties using the &quot;Add to Compare&quot; checkbox on any listing card.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-black transition"
              >
                Browse Listings
              </button>
            </div>
          ) : (
            /* Unified Comparison Table with Sticky Left Label Column */
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  {/* Sticky Corner Header */}
                  <th className="sticky left-0 top-0 z-30 surface-raised bg-white dark:bg-stone-50 border-r border-b border-stone-200 dark:border-stone-200 p-2 sm:p-3 w-[110px] sm:w-[180px] min-w-[110px] sm:min-w-[180px] shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)] align-bottom font-normal">
                    <div className="pb-1">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                        Estates
                      </span>
                      <span className="text-[10px] sm:text-xs text-stone-500 font-normal hidden sm:block mt-0.5">
                        Overview &amp; Specs
                      </span>
                      <span className="text-[9px] text-stone-400 font-normal sm:hidden mt-0.5 flex items-center gap-0.5">
                        <span>Swipe</span>
                        <span>&rarr;</span>
                      </span>
                    </div>
                  </th>

                  {/* Property Card Columns */}
                  {compareList.map((prop) => {
                    const estEMI = calculateEstEMI(prop.priceNum);
                    const priceSqft = calculatePricePerSqft(prop.priceNum, prop.area);

                    return (
                      <th
                        key={prop.id}
                        className="p-1 sm:p-3 w-[175px] sm:w-[220px] min-w-[175px] sm:min-w-[220px] align-top font-normal border-b border-stone-200"
                      >
                        <div className="surface-raised bg-stone-50/70 dark:bg-stone-100/40 rounded-xl sm:rounded-2xl border border-stone-200/90 p-2 sm:p-3.5 flex flex-col justify-between relative group hover:border-stone-400 transition h-full">
                          {/* Remove X Button */}
                          <button
                            type="button"
                            onClick={() => onRemoveProperty(prop)}
                            className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                            title="Remove from comparison"
                            aria-label={`Remove ${prop.title} from comparison`}
                          >
                            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>

                          <div>
                            {/* Photo */}
                            <div className="relative aspect-[16/10] w-full rounded-lg sm:rounded-xl overflow-hidden bg-stone-200 mb-2">
                              <Image
                                src={prop.image}
                                alt={prop.title}
                                fill
                                sizes="(max-width: 768px) 180px, 240px"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {prop.badge && (
                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-stone-900/80 backdrop-blur-xs text-[9px] sm:text-[10px] font-semibold text-white">
                                  {prop.badge}
                                </span>
                              )}
                            </div>

                            {/* Title & Location */}
                            <Link
                              href={`/property/${prop.slug || prop.id}`}
                              className="font-serif font-bold text-xs sm:text-base text-stone-900 hover:text-stone-600 block line-clamp-1 transition-colors leading-snug"
                            >
                              {prop.title}
                            </Link>
                            <p className="text-[10px] sm:text-[11px] text-stone-500 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate">{prop.location}</span>
                            </p>

                            {/* Price & Price per sq.ft */}
                            <div className="mt-2 pt-1.5 border-t border-stone-200/70 flex items-baseline justify-between gap-1">
                              <div className="text-sm sm:text-lg font-bold text-stone-950 font-serif leading-none">
                                {prop.price}
                              </div>
                              {priceSqft && (
                                <div className="text-[10px] sm:text-[11px] font-medium text-stone-500 leading-none">
                                  {priceSqft}
                                </div>
                              )}
                            </div>
                            {estEMI && (
                              <div className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1 leading-none">
                                EMI: {estEMI}
                              </div>
                            )}
                          </div>

                          {/* CTAs */}
                          <div className="mt-2.5 grid grid-cols-2 gap-1 pt-1.5 border-t border-stone-200/70">
                            <Link
                              href={`/property/${prop.slug || prop.id}`}
                              className="px-2 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-[10px] sm:text-xs font-semibold text-center transition flex items-center justify-center gap-1 shadow-xs"
                            >
                              <span>View</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                            <button
                              type="button"
                              onClick={() =>
                                onSelectPropertyForEnquiry && onSelectPropertyForEnquiry(prop)
                              }
                              className="px-2 py-1.5 rounded-lg border border-stone-300 hover:border-stone-800 text-stone-800 hover:bg-stone-100 text-[10px] sm:text-xs font-semibold text-center transition cursor-pointer"
                            >
                              Enquire
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}

                  {/* Add Property Slot Header (if < 3) */}
                  {compareList.length < 3 && (
                    <th className="p-1 sm:p-3 w-[170px] sm:w-[200px] min-w-[170px] sm:min-w-[200px] align-top font-normal border-b border-stone-200">
                      <div className="rounded-xl sm:rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-300 p-3 sm:p-4 flex flex-col items-center justify-center text-center relative bg-stone-50/40 h-full min-h-[190px]">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-1.5">
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-xs font-bold text-stone-900 mb-0.5">
                          Add Property
                        </span>
                        <p className="text-[10px] sm:text-[11px] text-stone-500 mb-2.5 max-w-[140px] leading-tight">
                          Compare with another estate
                        </p>

                        <div className="relative w-full">
                          <button
                            type="button"
                            onClick={() => setAddDropdownOpen((prev) => !prev)}
                            className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-stone-50 border border-stone-300 text-[11px] sm:text-xs font-semibold text-stone-800 flex items-center justify-between gap-1 hover:border-stone-500 transition cursor-pointer shadow-xs"
                          >
                            <span className="truncate">Select Estate</span>
                            <ChevronDown className="w-3 h-3 shrink-0 text-stone-400" />
                          </button>

                          {addDropdownOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto surface-raised bg-white dark:bg-stone-50 border border-stone-200 rounded-xl shadow-xl p-1 z-30 divide-y divide-stone-100 text-left">
                              {availableToAdd.length === 0 ? (
                                <div className="p-2 text-xs text-stone-400 text-center">
                                  No more listings
                                </div>
                              ) : (
                                availableToAdd.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      onAddProperty(p);
                                      setAddDropdownOpen(false);
                                    }}
                                    className="w-full p-1.5 sm:p-2 text-left hover:bg-stone-100 rounded-lg flex items-center justify-between gap-1.5 cursor-pointer transition"
                                  >
                                    <div className="min-w-0">
                                      <div className="text-[11px] font-bold text-stone-900 truncate">
                                        {p.title}
                                      </div>
                                      <div className="text-[10px] text-stone-500 truncate">
                                        {p.location}
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-semibold text-stone-800 shrink-0 font-mono">
                                      {p.price}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100 dark:divide-stone-200/50">
                {/* ──────────────────────────────────────────────────────────── */}
                {/* CATEGORY 1: PRICING & FINANCIALS */}
                {/* ──────────────────────────────────────────────────────────── */}
                <tr className="bg-stone-100/70 dark:bg-stone-200/40">
                  <td
                    colSpan={totalColumns}
                    className="px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500"
                  >
                    Pricing &amp; Financials
                  </td>
                </tr>

                {/* Purchase Price */}
                <tr
                  className={
                    highlightDifferences && isDifferent((p) => p.priceNum)
                      ? 'bg-amber-500/10 dark:bg-amber-950/20'
                      : 'hover:bg-stone-50/60'
                  }
                >
                  <th className="sticky left-0 z-20 surface-raised bg-white dark:bg-stone-50 border-r border-stone-200 p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-600 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    Total Price
                  </th>
                  {compareList.map((p) => (
                    <td
                      key={p.id}
                      className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-bold text-stone-950 font-mono"
                    >
                      {p.price}
                    </td>
                  ))}
                  {compareList.length < 3 && <td className="p-2 text-stone-300 text-xs">-</td>}
                </tr>

                {/* Price / sq.ft */}
                <tr
                  className={
                    highlightDifferences &&
                    isDifferent((p) => calculatePricePerSqft(p.priceNum, p.area))
                      ? 'bg-amber-500/10 dark:bg-amber-950/20'
                      : 'hover:bg-stone-50/60'
                  }
                >
                  <th className="sticky left-0 z-20 surface-raised bg-white dark:bg-stone-50 border-r border-stone-200 p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-600 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    Price / sq.ft
                  </th>
                  {compareList.map((p) => (
                    <td
                      key={p.id}
                      className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-medium text-stone-800"
                    >
                      {calculatePricePerSqft(p.priceNum, p.area) || 'On Request'}
                    </td>
                  ))}
                  {compareList.length < 3 && <td className="p-2 text-stone-300 text-xs">-</td>}
                </tr>

                {/* Est. EMI */}
                <tr
                  className={
                    highlightDifferences && isDifferent((p) => calculateEstEMI(p.priceNum))
                      ? 'bg-amber-500/10 dark:bg-amber-950/20'
                      : 'hover:bg-stone-50/60'
                  }
                >
                  <th className="sticky left-0 z-20 surface-raised bg-white dark:bg-stone-50 border-r border-stone-200 p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-600 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    Est. EMI (20 Yrs)
                  </th>
                  {compareList.map((p) => (
                    <td
                      key={p.id}
                      className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                    >
                      {calculateEstEMI(p.priceNum) || 'Contact Sales'}
                    </td>
                  ))}
                  {compareList.length < 3 && <td className="p-2 text-stone-300 text-xs">-</td>}
                </tr>

                {/* Rental Estimate */}
                <tr
                  className={
                    highlightDifferences && isDifferent((p) => p.rentPrice)
                      ? 'bg-amber-500/10 dark:bg-amber-950/20'
                      : 'hover:bg-stone-50/60'
                  }
                >
                  <th className="sticky left-0 z-20 surface-raised bg-white dark:bg-stone-50 border-r border-stone-200 p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-600 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    Rental Value
                  </th>
                  {compareList.map((p) => (
                    <td
                      key={p.id}
                      className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-medium text-stone-800"
                    >
                      {p.rentPrice || 'N/A'}
                    </td>
                  ))}
                  {compareList.length < 3 && <td className="p-2 text-stone-300 text-xs">-</td>}
                </tr>

                {/* ──────────────────────────────────────────────────────────── */}
                {/* CATEGORY 2: SPACE & CONFIGURATION */}
                {/* ──────────────────────────────────────────────────────────── */}
                <tr className="bg-stone-100/70 dark:bg-stone-200/40">
                  <td
                    colSpan={totalColumns}
                    className="px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500"
                  >
                    Space &amp; Configuration
                  </td>
                </tr>

                {/* Property Type */}
                <tr
                  className={
                    highlightDifferences && isDifferent((p) => p.type)
                      ? 'bg-amber-500/10 dark:bg-amber-950/20'
                      : 'hover:bg-stone-50/60'
                  }
                >
                  <th className="sticky left-0 z-20 surface-raised bg-white dark:bg-stone-50 border-r border-stone-200 p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-600 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    Type
                  </th>
                  {compareList.map((p) => (
                    <td
                      key={p.id}
                      className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-900"
                    >
                      {p.type}
                    </td>
                  ))}
                  {compareList.length < 3 && <td className="p-2 text-stone-300 text-xs">-</td>}
                </tr>

                {/* Bedrooms */}
                <tr
                  className={
                    highlightDifferences && isDifferent((p) => p.beds)
                      ? 'bg-amber-500/10 dark:bg-amber-950/20'
                      : 'hover:bg-stone-50/60'
                  }
                >
                  <th className="sticky left-0 z-20 surface-raised bg-white dark:bg-stone-50 border-r border-stone-200 p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-600 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    Bedrooms
                  </th>
                  {compareList.map((p) => (
                    <td
                      key={p.id}
                      className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-medium text-stone-800"
                    >
                      <div className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{p.beds}</span>
                      </div>
                    </td>
                  ))}
                  {compareList.length < 3 && <td className="p-2 text-stone-300 text-xs">-</td>}
                </tr>

                {/* Bathrooms */}
                <tr
                  className={
                    highlightDifferences && isDifferent((p) => p.baths)
                      ? 'bg-amber-500/10 dark:bg-amber-950/20'
                      : 'hover:bg-stone-50/60'
                  }
                >
                  <th className="sticky left-0 z-20 surface-raised bg-white dark:bg-stone-50 border-r border-stone-200 p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-600 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    Bathrooms
                  </th>
                  {compareList.map((p) => (
                    <td
                      key={p.id}
                      className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-medium text-stone-800"
                    >
                      <div className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{p.baths || '4 Baths'}</span>
                      </div>
                    </td>
                  ))}
                  {compareList.length < 3 && <td className="p-2 text-stone-300 text-xs">-</td>}
                </tr>

                {/* Carpet Area */}
                <tr
                  className={
                    highlightDifferences && isDifferent((p) => p.area)
                      ? 'bg-amber-500/10 dark:bg-amber-950/20'
                      : 'hover:bg-stone-50/60'
                  }
                >
                  <th className="sticky left-0 z-20 surface-raised bg-white dark:bg-stone-50 border-r border-stone-200 p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-600 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    Carpet Area
                  </th>
                  {compareList.map((p) => (
                    <td
                      key={p.id}
                      className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-900"
                    >
                      <div className="flex items-center gap-1">
                        <Maximize2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{p.area}</span>
                      </div>
                    </td>
                  ))}
                  {compareList.length < 3 && <td className="p-2 text-stone-300 text-xs">-</td>}
                </tr>

                {/* Possession */}
                <tr
                  className={
                    highlightDifferences && isDifferent((p) => p.possession)
                      ? 'bg-amber-500/10 dark:bg-amber-950/20'
                      : 'hover:bg-stone-50/60'
                  }
                >
                  <th className="sticky left-0 z-20 surface-raised bg-white dark:bg-stone-50 border-r border-stone-200 p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-600 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    Possession
                  </th>
                  {compareList.map((p) => (
                    <td
                      key={p.id}
                      className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-medium text-stone-800"
                    >
                      {p.possession || 'Ready to Move'}
                    </td>
                  ))}
                  {compareList.length < 3 && <td className="p-2 text-stone-300 text-xs">-</td>}
                </tr>

                {/* Builder / Architect */}
                <tr
                  className={
                    highlightDifferences && isDifferent((p) => p.builder)
                      ? 'bg-amber-500/10 dark:bg-amber-950/20'
                      : 'hover:bg-stone-50/60'
                  }
                >
                  <th className="sticky left-0 z-20 surface-raised bg-white dark:bg-stone-50 border-r border-stone-200 p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-600 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    Developer
                  </th>
                  {compareList.map((p) => (
                    <td
                      key={p.id}
                      className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-medium text-stone-800"
                    >
                      {p.builder || 'Dwarkesh Luxury'}
                    </td>
                  ))}
                  {compareList.length < 3 && <td className="p-2 text-stone-300 text-xs">-</td>}
                </tr>

                {/* ──────────────────────────────────────────────────────────── */}
                {/* CATEGORY 3: HIGHLIGHTS */}
                {/* ──────────────────────────────────────────────────────────── */}
                <tr className="bg-stone-100/70 dark:bg-stone-200/40">
                  <td
                    colSpan={totalColumns}
                    className="px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500"
                  >
                    Architectural Highlights
                  </td>
                </tr>
                <tr>
                  <th className="sticky left-0 z-20 surface-raised bg-white dark:bg-stone-50 border-r border-stone-200 p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-600 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)] align-top">
                    Highlights
                  </th>
                  {compareList.map((p) => {
                    const detail = propertyDetailsMap[p.id];
                    const highlights = detail?.highlights || [];
                    return (
                      <td key={p.id} className="p-2 sm:p-2.5 align-top">
                        <div className="space-y-1">
                          {highlights.length > 0 ? (
                            highlights.map((h, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-1 text-[10px] sm:text-xs text-stone-800 leading-tight"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{h}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] sm:text-xs text-stone-600 line-clamp-3 leading-snug">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {compareList.length < 3 && <td className="p-2 text-stone-300 text-xs">-</td>}
                </tr>

                {/* ──────────────────────────────────────────────────────────── */}
                {/* CATEGORY 4: AMENITIES & FEATURES */}
                {/* ──────────────────────────────────────────────────────────── */}
                <tr className="bg-stone-100/70 dark:bg-stone-200/40">
                  <td
                    colSpan={totalColumns}
                    className="px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500"
                  >
                    Amenities &amp; Features
                  </td>
                </tr>

                {commonAmenities.map(({ key, label }) => {
                  const differs = isDifferent((p) => {
                    const detail = propertyDetailsMap[p.id];
                    return (detail?.amenities || []).includes(key);
                  });

                  return (
                    <tr
                      key={key}
                      className={
                        highlightDifferences && differs
                          ? 'bg-amber-500/10 dark:bg-amber-950/20'
                          : 'hover:bg-stone-50/60'
                      }
                    >
                      <th className="sticky left-0 z-20 surface-raised bg-white dark:bg-stone-50 border-r border-stone-200 p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-600 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                        {label}
                      </th>
                      {compareList.map((p) => {
                        const detail = propertyDetailsMap[p.id];
                        const hasAmenity = (detail?.amenities || []).includes(key);
                        return (
                          <td key={p.id} className="p-2 sm:p-2.5">
                            {hasAmenity ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] sm:text-[11px]">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Yes</span>
                              </span>
                            ) : (
                              <span className="text-stone-300 text-xs font-bold">-</span>
                            )}
                          </td>
                        );
                      })}
                      {compareList.length < 3 && <td className="p-2 text-stone-300 text-xs">-</td>}
                    </tr>
                  );
                })}

                {/* ──────────────────────────────────────────────────────────── */}
                {/* CATEGORY 5: CONNECTIVITY & LOCATION */}
                {/* ──────────────────────────────────────────────────────────── */}
                <tr className="bg-stone-100/70 dark:bg-stone-200/40">
                  <td
                    colSpan={totalColumns}
                    className="px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500"
                  >
                    Neighbourhood &amp; Connectivity
                  </td>
                </tr>

                {/* City */}
                <tr className="hover:bg-stone-50/60">
                  <th className="sticky left-0 z-20 surface-raised bg-white dark:bg-stone-50 border-r border-stone-200 p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-600 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    City / Market
                  </th>
                  {compareList.map((p) => (
                    <td
                      key={p.id}
                      className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-medium text-stone-900"
                    >
                      {p.city}
                    </td>
                  ))}
                  {compareList.length < 3 && <td className="p-2 text-stone-300 text-xs">-</td>}
                </tr>

                {/* Airport Distance */}
                <tr className="hover:bg-stone-50/60">
                  <th className="sticky left-0 z-20 surface-raised bg-white dark:bg-stone-50 border-r border-stone-200 p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold text-stone-600 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    Airport
                  </th>
                  {compareList.map((p) => {
                    const detail = propertyDetailsMap[p.id];
                    const airport = (detail?.nearby || []).find((n) => n.type === 'airport');
                    return (
                      <td
                        key={p.id}
                        className="p-2 sm:p-2.5 text-[11px] sm:text-xs font-medium text-stone-700"
                      >
                        {airport ? `${airport.name} (${airport.km} km)` : 'Within 25 km'}
                      </td>
                    );
                  })}
                  {compareList.length < 3 && <td className="p-2 text-stone-300 text-xs">-</td>}
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Bottom Sticky Footer Actions */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-t border-stone-200 dark:border-stone-200 bg-stone-50/80 dark:bg-stone-100/60 sticky bottom-0 z-30 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs text-stone-500 hidden sm:inline">
              Need personalized assistance choosing between these estates?
            </span>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              {/* WhatsApp Share */}
              <button
                type="button"
                onClick={() => {
                  const text = encodeURIComponent(
                    `Hello CharDiwari desk! I am comparing:\n${compareList
                      .map((p) => `• ${p.title} (${p.price} in ${p.location})`)
                      .join('\n')}\nCould you help me choose the best option?`
                  );
                  window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
                }}
                className="px-3 py-2 rounded-xl border border-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </button>

              {/* Done Comparing */}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold text-center transition cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
