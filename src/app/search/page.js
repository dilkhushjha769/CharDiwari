'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import PropertyCompareModal from '@/components/PropertyCompareModal';
import { properties } from '@/data/properties';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Heart,
  Check,
  X,
  SlidersHorizontal,
  Layers,
  Phone,
  Building2,
  MapPin,
  Camera,
  Info,
  Download,
  MessageCircle,
  ExternalLink,
  Send,
  CheckCircle2,
  Maximize2,
  ZoomIn,
  Bed,
  Bath,
  ShieldCheck,
} from 'lucide-react';

// Price helper
function parsePriceToNum(priceStr) {
  if (!priceStr) return 0;
  const clean = String(priceStr).replace(/[^\d.]/g, '');
  const val = parseFloat(clean) || 0;
  if (priceStr.includes('Cr')) return val * 100; // in Lakhs
  if (priceStr.includes('Lakh')) return val;
  return val;
}

// Proximity generator based on city
function getProximities(city) {
  const c = (city || '').toLowerCase();
  if (c.includes('guru')) {
    return [
      'Airport within 18.5 km',
      'Cyber City within 6.2 km',
      'Golf Course within 0.8 km',
      'Medanta Hospital within 4.5 km',
    ];
  }
  if (c.includes('ali')) {
    return [
      'Mandwa Jetty within 4.5 km',
      'Awas Beach within 0.9 km',
      'Speedboat Terminal 15 mins',
      'Chhatrapati Shivaji Airport 2 hrs',
    ];
  }
  if (c.includes('ahmed')) {
    return [
      'Airport within 12.80 km',
      'Mall/Market within 0.90 km',
      'Hospital within 0.30 to 1.70 km',
      'SG Highway within 1.20 km',
    ];
  }
  if (c.includes('kasauli')) {
    return [
      'Mall Road within 1.5 km',
      'Timber Trail within 12 km',
      'Chandigarh Airport within 55 km',
      'Heritage Market within 0.8 km',
    ];
  }
  return [
    'Airport within 15.0 km',
    'Commercial Hub within 2.5 km',
    'Super-specialty Hospital within 1.5 km',
    'Metro Station within 1.0 km',
  ];
}

// Subcategory Navigation Items
const SUB_CATEGORIES = [
  { name: 'All Properties', type: 'All Types' },
  { name: 'Luxury Villas', type: 'Luxury Villa & Estate' },
  { name: 'Apartments', type: 'Architectural Apartment' },
  { name: 'Penthouses', type: 'Penthouse / Sky Villa' },
  { name: 'Alibaug', city: 'Alibaug' },
  { name: 'Ahmedabad', city: 'Ahmedabad' },
  { name: 'Gurugram', city: 'Gurugram' },
  { name: 'Kasauli Hills', city: 'Kasauli Hills' },
  { name: 'Ready to Move', possession: 'Ready to Move' },
];

const PROPERTY_TYPES = [
  'Luxury Villa & Estate',
  'Architectural Apartment',
  'Penthouse / Sky Villa',
];

const BHK_LIST = ['2 BHK', '3 BHK', '4 BHK', '5+ BHK'];
const CITIES_LIST = ['Ahmedabad', 'Alibaug', 'Gurugram', 'Kasauli Hills', 'Mumbai'];

const PRICE_RANGES = [
  { label: 'Under ₹4 Cr', min: 0, max: 400 },
  { label: '₹4 Cr – ₹6 Cr', min: 400, max: 600 },
  { label: '₹6 Cr – ₹10 Cr', min: 600, max: 1000 },
  { label: 'Above ₹10 Cr', min: 1000, max: 999999 },
];

const PROPERTY_GALLERIES = {
  1: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80',
  ],
  2: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=600&q=80',
  ],
  3: [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80',
  ],
};

