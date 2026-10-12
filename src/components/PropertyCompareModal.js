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
} from 'lucide-react';
import { propertyDetail } from '@/data/property-details';
import { properties as allProperties } from '@/data/properties';

/**
 * Calculates estimated monthly EMI based on 8.5% p.a. for a 20-year loan on 80% property value.
 */
function calculateEstEMI(priceNum) {
  if (!priceNum || priceNum <= 0) return null;
  // Loan = 80% of property cost in Lakhs
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
      const slug = prop.slug || prop.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      map[prop.id] = propertyDetail(slug);
    });
    return map;
  }, [compareList]);

  if (!isOpen) return null;

  // Comparison feature definitions
  const commonAmenities = [
    { key: 'pool', label: 'Private / Shared Pool' },
    { key: 'garden', label: 'Landscaped Garden / Lawn' },
    { key: 'gym', label: 'Gymnasium & Fitness Club' },
    { key: 'clubhouse', label: 'Resident Clubhouse' },
    { key: 'security', label: '24/7 Gated Security' },
    { key: 'power-backup', label: '100% Power Backup' },
    { key: 'parking', label: 'Reserved Covered Parking' },
    { key: 'cctv', label: 'CCTV Surveillance' },
  ];

  // Helper to check if a row differs across properties
  const isDifferent = (getter) => {
    if (compareList.length <= 1) return false;
    const firstVal = getter(compareList[0]);
    return compareList.some((p) => getter(p) !== firstVal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
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
        className="relative surface-raised bg-white dark:bg-stone-50 rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-4 border-b border-stone-200 dark:border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50/70 dark:bg-stone-100/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2
                id="compare-modal-title"
                className="text-base sm:text-lg font-serif font-bold text-stone-900 tracking-tight"
              >
                Side-by-Side Property Comparison
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-200 text-stone-700">
                {compareList.length} of 3 Selected
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Review prices, floor plans, amenities, and connectivity side-by-side
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Highlight Differences Switch */}
            <button
              type="button"
              onClick={() => setHighlightDifferences((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                highlightDifferences
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-300 shadow-xs'
                  : 'bg-white dark:bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
              title="Highlight attributes that differ between properties"
            >
              {highlightDifferences ? (
                <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-stone-400" />
              )}
              <span className="hidden sm:inline">Highlight Differences</span>
              <span className="sm:hidden">Differences</span>
            </button>

            {/* Clear All */}
            {compareList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  onClose();
                }}
                className="text-xs font-semibold text-stone-500 hover:text-rose-600 px-2 py-1.5 rounded-lg transition cursor-pointer"
              >
                Clear All
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-200/70 transition cursor-pointer"
              aria-label="Close comparison modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 divide-y divide-stone-200">
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
              {/* TOP ESTATE CARDS ROW */}
              <div
                className="grid gap-3 sm:gap-4 pb-6"
                style={{
                  gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                    compareList.length,
                    1
                  )}, minmax(220px, 1fr)) ${
                    compareList.length < 3 ? 'minmax(180px, 1fr)' : ''
                  }`,
                }}
              >
                {/* Column Header Label */}
                <div className="flex flex-col justify-end pb-2 pr-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Estates Overview
                  </span>
                  <span className="text-xs text-stone-500 mt-0.5">
                    Select &amp; explore key attributes
                  </span>
                </div>

                {/* Property Columns */}
                {compareList.map((prop) => {
                  const estEMI = calculateEstEMI(prop.priceNum);
                  const priceSqft = calculatePricePerSqft(prop.priceNum, prop.area);

                  return (
                    <div
                      key={prop.id}
                      className="surface-raised bg-stone-50/60 dark:bg-stone-100/40 rounded-2xl border border-stone-200/90 p-3 sm:p-3.5 flex flex-col justify-between relative group hover:border-stone-400 transition"
                    >
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => onRemoveProperty(prop)}
                        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                        title="Remove from comparison"
                        aria-label={`Remove ${prop.title} from comparison`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Image Thumbnail */}
                      <div>
                        <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-stone-200 mb-2.5">
                          <Image
                            src={prop.image}
                            alt={prop.title}
                            fill
                            sizes="(max-width: 768px) 240px, 320px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {prop.badge && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-[10px] font-semibold text-white">
                              {prop.badge}
                            </span>
                          )}
                        </div>

                        {/* Title & Location */}
                        <Link
                          href={`/property/${prop.slug || prop.id}`}
                          className="font-serif font-bold text-sm sm:text-base text-stone-900 hover:text-stone-600 block line-clamp-1 transition-colors"
                        >
                          {prop.title}
                        </Link>
                        <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{prop.location}</span>
                        </p>

                        {/* Price & Price per sq.ft */}
                        <div className="mt-2.5 pt-2 border-t border-stone-200/70 flex items-baseline justify-between gap-1">
                          <div className="text-base sm:text-lg font-bold text-stone-950 font-serif">
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

                      {/* Column Actions */}
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
                          onClick={() => {
                            if (onSelectPropertyForEnquiry) {
                              onSelectPropertyForEnquiry(prop);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-300 hover:border-stone-800 text-stone-800 hover:bg-stone-100 text-xs font-semibold text-center transition cursor-pointer"
                        >
                          Enquire
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add Property Slot (If less than 3 properties selected) */}
                {compareList.length < 3 && (
                  <div className="rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-300 p-4 flex flex-col items-center justify-center text-center relative bg-stone-50/40">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-2">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-stone-900 mb-0.5">
                      Add Property
                    </span>
                    <p className="text-[11px] text-stone-500 mb-3 max-w-[140px]">
                      Compare with another luxury listing
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
                              No more properties available
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

              {/* SECTION: PRICING & FINANCIALS */}
              <div className="py-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                  Pricing &amp; Financials
                </h4>
                <div className="space-y-1">
                  {/* Total Price */}
                  <div
                    className={`grid gap-3 sm:gap-4 py-2 px-2.5 rounded-lg text-xs items-center ${
                      highlightDifferences && isDifferent((p) => p.priceNum)
                        ? 'bg-amber-500/10 dark:bg-amber-950/20 text-stone-900'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-100/50'
                    }`}
                    style={{
                      gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                        compareList.length,
                        1
                      )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
                    }}
                  >
                    <span className="font-semibold text-stone-600">Total Purchase Price</span>
                    {compareList.map((p) => (
                      <span key={p.id} className="font-bold text-stone-950 text-sm font-mono">
                        {p.price}
                      </span>
                    ))}
                    {compareList.length < 3 && <span className="text-stone-300">-</span>}
                  </div>

                  {/* Price per sq.ft */}
                  <div
                    className={`grid gap-3 sm:gap-4 py-2 px-2.5 rounded-lg text-xs items-center ${
                      highlightDifferences && isDifferent((p) => calculatePricePerSqft(p.priceNum, p.area))
                        ? 'bg-amber-500/10 dark:bg-amber-950/20 text-stone-900'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-100/50'
                    }`}
                    style={{
                      gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                        compareList.length,
                        1
                      )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
                    }}
                  >
                    <span className="font-semibold text-stone-600">Price / sq.ft</span>
                    {compareList.map((p) => (
                      <span key={p.id} className="font-medium text-stone-800">
                        {calculatePricePerSqft(p.priceNum, p.area) || 'On Request'}
                      </span>
                    ))}
                    {compareList.length < 3 && <span className="text-stone-300">-</span>}
                  </div>

                  {/* Est. Monthly EMI */}
                  <div
                    className={`grid gap-3 sm:gap-4 py-2 px-2.5 rounded-lg text-xs items-center ${
                      highlightDifferences && isDifferent((p) => calculateEstEMI(p.priceNum))
                        ? 'bg-amber-500/10 dark:bg-amber-950/20 text-stone-900'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-100/50'
                    }`}
                    style={{
                      gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                        compareList.length,
                        1
                      )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
                    }}
                  >
                    <span className="font-semibold text-stone-600">Est. EMI (20 Yrs @ 8.5%)</span>
                    {compareList.map((p) => (
                      <span key={p.id} className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {calculateEstEMI(p.priceNum) || 'Contact Sales'}
                      </span>
                    ))}
                    {compareList.length < 3 && <span className="text-stone-300">-</span>}
                  </div>

                  {/* Monthly Rent */}
                  <div
                    className={`grid gap-3 sm:gap-4 py-2 px-2.5 rounded-lg text-xs items-center ${
                      highlightDifferences && isDifferent((p) => p.rentPrice)
                        ? 'bg-amber-500/10 dark:bg-amber-950/20 text-stone-900'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-100/50'
                    }`}
                    style={{
                      gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                        compareList.length,
                        1
                      )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
                    }}
                  >
                    <span className="font-semibold text-stone-600">Rental Value Estimate</span>
                    {compareList.map((p) => (
                      <span key={p.id} className="font-medium text-stone-800">
                        {p.rentPrice || 'N/A'}
                      </span>
                    ))}
                    {compareList.length < 3 && <span className="text-stone-300">-</span>}
                  </div>
                </div>
              </div>

              {/* SECTION: CONFIGURATION & SPACE */}
              <div className="py-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                  Space &amp; Configuration
                </h4>
                <div className="space-y-1">
                  {/* Property Type */}
                  <div
                    className={`grid gap-3 sm:gap-4 py-2 px-2.5 rounded-lg text-xs items-center ${
                      highlightDifferences && isDifferent((p) => p.type)
                        ? 'bg-amber-500/10 dark:bg-amber-950/20 text-stone-900'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-100/50'
                    }`}
                    style={{
                      gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                        compareList.length,
                        1
                      )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
                    }}
                  >
                    <span className="font-semibold text-stone-600">Property Type</span>
                    {compareList.map((p) => (
                      <span key={p.id} className="font-semibold text-stone-900">
                        {p.type}
                      </span>
                    ))}
                    {compareList.length < 3 && <span className="text-stone-300">-</span>}
                  </div>

                  {/* Bedrooms */}
                  <div
                    className={`grid gap-3 sm:gap-4 py-2 px-2.5 rounded-lg text-xs items-center ${
                      highlightDifferences && isDifferent((p) => p.beds)
                        ? 'bg-amber-500/10 dark:bg-amber-950/20 text-stone-900'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-100/50'
                    }`}
                    style={{
                      gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                        compareList.length,
                        1
                      )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
                    }}
                  >
                    <span className="font-semibold text-stone-600">Bedrooms (BHK)</span>
                    {compareList.map((p) => (
                      <span key={p.id} className="font-medium text-stone-800 flex items-center gap-1.5">
                        <Bed className="w-3.5 h-3.5 text-stone-400" />
                        <span>{p.beds}</span>
                      </span>
                    ))}
                    {compareList.length < 3 && <span className="text-stone-300">-</span>}
                  </div>

                  {/* Bathrooms */}
                  <div
                    className={`grid gap-3 sm:gap-4 py-2 px-2.5 rounded-lg text-xs items-center ${
                      highlightDifferences && isDifferent((p) => p.baths)
                        ? 'bg-amber-500/10 dark:bg-amber-950/20 text-stone-900'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-100/50'
                    }`}
                    style={{
                      gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                        compareList.length,
                        1
                      )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
                    }}
                  >
                    <span className="font-semibold text-stone-600">Bathrooms</span>
                    {compareList.map((p) => (
                      <span key={p.id} className="font-medium text-stone-800 flex items-center gap-1.5">
                        <Bath className="w-3.5 h-3.5 text-stone-400" />
                        <span>{p.baths || '4 Baths'}</span>
                      </span>
                    ))}
                    {compareList.length < 3 && <span className="text-stone-300">-</span>}
                  </div>

                  {/* Carpet Area */}
                  <div
                    className={`grid gap-3 sm:gap-4 py-2 px-2.5 rounded-lg text-xs items-center ${
                      highlightDifferences && isDifferent((p) => p.area)
                        ? 'bg-amber-500/10 dark:bg-amber-950/20 text-stone-900'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-100/50'
                    }`}
                    style={{
                      gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                        compareList.length,
                        1
                      )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
                    }}
                  >
                    <span className="font-semibold text-stone-600">Carpet Area</span>
                    {compareList.map((p) => (
                      <span key={p.id} className="font-semibold text-stone-900 flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-stone-400" />
                        <span>{p.area}</span>
                      </span>
                    ))}
                    {compareList.length < 3 && <span className="text-stone-300">-</span>}
                  </div>

                  {/* Possession Status */}
                  <div
                    className={`grid gap-3 sm:gap-4 py-2 px-2.5 rounded-lg text-xs items-center ${
                      highlightDifferences && isDifferent((p) => p.possession)
                        ? 'bg-amber-500/10 dark:bg-amber-950/20 text-stone-900'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-100/50'
                    }`}
                    style={{
                      gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                        compareList.length,
                        1
                      )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
                    }}
                  >
                    <span className="font-semibold text-stone-600">Possession</span>
                    {compareList.map((p) => (
                      <span key={p.id} className="font-medium text-stone-800">
                        {p.possession || 'Ready to Move'}
                      </span>
                    ))}
                    {compareList.length < 3 && <span className="text-stone-300">-</span>}
                  </div>

                  {/* Architect / Builder */}
                  <div
                    className={`grid gap-3 sm:gap-4 py-2 px-2.5 rounded-lg text-xs items-center ${
                      highlightDifferences && isDifferent((p) => p.builder)
                        ? 'bg-amber-500/10 dark:bg-amber-950/20 text-stone-900'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-100/50'
                    }`}
                    style={{
                      gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                        compareList.length,
                        1
                      )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
                    }}
                  >
                    <span className="font-semibold text-stone-600">Architect / Developer</span>
                    {compareList.map((p) => (
                      <span key={p.id} className="font-medium text-stone-800">
                        {p.builder || 'Dwarkesh Luxury'}
                      </span>
                    ))}
                    {compareList.length < 3 && <span className="text-stone-300">-</span>}
                  </div>
                </div>
              </div>

              {/* SECTION: SIGNATURE HIGHLIGHTS */}
              <div className="py-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                  Key Highlights
                </h4>
                <div
                  className="grid gap-3 sm:gap-4 px-2.5"
                  style={{
                    gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                      compareList.length,
                      1
                    )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
                  }}
                >
                  <span className="font-semibold text-stone-600 text-xs">Architectural Highlights</span>
                  {compareList.map((p) => {
                    const detail = propertyDetailsMap[p.id];
                    const highlights = detail?.highlights || [];
                    return (
                      <div key={p.id} className="space-y-1.5">
                        {highlights.length > 0 ? (
                          highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-stone-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{h}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                            {p.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {compareList.length < 3 && <span className="text-stone-300">-</span>}
                </div>
              </div>

              {/* SECTION: AMENITIES & LIFESTYLE */}
              <div className="py-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                  Amenities &amp; Features
                </h4>
                <div className="space-y-1">
                  {commonAmenities.map(({ key, label }) => {
                    const differs = isDifferent((p) => {
                      const detail = propertyDetailsMap[p.id];
                      return (detail?.amenities || []).includes(key);
                    });

                    return (
                      <div
                        key={key}
                        className={`grid gap-3 sm:gap-4 py-2 px-2.5 rounded-lg text-xs items-center ${
                          highlightDifferences && differs
                            ? 'bg-amber-500/10 dark:bg-amber-950/20 text-stone-900'
                            : 'hover:bg-stone-50 dark:hover:bg-stone-100/50'
                        }`}
                        style={{
                          gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                            compareList.length,
                            1
                          )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
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

              {/* SECTION: CONNECTIVITY & LOCATION */}
              <div className="py-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                  Neighbourhood &amp; Connectivity
                </h4>
                <div className="space-y-1">
                  <div
                    className="grid gap-3 sm:gap-4 py-2 px-2.5 rounded-lg text-xs items-center hover:bg-stone-50 dark:hover:bg-stone-100/50"
                    style={{
                      gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                        compareList.length,
                        1
                      )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
                    }}
                  >
                    <span className="font-semibold text-stone-600">City / Market</span>
                    {compareList.map((p) => (
                      <span key={p.id} className="font-medium text-stone-900">
                        {p.city}
                      </span>
                    ))}
                    {compareList.length < 3 && <span className="text-stone-300">-</span>}
                  </div>

                  <div
                    className="grid gap-3 sm:gap-4 py-2 px-2.5 rounded-lg text-xs items-center hover:bg-stone-50 dark:hover:bg-stone-100/50"
                    style={{
                      gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                        compareList.length,
                        1
                      )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
                    }}
                  >
                    <span className="font-semibold text-stone-600">Primary Locality</span>
                    {compareList.map((p) => (
                      <span key={p.id} className="font-medium text-stone-700">
                        {p.location}
                      </span>
                    ))}
                    {compareList.length < 3 && <span className="text-stone-300">-</span>}
                  </div>

                  <div
                    className="grid gap-3 sm:gap-4 py-2 px-2.5 rounded-lg text-xs items-center hover:bg-stone-50 dark:hover:bg-stone-100/50"
                    style={{
                      gridTemplateColumns: `minmax(140px, 190px) repeat(${Math.max(
                        compareList.length,
                        1
                      )}, minmax(220px, 1fr)) ${compareList.length < 3 ? 'minmax(180px, 1fr)' : ''}`,
                    }}
                  >
                    <span className="font-semibold text-stone-600">Airport Distance</span>
                    {compareList.map((p) => {
                      const detail = propertyDetailsMap[p.id];
                      const airport = (detail?.nearby || []).find((n) => n.type === 'airport');
                      return (
                        <span key={p.id} className="font-medium text-stone-700">
                          {airport ? `${airport.name} (${airport.km} km)` : 'Within 20 km'}
                        </span>
                      );
                    })}
                    {compareList.length < 3 && <span className="text-stone-300">-</span>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-stone-200 dark:border-stone-200 bg-stone-50/70 dark:bg-stone-100/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">
              Need personalized assistance choosing between these estates?
            </span>
          </div>

          <div className="flex items-center gap-2">
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
              className="px-3.5 py-2 rounded-xl border border-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Share Comparison on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              Done Comparing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
