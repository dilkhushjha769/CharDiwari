'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
  Building,
  Building2,
  Home,
  Key,
  Calculator,
  Sparkles,
  MapPin,
  ShieldCheck,
  Camera,
  FileCheck,
  TrendingUp,
  Bed,
  Wifi,
  Coffee,
  Users,
  Menu,
  X,
  Compass,
  FileText,
  BadgePercent,
  Landmark,
  PiggyBank,
} from 'lucide-react';

export default function Navbar() {
  const [activeMenu, setActiveMenu] = useState(null); // 'buy' | 'sell' | 'pg' | 'emi' | null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState(null);
  const navRef = useRef(null);
  const timeoutRef = useRef(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setActiveMenu(null);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMouseEnter = (menuKey) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(menuKey);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  const navItems = [
    { key: 'buy', label: 'Buy' },
    { key: 'sell', label: 'Sell' },
    { key: 'pg', label: 'PG / Co-living' },
    { key: 'emi', label: 'EMI Calculator' },
  ];

  return (
    <div ref={navRef} className="sticky top-0 z-50 w-full" onMouseLeave={handleMouseLeave}>
      {/* Top Header */}
      <header className="border-b border-stone-200/80 bg-white/95 backdrop-blur-md relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center text-white font-serif font-bold text-base transition-transform group-hover:scale-105 shadow-sm">
                C
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold tracking-tight text-stone-900 font-sans">
                  CharDiwari
                </span>
                <span className="text-[10px] text-stone-400 font-sans tracking-wide -mt-0.5 hidden sm:block">
                  Architectural Sanctuaries
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = activeMenu === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveMenu(isActive ? null : item.key)}
                    onMouseEnter={() => handleMouseEnter(item.key)}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-stone-100 text-stone-900 font-semibold'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                        isActive ? 'rotate-180 text-stone-900' : ''
                      }`}
                    />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/auth"
              className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors px-4 py-2 rounded-xl hover:bg-stone-100/80"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="group text-sm font-medium text-white bg-stone-900 hover:bg-black transition-all px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm"
            >
              <span>Post Property</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Backdrop overlay for desktop menu */}
      {activeMenu && (
        <div
          className="hidden lg:block fixed inset-0 top-[73px] bg-stone-950/20 backdrop-blur-[2px] z-40 transition-opacity"
          onClick={() => setActiveMenu(null)}
        />
      )}

      {/* ============================================================== */}
      {/* DESKTOP DROPDOWN MENUS (Warm, Elegant, Normal & Balanced)       */}
      {/* ============================================================== */}

      {/* 1. BUY DROPDOWN */}
      {activeMenu === 'buy' && (
        <div
          className="hidden lg:block absolute left-0 w-full bg-white border-b border-stone-200/90 shadow-xl shadow-stone-900/5 animate-fade-in z-50"
          onMouseEnter={() => handleMouseEnter('buy')}
        >
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="grid grid-cols-2 gap-10">
              
              {/* Category 1 */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-800" />
                  <span>Residential Collections</span>
                </div>
                <div className="space-y-1">
                  <DropdownItem
                    icon={<Home className="w-4 h-4 text-stone-700" />}
                    title="Luxury Villas & Estates"
                    description="Private gated residences with open courtyards and expansive gardens."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<Building2 className="w-4 h-4 text-stone-700" />}
                    title="Penthouses & Sky Mansions"
                    description="Top-floor monolithic residences with panoramic city views."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<Building className="w-4 h-4 text-stone-700" />}
                    title="Architectural Apartments"
                    description="Curated 3 & 4 BHK homes finished with warm teak and natural limestone."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<Sparkles className="w-4 h-4 text-stone-700" />}
                    title="Heritage & Restored Havelis"
                    description="Centuries-old sanctuaries restored for modern luxury living."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                </div>
              </div>

              {/* Category 2 */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  <span>Land & Developments</span>
                </div>
                <div className="space-y-1">
                  <DropdownItem
                    icon={<Compass className="w-4 h-4 text-stone-700" />}
                    title="Plots & Private Farmland"
                    description="Expansive countryside parcels cleared for custom blueprints."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<ShieldCheck className="w-4 h-4 text-stone-700" />}
                    title="Gated Sanctuary Communities"
                    description="Private residential enclaves with perimeter security and clubhouses."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<TrendingUp className="w-4 h-4 text-stone-700" />}
                    title="Under-Construction Architect Builds"
                    description="Early-allocation homes designed by India's top design studios."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<Key className="w-4 h-4 text-stone-700" />}
                    title="Ready-to-Move Possession"
                    description="100% verified legal titles with immediate handover available."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                </div>
              </div>

            </div>

            {/* Bottom bar */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Over 150+ verified luxury properties across India</span>
              <Link
                href="#collection"
                onClick={() => setActiveMenu(null)}
                className="text-stone-900 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Browse All Collections</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. SELL DROPDOWN */}
      {activeMenu === 'sell' && (
        <div
          className="hidden lg:block absolute left-0 w-full bg-white border-b border-stone-200/90 shadow-xl shadow-stone-900/5 animate-fade-in z-50"
          onMouseEnter={() => handleMouseEnter('sell')}
        >
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="grid grid-cols-2 gap-10">
              
              {/* Category 1 */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-800" />
                  <span>Selling Privileges</span>
                </div>
                <div className="space-y-1">
                  <DropdownItem
                    icon={<Home className="w-4 h-4 text-stone-700" />}
                    title="List Your Sanctuary"
                    description="Reach private high-intent luxury buyers directly with zero listing fee."
                    href="/dashboard"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<Sparkles className="w-4 h-4 text-stone-700" />}
                    title="Architect Studio Showcase"
                    description="Feature your firm's residential projects to attract clients and buyers."
                    href="/dashboard"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<ShieldCheck className="w-4 h-4 text-stone-700" />}
                    title="Off-Market Private Transactions"
                    description="Discreet transactions protected by strict NDAs and private escrow."
                    href="/dashboard"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<Users className="w-4 h-4 text-stone-700" />}
                    title="Dedicated Concierge Advisor"
                    description="A dedicated property manager handling staging, inquiries, and legal paperwork."
                    href="/dashboard"
                    onClick={() => setActiveMenu(null)}
                  />
                </div>
              </div>

              {/* Category 2 */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  <span>Valuation & Technology</span>
                </div>
                <div className="space-y-1">
                  <DropdownItem
                    icon={<TrendingUp className="w-4 h-4 text-stone-700" />}
                    title="Instant AI Valuation Engine"
                    description="Data-backed pricing based on verified luxury sales in your locality."
                    href="/dashboard"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<Camera className="w-4 h-4 text-stone-700" />}
                    title="Architectural Media Production"
                    description="HDR drone photography, interior daylight shots, and 3D walkthroughs."
                    href="/dashboard"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<FileCheck className="w-4 h-4 text-stone-700" />}
                    title="Legal & Title Due Diligence"
                    description="RERA compliance check, clear deed chains, and encumbrance vetting."
                    href="/dashboard"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<Building className="w-4 h-4 text-stone-700" />}
                    title="Seller Analytics Dashboard"
                    description="Track real-time visitor views, buyer inquiries, and incoming offers."
                    href="/dashboard"
                    onClick={() => setActiveMenu(null)}
                  />
                </div>
              </div>

            </div>

            {/* Bottom bar */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>98% of listings receive qualified private offers within 45 days</span>
              <Link
                href="/dashboard"
                onClick={() => setActiveMenu(null)}
                className="text-stone-900 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Go to Seller Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. PG / COLIVING DROPDOWN */}
      {activeMenu === 'pg' && (
        <div
          className="hidden lg:block absolute left-0 w-full bg-white border-b border-stone-200/90 shadow-xl shadow-stone-900/5 animate-fade-in z-50"
          onMouseEnter={() => handleMouseEnter('pg')}
        >
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="grid grid-cols-2 gap-10">
              
              {/* Category 1 */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-800" />
                  <span>Living Options</span>
                </div>
                <div className="space-y-1">
                  <DropdownItem
                    icon={<Bed className="w-4 h-4 text-stone-700" />}
                    title="Executive Private Suites"
                    description="Quiet private rooms with attached modern bathrooms and work desks."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<Users className="w-4 h-4 text-stone-700" />}
                    title="Curated Coliving Homes"
                    description="Spacious shared residences with gardens, lounges, and community events."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<Building className="w-4 h-4 text-stone-700" />}
                    title="Independent Studio Apartments"
                    description="Self-contained studio homes with private kitchenette and balcony."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<ShieldCheck className="w-4 h-4 text-stone-700" />}
                    title="Zero Brokerage Verified Stays"
                    description="Direct leases with verified property managers and transparent rent."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                </div>
              </div>

              {/* Category 2 */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  <span>Popular Locations & Perks</span>
                </div>
                <div className="space-y-1">
                  <DropdownItem
                    icon={<MapPin className="w-4 h-4 text-stone-700" />}
                    title="Gurugram Cyber Hub & Golf Course Rd"
                    description="Near top corporate offices, rapid metro stations, and restaurants."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<MapPin className="w-4 h-4 text-stone-700" />}
                    title="South Delhi (Hauz Khas & GK)"
                    description="Serene residential neighborhoods surrounded by parks and cafes."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<Wifi className="w-4 h-4 text-stone-700" />}
                    title="High-Speed Wi-Fi & Power Backup"
                    description="Reliable optic-fiber internet built for founders and remote professionals."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<Coffee className="w-4 h-4 text-stone-700" />}
                    title="Fresh Meals & Daily Cleaning"
                    description="Nutritious meals and daily housekeeping included in monthly rent."
                    href="#collection"
                    onClick={() => setActiveMenu(null)}
                  />
                </div>
              </div>

            </div>

            {/* Bottom bar */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Flexible monthly stays with zero long commitments</span>
              <Link
                href="#collection"
                onClick={() => setActiveMenu(null)}
                className="text-stone-900 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Explore Available PG Suites</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. EMI CALCULATOR DROPDOWN */}
      {activeMenu === 'emi' && (
        <div
          className="hidden lg:block absolute left-0 w-full bg-white border-b border-stone-200/90 shadow-xl shadow-stone-900/5 animate-fade-in z-50"
          onMouseEnter={() => handleMouseEnter('emi')}
        >
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="grid grid-cols-2 gap-10">
              
              {/* Category 1 */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-800" />
                  <span>Calculators & Tools</span>
                </div>
                <div className="space-y-1">
                  <DropdownItem
                    icon={<Calculator className="w-4 h-4 text-stone-700" />}
                    title="Home Loan EMI Calculator"
                    description="Calculate exact monthly installments, interest totals, and amortizations."
                    href="#emi-calculator"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<PiggyBank className="w-4 h-4 text-stone-700" />}
                    title="Affordability & Budget Estimator"
                    description="Check how much home loan you can get based on monthly family income."
                    href="#emi-calculator"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<Landmark className="w-4 h-4 text-stone-700" />}
                    title="Pre-Payment & Tenure Reducer"
                    description="See how small annual pre-payments can save lakhs in loan interest."
                    href="#emi-calculator"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<Building className="w-4 h-4 text-stone-700" />}
                    title="Loan Against Property (LAP)"
                    description="Unlock equity in your existing property with lower interest rates."
                    href="#emi-calculator"
                    onClick={() => setActiveMenu(null)}
                  />
                </div>
              </div>

              {/* Category 2 */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  <span>Tax Savings & Bank Rates</span>
                </div>
                <div className="space-y-1">
                  <DropdownItem
                    icon={<BadgePercent className="w-4 h-4 text-stone-700" />}
                    title="Bank Interest Rates 2026"
                    description="Compare home loan rates across SBI, HDFC, ICICI, and Axis Bank."
                    href="#emi-calculator"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<FileText className="w-4 h-4 text-stone-700" />}
                    title="Tax Benefits: Section 24(b) & 80C"
                    description="Save up to ₹3.5 Lakhs every year on interest and principal repayments."
                    href="#emi-calculator"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<ShieldCheck className="w-4 h-4 text-stone-700" />}
                    title="Instant Pre-Approval Assistance"
                    description="Get quick digital loan sanction letters within 48 hours."
                    href="/dashboard"
                    onClick={() => setActiveMenu(null)}
                  />
                  <DropdownItem
                    icon={<TrendingUp className="w-4 h-4 text-stone-700" />}
                    title="Down Payment Planning"
                    description="Simple guides on stamp duty, registration fees, and down payments."
                    href="#emi-calculator"
                    onClick={() => setActiveMenu(null)}
                  />
                </div>
              </div>

            </div>

            {/* Bottom bar */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-500">
                Partnered with SBI, HDFC, ICICI, and Kotak Mahindra Bank
              </span>
              <a
                href="#emi-calculator"
                onClick={() => setActiveMenu(null)}
                className="text-stone-900 font-semibold hover:underline inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Open Live Interactive Calculator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MOBILE EXPANDABLE DRAWER                                       */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 top-[73px] bg-stone-950/20 backdrop-blur-[2px] z-40 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden relative z-50 bg-white border-b border-stone-200 px-6 py-6 animate-fade-in shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="space-y-4">
              
              {/* 1. Mobile Buy Accordion */}
              <div className="border-b border-stone-100 pb-3">
                <button
                  type="button"
                  onClick={() => setMobileAccordion(mobileAccordion === 'buy' ? null : 'buy')}
                  className="w-full flex items-center justify-between py-2 text-sm font-semibold text-stone-900 cursor-pointer"
                >
                  <span>Buy Residences</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${mobileAccordion === 'buy' ? 'rotate-180' : ''}`}
                  />
                </button>
                {mobileAccordion === 'buy' && (
                  <div className="pl-3 pt-2 space-y-2 text-xs text-stone-600">
                    <Link
                      href="#collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Luxury Villas & Estates
                    </Link>
                    <Link
                      href="#collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Penthouses & Sky Mansions
                    </Link>
                    <Link
                      href="#collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Architectural Apartments
                    </Link>
                    <Link
                      href="#collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Plots & Farmland Parcels
                    </Link>
                  </div>
                )}
              </div>

              {/* 2. Mobile Sell Accordion */}
              <div className="border-b border-stone-100 pb-3">
                <button
                  type="button"
                  onClick={() => setMobileAccordion(mobileAccordion === 'sell' ? null : 'sell')}
                  className="w-full flex items-center justify-between py-2 text-sm font-semibold text-stone-900 cursor-pointer"
                >
                  <span>Sell & Valuation</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${mobileAccordion === 'sell' ? 'rotate-180' : ''}`}
                  />
                </button>
                {mobileAccordion === 'sell' && (
                  <div className="pl-3 pt-2 space-y-2 text-xs text-stone-600">
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • List Your Sanctuary (Free)
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Instant AI Property Valuation
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Architect Studio Showcase
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Off-Market Confidential Sales
                    </Link>
                  </div>
                )}
              </div>

              {/* 3. Mobile PG Accordion */}
              <div className="border-b border-stone-100 pb-3">
                <button
                  type="button"
                  onClick={() => setMobileAccordion(mobileAccordion === 'pg' ? null : 'pg')}
                  className="w-full flex items-center justify-between py-2 text-sm font-semibold text-stone-900 cursor-pointer"
                >
                  <span>PG & Co-living</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${mobileAccordion === 'pg' ? 'rotate-180' : ''}`}
                  />
                </button>
                {mobileAccordion === 'pg' && (
                  <div className="pl-3 pt-2 space-y-2 text-xs text-stone-600">
                    <Link
                      href="#collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Executive Private Suites
                    </Link>
                    <Link
                      href="#collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Gurugram (Cyber Hub & Golf Course Rd)
                    </Link>
                    <Link
                      href="#collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • South Delhi Creative Enclaves
                    </Link>
                    <Link
                      href="#collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Zero Brokerage Direct Leases
                    </Link>
                  </div>
                )}
              </div>

              {/* 4. Mobile EMI Accordion */}
              <div className="border-b border-stone-100 pb-3">
                <button
                  type="button"
                  onClick={() => setMobileAccordion(mobileAccordion === 'emi' ? null : 'emi')}
                  className="w-full flex items-center justify-between py-2 text-sm font-semibold text-stone-900 cursor-pointer"
                >
                  <span>EMI Calculator</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${mobileAccordion === 'emi' ? 'rotate-180' : ''}`}
                  />
                </button>
                {mobileAccordion === 'emi' && (
                  <div className="pl-3 pt-2 space-y-2 text-xs text-stone-600">
                    <a
                      href="#emi-calculator"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Home Loan EMI Calculator
                    </a>
                    <a
                      href="#emi-calculator"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Affordability & Budget Estimator
                    </a>
                    <a
                      href="#emi-calculator"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Section 24(b) & 80C Tax Guide
                    </a>
                    <a
                      href="#emi-calculator"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Compare Bank Rates (SBI, HDFC, ICICI)
                    </a>
                  </div>
                )}
              </div>

              {/* Mobile Auth and Action buttons */}
              <div className="pt-4 space-y-2">
                <Link
                  href="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full block py-2.5 text-center text-sm font-medium rounded-xl border border-stone-200 text-stone-900 hover:bg-stone-50 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full block py-2.5 text-center text-sm font-medium rounded-xl bg-stone-900 text-white hover:bg-black transition"
                >
                  Post Property
                </Link>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}

// Clean Dropdown Item Component
function DropdownItem({ icon, title, description, href, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-stone-50 transition-colors group cursor-pointer"
    >
      <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 group-hover:bg-stone-900 group-hover:text-white transition-colors">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-stone-900 group-hover:underline underline-offset-2 flex items-center gap-1">
          <span>{title}</span>
        </div>
        <p className="text-xs text-stone-500 font-normal leading-relaxed mt-0.5 line-clamp-2">
          {description}
        </p>
      </div>
    </Link>
  );
}
