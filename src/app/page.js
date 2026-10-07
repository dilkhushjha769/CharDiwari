'use client';

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
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import EMICalculator from '@/components/EMICalculator';

export default function HomePage() {
  const properties = [
    {
      id: 1,
      tag: 'Available',
      badge: 'Verified Sanctuary',
      title: 'The Courtyard House',
      location: 'Golf Course Extension, Gurugram',
      price: '₹4.80 Cr',
      beds: '4 Beds',
      baths: '5 Baths',
      area: '4,800 sq.ft',
      image:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      description:
        'Central open-sky water atrium with raw basalt stone walls, teak louvers, and private lap pool.',
    },
    {
      id: 2,
      tag: 'New Listing',
      badge: 'Hillside Retreat',
      title: 'The Monolith Pavilion',
      location: 'Pine Ridge, Kasauli Hills',
      price: '₹6.20 Cr',
      beds: '5 Beds',
      baths: '6 Baths',
      area: '6,200 sq.ft',
      image:
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      description:
        'Cantilevered ridge architecture overlooking Himalayan valleys with heated indoor sun deck.',
    },
    {
      id: 3,
      tag: 'Available',
      badge: 'Coastal Modern',
      title: 'The Atrium Villa',
      location: 'Awas Beach Road, Alibaug',
      price: '₹5.40 Cr',
      beds: '4 Beds',
      baths: '4 Baths',
      area: '5,400 sq.ft',
      image:
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      description:
        'Horizontal rammed-earth residence nestled within private coconut groves and limestone gardens.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-stone-900 flex flex-col font-sans selection:bg-stone-900 selection:text-white">
      {/* Navigation Header */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-6 overflow-hidden bg-gradient-to-b from-stone-50/80 via-white to-white">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          
          {/* Subtle Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-200/90 text-stone-700 text-xs font-medium tracking-wide mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Curated Architectural Living • चारदीवारी</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif text-stone-900 tracking-tight leading-[1.12] mb-6 max-w-4xl">
            Find Your Sanctuary. <br />
            <span className="italic font-normal text-stone-600">Built for Silence & Daylight.</span>
          </h1>

          <p className="text-lg sm:text-xl text-stone-600 font-normal max-w-2xl mb-12 leading-relaxed">
            Discover verified architectural villas, private land parcels, and executive coliving suites across India’s most sought-after locations.
          </p>

          {/* Real Estate Search & Filter Bar */}
          <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-full p-2.5 sm:p-3 border border-stone-200/90 shadow-xl shadow-stone-900/5 mb-8">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3"
            >
              {/* Field 1: Location */}
              <div className="flex-1 w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 rounded-xl sm:rounded-full transition-colors">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                <div className="text-left w-full">
                  <span className="block text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                    Location
                  </span>
                  <input
                    type="text"
                    defaultValue="Delhi NCR, Gurugram"
                    placeholder="Search city, locality..."
                    className="w-full text-sm font-semibold text-stone-900 bg-transparent outline-none placeholder:text-stone-400"
                  />
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-stone-200" />

              {/* Field 2: Property Type */}
              <div className="flex-1 w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 rounded-xl sm:rounded-full transition-colors">
                <Home className="w-4 h-4 text-stone-400 shrink-0" />
                <div className="text-left w-full">
                  <span className="block text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                    Property Type
                  </span>
                  <select className="w-full text-sm font-semibold text-stone-900 bg-transparent outline-none cursor-pointer">
                    <option>Luxury Villa & Estate</option>
                    <option>Architectural Apartment</option>
                    <option>Penthouse / Sky Villa</option>
                    <option>PG & Executive Suite</option>
                    <option>Private Plot / Land</option>
                  </select>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-stone-200" />

              {/* Field 3: Budget */}
              <div className="flex-1 w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 rounded-xl sm:rounded-full transition-colors">
                <SlidersHorizontal className="w-4 h-4 text-stone-400 shrink-0" />
                <div className="text-left w-full">
                  <span className="block text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                    Budget
                  </span>
                  <select className="w-full text-sm font-semibold text-stone-900 bg-transparent outline-none cursor-pointer">
                    <option>Any Budget</option>
                    <option>Under ₹2.00 Cr</option>
                    <option>₹2.00 Cr - ₹5.00 Cr</option>
                    <option>₹5.00 Cr - ₹10.00 Cr</option>
                    <option>₹10.00 Cr+</option>
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-4 rounded-xl sm:rounded-full bg-stone-900 hover:bg-black text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>
          </div>

          {/* Quick Filter Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-stone-600">
            <span className="text-stone-400">Popular:</span>
            {['Luxury Villas', 'Penthouses', 'Gurugram Cyber Hub', 'South Delhi Havelis', 'Executive PGs', 'Zero Brokerage'].map(
              (tag) => (
                <a
                  key={tag}
                  href="#collection"
                  className="px-3 py-1 rounded-full bg-stone-100/80 hover:bg-stone-200 text-stone-700 transition-colors"
                >
                  {tag}
                </a>
              )
            )}
          </div>

        </div>
      </section>

      {/* Curated Properties Section */}
      <section id="collection" className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium tracking-wide mb-3">
              <Sparkles className="w-3.5 h-3.5 text-stone-800" />
              <span>Architectural Portfolio</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight">
              Curated Residential Holdings
            </h2>
          </div>
          <div className="flex items-center gap-4 text-sm text-stone-600">
            <span>Showing 3 of 150+ verified homes</span>
            <Link
              href="/auth"
              className="text-stone-900 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 3 Rich Property Cards with Real Photos */}
        <div className="grid md:grid-cols-3 gap-8">
          {properties.map((property) => (
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
                      {property.price}
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
                  <span>Explore Sanctuary Blueprints</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why CharDiwari (Features / Benefits, Not rigid square grid) */}
      <section className="py-20 px-6 bg-stone-50/70 border-t border-stone-200/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight mb-3">
              The Four Principles of Sanctuary
            </h2>
            <p className="text-base text-stone-600">
              Every residence in our portfolio passes rigorous architectural vetting, natural daylight orientation, and legal verification.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-7 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mb-5 text-stone-800">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">Architectural Pedigree</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Authored by prominent architects who prioritize proportion, natural ventilation, and enduring materials.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mb-5 text-stone-800">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">Natural Daylight</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Deep courtyard apertures and strategic skylights calibrated for shifting shadows throughout the day.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mb-5 text-stone-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">100% Legal Escrow</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Clear chains of deeds, RERA compliance, zero litigation records, and safe private financial escrows.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mb-5 text-stone-800">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">Private Concierge</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Dedicated luxury portfolio advisors guiding private walkthroughs, staging, and seamless handover.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated Interactive Home Loan EMI Calculator Section */}
      <EMICalculator />

      {/* Clean Callout Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl bg-stone-900 text-white p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-stone-800/50 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-3xl sm:text-5xl font-serif text-white mb-4 relative z-10">
            Acquire or commission your sanctuary.
          </h2>
          <p className="text-base sm:text-lg text-stone-300 max-w-xl mx-auto mb-8 font-light relative z-10">
            Sign in to unlock private pricing, architect blueprint vaults, and schedule confidential site visits.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
            <Link
              href="/auth"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-stone-900 text-sm font-semibold hover:bg-stone-100 transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>Access Private Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-stone-700 text-white text-sm font-medium hover:bg-stone-800 transition text-center"
            >
              <span>List Your Property</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Clean Premium Footer */}
      <footer className="border-t border-stone-200/80 py-12 bg-white text-sm text-stone-600">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center text-white font-serif font-bold text-xs">
              C
            </div>
            <span className="text-stone-900 font-semibold">CharDiwari</span>
            <span className="text-stone-300">•</span>
            <span className="text-stone-500">Architectural Sanctuaries</span>
          </div>

          <div className="flex flex-wrap items-center gap-8 text-stone-600">
            <a href="#collection" className="hover:text-stone-900 transition">
              Sanctuaries
            </a>
            <a href="#emi-calculator" className="hover:text-stone-900 transition">
              EMI Calculator
            </a>
            <Link href="/auth" className="hover:text-stone-900 transition">
              Sign In
            </Link>
            <Link href="/dashboard" className="hover:text-stone-900 transition">
              Seller Dashboard
            </Link>
            <span className="text-stone-400">© 2026 CharDiwari</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
