'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users,
  Eye,
  Clock,
  MessageCircle,
  TrendingUp,
  Search,
  MapPin,
  Building2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Flame,
  ArrowRight,
  Filter,
  Calendar,
  Sparkles,
  Phone,
  Film,
  Compass,
  ChevronRight,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  Smartphone,
  Monitor,
  Repeat,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { properties as allProperties } from '@/data/properties';
import {
  getPostHogAppLinks,
  getRecentLocalEvents,
  captureEvent,
} from '@/lib/posthog';
import {
  trackPropertyViewed,
  trackSearchPerformed,
  trackContactAgentClicked,
} from '@/lib/analytics';

/**
 * Format active seconds into child-friendly strings like "2m 15s" or "45s"
 */
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

/**
 * Format relative time ("2m ago", "Just now")
 */
function formatTimeAgo(isoString) {
  if (!isoString) return 'Just now';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 30) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

/**
 * Export array of objects to standard CSV file download
 */
function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) =>
        keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : String(row[k]);
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator)
      )
      .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export object to clean JSON file download
 */
function exportToJSON(filename, data) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AnalyticsDashboard() {
  // Date filter: 'today' | '7d' | '30d' | 'custom'
  const [selectedRange, setSelectedRange] = useState('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Analytics states
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const [localEvents, setLocalEvents] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [actionFeedback, setActionFeedback] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // PostHog EU Verified Web App Links
  const posthogLinks = useMemo(() => getPostHogAppLinks(), []);

  // Fetch server analytics
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setActionFeedback('');
    try {
      const params = new URLSearchParams({ range: selectedRange });
      if (selectedRange === 'custom' && customStart && customEnd) {
        params.set('startDate', customStart);
        params.set('endDate', customEnd);
      }

      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setApiData(data);
      }
    } catch (err) {
      console.warn('[Analytics Dashboard] Error fetching API data:', err);
    } finally {
      setLocalEvents(getRecentLocalEvents());
      setLastRefreshed(new Date());
      setLoading(false);
    }
  }, [selectedRange, customStart, customEnd]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Listen for real-time live events emitted in this browser session
  useEffect(() => {
    const handleLiveEvent = () => {
      setLocalEvents(getRecentLocalEvents());
    };
    window.addEventListener('dwarkesh_analytics_updated', handleLiveEvent);
    return () => window.removeEventListener('dwarkesh_analytics_updated', handleLiveEvent);
  }, []);

  // Combine PostHog API data with live browser session events
  const analytics = useMemo(() => {
    // If backend HogQL returned real traffic data, use it!
    if (apiData?.hasData) {
      return {
        hasData: true,
        source: 'posthog_cloud',
        overview: apiData.overview,
        popularProperties: apiData.popularProperties || [],
        categories: apiData.categories || [],
        locations: apiData.locations || [],
        searchTerms: apiData.searchTerms || [],
        funnel: apiData.funnel || { home: 0, search: 0, property: 0, contact: 0 },
        retention: apiData.retention || {
          returningVisitors: 0,
          newVisitors: apiData.overview?.visitors || 0,
          returningRatePct: apiData.overview?.returningRatePct || 0,
          repeatPropViewers: 0,
          conversionRatePct: apiData.overview?.conversionRatePct || 0,
        },
        persona: apiData.persona || {
          totalVisitors: apiData.overview?.visitors || 0,
          anonymousVisitors: apiData.overview?.visitors || 0,
          authenticatedVisitors: 0,
          anonymousPct: 100,
          authenticatedPct: 0,
        },
        devices: apiData.devices || [],
        priceRanges: apiData.priceRanges || [],
        needsAttention: apiData.needsAttention || [],
        recentEvents: apiData.recentEvents || [],
      };
    }

    // If PostHog API has no data yet or personal key is pending, compute from live local session events
    if (localEvents.length > 0) {
      const propertyViews = localEvents.filter((e) => e.event === 'property_viewed');
      const enquiries = localEvents.filter((e) =>
        ['contact_agent_clicked', 'phone_number_clicked', 'whatsapp_clicked', 'visit_booking_completed'].includes(e.event)
      );
      const engagementEvents = localEvents.filter((e) => e.event === 'property_engagement');
      const searches = localEvents.filter((e) => e.event === 'search_performed');

      // Unique visitors (by distinct device / session)
      const visitorsCount = Math.max(1, new Set(localEvents.map((e) => e.id?.split('_')[0] || '1')).size);

      // Average active seconds
      const totalActiveSec = engagementEvents.reduce(
        (acc, e) => acc + (Number(e.properties?.active_seconds) || 0),
        0
      );
      const avgActiveSec = engagementEvents.length > 0 ? Math.round(totalActiveSec / engagementEvents.length) : 0;

      // Group properties
      const propMap = {};
      propertyViews.forEach((e) => {
        const title = e.properties?.property_title || 'Untitled Property';
        if (!propMap[title]) {
          propMap[title] = {
            title,
            id: e.properties?.property_id,
            category: e.properties?.category_name || 'General',
            views: 0,
            activeSeconds: 0,
            enquiries: 0,
          };
        }
        propMap[title].views += 1;
      });

      engagementEvents.forEach((e) => {
        const title = e.properties?.property_title;
        if (title && propMap[title]) {
          propMap[title].activeSeconds += Number(e.properties?.active_seconds) || 0;
        }
      });

      enquiries.forEach((e) => {
        const title = e.properties?.property_title;
        if (title && propMap[title]) {
          propMap[title].enquiries += 1;
        }
      });

      const popularProperties = Object.values(propMap).sort((a, b) => b.views - a.views);

      // Categories
      const catMap = {};
      localEvents
        .filter((e) => ['category_viewed', 'property_viewed'].includes(e.event))
        .forEach((e) => {
          const cat = e.properties?.category_name;
          if (cat) catMap[cat] = (catMap[cat] || 0) + 1;
        });

      const categories = Object.entries(catMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Locations
      const locMap = {};
      propertyViews.forEach((e) => {
        const loc = e.properties?.city || e.properties?.location;
        if (loc) locMap[loc] = (locMap[loc] || 0) + 1;
      });
      const locations = Object.entries(locMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Searches
      const searchTerms = searches
        .map((e) => ({
          query: e.properties?.search_query || e.properties?.city_filter || 'All Plots',
          count: 1,
        }))
        .filter((s) => Boolean(s.query));

      // Funnel
      const funnel = {
        home: localEvents.filter((e) => e.event === '$pageview').length,
        search: searches.length,
        property: propertyViews.length,
        contact: enquiries.length,
      };

      // Retention from session events
      const sessions = {};
      localEvents.forEach((e) => {
        const sid = e.properties?.distinct_id || e.id?.split('_')[0] || 'usr_1';
        if (!sessions[sid]) {
          sessions[sid] = { totalEvents: 0, propViews: new Set() };
        }
        sessions[sid].totalEvents += 1;
        if (e.event === 'property_viewed' && e.properties?.property_title) {
          sessions[sid].propViews.add(e.properties.property_title);
        }
      });
      const sIds = Object.keys(sessions);
      const returningVisitors = sIds.filter((id) => sessions[id].totalEvents > 2).length;
      const repeatPropViewers = sIds.filter((id) => sessions[id].propViews.size > 1).length;
      const returningRatePct = visitorsCount > 0 ? Math.round((returningVisitors / visitorsCount) * 100) : 0;
      const conversionRatePct = visitorsCount > 0 ? Math.round((enquiries.length / visitorsCount) * 100) : 0;

      const retention = {
        returningVisitors,
        newVisitors: Math.max(0, visitorsCount - returningVisitors),
        returningRatePct,
        repeatPropViewers,
        conversionRatePct,
      };

      // Devices
      const devMap = {};
      localEvents.forEach((e) => {
        const d = e.properties?.$device_type || (typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile' : 'Desktop');
        const dName = String(d).charAt(0).toUpperCase() + String(d).slice(1);
        devMap[dName] = (devMap[dName] || 0) + 1;
      });
      const devices = Object.entries(devMap).map(([name, count]) => ({ name, count }));

      // Price Ranges
      const priceMap = {};
      propertyViews.forEach((e) => {
        let bracket = e.properties?.price_range;
        if (!bracket && e.properties?.property_id) {
          const match = allProperties.find((p) => String(p.id) === String(e.properties.property_id));
          if (match?.price) {
            bracket =
              match.price < 5000000
                ? 'Under ₹50L'
                : match.price < 10000000
                ? '₹50L - ₹1Cr'
                : match.price < 20000000
                ? '₹1Cr - ₹2Cr'
                : 'Above ₹2Cr';
          }
        }
        if (bracket) {
          priceMap[bracket] = (priceMap[bracket] || 0) + 1;
        }
      });
      const priceRanges = Object.entries(priceMap)
        .map(([bracket, views]) => ({ bracket, views }))
        .sort((a, b) => b.views - a.views);

      const needsAttention = popularProperties.filter((p) => p.views >= 2 && p.enquiries === 0);

      const recentEvents = localEvents.slice(0, 20).map((e, idx) => ({
        id: e.id || `loc_${idx}`,
        event: e.event,
        timestamp: e.timestamp,
        title: e.properties?.property_title || '',
        searchQuery: e.properties?.search_query || '',
        path: e.properties?.page_path || '',
        visitorId: 'live_user',
      }));

      const authVisitors = new Set(
        localEvents
          .filter((e) => e.properties?.user_status === 'authenticated' || e.properties?.is_anonymous === false)
          .map((e) => e.visitorId)
      ).size;
      const anonVisitors = Math.max(0, visitorsCount - authVisitors);
      const anonPct = visitorsCount > 0 ? Math.round((anonVisitors / visitorsCount) * 100) : 100;
      const persona = {
        totalVisitors: visitorsCount,
        anonymousVisitors: anonVisitors,
        authenticatedVisitors: authVisitors,
        anonymousPct: anonPct,
        authenticatedPct: Math.max(0, 100 - anonPct),
      };

      return {
        hasData: true,
        source: 'live_session',
        overview: {
          visitors: visitorsCount,
          propertyViews: propertyViews.length,
          avgActiveSeconds: avgActiveSec,
          enquiries: enquiries.length,
          returningRatePct,
          conversionRatePct,
        },
        popularProperties,
        categories,
        locations,
        searchTerms,
        funnel,
        retention,
        persona,
        devices,
        priceRanges,
        needsAttention,
        recentEvents,
      };
    }

    // No data yet
    return {
      hasData: false,
      source: 'none',
      overview: { visitors: 0, propertyViews: 0, avgActiveSeconds: 0, enquiries: 0, returningRatePct: 0, conversionRatePct: 0 },
      popularProperties: [],
      categories: [],
      locations: [],
      searchTerms: [],
      funnel: { home: 0, search: 0, property: 0, contact: 0 },
      retention: {
        returningVisitors: 0,
        newVisitors: 0,
        returningRatePct: 0,
        repeatPropViewers: 0,
        conversionRatePct: 0,
      },
      persona: {
        totalVisitors: 0,
        anonymousVisitors: 0,
        authenticatedVisitors: 0,
        anonymousPct: 100,
        authenticatedPct: 0,
      },
      devices: [],
      priceRanges: [],
      needsAttention: [],
      recentEvents: [],
    };
  }, [apiData, localEvents]);

  // Helper to match property with actual image from database
  const getPropertyThumbnail = (title, id) => {
    const match = allProperties.find(
      (p) => String(p.id) === String(id) || p.title.toLowerCase() === (title || '').toLowerCase()
    );
    return match?.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';
  };

  const getPropertySlug = (title, id) => {
    const match = allProperties.find(
      (p) => String(p.id) === String(id) || p.title.toLowerCase() === (title || '').toLowerCase()
    );
    return match?.slug || match?.id || '1';
  };

  // Human-readable summary sentences based on actual data
  const dynamicStory = useMemo(() => {
    if (!analytics.hasData) return null;
    const topProp = analytics.popularProperties[0];
    const topCat = analytics.categories[0];
    const topLoc = analytics.locations[0];

    return {
      overview: `${analytics.overview.visitors.toLocaleString()} ${
        analytics.overview.visitors === 1 ? 'person' : 'people'
      } explored properties ${selectedRange === 'today' ? 'today' : selectedRange === '30d' ? 'this month' : 'this week'}.`,
      topCategory: topCat ? `${topCat.name} is the most viewed property category.` : null,
      topProperty: topProp ? `"${topProp.title}" received the highest interest.` : null,
      topEngagement:
        topProp && topProp.activeSeconds > 0
          ? `Visitors spent an average of ${formatDuration(topProp.activeSeconds / Math.max(1, topProp.views))} actively exploring it.`
          : null,
      topLocation: topLoc ? `Most buyers are searching for homes in ${topLoc.name}.` : null,
    };
  }, [analytics, selectedRange]);

  // Handle Executive PDF Print
  const handlePrintPDF = () => {
    setShowExportMenu(false);
    window.print();
  };

  // Export Properties CSV
  const handleExportPropertiesCSV = () => {
    setShowExportMenu(false);
    const rows = analytics.popularProperties.map((p, idx) => ({
      Rank: idx + 1,
      Property_ID: p.id || '',
      Property_Title: p.title || '',
      Category: p.category || '',
      Views: p.views || 0,
      Avg_Active_Time: formatDuration(p.activeSeconds / Math.max(1, p.views)),
      Total_Enquiries: p.enquiries || 0,
      Conversion_Rate_Pct: p.views > 0 ? `${Math.round(((p.enquiries || 0) / p.views) * 100)}%` : '0%',
    }));
    if (rows.length === 0) {
      rows.push({
        Rank: 1,
        Property_ID: 'N/A',
        Property_Title: 'No properties recorded yet',
        Category: 'N/A',
        Views: 0,
        Avg_Active_Time: '0s',
        Total_Enquiries: 0,
        Conversion_Rate_Pct: '0%',
      });
    }
    exportToCSV(`dwarkesh_properties_analytics_${selectedRange}.csv`, rows);
    setActionFeedback('Exported dwarkesh_properties_analytics.csv successfully!');
  };

  // Export Visitor Activity Log CSV
  const handleExportEventsCSV = () => {
    setShowExportMenu(false);
    const rows = analytics.recentEvents.map((ev, idx) => ({
      Index: idx + 1,
      Timestamp: ev.timestamp || new Date().toISOString(),
      Event: ev.event,
      Property_Title: ev.title || '',
      Search_Query: ev.searchQuery || '',
      Page_Path: ev.path || '',
      Visitor_ID: ev.visitorId || 'anon',
    }));
    exportToCSV(`dwarkesh_visitor_activity_${selectedRange}.csv`, rows);
    setActionFeedback('Exported dwarkesh_visitor_activity.csv successfully!');
  };

  // Export Complete Analytics JSON
  const handleExportFullJSON = () => {
    setShowExportMenu(false);
    const fullDump = {
      reportTitle: 'Dwarkesh Real Estate Analytics Executive Report',
      exportedAt: new Date().toISOString(),
      timeRange: selectedRange,
      overview: analytics.overview,
      retention: analytics.retention,
      devices: analytics.devices,
      priceRanges: analytics.priceRanges,
      popularProperties: analytics.popularProperties,
      categories: analytics.categories,
      locations: analytics.locations,
      searchTerms: analytics.searchTerms,
      funnel: analytics.funnel,
      needsAttention: analytics.needsAttention,
      recentEvents: analytics.recentEvents,
    };
    exportToJSON(`dwarkesh_analytics_complete_${selectedRange}.json`, fullDump);
    setActionFeedback('Exported dwarkesh_analytics_complete.json successfully!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* PRINT-ONLY EXECUTIVE HEADER (VISIBLE ONLY WHEN PRINTING TO PDF) */}
      {/* ============================================================== */}
      <div className="print-only mb-6 border-b-2 border-stone-800 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
              DWARKESH REAL ESTATE & PLOTS
            </h1>
            <p className="text-xs uppercase font-semibold text-stone-500 tracking-wider mt-0.5">
              Executive Analytics & Performance Report
            </p>
          </div>
          <div className="text-right text-xs text-stone-600">
            <div><strong>Report Period:</strong> {selectedRange.toUpperCase()}</div>
            <div><strong>Generated:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
            <div><strong>Source:</strong> PostHog Verified Intelligence</div>
          </div>
        </div>
        {dynamicStory && (
          <div className="mt-3 bg-stone-100 p-3 rounded-xl text-xs text-stone-800 font-medium">
            <strong>Executive Summary:</strong> {dynamicStory.overview} {dynamicStory.topCategory} {dynamicStory.topProperty}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* TOP BAR: DATE FILTERS & EXPORT ACTIONS (SCREEN ONLY)           */}
      {/* ============================================================== */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-xs font-semibold text-stone-500 mr-2">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>Time Period:</span>
          </div>
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: 'Past 7 Days' },
            { id: '30d', label: 'Past 30 Days' },
            { id: 'custom', label: 'Custom Range' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setSelectedRange(pill.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedRange === pill.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/80'
              }`}
            >
              {pill.label}
            </button>
          ))}

          {selectedRange === 'custom' && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
              />
              <span className="text-xs text-stone-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
              />
              <button
                type="button"
                onClick={fetchAnalytics}
                className="px-3 py-1 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-black transition cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Action Controls, Exports & Verified PostHog Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Last Updated Timestamp */}
          {lastRefreshed && (
            <span className="text-[11px] text-stone-400 font-medium mr-1 hidden sm:inline">
              Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            title="Refresh analytics data"
            className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/80 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          {/* EXPORT PDF BUTTON (Direct Executive Print to PDF) */}
          <button
            type="button"
            onClick={handlePrintPDF}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Export clean Executive PDF Report using browser print"
          >
            <Printer className="w-3.5 h-3.5 text-amber-600" />
            <span>Export PDF</span>
          </button>

          {/* EXPORT DATA DROPDOWN (CSV & JSON) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Export analytics data as CSV or JSON"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              <span>Export Data</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-90' : ''}`} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                  Data Exports
                </div>
                <button
                  type="button"
                  onClick={handleExportPropertiesCSV}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Properties CSV (Rankings)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportEventsCSV}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Activity Log CSV (Events)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportFullJSON}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 border-t border-stone-100 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>Full Analytics JSON Dump</span>
                </button>
              </div>
            )}
          </div>

          {/* Session Replay Link */}
          <a
            href={posthogLinks.replayUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="View full visitor session screen recordings in PostHog"
          >
            <Film className="w-3.5 h-3.5 text-stone-500" />
            <span>Replays</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Live Events Stream Link */}
          <a
            href={posthogLinks.eventsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Open PostHog Live Events stream in the EU cloud"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Stream</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>

      {actionFeedback && (
        <div className="no-print bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-medium flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button
            type="button"
            onClick={() => setActionFeedback('')}
            className="text-emerald-600 hover:text-emerald-900 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* HUMAN-READABLE STORY BANNER                                    */}
      {/* ============================================================== */}
      {dynamicStory && (
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print-break-inside-avoid">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Summary in Plain Words</span>
            </div>
            <p className="text-base sm:text-lg font-serif font-bold text-stone-100">
              {dynamicStory.overview} {dynamicStory.topCategory}
            </p>
            {dynamicStory.topProperty && (
              <p className="text-xs text-stone-300">
                {dynamicStory.topProperty} {dynamicStory.topEngagement}
              </p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2 no-print">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-medium text-stone-200 border border-white/10">
              PostHog Project #{posthogLinks.projectId} (EU)
            </span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. AT A GLANCE: 4 KEY METRIC CARDS                             */}
      {/* ============================================================== */}
      <div className="print-break-inside-avoid">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            1. At a Glance
          </h2>
          <div className="text-xs text-stone-400 font-medium">
            Lead Conversion: <strong className="text-emerald-700 font-bold">{analytics.overview.conversionRatePct || 0}%</strong> · Returning: <strong className="text-stone-800 font-bold">{analytics.overview.returningRatePct || 0}%</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Visitors */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">People Visited</span>
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-serif text-stone-900">
              {analytics.hasData ? analytics.overview.visitors.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-stone-500">
              {analytics.hasData
                ? `${analytics.overview.visitors} unique visitors explored properties`
                : 'Awaiting visitors'}
            </p>
          </div>

          {/* Card 2: Property Views */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">Plot & Villa Views</span>
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-serif text-stone-900">
              {analytics.hasData ? analytics.overview.propertyViews.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-stone-500">
              {analytics.hasData
                ? `Total times property details were opened`
                : 'No plot views recorded yet'}
            </p>
          </div>

          {/* Card 3: Average Active Reading Time */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">Active Exploring Time</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-serif text-stone-900">
              {analytics.hasData ? formatDuration(analytics.overview.avgActiveSeconds) : '0s'}
            </div>
            <p className="text-xs text-stone-500">
              {analytics.hasData
                ? 'Average foreground time spent actively browsing'
                : 'Pauses when tab is idle'}
            </p>
          </div>

          {/* Card 4: Enquiries & Direct Leads */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">Buyer Enquiries</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <MessageCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-serif text-emerald-700">
              {analytics.hasData ? analytics.overview.enquiries.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-stone-500">
              {analytics.hasData
                ? `WhatsApp, phone calls, and visit requests`
                : 'High-intent lead conversions'}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. VISITOR RETENTION & LOYALTY: ARE PEOPLE COMING BACK?        */}
      {/* ============================================================== */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-5 print-break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-stone-900 text-white flex items-center justify-center">
                <Repeat className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Are people coming back? (Visitor Retention)
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Measures customer loyalty, repeat browsing sessions, and how many visitors return to evaluate multiple plots.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 text-stone-700 self-start sm:self-auto">
            {analytics.retention.returningRatePct}% Return Rate
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Retention Metric 1: Returning Visitors */}
          <div className="p-4.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Returning Visitors</span>
              <UserCheck className="w-4 h-4 text-stone-700" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
              {analytics.retention.returningVisitors}
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              <strong>{analytics.retention.returningRatePct}%</strong> of total visitors came back for more than 1 visit to compare properties.
            </p>
          </div>

          {/* Retention Metric 2: Repeat Property Viewers */}
          <div className="p-4.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Compared Multiple Plots</span>
              <Eye className="w-4 h-4 text-stone-700" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
              {analytics.retention.repeatPropViewers}
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Buyers who viewed 2 or more different listings across sessions, showing high purchase intent.
            </p>
          </div>

          {/* Retention Metric 3: Lead Conversion Rate */}
          <div className="p-4.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Lead Conversion Rate</span>
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-emerald-800">
              {analytics.retention.conversionRatePct}%
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Percentage of visitors who took action to contact your sales team via WhatsApp, Call, or booking.
            </p>
          </div>
        </div>

        {/* Visual Retention Cohort Bar */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-stone-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-900 inline-block" />
              New Explorers: {analytics.retention.newVisitors} ({100 - (analytics.retention.returningRatePct || 0)}%)
            </span>
            <span className="text-amber-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Returning Buyers: {analytics.retention.returningVisitors} ({analytics.retention.returningRatePct || 0}%)
            </span>
          </div>

          <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-stone-900 transition-all duration-500"
              style={{ width: `${Math.max(5, 100 - (analytics.retention.returningRatePct || 0))}%` }}
              title="First time visitors"
            />
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.max(0, analytics.retention.returningRatePct || 0)}%` }}
              title="Returning interested buyers"
            />
          </div>

          <p className="text-[11px] text-stone-500 italic pt-0.5">
            💡 Plain English Insight: Real estate buyers rarely make a decision on their first visit. A high return rate demonstrates that buyers are bookmarking your plots and returning to evaluate with family before calling.
          </p>

          {/* Anonymous vs Authenticated Visitor Telemetry */}
          <div className="mt-3 p-3.5 rounded-2xl bg-stone-50/90 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-stone-900">Visitor Persona:</span>
              <span className="px-2.5 py-1 rounded-full bg-stone-900 text-white font-medium text-[11px]">
                {analytics.persona?.anonymousPct ?? 100}% Anonymous Explorers ({analytics.persona?.anonymousVisitors ?? analytics.overview.visitors})
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium text-[11px]">
                {analytics.persona?.authenticatedPct ?? 0}% Authenticated ({analytics.persona?.authenticatedVisitors ?? 0})
              </span>
            </div>
            <span className="text-[11px] text-stone-500">
              🔒 Tracked via persistent first-party anonymous IDs without requiring sign-up
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. AUDIENCE & MARKET FACTORS: DEVICES & PRICE RANGE DEMAND     */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-break-inside-avoid">
        {/* Device Distribution Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-stone-700" />
                <span>Devices Used by Visitors</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Are your buyers browsing from mobile phones or desktop computers?
              </p>
            </div>
          </div>

          {analytics.devices.length > 0 ? (
            <div className="space-y-3.5">
              {analytics.devices.map((dev, i) => {
                const totalDev = analytics.devices.reduce((acc, d) => acc + d.count, 0) || 1;
                const pct = Math.round((dev.count / totalDev) * 100);
                const isMobile = dev.name.toLowerCase().includes('mobile');

                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2">
                        {isMobile ? (
                          <Smartphone className="w-3.5 h-3.5 text-stone-600" />
                        ) : (
                          <Monitor className="w-3.5 h-3.5 text-stone-600" />
                        )}
                        <span className="text-stone-800 font-semibold">{dev.name}</span>
                      </div>
                      <span className="text-stone-500">{dev.count} visits ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMobile ? 'bg-amber-500' : 'bg-stone-900'
                        }`}
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">No device telemetry recorded yet.</p>
          )}

          <p className="text-[11px] text-stone-500 pt-1 border-t border-stone-100">
            📱 Over 70% of real estate enquiries originate from mobile phones via quick WhatsApp or one-tap call buttons.
          </p>
        </div>

        {/* Price Range Demand Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>Price Range Demand</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Which budget brackets are attracting the highest buyer views?
              </p>
            </div>
          </div>

          {analytics.priceRanges.length > 0 ? (
            <div className="space-y-3.5">
              {analytics.priceRanges.map((pr, i) => {
                const maxViews = Math.max(1, analytics.priceRanges[0]?.views || 1);
                const pct = Math.round((pr.views / maxViews) * 100);

                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-stone-800 font-semibold">{pr.bracket}</span>
                      <span className="text-stone-500">{pr.views} views</span>
                    </div>
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">No price range views recorded yet.</p>
          )}

          <p className="text-[11px] text-stone-500 pt-1 border-t border-stone-100">
            🏷️ Focus marketing campaigns on your most viewed budget bracket to maximize lead conversions.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ZERO DATA / AWAITING TRAFFIC STATE (SCREEN ONLY)               */}
      {/* ============================================================== */}
      {!analytics.hasData && (
        <div className="no-print bg-stone-50/80 border border-dashed border-stone-300 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mx-auto text-stone-400 shadow-xs">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900">
            No Visitor Traffic Recorded for this Period Yet
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            Your website is connected to PostHog EU (<code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">eu.i.posthog.com</code>).
            As visitors browse your plots, stats will appear here automatically. You can also simulate an event below to test live!
          </p>

          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                const sample = allProperties[0];
                trackPropertyViewed(sample);
                setActionFeedback(`Dispatched property_viewed for "${sample.title}" to PostHog!`);
              }}
              className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
            >
              Simulate 1 Property View
            </button>
            <button
              type="button"
              onClick={() => {
                const sample = allProperties[0];
                trackContactAgentClicked(sample, 'whatsapp');
                setActionFeedback(`Dispatched WhatsApp enquiry for "${sample.title}" to PostHog!`);
              }}
              className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Simulate 1 Enquiry
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. WHICH PLOTS ARE MOST POPULAR? (TOP PROPERTIES WITH THUMBS) */}
      {/* ============================================================== */}
      {analytics.hasData && analytics.popularProperties.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4 print-break-inside-avoid">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Which plots are most popular?
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Top properties ranked by visitor views and active exploration time.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportPropertiesCSV}
                className="no-print text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                title="Download this ranking table as CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
              <span className="text-xs font-semibold text-stone-400">
                Showing top {analytics.popularProperties.length} listings
              </span>
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {analytics.popularProperties.map((prop, idx) => {
              const thumb = getPropertyThumbnail(prop.title, prop.id);
              const slug = getPropertySlug(prop.title, prop.id);

              return (
                <div
                  key={prop.id || idx}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 rounded-2xl px-2 transition"
                >
                  {/* Property Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="w-6 text-xs font-bold text-stone-400 font-mono text-center">
                      #{idx + 1}
                    </span>

                    <div className="relative w-14 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200/80">
                      <Image
                        src={thumb}
                        alt={prop.title}
                        fill
                        className="object-cover"
                        sizes="60px"
                      />
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={`/property/${slug}`}
                        target="_blank"
                        className="text-xs sm:text-sm font-bold text-stone-900 hover:text-stone-700 truncate block hover:underline"
                      >
                        {prop.title}
                      </Link>
                      <span className="text-[11px] text-stone-500 truncate block">
                        {prop.category}
                      </span>
                    </div>
                  </div>

                  {/* Property Stats */}
                  <div className="flex items-center gap-5 sm:gap-8 justify-between sm:justify-end shrink-0 pl-9 sm:pl-0">
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-bold text-stone-900">
                        {prop.views.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-stone-400 font-medium">views</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-bold text-stone-900">
                        {formatDuration(prop.activeSeconds / Math.max(1, prop.views))}
                      </div>
                      <div className="text-[10px] text-stone-400 font-medium">avg active time</div>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          prop.enquiries > 0
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {prop.enquiries} {prop.enquiries === 1 ? 'call' : 'enquiries'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. WHAT BUYERS LIKE & WHERE VISITORS SEARCH                    */}
      {/* ============================================================== */}
      {analytics.hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-break-inside-avoid">
          {/* Categories Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-stone-700" />
                <span>What types of properties do buyers like?</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Property categories ranked by visitor demand.
              </p>
            </div>

            {analytics.categories.length > 0 ? (
              <div className="space-y-3">
                {analytics.categories.map((cat, i) => {
                  const maxCount = Math.max(1, analytics.categories[0]?.count || 1);
                  const pct = Math.round((cat.count / maxCount) * 100);

                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-stone-800 font-semibold">{cat.name}</span>
                        <span className="text-stone-500">{cat.count} views</span>
                      </div>
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-stone-900 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(8, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">No category views recorded yet.</p>
            )}
          </div>

          {/* Locations Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-stone-700" />
                <span>Where are visitors searching?</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Top locations and cities people are looking into.
              </p>
            </div>

            {analytics.locations.length > 0 ? (
              <div className="space-y-3">
                {analytics.locations.map((loc, i) => {
                  const maxCount = Math.max(1, analytics.locations[0]?.count || 1);
                  const pct = Math.round((loc.count / maxCount) * 100);

                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-stone-800 font-semibold">{loc.name}</span>
                        <span className="text-stone-500">{loc.count} searches</span>
                      </div>
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(8, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">No location searches recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. VISITOR JOURNEY: HOME -> SEARCH -> PROPERTY -> CONTACT       */}
      {/* ============================================================== */}
      {analytics.hasData && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4 print-break-inside-avoid">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-stone-700" />
              <span>How do visitors become buyer leads?</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              The step-by-step journey from visiting the website to contacting your team.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Step 1: Home */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Step 1: Website Visit
              </div>
              <div className="text-2xl font-bold font-serif text-stone-900">
                {analytics.funnel.home || analytics.overview.visitors}
              </div>
              <p className="text-xs text-stone-500">Arrived on home page</p>
            </div>

            {/* Step 2: Search */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Step 2: Explored Plots
              </div>
              <div className="text-2xl font-bold font-serif text-stone-900">
                {analytics.funnel.search || analytics.popularProperties.length}
              </div>
              <p className="text-xs text-stone-500">Searched or filtered listings</p>
            </div>

            {/* Step 3: Viewed Details */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Step 3: Property Details
              </div>
              <div className="text-2xl font-bold font-serif text-stone-900">
                {analytics.funnel.property || analytics.overview.propertyViews}
              </div>
              <p className="text-xs text-stone-500">Read photos, specs, and price</p>
            </div>

            {/* Step 4: Contact */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Step 4: Contact / Lead
              </div>
              <div className="text-2xl font-bold font-serif text-emerald-800">
                {analytics.funnel.contact || analytics.overview.enquiries}
              </div>
              <p className="text-xs text-emerald-700 font-medium">Called, WhatsApped, or booked</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. WHAT NEEDS ATTENTION? (HIGH VIEWS BUT LOW ENQUIRIES)        */}
      {/* ============================================================== */}
      {analytics.hasData && analytics.needsAttention.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/90 p-5 sm:p-6 rounded-3xl space-y-3 print-break-inside-avoid">
          <div className="flex items-center gap-2 text-amber-800 font-serif text-base font-bold">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Which properties need your attention?</span>
          </div>
          <p className="text-xs text-amber-900/80 leading-relaxed">
            These properties received many views from buyers, but few people clicked to contact the agent.
            Updating their price clarity or adding virtual tours can increase enquiries:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {analytics.needsAttention.map((p, idx) => (
              <div
                key={idx}
                className="bg-white p-3.5 rounded-2xl border border-amber-200 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-stone-900">{p.title}</div>
                  <div className="text-[11px] text-stone-500">
                    {p.views} views · 0 enquiries
                  </div>
                </div>
                <Link
                  href={`/property/${getPropertySlug(p.title, p.id)}`}
                  target="_blank"
                  className="text-xs font-semibold text-stone-900 hover:underline flex items-center gap-1"
                >
                  <span>Review Plot</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. RECENT VISITOR ACTIVITY FEED & EXPORT                       */}
      {/* ============================================================== */}
      {analytics.hasData && analytics.recentEvents.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3 print-break-inside-avoid">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900">
                Recent Visitor Activity
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Anonymized browsing events captured across the website.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportEventsCSV}
                className="no-print text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer mr-2"
                title="Download activity log as CSV"
              >
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>Export Log CSV</span>
              </button>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Live Stream
              </span>
            </div>
          </div>

          <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto">
            {analytics.recentEvents.map((ev, i) => (
              <div key={ev.id || i} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
                  <span className="text-stone-800 truncate">
                    {ev.event === 'property_viewed' && (
                      <>
                        Visitor viewed <strong className="font-semibold text-stone-900">{ev.title || 'a property'}</strong>
                      </>
                    )}
                    {ev.event === 'search_performed' && (
                      <>
                        Visitor searched for <strong className="font-semibold text-stone-900">&quot;{ev.searchQuery || 'plots'}&quot;</strong>
                      </>
                    )}
                    {ev.event === 'contact_agent_clicked' && (
                      <span className="text-emerald-700 font-bold">
                        Visitor clicked &quot;Contact Agent&quot; for {ev.title}
                      </span>
                    )}
                    {ev.event === 'whatsapp_clicked' && (
                      <span className="text-emerald-700 font-bold">
                        Visitor initiated WhatsApp chat for {ev.title}
                      </span>
                    )}
                    {ev.event === '$pageview' && (
                      <>
                        Visitor opened page <span className="font-mono text-[11px] text-stone-500">{ev.path || '/'}</span>
                      </>
                    )}
                    {!['property_viewed', 'search_performed', 'contact_agent_clicked', 'whatsapp_clicked', '$pageview'].includes(ev.event) && (
                      <span>Activity: {ev.event}</span>
                    )}
                  </span>
                </div>
                <span className="text-[11px] text-stone-400 shrink-0 font-medium">
                  {formatTimeAgo(ev.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* GLOBAL PRINT STYLES FOR CRISP EXECUTIVE PDF EXPORTS            */}
      {/* ============================================================== */}
      <style jsx global>{`
        @media print {
          .no-print,
          nav,
          header,
          footer,
          aside,
          button,
          input,
          [role="navigation"] {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body,
          main {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          a {
            text-decoration: none !important;
            color: inherit !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