function getPropertyGallery(prop) {
  if (PROPERTY_GALLERIES[prop.id]) return PROPERTY_GALLERIES[prop.id];
  return [
    prop.image,
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80',
  ];
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial params
  const initialQ = searchParams.get('q') || '';
  const initialCity = searchParams.get('city') || 'All Cities';
  const initialType = searchParams.get('type') || 'All Types';
  const initialBhk = searchParams.get('bhk') || 'All BHK';

  // Filters State
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [selectedCity, setSelectedCity] = useState(
    initialCity !== 'All Cities' ? [initialCity] : []
  );
  const [selectedTypes, setSelectedTypes] = useState(
    initialType !== 'All Types' ? [initialType] : []
  );
  const [selectedBhks, setSelectedBhks] = useState(
    initialBhk !== 'All BHK' ? [initialBhk] : []
  );
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [readyToMoveOnly, setReadyToMoveOnly] = useState(
    searchParams.get('possession') === 'Ready to Move'
  );

  // Sorting
  const [sortBy, setSortBy] = useState('relevance');

  // Accordions
  const [accordions, setAccordions] = useState({
    type: true,
    bhk: true,
    city: true,
    price: true,
    possession: true,
  });

  // Mobile Drawer
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Compare properties
  const [compareList, setCompareList] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Wishlist
  const [favorites, setFavorites] = useState({});

  // Expanded descriptions map
  const [expandedDesc, setExpandedDesc] = useState({});

  // Active image map for thumbnail switching
  const [activeImgMap, setActiveImgMap] = useState({});

  // Image Lightbox / Zoom Focus State
  const [lightboxProp, setLightboxProp] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Contact / Enquire Modal
  const [contactModalProp, setContactModalProp] = useState(null);
  const [contactType, setContactType] = useState('enquiry'); // 'enquiry' | 'brochure' | 'whatsapp'
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const toggleAccordion = (key) => {
    setAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleType = (t) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  const toggleBhk = (b) => {
    setSelectedBhks((prev) =>
      prev.includes(b) ? prev.filter((item) => item !== b) : [...prev, b]
    );
  };

  const toggleCity = (c) => {
    setSelectedCity((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
  };

  const togglePriceRange = (label) => {
    setSelectedPriceRanges((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const toggleCompare = (prop) => {
    setCompareList((prev) => {
      const exists = prev.some((p) => p.id === prop.id);
      if (exists) {
        return prev.filter((p) => p.id !== prop.id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), prop];
      }
      return [...prev, prop];
    });
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDesc = (id) => {
    setExpandedDesc((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedCity([]);
    setSelectedTypes([]);
    setSelectedBhks([]);
    setSelectedPriceRanges([]);
    setReadyToMoveOnly(false);
    setSortBy('relevance');
    router.replace('/search');
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCity.length > 0 ||
    selectedTypes.length > 0 ||
    selectedBhks.length > 0 ||
    selectedPriceRanges.length > 0 ||
    readyToMoveOnly;

  // Filter listings
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // 1. Text Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const tokens = q.split(/\s+/).filter(Boolean);
        const composite = `${p.title} ${p.location} ${p.city} ${p.builder || ''} ${p.type} ${p.beds || ''} ${p.description || ''}`.toLowerCase();
        const match = tokens.every((tok) => composite.includes(tok));
        if (!match) return false;
      }

      // 2. City
      if (selectedCity.length > 0) {
        const cityMatch = selectedCity.some(
          (c) => p.city.toLowerCase() === c.toLowerCase() || p.location.toLowerCase().includes(c.toLowerCase())
        );
        if (!cityMatch) return false;
      }

      // 3. Property Type
      if (selectedTypes.length > 0) {
        if (!selectedTypes.includes(p.type)) return false;
      }

      // 4. BHK
      if (selectedBhks.length > 0) {
        const bedsNum = parseInt(p.beds || 0, 10);
        const bhkMatch = selectedBhks.some((b) => {
          if (b === '5+ BHK') return bedsNum >= 5;
          const target = parseInt(b.split(' ')[0], 10);
          return bedsNum === target;
        });
        if (!bhkMatch) return false;
      }

      // 5. Price
      if (selectedPriceRanges.length > 0) {
        const pLakhs = parsePriceToNum(p.price);
        const rangeMatch = selectedPriceRanges.some((label) => {
          const config = PRICE_RANGES.find((r) => r.label === label);
          if (!config) return false;
          return pLakhs >= config.min && pLakhs <= config.max;
        });
        if (!rangeMatch) return false;
      }

      // 6. Possession
      if (readyToMoveOnly) {
        if (p.possession !== 'Ready to Move') return false;
      }

      return true;
    });
  }, [
    searchQuery,
    selectedCity,
    selectedTypes,
    selectedBhks,
    selectedPriceRanges,
    readyToMoveOnly,
  ]);

  // Sort listings
  const sortedProperties = useMemo(() => {
    const list = [...filteredProperties];
    if (sortBy === 'price-asc') {
      return list.sort((a, b) => parsePriceToNum(a.price) - parsePriceToNum(b.price));
    }
    if (sortBy === 'price-desc') {
      return list.sort((a, b) => parsePriceToNum(b.price) - parsePriceToNum(a.price));
    }
    if (sortBy === 'popularity' || sortBy === 'newest') {
      return list.sort((a, b) => b.id - a.id);
    }
    return list;
  }, [filteredProperties, sortBy]);

  const handleCategoryClick = (cat) => {
    if (cat.type && cat.type !== 'All Types') {
      setSelectedTypes([cat.type]);
    } else if (cat.type === 'All Types') {
      setSelectedTypes([]);
    }
    if (cat.city) {
      setSelectedCity([cat.city]);
    }
    if (cat.possession) {
      setReadyToMoveOnly(true);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans selection:bg-[#0078db] selection:text-white">
      {/* Universal Website Navbar */}
      <Navbar />

      {/* Top Search Autocomplete Header */}
      <div className="bg-white border-b border-stone-200 shadow-2xs sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3">
          <div className="flex-1 bg-stone-50 rounded-lg border border-stone-200 px-1 py-0.5">
            <SearchAutocomplete
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              placeholder="Search by project name, builder, locality, or configuration..."
              onSearchSubmit={(q) => {
                if (typeof q === 'string') setSearchQuery(q);
              }}
              onSelectLocation={(loc) => {
                if (loc.city) setSelectedCity([loc.city]);
                setSearchQuery(loc.title);
              }}
              onSelectPropertyType={(t) => {
                setSelectedTypes([t]);
                setSearchQuery('');
              }}
              onSelectProperty={(prop) => {
                if (prop.slug) {
                  router.push(`/property/${prop.slug}`);
                } else {
                  setSearchQuery(prop.title);
                }
              }}
            />
          </div>

          {/* Mobile Filter Toggle */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 hover:border-stone-400 rounded-lg text-xs font-semibold text-stone-800 shadow-xs shrink-0 active:scale-95 transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-600" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-stone-900"></span>
            )}
          </button>
        </div>
      </div>

      {/* Subcategory Strip */}
      <div className="bg-white border-b border-stone-200 hidden md:block overflow-x-auto shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-6 text-[13px] font-medium text-stone-700 whitespace-nowrap">
          {SUB_CATEGORIES.map((cat, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className="flex items-center gap-1 hover:text-[#0078db] transition-colors py-1 cursor-pointer group"
            >
              <span>{cat.name}</span>
              <ChevronDown className="w-3 h-3 text-stone-400 group-hover:text-[#0078db] transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-2 sm:px-4 py-3 flex-1 flex gap-3">
        {/* ============================================================== */}
        {/* LEFT FILTERS SIDEBAR */}
        {/* ============================================================== */}
        <aside
          className={`
            fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs md:backdrop-blur-none md:bg-transparent md:static md:z-0
            ${mobileFilterOpen ? 'flex justify-end md:justify-start' : 'hidden md:block'}
            w-full md:w-[280px] shrink-0
          `}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileFilterOpen(false);
          }}
        >
          <div className="bg-white w-[85%] max-w-[320px] md:w-full h-full md:h-auto md:rounded-xs shadow-2xl md:shadow-2xs border-l md:border border-stone-200 overflow-y-auto max-h-screen md:max-h-[calc(100vh-7rem)] sticky top-32 flex flex-col">
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-stone-200 flex items-center justify-between">
              <span className="text-base font-bold text-stone-900 tracking-tight">Filters</span>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-bold text-[#0078db] hover:underline cursor-pointer uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="md:hidden text-stone-500 hover:text-stone-900 p-1 rounded-md"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Collection Category Breadcrumb */}
            <div className="p-3.5 sm:p-4 border-b border-stone-200 bg-stone-50/50">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                COLLECTION
              </div>
              <button
                type="button"
                onClick={() => setSelectedTypes([])}
                className="text-xs text-stone-500 hover:text-[#0078db] flex items-center gap-1 mb-1"
              >
                <span>&lt;</span>
                <span>All Properties</span>
              </button>
              <div className="text-xs font-bold text-stone-900 pl-3 truncate">
                {selectedTypes.length === 1 ? selectedTypes[0] : 'All Categories'}
              </div>
            </div>

            {/* Accordion: Property Type */}
            <div className="border-b border-stone-200">
              <button
                type="button"
                onClick={() => toggleAccordion('type')}
                className="w-full p-3.5 sm:p-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-800 hover:bg-stone-50 cursor-pointer"
              >
                <span>Property Type</span>
                {accordions.type ? (
                  <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                )}
              </button>
              {accordions.type && (
                <div className="px-4 pb-3.5 space-y-2">
                  {PROPERTY_TYPES.map((type) => {
                    const isChecked = selectedTypes.includes(type);
                    return (
                      <label
                        key={type}
                        className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer select-none hover:text-stone-900"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleType(type)}
                          className="w-3.5 h-3.5 rounded-xs accent-[#0078db] cursor-pointer"
                        />
                        <span className={isChecked ? 'font-semibold text-stone-900' : ''}>
                          {type}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accordion: BHK */}
            <div className="border-b border-stone-200">
              <button
                type="button"
                onClick={() => toggleAccordion('bhk')}
                className="w-full p-3.5 sm:p-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-800 hover:bg-stone-50 cursor-pointer"
              >
                <span>Bedrooms / BHK</span>
                {accordions.bhk ? (
                  <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                )}
              </button>
              {accordions.bhk && (
                <div className="px-4 pb-3.5 space-y-2">
                  {BHK_LIST.map((bhk) => {
                    const isChecked = selectedBhks.includes(bhk);
                    return (
                      <label
                        key={bhk}
                        className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer select-none hover:text-stone-900"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleBhk(bhk)}
                          className="w-3.5 h-3.5 rounded-xs accent-[#0078db] cursor-pointer"
                        />
                        <span className={isChecked ? 'font-semibold text-stone-900' : ''}>
                          {bhk}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accordion: City */}
            <div className="border-b border-stone-200">
              <button
                type="button"
                onClick={() => toggleAccordion('city')}
                className="w-full p-3.5 sm:p-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-800 hover:bg-stone-50 cursor-pointer"
              >
                <span>Locality / City</span>
                {accordions.city ? (
                  <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                )}
              </button>
              {accordions.city && (
                <div className="px-4 pb-3.5 space-y-2">
                  {CITIES_LIST.map((city) => {
                    const isChecked = selectedCity.includes(city);
                    return (
                      <label
                        key={city}
                        className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer select-none hover:text-stone-900"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCity(city)}
                          className="w-3.5 h-3.5 rounded-xs accent-[#0078db] cursor-pointer"
                        />
                        <span className={isChecked ? 'font-semibold text-stone-900' : ''}>
                          {city}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accordion: Price Range */}
            <div className="border-b border-stone-200">
              <button
                type="button"
                onClick={() => toggleAccordion('price')}
                className="w-full p-3.5 sm:p-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-800 hover:bg-stone-50 cursor-pointer"
              >
                <span>Price Range</span>
                {accordions.price ? (
                  <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                )}
              </button>
              {accordions.price && (
                <div className="px-4 pb-3.5 space-y-2">
                  {PRICE_RANGES.map((r) => {
                    const isChecked = selectedPriceRanges.includes(r.label);
                    return (
                      <label
                        key={r.label}
                        className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer select-none hover:text-stone-900"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePriceRange(r.label)}
                          className="w-3.5 h-3.5 rounded-xs accent-[#0078db] cursor-pointer"
                        />
                        <span className={isChecked ? 'font-semibold text-stone-900' : ''}>
                          {r.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accordion: Possession */}
            <div className="border-b border-stone-200">
              <button
                type="button"
                onClick={() => toggleAccordion('possession')}
                className="w-full p-3.5 sm:p-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-800 hover:bg-stone-50 cursor-pointer"
              >
                <span>Possession</span>
                {accordions.possession ? (
                  <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                )}
              </button>
              {accordions.possession && (
                <div className="px-4 pb-3.5 space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={readyToMoveOnly}
                      onChange={(e) => setReadyToMoveOnly(e.target.checked)}
                      className="w-3.5 h-3.5 rounded-xs accent-[#0078db] cursor-pointer"
                    />
                    <span className={readyToMoveOnly ? 'font-semibold text-stone-900' : ''}>
                      Ready to Move
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Mobile Apply Button */}
            <div className="p-4 md:hidden mt-auto border-t border-stone-200 bg-white">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2.5 bg-stone-900 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Apply Filters ({sortedProperties.length} Properties)
              </button>
            </div>
          </div>
        </aside>

        {/* ============================================================== */}
        {/* RIGHT MAIN LISTINGS CONTAINER */}
        {/* ============================================================== */}
        <section className="flex-1 bg-white md:rounded-xs shadow-2xs border border-stone-200 min-w-0">
          {/* Breadcrumbs */}
          <div className="px-3 sm:px-5 pt-3.5 pb-1 flex items-center gap-1.5 text-xs text-stone-500 font-normal">
            <Link href="/" className="hover:text-[#0078db]">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-stone-400" />
            <Link href="/search" className="hover:text-[#0078db]">
              Properties
            </Link>
            {selectedTypes.length > 0 && (
              <>
                <ChevronRight className="w-3 h-3 text-stone-400" />
                <span className="text-stone-700 truncate max-w-[140px]">{selectedTypes.join(', ')}</span>
              </>
            )}
            {selectedCity.length > 0 && (
              <>
                <ChevronRight className="w-3 h-3 text-stone-400" />
                <span className="text-stone-700 truncate max-w-[140px]">{selectedCity.join(', ')}</span>
              </>
            )}
          </div>

          {/* Results Summary */}
          <div className="px-3 sm:px-5 pt-1 pb-2">
            <h1 className="text-sm font-semibold text-stone-900">
              Showing 1 – {sortedProperties.length} of {properties.length} results
              {searchQuery ? (
                <span className="text-stone-600 font-normal"> for &ldquo;{searchQuery}&rdquo;</span>
              ) : selectedTypes.length > 0 ? (
                <span className="text-stone-600 font-normal"> for &ldquo;{selectedTypes.join(', ')}&rdquo;</span>
              ) : null}
            </h1>
          </div>

          {/* Sort Tabs Bar */}
          <div className="px-3 sm:px-5 py-2.5 border-b border-stone-200/80 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 shrink-0 mr-1 hidden sm:inline">
              Sort:
            </span>
            {[
              { id: 'relevance', label: 'Relevance' },
              { id: 'popularity', label: 'Popularity' },
              { id: 'price-asc', label: 'Price: Low to High' },
              { id: 'price-desc', label: 'Price: High to Low' },
              { id: 'newest', label: 'Newest First' },
            ].map((tab) => {
              const isActive = sortBy === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSortBy(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${isActive
                    ? 'bg-stone-900 text-white font-semibold shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
                    }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Listing Rows */}
          {sortedProperties.length === 0 ? (
            <div className="py-20 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1">No matching properties</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                We couldn&apos;t find anything matching your exact filter combination.
              </p>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded shadow-xs hover:bg-black transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {sortedProperties.map((prop) => {
                const isCompared = compareList.some((p) => p.id === prop.id);
                const isFav = Boolean(favorites[prop.id]);
                const isExpanded = Boolean(expandedDesc[prop.id]);
                const proximities = getProximities(prop.city);
                const bedsInt = parseInt(prop.beds || '4', 10);
                const areaInt = parseInt(prop.area?.replace(/[^\d]/g, '') || '4000', 10);
                const carpetArea = Math.round(areaInt * 0.72);
                const gallery = getPropertyGallery(prop);
                const currentImg = activeImgMap[prop.id] || prop.image;

                return (
                  <div
                    key={prop.id}
                    className="p-3.5 sm:p-6 flex flex-col md:flex-row gap-4 sm:gap-6 lg:gap-7 hover:bg-stone-50/50 transition-colors group"
                  >
                    {/* ---------------------------------------------------- */}
                    {/* COLUMN 1: PROMINENT HERO IMAGE + GALLERY THUMBNAILS */}
                    {/* ---------------------------------------------------- */}
                    <div className="w-full md:w-[350px] lg:w-[390px] shrink-0 flex flex-col">
                      <div
                        onClick={() => {
                          setLightboxProp(prop);
                          setLightboxImg(currentImg);
                        }}
                        className="relative w-full aspect-[16/10] sm:aspect-[16/11] md:h-[250px] lg:h-[270px] rounded-xl bg-stone-100 overflow-hidden cursor-pointer shadow-xs border border-stone-200/80 group/img focus:outline-none focus:ring-2 focus:ring-stone-900"
                        title="Click to view full photo gallery"
                      >
                        <img
                          src={currentImg}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                        />

                        {/* Top Left Tag: RERA Verified */}
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-stone-900/85 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>RERA Verified</span>
                        </div>

                        {/* Wishlist Heart */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(prop.id);
                          }}
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-500 hover:text-red-500 flex items-center justify-center shadow-xs transition"
                          aria-label="Save to wishlist"
                        >
                          <Heart
                            className={`w-4 h-4 ${isFav ? 'text-red-500 fill-red-500' : 'text-stone-500'
                              }`}
                          />
                        </button>

                        {/* Hover Overlay Hint: Click to Enlarge */}
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                          <ZoomIn className="w-4 h-4" />
                          <span>Click to Enlarge</span>
                        </div>

                        {/* Bottom Photo Count */}
                        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5" />
                          <span>8 Photos</span>
                        </div>
                      </div>

                      {/* MORE IMAGES DOWN TO MAIN IMAGE (THUMBNAIL GALLERY STRIP) */}
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-2 w-full">
                        {gallery.slice(0, 4).map((thumbUrl, idx) => {
                          const isSelected = currentImg === thumbUrl;
                          const isMoreOverlay = idx === 3;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (isMoreOverlay) {
                                  setLightboxProp(prop);
                                  setLightboxImg(thumbUrl);
                                } else {
                                  setActiveImgMap((prev) => ({ ...prev, [prop.id]: thumbUrl }));
                                }
                              }}
                              className={`relative aspect-[4/3] rounded-lg overflow-hidden border transition-all cursor-pointer group/thumb ${isSelected
                                ? 'ring-2 ring-stone-900 border-stone-900 shadow-xs'
                                : 'border-stone-200 hover:border-stone-400 opacity-80 hover:opacity-100'
                                }`}
                              title={isMoreOverlay ? 'View all photos' : `Switch to view ${idx + 1}`}
                            >
                              <img
                                src={thumbUrl}
                                alt={`${prop.title} thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                              />
                              {isMoreOverlay && (
                                <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] flex items-center justify-center text-white text-[11px] font-bold">
                                  +5 More
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Add to Compare */}
                      <div className="flex items-center justify-between mt-2.5">
                        <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none hover:text-stone-900 self-start">
                          <input
                            type="checkbox"
                            checked={isCompared}
                            onChange={() => toggleCompare(prop)}
                            className="w-3.5 h-3.5 rounded-xs accent-stone-900 cursor-pointer"
                          />
                          <span>Add to Compare</span>
                        </label>
                        <span className="text-[11px] text-stone-400 font-medium md:hidden">8 Photos</span>
                      </div>
                    </div>

                    {/* ---------------------------------------------------- */}
                    {/* COLUMN 2: CLEAN, REFINED LUXURY DETAILS */}
                    {/* ---------------------------------------------------- */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        {/* Top Badges & Status */}
                        <div className="flex items-center justify-between gap-2 mb-2 pt-1 md:pt-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-stone-700 tracking-wide">{prop.type}</span>
                          </div>

                          <span className="text-xs text-stone-500 font-medium shrink-0">Zero Brokerage</span>
                        </div>

                        {/* Title & Location */}
                        <div className="mb-3">
                          <Link
                            href={`/property/${prop.slug || prop.id}`}
                            className="group/title inline-flex items-center gap-1.5 sm:gap-2"
                          >
                            <h2 className="text-lg sm:text-2xl font-bold text-stone-900 group-hover/title:text-stone-700 transition-colors tracking-tight">
                              {prop.title}
                            </h2>
                            <CheckCircle2 className="w-4 h-4 text-sky-500 fill-sky-500 text-white shrink-0" />
                          </Link>
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate">{prop.location}</span>
                          </div>
                        </div>

                        {/* Hero Price & Key Specs Strip (Clean, Spacious, Premium) */}
                        <div className="py-3 px-3.5 sm:py-3.5 sm:px-4 rounded-xl bg-stone-50/80 border border-stone-200/80 mb-3 space-y-2.5 sm:space-y-3">
                          {/* Price Header */}
                          <div className="flex items-baseline justify-between gap-2">
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-0.5">
                                Pricing
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-3xl font-black text-stone-900 tracking-tight">
                                  {prop.price}
                                </span>
                                <span className="text-xs text-stone-500 font-medium">
                                  (All Inclusive)
                                </span>
                              </div>
                            </div>

                            {prop.rentPrice && (
                              <div className="text-right hidden sm:block">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-0.5">Rental Option</div>
                                <div className="text-xs font-bold text-stone-800">{prop.rentPrice}</div>
                              </div>
                            )}
                          </div>

                          {/* Primary Specifications Bar */}
                          <div className="pt-2 border-t border-stone-200/60 grid grid-cols-3 divide-x divide-stone-200 text-center sm:text-left sm:flex sm:items-center sm:gap-6 sm:divide-x sm:divide-stone-200">
                            <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-1">
                              <Bed className="w-4 h-4 text-stone-400 shrink-0" />
                              <div>
                                <div className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">
                                  {prop.beds}
                                </div>
                                <div className="text-[10px] text-stone-500">Bedrooms</div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-1">
                              <Bath className="w-4 h-4 text-stone-400 shrink-0" />
                              <div>
                                <div className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">
                                  {prop.baths || '4 Baths'}
                                </div>
                                <div className="text-[10px] text-stone-500">Baths</div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-1">
                              <Maximize2 className="w-4 h-4 text-stone-400 shrink-0" />
                              <div>
                                <div className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">
                                  {prop.area}
                                </div>
                                <div className="text-[10px] text-stone-500">Carpet Area</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Elegant 1-sentence Description */}
                        <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed mb-3 font-normal">
                          {prop.description}
                        </p>

                        {/* Minimal Curated Amenity Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3.5">
                          {(prop.city?.toLowerCase().includes('kasauli')
                            ? ['Valley View', 'Indoor Sun Deck', 'Fireplace', 'Heated Plunge Pool']
                            : prop.city?.toLowerCase().includes('alibaug')
                              ? ['Beach Access', 'Private Pool', 'Landscaped Lawn', 'Gated Estate']
                              : ['Private Courtyard Pool', 'Landscaped Lawn', 'Italian Marble', '24/7 Gated Security']
                          ).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-medium text-stone-600 bg-stone-100 hover:bg-stone-200/70 px-2.5 py-1 rounded-md transition"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Clean Bottom Bar: Architect (Left) & Action CTAs (Right) */}
                      <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-100 border border-stone-200 text-stone-700 font-bold text-[11px] sm:text-xs flex items-center justify-center shrink-0">
                            {(prop.builder || 'SL').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-stone-400 font-semibold leading-none">
                              Architect / Developer
                            </div>
                            <div className="text-xs font-bold text-stone-900 leading-tight mt-0.5 truncate">
                              {prop.builder || 'Dwarkesh Group'}
                            </div>
                          </div>
                        </div>

                        {/* CTA Buttons: Brochure, Explore */}
                        <div className="flex items-center justify-end gap-2 shrink-0">
                          {/* Brochure Download Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setContactModalProp(prop);
                              setContactType('brochure');
                              setContactSubmitted(false);
                            }}
                            className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg border border-stone-300 hover:border-stone-800 text-stone-800 bg-white hover:bg-stone-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Brochure</span>
                          </button>

                          {/* Explore Button */}
                          <Link
                            href={`/property/${prop.slug || prop.id}`}
                            className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-semibold transition cursor-pointer shadow-xs flex items-center justify-center gap-1 shrink-0"
                          >
                            <span>Explore</span>
                            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ============================================================== */}
      {/* IMAGE FOCUS / LIGHTBOX MODAL (NOTICEABLE AT FIRST CLICK) */}
      {/* ============================================================== */}
      {lightboxProp && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxProp(null)}
        >
          <div
            className="bg-stone-950 text-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-stone-800 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{lightboxProp.title}</span>
                  <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400 text-stone-950" />
                </h3>
                <p className="text-xs text-stone-400">
                  {lightboxProp.beds} • {lightboxProp.area} • {lightboxProp.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxProp(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Large High-Res Image Viewport */}
            <div className="relative flex-1 min-h-[340px] sm:min-h-[460px] bg-black flex items-center justify-center p-2">
              <img
                src={lightboxImg || lightboxProp.image}
                alt={lightboxProp.title}
                className="max-h-[55vh] sm:max-h-[60vh] w-auto max-w-full object-contain rounded-lg"
              />
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-sm text-xs font-semibold text-white">
                Price: {lightboxProp.price}
              </div>
            </div>

            {/* Gallery Thumbnails inside Lightbox */}
            <div className="px-5 py-2.5 bg-stone-900/90 border-t border-stone-800 flex items-center gap-2 overflow-x-auto">
              {getPropertyGallery(lightboxProp).map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxImg(img)}
                  className={`relative w-16 h-12 rounded-md overflow-hidden shrink-0 border-2 transition ${(lightboxImg || lightboxProp.image) === img
                    ? 'border-white scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between gap-3">
              <div className="text-xs text-stone-400">
                Crafted by <span className="font-semibold text-white">{lightboxProp.builder || 'Dwarkesh Group'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/property/${lightboxProp.slug || lightboxProp.id}`}
                  className="px-4 py-2 bg-white text-stone-900 hover:bg-stone-100 text-xs font-bold rounded-lg transition"
                >
                  Full Property Page
                </Link>
                <Link
                  href={`/property/${lightboxProp.slug || lightboxProp.id}`}
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 border border-stone-700"
                >
                  <span>Explore</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FLOATING COMPARE DOCK */}
      {/* ============================================================== */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 surface-raised bg-white dark:bg-stone-50 border-t border-stone-200/90 shadow-2xl p-2.5 sm:p-3 sm:px-6 animate-in slide-in-from-bottom duration-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto min-w-0 flex-1 scrollbar-none">
              <span className="text-[11px] sm:text-xs font-bold text-stone-900 uppercase tracking-wider shrink-0 flex items-center gap-1 sm:gap-1.5">
                <Layers className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                <span className="hidden sm:inline">Compare</span>
                <span>({compareList.length}/3)</span>
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none">
                {compareList.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-200/60 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 border border-stone-200 text-[11px] sm:text-xs font-medium text-stone-900 shrink-0 shadow-2xs"
                  >
                    <span className="truncate max-w-[85px] sm:max-w-[140px] font-semibold">
                      {p.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCompare(p)}
                      className="text-stone-400 hover:text-stone-900 p-0.5 rounded cursor-pointer transition shrink-0"
                      aria-label={`Remove ${p.title} from compare`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCompareList([])}
                className="text-[11px] sm:text-xs text-stone-500 hover:text-rose-600 font-semibold px-1.5 sm:px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-stone-900 hover:bg-black text-white text-[11px] sm:text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 transition"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">COMPARE ESTATES</span>
                <span className="sm:hidden">COMPARE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PROPERTY COMPARISON SIDE-BY-SIDE MODAL */}
      {/* ============================================================== */}
      <PropertyCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        compareList={compareList}
        onRemoveProperty={(prop) => toggleCompare(prop)}
        onAddProperty={(prop) => toggleCompare(prop)}
        onClearAll={() => setCompareList([])}
        onSelectPropertyForEnquiry={(prop) => {
          setIsCompareModalOpen(false);
          setContactModalProp(prop);
          setContactType('enquiry');
          setContactSubmitted(false);
        }}
      />

      {/* ============================================================== */}
      {/* CONTACT / ENQUIRE / BROCHURE MODAL */}
      {/* ============================================================== */}
      {contactModalProp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  {contactType === 'brochure'
                    ? 'Download Official Brochure'
                    : contactType === 'whatsapp'
                      ? 'WhatsApp Agent Connect'
                      : 'Instant Property Enquiry'}
                </h3>
                <p className="text-xs text-stone-300 truncate max-w-[280px]">
                  {contactModalProp.title} • {contactModalProp.price}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setContactModalProp(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {contactSubmitted ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-stone-900 mb-1">
                  {contactType === 'brochure' ? 'Brochure Sent!' : 'Enquiry Received!'}
                </h4>
                <p className="text-xs text-stone-600 mb-4">
                  The official sales desk for {contactModalProp.title} will share complete documentation via WhatsApp &amp; Call shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setContactModalProp(null)}
                  className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setContactSubmitted(true);
                }}
                className="p-4 space-y-3"
              >
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs outline-none focus:border-[#0078db]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs outline-none focus:border-[#0078db]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0078db] hover:bg-[#0066ba] text-white text-xs font-bold rounded shadow-xs mt-2"
                >
                  {contactType === 'brochure' ? 'Download PDF Brochure' : 'Connect with Sales Desk'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Universal Footer */}
      <Footer />
    </div>
  );
}

function SearchWrapper() {
  const searchParams = useSearchParams();
  return <SearchContent key={searchParams.toString()} />;
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-[#0078db] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-stone-500 font-medium">Loading search results...</p>
          </div>
        </div>
      }
    >
      <SearchWrapper />
    </Suspense>
  );
}
