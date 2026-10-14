'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Phone,
  PhoneCall,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Building2,
  MapPin,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Home,
  FileText,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function TrackPropertyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedRef, setCopiedRef] = useState(null);

  // Read initial query from URL
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('ref') || searchParams.get('phone') || '';
    if (q) {
      setSearchQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (term) => {
    const cleanTerm = (term || searchQuery).trim();
    if (!cleanTerm) {
      setErrorMsg('Please enter your mobile number or submission reference ID.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/properties/track?q=${encodeURIComponent(cleanTerm)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setResults(data.properties || []);
      } else {
        setResults([]);
        if (data.error && !data.error.includes('No matching')) {
          setErrorMsg(data.error);
        }
      }
    } catch (err) {
      setErrorMsg('Network error while looking up property status. Please check your connection.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/track?q=${encodeURIComponent(searchQuery.trim())}`, { scroll: false });
    performSearch(searchQuery.trim());
  };

  const copyToClipboard = (text) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedRef(text);
      setTimeout(() => setCopiedRef(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 flex flex-col selection:bg-stone-900 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        {/* ============================================================== */}
        {/* HERO SECTION                                                  */}
        {/* ============================================================== */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-[11px] font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
              Listing Verification
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight">
              Track Your Property Status
            </h1>

            <p className="text-sm sm:text-base text-stone-600 font-light leading-relaxed">
              Check real-time editorial review progress, desk verification calls, and live marketplace approval status for your listings.
            </p>
          </div>

          {/* Search Box Card */}
          <div className="mt-8 max-w-xl mx-auto bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-stone-200/90 shadow-lg shadow-stone-200/40">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter 10-digit mobile or Ref (DW-SUB-...)"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 hover:bg-stone-100/60 focus:bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Track Status</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium mt-2 px-1 text-center sm:text-left">
                {errorMsg}
              </p>
            )}

            {/* Quick Helper Links */}
            <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-[11px] text-stone-500 px-1 gap-2">
              <span>Supports phone number, DW-SUB-XXXXXX, or email</span>
              <div className="flex items-center gap-3 font-medium">
                <Link href="/post-property" className="text-stone-800 hover:underline">
                  Post New Property ↗
                </Link>
                <span>&bull;</span>
                <a
                  href="https://wa.me/919876543210?text=Hi%20CharDiwari,%20I'd%20like%20to%20inquire%20about%20my%20property%20listing%20status."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:underline flex items-center gap-1"
                >
                  WhatsApp Help
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RESULTS SECTION                                                */}
        {/* ============================================================== */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {loading && (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-stone-400 animate-spin mx-auto" />
              <p className="text-xs sm:text-sm font-medium text-stone-600">
                Verifying application status across editorial registry...
              </p>
            </div>
          )}

          {!loading && hasSearched && results.length === 0 && (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  No Submission Found
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  We could not locate any property matching <span className="font-semibold text-stone-800">&quot;{searchQuery}&quot;</span>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 text-left text-xs space-y-2 text-stone-600 border border-stone-200/80">
                <span className="font-bold text-stone-900 block">Helpful Verification Tips:</span>
                <ul className="list-disc pl-4 space-y-1 text-stone-500">
                  <li>Ensure you entered the exact 10-digit mobile number used during submission.</li>
                  <li>Check for any typos in the reference number (e.g., <code className="font-mono text-stone-800">DW-SUB-123456</code>).</li>
                  <li>If you recently completed submission, please allow up to 60 seconds for synchronization.</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/post-property"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-black transition text-center"
                >
                  Post a Property Now
                </Link>
                <a
                  href="https://wa.me/919876543210?text=Hi%20CharDiwari,%20I'm%20trying%20to%20track%20my%20property%20submission."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-xs font-semibold hover:bg-stone-50 transition text-center"
                >
                  Contact Support
                </a>
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Found {results.length} Property Application{results.length > 1 ? 's' : ''}
                </h2>
                <span className="text-xs text-stone-400 font-medium">
                  Verified Real-Time Status
                </span>
              </div>

              {results.map((item) => {
                const isPending = item.status === 'pending_review' || item.status === 'pending';
                const isRejected = item.status === 'rejected';
                const isPublished = item.status === 'published';

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden transition-all duration-200 hover:border-stone-300"
                  >
                    {/* Header Banner */}
                    <div
                      className={`px-5 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
                        isPublished
                          ? 'bg-stone-50 border-stone-200 text-stone-900'
                          : isRejected
                          ? 'bg-stone-50 border-stone-200 text-stone-900'
                          : 'bg-stone-50 border-stone-200 text-stone-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isPublished && <CheckCircle2 className="w-4 h-4 text-stone-900" />}
                        {isPending && <Clock className="w-4 h-4 text-stone-600" />}
                        {isRejected && <XCircle className="w-4 h-4 text-stone-600" />}
                        <span className="text-xs font-semibold tracking-wide">
                          {isPublished ? 'Live on CharDiwari' : isPending ? 'Under Review' : 'Listing Archived / Rejected'}
                        </span>
                      </div>

                      {/* Reference Badge with Copy */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-stone-500 font-medium">Application Ref:</span>
                        <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs">
                          <span className="font-mono text-xs font-bold text-stone-900">{item.submission_ref}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.submission_ref)}
                            className="text-stone-400 hover:text-stone-900 cursor-pointer ml-1"
                            title="Copy Reference"
                          >
                            {copiedRef === item.submission_ref ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Main Card Content */}
                    <div className="p-5 sm:p-7 space-y-6">
                      {/* Property Overview Strip */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200 relative">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs font-serif">
                                CharDiwari
                              </div>
                            )}
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/70 backdrop-blur-xs text-[9px] font-bold text-white uppercase">
                              {item.bhk || item.type || 'Property'}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 truncate">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </div>
                            <div className="text-sm sm:text-base font-serif font-bold text-stone-900 mt-1">
                              {item.price || 'Price on Request'}
                            </div>
                          </div>
                        </div>

                        {/* Direct Action Link if Published */}
                        {isPublished && (
                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            <Link
                              href={`/property/${item.slug || item.id}`}
                              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                            >
                              <span>View Live Listing</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* ============================================================== */}
                      {/* MULTI-STAGE PROGRESS STEPPER                                   */}
                      {/* ============================================================== */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4">
                          Verification Progress &amp; Audit Trail
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-2 relative">
                          {/* Step 1: Submission Received */}
                          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Completed
                              </span>
                            </div>
                            <div className="font-bold text-xs text-stone-900">1. Details Received</div>
                            <p className="text-[11px] text-stone-500 leading-tight">
                              Contact info and property specs successfully logged.
                            </p>
                          </div>

                          {/* Step 2: Review */}
                          <div
                            className={`p-3.5 rounded-2xl border space-y-1.5 ${
                              isPublished || isRejected
                                ? 'bg-stone-50 border-stone-200/80'
                                : 'bg-stone-100/70 border-stone-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isPublished || isRejected
                                    ? 'bg-stone-900 text-white'
                                    : 'bg-stone-800 text-white'
                                }`}
                              >
                                {isPublished || isRejected ? <Check className="w-3.5 h-3.5" /> : '2'}
                              </div>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                  isPublished || isRejected
                                    ? 'text-stone-700 bg-white border-stone-200'
                                    : 'text-stone-800 bg-stone-200/80 border-stone-300'
                                }`}
                              >
                                {isPublished || isRejected ? 'Completed' : 'In Progress'}
                              </span>
                            </div>
                            <div className="font-semibold text-xs text-stone-900">2. Editorial Review</div>
                            <p className="text-[11px] text-stone-500 leading-tight">
                              Photo resolution, pricing benchmark &amp; verification.
                            </p>
                          </div>

                          {/* Step 3: Desk Call / WhatsApp */}
                          <div
                            className={`p-3.5 rounded-2xl border space-y-1.5 ${
                              isPublished
                                ? 'bg-stone-50 border-stone-200/80'
                                : isRejected
                                ? 'bg-rose-50/50 border-rose-200'
                                : isPending
                                ? 'bg-white border-stone-200'
                                : 'bg-stone-50 border-stone-200/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isPublished
                                    ? 'bg-emerald-500 text-white'
                                    : isRejected
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-stone-200 text-stone-700'
                                }`}
                              >
                                {isPublished ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : isRejected ? (
                                  <XCircle className="w-3.5 h-3.5" />
                                ) : (
                                  '3'
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                  isPublished
                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                    : isRejected
                                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                                    : 'text-stone-500 bg-stone-100 border-stone-200'
                                }`}
                              >
                                {isPublished ? 'Verified' : isRejected ? 'Incomplete' : 'Next Step'}
                              </span>
                            </div>
                            <div className="font-bold text-xs text-stone-900">3. Verification Call</div>
                            <p className="text-[11px] text-stone-500 leading-tight">
                              Direct confirmation call or WhatsApp check with seller.
                            </p>
                          </div>

                          {/* Step 4: Live Marketplace Release */}
                          <div
                            className={`p-3.5 rounded-2xl border space-y-1.5 ${
                              isPublished
                                ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20'
                                : isRejected
                                ? 'bg-rose-50/70 border-rose-300'
                                : 'bg-stone-50/50 border-stone-200/60 opacity-70'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isPublished
                                    ? 'bg-emerald-600 text-white'
                                    : isRejected
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-stone-200 text-stone-500'
                                }`}
                              >
                                {isPublished ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : isRejected ? (
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                ) : (
                                  '4'
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                  isPublished
                                    ? 'text-emerald-800 bg-emerald-100 border-emerald-300'
                                    : isRejected
                                    ? 'text-rose-800 bg-rose-100 border-rose-300'
                                    : 'text-stone-400 bg-stone-100 border-stone-200'
                                }`}
                              >
                                {isPublished ? 'Published Live' : isRejected ? 'Rejected' : 'Pending'}
                              </span>
                            </div>
                            <div className="font-bold text-xs text-stone-900">4. Decision &amp; Live</div>
                            <p className="text-[11px] text-stone-500 leading-tight">
                              Listing is live to high-net-worth buyers or flagged for edits.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ============================================================== */}
                      {/* SPECIFIC REJECTION / EDIT NOTE CALLOUT                         */}
                      {/* ============================================================== */}
                      {isRejected && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-950 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-900">
                            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                            <span>Editorial Feedback &amp; Required Changes:</span>
                          </div>
                          <p className="text-xs sm:text-sm font-medium leading-relaxed pl-6">
                            &quot;{item.admin_review_note || 'Incomplete details / photographic resolution below marketplace standards. Please update.'}&quot;
                          </p>
                          <div className="pt-2 pl-6 flex flex-wrap items-center gap-3">
                            <Link
                              href="/post-property"
                              className="px-4 py-2 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-semibold transition"
                            >
                              Update &amp; Re-Submit Property
                            </Link>
                            <a
                              href={`https://wa.me/919876543210?text=Hi%20CharDiwari,%20I'm%20inquiring%20about%20feedback%20for%20my%20submission%20${item.submission_ref}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-white border border-rose-300 text-rose-900 rounded-xl text-xs font-semibold hover:bg-rose-100/50 transition flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-rose-700" />
                              <span>Discuss with Editorial Desk</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* ============================================================== */}
                      {/* PUBLISHED CELEBRATION BOX                                      */}
                      {/* ============================================================== */}
                      {isPublished && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                              <Sparkles className="w-4 h-4 text-emerald-600" />
                              <span>Your listing is verified and receiving active buyer views!</span>
                            </div>
                            <p className="text-xs text-emerald-800">
                              Email notification has been sent. Buyer leads and direct WhatsApp messages will arrive via your verified phone.
                            </p>
                          </div>
                          <Link
                            href={`/property/${item.slug || item.id}`}
                            className="px-4 py-2 rounded-xl bg-emerald-900 hover:bg-black text-white text-xs font-semibold shrink-0 transition"
                          >
                            Open Live Page ↗
                          </Link>
                        </div>
                      )}

                      {/* ============================================================== */}
                      {/* UNDER REVIEW INFORMATIVE BOX                                   */}
                      {/* ============================================================== */}
                      {isPending && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                              <Clock className="w-4 h-4 text-stone-600" />
                              <span>Turnaround: 2 to 4 Business Hours</span>
                            </div>
                            <p className="text-xs text-stone-600">
                              Our editorial team is reviewing your property specifications. We will send an email confirmation the moment your listing is approved.
                            </p>
                          </div>
                          <a
                            href={`https://wa.me/919876543210?text=Hi%20CharDiwari,%20checking%20status%20for%20reference%20${item.submission_ref}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold shrink-0 transition"
                          >
                            Support on WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================== */}
          {/* DEFAULT INTRO VIEW IF NO SEARCH YET                            */}
          {/* ============================================================== */}
          {!hasSearched && (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center text-stone-700 mx-auto border border-stone-200">
                <ShieldCheck className="w-8 h-8 text-stone-800" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  Track Any Listing in Real-Time
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 font-light leading-relaxed">
                  Enter your 10-digit mobile number or application reference in the search box above to inspect editorial review notes, phone call logs, and publication status.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                  <span className="font-bold text-xs text-stone-900 block">Fast Review</span>
                  <span className="text-[11px] text-stone-500 block leading-tight">Average 2-4 hr editorial turnaround</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                  <span className="font-bold text-xs text-stone-900 block">Instant Email</span>
                  <span className="text-[11px] text-stone-500 block leading-tight">Mailed automatically upon approval</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                  <span className="font-bold text-xs text-stone-900 block">Direct Support</span>
                  <span className="text-[11px] text-stone-500 block leading-tight">WhatsApp desk for immediate questions</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function TrackPropertyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <RefreshCw className="w-8 h-8 text-stone-400 animate-spin" />
        </div>
      }
    >
      <TrackPropertyContent />
    </Suspense>
  );
}
