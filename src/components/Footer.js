'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp, Phone, MessageSquare, MapPin } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-stone-200/80 bg-white text-stone-600 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
          
          {/* Brand Info & Contact (Span 2) */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-3 focus-ring rounded-lg">
                <Image
                  src="/dwarkesh-logo-transparent.png"
                  alt="Dwarkesh Real Estate Group"
                  width={1024}
                  height={551}
                  className="h-9 w-auto max-w-[52px] object-contain drop-shadow-xs"
                />
                <div className="flex flex-col">
                  <span className="font-serif font-bold tracking-[0.14em] text-stone-900 text-base uppercase leading-none">
                    Dwarkesh
                  </span>
                  <span className="text-[9px] font-semibold tracking-[0.20em] text-stone-500 uppercase font-sans mt-0.5">
                    Real Estate Group
                  </span>
                </div>
              </Link>

              <p className="text-sm text-stone-500 mt-4 max-w-sm leading-relaxed">
                Discover verified luxury homes, modern villas, and prime properties across India with transparent pricing and expert advisory.
              </p>

              <div className="mt-5 flex items-center gap-2 text-xs text-stone-500">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>Golf Course Road, Gurugram, Haryana</span>
              </div>
            </div>

            {/* Quick Contact Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="tel:+919876543210"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 text-xs font-medium transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-stone-600" />
                <span>+91 98765 43210</span>
              </a>

              <a
                href="https://wa.me/919876543210?text=Hi%20Dwarkesh,%20I'm%20interested%20in%20exploring%20properties."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/60 text-xs font-medium transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-[#25D366] shrink-0" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Column 1: Properties */}
          <div>
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-4">
              Properties
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/search?mode=buy"
                  className="text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Buy Homes
                </Link>
              </li>
              <li>
                <Link
                  href="/search?mode=rent"
                  className="text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Rentals
                </Link>
              </li>
              <li>
                <Link
                  href="/search?mode=plots"
                  className="text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Plots &amp; Land
                </Link>
              </li>
              <li>
                <Link
                  href="/#collection"
                  className="text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Featured Collection
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Popular Cities */}
          <div>
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-4">
              Top Cities
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/search?city=Gurugram"
                  className="text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Gurugram
                </Link>
              </li>
              <li>
                <Link
                  href="/search?city=Mumbai"
                  className="text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Mumbai
                </Link>
              </li>
              <li>
                <Link
                  href="/search?city=Alibaug"
                  className="text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Alibaug
                </Link>
              </li>
              <li>
                <Link
                  href="/search?city=Kasauli+Hills"
                  className="text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Kasauli Hills
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Tools & Account */}
          <div>
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-4">
              Tools &amp; Account
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/#emi-calculator"
                  className="text-stone-600 hover:text-stone-900 transition-colors"
                >
                  EMI Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/post-property"
                  className="text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Post Your Property
                </Link>
              </li>
              <li>
                <Link
                  href="/auth"
                  className="text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-stone-600 hover:text-stone-900 transition-colors"
                >
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="mt-12 pt-8 border-t border-stone-200/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            &copy; 2026 Dwarkesh Real Estate Group. All rights reserved.
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 font-medium transition-colors cursor-pointer group"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
}
