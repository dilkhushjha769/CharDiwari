'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowLeftRight,
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
    return `₹${(emi / 100000).toFixed(2)} L/mo`;
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

  // Mobile comparison slots (indices of the 2 active properties to compare side-by-side)
  const [mobileSlotA, setMobileSlotA] = useState(0);
  const [mobileSlotB, setMobileSlotB] = useState(1);

  // Ensure valid indices when compareList changes
  useEffect(() => {
    if (compareList.length > 0) {
      setMobileSlotA(0);
      setMobileSlotB(compareList.length > 1 ? 1 : 0);
    }
  }, [compareList.length]);

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

  // Desktop Executive Summary Stats (Fills the left column elegantly)
  const summaryStats = useMemo(() => {
    if (compareList.length === 0) return null;
    const prices = compareList.map((p) => p.priceNum).filter(Boolean);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const priceRangeText =
      minP === maxP
        ? `₹${minP.toFixed(2)} Cr`
        : `₹${minP.toFixed(2)} – ₹${maxP.toFixed(2)} Cr`;

    const cities = Array.from(new Set(compareList.map((p) => p.city).filter(Boolean)));
    const citiesSummary = cities.join(', ');

    const bhks = Array.from(
      new Set(compareList.map((p) => p.beds?.replace(/[^\d]/g, '')).filter(Boolean))
    ).sort((a, b) => Number(a) - Number(b));
    const bhkSummary =
      bhks.length > 1
        ? `${bhks[0]} to ${bhks[bhks.length - 1]} BHK`
        : bhks.length === 1
        ? `${bhks[0]} BHK`
        : 'Multiple';

    return { priceRangeText, citiesSummary, bhkSummary };
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

  const isMobileDifferent = (getter) => {
    const propA = compareList[mobileSlotA];
    const propB = compareList[mobileSlotB];
    if (!propA || !propB || propA.id === propB.id) return false;
    return getter(propA) !== getter(propB);
  };

  const activeMobilePropA = compareList[mobileSlotA] || compareList[0];
  const activeMobilePropB = compareList[mobileSlotB] || compareList[1] || compareList[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
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
        className="relative surface-raised bg-white dark:bg-stone-50 rounded-t-2xl md:rounded-3xl border-t md:border border-stone-200/90 shadow-2xl w-full max-w-6xl h-[92dvh] md:h-auto md:max-h-[92vh] flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
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
                {compareList.length} Selected
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

          {/* Subtitle (Desktop only) */}
          <p className="text-xs text-stone-500 mt-1 hidden md:block">
            Review prices, floor plans, amenities, and connectivity side-by-side
          </p>

          {/* Mobile Comparison Pair Switcher (When 3 properties are selected) */}
          {compareList.length === 3 && (
            <div className="md:hidden mt-2.5 pt-2 border-t border-stone-200/70 flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
                Compare:
              </span>
              <div className="grid grid-cols-3 gap-1 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileSlotA(0);
                    setMobileSlotB(1);
                  }}
                  className={`px-1.5 py-1 rounded-lg text-[10px] font-bold text-center truncate transition ${
                    mobileSlotA === 0 && mobileSlotB === 1
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white dark:bg-stone-50 border border-stone-200 text-stone-700'
                  }`}
                >
                  1 vs 2
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileSlotA(1);
                    setMobileSlotB(2);
                  }}
                  className={`px-1.5 py-1 rounded-lg text-[10px] font-bold text-center truncate transition ${
                    mobileSlotA === 1 && mobileSlotB === 2
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white dark:bg-stone-50 border border-stone-200 text-stone-700'
                  }`}
                >
                  2 vs 3
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileSlotA(0);
                    setMobileSlotB(2);
                  }}
                  className={`px-1.5 py-1 rounded-lg text-[10px] font-bold text-center truncate transition ${
                    mobileSlotA === 0 && mobileSlotB === 2
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white dark:bg-stone-50 border border-stone-200 text-stone-700'
                  }`}
                >
                  1 vs 3
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
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
            <>
              {/* ============================================================== */}
              {/* MOBILE 2-COLUMN VIEW (md:hidden) — Zero white box, 100% clean */}
              {/* ============================================================== */}
              <div className="md:hidden space-y-3">
                {/* Mobile Top 2 Property Cards */}
                <div className="grid grid-cols-2 gap-2">
                  {[activeMobilePropA, activeMobilePropB].map((prop, idx) => {
                    if (!prop) return null;
                    const estEMI = calculateEstEMI(prop.priceNum);
                    const priceSqft = calculatePricePerSqft(prop.priceNum, prop.area);
                    const slotIndex = idx === 0 ? mobileSlotA : mobileSlotB;

                    return (
                      <div
                        key={`${prop.id}-${idx}`}
                        className="surface-raised bg-stone-50/70 dark:bg-stone-100/40 rounded-xl border border-stone-200/90 p-2 flex flex-col justify-between relative"
                      >
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => onRemoveProperty(prop)}
                          className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                          aria-label={`Remove ${prop.title}`}
                        >
                          <X className="w-3 h-3" />
                        </button>

                        <div>
                          {/* Photo */}
                          <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-stone-200 mb-1.5">
                            <Image
                              src={prop.image}
                              alt={prop.title}
                              fill
                              sizes="180px"
                              className="object-cover"
                            />
                            {prop.badge && (
                              <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-stone-900/80 backdrop-blur-xs text-[8px] font-semibold text-white truncate max-w-[85%]">
                                {prop.badge}
                              </span>
                            )}
                          </div>

                          {/* Title & Locality */}
                          <Link
                            href={`/property/${prop.slug || prop.id}`}
                            className="font-serif font-bold text-xs text-stone-900 hover:text-stone-600 block line-clamp-1 transition-colors leading-tight"
                          >
                            {prop.title}
                          </Link>
                          <p className="text-[10px] text-stone-500 truncate mt-0.5">
                            {prop.location}
                          </p>

                          {/* Price */}
                          <div className="mt-1.5 pt-1 border-t border-stone-200/70 flex items-baseline justify-between gap-1">
                            <span className="text-xs font-bold text-stone-950 font-serif leading-none">
                              {prop.price}
                            </span>
                            {priceSqft && (
                              <span className="text-[9px] text-stone-500 leading-none">
                                {priceSqft}
                              </span>
                            )}
                          </div>
                          {estEMI && (
                            <div className="text-[9px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5 leading-none">
                              EMI: {estEMI}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-2 grid grid-cols-2 gap-1 pt-1 border-t border-stone-200/70">
                          <Link
                            href={`/property/${prop.slug || prop.id}`}
                            className="px-1.5 py-1 rounded bg-stone-900 text-white text-[10px] font-semibold text-center flex items-center justify-center gap-0.5 shadow-xs"
                          >
                            <span>View</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              onSelectPropertyForEnquiry && onSelectPropertyForEnquiry(prop)
                            }
                            className="px-1.5 py-1 rounded border border-stone-300 text-stone-800 text-[10px] font-semibold text-center"
                          >
                            Enquire
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Side-by-Side Spec Rows */}
                <div className="space-y-1.5">
                  {[
                    {
                      label: 'Total Purchase Price',
                      valA: activeMobilePropA.price,
                      valB: activeMobilePropB.price,
                      getter: (p) => p.priceNum,
                      mono: true,
                    },
                    {
                      label: 'Price / sq.ft',
                      valA: calculatePricePerSqft(activeMobilePropA.priceNum, activeMobilePropA.area) || 'On Request',
                      valB: calculatePricePerSqft(activeMobilePropB.priceNum, activeMobilePropB.area) || 'On Request',
                      getter: (p) => calculatePricePerSqft(p.priceNum, p.area),
                    },
                    {
                      label: 'Est. EMI (20 Yrs @ 8.5%)',
                      valA: calculateEstEMI(activeMobilePropA.priceNum) || 'Contact',
                      valB: calculateEstEMI(activeMobilePropB.priceNum) || 'Contact',
                      getter: (p) => calculateEstEMI(p.priceNum),
                      accent: true,
                    },
                    {
                      label: 'Carpet Area',
                      valA: activeMobilePropA.area,
                      valB: activeMobilePropB.area,
                      getter: (p) => p.area,
                    },
                    {
                      label: 'Bedrooms & Baths',
                      valA: `${activeMobilePropA.beds} • ${activeMobilePropA.baths || '4 Baths'}`,
                      valB: `${activeMobilePropB.beds} • ${activeMobilePropB.baths || '4 Baths'}`,
                      getter: (p) => `${p.beds}-${p.baths}`,
                    },
                    {
                      label: 'Property Type',
                      valA: activeMobilePropA.type,
                      valB: activeMobilePropB.type,
                      getter: (p) => p.type,
                    },
                    {
                      label: 'Possession',
                      valA: activeMobilePropA.possession || 'Ready to Move',
                      valB: activeMobilePropB.possession || 'Ready to Move',
                      getter: (p) => p.possession,
                    },
                    {
                      label: 'Architect / Developer',
                      valA: activeMobilePropA.builder || 'Dwarkesh',
                      valB: activeMobilePropB.builder || 'Dwarkesh',
                      getter: (p) => p.builder,
                    },
                    {
                      label: 'Rental Value Estimate',
                      valA: activeMobilePropA.rentPrice || 'N/A',
                      valB: activeMobilePropB.rentPrice || 'N/A',
                      getter: (p) => p.rentPrice,
                    },
                  ].map((row, i) => {
                    const differs = highlightDifferences && isMobileDifferent(row.getter);

                    return (
                      <div
                        key={i}
                        className={`p-2 rounded-xl border transition ${
                          differs
                            ? 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50'
                            : 'bg-stone-50/60 dark:bg-stone-100/30 border-stone-200/80'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 text-center mb-1">
                          {row.label}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center items-center">
                          <div
                            className={`text-xs font-semibold truncate border-r border-stone-200/80 pr-1 ${
                              row.accent
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : row.mono
                                ? 'font-mono text-stone-950'
                                : 'text-stone-900'
                            }`}
                          >
                            {row.valA}
                          </div>
                          <div
                            className={`text-xs font-semibold truncate pl-1 ${
                              row.accent
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : row.mono
                                ? 'font-mono text-stone-950'
                                : 'text-stone-900'
                            }`}
                          >
                            {row.valB}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Amenities Checklist */}
                <div className="pt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 px-1">
                    Amenities &amp; Facilities
                  </div>
                  <div className="space-y-1">
                    {commonAmenities.map(({ key, label }) => {
                      const detA = propertyDetailsMap[activeMobilePropA.id];
                      const detB = propertyDetailsMap[activeMobilePropB.id];
                      const hasA = (detA?.amenities || []).includes(key);
                      const hasB = (detB?.amenities || []).includes(key);
                      const differs = highlightDifferences && hasA !== hasB;

                      return (
                        <div
                          key={key}
                          className={`p-1.5 px-2.5 rounded-lg border flex items-center justify-between text-xs ${
                            differs
                              ? 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50'
                              : 'bg-stone-50/40 border-stone-200/60'
                          }`}
                        >
                          <span className="text-[11px] font-medium text-stone-600 truncate max-w-[120px]">
                            {label}
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-center w-28">
                            <span className="font-semibold text-[11px]">
                              {hasA ? (
                                <span className="text-emerald-600 font-bold">✓ Included</span>
                              ) : (
                                <span className="text-stone-300">-</span>
                              )}
                            </span>
                            <span className="font-semibold text-[11px]">
                              {hasB ? (
                                <span className="text-emerald-600 font-bold">✓ Included</span>
                              ) : (
                                <span className="text-stone-300">-</span>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Highlights Section */}
                <div className="pt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 px-1">
                    Architectural Highlights
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[activeMobilePropA, activeMobilePropB].map((prop, idx) => {
                      const det = propertyDetailsMap[prop.id];
                      const highlights = det?.highlights || [];

                      return (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-stone-50/60 dark:bg-stone-100/30 border border-stone-200/80 text-[10px] space-y-1"
                        >
                          <span className="font-bold text-stone-900 block truncate mb-1">
                            {prop.title.replace(/^The\s+/i, '')}
                          </span>
                          {highlights.length > 0 ? (
                            highlights.map((h, i) => (
                              <div key={i} className="flex items-start gap-1 text-stone-700 leading-tight">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{h}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-stone-600 line-clamp-3 leading-snug">
                              {prop.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* DESKTOP FULL-WIDTH GRID VIEW (hidden md:block) */}
              {/* ============================================================== */}
              <div className="hidden md:block space-y-6">
                {/* Top Estate Cards Grid */}
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `210px repeat(${compareList.length}, minmax(220px, 1fr)) ${
                      compareList.length < 3 ? 'minmax(200px, 1fr)' : ''
                    }`,
                  }}
                >
                  {/* Left Column: Executive Overview & Summary Card (Eliminates the empty whitespace) */}
                  <div className="surface-raised bg-stone-50/80 dark:bg-stone-100/40 rounded-2xl border border-stone-200/90 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block leading-tight">
                            Shortlist Overview
                          </span>
                          <span className="text-xs font-bold text-stone-900 leading-tight">
                            {compareList.length} Selected Estates
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-stone-500 leading-relaxed mt-2.5">
                        Side-by-side analysis of carpet area, architectural layout, pricing, and lifestyle amenities.
                      </p>

                      {/* Summary Metrics Box */}
                      {summaryStats && (
                        <div className="mt-3.5 p-2.5 rounded-xl bg-white dark:bg-stone-50/80 border border-stone-200/80 space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-500">Price Range</span>
                            <span className="font-bold text-stone-950 font-mono text-[11px]">
                              {summaryStats.priceRangeText}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-stone-100 dark:border-stone-200/60">
                            <span className="text-stone-500">Bedrooms</span>
                            <span className="font-semibold text-stone-800 text-[11px]">
                              {summaryStats.bhkSummary}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-stone-100 dark:border-stone-200/60">
                            <span className="text-stone-500">Markets</span>
                            <span
                              className="font-semibold text-stone-800 text-[10px] truncate max-w-[100px]"
                              title={summaryStats.citiesSummary}
                            >
                              {summaryStats.citiesSummary}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Differences Toggle Button inside Overview Card */}
                    <div className="mt-3.5 pt-2.5 border-t border-stone-200/70">
                      <button
                        type="button"
                        onClick={() => setHighlightDifferences((prev) => !prev)}
                        className={`w-full py-2 px-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                          highlightDifferences
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-300'
                            : 'bg-white dark:bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {highlightDifferences ? (
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                        )}
                        <span className="text-[11px]">
                          {highlightDifferences ? 'Differences Highlighted' : 'Highlight Differences'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Property Cards */}
                  {compareList.map((prop) => {
                    const estEMI = calculateEstEMI(prop.priceNum);
                    const priceSqft = calculatePricePerSqft(prop.priceNum, prop.area);

                    return (
                      <div
                        key={prop.id}
                        className="surface-raised bg-stone-50/70 dark:bg-stone-100/40 rounded-2xl border border-stone-200/90 p-3.5 flex flex-col justify-between relative group hover:border-stone-400 transition"
                      >
                        <button
                          type="button"
                          onClick={() => onRemoveProperty(prop)}
                          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                          title="Remove from comparison"
                          aria-label={`Remove ${prop.title} from comparison`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div>
                          <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-stone-200 mb-2.5">
                            <Image
                              src={prop.image}
                              alt={prop.title}
                              fill
                              sizes="320px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {prop.badge && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-[10px] font-semibold text-white">
                                {prop.badge}
                              </span>
                            )}
                          </div>

                          <Link
                            href={`/property/${prop.slug || prop.id}`}
                            className="font-serif font-bold text-base text-stone-900 hover:text-stone-600 block line-clamp-1 transition-colors"
                          >
                            {prop.title}
                          </Link>
                          <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{prop.location}</span>
                          </p>

                          <div className="mt-2.5 pt-2 border-t border-stone-200/70 flex items-baseline justify-between gap-1">
                            <div className="text-lg font-bold text-stone-950 font-serif">
                              {prop.price}
                            </div>
                            {priceSqft && (
                              <div className="text-[11px] font-medium text-stone-500">
                                {priceSqft}
                              </div>
                            )}
                          </div>
                          {estEMI && (
                            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                              Est. EMI: {estEMI}
                            </div>
                          )}
                        </div>

                        <div className="mt-3.5 grid grid-cols-2 gap-1.5 pt-2 border-t border-stone-200/70">
                          <Link
                            href={`/property/${prop.slug || prop.id}`}
                            className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-semibold text-center transition flex items-center justify-center gap-1 shadow-xs"
                          >
                            <span>Explore</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              onSelectPropertyForEnquiry && onSelectPropertyForEnquiry(prop)
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-stone-300 hover:border-stone-800 text-stone-800 hover:bg-stone-100 text-xs font-semibold text-center transition cursor-pointer"
                          >
                            Enquire
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Property Slot (Desktop) */}
                  {compareList.length < 3 && (
                    <div className="rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-300 p-4 flex flex-col items-center justify-center text-center relative bg-stone-50/40">
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-2">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-stone-900 mb-0.5">
                        Add Property
                      </span>
                      <p className="text-[11px] text-stone-500 mb-3 max-w-[140px]">
                        Compare with another estate
                      </p>

                      <div className="relative w-full">
                        <button
                          type="button"
                          onClick={() => setAddDropdownOpen((prev) => !prev)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-50 border border-stone-300 text-xs font-semibold text-stone-800 flex items-center justify-between gap-1 hover:border-stone-500 transition cursor-pointer shadow-xs"
                        >
                          <span className="truncate">Select Estate</span>
                          <ChevronDown className="w-3.5 h-3.5 shrink-0 text-stone-400" />
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
                                  className="w-full p-2 text-left hover:bg-stone-100 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition"
                                >
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-stone-900 truncate">
                                      {p.title}
                                    </div>
                                    <div className="text-[10px] text-stone-500 truncate">
                                      {p.location} • {p.beds}
                                    </div>
                                  </div>
                                  <span className="text-xs font-semibold text-stone-800 shrink-0 font-mono">
                                    {p.price}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop Detailed Comparison Rows */}
                <div className="divide-y divide-stone-200/90 pt-4">
                  {/* Category: Pricing */}
                  <div className="py-4 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                      Pricing &amp; Terms
                    </h4>
                    {[
                      {
                        label: 'Total Purchase Price',
                        val: (p) => p.price,
                        diff: (p) => p.priceNum,
                        mono: true,
                      },
                      {
                        label: 'Price / sq.ft',
                        val: (p) => calculatePricePerSqft(p.priceNum, p.area) || 'On Request',
                        diff: (p) => calculatePricePerSqft(p.priceNum, p.area),
                      },
                      {
                        label: 'Est. EMI (20 Yrs @ 8.5%)',
                        val: (p) => calculateEstEMI(p.priceNum) || 'Contact',
                        diff: (p) => calculateEstEMI(p.priceNum),
                        accent: true,
                      },
                      {
                        label: 'Rental Estimate',
                        val: (p) => p.rentPrice || 'N/A',
                        diff: (p) => p.rentPrice,
                      },
                    ].map((row, i) => {
                      const differs = highlightDifferences && isDifferent(row.diff);
                      return (
                        <div
                          key={i}
                          className={`grid gap-4 py-2 px-3 rounded-lg text-xs items-center ${
                            differs
                              ? 'bg-amber-500/10 dark:bg-amber-950/20'
                              : 'hover:bg-stone-50/60'
                          }`}
                          style={{
                            gridTemplateColumns: `210px repeat(${compareList.length}, minmax(220px, 1fr)) ${
                              compareList.length < 3 ? 'minmax(200px, 1fr)' : ''
                            }`,
                          }}
                        >
                          <span className="font-semibold text-stone-600">{row.label}</span>
                          {compareList.map((p) => (
                            <span
                              key={p.id}
                              className={`font-semibold ${
                                row.accent
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : row.mono
                                  ? 'font-mono text-stone-950 text-sm'
                                  : 'text-stone-900'
                              }`}
                            >
                              {row.val(p)}
                            </span>
                          ))}
                          {compareList.length < 3 && <span className="text-stone-300">-</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Category: Space */}
                  <div className="py-4 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                      Space &amp; Configuration
                    </h4>
                    {[
                      {
                        label: 'Property Type',
                        val: (p) => p.type,
                        diff: (p) => p.type,
                      },
                      {
                        label: 'Bedrooms',
                        val: (p) => p.beds,
                        diff: (p) => p.beds,
                      },
                      {
                        label: 'Bathrooms',
                        val: (p) => p.baths || '4 Baths',
                        diff: (p) => p.baths,
                      },
                      {
                        label: 'Carpet Area',
                        val: (p) => p.area,
                        diff: (p) => p.area,
                      },
                      {
                        label: 'Possession',
                        val: (p) => p.possession || 'Ready to Move',
                        diff: (p) => p.possession,
                      },
                      {
                        label: 'Developer',
                        val: (p) => p.builder || 'Dwarkesh',
                        diff: (p) => p.builder,
                      },
                    ].map((row, i) => {
                      const differs = highlightDifferences && isDifferent(row.diff);
                      return (
                        <div
                          key={i}
                          className={`grid gap-4 py-2 px-3 rounded-lg text-xs items-center ${
                            differs
                              ? 'bg-amber-500/10 dark:bg-amber-950/20'
                              : 'hover:bg-stone-50/60'
                          }`}
                          style={{
                            gridTemplateColumns: `210px repeat(${compareList.length}, minmax(220px, 1fr)) ${
                              compareList.length < 3 ? 'minmax(200px, 1fr)' : ''
                            }`,
                          }}
                        >
                          <span className="font-semibold text-stone-600">{row.label}</span>
                          {compareList.map((p) => (
                            <span key={p.id} className="font-medium text-stone-900">
                              {row.val(p)}
                            </span>
                          ))}
                          {compareList.length < 3 && <span className="text-stone-300">-</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Category: Amenities */}
                  <div className="py-4 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                      Amenities &amp; Features
                    </h4>
                    {commonAmenities.map(({ key, label }) => {
                      const differs = isDifferent((p) => {
                        const detail = propertyDetailsMap[p.id];
                        return (detail?.amenities || []).includes(key);
                      });

                      return (
                        <div
                          key={key}
                          className={`grid gap-4 py-2 px-3 rounded-lg text-xs items-center ${
                            highlightDifferences && differs
                              ? 'bg-amber-500/10 dark:bg-amber-950/20'
                              : 'hover:bg-stone-50/60'
                          }`}
                          style={{
                            gridTemplateColumns: `210px repeat(${compareList.length}, minmax(220px, 1fr)) ${
                              compareList.length < 3 ? 'minmax(200px, 1fr)' : ''
                            }`,
                          }}
                        >
                          <span className="font-semibold text-stone-600">{label}</span>
                          {compareList.map((p) => {
                            const detail = propertyDetailsMap[p.id];
                            const hasAmenity = (detail?.amenities || []).includes(key);
                            return (
                              <div key={p.id} className="flex items-center gap-1.5">
                                {hasAmenity ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Included</span>
                                  </span>
                                ) : (
                                  <span className="text-stone-300 font-bold">-</span>
                                )}
                              </div>
                            );
                          })}
                          {compareList.length < 3 && <span className="text-stone-300">-</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
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
