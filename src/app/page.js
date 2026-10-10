'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Sparkles,
  Compass,
  CheckCircle2,
  Heart,
  ArrowUpRight,
  Building2,
  Home,
  Users,
  ChevronDown,
  Key,
  Landmark,
  X,
  RotateCcw,
  Check,
  Navigation,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import EMICalculator from '@/components/EMICalculator';
import { useUserLocation } from '@/lib/useUserLocation';

export default function HomePage() {
  const { userLocation, locationLoading, refreshGpsLocation } = useUserLocation();

  // Search & Filter State
  const [searchMode, setSearchMode] = useState('buy'); // 'buy' | 'rent' | 'plots'
  const [selectedCity, setSelectedCity] = useState('Ahmedabad');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Locations');
  const [selectedBhk, setSelectedBhk] = useState('BHK');
  const [selectedBudget, setSelectedBudget] = useState('Budget');
  const [selectedPossession, setSelectedPossession] = useState('Possession');
  const [selectedType, setSelectedType] = useState('Property Type');
  const [activeDropdown, setActiveDropdown] = useState(null);

  const searchContainerRef = useRef(null);

  // Close open popovers when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name) => {
    setIsSearchFocused(false);
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const citiesList = [
    'All Cities',
    'Ahmedabad',
    'Gurugram',
    'Alibaug',
    'Kasauli Hills',
    'Mumbai',
    'Goa',
  ];

  const locationsList = [
    'All Locations',
    'Bodakdev',
    'SG Highway',
    'Golf Course Extension',
    'Awas Beach Road',
    'Pine Ridge',
    'Worli Sea Face',
    'Assagao',
  ];

  const bhkList = ['All BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'];

  const budgetBuyList = [
    'Any Budget',
    'Under ₹3 Cr',
    '₹3 - 6 Cr',
    '₹6 - 10 Cr',
    '₹10 Cr+',
  ];

  const budgetRentList = [
    'Any Budget',
    'Under ₹1 Lakh/mo',
    '₹1 - 3 Lakh/mo',
    '₹3 - 5 Lakh/mo',
    '₹5 Lakh+/mo',
  ];

  const budgetList = searchMode === 'rent' ? budgetRentList : budgetBuyList;

  const possessionList = [
    'All Possession',
    'Ready to Move',
    'Under Construction',
    'Within 6 Months',
    'New Launch',
  ];

  const propertyTypesList = [
    'All Types',
    'Luxury Villa & Estate',
    'Architectural Apartment',
    'Penthouse / Sky Villa',
    'Private Plot / Land',
  ];

  const properties = [
    {
      id: 1,
      tag: 'Available',
      badge: 'Verified Property',
      title: 'The Courtyard Villa',
      location: 'Golf Course Extension, Gurugram',
      city: 'Gurugram',
      type: 'Luxury Villa & Estate',
      possession: 'Ready to Move',
      builder: 'Studio Lotus',
      price: '₹4.80 Cr',
      priceNum: 4.8,
      rentPrice: '₹2.80 Lakh/mo',
      rentPriceNum: 2.8,
      mode: 'both',
      beds: '4 Beds',
      baths: '5 Baths',
      area: '4,800 sq.ft',
      image:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      description:
        'Spacious home with an open courtyard, natural stone walls, wooden finish, and a private swimming pool.',
    },
    {
      id: 2,
      tag: 'New Listing',
      badge: 'Hillside Home',
      title: 'The Mountain Villa',
      location: 'Pine Ridge, Kasauli Hills',
      city: 'Kasauli Hills',
      type: 'Luxury Villa & Estate',
      possession: 'Ready to Move',
      builder: 'Morphogenesis',
      price: '₹6.20 Cr',
      priceNum: 6.2,
      rentPrice: '₹3.60 Lakh/mo',
      rentPriceNum: 3.6,
      mode: 'both',
      beds: '5 Beds',
      baths: '6 Baths',
      area: '6,200 sq.ft',
      image:
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      description:
        'Modern hill-view villa overlooking the Himalayan valley with a warm indoor sun deck.',
    },
    {
      id: 3,
      tag: 'Available',
      badge: 'Coastal Home',
      title: 'The Garden Villa',
      location: 'Awas Beach Road, Alibaug',
      city: 'Alibaug',
      type: 'Luxury Villa & Estate',
      possession: 'Ready to Move',
      builder: 'Samira Habitats',
      price: '₹5.40 Cr',
      priceNum: 5.4,
      rentPrice: '₹3.10 Lakh/mo',
      rentPriceNum: 3.1,
      mode: 'both',
      beds: '4 Beds',
      baths: '4 Baths',
      area: '5,400 sq.ft',
      image:
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      description:
        'Eco-friendly modern home surrounded by peaceful coconut groves and green gardens.',
    },
    {
      id: 4,
      tag: 'Exclusive',
      badge: 'Modern Heritage',
      title: 'The Courtyard Apartment',
      location: 'Bodakdev, Ahmedabad',
      city: 'Ahmedabad',
      type: 'Architectural Apartment',
      possession: 'Ready to Move',
      builder: 'HCP Design & Project Management',
      price: '₹3.90 Cr',
      priceNum: 3.9,
      rentPrice: '₹1.90 Lakh/mo',
      rentPriceNum: 1.9,
      mode: 'both',
      beds: '4 Beds',
      baths: '4 Baths',
      area: '4,200 sq.ft',
      image:
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
      description:
        'Modern designer apartment with clay lattice screens and a landscaped courtyard garden.',
    },
    {
      id: 5,
      tag: 'New Listing',
      badge: 'Sea-View Penthouse',
      title: 'The Horizon Penthouse',
      location: 'Worli Sea Face, Mumbai',
      city: 'Mumbai',
      type: 'Penthouse / Sky Villa',
      possession: 'Under Construction',
      builder: 'Hafeez Contractor',
      price: '₹14.50 Cr',
      priceNum: 14.5,
      rentPrice: '₹7.50 Lakh/mo',
      rentPriceNum: 7.5,
      mode: 'both',
      beds: '5 Beds',
      baths: '6 Baths',
      area: '6,800 sq.ft',
      image:
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
      description:
        'Luxury sea-view penthouse with high ceilings, private outdoor deck, and Italian marble floors.',
    },
    {
      id: 6,
      tag: 'Available',
      badge: 'Goa Heritage Villa',
      title: 'The Palm Villa',
      location: 'Assagao, North Goa',
      city: 'Goa',
      type: 'Luxury Villa & Estate',
      possession: 'Ready to Move',
      builder: 'Tarun Tahiliani Homes',
      price: '₹7.20 Cr',
      priceNum: 7.2,
      rentPrice: '₹4.20 Lakh/mo',
      rentPriceNum: 4.2,
      mode: 'both',
      beds: '4 Beds',
      baths: '5 Baths',
      area: '5,600 sq.ft',
      image:
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
      description:
        'Restored classic Portuguese-style villa with natural stone walls, private swimming pool, and fruit gardens.',
    },
  ];

  // Search suggestions dataset
  const searchSuggestions = [
    {
      type: 'residence',
      title: 'The Courtyard Apartment',
      subtitle: 'Bodakdev, Ahmedabad',
      badge: 'Luxury Apartment',
    },
    {
      type: 'residence',
      title: 'The Courtyard Villa',
      subtitle: 'Golf Course Extension, Gurugram',
      badge: 'Luxury Villa',
    },
    {
      type: 'residence',
      title: 'The Horizon Penthouse',
      subtitle: 'Worli Sea Face, Mumbai',
      badge: 'Penthouse',
    },
    {
      type: 'residence',
      title: 'The Palm Villa',
      subtitle: 'Assagao, North Goa',
      badge: 'Heritage Villa',
    },
    {
      type: 'builder',
      title: 'HCP Design & Architecture',
      subtitle: 'Ahmedabad Masterplanners',
      badge: 'Architect',
    },
    {
      type: 'builder',
      title: 'Studio Lotus',
      subtitle: 'Eco-Friendly Luxury Homes',
      badge: 'Architect',
    },
    {
      type: 'builder',
      title: 'Samira Habitats',
      subtitle: 'Coastal Alibaug Villas',
      badge: 'Curated Builder',
    },
  ];

  const filteredSuggestions = searchQuery.trim()
    ? searchSuggestions.filter(
      (s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : searchSuggestions.slice(0, 5);

  // Helper to count available properties per filter value
  const getListingCount = (type, val) => {
    return properties.filter((p) => {
      if (type === 'city') {
        if (val === 'All Cities') return true;
        return (
          p.city.toLowerCase() === val.toLowerCase() ||
          p.location.toLowerCase().includes(val.toLowerCase())
        );
      }
      if (type === 'location') {
        if (val === 'All Locations') return true;
        return p.location.toLowerCase().includes(val.toLowerCase());
      }
      if (type === 'bhk') {
        if (val === 'All BHK') return true;
        if (val === '5+ BHK') return parseInt(p.beds) >= 5;
        return p.beds.includes(val.split(' ')[0]);
      }
      if (type === 'type') {
        if (val === 'All Types') return true;
        return p.type === val;
      }
      if (type === 'possession') {
        if (val === 'All Possession') return true;
        return p.possession === val;
      }
      return true;
    }).length;
  };

  // Filtering calculation
  const filteredProperties = properties.filter((prop) => {
    // City
    if (selectedCity && selectedCity !== 'All Cities') {
      const cityMatches =
        prop.city.toLowerCase() === selectedCity.toLowerCase() ||
        prop.location.toLowerCase().includes(selectedCity.toLowerCase());
      if (!cityMatches) return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        prop.title.toLowerCase().includes(q) ||
        prop.location.toLowerCase().includes(q) ||
        prop.city.toLowerCase().includes(q) ||
        prop.description.toLowerCase().includes(q) ||
        (prop.builder && prop.builder.toLowerCase().includes(q));
      if (!match) return false;
    }
    // Locality / Location
    if (
      selectedLocation &&
      selectedLocation !== 'Locations' &&
      selectedLocation !== 'All Locations'
    ) {
      if (!prop.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }
    }
    // BHK
    if (selectedBhk && selectedBhk !== 'BHK' && selectedBhk !== 'All BHK') {
      if (selectedBhk === '5+ BHK') {
        const beds = parseInt(prop.beds);
        if (beds < 5) return false;
      } else {
        const num = selectedBhk.split(' ')[0];
        if (!prop.beds.includes(num)) return false;
      }
    }
    // Property Type
    if (
      selectedType &&
      selectedType !== 'Property Type' &&
      selectedType !== 'All Types'
    ) {
      if (prop.type !== selectedType) return false;
    }
    // Budget
    if (
      selectedBudget &&
      selectedBudget !== 'Budget' &&
      selectedBudget !== 'Any Budget'
    ) {
      if (searchMode === 'rent') {
        if (selectedBudget === 'Under ₹1 Lakh/mo' && prop.rentPriceNum >= 1.0)
          return false;
        if (
          selectedBudget === '₹1 - 3 Lakh/mo' &&
          (prop.rentPriceNum < 1.0 || prop.rentPriceNum > 3.0)
        )
          return false;
        if (
          selectedBudget === '₹3 - 5 Lakh/mo' &&
          (prop.rentPriceNum < 3.0 || prop.rentPriceNum > 5.0)
        )
          return false;
        if (selectedBudget === '₹5 Lakh+/mo' && prop.rentPriceNum < 5.0)
          return false;
      } else {
        if (selectedBudget === 'Under ₹3 Cr' && prop.priceNum >= 3.0)
          return false;
        if (
          selectedBudget === '₹3 - 6 Cr' &&
          (prop.priceNum < 3.0 || prop.priceNum > 6.0)
        )
          return false;
        if (
          selectedBudget === '₹6 - 10 Cr' &&
          (prop.priceNum < 6.0 || prop.priceNum > 10.0)
        )
          return false;
        if (selectedBudget === '₹10 Cr+' && prop.priceNum < 10.0) return false;
      }
    }
    // Possession
    if (
      selectedPossession &&
      selectedPossession !== 'Possession' &&
      selectedPossession !== 'All Possession'
    ) {
      if (prop.possession !== selectedPossession) return false;
    }

    return true;
  });

  const hasActiveFilters =
    (selectedCity !== 'Ahmedabad' && selectedCity !== 'All Cities') ||
    searchQuery.trim() !== '' ||
    (selectedLocation !== 'Locations' && selectedLocation !== 'All Locations') ||
    (selectedBhk !== 'BHK' && selectedBhk !== 'All BHK') ||
    (selectedBudget !== 'Budget' && selectedBudget !== 'Any Budget') ||
    (selectedPossession !== 'Possession' &&
      selectedPossession !== 'All Possession') ||
    (selectedType !== 'Property Type' && selectedType !== 'All Types');

  const resetAllFilters = () => {
    setSelectedCity('All Cities');
    setSearchQuery('');
    setSelectedLocation('Locations');
    setSelectedBhk('BHK');
    setSelectedBudget('Budget');
    setSelectedPossession('Possession');
    setSelectedType('Property Type');
    setActiveDropdown(null);
    setIsSearchFocused(false);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setActiveDropdown(null);
    setIsSearchFocused(false);
    const element = document.getElementById('collection');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-stone-900 flex flex-col font-sans selection:bg-stone-900 selection:text-white">
      {/* Navigation Header */}
      <Navbar />

      {/* Hero Header Section */}
      <section className="relative z-10 pt-6 sm:pt-16 pb-10 sm:pb-16 px-4 sm:px-6 overflow-visible bg-stone-50/20">
        {/* Header Background Image with Architectural Vista */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <img
            src="/hero-header-bg.png"
            alt="Dwarkesh Properties Header"
            className="w-full h-full object-cover object-[80%_center] sm:object-right"
          />
          {/* Subtle gradient overlay to keep architectural image fully visible on mobile & desktop */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent sm:from-white/85 sm:via-white/40 sm:to-white/10" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/70 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">
          {/* Live Auto-detected Location Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-xs text-[11px] sm:text-xs text-stone-700 mb-3 sm:mb-4 transition-all hover:border-stone-300">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <MapPin className="w-3.5 h-3.5 text-stone-800 shrink-0" />
            {locationLoading ? (
              <span className="text-stone-400 font-medium animate-pulse">Detecting your location...</span>
            ) : userLocation ? (
              <div className="flex items-center gap-1 truncate max-w-[210px] sm:max-w-none">
                <span className="text-stone-400 font-normal">Location:</span>
                <span className="font-semibold text-stone-900 truncate">{userLocation.display}</span>
              </div>
            ) : (
              <span className="text-stone-800 font-semibold">Ahmedabad, Gujarat</span>
            )}
            <button
              type="button"
              onClick={refreshGpsLocation}
              title="Pinpoint live GPS location"
              className="ml-0.5 p-0.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer shrink-0"
              aria-label="Refresh GPS location"
            >
              <Navigation className="w-3 h-3" />
            </button>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-stone-900 tracking-tight leading-tight sm:leading-[1.15] mb-2 sm:mb-3 max-w-4xl">
            #DhundteRehJaoge
          </h1>

          {/* Hero Subtitle with Balanced Mobile Typography */}
          <p className="text-xs sm:text-base md:text-lg text-stone-700 sm:text-stone-600 font-normal max-w-xs sm:max-w-xl mx-auto mb-5 sm:mb-7 leading-relaxed tracking-normal">
            Discover 100+ curated villas, plots, and apartments across Alibaug, Ahmedabad & Gurugram.
          </p>

          {/* Master Search & Filter Console Card */}
          <div
            ref={searchContainerRef}
            className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-stone-200/90 shadow-2xl shadow-stone-900/5 text-left transition-all relative z-40 ring-1 ring-stone-900/5"
          >
            {/* TOP ROW: City Selector + Vertical Divider + Search Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center pb-3 border-b border-stone-100 gap-2 sm:gap-0 relative">
              {/* City Dropdown Trigger */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => toggleDropdown('city')}
                  className={`flex items-center justify-between gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer w-full sm:w-auto bg-stone-50/80 sm:bg-transparent ${activeDropdown === 'city'
                      ? 'bg-stone-100 text-stone-900 ring-1 ring-stone-300'
                      : 'text-stone-800 hover:bg-stone-100/70 sm:hover:bg-stone-50'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-stone-600 shrink-0" />
                    <span className="truncate max-w-[140px]">{selectedCity}</span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${activeDropdown === 'city' ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {/* City Menu */}
                {activeDropdown === 'city' && (
                  <div className="absolute left-0 top-full mt-2 w-full sm:w-60 max-w-[calc(100vw-2.5rem)] max-h-72 overflow-y-auto bg-white rounded-2xl border border-stone-200 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {userLocation?.display && (
                      <div className="mx-2 mb-1.5 px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">Live Location:</span>
                        <span className="font-semibold text-stone-900 truncate max-w-[110px]">{userLocation.display}</span>
                      </div>
                    )}
                    <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-stone-400 flex items-center justify-between">
                      <span>Select City</span>
                      <span>Listings</span>
                    </div>
                    {citiesList.map((city) => {
                      const count = getListingCount('city', city);
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            setSelectedCity(city);
                            setActiveDropdown(null);
                          }}
                          className={`w-full px-3.5 py-2.5 text-left text-xs font-medium flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer ${selectedCity === city
                              ? 'text-stone-900 font-semibold bg-stone-50'
                              : 'text-stone-600'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{city}</span>
                            {selectedCity === city && (
                              <Check className="w-3.5 h-3.5 text-stone-900" />
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-stone-400">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Vertical Divider on desktop, subtle horizontal divider on mobile */}
              <div className="hidden sm:block w-px h-6 bg-stone-200 mx-2" />
              <div className="sm:hidden h-px bg-stone-100 w-full" />

              {/* Main Search Input */}
              <div className="flex-1 flex items-center gap-2 sm:gap-2.5 px-1 sm:px-3 py-1 sm:py-0 relative min-w-0">
                <Search className="w-4 h-4 text-stone-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    setActiveDropdown(null);
                  }}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchSubmit(e);
                  }}
                  placeholder="Search by project, builder, or area..."
                  className="min-w-0 flex-1 text-xs sm:text-sm font-medium text-stone-900 bg-transparent outline-none placeholder:text-stone-400 py-1"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer shrink-0"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Solid Black Search Action Button with dynamic count */}
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="px-3.5 sm:px-5 py-2 rounded-xl sm:rounded-full bg-stone-900 hover:bg-black text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98] shrink-0"
                >
                  <span>Search</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[11px] font-mono font-medium">
                    {filteredProperties.length}
                  </span>
                </button>

                {/* Instant Autocomplete & Suggestions Dropdown */}
                {isSearchFocused && (
                  <div className="absolute left-0 right-0 sm:right-auto top-full mt-3 w-full sm:w-[480px] max-h-80 overflow-y-auto bg-white rounded-2xl border border-stone-200 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400 px-2 py-1 mb-1">
                      {searchQuery.trim()
                        ? 'Matching Homes & Builders'
                        : 'Popular Searches & Top Builders'}
                    </div>
                    <div className="space-y-1">
                      {filteredSuggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSearchQuery(item.title);
                            setIsSearchFocused(false);
                            const el = document.getElementById('collection');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                              {item.type === 'builder' ? (
                                <Building2 className="w-3.5 h-3.5" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-stone-900">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-stone-500">
                                {item.subtitle}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            {item.badge}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BOTTOM REFINEMENT SHELF */}
            <div className="-mx-3 -mb-3 sm:-mx-4 sm:-mb-4 mt-3 px-3 sm:px-4 py-2.5 bg-stone-50/70 border-t border-stone-100 rounded-b-2xl sm:rounded-b-3xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Filter Pills Group */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {/* 1. Locations Pill */}
                  <div className="relative shrink-0">
                    <div
                      className={`inline-flex items-center rounded-xl sm:rounded-full text-xs font-medium border transition-all ${selectedLocation !== 'Locations' &&
                          selectedLocation !== 'All Locations'
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : activeDropdown === 'location'
                            ? 'bg-stone-100 text-stone-900 border-stone-300'
                            : 'bg-white text-stone-700 border-stone-200/90 hover:bg-stone-50 hover:border-stone-300'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleDropdown('location')}
                        className="px-2.5 sm:px-3 py-1.5 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>{selectedLocation}</span>
                        <ChevronDown
                          className={`w-3 h-3 opacity-60 transition-transform ${activeDropdown === 'location' ? 'rotate-180' : ''
                            }`}
                        />
                      </button>
                      {selectedLocation !== 'Locations' &&
                        selectedLocation !== 'All Locations' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLocation('Locations');
                            }}
                            className="pr-2.5 pl-0.5 hover:text-stone-300 transition-colors cursor-pointer"
                            title="Clear location filter"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                    </div>

                    {activeDropdown === 'location' && (
                      <div className="absolute left-0 top-full mt-2 w-64 max-w-[calc(100vw-2.5rem)] max-h-72 overflow-y-auto bg-white rounded-2xl border border-stone-200 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-stone-400 flex items-center justify-between">
                          <span>Popular Areas</span>
                          <span>Listings</span>
                        </div>
                        {locationsList.map((loc) => {
                          const count = getListingCount('location', loc);
                          return (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => {
                                setSelectedLocation(
                                  loc === 'All Locations' ? 'Locations' : loc
                                );
                                setActiveDropdown(null);
                              }}
                              className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer ${selectedLocation === loc
                                  ? 'text-stone-900 font-semibold bg-stone-50'
                                  : 'text-stone-600'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{loc}</span>
                                {selectedLocation === loc && (
                                  <Check className="w-3.5 h-3.5 text-stone-900" />
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-stone-400">
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 2. BHK Pill */}
                  <div className="relative shrink-0">
                    <div
                      className={`inline-flex items-center rounded-xl sm:rounded-full text-xs font-medium border transition-all ${selectedBhk !== 'BHK' && selectedBhk !== 'All BHK'
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : activeDropdown === 'bhk'
                            ? 'bg-stone-100 text-stone-900 border-stone-300'
                            : 'bg-white text-stone-700 border-stone-200/90 hover:bg-stone-50 hover:border-stone-300'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleDropdown('bhk')}
                        className="px-2.5 sm:px-3 py-1.5 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Bed className="w-3.5 h-3.5" />
                        <span>{selectedBhk}</span>
                        <ChevronDown
                          className={`w-3 h-3 opacity-60 transition-transform ${activeDropdown === 'bhk' ? 'rotate-180' : ''
                            }`}
                        />
                      </button>
                      {selectedBhk !== 'BHK' && selectedBhk !== 'All BHK' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBhk('BHK');
                          }}
                          className="pr-2.5 pl-0.5 hover:text-stone-300 transition-colors cursor-pointer"
                          title="Clear BHK filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {activeDropdown === 'bhk' && (
                      <div className="absolute left-0 top-full mt-2 w-52 max-w-[calc(100vw-2.5rem)] max-h-72 overflow-y-auto bg-white rounded-2xl border border-stone-200 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-stone-400 flex items-center justify-between">
                          <span>Bedrooms</span>
                          <span>Listings</span>
                        </div>
                        {bhkList.map((bhk) => {
                          const count = getListingCount('bhk', bhk);
                          return (
                            <button
                              key={bhk}
                              type="button"
                              onClick={() => {
                                setSelectedBhk(bhk === 'All BHK' ? 'BHK' : bhk);
                                setActiveDropdown(null);
                              }}
                              className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer ${selectedBhk === bhk
                                  ? 'text-stone-900 font-semibold bg-stone-50'
                                  : 'text-stone-600'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{bhk}</span>
                                {selectedBhk === bhk && (
                                  <Check className="w-3.5 h-3.5 text-stone-900" />
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-stone-400">
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 3. Budget Pill */}
                  <div className="relative shrink-0">
                    <div
                      className={`inline-flex items-center rounded-xl sm:rounded-full text-xs font-medium border transition-all ${selectedBudget !== 'Budget' &&
                          selectedBudget !== 'Any Budget'
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : activeDropdown === 'budget'
                            ? 'bg-stone-100 text-stone-900 border-stone-300'
                            : 'bg-white text-stone-700 border-stone-200/90 hover:bg-stone-50 hover:border-stone-300'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleDropdown('budget')}
                        className="px-2.5 sm:px-3 py-1.5 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Landmark className="w-3.5 h-3.5" />
                        <span>{selectedBudget}</span>
                        <ChevronDown
                          className={`w-3 h-3 opacity-60 transition-transform ${activeDropdown === 'budget' ? 'rotate-180' : ''
                            }`}
                        />
                      </button>
                      {selectedBudget !== 'Budget' &&
                        selectedBudget !== 'Any Budget' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBudget('Budget');
                            }}
                            className="pr-2.5 pl-0.5 hover:text-stone-300 transition-colors cursor-pointer"
                            title="Clear budget filter"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                    </div>

                    {activeDropdown === 'budget' && (
                      <div className="absolute left-0 top-full mt-2 w-56 max-w-[calc(100vw-2.5rem)] max-h-72 overflow-y-auto bg-white rounded-2xl border border-stone-200 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-stone-400">
                          Price Range
                        </div>
                        {budgetList.map((budget) => (
                          <button
                            key={budget}
                            type="button"
                            onClick={() => {
                              setSelectedBudget(
                                budget === 'Any Budget' ? 'Budget' : budget
                              );
                              setActiveDropdown(null);
                            }}
                            className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer ${selectedBudget === budget
                                ? 'text-stone-900 font-semibold bg-stone-50'
                                : 'text-stone-600'
                              }`}
                          >
                            <span>{budget}</span>
                            {selectedBudget === budget && (
                              <Check className="w-3.5 h-3.5 text-stone-900" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Possession Pill */}
                  <div className="relative shrink-0">
                    <div
                      className={`inline-flex items-center rounded-xl sm:rounded-full text-xs font-medium border transition-all ${selectedPossession !== 'Possession' &&
                          selectedPossession !== 'All Possession'
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : activeDropdown === 'possession'
                            ? 'bg-stone-100 text-stone-900 border-stone-300'
                            : 'bg-white text-stone-700 border-stone-200/90 hover:bg-stone-50 hover:border-stone-300'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleDropdown('possession')}
                        className="px-2.5 sm:px-3 py-1.5 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>{selectedPossession}</span>
                        <ChevronDown
                          className={`w-3 h-3 opacity-60 transition-transform ${activeDropdown === 'possession' ? 'rotate-180' : ''
                            }`}
                        />
                      </button>
                      {selectedPossession !== 'Possession' &&
                        selectedPossession !== 'All Possession' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPossession('Possession');
                            }}
                            className="pr-2.5 pl-0.5 hover:text-stone-300 transition-colors cursor-pointer"
                            title="Clear possession filter"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                    </div>

                    {activeDropdown === 'possession' && (
                      <div className="absolute left-0 sm:left-0 top-full mt-2 w-56 max-w-[calc(100vw-2.5rem)] max-h-72 overflow-y-auto bg-white rounded-2xl border border-stone-200 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-stone-400 flex items-center justify-between">
                          <span>Possession Timeline</span>
                          <span>Listings</span>
                        </div>
                        {possessionList.map((pos) => {
                          const count = getListingCount('possession', pos);
                          return (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => {
                                setSelectedPossession(
                                  pos === 'All Possession' ? 'Possession' : pos
                                );
                                setActiveDropdown(null);
                              }}
                              className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer ${selectedPossession === pos
                                  ? 'text-stone-900 font-semibold bg-stone-50'
                                  : 'text-stone-600'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{pos}</span>
                                {selectedPossession === pos && (
                                  <Check className="w-3.5 h-3.5 text-stone-900" />
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-stone-400">
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 5. Property Type Pill */}
                  <div className="relative shrink-0">
                    <div
                      className={`inline-flex items-center rounded-xl sm:rounded-full text-xs font-medium border transition-all ${selectedType !== 'Property Type' &&
                          selectedType !== 'All Types'
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : activeDropdown === 'type'
                            ? 'bg-stone-100 text-stone-900 border-stone-300'
                            : 'bg-white text-stone-700 border-stone-200/90 hover:bg-stone-50 hover:border-stone-300'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleDropdown('type')}
                        className="px-2.5 sm:px-3 py-1.5 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Home className="w-3.5 h-3.5" />
                        <span>{selectedType}</span>
                        <ChevronDown
                          className={`w-3 h-3 opacity-60 transition-transform ${activeDropdown === 'type' ? 'rotate-180' : ''
                            }`}
                        />
                      </button>
                      {selectedType !== 'Property Type' &&
                        selectedType !== 'All Types' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedType('Property Type');
                            }}
                            className="pr-2.5 pl-0.5 hover:text-stone-300 transition-colors cursor-pointer"
                            title="Clear type filter"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                    </div>

                    {activeDropdown === 'type' && (
                      <div className="absolute right-0 top-full mt-2 w-60 max-w-[calc(100vw-2.5rem)] max-h-72 overflow-y-auto bg-white rounded-2xl border border-stone-200 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-stone-400 flex items-center justify-between">
                          <span>Property Type</span>
                          <span>Listings</span>
                        </div>
                        {propertyTypesList.map((typ) => {
                          const count = getListingCount('type', typ);
                          return (
                            <button
                              key={typ}
                              type="button"
                              onClick={() => {
                                setSelectedType(
                                  typ === 'All Types' ? 'Property Type' : typ
                                );
                                setActiveDropdown(null);
                              }}
                              className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer ${selectedType === typ
                                  ? 'text-stone-900 font-semibold bg-stone-50'
                                  : 'text-stone-600'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{typ}</span>
                                {selectedType === typ && (
                                  <Check className="w-3.5 h-3.5 text-stone-900" />
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-stone-400">
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 6. More Filters */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('more')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeDropdown === 'more'
                          ? 'bg-stone-100 text-stone-900 border-stone-300'
                          : 'bg-white text-stone-700 border-stone-200/90 hover:bg-stone-50 hover:border-stone-300'
                        }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>More</span>
                    </button>

                    {activeDropdown === 'more' && (
                      <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2.5rem)] max-h-72 overflow-y-auto bg-white rounded-2xl border border-stone-200 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-2">
                          Popular Features
                        </div>
                        <div className="space-y-1 text-xs text-stone-700">
                          <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-stone-50 cursor-pointer">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="rounded accent-stone-900"
                            />
                            <span>Verified RERA Approved</span>
                          </label>
                          <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-stone-50 cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded accent-stone-900"
                            />
                            <span>Swimming Pool</span>
                          </label>
                          <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-stone-50 cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded accent-stone-900"
                            />
                            <span>Private Terrace / Balcony</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Reset Action in shelf */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-all cursor-pointer ml-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                    <span>Reset All</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Tags Bar (Only rendered when filters are active, Quick Picks removed) */}
          {hasActiveFilters && (
            <div className="w-full max-w-4xl flex flex-wrap items-center gap-2 text-xs text-stone-600 mt-3 mb-1 px-1">
              <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mr-1">
                Active Filters:
              </span>
              {selectedCity !== 'All Cities' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 font-medium text-xs">
                  <span>City: {selectedCity}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCity('All Cities')}
                    className="hover:text-stone-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedLocation !== 'Locations' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 font-medium text-xs">
                  <span>Area: {selectedLocation}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedLocation('Locations')}
                    className="hover:text-stone-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedBhk !== 'BHK' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 font-medium text-xs">
                  <span>{selectedBhk}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBhk('BHK')}
                    className="hover:text-stone-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedBudget !== 'Budget' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 font-medium text-xs">
                  <span>{selectedBudget}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBudget('Budget')}
                    className="hover:text-stone-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedPossession !== 'Possession' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 font-medium text-xs">
                  <span>{selectedPossession}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPossession('Possession')}
                    className="hover:text-stone-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedType !== 'Property Type' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 font-medium text-xs">
                  <span>{selectedType}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedType('Property Type')}
                    className="hover:text-stone-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 font-medium text-xs">
                  <span>&quot;{searchQuery}&quot;</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-stone-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer ml-1 inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Curated Properties Section */}
      <section id="collection" className="pt-2 sm:pt-6 pb-16 sm:pb-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-stone-900 tracking-tight">
              Featured Properties
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-stone-600">
            <span>
              Showing {filteredProperties.length} of {properties.length} verified properties
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-stone-900 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
            <Link
              href="/auth"
              className="text-stone-900 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Property Cards Grid or Empty State */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                className="group bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Property Image with Badge */}
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-stone-900 shadow-sm">
                        {property.badge}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-700 text-white text-xs font-medium shadow-sm">
                        {property.tag}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-700 hover:text-rose-600 hover:bg-white transition-colors shadow-sm cursor-pointer"
                      aria-label="Save Property"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3.5 py-1.5 rounded-xl bg-stone-900/90 backdrop-blur-md text-white font-serif font-bold text-lg shadow-sm">
                        {searchMode === 'rent' ? property.rentPrice : property.price}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6">
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span>{property.location}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-stone-900 mb-2 group-hover:text-stone-700 transition-colors">
                      {property.title}
                    </h3>
                    <p className="text-xs text-stone-600 font-normal leading-relaxed mb-6">
                      {property.description}
                    </p>

                    {/* Bed, Bath, Sqft specs */}
                    <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs font-medium text-stone-600">
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-4 h-4 text-stone-400" />
                        <span>{property.beds}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bath className="w-4 h-4 text-stone-400" />
                        <span>{property.baths}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Maximize2 className="w-4 h-4 text-stone-400" />
                        <span>{property.area}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="p-6 pt-0">
                  <Link
                    href="/auth"
                    className="w-full py-3 rounded-xl bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-900 text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-stone-200/80 group-hover:border-transparent"
                  >
                    <span>View Property Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-stone-50/70 rounded-3xl border border-dashed border-stone-200">
            <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mx-auto mb-4 text-stone-500 shadow-sm">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif text-stone-900 mb-2">No Properties Match Your Search</h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">
              We verify and add new homes regularly. Try changing your location, budget, or bedroom filters to see more properties.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-5 py-2.5 rounded-full bg-stone-900 text-white text-xs font-semibold hover:bg-black transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </section>

      {/* Seller & Property Listing Banner (Unified Responsive Layout) */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-white border-t border-stone-200/60">
        <div className="max-w-6xl mx-auto">
          
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-200/80 bg-[#edf6ee] min-h-[220px] sm:min-h-[320px] md:min-h-[360px] flex items-center shadow-xs">
            {/* Background Graphic Asset with Advisor & Villa */}
            <img
              src="/seller-banner-bg.png"
              alt="Sell your property on Dwarkesh"
              className="absolute inset-0 w-full h-full object-cover object-[85%_center] sm:object-right pointer-events-none"
            />
            {/* Soft gradient fade so the left side text stays 100% legible */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#edf6ee] via-[#edf6ee]/95 to-transparent w-[68%] sm:w-[58%] pointer-events-none" />

            {/* Left Content */}
            <div className="relative z-10 max-w-[62%] sm:max-w-lg lg:max-w-xl p-4 sm:p-8 md:p-12">
              <h2 className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-stone-900 tracking-tight leading-snug sm:leading-tight mb-1 sm:mb-2.5">
                Sell or rent faster at the right price
              </h2>
              <p className="text-[11px] sm:text-sm text-stone-600 mb-3 sm:mb-6 leading-relaxed line-clamp-2 sm:line-clamp-none max-w-md">
                Post your property for free and connect with verified buyers.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4">
                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-stone-900 hover:bg-black text-white text-[11px] sm:text-sm font-semibold transition shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Post Property, It&apos;s Free</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>

                <a
                  href="https://wa.me/919876543210?text=Hi%2C%20I%20want%20to%20list%20my%20property%20on%20Dwarkesh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-stone-900 border border-stone-300 hover:border-emerald-500 shadow-xs hover:shadow transition-all text-[11px] sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span className="w-5 h-5 sm:w-5.5 sm:h-5.5 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5 shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="11.5" fill="#25D366" />
                      <path
                        d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.78-1.48-1.76-1.65-2.06-.18-.3-.02-.45.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.59-.49-.5-.67-.52-.18 0-.37-.01-.57-.01-.2 0-.52.08-.8.37-.26.3-1.03 1.02-1.03 2.48 0 1.46 1.06 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.11.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 19.34h-.01c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.15.83.84-3.07-.2-.31a8.3 8.3 0 01-1.27-4.43c0-4.59 3.73-8.32 8.33-8.32 2.22 0 4.31.87 5.88 2.44a8.27 8.27 0 012.44 5.88c0 4.59-3.73 8.32-8.33 8.32z"
                        fill="white"
                      />
                    </svg>
                  </span>
                  <span>Post via WhatsApp</span>
                  <span className="text-emerald-700 font-bold">→</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Dedicated Interactive Home Loan EMI Calculator Section */}
      <EMICalculator />

      {/* Find Your Perfect Property Promotional Banner */}
      <section className="pb-12 sm:pb-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <Link
          href="/#collection"
          className="group block relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 border border-stone-200/70 bg-white"
        >
          <img
            src="/property-banner.png"
            alt="Find Your Perfect Property - Buy, Sell or Rent with Ease"
            className="w-full h-auto object-cover rounded-2xl sm:rounded-3xl group-hover:scale-[1.01] transition-transform duration-500"
          />
        </Link>
      </section>

      {/* Clean Callout Section with Background Image */}
      <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl text-white p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl border border-stone-800/20 min-h-[340px] sm:min-h-[380px] flex flex-col justify-center items-center">
          {/* Background Image */}
          <img
            src="/cta-banner-bg.png"
            alt="Dwarkesh Luxury Properties and Residences"
            className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          />

          {/* Balanced Luxury Overlay: Keeps the bright sky, buildings, and garden visible */}
          <div className="absolute inset-0 bg-stone-950/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-stone-950/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/40 via-transparent to-stone-950/40" />

          {/* Content */}
          <h2 className="text-3xl sm:text-5xl font-serif font-medium text-white mb-4 relative z-10 drop-shadow-[0_3px_12px_rgba(0,0,0,0.85)] tracking-tight">
            Find or sell your dream home.
          </h2>
          <p className="text-base sm:text-lg text-white/95 max-w-xl mx-auto mb-8 font-light relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-relaxed">
            Sign in to view verified prices, detailed floor plans, and book free home visits.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10 w-full sm:w-auto">
            <Link
              href="/auth"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-stone-900 text-sm font-semibold hover:bg-stone-100 transition shadow-xl flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.99] duration-200"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/profile"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-white/50 bg-stone-950/60 backdrop-blur-md text-white text-sm font-medium hover:bg-white/20 hover:border-white transition text-center cursor-pointer hover:scale-[1.02] active:scale-[0.99] duration-200 shadow-xl"
            >
              <span>Post Your Property</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Clean Premium Footer */}
      <footer className="border-t border-stone-200/80 py-12 bg-white text-sm text-stone-600">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/dwarkesh-logo-transparent.png"
              alt="Dwarkesh Real Estate Group"
              className="h-8 w-auto max-w-[50px] object-contain drop-shadow-xs"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold tracking-[0.14em] text-stone-900 text-sm uppercase leading-none">
                Dwarkesh
              </span>
              <span className="text-[9px] font-semibold tracking-[0.20em] text-stone-500 uppercase font-sans mt-0.5">
                Real Estate Group
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8 text-stone-600">
            <a href="#collection" className="hover:text-stone-900 transition">
              Buy Homes
            </a>
            <a href="#collection" className="hover:text-stone-900 transition">
              Rentals
            </a>
            <a href="#emi-calculator" className="hover:text-stone-900 transition">
              EMI Calculator
            </a>
            <Link href="/auth" className="hover:text-stone-900 transition">
              Sign In
            </Link>
            <Link href="/profile" className="hover:text-stone-900 transition">
              My Profile
            </Link>
            <span className="text-stone-400">© 2026 Dwarkesh</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
