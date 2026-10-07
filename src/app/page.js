import Link from 'next/link';
import { ArrowRight, Compass, Shield, Layers, ArrowUpRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-black bg-grid-light flex flex-col selection:bg-black selection:text-white">
      {/* Header */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center transition-transform group-hover:scale-105">
              {/* 4-walls motif */}
              <div className="w-3.5 h-3.5 border border-white grid grid-cols-2 p-0.5 gap-0.5">
                <div className="bg-white" />
                <div className="border border-white/50" />
                <div className="border border-white/50" />
                <div className="bg-white" />
              </div>
            </div>
            <span className="text-sm font-semibold tracking-widest uppercase text-black font-mono">
              CharDiwari
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-8 text-xs font-mono tracking-wider text-zinc-500 uppercase">
            <a href="#collection" className="hover:text-black transition">
              Sanctuaries
            </a>
            <a href="#elements" className="hover:text-black transition">
              Pillars
            </a>
            <Link href="/dashboard" className="hover:text-black transition">
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="text-xs font-mono uppercase tracking-wider text-zinc-600 hover:text-black transition px-3.5 py-2 rounded-lg border border-zinc-200 hover:border-black"
            >
              Sign In
            </Link>
            <Link
              href="/auth"
              className="text-xs font-mono uppercase tracking-wider text-white bg-black hover:bg-zinc-800 transition px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <span>Get Access</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 pt-20 sm:pt-28 pb-20 flex flex-col items-center text-center">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 text-[11px] font-mono uppercase tracking-wider mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-black" />
          <span>Architectural Sanctuary • चारदीवारी</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-black max-w-4xl leading-[1.08] mb-6">
          Four Walls. <br />
          <span className="font-serif italic text-zinc-700">Pure Sanctuary.</span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-500 font-light max-w-xl mb-10 leading-relaxed">
          Private residential architecture conceived for silence, natural daylight, and permanence.
        </p>

        {/* Hero Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-20">
          <Link
            href="/auth"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-black text-white text-sm font-medium tracking-wide hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Enter Sanctuary</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#collection"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-zinc-200 bg-white text-black text-sm font-medium hover:border-black transition-all flex items-center justify-center"
          >
            View Collection
          </a>
        </div>

        {/* Minimal 4 Pillars Grid */}
        <div id="elements" className="w-full border-t border-zinc-200/80 pt-16 mb-20 text-left">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest block">01 / Space</span>
              <h3 className="text-base font-medium text-black">Proportion</h3>
              <p className="text-xs text-zinc-500 font-light leading-relaxed">Balanced volumes calibrated for uninterrupted calm.</p>
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest block">02 / Light</span>
              <h3 className="text-base font-medium text-black">Daylight</h3>
              <p className="text-xs text-zinc-500 font-light leading-relaxed">Courtyard apertures capturing changing shadows throughout the day.</p>
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest block">03 / Material</span>
              <h3 className="text-base font-medium text-black">Permanence</h3>
              <p className="text-xs text-zinc-500 font-light leading-relaxed">Exposed basalt, raw concrete, lime plaster, and aged teakwood.</p>
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest block">04 / Privacy</span>
              <h3 className="text-base font-medium text-black">Sanctuary</h3>
              <p className="text-xs text-zinc-500 font-light leading-relaxed">A secluded perimeter protecting residential intimacy.</p>
            </div>
          </div>
        </div>

        {/* Minimal Curated Sanctuaries */}
        <div id="collection" className="w-full text-left mb-20">
          <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4 mb-8">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500">
              Curated Holdings
            </h2>
            <span className="text-xs font-mono text-zinc-400">03 Sanctuaries</span>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Residence 1 */}
            <div className="rounded-2xl border border-zinc-200/80 p-6 hover:border-black transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3">
                  <span>RESIDENCE 01</span>
                  <span>DELHI NCR</span>
                </div>
                <h3 className="text-lg font-medium text-black mb-1 group-hover:underline underline-offset-4">
                  The Courtyard House
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed mb-6 font-light">
                  Central open sky atrium with monolithic stone walls and water mirror.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">4,800 SQ.FT</span>
                <span className="text-emerald-700 font-medium">Available</span>
              </div>
            </div>

            {/* Residence 2 */}
            <div className="rounded-2xl border border-zinc-200/80 p-6 hover:border-black transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3">
                  <span>RESIDENCE 02</span>
                  <span>KASAULI HILLS</span>
                </div>
                <h3 className="text-lg font-medium text-black mb-1 group-hover:underline underline-offset-4">
                  The Monolith Pavilion
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed mb-6 font-light">
                  Cantilevered ridge retreat facing westward Himalayan pine forests.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">6,200 SQ.FT</span>
                <span className="text-zinc-500">Private</span>
              </div>
            </div>

            {/* Residence 3 */}
            <div className="rounded-2xl border border-zinc-200/80 p-6 hover:border-black transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3">
                  <span>RESIDENCE 03</span>
                  <span>ALIBAUG COAST</span>
                </div>
                <h3 className="text-lg font-medium text-black mb-1 group-hover:underline underline-offset-4">
                  The Atrium Villa
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed mb-6 font-light">
                  Horizontal rammed earth architecture enclosed by coconut groves.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">5,400 SQ.FT</span>
                <span className="text-emerald-700 font-medium">Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Access Callout */}
        <div className="w-full rounded-3xl border border-zinc-200/80 bg-zinc-50 p-8 sm:p-12 text-center flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-light text-black mb-3">
            Acquire or commission your sanctuary.
          </h2>
          <p className="text-sm text-zinc-500 max-w-md mb-6 font-light">
            Sign in to view blueprint archives, private pricing, and site consultation details.
          </p>
          <Link
            href="/auth"
            className="px-6 py-3 rounded-xl bg-black text-white text-xs font-mono uppercase tracking-wider hover:bg-zinc-800 transition flex items-center gap-2"
          >
            <span>Access Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 py-8 bg-white text-xs font-mono text-zinc-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-black font-semibold uppercase">CharDiwari</span>
            <span>•</span>
            <span>चारदीवारी Architectural Sanctuary</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/auth" className="hover:text-black transition">
              Sign In
            </Link>
            <Link href="/dashboard" className="hover:text-black transition">
              Dashboard
            </Link>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
