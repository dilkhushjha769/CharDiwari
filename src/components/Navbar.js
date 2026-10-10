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
  PhoneCall,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  User,
  LogOut,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function Navbar() {
  const [activeMenu, setActiveMenu] = useState(null); // 'buy' | 'rent' | 'sell' | 'pg' | 'emi' | null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState(null);
  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [selectedTiming, setSelectedTiming] = useState('Immediate (Right Now)');
  const [customTiming, setCustomTiming] = useState('');
  const [user, setUser] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('/');

  const navRef = useRef(null);
  const timeoutRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Track current URL for redirect back after login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname + window.location.search;
      setCurrentUrl(path !== '/auth' ? path : '/');
    }
  }, []);

  // Check Supabase session & listen to auth changes
  useEffect(() => {
    const { client } = getSupabaseClient();
    if (client) {
      // 1. Initial check
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Member',
            avatarUrl: session.user.user_metadata?.avatar_url || null,
          });
        } else {
          // Fallback check
          fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data?.authenticated && data?.user) {
                setUser(data.user);
              } else {
                setUser(null);
              }
            })
            .catch(() => setUser(null));
        }
      });

      // 2. Auth state change listener
      const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Member',
            avatarUrl: session.user.user_metadata?.avatar_url || null,
          });
        } else {
          setUser(null);
        }
      });

      return () => sub?.subscription?.unsubscribe();
    }
  }, []);

  const handleSignOut = async () => {
    const { client } = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    if (typeof document !== 'undefined') {
      document.cookie = 'chardiwari_session=; path=/; max-age=0; SameSite=Lax';
    }
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setProfileDropdownOpen(false);
  };

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setActiveMenu(null);
        setProfileDropdownOpen(false);
        setMobileMenuOpen(false);
        setExpertModalOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Lock body scroll when Expert Modal is active
  useEffect(() => {
    if (expertModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [expertModalOpen]);

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
    { key: 'rent', label: 'Rent' },
    { key: 'sell', label: 'Sell' },
  ];

  return (
    <div ref={navRef} className="sticky top-0 z-50 w-full" onMouseLeave={handleMouseLeave}>
      {/* Top Header */}
      <header className="border-b border-stone-200/80 bg-white/95 backdrop-blur-md relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo & Main Nav */}
          <div className="flex items-center gap-10 h-full">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/dwarkesh-logo-transparent.png"
                alt="Dwarkesh Real Estate Group"
                className="h-8 sm:h-9 w-auto max-w-[58px] object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-xs"
              />
              <div className="flex flex-col">
                <span className="font-serif font-bold tracking-[0.14em] text-stone-900 text-base sm:text-[17px] uppercase leading-none">
                  Dwarkesh
                </span>
                <span className="text-[9px] sm:text-[9.5px] font-semibold tracking-[0.22em] text-stone-500 uppercase font-sans mt-1">
                  Real Estate Group
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 h-full">
              {/* 1. BUY */}
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => handleMouseEnter('buy')}
              >
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === 'buy' ? null : 'buy')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${activeMenu === 'buy'
                    ? 'bg-stone-100 text-stone-900 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                >
                  <span>Buy</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${activeMenu === 'buy' ? 'rotate-180 text-stone-900' : ''
                      }`}
                  />
                </button>

                {activeMenu === 'buy' && (
                  <div className="absolute left-0 top-full pt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="w-[450px] bg-white rounded-2xl border border-stone-200/90 shadow-2xl p-3.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2.5 py-1 mb-1">
                        Select Property Type
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <DropdownItem
                          icon={<Home className="w-4 h-4" />}
                          title="Villas & Estates"
                          description="Gated private homes"
                          href="#collection"
                          onClick={() => setActiveMenu(null)}
                        />
                        <DropdownItem
                          icon={<Building className="w-4 h-4" />}
                          title="Apartments"
                          description="3 & 4 BHK luxury flats"
                          href="#collection"
                          onClick={() => setActiveMenu(null)}
                        />
                        <DropdownItem
                          icon={<Building2 className="w-4 h-4" />}
                          title="Penthouses"
                          description="Skyline duplex homes"
                          href="#collection"
                          onClick={() => setActiveMenu(null)}
                        />
                        <DropdownItem
                          icon={<Compass className="w-4 h-4" />}
                          title="Plots & Land"
                          description="Gated parcels to build"
                          href="#collection"
                          onClick={() => setActiveMenu(null)}
                        />
                      </div>
                      <div className="mt-2 pt-2.5 border-t border-stone-100 flex items-center justify-between px-2.5 text-[11px] text-stone-500">
                        <span>100+ Verified Homes</span>
                        <Link
                          href="#collection"
                          onClick={() => setActiveMenu(null)}
                          className="text-stone-900 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <span>Browse All</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. RENT */}
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => handleMouseEnter('rent')}
              >
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === 'rent' ? null : 'rent')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${activeMenu === 'rent'
                    ? 'bg-stone-100 text-stone-900 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                >
                  <span>Rent</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${activeMenu === 'rent' ? 'rotate-180 text-stone-900' : ''
                      }`}
                  />
                </button>

                {activeMenu === 'rent' && (
                  <div className="absolute left-0 top-full pt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="w-[340px] bg-white rounded-2xl border border-stone-200/90 shadow-2xl p-3.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2.5 py-1 mb-1">
                        Rental Homes
                      </div>
                      <div className="space-y-1">
                        <DropdownItem
                          icon={<Building className="w-4 h-4" />}
                          title="Furnished Apartments"
                          description="Designer 2, 3 & 4 BHK flats"
                          href="#collection"
                          onClick={() => setActiveMenu(null)}
                        />
                        <DropdownItem
                          icon={<Home className="w-4 h-4" />}
                          title="Luxury Villas"
                          description="Private homes with gardens"
                          href="#collection"
                          onClick={() => setActiveMenu(null)}
                        />
                        <DropdownItem
                          icon={<Building2 className="w-4 h-4" />}
                          title="Penthouses & Duplexes"
                          description="Top floor city skyline views"
                          href="#collection"
                          onClick={() => setActiveMenu(null)}
                        />
                      </div>
                      <div className="mt-2 pt-2.5 border-t border-stone-100 flex items-center justify-between px-2.5 text-[11px] text-stone-500">
                        <span>Zero Brokerage Options</span>
                        <Link
                          href="#collection"
                          onClick={() => setActiveMenu(null)}
                          className="text-stone-900 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <span>View Rentals</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. SELL */}
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => handleMouseEnter('sell')}
              >
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === 'sell' ? null : 'sell')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${activeMenu === 'sell'
                    ? 'bg-stone-100 text-stone-900 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                >
                  <span>Sell</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${activeMenu === 'sell' ? 'rotate-180 text-stone-900' : ''
                      }`}
                  />
                </button>

                {activeMenu === 'sell' && (
                  <div className="absolute left-0 top-full pt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="w-[360px] bg-white rounded-2xl border border-stone-200/90 shadow-2xl p-3.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2.5 py-1 mb-1">
                        Seller Services
                      </div>
                      <div className="space-y-1">
                        <DropdownItem
                          icon={<Home className="w-4 h-4" />}
                          title="Post Property (Free)"
                          description="Reach verified buyers directly"
                          href="/profile"
                          onClick={() => setActiveMenu(null)}
                        />
                        <div
                          onClick={() => {
                            setActiveMenu(null);
                            setExpertModalOpen(true);
                          }}
                          className="flex items-start gap-3 p-2 rounded-xl hover:bg-stone-50 transition-colors group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 group-hover:bg-stone-900 text-stone-700 group-hover:text-white transition-colors [&>svg]:text-stone-700 group-hover:[&>svg]:text-white [&>svg]:transition-colors">
                            <PhoneCall className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-[13px] font-semibold text-stone-900 group-hover:text-black leading-tight">
                              Talk to Property Expert
                            </div>
                            <p className="text-[11px] text-stone-500 leading-tight mt-0.5 truncate">
                              Free consultation on pricing & sale
                            </p>
                          </div>
                        </div>
                        <DropdownItem
                          icon={<TrendingUp className="w-4 h-4" />}
                          title="My Profile"
                          description="Manage your account & listings"
                          href="/profile"
                          onClick={() => setActiveMenu(null)}
                        />
                      </div>
                      <div className="mt-2 pt-2.5 border-t border-stone-100 flex items-center justify-between px-2.5 text-[11px] text-stone-500">
                        <span>Zero Listing Fee</span>
                        <Link
                          href="/profile"
                          onClick={() => setActiveMenu(null)}
                          className="text-stone-900 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <span>Go to Profile</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct EMI Calculator Link without subitems */}
              <div className="h-full flex items-center">
                <a
                  href="#emi-calculator"
                  onClick={() => setActiveMenu(null)}
                  className="relative flex items-center px-3.5 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all duration-150 cursor-pointer"
                >
                  <span>EMI Calculator</span>
                </a>
              </div>
            </nav>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/profile"
              className="group text-sm font-medium text-white bg-stone-900 hover:bg-black transition-all px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm"
            >
              <span>Post Property</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            {/* Call Us button */}
            <button
              type="button"
              onClick={() => setExpertModalOpen(true)}
              className="group flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-stone-700 hover:text-stone-950 bg-stone-50 hover:bg-stone-100 border border-stone-200/90 hover:border-stone-300 transition-all cursor-pointer shadow-2xs"
              title="Talk directly with our property experts"
            >
              <Phone className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-900 transition-colors" />
              <span>Call Us</span>
            </button>

            {/* Auth / Profile Section */}
            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer border border-stone-200/80 bg-stone-50/60"
                  aria-label="User Profile"
                >
                  <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name?.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="font-semibold text-stone-900 text-xs sm:text-sm">Profile</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-stone-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="text-xs font-bold text-stone-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition"
                      >
                        <User className="w-3.5 h-3.5 text-stone-500" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/#collection"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition"
                      >
                        <Home className="w-3.5 h-3.5 text-stone-500" />
                        <span>Saved Homes</span>
                      </Link>
                    </div>
                    <div className="pt-1 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={`/auth?redirect=${encodeURIComponent(currentUrl)}`}
                className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors px-3.5 py-2 rounded-xl hover:bg-stone-100/80"
              >
                Sign In
              </Link>
            )}
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
          className="hidden lg:block fixed inset-0 top-16 bg-stone-900/10 backdrop-blur-[1px] z-40 transition-opacity"
          onClick={() => setActiveMenu(null)}
        />
      )}

      {/* ============================================================== */}
      {/* MOBILE EXPANDABLE DRAWER                                       */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 top-[65px] bg-stone-950/20 backdrop-blur-[2px] z-40 transition-opacity"
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
                  <span>Buy Homes</span>
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
                      • Villas & Estates
                    </Link>
                    <Link
                      href="#collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Apartments
                    </Link>
                    <Link
                      href="#collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Penthouses
                    </Link>
                    <Link
                      href="#collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Plots & Land
                    </Link>
                  </div>
                )}
              </div>

              {/* 2. Mobile Rent Accordion */}
              <div className="border-b border-stone-100 pb-3">
                <button
                  type="button"
                  onClick={() => setMobileAccordion(mobileAccordion === 'rent' ? null : 'rent')}
                  className="w-full flex items-center justify-between py-2 text-sm font-semibold text-stone-900 cursor-pointer"
                >
                  <span>Rent Homes</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${mobileAccordion === 'rent' ? 'rotate-180' : ''}`}
                  />
                </button>
                {mobileAccordion === 'rent' && (
                  <div className="pl-3 pt-2 space-y-2 text-xs text-stone-600">
                    <Link
                      href="#collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Furnished Apartments
                    </Link>
                    <Link
                      href="#collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Luxury Villas
                    </Link>
                    <Link
                      href="#collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Penthouses & Duplexes
                    </Link>
                  </div>
                )}
              </div>

              {/* 3. Mobile Sell Accordion */}
              <div className="border-b border-stone-100 pb-3">
                <button
                  type="button"
                  onClick={() => setMobileAccordion(mobileAccordion === 'sell' ? null : 'sell')}
                  className="w-full flex items-center justify-between py-2 text-sm font-semibold text-stone-900 cursor-pointer"
                >
                  <span>Sell Property</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${mobileAccordion === 'sell' ? 'rotate-180' : ''}`}
                  />
                </button>
                {mobileAccordion === 'sell' && (
                  <div className="pl-3 pt-2 space-y-2 text-xs text-stone-600">
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • Post Property (Free)
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setExpertModalOpen(true);
                      }}
                      className="block py-1 text-left hover:text-stone-900 cursor-pointer"
                    >
                      • Talk to Property Expert
                    </button>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 hover:text-stone-900"
                    >
                      • My Profile
                    </Link>
                  </div>
                )}
              </div>

              {/* Direct EMI Calculator Link without subitems */}
              <div className="border-b border-stone-100 pb-3">
                <a
                  href="#emi-calculator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between py-2 text-sm font-semibold text-stone-900 hover:text-black cursor-pointer"
                >
                  <span>EMI Calculator</span>
                  <ArrowRight className="w-4 h-4 text-stone-400" />
                </a>
              </div>

              {/* Mobile Auth and Action buttons */}
              <div className="pt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setExpertModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-900 transition shadow-2xs cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-stone-700" />
                  <span>Call Us</span>
                </button>

                {user ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                      <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          user.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2.5 text-center text-xs font-semibold rounded-xl bg-stone-900 text-white hover:bg-black transition"
                      >
                        Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                        className="block py-2.5 text-center text-xs font-semibold rounded-xl border border-stone-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/auth?redirect=${encodeURIComponent(currentUrl)}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2.5 text-center text-sm font-medium rounded-xl border border-stone-200 text-stone-900 hover:bg-stone-50 transition"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2.5 text-center text-sm font-medium rounded-xl border border-stone-200 bg-stone-100 text-stone-900 hover:bg-stone-200 transition"
                    >
                      Post Property
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* CALL US - ARCHITECTURAL ADVISORY & TIMING MODAL                */}
      {/* ============================================================== */}
      {expertModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-stone-950/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="call-us-title"
        >
          {/* Backdrop click to close */}
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setExpertModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 flex flex-col p-6 sm:p-7 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 block mb-1">
                  Dwarkesh Help Desk
                </span>
                <h3 id="call-us-title" className="text-xl sm:text-2xl font-serif text-stone-900 font-normal tracking-tight">
                  Speak with an Expert
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Direct phone call & callback scheduling.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpertModalOpen(false)}
                className="p-2 -mr-1 -mt-1 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Dial Hero Card */}
            <a
              href="tel:+919876543210"
              className="group flex items-center justify-between p-4 rounded-2xl bg-stone-900 text-white hover:bg-black transition-all shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-medium tracking-widest uppercase text-stone-400 block">
                    Direct Phone Number
                  </span>
                  <span className="text-base font-serif font-medium tracking-wide text-white">
                    +91 98765 43210
                  </span>
                </div>
              </div>
              <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-stone-950 flex items-center gap-1 group-hover:bg-stone-100 transition-colors">
                <span>Call Now</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </a>

            {/* Subtle Divider */}
            <div className="relative flex items-center justify-center py-0.5">
              <div className="w-full border-t border-stone-100" />
              <span className="absolute bg-white px-3 text-[10px] font-medium uppercase tracking-widest text-stone-400">
                Or Schedule Callback
              </span>
            </div>

            {/* Timing Selection Grid (Clean & Minimal - No Emojis) */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Immediate (Within 15 mins)', title: 'Immediate', sub: '15 mins' },
                  { id: 'Today Evening (5 PM – 8 PM)', title: 'This Evening', sub: '5–8 PM' },
                  { id: 'Tomorrow Morning (10 AM – 1 PM)', title: 'Tomorrow', sub: 'Morning' },
                ].map((slot) => {
                  const isSelected = selectedTiming === slot.id && !customTiming.trim();
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setSelectedTiming(slot.id);
                        setCustomTiming('');
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <span className="block text-xs font-semibold">{slot.title}</span>
                      <span className={`block text-[10px] mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                        {slot.sub}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Timing Input */}
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={customTiming}
                  onChange={(e) => setCustomTiming(e.target.value)}
                  placeholder="Or custom time: e.g. Sunday 11 AM"
                  className="w-full pl-8.5 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-stone-900 text-stone-900 placeholder:text-stone-400 transition"
                />
              </div>
            </div>

            {/* WhatsApp Action Button */}
            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={() => {
                  const timing = customTiming.trim() ? customTiming.trim() : selectedTiming;
                  const message = `Hello Dwarkesh, I would like to schedule a call with a property expert. My preferred time is: ${timing}.`;
                  const url = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`;
                  window.open(url, '_blank');
                  setExpertModalOpen(false);
                }}
                className="w-full py-3 rounded-xl border border-stone-300 hover:border-stone-900 hover:bg-stone-50 text-stone-900 text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="11.5" fill="#25D366" />
                  <path
                    d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.78-1.48-1.76-1.65-2.06-.18-.3-.02-.45.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.59-.49-.5-.67-.52-.18 0-.37-.01-.57-.01-.2 0-.52.08-.8.37-.26.3-1.03 1.02-1.03 2.48 0 1.46 1.06 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.11.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 19.34h-.01c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.15.83.84-3.07-.2-.31a8.3 8.3 0 01-1.27-4.43c0-4.59 3.73-8.32 8.33-8.32 2.22 0 4.31.87 5.88 2.44a8.27 8.27 0 012.44 5.88c0 4.59-3.73 8.32-8.33 8.32z"
                    fill="white"
                  />
                </svg>
                <span>Schedule Callback via WhatsApp</span>
              </button>
              <p className="text-[10px] text-stone-400 text-center tracking-wide">
                Verified properties • Free consultation • Zero broker spam
              </p>
            </div>
          </div>
        </div>
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
      className="flex items-start gap-3 p-2 rounded-xl hover:bg-stone-50 transition-colors group cursor-pointer"
    >
      <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 group-hover:bg-stone-900 text-stone-700 group-hover:text-white transition-colors [&>svg]:text-stone-700 group-hover:[&>svg]:text-white [&>svg]:transition-colors">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs sm:text-[13px] font-semibold text-stone-900 group-hover:text-black leading-tight">
          {title}
        </div>
        <p className="text-[11px] text-stone-500 leading-tight mt-0.5 truncate">
          {description}
        </p>
      </div>
    </Link>
  );
}
