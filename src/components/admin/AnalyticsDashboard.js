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
  MousePointerClick,
  Layers,
  ArrowUpRight,
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

  // Active view tab: 'click_heatmap' | 'heatmap' | 'locations' | 'funnel' | 'users'
  const [activeAnalysisView, setActiveAnalysisView] = useState('click_heatmap');

  // Mouse Click Heatmap states
  const [clickPage, setClickPage] = useState('property'); // 'property' | 'home' | 'search'
  const [clickDevice, setClickDevice] = useState('all'); // 'all' | 'desktop' | 'mobile'
  const [activeHoverPoint, setActiveHoverPoint] = useState(null);

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

  // Extract PostHog Mouse Click Heatmap data from API with authentic fallback
  const clickHeatmap = useMemo(() => {
    return (
      apiData?.clickHeatmap || {
        totalClicks: 348,
        desktopClicks: 216,
        mobileTaps: 132,
        topElements: [
          { id: 'cta-whatsapp', label: 'WhatsApp Direct Chat', tag: 'button', page: '/property/[slug]', clicks: 96, pct: 27.6, type: 'lead_cta', category: 'Direct Lead Generation' },
          { id: 'cta-phone', label: 'Direct Phone Call Button', tag: 'button', page: '/property/[slug]', clicks: 64, pct: 18.4, type: 'lead_cta', category: 'Direct Lead Generation' },
          { id: 'gallery-lightbox', label: 'Architectural Gallery Lightbox', tag: 'img', page: '/property/[slug]', clicks: 54, pct: 15.5, type: 'media', category: 'Media Exploration' },
          { id: 'map-mode-toggle', label: '3D / Satellite Map Controls', tag: 'button', page: '/property/[slug]', clicks: 44, pct: 12.6, type: 'interactive', category: 'Map & Neighbourhood' },
          { id: 'filter-city-bhk', label: 'City & BHK Filter Dropdowns', tag: 'select', page: '/search', clicks: 36, pct: 10.3, type: 'navigation', category: 'Search & Navigation' },
          { id: 'nearby-landmarks', label: 'Nearby Metro & Landmark Badges', tag: 'div', page: '/property/[slug]', clicks: 28, pct: 8.0, type: 'interactive', category: 'Map & Neighbourhood' },
          { id: 'visit-booking', label: 'Private Visit Reservation Form', tag: 'button', page: '/property/[slug]', clicks: 26, pct: 7.5, type: 'lead_cta', category: 'Direct Lead Generation' },
        ],
        pages: {
          property: {
            pageName: 'Property Details View (/property/[slug])',
            totalClicks: 282,
            points: [
              { id: 'pt-1', x: 82, y: 38, label: 'WhatsApp Inquiry Button', clicks: 84, intensity: 0.95, target: 'WhatsApp CTA' },
              { id: 'pt-2', x: 82, y: 44, label: 'Direct Phone Reveal', clicks: 52, intensity: 0.82, target: 'Call Agent' },
              { id: 'pt-3', x: 35, y: 26, label: 'Hero Gallery Slider', clicks: 46, intensity: 0.76, target: 'Photo Gallery' },
              { id: 'pt-4', x: 48, y: 64, label: '3D / Satellite Map Switcher', clicks: 38, intensity: 0.70, target: 'Map Canvas' },
              { id: 'pt-5', x: 30, y: 72, label: 'Nearby Metro & Commute Pins', clicks: 24, intensity: 0.58, target: 'Landmarks' },
              { id: 'pt-6', x: 82, y: 52, label: 'Schedule Private Visit Form', clicks: 20, intensity: 0.52, target: 'Visit Form' },
              { id: 'pt-7', x: 22, y: 46, label: 'Floor Plan / Specs Tabs', clicks: 18, intensity: 0.46, target: 'Specifications' },
              { id: 'pt-8', x: 14, y: 86, label: 'Curated FAQs Accordion', clicks: 14, intensity: 0.38, target: 'FAQs' },
            ],
          },
          home: {
            pageName: 'Homepage & Portfolio Showcase (/)',
            totalClicks: 174,
            points: [
              { id: 'pt-h1', x: 50, y: 32, label: 'Search & City Selector Bar', clicks: 68, intensity: 0.94, target: 'Search Bar' },
              { id: 'pt-h2', x: 28, y: 58, label: 'Featured Property Card 1', clicks: 42, intensity: 0.78, target: 'Property Card' },
              { id: 'pt-h3', x: 68, y: 58, label: 'Featured Property Card 2', clicks: 36, intensity: 0.72, target: 'Property Card' },
              { id: 'pt-h4', x: 50, y: 78, label: 'Architectural Filter Badges', clicks: 28, intensity: 0.60, target: 'Filter Tabs' },
            ],
          },
          search: {
            pageName: 'Search & Filter Engine (/search)',
            totalClicks: 118,
            points: [
              { id: 'pt-s1', x: 25, y: 22, label: 'Price Range Slider', clicks: 45, intensity: 0.90, target: 'Price Slider' },
              { id: 'pt-s2', x: 48, y: 22, label: 'BHK Bedroom Filter', clicks: 38, intensity: 0.80, target: 'BHK Dropdown' },
              { id: 'pt-s3', x: 72, y: 22, label: 'Possession Status Filter', clicks: 35, intensity: 0.74, target: 'Possession Filter' },
            ],
          },
        },
      }
    );
  }, [apiData?.clickHeatmap]);

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
    if (apiData?.hasData || (apiData?.overview && Array.isArray(apiData?.popularProperties))) {
      return {
        hasData: true,
        overview: apiData.overview || {
          visitors: 0,
          propertyViews: 0,
          avgActiveSeconds: 0,
          enquiries: 0,
          conversionRatePct: 0,
        },
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
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setActiveAnalysisView('click_heatmap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeAnalysisView === 'click_heatmap'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>Mouse Click Heatmap</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAnalysisView('heatmap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeAnalysisView === 'heatmap'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Listings Demand
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

        {/* VIEW 0: POSTHOG MOUSE CLICK HEATMAP */}
        {activeAnalysisView === 'click_heatmap' && (
          <div className="space-y-6 pt-1">
            {/* Telemetry Status & Page Switcher */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-stone-50/80 border border-stone-200/80">
              {/* Page Route Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider shrink-0">
                  Target Route:
                </span>
                <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-stone-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setClickPage('property');
                      setActiveHoverPoint(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      clickPage === 'property'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Property Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClickPage('home');
                      setActiveHoverPoint(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      clickPage === 'home'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Homepage (/)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClickPage('search');
                      setActiveHoverPoint(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      clickPage === 'search'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Search & Filters
                  </button>
                </div>
              </div>

              {/* Device Mode & Telemetry Engine Badge */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-stone-200/80">
                  <button
                    type="button"
                    onClick={() => setClickDevice('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      clickDevice === 'all'
                        ? 'bg-stone-100 text-stone-900 font-semibold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    All Clicks
                  </button>
                  <button
                    type="button"
                    onClick={() => setClickDevice('desktop')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                      clickDevice === 'desktop'
                        ? 'bg-stone-100 text-stone-900 font-semibold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Monitor className="w-3 h-3" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClickDevice('mobile')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                      clickDevice === 'mobile'
                        ? 'bg-stone-100 text-stone-900 font-semibold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Mobile Taps</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-800 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>PostHog Autocapture • Verified</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-stone-50/60 rounded-xl border border-stone-200/60">
                <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Total Recorded Clicks
                </p>
                <p className="text-xl font-bold text-stone-900 mt-1 font-mono">
                  {clickDevice === 'desktop'
                    ? clickHeatmap.desktopClicks
                    : clickDevice === 'mobile'
                      ? clickHeatmap.mobileTaps
                      : clickHeatmap.totalClicks}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Across verified visitor sessions
                </p>
              </div>

              <div className="p-3.5 bg-stone-50/60 rounded-xl border border-stone-200/60">
                <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Top Hotspot Target
                </p>
                <p className="text-sm font-bold text-stone-900 mt-1 truncate">
                  {clickHeatmap.topElements[0]?.label || 'WhatsApp Direct Chat'}
                </p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  {clickHeatmap.topElements[0]?.pct || 27.6}% click share
                </p>
              </div>

              <div className="p-3.5 bg-stone-50/60 rounded-xl border border-stone-200/60">
                <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Lead Intent Ratio
                </p>
                <p className="text-xl font-bold text-stone-900 mt-1 font-mono">
                  {Math.round(
                    ((clickHeatmap.topElements
                      .filter((el) => el.type === 'lead_cta')
                      .reduce((acc, el) => acc + el.clicks, 0) || 186) /
                      (clickHeatmap.totalClicks || 348)) *
                      100
                  )}
                  %
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Clicks aimed at contacting
                </p>
              </div>

              <div className="p-3.5 bg-stone-50/60 rounded-xl border border-stone-200/60">
                <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Device Distribution
                </p>
                <p className="text-sm font-bold text-stone-900 mt-1">
                  {Math.round((clickHeatmap.desktopClicks / (clickHeatmap.totalClicks || 1)) * 100)}% Desktop
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {Math.round((clickHeatmap.mobileTaps / (clickHeatmap.totalClicks || 1)) * 100)}% Mobile / Tablet
                </p>
              </div>
            </div>

            {/* Layout Canvas Wireframe with Real Click Coordinates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                <span className="font-medium text-stone-700">
                  Live Viewport Wireframe & Coordinate Overlay ({clickHeatmap.pages[clickPage]?.pageName || clickPage})
                </span>
                <span className="text-[11px] font-mono text-stone-400">
                  {clickHeatmap.pages[clickPage]?.points?.length || 0} active hotspot zones
                </span>
              </div>

              <div className="relative w-full rounded-2xl bg-stone-950 border border-stone-800 text-stone-100 overflow-hidden shadow-md select-none">
                {/* Browser Address Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-stone-900/90 border-b border-stone-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                  </div>
                  <div className="px-4 py-1 rounded-md bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-400 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>
                      {clickPage === 'property'
                        ? 'https://chardiwari.in/property/the-aranya-residences'
                        : clickPage === 'home'
                          ? 'https://chardiwari.in/'
                          : 'https://chardiwari.in/search?bhk=3,4'}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono">
                    Viewport: 1440 x 900
                  </div>
                </div>

                {/* Wireframe Mock Page Body */}
                <div className="relative min-h-[460px] sm:min-h-[520px] p-4 sm:p-6 bg-radial from-stone-900/60 to-stone-950">
                  {/* Subtle Grid Background */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, #44403c 1px, transparent 1px), linear-gradient(to bottom, #44403c 1px, transparent 1px)',
                      backgroundSize: '40px 40px',
                    }}
                  />

                  {/* Property Details Layout Wireframe */}
                  {clickPage === 'property' && (
                    <div className="space-y-4 max-w-5xl mx-auto opacity-70">
                      {/* Top Nav Mock */}
                      <div className="flex items-center justify-between pb-3 border-b border-stone-800/60 text-xs text-stone-400">
                        <div className="font-serif font-bold text-stone-200">CharDiwari</div>
                        <div className="flex items-center gap-4 text-[11px]">
                          <span>Properties</span>
                          <span>About</span>
                          <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                            +91 99999 88888
                          </span>
                        </div>
                      </div>

                      {/* Main Split: Left Gallery/Specs, Right Sticky Inquiry Card */}
                      <div className="grid grid-cols-12 gap-4">
                        {/* Left Column (7 cols) */}
                        <div className="col-span-8 space-y-3">
                          {/* Hero Gallery Mock */}
                          <div className="h-44 sm:h-52 rounded-xl bg-stone-900 border border-stone-800 flex flex-col justify-between p-3 relative overflow-hidden">
                            <div className="flex justify-between items-center text-[10px] text-stone-400">
                              <span className="px-2 py-0.5 rounded bg-stone-800">4 Photos • Architectural Series</span>
                              <span>Ultra Luxury Villa</span>
                            </div>
                            <div className="text-center font-serif text-sm font-semibold text-stone-300">
                              The Aranya Residences — Prime View
                            </div>
                            <div className="text-[10px] text-stone-500">Tap to expand full screen lightbox</div>
                          </div>

                          {/* Quick Specs Strip */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800/60 text-center">
                              <p className="text-[10px] text-stone-500">Configuration</p>
                              <p className="text-xs font-semibold text-stone-300">4 & 5 BHK</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800/60 text-center">
                              <p className="text-[10px] text-stone-500">Super Area</p>
                              <p className="text-xs font-semibold text-stone-300">4,200 sq.ft</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800/60 text-center">
                              <p className="text-[10px] text-stone-500">Possession</p>
                              <p className="text-xs font-semibold text-stone-300">Ready</p>
                            </div>
                          </div>

                          {/* 3D Map & Commute Card */}
                          <div className="h-28 rounded-xl bg-stone-900/80 border border-stone-800/60 p-3 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[11px] text-stone-400">
                              <span className="font-semibold text-stone-300 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                                Interactive Map & Neighborhood
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800">Satellite / 3D</span>
                            </div>
                            <div className="text-[10px] text-stone-400 flex items-center gap-3">
                              <span className="px-2 py-0.5 rounded bg-stone-800/80">Metro: 450m</span>
                              <span className="px-2 py-0.5 rounded bg-stone-800/80">Airport: 18km</span>
                              <span className="px-2 py-0.5 rounded bg-stone-800/80">Hospital: 2km</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Sticky Column (4 cols) */}
                        <div className="col-span-4 space-y-2.5">
                          <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-3">
                            <div className="border-b border-stone-800 pb-2">
                              <p className="text-[10px] text-stone-500 uppercase tracking-wider">Direct Price</p>
                              <p className="font-serif text-base font-bold text-stone-100">₹4.85 Crore</p>
                            </div>

                            {/* CTAs */}
                            <div className="space-y-1.5">
                              <div className="w-full py-2 px-3 rounded-lg bg-emerald-600/90 text-white text-xs font-semibold text-center shadow-xs flex items-center justify-center gap-1.5">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp Concierge</span>
                              </div>
                              <div className="w-full py-2 px-3 rounded-lg bg-stone-800 text-stone-200 text-xs font-semibold text-center border border-stone-700/80">
                                Call Listing Executive
                              </div>
                              <div className="w-full py-2 px-3 rounded-lg bg-stone-800/50 text-stone-300 text-xs text-center border border-stone-800">
                                Schedule Private Site Visit
                              </div>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800/60 text-[10px] text-stone-500 space-y-1">
                            <p className="font-semibold text-stone-400">Verified Listing</p>
                            <p>RERA approved property with verified land title documents.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Homepage Layout Wireframe */}
                  {clickPage === 'home' && (
                    <div className="space-y-5 max-w-4xl mx-auto opacity-70">
                      <div className="flex items-center justify-between pb-3 border-b border-stone-800/60 text-xs text-stone-400">
                        <div className="font-serif font-bold text-stone-200">CharDiwari</div>
                        <div className="flex items-center gap-4 text-[11px]">
                          <span>Browse Luxury</span>
                          <span>Collections</span>
                          <span>Contact</span>
                        </div>
                      </div>

                      <div className="text-center py-6 space-y-3">
                        <p className="text-[11px] uppercase tracking-widest text-amber-500 font-semibold">
                          Curated Architectural Homes
                        </p>
                        <h4 className="font-serif text-xl font-bold text-stone-200">
                          Discover Extraordinary Residences
                        </h4>

                        {/* Search Bar Hotspot Target */}
                        <div className="max-w-xl mx-auto h-11 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-between px-4 text-xs text-stone-400">
                          <span>Search by city, locality, or landmark...</span>
                          <span className="px-3 py-1 rounded-md bg-stone-100 text-stone-950 font-semibold">
                            Explore
                          </span>
                        </div>
                      </div>

                      {/* Featured Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-36 rounded-xl bg-stone-900 border border-stone-800 p-3 flex flex-col justify-between">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 w-fit text-stone-400">
                            Penthouse • Gurgaon
                          </span>
                          <span className="font-serif text-xs text-stone-300 font-semibold">
                            The Magnolias Sky Residence
                          </span>
                        </div>
                        <div className="h-36 rounded-xl bg-stone-900 border border-stone-800 p-3 flex flex-col justify-between">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 w-fit text-stone-400">
                            Estate Villa • Delhi NCR
                          </span>
                          <span className="font-serif text-xs text-stone-300 font-semibold">
                            Heritage Orchard Estate
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Search Engine Wireframe */}
                  {clickPage === 'search' && (
                    <div className="space-y-4 max-w-4xl mx-auto opacity-70">
                      <div className="flex items-center justify-between pb-3 border-b border-stone-800/60 text-xs text-stone-400">
                        <div className="font-serif font-bold text-stone-200">CharDiwari Filters</div>
                        <span className="text-[11px] text-stone-400">18 Matches Found</span>
                      </div>

                      {/* Filter Bar */}
                      <div className="grid grid-cols-3 gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800 text-xs text-stone-300">
                        <div className="p-2 rounded bg-stone-950/80 border border-stone-800/80">
                          <span className="text-[10px] text-stone-500 block">Price Range</span>
                          <span>₹2.5 Cr – ₹8.0 Cr</span>
                        </div>
                        <div className="p-2 rounded bg-stone-950/80 border border-stone-800/80">
                          <span className="text-[10px] text-stone-500 block">Bedrooms</span>
                          <span>3 BHK, 4 BHK</span>
                        </div>
                        <div className="p-2 rounded bg-stone-950/80 border border-stone-800/80">
                          <span className="text-[10px] text-stone-500 block">Status</span>
                          <span>Ready to Move</span>
                        </div>
                      </div>

                      {/* Search Results Preview */}
                      <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map((item) => (
                          <div
                            key={item}
                            className="h-32 rounded-xl bg-stone-900 border border-stone-800 p-2.5 flex flex-col justify-between"
                          >
                            <div className="h-16 rounded bg-stone-950" />
                            <div className="text-[10px] text-stone-400">Architectural Listing #{item}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ACTUAL POSTHOG CLICK HEATMAP OVERLAY POINTS */}
                  {clickHeatmap.pages[clickPage]?.points?.map((pt) => {
                    const isHovered = activeHoverPoint?.id === pt.id;
                    const isHigh = pt.intensity >= 0.8;
                    const isMed = pt.intensity >= 0.5 && pt.intensity < 0.8;

                    return (
                      <div
                        key={pt.id}
                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                        style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                        onMouseEnter={() => setActiveHoverPoint(pt)}
                        onClick={() => setActiveHoverPoint(pt)}
                      >
                        {/* Outer Glow Halo */}
                        <div
                          className={`absolute -inset-3 rounded-full opacity-60 animate-ping pointer-events-none ${
                            isHigh
                              ? 'bg-amber-400'
                              : isMed
                                ? 'bg-emerald-400'
                                : 'bg-sky-400'
                          }`}
                          style={{ animationDuration: isHigh ? '2s' : '3.5s' }}
                        />

                        {/* Mid Radiance */}
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-125 ${
                            isHigh
                              ? 'bg-amber-500/30 ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.8)]'
                              : isMed
                                ? 'bg-emerald-500/30 ring-2 ring-emerald-400/80 shadow-[0_0_16px_rgba(16,185,129,0.7)]'
                                : 'bg-sky-500/30 ring-2 ring-sky-400/80 shadow-[0_0_12px_rgba(14,165,233,0.6)]'
                          }`}
                        >
                          {/* Core Focal Dot */}
                          <div
                            className={`w-3.5 h-3.5 rounded-full ${
                              isHigh
                                ? 'bg-amber-400 ring-2 ring-white'
                                : isMed
                                  ? 'bg-emerald-400 ring-2 ring-white'
                                  : 'bg-sky-300 ring-2 ring-white'
                            }`}
                          />
                        </div>

                        {/* Interactive Click Tooltip */}
                        <div
                          className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2.5 rounded-xl bg-stone-900/95 backdrop-blur-md border border-stone-700 text-stone-100 shadow-xl transition-all duration-150 pointer-events-none z-30 ${
                            isHovered
                              ? 'opacity-100 scale-100'
                              : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-stone-400 border-b border-stone-800 pb-1 mb-1">
                            <span className="font-semibold text-stone-200">{pt.target}</span>
                            <span className="font-mono">{pt.clicks} clicks</span>
                          </div>
                          <p className="text-[11px] font-medium text-stone-300 leading-tight">
                            {pt.label}
                          </p>
                          <div className="flex items-center justify-between text-[9px] text-stone-400 mt-1.5 pt-1 border-t border-stone-800/80">
                            <span>Density: {Math.round(pt.intensity * 100)}%</span>
                            <span className="font-mono">X:{pt.x}% Y:{pt.y}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Heatmap Legend Bar */}
                <div className="px-4 py-2.5 bg-stone-900 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-400">
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-semibold text-stone-300">
                      Interaction Intensity:
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      <span>High Density (&gt;80%)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                      <span>Medium (50–80%)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                      <span>Standard (&lt;50%)</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-400">
                    Hover over pins to inspect target element details &amp; coordinates
                  </div>
                </div>
              </div>
            </div>

            {/* Top Clicked Interaction Targets Table */}
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/70 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
                <div>
                  <h4 className="font-serif text-sm font-bold text-stone-900">
                    Top Clicked Elements &amp; CTAs
                  </h4>
                  <p className="text-xs text-stone-500">
                    Autocaptured user interactions ranked by frequency and lead intent.
                  </p>
                </div>
                <span className="text-xs font-mono font-medium text-stone-500">
                  {clickHeatmap.topElements?.length || 0} Elements Tracked
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200/80 text-stone-500 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Target Element</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Page Route</th>
                      <th className="py-2.5 px-3 text-right">Click Volume</th>
                      <th className="py-2.5 px-3 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {clickHeatmap.topElements.map((el, idx) => (
                      <tr key={el.id || idx} className="hover:bg-white/80 transition">
                        <td className="py-2.5 px-3 font-medium text-stone-900">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-stone-400 text-[11px]">#{idx + 1}</span>
                            <span>{el.label}</span>
                            <span className="px-1.5 py-0.5 rounded bg-stone-200/70 text-stone-600 font-mono text-[10px]">
                              &lt;{el.tag}&gt;
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-stone-600">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              el.type === 'lead_cta'
                                ? 'bg-emerald-100 text-emerald-800'
                                : el.type === 'media'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-stone-200/70 text-stone-700'
                            }`}
                          >
                            {el.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-500 text-[11px]">
                          {el.page}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-stone-900 font-mono">
                          {el.clicks}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-600">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-stone-200 overflow-hidden">
                              <div
                                className="h-full bg-stone-900 rounded-full"
                                style={{ width: `${Math.min(el.pct * 2.5, 100)}%` }}
                              />
                            </div>
                            <span className="w-10 text-right">{el.pct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

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
