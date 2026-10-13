'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users,
  Eye,
  Clock,
  MessageCircle,
  TrendingUp,
  MapPin,
  Building2,
  RefreshCw,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  ChevronRight,
  Flame,
  Search,
  Smartphone,
  Monitor,
  Copy,
  Check,
  X,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { properties as allProperties } from '@/data/properties';
import { getRecentLocalEvents } from '@/lib/posthog';

/**
 * Format active seconds into readable strings like "2m 15s" or "45s"
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

  // Active view tab: 'heatmap' | 'locations' | 'funnel' | 'users'
  const [activeAnalysisView, setActiveAnalysisView] = useState('heatmap');

  // Users & Telemetry Inspection States
  const [mounted, setMounted] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [userFilter, setUserFilter] = useState('all'); // 'all' | 'desktop' | 'mobile' | 'leads'
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [copiedIp, setCopiedIp] = useState(null);

  // Mount effect for SSR/Client Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (showUsersModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showUsersModal]);

  // Analytics states
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const [localEvents, setLocalEvents] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [actionFeedback, setActionFeedback] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Copy IP address with visual feedback
  const handleCopyIp = (ip) => {
    if (!ip) return;
    const cleanIp = ip.split(' ')[0];
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cleanIp);
      setCopiedIp(ip);
      setTimeout(() => setCopiedIp(null), 2000);
    }
  };

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowUsersModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Extract users list from API
  const usersList = useMemo(() => {
    return apiData?.users || [];
  }, [apiData?.users]);

  // Filtered users for search & device tabs
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (userFilter === 'desktop' && u.deviceType?.toLowerCase() !== 'desktop') return false;
      if (userFilter === 'mobile' && u.deviceType?.toLowerCase() !== 'mobile') return false;
      if (userFilter === 'leads' && (!u.enquiries || u.enquiries <= 0)) return false;

      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase().trim();
        const matchIp = (u.ip || '').toLowerCase().includes(q);
        const matchId = (u.id || '').toLowerCase().includes(q);
        const matchCity = (u.city || '').toLowerCase().includes(q);
        const matchCountry = (u.country || '').toLowerCase().includes(q);
        const matchOs = (u.os || '').toLowerCase().includes(q);
        const matchBrowser = (u.browser || '').toLowerCase().includes(q);
        const matchProp = (u.topProperty || '').toLowerCase().includes(q);
        const matchStatus = (u.status || '').toLowerCase().includes(q);
        return matchIp || matchId || matchCity || matchCountry || matchOs || matchBrowser || matchProp || matchStatus;
      }
      return true;
    });
  }, [usersList, userFilter, userSearchQuery]);

  // Combine PostHog API data with live browser session events
  const analytics = useMemo(() => {
    // 1. If backend API returned real traffic data, use it
    if (apiData?.hasData) {
      return {
        hasData: true,
        overview: apiData.overview,
        popularProperties: apiData.popularProperties || [],
        categories: apiData.categories || [],
        locations: apiData.locations || [],
        searchTerms: apiData.searchTerms || [],
        funnel: apiData.funnel || { home: 0, search: 0, property: 0, contact: 0 },
        devices: apiData.devices || [],
        recentEvents: apiData.recentEvents || [],
      };
    }

    // 2. If live local session events exist, compute from them
    if (localEvents.length > 0) {
      const propertyViews = localEvents.filter((e) => e.event === 'property_viewed');
      const enquiries = localEvents.filter((e) =>
        ['contact_agent_clicked', 'phone_number_clicked', 'whatsapp_clicked', 'visit_booking_completed'].includes(e.event)
      );
      const engagementEvents = localEvents.filter((e) => e.event === 'property_engagement');
      const searches = localEvents.filter((e) => e.event === 'search_performed');

      const visitorsCount = Math.max(1, new Set(localEvents.map((e) => e.id?.split('_')[0] || '1')).size);

      const totalActiveSec = engagementEvents.reduce(
        (acc, e) => acc + (Number(e.properties?.active_seconds) || 0),
        0
      );
      const avgActiveSec = engagementEvents.length > 0 ? Math.round(totalActiveSec / engagementEvents.length) : 0;

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

      const locMap = {};
      propertyViews.forEach((e) => {
        const loc = e.properties?.city || e.properties?.location;
        if (loc) locMap[loc] = (locMap[loc] || 0) + 1;
      });
      const locations = Object.entries(locMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const funnel = {
        home: localEvents.filter((e) => e.event === '$pageview').length || visitorsCount,
        search: searches.length || Math.round(visitorsCount * 0.7),
        property: propertyViews.length || Math.round(visitorsCount * 0.5),
        contact: enquiries.length,
      };

      const devMap = {};
      localEvents.forEach((e) => {
        const d = e.properties?.$device_type || (typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile' : 'Desktop');
        const dName = String(d).charAt(0).toUpperCase() + String(d).slice(1);
        devMap[dName] = (devMap[dName] || 0) + 1;
      });
      const devices = Object.entries(devMap).map(([name, count]) => ({ name, count }));

      const recentEvents = localEvents.slice(0, 25).map((e, idx) => ({
        id: e.id || `ev_${idx}`,
        event: e.event,
        timestamp: e.timestamp,
        title: e.properties?.property_title || '',
        searchQuery: e.properties?.search_query || '',
        path: e.properties?.page_path || '',
        visitorId: 'User',
      }));

      const conversionRatePct = visitorsCount > 0 ? Math.round((enquiries.length / visitorsCount) * 100) : 0;

      return {
        hasData: true,
        overview: {
          visitors: visitorsCount,
          propertyViews: propertyViews.length,
          avgActiveSeconds: avgActiveSec,
          enquiries: enquiries.length,
          conversionRatePct,
        },
        popularProperties,
        locations,
        funnel,
        devices,
        recentEvents,
      };
    }

    // 3. Fallback baseline if no events have occurred yet
    return {
      hasData: false,
      overview: {
        visitors: 0,
        propertyViews: 0,
        avgActiveSeconds: 0,
        enquiries: 0,
        conversionRatePct: 0,
      },
      popularProperties: [],
      locations: [],
      funnel: { home: 0, search: 0, property: 0, contact: 0 },
      devices: [],
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

  // Compute Native Property Interest Heatmap for All Listings
  const heatmapProperties = useMemo(() => {
    const map = new Map();

    // Initialize all properties from current portfolio
    allProperties.forEach((p) => {
      map.set(p.title.toLowerCase(), {
        id: p.id,
        title: p.title,
        location: p.location,
        city: p.city,
        type: p.type,
        price: p.price,
        image: p.image,
        slug: p.slug || p.id,
        views: 0,
        activeSeconds: 0,
        enquiries: 0,
      });
    });

    // Merge in analytics data
    (analytics.popularProperties || []).forEach((ap) => {
      const key = (ap.title || '').toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.views += ap.views || 0;
        existing.activeSeconds += ap.activeSeconds || 0;
        existing.enquiries += ap.enquiries || 0;
      } else {
        map.set(key, {
          id: ap.id,
          title: ap.title,
          location: '',
          city: '',
          type: ap.category || 'Luxury Residence',
          price: '',
          image: getPropertyThumbnail(ap.title, ap.id),
          slug: getPropertySlug(ap.title, ap.id),
          views: ap.views || 0,
          activeSeconds: ap.activeSeconds || 0,
          enquiries: ap.enquiries || 0,
        });
      }
    });

    const list = Array.from(map.values());
    const maxViews = Math.max(1, ...list.map((p) => p.views));

    return list
      .map((p) => {
        // Calculate heat intensity score (0 to 100) based on views and high-intent inquiry conversions
        const heatScore = Math.min(
          100,
          Math.round((p.views / maxViews) * 65 + (p.enquiries > 0 ? Math.min(35, p.enquiries * 20) : 0))
        );

        let heatLevel = 'Cool';
        let badgeStyle = 'bg-stone-100 text-stone-600 border-stone-200';
        let barColor = 'bg-stone-400';

        if (heatScore >= 65 || p.enquiries >= 2) {
          heatLevel = 'High Demand';
          badgeStyle = 'bg-stone-900 text-white border-stone-900 shadow-xs';
          barColor = 'bg-stone-900';
        } else if (heatScore >= 30 || p.views >= 2) {
          heatLevel = 'Active Interest';
          badgeStyle = 'bg-stone-200 text-stone-900 border-stone-300';
          barColor = 'bg-stone-700';
        }

        return {
          ...p,
          heatScore,
          heatLevel,
          badgeStyle,
          barColor,
          conversionRate: p.views > 0 ? Math.round((p.enquiries / p.views) * 100) : 0,
        };
      })
      .sort((a, b) => b.heatScore - a.heatScore || b.views - a.views);
  }, [analytics.popularProperties]);

  // Aggregate Location Demand
  const locationDemand = useMemo(() => {
    const locMap = {};
    heatmapProperties.forEach((p) => {
      const loc = p.city || p.location?.split(',')?.[1]?.trim() || 'NCR';
      if (!locMap[loc]) locMap[loc] = { name: loc, views: 0, enquiries: 0, listings: 0 };
      locMap[loc].views += p.views;
      locMap[loc].enquiries += p.enquiries;
      locMap[loc].listings += 1;
    });

    const result = Object.values(locMap).sort((a, b) => b.views - a.views);
    const maxLocViews = Math.max(1, ...result.map((l) => l.views));

    return result.map((l) => ({
      ...l,
      pct: Math.round((l.views / maxLocViews) * 100),
    }));
  }, [heatmapProperties]);

  // Handle Executive PDF Print
  const handlePrintPDF = () => {
    setShowExportMenu(false);
    window.print();
  };

  // Export Properties CSV
  const handleExportPropertiesCSV = () => {
    setShowExportMenu(false);
    const rows = heatmapProperties.map((p, idx) => ({
      Rank: idx + 1,
      Property_Title: p.title || '',
      Location: p.location || '',
      Views: p.views || 0,
      Avg_Active_Time: formatDuration(p.activeSeconds / Math.max(1, p.views)),
      Enquiries: p.enquiries || 0,
      Heat_Index: `${p.heatScore}%`,
      Heat_Status: p.heatLevel,
      Conversion_Rate: `${p.conversionRate}%`,
    }));
    exportToCSV(`properties_analytics_${selectedRange}.csv`, rows);
    setActionFeedback('Exported properties_analytics.csv successfully');
  };

  // Export Activity Log CSV
  const handleExportEventsCSV = () => {
    setShowExportMenu(false);
    const rows = analytics.recentEvents.map((ev, idx) => ({
      Index: idx + 1,
      Timestamp: ev.timestamp || new Date().toISOString(),
      Event: ev.event,
      Property_Title: ev.title || '',
      Search_Query: ev.searchQuery || '',
      Page_Path: ev.path || '',
    }));
    exportToCSV(`visitor_activity_${selectedRange}.csv`, rows);
    setActionFeedback('Exported visitor_activity.csv successfully');
  };

  // Export Users Telemetry CSV
  const handleExportUsersCSV = () => {
    setShowExportMenu(false);
    const rows = filteredUsers.map((u, idx) => ({
      Index: idx + 1,
      Visitor_ID: u.id,
      IP_Address: u.ip,
      Device_Type: u.deviceType,
      Operating_System: u.os,
      Browser: u.browser,
      Location: `${u.city || ''}, ${u.country || ''}`,
      Property_Views: u.views || 0,
      Direct_Enquiries: u.enquiries || 0,
      Top_Property: u.topProperty || '',
      Action_Taken: u.actionTaken || '',
      Last_Active: u.lastSeen,
      Status: u.status || '',
    }));
    exportToCSV(`users_telemetry_${selectedRange}.csv`, rows);
    setActionFeedback('Exported users_telemetry.csv successfully');
  };

  // Export Complete Analytics JSON
  const handleExportFullJSON = () => {
    setShowExportMenu(false);
    const fullDump = {
      reportTitle: 'CharDiwari Analytics Executive Report',
      exportedAt: new Date().toISOString(),
      timeRange: selectedRange,
      overview: analytics.overview,
      properties: heatmapProperties,
      locations: locationDemand,
      funnel: analytics.funnel,
      users: usersList,
    };
    exportToJSON(`analytics_report_${selectedRange}.json`, fullDump);
    setActionFeedback('Exported analytics_report.json successfully');
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans text-stone-900 pb-16">
      {/* ============================================================== */}
      {/* TOP CONTROLS & TIME RANGE FILTER                               */}
      {/* ============================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-stone-500 mr-1 hidden sm:inline">
            Time Period:
          </span>

          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: 'Past 7 Days' },
            { id: '30d', label: 'Past 30 Days' },
            { id: 'custom', label: 'Custom Range' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setSelectedRange(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                selectedRange === btn.id
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {btn.label}
            </button>
          ))}

          {selectedRange === 'custom' && (
            <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
              />
              <span className="text-xs text-stone-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
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

        {/* Action Controls & Clean Exports */}
        <div className="flex items-center gap-2 flex-wrap">
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
            className="p-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-stone-900' : ''}`} />
          </button>

          {/* Export PDF */}
          <button
            type="button"
            onClick={handlePrintPDF}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Export clean report to PDF"
          >
            <Printer className="w-3.5 h-3.5 text-stone-700" />
            <span>Export PDF</span>
          </button>

          {/* Export Data Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Download raw data"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Data</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-90' : ''}`} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 z-50 animate-fade-in">
                <button
                  type="button"
                  onClick={handleExportPropertiesCSV}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Properties CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportUsersCSV}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-stone-800" />
                  <span>Users & Telemetry CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportEventsCSV}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-stone-600" />
                  <span>Activity Log CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportFullJSON}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 border-t border-stone-100 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-stone-600" />
                  <span>Full Analytics JSON</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {actionFeedback && (
        <div className="no-print bg-stone-100 border border-stone-300 text-stone-800 px-4 py-2.5 rounded-2xl text-xs font-medium flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button
            type="button"
            onClick={() => setActionFeedback('')}
            className="text-stone-500 hover:text-stone-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. AT A GLANCE: 4 ESSENTIAL METRICS CARDS                      */}
      {/* ============================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Key Performance Overview
          </h2>
          <div className="text-xs text-stone-500 font-medium">
            Inquiry Conversion Rate:{' '}
            <strong className="text-emerald-700 font-bold">
              {analytics.overview.conversionRatePct || 0}%
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: Unique Visitors (Click to inspect users, IP addresses, desktops & devices) */}
          <button
            type="button"
            onClick={() => {
              setActiveAnalysisView('users');
              setShowUsersModal(true);
            }}
            className="w-full text-left bg-white p-5 rounded-2xl sm:rounded-3xl border border-stone-200/90 hover:border-stone-900 hover:shadow-md transition-all space-y-2 cursor-pointer group focus:outline-none"
            title="Click to view active users, IP addresses, desktops, and mobile devices"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 group-hover:text-stone-900 transition-colors flex items-center gap-1.5">
                <span>Total Visitors</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-700 group-hover:bg-stone-900 group-hover:text-white transition-all">
                  View Users ↗
                </span>
              </span>
              <div className="w-8 h-8 rounded-xl bg-stone-100 group-hover:bg-stone-900 group-hover:text-white flex items-center justify-center text-stone-700 transition-all">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 flex items-baseline gap-2">
              <span>{analytics.overview.visitors.toLocaleString()}</span>
              <span className="text-xs font-sans font-medium text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-stone-500 group-hover:text-stone-700 transition-colors">
              Click to inspect IP addresses, desktop & mobile devices
            </p>
          </button>

          {/* Card 2: Property Views */}
          <div className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Property Views</span>
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
              {analytics.overview.propertyViews.toLocaleString()}
            </div>
            <p className="text-xs text-stone-500">
              Total times property pages were inspected
            </p>
          </div>

          {/* Card 3: Avg Active Time */}
          <div className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Avg. Browsing Time</span>
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
              {formatDuration(analytics.overview.avgActiveSeconds)}
            </div>
            <p className="text-xs text-stone-500">
              Active reading & floor plan exploration time
            </p>
          </div>

          {/* Card 4: Buyer Inquiries */}
          <div className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Direct Inquiries</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <MessageCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-emerald-700">
              {analytics.overview.enquiries.toLocaleString()}
            </div>
            <p className="text-xs text-stone-500">
              WhatsApp chats, calls & private visits requested
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. IN-WEBSITE LISTING HEATMAP & DEMAND METRICS                  */}
      {/* ============================================================== */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-stone-900" />
              <span>Property Interest Heatmap</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Visual demand intensity, view count, and inquiry conversion across your portfolio.
            </p>
          </div>

          {/* Heatmap View Toggles */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveAnalysisView('heatmap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeAnalysisView === 'heatmap'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Listings Heatmap
            </button>
            <button
              type="button"
              onClick={() => setActiveAnalysisView('locations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeAnalysisView === 'locations'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Location Demand
            </button>
            <button
              type="button"
              onClick={() => setActiveAnalysisView('funnel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeAnalysisView === 'funnel'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Inquiry Funnel
            </button>
            <button
              type="button"
              onClick={() => setActiveAnalysisView('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeAnalysisView === 'users'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users & Devices ({usersList.length})</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: LISTING HEATMAP */}
        {activeAnalysisView === 'heatmap' && (
          <div className="space-y-3">
            <div className="divide-y divide-stone-100">
              {heatmapProperties.map((prop, idx) => {
                const thumb = prop.image || getPropertyThumbnail(prop.title, prop.id);
                const slug = prop.slug || getPropertySlug(prop.title, prop.id);

                return (
                  <div
                    key={prop.id || idx}
                    className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-stone-50/80 rounded-2xl px-2.5 transition"
                  >
                    {/* Property Header */}
                    <div className="flex items-center gap-3.5 min-w-0 md:max-w-xs lg:max-w-sm">
                      <span className="w-5 text-xs font-bold text-stone-400 font-mono text-center shrink-0">
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
                          className="text-xs sm:text-sm font-bold text-stone-900 hover:underline truncate block"
                        >
                          {prop.title}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 truncate">
                          {prop.location && <span>{prop.location}</span>}
                          {prop.price && <span className="font-semibold text-stone-800">{prop.price}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Visual Heat Bar & Metrics */}
                    <div className="flex items-center gap-4 sm:gap-6 justify-between md:justify-end flex-1 pl-8 md:pl-0">
                      {/* Visual Heat Indicator Bar */}
                      <div className="flex flex-col gap-1 w-28 sm:w-36">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-stone-500">Heat Level</span>
                          <span className="font-bold text-stone-900">{prop.heatScore}%</span>
                        </div>
                        <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${prop.barColor}`}
                            style={{ width: `${Math.max(6, prop.heatScore)}%` }}
                          />
                        </div>
                      </div>

                      {/* Views Count */}
                      <div className="text-right min-w-[55px]">
                        <div className="text-xs sm:text-sm font-bold text-stone-900">
                          {prop.views.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-stone-400 font-medium">views</div>
                      </div>

                      {/* Active Exploration Time */}
                      <div className="text-right min-w-[65px] hidden sm:block">
                        <div className="text-xs sm:text-sm font-bold text-stone-900">
                          {formatDuration(prop.activeSeconds / Math.max(1, prop.views))}
                        </div>
                        <div className="text-[10px] text-stone-400 font-medium">avg time</div>
                      </div>

                      {/* Inquiries & Badge */}
                      <div className="text-right min-w-[90px]">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${prop.badgeStyle}`}
                        >
                          {prop.heatLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: LOCATION DEMAND BREAKDOWN */}
        {activeAnalysisView === 'locations' && (
          <div className="space-y-4 py-1">
            <p className="text-xs text-stone-500">
              Visitor view concentration across prime cities and micro-markets:
            </p>

            <div className="space-y-3">
              {locationDemand.map((loc, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-stone-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-700" />
                      <span>{loc.name}</span>
                      <span className="text-stone-400 text-[11px]">({loc.listings} listings)</span>
                    </span>
                    <span className="text-stone-800">
                      {loc.views} views · {loc.enquiries} direct inquiries
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-900 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(6, loc.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: LEAD CONVERSION FUNNEL */}
        {activeAnalysisView === 'funnel' && (
          <div className="space-y-4 py-1">
            <p className="text-xs text-stone-500">
              The customer progression from discovery to initiating a high-intent conversation:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Step 1
                </span>
                <div className="text-xl font-bold font-serif text-stone-900">
                  {analytics.funnel.home || analytics.overview.visitors}
                </div>
                <p className="text-xs font-medium text-stone-700">Explored Website</p>
                <p className="text-[11px] text-stone-400">Arrived on home or portfolio</p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Step 2
                </span>
                <div className="text-xl font-bold font-serif text-stone-900">
                  {analytics.funnel.search || Math.round(analytics.overview.visitors * 0.75)}
                </div>
                <p className="text-xs font-medium text-stone-700">Filtered & Searched</p>
                <p className="text-[11px] text-stone-400">Selected typology, city, or price</p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Step 3
                </span>
                <div className="text-xl font-bold font-serif text-stone-900">
                  {analytics.funnel.property || analytics.overview.propertyViews}
                </div>
                <p className="text-xs font-medium text-stone-700">Viewed Property Details</p>
                <p className="text-[11px] text-stone-400">Inspected photos, specs & map</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Step 4
                </span>
                <div className="text-xl font-bold font-serif text-emerald-800">
                  {analytics.funnel.contact || analytics.overview.enquiries}
                </div>
                <p className="text-xs font-bold text-emerald-800">Lead Conversion</p>
                <p className="text-[11px] text-emerald-700">Tapped WhatsApp or phone</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: ACTIVE USERS, IP ADDRESSES & HARDWARE TELEMETRY */}
        {activeAnalysisView === 'users' && (
          <div className="space-y-4 py-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-500">
                Detailed session logs, IP addresses, hardware typology, and browsing activity:
              </p>
              <button
                type="button"
                onClick={() => setShowUsersModal(true)}
                className="text-xs font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1 cursor-pointer"
              >
                <span>Expand to Fullscreen</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <UsersTelemetryView
              users={usersList}
              filteredUsers={filteredUsers}
              userFilter={userFilter}
              setUserFilter={setUserFilter}
              userSearchQuery={userSearchQuery}
              setUserSearchQuery={setUserSearchQuery}
              copiedIp={copiedIp}
              onCopyIp={handleCopyIp}
              onExportCSV={handleExportUsersCSV}
            />
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. NATIVE LIVE VISITOR ACTIVITY STREAM (NO THIRD-PARTY REDIRECT)*/}
      {/* ============================================================== */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Website Activity Feed</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Real-time browsing actions captured live on your website.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportEventsCSV}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">Export Log</span>
            </button>
          </div>
        </div>

        {analytics.recentEvents.length > 0 ? (
          <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
            {analytics.recentEvents.map((ev, i) => (
              <div key={ev.id || i} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
                  <span className="text-stone-800 truncate">
                    {ev.event === 'property_viewed' && (
                      <>
                        Visitor inspected <strong className="font-semibold text-stone-900">{ev.title || 'a listing'}</strong>
                      </>
                    )}
                    {ev.event === 'search_performed' && (
                      <>
                        Visitor searched for <strong className="font-semibold text-stone-900">&ldquo;{ev.searchQuery || 'properties'}&rdquo;</strong>
                      </>
                    )}
                    {ev.event === 'contact_agent_clicked' && (
                      <span className="text-emerald-700 font-bold">
                        Visitor clicked &ldquo;Contact Agent&rdquo; for {ev.title}
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
        ) : (
          <div className="py-6 text-center text-xs text-stone-400">
            Awaiting visitor actions. Active browsing events will appear here in real-time.
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. MODAL DIALOG: USERS & DEVICE TELEMETRY INSPECTOR (PORTAL)   */}
      {/* ============================================================== */}
      {mounted && showUsersModal && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="no-print fixed inset-0 z-[99999] bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setShowUsersModal(false)}
        >
          <div
            className="relative bg-white w-full max-w-5xl my-auto rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 pb-4 border-b border-stone-100 flex items-start justify-between gap-4 bg-stone-50/70 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                    Visitor Telemetry & Active Sessions
                  </h3>
                </div>
                <p className="text-xs text-stone-500">
                  Inspect visitor IP addresses, desktop vs. mobile hardware, operating systems, and listings viewed.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUsersModal(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <UsersTelemetryView
                users={usersList}
                filteredUsers={filteredUsers}
                userFilter={userFilter}
                setUserFilter={setUserFilter}
                userSearchQuery={userSearchQuery}
                setUserSearchQuery={setUserSearchQuery}
                copiedIp={copiedIp}
                onCopyIp={handleCopyIp}
                onExportCSV={handleExportUsersCSV}
                isModal={true}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 px-6 border-t border-stone-100 bg-stone-50/70 flex items-center justify-between text-xs text-stone-500 shrink-0">
              <span>
                Showing <strong>{filteredUsers.length}</strong> of <strong>{usersList.length}</strong> visitors
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportUsersCSV}
                  className="px-3.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-stone-700" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUsersModal(false)}
                  className="px-4 py-1.5 bg-stone-900 hover:bg-black text-white rounded-xl font-semibold transition cursor-pointer shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Global Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print,
          nav,
          header,
          footer,
          button,
          input {
            display: none !important;
          }
          body,
          main {
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Clean, luxury Users & Device Telemetry Table / Cards View
 */
function UsersTelemetryView({
  users = [],
  filteredUsers = [],
  userFilter,
  setUserFilter,
  userSearchQuery,
  setUserSearchQuery,
  copiedIp,
  onCopyIp,
  onExportCSV,
  isModal = false,
}) {
  const desktopCount = users.filter((u) => u.deviceType?.toLowerCase() === 'desktop').length;
  const mobileCount = users.filter((u) => u.deviceType?.toLowerCase() === 'mobile').length;
  const leadsCount = users.filter((u) => (u.enquiries || 0) > 0).length;

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-50 p-3 sm:p-4 rounded-2xl border border-stone-200/80">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setUserFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              userFilter === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            All Visitors ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setUserFilter('desktop')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              userFilter === 'desktop'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop ({desktopCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setUserFilter('mobile')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              userFilter === 'mobile'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile ({mobileCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setUserFilter('leads')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              userFilter === 'leads'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>High-Intent Leads ({leadsCount})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Search IP, device, city, property..."
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
            />
            {userSearchQuery && (
              <button
                type="button"
                onClick={() => setUserSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Export Users CSV */}
          <button
            type="button"
            onClick={onExportCSV}
            className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
            title="Export filtered visitors to CSV"
          >
            <Download className="w-3.5 h-3.5 text-stone-700" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-stone-50 border border-stone-200/80 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Tracked</span>
          <div className="text-lg font-bold font-serif text-stone-900">{users.length} Visitors</div>
          <p className="text-[11px] text-stone-500">Live & historical sessions</p>
        </div>
        <div className="bg-stone-50 border border-stone-200/80 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Desktop Typology</span>
          <div className="text-lg font-bold font-serif text-stone-900 flex items-center gap-1.5">
            <Monitor className="w-4 h-4 text-stone-700" />
            <span>{desktopCount} ({users.length > 0 ? Math.round((desktopCount / users.length) * 100) : 0}%)</span>
          </div>
          <p className="text-[11px] text-stone-500">Windows & macOS users</p>
        </div>
        <div className="bg-stone-50 border border-stone-200/80 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Mobile Typology</span>
          <div className="text-lg font-bold font-serif text-stone-900 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-stone-700" />
            <span>{mobileCount} ({users.length > 0 ? Math.round((mobileCount / users.length) * 100) : 0}%)</span>
          </div>
          <p className="text-[11px] text-stone-500">iOS & Android devices</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">High-Intent Leads</span>
          <div className="text-lg font-bold font-serif text-emerald-800 flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-emerald-700" />
            <span>{leadsCount} Leads</span>
          </div>
          <p className="text-[11px] text-emerald-700">Inquiry initiated</p>
        </div>
      </div>

      {/* Users Table / List */}
      {filteredUsers.length > 0 ? (
        <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-xs">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-stone-100">
              <thead className="bg-stone-50/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Visitor / Session</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Device & Hardware</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Activity & Property</th>
                  <th className="py-3 px-4 text-right">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((u, idx) => (
                  <tr key={u.id || idx} className="hover:bg-stone-50/60 transition-colors">
                    {/* Visitor / Status */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                        <div>
                          <div className="font-mono font-bold text-stone-900 text-xs flex items-center gap-1.5">
                            <span>{u.id}</span>
                            {u.isCurrentSession && (
                              <span className="px-1.5 py-0.2 bg-stone-900 text-white text-[9px] font-sans font-bold rounded">
                                CURRENT USER
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-400 font-medium">
                            {u.status || 'Anonymous Visitor'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* IP Address */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200/80">
                          {u.ip}
                        </span>
                        <button
                          type="button"
                          onClick={() => onCopyIp(u.ip)}
                          className="p-1 rounded-md text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
                          title="Copy IP Address"
                        >
                          {copiedIp === u.ip ? (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Device & Hardware Typology */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
                          {u.deviceType?.toLowerCase() === 'mobile' ? (
                            <Smartphone className="w-3.5 h-3.5" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                            <span>{u.deviceType || 'Desktop'}</span>
                            <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 text-[10px] font-medium border border-stone-200/60">
                              {u.os}
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-400">{u.browser}</div>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-xs font-medium text-stone-800">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>{u.city || 'Delhi NCR'}</span>
                        <span className="text-stone-400 text-[10px]">({u.country || 'India'})</span>
                      </div>
                    </td>

                    {/* Browsing Behavior & Intent */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900">{u.views} views</span>
                          {u.enquiries > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {u.enquiries} Lead{u.enquiries > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {u.topProperty && (
                          <div className="text-[11px] text-stone-600 truncate" title={u.topProperty}>
                            {u.topProperty}
                          </div>
                        )}
                        {u.actionTaken && (
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            {u.actionTaken}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Last Active */}
                    <td className="py-3 px-4 text-right">
                      <div className="text-xs font-semibold text-stone-800">
                        {formatTimeAgo(u.lastSeen)}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {new Date(u.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="lg:hidden divide-y divide-stone-100 p-2 sm:p-3 space-y-3">
            {filteredUsers.map((u, idx) => (
              <div key={u.id || idx} className="p-3.5 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-2.5">
                {/* Header: User ID & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono font-bold text-stone-900 text-xs">{u.id}</span>
                    {u.isCurrentSession && (
                      <span className="px-1.5 py-0.2 bg-stone-900 text-white text-[9px] font-bold rounded">
                        CURRENT USER
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-stone-400">
                    {formatTimeAgo(u.lastSeen)}
                  </span>
                </div>

                {/* IP Address & Location */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold text-stone-900 bg-white px-2 py-0.5 rounded-lg border border-stone-200">
                      {u.ip}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCopyIp(u.ip)}
                      className="p-1 rounded bg-white border border-stone-200 text-stone-500 hover:text-stone-900 text-xs cursor-pointer"
                      title="Copy IP"
                    >
                      {copiedIp === u.ip ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-stone-600 font-medium">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>{u.city || 'Delhi NCR'}</span>
                  </div>
                </div>

                {/* Hardware Typology */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-stone-200 font-semibold text-stone-800">
                    {u.deviceType?.toLowerCase() === 'mobile' ? (
                      <Smartphone className="w-3.5 h-3.5" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5" />
                    )}
                    <span>{u.deviceType || 'Desktop'}</span>
                  </div>
                  <span className="px-2 py-1 bg-white rounded-lg border border-stone-200 text-[11px] font-medium text-stone-700">
                    {u.os}
                  </span>
                  <span className="px-2 py-1 bg-white rounded-lg border border-stone-200 text-[11px] font-medium text-stone-700">
                    {u.browser}
                  </span>
                </div>

                {/* Property & Action */}
                <div className="pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-xs">
                  <span className="text-stone-600 truncate max-w-[200px]">
                    {u.topProperty || `${u.views} property views`}
                  </span>
                  {u.actionTaken ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      {u.actionTaken}
                    </span>
                  ) : (
                    <span className="text-stone-400 text-[11px]">{u.views} views</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
          <Users className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-xs font-semibold text-stone-800">No visitors matched your search query.</p>
          <p className="text-[11px] text-stone-400">Try clearing the search filter or switching tabs.</p>
          <button
            type="button"
            onClick={() => {
              setUserSearchQuery('');
              setUserFilter('all');
            }}
            className="px-3 py-1 bg-stone-900 text-white rounded-lg text-xs font-medium cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
